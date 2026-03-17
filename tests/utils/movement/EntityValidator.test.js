/**
 * Tests for EntityValidator
 * Validation utilities for entity state
 */

import {
    validateEntityState,
    isMovingInDirection,
    hasBufferedTurn,
    isValidDirection,
    isGridConsistent,
    isValidGridPosition,
    validateGridToWorldConsistency,
    isGridCenter
} from '../../../src/utils/movement/EntityValidator.js';
import { directions } from '../../../src/config/gameConfig.js';

// Mock gameConfig
jest.mock('../../../src/config/gameConfig.js', () => ({
    directions: {
        UP: { x: 0, y: -1, name: 'UP' },
        DOWN: { x: 0, y: 1, name: 'DOWN' },
        LEFT: { x: -1, y: 0, name: 'LEFT' },
        RIGHT: { x: 1, y: 0, name: 'RIGHT' },
        NONE: { x: 0, y: 0, name: 'NONE' }
    },
    gameConfig: {
        tileSize: 20
    }
}));

describe('EntityValidator', () => {
    describe('validateEntityState', () => {
        test('returns true for valid entity', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 110,
                y: 70,
                direction: directions.RIGHT
            };

            expect(() => validateEntityState(entity)).not.toThrow();
        });

        test('throws for null entity', () => {
            expect(() => validateEntityState(null)).toThrow('Entity is null or undefined');
        });

        test('throws for undefined entity', () => {
            expect(() => validateEntityState(undefined)).toThrow('Entity is null or undefined');
        });

        test('throws when missing gridX', () => {
            const entity = {
                gridY: 3,
                x: 110,
                y: 70
            };

            expect(() => validateEntityState(entity)).toThrow('Entity missing grid coordinates');
        });

        test('throws when gridX is not a number', () => {
            const entity = {
                gridX: '5',
                gridY: 3,
                x: 110,
                y: 70
            };

            expect(() => validateEntityState(entity)).toThrow('Entity missing grid coordinates');
        });

        test('throws when missing world coordinates', () => {
            const entity = {
                gridX: 5,
                gridY: 3
            };

            expect(() => validateEntityState(entity)).toThrow('Entity missing world coordinates');
        });

        test('throws for invalid direction', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 110,
                y: 70,
                direction: { invalid: true }
            };

            expect(() => validateEntityState(entity)).toThrow('Entity has invalid direction');
        });

        test('accepts entity without direction', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 110,
                y: 70
            };

            expect(() => validateEntityState(entity)).not.toThrow();
        });
    });

    describe('isMovingInDirection', () => {
        test('returns true when moving right', () => {
            const entity = { direction: directions.RIGHT };
            expect(isMovingInDirection(entity)).toBe(true);
        });

        test('returns true when moving up', () => {
            const entity = { direction: directions.UP };
            expect(isMovingInDirection(entity)).toBe(true);
        });

        test('returns false when direction is NONE', () => {
            const entity = { direction: directions.NONE };
            expect(isMovingInDirection(entity)).toBe(false);
        });

        test('returns false when no direction', () => {
            const entity = {};
            expect(isMovingInDirection(entity)).toBe(false);
        });
    });

    describe('hasBufferedTurn', () => {
        test('returns true when has buffered turn', () => {
            const entity = { nextDirection: directions.RIGHT };
            expect(hasBufferedTurn(entity)).toBe(true);
        });

        test('returns false when nextDirection is NONE', () => {
            const entity = { nextDirection: directions.NONE };
            expect(hasBufferedTurn(entity)).toBe(false);
        });

        test('returns false when no nextDirection', () => {
            const entity = {};
            expect(hasBufferedTurn(entity)).toBe(false);
        });
    });

    describe('isValidDirection', () => {
        test('returns true for UP', () => {
            expect(isValidDirection(directions.UP)).toBe(true);
        });

        test('returns true for DOWN', () => {
            expect(isValidDirection(directions.DOWN)).toBe(true);
        });

        test('returns true for LEFT', () => {
            expect(isValidDirection(directions.LEFT)).toBe(true);
        });

        test('returns true for RIGHT', () => {
            expect(isValidDirection(directions.RIGHT)).toBe(true);
        });

        test('returns true for NONE', () => {
            expect(isValidDirection(directions.NONE)).toBe(true);
        });

        test('returns false for invalid direction', () => {
            expect(isValidDirection({ x: 1, y: 1 })).toBe(false);
        });

        test('returns false for null', () => {
            expect(isValidDirection(null)).toBe(false);
        });

        test('returns false for undefined', () => {
            expect(isValidDirection(undefined)).toBe(false);
        });
    });

    describe('isGridConsistent', () => {
        test('returns true when grid matches world position', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 110, // 5 * 20 + offset
                y: 70   // 3 * 20 + offset
            };

            expect(isGridConsistent(entity)).toBe(true);
        });

        test('returns true when within tolerance', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 105, // Slightly off
                y: 68
            };

            expect(isGridConsistent(entity)).toBe(true);
        });

        test('returns false for null entity', () => {
            expect(isGridConsistent(null)).toBe(false);
        });

        test('returns false when missing grid coordinates', () => {
            const entity = { x: 100, y: 100 };
            expect(isGridConsistent(entity)).toBe(false);
        });

        test('returns false when grid significantly off', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 200, // Way off
                y: 150
            };

            expect(isGridConsistent(entity)).toBe(false);
        });
    });

    describe('isValidGridPosition', () => {
        const maze = [
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 1, 1, 1]
        ];

        test('returns true for valid position', () => {
            expect(isValidGridPosition(1, 1, maze)).toBe(true);
        });

        test('returns true for position at edge', () => {
            expect(isValidGridPosition(3, 3, maze)).toBe(true);
        });

        test('returns false for negative x', () => {
            expect(isValidGridPosition(-1, 1, maze)).toBe(false);
        });

        test('returns false for negative y', () => {
            expect(isValidGridPosition(1, -1, maze)).toBe(false);
        });

        test('returns false for x out of bounds', () => {
            expect(isValidGridPosition(10, 1, maze)).toBe(false);
        });

        test('returns false for y out of bounds', () => {
            expect(isValidGridPosition(1, 10, maze)).toBe(false);
        });

        test('returns false for null maze', () => {
            expect(isValidGridPosition(1, 1, null)).toBe(false);
        });

        test('returns false for empty maze', () => {
            expect(isValidGridPosition(1, 1, [])).toBe(false);
        });
    });

    describe('validateGridToWorldConsistency', () => {
        test('does not throw for consistent entity', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 100,
                y: 60
            };

            expect(() => validateGridToWorldConsistency(entity)).not.toThrow();
        });

        test('throws for inconsistent grid and world', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 200, // Doesn't match gridX
                y: 60
            };

            expect(() => validateGridToWorldConsistency(entity)).toThrow('Grid coordinate inconsistency');
        });

        test('validates entity state first', () => {
            expect(() => validateGridToWorldConsistency(null)).toThrow('Entity is null or undefined');
        });
    });

    describe('isGridCenter', () => {
        test('returns true when at grid center', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 110, // 5 * 20 + 10
                y: 70   // 3 * 20 + 10
            };

            expect(isGridCenter(entity)).toBe(true);
        });

        test('returns true within default tolerance', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 113, // Within 5 pixels
                y: 68
            };

            expect(isGridCenter(entity)).toBe(true);
        });

        test('returns false outside tolerance', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 120, // More than 5 pixels off
                y: 70
            };

            expect(isGridCenter(entity)).toBe(false);
        });

        test('respects custom tolerance', () => {
            const entity = {
                gridX: 5,
                gridY: 3,
                x: 115,
                y: 75
            };

            expect(isGridCenter(entity, 10)).toBe(true);
            expect(isGridCenter(entity, 3)).toBe(false);
        });

        test('returns false for null entity', () => {
            expect(isGridCenter(null)).toBe(false);
        });

        test('returns false for entity missing grid coordinates', () => {
            const entity = { x: 100, y: 100 };
            expect(isGridCenter(entity)).toBe(false);
        });
    });
});
