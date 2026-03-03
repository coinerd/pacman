/**
 * GameController
 * Simplified controller that translates input into model actions.
 * No Phaser dependencies - uses EventBus for View-layer communication.
 *
 * Phase 2: Scene-Transition Handler
 * - Listens for scene transition requests from View
 * - Emits transition events for Scene layer to handle
 */

import { gameEvents, GAME_EVENTS } from '../core/EventBus.js';
import { INPUT_ACTIONS, INPUT_TYPES } from '../input/InputAdapter.js';

export class GameController {
    /**
     * @param {Object} options
     * @param {Object} options.gameModel - The game model
     * @param {Object} options.replaySystem - Optional replay system
     * @param {InputManager} options.inputManager - Optional input manager
     * @param {Object} options.playerScoreFacade - Optional facade for player/score state
     */
    constructor({ gameModel, replaySystem = null, inputManager = null, playerScoreFacade = null } = {}) {
        this.gameModel = gameModel;
        this.replaySystem = replaySystem;
        this.inputManager = null;
        this.isActive = false;
        this.playerScoreFacade = playerScoreFacade;
        this.unsubscribeInput = null;

        // Scene transition event handlers (Phase 2)
        this.unsubscribeTransitionEvents = null;

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
     * Bind to scene transition events (Phase 2)
     * These events are emitted by SceneTransitionHandler in the View
     */
    bindSceneTransitionEvents() {
        const unsubscribers = [];

        // Game win transition
        unsubscribers.push(
            gameEvents.on('GAME_WIN', (data) => {
                this.handleSceneTransition('WinScene', data);
            })
        );

        // Game over transition
        unsubscribers.push(
            gameEvents.on('GAME_OVER', (data) => {
                this.handleSceneTransition('GameOverScene', data);
            })
        );

        // Return to menu transition
        unsubscribers.push(
            gameEvents.on('RETURN_TO_MENU', (data) => {
                this.handleSceneTransition('MenuScene', data);
            })
        );

        // Pause game transition
        unsubscribers.push(
            gameEvents.on('PAUSE_GAME', (data) => {
                gameEvents.emit(GAME_EVENTS.PAUSE_REQUESTED, data);
            })
        );

        // Open settings transition
        unsubscribers.push(
            gameEvents.on('OPEN_SETTINGS', (data) => {
                this.handleSceneTransition('SettingsScene', data);
            })
        );

        // Generic navigation event (fallback)
        unsubscribers.push(
            gameEvents.on('NAVIGATE_TO_SCENE', (data) => {
                this.handleSceneTransition(data.sceneKey, data.data);
            })
        );

        this.unsubscribeTransitionEvents = () => {
            unsubscribers.forEach(unsub => unsub());
            this.unsubscribeTransitionEvents = null;
        };
    }

    /**
     * Handle scene transition (Phase 2)
     * Note: Actual scene.start() is handled by the Scene layer, not by Controller
     * This method just re-emits the event for the Scene layer to handle
     * @param {string} sceneKey - Target scene key
     * @param {Object} data - Optional data to pass to scene
     */
    handleSceneTransition(sceneKey, data = {}) {
        // Re-emit as a scene transition event for the Scene layer
        gameEvents.emit(`SCENE_TRANSITION:${sceneKey}`, data);
    }

    /**
     * Unbind scene transition events
     */
    unbindSceneTransitionEvents() {
        if (this.unsubscribeTransitionEvents) {
            this.unsubscribeTransitionEvents();
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

        const facadeState = this.playerScoreFacade?.getPlayerState?.();
        const state = facadeState || this.gameModel.state || this.gameModel;

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

        // Cleanup scene transition events (Phase 2)
        this.unbindSceneTransitionEvents();

        this.inputManager = null;
        this.gameModel = null;
        this.replaySystem = null;
        this.playerScoreFacade = null;
    }
};
