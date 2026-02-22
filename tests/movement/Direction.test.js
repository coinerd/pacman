/**
 * Tests für Direction
 */

import {
    Direction,
    directionsEqual,
    directionToString
} from '../../src/movement/core/Direction.js';

describe('Direction', () => {
    describe('Constants', () => {
        test('should have all basic directions', () => {
            expect(Direction.UP).toEqual({ x: 0, y: -1, angle: 270, name: 'UP' });
            expect(Direction.DOWN).toEqual({ x: 0, y: 1, angle: 90, name: 'DOWN' });
            expect(Direction.LEFT).toEqual({ x: -1, y: 0, angle: 180, name: 'LEFT' });
            expect(Direction.RIGHT).toEqual({ x: 1, y: 0, angle: 0, name: 'RIGHT' });
            expect(Direction.NONE).toEqual({ x: 0, y: 0, angle: 0, name: 'NONE' });
        });

        test('should have ALL array with 4 directions', () => {
            expect(Direction.ALL).toHaveLength(4);
            expect(Direction.ALL).toContainEqual(Direction.UP);
            expect(Direction.ALL).toContainEqual(Direction.DOWN);
            expect(Direction.ALL).toContainEqual(Direction.LEFT);
            expect(Direction.ALL).toContainEqual(Direction.RIGHT);
        });

        test('directions should be frozen', () => {
            expect(() => {
                Direction.UP.x = 999;
            }).toThrow();
        });
    });

    describe('isOpposite', () => {
        test('should return true for opposite directions', () => {
            expect(Direction.isOpposite(Direction.UP, Direction.DOWN)).toBe(true);
            expect(Direction.isOpposite(Direction.DOWN, Direction.UP)).toBe(true);
            expect(Direction.isOpposite(Direction.LEFT, Direction.RIGHT)).toBe(true);
            expect(Direction.isOpposite(Direction.RIGHT, Direction.LEFT)).toBe(true);
        });

        test('should return false for same directions', () => {
            expect(Direction.isOpposite(Direction.UP, Direction.UP)).toBe(false);
            expect(Direction.isOpposite(Direction.LEFT, Direction.LEFT)).toBe(false);
        });

        test('should return false for perpendicular directions', () => {
            expect(Direction.isOpposite(Direction.UP, Direction.LEFT)).toBe(false);
            expect(Direction.isOpposite(Direction.UP, Direction.RIGHT)).toBe(false);
            expect(Direction.isOpposite(Direction.LEFT, Direction.UP)).toBe(false);
        });

        test('should handle null/undefined', () => {
            expect(Direction.isOpposite(null, Direction.UP)).toBe(false);
            expect(Direction.isOpposite(Direction.UP, null)).toBe(false);
            expect(Direction.isOpposite(undefined, undefined)).toBe(false);
        });
    });

    describe('getOpposite', () => {
        test('should return correct opposite', () => {
            expect(Direction.getOpposite(Direction.UP)).toBe(Direction.DOWN);
            expect(Direction.getOpposite(Direction.DOWN)).toBe(Direction.UP);
            expect(Direction.getOpposite(Direction.LEFT)).toBe(Direction.RIGHT);
            expect(Direction.getOpposite(Direction.RIGHT)).toBe(Direction.LEFT);
        });

        test('should return NONE for NONE', () => {
            expect(Direction.getOpposite(Direction.NONE)).toBe(Direction.NONE);
        });

        test('should return NONE for null/undefined', () => {
            expect(Direction.getOpposite(null)).toBe(Direction.NONE);
            expect(Direction.getOpposite(undefined)).toBe(Direction.NONE);
        });
    });

    describe('fromAngle', () => {
        test('should convert angles to directions', () => {
            expect(Direction.fromAngle(0)).toBe(Direction.RIGHT);
            expect(Direction.fromAngle(90)).toBe(Direction.DOWN);
            expect(Direction.fromAngle(180)).toBe(Direction.LEFT);
            expect(Direction.fromAngle(270)).toBe(Direction.UP);
        });

        test('should return NONE for invalid angles', () => {
            expect(Direction.fromAngle(45)).toBe(Direction.NONE);
            expect(Direction.fromAngle(-90)).toBe(Direction.NONE);
            expect(Direction.fromAngle(360)).toBe(Direction.NONE);
        });
    });

    describe('fromName', () => {
        test('should convert names to directions', () => {
            expect(Direction.fromName('UP')).toBe(Direction.UP);
            expect(Direction.fromName('DOWN')).toBe(Direction.DOWN);
            expect(Direction.fromName('LEFT')).toBe(Direction.LEFT);
            expect(Direction.fromName('RIGHT')).toBe(Direction.RIGHT);
        });

        test('should be case insensitive', () => {
            expect(Direction.fromName('up')).toBe(Direction.UP);
            expect(Direction.fromName('Down')).toBe(Direction.DOWN);
            expect(Direction.fromName('LEFT')).toBe(Direction.LEFT);
        });

        test('should return NONE for invalid names', () => {
            expect(Direction.fromName('INVALID')).toBe(Direction.NONE);
            expect(Direction.fromName('')).toBe(Direction.NONE);
            expect(Direction.fromName(null)).toBe(Direction.NONE);
        });
    });

    describe('fromDelta', () => {
        test('should convert deltas to directions', () => {
            expect(Direction.fromDelta(0, -1)).toBe(Direction.UP);
            expect(Direction.fromDelta(0, 1)).toBe(Direction.DOWN);
            expect(Direction.fromDelta(-1, 0)).toBe(Direction.LEFT);
            expect(Direction.fromDelta(1, 0)).toBe(Direction.RIGHT);
        });

        test('should return NONE for invalid deltas', () => {
            expect(Direction.fromDelta(0, 0)).toBe(Direction.NONE);
            expect(Direction.fromDelta(1, 1)).toBe(Direction.NONE);
            expect(Direction.fromDelta(-1, -1)).toBe(Direction.NONE);
            expect(Direction.fromDelta(2, 0)).toBe(Direction.NONE);
        });
    });

    describe('isValid', () => {
        test('should return true for valid directions', () => {
            expect(Direction.isValid(Direction.UP)).toBe(true);
            expect(Direction.isValid(Direction.DOWN)).toBe(true);
            expect(Direction.isValid(Direction.LEFT)).toBe(true);
            expect(Direction.isValid(Direction.RIGHT)).toBe(true);
            expect(Direction.isValid(Direction.NONE)).toBe(true);
        });

        test('should return false for invalid directions', () => {
            expect(Direction.isValid({ x: 0, y: 0, angle: 45 })).toBe(false);
            expect(Direction.isValid(null)).toBe(false);
            expect(Direction.isValid(undefined)).toBe(false);
        });
    });
});

describe('directionsEqual', () => {
    test('should return true for equal directions', () => {
        expect(directionsEqual(Direction.UP, Direction.UP)).toBe(true);
        expect(directionsEqual(
            { x: 0, y: -1 },
            { x: 0, y: -1 }
        )).toBe(true);
    });

    test('should return false for different directions', () => {
        expect(directionsEqual(Direction.UP, Direction.DOWN)).toBe(false);
        expect(directionsEqual(
            { x: 0, y: -1 },
            { x: 0, y: 1 }
        )).toBe(false);
    });

    test('should handle null/undefined', () => {
        expect(directionsEqual(null, Direction.UP)).toBe(false);
        expect(directionsEqual(Direction.UP, null)).toBe(false);
        expect(directionsEqual(null, null)).toBe(false);
    });
});

describe('directionToString', () => {
    test('should return name for valid direction', () => {
        expect(directionToString(Direction.UP)).toBe('UP');
        expect(directionToString(Direction.DOWN)).toBe('DOWN');
    });

    test('should return NONE for null/undefined', () => {
        expect(directionToString(null)).toBe('NONE');
        expect(directionToString(undefined)).toBe('NONE');
    });

    test('should return NONE for direction without name', () => {
        expect(directionToString({ x: 0, y: 0 })).toBe('NONE');
    });
});
