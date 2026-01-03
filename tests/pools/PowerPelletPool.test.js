import { PowerPelletPool } from '../../src/pools/PowerPelletPool.js';
import { createMockScene } from '../utils/testHelpers.js';
import { gameConfig } from '../../src/config/gameConfig.js';

describe('PowerPelletPool', () => {
    let pool;
    let scene;

    beforeEach(() => {
        scene = createMockScene();
        pool = new PowerPelletPool(scene);
        pool.init(4);
    });

    afterEach(() => {
        pool.destroy();
    });

    describe('initialization', () => {
        test('should create initial pool size', () => {
            expect(pool.available.length).toBe(4);
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
        test('should return power pellet from available pool', () => {
            const pellet = pool.get();

            expect(pellet).toBeDefined();
            expect(pellet.visible).toBe(true);
            expect(pool.available.length).toBe(3);
            expect(pool.active.length).toBe(1);
        });
    });

    describe('release', () => {
        test('should return power pellet to available pool', () => {
            const pellet = pool.get();
            pool.release(pellet);

            expect(pool.available.length).toBe(4);
            expect(pool.active.length).toBe(0);
            expect(pellet.visible).toBe(false);
        });
    });

    describe('exhaustion', () => {
        test('should return null when pool exhausted', () => {
            for (let i = 0; i < 4; i++) {
                pool.get();
            }

            const pellet = pool.get();

            expect(pellet).toBeNull();
        });
    });

    describe('cleanup', () => {
        test('should destroy all power pellets', () => {
            const pellet = pool.get();
            pool.destroy();

            expect(pool.available.length).toBe(0);
            expect(pool.active.length).toBe(0);
        });
    });
});
