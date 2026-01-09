import { isWall } from './WallCollisionHandler.js';

export function validatePath(entity, maze) {
    const { gridX, gridY, direction, nextDirection } = entity;

    if (!direction || (direction.x === 0 && direction.y === 0)) {
        return { canMove: false, canTurn: false };
    }

    const nextGridX = gridX + direction.x;
    const nextGridY = gridY + direction.y;

    const inBounds = gridY >= 0 && gridY < maze.length &&
                     gridX >= 0 && gridX < maze[0].length;

    const canMove = inBounds ? !isWall(maze, nextGridX, nextGridY) : true;

    let canTurn = false;
    if (nextDirection && (nextDirection.x !== 0 || nextDirection.y !== 0)) {
        const turnGridX = gridX + nextDirection.x;
        const turnGridY = gridY + nextDirection.y;
        canTurn = inBounds ? !isWall(maze, turnGridX, turnGridY) : true;
    }

    return { canMove, canTurn, inBounds };
}

export function isInBounds(tileX, tileY, maze) {
    return tileY >= 0 && tileY < maze.length &&
           tileX >= 0 && tileX < maze[0].length;
}
