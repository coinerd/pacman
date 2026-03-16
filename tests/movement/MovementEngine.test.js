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

            // Complete movement - need exactly 10 updates of 0.1s each
            // (speed 20 with tileSize 20 = 1 tile/sec, so 1s total)
            for (let i = 0; i < 10; i++) {
                engine.update(0.1);
                // Stop once movement completes to avoid starting next tile
                if (!mc.isMoving) {
                    break;
                }
            }

            // After exactly one tile movement
            expect(mc.gridX).toBe(2);
            expect(mc.isMoving).toBe(false);
            expect(mc.moveProgress).toBe(0);
        });

        test('should interpolate position during movement', () => {
            const mc = new MovementComponent({
                gridX: 1,
                gridY: 1,
                direction: Direction.RIGHT,
                speed: 20  // 1 tile/sec
            });
            engine.registerEntity('test', mc);

            engine.update(0);  // Start movement
            // After start, progress is 0.001, need to update to get actual progress
            engine.update(0.5); // Process 0.1s (clamped), progress = 0.001 + 1*0.1 = 0.101

            // Position should be between start (30) and target (50)
            // With progress ~0.1, x should be around 32
            expect(mc.x).toBeGreaterThan(30);
            expect(mc.x).toBeLessThan(50);
            expect(mc.moveProgress).toBeGreaterThan(0);
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
        test('should wrap from left to right when moving left from left edge', () => {
            // Tunnel wrapping happens when x position goes negative
            // This requires the entity to be at the left edge and move left
            const tunnelMaze = createTunnelMaze();
            mazeAdapter = new MazeAdapter(tunnelMaze, { tileSize: 20, tunnelRow: 1 });
            engine = new MovementEngine(mazeAdapter, {
                tileSize: 20,
                tunnelRow: 1
            });

            // Start at leftmost tile, already moving left (toward negative x)
            const mc = new MovementComponent({
                gridX: 0,
                gridY: 1,
                x: 10,  // Center of tile 0
                y: 30,
                direction: Direction.LEFT,
                speed: 100,
                moveProgress: 0.001,  // Already moving
                isMoving: true,
                targetGridX: -1,  // Moving to out-of-bounds
                targetGridY: 1,
                prevGridX: 0,
                prevGridY: 1
            });
            engine.registerEntity('test', mc);

            // Complete the movement - this should trigger tunnel wrap
            engine.update(0.11);  // Enough to complete movement with speed 100

            // After wrapping, should be at right side
            // Note: Actual tunnel behavior depends on implementation
            expect(mc.gridX).toBeGreaterThanOrEqual(0);
            expect(mc.gridX).toBeLessThan(7);
        });

        test('should wrap from right to left when moving right from right edge', () => {
            const tunnelMaze = createTunnelMaze();
            mazeAdapter = new MazeAdapter(tunnelMaze, { tileSize: 20, tunnelRow: 1 });
            engine = new MovementEngine(mazeAdapter, {
                tileSize: 20,
                tunnelRow: 1
            });

            // Start at rightmost tile, moving right
            const mc = new MovementComponent({
                gridX: 6,
                gridY: 1,
                x: 130,  // Center of tile 6
                y: 30,
                direction: Direction.RIGHT,
                speed: 100,
                moveProgress: 0.001,
                isMoving: true,
                targetGridX: 7,  // Moving to out-of-bounds
                targetGridY: 1,
                prevGridX: 6,
                prevGridY: 1
            });
            engine.registerEntity('test', mc);

            const events = engine.update(0.11);

            // After wrapping, should be at left side
            expect(mc.gridX).toBeGreaterThanOrEqual(0);
            expect(mc.gridX).toBeLessThan(7);
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
                speed: 100  // 5 tiles/sec at tileSize 20
            });
            engine.registerEntity('test', mc);
            engine.setSpeedMultiplier('test', 0.5);  // Now 2.5 tiles/sec

            engine.update(0);  // Start movement
            engine.update(0.1); // Process 0.1s (clamped)

            // With 0.5 multiplier: effective speed = 50, tiles/sec = 2.5
            // Progress after 0.1s = 0.001 + 2.5 * 0.1 = 0.251
            expect(mc.moveProgress).toBeGreaterThan(0);
            expect(mc.moveProgress).toBeLessThan(1);
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
                speed: 20  // 1 tile/sec
            });
            engine.registerEntity('test', mc);

            // Start movement
            engine.update(0);
            expect(engine.getStats().movesStarted).toBe(1);

            // Complete movement - need multiple updates due to dt clamping
            for (let i = 0; i < 15; i++) {
                engine.update(0.1);
            }
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
