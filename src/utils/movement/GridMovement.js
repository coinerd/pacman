import { gameConfig, directions } from '../../config/gameConfig.js';
import { tileCenter, EPS } from '../TileMath.js';
import { isWall as isWallTile } from '../MazeLayout.js';
import { PORTAL_TILES } from '../WarpTunnel.js';

const MAX_TILES_PER_FRAME = 3;

export function isInBounds(tileX, tileY, maze) {
    return tileY >= 0 && tileY < maze.length &&
        tileX >= 0 && tileX < maze[0].length;
}

export function canMove(maze, tileX, tileY, direction) {
    if (!direction || (direction.x === 0 && direction.y === 0)) {
        return false;
    }

    const nextGridX = tileX + direction.x;
    const nextGridY = tileY + direction.y;

    if (getWarpTarget(tileX, tileY, direction)) {
        return true;
    }

    if (!isInBounds(nextGridX, nextGridY, maze)) {
        return false;
    }

    return !isWallTile(maze, nextGridX, nextGridY);
}

/**
 * Move an entity on the grid using a delta expressed in seconds.
 * @param {Object} entity - Entity with grid position and speed in pixels/second.
 * @param {number[][]} maze - Maze grid.
 * @param {number} deltaSeconds - Elapsed time in seconds.
 * @returns {{entity: Object, events: Array}} Movement result.
 */
export function moveEntityOnGrid(entity, maze, deltaSeconds) {
    const events = [];

    if (!entity) {
        return { entity, events };
    }

    const applyBufferedTurn = (canMoveFn) => {
        if (entity.directionBuffer?.applyIfCanMove) {
            return entity.directionBuffer.applyIfCanMove(canMoveFn);
        }

        const nextDirection = entity.nextDirection ?? directions.NONE;
        if (nextDirection.x !== 0 || nextDirection.y !== 0) {
            if (canMoveFn(nextDirection)) {
                entity.direction = nextDirection;
                entity.nextDirection = directions.NONE;
                return true;
            }
        }
        return false;
    };

    const rawMoveDist = entity.speed * deltaSeconds;
    const cappedMoveDist = Math.min(rawMoveDist, gameConfig.tileSize * 2 - 1);
    let remainingDist = Math.max(0, cappedMoveDist - (cappedMoveDist <= EPS ? 0.01 : 0));

    let steps = 0;
    let movedAwayFromCenter = false;

    while (remainingDist > 0 && steps < MAX_TILES_PER_FRAME) {
        const center = tileCenter(entity.gridX, entity.gridY);
        const distToCenter = Math.hypot(center.x - entity.x, center.y - entity.y);
        const atCenter = distToCenter <= EPS;

        if (atCenter) {
            entity.x = center.x;
            entity.y = center.y;
            const applied = applyBufferedTurn((dir) => canMove(maze, entity.gridX, entity.gridY, dir));
            if (applied) {
                entity.isMoving = true;
            }
        }

        if (entity.direction.x === 0 && entity.direction.y === 0) {
            entity.isMoving = false;
            break;
        }
        entity.isMoving = true;

        if (!atCenter) {
            const movingTowardCenter = entity.direction.x !== 0
                ? Math.sign(center.x - entity.x) === entity.direction.x
                : Math.sign(center.y - entity.y) === entity.direction.y;

            if (!movingTowardCenter) {
                const blockedAhead = !canMove(maze, entity.gridX, entity.gridY, entity.direction);
                if (blockedAhead) {
                    const boundary = {
                        x: center.x + entity.direction.x * (gameConfig.tileSize / 2),
                        y: center.y + entity.direction.y * (gameConfig.tileSize / 2)
                    };
                    const distToBoundary = entity.direction.x !== 0
                        ? Math.abs(boundary.x - entity.x)
                        : Math.abs(boundary.y - entity.y);
                    const travel = Math.min(distToBoundary, remainingDist);
                    entity.x += entity.direction.x * travel;
                    entity.y += entity.direction.y * travel;
                    remainingDist -= travel;
                    if (distToBoundary <= travel + EPS) {
                        entity.x = boundary.x;
                        entity.y = boundary.y;
                        entity.direction = directions.NONE;
                        entity.isMoving = false;
                    }
                } else {
                    entity.x += entity.direction.x * remainingDist;
                    entity.y += entity.direction.y * remainingDist;
                    remainingDist = 0;
                }
                break;
            }

            const distAxis = entity.direction.x !== 0
                ? Math.abs(center.x - entity.x)
                : Math.abs(center.y - entity.y);
            const travel = Math.min(distAxis, remainingDist);
            entity.x += entity.direction.x * travel;
            entity.y += entity.direction.y * travel;
            remainingDist -= travel;

            if (distAxis <= travel + EPS) {
                entity.x = center.x;
                entity.y = center.y;
            } else {
                break;
            }

            steps += 1;
            continue;
        }

        if (!canMove(maze, entity.gridX, entity.gridY, entity.direction)) {
            entity.direction = directions.NONE;
            entity.isMoving = false;
            events.push({ type: 'hit_wall', tileX: entity.gridX, tileY: entity.gridY });
            break;
        }

        if (remainingDist < gameConfig.tileSize) {
            entity.x += entity.direction.x * remainingDist;
            entity.y += entity.direction.y * remainingDist;
            remainingDist = 0;
            movedAwayFromCenter = true;
            break;
        }

        const warpTarget = getWarpTarget(entity.gridX, entity.gridY, entity.direction);
        if (warpTarget) {
            updatePrevGrid(entity);
            entity.gridX = warpTarget.tileX;
            entity.gridY = warpTarget.tileY;
            const warpCenter = tileCenter(warpTarget.tileX, warpTarget.tileY);
            entity.x = warpCenter.x;
            entity.y = warpCenter.y;
            remainingDist -= gameConfig.tileSize;
            events.push({ type: 'warp', tileX: entity.gridX, tileY: entity.gridY });
            events.push({ type: 'tile_enter', tileX: entity.gridX, tileY: entity.gridY });
            steps += 1;
            continue;
        }

        const nextGridX = entity.gridX + entity.direction.x;
        const nextGridY = entity.gridY + entity.direction.y;
        updatePrevGrid(entity);
        entity.gridX = nextGridX;
        entity.gridY = nextGridY;
        const nextCenter = tileCenter(nextGridX, nextGridY);
        entity.x = nextCenter.x;
        entity.y = nextCenter.y;
        remainingDist -= gameConfig.tileSize;
        events.push({ type: 'tile_enter', tileX: nextGridX, tileY: nextGridY });
        steps += 1;
    }

    const finalCenter = tileCenter(entity.gridX, entity.gridY);
    const finalDist = Math.hypot(finalCenter.x - entity.x, finalCenter.y - entity.y);
    if (!movedAwayFromCenter && finalDist <= EPS) {
        entity.x = finalCenter.x;
        entity.y = finalCenter.y;
    }

    return { entity, events };
}

function updatePrevGrid(entity) {
    if (typeof entity.prevGridX === 'undefined' || typeof entity.prevGridY === 'undefined') {
        return;
    }

    entity.prevGridX = entity.gridX;
    entity.prevGridY = entity.gridY;
}

function getWarpTarget(tileX, tileY, direction) {
    if (tileY !== gameConfig.tunnelRow || direction.y !== 0) {
        return null;
    }

    if (direction.x < 0 && tileX === PORTAL_TILES.leftPortal.tileX) {
        return PORTAL_TILES.rightPortal;
    }

    if (direction.x > 0 && tileX === PORTAL_TILES.rightPortal.tileX) {
        return PORTAL_TILES.leftPortal;
    }

    return null;
}
