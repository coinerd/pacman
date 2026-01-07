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
    }

    /**
     * Updates the loop with a new time delta
     * @param {number} realDt - Real time elapsed since last frame (seconds)
     */
    update(realDt) {
        const clampedDt = Math.min(realDt, physicsConfig.MAX_DT);
        this.accumulator += clampedDt;

        while (this.accumulator >= physicsConfig.FIXED_DT) {
            this.callback();
            this.accumulator -= physicsConfig.FIXED_DT;
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
     * Resets the accumulator to zero
     */
    reset() {
        this.accumulator = 0;
    }
}
