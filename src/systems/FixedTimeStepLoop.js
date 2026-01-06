import { physicsConfig } from '../config/gameConfig.js';

export class FixedTimeStepLoop {
    constructor(callback) {
        this.callback = callback;
        this.accumulator = 0;
    }

    update(realDt) {
        const clampedDt = Math.min(realDt, physicsConfig.MAX_DT);
        this.accumulator += clampedDt;

        while (this.accumulator >= physicsConfig.FIXED_DT) {
            this.callback();
            this.accumulator -= physicsConfig.FIXED_DT;
        }
    }

    getAccumulator() {
        return this.accumulator;
    }

    reset() {
        this.accumulator = 0;
    }
}
