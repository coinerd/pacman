/**
 * MazeSeedManager
 * Manages seed generation for reproducible maze generation
 *
 * Responsibilities:
 * - Generate unique seeds per level
 * - Support different randomization modes
 * - Provide seed persistence for replays
 * - Generate daily challenge seeds
 */

import { SeededRandom } from './SeededRandom.js';

/**
 * @typedef {'full_random' | 'level_sequence' | 'daily_challenge' | 'seeded'} SeedMode
 */

/**
 * @typedef {Object} SeedInfo
 * @property {number} seed - The generated seed
 * @property {number} level - Level number
 * @property {string} preset - Preset name
 * @property {SeedMode} mode - Randomization mode
 * @property {number} timestamp - When seed was generated
 */

/**
 * Seed generation modes:
 * - full_random: Every level gets a completely random seed (arcade mode)
 * - level_sequence: Predictable sequence where same level = same seed (speedrun mode)
 * - daily_challenge: Seed based on current date (daily runs)
 * - seeded: Manual seed for replays or debugging
 */

/**
 * MazeSeedManager class
 * Handles seed generation and management for maze randomization
 */
export class MazeSeedManager {
    /**
     * Creates a new MazeSeedManager instance
     * @param {Object} [options={}] - Configuration options
     * @param {SeedMode} [options.defaultMode='full_random'] - Default seed mode
     * @param {number} [options.baseSeed] - Base seed for sequence generation
     */
    constructor(options = {}) {
        /** @type {SeedMode} */
        this.defaultMode = options.defaultMode || 'full_random';

        /** @type {number} */
        this.baseSeed = options.baseSeed || Date.now();

        /** @type {Map<string, number>} */
        this.seedCache = new Map();

        /** @type {SeedInfo|null} */
        this.lastGeneratedSeed = null;
    }

    /**
     * Generates a seed based on level, preset, and mode
     *
     * @param {number} level - Current level (1-based)
     * @param {string} presetName - Preset name
     * @param {Object} [options={}] - Additional options
     * @param {SeedMode} [options.mode] - Override seed mode
     * @param {number} [options.overrideSeed] - Manual seed (for seeded mode)
     * @param {Date} [options.date] - Date for daily challenge
     * @returns {SeedInfo} Seed information object
     */
    generateSeed(level, presetName, options = {}) {
        const mode = options.mode || this.defaultMode;
        let seed;

        switch (mode) {
        case 'seeded':
            seed = this._generateSeeded(options.overrideSeed);
            break;

        case 'level_sequence':
            seed = this._generateLevelSequence(level, presetName);
            break;

        case 'daily_challenge':
            seed = this._generateDailyChallenge(options.date || new Date(), presetName);
            break;

        case 'full_random':
        default:
            seed = this._generateFullRandom(level, presetName);
            break;
        }

        const seedInfo = {
            seed,
            level,
            preset: presetName,
            mode,
            timestamp: Date.now()
        };

        this.lastGeneratedSeed = seedInfo;

        // Cache for potential replay
        const cacheKey = this._getCacheKey(level, presetName, mode);
        this.seedCache.set(cacheKey, seed);

        return seedInfo;
    }

    /**
     * Generates a fully random seed
     * @private
     */
    _generateFullRandom(level, presetName) {
        const baseSeed = Date.now();
        const levelOffset = level * 10000;
        const presetHash = this._hashString(presetName);

        return ((baseSeed + levelOffset + presetHash) >>> 0) || 1;
    }

    /**
     * Generates a deterministic seed based on level sequence
     * Same level + preset always produces same seed
     * @private
     */
    _generateLevelSequence(level, presetName) {
        const presetHash = this._hashString(presetName);
        const levelSeed = this.baseSeed + level * 7919 + presetHash; // 7919 is prime

        return (levelSeed >>> 0) || 1;
    }

    /**
     * Generates a daily challenge seed based on date
     * Same date = same seed for all players
     * @private
     */
    _generateDailyChallenge(date, presetName) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 0-indexed
        const day = date.getDate();

        // Create deterministic seed from date
        const dateValue = year * 10000 + month * 100 + day;
        const presetHash = this._hashString(presetName);

        return ((dateValue * 31337 + presetHash) >>> 0) || 1;
    }

    /**
     * Returns the provided seed (for replay/debug)
     * @private
     */
    _generateSeeded(overrideSeed) {
        if (typeof overrideSeed === 'number' && Number.isFinite(overrideSeed)) {
            return (overrideSeed >>> 0) || 1;
        }

        // Fallback to hash if string provided
        if (typeof overrideSeed === 'string') {
            return this._hashString(overrideSeed);
        }

        // No valid seed provided, generate random
        return this._generateFullRandom(1, 'default');
    }

    /**
     * Simple string hashing function
     * @param {string} str - String to hash
     * @returns {number} Hash value
     */
    _hashString(str) {
        const input = String(str || '');
        let hash = 2166136261; // FNV-1a offset basis

        for (let i = 0; i < input.length; i++) {
            hash ^= input.charCodeAt(i);
            hash = Math.imul(hash, 16777619); // FNV-1a prime
        }

        return (hash >>> 0) || 1;
    }

    /**
     * Creates cache key for seed storage
     * @private
     */
    _getCacheKey(level, presetName, mode) {
        return `${mode}:${presetName}:${level}`;
    }

    /**
     * Gets a cached seed if available
     *
     * @param {number} level - Level number
     * @param {string} presetName - Preset name
     * @param {SeedMode} mode - Seed mode
     * @returns {number|null} Cached seed or null
     */
    getCachedSeed(level, presetName, mode) {
        const key = this._getCacheKey(level, presetName, mode);
        return this.seedCache.get(key) || null;
    }

    /**
     * Clears the seed cache
     */
    clearCache() {
        this.seedCache.clear();
    }

    /**
     * Gets the last generated seed info
     *
     * @returns {SeedInfo|null} Last seed info or null
     */
    getLastSeed() {
        return this.lastGeneratedSeed;
    }

    /**
     * Creates a replay record for later playback
     *
     * @param {number} seed - Maze seed
     * @param {number} level - Level number
     * @param {string} preset - Preset name
     * @param {Object} [metadata={}] - Additional metadata
     * @returns {Object} Replay record
     */
    createReplayRecord(seed, level, preset, metadata = {}) {
        return {
            version: 1,
            seed,
            level,
            preset,
            timestamp: Date.now(),
            ...metadata
        };
    }

    /**
     * Validates a replay record
     *
     * @param {Object} record - Replay record to validate
     * @returns {{isValid: boolean, errors: string[]}}
     */
    validateReplayRecord(record) {
        const errors = [];

        if (!record || typeof record !== 'object') {
            errors.push('Invalid record: must be an object');
            return { isValid: false, errors };
        }

        if (typeof record.seed !== 'number') {
            errors.push('Missing or invalid seed');
        }

        if (typeof record.level !== 'number' || record.level < 1) {
            errors.push('Missing or invalid level');
        }

        if (typeof record.preset !== 'string') {
            errors.push('Missing or invalid preset');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Serializes a replay record to JSON string
     *
     * @param {Object} record - Replay record
     * @returns {string} JSON string
     */
    serializeReplayRecord(record) {
        return JSON.stringify(record);
    }

    /**
     * Deserializes a replay record from JSON string
     *
     * @param {string} json - JSON string
     * @returns {Object|null} Replay record or null on error
     */
    deserializeReplayRecord(json) {
        try {
            const record = JSON.parse(json);
            const validation = this.validateReplayRecord(record);

            if (!validation.isValid) {
                console.warn('MazeSeedManager: Invalid replay record:', validation.errors);
                return null;
            }

            return record;
        } catch (e) {
            console.warn('MazeSeedManager: Failed to deserialize replay record:', e);
            return null;
        }
    }

    /**
     * Gets today's daily challenge seed
     *
     * @param {string} [presetName='default'] - Preset name
     * @returns {number} Daily challenge seed
     */
    getDailyChallengeSeed(presetName = 'default') {
        const seedInfo = this.generateSeed(1, presetName, {
            mode: 'daily_challenge',
            date: new Date()
        });
        return seedInfo.seed;
    }

    /**
     * Creates a SeededRandom instance from a seed
     *
     * @param {number} seed - Seed value
     * @returns {SeededRandom} Seeded random number generator
     */
    createRNG(seed) {
        return new SeededRandom(seed);
    }

    /**
     * Forks an existing seed for sub-generation
     * Useful for generating multiple related mazes
     *
     * @param {number} seed - Original seed
     * @param {number} offset - Fork offset
     * @returns {number} Forked seed
     */
    forkSeed(seed, offset) {
        return ((seed + this._hashString(String(offset))) >>> 0) || 1;
    }

    /**
     * Generates a batch of seeds for multiple levels
     *
     * @param {number} startLevel - Starting level (1-based)
     * @param {number} count - Number of seeds to generate
     * @param {string} presetName - Preset name
     * @param {SeedMode} [mode='level_sequence'] - Seed mode
     * @returns {Array<{level: number, seed: number}>}
     */
    generateSeedBatch(startLevel, count, presetName, mode = 'level_sequence') {
        const seeds = [];

        for (let i = 0; i < count; i++) {
            const level = startLevel + i;
            const seedInfo = this.generateSeed(level, presetName, { mode });
            seeds.push({ level, seed: seedInfo.seed });
        }

        return seeds;
    }

    /**
     * Sets the base seed for sequence generation
     *
     * @param {number} seed - New base seed
     */
    setBaseSeed(seed) {
        this.baseSeed = typeof seed === 'number' ? seed : Date.now();
        this.clearCache();
    }

    /**
     * Sets the default seed mode
     *
     * @param {SeedMode} mode - New default mode
     */
    setDefaultMode(mode) {
        if (['full_random', 'level_sequence', 'daily_challenge', 'seeded'].includes(mode)) {
            this.defaultMode = mode;
        }
    }
}

// Singleton instance for convenience
export const mazeSeedManager = new MazeSeedManager();
