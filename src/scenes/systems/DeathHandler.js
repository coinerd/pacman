/**
 * DeathHandler
 * Manages death animation and respawn logic
 */

export class DeathHandler {
    /**
     * Create DeathHandler
     * @param {Object} gameScene - The GameScene instance
     * @param {Object} gameModel - Game model
     */
    constructor(gameScene, gameModel) {
        this.scene = gameScene;
        this.gameModel = gameModel;
    }

    /**
     * Handle death sequence
     */
    handleDeath() {
        this.gameModel.beginDeath();
        this.scene.pacman.die();
        this.scene.soundManager.playDeath();
    }

    /**
     * Update death animation
     * @param {number} deltaSeconds - Time since last update in seconds
     * @returns {boolean} True if death animation complete
     */
    update(deltaSeconds) {
        if (!this.gameModel.state.isDying) {
            return false;
        }

        const result = this.gameModel.step(deltaSeconds);
        if (result?.event === 'gameOver') {
            this.scene.gameFlowController.handleGameOver();
        } else if (result?.event === 'respawn') {
            this.scene.resetPositions();
            this.scene.uiController.showReadyMessage();
        }

        return true;
    }

    /**
     * Check if currently dying
     * @returns {boolean} True if dying
     */
    isDying() {
        return this.gameModel.state.isDying;
    }

    /**
     * Reset death handler
     */
    reset() {
        this.gameModel.state.deathTimer = 0;
        this.gameModel.state.isDying = false;
    }
}
