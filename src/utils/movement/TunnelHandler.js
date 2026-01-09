import { gameConfig } from '../../config/gameConfig.js';
import { isPortalTile, PORTAL_TILES } from '../WarpTunnel.js';

/**
 * TunnelHandler - Micro-system for handling tunnel teleportation
 *
 * Responsibilities:
 * - Detect when entity enters a portal tile
 * - Perform portal traversal (warp from left to right, right to left)
 * - Update entity position and grid coordinates after warping
 * - Integrate with movement step logic
 */

/**
 * Check if entity is at or near a portal tile
 * @param {object} entity - Entity with gridX, gridY properties
 * @returns {boolean} True if entity is on a portal tile
 */
export function isEntityAtPortal(entity) {
    return isPortalTile(entity.gridX, entity.gridY);
}

/**
 * Check if entity is warping (has left maze bounds)
 * @param {object} entity - Entity with x, y properties
 * @returns {boolean} True if entity is outside maze bounds
 */
export function isEntityWarping(entity) {
    const mazeWidth = gameConfig.mazeWidth * gameConfig.tileSize;
    return entity.x < 0 || entity.x > mazeWidth;
}

/**
 * Handle portal traversal - warp entity to opposite side
 * @param {object} entity - Entity with x, y, gridX, gridY properties
 * @param {number} tileSize - Size of one tile in pixels
 * @returns {object} Updated entity
 */
export function handlePortalTraversal(entity, tileSize = gameConfig.tileSize) {
    const mazeWidth = gameConfig.mazeWidth * gameConfig.tileSize;

    if (entity.x <= 0) {
        warpToRightPortal(entity, mazeWidth, tileSize);
    } else if (entity.x >= mazeWidth) {
        warpToLeftPortal(entity, mazeWidth, tileSize);
    }

    return entity;
}

/**
 * Warp entity to right portal
 * @param {object} entity - Entity to warp
 * @param {number} mazeWidth - Width of maze in pixels
 * @param {number} tileSize - Size of one tile in pixels
 */
function warpToRightPortal(entity, mazeWidth, tileSize) {
    entity.prevGridX = entity.gridX;
    entity.prevGridY = entity.gridY;

    entity.gridX = PORTAL_TILES.rightPortal.tileX;
    entity.gridY = PORTAL_TILES.rightPortal.tileY;

    const rightPortalCenterX = (PORTAL_TILES.rightPortal.tileX * tileSize) + (tileSize / 2);
    const rightPortalCenterY = (PORTAL_TILES.rightPortal.tileY * tileSize) + (tileSize / 2);
    entity.x = rightPortalCenterX;
    entity.y = rightPortalCenterY;
}

/**
 * Warp entity to left portal
 * @param {object} entity - Entity to warp
 * @param {number} mazeWidth - Width of maze in pixels
 * @param {number} tileSize - Size of one tile in pixels
 */
function warpToLeftPortal(entity, mazeWidth, tileSize) {
    entity.prevGridX = entity.gridX;
    entity.prevGridY = entity.gridY;

    entity.gridX = PORTAL_TILES.leftPortal.tileX;
    entity.gridY = PORTAL_TILES.leftPortal.tileY;

    const leftPortalCenterX = (PORTAL_TILES.leftPortal.tileX * tileSize) + (tileSize / 2);
    const leftPortalCenterY = (PORTAL_TILES.leftPortal.tileY * tileSize) + (tileSize / 2);
    entity.x = leftPortalCenterX;
    entity.y = leftPortalCenterY;
}

/**
 * Check if movement step should trigger portal traversal
 * @param {object} entity - Entity with x, y, gridX, gridY properties
 * @param {number} moveDist - Distance to move
 * @param {object} direction - Movement direction {x, y}
 * @returns {boolean} True if portal traversal should occur
 */
export function shouldTriggerPortalTraversal(entity, moveDist, direction) {
    if (!direction || (direction.x === 0 && direction.y === 0)) {
        return false;
    }

    if (entity.gridY !== gameConfig.tunnelRow) {
        return false;
    }

    if (direction.x < 0 && entity.gridX === PORTAL_TILES.leftPortal.tileX) {
        return true;
    }

    if (direction.x > 0 && entity.gridX === PORTAL_TILES.rightPortal.tileX) {
        return true;
    }

    return false;
}

/**
 * Wrap entity around maze boundaries (legacy method)
 * This method is kept for backward compatibility
 * @param {object} entity - Entity with x, y, gridY properties
 * @returns {object} Updated entity
 */
export function handleTunnelWrap(entity) {
    const mazeWidth = gameConfig.mazeWidth * gameConfig.tileSize;

    if (entity.gridY !== gameConfig.tunnelRow) {
        return entity;
    }

    if (entity.x < 0) {
        entity.x = mazeWidth;
    } else if (entity.x > mazeWidth) {
        entity.x = 0;
    }

    return entity;
}
