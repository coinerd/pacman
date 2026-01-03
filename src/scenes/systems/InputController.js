/**
 * InputController
 * Handles all user input including keyboard and touch controls
 */

import { directions } from '../../config/gameConfig.js';
import { gameEvents, GAME_EVENTS } from '../../core/EventBus.js';

export class InputController {
    /**
     * Create InputController
     * @param {Object} gameScene - The GameScene instance
     * @param {Object} pacman - The Pacman entity
     */
    constructor(gameScene, pacman) {
        this.scene = gameScene;
        this.pacman = pacman;
        this.cursors = null;
        this.wasd = null;
        this.setupInput();
    }

    /**
     * Setup keyboard input
     */
    setupInput() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys('W,A,S,D');

        this.scene.input.keyboard.on('keydown-P', () => {
            this.handlePause();
        });

        this.scene.input.keyboard.on('keydown-ESC', () => {
            this.handleReturnToMenu();
        });

        this.scene.input.keyboard.on('keydown-R', () => {
            this.handleReplayToggle();
        });

        this.scene.input.keyboard.on('keydown-L', () => {
            this.handleLoadReplay();
        });
    }

    /**
     * Handle directional input
     */
    handleInput() {
        let newDirection = null;

        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            newDirection = directions.LEFT;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            newDirection = directions.RIGHT;
        } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
            newDirection = directions.UP;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            newDirection = directions.DOWN;
        }

        if (newDirection) {
            this.pacman.setDirection(newDirection);
            gameEvents.emit(GAME_EVENTS.DIRECTION_CHANGED, { direction: newDirection });
        }
    }

    /**
     * Handle pause toggle
     */
    handlePause() {
        if (!this.scene.gameState.isGameOver && !this.scene.gameState.isDying) {
            this.scene.gameState.isPaused = !this.scene.gameState.isPaused;
            if (this.scene.gameState.isPaused) {
                this.scene.scene.pause();
                this.scene.scene.launch('PauseScene');
            }
        }
    }

    /**
     * Handle return to menu
     */
    handleReturnToMenu() {
        if (!this.scene.gameState.isGameOver) {
            this.scene.cleanup();
            this.scene.scene.start('MenuScene');
        }
    }

    /**
     * Handle replay toggle (record/stop)
     */
    handleReplayToggle() {
        if (this.scene.replaySystem) {
            if (this.scene.replaySystem.isRecording) {
                this.scene.replaySystem.stopRecording();
            } else if (!this.scene.replaySystem.isReplaying) {
                this.scene.replaySystem.startRecording();
            }
        }
    }

    /**
     * Handle load and play last replay
     */
    handleLoadReplay() {
        if (this.scene.replaySystem && !this.scene.replaySystem.isReplaying) {
            const recordings = this.scene.replaySystem.getRecordings();
            if (recordings.length > 0) {
                const lastRecording = recordings[recordings.length - 1];
                this.scene.replaySystem.loadRecording(lastRecording);
            }
        }
    }

    /**
     * Cleanup input handlers
     */
    cleanup() {
        if (this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.off('keydown-P');
            this.scene.input.keyboard.off('keydown-ESC');
            this.scene.input.keyboard.off('keydown-R');
            this.scene.input.keyboard.off('keydown-L');
        }
    }
}
