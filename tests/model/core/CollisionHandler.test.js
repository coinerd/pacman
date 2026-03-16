/**
 * CollisionHandler Tests
 * Comprehensive tests for collision detection and handling
 */

import { CollisionHandler } from '../../../src/model/core/CollisionHandler.js';

// Mock gameConfig
jest.mock('../../../src/config/gameConfig.js', () => ({
    gameConfig: {
        tileSize: 20
    }
}));

// Mock MazeLayout
jest.mock('../../../src/utils/MazeLayout.js', () => ({
    PELLET_TYPES: {
        NONE: 0,
        NORMAL: 1,
        POWER_PELLET: 2
    }
}));

// Mock EventBus
jest.mock('../../../src/core/EventBus.js', () => ({
    GAME_EVENTS: {
        PELLET_EATEN: 'pellet:eaten',
        POWER_PELLET_EATEN: 'power-pellet:eaten',
        GHOST_EATEN: 'ghost:eaten',
        FRUIT_EATEN: 'fruit:eaten'
    }
}));

describe('CollisionHandler', () => {
    let collisionHandler;
    let mockCallbacks;

    beforeEach(() => {
        mockCallbacks = {
            onPelletEaten: jest.fn(),
            onPowerPelletEaten: jest.fn(),
            onGhostEaten: jest.fn(),
            onPacmanDied: jest.fn(),
            onFruitEaten: jest.fn()
        };
        collisionHandler = new CollisionHandler(mockCallbacks);
    });

    describe('Initialization', () => {
        test('should initialize with callbacks', () => {
            expect(collisionHandler.callbacks).toBeDefined();
            expect(collisionHandler.callbacks.onPelletEaten).toBe(mockCallbacks.onPelletEaten);
        });

        test('should initialize with default callbacks', () => {
            const handler = new CollisionHandler();
            expect(handler.callbacks.onPelletEaten).toBeDefined();
        });

        test('should initialize stats', () => {
            expect(collisionHandler.stats.checksPerformed).toBe(0);
            expect(collisionHandler.stats.collisionsDetected).toBe(0);
        });

        test('should initialize collision radius', () => {
            expect(collisionHandler.collisionRadius).toBeDefined();
            expect(collisionHandler.collisionRadiusSquared).toBeDefined();
        });
    });

    describe('checkAllCollisions', () => {
        test('should return empty array when no collisions', () => {
            const pacman = { x: 10, y: 10 };
            const ghosts = [{ x: 100, y: 100, isEaten: false, isFrightened: false }];
            const fruit = { x: 200, y: 200, active: false };
            const pelletGrid = [[0, 0], [0, 0]];

            const events = collisionHandler.checkAllCollisions(
                { pacman, ghosts, fruit },
                { pelletGrid, pelletsRemaining: 0 }
            );

            expect(events).toEqual([]);
        });

        test('should increment checks performed', () => {
            collisionHandler.checkAllCollisions(
                { pacman: { x: 10, y: 10 }, ghosts: [], fruit: null },
                { pelletGrid: [[0]], pelletsRemaining: 0 }
            );
            expect(collisionHandler.stats.checksPerformed).toBe(1);
        });

        test('should detect pellet collision', () => {
            const pacman = { x: 10, y: 10 };
            const pelletGrid = [[1]]; // Normal pellet at (0,0)

            const events = collisionHandler.checkAllCollisions(
                { pacman, ghosts: [], fruit: null },
                { pelletGrid, pelletsRemaining: 1 }
            );

            expect(events.length).toBeGreaterThan(0);
            expect(events[0].type).toBe('pellet:eaten');
        });

        test('should detect ghost collision', () => {
            const pacman = { x: 10, y: 10 };
            const ghosts = [{ x: 10, y: 10, isEaten: false, isFrightened: false, ghostType: 'alpha' }];

            const events = collisionHandler.checkAllCollisions(
                { pacman, ghosts, fruit: null },
                { pelletGrid: [[0]], pelletsRemaining: 0 }
            );

            expect(events.length).toBeGreaterThan(0);
            expect(events[0].type).toBe('pacmanDied');
        });

        test('should detect frightened ghost collision', () => {
            const pacman = { x: 10, y: 10 };
            const ghosts = [{ x: 10, y: 10, isEaten: false, isFrightened: true, ghostType: 'alpha', eatenCount: 0 }];

            const events = collisionHandler.checkAllCollisions(
                { pacman, ghosts, fruit: null },
                { pelletGrid: [[0]], pelletsRemaining: 0 }
            );

            expect(events.length).toBeGreaterThan(0);
            expect(events[0].type).toBe('ghostEaten');
        });
    });

    describe('Pellet Collision', () => {
        test('should return null when no pacman', () => {
            const result = collisionHandler.checkPelletCollision(null, { pelletGrid: [[1]] });
            expect(result).toBeNull();
        });

        test('should return null when no pelletGrid', () => {
            const result = collisionHandler.checkPelletCollision({ x: 10, y: 10 }, {});
            expect(result).toBeNull();
        });

        test('should detect normal pellet', () => {
            const pacman = { x: 10, y: 10 };
            const pelletGrid = [[1]];

            const result = collisionHandler.checkPelletCollision(pacman, { pelletGrid, pelletsRemaining: 1 });

            expect(result).toBeDefined();
            expect(result.isPowerPellet).toBe(false);
            expect(result.score).toBe(10);
        });

        test('should detect power pellet', () => {
            const pacman = { x: 10, y: 10 };
            const pelletGrid = [[2]]; // Power pellet

            const result = collisionHandler.checkPelletCollision(pacman, { pelletGrid, pelletsRemaining: 1 });

            expect(result).toBeDefined();
            expect(result.isPowerPellet).toBe(true);
            expect(result.score).toBe(50);
        });

        test('should call onPelletEaten callback', () => {
            const pacman = { x: 10, y: 10 };
            const pelletGrid = [[1]];

            collisionHandler.checkPelletCollision(pacman, { pelletGrid, pelletsRemaining: 1 });

            expect(mockCallbacks.onPelletEaten).toHaveBeenCalled();
        });

        test('should call onPowerPelletEaten callback', () => {
            const pacman = { x: 10, y: 10 };
            const pelletGrid = [[2]];

            collisionHandler.checkPelletCollision(pacman, { pelletGrid, pelletsRemaining: 1 });

            expect(mockCallbacks.onPowerPelletEaten).toHaveBeenCalled();
        });

        test('should return null for empty tile', () => {
            const pacman = { x: 10, y: 10 };
            const pelletGrid = [[0]];

            const result = collisionHandler.checkPelletCollision(pacman, { pelletGrid, pelletsRemaining: 0 });

            expect(result).toBeNull();
        });

        test('should return null for out of bounds', () => {
            const pacman = { x: -10, y: -10 };
            const pelletGrid = [[1]];

            const result = collisionHandler.checkPelletCollision(pacman, { pelletGrid, pelletsRemaining: 1 });

            expect(result).toBeNull();
        });

        test('should cache last pellet position', () => {
            const pacman = { x: 10, y: 10 };
            const pelletGrid = [[1]];

            collisionHandler.checkPelletCollision(pacman, { pelletGrid, pelletsRemaining: 1 });
            collisionHandler.checkPelletCollision(pacman, { pelletGrid, pelletsRemaining: 1 });

            // Should only call callback once due to caching
            expect(mockCallbacks.onPelletEaten).toHaveBeenCalledTimes(1);
        });
    });

    describe('Ghost Collision', () => {
        test('should return null when no pacman', () => {
            const result = collisionHandler.checkGhostCollisions(null, []);
            expect(result).toBeNull();
        });

        test('should return null when no ghosts', () => {
            const result = collisionHandler.checkGhostCollisions({ x: 10, y: 10 }, []);
            expect(result).toBeNull();
        });

        test('should detect collision with ghost', () => {
            const pacman = { x: 10, y: 10 };
            const ghosts = [{ x: 10, y: 10, isEaten: false, isFrightened: false, ghostType: 'alpha' }];

            const result = collisionHandler.checkGhostCollisions(pacman, ghosts);

            expect(result).toBeDefined();
            expect(result.type).toBe('pacmanDied');
        });

        test('should call onPacmanDied callback', () => {
            const pacman = { x: 10, y: 10 };
            const ghosts = [{ x: 10, y: 10, isEaten: false, isFrightened: false, ghostType: 'alpha' }];

            collisionHandler.checkGhostCollisions(pacman, ghosts);

            expect(mockCallbacks.onPacmanDied).toHaveBeenCalled();
        });

        test('should detect frightened ghost', () => {
            const pacman = { x: 10, y: 10 };
            const ghosts = [{ x: 10, y: 10, isEaten: false, isFrightened: true, ghostType: 'alpha', eatenCount: 0 }];

            const result = collisionHandler.checkGhostCollisions(pacman, ghosts);

            expect(result.type).toBe('ghostEaten');
        });

        test('should call onGhostEaten callback for frightened ghost', () => {
            const pacman = { x: 10, y: 10 };
            const ghosts = [{ x: 10, y: 10, isEaten: false, isFrightened: true, ghostType: 'alpha', eatenCount: 0 }];

            collisionHandler.checkGhostCollisions(pacman, ghosts);

            expect(mockCallbacks.onGhostEaten).toHaveBeenCalled();
        });

        test('should skip eaten ghosts', () => {
            const pacman = { x: 10, y: 10 };
            const ghosts = [{ x: 10, y: 10, isEaten: true, isFrightened: false, ghostType: 'alpha' }];

            const result = collisionHandler.checkGhostCollisions(pacman, ghosts);

            expect(result).toBeNull();
        });

        test('should return correct ghost score', () => {
            const ghost = { eatenCount: 0 };
            expect(collisionHandler.getGhostScore(ghost)).toBe(200);

            ghost.eatenCount = 1;
            expect(collisionHandler.getGhostScore(ghost)).toBe(400);

            ghost.eatenCount = 2;
            expect(collisionHandler.getGhostScore(ghost)).toBe(800);

            ghost.eatenCount = 3;
            expect(collisionHandler.getGhostScore(ghost)).toBe(1600);
        });

        test('should cycle ghost scores', () => {
            const ghost = { eatenCount: 4 };
            expect(collisionHandler.getGhostScore(ghost)).toBe(200);
        });
    });

    describe('Fruit Collision', () => {
        test('should return null when no pacman', () => {
            const result = collisionHandler.checkFruitCollision(null, { active: true });
            expect(result).toBeNull();
        });

        test('should return null when no fruit', () => {
            const result = collisionHandler.checkFruitCollision({ x: 10, y: 10 }, null);
            expect(result).toBeNull();
        });

        test('should return null when fruit inactive', () => {
            const result = collisionHandler.checkFruitCollision(
                { x: 10, y: 10 },
                { active: false, x: 10, y: 10 }
            );
            expect(result).toBeNull();
        });

        test('should detect fruit collision', () => {
            const pacman = { x: 10, y: 10 };
            const fruit = { x: 10, y: 10, active: true, fruitType: 'cherry' };

            const result = collisionHandler.checkFruitCollision(pacman, fruit);

            expect(result).toBeDefined();
            expect(result.type).toBe('fruitEaten');
            expect(result.fruitType).toBe('cherry');
        });

        test('should call onFruitEaten callback', () => {
            const pacman = { x: 10, y: 10 };
            const fruit = { x: 10, y: 10, active: true, fruitType: 'cherry' };

            collisionHandler.checkFruitCollision(pacman, fruit);

            expect(mockCallbacks.onFruitEaten).toHaveBeenCalled();
        });

        test('should return correct fruit scores', () => {
            expect(collisionHandler.getFruitScore('cherry')).toBe(100);
            expect(collisionHandler.getFruitScore('strawberry')).toBe(300);
            expect(collisionHandler.getFruitScore('orange')).toBe(500);
            expect(collisionHandler.getFruitScore('apple')).toBe(700);
            expect(collisionHandler.getFruitScore('melon')).toBe(1000);
            expect(collisionHandler.getFruitScore('galaxian')).toBe(2000);
            expect(collisionHandler.getFruitScore('bell')).toBe(3000);
            expect(collisionHandler.getFruitScore('key')).toBe(5000);
        });

        test('should return default score for unknown fruit', () => {
            expect(collisionHandler.getFruitScore('unknown')).toBe(100);
        });
    });

    describe('Stats', () => {
        test('should get stats', () => {
            const stats = collisionHandler.getStats();
            expect(stats).toBeDefined();
            expect(stats.checksPerformed).toBe(0);
            expect(stats.collisionsDetected).toBe(0);
        });

        test('should increment collisions detected', () => {
            const pacman = { x: 10, y: 10 };
            const pelletGrid = [[1]];

            collisionHandler.checkAllCollisions(
                { pacman, ghosts: [], fruit: null },
                { pelletGrid, pelletsRemaining: 1 }
            );

            expect(collisionHandler.stats.collisionsDetected).toBe(1);
        });

        test('should reset stats', () => {
            collisionHandler.stats.checksPerformed = 10;
            collisionHandler.stats.collisionsDetected = 5;

            collisionHandler.resetStats();

            expect(collisionHandler.stats.checksPerformed).toBe(0);
            expect(collisionHandler.stats.collisionsDetected).toBe(0);
        });
    });
});
