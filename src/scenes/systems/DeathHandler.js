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
        this.scene.pacman.die();
    }

    /**
     * Update death animation
     * @param {number} deltaSeconds - Time since last update in seconds
     * @returns {boolean} True if death animation complete
     */
    update(deltaSeconds) {
        if (!this.gameModel.isDying) {
            return false;
        }

        const result = this.gameModel.step(deltaSeconds);
        if (result?.event === 'respawn') {
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
        return this.gameModel.isDying;
    }

    /**
     * Reset death handler
     */
    reset() {
        this.gameModel.deathTimer = 0;
        this.gameModel.isDying = false;
    }
}
