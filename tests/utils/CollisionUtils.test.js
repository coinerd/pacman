// tests/utils/CollisionUtils.test.js

import {
    capsuleCollision,
    lineSegmentsIntersect,
    pointToLineSegmentDistance
} from '../../src/utils/CollisionUtils.js';

describe('CollisionUtils', () => {
    describe('lineSegmentsIntersect', () => {
        test('should return true for intersecting line segments', () => {
            // Cross shape: two lines crossing at center
            const result = lineSegmentsIntersect(
                0, 0, 10, 10,  // Diagonal from bottom-left to top-right
                0, 10, 10, 0   // Diagonal from top-left to bottom-right
            );
            expect(result).toBe(true);
        });

        test('should return false for parallel non-intersecting lines', () => {
            const result = lineSegmentsIntersect(
                0, 0, 10, 0,   // Horizontal line at y=0
                0, 5, 10, 5    // Horizontal line at y=5
            );
            expect(result).toBe(false);
        });

        test('should return false for non-intersecting line segments', () => {
            const result = lineSegmentsIntersect(
                0, 0, 5, 5,
                10, 10, 15, 15
            );
            expect(result).toBe(false);
        });

        test('should return false for collinear lines (denominator = 0)', () => {
            const result = lineSegmentsIntersect(
                0, 0, 5, 5,
                1, 1, 6, 6  // Same slope, different position
            );
            expect(result).toBe(false);
        });

        test('should return true for lines sharing an endpoint', () => {
            const result = lineSegmentsIntersect(
                0, 0, 5, 5,
                5, 5, 10, 0
            );
            expect(result).toBe(true);
        });

        test('should return true for perpendicular intersecting lines', () => {
            // Vertical and horizontal crossing
            const result = lineSegmentsIntersect(
                5, 0, 5, 10,   // Vertical line
                0, 5, 10, 5    // Horizontal line
            );
            expect(result).toBe(true);
        });
    });

    describe('pointToLineSegmentDistance', () => {
        test('should return 0 when point is on the line', () => {
            const distance = pointToLineSegmentDistance(5, 5, 0, 0, 10, 10);
            expect(distance).toBeCloseTo(0, 5);
        });

        test('should return correct distance for point perpendicular to line', () => {
            // Point at (5, 10), line from (0, 0) to (10, 0)
            // Expected distance: 10 (vertical distance)
            const distance = pointToLineSegmentDistance(5, 10, 0, 0, 10, 0);
            expect(distance).toBeCloseTo(10, 5);
        });

        test('should return distance to nearest endpoint when perpendicular is outside segment', () => {
            // Point at (15, 5), line from (0, 0) to (10, 0)
            // Expected: distance to (10, 0) = sqrt(25 + 25) = sqrt(50)
            const distance = pointToLineSegmentDistance(15, 5, 0, 0, 10, 0);
            expect(distance).toBeCloseTo(Math.sqrt(50), 5);
        });

        test('should return distance to start point when param < 0', () => {
            const distance = pointToLineSegmentDistance(-5, 0, 0, 0, 10, 0);
            expect(distance).toBe(5);
        });

        test('should return distance to end point when param > 1', () => {
            const distance = pointToLineSegmentDistance(15, 0, 0, 0, 10, 0);
            expect(distance).toBe(5);
        });

        test('should handle zero-length line segment', () => {
            const distance = pointToLineSegmentDistance(5, 5, 0, 0, 0, 0);
            expect(distance).toBeCloseTo(Math.sqrt(50), 5);
        });
    });

    describe('capsuleCollision', () => {
        test('should return true when line segments intersect', () => {
            const result = capsuleCollision(
                0, 0, 10, 10,
                0, 10, 10, 0,
                1
            );
            expect(result).toBe(true);
        });

        test('should return true when paths are within collision radius', () => {
            // Two parallel paths close together
            const result = capsuleCollision(
                0, 0, 10, 0,
                0, 1, 10, 1,
                2  // radius larger than distance
            );
            expect(result).toBe(true);
        });

        test('should return false when paths are too far apart', () => {
            const result = capsuleCollision(
                0, 0, 10, 0,
                0, 100, 10, 100,
                1  // radius smaller than distance
            );
            expect(result).toBe(false);
        });

        test('should check all four endpoint-to-line distances', () => {
            // Endpoints close to opposite line
            const result = capsuleCollision(
                0, 0, 0, 0,   // Point-like movement
                2, 0, 10, 0,  // Line segment
                3  // radius larger than distance
            );
            expect(result).toBe(true);
        });

        test('should handle zero-radius collision check', () => {
            // Zero radius only detects actual intersection
            const result = capsuleCollision(
                0, 0, 10, 10,
                0, 10, 10, 0,
                0
            );
            expect(result).toBe(true);  // Lines intersect
        });

        test('should detect collision when only endpoint is within radius', () => {
            // One endpoint close to other line
            const result = capsuleCollision(
                5, 5, 5, 5,    // Point at (5, 5)
                0, 0, 10, 0,   // Line along x-axis
                6  // radius > 5 (distance from point to line)
            );
            expect(result).toBe(true);
        });
    });
});
