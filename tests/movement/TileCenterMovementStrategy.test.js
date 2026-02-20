/**
 * TileCenterMovementStrategy Tests
 * Tests for new tile-based movement strategy with progress tracking
 */

import { directions, gameConfig } from '../../src/config/gameConfig.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { TileCenterMovementStrategy } from '../../src/movement/strategies/TileCenterMovementStrategy.js';

describe('TileCenterMovementStrategy', () => {
    let strategy;
    let maze;

    beforeEach(() => {
        // Create simple test maze (5x5)
        maze = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ].map(row => row.map(val => {
            if (val === 1) { return TILE_TYPES.WALL; }
            if (val === 2) { return TILE_TYPES.PACMAN_START; }
            return TILE_TYPES.PATH;
        }));

        strategy = new TileCenterMovementStrategy(maze);
    });

    describe('canMoveTo', () => {
        test('returns true for walkable tile', () => {
            expect(strategy.canMoveTo(1, 1, 2, 1)).toBe(true);
            expect(strategy.canMoveTo(1, 1, 1, 2)).toBe(true);
        });

        test('returns false for wall tile', () => {
            expect(strategy.canMoveTo(1, 1, 0, 1)).toBe(false);
            expect(strategy.canMoveTo(1, 1, 1, 0)).toBe(false);
        });

        test('returns false for out of bounds', () => {
            expect(strategy.canMoveTo(1, 1, 5, 1)).toBe(false);
            expect(strategy.canMoveTo(1, 1, 1, 5)).toBe(false);
        });
    });

    describe('startMovement', () => {
        test('starts movement when target is walkable', () => {
            const entity = createMockEntity(1, 1);

            const result = strategy.startMovement(entity, directions.RIGHT);

            expect(result).toBe(true);
            expect(entity.moveProgress).toBeGreaterThan(0);
            expect(entity.isMoving).toBe(true);
            expect(entity.targetGridX).toBe(2);
            expect(entity.targetGridY).toBe(1);
            expect(entity.direction).toBe(directions.RIGHT);
        });

        test('does not start movement when target is wall', () => {
            const entity = createMockEntity(1, 1);

            const result = strategy.startMovement(entity, directions.UP);

            expect(result).toBe(false);
            expect(entity.moveProgress).toBe(0);
            expect(entity.isMoving).toBe(false);
        });

        test('does not start movement when already moving', () => {
            const entity = createMockEntity(1, 1);
            entity.moveProgress = 0.5;

            const result = strategy.startMovement(entity, directions.RIGHT);

            expect(result).toBe(false);
        });
    });

    describe('updateProgress', () => {
        test('updates moveProgress based on speed and delta', () => {
            const entity = createMockEntity(1, 1);
            entity.speed = 100; // pixels per second
            entity.moveProgress = 0.1;

            const completed = strategy.updateProgress(entity, 0.016); // ~16ms

            expect(completed).toBe(false);
            expect(entity.moveProgress).toBeGreaterThan(0.1);
        });

        test('completes movement when progress >= 1.0', () => {
            const entity = createMockEntity(1, 1);
            entity.speed = 100;
            entity.targetGridX = 2;
            entity.targetGridY = 1;
            entity.moveProgress = 0.99;

            const completed = strategy.updateProgress(entity, 0.02);

            expect(completed).toBe(true);
            expect(entity.gridX).toBe(2);
            expect(entity.gridY).toBe(1);
            expect(entity.moveProgress).toBe(0);
            expect(entity.isMoving).toBe(false);
        });

        test('updates pixel position to target tile center', () => {
            const entity = createMockEntity(1, 1);
            entity.speed = 100;
            entity.targetGridX = 2;
            entity.targetGridY = 1;
            entity.moveProgress = 0.99;

            strategy.updateProgress(entity, 0.02);

            const expectedX = 2 * gameConfig.tileSize + gameConfig.tileSize / 2;
            const expectedY = 1 * gameConfig.tileSize + gameConfig.tileSize / 2;

            expect(entity.x).toBeCloseTo(expectedX, 0.1);
            expect(entity.y).toBeCloseTo(expectedY, 0.1);
        });

        test('does nothing when moveProgress is 0', () => {
            const entity = createMockEntity(1, 1);
            entity.moveProgress = 0;

            const completed = strategy.updateProgress(entity, 0.016);

            expect(completed).toBe(false);
            expect(entity.gridX).toBe(1);
            expect(entity.gridY).toBe(1);
        });
    });

    describe('getInterpolationData', () => {
        test('returns null when not moving', () => {
            const entity = createMockEntity(1, 1);
            entity.moveProgress = 0;

            const data = strategy.getInterpolationData(entity);

            expect(data).toBeNull();
        });

        test('returns interpolation data when moving', () => {
            const entity = createMockEntity(1, 1);
            entity.targetGridX = 2;
            entity.targetGridY = 1;
            entity.moveProgress = 0.5;

            const data = strategy.getInterpolationData(entity);

            expect(data).not.toBeNull();
            expect(data.progress).toBe(0.5);
            expect(data.prevCenterX).toBeDefined();
            expect(data.prevCenterY).toBeDefined();
            expect(data.nextCenterX).toBeDefined();
            expect(data.nextCenterY).toBeDefined();
        });
    });

    describe('stopMovement', () => {
        test('stops movement immediately', () => {
            const entity = createMockEntity(1, 1);
            entity.targetGridX = 2;
            entity.targetGridY = 1;
            entity.moveProgress = 0.5;
            entity.isMoving = true;

            strategy.stopMovement(entity);

            expect(entity.moveProgress).toBe(0);
            expect(entity.isMoving).toBe(false);
            expect(entity.targetGridX).toBe(entity.gridX);
            expect(entity.targetGridY).toBe(entity.gridY);
        });
    });
});

function createMockEntity(gridX, gridY) {
    return {
        id: 'test-entity',
        gridX,
        gridY,
        prevGridX: gridX,
        prevGridY: gridY,
        targetGridX: gridX,
        targetGridY: gridY,
        x: gridX * gameConfig.tileSize + gameConfig.tileSize / 2,
        y: gridY * gameConfig.tileSize + gameConfig.tileSize / 2,
        moveProgress: 0,
        isMoving: false,
        direction: directions.NONE,
        speed: 100
    };
}
