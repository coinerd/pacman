import { physicsConfig } from '../config/gameConfig.js';

/**
 * Fixed Timestep Loop Implementation
 * Ensures consistent physics updates regardless of frame rate variations
 *
 * @class FixedTimeStepLoop
 */
export class FixedTimeStepLoop {
    /**
     * Creates a new fixed timestep loop
     * @param {Function} callback - Function to call for each physics update
     */
    constructor(callback) {
        this.callback = callback;
        this.accumulator = 0;
        this.lastStepCount = 0;
        this.lastRealDt = 0;
        this.hasWarnedAboutDelta = false;
        this.zeroStepFrames = 0;
        this.hasWarnedAboutStarvation = false;
    }

    /**
     * Updates the loop with a new time delta
     * @param {number} realDt - Real time elapsed since last frame (seconds)
     */
    update(realDt) {
        this.lastRealDt = realDt;
        this.lastStepCount = 0;

        if (!Number.isFinite(realDt)) {
            if (!this.hasWarnedAboutDelta) {
                console.warn('[FixedTimeStepLoop] Invalid delta provided (expected seconds).');
                this.hasWarnedAboutDelta = true;
            }
            return;
        }

        if ((realDt > 1 || realDt < 0.001) && !this.hasWarnedAboutDelta) {
            console.warn(
                `[FixedTimeStepLoop] Delta (${realDt.toFixed(4)}s) out of expected range; check time units.`
            );
            this.hasWarnedAboutDelta = true;
        }

        const clampThreshold = physicsConfig.MAX_DT * 2;
        const clampedDt = realDt > clampThreshold ? physicsConfig.MAX_DT : realDt;
        this.accumulator += clampedDt;

        while (this.accumulator >= physicsConfig.FIXED_DT) {
            this.callback();
            this.accumulator -= physicsConfig.FIXED_DT;
            this.lastStepCount += 1;
        }

        if (this.lastStepCount === 0) {
            this.zeroStepFrames += 1;
            if (this.zeroStepFrames >= 10 && !this.hasWarnedAboutStarvation) {
                console.warn('[FixedTimeStepLoop] Fixed updates have not run for 10 frames.');
                this.hasWarnedAboutStarvation = true;
            }
        } else {
            this.zeroStepFrames = 0;
            this.hasWarnedAboutStarvation = false;
        }

        if (this.accumulator < Number.EPSILON) {
            this.accumulator = 0;
        }
    }

    /**
     * Gets the current accumulator value
     * @returns {number} Current accumulated time (seconds)
     */
    getAccumulator() {
        return this.accumulator;
    }

    /**
     * Gets number of fixed steps executed during last update
     * @returns {number} Step count
     */
    getLastStepCount() {
        return this.lastStepCount;
    }

    /**
     * Gets the most recent real delta value
     * @returns {number} Time elapsed since last frame (seconds)
     */
    getLastRealDt() {
        return this.lastRealDt;
    }

    /**
     * Resets the accumulator to zero
     */
    reset() {
        this.accumulator = 0;
        this.zeroStepFrames = 0;
        this.hasWarnedAboutStarvation = false;
    }
}
