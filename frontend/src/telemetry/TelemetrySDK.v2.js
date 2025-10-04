  /**
   * Flush events to DRS collector
   */
  async flush() {
    if (this.eventQueue.length === 0) return;

    // Take events from queue
    const eventsToSend = this.eventQueue.splice(0, this.config.maxEventsPerBatch);

    // Clean events for DRS compatibility
    const cleanedEvents = eventsToSend
      .map(event => {
        // Map unsupported event types to supported ones
        let eventType = event.type;
        if (eventType === 'visibility_visible') {
          eventType = 'focus';
        } else if (eventType === 'visibility_hidden') {
          eventType = 'blur';
        } else if (eventType === 'integrity') {
          // Skip integrity events for now (not supported by DRS)
          return null;
        }

        // Return only DRS-compatible fields (remove seq)
        return {
          type: eventType,
          timestamp: event.timestamp,
          data: event.data || {},
        };
      })
      .filter(event => event !== null); // Remove null entries

    if (cleanedEvents.length === 0) {
      this.log('[WARN] No valid events to send after cleaning');
      return;
    }

    const batchSize = JSON.stringify(cleanedEvents).length;
    
    // Size check
    if (batchSize > this.config.maxBytesPerBatch) {
      this.log('[WARN] Batch too large, truncating');
      const half = Math.floor(cleanedEvents.length / 2);
      const truncated = cleanedEvents.slice(0, half);
      this.eventQueue.unshift(...cleanedEvents.slice(half).map(e => ({ ...e, seq: this.eventCount++ })));
      cleanedEvents.length = 0;
      cleanedEvents.push(...truncated);
    }

    this.log(`Flushing ${cleanedEvents.length} events (${batchSize} bytes)`);

    try {
      const response = await fetch(`${this.config.apiUrl}/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: this.sessionToken,
          events: cleanedEvents,
        }),
      });

      if (!response.ok) {
        this.log('[ERROR] Flush failed:', response.status);
        const errorText = await response.text();
        this.log('[ERROR] Response:', errorText);
        // Re-queue with limit
        if (this.eventQueue.length < 50) {
          this.eventQueue.unshift(...eventsToSend);
        }
      } else {
        this.log(`✓ Flushed ${cleanedEvents.length} events`);
      }
    } catch (error) {
      this.log('[ERROR] Flush error:', error.message);
      // Re-queue on network error
      if (this.eventQueue.length < 50) {
        this.eventQueue.unshift(...eventsToSend);
      }
    }
  }
