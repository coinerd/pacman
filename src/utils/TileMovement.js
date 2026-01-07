import { gameConfig, physicsConfig } from '../config/gameConfig.js';
import { isWall as isWallMaze } from './MazeLayout.js';

const origin = { x: 0, y: 0 };

export const EPS = gameConfig.tileSize * 0.1;

export function worldToTile(a, b, c) {
    if (typeof a === 'object' && a !== null && 'x' in a && 'y' in a) {
        const worldPos = a;
        const origin = b;
        const tileSize = c;
        const tileX = Math.floor((worldPos.x - origin.x) / tileSize);
        const tileY = Math.floor((worldPos.y - origin.y) / tileSize);
        return { tileX, tileY };
    }
    const x = a;
    const y = b;
    const tileX = Math.floor((x - origin.x) / gameConfig.tileSize);
    const tileY = Math.floor((y - origin.y) / gameConfig.tileSize);
    return { x: tileX, y: tileY };
}

export function tileCenter(tileX, tileY, customOrigin, tileSize) {
    if (typeof customOrigin === 'object' && customOrigin !== null && typeof tileSize === 'number') {
        const x = customOrigin.x + tileX * tileSize + tileSize / 2;
        const y = customOrigin.y + tileY * tileSize + tileSize / 2;
        return { x, y };
    }
    const worldX = tileX * gameConfig.tileSize + gameConfig.tileSize / 2;
    const worldY = tileY * gameConfig.tileSize + gameConfig.tileSize / 2;
    return { x: worldX, y: worldY };
}

export function encodeTile(tileX, tileY, mazeWidth) {
    return tileY * mazeWidth + tileX;
}

export function decodeTile(encodedIndex, mazeWidth) {
    const tileX = encodedIndex % mazeWidth;
    const tileY = Math.floor(encodedIndex / mazeWidth);
    return { tileX, tileY };
}

export function tileToWorld(tileX, tileY) {
    const pixelX = tileX * gameConfig.tileSize + origin.x;
    const pixelY = tileY * gameConfig.tileSize + origin.y;
    return { x: pixelX, y: pixelY };
}

export function isAtTileCenter(x, y, tileX, tileY) {
    const center = tileCenter(tileX, tileY);
    const dx = x - center.x;
    const dy = y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= gameConfig.tileSize * 0.1;
}

export function distanceToTileCenter(x, y, tileX, tileY) {
    const center = tileCenter(tileX, tileY);
    const dx = x - center.x;
    const dy = y - center.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if entity is exactly at tile center (within 1 pixel tolerance)
 * @param {number} x - World x coordinate
 * @param {number} y - World y coordinate
 * @param {number} tileX - Target tile x coordinate
 * @param {number} tileY - Target tile y coordinate
 * @returns {boolean} True if at exact tile center
 */
export function isExactlyAtTileCenter(x, y, tileX, tileY) {
    const center = tileCenter(tileX, tileY);
    const dx = x - center.x;
    const dy = y - center.y;
    return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
}

export function performGridMovementStep(entity, maze, delta) {
    if (!entity || (entity.direction.x === 0 && entity.direction.y === 0)) {
        return entity;
    }

    const currentTile = worldToTile(entity.x, entity.y);
    const distToCenter = distanceToTileCenter(entity.x, entity.y, currentTile.x, currentTile.y);

    const moveDist = entity.speed * delta;

    if (distToCenter <= EPS) {
        const center = tileCenter(currentTile.x, currentTile.y);
        entity.x = center.x;
        entity.y = center.y;

        if (typeof entity.prevGridX !== 'undefined' && typeof entity.prevGridY !== 'undefined') {
            const oldGridX = entity.gridX;
            const oldGridY = entity.gridY;

            if (currentTile.x !== oldGridX || currentTile.y !== oldGridY) {
                entity.prevGridX = oldGridX;
                entity.prevGridY = oldGridY;
            }
        }

        entity.gridX = currentTile.x;
        entity.gridY = currentTile.y;

        if (entity.nextDirection && (entity.nextDirection.x !== 0 || entity.nextDirection.y !== 0)) {
            const nextGridX = entity.gridX + entity.nextDirection.x;
            const nextGridY = entity.gridY + entity.nextDirection.y;
            if (!isWallMaze(maze, nextGridX, nextGridY)) {
                entity.direction = entity.nextDirection;
                entity.nextDirection = { x: 0, y: 0, angle: 0 };
                entity.isMoving = true;
            }
        }

        const nextGridX = entity.gridX + entity.direction.x;
        const nextGridY = entity.gridY + entity.direction.y;

        if (isWallMaze(maze, nextGridX, nextGridY)) {
            entity.direction = { x: 0, y: 0, angle: 0 };
            entity.isMoving = false;
            return entity;
        }
    }

    if (entity.isMoving && (entity.direction.x !== 0 || entity.direction.y !== 0)) {
        const nextTile = { x: currentTile.x + entity.direction.x, y: currentTile.y + entity.direction.y };
        const nextCenter = tileCenter(nextTile.x, nextTile.y);
        const distToNextCenter = distanceToTileCenter(entity.x, entity.y, nextTile.x, nextTile.y);

        if (moveDist > distToNextCenter) {
            const nextGridX = entity.gridX + entity.direction.x;
            const nextGridY = entity.gridY + entity.direction.y;

            if (isWallMaze(maze, nextGridX, nextGridY)) {
                entity.x = tileCenter(entity.gridX, entity.gridY).x;
                entity.y = tileCenter(entity.gridX, entity.gridY).y;
                entity.direction = { x: 0, y: 0, angle: 0 };
                entity.isMoving = false;
                return entity;
            }

            const remainingDist = moveDist - distToNextCenter;
            entity.x = nextCenter.x;
            entity.y = nextCenter.y;
            entity.gridX = nextTile.x;
            entity.gridY = nextTile.y;

            const nextGridX2 = entity.gridX + entity.direction.x;
            const nextGridY2 = entity.gridY + entity.direction.y;

            if (isWallMaze(maze, nextGridX2, nextGridY2)) {
                entity.direction = { x: 0, y: 0, angle: 0 };
                entity.isMoving = false;
                return entity;
            }

            entity.x += entity.direction.x * remainingDist;
            entity.y += entity.direction.y * remainingDist;
        } else {
            entity.x += entity.direction.x * moveDist;
            entity.y += entity.direction.y * moveDist;
        }
    }

    return entity;
}
