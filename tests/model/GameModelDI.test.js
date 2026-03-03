/**
 * GameModelDI Tests
 * Phase 4: Dependency Injection Pattern
 * Mit besseren Mocks
 */

import GameModelDI from '../../src/model/core/GameModelDI.js';
import { globalContainer, ServiceContainer } from '../../src/core/ServiceContainer.js';

// Mock Services
function createMockGameState(config) {
    return {
        level: config.level || 1,
        lives: config.lives || 3,
        score: config.score || 0,
        highScore: config.highScore || 0,
        isPaused: false,
        isGameOver: false,
        isDying: false,
        deathTimer: 0,
        updateProfiling: jest.fn(),
        startProfiling: jest.fn()
    };
}

function createMockLevelSystem() {
    return {
        getLevelConfig: jest.fn(() => ({
            scatterDuration: 7,
            chaseDuration: 20
        })),
        getFrightenedDuration: jest.fn(() => 8),
        setLevel: jest.fn(),
        getLevel: jest.fn(() => 1)
    };
}

function createMockSpawningSystem() {
    const maze = Array(20).fill(null).map(() => Array(20).fill(0));
    const pelletGrid = Array(20).fill(null).map(() => Array(20).fill(0));
    const spawnPoints = {
        pacman: { x: 10, y: 15 },
        ghosts: [
            { x: 10, y: 10, type: 'red' },
            { x: 9, y: 10, type: 'pink' },
            { x: 11, y: 10, type: 'cyan' },
            { x: 10, y: 9, type: 'orange' }
        ]
    };

    return {
        getMaze: jest.fn(() => maze),
        getPelletGrid: jest.fn(() => pelletGrid),
        getSpawnPoints: jest.fn(() => spawnPoints),
        generateMazeForLevel: jest.fn(),
        setMaze: jest.fn(),
        getPelletsRemaining: jest.fn(() => 100)
    };
}

function createMockEntityRegistry(config) {
    return {
        getPacman: jest.fn(() => ({
            id: 'pacman',
            gridX: 10,
            gridY: 15,
            x: 200,
            y: 300,
            direction: 0,
            isMoving: false,
            update: jest.fn()
        })),
        getGhosts: jest.fn(() => [
            { id: 'ghost-red', gridX: 10, gridY: 10, x: 200, y: 200, type: 'red', isFrightened: false, isEaten: false, inHouse: true },
            { id: 'ghost-pink', gridX: 9, gridY: 10, x: 180, y: 200, type: 'pink', isFrightened: false, isEaten: false, inHouse: true },
            { id: 'ghost-cyan', gridX: 11, gridY: 10, x: 220, y: 200, type: 'cyan', isFrightened: false, isEaten: false, inHouse: true },
            { id: 'ghost-orange', gridX: 10, gridY: 9, x: 200, y: 180, type: 'orange', isFrightened: false, isEaten: false, inHouse: true }
        ]),
        getFruit: jest.fn(() => null),
        resetPositions: jest.fn(),
        update: jest.fn()
    };
}

function createMockCollisionHandler(config) {
    return {
        checkAllCollisions: jest.fn(() => []),
        checkPelletCollision: jest.fn(),
        checkGhostCollision: jest.fn(),
        checkFruitCollision: jest.fn(),
        reset: jest.fn()
    };
}

function createMockMovementSystem() {
    return {
        update: jest.fn(() => []),
        registerEntity: jest.fn(),
        unregisterEntity: jest.fn(),
        setDirection: jest.fn(),
        getMovementState: jest.fn(),
        setFrightened: jest.fn(),
        setEaten: jest.fn(),
        resetEntity: jest.fn(),
        reset: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn()
    };
}

describe('GameModelDI', () => {
    beforeEach(() => {
        // Clear container before each test
        globalContainer.clear();

        // Register mock services
        globalContainer.register('gameState', (container) => createMockGameState({}), true);
        globalContainer.register('levelSystem', (container) => createMockLevelSystem(), true);
        globalContainer.register('spawningSystem', (container) => createMockSpawningSystem(), true);
        globalContainer.register('entityRegistry', (container) => createMockEntityRegistry({}), true);
        globalContainer.register('collisionHandler', (container) => createMockCollisionHandler({}), true);
        globalContainer.register('movementSystem', (container) => createMockMovementSystem(), true);
    });

    afterEach(() => {
        // Clean up after each test
        globalContainer.clear();
    });

    describe('Dependency Injection', () => {
        test('should create model with DI enabled', () => {
            const model = new GameModelDI({ level: 1 }, true);

            expect(model.useDI).toBe(true);
            expect(model.gameState).toBeDefined();
            expect(model.levelSystem).toBeDefined();
            expect(model.spawningSystem).toBeDefined();
            expect(model.entityRegistry).toBeDefined();
            expect(model.collisionHandler).toBeDefined();
            expect(model.movementSystem).toBeDefined();
        });

        test('should use singleton services from container', () => {
            const model = new GameModelDI({ level: 1 }, true);

            // Get the same service twice
            const gameState1 = globalContainer.get('gameState');
            const gameState2 = globalContainer.get('gameState');

            // Should be the same instance (singleton)
            expect(gameState1).toBe(gameState2);
            expect(gameState1).toBe(model.gameState);
        });

        test('should get DI statistics', () => {
            const model = new GameModelDI({ level: 1 }, true);
            const stats = model.getDIStats();

            expect(stats.usingDI).toBe(true);
            expect(stats.serviceStats).toContain('gameState');
            expect(stats.serviceStats).toContain('levelSystem');
            expect(stats.serviceStats).toContain('spawningSystem');
            expect(stats.instantiatedStats).toContain('gameState');
        });
    });

    describe('Initialization', () => {
        test('should initialize with custom configuration', () => {
            const config = {
                level: 5,
                lives: 5,
                score: 1000,
                highScore: 5000
            };

            const model = new GameModelDI(config, true);

            expect(model.level).toBe(5);
            expect(model.lives).toBe(5);
            expect(model.score).toBe(1000);
            expect(model.highScore).toBe(5000);
        });

        test('should initialize with default configuration', () => {
            const model = new GameModelDI({}, true);

            expect(model.level).toBe(1);
            expect(model.lives).toBe(3);
            expect(model.score).toBe(0);
            expect(model.highScore).toBe(0);
        });
    });

    describe('State Management', () => {
        test('should delegate to gameState for properties', () => {
            const model = new GameModelDI({ level: 3, score: 500 }, true);

            expect(model.level).toBe(3);
            expect(model.score).toBe(500);

            // Modify state
            model.level = 4;
            model.score = 600;

            expect(model.level).toBe(4);
            expect(model.score).toBe(600);
        });

        test('should handle pause state', () => {
            const model = new GameModelDI({}, true);

            expect(model.isPaused).toBe(false);

            model.setPaused(true);
            expect(model.isPaused).toBe(true);

            model.togglePaused();
            expect(model.isPaused).toBe(false);
        });

        test('should handle game over state', () => {
            const model = new GameModelDI({}, true);

            expect(model.isGameOver).toBe(false);

            model.setGameOver(true);
            expect(model.isGameOver).toBe(true);
        });
    });

    describe('Update Loop', () => {
        test('should step without crashing', () => {
            const model = new GameModelDI({ level: 1 }, true);

            const events = model.step(0.016);

            expect(Array.isArray(events)).toBe(true);
        });

        test('should handle input direction', () => {
            const model = new GameModelDI({ level: 1 }, true);

            // Set desired direction
            model.setDesiredDirection(2); // LEFT

            const events = model.step(0.016, { direction: 2 });

            expect(Array.isArray(events)).toBe(true);
        });

        test('should pause updates when paused', () => {
            const model = new GameModelDI({ level: 1 }, true);

            model.setPaused(true);

            const events = model.step(0.016);

            expect(events).toEqual([]);
        });
    });

    describe('High Score Tracking', () => {
        test('should update high score when score exceeds it', () => {
            const model = new GameModelDI({ highScore: 100 }, true);

            model.score = 150;
            model.checkHighScore();

            expect(model.highScore).toBe(150);
        });

        test('should not update high score when score is lower', () => {
            const model = new GameModelDI({ highScore: 100 }, true);

            model.score = 50;
            model.checkHighScore();

            expect(model.highScore).toBe(100);
        });
    });

    describe('Snapshots', () => {
        test('should get snapshot', () => {
            const model = new GameModelDI({ level: 2, score: 500 }, true);

            const snapshot = model.getSnapshot();

            expect(snapshot.level).toBe(2);
            expect(snapshot.score).toBe(500);
            expect(snapshot.pacman).toBeDefined();
            expect(snapshot.ghosts).toBeDefined();
        });

        test('should serialize snapshot', () => {
            const model = new GameModelDI({ level: 1 }, true);

            const serialized = model.serialize();

            expect(typeof serialized).toBe('string');

            const parsed = JSON.parse(serialized);
            expect(parsed.level).toBe(1);
        });
    });

    describe('Backward Compatibility', () => {
        test('should provide state property for legacy code', () => {
            const model = new GameModelDI({ level: 1 }, true);

            expect(model.state).toBe(model);
        });
    });

    describe('Stats', () => {
        test('should get stats', () => {
            const model = new GameModelDI({ level: 1 }, true);

            // Step a few times to generate stats
            model.step(0.016);
            model.step(0.016);
            model.step(0.016);

            const stats = model.getStats();

            expect(stats).toBeDefined();
            expect(stats.movement).toBeDefined();
            expect(stats.collision).toBeDefined();
        });
    });
});

describe('ServiceContainer', () => {
    beforeEach(() => {
        globalContainer.clear();
    });

    test('should register and retrieve singleton services', () => {
        const factory = (container) => ({ id: 'service1' });

        globalContainer.register('testService', factory, true);

        const instance1 = globalContainer.get('testService');
        const instance2 = globalContainer.get('testService');

        expect(instance1).toBe(instance2);
        expect(instance1.id).toBe('service1');
    });

    test('should register and retrieve transient services', () => {
        let counter = 0;
        const factory = (container) => ({ id: counter++ });

        globalContainer.register('testService', factory, false);

        const instance1 = globalContainer.get('testService');
        const instance2 = globalContainer.get('testService');

        expect(instance1).not.toBe(instance2);
        expect(instance1.id).toBe(0);
        expect(instance2.id).toBe(1);
    });

    test('should throw error when service not registered', () => {
        expect(() => {
            globalContainer.get('nonexistent');
        }).toThrow('Service \'nonexistent\' is not registered');
    });

    test('should clear all services', () => {
        const factory = (container) => ({ id: 'test' });

        globalContainer.register('testService', factory, true);
        globalContainer.get('testService');

        expect(globalContainer.has('testService')).toBe(true);

        globalContainer.clear();

        expect(globalContainer.has('testService')).toBe(false);
    });

    test('should get service names', () => {
        const factory = (container) => ({ id: 'test' });

        globalContainer.register('service1', factory, true);
        globalContainer.register('service2', factory, false);

        const names = globalContainer.getServiceNames();

        expect(names).toContain('service1');
        expect(names).toContain('service2');
    });
});
