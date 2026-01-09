import { gameConfig } from '../../config/gameConfig.js';
import { EPS } from '../TileMath.js';
import { isWall as isWallMaze } from '../MazeLayout.js';
import { handleBufferedTurn } from './WallCollisionHandler.js';

export function calculateRemainingDist(distToCenter, remainingDist, moveDist, EPS, entity) {
    const shouldPauseAtCenter = distToCenter <= EPS && moveDist <= EPS && typeof entity.type === 'string';

    if (distToCenter <= EPS && distToCenter > 0 && shouldPauseAtCenter) {
        return 0;
    }

    if (distToCenter > EPS) {
        return Math.max(0, remainingDist - distToCenter);
    }

    return remainingDist;
}

export function isMovingTowardCenter(entity, dxToCenter, dyToCenter) {
    const { direction } = entity;

    return (direction.x !== 0 && (Math.sign(dxToCenter) === direction.x || dxToCenter === 0))
        || (direction.y !== 0 && (Math.sign(dyToCenter) === direction.y || dyToCenter === 0));
}

export function crossesCenter(distToCenter, movingTowardCenter, moveDist, EPS) {
    return movingTowardCenter && (
        (distToCenter === 0 && moveDist > EPS)
        || (distToCenter > 0 && distToCenter <= (moveDist + EPS))
    );
}

export function calculateCenterInfo(entity, center) {
    const dxToCenter = center.x - entity.x;
    const dyToCenter = center.y - entity.y;
    const movingTowardCenter = isMovingTowardCenter(entity, dxToCenter, dyToCenter);
    return { dxToCenter, dyToCenter, movingTowardCenter };
}

export function snapEntityToCenter(entity, center) {
    entity.x = center.x;
    entity.y = center.y;
}

export function updatePreviousGridPosition(entity, currentTile) {
    if (typeof entity.prevGridX !== 'undefined' && typeof entity.prevGridY !== 'undefined') {
        const oldGridX = entity.gridX;
        const oldGridY = entity.gridY;

        if (currentTile.x !== oldGridX || currentTile.y !== oldGridY) {
            entity.prevGridX = oldGridX;
            entity.prevGridY = oldGridY;
        }
    }
}

export function snapToCenter(entity, currentTile, center, distToCenter, remainingDist, moveDist, inBounds, maze) {
    snapEntityToCenter(entity, center);
    updatePreviousGridPosition(entity, currentTile);

    entity.gridX = currentTile.x;
    entity.gridY = currentTile.y;

    const { movingTowardCenter } = calculateCenterInfo(entity, center);
    const crossCenter = crossesCenter(distToCenter, movingTowardCenter, moveDist, EPS);
    const hasBufTurn = entity.nextDirection && (entity.nextDirection.x !== 0 || entity.nextDirection.y !== 0);

    if (crossCenter && !hasBufTurn && inBounds) {
        const nextGridX = currentTile.x + entity.direction.x;
        const nextGridY = currentTile.y + entity.direction.y;
        if (!isWallMaze(maze, nextGridX, nextGridY)) {
            entity.gridX = nextGridX;
            entity.gridY = nextGridY;
        }
    }

    handleBufferedTurn(entity, maze);

    const newRemainingDist = calculateRemainingDist(distToCenter, remainingDist, moveDist, EPS, entity);

    return {
        entity,
        remainingDist: newRemainingDist
    };
}

export function shouldSnapToCenter(entity, center, distToCenter, remainingDist, moveDist, wasMoving, _inBounds) {
    const { movingTowardCenter } = calculateCenterInfo(entity, center);
    const hasBufferedTurn = entity.nextDirection && (entity.nextDirection.x !== 0 || entity.nextDirection.y !== 0);

    const willCrossCenter = movingTowardCenter && distToCenter > 0 && distToCenter <= remainingDist;
    const snapWithBufferedTurn = hasBufferedTurn && (
        (wasMoving && distToCenter <= gameConfig.tileSize * 0.5 && remainingDist >= gameConfig.tileSize * 0.1) ||
        distToCenter <= EPS * 1.5 ||
        (distToCenter < gameConfig.tileSize * 0.35 && remainingDist >= gameConfig.tileSize * 0.1)
    );

    return distToCenter <= EPS || willCrossCenter || snapWithBufferedTurn;
}

export function handleSnapToCenter(entity, maze, currentTile, center, crossCenter, hasBufTurn, inBounds, moveDist, EPS, buildMovementStep, distToCenterFunc, onCenterCross) {
    snapEntityToCenter(entity, center);
    updatePreviousGridPosition(entity, currentTile);

    entity.gridX = currentTile.x;
    entity.gridY = currentTile.y;

    if (crossCenter && !hasBufTurn && inBounds) {
        const nextGridX = currentTile.x + entity.direction.x;
        const nextGridY = currentTile.y + entity.direction.y;
        if (!isWallMaze(maze, nextGridX, nextGridY)) {
            entity.gridX = nextGridX;
            entity.gridY = nextGridY;
        }
    }

    handleBufferedTurn(entity, maze);

    if (onCenterCross) {
        onCenterCross(entity, maze);
    }

    let remainingDist = calculateRemainingDist(0, moveDist, moveDist, EPS, entity);

    if (remainingDist <= 0 || !entity.isMoving || hasBufTurn) {
        return entity;
    }

    const result = buildMovementStep(entity, maze, remainingDist, center, 0, inBounds, { x: entity.gridX, y: entity.gridY });
    return result.entity;
}
