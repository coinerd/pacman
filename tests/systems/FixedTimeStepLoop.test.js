import { FixedTimeStepLoop } from '../../src/systems/FixedTimeStepLoop.js';

describe('FixedTimeStepLoop', () => {
    let loop;
    let mockCallback;
    const FIXED_DT = 1 / 60;
    const MAX_DT = 0.1;

    beforeEach(() => {
        mockCallback = jest.fn();
        loop = new FixedTimeStepLoop(mockCallback);
    });

    describe('initialization', () => {
        test('should start with accumulator at 0', () => {
            expect(loop.getAccumulator()).toBe(0);
        });

        test('should store callback function', () => {
            loop.update(FIXED_DT);
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('single step below FIXED_DT', () => {
        test('should not call callback when realDt < FIXED_DT', () => {
            const realDt = FIXED_DT / 2;
            loop.update(realDt);

            expect(mockCallback).not.toHaveBeenCalled();
        });

        test('should store realDt in accumulator when realDt < FIXED_DT', () => {
            const realDt = FIXED_DT / 2;
            loop.update(realDt);

            expect(loop.getAccumulator()).toBe(realDt);
        });
    });

    describe('multiple steps in one frame', () => {
        test('should call callback 3 times when realDt = 3 * FIXED_DT', () => {
            const realDt = 3 * FIXED_DT;
            loop.update(realDt);

            expect(mockCallback).toHaveBeenCalledTimes(3);
        });

        test('should have accumulator = 0 after 3 complete steps', () => {
            const realDt = 3 * FIXED_DT;
            loop.update(realDt);

            expect(loop.getAccumulator()).toBe(0);
        });
    });

    describe('exact FIXED_DT', () => {
        test('should call callback once when realDt = FIXED_DT', () => {
            loop.update(FIXED_DT);

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        test('should have accumulator = 0 after exact FIXED_DT', () => {
            loop.update(FIXED_DT);

            expect(loop.getAccumulator()).toBe(0);
        });
    });

    describe('clamping at MAX_DT', () => {
        test('should clamp realDt = 1.0 to MAX_DT (0.1)', () => {
            loop.update(1.0);

            expect(mockCallback).toHaveBeenCalledTimes(Math.floor(MAX_DT / FIXED_DT));
        });

        test('should clamp values above MAX_DT', () => {
            loop.update(2.0);

            expect(mockCallback).toHaveBeenCalledTimes(Math.floor(MAX_DT / FIXED_DT));
        });
    });

    describe('persistence across updates', () => {
        test('should add second update realDt to existing accumulator', () => {
            const firstDt = FIXED_DT / 2;
            const secondDt = FIXED_DT / 2;

            loop.update(firstDt);
            expect(mockCallback).not.toHaveBeenCalled();

            loop.update(secondDt);
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        test('should maintain accumulator between multiple small updates', () => {
            const smallDt = FIXED_DT / 4;

            loop.update(smallDt);
            loop.update(smallDt);
            loop.update(smallDt);

            expect(mockCallback).not.toHaveBeenCalled();
            expect(loop.getAccumulator()).toBe(3 * smallDt);

            loop.update(smallDt);
            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(loop.getAccumulator()).toBe(0);
        });
    });

    describe('reset', () => {
        test('should set accumulator to 0', () => {
            loop.update(FIXED_DT / 2);
            expect(loop.getAccumulator()).toBeGreaterThan(0);

            loop.reset();

            expect(loop.getAccumulator()).toBe(0);
        });

        test('should clear accumulated time from multiple updates', () => {
            loop.update(FIXED_DT);
            loop.update(FIXED_DT / 2);
            expect(loop.getAccumulator()).toBeGreaterThan(0);

            loop.reset();

            expect(loop.getAccumulator()).toBe(0);
        });
    });
});
