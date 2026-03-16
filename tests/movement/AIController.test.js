/**
 * AIController Basic Tests
 * Tests for AI controller initialization and basic functionality
 */

import { DEFAULT_MODE_DURATIONS } from '../../src/movement/ai/AIController.js';

describe('AIController', () => {
    describe('Default Mode Durations', () => {
        test('should have default mode durations', () => {
            expect(DEFAULT_MODE_DURATIONS).toBeDefined();
            expect(Array.isArray(DEFAULT_MODE_DURATIONS)).toBe(true);
        });

        test('should start with SCATTER mode', () => {
            expect(DEFAULT_MODE_DURATIONS[0].mode).toBe('SCATTER');
        });

        test('should alternate between SCATTER and CHASE', () => {
            for (let i = 0; i < DEFAULT_MODE_DURATIONS.length - 1; i++) {
                expect(DEFAULT_MODE_DURATIONS[i].mode).not.toBe(DEFAULT_MODE_DURATIONS[i + 1].mode);
            }
        });

        test('should have finite durations except last', () => {
            for (let i = 0; i < DEFAULT_MODE_DURATIONS.length - 1; i++) {
                expect(DEFAULT_MODE_DURATIONS[i].duration).not.toBe(Infinity);
            }
        });

        test('should end with infinite CHASE', () => {
            const lastMode = DEFAULT_MODE_DURATIONS[DEFAULT_MODE_DURATIONS.length - 1];
            expect(lastMode.mode).toBe('CHASE');
            expect(lastMode.duration).toBe(Infinity);
        });

        test('should have positive durations', () => {
            for (const mode of DEFAULT_MODE_DURATIONS) {
                if (mode.duration !== Infinity) {
                    expect(mode.duration).toBeGreaterThan(0);
                }
            }
        });

        test('should have decreasing SCATTER durations', () => {
            const scatterDurations = DEFAULT_MODE_DURATIONS
                .filter(m => m.mode === 'SCATTER')
                .map(m => m.duration);

            for (let i = 1; i < scatterDurations.length; i++) {
                expect(scatterDurations[i]).toBeLessThanOrEqual(scatterDurations[i - 1]);
            }
        });
    });
});
