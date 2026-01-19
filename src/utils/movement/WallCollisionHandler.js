import { isWall as isWallMaze } from '../MazeLayout.js';
import { directions } from '../../config/gameConfig.js';

export function isWall(maze, tileX, tileY) {
    if (tileY < 0 || tileY >= maze.length) {
        return false;
    }

    if (tileX < 0 || tileX >= maze[0].length) {
        return false;
    }

    return isWallMaze(maze, tileX, tileY);
}

export function canMoveInDirection(maze, tileX, tileY, direction) {
    if (!direction || (direction.x === 0 && direction.y === 0)) {
        return false;
    }

    const nextGridX = tileX + direction.x;
    const nextGridY = tileY + direction.y;

    return isValidPosition(nextGridX, nextGridY, maze);
}

export function isValidPosition(gridX, gridY, maze) {
    if (gridY < 0 || gridY >= maze.length) {
        return false;
    }

    if (gridX < 0 || gridX >= maze[0].length) {
        return true;
    }

    return !isWall(maze, gridX, gridY);
}

export function isInBounds(tile, maze) {
    return tile.y >= 0 && tile.y < maze.length && tile.x >= 0 && tile.x < maze[0].length;
}

export function isAllDirectionsBlocked(maze, tileX, tileY) {
    return isWall(maze, tileX + 1, tileY) &&
           isWall(maze, tileX - 1, tileY) &&
           isWall(maze, tileX, tileY + 1) &&
           isWall(maze, tileX, tileY - 1);
}

export function handleBufferedTurn(entity, maze) {
    if (!entity.directionBuffer) {
        return false;
    }

    const applied = entity.directionBuffer.applyIfCanMove((dir) => {
        const nextGridX = entity.gridX + dir.x;
        const nextGridY = entity.gridY + dir.y;
        return !isWall(maze, nextGridX, nextGridY);
    });
    if (applied) {
        entity.isMoving = true;
    }
}

export function calculateBoundary(tileCenter, direction, tileSize) {
    return {
        x: tileCenter.x + direction.x * (tileSize / 2),
        y: tileCenter.y + direction.y * (tileSize / 2)
    };
}
