/**
 * GameModel Game Flow Tests
 * Comprehensive tests for game state transitions, game flow, and core mechanics
 */

import GameModel from '../../src/model/core/GameModel.js';

describe('GameModel - Game Flow', () => {
    let model;

    beforeEach(() => {
        model = new GameModel({
            level: 1,
            score: 0,
            lives: 3,
            highScore: 1000
        });
    });

    afterEach(() => {
        if (model) {
            model = null;
        }
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            const defaultModel = new GameModel();
            expect(defaultModel.level).toBe(1);
            expect(defaultModel.lives).toBe(3);
            expect(defaultModel.score).toBe(0);
            expect(defaultModel.isPaused).toBe(false);
            expect(defaultModel.isGameOver).toBe(false);
        });

        test('should initialize with custom configuration', () => {
            expect(model.level).toBe(1);
            expect(model.score).toBe(0);
            expect(model.lives).toBe(3);
            expect(model.highScore).toBe(1000);
        });

        test('should initialize all core systems', () => {
            expect(model.gameState).toBeDefined();
            expect(model.levelSystem).toBeDefined();
            expect(model.spawningSystem).toBeDefined();
            expect(model.entityRegistry).toBeDefined();
            expect(model.collisionHandler).toBeDefined();
            expect(model.movementSystem).toBeDefined();
        });

        test('should initialize feature systems', () => {
            expect(model.bossBattleSystem).toBeDefined();
            expect(model.additionalPowerUpSystem).toBeDefined();
            expect(model.storyMode).toBeDefined();
        });

        test('should initialize maze and pellet grid via spawningSystem', () => {
            const maze = model.spawningSystem.getMaze();
            const pelletGrid = model.spawningSystem.getPelletGrid();
            expect(maze).toBeDefined();
            expect(pelletGrid).toBeDefined();
        });

        test('should initialize pacman entity', () => {
            expect(model.pacman).toBeDefined();
        });

        test('should initialize ghost entities', () => {
            expect(model.ghosts).toBeDefined();
            expect(Array.isArray(model.ghosts)).toBe(true);
            expect(model.ghosts.length).toBeGreaterThan(0);
        });

        test('should initialize fruit entity', () => {
            expect(model.fruit).toBeDefined();
        });
    });

    describe('State Properties', () => {
        test('should get and set level', () => {
            model.level = 2;
            expect(model.level).toBe(2);
        });

        test('should get and set score', () => {
            model.score = 500;
            expect(model.score).toBe(500);
        });

        test('should get and set high score', () => {
            model.highScore = 2000;
            expect(model.highScore).toBe(2000);
        });

        test('should get and set lives', () => {
            model.lives = 2;
            expect(model.lives).toBe(2);
        });

        test('should get and set pause state', () => {
            model.isPaused = true;
            expect(model.isPaused).toBe(true);
        });

        test('should get and set game over state', () => {
            model.isGameOver = true;
            expect(model.isGameOver).toBe(true);
        });

        test('should get and set dying state', () => {
            model.isDying = true;
            expect(model.isDying).toBe(true);
        });
    });

    describe('Pause/Resume', () => {
        test('should have pause state', () => {
            expect(model.isPaused).toBeDefined();
        });

        test('should toggle pause state via gameState', () => {
            const initialState = model.gameState.isPaused;
            model.gameState.isPaused = !initialState;
            expect(model.gameState.isPaused).toBe(!initialState);
        });

        test('should have game over state', () => {
            expect(model.isGameOver).toBeDefined();
        });
    });

    describe('Game Over', () => {
        test('should set game over state via gameState', () => {
            model.gameState.isGameOver = true;
            expect(model.isGameOver).toBe(true);
        });

        test('should have game over property', () => {
            expect(model.gameState.isGameOver).toBeDefined();
        });
    });

    describe('Step/Update Loop', () => {
        test('should have gameState for updates', () => {
            expect(model.gameState).toBeDefined();
        });

        test('should have tick counter', () => {
            expect(model.gameState.tickCount).toBeDefined();
        });

        test('should have movementSystem', () => {
            expect(model.movementSystem).toBeDefined();
        });

        test('should have collisionHandler', () => {
            expect(model.collisionHandler).toBeDefined();
        });
    });

    describe('Input Handling', () => {
        test('should have input direction property', () => {
            expect(model.inputDirection).toBeDefined();
        });

        test('should have desired direction property', () => {
            expect(model.desiredDirection).toBeDefined();
        });

        test('should set input direction', () => {
            model.setInputDirection(1); // RIGHT
            expect(model.inputDirection).toBe(1);
        });
    });

    describe('High Score Management', () => {
        test('should update high score when score exceeds it', () => {
            model.score = 1500;
            model.checkHighScore();
            expect(model.highScore).toBe(1500);
        });

        test('should not update high score when score is lower', () => {
            const initialHighScore = model.highScore;
            model.score = 500;
            model.checkHighScore();
            expect(model.highScore).toBe(initialHighScore);
        });
    });

    describe('Level Management', () => {
        test('should start new level', () => {
            // Verify level system is configured
            expect(model.levelSystem).toBeDefined();
            model.levelSystem.setLevel(2);
            expect(model.levelSystem.getLevel()).toBe(2);
        });

        test('should advance to next level', () => {
            const initialLevel = model.levelSystem.getLevel();
            model.levelSystem.nextLevel();
            expect(model.levelSystem.getLevel()).toBe(initialLevel + 1);
        });

        test('should set level config', () => {
            const config = { speedMultiplier: 1.5 };
            model.setLevelConfig(config);
            expect(model.levelSystem.getLevelConfig().speedMultiplier).toBe(1.5);
        });
    });

    describe('Ghost Management', () => {
        test('should get ghost by type', () => {
            const ghost = model.getGhostByType('alpha');
            expect(ghost).toBeDefined();
        });

        test('should have ghosts array', () => {
            expect(Array.isArray(model.ghosts)).toBe(true);
        });

        test('should have entity registry', () => {
            expect(model.entityRegistry).toBeDefined();
        });
    });

    describe('Death Sequence', () => {
        test('should start death sequence on pacman death', () => {
            model.onPacmanDeath();
            expect(model.isDying).toBe(true);
            expect(model.levelDeaths).toBe(1);
        });

        test('should not trigger multiple deaths while dying', () => {
            model.onPacmanDeath();
            const firstDeaths = model.levelDeaths;
            model.onPacmanDeath();
            expect(model.levelDeaths).toBe(firstDeaths);
        });

        test('should have death timer in gameState', () => {
            expect(model.gameState.deathTimer).toBeDefined();
        });
    });

    describe('Snapshots', () => {
        test('should get snapshot with all properties', () => {
            const snapshot = model.getSnapshot();
            expect(snapshot).toHaveProperty('level');
            expect(snapshot).toHaveProperty('score');
            expect(snapshot).toHaveProperty('highScore');
            expect(snapshot).toHaveProperty('lives');
            expect(snapshot).toHaveProperty('isPaused');
            expect(snapshot).toHaveProperty('isGameOver');
        });

        test('should include entity snapshots', () => {
            const snapshot = model.getSnapshot();
            expect(snapshot.pacman).toBeDefined();
            expect(snapshot.ghosts).toBeDefined();
            expect(Array.isArray(snapshot.ghosts)).toBe(true);
        });

        test('should serialize to JSON', () => {
            const serialized = model.serialize();
            expect(() => JSON.parse(serialized)).not.toThrow();
        });

        test('should get stats', () => {
            const stats = model.getStats();
            expect(stats).toBeDefined();
        });
    });

    describe('Entity Access', () => {
        test('should get pacman', () => {
            expect(model.pacman).toBeDefined();
        });

        test('should get ghosts array', () => {
            expect(Array.isArray(model.ghosts)).toBe(true);
            expect(model.ghosts.length).toBeGreaterThan(0);
        });

        test('should get fruit', () => {
            expect(model.fruit).toBeDefined();
        });

        test('should get maze from spawning system', () => {
            const maze = model.spawningSystem.getMaze();
            expect(maze).toBeDefined();
        });

        test('should get pellet grid from spawning system', () => {
            const pelletGrid = model.spawningSystem.getPelletGrid();
            expect(pelletGrid).toBeDefined();
        });
    });

    describe('Pellet Management', () => {
        test('should have pellets remaining', () => {
            expect(model.pelletsRemaining).toBeGreaterThanOrEqual(0);
        });

        test('should have total pellets', () => {
            expect(model.totalPellets).toBeGreaterThan(0);
        });
    });

    describe('Backward Compatibility', () => {
        test('should provide state property for legacy code', () => {
            expect(model.state).toBeDefined();
            expect(model.state).toBe(model);
        });
    });
});
