/**
 * Tests for CollisionInterface and CollisionResult
 */

import {
    CollisionInterface,
    CollisionResult,
    COLLISION_TYPES,
    COLLISION_EVENTS
} from '../../src/collision/CollisionInterface.js';

describe('CollisionInterface', () => {
    describe('Abstract methods', () => {
        test('checkEntityCollision throws when not implemented', () => {
            const iface = new CollisionInterface();
            expect(() => iface.checkEntityCollision({}, {})).toThrow(
                'CollisionInterface.checkEntityCollision() must be implemented by subclass'
            );
        });

        test('checkTileCollision throws when not implemented', () => {
            const iface = new CollisionInterface();
            expect(() => iface.checkTileCollision({}, 0, 0)).toThrow(
                'CollisionInterface.checkTileCollision() must be implemented by subclass'
            );
        });

        test('checkPointCollision throws when not implemented', () => {
            const iface = new CollisionInterface();
            expect(() => iface.checkPointCollision({}, 0, 0)).toThrow(
                'CollisionInterface.checkPointCollision() must be implemented by subclass'
            );
        });

        test('getAllEntityCollisions throws when not implemented', () => {
            const iface = new CollisionInterface();
            expect(() => iface.getAllEntityCollisions({}, [])).toThrow(
                'CollisionInterface.getAllEntityCollisions() must be implemented by subclass'
            );
        });
    });

    describe('COLLISION_TYPES', () => {
        test('has all required collision types', () => {
            expect(COLLISION_TYPES.NONE).toBe('none');
            expect(COLLISION_TYPES.ENTITY_ENTITY).toBe('entity_entity');
            expect(COLLISION_TYPES.ENTITY_TILE).toBe('entity_tile');
            expect(COLLISION_TYPES.ENTITY_PELLET).toBe('entity_pellet');
            expect(COLLISION_TYPES.ENTITY_POWER_PELLET).toBe('entity_power_pellet');
        });
    });

    describe('COLLISION_EVENTS', () => {
        test('has all required collision events', () => {
            expect(COLLISION_EVENTS.COLLISION_DETECTED).toBe('collision_detected');
            expect(COLLISION_EVENTS.PELLET_CONSUMED).toBe('pellet_consumed');
            expect(COLLISION_EVENTS.POWER_PELLET_CONSUMED).toBe('power_pellet_consumed');
            expect(COLLISION_EVENTS.GHOST_COLLISION).toBe('ghost_collision');
            expect(COLLISION_EVENTS.GHOST_EATEN).toBe('ghost_eaten');
            expect(COLLISION_EVENTS.PACMAN_DIED).toBe('pacman_died');
        });
    });
});

describe('CollisionResult', () => {
    describe('constructor', () => {
        test('creates result with all properties', () => {
            const entityA = { id: 1, x: 10, y: 10 };
            const entityB = { id: 2, x: 20, y: 20 };
            const position = { x: 15, y: 15 };
            const data = { score: 100 };
            const events = [COLLISION_EVENTS.COLLISION_DETECTED];

            const result = new CollisionResult(
                COLLISION_TYPES.ENTITY_ENTITY,
                entityA,
                entityB,
                position,
                data,
                events
            );

            expect(result.type).toBe(COLLISION_TYPES.ENTITY_ENTITY);
            expect(result.entityA).toBe(entityA);
            expect(result.entityB).toBe(entityB);
            expect(result.position).toEqual(position);
            expect(result.data).toEqual(data);
            expect(result.events).toEqual(events);
            expect(result.timestamp).toBeDefined();
        });

        test('has default values for optional parameters', () => {
            const result = new CollisionResult(
                COLLISION_TYPES.NONE,
                null,
                null,
                { x: 0, y: 0 }
            );

            expect(result.data).toEqual({});
            expect(result.events).toEqual([]);
        });
    });

    describe('entityEntity factory', () => {
        test('creates entity-entity collision result', () => {
            const entityA = { id: 1 };
            const entityB = { id: 2 };
            const position = { x: 15, y: 15 };

            const result = CollisionResult.entityEntity(entityA, entityB, position);

            expect(result.type).toBe(COLLISION_TYPES.ENTITY_ENTITY);
            expect(result.entityA).toBe(entityA);
            expect(result.entityB).toBe(entityB);
            expect(result.position).toEqual(position);
            expect(result.events).toContain(COLLISION_EVENTS.COLLISION_DETECTED);
        });

        test('includes additional data', () => {
            const result = CollisionResult.entityEntity(
                { id: 1 },
                { id: 2 },
                { x: 15, y: 15 },
                { radius: 12 }
            );

            expect(result.data.radius).toBe(12);
        });
    });

    describe('pellet factory', () => {
        test('creates pellet collision result', () => {
            const entity = { id: 1 };
            const position = { x: 100, y: 100 };

            const result = CollisionResult.pellet(entity, position, 10);

            expect(result.type).toBe(COLLISION_TYPES.ENTITY_PELLET);
            expect(result.entityA).toBe(entity);
            expect(result.entityB).toBeNull();
            expect(result.position).toEqual(position);
            expect(result.data.score).toBe(10);
            expect(result.events).toContain(COLLISION_EVENTS.PELLET_CONSUMED);
        });
    });

    describe('powerPellet factory', () => {
        test('creates power pellet collision result', () => {
            const entity = { id: 1 };
            const position = { x: 100, y: 100 };

            const result = CollisionResult.powerPellet(entity, position, 50);

            expect(result.type).toBe(COLLISION_TYPES.ENTITY_POWER_PELLET);
            expect(result.data.score).toBe(50);
            expect(result.events).toContain(COLLISION_EVENTS.POWER_PELLET_CONSUMED);
        });
    });

    describe('pacmanDied factory', () => {
        test('creates pacman death collision result', () => {
            const pacman = { id: 1, type: 'pacman' };
            const ghost = { id: 2, type: 'ghost' };
            const position = { x: 50, y: 50 };

            const result = CollisionResult.pacmanDied(pacman, ghost, position);

            expect(result.type).toBe(COLLISION_TYPES.ENTITY_ENTITY);
            expect(result.entityA).toBe(pacman);
            expect(result.entityB).toBe(ghost);
            expect(result.data.type).toBe('pacman_died');
            expect(result.data.score).toBe(0);
            expect(result.events).toContain(COLLISION_EVENTS.PACMAN_DIED);
        });
    });

    describe('ghostEaten factory', () => {
        test('creates ghost eaten collision result', () => {
            const pacman = { id: 1, type: 'pacman' };
            const ghost = { id: 2, type: 'ghost' };
            const position = { x: 50, y: 50 };

            const result = CollisionResult.ghostEaten(pacman, ghost, position, 200);

            expect(result.type).toBe(COLLISION_TYPES.ENTITY_ENTITY);
            expect(result.data.type).toBe('ghost_eaten');
            expect(result.data.score).toBe(200);
            expect(result.events).toContain(COLLISION_EVENTS.GHOST_EATEN);
        });
    });
});
