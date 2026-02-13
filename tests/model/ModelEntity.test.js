/**
 * ModelEntity Tests
 * Tests for the base model entity class.
 */

import { directions } from '../../src/config/gameConfig.js';
import { ModelEntity } from '../../src/model/ModelEntity.js';
import { createMazeData } from '../../src/utils/MazeLayout.js';

describe('ModelEntity', () => {
    let entity;
    let maze;

    beforeEach(() => {
        const mazeData = createMazeData();
        maze = mazeData.maze;
        entity = new ModelEntity(13, 23, { type: 'test', speed: 100 });
    });

    describe('constructor', () => {
        test('creates entity with unique ID', () => {
            const entity1 = new ModelEntity(0, 0, {});
            const entity2 = new ModelEntity(0, 0, {});
            expect(entity1.id).not.toBe(entity2.id);
        });

        test('sets initial grid position', () => {
            expect(entity.gridX).toBe(13);
            expect(entity.gridY).toBe(23);
        });

        test('sets initial pixel position at center of tile', () => {
            const expectedX = 13 * 20 + 10; // gridX * tileSize + tileSize/2
            const expectedY = 23 * 20 + 10;
            expect(entity.x).toBe(expectedX);
            expect(entity.y).toBe(expectedY);
        });

        test('stores previous positions', () => {
            expect(entity.prevX).toBe(entity.x);
            expect(entity.prevY).toBe(entity.y);
            expect(entity.prevGridX).toBe(13);
            expect(entity.prevGridY).toBe(23);
        });

        test('initializes direction to NONE', () => {
            expect(entity.direction).toBe(directions.NONE);
        });

        test('initializes isMoving to false', () => {
            expect(entity.isMoving).toBe(false);
        });

        test('initializes visualState', () => {
            expect(entity.visualState).toEqual({
                visible: true,
                opacity: 1.0,
                scale: 1.0
            });
        });
    });

    describe('setDirection', () => {
        test('queues direction in buffer', () => {
            entity.setDirection(directions.UP);
            expect(entity.nextDirection).toBe(directions.UP);
        });
    });

    describe('canMoveInDirection', () => {
        test('returns true for walkable direction', () => {
            // Find a position in the middle of a corridor
            // Position (13, 23) should have walkable tiles around it
            // Check directions that are valid (may vary based on maze layout)
            const canMoveUp = entity.canMoveInDirection(directions.UP, maze);
            const canMoveDown = entity.canMoveInDirection(directions.DOWN, maze);
            const canMoveLeft = entity.canMoveInDirection(directions.LEFT, maze);
            const canMoveRight = entity.canMoveInDirection(directions.RIGHT, maze);

            // At least one direction should be valid for a walkable position
            expect(canMoveUp || canMoveDown || canMoveLeft || canMoveRight).toBe(
                true
            );
        });

        test('returns false for wall direction', () => {
            // Create entity at wall position
            const wallEntity = new ModelEntity(0, 0, {});
            expect(wallEntity.canMoveInDirection(directions.UP, maze)).toBe(false);
        });

        test('returns false for NONE direction', () => {
            expect(entity.canMoveInDirection(directions.NONE, maze)).toBe(false);
        });
    });

    describe('isValidPosition', () => {
        test('returns true for walkable tile', () => {
            // (13, 23) is Pacman start position, should be walkable
            // But let's also test a known path position
            const testX = 1;
            const testY = 1;
            expect(entity.isValidPosition(testX, testY, maze)).toBe(true);
        });

        test('returns false for wall tile', () => {
            expect(entity.isValidPosition(0, 0, maze)).toBe(false);
        });

        test('returns true for tunnel edges (outside maze bounds horizontally)', () => {
            // Tunnel row allows movement outside bounds
            const tunnelEntity = new ModelEntity(0, 14, {});
            expect(tunnelEntity.isValidPosition(-1, 14, maze)).toBe(true);
        });

        test('returns false for out of bounds vertically', () => {
            expect(entity.isValidPosition(13, -1, maze)).toBe(false);
            expect(entity.isValidPosition(13, maze.length, maze)).toBe(false);
        });
    });

    describe('handleTunnelWrap', () => {
        test('wraps position when exiting left side of tunnel', () => {
            const tunnelEntity = new ModelEntity(0, 15, {});
            tunnelEntity.x = -5;
            tunnelEntity.gridX = 0;

            const wrapped = tunnelEntity.handleTunnelWrap();

            expect(wrapped).toBe(true);
            expect(tunnelEntity.x).toBe(480);
            expect(tunnelEntity.gridX).toBe(0);
        });

        test('wraps position when exiting right side of tunnel', () => {
            const tunnelEntity = new ModelEntity(24, 15, {});
            tunnelEntity.x = 505;
            tunnelEntity.gridX = 24;

            const wrapped = tunnelEntity.handleTunnelWrap();

            expect(wrapped).toBe(true);
            expect(tunnelEntity.x).toBe(0);
            expect(tunnelEntity.gridX).toBe(0);
        });

        test('does not wrap when not on tunnel row', () => {
            entity.x = -5;
            const wrapped = entity.handleTunnelWrap();
            expect(wrapped).toBe(false);
            expect(entity.x).toBe(-5);
        });
    });

    describe('updatePreviousPosition', () => {
        test('stores current position as previous', () => {
            entity.x = 100;
            entity.y = 200;
            entity.gridX = 5;
            entity.gridY = 10;

            entity.updatePreviousPosition();

            expect(entity.prevX).toBe(100);
            expect(entity.prevY).toBe(200);
            expect(entity.prevGridX).toBe(5);
            expect(entity.prevGridY).toBe(10);
        });
    });

    describe('resetPosition', () => {
        test('resets to specified position', () => {
            entity.direction = directions.UP;
            entity.isMoving = true;
            entity.x = 999;
            entity.y = 999;

            entity.resetPosition(5, 10);

            expect(entity.gridX).toBe(5);
            expect(entity.gridY).toBe(10);
            expect(entity.direction).toBe(directions.NONE);
            expect(entity.isMoving).toBe(false);
        });

        test('updates pixel position to center of tile', () => {
            entity.resetPosition(5, 10);

            expect(entity.x).toBe(5 * 20 + 10);
            expect(entity.y).toBe(10 * 20 + 10);
        });
    });

    describe('getGridPosition', () => {
        test('returns current grid position', () => {
            const pos = entity.getGridPosition();
            expect(pos).toEqual({ x: 13, y: 23 });
        });
    });

    describe('getPixelPosition', () => {
        test('returns current pixel position', () => {
            entity.x = 123;
            entity.y = 456;
            const pos = entity.getPixelPosition();
            expect(pos).toEqual({ x: 123, y: 456 });
        });
    });

    describe('getSnapshot', () => {
        test('returns serializable state snapshot', () => {
            const snapshot = entity.getSnapshot();

            expect(snapshot).toHaveProperty('id');
            expect(snapshot).toHaveProperty('type', 'test');
            expect(snapshot).toHaveProperty('gridX', 13);
            expect(snapshot).toHaveProperty('gridY', 23);
            expect(snapshot).toHaveProperty('x');
            expect(snapshot).toHaveProperty('y');
            expect(snapshot).toHaveProperty('direction');
            expect(snapshot).toHaveProperty('isMoving');
            expect(snapshot).toHaveProperty('speed', 100);
            expect(snapshot).toHaveProperty('visualState');
        });
    });
});
