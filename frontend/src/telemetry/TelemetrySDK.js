/**
 * TelemetrySDK - Core telemetry streaming engine
 * 
 * Purpose: Collect behavioral signals and stream to DRS server
 * - Zero PII capture
 * - Passive listeners only
 * - Batched async streaming
 * - Lightweight and non-blocking
 */

class TelemetrySDK {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:8080',
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000, // 5 seconds
      throttleMs: config.throttleMs || 100, // Throttle event capture
      debug: config.debug || false,
    };

    // Session state
    this.sessionToken = null;
    this.eventQueue = [];
    this.isInitialized = false;
    this.flushTimer = null;
    this.lastEventTimes = {};
    
    // Event listeners cleanup
    this.listeners = [];
  }

  /**
   * Initialize SDK - call this once on app load
   * Mints session token and registers all event listeners
   */
  initialize() {
    if (this.isInitialized) {
      this.log('SDK already initialized');
      return this.sessionToken;
    }

    // Generate session token
    this.sessionToken = this.generateSessionToken();
    this.log('Initialized with session token:', this.sessionToken);

    // Register all passive listeners
    this.registerMouseListener();
    this.registerScrollListener();
    this.registerKeystrokeListener();
    this.registerFocusListeners();
    this.captureDeviceFingerprint();

    // Start periodic flush
    this.startFlushInterval();

    this.isInitialized = true;
    return this.sessionToken;
  }

  /**
   * Generate unique session token (UUID v4)
   */
  generateSessionToken() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Register mouse movement listener
   * Captures position only (no clicked elements or sensitive data)
   */
  registerMouseListener() {
    const handler = (e) => {
      if (!this.shouldCaptureEvent('mouse')) return;

      this.addEvent({
        type: 'mouse',
        timestamp: Date.now(),
        data: {
          x: e.clientX,
          y: e.clientY,
        },
      });
    };

    document.addEventListener('mousemove', handler, { passive: true });
    this.listeners.push({ event: 'mousemove', handler });
  }

  /**
   * Register scroll listener
   * Captures scroll position for rhythm analysis
   */
  registerScrollListener() {
    const handler = () => {
      if (!this.shouldCaptureEvent('scroll')) return;

      this.addEvent({
        type: 'scroll',
        timestamp: Date.now(),
        data: {
          deltaY: window.scrollY,
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
        },
      });
    };

    window.addEventListener('scroll', handler, { passive: true });
    this.listeners.push({ event: 'scroll', handler });
  }

  /**
   * Register keystroke timing listener
   * CRITICAL: Only captures timing, NEVER captures key values
   */
  registerKeystrokeListener() {
    const handler = () => {
      const now = Date.now();
      const lastTime = this.lastEventTimes.keystroke || 0;

      if (lastTime > 0) {
        const interval = now - lastTime;
        
        this.addEvent({
          type: 'keystroke',
          timestamp: now,
          data: {
            interval, // Only timing between keystrokes
          },
        });
      }

      this.lastEventTimes.keystroke = now;
    };

    document.addEventListener('keydown', handler, { passive: true });
    this.listeners.push({ event: 'keydown', handler });
  }

  /**
   * Register focus/blur listeners
   * Tracks window activity for idle/active ratio
   */
  registerFocusListeners() {
    const focusHandler = () => {
      this.addEvent({
        type: 'focus',
        timestamp: Date.now(),
        data: {},
      });
    };

    const blurHandler = () => {
      this.addEvent({
        type: 'blur',
        timestamp: Date.now(),
        data: {},
      });
    };

    window.addEventListener('focus', focusHandler);
    window.addEventListener('blur', blurHandler);
    
    this.listeners.push({ event: 'focus', handler: focusHandler });
    this.listeners.push({ event: 'blur', handler: blurHandler });
  }

  /**
   * Capture device fingerprint (for consistency checking)
   * No PII - only technical characteristics
   */
  captureDeviceFingerprint() {
    const fingerprint = this.generateFingerprint();

    this.addEvent({
      type: 'device',
      timestamp: Date.now(),
      data: {
        fingerprint,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        deviceMemory: navigator.deviceMemory || 'unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      },
    });
  }

  /**
   * Generate simple device fingerprint
   */
  generateFingerprint() {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.platform,
    ];

    const combined = components.join('|');
    return btoa(combined).substring(0, 32);
  }

  /**
   * Throttle event capture to avoid overwhelming the system
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
   * Add event to queue
   * Auto-flushes when batch size is reached
   */
  addEvent(event) {
    this.eventQueue.push(event);
    this.log('Event queued:', event.type, `(${this.eventQueue.length}/${this.config.batchSize})`);

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Start periodic flush interval
   */
  startFlushInterval() {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Flush events to DRS server
   * Asynchronous and non-blocking
   */
  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    this.log(`Flushing ${events.length} events to DRS server`);

    try {
      const response = await fetch(`${this.config.apiUrl}/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: this.sessionToken,
          events,
        }),
      });

      if (!response.ok) {
        console.error('[TelemetrySDK] Failed to send telemetry:', response.status);
        // Re-queue events on error (with limit to prevent memory issues)
        if (this.eventQueue.length < 100) {
          this.eventQueue.unshift(...events);
        }
      } else {
        this.log(`Successfully sent ${events.length} events`);
      }
    } catch (error) {
      console.error('[TelemetrySDK] Error sending telemetry:', error.message);
      // Re-queue events on network error
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events);
      }
    }
  }

  /**
   * Get session token for app to attach to gated actions
   */
  getSessionToken() {
    return this.sessionToken;
  }

  /**
   * Check if SDK is initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Cleanup - remove all listeners and timers
   */
  shutdown() {
    this.log('Shutting down SDK');

    // Flush remaining events
    this.flush();

    // Clear flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Remove all event listeners
    this.listeners.forEach(({ event, handler }) => {
      if (event === 'scroll') {
        window.removeEventListener(event, handler);
      } else if (event === 'focus' || event === 'blur') {
        window.removeEventListener(event, handler);
      } else {
        document.removeEventListener(event, handler);
      }
    });

    this.listeners = [];
    this.isInitialized = false;
  }

  /**
   * Debug logging
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[TelemetrySDK]', ...args);
    }
  }
}

export default TelemetrySDK;
