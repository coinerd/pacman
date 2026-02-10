/**
 * Tests for GridMovementStrategy
 */

import { GridMovementStrategy } from '../../src/movement/strategies/GridMovementStrategy.js';
import { MOVEMENT_RESULTS, MOVEMENT_EVENTS } from '../../src/movement/MovementInterface.js';

// Mock maze query for testing
function createMockMazeQuery(config = {}) {
    const tileSize = config.tileSize || 20;
    const width = config.width || 28;
    const height = config.height || 31;
    const walls = config.walls || [];

    return {
        tileSize,
        isWalkable: (tileX, tileY) => {
            if (tileX < 0 || tileX >= width || tileY < 0 || tileY >= height) {
                return false;
            }
            return !walls.some(w => w.x === tileX && w.y === tileY);
        },
        getTileCenter: (tileX, tileY) => ({
            x: tileX * tileSize + tileSize / 2,
            y: tileY * tileSize + tileSize / 2
        }),
        tileToWorld: (tileX, tileY) => ({
            x: tileX * tileSize,
            y: tileY * tileSize
        }),
        worldToTile: (x, y) => ({
            tileX: Math.floor(x / tileSize),
            tileY: Math.floor(y / tileSize)
        }),
        getWarpTarget: config.getWarpTarget || (() => null),
        getTileSize: () => tileSize,
        isInBounds: (tileX, tileY) =>
            tileX >= 0 && tileX < width && tileY >= 0 && tileY < height,
        getWidth: () => width,
        getHeight: () => height
    };
}

describe('GridMovementStrategy', () => {
    let strategy;
    let mockMazeQuery;

    beforeEach(() => {
        strategy = new GridMovementStrategy({
            tileSize: 20,
            maxTilesPerFrame: 3,
            eps: 3
        });
        mockMazeQuery = createMockMazeQuery();
    });

    describe('constructor', () => {
        test('creates with default config', () => {
            const s = new GridMovementStrategy();
            expect(s.tileSize).toBe(20);
            expect(s.maxTilesPerFrame).toBe(3);
            expect(s.eps).toBe(3);
        });

        test('creates with custom config', () => {
            const s = new GridMovementStrategy({
                tileSize: 32,
                maxTilesPerFrame: 5,
                eps: 5
            });
            expect(s.tileSize).toBe(32);
            expect(s.maxTilesPerFrame).toBe(5);
            expect(s.eps).toBe(5);
        });
    });

    describe('move', () => {
        test('moves entity right', () => {
            const entity = {
                x: 110, // Center of tile 5 (5 * 20 + 10)
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: 1, y: 0, angle: 0 },
                speed: 100
            };

            const result = strategy.move(entity, { mazeQuery: mockMazeQuery }, 0.1);

            expect(result.result).toBe(MOVEMENT_RESULTS.MOVED);
            expect(result.newPosition.x).toBeGreaterThan(entity.x);
            expect(result.isMoving).toBe(true);
            expect(result.distanceMoved).toBeGreaterThan(0);
        });

        test('moves entity down', () => {
            const entity = {
                x: 110,
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: 0, y: 1, angle: 90 },
                speed: 100
            };

            const result = strategy.move(entity, { mazeQuery: mockMazeQuery }, 0.1);

            expect(result.result).toBe(MOVEMENT_RESULTS.MOVED);
            expect(result.newPosition.y).toBeGreaterThan(entity.y);
        });

        test('stops at wall', () => {
            const mazeWithWall = createMockMazeQuery({
                walls: [{ x: 6, y: 5 }] // Wall to the right
            });

            const entity = {
                x: 110,
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: 1, y: 0, angle: 0 },
                speed: 100
            };

            const result = strategy.move(entity, { mazeQuery: mazeWithWall }, 0.1);

            expect(result.result).toBe(MOVEMENT_RESULTS.BLOCKED);
            expect(result.isMoving).toBe(false);
        });

        test('returns NONE for zero speed', () => {
            const entity = {
                x: 110,
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: 1, y: 0 },
                speed: 0
            };

            const result = strategy.move(entity, { mazeQuery: mockMazeQuery }, 0.1);

            expect(result.result).toBe(MOVEMENT_RESULTS.NONE);
            expect(result.distanceMoved).toBe(0);
        });

        test('returns NONE for zero delta', () => {
            const entity = {
                x: 110,
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: 1, y: 0 },
                speed: 100
            };

            const result = strategy.move(entity, { mazeQuery: mockMazeQuery }, 0);

            expect(result.result).toBe(MOVEMENT_RESULTS.NONE);
        });

        test('returns STOPPED for no direction', () => {
            const entity = {
                x: 110,
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: 0, y: 0 },
                speed: 100
            };

            const result = strategy.move(entity, { mazeQuery: mockMazeQuery }, 0.1);

            expect(result.result).toBe(MOVEMENT_RESULTS.STOPPED);
            expect(result.isMoving).toBe(false);
        });

        test('warps through portal', () => {
            const mazeWithPortal = createMockMazeQuery({
                getWarpTarget: (tileX, tileY, direction) => {
                    if (tileX === 0 && tileY === 14 && direction.x < 0) {
                        return { tileX: 27, tileY: 14 };
                    }
                    return null;
                }
            });

            const entity = {
                x: 10, // Center of tile 0
                y: 290, // Row 14 (14 * 20 + 10)
                gridX: 0,
                gridY: 14,
                direction: { x: -1, y: 0, angle: 180 },
                speed: 100
            };

            const result = strategy.move(entity, { mazeQuery: mazeWithPortal }, 0.1);

            expect(result.result).toBe(MOVEMENT_RESULTS.WARPED);
            expect(result.events.some(e => e.type === MOVEMENT_EVENTS.WARP)).toBe(true);
        });

        test('emits tile_enter event when crossing tiles', () => {
            const entity = {
                x: 110,
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: 1, y: 0 },
                speed: 200 // Fast enough to cross tile
            };

            const result = strategy.move(entity, { mazeQuery: mockMazeQuery }, 0.2);

            const tileEnterEvents = result.events.filter(e => e.type === MOVEMENT_EVENTS.TILE_ENTER);
            expect(tileEnterEvents.length).toBeGreaterThan(0);
        });

        test('emits center_reached event', () => {
            const entity = {
                x: 115, // Just past center of tile 5
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: -1, y: 0 }, // Moving back toward center
                speed: 100
            };

            const result = strategy.move(entity, { mazeQuery: mockMazeQuery }, 0.1);

            const centerEvents = result.events.filter(e => e.type === MOVEMENT_EVENTS.CENTER_REACHED);
            expect(centerEvents.length).toBeGreaterThan(0);
        });
    });

    describe('canMove', () => {
        test('returns true for walkable tile', () => {
            const entity = {
                x: 110,
                y: 110,
                gridX: 5,
                gridY: 5
            };

            const result = strategy.canMove(
                entity,
                { mazeQuery: mockMazeQuery },
                { x: 1, y: 0 }
            );

            expect(result).toBe(true);
        });

        test('returns false for wall', () => {
            const mazeWithWall = createMockMazeQuery({
                walls: [{ x: 6, y: 5 }]
            });

            const entity = {
                x: 110,
                y: 110,
                gridX: 5,
                gridY: 5
            };

            const result = strategy.canMove(
                entity,
                { mazeQuery: mazeWithWall },
                { x: 1, y: 0 }
            );

            expect(result).toBe(false);
        });

        test('returns false for out of bounds', () => {
            const entity = {
                x: 10,
                y: 10,
                gridX: 0,
                gridY: 0
            };

            const result = strategy.canMove(
                entity,
                { mazeQuery: mockMazeQuery },
                { x: -1, y: 0 }
            );

            expect(result).toBe(false);
        });

        test('returns false for zero direction', () => {
            const entity = {
                x: 110,
                y: 110,
                gridX: 5,
                gridY: 5
            };

            const result = strategy.canMove(
                entity,
                { mazeQuery: mockMazeQuery },
                { x: 0, y: 0 }
            );

            expect(result).toBe(false);
        });

        test('returns true for warp portal', () => {
            const mazeWithPortal = createMockMazeQuery({
                getWarpTarget: () => ({ tileX: 27, tileY: 14 })
            });

            const entity = {
                x: 10,
                y: 290,
                gridX: 0,
                gridY: 14
            };

            const result = strategy.canMove(
                entity,
                { mazeQuery: mazeWithPortal },
                { x: -1, y: 0 }
            );

            expect(result).toBe(true);
        });
    });

    describe('movement constraints', () => {
        test('respects max tiles per frame', () => {
            const strategy = new GridMovementStrategy({
                tileSize: 20,
                maxTilesPerFrame: 2,
                eps: 3
            });

            const entity = {
                x: 110,
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: 1, y: 0 },
                speed: 1000 // Very fast
            };

            const result = strategy.move(entity, { mazeQuery: mockMazeQuery }, 1);

            // Should be capped at maxTilesPerFrame * tileSize
            expect(result.distanceMoved).toBeLessThanOrEqual(2 * 20);
        });

        test('snaps to center within epsilon when moving toward it', () => {
            const entity = {
                x: 112, // 2 pixels from center (within eps=3)
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: -1, y: 0 }, // Moving back toward center
                speed: 100
            };

            const result = strategy.move(entity, { mazeQuery: mockMazeQuery }, 0.1);

            // Should emit center reached when moving toward and reaching center
            expect(result.events.some(e => e.type === MOVEMENT_EVENTS.CENTER_REACHED)).toBe(true);
        });
    });

    describe('turn handling', () => {
        test('turns at center when input direction provided', () => {
            const entity = {
                x: 110, // Exactly at center
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: 1, y: 0, angle: 0 },
                speed: 100
            };

            const result = strategy.move(
                entity,
                {
                    mazeQuery: mockMazeQuery,
                    inputDirection: { x: 0, y: -1, angle: 270 }
                },
                0.1
            );

            expect(result.result).toBe(MOVEMENT_RESULTS.TURNED);
            expect(result.newDirection.y).toBe(-1);
        });

        test('does not turn when not at center', () => {
            const entity = {
                x: 115, // 5 pixels from center
                y: 110,
                gridX: 5,
                gridY: 5,
                direction: { x: 1, y: 0 },
                speed: 100
            };

            const result = strategy.move(
                entity,
                {
                    mazeQuery: mockMazeQuery,
                    inputDirection: { x: 0, y: -1 }
                },
                0.1
            );

            // Should continue in current direction
            expect(result.newDirection.x).toBe(1);
        });
    });
});
