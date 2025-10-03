/**
 * Performance Monitoring Utility for Project SolisCAN
 * Tracks 3D rendering performance, memory usage, and user interactions
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: [],
      frameTime: [],
      memory: [],
      renderTime: [],
      interactions: [],
      apiCalls: []
    };
    
    this.isMonitoring = false;
    this.startTime = null;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    
    // Performance thresholds
    this.thresholds = {
      targetFPS: 60,
      warningFPS: 45,
      criticalFPS: 30,
      maxFrameTime: 16.67, // ms (60 FPS)
      maxMemoryMB: 500
    };
    
    this.listeners = [];
  }

  /**
   * Start monitoring performance
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startTime = performance.now();
    this.frameCount = 0;
    
    console.log('📊 Performance monitoring started');
    
    // Start FPS monitoring
    this.monitorFPS();
    
    // Start memory monitoring (if available)
    if (performance.memory) {
      this.monitorMemory();
    }
  }

  /**
   * Stop monitoring performance
   */
  stop() {
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
    this.generateReport();
  }

  /**
   * Monitor FPS and frame time
   */
  monitorFPS() {
    if (!this.isMonitoring) return;
    
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // Calculate FPS
    const fps = 1000 / frameTime;
    
    // Store metrics
    this.metrics.fps.push(fps);
    this.metrics.frameTime.push(frameTime);
    this.frameCount++;
    
    // Check for performance issues
    if (fps < this.thresholds.warningFPS) {
      console.warn(`⚠️ Low FPS detected: ${fps.toFixed(1)}`);
    }
    
    if (frameTime > this.thresholds.maxFrameTime * 2) {
      console.warn(`⚠️ Long frame time: ${frameTime.toFixed(2)}ms`);
    }
    
    // Continue monitoring
    requestAnimationFrame(() => this.monitorFPS());
  }

  /**
   * Monitor memory usage
   */
  monitorMemory() {
    if (!this.isMonitoring || !performance.memory) return;
    
    const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
    this.metrics.memory.push(memoryMB);
    
    // Check for memory issues
    if (memoryMB > this.thresholds.maxMemoryMB) {
      console.warn(`⚠️ High memory usage: ${memoryMB.toFixed(1)}MB`);
    }
    
    // Check again in 1 second
    setTimeout(() => this.monitorMemory(), 1000);
  }

  /**
   * Track render time for a specific operation
   */
  trackRender(name, callback) {
    const startTime = performance.now();
    
    const result = callback();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    this.metrics.renderTime.push({
      name,
      time: renderTime,
      timestamp: endTime
    });
    
    if (renderTime > 100) {
      console.warn(`⚠️ Slow render: ${name} took ${renderTime.toFixed(2)}ms`);
    }
    
    return result;
  }

  /**
   * Track async render time
   */
  async trackRenderAsync(name, callback) {
    const startTime = performance.now();
    
    const result = await callback();
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    this.metrics.renderTime.push({
      name,
      time: renderTime,
      timestamp: endTime
    });
    
    if (renderTime > 1000) {
      console.warn(`⚠️ Slow async operation: ${name} took ${renderTime.toFixed(2)}ms`);
    }
    
    return result;
  }

  /**
   * Track user interaction
   */
  trackInteraction(type, data = {}) {
    this.metrics.interactions.push({
      type,
      data,
      timestamp: performance.now()
    });
  }

  /**
   * Track API call performance
   */
  async trackAPICall(url, fetchPromise) {
    const startTime = performance.now();
    
    try {
      const response = await fetchPromise;
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.metrics.apiCalls.push({
        url,
        duration,
        status: response.status,
        success: response.ok,
        timestamp: endTime
      });
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow API call: ${url} took ${duration.toFixed(0)}ms`);
      }
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.metrics.apiCalls.push({
        url,
        duration,
        success: false,
        error: error.message,
        timestamp: endTime
      });
      
      throw error;
    }
  }

  /**
   * Get current performance snapshot
   */
  getSnapshot() {
    const recentFPS = this.metrics.fps.slice(-60); // Last 60 frames
    const recentMemory = this.metrics.memory.slice(-10); // Last 10 samples
    
    return {
      currentFPS: recentFPS[recentFPS.length - 1] || 0,
      averageFPS: this.calculateAverage(recentFPS),
      minFPS: Math.min(...recentFPS),
      maxFPS: Math.max(...recentFPS),
      currentMemoryMB: recentMemory[recentMemory.length - 1] || 0,
      averageMemoryMB: this.calculateAverage(recentMemory),
      frameCount: this.frameCount,
      uptime: (performance.now() - this.startTime) / 1000
    };
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const duration = (performance.now() - this.startTime) / 1000;
    
    const report = {
      duration: duration.toFixed(2) + 's',
      
      fps: {
        average: this.calculateAverage(this.metrics.fps).toFixed(1),
        min: Math.min(...this.metrics.fps).toFixed(1),
        max: Math.max(...this.metrics.fps).toFixed(1),
        p95: this.calculatePercentile(this.metrics.fps, 95).toFixed(1),
        p99: this.calculatePercentile(this.metrics.fps, 99).toFixed(1)
      },
      
      frameTime: {
        average: this.calculateAverage(this.metrics.frameTime).toFixed(2) + 'ms',
        max: Math.max(...this.metrics.frameTime).toFixed(2) + 'ms',
        p95: this.calculatePercentile(this.metrics.frameTime, 95).toFixed(2) + 'ms'
      },
      
      memory: performance.memory ? {
        current: (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1) + 'MB',
        average: this.calculateAverage(this.metrics.memory).toFixed(1) + 'MB',
        max: Math.max(...this.metrics.memory).toFixed(1) + 'MB',
        limit: (performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(0) + 'MB'
      } : 'Not available',
      
      renders: {
        count: this.metrics.renderTime.length,
        totalTime: this.metrics.renderTime.reduce((sum, r) => sum + r.time, 0).toFixed(2) + 'ms',
        slowest: this.metrics.renderTime.length > 0 
          ? this.metrics.renderTime.reduce((max, r) => r.time > max.time ? r : max)
          : null
      },
      
      api: {
        count: this.metrics.apiCalls.length,
        averageTime: this.calculateAverage(
          this.metrics.apiCalls.map(c => c.duration)
        ).toFixed(0) + 'ms',
        failures: this.metrics.apiCalls.filter(c => !c.success).length
      },
      
      interactions: {
        count: this.metrics.interactions.length,
        types: this.groupBy(this.metrics.interactions, 'type')
      },
      
      health: this.getHealthScore()
    };
    
    console.log('📊 Performance Report:', report);
    return report;
  }

  /**
   * Calculate health score (0-100)
   */
  getHealthScore() {
    let score = 100;
    
    // FPS score (40% weight)
    const avgFPS = this.calculateAverage(this.metrics.fps);
    if (avgFPS < this.thresholds.criticalFPS) score -= 40;
    else if (avgFPS < this.thresholds.warningFPS) score -= 20;
    else if (avgFPS < this.thresholds.targetFPS) score -= 10;
    
    // Memory score (30% weight)
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      if (memoryUsage > 0.9) score -= 30;
      else if (memoryUsage > 0.7) score -= 15;
      else if (memoryUsage > 0.5) score -= 5;
    }
    
    // API performance (20% weight)
    const avgAPITime = this.calculateAverage(
      this.metrics.apiCalls.map(c => c.duration)
    );
    if (avgAPITime > 2000) score -= 20;
    else if (avgAPITime > 1000) score -= 10;
    else if (avgAPITime > 500) score -= 5;
    
    // Render performance (10% weight)
    const slowRenders = this.metrics.renderTime.filter(r => r.time > 100).length;
    const renderRatio = slowRenders / Math.max(this.metrics.renderTime.length, 1);
    if (renderRatio > 0.5) score -= 10;
    else if (renderRatio > 0.2) score -= 5;
    
    return {
      score: Math.max(0, score),
      grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F'
    };
  }

  /**
   * Subscribe to performance updates
   */
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Start sending updates every second
    const interval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(interval);
        return;
      }
      callback(this.getSnapshot());
    }, 1000);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
      clearInterval(interval);
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      ...this.metrics,
      summary: this.generateReport()
    };
  }

  /**
   * Helper: Calculate average
   */
  calculateAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Helper: Calculate percentile
   */
  calculatePercentile(arr, percentile) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Helper: Group by property
   */
  groupBy(arr, prop) {
    return arr.reduce((groups, item) => {
      const key = item[prop];
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in React components
export default performanceMonitor;

// Also export for direct script usage
if (typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor;
}
