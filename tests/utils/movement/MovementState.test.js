/**
 * Tests for MovementState constants
 */

import { MovementState } from '../../../src/utils/movement/MovementState.js';

describe('MovementState', () => {
    describe('constants', () => {
        test('should have AT_CENTER constant', () => {
            expect(MovementState.AT_CENTER).toBe('AT_CENTER');
        });

        test('should have MOVING constant', () => {
            expect(MovementState.MOVING).toBe('MOVING');
        });

        test('should have TURNING constant', () => {
            expect(MovementState.TURNING).toBe('TURNING');
        });

        test('should have BLOCKED constant', () => {
            expect(MovementState.BLOCKED).toBe('BLOCKED');
        });

        test('should have exactly 4 states', () => {
            const keys = Object.keys(MovementState);
            expect(keys).toHaveLength(4);
        });

        test('should have unique values for all states', () => {
            const values = Object.values(MovementState);
            const uniqueValues = [...new Set(values)];
            expect(uniqueValues).toHaveLength(values.length);
        });
    });
});
