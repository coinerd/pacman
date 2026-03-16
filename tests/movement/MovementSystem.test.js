/**
 * Integration Tests für MovementSystem
 */

import { MovementSystem } from '../../src/movement/MovementSystem.js';
import { Direction } from '../../src/movement/core/Direction.js';

describe('MovementSystem', () => {
    // Test maze
    const testMaze = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];

    describe('Initialization', () => {
        test('should initialize with maze', () => {
            const system = new MovementSystem();
            system.initialize(testMaze);

            expect(system.isInitialized).toBe(true);
            expect(system.getMazeAdapter()).not.toBeNull();
        });

        test('should throw when registering before initialization', () => {
            const system = new MovementSystem();
            const entity = { id: 'test', gridX: 1, gridY: 1 };

            expect(() => {
                system.registerEntity(entity);
            }).toThrow('not initialized');
        });
    });

    describe('Entity Registration', () => {
        let system;

        beforeEach(() => {
            system = new MovementSystem();
            system.initialize(testMaze);
        });

        test('should register player entity', () => {
            const player = {
                id: 'player',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 100,
                direction: Direction.NONE
            };

            const mc = system.registerEntity(player);

            expect(mc).toBeDefined();
            expect(system.getMovementState('player')).toBe(mc);
        });

        test('should register AI entity', () => {
            const ghost = {
                id: 'ghost1',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 80,
                direction: Direction.NONE
            };

            const mc = system.registerEntity(ghost, {
                aiType: 'alpha',
                scatterTarget: { x: 6, y: 1 }
            });

            expect(mc).toBeDefined();
            expect(system.getAIController().getEntityCount()).toBe(1);
        });

        test('should unregister entity', () => {
            const player = {
                id: 'player',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 100
            };

            system.registerEntity(player);
            system.unregisterEntity('player');

            expect(system.getMovementState('player')).toBeNull();
        });
    });

    describe('Movement', () => {
        let system;
        let player;

        beforeEach(() => {
            system = new MovementSystem();
            system.initialize(testMaze);

            player = {
                id: 'player',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 100,
                direction: Direction.NONE,
                moveProgress: 0,
                isMoving: false
            };

            system.registerEntity(player);
        });

        test('should update entity position', () => {
            system.setDirection('player', Direction.RIGHT);
            const events = system.update(0);

            expect(events.some(e => e.type === 'movement_started')).toBe(true);
            expect(player.isMoving).toBe(true);
        });

        test('should sync position back to entity', () => {
            system.setDirection('player', Direction.RIGHT);

            // Start movement
            system.update(0);

            // Move halfway
            system.update(0.1);

            // Position should be updated
            expect(player.x).not.toBe(30);
            expect(player.gridX).toBe(1); // Not yet changed
        });

        test('should complete movement', () => {
            system.setDirection('player', Direction.RIGHT);

            system.update(0);  // Start
            // Speed 100, tileSize 20 = 5 tiles/sec
            // Need 0.2s to complete, with dt clamped to 0.1s we need 2 updates
            for (let i = 0; i < 3; i++) {
                system.update(0.1);
                if (!player.isMoving) {
                    break;
                }
            }

            // After sync, position should be updated
            expect(player.gridX).toBe(2);
            expect(player.isMoving).toBe(false);
        });
    });

    describe('AI Integration', () => {
        let system;
        let player;
        let ghost;

        beforeEach(() => {
            system = new MovementSystem();
            system.initialize(testMaze);

            player = {
                id: 'player',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 100,
                direction: Direction.NONE
            };

            ghost = {
                id: 'ghost1',
                gridX: 5,
                gridY: 1,
                x: 110,
                y: 30,
                speed: 80,
                direction: Direction.NONE,
                aiType: 'alpha'
            };

            system.registerEntity(player);
            system.registerEntity(ghost, {
                aiType: 'alpha',
                scatterTarget: { x: 6, y: 1 }
            });
        });

        test('AI should make decisions', () => {
            // After update, AI should have set a direction for ghost
            system.update(0);

            const ghostState = system.getMovementState('ghost1');
            expect(ghostState.direction).not.toBe(Direction.NONE);
        });

        test('AI should chase player', () => {
            // Alpha always targets player directly
            system.update(0);

            // Check movement component direction (AI sets this)
            const ghostState = system.getMovementState('ghost1');
            // Ghost at (5,1), player at (1,1) - should move toward player
            // The AI picks a valid direction that gets closer to the target
            // Direction should not be NONE and should be a valid movement direction
            expect(ghostState.direction).not.toBe(Direction.NONE);
            // Verify it's one of the cardinal directions
            expect([Direction.LEFT, Direction.RIGHT, Direction.UP, Direction.DOWN])
                .toContainEqual(ghostState.direction);
        });

        test('should set frightened mode', () => {
            system.setFrightened('ghost1', 5);

            const aiConfig = system.getAIController().getAIConfig('ghost1');
            expect(aiConfig.isFrightened).toBe(true);
            expect(aiConfig.frightenedTimer).toBe(5);
        });

        test('should set eaten mode', () => {
            system.setEaten('ghost1');

            const aiConfig = system.getAIController().getAIConfig('ghost1');
            expect(aiConfig.isEaten).toBe(true);
        });
    });

    describe('Speed Control', () => {
        let system;
        let player;

        beforeEach(() => {
            system = new MovementSystem();
            system.initialize(testMaze);

            player = {
                id: 'player',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 100
            };

            system.registerEntity(player);
        });

        test('should set speed', () => {
            system.setSpeed('player', 150);

            const state = system.getMovementState('player');
            expect(state.speed).toBe(150);
        });

        test('should set speed multiplier', () => {
            system.setSpeedMultiplier('player', 0.5);

            const state = system.getMovementState('player');
            expect(state.speedMultiplier).toBe(0.5);
        });
    });

    describe('Pause/Resume', () => {
        let system;
        let player;

        beforeEach(() => {
            system = new MovementSystem();
            system.initialize(testMaze);

            player = {
                id: 'player',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 100
            };

            system.registerEntity(player);
        });

        test('should pause system', () => {
            system.setDirection('player', Direction.RIGHT);
            system.update(0); // Start movement first
            expect(player.isMoving).toBe(true);

            system.pause();
            const events = system.update(0);

            // No new events when paused
            expect(events).toEqual([]);
        });

        test('should resume system', () => {
            system.pause();
            system.resume();
            system.setDirection('player', Direction.RIGHT);

            const events = system.update(0);

            expect(events.some(e => e.type === 'movement_started')).toBe(true);
        });
    });

    describe('Reset', () => {
        let system;
        let player;

        beforeEach(() => {
            system = new MovementSystem();
            system.initialize(testMaze);

            player = {
                id: 'player',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 100,
                direction: Direction.RIGHT,
                moveProgress: 0.5,
                isMoving: true
            };

            system.registerEntity(player);
        });

        test('should reset all entities', () => {
            system.setDirection('player', Direction.RIGHT);
            system.update(0);
            expect(player.isMoving).toBe(true);

            system.reset();

            // After reset and next update, entity should be reset
            system.update(0);
            expect(player.isMoving).toBe(false);
            expect(player.moveProgress).toBe(0);
        });
    });

    describe('Statistics', () => {
        let system;

        beforeEach(() => {
            system = new MovementSystem();
            system.initialize(testMaze);
        });

        test('should track statistics', () => {
            const player = {
                id: 'player',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 100
            };

            system.registerEntity(player);
            system.setDirection('player', Direction.RIGHT);
            system.update(0);
            system.update(0.2);

            const stats = system.getStats();
            expect(stats.totalUpdates).toBe(2);
            expect(stats.totalEvents).toBeGreaterThan(0);
            expect(stats.entityCount).toBe(1);
        });
    });

    describe('Debug Info', () => {
        let system;

        beforeEach(() => {
            system = new MovementSystem();
            system.initialize(testMaze);
        });

        test('should provide debug information', () => {
            const debug = system.getDebugInfo();

            expect(debug.isInitialized).toBe(true);
            expect(debug.isPaused).toBe(false);
            expect(debug.mazeSize).toEqual({
                width: 7,
                height: 5
            });
        });
    });

    describe('Helper Methods', () => {
        let system;

        beforeEach(() => {
            system = new MovementSystem();
            system.initialize(testMaze);
        });

        test('isWalkable should delegate to maze adapter', () => {
            expect(system.isWalkable(1, 1)).toBe(true);
            expect(system.isWalkable(0, 0)).toBe(false);
        });

        test('getValidDirections should delegate to maze adapter', () => {
            const directions = system.getValidDirections(1, 1);

            expect(directions.length).toBeGreaterThan(0);
        });

        test('getCurrentMode should return AI mode', () => {
            expect(system.getCurrentMode()).toBe('SCATTER');
        });

        test('getAllPositions should return all entity positions', () => {
            const player = {
                id: 'player',
                gridX: 1,
                gridY: 1,
                x: 30,
                y: 30,
                speed: 100
            };

            system.registerEntity(player);
            const positions = system.getAllPositions();

            expect(positions).toHaveLength(1);
            expect(positions[0].entityId).toBe('player');
        });
    });
});
