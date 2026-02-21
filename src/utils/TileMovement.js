/**
 * @deprecated This file is deprecated. Use TileCenterMovementStrategy instead.
 * Tile-center based movement is now the only supported movement system.
 */

export { EPS, worldToTile, tileCenter, encodeTile, decodeTile, tileToWorld, isAtTileCenter, distanceToTileCenter, isExactlyAtTileCenter } from './TileMath.js';

/**
 * @deprecated Use TileCenterMovementStrategy instead
 */
export function performGridMovementStep(entity, maze, deltaSeconds) {
    console.warn('[DEPRECATED] performGridMovementStep is deprecated. Use TileCenterMovementStrategy instead.');
    return entity;
}
