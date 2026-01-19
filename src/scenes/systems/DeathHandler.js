/**
 * DeathHandler
 * Manages death animation and respawn logic
 */

import { animationConfig } from '../../config/gameConfig.js';

export class DeathHandler {
    /**
     * Create DeathHandler
     * @param {Object} gameScene - The GameScene instance
     * @param {Object} gameState - Game state object
     */
    constructor(gameScene, gameState) {
        this.scene = gameScene;
        this.gameState = gameState;
        this.deathTimer = 0;
        this.isDying = false;
    }

    /**
     * Handle death sequence
     */
    handleDeath() {
        this.isDying = true;
        this.gameState.isDying = true;
        this.deathTimer = 0;
        this.scene.pacman.die();
        this.scene.soundManager.playDeath();
    }

    /**
     * Update death animation
     * @param {number} deltaSeconds - Time since last update in seconds
     * @returns {boolean} True if death animation complete
     */
    update(deltaSeconds) {
        if (!this.isDying) {return false;}

        this.deathTimer += deltaSeconds;

        if (this.deathTimer >= animationConfig.deathPauseDuration) {
            this.deathTimer = 0;
            this.isDying = false;

            if (this.gameState.lives <= 0) {
                this.scene.gameFlowController.handleGameOver();
            } else {
                this.gameState.lives--;
                this.scene.resetPositions();
                this.scene.uiController.showReadyMessage();
            }
            return true;
        }
        return false;
    }

    /**
     * Check if currently dying
     * @returns {boolean} True if dying
     */
    isDying() {
        return this.isDying;
    }

    /**
     * Reset death handler
     */
    reset() {
        this.deathTimer = 0;
        this.isDying = false;
    }
}
