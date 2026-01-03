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
        this.gameState = gameScene.gameState;
        this.storageManager = gameScene.storageManager;
        this.soundManager = gameScene.soundManager;
    }

    /**
     * Handle pellet eaten event
     * @param {number} score - Score to add
     */
    handlePelletEaten(score) {
        this.gameState.score += score;
        this.soundManager.playWakaWaka();
    }

    /**
     * Handle power pellet eaten event
     * @param {number} score - Score to add
     * @param {number} duration - Frightened duration in ms
     */
    handlePowerPelletEaten(score, duration) {
        this.gameState.score += score;

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
            this.gameState.score += result.score;
            this.soundManager.playGhostEaten();
        } else if (result.type === 'pacman_died') {
            this.scene.deathHandler.handleDeath();
            this.soundManager.playDeath();
        }
    }

    /**
     * Handle fruit eaten event
     */
    handleFruitEaten() {
        this.gameState.score += this.scene.fruit.getScore();
        this.soundManager.playFruitEat();
        this.scene.fruit.deactivate();
    }

    /**
     * Handle level completion (win)
     */
    handleWin() {
        this.gameState.level++;
        this.soundManager.playLevelComplete();
        this.storageManager.saveHighScore(this.gameState.score);

        this.scene.scene.start('WinScene', {
            score: this.gameState.score,
            level: this.gameState.level,
            highScore: this.gameState.highScore
        });
    }

    /**
     * Handle game over
     */
    handleGameOver() {
        this.gameState.isGameOver = true;
        this.storageManager.saveHighScore(this.gameState.score);

        this.scene.scene.start('GameOverScene', {
            score: this.gameState.score,
            highScore: this.gameState.highScore
        });
    }

    /**
     * Decrement lives counter
     * @returns {boolean} True if game over (no lives left)
     */
    decrementLives() {
        this.gameState.lives--;
        return this.gameState.lives <= 0;
    }
}
