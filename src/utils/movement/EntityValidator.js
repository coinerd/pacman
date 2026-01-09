import { directions, gameConfig } from '../../config/gameConfig.js';

export function validateEntityState(entity) {
    if (!entity) {
        throw new Error('Entity is null or undefined');
    }

    if (typeof entity.gridX !== 'number' || typeof entity.gridY !== 'number') {
        throw new Error('Entity missing grid coordinates');
    }

    if (typeof entity.x !== 'number' || typeof entity.y !== 'number') {
        throw new Error('Entity missing world coordinates');
    }

    if (entity.direction && typeof entity.direction.x !== 'number' && typeof entity.direction.y !== 'number') {
        throw new Error('Entity has invalid direction');
    }

    return true;
}

export function isMovingInDirection(entity) {
    return entity.direction && (entity.direction.x !== 0 || entity.direction.y !== 0);
}

export function hasBufferedTurn(entity) {
    return entity.nextDirection && (entity.nextDirection.x !== 0 || entity.nextDirection.y !== 0);
}

export function isValidDirection(direction) {
    return direction && (direction === directions.UP ||
                         direction === directions.DOWN ||
                         direction === directions.LEFT ||
                         direction === directions.RIGHT ||
                         direction === directions.NONE);
}

export function isGridConsistent(entity, _tolerance = gameConfig.tileSize * 0.15) {
    if (!entity || typeof entity.gridX !== 'number' || typeof entity.gridY !== 'number') {
        return false;
    }

    const expectedGridX = Math.floor(entity.x / gameConfig.tileSize);
    const expectedGridY = Math.floor(entity.y / gameConfig.tileSize);

    const dx = entity.gridX - expectedGridX;
    const dy = entity.gridY - expectedGridY;

    return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
}

export function isValidGridPosition(gridX, gridY, maze) {
    if (!maze || !maze[0]) {
        return false;
    }

    return gridY >= 0 && gridY < maze.length && gridX >= 0 && gridX < maze[0].length;
}

export function validateGridToWorldConsistency(entity) {
    validateEntityState(entity);

    if (!isGridConsistent(entity)) {
        throw new Error(`Grid coordinate inconsistency: entity.gridX=${entity.gridX}, entity.gridY=${entity.gridY} does not match world coordinates x=${entity.x}, y=${entity.y}`);
    }

    return true;
}

export function isGridCenter(entity, tolerance = 5) {
    if (!entity || typeof entity.gridX !== 'number' || typeof entity.gridY !== 'number') {
        return false;
    }

    const centerX = entity.gridX * gameConfig.tileSize + gameConfig.tileSize / 2;
    const centerY = entity.gridY * gameConfig.tileSize + gameConfig.tileSize / 2;

    const dx = Math.abs(entity.x - centerX);
    const dy = Math.abs(entity.y - centerY);

    return dx <= tolerance && dy <= tolerance;
}

