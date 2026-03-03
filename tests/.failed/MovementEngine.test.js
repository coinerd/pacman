/**
 * Tests für MovementEngine
 */

import { MovementEngine } from '../../src/movement/core/MovementEngine.js';
import { MovementComponent } from '../../src/movement/core/MovementComponent.js';
import { MazeAdapter } from '../../src/movement/adapters/MazeAdapter.js';
import { Direction } from '../../src/movement/core/Direction.js';

// Test-Maze (einfacher 5x5 Raum mit Wänden)
const createTestMaze = () => [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1]
];

// Maze mit Tunnel
const createTunnelMaze = () => [
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0],  // Tunnel row (1)
    [1, 1, 1, 1, 1, 1, 1]
];

describe('MovementEngine', () => {
    let engine;
    let mazeAdapter;

    beforeEach(() => {
        mazeAdapter = new MazeAdapter(createTestMaze(), { tileSize: 20 });
        engine = new MovementEngine(mazeAdapter, { tileSize: 20 });
    });

    describe('Registration', () => {
        test('should register entity', () => {
            const mc = new MovementComponent({ gridX: 1, gridY: 1 });
            engine.registerEntity('test', mc);

            expect(engine.hasEntity('test')).toBe(true);
            expect(engine.getEntityCount()).toBe(1);
        });

        test('should unregister entity', () => {
            const mc = new MovementComponent({ gridX: 1, gridY: 1 });
            engine.registerEntity('test', mc);
            engine.unregisterEntity('test');

            expect(engine.hasEntity('test')).toBe(false);
            expect(engine.getEntityCount()).toBe(0);
        });

        test('should return movement state', () => {
            const mc = new MovementComponent({ gridX: 1, gridY: 1 });
            engine.registerEntity('test', mc);

            const state = engine.getMovementState('test');
            expect(state).toBe(mc);
        });

        test('should return null for unregistered entity', () => {
            expect(engine.getMovementState('nonexistent')).toBeNull();
        });
    });

    describe('Movement', () => {
        test('should start movement in valid direction', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT
            });
            engine.registerEntity('test', mc);

            const events = engine.update(0);

            expect(mc.isMoving).toBe(true);
            expect(mc.moveProgress).toBeGreaterThan(0);
            expect(events).toContainEqual(expect.objectContaining({
                type: 'movement_started',
                entityId: 'test'
            }));
        });

        test('should not move into wall', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.UP  // Wand bei (1,0)
            });
            engine.registerEntity('test', mc);

            engine.update(0);

            expect(mc.isMoving).toBe(false);
            expect(mc.moveProgress).toBe(0);
        });

        test('should complete movement', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 20  // 1 tile/sec bei tileSize 20
            });
            engine.registerEntity('test', mc);

            // Start movement
            engine.update(0);
            expect(mc.isMoving).toBe(true);

            // Complete movement (1 second)
            const events = engine.update(1);

            expect(mc.isMoving).toBe(false);
            expect(mc.moveProgress).toBe(0);
            expect(mc.gridX).toBe(2);
            expect(events).toContainEqual(expect.objectContaining({
                type: 'movement_completed'
            }));
        });

        test('should interpolate position during movement', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 20
            });
            engine.registerEntity('test', mc);

            engine.update(0);  // Start
            engine.update(0.5); // Halfway

            expect(mc.x).toBeCloseTo(40, 0);  // Halfway between 30 and 50
            expect(mc.moveProgress).toBeCloseTo(0.5, 1);
        });
    });

    describe('Direction Changes', () => {
        test('should apply opposite direction immediately', () => {
            const mc = new MovementComponent({
                gridX: 2,
                gridY: 1,
                direction: Direction.RIGHT
            });
            engine.registerEntity('test', mc);

            const result = engine.setDirection('test', Direction.LEFT);

            expect(result).toBe(true);
            expect(mc.direction).toBe(Direction.LEFT);
        });

        test('should buffer non-opposite direction', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT
            });
            engine.registerEntity('test', mc);

            engine.setDirection('test', Direction.DOWN);

            expect(mc.direction).toBe(Direction.RIGHT);  // Unchanged
            expect(mc.nextDirection).toBe(Direction.DOWN);  // Buffered
        });

        test('should apply buffered direction at center', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 20
            });
            engine.registerEntity('test', mc);

            // Buffer direction
            engine.setDirection('test', Direction.DOWN);
            expect(mc.nextDirection).toBe(Direction.DOWN);

            // Complete movement to center
            engine.update(0);
            engine.update(1);

            // Buffered direction should be applied
            expect(mc.direction).toBe(Direction.DOWN);
            expect(mc.nextDirection).toBe(Direction.NONE);
        });
    });

    describe('Tunnel Wrapping', () => {
        test('should wrap from left to right', () => {
            const tunnelMaze = createTunnelMaze();
            mazeAdapter = new MazeAdapter(tunnelMaze, { tileSize: 20, tunnelRow: 1 });
            engine = new MovementEngine(mazeAdapter, {
                tileSize: 20,
                tunnelRow: 1
            });

            const mc = new MovementComponent({
                gridX: 0,
                gridY: 1,
                x: 10,
                y: 30,
                direction: Direction.LEFT,
                speed: 100
            });
            engine.registerEntity('test', mc);

            // Move left out of bounds
            engine.update(0);
            engine.update(0.2);

            expect(mc.gridX).toBe(6);  // Wrapped to right side
        });

        test('should wrap from right to left', () => {
            const tunnelMaze = createTunnelMaze();
            mazeAdapter = new MazeAdapter(tunnelMaze, { tileSize: 20, tunnelRow: 1 });
            engine = new MovementEngine(mazeAdapter, {
                tileSize: 20,
                tunnelRow: 1
            });

            const mc = new MovementComponent({
                gridX: 6,
                gridY: 1,
                x: 130,
                y: 30,
                direction: Direction.RIGHT,
                speed: 100
            });
            engine.registerEntity('test', mc);

            // Move right out of bounds
            engine.update(0);
            const events = engine.update(0.2);

            expect(mc.gridX).toBe(0);  // Wrapped to left side
            expect(events.some(e => e.type === 'tunnel_wrap')).toBe(true);
        });
    });

    describe('Speed Control', () => {
        test('should set speed', () => {
            const mc = new MovementComponent({ gridX: 1, gridY: 1, speed: 100 });
            engine.registerEntity('test', mc);

            engine.setSpeed('test', 150);

            expect(mc.speed).toBe(150);
        });

        test('should set speed multiplier', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 100
            });
            engine.registerEntity('test', mc);
            engine.setSpeedMultiplier('test', 0.5);

            engine.update(0);
            engine.update(0.4); // With 0.5 multiplier, should take 0.4s for full tile

            expect(mc.moveProgress).toBeGreaterThan(0.4);
        });
    });

    describe('Pause/Resume', () => {
        test('should pause entity', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 100
            });
            engine.registerEntity('test', mc);

            engine.setPaused('test', true);
            engine.update(0);

            expect(mc.isMoving).toBe(false);
        });

        test('should not update paused entities', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 100
            });
            engine.registerEntity('test', mc);
            engine.update(0); // Start movement

            const initialProgress = mc.moveProgress;
            engine.setPaused('test', true);
            engine.update(1); // Try to move while paused

            expect(mc.moveProgress).toBe(initialProgress);
        });

        test('should pause all entities', () => {
            const mc1 = new MovementComponent({ gridX: 1, gridY: 1 });
            const mc2 = new MovementComponent({ gridX: 2, gridY: 1 });
            engine.registerEntity('test1', mc1);
            engine.registerEntity('test2', mc2);

            engine.pauseAll();

            expect(mc1.isPaused).toBe(true);
            expect(mc2.isPaused).toBe(true);
        });

        test('should resume all entities', () => {
            const mc1 = new MovementComponent({ gridX: 1, gridY: 1 });
            const mc2 = new MovementComponent({ gridX: 2, gridY: 1 });
            engine.registerEntity('test1', mc1);
            engine.registerEntity('test2', mc2);

            engine.pauseAll();
            engine.resumeAll();

            expect(mc1.isPaused).toBe(false);
            expect(mc2.isPaused).toBe(false);
        });
    });

    describe('Reset', () => {
        test('should reset all entities', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 100,
                moveProgress: 0.5,
                isMoving: true
            });
            engine.registerEntity('test', mc);

            engine.reset();

            expect(mc.moveProgress).toBe(0);
            expect(mc.isMoving).toBe(false);
            expect(mc.direction).toBe(Direction.NONE);
            expect(mc.speedMultiplier).toBe(1.0);
        });
    });

    describe('Statistics', () => {
        test('should track statistics', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 20
            });
            engine.registerEntity('test', mc);

            // Start movement
            engine.update(0);
            expect(engine.getStats().movesStarted).toBe(1);

            // Complete movement
            engine.update(1);
            expect(engine.getStats().movesCompleted).toBe(1);
        });
    });

    describe('Safety Limits', () => {
        test('should clamp delta time', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 1000 // Very fast
            });
            engine.registerEntity('test', mc);
            engine.update(0);

            // Large delta should be clamped
            engine.update(10); // 10 seconds

            // Should not jump multiple tiles
            expect(mc.gridX).toBeLessThanOrEqual(2);
        });
    });
});
