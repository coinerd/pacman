import { tileCenter, worldToTile } from './TileMovement.js';

const TUNNEL_ROW = 14;

const PORTAL_TILES = {
    leftPortal: { tileX: 0, tileY: TUNNEL_ROW },
    rightPortal: { tileX: 27, tileY: TUNNEL_ROW },
    tunnelRow: TUNNEL_ROW
};

export { PORTAL_TILES };

/**
 * @param {number} tileX - Tile x coordinate
 * @param {number} tileY - Tile y coordinate
 * @returns {boolean} True if tile is a portal
 */
export function isPortalTile(tileX, tileY) {
    return tileY === TUNNEL_ROW && (tileX === 0 || tileX === 27);
}

/**
 * @param {number} entityX - Entity world x coordinate
 * @param {number} entityY - Entity world y coordinate
 * @returns {boolean} True if entity is on a portal tile
 */
export function isWarping(entityX, entityY) {
    const tile = worldToTile(entityX, entityY);
    return isPortalTile(tile.x, tile.y);
}

/**
 * @param {object} entity - Entity with x, y, gridX, gridY properties
 * @param {number} tileSize - Size of one tile in pixels
 */
export function handlePortalTraversal(entity, tileSize) {
    const tile = worldToTile(entity.x, entity.y);

    if (!isPortalTile(tile.x, tile.y)) {
        return;
    }

    const targetTile = entity.x < 0 ? PORTAL_TILES.rightPortal : PORTAL_TILES.leftPortal;

    entity.gridX = targetTile.tileX;
    entity.gridY = targetTile.tileY;
    const center = tileCenter(targetTile.tileX, targetTile.tileY);
    entity.x = center.x; entity.y = center.y;
}
