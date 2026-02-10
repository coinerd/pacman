/**
 * GameFlowController
 * Manages game state, scoring, level progression, and win/lose conditions
 */

export class GameFlowController {
    /**
     * Create GameFlowController
     * @param {Object} gameScene - The GameScene instance
     */
    constructor(gameScene) {
        this.scene = gameScene;
        this.gameModel = gameScene.gameModel;
        this.storageManager = gameScene.storageManager;
        this.soundManager = gameScene.soundManager;
    }

    /**
     * Handle pellet eaten event
     * @param {number} score - Score to add
     */
    handlePelletEaten(score, pelletsRemaining) {
        this.gameModel.onPelletEaten(score, pelletsRemaining);
        this.soundManager.playWakaWaka();
    }

    /**
     * Handle power pellet eaten event
     * @param {number} score - Score to add
     * @param {number} duration - Frightened duration in seconds
     */
    handlePowerPelletEaten(score, duration, pelletsRemaining) {
        this.gameModel.onPowerPelletEaten(score, pelletsRemaining);

        const ghosts = this.scene.ghosts;
        for (const ghost of ghosts) {
            if (!ghost.isEaten) {
                ghost.setFrightened(duration);
            }
        }

        this.soundManager.playPowerPellet();
    }

    /**
     * Handle ghost collision result
     * @param {Object} result - Collision result object
     */
    handleGhostCollision(result) {
        if (result.type === 'ghost_eaten') {
            this.gameModel.onGhostEaten(result.score);
            this.soundManager.playGhostEaten();
        } else if (result.type === 'pacman_died') {
            this.gameModel.onPacmanDeath();
            this.scene.deathHandler.handleDeath();
            this.soundManager.playDeath();
        }
    }

    /**
     * Handle fruit eaten event
     */
    handleFruitEaten() {
        this.gameModel.onFruitEaten(this.scene.fruit.getScore());
        this.soundManager.playFruitEat();
        this.scene.fruit.deactivate();
    }

    /**
     * Handle level completion (win)
     */
    handleWin() {
        this.gameModel.onLevelComplete();
        this.soundManager.playLevelComplete();
        this.storageManager.saveHighScore(this.gameModel.score);

        this.scene.scene.start('WinScene', {
            score: this.gameModel.score,
            level: this.gameModel.level,
            highScore: this.gameModel.highScore
        });
    }

    /**
     * Handle game over
     */
    handleGameOver() {
        this.gameModel.setGameOver(true);
        this.storageManager.saveHighScore(this.gameModel.score);

        this.scene.scene.start('GameOverScene', {
            score: this.gameModel.score,
            highScore: this.gameModel.highScore
        });
    }

    /**
     * Decrement lives counter
     * @returns {boolean} True if game over (no lives left)
     */
    decrementLives() {
        return this.gameModel.decrementLives();
    }
}
