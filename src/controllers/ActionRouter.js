/**
 * ActionRouter
 * Routes input actions to their respective handlers.
 * Part of Phase 6 - Clean Controller architecture.
 *
 * The router validates input against game state and either:
 * 1. Calls model methods directly for game state changes
 * 2. Emits events for View-layer concerns (scene transitions, etc.)
 *
 * This class has NO Phaser dependencies and NO scene references.
 */

import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';
import { INPUT_ACTIONS, INPUT_TYPES } from '../input/InputAdapter.js';

/**
 * ActionContext
 * Context passed to action handlers containing game state and utilities
 */
export class ActionContext {
    constructor(gameModel, replaySystem = null) {
        this.gameModel = gameModel;
        this.replaySystem = replaySystem;
        this.state = gameModel.state || gameModel;
    }

    /**
	 * Check if the game is in a state where actions are allowed
	 * @returns {boolean}
	 */
    canAcceptInput() {
        return !this.state.isGameOver && !this.state.isDying;
    }

    /**
	 * Check if the game can be paused
	 * @returns {boolean}
	 */
    canPause() {
        return (
            !this.state.isGameOver && !this.state.isDying && !this.state.isPaused
        );
    }

    /**
	 * Check if the game can be resumed
	 * @returns {boolean}
	 */
    canResume() {
        return this.state.isPaused;
    }
}

/**
 * ActionRouter
 * Routes normalized input to appropriate handlers
 */
export class ActionRouter {
    /**
	 * Create ActionRouter
	 * @param {Object} gameModel - The game model
	 * @param {Object} replaySystem - Optional replay system
	 */
    constructor(gameModel, replaySystem = null) {
        this.gameModel = gameModel;
        this.replaySystem = replaySystem;
        this.actionHandlers = new Map();

        this.registerDefaultHandlers();
    }

    /**
	 * Register default action handlers
	 * @private
	 */
    registerDefaultHandlers() {
        // Direction input - directly control Player
        this.registerHandler(INPUT_TYPES.DIRECTION, (input, context) => {
            if (context.canAcceptInput() && input.value) {
                this.gameModel.setInputDirection(input.value);
                gameEvents.emit(GAME_EVENTS.DIRECTION_CHANGED, {
                    direction: input.value
                });
            }
        });

        // Pause action
        this.registerHandler(INPUT_ACTIONS.PAUSE, (input, context) => {
            if (context.canPause()) {
                this.gameModel.togglePaused();
                gameEvents.emit(GAME_EVENTS.PAUSE_REQUESTED);
            } else if (context.canResume()) {
                this.gameModel.togglePaused();
                gameEvents.emit(GAME_EVENTS.RESUME_REQUESTED);
            }
        });

        // Resume action (explicit)
        this.registerHandler(INPUT_ACTIONS.RESUME, (input, context) => {
            if (context.canResume()) {
                this.gameModel.togglePaused();
                gameEvents.emit(GAME_EVENTS.RESUME_REQUESTED);
            }
        });

        // Return to menu
        this.registerHandler(INPUT_ACTIONS.RETURN_TO_MENU, (input, context) => {
            if (!context.state.isGameOver) {
                gameEvents.emit(GAME_EVENTS.RETURN_TO_MENU_REQUESTED);
            }
        });

        // Restart level
        this.registerHandler(INPUT_ACTIONS.RESTART, (input, context) => {
            gameEvents.emit(GAME_EVENTS.RESTART_LEVEL_REQUESTED);
        });

        // Replay toggle
        this.registerHandler(INPUT_ACTIONS.TOGGLE_REPLAY, (input, context) => {
            if (this.replaySystem) {
                gameEvents.emit(GAME_EVENTS.REPLAY_TOGGLE_REQUESTED, {
                    replaySystem: this.replaySystem
                });
            }
        });

        // Load replay
        this.registerHandler(INPUT_ACTIONS.LOAD_REPLAY, (input, context) => {
            if (this.replaySystem) {
                gameEvents.emit(GAME_EVENTS.LOAD_REPLAY_REQUESTED, {
                    replaySystem: this.replaySystem
                });
            }
        });
    }

    /**
	 * Register a handler for a specific action
	 * @param {string} action - Action name or input type
	 * @param {Function} handler - Handler function(input, context)
	 * @returns {ActionRouter} This router for chaining
	 */
    registerHandler(action, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function');
        }

        if (!this.actionHandlers.has(action)) {
            this.actionHandlers.set(action, []);
        }

        this.actionHandlers.get(action).push(handler);
        return this;
    }

    /**
	 * Remove a handler for a specific action
	 * @param {string} action - Action name
	 * @param {Function} handler - Handler to remove
	 * @returns {ActionRouter} This router for chaining
	 */
    unregisterHandler(action, handler) {
        if (this.actionHandlers.has(action)) {
            const handlers = this.actionHandlers.get(action);
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
        return this;
    }

    /**
	 * Route input to appropriate handlers
	 * @param {Object} input - Normalized input from InputAdapter
	 * @param {string} input.type - Input type (direction, action, etc.)
	 * @param {*} input.value - Input value
	 * @returns {boolean} True if input was handled
	 */
    route(input) {
        if (!input) {
            return false;
        }

        const context = new ActionContext(this.gameModel, this.replaySystem);
        let handled = false;

        // Get the action key based on input type
        const actionKey = this.getActionKey(input);

        // Execute handlers for this action
        if (this.actionHandlers.has(actionKey)) {
            const handlers = this.actionHandlers.get(actionKey);
            handlers.forEach((handler) => {
                try {
                    handler(input, context);
                    handled = true;
                } catch (error) {
                    console.error(`Error in action handler for '${actionKey}':`, error);
                }
            });
        }

        return handled;
    }

    /**
	 * Get the action key from input
	 * @private
	 * @param {Object} input - Input object
	 * @returns {string} Action key
	 */
    getActionKey(input) {
        // For direction inputs, use the type directly
        if (input.type === INPUT_TYPES.DIRECTION) {
            return INPUT_TYPES.DIRECTION;
        }

        // For action inputs, use the value as the key
        if (input.type === INPUT_TYPES.ACTION && input.value) {
            return input.value;
        }

        // Fallback to type
        return input.type;
    }

    /**
	 * Handle multiple inputs in sequence
	 * @param {Array} inputs - Array of input objects
	 * @returns {number} Number of inputs handled
	 */
    routeBatch(inputs) {
        if (!Array.isArray(inputs)) {
            return 0;
        }

        let handledCount = 0;
        inputs.forEach((input) => {
            if (this.route(input)) {
                handledCount++;
            }
        });

        return handledCount;
    }

    /**
	 * Get all registered action names
	 * @returns {Array<string>} Action names
	 */
    getRegisteredActions() {
        return Array.from(this.actionHandlers.keys());
    }

    /**
	 * Check if an action has registered handlers
	 * @param {string} action - Action name
	 * @returns {boolean}
	 */
    hasHandler(action) {
        return (
            this.actionHandlers.has(action) &&
			this.actionHandlers.get(action).length > 0
        );
    }

    /**
	 * Clear all handlers
	 */
    clearHandlers() {
        this.actionHandlers.clear();
    }

    /**
	 * Reset to default handlers
	 */
    resetHandlers() {
        this.clearHandlers();
        this.registerDefaultHandlers();
    }
}

/**
 * GameController (Phase 6 - Clean)
 * Main controller class that coordinates input and game state.
 * No Phaser dependencies, no scene references.
 */
export class GameController {
    /**
	 * Create GameController
	 * @param {Object} options
	 * @param {Object} options.gameModel - The game model
	 * @param {Object} options.replaySystem - Optional replay system
	 * @param {InputManager} options.inputManager - Optional input manager
	 */
    constructor({ gameModel, replaySystem = null, inputManager = null } = {}) {
        this.gameModel = gameModel;
        this.replaySystem = replaySystem;
        this.inputManager = null;
        this.actionRouter = new ActionRouter(gameModel, replaySystem);

        this.isActive = false;
        this.unsubscribeInput = null;

        // Auto-subscribe if input manager provided
        if (inputManager) {
            this.setInputManager(inputManager);
        }
    }

    /**
	 * Set the input manager
	 * @param {InputManager} inputManager - Input manager instance
	 */
    setInputManager(inputManager) {
        // Unsubscribe from previous input manager
        if (this.unsubscribeInput) {
            this.unsubscribeInput();
            this.unsubscribeInput = null;
        }

        this.inputManager = inputManager;

        // Subscribe to input events
        if (inputManager) {
            this.unsubscribeInput = inputManager.onInput((input) => {
                this.handleInput(input);
            });
        }
    }

    /**
	 * Handle input from any source
	 * @param {Object} input - Normalized input
	 */
    handleInput(input) {
        if (!this.isActive || !input) {
            return;
        }

        this.actionRouter.route(input);
    }

    /**
	 * Activate the controller
	 */
    activate() {
        this.isActive = true;
    }

    /**
	 * Deactivate the controller
	 */
    deactivate() {
        this.isActive = false;
    }

    /**
	 * Check if controller is active
	 * @returns {boolean}
	 */
    getIsActive() {
        return this.isActive;
    }

    /**
	 * Clean up resources
	 */
    destroy() {
        this.deactivate();

        if (this.unsubscribeInput) {
            this.unsubscribeInput();
            this.unsubscribeInput = null;
        }

        this.inputManager = null;
        this.actionRouter = null;
        this.gameModel = null;
        this.replaySystem = null;
    }
}

export default GameController;
