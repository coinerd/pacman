/**
 * InputManager
 * Central coordinator for all input adapters.
 * Manages multiple input sources with priority handling and seamless switching.
 *
 * Usage:
 *   const inputManager = new InputManager();
 *   inputManager.registerAdapter('keyboard', new KeyboardAdapter(scene.input));
 *   inputManager.setActiveAdapter('keyboard');
 *   inputManager.onInput((input) => gameController.handleInput(input));
 */

import { InputAdapter } from './InputAdapter.js';

export class InputManager {
    /**
     * Create InputManager
     * @param {Object} options - Configuration options
     * @param {boolean} options.allowMultipleActive - Allow multiple adapters to be active (default: false)
     * @param {string} options.defaultAdapter - Default adapter to activate
     */
    constructor(options = {}) {
        this.adapters = new Map();
        this.activeAdapters = new Set();
        this.options = {
            allowMultipleActive: false,
            ...options
        };

        this.globalListeners = [];
        this.isPaused = false;
        this.inputHistory = [];
        this.maxHistorySize = 1000;
        this.pendingTimeouts = new Set(); // Track pending timeouts for cleanup
    }

    /**
     * Register an input adapter
     * @param {string} name - Unique name for this adapter
     * @param {InputAdapter} adapter - The adapter instance
     * @returns {InputManager} This manager for chaining
     */
    registerAdapter(name, adapter) {
        if (!(adapter instanceof InputAdapter)) {
            throw new Error('Adapter must be an instance of InputAdapter');
        }

        // Unregister existing adapter with same name
        if (this.adapters.has(name)) {
            this.unregisterAdapter(name);
        }

        adapter.name = name;
        this.adapters.set(name, adapter);

        // Set up input forwarding
        adapter.onInput((input) => this.handleAdapterInput(name, input));

        // Auto-activate if it's the default
        if (name === this.options.defaultAdapter) {
            this.setActiveAdapter(name);
        }

        return this;
    }

    /**
     * Unregister an input adapter
     * @param {string} name - Adapter name
     */
    unregisterAdapter(name) {
        const adapter = this.adapters.get(name);
        if (adapter) {
            this.activeAdapters.delete(name);
            adapter.destroy();
            this.adapters.delete(name);
        }
    }

    /**
     * Set the active adapter(s)
     * @param {string|Array<string>} names - Adapter name(s) to activate
     */
    setActiveAdapter(names) {
        const nameList = Array.isArray(names) ? names : [names];

        if (!this.options.allowMultipleActive && nameList.length > 1) {
            throw new Error('Multiple active adapters not allowed. Set allowMultipleActive: true');
        }

        // Deactivate all current adapters
        this.activeAdapters.forEach(name => {
            const adapter = this.adapters.get(name);
            if (adapter) {adapter.disable();}
        });
        this.activeAdapters.clear();

        // Activate new adapters
        nameList.forEach(name => {
            const adapter = this.adapters.get(name);
            if (adapter) {
                adapter.enable();
                this.activeAdapters.add(name);
            } else {
                console.warn(`InputManager: Adapter '${name}' not found`);
            }
        });
    }

    /**
     * Get the currently active adapter(s)
     * @returns {Array<string>} Names of active adapters
     */
    getActiveAdapters() {
        return Array.from(this.activeAdapters);
    }

    /**
     * Get an adapter by name
     * @param {string} name - Adapter name
     * @returns {InputAdapter|null} The adapter or null
     */
    getAdapter(name) {
        return this.adapters.get(name) || null;
    }

    /**
     * Subscribe to all input events from active adapters
     * @param {Function} callback - Function to call when input is received
     * @returns {Function} Unsubscribe function
     */
    onInput(callback) {
        this.globalListeners.push(callback);
        return () => {
            const index = this.globalListeners.indexOf(callback);
            if (index !== -1) {
                this.globalListeners.splice(index, 1);
            }
        };
    }

    /**
     * Handle input from an adapter
     * @private
     * @param {string} adapterName - Name of the source adapter
     * @param {Object} input - Input event
     */
    handleAdapterInput(adapterName, input) {
        if (this.isPaused) {return;}

        const enrichedInput = {
            ...input,
            adapter: adapterName,
            managerTimestamp: performance.now()
        };

        // Record in history
        this.recordInput(enrichedInput);

        // Notify all global listeners
        this.globalListeners.forEach(callback => {
            try {
                callback(enrichedInput);
            } catch (error) {
                console.error(`Error in input listener: ${error.message}`);
            }
        });
    }

    /**
     * Record input in history
     * @private
     * @param {Object} input - Input event to record
     */
    recordInput(input) {
        this.inputHistory.push(input);
        if (this.inputHistory.length > this.maxHistorySize) {
            this.inputHistory.shift();
        }
    }

    /**
     * Get input history
     * @param {number} count - Number of recent inputs to return (default: all)
     * @returns {Array} Recent input events
     */
    getInputHistory(count = null) {
        if (count === null) {return [...this.inputHistory];}
        return this.inputHistory.slice(-count);
    }

    /**
     * Clear input history
     */
    clearHistory() {
        this.inputHistory = [];
    }

    /**
     * Pause all input processing
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume input processing
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * Update all active adapters
     * @param {number} deltaTime - Time since last frame in ms
     */
    update(deltaTime) {
        if (this.isPaused) {return;}

        this.activeAdapters.forEach(name => {
            const adapter = this.adapters.get(name);
            if (adapter) {
                const input = adapter.update(deltaTime);
                if (input) {
                    this.handleAdapterInput(name, input);
                }
            }
        });
    }

    /**
     * Check if any adapter is currently active
     * @returns {boolean}
     */
    hasActiveAdapter() {
        return this.activeAdapters.size > 0;
    }

    /**
     * Temporarily switch to a different adapter, then restore previous
     * @param {string} tempAdapter - Adapter to temporarily switch to
     * @param {number} duration - Duration in ms to use temp adapter
     * @returns {Promise} Resolves when switched back
     */
    async tempSwitch(tempAdapter, duration) {
        const previousAdapters = this.getActiveAdapters();
        this.setActiveAdapter(tempAdapter);

        return new Promise(resolve => {
            const timeoutId = setTimeout(() => {
                this.pendingTimeouts.delete(timeoutId);
                this.setActiveAdapter(previousAdapters);
                resolve();
            }, duration);

            this.pendingTimeouts.add(timeoutId);
        });
    }

    /**
     * Get manager status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            registeredAdapters: Array.from(this.adapters.keys()),
            activeAdapters: Array.from(this.activeAdapters),
            isPaused: this.isPaused,
            historySize: this.inputHistory.length
        };
    }

    /**
     * Clean up all adapters and resources
     */
    destroy() {
        // Clear all pending timeouts
        this.pendingTimeouts.forEach(id => clearTimeout(id));
        this.pendingTimeouts.clear();

        this.adapters.forEach(adapter => adapter.destroy());
        this.adapters.clear();
        this.activeAdapters.clear();
        this.globalListeners = [];
        this.inputHistory = [];
    }
};
