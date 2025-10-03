/**
 * Backend Integration Example
 * 
 * This shows how to integrate DRS risk decisions in your Express backend
 * Place this in your backend/routes or backend/api folder
 */

// ==================== EXAMPLE 1: Login Endpoint with DRS ====================

async function handleLogin(req, res) {
  const sessionToken = req.headers['x-session-token'];
  const { username, password } = req.body;
  const correlationId = req.id || generateUUID();

  try {
    // 1. Call DRS /recommend before authentication
    const drsResponse = await fetch('http://localhost:8080/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionToken,
        action: 'login',
        correlationId,
      }),
    });

    if (!drsResponse.ok) {
      console.error('DRS server error:', drsResponse.status);
      // Fail open or closed based on your risk tolerance
      // Option 1: Fail closed (deny on DRS error)
      return res.status(503).json({ error: 'Service temporarily unavailable' });
      
      // Option 2: Fail open (allow on DRS error)
      // Continue with normal authentication...
    }

    const decision = await drsResponse.json();

    console.log('DRS Decision:', {
      sessionId: decision.sessionId,
      recommendation: decision.recommendation,
      riskScore: decision.riskScore,
      reasons: decision.reasons,
    });

    // 2. Enforce recommendation
    if (decision.recommendation === 'DENY') {
      // Report outcome
      reportOutcome(decision.sessionId, 'failure', correlationId);
      
      return res.status(403).json({
        error: 'Access denied for security reasons',
        sessionId: decision.sessionId,
        supportReference: decision.sessionId, // For user to contact support
      });
    }

    // 3. Authenticate user
    const user = await authenticateUser(username, password);

    if (!user) {
      // Authentication failed
      reportOutcome(decision.sessionId, 'failure', correlationId);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. Check if CHALLENGE needed
    if (decision.recommendation === 'CHALLENGE') {
      // Trigger MFA
      const mfaToken = await generateMFAToken(user.id);
      
      return res.json({
        requiresMFA: true,
        sessionId: decision.sessionId,
        mfaToken,
        message: 'Additional verification required',
      });
    }

    // 5. ALLOW - Success!
    reportOutcome(decision.sessionId, 'success', correlationId);

    // Generate JWT or session
    const authToken = generateAuthToken(user);

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token: authToken,
      sessionId: decision.sessionId,
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== EXAMPLE 2: Search Endpoint with DRS ====================

async function handleSearch(req, res) {
  const sessionToken = req.headers['x-session-token'];
  const { query } = req.body;

  try {
    // Get DRS recommendation for search action
    const drsResponse = await fetch('http://localhost:8080/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        action: 'search',
      }),
    });

    const decision = await drsResponse.json();

    // Enforce based on risk level
    if (decision.recommendation === 'DENY') {
      return res.status(403).json({
        error: 'Search temporarily unavailable',
        sessionId: decision.sessionId,
      });
    }

    if (decision.recommendation === 'CHALLENGE') {
      // For search, we might add rate limiting or CAPTCHA
      return res.json({
        requiresCaptcha: true,
        sessionId: decision.sessionId,
      });
    }

    // Perform search
    const results = await performSearch(query);

    // Report success
    reportOutcome(decision.sessionId, 'success');

    return res.json({
      results,
      sessionId: decision.sessionId,
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
}

// ==================== EXAMPLE 3: Transfer Endpoint with DRS ====================

async function handleTransfer(req, res) {
  const sessionToken = req.headers['x-session-token'];
  const { fromAccount, toAccount, amount } = req.body;
  const userId = req.user.id; // From auth middleware

  try {
    // High-risk action: always check DRS
    const drsResponse = await fetch('http://localhost:8080/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        action: 'transfer',
      }),
    });

    const decision = await drsResponse.json();

    // Stricter enforcement for transfers
    if (decision.recommendation !== 'ALLOW') {
      // Log suspicious activity
      await logSecurityEvent({
        userId,
        action: 'transfer_blocked',
        reason: decision.recommendation,
        riskScore: decision.riskScore,
        sessionId: decision.sessionId,
      });

      if (decision.recommendation === 'DENY') {
        return res.status(403).json({
          error: 'Transfer blocked for security reasons',
          sessionId: decision.sessionId,
        });
      }

      if (decision.recommendation === 'CHALLENGE') {
        // Require additional verification
        const verificationToken = await generateVerificationToken(userId);
        
        return res.json({
          requiresVerification: true,
          verificationToken,
          sessionId: decision.sessionId,
          message: 'Additional verification required for this transfer',
        });
      }
    }

    // Perform transfer
    const transfer = await executeTransfer({
      userId,
      fromAccount,
      toAccount,
      amount,
    });

    // Report success
    reportOutcome(decision.sessionId, 'success', null, {
      transferId: transfer.id,
      amount,
    });

    return res.json({
      success: true,
      transfer,
      sessionId: decision.sessionId,
    });

  } catch (error) {
    console.error('Transfer error:', error);
    
    // Report failure if we have sessionId
    if (error.sessionId) {
      reportOutcome(error.sessionId, 'failure');
    }

    return res.status(500).json({ error: 'Transfer failed' });
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Report outcome to DRS /report endpoint
 */
async function reportOutcome(sessionId, outcome, correlationId = null, metadata = {}) {
  try {
    await fetch('http://localhost:8080/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        outcome, // 'success', 'failure', or 'abandoned'
        correlationId,
        metadata,
      }),
    });
  } catch (error) {
    console.error('Failed to report outcome to DRS:', error);
    // Don't throw - reporting is non-critical
  }
}

/**
 * Generate UUID for correlation
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Placeholder authentication function
 */
async function authenticateUser(username, password) {
  // Your actual authentication logic here
  return { id: 1, username, email: 'user@example.com' };
}

/**
 * Placeholder token generation
 */
function generateAuthToken(user) {
  // Your JWT or session token generation
  return 'jwt-token-here';
}

/**
 * Placeholder MFA token generation
 */
async function generateMFAToken(userId) {
  // Your MFA logic
  return 'mfa-token-here';
}

// ==================== EXPRESS ROUTER SETUP ====================

const express = require('express');
const router = express.Router();

// Mount routes
router.post('/api/login', handleLogin);
router.post('/api/search', handleSearch);
router.post('/api/transfer', handleTransfer);

module.exports = router;
