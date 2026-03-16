/**
 * Comprehensive tests for PowerPelletPool
 * Tests edge cases and branch coverage
 */

import { PowerPelletPool } from '../../src/pools/PowerPelletPool.js';
import { createMockScene } from '../utils/testHelpers.js';

describe('PowerPelletPool Comprehensive', () => {
    let pool;
    let scene;

    beforeEach(() => {
        scene = createMockScene();
        pool = new PowerPelletPool(scene);
    });

    afterEach(() => {
        if (pool) {
            pool.destroy();
        }
    });

    describe('get', () => {
        beforeEach(() => {
            pool.init(4);
        });

        test('should position pellet at grid coordinates', () => {
            const pellet = pool.get(5, 10);

            expect(pellet.x).toBe(5 * 20 + 10); // tileSize=20, center at 10
            expect(pellet.y).toBe(10 * 20 + 10);
        });

        test('should add pellet to gridIndex', () => {
            const pellet = pool.get(3, 7);

            expect(pool.gridIndex.get('3,7')).toBe(pellet);
        });

        test('should warn when pool exhausted', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            // Pool has 4 pellets from beforeEach
            pool.get(0, 0);
            pool.get(1, 1);
            pool.get(2, 2);
            pool.get(3, 3);

            const result = pool.get(4, 4);

            expect(result).toBeNull();
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });

    describe('getByGrid', () => {
        beforeEach(() => {
            pool.init(4);
        });

        test('should return pellet at grid position', () => {
            const pellet = pool.get(4, 5);
            const found = pool.getByGrid(4, 5);

            expect(found).toBe(pellet);
        });

        test('should return null for empty grid position', () => {
            const found = pool.getByGrid(99, 99);

            expect(found).toBeNull();
        });
    });

    describe('release', () => {
        beforeEach(() => {
            pool.init(4);
        });

        test('should stop pulseTween if exists', () => {
            const pellet = pool.get(2, 3);
            const tween = { stop: jest.fn() };
            pellet.pulseTween = tween;

            pool.release(pellet);

            expect(tween.stop).toHaveBeenCalled();
            expect(pellet.pulseTween).toBeNull();
        });

        test('should remove from gridIndex', () => {
            const pellet = pool.get(5, 5);

            pool.release(pellet);

            expect(pool.gridIndex.has('5,5')).toBe(false);
        });

        test('should not release unknown pellet', () => {
            const fakePellet = { x: 100, y: 100, visible: true };

            pool.release(fakePellet);

            expect(pool.active.length).toBe(0);
            expect(pool.available.length).toBe(4);
        });

        test('should deactivate and hide pellet', () => {
            const pellet = pool.get(3, 3);

            pool.release(pellet);

            expect(pellet.visible).toBe(false);
            expect(pellet.active).toBe(false);
        });
    });

    describe('releaseAll', () => {
        beforeEach(() => {
            pool.init(4);
        });

        test('should release all active pellets', () => {
            pool.get(0, 0);
            pool.get(1, 1);
            pool.get(2, 2);

            const count = pool.releaseAll();

            expect(count).toBe(3);
            expect(pool.active.length).toBe(0);
            expect(pool.available.length).toBe(4);
        });

        test('should return 0 when no active pellets', () => {
            const count = pool.releaseAll();

            expect(count).toBe(0);
        });
    });

    describe('getActiveCount', () => {
        beforeEach(() => {
            pool.init(4);
        });

        test('should return correct count', () => {
            expect(pool.getActiveCount()).toBe(0);

            pool.get(0, 0);
            expect(pool.getActiveCount()).toBe(1);

            pool.get(1, 1);
            expect(pool.getActiveCount()).toBe(2);
        });
    });

    describe('destroy', () => {
        test('should stop tweens on available pellets', () => {
            pool.init(2);
            const tween1 = { stop: jest.fn() };
            const tween2 = { stop: jest.fn() };
            pool.available[0].pulseTween = tween1;
            pool.available[1].pulseTween = tween2;

            pool.destroy();

            expect(tween1.stop).toHaveBeenCalled();
            expect(tween2.stop).toHaveBeenCalled();
        });

        test('should stop tweens on active pellets', () => {
            pool.init(2);
            const pellet = pool.get(0, 0);
            const tween = { stop: jest.fn() };
            pellet.pulseTween = tween;

            pool.destroy();

            expect(tween.stop).toHaveBeenCalled();
        });

        test('should clear gridIndex', () => {
            pool.init(2);
            pool.get(5, 5);

            pool.destroy();

            expect(pool.gridIndex.size).toBe(0);
        });

        test('should handle pellets without tweens', () => {
            pool.init(2);

            expect(() => pool.destroy()).not.toThrow();
        });
    });

    describe('grid index integration', () => {
        beforeEach(() => {
            pool.init(4);
        });

        test('should track multiple pellets at different positions', () => {
            const p1 = pool.get(0, 0);
            const p2 = pool.get(5, 5);
            const p3 = pool.get(10, 10);

            expect(pool.getByGrid(0, 0)).toBe(p1);
            expect(pool.getByGrid(5, 5)).toBe(p2);
            expect(pool.getByGrid(10, 10)).toBe(p3);
        });

        test('should update gridIndex on release', () => {
            const pellet = pool.get(3, 3);
            expect(pool.getByGrid(3, 3)).toBe(pellet);

            pool.release(pellet);
            expect(pool.getByGrid(3, 3)).toBeNull();
        });
    });
});
