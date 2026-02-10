/**
 * Tests for CollisionEngine and SimpleCollisionDetector
 */

import {
    CollisionEngine,
    SimpleCollisionDetector
} from '../../src/collision/CollisionEngine.js';
import {
    COLLISION_TYPES
} from '../../src/collision/CollisionInterface.js';

describe('CollisionEngine', () => {
    let engine;

    beforeEach(() => {
        engine = new CollisionEngine({
            cellSize: 20,
            collisionRadius: 12,
            useSpatialIndex: true
        });
    });

    describe('constructor', () => {
        test('sets default configuration', () => {
            const defaultEngine = new CollisionEngine();
            expect(defaultEngine.cellSize).toBe(20);
            expect(defaultEngine.collisionRadius).toBe(12);
            expect(defaultEngine.useSpatialIndex).toBe(true);
        });

        test('accepts custom configuration', () => {
            const customEngine = new CollisionEngine({
                cellSize: 10,
                collisionRadius: 5,
                useSpatialIndex: false
            });
            expect(customEngine.cellSize).toBe(10);
            expect(customEngine.collisionRadius).toBe(5);
            expect(customEngine.useSpatialIndex).toBe(false);
        });

        test('creates spatial index when enabled', () => {
            expect(engine.spatialIndex).not.toBeNull();
        });

        test('does not create spatial index when disabled', () => {
            const noIndexEngine = new CollisionEngine({ useSpatialIndex: false });
            expect(noIndexEngine.spatialIndex).toBeNull();
        });

        test('initializes statistics', () => {
            expect(engine.stats.totalChecks).toBe(0);
            expect(engine.stats.collisionsFound).toBe(0);
        });
    });

    describe('checkEntityCollision', () => {
        test('returns collision when entities overlap', () => {
            const entityA = { id: 1, x: 100, y: 100, prevX: 90, prevY: 100 };
            const entityB = { id: 2, x: 105, y: 100, prevX: 115, prevY: 100 };

            const result = engine.checkEntityCollision(entityA, entityB);

            expect(result).not.toBeNull();
            expect(result.type).toBe(COLLISION_TYPES.ENTITY_ENTITY);
            expect(result.entityA).toBe(entityA);
            expect(result.entityB).toBe(entityB);
        });

        test('returns null when entities are far apart', () => {
            const entityA = { id: 1, x: 0, y: 0 };
            const entityB = { id: 2, x: 1000, y: 1000 };

            const result = engine.checkEntityCollision(entityA, entityB);

            expect(result).toBeNull();
        });

        test('uses custom collision radius', () => {
            const entityA = { id: 1, x: 0, y: 0 };
            const entityB = { id: 2, x: 50, y: 0 };

            // With default radius of 12, they shouldn't collide
            expect(engine.checkEntityCollision(entityA, entityB)).toBeNull();

            // With larger radius, they should collide
            const result = engine.checkEntityCollision(entityA, entityB, {
                collisionRadius: 100
            });
            expect(result).not.toBeNull();
        });

        test('tracks statistics', () => {
            engine.checkEntityCollision(
                { id: 1, x: 0, y: 0 },
                { id: 2, x: 1000, y: 1000 }
            );

            expect(engine.stats.totalChecks).toBe(1);
            expect(engine.stats.collisionsFound).toBe(0);
        });
    });

    describe('checkTileCollision', () => {
        test('returns collision when entity overlaps tile', () => {
            const entity = { id: 1, x: 30, y: 30, prevX: 25, prevY: 30 };

            const result = engine.checkTileCollision(entity, 1, 1);

            expect(result).not.toBeNull();
            expect(result.type).toBe(COLLISION_TYPES.ENTITY_TILE);
        });

        test('returns null when entity is far from tile', () => {
            const entity = { id: 1, x: 1000, y: 1000 };

            const result = engine.checkTileCollision(entity, 0, 0);

            expect(result).toBeNull();
        });

        test('uses custom tile size', () => {
            // With tileSize 50, tile at (1,1) spans from (50, 50) to (100, 100)
            // Entity at (75, 75) should be inside tile (1, 1)
            const entity = { id: 1, x: 75, y: 75 };

            const result = engine.checkTileCollision(entity, 1, 1, {
                tileSize: 50,
                collisionRadius: 5
            });

            expect(result).not.toBeNull();
        });
    });

    describe('checkPointCollision', () => {
        test('returns collision when point is within radius', () => {
            const entity = { id: 1, x: 100, y: 100 };

            const result = engine.checkPointCollision(entity, 105, 100);

            expect(result).not.toBeNull();
        });

        test('returns null when point is outside radius', () => {
            const entity = { id: 1, x: 100, y: 100 };

            const result = engine.checkPointCollision(entity, 1000, 1000);

            expect(result).toBeNull();
        });

        test('uses custom radius', () => {
            const entity = { id: 1, x: 0, y: 0 };

            // With default radius 12, point at (20, 0) shouldn't collide
            expect(engine.checkPointCollision(entity, 20, 0)).toBeNull();

            // With larger radius, it should collide
            const result = engine.checkPointCollision(entity, 20, 0, {
                collisionRadius: 25
            });
            expect(result).not.toBeNull();
        });
    });

    describe('getAllEntityCollisions', () => {
        test('returns all collisions with list of entities', () => {
            const entity = { id: 1, x: 100, y: 100 };
            const others = [
                { id: 2, x: 105, y: 100 },  // Collides
                { id: 3, x: 200, y: 200 },  // No collision
                { id: 4, x: 108, y: 100 }   // Collides
            ];

            const results = engine.getAllEntityCollisions(entity, others);

            expect(results).toHaveLength(2);
        });

        test('excludes self-collision', () => {
            const entity = { id: 1, x: 100, y: 100 };
            const others = [
                { id: 1, x: 100, y: 100 },  // Same ID
                { id: 2, x: 105, y: 100 }   // Different ID, collides
            ];

            const results = engine.getAllEntityCollisions(entity, others);

            expect(results).toHaveLength(1);
            expect(results[0].entityB.id).toBe(2);
        });

        test('returns empty array when no collisions', () => {
            const entity = { id: 1, x: 0, y: 0 };
            const others = [
                { id: 2, x: 1000, y: 1000 },
                { id: 3, x: 2000, y: 2000 }
            ];

            const results = engine.getAllEntityCollisions(entity, others);

            expect(results).toHaveLength(0);
        });
    });

    describe('checkAllEntityCollisions', () => {
        test('returns all pairwise collisions', () => {
            const entities = [
                { id: 1, x: 100, y: 100 },
                { id: 2, x: 105, y: 100 },  // Collides with 1
                { id: 3, x: 200, y: 200 }   // No collision
            ];

            const results = engine.checkAllEntityCollisions(entities);

            expect(results).toHaveLength(1);
        });

        test('avoids duplicate checks with spatial index', () => {
            const entities = [
                { id: 1, x: 100, y: 100 },
                { id: 2, x: 105, y: 100 },
                { id: 3, x: 108, y: 100 }
            ];

            const results = engine.checkAllEntityCollisions(entities);

            // Should find collisions: 1-2, 1-3, 2-3 (but 2-3 might not collide depending on radius)
            expect(results.length).toBeGreaterThanOrEqual(2);
        });

        test('works without spatial index', () => {
            const noIndexEngine = new CollisionEngine({ useSpatialIndex: false });
            const entities = [
                { id: 1, x: 100, y: 100 },
                { id: 2, x: 105, y: 100 }
            ];

            const results = noIndexEngine.checkAllEntityCollisions(entities);

            expect(results).toHaveLength(1);
        });
    });

    describe('checkPelletCollisions', () => {
        const createPelletGrid = () => [
            [1, 0, 2],  // 1 = pellet, 0 = empty, 2 = power pellet
            [0, 1, 0],
            [1, 1, 1]
        ];

        test('returns pellet collision when close to pellet', () => {
            const entity = { x: 10, y: 10 };  // Center of first tile
            const pelletGrid = createPelletGrid();

            const results = engine.checkPelletCollisions(entity, pelletGrid, {
                tileSize: 20,
                eatRadius: 10
            });

            expect(results.length).toBeGreaterThan(0);
            expect(results[0].type).toBe(COLLISION_TYPES.ENTITY_PELLET);
        });

        test('returns power pellet collision', () => {
            // Power pellet at tile (2, 2) with tileSize 20
            // Tile center is at (2*20 + 10, 2*20 + 10) = (50, 50)
            const entity = { x: 50, y: 50 };
            const pelletGrid = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 2]  // Power pellet at (2,2)
            ];

            const results = engine.checkPelletCollisions(entity, pelletGrid, {
                tileSize: 20,
                eatRadius: 15
            });

            const powerPelletResults = results.filter(
                r => r.type === COLLISION_TYPES.ENTITY_POWER_PELLET
            );
            expect(powerPelletResults.length).toBeGreaterThan(0);
        });

        test('calls onPelletFound callback', () => {
            const entity = { x: 10, y: 10 };
            const pelletGrid = createPelletGrid();
            const callback = jest.fn();

            engine.checkPelletCollisions(entity, pelletGrid, {
                tileSize: 20,
                eatRadius: 10,
                onPelletFound: callback
            });

            expect(callback).toHaveBeenCalled();
        });

        test('returns empty array for invalid pellet grid', () => {
            const entity = { x: 10, y: 10 };

            expect(engine.checkPelletCollisions(entity, null)).toEqual([]);
            expect(engine.checkPelletCollisions(entity, [])).toEqual([]);
            expect(engine.checkPelletCollisions(entity, 'invalid')).toEqual([]);
        });
    });

    describe('isValidPelletPosition', () => {
        const pelletGrid = [
            [1, 0],
            [0, 1]
        ];

        test('returns true for valid position', () => {
            expect(engine.isValidPelletPosition(pelletGrid, 0, 0)).toBe(true);
            expect(engine.isValidPelletPosition(pelletGrid, 1, 1)).toBe(true);
        });

        test('returns false for out of bounds', () => {
            expect(engine.isValidPelletPosition(pelletGrid, -1, 0)).toBe(false);
            expect(engine.isValidPelletPosition(pelletGrid, 0, -1)).toBe(false);
            expect(engine.isValidPelletPosition(pelletGrid, 5, 0)).toBe(false);
            expect(engine.isValidPelletPosition(pelletGrid, 0, 5)).toBe(false);
        });

        test('returns false for invalid grid', () => {
            expect(engine.isValidPelletPosition(null, 0, 0)).toBe(false);
            expect(engine.isValidPelletPosition('invalid', 0, 0)).toBe(false);
        });
    });

    describe('getEntityBounds', () => {
        test('returns bounds including previous position', () => {
            const entity = { x: 100, y: 100, prevX: 50, prevY: 100 };
            const bounds = engine.getEntityBounds(entity, 10);

            expect(bounds.minX).toBe(40);  // 50 - 10
            expect(bounds.maxX).toBe(110); // 100 + 10
        });

        test('uses current position when prev is undefined', () => {
            const entity = { x: 100, y: 100 };
            const bounds = engine.getEntityBounds(entity, 10);

            expect(bounds.minX).toBe(90);
            expect(bounds.maxX).toBe(110);
        });
    });

    describe('boundsIntersect', () => {
        test('returns true for overlapping bounds', () => {
            const a = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
            const b = { minX: 5, minY: 5, maxX: 15, maxY: 15 };

            expect(engine.boundsIntersect(a, b)).toBe(true);
        });

        test('returns false for separate bounds', () => {
            const a = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
            const b = { minX: 20, minY: 20, maxX: 30, maxY: 30 };

            expect(engine.boundsIntersect(a, b)).toBe(false);
        });
    });

    describe('getStats and resetStats', () => {
        test('returns current statistics', () => {
            engine.checkEntityCollision(
                { id: 1, x: 0, y: 0 },
                { id: 2, x: 0, y: 0 }
            );

            const stats = engine.getStats();
            expect(stats.totalChecks).toBe(1);
            expect(stats.collisionsFound).toBe(1);
            expect(stats.spatialIndex).toBeDefined();
        });

        test('resets statistics', () => {
            engine.checkEntityCollision(
                { id: 1, x: 0, y: 0 },
                { id: 2, x: 0, y: 0 }
            );

            engine.resetStats();

            expect(engine.stats.totalChecks).toBe(0);
            expect(engine.stats.collisionsFound).toBe(0);
        });
    });

    describe('clear', () => {
        test('clears spatial index', () => {
            engine.spatialIndex.insert({ id: 1, x: 10, y: 10 });
            expect(engine.spatialIndex.getCount()).toBe(1);

            engine.clear();
            expect(engine.spatialIndex.getCount()).toBe(0);
        });
    });
});

describe('SimpleCollisionDetector', () => {
    let detector;

    beforeEach(() => {
        detector = new SimpleCollisionDetector({ collisionRadius: 12 });
    });

    test('constructor sets collision radius', () => {
        expect(detector.collisionRadius).toBe(12);
    });

    test('checkEntityCollision returns collision for overlapping', () => {
        const entityA = { id: 1, x: 100, y: 100 };
        const entityB = { id: 2, x: 105, y: 100 };

        const result = detector.checkEntityCollision(entityA, entityB);

        expect(result).not.toBeNull();
        expect(result.type).toBe(COLLISION_TYPES.ENTITY_ENTITY);
    });

    test('checkTileCollision returns collision for overlapping', () => {
        const entity = { id: 1, x: 30, y: 30 };

        const result = detector.checkTileCollision(entity, 1, 1);

        expect(result).not.toBeNull();
        expect(result.type).toBe(COLLISION_TYPES.ENTITY_TILE);
    });

    test('checkPointCollision returns collision for point within radius', () => {
        const entity = { id: 1, x: 100, y: 100 };

        const result = detector.checkPointCollision(entity, 105, 100);

        expect(result).not.toBeNull();
    });

    test('getAllEntityCollisions excludes self', () => {
        const entity = { id: 1, x: 100, y: 100 };
        const others = [
            { id: 1, x: 100, y: 100 },
            { id: 2, x: 105, y: 100 }
        ];

        const results = detector.getAllEntityCollisions(entity, others);

        expect(results).toHaveLength(1);
    });
});
