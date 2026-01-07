/**
 * Fixed Timestep Loop Unit Tests
 *
 * Tests critical invariants and behaviors of the fixed timestep loop implementation
 */

import { FixedTimeStepLoop } from '../../src/systems/FixedTimeStepLoop.js';
import { physicsConfig } from '../../src/config/gameConfig.js';

describe('FixedTimestepLoop - Determinismus-Tests (KRITISCH)', () => {
    const FIXED_DT = physicsConfig.FIXED_DT; // 1/60 seconds
    const MAX_DT = physicsConfig.MAX_DT; // 0.1 seconds

    /**
     * Test 1: Determinismus-Test
     * Same input sequence → same output sequence
     * This is CRITICAL for replay systems and game consistency
     */
    describe('Determinismus: Gleiche Input-Sequenz → gleiche Output-Sequenz', () => {
        let simulation1, simulation2;
        let positionHistory1, positionHistory2;

        beforeEach(() => {
            // Create two separate simulations with the same seed
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            simulation1 = new FixedTimeStepLoop(callback1);
            simulation2 = new FixedTimeStepLoop(callback2);

            positionHistory1 = [];
            positionHistory2 = [];

            // Track callback calls
            callback1.mockImplementation(() => positionHistory1.push(positionHistory1.length));
            callback2.mockImplementation(() => positionHistory2.push(positionHistory2.length));
        });

        test('Same input sequence produces same output sequence (1000 updates)', () => {
            const SEQUENCE_LENGTH = 1000;
            const dtSequence = generateDeterministicDtSequence(SEQUENCE_LENGTH);

            // Run first simulation
            for (let i = 0; i < SEQUENCE_LENGTH; i++) {
                simulation1.update(dtSequence[i]);
            }

            // Run second simulation with same sequence
            for (let i = 0; i < SEQUENCE_LENGTH; i++) {
                simulation2.update(dtSequence[i]);
            }

            // Positions must be exactly the same after each step
            expect(positionHistory1).toEqual(positionHistory2);

            // Final accumulator state must be identical
            expect(simulation1.getAccumulator()).toBe(simulation2.getAccumulator());
        });

        test('Determinism with variable dt values', () => {
            const testCases = [
                FIXED_DT / 2,           // Below fixed timestep
                FIXED_DT,               // Exact fixed timestep
                FIXED_DT * 2.5,         // Between fixed timesteps
                FIXED_DT * 3,           // Multiple of fixed timestep
                MAX_DT / 2,             // Half of max dt
                0.001,                  // Very small dt
                0.099                   // Just below max dt
            ];

            for (const dt of testCases) {
                simulation1.reset();
                simulation2.reset();
                positionHistory1 = [];
                positionHistory2 = [];

                simulation1.update(dt);
                simulation2.update(dt);

                expect(positionHistory1).toEqual(positionHistory2);
                expect(simulation1.getAccumulator()).toBe(simulation2.getAccumulator());
            }
        });

        test('Determinism with extreme dt clamping', () => {
            const largeDt = 5.0; // 5 seconds - should be clamped to MAX_DT

            simulation1.update(largeDt);
            simulation2.update(largeDt);

            expect(positionHistory1).toEqual(positionHistory2);
            expect(simulation1.getAccumulator()).toBe(simulation2.getAccumulator());
        });
    });
});

describe('FixedTimestepLoop - Accumulator-Invarianten', () => {
    const FIXED_DT = physicsConfig.FIXED_DT;
    const MAX_DT = physicsConfig.MAX_DT;

    describe('Accumulator wird korrekt hochgezählt', () => {
        test('Accumulator starts at 0', () => {
            const loop = new FixedTimeStepLoop(jest.fn());
            expect(loop.getAccumulator()).toBe(0);
        });

        test('Accumulator increases by realDt (when < FIXED_DT)', () => {
            const loop = new FixedTimeStepLoop(jest.fn());
            const realDt = FIXED_DT / 2;

            loop.update(realDt);

            expect(loop.getAccumulator()).toBe(realDt);
        });

        test('Accumulator accumulates across multiple small updates', () => {
            const loop = new FixedTimeStepLoop(jest.fn());
            const smallDt = FIXED_DT / 4;

            loop.update(smallDt);
            expect(loop.getAccumulator()).toBe(smallDt);

            loop.update(smallDt);
            expect(loop.getAccumulator()).toBe(2 * smallDt);

            loop.update(smallDt);
            expect(loop.getAccumulator()).toBe(3 * smallDt);
        });

        test('Accumulator is preserved after callback execution', () => {
            const loop = new FixedTimeStepLoop(jest.fn());

            // Add 1.5 * FIXED_DT
            loop.update(FIXED_DT * 1.5);

            // Should have executed callback once and accumulated remainder
            expect(loop.getAccumulator()).toBeCloseTo(FIXED_DT * 0.5, 10);
        });
    });

    describe('accumulator < fixedDt nach jedem Schritt', () => {
        test('After single update (exact FIXED_DT)', () => {
            const loop = new FixedTimeStepLoop(jest.fn());
            loop.update(FIXED_DT);

            expect(loop.getAccumulator()).toBeLessThan(FIXED_DT);
            expect(loop.getAccumulator()).toBe(0);
        });

        test('After single update (multiple of FIXED_DT)', () => {
            const loop = new FixedTimeStepLoop(jest.fn());
            loop.update(FIXED_DT * 3);

            expect(loop.getAccumulator()).toBeLessThan(FIXED_DT);
            expect(loop.getAccumulator()).toBeCloseTo(0, 10);
        });

        test('After single update (partial FIXED_DT)', () => {
            const loop = new FixedTimeStepLoop(jest.fn());
            loop.update(FIXED_DT * 0.75);

            expect(loop.getAccumulator()).toBeLessThan(FIXED_DT);
            expect(loop.getAccumulator()).toBe(FIXED_DT * 0.75);
        });

        test('After multiple updates with fractional remainders', () => {
            const loop = new FixedTimeStepLoop(jest.fn());

            loop.update(FIXED_DT * 2.3);
            expect(loop.getAccumulator()).toBeLessThan(FIXED_DT);

            loop.update(FIXED_DT * 0.4);
            expect(loop.getAccumulator()).toBeLessThan(FIXED_DT);

            // 0.3 + 0.4 = 0.7 * FIXED_DT remainder
            expect(loop.getAccumulator()).toBeCloseTo(FIXED_DT * 0.7, 10);
        });
    });

    describe('Wenn accumulator >= fixedDt: fixedUpdate wird aufgerufen', () => {
        test('Callback called once when accumulator == FIXED_DT', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);

            loop.update(FIXED_DT);

            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('Callback called 3 times for 3 * FIXED_DT', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);

            loop.update(FIXED_DT * 3);

            expect(callback).toHaveBeenCalledTimes(3);
        });

        test('Callback called multiple times with clamped dt', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);
            const expectedCalls = Math.floor(MAX_DT / FIXED_DT);

            loop.update(MAX_DT);

            expect(callback).toHaveBeenCalledTimes(expectedCalls);
        });

        test('Callback called correct times across frame boundaries', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);

            // Frame 1: 0.6 * FIXED_DT
            loop.update(FIXED_DT * 0.6);
            expect(callback).not.toHaveBeenCalled();

            // Frame 2: 0.6 * FIXED_DT (total 1.2) - first callback, accumulator = 0.2
            loop.update(FIXED_DT * 0.6);
            expect(callback).toHaveBeenCalledTimes(1);

            // Frame 3: 0.6 * FIXED_DT (total 1.8) - no callback (0.2 + 0.6 = 0.8 < 1.0)
            loop.update(FIXED_DT * 0.6);
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('Wenn accumulator < fixedDt: kein weiterer fixedUpdate', () => {
        test('No callback for small dt', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);

            loop.update(FIXED_DT * 0.5);

            expect(callback).not.toHaveBeenCalled();
        });

        test('No extra callback after exact multiples', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);

            loop.update(FIXED_DT * 2);

            expect(callback).toHaveBeenCalledTimes(2);
        });

        test('No callback for very small dt values', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);

            for (let i = 0; i < 10; i++) {
                loop.update(0.001);
            }

            // Total time: 0.01s, which should be less than FIXED_DT (0.0166s)
            expect(callback).not.toHaveBeenCalled();
        });
    });
});

describe('FixedTimestepLoop - dt-Spike-Schutz', () => {
    const FIXED_DT = physicsConfig.FIXED_DT;
    const MAX_DT = physicsConfig.MAX_DT;

    describe('realDt wird auf max(0.1s) geclamped', () => {
        test('Large dt (5s) is clamped to MAX_DT', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);

            loop.update(5.0);

            const expectedCalls = Math.floor(MAX_DT / FIXED_DT);
            expect(callback).toHaveBeenCalledTimes(expectedCalls);
        });

        test('Very large dt (10s) is clamped to MAX_DT', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);

            loop.update(10.0);

            const expectedCalls = Math.floor(MAX_DT / FIXED_DT);
            expect(callback).toHaveBeenCalledTimes(expectedCalls);
        });

        test('Accumulator remains consistent after clamping', () => {
            const loop = new FixedTimeStepLoop(jest.fn());

            loop.update(5.0);

            // After clamping to MAX_DT, the remainder should be small
            expect(loop.getAccumulator()).toBeLessThan(FIXED_DT);
        });
    });

    describe('Großer dt führt zu mehreren fixedUpdates aber keinem overflow', () => {
        test('Large dt produces multiple callbacks', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);

            loop.update(MAX_DT);

            const expectedCalls = Math.floor(MAX_DT / FIXED_DT);
            expect(callback).toHaveBeenCalledTimes(expectedCalls);
            expect(expectedCalls).toBeGreaterThan(1);
        });

        test('No accumulator overflow with large dt', () => {
            const loop = new FixedTimeStepLoop(jest.fn());

            loop.update(MAX_DT * 100);

            // Even with extreme dt, accumulator should be bounded
            expect(loop.getAccumulator()).toBeLessThan(FIXED_DT);
            expect(loop.getAccumulator()).toBeGreaterThanOrEqual(0);
        });

        test('Graceful handling of extremely large dt', () => {
            const callback = jest.fn();
            const loop = new FixedTimeStepLoop(callback);

            // Simulate massive lag spike
            loop.update(1000.0);

            const expectedCalls = Math.floor(MAX_DT / FIXED_DT);
            expect(callback).toHaveBeenCalledTimes(expectedCalls);

            // Should not hang or crash
            expect(loop.getAccumulator()).toBeLessThan(FIXED_DT);
        });
    });
});

describe('FixedTimestepLoop - Frame-Independence', () => {
    const FIXED_DT = physicsConfig.FIXED_DT;

    /**
     * Mock entity to track position changes across simulations
     */
    class MockEntity {
        constructor() {
            this.position = 0;
            this.velocity = 100; // pixels per second
        }

        update(dt) {
            this.position += this.velocity * dt;
        }

        getPosition() {
            return this.position;
        }

        reset() {
            this.position = 0;
        }
    }

    /**
     * Test 4: Frame-Independence
     * 10 Frames mit dt=0.016s (60fps) == 1 Frame mit dt=0.16s (6fps)
     * Finaler Zustand muss identisch sein
     */
    describe('60fps vs 6fps - Finaler Zustand muss identisch sein', () => {
        test('Same number of physics updates produces same final state', () => {
            const entity1 = new MockEntity();
            const entity2 = new MockEntity();

            let updates1 = 0;
            let updates2 = 0;

            const callback1 = () => {
                entity1.update(FIXED_DT);
                updates1++;
            };
            const callback2 = () => {
                entity2.update(FIXED_DT);
                updates2++;
            };

            const loop1 = new FixedTimeStepLoop(callback1);
            const loop2 = new FixedTimeStepLoop(callback2);

            // Scenario 1: Multiple small frames (high framerate)
            for (let i = 0; i < 5; i++) {
                loop1.update(FIXED_DT);
            }

            // Scenario 2: Single large frame (low framerate)
            // 5 * FIXED_DT = 0.0833s, which is < MAX_DT, so no clamping
            loop2.update(5 * FIXED_DT);

            // Both should execute exactly 5 physics updates
            expect(updates1).toBe(5);
            expect(updates2).toBe(5);

            // Both entities should have same final position
            expect(entity1.getPosition()).toBe(entity2.getPosition());
        });

        test('Accumulator correctly carries remainder across frames', () => {
            const entity1 = new MockEntity();
            const entity2 = new MockEntity();

            const callback1 = () => entity1.update(FIXED_DT);
            const callback2 = () => entity2.update(FIXED_DT);

            const loop1 = new FixedTimeStepLoop(callback1);
            const loop2 = new FixedTimeStepLoop(callback2);

            // Scenario 1: 30fps for 10 frames
            // Each frame is ~1.8 * FIXED_DT
            const dt30fps = 1 / 30;
            for (let i = 0; i < 10; i++) {
                loop1.update(dt30fps);
            }

            // Scenario 2: 60fps for 20 frames
            // Each frame is exactly FIXED_DT
            const dt60fps = FIXED_DT;
            for (let i = 0; i < 20; i++) {
                loop2.update(dt60fps);
            }

            // Both should process same number of physics updates
            expect(entity1.getPosition()).toBe(entity2.getPosition());
        });

        test('Variable frame rates with same physics steps', () => {
            const entity1 = new MockEntity();
            const entity2 = new MockEntity();

            let updates1 = 0;
            let updates2 = 0;

            const callback1 = () => {
                entity1.update(FIXED_DT);
                updates1++;
            };
            const callback2 = () => {
                entity2.update(FIXED_DT);
                updates2++;
            };

            const loop1 = new FixedTimeStepLoop(callback1);
            const loop2 = new FixedTimeStepLoop(callback2);

            // Scenario 1: Consistent 60fps for 30 frames
            const dt60 = FIXED_DT;
            for (let i = 0; i < 30; i++) {
                loop1.update(dt60);
            }

            // Scenario 2: Mixed framerates resulting in same physics steps
            loop2.update(FIXED_DT * 10);
            loop2.update(FIXED_DT * 10);
            loop2.update(FIXED_DT * 10);

            // Both should process exactly 30 physics updates
            expect(updates1).toBe(30);
            expect(updates2).toBe(30);

            // Both entities should have same final position
            expect(entity1.getPosition()).toBe(entity2.getPosition());
        });
    });

    describe('Multiple entities maintain frame independence', () => {
        test('Two entities remain synchronized across different frame rates', () => {
            const entity1a = new MockEntity();
            const entity2a = new MockEntity();
            const entity1b = new MockEntity();
            const entity2b = new MockEntity();

            entity2a.velocity = 50;
            entity2b.velocity = 50;

            const callbackA = () => {
                entity1a.update(FIXED_DT);
                entity2a.update(FIXED_DT);
            };

            const callbackB = () => {
                entity1b.update(FIXED_DT);
                entity2b.update(FIXED_DT);
            };

            const loopA = new FixedTimeStepLoop(callbackA);
            const loopB = new FixedTimeStepLoop(callbackB);

            // 60fps simulation
            for (let i = 0; i < 60; i++) {
                loopA.update(FIXED_DT);
            }

            // 30fps simulation
            const dt30 = 1 / 30;
            for (let i = 0; i < 30; i++) {
                loopB.update(dt30);
            }

            expect(entity1a.getPosition()).toBeCloseTo(entity1b.getPosition(), 4);
            expect(entity2a.getPosition()).toBeCloseTo(entity2b.getPosition(), 4);
        });
    });
});

/**
 * Helper function to generate deterministic dt sequence for testing
 */
function generateDeterministicDtSequence(length) {
    const sequence = [];
    for (let i = 0; i < length; i++) {
        // Generate varied but deterministic dt values
        const pattern = i % 5;
        switch (pattern) {
        case 0:
            sequence.push(physicsConfig.FIXED_DT * 0.5);
            break;
        case 1:
            sequence.push(physicsConfig.FIXED_DT);
            break;
        case 2:
            sequence.push(physicsConfig.FIXED_DT * 1.5);
            break;
        case 3:
            sequence.push(physicsConfig.FIXED_DT * 2);
            break;
        case 4:
            sequence.push(physicsConfig.FIXED_DT * 0.25);
            break;
        }
    }
    return sequence;
}
