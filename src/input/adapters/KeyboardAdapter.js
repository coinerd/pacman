/**
 * KeyboardAdapter
 * Translates Phaser keyboard input to abstract input events.
 * Supports arrow keys and WASD for movement, plus action keys.
 */

import { InputAdapter, INPUT_TYPES, INPUT_ACTIONS } from '../InputAdapter.js';
import { directions } from '../../config/gameConfig.js';

export class KeyboardAdapter extends InputAdapter {
    /**
     * Create KeyboardAdapter
     * @param {Object} phaserInput - Phaser input manager (scene.input)
     * @param {Object} options - Configuration options
     * @param {boolean} options.useWASD - Enable WASD controls (default: true)
     * @param {boolean} options.useArrowKeys - Enable arrow key controls (default: true)
     * @param {Object} options.keyMap - Custom key mappings
     */
    constructor(phaserInput, options = {}) {
        super();
        this.name = 'keyboard';
        this.phaserInput = phaserInput;
        this.options = {
            useWASD: true,
            useArrowKeys: true,
            ...options
        };

        this.cursors = null;
        this.wasd = null;
        this.actionKeys = {};
        this.keyListeners = [];

        this.setupKeyboard();
    }

    /**
     * Setup keyboard event listeners
     * @private
     */
    setupKeyboard() {
        if (!this.phaserInput?.keyboard) {
            console.warn('KeyboardAdapter: Phaser keyboard not available');
            return;
        }

        // Setup directional keys via Phaser
        if (this.options.useArrowKeys) {
            this.cursors = this.phaserInput.keyboard.createCursorKeys();
        }

        if (this.options.useWASD) {
            this.wasd = this.phaserInput.keyboard.addKeys('W,A,S,D');
        }

        // Setup action keys
        this.setupActionKeys();

        // Also setup native keyboard listeners as fallback
        this.setupNativeKeyboardListeners();
    }

    /**
     * Setup native browser keyboard listeners (fallback)
     * @private
     */
    setupNativeKeyboardListeners() {
        this.keyState = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
            KeyA: false,
            KeyD: false,
            KeyW: false,
            KeyS: false
        };

        this.nativeKeyDownHandler = (event) => {
            if (Object.prototype.hasOwnProperty.call(this.keyState, event.code)) {
                this.keyState[event.code] = true;
            }
            // Also handle action keys
            if (event.code === 'KeyP') {
                this.emitInput({ type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.PAUSE });
            }
            if (event.code === 'Escape') {
                this.emitInput({ type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.RETURN_TO_MENU });
            }
        };

        this.nativeKeyUpHandler = (event) => {
            if (Object.prototype.hasOwnProperty.call(this.keyState, event.code)) {
                this.keyState[event.code] = false;
            }
        };

        window.addEventListener('keydown', this.nativeKeyDownHandler);
        window.addEventListener('keyup', this.nativeKeyUpHandler);
    }

    /**
     * Setup action key listeners
     * @private
     */
    setupActionKeys() {
        const keyboard = this.phaserInput.keyboard;

        // Pause/Resume - P key
        this.addKeyListener(keyboard, 'keydown-P', () => {
            this.emitInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.PAUSE
            });
        });

        // Return to menu - ESC key
        this.addKeyListener(keyboard, 'keydown-ESC', () => {
            this.emitInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.RETURN_TO_MENU
            });
        });

        // Restart - R key (only if not recording replays)
        this.addKeyListener(keyboard, 'keydown-R', () => {
            this.emitInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.TOGGLE_REPLAY
            });
        });

        // Load replay - L key
        this.addKeyListener(keyboard, 'keydown-L', () => {
            this.emitInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.LOAD_REPLAY
            });
        });
    }

    /**
     * Add a key listener and track it for cleanup
     * @private
     * @param {Object} keyboard - Phaser keyboard manager
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    addKeyListener(keyboard, event, callback) {
        keyboard.on(event, callback);
        this.keyListeners.push({ event, callback });
    }

    /**
     * Poll for directional input (called each frame)
     * @returns {Object|null} Direction input or null
     */
    getCurrentInput() {
        if (!this.isEnabled) {return null;}

        const direction = this.getDirectionFromKeys();
        if (direction) {
            return {
                type: INPUT_TYPES.DIRECTION,
                value: direction
            };
        }
        return null;
    }

    /**
     * Check which direction keys are pressed
     * @private
     * @returns {Object|null} Direction object or null
     */
    getDirectionFromKeys() {
        // Check native key state first (more reliable)
        if (this.keyState) {
            if (this.keyState.ArrowLeft || this.keyState.KeyA) {
                return directions.LEFT;
            }
            if (this.keyState.ArrowRight || this.keyState.KeyD) {
                return directions.RIGHT;
            }
            if (this.keyState.ArrowUp || this.keyState.KeyW) {
                return directions.UP;
            }
            if (this.keyState.ArrowDown || this.keyState.KeyS) {
                return directions.DOWN;
            }
        }

        // Fall back to Phaser cursors
        if (this.cursors) {
            if (this.cursors.left?.isDown) {return directions.LEFT;}
            if (this.cursors.right?.isDown) {return directions.RIGHT;}
            if (this.cursors.up?.isDown) {return directions.UP;}
            if (this.cursors.down?.isDown) {return directions.DOWN;}
        }

        // Fall back to Phaser WASD
        if (this.wasd) {
            if (this.wasd.A?.isDown) {return directions.LEFT;}
            if (this.wasd.D?.isDown) {return directions.RIGHT;}
            if (this.wasd.W?.isDown) {return directions.UP;}
            if (this.wasd.S?.isDown) {return directions.DOWN;}
        }

        return null;
    }

    /**
     * Update method - polls for directional input
     * @param {number} deltaTime - Time since last frame in ms
     * @returns {Object|null} Input object or null
     */
    update(deltaTime) {
        const input = this.getCurrentInput();
        if (input) {
            this.emitInput(input);
        }
        return input;
    }

    /**
     * Clean up all keyboard listeners
     */
    destroy() {
        if (this.phaserInput?.keyboard) {
            this.keyListeners.forEach(({ event, callback }) => {
                this.phaserInput.keyboard.off(event, callback);
            });
        }
        this.keyListeners = [];
        this.cursors = null;
        this.wasd = null;

        // Clean up native listeners
        if (this.nativeKeyDownHandler) {
            window.removeEventListener('keydown', this.nativeKeyDownHandler);
        }
        if (this.nativeKeyUpHandler) {
            window.removeEventListener('keyup', this.nativeKeyUpHandler);
        }
        this.keyState = null;

        super.destroy();
    }
};
