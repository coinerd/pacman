import { BaseEntity } from '../../src/entities/BaseEntity.js';
import { createMockScene, createSimpleMaze } from '../utils/testHelpers.js';
import { directions, gameConfig } from '../../src/config/gameConfig.js';

describe('BaseEntity', () => {
    let scene;
    let maze;

    beforeEach(() => {
        scene = createMockScene();
        maze = createSimpleMaze(5, 5);
    });

    describe('initialization', () => {
        test('should initialize at correct grid position', () => {
            const entity = new BaseEntity(scene, 2, 3, 10, 0xFFFFFF);

            expect(entity.gridX).toBe(2);
            expect(entity.gridY).toBe(3);
        });

        test('should convert grid to pixel coordinates', () => {
            const entity = new BaseEntity(scene, 2, 3, 10, 0xFFFFFF);

            expect(entity.x).toBe(50);
            expect(entity.y).toBe(70);
        });

        test('should set correct radius', () => {
            const entity = new BaseEntity(scene, 2, 3, 10, 0xFFFFFF);

            expect(entity.radius).toBe(10);
        });

        test('should set correct color', () => {
            const entity = new BaseEntity(scene, 2, 3, 10, 0xFF0000);

            expect(entity.color).toBe(0xFF0000);
        });
    });

    describe('movement validation', () => {
        test('should allow movement into PATH tiles', () => {
            const entity = new BaseEntity(scene, 2, 2, 10, 0xFFFFFF);

            const canMove = entity.canMoveInDirection(directions.RIGHT, maze);

            expect(canMove).toBe(true);
        });

        test('should block movement into WALL tiles', () => {
            const entity = new BaseEntity(scene, 0, 0, 10, 0xFFFFFF);

            const canMove = entity.canMoveInDirection(directions.RIGHT, maze);

            expect(canMove).toBe(false);
        });

        test('should allow movement outside maze bounds (tunnel)', () => {
            const { gameConfig } = require('../../src/config/gameConfig.js');
            const originalTunnelRow = gameConfig.tunnelRow;
            gameConfig.tunnelRow = 2;

            const entity = new BaseEntity(scene, 0, 2, 10, 0xFFFFFF);

            const canMove = entity.canMoveInDirection(directions.LEFT, maze);

            expect(canMove).toBe(true);

            gameConfig.tunnelRow = originalTunnelRow;
        });

        test('should block movement with NONE direction', () => {
            const entity = new BaseEntity(scene, 2, 2, 10, 0xFFFFFF);

            const canMove = entity.canMoveInDirection(directions.NONE, maze);

            expect(canMove).toBe(false);
        });
    });

    describe('grid-based movement', () => {
        test('should snap to tile center when crossing threshold', () => {
            const entity = new BaseEntity(scene, 2, 2, 10, 0xFFFFFF);
            entity.direction = directions.RIGHT;
            entity.isMoving = true;

            entity.updateMovement(1000, maze);

            expect(entity.gridX).toBeGreaterThan(2);
            expect(entity.x % gameConfig.tileSize).toBe(gameConfig.tileSize / 2);
        });

        test('should handle tunnel wrapping', () => {
            const entity = new BaseEntity(scene, 0, 14, 10, 0xFFFFFF);
            entity.direction = directions.LEFT;
            entity.isMoving = true;

            entity.x = -25;
            entity.handleTunnelWrap();

            expect(entity.x).toBeGreaterThan(0);
        });
    });

    describe('state management', () => {
        test('should reset position on call to resetPosition', () => {
            const entity = new BaseEntity(scene, 5, 5, 10, 0xFFFFFF);

            entity.resetPosition(1, 1);

            expect(entity.gridX).toBe(1);
            expect(entity.gridY).toBe(1);
            expect(entity.direction).toEqual(directions.NONE);
            expect(entity.isMoving).toBe(false);
        });

        test('should reset pixel position when grid resets', () => {
            const entity = new BaseEntity(scene, 5, 5, 10, 0xFFFFFF);

            entity.resetPosition(1, 1);

            expect(entity.x).toBe(gameConfig.tileSize + gameConfig.tileSize / 2);
            expect(entity.y).toBe(gameConfig.tileSize + gameConfig.tileSize / 2);
        });

        test('should allow speed changes', () => {
            const entity = new BaseEntity(scene, 2, 2, 10, 0xFFFFFF);

            entity.setSpeed(150);

            expect(entity.speed).toBe(150);
        });

        test('should have default speed of 100', () => {
            const entity = new BaseEntity(scene, 2, 2, 10, 0xFFFFFF);

            expect(entity.speed).toBe(100);
        });
    });
});
