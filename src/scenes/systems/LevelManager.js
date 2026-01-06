/**
 * LevelManager
 * Manages level-specific settings and configuration
 */

import { levelConfig } from '../../config/gameConfig.js';

export class LevelManager {
    /**
     * Create LevelManager
     * @param {Object} gameScene - The GameScene instance
     * @param {Object} gameState - Game state object
     */
    constructor(gameScene, gameState) {
        this.scene = gameScene;
        this.gameState = gameState;
    }

    /**
     * Apply level-specific settings
     */
    applySettings() {
        const level = this.gameState.level;

        const speedMultiplier = 1 + (level - 1) * 0.05;

        for (const ghost of this.scene.ghosts) {
            if (!ghost.isEaten) {
                ghost.setSpeedMultiplier(speedMultiplier);
            }
        }

        this.currentFrightenedDuration = Math.max(
            2000,
            levelConfig.frightenedDuration - (level - 1) * levelConfig.frightenedDecreasePerLevel
        );
    }

    /**
     * Get current frightened duration for level
     * @returns {number} Frightened duration in milliseconds
     */
    getFrightenedDuration() {
        return this.currentFrightenedDuration;
    }
}
