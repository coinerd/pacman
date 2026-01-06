import { PelletPool } from '../../src/pools/PelletPool.js';
import { createMockScene } from '../utils/testHelpers.js';

describe('PelletPool', () => {
    let pool;
    let scene;

    beforeEach(() => {
        scene = createMockScene();
        pool = new PelletPool(scene);
        pool.init();
    });

    afterEach(() => {
        pool.destroy();
    });

    describe('initialization', () => {
        test('should create initial pool size', () => {
            expect(pool.available.length).toBe(300);
            expect(pool.active.length).toBe(0);
        });

        test('should create inactive sprites', () => {
            for (const pellet of pool.available) {
                expect(pellet.visible).toBe(false);
                expect(pellet.active).toBe(false);
            }
        });
    });

    describe('acquisition', () => {
        test('should return pellet from available pool', () => {
            const pellet = pool.get(5, 5);

            expect(pellet).toBeDefined();
            expect(pellet.visible).toBe(true);
            expect(pool.available.length).toBe(299);
            expect(pool.active.length).toBe(1);
        });

        test('should position pellet correctly', () => {
            const pellet = pool.get(5, 5);

            expect(pellet.x).toBe(110);
            expect(pellet.y).toBe(110);
        });
    });

    describe('release', () => {
        test('should return pellet to available pool', () => {
            const pellet = pool.get(5, 5);
            pool.release(pellet);

            expect(pool.available.length).toBe(300);
            expect(pool.active.length).toBe(0);
            expect(pellet.visible).toBe(false);
        });

        test('should reset pellet properties', () => {
            const pellet = pool.get(5, 5);
            pool.release(pellet);

            expect(pellet.scale).toBe(1);
        });
    });

    describe('exhaustion', () => {
        test('should return null when pool exhausted', () => {
            for (let i = 0; i < 300; i++) {
                pool.get(i, i);
            }

            const pellet = pool.get(301, 301);

            expect(pellet).toBeNull();
        });
    });

    describe('bulk release', () => {
        test('should release all active pellets', () => {
            for (let i = 0; i < 10; i++) {
                pool.get(i, i);
            }

            const count = pool.releaseAll();

            expect(count).toBe(10);
            expect(pool.active.length).toBe(0);
            expect(pool.available.length).toBe(300);
        });
    });

    describe('cleanup', () => {
        test('should destroy all pellets', () => {
            const pellet = pool.get(5, 5);
            pool.destroy();

            expect(pool.available.length).toBe(0);
            expect(pool.active.length).toBe(0);
        });
    });
});
