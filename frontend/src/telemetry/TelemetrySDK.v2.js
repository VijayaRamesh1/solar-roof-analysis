/**
 * TelemetrySDK v2 - Production-Ready Telemetry & Risk Assessment
 * 
 * Full Lifecycle Implementation:
 * - Phase 0: Preconditions (consent, risk-relevant views only)
 * - Phase 1: Initialization (session token, device snapshot, listeners, batching)
 * - Phase 2: Capture (behavioral signals, technical forensics)
 * - Phase 3: Batch & Stream (envelope, transport, limits)
 * - Phase 4: Action time (FE → BE → DRS flow)
 * - Phase 5: Teardown & rotation
 * 
 * Privacy-First Design:
 * - Zero PII capture
 * - Keystroke timings only (no characters)
 * - Coarse location/network hints
 * - Device/env technical characteristics only
 */

const SDK_VERSION = '2.0.0';
const SCHEMA_VERSION = '1.0';

class TelemetrySDK {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:8080',
      
      // Batching & Limits
      batchSize: config.batchSize || 15,
      flushInterval: config.flushInterval || 5000, // 5 seconds
      maxEventsPerSession: config.maxEventsPerSession || 1000,
      maxBytesPerBatch: config.maxBytesPerBatch || 100000, // 100KB
      maxEventsPerBatch: config.maxEventsPerBatch || 100,
      
      // Throttling
      throttleMs: config.throttleMs || 100, // Mouse/scroll sampling
      
      // Session Management
      sessionTTL: config.sessionTTL || 20 * 60 * 1000, // 20 minutes
      
      // Privacy
      consentRequired: config.consentRequired !== false,
      
      // Debug
      debug: config.debug || false,
    };

    // State
    this.sessionToken = null;
    this.initTimestamp = null;
    this.eventQueue = [];
    this.eventCount = 0;
    this.isInitialized = false;
    this.hasConsent = !this.config.consentRequired;
    this.flushTimer = null;
    this.idleTimer = null;
    this.lastActivity = null;
    this.lastEventTimes = {};
    this.deviceSnapshot = null;
    
    // Listeners cleanup registry
    this.listeners = [];
    
    // Integrity monitoring
    this.integrityFlags = {
      multipleInits: false,
      suspiciousTimings: false,
    };
  }

  // ==================== PHASE 0: PRECONDITIONS ====================
  
  /**
   * Set user consent (GDPR/CCPA compliance)
   */
  setConsent(hasConsent) {
    this.hasConsent = hasConsent;
    this.log('Consent set:', hasConsent);
    
    if (!hasConsent && this.isInitialized) {
      this.shutdown();
    } else if (hasConsent && !this.isInitialized) {
      this.log('Consent granted - ready to initialize');
    }
  }

  /**
   * Check if this view should have telemetry
   * Only enable on risk-relevant views (calculation submit, results, etc.)
   */
  shouldEnableForView(viewName) {
    const riskRelevantViews = [
      'calculation',
      'results',
      'building-details',
      'analysis',
    ];
    
    return riskRelevantViews.some(v => viewName.includes(v));
  }

  // ==================== PHASE 1: INITIALIZATION ====================
  
  /**
   * Initialize SDK
   * Call once on page load of risk-relevant views
   * Returns session token for later use
   */
  initialize() {
    if (this.isInitialized) {
      this.log('[WARN] SDK already initialized - possible integrity issue');
      this.integrityFlags.multipleInits = true;
      this.addIntegrityEvent('multiple_init_attempts');
      return this.sessionToken;
    }

    if (!this.hasConsent) {
      this.log('[WARN] Cannot initialize without consent');
      return null;
    }

    // Mint session token
    this.sessionToken = this.generateSessionToken();
    this.initTimestamp = Date.now();
    this.lastActivity = Date.now();

    this.log(`Initialized v${SDK_VERSION} | Session: ${this.sessionToken}`);

    // Device/env snapshot (one-time)
    this.captureDeviceSnapshot();

    // Register passive listeners
    this.registerMouseListener();
    this.registerScrollListener();
    this.registerKeystrokeListener();
    this.registerFocusListeners();
    this.registerVisibilityListener();

    // Start batching scheduler
    this.startFlushInterval();
    this.startIdleMonitor();

    this.isInitialized = true;
    
    return this.sessionToken;
  }

  /**
   * Generate UUID v4 session token
   */
  generateSessionToken() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ==================== PHASE 2: CAPTURE ====================
  
  /**
   * Device/Environment Snapshot (Technical only - No PII)
   */
  captureDeviceSnapshot() {
    const fingerprint = this.generateDeviceFingerprint();
    
    this.deviceSnapshot = {
      fingerprint,
      
      // Browser & OS (coarse)
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages ? [...navigator.languages] : [navigator.language],
      platform: navigator.platform,
      
      // Screen (technical)
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      screenColorDepth: window.screen.colorDepth,
      screenPixelRatio: window.devicePixelRatio || 1,
      
      // Timezone (coarse location hint)
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      
      // Performance hints
      deviceMemory: navigator.deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      
      // Storage availability (not contents)
      localStorage: this.hasStorage('localStorage'),
      sessionStorage: this.hasStorage('sessionStorage'),
      
      // Network hints (coarse)
      connection: this.getConnectionHints(),
    };

    this.addEvent({
      type: 'device',
      data: this.deviceSnapshot,
    });
  }

  /**
   * Generate device fingerprint (for consistency checking)
   */
  generateDeviceFingerprint() {
    const components = [
      navigator.userAgent,
      navigator.language,
      window.screen.width,
      window.screen.height,
      window.screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.hardwareConcurrency || '',
    ];

    const combined = components.join('|');
    
    // Simple hash to base64
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36).substring(0, 16);
  }

  /**
   * Check storage availability
   */
  hasStorage(storageType) {
    try {
      const storage = window[storageType];
      const test = '__test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get network connection hints (coarse - no precise location)
   */
  getConnectionHints() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return null;

    return {
      effectiveType: conn.effectiveType || null, // '4g', 'wifi', etc
      downlink: conn.downlink || null,
      rtt: conn.rtt || null,
      saveData: conn.saveData || false,
    };
  }

  /**
   * Mouse movement listener (passive, throttled)
   */
  registerMouseListener() {
    const handler = (e) => {
      if (!this.shouldCaptureEvent('mouse')) return;

      this.addEvent({
        type: 'mouse',
        data: {
          x: e.clientX,
          y: e.clientY,
          // Velocity can be calculated server-side from timestamps
        },
      });

      this.updateActivity();
    };

    document.addEventListener('mousemove', handler, { passive: true });
    this.listeners.push({ type: 'mousemove', target: document, handler });
  }

  /**
   * Scroll listener (passive, throttled)
   */
  registerScrollListener() {
    const handler = () => {
      if (!this.shouldCaptureEvent('scroll')) return;

      this.addEvent({
        type: 'scroll',
        data: {
          scrollY: window.scrollY,
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
          // Server calculates velocity from timestamps
        },
      });

      this.updateActivity();
    };

    window.addEventListener('scroll', handler, { passive: true });
    this.listeners.push({ type: 'scroll', target: window, handler });
  }

  /**
   * Keystroke TIMING listener
   * CRITICAL: NO key values, only intervals
   */
  registerKeystrokeListener() {
    const handler = () => {
      const now = Date.now();
      const lastTime = this.lastEventTimes.keystroke || 0;

      if (lastTime > 0) {
        const interval = now - lastTime;
        
        // Flag suspiciously fast typing (< 20ms = likely bot)
        if (interval < 20) {
          this.integrityFlags.suspiciousTimings = true;
          this.addIntegrityEvent('keystroke_too_fast', { interval });
        }

        this.addEvent({
          type: 'keystroke',
          data: {
            interval, // Only timing, never key values
          },
        });
      }

      this.lastEventTimes.keystroke = now;
      this.updateActivity();
    };

    document.addEventListener('keydown', handler, { passive: true });
    this.listeners.push({ type: 'keydown', target: document, handler });
  }

  /**
   * Focus/Blur listeners (idle/active tracking)
   */
  registerFocusListeners() {
    const focusHandler = () => {
      this.addEvent({ type: 'focus', data: {} });
      this.updateActivity();
    };

    const blurHandler = () => {
      this.addEvent({ type: 'blur', data: {} });
    };

    window.addEventListener('focus', focusHandler);
    window.addEventListener('blur', blurHandler);
    
    this.listeners.push({ type: 'focus', target: window, handler: focusHandler });
    this.listeners.push({ type: 'blur', target: window, handler: blurHandler });
  }

  /**
   * Visibility change listener (tab switching)
   */
  registerVisibilityListener() {
    const handler = () => {
      this.addEvent({
        type: document.hidden ? 'visibility_hidden' : 'visibility_visible',
        data: {},
      });
    };

    document.addEventListener('visibilitychange', handler);
    this.listeners.push({ type: 'visibilitychange', target: document, handler });
  }

  /**
   * Add integrity event (suspicious behavior detection)
   */
  addIntegrityEvent(reason, metadata = {}) {
    this.addEvent({
      type: 'integrity',
      data: {
        reason,
        ...metadata,
      },
    });
  }

  // ==================== PHASE 3: BATCH & STREAM ====================
  
  /**
   * Throttle event capture
   */
  shouldCaptureEvent(eventType) {
    const now = Date.now();
    const lastTime = this.lastEventTimes[eventType] || 0;
    
    if (now - lastTime < this.config.throttleMs) {
      return false;
    }

    this.lastEventTimes[eventType] = now;
    return true;
  }

  /**
   * Add event to queue with session limits
   */
  addEvent(event) {
    // Check session limits
    if (this.eventCount >= this.config.maxEventsPerSession) {
      this.log('[WARN] Session event limit reached');
      return;
    }

    // Add timestamp
    const enrichedEvent = {
      ...event,
      timestamp: Date.now(),
      seq: this.eventCount++,
    };

    this.eventQueue.push(enrichedEvent);
    this.log(`Event queued: ${event.type} (${this.eventQueue.length}/${this.config.batchSize})`);

    // Auto-flush on batch size
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Start periodic flush
   */
  startFlushInterval() {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Flush events to DRS collector
   */
  async flush() {
    if (this.eventQueue.length === 0) return;

    // Prepare batch envelope
    const batch = {
      schema_version: SCHEMA_VERSION,
      session_token: this.sessionToken,
      sent_at: Date.now(),
      context: {
        sdk_version: SDK_VERSION,
        init_timestamp: this.initTimestamp,
        device_fingerprint: this.deviceSnapshot?.fingerprint,
      },
      events: this.eventQueue.splice(0, this.config.maxEventsPerBatch),
    };

    // Size check
    const batchSize = JSON.stringify(batch).length;
    if (batchSize > this.config.maxBytesPerBatch) {
      this.log('[WARN] Batch too large, truncating');
      batch.events = batch.events.slice(0, Math.floor(batch.events.length / 2));
    }

    this.log(`Flushing ${batch.events.length} events (${batchSize} bytes)`);

    try {
      const response = await fetch(`${this.config.apiUrl}/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: batch.session_token,
          events: batch.events,
        }),
      });

      if (!response.ok) {
        this.log('[ERROR] Flush failed:', response.status);
        // Re-queue with limit
        if (this.eventQueue.length < 50) {
          this.eventQueue.unshift(...batch.events);
        }
      } else {
        this.log(`✓ Flushed ${batch.events.length} events`);
      }
    } catch (error) {
      this.log('[ERROR] Flush error:', error.message);
      // Re-queue on network error
      if (this.eventQueue.length < 50) {
        this.eventQueue.unshift(...batch.events);
      }
    }
  }

  // ==================== PHASE 4: ACTION TIME ====================
  
  /**
   * Get session token (read-only accessor for app)
   */
  getSessionToken() {
    if (!this.isInitialized) {
      this.log('[WARN] SDK not initialized, returning null');
      return null;
    }
    return this.sessionToken;
  }

  // ==================== PHASE 5: TEARDOWN & ROTATION ====================
  
  /**
   * Update activity timestamp
   */
  updateActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Start idle monitor (auto-expire after TTL)
   */
  startIdleMonitor() {
    this.idleTimer = setInterval(() => {
      const idle = Date.now() - this.lastActivity;
      
      if (idle > this.config.sessionTTL) {
        this.log(`Session expired after ${idle}ms idle`);
        this.shutdown();
      }
    }, 60000); // Check every minute
  }

  /**
   * Shutdown SDK (teardown)
   */
  shutdown() {
    if (!this.isInitialized) return;

    this.log('Shutting down SDK');

    // Flush remaining events
    this.flush();

    // Clear timers
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }

    // Remove all listeners
    this.listeners.forEach(({ type, target, handler }) => {
      target.removeEventListener(type, handler);
    });
    this.listeners = [];

    // Reset state
    this.isInitialized = false;
    this.sessionToken = null;
    this.eventQueue = [];
    this.eventCount = 0;
  }

  /**
   * Rotate session (new page/view)
   */
  rotate() {
    this.shutdown();
    return this.initialize();
  }

  // ==================== UTILITIES ====================
  
  /**
   * Check if ready
   */
  isReady() {
    return this.isInitialized && this.hasConsent;
  }

  /**
   * Debug logging
   */
  log(...args) {
    if (this.config.debug) {
      console.log(`[TelemetrySDK v${SDK_VERSION}]`, ...args);
    }
  }
}

export default TelemetrySDK;
