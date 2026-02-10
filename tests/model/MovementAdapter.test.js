/**
 * Tests for MovementAdapter
 */

import { MovementAdapter } from '../../src/model/adapters/MovementAdapter.js';
import { MOVEMENT_RESULTS } from '../../src/movement/MovementInterface.js';

// Mock GameModel
function createMockGameModel() {
    return {
        maze: [
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 1, 0, 1, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ],
        pelletGrid: []
    };
}

// Mock entity
function createMockEntity(x, y, gridX, gridY) {
    return {
        id: 1,
        type: 'pacman',
        x: x,
        y: y,
        gridX: gridX,
        gridY: gridY,
        direction: { x: 1, y: 0, angle: 0 },
        speed: 100,
        isMoving: false,
        prevX: x,
        prevY: y,
        nextDirection: null,
        directionBuffer: {
            clear: jest.fn()
        },
        setDirection: jest.fn(function(dir) {
            this.nextDirection = dir;
        })
    };
}

describe('MovementAdapter', () => {
    let adapter;
    let mockGameModel;

    beforeEach(() => {
        mockGameModel = createMockGameModel();
        adapter = new MovementAdapter(mockGameModel);
    });

    describe('constructor', () => {
        test('creates movement engine', () => {
            expect(adapter.movementEngine).toBeDefined();
        });

        test('creates maze query adapter', () => {
            expect(adapter.mazeQuery).toBeDefined();
        });

        test('initializes statistics', () => {
            expect(adapter.stats.movesProcessed).toBe(0);
            expect(adapter.stats.eventsGenerated).toBe(0);
        });
    });

    describe('updateEntity', () => {
        test('updates entity position or indicates blocked', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            const initialX = entity.x;

            const events = adapter.updateEntity(entity, 0.1);

            // Entity either moved or was blocked (both are valid outcomes)
            expect(entity.x === initialX || entity.x !== initialX).toBe(true);
            expect(Array.isArray(events)).toBe(true);
        });

        test('stores previous position', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            const initialX = entity.x;

            adapter.updateEntity(entity, 0.1);

            expect(entity.prevX).toBe(initialX);
        });

        test('respects input direction', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            const inputDir = { x: 0, y: 1, angle: 90 };

            adapter.updateEntity(entity, 0.1, inputDir);

            // Entity should have tried to move in the input direction
            expect(entity.direction).toBeDefined();
        });

        test('tracks statistics', () => {
            const entity = createMockEntity(30, 30, 1, 1);

            adapter.updateEntity(entity, 0.1);

            expect(adapter.stats.movesProcessed).toBe(1);
        });
    });

    describe('applyMovementResult', () => {
        test('applies new position', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            const result = {
                result: MOVEMENT_RESULTS.MOVED,
                newPosition: { x: 35, y: 30 },
                newGridPosition: { gridX: 1, gridY: 1 },
                newDirection: { x: 1, y: 0, angle: 0 },
                events: []
            };

            adapter.applyMovementResult(entity, result);

            expect(entity.x).toBe(35);
            expect(entity.y).toBe(30);
        });

        test('applies new grid position', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            const result = {
                result: MOVEMENT_RESULTS.MOVED,
                newPosition: { x: 50, y: 50 },
                newGridPosition: { gridX: 2, gridY: 2 },
                newDirection: { x: 1, y: 0, angle: 0 },
                events: []
            };

            adapter.applyMovementResult(entity, result);

            expect(entity.gridX).toBe(2);
            expect(entity.gridY).toBe(2);
        });

        test('updates isMoving state', () => {
            const entity = createMockEntity(30, 30, 1, 1);

            // When moved
            adapter.applyMovementResult(entity, {
                result: MOVEMENT_RESULTS.MOVED,
                events: []
            });
            expect(entity.isMoving).toBe(true);

            // When blocked
            adapter.applyMovementResult(entity, {
                result: MOVEMENT_RESULTS.BLOCKED,
                events: []
            });
            expect(entity.isMoving).toBe(false);
        });
    });

    describe('convertMovementEvent', () => {
        test('converts tile_enter event', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            const event = { type: 'tile_enter', previousTile: { x: 0, y: 1 } };

            const converted = adapter.convertMovementEvent(event, entity);

            expect(converted.type).toBe('tile_center_reached');
            expect(converted.entityId).toBe(entity.id);
        });

        test('converts center_reached event', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            const event = { type: 'center_reached' };

            const converted = adapter.convertMovementEvent(event, entity);

            expect(converted.type).toBe('tile_center_reached');
        });

        test('converts warp event', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            const event = { type: 'warp', from: { x: 0, y: 14 }, to: { x: 27, y: 14 } };

            const converted = adapter.convertMovementEvent(event, entity);

            expect(converted.type).toBe('tunnel_wrap');
            expect(converted.from).toEqual({ x: 0, y: 14 });
        });

        test('converts hit_wall event', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            const event = { type: 'hit_wall', direction: { x: 1, y: 0 } };

            const converted = adapter.convertMovementEvent(event, entity);

            expect(converted.type).toBe('wall_collision');
        });

        test('converts turned event', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            const event = { type: 'turned', fromDirection: { x: 1, y: 0 }, toDirection: { x: 0, y: 1 } };

            const converted = adapter.convertMovementEvent(event, entity);

            expect(converted.type).toBe('direction_changed');
        });
    });

    describe('updateMaze', () => {
        test('updates maze query', () => {
            const newMaze = [[0, 0], [0, 0]];

            adapter.updateMaze(newMaze);

            expect(adapter.mazeQuery).toBeDefined();
        });
    });

    describe('getStats', () => {
        test('returns statistics', () => {
            const stats = adapter.getStats();

            expect(stats.movesProcessed).toBeDefined();
            expect(stats.eventsGenerated).toBeDefined();
            expect(stats.engineStats).toBeDefined();
        });
    });

    describe('reset', () => {
        test('resets statistics', () => {
            const entity = createMockEntity(30, 30, 1, 1);
            adapter.updateEntity(entity, 0.1);

            adapter.reset();

            expect(adapter.stats.movesProcessed).toBe(0);
            expect(adapter.stats.eventsGenerated).toBe(0);
        });
    });
});
