import { moveEntityOnGrid } from './movement/GridMovement.js';

export { EPS, worldToTile, tileCenter, encodeTile, decodeTile, tileToWorld, isAtTileCenter, distanceToTileCenter, isExactlyAtTileCenter } from './TileMath.js';

export function performGridMovementStep(entity, maze, deltaSeconds) {
    const result = moveEntityOnGrid(entity, maze, deltaSeconds);
    return result.entity;
}
