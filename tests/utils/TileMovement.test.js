import {
    worldToTile,
    tileCenter,
    isAtTileCenter,
    isExactlyAtTileCenter,
    distanceToTileCenter,
    performGridMovementStep,
    encodeTile,
    decodeTile,
    tileToWorld,
    EPS
} from '../../src/utils/TileMovement.js';
import { directions, gameConfig } from '../../src/config/gameConfig.js';
import { createSimpleMaze } from '../utils/testHelpers.js';

describe('TileMovement - worldToTile', () => {
    const origin = { x: 0, y: 0 };
    const tileSize = 20;

    describe('Object notation with custom origin and tileSize', () => {
        test('converts origin position (0,0) to tile(0,0)', () => {
            const worldPos = { x: 0, y: 0 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: 0,
                tileY: 0
            });
        });

        test('converts one tile width right to tile(1,0)', () => {
            const worldPos = { x: 20, y: 0 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: 1,
                tileY: 0
            });
        });

        test('converts tile middle to correct tile index', () => {
            const worldPos = { x: 50, y: 70 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: 2,
                tileY: 3
            });
        });

        test('handles negative coordinates', () => {
            const worldPos = { x: -30, y: -50 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: -2,
                tileY: -3
            });
        });

        test('handles non-zero origin', () => {
            const customOrigin = { x: 100, y: 200 };
            const worldPos = { x: 130, y: 230 };
            const result = worldToTile(worldPos, customOrigin, tileSize);

            expect(result).toEqual({
                tileX: 1,
                tileY: 1
            });
        });
    });

    describe('Standard call with x, y parameters', () => {
        test('converts world coordinates using default gameConfig', () => {
            const result = worldToTile(50, 70);

            expect(result).toEqual({
                x: 2,
                y: 3
            });
        });

        test('converts origin to tile(0,0)', () => {
            const result = worldToTile(0, 0);

            expect(result).toEqual({
                x: 0,
                y: 0
            });
        });

        test('handles negative coordinates', () => {
            const result = worldToTile(-30, -50);

            expect(result).toEqual({
                x: -2,
                y: -3
            });
        });
    });

    describe('Edge cases', () => {
        test('handles tile boundaries', () => {
            const result = worldToTile(19.9, 19.9);

            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
        });

        test('crosses to next tile at exact boundary', () => {
            const result = worldToTile(20, 20);

            expect(result.x).toBe(1);
            expect(result.y).toBe(1);
        });

        test('handles large coordinates', () => {
            const result = worldToTile(1000, 2000);

            expect(result.x).toBe(50);
            expect(result.y).toBe(100);
        });
    });
});

describe('TileMovement - tileCenter', () => {
    describe('Standard call without customOrigin', () => {
        test('returns tileSize/2 offset for tile(0,0)', () => {
            const result = tileCenter(0, 0);

            expect(result).toEqual({
                x: 10,
                y: 10
            });
        });

        test('returns correct center for tile(1,0)', () => {
            const result = tileCenter(1, 0);

            expect(result).toEqual({
                x: 30,
                y: 10
            });
        });

        test('returns correct center for tile(5,10)', () => {
            const result = tileCenter(5, 10);

            expect(result).toEqual({
                x: 110,
                y: 210
            });
        });
    });

    describe('Call with customOrigin and tileSize', () => {
        test('applies origin offset', () => {
            const customOrigin = { x: 100, y: 200 };
            const customTileSize = 20;
            const result = tileCenter(1, 2, customOrigin, customTileSize);

            expect(result).toEqual({
                x: 130,
                y: 250
            });
        });

        test('works with different tileSize', () => {
            const customOrigin = { x: 0, y: 0 };
            const customTileSize = 30;
            const result = tileCenter(1, 0, customOrigin, customTileSize);

            expect(result).toEqual({
                x: 45,
                y: 15
            });
        });

        test('handles negative tiles', () => {
            const customOrigin = { x: 0, y: 0 };
            const result = tileCenter(-2, -3, customOrigin, 20);

            expect(result).toEqual({
                x: -30,
                y: -50
            });
        });
    });

    describe('All quadrants', () => {
        test('works in quadrant 1', () => {
            const result = tileCenter(2, 3);
            expect(result).toEqual({ x: 50, y: 70 });
        });

        test('works in quadrant 2', () => {
            const result = tileCenter(-2, 3);
            expect(result).toEqual({ x: -30, y: 70 });
        });

        test('works in quadrant 3', () => {
            const result = tileCenter(-2, -3);
            expect(result).toEqual({ x: -30, y: -50 });
        });

        test('works in quadrant 4', () => {
            const result = tileCenter(2, -3);
            expect(result).toEqual({ x: 50, y: -50 });
        });
    });
});

describe('TileMovement - isAtTileCenter', () => {
    describe('Within EPS (5px) returns true', () => {
        test('returns true exactly at center', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x, center.y, 5, 5)).toBe(true);
        });

        test('returns true within EPS on X axis', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x + EPS, center.y, 5, 5)).toBe(true);
            expect(isAtTileCenter(center.x - EPS, center.y, 5, 5)).toBe(true);
        });

        test('returns true within EPS on Y axis', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x, center.y + EPS, 5, 5)).toBe(true);
            expect(isAtTileCenter(center.x, center.y - EPS, 5, 5)).toBe(true);
        });

        test('returns true within EPS on diagonal', () => {
            const center = tileCenter(5, 5);
            const offset = EPS * 0.7;
            expect(isAtTileCenter(center.x + offset, center.y + offset, 5, 5)).toBe(true);
        });
    });

    describe('Outside EPS returns false', () => {
        test('returns false just outside EPS', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x + EPS + 0.1, center.y, 5, 5)).toBe(false);
            expect(isAtTileCenter(center.x, center.y + EPS + 0.1, 5, 5)).toBe(false);
        });

        test('returns false far from center', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x + 10, center.y, 5, 5)).toBe(false);
            expect(isAtTileCenter(center.x, center.y + 10, 5, 5)).toBe(false);
        });
    });

    describe('EPS boundary cases', () => {
        test('exactly at EPS boundary', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x + EPS, center.y, 5, 5)).toBe(true);
            expect(isAtTileCenter(center.x - EPS, center.y, 5, 5)).toBe(true);
        });

        test('fractional pixel outside EPS', () => {
            const center = tileCenter(5, 5);
            expect(isAtTileCenter(center.x + EPS + 0.01, center.y, 5, 5)).toBe(false);
        });
    });
});

describe('TileMovement - isExactlyAtTileCenter', () => {
    describe('Within 1px returns true', () => {
        test('returns true exactly at center', () => {
            const center = tileCenter(5, 5);
            expect(isExactlyAtTileCenter(center.x, center.y, 5, 5)).toBe(true);
        });

        test('returns true within 1px on X axis', () => {
            const center = tileCenter(5, 5);
            expect(isExactlyAtTileCenter(center.x + 1, center.y, 5, 5)).toBe(true);
            expect(isExactlyAtTileCenter(center.x - 1, center.y, 5, 5)).toBe(true);
        });

        test('returns true within 1px on Y axis', () => {
            const center = tileCenter(5, 5);
            expect(isExactlyAtTileCenter(center.x, center.y + 1, 5, 5)).toBe(true);
            expect(isExactlyAtTileCenter(center.x, center.y - 1, 5, 5)).toBe(true);
        });

        test('returns true at exact 1px diagonal', () => {
            const center = tileCenter(5, 5);
            expect(isExactlyAtTileCenter(center.x + 1, center.y + 1, 5, 5)).toBe(true);
        });

        test('returns true at exact 0.5px offset', () => {
            const center = tileCenter(5, 5);
            expect(isExactlyAtTileCenter(center.x + 0.5, center.y + 0.5, 5, 5)).toBe(true);
        });
    });

    describe('Outside 1px returns false', () => {
        test('returns false just outside 1px', () => {
            const center = tileCenter(5, 5);
            expect(isExactlyAtTileCenter(center.x + 1.1, center.y, 5, 5)).toBe(false);
            expect(isExactlyAtTileCenter(center.x, center.y + 1.1, 5, 5)).toBe(false);
        });

        test('returns false at EPS (5px)', () => {
            const center = tileCenter(5, 5);
            expect(isExactlyAtTileCenter(center.x + EPS, center.y, 5, 5)).toBe(false);
        });

        test('returns false far from center', () => {
            const center = tileCenter(5, 5);
            expect(isExactlyAtTileCenter(center.x + 3, center.y, 5, 5)).toBe(false);
        });
    });

    describe('1px boundary cases', () => {
        test('exactly at 1px boundary', () => {
            const center = tileCenter(5, 5);
            expect(isExactlyAtTileCenter(center.x + 1, center.y, 5, 5)).toBe(true);
            expect(isExactlyAtTileCenter(center.x - 1, center.y, 5, 5)).toBe(true);
        });

        test('fractional pixel outside 1px', () => {
            const center = tileCenter(5, 5);
            expect(isExactlyAtTileCenter(center.x + 1.01, center.y, 5, 5)).toBe(false);
        });
    });
});

describe('TileMovement - distanceToTileCenter', () => {
    describe('Distance calculations', () => {
        test('returns 0 exactly at center', () => {
            const center = tileCenter(5, 5);
            const dist = distanceToTileCenter(center.x, center.y, 5, 5);
            expect(dist).toBe(0);
        });

        test('returns 1 with 1px offset on X axis', () => {
            const center = tileCenter(5, 5);
            const dist = distanceToTileCenter(center.x + 1, center.y, 5, 5);
            expect(dist).toBeCloseTo(1, 2);
        });

        test('returns 1 with 1px offset on Y axis', () => {
            const center = tileCenter(5, 5);
            const dist = distanceToTileCenter(center.x, center.y + 1, 5, 5);
            expect(dist).toBeCloseTo(1, 2);
        });

        test('returns sqrt(2) with 1px diagonal offset', () => {
            const center = tileCenter(5, 5);
            const dist = distanceToTileCenter(center.x + 1, center.y + 1, 5, 5);
            expect(dist).toBeCloseTo(Math.sqrt(2), 2);
        });

        test('returns correct distance for larger offsets', () => {
            const center = tileCenter(5, 5);
            const dist = distanceToTileCenter(center.x + 5, center.y, 5, 5);
            expect(dist).toBeCloseTo(5, 2);
        });
    });

    describe('Different tiles', () => {
        test('calculates distance to tile(0,0)', () => {
            const dist = distanceToTileCenter(15, 25, 0, 0);
            expect(dist).toBeGreaterThan(14);
        });

        test('calculates distance to tile(10,10)', () => {
            const dist = distanceToTileCenter(205, 205, 10, 10);
            expect(dist).toBeGreaterThan(7);
        });
    });
});

function createMovementEntity(config) {
    const { x, y, gridX, gridY, direction, speed, isMoving, nextDirection, prevGridX, prevGridY } = config;

    const actualDirection = direction || directions.NONE;
    const actualNextDirection = nextDirection || directions.NONE;

    const entity = {
        x, y, gridX, gridY, speed, isMoving
    };

    if (typeof prevGridX !== 'undefined') {entity.prevGridX = prevGridX;}
    if (typeof prevGridY !== 'undefined') {entity.prevGridY = prevGridY;}

    const db = {
        current: actualDirection,
        buffered: actualNextDirection,
        queue: jest.fn(),
        getCurrent: () => db.current,
        getBuffered: () => db.buffered,
        apply: jest.fn((dir) => {
            db.current = dir;
        }),
        applyIfCanMove: jest.fn((canMoveFunc) => {
            if (db.buffered.x !== 0 || db.buffered.y !== 0) {
                if (canMoveFunc(db.buffered)) {
                    db.current = db.buffered;
                    db.buffered = directions.NONE;
                    return true;
                }
            }
            return false;
        })
    };

    entity.directionBuffer = db;

    Object.defineProperty(entity, 'direction', {
        get() { return entity.directionBuffer.getCurrent(); },
        set(value) { entity.directionBuffer.current = value; }
    });
    Object.defineProperty(entity, 'nextDirection', {
        get() { return entity.directionBuffer.getBuffered(); },
        set(value) { entity.directionBuffer.buffered = value; }
    });

    return entity;
}

describe('TileMovement - performGridMovementStep', () => {
    let maze;

    beforeEach(() => {
        maze = createSimpleMaze(10, 10);
    });

    describe('Basic movement', () => {
        test('entity without direction returns unchanged', () => {
            const entity = createMovementEntity({
                x: tileCenter(5, 5).x,
                y: tileCenter(5, 5).y,
                gridX: 5,
                gridY: 5,
                direction: directions.NONE,
                isMoving: false,
                speed: 100
            });

            const result = performGridMovementStep(entity, maze, 100);
            expect(result).toBe(entity);
        });

        test('entity not at center continues moving', () => {
            const center = tileCenter(5, 5);
            const entity = createMovementEntity({
                x: center.x - 3,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                isMoving: true,
                speed: 100
            });

            const initialX = entity.x;
            performGridMovementStep(entity, maze, 50);

            expect(entity.x).toBeGreaterThan(initialX);
        });
    });

    describe('Speed and delta handling', () => {
        test('entity with speed=0 does not move', () => {
            const center = tileCenter(5, 5);
            const entity = createMovementEntity({
                x: center.x,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                isMoving: true,
                speed: 0
            });

            performGridMovementStep(entity, maze, 100);

            expect(entity.x).toBe(center.x);
        });

        test('entity with delta=0 does not move', () => {
            const center = tileCenter(5, 5);
            const entity = createMovementEntity({
                x: center.x,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                isMoving: true,
                speed: 100
            });

            performGridMovementStep(entity, maze, 0);

            expect(entity.x).toBe(center.x);
        });
    });

    describe('Wall collision', () => {
        test('entity against wall stops at boundary', () => {
            maze[5][6] = 1;

            const entity = createMovementEntity({
                x: tileCenter(5, 5).x,
                y: tileCenter(5, 5).y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                isMoving: true,
                speed: 100
            });

            performGridMovementStep(entity, maze, 1000);

            const wallBoundary = tileCenter(6, 5).x - gameConfig.tileSize / 2;
            expect(entity.x).toBeLessThanOrEqual(wallBoundary);
            expect(entity.gridX).toBe(5);
        });

        test('entity blocked by all directions stops completely', () => {
            maze[4][5] = 1;
            maze[6][5] = 1;
            maze[5][4] = 1;
            maze[5][6] = 1;

            const entity = createMovementEntity({
                x: tileCenter(5, 5).x,
                y: tileCenter(5, 5).y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                isMoving: true,
                speed: 100
            });

            performGridMovementStep(entity, maze, 100);

            expect(entity.direction).toBe(directions.NONE);
            expect(entity.isMoving).toBe(false);
        });
    });

    describe('Moving state', () => {
        test('entity with isMoving=false stays still until direction set', () => {
            const center = tileCenter(5, 5);
            const entity = createMovementEntity({
                x: center.x,
                y: center.y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                isMoving: false,
                speed: 100
            });

            performGridMovementStep(entity, maze, 100);

            expect(entity.isMoving).toBe(true);
        });

        test('entity with buffered turn snaps to center and executes turn', () => {
            const center = tileCenter(5, 5);
            const entity = createMovementEntity({
                x: center.x + 3,
                y: center.y,
                gridX: 5,
                gridY: 5,
                prevGridX: 5,
                prevGridY: 5,
                direction: directions.RIGHT,
                nextDirection: directions.UP,
                isMoving: true,
                speed: 100
            });

            performGridMovementStep(entity, maze, 100);

            expect(entity.x).toBe(center.x);
            expect(entity.y).toBe(center.y - 7);
            expect(entity.direction).toBe(directions.UP);
            expect(entity.nextDirection).toEqual(directions.NONE);
        });
    });

    describe('Grid position updates', () => {
        test('gridX updates when crossing center to next tile', () => {
            maze[5][6] = 0;

            const entity = createMovementEntity({
                x: tileCenter(5, 5).x,
                y: tileCenter(5, 5).y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                isMoving: true,
                speed: 200
            });

            performGridMovementStep(entity, maze, 200);

            expect(entity.gridX).toBe(6);
        });

        test('gridY updates when crossing center vertically', () => {
            maze[6][5] = 0;

            const entity = createMovementEntity({
                x: tileCenter(5, 5).x,
                y: tileCenter(5, 5).y,
                gridX: 5,
                gridY: 5,
                direction: directions.DOWN,
                isMoving: true,
                speed: 200
            });

            performGridMovementStep(entity, maze, 200);

            expect(entity.gridY).toBe(6);
        });
    });

    describe('Edge cases', () => {
        test('entity at maze edge does not crash', () => {
            const entity = createMovementEntity({
                x: tileCenter(1, 1).x,
                y: tileCenter(1, 1).y,
                gridX: 1,
                gridY: 1,
                direction: directions.LEFT,
                isMoving: true,
                speed: 100
            });

            expect(() => performGridMovementStep(entity, maze, 100)).not.toThrow();
        });

        test('large delta time does not cause overflow', () => {
            const entity = createMovementEntity({
                x: tileCenter(5, 5).x,
                y: tileCenter(5, 5).y,
                gridX: 5,
                gridY: 5,
                direction: directions.RIGHT,
                isMoving: true,
                speed: 100
            });

            performGridMovementStep(entity, maze, 5000);

            expect(entity.x).toBeLessThan(tileCenter(7, 5).x + gameConfig.tileSize);
        });
    });
});

describe('TileMovement - encodeTile', () => {
    describe('Basic encoding', () => {
        test('encodes tile(0,0) to index 0', () => {
            const index = encodeTile(0, 0, 28);
            expect(index).toBe(0);
        });

        test('encodes tile(1,0) to index 1', () => {
            const index = encodeTile(1, 0, 28);
            expect(index).toBe(1);
        });

        test('encodes tile(0,1) to index 28 (mazeWidth)', () => {
            const index = encodeTile(0, 1, 28);
            expect(index).toBe(28);
        });

        test('encodes tile(5,3) correctly', () => {
            const index = encodeTile(5, 3, 28);
            expect(index).toBe(3 * 28 + 5);
        });
    });

    describe('Different maze widths', () => {
        test('encodes correctly with mazeWidth 10', () => {
            const index = encodeTile(3, 2, 10);
            expect(index).toBe(23);
        });

        test('encodes correctly with mazeWidth 20', () => {
            const index = encodeTile(7, 4, 20);
            expect(index).toBe(87);
        });

        test('encodes correctly with mazeWidth 28 (standard)', () => {
            const index = encodeTile(13, 14, 28);
            expect(index).toBe(405);
        });
    });

    describe('Edge cases', () => {
        test('encodes edge tile at max X', () => {
            const index = encodeTile(27, 0, 28);
            expect(index).toBe(27);
        });

        test('encodes edge tile at max Y', () => {
            const index = encodeTile(0, 30, 28);
            expect(index).toBe(840);
        });

        test('encodes corner tile (max X, max Y)', () => {
            const index = encodeTile(27, 30, 28);
            expect(index).toBe(867);
        });
    });
});

describe('TileMovement - decodeTile', () => {
    describe('Basic decoding', () => {
        test('decodes index 0 to tile(0,0)', () => {
            const tile = decodeTile(0, 28);
            expect(tile.tileX).toBe(0);
            expect(tile.tileY).toBe(0);
        });

        test('decodes index 1 to tile(1,0)', () => {
            const tile = decodeTile(1, 28);
            expect(tile.tileX).toBe(1);
            expect(tile.tileY).toBe(0);
        });

        test('decodes index 28 to tile(0,1)', () => {
            const tile = decodeTile(28, 28);
            expect(tile.tileX).toBe(0);
            expect(tile.tileY).toBe(1);
        });
    });

    describe('Different maze widths', () => {
        test('decodes correctly with mazeWidth 10', () => {
            const tile = decodeTile(23, 10);
            expect(tile.tileX).toBe(3);
            expect(tile.tileY).toBe(2);
        });

        test('decodes correctly with mazeWidth 20', () => {
            const tile = decodeTile(87, 20);
            expect(tile.tileX).toBe(7);
            expect(tile.tileY).toBe(4);
        });

        test('decodes correctly with mazeWidth 28 (standard)', () => {
            const tile = decodeTile(405, 28);
            expect(tile.tileX).toBe(13);
            expect(tile.tileY).toBe(14);
        });
    });

    describe('Edge cases', () => {
        test('decodes max X index correctly', () => {
            const tile = decodeTile(27, 28);
            expect(tile.tileX).toBe(27);
            expect(tile.tileY).toBe(0);
        });

        test('decodes max Y index correctly', () => {
            const tile = decodeTile(840, 28);
            expect(tile.tileX).toBe(0);
            expect(tile.tileY).toBe(30);
        });

        test('decodes corner index correctly', () => {
            const tile = decodeTile(867, 28);
            expect(tile.tileX).toBe(27);
            expect(tile.tileY).toBe(30);
        });
    });

    describe('Round-trip encoding/decoding', () => {
        test('encode then decode returns original coordinates', () => {
            const originalX = 5;
            const originalY = 3;
            const mazeWidth = 28;
            const index = encodeTile(originalX, originalY, mazeWidth);
            const decoded = decodeTile(index, mazeWidth);
            expect(decoded.tileX).toBe(originalX);
            expect(decoded.tileY).toBe(originalY);
        });

        test('multiple round-trip conversions maintain integrity', () => {
            const testCases = [
                { x: 0, y: 0 },
                { x: 13, y: 14 },
                { x: 27, y: 30 },
                { x: 5, y: 3 },
                { x: 20, y: 15 }
            ];
            const mazeWidth = 28;

            testCases.forEach(({ x, y }) => {
                const index = encodeTile(x, y, mazeWidth);
                const decoded = decodeTile(index, mazeWidth);
                expect(decoded.tileX).toBe(x);
                expect(decoded.tileY).toBe(y);
            });
        });
    });
});

describe('TileMovement - tileToWorld', () => {
    describe('Basic conversion with origin (0,0)', () => {
        test('converts tile(0,0) to world(0,0) - top-left corner', () => {
            const world = tileToWorld(0, 0);
            expect(world.x).toBe(0);
            expect(world.y).toBe(0);
        });

        test('converts tile(1,0) to world(20,0)', () => {
            const world = tileToWorld(1, 0);
            expect(world.x).toBe(20);
            expect(world.y).toBe(0);
        });

        test('converts tile(0,1) to world(0,20)', () => {
            const world = tileToWorld(0, 1);
            expect(world.x).toBe(0);
            expect(world.y).toBe(20);
        });

        test('converts tile(5,10) to world(100,200)', () => {
            const world = tileToWorld(5, 10);
            expect(world.x).toBe(100);
            expect(world.y).toBe(200);
        });
    });

    describe('Large coordinates', () => {
        test('converts tile(27,30) to correct world coordinates', () => {
            const world = tileToWorld(27, 30);
            expect(world.x).toBe(540);
            expect(world.y).toBe(600);
        });

        test('converts tile(13,14) to correct world coordinates', () => {
            const world = tileToWorld(13, 14);
            expect(world.x).toBe(260);
            expect(world.y).toBe(280);
        });
    });

    describe('Tile origin calculation', () => {
        test('returns top-left corner of tile (no offset)', () => {
            const world = tileToWorld(0, 0);
            expect(world.x).toBe(0);
            expect(world.y).toBe(0);
        });

        test('multiple tiles use correct origin offset (0,0)', () => {
            const world1 = tileToWorld(3, 5);
            const world2 = tileToWorld(4, 6);
            expect(world1.x).toBe(60);
            expect(world1.y).toBe(100);
            expect(world2.x).toBe(80);
            expect(world2.y).toBe(120);
        });
    });

    describe('Difference from tileCenter', () => {
        test('tileToWorld returns top-left, tileCenter returns center', () => {
            const tileX = 2;
            const tileY = 2;
            const fromTileToWorld = tileToWorld(tileX, tileY);
            const fromTileCenter = tileCenter(tileX, tileY);
            expect(fromTileToWorld.x).toBe(40);
            expect(fromTileToWorld.y).toBe(40);
            expect(fromTileCenter.x).toBe(50);
            expect(fromTileCenter.y).toBe(50);
        });

        test('tileCenter has tileSize/2 offset (10px) from tileToWorld', () => {
            const tileX = 5;
            const tileY = 3;
            const fromTileToWorld = tileToWorld(tileX, tileY);
            const fromTileCenter = tileCenter(tileX, tileY);
            const diffX = fromTileCenter.x - fromTileToWorld.x;
            const diffY = fromTileCenter.y - fromTileToWorld.y;
            expect(diffX).toBe(10);
            expect(diffY).toBe(10);
        });
    });
});
