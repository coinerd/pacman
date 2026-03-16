/**
 * GameState Tests
 * Comprehensive tests for game state management
 */

import { GameState } from '../../../src/model/core/GameState.js';

// Mock modules
jest.mock('../../../src/model/systems/index.js', () => ({
    SessionModule: jest.fn().mockImplementation((config) => ({
        level: config?.level || 1,
        lives: config?.lives || 3,
        levelDeaths: 0,
        isPaused: false,
        isGameOver: false,
        levelComplete: false,
        reset: jest.fn(),
        resetForLevel: jest.fn(function(level) {
            this.level = level;
        })
    })),
    ScoreModule: jest.fn().mockImplementation((config) => ({
        score: config?.score || 0,
        highScore: config?.highScore || 0,
        ghostsEaten: 0,
        currentComboGhosts: 0,
        maxComboGhosts: 0,
        pelletsEaten: 0,
        reset: jest.fn(),
        resetForLevel: jest.fn()
    })),
    PlayerModule: jest.fn().mockImplementation(() => ({}))
}));

describe('GameState', () => {
    let gameState;

    beforeEach(() => {
        gameState = new GameState({
            level: 1,
            lives: 3,
            score: 0,
            highScore: 1000,
            deathPauseDuration: 2
        });
    });

    describe('Initialization', () => {
        test('should initialize with config values', () => {
            expect(gameState.level).toBe(1);
            expect(gameState.lives).toBe(3);
            expect(gameState.score).toBe(0);
            expect(gameState.highScore).toBe(1000);
        });

        test('should initialize with default values', () => {
            const defaultState = new GameState();
            expect(defaultState.level).toBe(1);
            expect(defaultState.lives).toBe(3);
            expect(defaultState.score).toBe(0);
        });

        test('should initialize modules', () => {
            expect(gameState.sessionModule).toBeDefined();
            expect(gameState.scoreModule).toBeDefined();
        });

        test('should initialize maze state', () => {
            expect(gameState.maze).toBeNull();
            expect(gameState.pelletGrid).toBeNull();
            expect(gameState.totalPellets).toBe(0);
            expect(gameState.pelletsRemaining).toBe(0);
        });

        test('should initialize timers', () => {
            expect(gameState.deathTimer).toBe(0);
            expect(gameState.deathPauseDuration).toBe(2);
        });

        test('should initialize tick counter', () => {
            expect(gameState.tickCount).toBe(0);
        });
    });

    describe('Level & Session Properties', () => {
        test('should get and set level', () => {
            gameState.level = 5;
            expect(gameState.level).toBe(5);
        });

        test('should get and set lives', () => {
            gameState.lives = 2;
            expect(gameState.lives).toBe(2);
        });

        test('should get and set levelDeaths', () => {
            gameState.levelDeaths = 3;
            expect(gameState.levelDeaths).toBe(3);
        });
    });

    describe('Score Properties', () => {
        test('should get and set score', () => {
            gameState.score = 500;
            expect(gameState.score).toBe(500);
        });

        test('should get and set high score', () => {
            gameState.highScore = 2000;
            expect(gameState.highScore).toBe(2000);
        });

        test('should get and set ghostsEaten', () => {
            gameState.ghostsEaten = 5;
            expect(gameState.ghostsEaten).toBe(5);
        });

        test('should get and set currentComboGhosts', () => {
            gameState.currentComboGhosts = 3;
            expect(gameState.currentComboGhosts).toBe(3);
        });

        test('should get and set maxComboGhosts', () => {
            gameState.maxComboGhosts = 4;
            expect(gameState.maxComboGhosts).toBe(4);
        });

        test('should get and set pelletsEaten', () => {
            gameState.pelletsEaten = 100;
            expect(gameState.pelletsEaten).toBe(100);
        });
    });

    describe('Flags', () => {
        test('should get and set isPaused', () => {
            gameState.isPaused = true;
            expect(gameState.isPaused).toBe(true);
        });

        test('should convert isPaused to boolean', () => {
            gameState.isPaused = 1;
            expect(gameState.isPaused).toBe(true);
        });

        test('should get and set isGameOver', () => {
            gameState.isGameOver = true;
            expect(gameState.isGameOver).toBe(true);
        });

        test('should convert isGameOver to boolean', () => {
            gameState.isGameOver = 'yes';
            expect(gameState.isGameOver).toBe(true);
        });

        test('should get and set levelComplete', () => {
            gameState.levelComplete = true;
            expect(gameState.levelComplete).toBe(true);
        });
    });

    describe('Maze State', () => {
        test('should set maze and pellet grid', () => {
            const maze = [[1, 0], [0, 1]];
            const pelletGrid = [[1, 0], [0, 1]];
            gameState.setMaze(maze, pelletGrid);
            expect(gameState.maze).toBe(maze);
            expect(gameState.pelletGrid).toBe(pelletGrid);
        });

        test('should set pellet counts', () => {
            gameState.setPelletCounts(100, 80);
            expect(gameState.totalPellets).toBe(100);
            expect(gameState.pelletsRemaining).toBe(80);
        });
    });

    describe('Level Configuration', () => {
        test('should set level config', () => {
            const config = { speedMultiplier: 1.5 };
            gameState.setLevelConfig(config);
            expect(gameState.levelConfig).toBe(config);
        });

        test('should get level config', () => {
            const config = { speedMultiplier: 1.5 };
            gameState.setLevelConfig(config);
            expect(gameState.getLevelConfig()).toBe(config);
        });
    });

    describe('Death Timer', () => {
        test('should start death timer at 0', () => {
            gameState.startDeathTimer();
            expect(gameState.deathTimer).toBe(0);
        });

        test('should update death timer', () => {
            gameState.startDeathTimer();
            gameState.updateDeathTimer(0.5);
            expect(gameState.deathTimer).toBe(0.5);
        });

        test('should accumulate death timer', () => {
            gameState.startDeathTimer();
            gameState.updateDeathTimer(0.5);
            gameState.updateDeathTimer(0.5);
            expect(gameState.deathTimer).toBe(1);
        });

        test('should detect death complete', () => {
            gameState.startDeathTimer();
            gameState.updateDeathTimer(2);
            expect(gameState.isDeathComplete()).toBe(true);
        });

        test('should not detect death complete before duration', () => {
            gameState.startDeathTimer();
            gameState.updateDeathTimer(1);
            expect(gameState.isDeathComplete()).toBe(false);
        });

        test('should use custom death pause duration', () => {
            const customState = new GameState({ deathPauseDuration: 3 });
            customState.startDeathTimer();
            customState.updateDeathTimer(2);
            expect(customState.isDeathComplete()).toBe(false);
            customState.updateDeathTimer(1);
            expect(customState.isDeathComplete()).toBe(true);
        });
    });

    describe('Tick Counter', () => {
        test('should increment tick', () => {
            gameState.incrementTick();
            expect(gameState.tickCount).toBe(1);
        });

        test('should get tick count', () => {
            gameState.incrementTick();
            gameState.incrementTick();
            expect(gameState.getTick()).toBe(2);
        });

        test('should accumulate ticks', () => {
            for (let i = 0; i < 10; i++) {
                gameState.incrementTick();
            }
            expect(gameState.tickCount).toBe(10);
        });
    });

    describe('Profiling', () => {
        test('should start profiling', () => {
            gameState.startProfiling();
            expect(gameState.lastUpdateTime).toBeGreaterThan(0);
            expect(gameState.updateCount).toBe(0);
        });

        test('should update profiling count', () => {
            gameState.startProfiling();
            gameState.updateProfiling();
            gameState.updateProfiling();
            expect(gameState.updateCount).toBe(2);
        });

        test('should get profiling stats', () => {
            gameState.startProfiling();
            gameState.updateProfiling();
            const stats = gameState.getProfilingStats();
            expect(stats.updateCount).toBe(1);
            expect(stats.updateTime).toBeDefined();
            expect(stats.avgUpdateMs).toBeDefined();
        });
    });

    describe('Reset', () => {
        test('should reset for level', () => {
            gameState.level = 5;
            gameState.levelDeaths = 3;
            gameState.deathTimer = 1;

            gameState.resetForLevel(2);

            expect(gameState.level).toBe(2);
            expect(gameState.levelDeaths).toBe(0);
            expect(gameState.deathTimer).toBe(0);
        });

        test('should fully reset', () => {
            gameState.level = 5;
            gameState.tickCount = 100;
            gameState.deathTimer = 1;

            gameState.reset();

            // Reset clears tick count and death timer
            expect(gameState.tickCount).toBe(0);
            expect(gameState.deathTimer).toBe(0);
        });
    });
});
