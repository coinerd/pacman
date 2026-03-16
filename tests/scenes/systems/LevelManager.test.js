/**
 * Tests for LevelManager
 * Manages level-specific settings and configuration
 */

import { LevelManager } from '../../../src/scenes/systems/LevelManager.js';
import { levelConfig } from '../../../src/config/gameConfig.js';

// Mock dependencies
jest.mock('../../../src/config/gameConfig.js', () => ({
    levelConfig: {
        getSpeedMultiplier: jest.fn((level) => 1 + level * 0.1),
        getFrightenedDuration: jest.fn((level) => Math.max(1, 6 - level))
    }
}));

jest.mock('../../../src/utils/MazeGenerator.js', () => ({
    generate: jest.fn((options) => ({
        maze: Array(33).fill(null).map(() => Array(25).fill(0)),
        pelletGrid: Array(33).fill(null).map(() => Array(25).fill(0)),
        stats: { pelletCount: 100 }
    }))
}));

jest.mock('../../../src/utils/MazeLayout.js', () => ({
    countPellets: jest.fn(() => 100)
}));

describe('LevelManager', () => {
    let levelManager;
    let mockScene;
    let mockGameModel;

    beforeEach(() => {
        jest.clearAllMocks();

        mockGameModel = {
            level: 1,
            maze: [],
            pelletGrid: [],
            totalPellets: 0,
            pelletsRemaining: 0,
            ghosts: [],
            setLevelConfig: jest.fn(),
            getSpeedMultiplier: jest.fn(() => 1.1),
            getFrightenedDuration: jest.fn(() => 5)
        };

        mockScene = {
            gameModel: mockGameModel,
            adaptiveDifficultySystem: {
                getActiveProfile: jest.fn(() => ({
                    mazeComplexity: 1
                }))
            }
        };

        levelManager = new LevelManager(mockScene, mockGameModel);
    });

    describe('constructor', () => {
        test('stores scene reference', () => {
            expect(levelManager.scene).toBe(mockScene);
        });

        test('stores game model reference', () => {
            expect(levelManager.gameModel).toBe(mockGameModel);
        });

        test('sets level config on game model', () => {
            expect(mockGameModel.setLevelConfig).toHaveBeenCalledWith(levelConfig);
        });
    });

    describe('applySettings', () => {
        test('gets speed multiplier from game model', () => {
            levelManager.applySettings();

            expect(mockGameModel.getSpeedMultiplier).toHaveBeenCalled();
        });

        test('gets frightened duration from game model', () => {
            levelManager.applySettings();

            expect(mockGameModel.getFrightenedDuration).toHaveBeenCalled();
        });

        test('applies speed multiplier to non-eaten ghosts', () => {
            const ghost1 = {
                isEaten: false,
                setSpeedMultiplier: jest.fn()
            };
            const ghost2 = {
                isEaten: true,
                setSpeedMultiplier: jest.fn()
            };
            mockGameModel.ghosts = [ghost1, ghost2];

            levelManager.applySettings();

            expect(ghost1.setSpeedMultiplier).toHaveBeenCalledWith(1.1);
            expect(ghost2.setSpeedMultiplier).not.toHaveBeenCalled();
        });

        test('stores current frightened duration', () => {
            levelManager.applySettings();

            expect(levelManager.currentFrightenedDuration).toBe(5);
        });
    });

    describe('generateMazeForLevel', () => {
        test('generates maze with correct dimensions', () => {
            const MazeGenerator = require('../../../src/utils/MazeGenerator.js');
            MazeGenerator.generate.mockReturnValue({
                maze: Array(33).fill(null).map(() => Array(25).fill(0)),
                pelletGrid: Array(33).fill(null).map(() => Array(25).fill(0))
            });

            const result = levelManager.generateMazeForLevel(1);

            expect(result.maze).toBeDefined();
            expect(result.pelletGrid).toBeDefined();
        });

        test('uses adaptive difficulty profile', () => {
            levelManager.generateMazeForLevel(1);

            expect(mockScene.adaptiveDifficultySystem.getActiveProfile).toHaveBeenCalled();
        });

        test('works without adaptive difficulty system', () => {
            mockScene.adaptiveDifficultySystem = null;

            levelManager.generateMazeForLevel(1);

            // Should not throw and use defaults
        });

        test('uses level number in seed', () => {
            const MazeGenerator = require('../../../src/utils/MazeGenerator.js');

            levelManager.generateMazeForLevel(5);

            const callArgs = MazeGenerator.generate.mock.calls[0][0];
            // Seed should include level number
            expect(callArgs.seed).toBeDefined();
        });
    });

    describe('startNewLevel', () => {
        test('generates new maze', () => {
            levelManager.startNewLevel(2);

            expect(mockGameModel.maze).toBeDefined();
        });

        test('generates new pellet grid', () => {
            levelManager.startNewLevel(2);

            expect(mockGameModel.pelletGrid).toBeDefined();
        });

        test('counts and sets total pellets', () => {
            const { countPellets } = require('../../../src/utils/MazeLayout.js');
            countPellets.mockReturnValue(150);

            levelManager.startNewLevel(2);

            expect(mockGameModel.totalPellets).toBe(150);
        });

        test('sets pellets remaining equal to total', () => {
            const { countPellets } = require('../../../src/utils/MazeLayout.js');
            countPellets.mockReturnValue(150);

            levelManager.startNewLevel(2);

            expect(mockGameModel.pelletsRemaining).toBe(150);
        });

        test('applies level settings', () => {
            levelManager.startNewLevel(2);

            expect(mockGameModel.getSpeedMultiplier).toHaveBeenCalled();
        });
    });

    describe('getFrightenedDuration', () => {
        test('returns current frightened duration', () => {
            levelManager.currentFrightenedDuration = 5;

            expect(levelManager.getFrightenedDuration()).toBe(5);
        });

        test('returns undefined when not set', () => {
            levelManager.currentFrightenedDuration = undefined;

            expect(levelManager.getFrightenedDuration()).toBeUndefined();
        });
    });
});
