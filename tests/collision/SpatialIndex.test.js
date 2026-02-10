/**
 * Tests for SpatialIndex
 */

import {
    SpatialIndex,
    DynamicSpatialIndex
} from '../../src/collision/spatial/SpatialIndex.js';

describe('SpatialIndex', () => {
    let index;

    beforeEach(() => {
        index = new SpatialIndex(20);
    });

    describe('constructor', () => {
        test('sets cell size', () => {
            const idx = new SpatialIndex(10);
            expect(idx.cellSize).toBe(10);
        });

        test('uses default cell size', () => {
            const idx = new SpatialIndex();
            expect(idx.cellSize).toBe(20);
        });

        test('initializes empty cells map', () => {
            expect(index.cells.size).toBe(0);
        });
    });

    describe('clear', () => {
        test('removes all cells', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            expect(index.cells.size).toBeGreaterThan(0);

            index.clear();
            expect(index.cells.size).toBe(0);
        });

        test('removes entity cell tracking', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            expect(index.entityCells.size).toBeGreaterThan(0);

            index.clear();
            expect(index.entityCells.size).toBe(0);
        });
    });

    describe('getCellKey', () => {
        test('calculates correct cell key', () => {
            expect(index.getCellKey(10, 10)).toBe('0,0');
            expect(index.getCellKey(25, 35)).toBe('1,1');
            expect(index.getCellKey(0, 0)).toBe('0,0');
        });

        test('handles negative coordinates', () => {
            expect(index.getCellKey(-5, -5)).toBe('-1,-1');
        });
    });

    describe('getCellCoords', () => {
        test('calculates correct cell coordinates', () => {
            expect(index.getCellCoords(10, 10)).toEqual({ x: 0, y: 0 });
            expect(index.getCellCoords(25, 35)).toEqual({ x: 1, y: 1 });
        });
    });

    describe('insert', () => {
        test('inserts entity into correct cell', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            expect(index.cells.has('0,0')).toBe(true);
            expect(index.cells.get('0,0')).toHaveLength(1);
        });

        test('inserts multiple entities into same cell', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            index.insert({ id: 2, x: 15, y: 15 });
            expect(index.cells.get('0,0')).toHaveLength(2);
        });

        test('inserts entities into different cells', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            index.insert({ id: 2, x: 30, y: 30 });
            expect(index.cells.get('0,0')).toHaveLength(1);
            expect(index.cells.get('1,1')).toHaveLength(1);
        });

        test('tracks entity cell', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            expect(index.entityCells.get(1)).toBe('0,0');
        });

        test('ignores entity without x or y', () => {
            index.insert({ id: 1 });
            expect(index.cells.size).toBe(0);
        });
    });

    describe('remove', () => {
        test('removes entity from cell', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            index.remove({ id: 1 });
            expect(index.cells.get('0,0')).toHaveLength(0);
        });

        test('stops tracking entity cell', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            index.remove({ id: 1 });
            expect(index.entityCells.has(1)).toBe(false);
        });

        test('handles removing non-existent entity', () => {
            expect(() => index.remove({ id: 999 })).not.toThrow();
        });

        test('handles entity without id', () => {
            index.insert({ x: 10, y: 10 });
            expect(() => index.remove({ x: 10, y: 10 })).not.toThrow();
        });
    });

    describe('update', () => {
        test('moves entity to new cell', () => {
            const entity = { id: 1, x: 10, y: 10 };
            index.insert(entity);

            entity.x = 30;
            index.update(entity);

            expect(index.cells.has('0,0')).toBe(false);
            expect(index.cells.has('1,0')).toBe(true);
            expect(index.entityCells.get(1)).toBe('1,0');
        });

        test('does nothing if entity stays in same cell', () => {
            const entity = { id: 1, x: 10, y: 10 };
            index.insert(entity);

            entity.x = 15;
            index.update(entity);

            expect(index.cells.get('0,0')).toHaveLength(1);
        });

        test('handles entity without id', () => {
            const entity = { x: 10, y: 10 };
            expect(() => index.update(entity)).not.toThrow();
        });
    });

    describe('query', () => {
        beforeEach(() => {
            index.insert({ id: 1, x: 10, y: 10 });
            index.insert({ id: 2, x: 15, y: 15 });
            index.insert({ id: 3, x: 100, y: 100 });
        });

        test('returns entities within radius', () => {
            const results = index.query(10, 10, 20);
            expect(results).toHaveLength(2);
            expect(results.map(e => e.id)).toContain(1);
            expect(results.map(e => e.id)).toContain(2);
        });

        test('filters by actual distance', () => {
            const results = index.query(10, 10, 5);
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(1);
        });

        test('returns entity when exactly at query point', () => {
            // Entity at (10, 10), query at (10, 10) with radius 1
            // Distance is 0, so entity should be found
            const results = index.query(10, 10, 1);
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(1);
        });

        test('checks multiple cells', () => {
            index.insert({ id: 4, x: 35, y: 35 });
            const results = index.query(20, 20, 30);
            expect(results.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('queryRect', () => {
        beforeEach(() => {
            index.insert({ id: 1, x: 10, y: 10 });
            index.insert({ id: 2, x: 30, y: 30 });
            index.insert({ id: 3, x: 100, y: 100 });
        });

        test('returns entities within rectangle', () => {
            const results = index.queryRect(0, 0, 50, 50);
            expect(results).toHaveLength(2);
        });

        test('filters by actual position', () => {
            const results = index.queryRect(0, 0, 20, 20);
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(1);
        });

        test('returns empty array for empty region', () => {
            const results = index.queryRect(200, 200, 300, 300);
            expect(results).toHaveLength(0);
        });
    });

    describe('getAll', () => {
        test('returns all entities', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            index.insert({ id: 2, x: 30, y: 30 });

            const all = index.getAll();
            expect(all).toHaveLength(2);
        });

        test('returns empty array when empty', () => {
            expect(index.getAll()).toHaveLength(0);
        });
    });

    describe('getCount', () => {
        test('returns total entity count', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            index.insert({ id: 2, x: 30, y: 30 });

            expect(index.getCount()).toBe(2);
        });

        test('returns 0 when empty', () => {
            expect(index.getCount()).toBe(0);
        });
    });

    describe('getStats', () => {
        test('returns statistics', () => {
            index.insert({ id: 1, x: 10, y: 10 });
            index.insert({ id: 2, x: 30, y: 30 });

            const stats = index.getStats();
            expect(stats.cellCount).toBe(2);
            expect(stats.entityCount).toBe(2);
            expect(stats.avgEntitiesPerCell).toBe(1);
        });

        test('handles empty index', () => {
            const stats = index.getStats();
            expect(stats.cellCount).toBe(0);
            expect(stats.entityCount).toBe(0);
            expect(stats.avgEntitiesPerCell).toBe(0);
        });
    });
});

describe('DynamicSpatialIndex', () => {
    let index;

    beforeEach(() => {
        index = new DynamicSpatialIndex(20);
    });

    describe('track', () => {
        test('adds entity to tracking set', () => {
            index.track({ id: 1, x: 10, y: 10 });
            expect(index.trackedEntities.has(1)).toBe(true);
        });

        test('inserts entity into spatial index', () => {
            index.track({ id: 1, x: 10, y: 10 });
            expect(index.cells.size).toBeGreaterThan(0);
        });

        test('throws if entity has no id', () => {
            expect(() => index.track({ x: 10, y: 10 })).toThrow(
                'Entity must have an id to be tracked'
            );
        });
    });

    describe('untrack', () => {
        test('removes entity from tracking set', () => {
            index.track({ id: 1, x: 10, y: 10 });
            index.untrack({ id: 1 });
            expect(index.trackedEntities.has(1)).toBe(false);
        });

        test('removes entity from spatial index', () => {
            index.track({ id: 1, x: 10, y: 10 });
            index.untrack({ id: 1 });
            expect(index.getCount()).toBe(0);
        });
    });

    describe('updateAll', () => {
        test('updates all tracked entities', () => {
            const entity = { id: 1, x: 10, y: 10 };
            index.track(entity);

            entity.x = 30;
            index.updateAll();

            expect(index.entityCells.get(1)).toBe('1,0');
        });
    });

    describe('clear', () => {
        test('clears tracked entities', () => {
            index.track({ id: 1, x: 10, y: 10 });
            index.clear();
            expect(index.trackedEntities.size).toBe(0);
        });
    });
});
