/**
 * Tests for TileMovement module (deprecated re-exports)
 */

describe('TileMovement', () => {
    let originalWarn;

    beforeEach(() => {
        originalWarn = console.warn;
        console.warn = jest.fn();
    });

    afterEach(() => {
        console.warn = originalWarn;
    });

    describe('performGridMovementStep', () => {
        it('should warn about deprecation', async () => {
            const { performGridMovementStep } = await import('../../src/utils/TileMovement.js');

            const entity = { x: 0, y: 0 };
            const result = performGridMovementStep(entity, [], 1);

            expect(console.warn).toHaveBeenCalledWith(
                '[DEPRECATED] performGridMovementStep is deprecated. Use TileCenterMovementStrategy instead.'
            );
            expect(result).toBe(entity);
        });
    });

    describe('re-exports from TileMath', () => {
        it('should export EPS', async () => {
            const { EPS } = await import('../../src/utils/TileMovement.js');
            expect(EPS).toBeDefined();
            expect(EPS).toBeGreaterThan(0);
        });

        it('should export worldToTile', async () => {
            const { worldToTile } = await import('../../src/utils/TileMovement.js');
            expect(worldToTile).toBeInstanceOf(Function);
        });

        it('should export tileCenter', async () => {
            const { tileCenter } = await import('../../src/utils/TileMovement.js');
            expect(tileCenter).toBeInstanceOf(Function);
        });

        it('should export encodeTile', async () => {
            const { encodeTile } = await import('../../src/utils/TileMovement.js');
            expect(encodeTile).toBeInstanceOf(Function);
        });

        it('should export decodeTile', async () => {
            const { decodeTile } = await import('../../src/utils/TileMovement.js');
            expect(decodeTile).toBeInstanceOf(Function);
        });

        it('should export tileToWorld', async () => {
            const { tileToWorld } = await import('../../src/utils/TileMovement.js');
            expect(tileToWorld).toBeInstanceOf(Function);
        });

        it('should export isAtTileCenter', async () => {
            const { isAtTileCenter } = await import('../../src/utils/TileMovement.js');
            expect(isAtTileCenter).toBeInstanceOf(Function);
        });

        it('should export distanceToTileCenter', async () => {
            const { distanceToTileCenter } = await import('../../src/utils/TileMovement.js');
            expect(distanceToTileCenter).toBeInstanceOf(Function);
        });

        it('should export isExactlyAtTileCenter', async () => {
            const { isExactlyAtTileCenter } = await import('../../src/utils/TileMovement.js');
            expect(isExactlyAtTileCenter).toBeInstanceOf(Function);
        });
    });
});
