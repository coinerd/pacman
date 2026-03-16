// tests/utils/SeededRandom.test.js

import { SeededRandom, createSeededRandomFn } from '../../src/utils/SeededRandom.js';

describe('SeededRandom', () => {
    describe('constructor', () => {
        test('should initialize with seed', () => {
            const rng = new SeededRandom(12345);

            expect(rng.seed).toBe(12345);
        });

        test('should use default seed if not provided', () => {
            const rng = new SeededRandom();

            expect(rng.seed).toBeDefined();
            expect(rng.seed).toBeGreaterThan(0);
        });
    });

    describe('next', () => {
        test('should return number between 0 and 1', () => {
            const rng = new SeededRandom(12345);

            const value = rng.next();

            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        });

        test('should produce consistent sequence for same seed', () => {
            const rng1 = new SeededRandom(12345);
            const rng2 = new SeededRandom(12345);

            expect(rng1.next()).toBe(rng2.next());
            expect(rng1.next()).toBe(rng2.next());
        });

        test('should produce different sequence for different seed', () => {
            const rng1 = new SeededRandom(12345);
            const rng2 = new SeededRandom(54321);

            expect(rng1.next()).not.toBe(rng2.next());
        });
    });

    describe('nextInt', () => {
        test('should return integer in range', () => {
            const rng = new SeededRandom(12345);

            const value = rng.nextInt(10);

            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(10);
        });

        test('should return 0 for invalid max', () => {
            const rng = new SeededRandom(12345);

            expect(rng.nextInt(0)).toBe(0);
            expect(rng.nextInt(-1)).toBe(0);
            expect(rng.nextInt(NaN)).toBe(0);
        });
    });

    describe('fork', () => {
        test('should create new RNG with different seed', () => {
            const rng = new SeededRandom(12345);
            const forked = rng.fork();

            expect(forked).toBeInstanceOf(SeededRandom);
            expect(forked.seed).not.toBe(rng.seed);
        });

        test('should accept offset parameter', () => {
            const rng = new SeededRandom(12345);
            const forked = rng.fork(100);

            expect(forked).toBeInstanceOf(SeededRandom);
        });
    });

    describe('setSeed', () => {
        test('should reset state with new seed', () => {
            const rng = new SeededRandom(12345);
            rng.next();

            rng.setSeed(54321);

            expect(rng.seed).toBe(54321);
            expect(rng.state).toBe(54321);
        });
    });

    describe('normalizeSeed', () => {
        test('should convert string seed to number', () => {
            const normalized = SeededRandom.normalizeSeed('test');

            expect(typeof normalized).toBe('number');
            expect(normalized).toBeGreaterThan(0);
        });

        test('should handle null seed', () => {
            const normalized = SeededRandom.normalizeSeed(null);

            expect(typeof normalized).toBe('number');
        });
    });
});

describe('createSeededRandomFn', () => {
    test('should return function', () => {
        const fn = createSeededRandomFn(12345);

        expect(typeof fn).toBe('function');
    });

    test('should return consistent values', () => {
        const fn1 = createSeededRandomFn(12345);
        const fn2 = createSeededRandomFn(12345);

        expect(fn1()).toBe(fn2());
    });
});
