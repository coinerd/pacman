/**
 * TileCenterMovementStrategy
 * New tile-based movement strategy that moves entities from one tile center to another.
 * Uses progress tracking (0.0 to 1.0) for smooth visual interpolation.
 */

import { isWalkableTile } from '../../utils/MazeLayout.js';
import { gameConfig } from '../../config/gameConfig.js';

export class TileCenterMovementStrategy {
    constructor(maze) {
        this.maze = maze;
    }

    /**
     * Check if entity can move to target tile
     * @param {number} gridX - Current grid X
     * @param {number} gridY - Current grid Y
     * @param {number} targetGridX - Target grid X
     * @param {number} targetGridY - Target grid Y
     * @returns {boolean}
     */
    canMoveTo(gridX, gridY, targetGridX, targetGridY) {
        if (!this.maze) {
            return false;
        }

        // Check if target tile is walkable
        return isWalkableTile(this.maze, targetGridX, targetGridY);
    }

    /**
     * Start movement to target tile
     * @param {ModelEntity} entity - Entity to move
     * @param {Object} direction - Movement direction
     * @returns {boolean} - True if movement started
     */
    startMovement(entity, direction) {
        if (!entity || entity.moveProgress > 0) {
            return false; // Already moving
        }

        const tileSize = gameConfig.tileSize;

        // CRITICAL: Ensure entity is at exact tile center before starting movement
        entity.x = entity.gridX * tileSize + tileSize / 2;
        entity.y = entity.gridY * tileSize + tileSize / 2;

        const targetGridX = entity.gridX + direction.x;
        const targetGridY = entity.gridY + direction.y;

        if (!this.canMoveTo(entity.gridX, entity.gridY, targetGridX, targetGridY)) {
            return false; // Can't move there
        }

        // Start movement
        entity.prevGridX = entity.gridX;
        entity.prevGridY = entity.gridY;
        entity.targetGridX = targetGridX;
        entity.targetGridY = targetGridY;
        entity.direction = direction;
        entity.moveProgress = 0.001; // Start moving
        entity.isMoving = true;

        return true;
    }

    /**
     * Update movement progress
     * @param {ModelEntity} entity - Entity to update
     * @param {number} deltaTime - Time since last frame in seconds
     * @returns {boolean} - True if movement completed
     */
    updateProgress(entity, deltaTime) {
        if (entity.moveProgress > 0) {
            const tileSize = gameConfig.tileSize;
            const tilesPerSecond = entity.speed / tileSize;
            entity.moveProgress += tilesPerSecond * deltaTime;

            if (entity.moveProgress >= 1.0) {
                // Arrived at target tile
                entity.gridX = entity.targetGridX;
                entity.gridY = entity.targetGridY;

                // Update pixel position from new grid position
                const mazeWidth = gameConfig.mazeWidth * gameConfig.tileSize;
                if (entity.x >= mazeWidth - 1) {
                    entity.x = 0;
                    entity.gridX = 0;
                } else {
                    entity.x = entity.gridX * tileSize + tileSize / 2;
                }
                entity.y = entity.gridY * tileSize + tileSize / 2;

                entity.moveProgress = 0;
                entity.isMoving = false;

                return true; // Movement completed
            } else {
                // Update x/y during movement for accurate collision detection
                const prevCenterX = entity.prevGridX * tileSize + tileSize / 2;
                const prevCenterY = entity.prevGridY * tileSize + tileSize / 2;
                const nextCenterX = entity.targetGridX * tileSize + tileSize / 2;
                const nextCenterY = entity.targetGridY * tileSize + tileSize / 2;

                entity.x = prevCenterX + (nextCenterX - prevCenterX) * entity.moveProgress;
                entity.y = prevCenterY + (nextCenterY - prevCenterY) * entity.moveProgress;
                
                // Safety: Ensure orthogonal axis stays exactly centered during movement
                // This handles any potential floating point drift
                if (entity.direction.x !== 0) {
                    // Horizontal movement - Y should not change
                    entity.y = prevCenterY;
                } else if (entity.direction.y !== 0) {
                    // Vertical movement - X should not change
                    entity.x = prevCenterX;
                }
            }
        }
        return false; // Still moving
    }

    /**
     * Update entity pixel position from grid position
     * (For entities that are not moving)
     * @param {ModelEntity} entity - Entity to update
     */
    updatePixelFromGrid(entity) {
        const tileSize = gameConfig.tileSize;
        entity.x = entity.gridX * tileSize + tileSize / 2;
        entity.y = entity.gridY * tileSize + tileSize / 2;
    }

    /**
     * Get interpolation data for visual rendering
     * @param {ModelEntity} entity - Entity to get interpolation data for
     * @returns {Object|null} - Interpolation data or null
     */
    getInterpolationData(entity) {
        if (entity.moveProgress <= 0) {
            return null; // Not moving, no interpolation needed
        }

        const tileSize = gameConfig.tileSize;

        // Calculate previous and next tile centers
        const prevCenterX = entity.prevGridX * tileSize + tileSize / 2;
        const prevCenterY = entity.prevGridY * tileSize + tileSize / 2;
        const nextCenterX = entity.targetGridX * tileSize + tileSize / 2;
        const nextCenterY = entity.targetGridY * tileSize + tileSize / 2;

        return {
            prevCenterX,
            prevCenterY,
            nextCenterX,
            nextCenterY,
            progress: entity.moveProgress
        };
    }

    /**
     * Stop current movement immediately
     * @param {ModelEntity} entity - Entity to stop
     */
    stopMovement(entity) {
        entity.moveProgress = 0;
        entity.isMoving = false;
        entity.targetGridX = entity.gridX;
        entity.targetGridY = entity.gridY;
    }
}

export default TileCenterMovementStrategy;
