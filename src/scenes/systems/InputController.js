/**
 * InputController
 * Handles all user input including keyboard and touch controls
 */

import { directions } from '../../config/gameConfig.js';

export class InputController {
    /**
     * Create InputController
     * @param {Object} gameScene - The GameScene instance
     * @param {Object} gameController - The GameController instance
     */
    constructor(gameScene, gameController) {
        this.scene = gameScene;
        this.gameController = gameController;
        this.cursors = null;
        this.wasd = null;
        this.pendingActions = {
            pause: false,
            replayToggle: false,
            returnToMenu: false,
            loadReplay: false
        };
        this.setupInput();
    }

    /**
     * Setup keyboard input
     */
    setupInput() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys('W,A,S,D');

        this.scene.input.keyboard.on('keydown-P', () => {
            this.pendingActions.pause = true;
        });

        this.scene.input.keyboard.on('keydown-ESC', () => {
            this.pendingActions.returnToMenu = true;
        });

        this.scene.input.keyboard.on('keydown-R', () => {
            this.pendingActions.replayToggle = true;
        });

        this.scene.input.keyboard.on('keydown-L', () => {
            this.pendingActions.loadReplay = true;
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

        this.gameController.handleInput({
            direction: newDirection,
            pause: this.pendingActions.pause,
            replayToggle: this.pendingActions.replayToggle,
            returnToMenu: this.pendingActions.returnToMenu,
            loadReplay: this.pendingActions.loadReplay
        });

        this.pendingActions.pause = false;
        this.pendingActions.replayToggle = false;
        this.pendingActions.returnToMenu = false;
        this.pendingActions.loadReplay = false;
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
