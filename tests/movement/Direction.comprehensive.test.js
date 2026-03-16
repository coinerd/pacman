/**
 * Direction Comprehensive Tests
 * Tests for direction constants and utilities
 */

import { Direction, directionsEqual, directionToString } from '../../src/movement/core/Direction.js';

describe('Direction', () => {
    describe('Direction Constants', () => {
        test('should have NONE direction', () => {
            expect(Direction.NONE).toBeDefined();
        });

        test('should have RIGHT direction', () => {
            expect(Direction.RIGHT).toBeDefined();
        });

        test('should have DOWN direction', () => {
            expect(Direction.DOWN).toBeDefined();
        });

        test('should have LEFT direction', () => {
            expect(Direction.LEFT).toBeDefined();
        });

        test('should have UP direction', () => {
            expect(Direction.UP).toBeDefined();
        });

        test('should have unique values', () => {
            const values = [Direction.NONE, Direction.RIGHT, Direction.DOWN, Direction.LEFT, Direction.UP];
            const uniqueValues = [...new Set(values)];
            expect(uniqueValues.length).toBe(values.length);
        });
    });

    describe('directionsEqual', () => {
        test('should return true for equal directions', () => {
            expect(directionsEqual(Direction.RIGHT, Direction.RIGHT)).toBe(true);
        });

        test('should return false for different directions', () => {
            expect(directionsEqual(Direction.RIGHT, Direction.LEFT)).toBe(false);
        });

        test('should handle NONE comparison', () => {
            expect(directionsEqual(Direction.NONE, Direction.NONE)).toBe(true);
        });
    });

    describe('directionToString', () => {
        test('should convert RIGHT to string', () => {
            expect(directionToString(Direction.RIGHT)).toBe('RIGHT');
        });

        test('should convert LEFT to string', () => {
            expect(directionToString(Direction.LEFT)).toBe('LEFT');
        });

        test('should convert UP to string', () => {
            expect(directionToString(Direction.UP)).toBe('UP');
        });

        test('should convert DOWN to string', () => {
            expect(directionToString(Direction.DOWN)).toBe('DOWN');
        });

        test('should convert NONE to string', () => {
            expect(directionToString(Direction.NONE)).toBe('NONE');
        });
    });
});
