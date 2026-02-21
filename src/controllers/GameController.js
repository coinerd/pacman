/**
 * GameController
 * Translates raw input into model intents and scene-level actions.
 * The GameModel remains unaware of Phaser objects and rendering concerns.
 */

import { gameEvents, GAME_EVENTS } from '../core/EventBus.js';

/**
 * @typedef {Object} GameInputState
 * @property {Object|null} direction
 * @property {boolean} pause
 * @property {boolean} replayToggle
 * @property {boolean} [returnToMenu]
 * @property {boolean} [loadReplay]
 */

export class GameController {
    /**
     * @param {Object} options
     * @param {Object} options.scene
     * @param {Object} options.gameModel
     * @param {Object} options.replaySystem
     * @param {Object} options.inputManager
     */
    constructor({ scene, gameModel, replaySystem, inputManager }) {
        this.scene = scene;
        this.gameModel = gameModel;
        this.replaySystem = replaySystem;
        this.inputManager = inputManager;
        this.isActive = false;
        this.unsubscribeInput = null;
    }

    /**
     * Activate the controller and start listening for input
     */
    activate() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;

        // Subscribe to input manager events
        if (this.inputManager) {
            this.unsubscribeInput = this.inputManager.onInput((input) => {
                this.handleInput(input);
            });
        }
    }

    /**
     * Deactivate the controller and stop listening for input
     */
    deactivate() {
        this.isActive = false;
        if (this.unsubscribeInput) {
            this.unsubscribeInput();
            this.unsubscribeInput = null;
        }
    }

    /**
     * @param {GameInputState} inputState
     */
    handleInput(inputState) {
        if (!inputState || !this.isActive) {
            return;
        }

        const { direction, pause, replayToggle, returnToMenu, loadReplay } = inputState;
        const gameState = this.gameModel.state;

        if (direction && !gameState.isDying) {
            this.gameModel.setInputDirection(direction);
            gameEvents.emit(GAME_EVENTS.DIRECTION_CHANGED, { direction });
        }

        if (pause) {
            this.handlePause();
        }

        if (returnToMenu) {
            this.handleReturnToMenu();
        }

        if (replayToggle) {
            this.handleReplayToggle();
        }

        if (loadReplay) {
            this.handleLoadReplay();
        }
    }

    handlePause() {
        const gameState = this.gameModel.state;
        if (!gameState.isGameOver && !gameState.isDying) {
            const isPaused = this.gameModel.togglePaused();
            if (isPaused) {
                this.scene.scene.pause();
                this.scene.scene.launch('PauseScene');
            }
        }
    }

    handleReturnToMenu() {
        if (!this.gameModel.isGameOver) {
            this.scene.cleanup();
            this.scene.scene.start('MenuScene');
        }
    }

    handleReplayToggle() {
        if (this.replaySystem) {
            if (this.replaySystem.isRecording) {
                this.replaySystem.stopRecording();
            } else if (!this.replaySystem.isReplaying) {
                this.replaySystem.startRecording();
            }
        }
    }

    handleLoadReplay() {
        if (this.replaySystem && !this.replaySystem.isReplaying) {
            const recordings = this.replaySystem.getRecordings();
            if (recordings.length > 0) {
                const lastRecording = recordings[recordings.length - 1];
                this.replaySystem.loadRecording(lastRecording);
            }
        }
    }
}
