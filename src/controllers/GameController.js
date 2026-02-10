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
     */
    constructor({ scene, gameModel, replaySystem }) {
        this.scene = scene;
        this.gameModel = gameModel;
        this.replaySystem = replaySystem;
    }

    /**
     * @param {GameInputState} inputState
     */
    handleInput(inputState) {
        if (!inputState) {
            return;
        }

        const { direction, pause, replayToggle, returnToMenu, loadReplay } = inputState;
        const gameState = this.gameModel.state;

        if (direction && !gameState.isDying) {
            this.gameModel.setDesiredDirection(direction);
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
