/**
 * Grid Movement Strategy
 * Pure grid-based movement with no external dependencies
 *
 * This strategy implements grid-aligned movement where entities:
 - Move along grid lines
 - Can only change direction at tile centers
 - Snap to tile centers within epsilon tolerance
 - Handle warp tunnels/portals
 */

import { MovementInterface, MOVEMENT_RESULTS, MOVEMENT_EVENTS } from '../MovementInterface.js';

/**
 * Grid-based movement strategy
 */
export class GridMovementStrategy extends MovementInterface {
    /**
     * @param {Object} config - Configuration
     * @param {number} [config.tileSize=20] - Tile size in pixels
     * @param {number} [config.maxTilesPerFrame=3] - Maximum tiles to move per frame
     * @param {number} [config.eps=3] - Epsilon for center snapping
     */
    constructor(config = {}) {
        super();
        this.tileSize = config.tileSize || 20;
        this.maxTilesPerFrame = config.maxTilesPerFrame || 3;
        this.eps = config.eps || 3;
    }

    /**
     * Move an entity on the grid
     * @param {Object} entity - Entity state
     * @param {Object} context - Movement context
     * @param {import('../MazeQueryInterface.js').MazeQueryInterface} context.mazeQuery - Maze query
     * @param {Object} [context.inputDirection] - Optional input direction
     * @param {number} deltaSeconds - Time delta
     * @returns {import('../MovementInterface.js').MovementResult} Movement result
     */
    move(entity, context, deltaSeconds) {
        const { mazeQuery, inputDirection } = context;
        const events = [];

        // Handle no movement case
        if (deltaSeconds <= 0 || entity.speed <= 0) {
            return this.createResult(MOVEMENT_RESULTS.NONE, entity, 0, events);
        }

        // Calculate move distance
        const rawMoveDist = this.calculateMoveDistance(entity.speed, deltaSeconds);
        const maxMoveDist = this.tileSize * this.maxTilesPerFrame - 1;
        const remainingDist = Math.min(rawMoveDist, maxMoveDist);

        if (remainingDist <= 0) {
            return this.createResult(MOVEMENT_RESULTS.NONE, entity, 0, events);
        }

        // Try to apply input direction if at center
        let currentDirection = entity.direction;
        let didTurn = false;

        if (inputDirection && (inputDirection.x !== 0 || inputDirection.y !== 0)) {
            const turnResult = this.tryTurn(entity, mazeQuery, inputDirection);
            if (turnResult.turned) {
                currentDirection = turnResult.newDirection;
                didTurn = true;
                events.push({
                    type: MOVEMENT_EVENTS.CENTER_REACHED,
                    tileX: entity.gridX,
                    tileY: entity.gridY
                });
            }
        }

        // Check if we have a valid direction
        if (!currentDirection || (currentDirection.x === 0 && currentDirection.y === 0)) {
            return this.createResult(MOVEMENT_RESULTS.STOPPED, entity, 0, events);
        }

        // Check if we can move in current direction
        if (!this.canMove(entity, context, currentDirection)) {
            return this.createResult(MOVEMENT_RESULTS.BLOCKED, entity, 0, events);
        }

        // Perform movement
        const moveResult = this.performMovement(
            entity,
            mazeQuery,
            currentDirection,
            remainingDist
        );

        // Add movement events
        events.push(...moveResult.events);

        // Determine result type
        let resultType = MOVEMENT_RESULTS.MOVED;
        if (moveResult.warped) {
            resultType = MOVEMENT_RESULTS.WARPED;
        } else if (didTurn) {
            resultType = MOVEMENT_RESULTS.TURNED;
        }

        return this.createResult(
            resultType,
            {
                ...entity,
                x: moveResult.x,
                y: moveResult.y,
                gridX: moveResult.gridX,
                gridY: moveResult.gridY,
                direction: currentDirection
            },
            moveResult.distanceMoved,
            events
        );
    }

    /**
     * Check if entity can move in direction
     * @param {Object} entity - Entity state
     * @param {Object} context - Movement context
     * @param {Object} direction - Direction to check
     * @returns {boolean}
     */
    canMove(entity, context, direction) {
        const { mazeQuery } = context;

        if (!direction || (direction.x === 0 && direction.y === 0)) {
            return false;
        }

        const nextGridX = entity.gridX + direction.x;
        const nextGridY = entity.gridY + direction.y;

        // Check for warp first
        if (mazeQuery.getWarpTarget(entity.gridX, entity.gridY, direction)) {
            return true;
        }

        // Check bounds and walkability
        if (!mazeQuery.isInBounds(nextGridX, nextGridY)) {
            return false;
        }

        return mazeQuery.isWalkable(nextGridX, nextGridY);
    }

    /**
     * Try to turn in a new direction
     * @private
     * @param {Object} entity - Entity state
     * @param {import('../MazeQueryInterface.js').MazeQueryInterface} mazeQuery - Maze query
     * @param {Object} newDirection - Desired direction
     * @returns {Object} Turn result
     */
    tryTurn(entity, mazeQuery, newDirection) {
        // Check if we're at tile center
        const center = mazeQuery.getTileCenter(entity.gridX, entity.gridY);
        const distToCenter = Math.hypot(center.x - entity.x, center.y - entity.y);

        if (distToCenter > this.eps) {
            return { turned: false };
        }

        // Check if we can move in the new direction
        const canTurn = this.canMoveInDirection(entity, mazeQuery, newDirection);
        if (!canTurn) {
            return { turned: false };
        }

        return {
            turned: true,
            newDirection
        };
    }

    /**
     * Perform actual movement calculation
     * @private
     * @param {Object} entity - Entity state
     * @param {import('../MazeQueryInterface.js').MazeQueryInterface} mazeQuery - Maze query
     * @param {Object} direction - Movement direction
     * @param {number} remainingDist - Distance to move
     * @returns {Object} Movement calculation result
     */
    performMovement(entity, mazeQuery, direction, remainingDist) {
        const events = [];
        let x = entity.x;
        let y = entity.y;
        let gridX = entity.gridX;
        let gridY = entity.gridY;
        let totalDistanceMoved = 0;
        let warped = false;
        let steps = 0;

        while (remainingDist > 0 && steps < this.maxTilesPerFrame) {
            const center = mazeQuery.getTileCenter(gridX, gridY);
            const distToCenter = Math.hypot(center.x - x, center.y - y);
            const atCenter = distToCenter <= this.eps;

            // Check if moving toward or away from center
            const movingTowardCenter = direction.x !== 0
                ? Math.sign(center.x - x) === direction.x
                : Math.sign(center.y - y) === direction.y;

            // At center with valid direction - check for warp or continue
            if (atCenter) {
                // Check for warp
                const warpTarget = mazeQuery.getWarpTarget(gridX, gridY, direction);
                if (warpTarget) {
                    const fromTile = { tileX: gridX, tileY: gridY };
                    gridX = warpTarget.tileX;
                    gridY = warpTarget.tileY;
                    const warpCenter = mazeQuery.getTileCenter(gridX, gridY);
                    x = warpCenter.x;
                    y = warpCenter.y;
                    remainingDist -= this.tileSize;
                    warped = true;
                    events.push({
                        type: MOVEMENT_EVENTS.WARP,
                        from: fromTile,
                        to: { tileX: gridX, tileY: gridY }
                    });
                    steps++;
                    continue;
                }

                // Check if we can continue in current direction
                const nextGridX = gridX + direction.x;
                const nextGridY = gridY + direction.y;

                if (!mazeQuery.isInBounds(nextGridX, nextGridY) ||
                    !mazeQuery.isWalkable(nextGridX, nextGridY)) {
                    // Blocked - snap to center and stop
                    x = center.x;
                    y = center.y;
                    events.push({
                        type: MOVEMENT_EVENTS.WALL_HIT,
                        tileX: nextGridX,
                        tileY: nextGridY
                    });
                    break;
                }
            }

            // Calculate distance to next center or boundary
            let targetDist;
            if (movingTowardCenter) {
                targetDist = Math.hypot(center.x - x, center.y - y);
            } else {
                // Moving away from center - next center is one tile ahead
                const nextCenter = mazeQuery.getTileCenter(
                    gridX + direction.x,
                    gridY + direction.y
                );
                targetDist = Math.hypot(nextCenter.x - x, nextCenter.y - y);
            }

            // Move
            const moveDist = Math.min(targetDist, remainingDist);
            x += direction.x * moveDist;
            y += direction.y * moveDist;
            remainingDist -= moveDist;
            totalDistanceMoved += moveDist;

            // Check if we reached center
            const newDistToCenter = Math.hypot(center.x - x, center.y - y);
            if (newDistToCenter <= this.eps && movingTowardCenter) {
                x = center.x;
                y = center.y;
                events.push({
                    type: MOVEMENT_EVENTS.CENTER_REACHED,
                    tileX: gridX,
                    tileY: gridY
                });
            }

            // Update grid position if we crossed to next tile
            const newGridPos = mazeQuery.worldToTile(x, y);
            if (newGridPos.tileX !== gridX || newGridPos.tileY !== gridY) {
                gridX = newGridPos.tileX;
                gridY = newGridPos.tileY;
                events.push({
                    type: MOVEMENT_EVENTS.TILE_ENTER,
                    tileX: gridX,
                    tileY: gridY
                });
            }

            steps++;

            // Stop if we didn't move (stuck)
            if (moveDist < 0.001) {
                break;
            }
        }

        return {
            x,
            y,
            gridX,
            gridY,
            distanceMoved: totalDistanceMoved,
            warped,
            events
        };
    }

    /**
     * Check if can move in specific direction
     * @private
     * @param {Object} entity - Entity state
     * @param {import('../MazeQueryInterface.js').MazeQueryInterface} mazeQuery - Maze query
     * @param {Object} direction - Direction to check
     * @returns {boolean}
     */
    canMoveInDirection(entity, mazeQuery, direction) {
        if (!direction || (direction.x === 0 && direction.y === 0)) {
            return false;
        }

        const nextGridX = entity.gridX + direction.x;
        const nextGridY = entity.gridY + direction.y;

        // Check for warp
        if (mazeQuery.getWarpTarget(entity.gridX, entity.gridY, direction)) {
            return true;
        }

        // Check bounds
        if (!mazeQuery.isInBounds(nextGridX, nextGridY)) {
            return false;
        }

        return mazeQuery.isWalkable(nextGridX, nextGridY);
    }

    /**
     * Create movement result object
     * @private
     * @param {string} result - Result type
     * @param {Object} entity - Entity state
     * @param {number} distanceMoved - Distance moved
     * @param {Array<Object>} events - Movement events
     * @returns {import('../MovementInterface.js').MovementResult}
     */
    createResult(result, entity, distanceMoved, events) {
        const isMoving = result === MOVEMENT_RESULTS.MOVED ||
                        result === MOVEMENT_RESULTS.TURNED ||
                        result === MOVEMENT_RESULTS.WARPED;

        return {
            result,
            newPosition: { x: entity.x, y: entity.y },
            newGridPosition: { gridX: entity.gridX, gridY: entity.gridY },
            newDirection: entity.direction,
            isMoving,
            events,
            distanceMoved
        };
    }
}
