import { gameConfig } from '../config/gameConfig.js';
import { EPS, distanceToTileCenter } from './TileMath.js';
import { shouldSnapToCenter, snapToCenter } from './movement/CenterSnapper.js';
import { buildMovementStep } from './movement/MovementStepBuilder.js';
import { shouldTriggerPortalTraversal, handlePortalTraversal } from './movement/TunnelHandler.js';
import { isInBounds } from './movement/PathValidation.js';
import { tileCenter } from './TileMath.js';

export { EPS, worldToTile, tileCenter, encodeTile, decodeTile, tileToWorld, isAtTileCenter, distanceToTileCenter, isExactlyAtTileCenter } from './TileMath.js';

export function performGridMovementStep(entity, maze, delta) {
    if (!entity) {
        return entity;
    }

    const wasMoving = entity.isMoving;

    const currentTile = { x: entity.gridX, y: entity.gridY };
    const distToCenter = distanceToTileCenter(entity.x, entity.y, currentTile.x, currentTile.y);
    const inBounds = isInBounds(currentTile.x, currentTile.y, maze);

    const rawMoveDist = entity.speed * (delta / 1000);
    const cappedMoveDist = Math.min(rawMoveDist, gameConfig.tileSize * 2 - 1);
    const moveDist = Math.max(0, cappedMoveDist - (cappedMoveDist <= EPS ? 0.01 : 0));
    const center = tileCenter(currentTile.x, currentTile.y);

    let remainingDist = moveDist;

    if (shouldSnapToCenter(entity, center, distToCenter, remainingDist, moveDist, wasMoving, inBounds)) {
        const result = snapToCenter(entity, currentTile, center, distToCenter, remainingDist, moveDist, inBounds, maze);
        remainingDist = result.remainingDist;
    }

    if (entity.direction.x !== 0 || entity.direction.y !== 0) {
        entity.isMoving = true;
    }

    if (!entity.isMoving || (entity.direction.x === 0 && entity.direction.y === 0)) {
        return entity;
    }

    if (remainingDist <= 0) {
        return entity;
    }

    const result = buildMovementStep(entity, maze, remainingDist, center, distToCenter, inBounds, currentTile);
    Object.assign(entity, result.entity);

    if (shouldTriggerPortalTraversal(entity, remainingDist, entity.direction)) {
        handlePortalTraversal(entity);
    }

    return entity;
}
