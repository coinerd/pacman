/**
 * GameController
 * Simplified controller that translates input into model actions.
 * No Phaser dependencies - uses EventBus for View-layer communication.
 */

import { gameEvents, GAME_EVENTS } from '../core/EventBus.js';
import { INPUT_ACTIONS, INPUT_TYPES } from '../input/InputAdapter.js';

export class GameController {
    /**
     * @param {Object} options
     * @param {Object} options.gameModel - The game model
     * @param {Object} options.replaySystem - Optional replay system
     * @param {InputManager} options.inputManager - Optional input manager
     */
    constructor({ gameModel, replaySystem = null, inputManager = null } = {}) {
        this.gameModel = gameModel;
        this.replaySystem = replaySystem;
        this.inputManager = null;
        this.isActive = false;
        this.unsubscribeInput = null;

        if (inputManager) {
            this.setInputManager(inputManager);
        }
    }

    /**
     * Set the input manager
     * @param {InputManager} inputManager - Input manager instance
     */
    setInputManager(inputManager) {
        if (this.unsubscribeInput) {
            this.unsubscribeInput();
            this.unsubscribeInput = null;
        }

        this.inputManager = inputManager;

        if (inputManager) {
            this.unsubscribeInput = inputManager.onInput((input) => {
                this.handleInput(input);
            });
        }
    }

    /**
     * Handle input from any source
     * @param {Object} input - Normalized input { type, value }
     */
    handleInput(input) {
        if (!this.isActive || !input) {
            return;
        }

        const state = this.gameModel.state || this.gameModel;

        // Handle direction input
        if (input.type === INPUT_TYPES.DIRECTION && input.value) {
            if (!state.isGameOver && !state.isDying) {
                this.gameModel.setInputDirection(input.value);
                gameEvents.emit(GAME_EVENTS.DIRECTION_CHANGED, {
                    direction: input.value
                });
            }
            return;
        }

        // Handle action input
        if (input.type === INPUT_TYPES.ACTION) {
            this.handleAction(input.value, state);
        }
    }

    /**
     * Handle action input
     * @param {string} action - Action name
     * @param {Object} state - Game state
     */
    handleAction(action, state) {
        switch (action) {
        case INPUT_ACTIONS.PAUSE:
            if (!state.isGameOver && !state.isDying && !state.isPaused) {
                this.gameModel.togglePaused();
                gameEvents.emit(GAME_EVENTS.PAUSE_REQUESTED);
            } else if (state.isPaused) {
                this.gameModel.togglePaused();
                gameEvents.emit(GAME_EVENTS.RESUME_REQUESTED);
            }
            break;

        case INPUT_ACTIONS.RESUME:
            if (state.isPaused) {
                this.gameModel.togglePaused();
                gameEvents.emit(GAME_EVENTS.RESUME_REQUESTED);
            }
            break;

        case INPUT_ACTIONS.RETURN_TO_MENU:
            if (!state.isGameOver) {
                gameEvents.emit(GAME_EVENTS.RETURN_TO_MENU_REQUESTED);
            }
            break;

        case INPUT_ACTIONS.RESTART:
            gameEvents.emit(GAME_EVENTS.RESTART_LEVEL_REQUESTED);
            break;

        case INPUT_ACTIONS.TOGGLE_REPLAY:
            this.handleReplayToggle();
            break;

        case INPUT_ACTIONS.LOAD_REPLAY:
            this.handleLoadReplay();
            break;
        }
    }

    /**
     * Handle replay toggle
     */
    handleReplayToggle() {
        if (!this.replaySystem) {
            return;
        }

        if (this.replaySystem.isRecording) {
            this.replaySystem.stopRecording();
        } else if (!this.replaySystem.isReplaying) {
            this.replaySystem.startRecording();
        }
    }

    /**
     * Handle load replay
     */
    handleLoadReplay() {
        if (!this.replaySystem || this.replaySystem.isReplaying) {
            return;
        }

        const recordings = this.replaySystem.getRecordings();
        if (recordings.length > 0) {
            const lastRecording = recordings[recordings.length - 1];
            this.replaySystem.loadRecording(lastRecording);
        }
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
        this.gameModel = null;
        this.replaySystem = null;
    }
}

export default GameController;
