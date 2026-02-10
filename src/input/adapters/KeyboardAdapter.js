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

        // Setup directional keys
        if (this.options.useArrowKeys) {
            this.cursors = this.phaserInput.keyboard.createCursorKeys();
        }

        if (this.options.useWASD) {
            this.wasd = this.phaserInput.keyboard.addKeys('W,A,S,D');
        }

        // Setup action keys
        this.setupActionKeys();
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
        // Check arrow keys
        if (this.cursors) {
            if (this.cursors.left.isDown) {return directions.LEFT;}
            if (this.cursors.right.isDown) {return directions.RIGHT;}
            if (this.cursors.up.isDown) {return directions.UP;}
            if (this.cursors.down.isDown) {return directions.DOWN;}
        }

        // Check WASD keys
        if (this.wasd) {
            if (this.wasd.A.isDown) {return directions.LEFT;}
            if (this.wasd.D.isDown) {return directions.RIGHT;}
            if (this.wasd.W.isDown) {return directions.UP;}
            if (this.wasd.S.isDown) {return directions.DOWN;}
        }

        return null;
    }

    /**
     * Update method - polls for directional input
     * @param {number} deltaTime - Time since last frame in ms
     */
    update(deltaTime) {
        const input = this.getCurrentInput();
        if (input) {
            this.emitInput(input);
        }
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
        super.destroy();
    }
}

export default KeyboardAdapter;
