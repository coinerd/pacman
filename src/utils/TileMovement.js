import { moveEntityOnGrid } from './movement/GridMovement.js';

export { EPS, worldToTile, tileCenter, encodeTile, decodeTile, tileToWorld, isAtTileCenter, distanceToTileCenter, isExactlyAtTileCenter } from './TileMath.js';

/**
 * Executes a grid movement step using a delta expressed in seconds.
 * @param {Object} entity - Entity to move.
 * @param {number[][]} maze - Maze grid.
 * @param {number} deltaSeconds - Elapsed time in seconds.
 * @returns {Object} Updated entity.
 */
export function performGridMovementStep(entity, maze, deltaSeconds) {
    const result = moveEntityOnGrid(entity, maze, deltaSeconds);
    return result.entity;
}
