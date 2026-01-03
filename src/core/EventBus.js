/**
 * EventBus - Central event management system for game-wide events
 * Provides pub/sub pattern for decoupled communication between components
 */

export const GAME_EVENTS = {
  PELLET_EATEN: 'pellet:eaten',
  POWER_PELLET_EATEN: 'power-pellet:eaten',
  FRUIT_EATEN: 'fruit:eaten',
  GHOST_EATEN: 'ghost:eaten',
  LEVEL_COMPLETE: 'level:complete',
  GAME_OVER: 'game:over',
  LIVES_LOST: 'lives:lost',
  SCORE_CHANGED: 'score:changed',
  HIGH_SCORE_CHANGED: 'high-score:changed',
  PAUSE_TOGGLED: 'pause:toggled',
  GAME_STARTED: 'game:started',
  GAME_RESET: 'game:reset',
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  DIRECTION_CHANGED: 'direction:changed',
  RECORDING_STARTED: 'recording:started',
  RECORDING_STOPPED: 'recording:stopped',
  REPLAY_INPUT: 'replay:input',
  REPLAY_FINISHED: 'replay:finished'
};

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @param {*} context - Optional context to bind to callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback, context = null) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener = { callback, context };
    this.listeners.get(event).push(listener);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe a specific callback from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback to remove
   * @returns {Function} Unsubscribe function (for chaining)
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return () => {};
    }

    const listeners = this.listeners.get(event);
    const index = listeners.findIndex(l => l.callback === callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }

    // Clean up empty arrays
    if (listeners.length === 0) {
      this.listeners.delete(event);
    }

    return () => {};
  }

  /**
   * Subscribe to an event that only fires once
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @param {*} context - Optional context to bind to callback
   * @returns {Function} Unsubscribe function
   */
  once(event, callback, context = null) {
    const wrappedCallback = (...args) => {
      this.off(event, wrappedCallback);
      callback.apply(context, args);
    };

    return this.on(event, wrappedCallback, context);
  }

  /**
   * Emit an event with optional data
   * @param {string} event - Event name
   * @param {*} data - Data to pass to subscribers
   */
  emit(event, data = null) {
    if (!this.listeners.has(event)) {
      return;
    }

    const listeners = this.listeners.get(event);

    // Create a copy of the array to avoid issues if listeners unsubscribe during emit
    [...listeners].forEach(({ callback, context }) => {
      try {
        callback.apply(context, [data]);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    });
  }

  /**
   * Remove all event listeners
   */
  clear() {
    this.listeners.clear();
  }

  /**
   * Get the number of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).length : 0;
  }

  /**
   * Get all event names that have listeners
   * @returns {string[]} Array of event names
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }
}

// Export a singleton instance for app-wide use
export const gameEvents = new EventBus();
