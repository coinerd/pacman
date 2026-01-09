import { directions, physicsConfig, gameConfig } from '../../config/gameConfig.js';
import { isWall, isAllDirectionsBlocked, calculateBoundary } from './WallCollisionHandler.js';
import { tileCenter } from '../TileMath.js';

export function buildMovementStep(entity, maze, moveDist, center, distToCenter, inBounds, currentTile) {
    if (!entity.isMoving || (entity.direction.x === 0 && entity.direction.y === 0)) {
        return { entity, remainingDist: 0 };
    }

    if (moveDist <= 0) {
        return { entity, remainingDist: 0 };
    }

    let remainingDist = moveDist;
    const nextTile = { x: currentTile.x + entity.direction.x, y: currentTile.y + entity.direction.y };
    const nextGridX = entity.gridX + entity.direction.x;
    const nextGridY = entity.gridY + entity.direction.y;
    const nextIsWall = inBounds ? isWall(maze, nextGridX, nextGridY) : false;
    const boundary = calculateBoundary(center, entity.direction, gameConfig.tileSize);

    if (nextIsWall) {
        return handleWallCollision(entity, maze, currentTile, center, boundary, distToCenter, remainingDist, inBounds);
    }

    return handleOpenPath(entity, maze, nextTile, center, remainingDist);
}

function handleWallCollision(entity, maze, currentTile, center, boundary, distToCenter, remainingDist, inBounds) {
    const { gridX, gridY } = entity;
    const { EPS } = physicsConfig;
    const allBlocked = inBounds && isAllDirectionsBlocked(maze, gridX, gridY);

    if (allBlocked && distToCenter <= EPS) {
        entity.x = center.x;
        entity.y = center.y;
        entity.direction = directions.NONE;
        entity.isMoving = false;
        return { entity, remainingDist: 0 };
    }

    const distToBoundary = entity.direction.x !== 0
        ? Math.abs(boundary.x - entity.x)
        : Math.abs(boundary.y - entity.y);

    if (remainingDist >= distToBoundary) {
        entity.x = boundary.x;
        entity.y = boundary.y;
        entity.direction = directions.NONE;
        entity.isMoving = false;
        return { entity, remainingDist: 0 };
    }

    entity.x += entity.direction.x * remainingDist;
    entity.y += entity.direction.y * remainingDist;
    return { entity, remainingDist: 0 };
}

function handleOpenPath(entity, maze, nextTile, currentCenter, remainingDist) {
    const nextCenter = tileCenter(nextTile.x, nextTile.y);
    const distToNextCenter = calculateDistanceToCenter(entity.x, entity.y, nextCenter.x, nextCenter.y);

    if (remainingDist > distToNextCenter) {
        remainingDist -= distToNextCenter;
        entity.x = nextCenter.x;
        entity.y = nextCenter.y;
        entity.gridX = nextTile.x;
        entity.gridY = nextTile.y;

        const nextGridX2 = entity.gridX + entity.direction.x;
        const nextGridY2 = entity.gridY + entity.direction.y;

        if (isWall(maze, nextGridX2, nextGridY2)) {
            entity.direction = directions.NONE;
            entity.isMoving = false;
            return { entity, remainingDist: 0 };
        }

        entity.x += entity.direction.x * remainingDist;
        entity.y += entity.direction.y * remainingDist;
    } else {
        entity.x += entity.direction.x * remainingDist;
        entity.y += entity.direction.y * remainingDist;
    }

    return { entity, remainingDist: 0 };
}

function calculateDistanceToCenter(x, y, centerX, centerY) {
    const dx = x - centerX;
    const dy = y - centerY;
    return Math.sqrt(dx * dx + dy * dy);
}
