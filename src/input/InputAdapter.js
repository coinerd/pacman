/**
 * InputAdapter
 * Abstract base class for all input sources.
 * Provides a unified interface for keyboard, touch, replay, and AI input.
 *
 * Architecture: Input sources emit normalized input events that the
 * GameController consumes. The game logic doesn't care where input comes from.
 */

export const INPUT_TYPES = {
    DIRECTION: 'direction',
    ACTION: 'action',
    PAUSE: 'pause',
    RESUME: 'resume',
    RESTART: 'restart',
    MENU: 'menu',
    REPLAY_TOGGLE: 'replay_toggle',
    LOAD_REPLAY: 'load_replay'
};

export const INPUT_ACTIONS = {
    PAUSE: 'pause',
    RESUME: 'resume',
    RESTART: 'restart',
    RETURN_TO_MENU: 'return_to_menu',
    TOGGLE_REPLAY: 'toggle_replay',
    LOAD_REPLAY: 'load_replay'
};

/**
 * Abstract base class for input adapters
 * @abstract
 */
export class InputAdapter {
    constructor() {
        this.listeners = [];
        this.isEnabled = true;
        this.name = 'base';
    }

    /**
     * Subscribe to input events
     * @param {Function} callback - Function to call when input is received
     * @returns {Function} Unsubscribe function
     */
    onInput(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index !== -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Emit an input event to all listeners
     * @param {Object} input - The input event
     * @param {string} input.type - Input type (direction, action, etc.)
     * @param {*} input.value - Input value (direction object, action string, etc.)
     * @param {number} [input.timestamp] - Timestamp of the input
     */
    emitInput(input) {
        if (!this.isEnabled) {return;}

        const enrichedInput = {
            ...input,
            timestamp: input.timestamp ?? performance.now(),
            source: this.name
        };

        this.listeners.forEach(callback => {
            try {
                callback(enrichedInput);
            } catch (error) {
                console.error(`Error in input listener: ${error.message}`);
            }
        });
    }

    /**
     * Enable this input adapter
     */
    enable() {
        this.isEnabled = true;
    }

    /**
     * Disable this input adapter
     */
    disable() {
        this.isEnabled = false;
    }

    /**
     * Get current input state (for polling-based adapters)
     * Override in subclasses for continuous input sources
     * @returns {Object|null} Current input state or null
     */
    getCurrentInput() {
        return null;
    }

    /**
     * Update method called each frame (for polling-based adapters)
     * Override in subclasses that need per-frame updates
     * @param {number} deltaTime - Time since last frame in ms
     */
    update(deltaTime) {
        // Override in subclasses
    }

    /**
     * Clean up resources
     * Override in subclasses to remove event listeners
     */
    destroy() {
        this.listeners = [];
        this.isEnabled = false;
    }
}

/**
 * InputEventNormalizer
 * Utility class to normalize different input formats to a standard format
 */
export class InputEventNormalizer {
    /**
     * Normalize a direction input
     * @param {Object} direction - Direction object or key name
     * @returns {Object} Normalized direction object
     */
    static normalizeDirection(direction) {
        if (!direction) {return null;}

        // If already a direction object with x/y
        if (typeof direction.x === 'number' && typeof direction.y === 'number') {
            return direction;
        }

        // If it's a string key name, convert to direction
        if (typeof direction === 'string') {
            return this.directionFromKey(direction);
        }

        return null;
    }

    /**
     * Convert key name to direction object
     * @param {string} key - Key name (UP, DOWN, LEFT, RIGHT)
     * @returns {Object|null} Direction object
     */
    static directionFromKey(key) {
        const keyMap = {
            'UP': { x: 0, y: -1, angle: 270 },
            'DOWN': { x: 0, y: 1, angle: 90 },
            'LEFT': { x: -1, y: 0, angle: 180 },
            'RIGHT': { x: 1, y: 0, angle: 0 }
        };
        return keyMap[key.toUpperCase()] || null;
    }

    /**
     * Normalize an action input
     * @param {string} action - Action name
     * @returns {string} Normalized action name
     */
    static normalizeAction(action) {
        if (!action) {return null;}
        return action.toLowerCase();
    }
};
