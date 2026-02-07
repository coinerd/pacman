/**
 * LevelManager
 * Manages level-specific settings and configuration
 */

import { levelConfig } from '../../config/gameConfig.js';

export class LevelManager {
    /**
     * Create LevelManager
     * @param {Object} gameScene - The GameScene instance
     * @param {Object} gameModel - Game model
     */
    constructor(gameScene, gameModel) {
        this.scene = gameScene;
        this.gameModel = gameModel;
        this.gameModel.setLevelConfig(levelConfig);
    }

    /**
     * Apply level-specific settings
     */
    applySettings() {
        const speedMultiplier = this.gameModel.getSpeedMultiplier();

        for (const ghost of this.scene.ghosts) {
            if (!ghost.isEaten) {
                ghost.setSpeedMultiplier(speedMultiplier);
            }
        }
        this.currentFrightenedDuration = this.gameModel.getFrightenedDuration();
    }

    /**
     * Get current frightened duration for level
     * @returns {number} Frightened duration in seconds
     */
    getFrightenedDuration() {
        return this.currentFrightenedDuration;
    }
}
