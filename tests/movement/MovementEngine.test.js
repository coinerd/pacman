/**
 * Tests for MovementEngine
 */

import { MovementEngine } from '../../src/movement/MovementEngine.js';
import { MovementInterface, MOVEMENT_RESULTS } from '../../src/movement/MovementInterface.js';

// Mock movement strategy for testing
class MockMovementStrategy extends MovementInterface {
    constructor(name, result = MOVEMENT_RESULTS.MOVED) {
        super();
        this.name = name;
        this.returnResult = result;
        this.moveCalls = [];
        this.canMoveCalls = [];
    }

    move(entity, context, deltaSeconds) {
        this.moveCalls.push({ entity, context, deltaSeconds });
        return {
            result: this.returnResult,
            newPosition: { x: entity.x, y: entity.y },
            newGridPosition: { gridX: entity.gridX, gridY: entity.gridY },
            newDirection: entity.direction,
            isMoving: this.returnResult === MOVEMENT_RESULTS.MOVED,
            events: [],
            distanceMoved: 10
        };
    }

    canMove(entity, context, direction) {
        this.canMoveCalls.push({ entity, context, direction });
        return true;
    }
}

describe('MovementEngine', () => {
    let engine;
    let mockStrategy;

    beforeEach(() => {
        mockStrategy = new MockMovementStrategy('mock');
        engine = new MovementEngine({ defaultStrategy: mockStrategy });
    });

    describe('constructor', () => {
        test('creates with default strategy', () => {
            const engine = new MovementEngine({ defaultStrategy: mockStrategy });
            expect(engine.defaultStrategy).toBe(mockStrategy);
        });

        test('creates without default strategy', () => {
            const engine = new MovementEngine();
            expect(engine.defaultStrategy).toBeNull();
        });
    });

    describe('registerStrategy', () => {
        test('registers a strategy', () => {
            const strategy = new MockMovementStrategy('test');
            engine.registerStrategy('test', strategy);
            expect(engine.hasStrategy('test')).toBe(true);
        });

        test('returns engine for chaining', () => {
            const strategy = new MockMovementStrategy('test');
            const result = engine.registerStrategy('test', strategy);
            expect(result).toBe(engine);
        });

        test('throws for non-MovementInterface', () => {
            expect(() => engine.registerStrategy('bad', {})).toThrow();
        });
    });

    describe('unregisterStrategy', () => {
        test('unregisters a strategy', () => {
            engine.registerStrategy('temp', new MockMovementStrategy('temp'));
            expect(engine.unregisterStrategy('temp')).toBe(true);
            expect(engine.hasStrategy('temp')).toBe(false);
        });

        test('returns false for non-existent strategy', () => {
            expect(engine.unregisterStrategy('nonexistent')).toBe(false);
        });
    });

    describe('setDefaultStrategy', () => {
        test('sets default by name', () => {
            const strategy = new MockMovementStrategy('new');
            engine.registerStrategy('new', strategy);
            engine.setDefaultStrategy('new');
            expect(engine.defaultStrategy).toBe(strategy);
        });

        test('throws for non-existent strategy', () => {
            expect(() => engine.setDefaultStrategy('nonexistent')).toThrow();
        });
    });

    describe('move', () => {
        const mockEntity = {
            x: 100,
            y: 100,
            gridX: 5,
            gridY: 5,
            direction: { x: 1, y: 0 },
            speed: 100
        };

        const mockContext = { mazeQuery: {} };

        test('moves entity with default strategy', () => {
            const result = engine.move(mockEntity, mockContext, 0.1);
            expect(result.result).toBe(MOVEMENT_RESULTS.MOVED);
            expect(mockStrategy.moveCalls).toHaveLength(1);
        });

        test('moves entity with named strategy', () => {
            const otherStrategy = new MockMovementStrategy('other', MOVEMENT_RESULTS.BLOCKED);
            engine.registerStrategy('other', otherStrategy);

            const result = engine.move(mockEntity, mockContext, 0.1, 'other');
            expect(result.result).toBe(MOVEMENT_RESULTS.BLOCKED);
        });

        test('throws when no strategy available', () => {
            const emptyEngine = new MovementEngine();
            expect(() => emptyEngine.move(mockEntity, mockContext, 0.1)).toThrow();
        });

        test('throws when named strategy not found', () => {
            expect(() => engine.move(mockEntity, mockContext, 0.1, 'nonexistent')).toThrow();
        });
    });

    describe('moveAll', () => {
        const mockEntities = [
            { x: 100, y: 100, gridX: 5, gridY: 5, direction: { x: 1, y: 0 }, speed: 100 },
            { x: 200, y: 200, gridX: 10, gridY: 10, direction: { x: -1, y: 0 }, speed: 100 }
        ];

        const mockContext = { mazeQuery: {} };

        test('moves all entities', () => {
            const results = engine.moveAll(mockEntities, mockContext, 0.1);
            expect(results).toHaveLength(2);
            expect(mockStrategy.moveCalls).toHaveLength(2);
        });

        test('returns results in order', () => {
            const results = engine.moveAll(mockEntities, mockContext, 0.1);
            expect(results[0].newPosition.x).toBe(mockEntities[0].x);
            expect(results[1].newPosition.x).toBe(mockEntities[1].x);
        });
    });

    describe('moveWithContexts', () => {
        test('moves entities with individual contexts', () => {
            const entityContexts = [
                { entity: { x: 100, y: 100, gridX: 5, gridY: 5, direction: { x: 1, y: 0 }, speed: 100 }, context: { id: 1 } },
                { entity: { x: 200, y: 200, gridX: 10, gridY: 10, direction: { x: -1, y: 0 }, speed: 100 }, context: { id: 2 } }
            ];

            const results = engine.moveWithContexts(entityContexts, 0.1);
            expect(results).toHaveLength(2);
            expect(mockStrategy.moveCalls[0].context.id).toBe(1);
            expect(mockStrategy.moveCalls[1].context.id).toBe(2);
        });
    });

    describe('canMove', () => {
        const mockEntity = {
            x: 100, y: 100, gridX: 5, gridY: 5,
            direction: { x: 1, y: 0 }, speed: 100
        };
        const mockContext = { mazeQuery: {} };

        test('checks with default strategy', () => {
            const result = engine.canMove(mockEntity, mockContext, { x: 1, y: 0 });
            expect(result).toBe(true);
            expect(mockStrategy.canMoveCalls).toHaveLength(1);
        });

        test('throws when no strategy available', () => {
            const emptyEngine = new MovementEngine();
            expect(() => emptyEngine.canMove(mockEntity, mockContext, { x: 1, y: 0 })).toThrow();
        });
    });

    describe('calculateDistances', () => {
        test('calculates distances for entities', () => {
            const entities = [
                { speed: 100 },
                { speed: 200 },
                { speed: 0 }
            ];

            const distances = engine.calculateDistances(entities, 0.1);
            expect(distances).toEqual([10, 20, 0]);
        });

        test('handles entities without speed', () => {
            const entities = [
                { speed: 100 },
                {},
                null
            ];

            const distances = engine.calculateDistances(entities, 0.1);
            expect(distances[0]).toBe(10);
            expect(distances[1]).toBe(0);
            expect(distances[2]).toBe(0);
        });
    });

    describe('getStats', () => {
        test('returns engine statistics', () => {
            engine.registerStrategy('one', new MockMovementStrategy('one'));
            engine.registerStrategy('two', new MockMovementStrategy('two'));

            const stats = engine.getStats();
            expect(stats.registeredStrategies).toBe(2);
            expect(stats.strategyNames).toContain('one');
            expect(stats.strategyNames).toContain('two');
            expect(stats.hasDefaultStrategy).toBe(true);
        });
    });

    describe('clearStrategies', () => {
        test('clears all strategies', () => {
            engine.registerStrategy('temp', new MockMovementStrategy('temp'));
            engine.clearStrategies();
            expect(engine.strategies.size).toBe(0);
            expect(engine.defaultStrategy).toBeNull();
        });
    });
});
