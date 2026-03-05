/**
 * LevelManager
 * Manages level-specific settings and configuration
 */

import { levelConfig } from '../../config/gameConfig.js';
import MazeGenerator from '../../utils/MazeGenerator.js';
import { countPellets } from '../../utils/MazeLayout.js';

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

        // Apply to model ghosts
        for (const ghost of this.gameModel.ghosts) {
            if (!ghost.isEaten) {
                ghost.setSpeedMultiplier(speedMultiplier);
            }
        }

        this.currentFrightenedDuration = this.gameModel.getFrightenedDuration();
    }

    /**
	 * Generate new maze for level change
	 * @param {number} level - New level number
	 * @returns {Object} - Maze data
	 */
    generateMazeForLevel(level) {
        const adaptiveProfile = this.scene.adaptiveDifficultySystem?.getActiveProfile?.();
        const complexity = adaptiveProfile?.mazeComplexity || 1;

        const mazeData = MazeGenerator.generate({
            width: 25,
            height: 33,
            pathDensity: Math.max(0.45, Math.min(0.9, (0.6 + level * 0.05) * complexity)),
            deadEndFactor: Math.max(0.15, Math.min(0.55, (0.4 - level * 0.02) * complexity)),
            symmetry: level % 2 === 0 ? 'horizontal' : 'vertical',
            cellularAutomataIterations: 0,
            seed: Date.now() + level * 1000
        });

        return mazeData;
    }

    /**
	 * Start new level with maze regeneration
	 * @param {number} level - New level number
	 */
    startNewLevel(level) {
        const newMaze = this.generateMazeForLevel(level);
        this.gameModel.maze = newMaze.maze;
        this.gameModel.pelletGrid = newMaze.pelletGrid;

        this.gameModel.totalPellets = countPellets(this.gameModel.pelletGrid);
        this.gameModel.pelletsRemaining = this.gameModel.totalPellets;

        this.applySettings();
    }

    /**
	 * Get current frightened duration for level
	 * @returns {number} Frightened duration in seconds
	 */
    getFrightenedDuration() {
        return this.currentFrightenedDuration;
    }
}
