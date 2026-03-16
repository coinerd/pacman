// tests/utils/TileMath.test.js

import * as TileMath from '../../src/utils/TileMath.js';

describe('TileMath', () => {
    describe('worldToTile', () => {
        test('should convert world coordinates to tile coordinates', () => {
            const result = TileMath.worldToTile(50, 60);

            expect(result.x).toBe(2);
            expect(result.y).toBe(3);
        });

        test('should accept object with x and y', () => {
            const result = TileMath.worldToTile({ x: 50, y: 60 }, { x: 0, y: 0 }, 20);

            expect(result.tileX).toBe(2);
            expect(result.tileY).toBe(3);
        });
    });

    describe('tileCenter', () => {
        test('should return center pixel of tile', () => {
            const result = TileMath.tileCenter(2, 3);

            expect(result.x).toBe(50);
            expect(result.y).toBe(70);
        });

        test('should accept custom origin and tile size', () => {
            const result = TileMath.tileCenter(2, 3, { x: 0, y: 0 }, 20);

            expect(result.x).toBe(50);
            expect(result.y).toBe(70);
        });
    });

    describe('encodeTile', () => {
        test('should encode tile coordinates to index', () => {
            const result = TileMath.encodeTile(5, 3, 10);

            expect(result).toBe(35);
        });
    });

    describe('decodeTile', () => {
        test('should decode index to tile coordinates', () => {
            const result = TileMath.decodeTile(35, 10);

            expect(result.tileX).toBe(5);
            expect(result.tileY).toBe(3);
        });
    });

    describe('tileToWorld', () => {
        test('should convert tile to world coordinates', () => {
            const result = TileMath.tileToWorld(2, 3);

            expect(result.x).toBe(40);
            expect(result.y).toBe(60);
        });
    });

    describe('isAtTileCenter', () => {
        test('should return true when at tile center', () => {
            const result = TileMath.isAtTileCenter(50, 70, 2, 3);

            expect(result).toBe(true);
        });

        test('should return false when not at tile center', () => {
            const result = TileMath.isAtTileCenter(100, 100, 2, 3);

            expect(result).toBe(false);
        });
    });

    describe('distanceToTileCenter', () => {
        test('should return 0 when at center', () => {
            const result = TileMath.distanceToTileCenter(50, 70, 2, 3);

            expect(result).toBe(0);
        });

        test('should return positive distance when not at center', () => {
            const result = TileMath.distanceToTileCenter(100, 100, 2, 3);

            expect(result).toBeGreaterThan(0);
        });
    });

    describe('isExactlyAtTileCenter', () => {
        test('should return true when exactly at center', () => {
            const result = TileMath.isExactlyAtTileCenter(50, 70, 2, 3);

            expect(result).toBe(true);
        });
    });
});
