/**
 * SeededRandom
 * Deterministic pseudo-random number generator utilities.
 */

const UINT32_MAX = 0x100000000;

export class SeededRandom {
    constructor(seed = Date.now()) {
        this.setSeed(seed);
    }

    static normalizeSeed(seed) {
        if (typeof seed === 'number' && Number.isFinite(seed)) {
            return (Math.floor(seed) >>> 0) || 1;
        }

        const str = String(seed ?? Date.now());
        let hash = 2166136261;

        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }

        return (hash >>> 0) || 1;
    }

    setSeed(seed) {
        this.seed = SeededRandom.normalizeSeed(seed);
        this.state = this.seed;
    }

    next() {
        // LCG constants from Numerical Recipes (uint32 domain)
        this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
        return this.state / UINT32_MAX;
    }

    nextInt(maxExclusive) {
        if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) {
            return 0;
        }

        return Math.floor(this.next() * maxExclusive);
    }

    fork(offset = 0) {
        const offsetSeed = (this.seed + SeededRandom.normalizeSeed(offset)) >>> 0;
        return new SeededRandom(offsetSeed || 1);
    }
}

export const createSeededRandomFn = (seed) => {
    const rng = new SeededRandom(seed);
    return () => rng.next();
};
