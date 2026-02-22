/**
 * Tests für MovementComponent
 */

import { MovementComponent } from '../../src/movement/core/MovementComponent.js';
import { Direction } from '../../src/movement/core/Direction.js';

describe('MovementComponent', () => {
    describe('Constructor', () => {
        test('should create with default values', () => {
            const mc = new MovementComponent();

            expect(mc.gridX).toBe(0);
            expect(mc.gridY).toBe(0);
            expect(mc.speed).toBe(100);
            expect(mc.direction).toBe(Direction.NONE);
            expect(mc.moveProgress).toBe(0);
            expect(mc.isMoving).toBe(false);
        });

        test('should create with custom values', () => {
            const mc = new MovementComponent({
                gridX: 5,
                gridY: 10,
                speed: 150,
                direction: Direction.RIGHT
            });

            expect(mc.gridX).toBe(5);
            expect(mc.gridY).toBe(10);
            expect(mc.speed).toBe(150);
            expect(mc.direction).toBe(Direction.RIGHT);
        });

        test('should calculate default pixel positions', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 2
            });

            // Default tileSize = 20
            expect(mc.x).toBe(1 * 20 + 10);
            expect(mc.y).toBe(2 * 20 + 10);
        });

        test('should use provided pixel positions', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 2,
                x: 50,
                y: 100
            });

            expect(mc.x).toBe(50);
            expect(mc.y).toBe(100);
        });
    });

    describe('fromEntity', () => {
        test('should create from entity', () => {
            const entity = {
                id: 'test-entity',
                gridX: 3,
                gridY: 4,
                x: 70,
                y: 90,
                speed: 120,
                direction: Direction.LEFT
            };

            const mc = MovementComponent.fromEntity(entity);

            expect(mc.entityId).toBe('test-entity');
            expect(mc.gridX).toBe(3);
            expect(mc.gridY).toBe(4);
            expect(mc.x).toBe(70);
            expect(mc.y).toBe(90);
            expect(mc.speed).toBe(120);
            expect(mc.direction).toBe(Direction.LEFT);
        });

        test('should merge options', () => {
            const entity = {
                id: 'test',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 100,
                direction: Direction.UP
            };

            const mc = MovementComponent.fromEntity(entity, {
                speed: 200,
                entityId: 'custom-id'
            });

            expect(mc.speed).toBe(200);
            expect(mc.entityId).toBe('custom-id');
        });
    });

    describe('clone', () => {
        test('should create independent copy', () => {
            const original = new MovementComponent({
                gridX: 5,
                gridY: 5,
                speed: 150,
                direction: Direction.RIGHT
            });

            original.moveProgress = 0.5;
            original.isMoving = true;

            const clone = original.clone();

            expect(clone.gridX).toBe(original.gridX);
            expect(clone.gridY).toBe(original.gridY);
            expect(clone.moveProgress).toBe(original.moveProgress);
            expect(clone.isMoving).toBe(original.isMoving);

            // Modifikation sollte Original nicht beeinflussen
            clone.gridX = 999;
            expect(original.gridX).toBe(5);
        });
    });

    describe('serialize/deserialize', () => {
        test('should serialize to object', () => {
            const mc = new MovementComponent({
                gridX: 3,
                gridY: 4,
                speed: 150,
                direction: Direction.LEFT
            });

            mc.moveProgress = 0.5;
            mc.isMoving = true;

            const serialized = mc.serialize();

            expect(serialized.gridX).toBe(3);
            expect(serialized.gridY).toBe(4);
            expect(serialized.direction).toBe('LEFT');
            expect(serialized.speed).toBe(150);
            expect(serialized.moveProgress).toBe(0.5);
            expect(serialized.isMoving).toBe(true);
        });

        test('should deserialize from object', () => {
            const data = {
                gridX: 2,
                gridY: 3,
                x: 50,
                y: 70,
                direction: 'RIGHT',
                speed: 120,
                moveProgress: 0.3,
                isMoving: true,
                speedMultiplier: 0.5
            };

            const mc = MovementComponent.deserialize(data);

            expect(mc.gridX).toBe(2);
            expect(mc.gridY).toBe(3);
            expect(mc.direction).toBe(Direction.RIGHT);
            expect(mc.speed).toBe(120);
            expect(mc.moveProgress).toBe(0.3);
            expect(mc.speedMultiplier).toBe(0.5);
        });

        test('serialize/deserialize roundtrip', () => {
            const original = new MovementComponent({
                gridX: 5,
                gridY: 5,
                direction: Direction.DOWN,
                speed: 180
            });
            original.moveProgress = 0.75;

            const serialized = original.serialize();
            const restored = MovementComponent.deserialize(serialized);

            expect(restored.gridX).toBe(original.gridX);
            expect(restored.gridY).toBe(original.gridY);
            expect(restored.direction).toBe(original.direction);
            expect(restored.moveProgress).toBe(original.moveProgress);
        });
    });

    describe('updatePreviousPositions', () => {
        test('should update previous positions', () => {
            const mc = new MovementComponent({
                gridX: 5,
                gridY: 5,
                x: 110,
                y: 110
            });

            mc.gridX = 6;
            mc.gridY = 6;
            mc.x = 130;
            mc.y = 130;

            mc.updatePreviousPositions();

            expect(mc.prevGridX).toBe(6);
            expect(mc.prevGridY).toBe(6);
            expect(mc.prevX).toBe(130);
            expect(mc.prevY).toBe(130);
        });
    });

    describe('isAtCenter', () => {
        test('should return true when at center', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                x: 30,  // 1 * 20 + 10
                y: 30
            });

            expect(mc.isAtCenter(20)).toBe(true);
        });

        test('should return false when not at center', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                x: 35,  // Nicht zentriert
                y: 30
            });

            expect(mc.isAtCenter(20)).toBe(false);
        });

        test('should respect tolerance', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                x: 31,  // 1px Abstand
                y: 30
            });

            expect(mc.isAtCenter(20, 1)).toBe(true);
            expect(mc.isAtCenter(20, 0)).toBe(false);
        });
    });

    describe('getRemainingTime', () => {
        test('should calculate remaining time correctly', () => {
            const mc = new MovementComponent({
                speed: 100
            });
            mc.moveProgress = 0.5;
            mc.isMoving = true;

            // Speed 100, TileSize 20 = 5 tiles/sec
            // Remaining progress 0.5 / 5 = 0.1 sec
            expect(mc.getRemainingTime(20)).toBeCloseTo(0.1, 2);
        });

        test('should return 0 when not moving', () => {
            const mc = new MovementComponent({
                speed: 100
            });
            mc.moveProgress = 0;
            mc.isMoving = false;

            expect(mc.getRemainingTime(20)).toBe(0);
        });

        test('should consider speedMultiplier', () => {
            const mc = new MovementComponent({
                speed: 100
            });
            mc.moveProgress = 0.5;
            mc.isMoving = true;
            mc.speedMultiplier = 0.5;

            // Half speed = double time
            expect(mc.getRemainingTime(20)).toBeCloseTo(0.2, 2);
        });
    });

    describe('getEffectiveSpeed', () => {
        test('should return base speed when no multiplier', () => {
            const mc = new MovementComponent({ speed: 100 });
            expect(mc.getEffectiveSpeed()).toBe(100);
        });

        test('should apply multiplier', () => {
            const mc = new MovementComponent({ speed: 100 });
            mc.speedMultiplier = 0.5;
            expect(mc.getEffectiveSpeed()).toBe(50);
        });

        test('should apply multiplier > 1', () => {
            const mc = new MovementComponent({ speed: 100 });
            mc.speedMultiplier = 2.0;
            expect(mc.getEffectiveSpeed()).toBe(200);
        });
    });
});
