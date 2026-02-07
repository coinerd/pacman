/**
 * Generate a deterministic dt sequence with predictable variation.
 * @param {number} length - Number of entries to generate.
 * @param {number} fixedDt - Base fixed timestep value.
 * @returns {number[]} Sequence of dt values.
 */
export const createDeterministicDtSequence = (length, fixedDt) => {
    const sequence = [];

    for (let i = 0; i < length; i++) {
        const pattern = i % 5;

        switch (pattern) {
        case 0:
            sequence.push(fixedDt * 0.5);
            break;
        case 1:
            sequence.push(fixedDt);
            break;
        case 2:
            sequence.push(fixedDt * 1.5);
            break;
        case 3:
            sequence.push(fixedDt * 2);
            break;
        case 4:
            sequence.push(fixedDt * 0.25);
            break;
        }
    }

    return sequence;
};

/**
 * Run a fixed-step simulation with a provided dt sequence.
 * @param {Object} loop - FixedTimeStepLoop instance.
 * @param {number[]} dtSequence - Sequence of dt values.
 */
export const runFixedStepSimulation = (loop, dtSequence) => {
    dtSequence.forEach((dt) => loop.update(dt));
};
