import { worldToTile, tileCenter } from '../../src/utils/TileMovement.js';

describe('Grid Helper Functions', () => {
    describe('worldToTile', () => {
        const origin = { x: 0, y: 0 };
        const tileSize = 20;

        test('should convert origin position (0,0) to tile(0,0)', () => {
            const worldPos = { x: 0, y: 0 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: 0,
                tileY: 0
            });
        });

        test('should convert one tile width right to tile(1,0)', () => {
            const worldPos = { x: 20, y: 0 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: 1,
                tileY: 0
            });
        });

        test('should convert tile middle to correct tile index', () => {
            const worldPos = { x: 50, y: 70 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: 2,
                tileY: 3
            });
        });

        test('should handle negative coordinates', () => {
            const worldPos = { x: -30, y: -50 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: -2,
                tileY: -3
            });
        });

        test('should handle large coordinate values', () => {
            const worldPos = { x: 1000, y: 2000 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: 50,
                tileY: 100
            });
        });

        test('should not skip to next tile when near center (within EPS)', () => {
            const worldPos = { x: 32, y: 30 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: 1,
                tileY: 1
            });

            const worldPos2 = { x: 28, y: 30 };
            const result2 = worldToTile(worldPos2, origin, tileSize);

            expect(result2).toEqual({
                tileX: 1,
                tileY: 1
            });
        });

        test('should move to next tile when beyond EPS', () => {
            const worldPos = { x: 40, y: 30 };
            const result = worldToTile(worldPos, origin, tileSize);

            expect(result).toEqual({
                tileX: 2,
                tileY: 1
            });
        });

        test('should handle non-zero origin', () => {
            const customOrigin = { x: 100, y: 200 };
            const worldPos = { x: 130, y: 230 };
            const result = worldToTile(worldPos, customOrigin, tileSize);

            expect(result).toEqual({
                tileX: 1,
                tileY: 1
            });
        });
    });

    describe('tileCenter', () => {
        const origin = { x: 0, y: 0 };
        const tileSize = 20;

        test('should return origin + tileSize/2 for tile(0,0)', () => {
            const result = tileCenter(0, 0, origin, tileSize);

            expect(result).toEqual({
                x: 10,
                y: 10
            });
        });

        test('should return origin + tileSize * 1.5 for tile(1,0)', () => {
            const result = tileCenter(1, 0, origin, tileSize);

            expect(result).toEqual({
                x: 30,
                y: 10
            });
        });

        test('should work correctly in all 4 quadrants', () => {
            const q1 = tileCenter(2, 3, origin, tileSize);
            expect(q1).toEqual({ x: 50, y: 70 });

            const q2 = tileCenter(-2, 3, origin, tileSize);
            expect(q2).toEqual({ x: -30, y: 70 });

            const q3 = tileCenter(-2, -3, origin, tileSize);
            expect(q3).toEqual({ x: -30, y: -50 });

            const q4 = tileCenter(2, -3, origin, tileSize);
            expect(q4).toEqual({ x: 50, y: -50 });
        });

        test('should handle non-zero origin', () => {
            const customOrigin = { x: 100, y: 200 };
            const result = tileCenter(1, 2, customOrigin, tileSize);

            expect(result).toEqual({
                x: 130,
                y: 250
            });
        });
    });

    describe('Roundtrip Tests (CRITICAL)', () => {
        const origin = { x: 0, y: 0 };
        const tileSize = 20;

        test('should maintain roundtrip consistency for 10x10 grid', () => {
            for (let tileX = 0; tileX < 10; tileX++) {
                for (let tileY = 0; tileY < 10; tileY++) {
                    const center = tileCenter(tileX, tileY, origin, tileSize);
                    const backToTile = worldToTile(center, origin, tileSize);

                    expect(backToTile).toEqual({
                        tileX: tileX,
                        tileY: tileY
                    });
                }
            }
        });

        test('should maintain roundtrip consistency with negative tiles', () => {
            for (let tileX = -5; tileX < 5; tileX++) {
                for (let tileY = -5; tileY < 5; tileY++) {
                    const center = tileCenter(tileX, tileY, origin, tileSize);
                    const backToTile = worldToTile(center, origin, tileSize);

                    expect(backToTile).toEqual({
                        tileX: tileX,
                        tileY: tileY
                    });
                }
            }
        });

        test('should maintain roundtrip consistency with non-zero origin', () => {
            const customOrigin = { x: 50, y: 100 };

            for (let tileX = 0; tileX < 10; tileX++) {
                for (let tileY = 0; tileY < 10; tileY++) {
                    const center = tileCenter(tileX, tileY, customOrigin, tileSize);
                    const backToTile = worldToTile(center, customOrigin, tileSize);

                    expect(backToTile).toEqual({
                        tileX: tileX,
                        tileY: tileY
                    });
                }
            }
        });

        test('should maintain roundtrip consistency for large values', () => {
            const testCases = [
                { tileX: 0, tileY: 0 },
                { tileX: 100, tileY: 100 },
                { tileX: 27, tileY: 30 },
                { tileX: -100, tileY: 100 },
                { tileX: 50, tileY: -50 }
            ];

            testCases.forEach(({ tileX, tileY }) => {
                const center = tileCenter(tileX, tileY, origin, tileSize);
                const backToTile = worldToTile(center, origin, tileSize);

                expect(backToTile).toEqual({
                    tileX: tileX,
                    tileY: tileY
                });
            });
        });
    });

    describe('Tile Encoding/Decoding', () => {
        const mazeWidth = 28;

        test('should encode tile coordinates to single index', () => {
            const { encodeTile } = require('../../src/utils/TileMovement.js');

            expect(encodeTile(0, 0, mazeWidth)).toBe(0);
            expect(encodeTile(1, 0, mazeWidth)).toBe(1);
            expect(encodeTile(0, 1, mazeWidth)).toBe(28);
            expect(encodeTile(27, 0, mazeWidth)).toBe(27);
            expect(encodeTile(0, 2, mazeWidth)).toBe(56);
            expect(encodeTile(13, 14, mazeWidth)).toBe(405);
        });

        test('should decode single index to tile coordinates', () => {
            const { decodeTile } = require('../../src/utils/TileMovement.js');

            expect(decodeTile(0, mazeWidth)).toEqual({ tileX: 0, tileY: 0 });
            expect(decodeTile(1, mazeWidth)).toEqual({ tileX: 1, tileY: 0 });
            expect(decodeTile(28, mazeWidth)).toEqual({ tileX: 0, tileY: 1 });
            expect(decodeTile(27, mazeWidth)).toEqual({ tileX: 27, tileY: 0 });
            expect(decodeTile(56, mazeWidth)).toEqual({ tileX: 0, tileY: 2 });
            expect(decodeTile(405, mazeWidth)).toEqual({ tileX: 13, tileY: 14 });
        });

        test('should maintain encode/decode roundtrip', () => {
            const { encodeTile, decodeTile } = require('../../src/utils/TileMovement.js');

            const testIndices = [0, 1, 27, 28, 56, 100, 200, 405, 500, 800];

            testIndices.forEach(index => {
                const decoded = decodeTile(index, mazeWidth);
                const reencoded = encodeTile(decoded.tileX, decoded.tileY, mazeWidth);
                expect(reencoded).toBe(index);
            });
        });

        test('should maintain decode/encode roundtrip', () => {
            const { encodeTile, decodeTile } = require('../../src/utils/TileMovement.js');

            const testCoords = [
                { tileX: 0, tileY: 0 },
                { tileX: 27, tileY: 0 },
                { tileX: 0, tileY: 30 },
                { tileX: 13, tileY: 14 },
                { tileX: 27, tileY: 30 }
            ];

            testCoords.forEach(({ tileX, tileY }) => {
                const encoded = encodeTile(tileX, tileY, mazeWidth);
                const redecoded = decodeTile(encoded, mazeWidth);
                expect(redecoded).toEqual({ tileX, tileY });
            });
        });

        test('should handle encoding edge cases', () => {
            const { encodeTile } = require('../../src/utils/TileMovement.js');

            const maxX = 27;
            const maxY = 30;
            const maxIndex = encodeTile(maxX, maxY, mazeWidth);

            expect(maxIndex).toBe(867);
        });

        test('should handle different maze widths', () => {
            const { encodeTile, decodeTile } = require('../../src/utils/TileMovement.js');

            const widths = [10, 20, 28, 32];

            widths.forEach(width => {
                const testX = Math.floor(width / 2);
                const testY = 5;
                const encoded = encodeTile(testX, testY, width);
                const decoded = decodeTile(encoded, width);

                expect(decoded).toEqual({ tileX: testX, tileY: testY });
            });
        });
    });

    describe('Integration Tests', () => {
        const origin = { x: 0, y: 0 };
        const tileSize = 20;
        const mazeWidth = 28;

        test('should maintain consistency through full pipeline', () => {
            const { encodeTile, decodeTile } = require('../../src/utils/TileMovement.js');

            const originalWorld = tileCenter(5, 10, origin, tileSize);
            const tile = worldToTile(originalWorld, origin, tileSize);
            const encoded = encodeTile(tile.tileX, tile.tileY, mazeWidth);
            const decoded = decodeTile(encoded, mazeWidth);
            const finalWorld = tileCenter(decoded.tileX, decoded.tileY, origin, tileSize);

            expect(finalWorld).toEqual(originalWorld);
        });

        test('should work with actual maze dimensions (28x31)', () => {
            const { encodeTile, decodeTile } = require('../../src/utils/TileMovement.js');

            const corners = [
                { tileX: 0, tileY: 0 },
                { tileX: 27, tileY: 0 },
                { tileX: 0, tileY: 30 },
                { tileX: 27, tileY: 30 }
            ];

            corners.forEach(({ tileX, tileY }) => {
                const center = tileCenter(tileX, tileY, origin, tileSize);
                const tile = worldToTile(center, origin, tileSize);
                const encoded = encodeTile(tile.tileX, tile.tileY, mazeWidth);
                const decoded = decodeTile(encoded, mazeWidth);

                expect(decoded).toEqual({ tileX, tileY });
            });
        });
    });
});
