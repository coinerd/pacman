import {
    isPortalTile,
    isWarping,
    handlePortalTraversal,
    PORTAL_TILES
} from '../../src/utils/WarpTunnel.js';
import { tileCenter, worldToTile } from '../../src/utils/TileMovement.js';
import { gameConfig } from '../../src/config/gameConfig.js';

describe('WarpTunnel - isPortalTile', () => {
    describe('Left portal detection', () => {
        test('returns true for left portal (0, 14)', () => {
            expect(isPortalTile(0, 14)).toBe(true);
        });

        test('returns true for left portal with all variations of tileX=0, tileY=14', () => {
            expect(isPortalTile(0, 14)).toBe(true);
        });
    });

    describe('Right portal detection', () => {
        test('returns true for right portal (27, 14)', () => {
            expect(isPortalTile(27, 14)).toBe(true);
        });
    });

    describe('Non-portal tiles', () => {
        test('returns false for (0, 13) near left portal', () => {
            expect(isPortalTile(0, 13)).toBe(false);
        });

        test('returns false for (27, 15) near right portal', () => {
            expect(isPortalTile(27, 15)).toBe(false);
        });

        test('returns false for (1, 14) adjacent to left portal', () => {
            expect(isPortalTile(1, 14)).toBe(false);
        });

        test('returns false for (26, 14) adjacent to right portal', () => {
            expect(isPortalTile(26, 14)).toBe(false);
        });

        test('returns false for center tile (13, 14)', () => {
            expect(isPortalTile(13, 14)).toBe(false);
        });

        test('returns false for arbitrary tiles', () => {
            expect(isPortalTile(5, 5)).toBe(false);
            expect(isPortalTile(10, 10)).toBe(false);
            expect(isPortalTile(20, 20)).toBe(false);
        });
    });

    describe('Boundary tiles', () => {
        test('returns false for (0, 0) top-left corner', () => {
            expect(isPortalTile(0, 0)).toBe(false);
        });

        test('returns false for (0, 30) bottom-left corner', () => {
            expect(isPortalTile(0, 30)).toBe(false);
        });

        test('returns false for (27, 0) top-right corner', () => {
            expect(isPortalTile(27, 0)).toBe(false);
        });

        test('returns false for (27, 30) bottom-right corner', () => {
            expect(isPortalTile(27, 30)).toBe(false);
        });

        test('returns false for (0, 1) near left edge', () => {
            expect(isPortalTile(0, 1)).toBe(false);
        });

        test('returns false for (27, 1) near right edge', () => {
            expect(isPortalTile(27, 1)).toBe(false);
        });
    });

    describe('Negative and out-of-bounds', () => {
        test('returns false for negative coordinates', () => {
            expect(isPortalTile(-1, 14)).toBe(false);
            expect(isPortalTile(0, -1)).toBe(false);
            expect(isPortalTile(-1, -1)).toBe(false);
        });

        test('returns false for coordinates beyond maze width', () => {
            expect(isPortalTile(28, 14)).toBe(false);
            expect(isPortalTile(29, 14)).toBe(false);
        });

        test('returns false for coordinates beyond maze height', () => {
            expect(isPortalTile(0, 31)).toBe(false);
            expect(isPortalTile(27, 32)).toBe(false);
        });
    });
});

describe('WarpTunnel - isWarping', () => {
    describe('Entity on left portal', () => {
        test('returns true when entity is on left portal tile', () => {
            const entityX = tileCenter(0, 14).x;
            const entityY = tileCenter(0, 14).y;

            expect(isWarping(entityX, entityY)).toBe(true);
        });

        test('returns true when entity x < tileSize and y at tunnel row center', () => {
            const entityX = tileCenter(0, 14).x - 10;
            const entityY = tileCenter(0, 14).y;

            expect(isWarping(entityX, entityY)).toBe(true);
        });
    });

    describe('Entity on right portal', () => {
        test('returns true when entity is on right portal tile', () => {
            const entityX = tileCenter(27, 14).x;
            const entityY = tileCenter(27, 14).y;

            expect(isWarping(entityX, entityY)).toBe(true);
        });
    });

    describe('Entity not on portal', () => {
        test('returns false when entity is not on portal', () => {
            const entityX = tileCenter(13, 14).x;
            const entityY = tileCenter(13, 14).y;

            expect(isWarping(entityX, entityY)).toBe(false);
        });

        test('returns false when entity is on different row', () => {
            const entityX = tileCenter(0, 14).x;
            const entityY = tileCenter(0, 13).y;

            expect(isWarping(entityX, entityY)).toBe(false);
        });

        test('returns false when entity is in middle of maze', () => {
            const entityX = tileCenter(13, 15).x;
            const entityY = tileCenter(13, 15).y;

            expect(isWarping(entityX, entityY)).toBe(false);
        });
    });

    describe('Edge cases with worldToTile conversion', () => {
        test('handles portal detection via worldToTile', () => {
            const worldPos = tileCenter(0, 14);
            const tile = worldToTile(worldPos.x, worldPos.y);

            expect(isWarping(worldPos.x, worldPos.y)).toBe(true);
            expect(isPortalTile(tile.x, tile.y)).toBe(true);
        });

        test('handles right portal detection via worldToTile', () => {
            const worldPos = tileCenter(27, 14);
            const tile = worldToTile(worldPos.x, worldPos.y);

            expect(isWarping(worldPos.x, worldPos.y)).toBe(true);
            expect(isPortalTile(tile.x, tile.y)).toBe(true);
        });
    });

    describe('Offset positions', () => {
        test('returns true for entity near left portal edge', () => {
            const entityX = 5;
            const entityY = tileCenter(0, 14).y;

            const tile = worldToTile(entityX, entityY);
            expect(tile.x).toBe(0);
            expect(isWarping(entityX, entityY)).toBe(true);
        });

        test('returns true for entity near right portal edge', () => {
            const entityX = gameConfig.mazeWidth * gameConfig.tileSize - 5;
            const entityY = tileCenter(27, 14).y;

            const tile = worldToTile(entityX, entityY);
            expect(tile.x).toBe(27);
            expect(isWarping(entityX, entityY)).toBe(true);
        });
    });
});

describe('WarpTunnel - handlePortalTraversal', () => {
    const tileSize = gameConfig.tileSize;

    describe('Left portal traversal', () => {
        test('teleports entity from left portal (x < 0) to right portal', () => {
            const entity = {
                gridX: 0,
                gridY: 14,
                x: -10,
                y: tileCenter(0, 14).y
            };

            handlePortalTraversal(entity, tileSize);

            expect(entity.gridX).toBe(27);
            expect(entity.gridY).toBe(14);
            expect(entity.x).toBe(tileCenter(27, 14).x);
            expect(entity.y).toBe(tileCenter(27, 14).y);
        });

        test('updates prevGrid when traversing from left portal', () => {
            const entity = {
                prevGridX: 0,
                prevGridY: 14,
                gridX: 0,
                gridY: 14,
                x: -10,
                y: tileCenter(0, 14).y
            };

            handlePortalTraversal(entity, tileSize);

            expect(entity.prevGridX).toBe(0);
            expect(entity.prevGridY).toBe(14);
        });
    });

    describe('Right portal traversal', () => {
        test('teleports entity from right portal (x > mazeWidth) to left portal', () => {
            const entity = {
                gridX: 27,
                gridY: 14,
                x: gameConfig.mazeWidth * gameConfig.tileSize + 10,
                y: tileCenter(27, 14).y
            };

            handlePortalTraversal(entity, tileSize);

            expect(entity.gridX).toBe(0);
            expect(entity.gridY).toBe(14);
            expect(entity.x).toBe(tileCenter(0, 14).x);
            expect(entity.y).toBe(tileCenter(0, 14).y);
        });

        test('updates prevGrid when traversing from right portal', () => {
            const entity = {
                prevGridX: 27,
                prevGridY: 14,
                gridX: 27,
                gridY: 14,
                x: gameConfig.mazeWidth * gameConfig.tileSize + 10,
                y: tileCenter(27, 14).y
            };

            handlePortalTraversal(entity, tileSize);

            expect(entity.prevGridX).toBe(27);
            expect(entity.prevGridY).toBe(14);
        });
    });

    describe('Non-portal entity', () => {
        test('does not modify entity not on portal', () => {
            const entity = {
                gridX: 13,
                gridY: 14,
                x: tileCenter(13, 14).x,
                y: tileCenter(13, 14).y
            };

            const initialX = entity.x;
            const initialY = entity.y;
            const initialGridX = entity.gridX;
            const initialGridY = entity.gridY;

            handlePortalTraversal(entity, tileSize);

            expect(entity.x).toBe(initialX);
            expect(entity.y).toBe(initialY);
            expect(entity.gridX).toBe(initialGridX);
            expect(entity.gridY).toBe(initialGridY);
        });
    });

    describe('Portal completion', () => {
        test('sets entity position to center of target tile', () => {
            const entity = {
                gridX: 0,
                gridY: 14,
                x: -10,
                y: tileCenter(0, 14).y
            };

            handlePortalTraversal(entity, tileSize);

            const targetCenter = tileCenter(27, 14);
            expect(entity.x).toBeCloseTo(targetCenter.x, 2);
            expect(entity.y).toBeCloseTo(targetCenter.y, 2);
        });

        test('updates gridX and gridY to target portal', () => {
            const entity = {
                gridX: 0,
                gridY: 14,
                x: -10,
                y: tileCenter(0, 14).y
            };

            handlePortalTraversal(entity, tileSize);

            expect(entity.gridX).toBe(PORTAL_TILES.rightPortal.tileX);
            expect(entity.gridY).toBe(PORTAL_TILES.rightPortal.tileY);
        });
    });

    describe('Offset portal positions', () => {
        test('handles entity with negative x offset from left portal', () => {
            const entity = {
                gridX: 0,
                gridY: 14,
                x: -5,
                y: tileCenter(0, 14).y
            };

            handlePortalTraversal(entity, tileSize);

            expect(entity.gridX).toBe(27);
            expect(entity.x).toBe(tileCenter(27, 14).x);
        });

        test('handles entity with positive x offset beyond right portal', () => {
            const entity = {
                gridX: 27,
                gridY: 14,
                x: 600,
                y: tileCenter(27, 14).y
            };

            handlePortalTraversal(entity, tileSize);

            expect(entity.gridX).toBe(0);
            expect(entity.x).toBe(tileCenter(0, 14).x);
        });
    });

    describe('Different tileSize', () => {
        test('works with custom tileSize when x < 0', () => {
            const customTileSize = 30;
            const entity = {
                gridX: 0,
                gridY: 14,
                x: -15,
                y: 14 * customTileSize + customTileSize / 2
            };

            handlePortalTraversal(entity, customTileSize);

            expect(entity.gridX).toBe(27);
        });
    });
});


describe('WarpTunnel - PORTAL_TILES constant', () => {
    test('exports PORTAL_TILES with correct values', () => {
        expect(PORTAL_TILES).toBeDefined();
        expect(PORTAL_TILES.leftPortal).toEqual({ tileX: 0, tileY: 14 });
        expect(PORTAL_TILES.rightPortal).toEqual({ tileX: 27, tileY: 14 });
        expect(PORTAL_TILES.tunnelRow).toBe(14);
    });

    test('PORTAL_TILES aligns with maze dimensions', () => {
        expect(PORTAL_TILES.leftPortal.tileX).toBeGreaterThanOrEqual(0);
        expect(PORTAL_TILES.leftPortal.tileX).toBeLessThan(gameConfig.mazeWidth);
        expect(PORTAL_TILES.rightPortal.tileX).toBeGreaterThanOrEqual(0);
        expect(PORTAL_TILES.rightPortal.tileX).toBeLessThan(gameConfig.mazeWidth);
        expect(PORTAL_TILES.tunnelRow).toBeGreaterThanOrEqual(0);
        expect(PORTAL_TILES.tunnelRow).toBeLessThan(gameConfig.mazeHeight);
    });
});
