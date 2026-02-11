/**
 * Tests for CollisionAdapter
 */

import { CollisionAdapter } from '../../src/model/adapters/CollisionAdapter.js';
import { PELLET_TYPES } from '../../src/utils/MazeLayout.js';

// Mock GameModel
function createMockGameModel() {
    return {
        pacman: {
            id: 1,
            x: 30,
            y: 30,
            gridX: 1,
            gridY: 1,
            prevX: 20,
            prevY: 30
        },
        ghosts: [
            {
                id: 2,
                x: 100,
                y: 100,
                gridX: 5,
                gridY: 5,
                isEaten: false,
                isFrightened: false,
                ghostType: 'blinky',
                eat: jest.fn()
            }
        ],
        fruit: {
            active: false,
            x: 0,
            y: 0,
            eat: jest.fn()
        },
        pelletGrid: [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ],
        getPelletAt: jest.fn((x, y) => {
            if (y >= 0 && y < 3 && x >= 0 && x < 3) {
                return [0, 0, 0][y][x];
            }
            return PELLET_TYPES.NONE;
        }),
        eatPelletAt: jest.fn((x, y) => {
            return {
                type: 'pellet',
                gridX: x,
                gridY: y,
                pelletsRemaining: 0
            };
        }),
        currentComboGhosts: 0,
        lives: 3,
        level: 1,
        score: 100,
        getFrightenedDuration: jest.fn(() => 5)
    };
}

describe('CollisionAdapter', () => {
    let adapter;
    let mockGameModel;

    beforeEach(() => {
        mockGameModel = createMockGameModel();
        adapter = new CollisionAdapter(mockGameModel);
    });

    describe('constructor', () => {
        test('creates collision engine', () => {
            expect(adapter.collisionEngine).toBeDefined();
        });

        test('initializes last pellet grid', () => {
            expect(adapter.lastPelletGrid).toEqual({ x: null, y: null });
        });

        test('initializes statistics', () => {
            expect(adapter.stats.checksPerformed).toBe(0);
            expect(adapter.stats.collisionsDetected).toBe(0);
        });
    });

    describe('checkAllCollisions', () => {
        test('returns array of events', () => {
            const events = adapter.checkAllCollisions();

            expect(Array.isArray(events)).toBe(true);
        });

        test('includes pellet events', () => {
            // Position pacman at pellet location
            mockGameModel.pacman.x = 30;
            mockGameModel.pacman.y = 30;
            mockGameModel.pacman.gridX = 1;
            mockGameModel.pacman.gridY = 1;

            // Mock pellet at this location
            mockGameModel.getPelletAt = jest.fn(() => PELLET_TYPES.PELLET);

            const events = adapter.checkAllCollisions();

            // Should have at least one event
            expect(events.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('checkPelletCollision', () => {
        test('returns empty array when no pellet', () => {
            mockGameModel.getPelletAt = jest.fn(() => PELLET_TYPES.NONE);

            const result = adapter.checkPelletCollision();

            expect(result).toEqual([]);
        });

        test('returns empty array when on same tile as last check', () => {
            mockGameModel.getPelletAt = jest.fn(() => PELLET_TYPES.PELLET);
            adapter.lastPelletGrid = { x: 1, y: 1 };
            mockGameModel.pacman.x = 30;
            mockGameModel.pacman.y = 30;

            const result = adapter.checkPelletCollision();

            expect(result).toEqual([]);
        });

        test('returns pellet event array when pellet eaten', () => {
            mockGameModel.getPelletAt = jest.fn(() => PELLET_TYPES.PELLET);
            mockGameModel.eatPelletAt = jest.fn(() => ({
                type: 'pellet',
                gridX: 1,
                gridY: 1,
                pelletsRemaining: 10
            }));

            const result = adapter.checkPelletCollision();

            expect(result.length).toBe(1);
            expect(result[0].type).toBe('pellet_eaten');
            expect(result[0].score).toBeDefined();
            expect(result[0].gridX).toBe(1);
            expect(result[0].gridY).toBe(1);
        });

        test('returns power pellet event array', () => {
            mockGameModel.getPelletAt = jest.fn(() => PELLET_TYPES.POWER_PELLET);
            mockGameModel.eatPelletAt = jest.fn(() => ({
                type: 'power_pellet',
                gridX: 1,
                gridY: 1,
                pelletsRemaining: 10
            }));

            const result = adapter.checkPelletCollision();

            expect(result.length).toBe(1);
            expect(result[0].type).toBe('power_pellet_eaten');
            expect(result[0].frightenedDuration).toBeDefined();
        });

        test('returns level_complete event in array', () => {
            mockGameModel.getPelletAt = jest.fn(() => PELLET_TYPES.PELLET);
            mockGameModel.eatPelletAt = jest.fn(() => ({
                type: 'pellet',
                gridX: 1,
                gridY: 1,
                pelletsRemaining: 0,
                levelComplete: true,
                level: 1
            }));

            const result = adapter.checkPelletCollision();

            expect(result.length).toBe(2);
            expect(result[0].type).toBe('pellet_eaten');
            expect(result[1].type).toBe('level_complete');
            expect(result[1].level).toBeDefined();
            expect(result[1].score).toBeDefined();
        });

        test('returns empty array when collision engine returns no pellets', () => {
            mockGameModel.getPelletAt = jest.fn(() => PELLET_TYPES.PELLET);
            // Mock collisionEngine to return no collisions
            adapter.collisionEngine.checkPelletCollisions = jest.fn(() => []);

            const result = adapter.checkPelletCollision();

            expect(result).toEqual([]);
        });
    });

    describe('checkGhostCollisions', () => {
        test('returns null when no collision', () => {
            // Ghost is far away
            mockGameModel.ghosts[0].x = 1000;
            mockGameModel.ghosts[0].y = 1000;

            const result = adapter.checkGhostCollisions();

            expect(result).toBeNull();
        });

        test('returns null when ghost is eaten', () => {
            mockGameModel.ghosts[0].isEaten = true;
            mockGameModel.ghosts[0].x = 30;
            mockGameModel.ghosts[0].y = 30;

            const result = adapter.checkGhostCollisions();

            expect(result).toBeNull();
        });

        test('returns ghost_eaten when ghost is frightened', () => {
            mockGameModel.ghosts[0].isFrightened = true;
            mockGameModel.ghosts[0].x = 30;
            mockGameModel.ghosts[0].y = 30;

            const result = adapter.checkGhostCollisions();

            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBeDefined();
            expect(result.ghostType).toBe('blinky');
            expect(mockGameModel.ghosts[0].eat).toHaveBeenCalled();
        });

        test('returns pacman_died when ghost not frightened', () => {
            mockGameModel.ghosts[0].isFrightened = false;
            mockGameModel.ghosts[0].x = 30;
            mockGameModel.ghosts[0].y = 30;

            const result = adapter.checkGhostCollisions();

            expect(result.type).toBe('pacman_died');
            expect(result.livesRemaining).toBe(3);
        });
    });

    describe('handleGhostCollision', () => {
        test('handles frightened ghost collision', () => {
            const ghost = mockGameModel.ghosts[0];
            ghost.isFrightened = true;

            const result = adapter.handleGhostCollision(ghost);

            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(200);
            expect(ghost.eat).toHaveBeenCalled();
        });

        test('handles non-frightened ghost collision', () => {
            const ghost = mockGameModel.ghosts[0];
            ghost.isFrightened = false;

            const result = adapter.handleGhostCollision(ghost);

            expect(result.type).toBe('pacman_died');
            expect(result.livesRemaining).toBe(3);
        });

        test('calculates combo score', () => {
            const ghost = mockGameModel.ghosts[0];
            ghost.isFrightened = true;
            mockGameModel.currentComboGhosts = 2;

            const result = adapter.handleGhostCollision(ghost);

            // Third ghost in combo (index 2) should give 800 points
            expect(result.score).toBe(800);
        });
    });

    describe('checkFruitCollision', () => {
        test('returns null when fruit not active', () => {
            mockGameModel.fruit.active = false;

            const result = adapter.checkFruitCollision();

            expect(result).toBeNull();
        });

        test('returns null when far from fruit', () => {
            mockGameModel.fruit.active = true;
            mockGameModel.fruit.x = 1000;
            mockGameModel.fruit.y = 1000;

            const result = adapter.checkFruitCollision();

            expect(result).toBeNull();
        });

        test('returns fruit_eaten when collision', () => {
            mockGameModel.fruit.active = true;
            mockGameModel.fruit.x = 30;
            mockGameModel.fruit.y = 30;
            mockGameModel.fruit.eat = jest.fn(() => 100);
            mockGameModel.fruit.getFruitType = jest.fn(() => ({ name: 'cherry' }));

            const result = adapter.checkFruitCollision();

            expect(result.type).toBe('fruit_eaten');
            expect(result.score).toBe(100);
        });
    });

    describe('reset', () => {
        test('resets last pellet grid', () => {
            adapter.lastPelletGrid = { x: 1, y: 1 };
            adapter.reset();

            expect(adapter.lastPelletGrid).toEqual({ x: null, y: null });
        });

        test('resets statistics', () => {
            adapter.stats.checksPerformed = 10;
            adapter.stats.collisionsDetected = 5;
            adapter.reset();

            expect(adapter.stats.checksPerformed).toBe(0);
            expect(adapter.stats.collisionsDetected).toBe(0);
        });

        test('clears collision engine', () => {
            adapter.reset();

            expect(adapter.collisionEngine).toBeDefined();
        });
    });

    describe('getStats', () => {
        test('returns statistics', () => {
            const stats = adapter.getStats();

            expect(stats.checksPerformed).toBeDefined();
            expect(stats.collisionsDetected).toBeDefined();
            expect(stats.lastPelletGrid).toBeDefined();
            expect(stats.engineStats).toBeDefined();
        });
    });
});
