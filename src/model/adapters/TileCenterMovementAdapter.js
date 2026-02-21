/**
 * TileCenterMovementAdapter
 * Simple adapter that uses TileCenterMovementStrategy directly.
 * Bypasses complex MovementEngine architecture for cleaner implementation.
 */

import { directions, gameConfig } from '../../config/gameConfig.js';
import { isWalkableTile } from '../../utils/MazeLayout.js';
import { TileCenterMovementStrategy } from '../../movement/strategies/TileCenterMovementStrategy.js';

export class TileCenterMovementAdapter {
    constructor(maze) {
        this.maze = maze;
        // mazeQuery alias for compatibility with tests and other code
        this.mazeQuery = maze;
        this.strategy = new TileCenterMovementStrategy(maze);
        this.stats = {
            movesProcessed: 0,
            movesAttempted: 0
        };
    }

    /**
     * Update Pacman movement with direction buffer integration
     * @param {ModelEntity} pacman - Pacman entity
     * @param {number} deltaSeconds - Time delta
     * @param {Object} inputDirection - Input direction from player
     * @returns {Array<Object>} - Movement events
     */
    updatePacman(pacman, deltaSeconds, inputDirection = null) {
        // Queue input direction in buffer if provided
        if (inputDirection && inputDirection !== directions.NONE) {
            pacman.nextDirection = inputDirection;
        }

        this.stats.movesAttempted++;

        // If entity is not moving, try to start movement in buffered direction
        if (pacman.moveProgress === 0) {
            const targetDirection = pacman.nextDirection || pacman.direction;

            if (targetDirection && targetDirection !== directions.NONE) {
                const targetGridX = pacman.gridX + targetDirection.x;
                const targetGridY = pacman.gridY + targetDirection.y;

                if (this.strategy.startMovement(pacman, targetDirection)) {
                    return [{
                        type: 'movement_started',
                        entityId: pacman.id,
                        direction: targetDirection,
                        fromGrid: { x: pacman.gridX, y: pacman.gridY },
                        toGrid: { x: targetGridX, y: targetGridY }
                    }];
                }
            }
        }

        // Entity is moving, update progress
        const completed = this.strategy.updateProgress(pacman, deltaSeconds);

        if (completed) {
            return [{
                type: 'movement_completed',
                entityId: pacman.id,
                gridX: pacman.gridX,
                gridY: pacman.gridY
            }];
        }

        return [];
    }

    /**
     * Update ghost movement
     * @param {ModelEntity} ghost - Ghost entity
     * @param {number} deltaSeconds - Time delta
     * @returns {Array<Object>} - Movement events
     */
    updateGhost(ghost, deltaSeconds) {
        const direction = ghost.nextDirection && ghost.nextDirection !== directions.NONE
            ? ghost.nextDirection
            : ghost.direction;

        this.stats.movesAttempted++;

        // If entity is not moving, try to start movement in direction
        if (ghost.moveProgress === 0 && direction && direction !== directions.NONE) {
            if (this.strategy.startMovement(ghost, direction)) {
                return [{
                    type: 'movement_started',
                    entityId: ghost.id,
                    direction: direction,
                    fromGrid: { x: ghost.gridX, y: ghost.gridY },
                    toGrid: { x: ghost.targetGridX, y: ghost.targetGridY }
                }];
            }
        }

        // Entity is moving, update progress
        const completed = this.strategy.updateProgress(ghost, deltaSeconds);

        if (completed) {
            return [{
                type: 'movement_completed',
                entityId: ghost.id,
                gridX: ghost.gridX,
                gridY: ghost.gridY
            }];
        }

        return [];
    }

    /**
     * Update entity movement (generic)
     * @param {ModelEntity} entity - Entity to move
     * @param {number} deltaSeconds - Time delta
     * @param {Object} inputDirection - Optional input direction
     * @returns {Array<Object>} - Movement events
     */
    updateEntity(entity, deltaSeconds, inputDirection = null) {
        if (entity.type === 'pacman') {
            return this.updatePacman(entity, deltaSeconds, inputDirection);
        } else if (entity.type === 'ghost') {
            return this.updateGhost(entity, deltaSeconds);
        }

        return [];
    }

    /**
     * Update maze data (called when level changes)
     * @param {Array<Array<number>>} maze - New maze data
     */
    updateMaze(maze) {
        this.maze = maze;
        this.strategy = new TileCenterMovementStrategy(maze);
    }

    /**
     * Get adapter statistics
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            strategyStats: this.strategy.getStats ? this.strategy.getStats() : {}
        };
    }

    /**
     * Reset adapter state
     */
    reset() {
        this.stats = {
            movesProcessed: 0,
            movesAttempted: 0
        };
    }
}

export default TileCenterMovementAdapter;
