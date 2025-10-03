"""
DRS Integration Middleware for Flask
=====================================

Integrates solar-roof-analysis backend with DRS (Dynamic Risk Scoring) server.

Flow:
1. Frontend sends session_token in X-Session-Token header
2. Backend generates correlation_id for tracing
3. Backend calls DRS /recommend before executing action
4. Backend enforces DRS recommendation (ALLOW/CHALLENGE/DENY)
5. Backend reports outcome to DRS /report

Usage:
    from drs_middleware import DRSMiddleware
    
    drs = DRSMiddleware(app, drs_url='http://localhost:8080')
    
    @app.route('/api/buildings/<building_id>')
    @drs.protect(action='building_details')
    def get_building_details(building_id):
        # Your normal handler code
        pass
"""

import requests
import uuid
import logging
from functools import wraps
from flask import request, jsonify, g
from typing import Optional, Dict, Any, Callable

logger = logging.getLogger(__name__)


class DRSMiddleware:
    """Flask middleware for Dynamic Risk Scoring integration"""
    
    def __init__(self, app=None, drs_url: str = 'http://localhost:8080', timeout: int = 2):
        """
        Initialize DRS middleware
        
        Args:
            app: Flask app instance
            drs_url: DRS server URL
            timeout: Request timeout in seconds (fail-safe)
        """
        self.drs_url = drs_url
        self.timeout = timeout
        self.enabled = True  # Can be disabled for dev/testing
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize with Flask app"""
        self.app = app
        
        # Add before_request hook to extract session token
        app.before_request(self._extract_session_token)
        
        logger.info(f"DRS Middleware initialized: {self.drs_url}")
    
    def _extract_session_token(self):
        """Extract session token from request headers"""
        g.session_token = request.headers.get('X-Session-Token')
        g.correlation_id = request.headers.get('X-Correlation-ID') or str(uuid.uuid4())
    
    def protect(self, action: str, challenge_handler: Optional[Callable] = None):
        """
        Decorator to protect routes with DRS risk assessment
        
        Args:
            action: Action name for DRS (e.g., 'building_details', 'calculation_submit')
            challenge_handler: Optional callback for CHALLENGE recommendation
        
        Example:
            @app.route('/api/buildings/<id>')
            @drs.protect(action='building_details')
            def get_building(id):
                return {'data': ...}
        """
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Skip DRS if disabled or no session token
                if not self.enabled or not hasattr(g, 'session_token'):
                    logger.warning("DRS bypassed: disabled or no session token")
                    return f(*args, **kwargs)
                
                session_token = g.session_token
                correlation_id = g.correlation_id
                
                # Call DRS /recommend
                try:
                    decision = self._call_recommend(session_token, action, correlation_id)
                    
                    if not decision:
                        # DRS unreachable - fail open (allow with logging)
                        logger.error(f"DRS unavailable, allowing request: {correlation_id}")
                        g.drs_decision = None
                        result = f(*args, **kwargs)
                        return result
                    
                    # Store decision in request context
                    g.drs_decision = decision
                    
                    # Enforce decision
                    recommendation = decision.get('recommendation')
                    
                    if recommendation == 'DENY':
                        logger.warning(f"DRS DENY: {correlation_id} | score={decision.get('riskScore')}")
                        self._report_outcome(decision.get('sessionId'), 'failure', correlation_id)
                        
                        return jsonify({
                            'error': 'Access denied',
                            'message': 'This action has been blocked for security reasons',
                            'sessionId': decision.get('sessionId'),
                            'correlationId': correlation_id,
                        }), 403
                    
                    elif recommendation == 'CHALLENGE':
                        logger.info(f"DRS CHALLENGE: {correlation_id} | score={decision.get('riskScore')}")
                        
                        if challenge_handler:
                            # Custom challenge flow
                            return challenge_handler(*args, **kwargs)
                        else:
                            # Default challenge response
                            return jsonify({
                                'challenge': True,
                                'message': 'Additional verification required',
                                'sessionId': decision.get('sessionId'),
                                'correlationId': correlation_id,
                                'challengeType': 'mfa',  # Could be captcha, email verify, etc.
                            }), 200
                    
                    # ALLOW - proceed normally
                    logger.info(f"DRS ALLOW: {correlation_id} | score={decision.get('riskScore')}")
                    
                except Exception as e:
                    logger.error(f"DRS error: {str(e)} | {correlation_id}")
                    # Fail open - allow request but log error
                    g.drs_decision = None
                
                # Execute the original function
                try:
                    result = f(*args, **kwargs)
                    
                    # Report success to DRS
                    if g.drs_decision:
                        self._report_outcome(
                            g.drs_decision.get('sessionId'), 
                            'success', 
                            correlation_id
                        )
                    
                    return result
                    
                except Exception as e:
                    # Report failure to DRS
                    if g.drs_decision:
                        self._report_outcome(
                            g.drs_decision.get('sessionId'), 
                            'failure', 
                            correlation_id,
                            metadata={'error': str(e)}
                        )
                    raise
            
            return decorated_function
        return decorator
    
    def _call_recommend(self, session_token: str, action: str, correlation_id: str) -> Optional[Dict[str, Any]]:
        """
        Call DRS /recommend endpoint
        
        Returns:
            Decision dict or None if DRS unreachable
        """
        try:
            response = requests.post(
                f"{self.drs_url}/recommend",
                json={
                    'sessionToken': session_token,
                    'action': action,
                    'correlationId': correlation_id,
                },
                timeout=self.timeout,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 404:
                # Session not found (not enough telemetry yet)
                logger.warning(f"DRS session not found: {session_token}")
                return None
            
            response.raise_for_status()
            return response.json()
            
        except requests.Timeout:
            logger.error(f"DRS timeout: {self.drs_url}")
            return None
        except requests.RequestException as e:
            logger.error(f"DRS request failed: {str(e)}")
            return None
    
    def _report_outcome(
        self, 
        session_id: str, 
        outcome: str, 
        correlation_id: str,
        metadata: Optional[Dict] = None
    ):
        """
        Report outcome to DRS /report endpoint (async, fire-and-forget)
        
        Args:
            session_id: DRS session ID from recommendation
            outcome: 'success', 'failure', or 'abandoned'
            correlation_id: Request correlation ID
            metadata: Optional additional context
        """
        try:
            payload = {
                'sessionId': session_id,
                'outcome': outcome,
                'correlationId': correlation_id,
            }
            
            if metadata:
                payload['metadata'] = metadata
            
            # Fire and forget (don't block on response)
            requests.post(
                f"{self.drs_url}/report",
                json=payload,
                timeout=1,  # Short timeout
                headers={'Content-Type': 'application/json'}
            )
            
            logger.debug(f"DRS report sent: {session_id} -> {outcome}")
            
        except Exception as e:
            # Fail silently - reporting is non-critical
            logger.debug(f"DRS report failed: {str(e)}")
    
    def disable(self):
        """Disable DRS checks (for dev/testing)"""
        self.enabled = False
        logger.warning("DRS Middleware DISABLED")
    
    def enable(self):
        """Re-enable DRS checks"""
        self.enabled = True
        logger.info("DRS Middleware ENABLED")


# ==================== HELPER FUNCTIONS ====================

def get_drs_decision() -> Optional[Dict[str, Any]]:
    """
    Get DRS decision for current request (from Flask g context)
    
    Returns:
        Decision dict or None
    
    Example:
        decision = get_drs_decision()
        if decision:
            risk_score = decision['riskScore']
            reasons = decision['reasons']
    """
    return getattr(g, 'drs_decision', None)


def get_correlation_id() -> str:
    """Get correlation ID for current request"""
    return getattr(g, 'correlation_id', 'no-correlation-id')


def add_drs_headers(response):
    """
    Add DRS headers to response for client-side visibility
    
    Example:
        @app.after_request
        def after_request(response):
            add_drs_headers(response)
            return response
    """
    decision = get_drs_decision()
    
    if decision:
        response.headers['X-DRS-Session-ID'] = decision.get('sessionId', '')
        response.headers['X-DRS-Recommendation'] = decision.get('recommendation', '')
        response.headers['X-DRS-Risk-Score'] = str(decision.get('riskScore', 0))
    
    response.headers['X-Correlation-ID'] = get_correlation_id()
    
    return response
