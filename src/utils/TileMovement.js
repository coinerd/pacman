import { gameConfig, physicsConfig } from '../config/gameConfig.js';

const origin = { x: 0, y: 0 };

/**
 * @param {number} x - World x coordinate
 * @param {number} y - World y coordinate
 * @returns {{x: number, y: number}} Tile coordinates
 */
export function worldToTile(x, y) {
    const tileX = Math.floor((x - origin.x) / gameConfig.tileSize);
    const tileY = Math.floor((y - origin.y) / gameConfig.tileSize);
    return { x: tileX, y: tileY };
}

/**
 * @param {number} tileX - Tile x coordinate
 * @param {number} tileY - Tile y coordinate
 * @returns {{x: number, y: number}} World coordinates
 */
export function tileToWorld(tileX, tileY) {
    const pixelX = tileX * gameConfig.tileSize + origin.x;
    const pixelY = tileY * gameConfig.tileSize + origin.y;
    return { x: pixelX, y: pixelY };
}

/**
 * @param {number} tileX - Tile x coordinate
 * @param {number} tileY - Tile y coordinate
 * @returns {{x: number, y: number}} World coordinates of tile center
 */
export function tileCenter(tileX, tileY) {
    const worldX = tileX * gameConfig.tileSize + origin.x + gameConfig.tileSize / 2;
    const worldY = tileY * gameConfig.tileSize + origin.y + gameConfig.tileSize / 2;
    return { x: worldX, y: worldY };
}

/**
 * @param {number} x - World x coordinate
 * @param {number} y - World y coordinate
 * @param {number} tileX - Target tile x coordinate
 * @param {number} tileY - Target tile y coordinate
 * @returns {boolean} True if within EPS distance of tile center
 */
export function isAtTileCenter(x, y, tileX, tileY) {
    const center = tileCenter(tileX, tileY);
    const dx = x - center.x;
    const dy = y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= gameConfig.tileSize * 0.1;
}

/**
 * @param {number} x - World x coordinate
 * @param {number} y - World y coordinate
 * @param {number} tileX - Target tile x coordinate
 * @param {number} tileY - Target tile y coordinate
 * @returns {number} Distance to tile center
 */
export function distanceToTileCenter(x, y, tileX, tileY) {
    const center = tileCenter(tileX, tileY);
    const dx = x - center.x;
    const dy = y - center.y;
    return Math.sqrt(dx * dx + dy * dy);
}
