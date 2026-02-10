/**
 * MovementAdapter
 * Bridges the decoupled MovementEngine with the existing GameModel/PacmanState.
 * Maintains backward compatibility while allowing gradual migration.
 */

import { MovementEngine } from '../../movement/MovementEngine.js';
import { GridMovementStrategy } from '../../movement/strategies/GridMovementStrategy.js';
import { MazeQueryAdapter } from '../../movement/adapters/MazeQueryAdapter.js';
import { MOVEMENT_RESULTS } from '../../movement/MovementInterface.js';
import { gameConfig } from '../../config/gameConfig.js';

/**
 * Adapter that wraps the decoupled MovementEngine for use with existing GameModel
 */
export class MovementAdapter {
    /**
     * @param {GameModel} gameModel - The game model to adapt for
     */
    constructor(gameModel) {
        this.gameModel = gameModel;

        // Initialize the decoupled movement engine
        this.movementEngine = new MovementEngine({
            defaultStrategy: new GridMovementStrategy({
                tileSize: gameConfig.tileSize,
                maxTilesPerFrame: 3,
                epsilon: 3
            })
        });

        // Create maze query adapter
        this.mazeQuery = new MazeQueryAdapter(gameModel.maze);

        // Statistics
        this.stats = {
            movesProcessed: 0,
            eventsGenerated: 0
        };
    }

    /**
     * Update entity movement using the decoupled system
     * @param {ModelEntity} entity - Entity to move (PacmanState or GhostState)
     * @param {number} deltaSeconds - Time delta
     * @param {Object} inputDirection - Optional input direction for Pacman
     * @returns {Array<Object>} - Movement events
     */
    updateEntity(entity, deltaSeconds, inputDirection = null) {
        const events = [];

        // Store previous position for swept collision
        entity.prevX = entity.x;
        entity.prevY = entity.y;

        // Build movement context
        const context = {
            mazeQuery: this.mazeQuery,
            inputDirection: inputDirection,
            entityType: entity.type
        };

        // Use decoupled movement engine
        const result = this.movementEngine.move(entity, context, deltaSeconds);

        // Apply movement result to entity
        this.applyMovementResult(entity, result);

        // Convert movement events to GameModel event format
        for (const event of result.events) {
            events.push(this.convertMovementEvent(event, entity));
        }

        this.stats.movesProcessed++;
        this.stats.eventsGenerated += events.length;

        return events;
    }

    /**
     * Apply movement result to entity state
     * @param {ModelEntity} entity - Entity to update
     * @param {MovementResult} result - Movement result from engine
     */
    applyMovementResult(entity, result) {
        // Update position
        if (result.newPosition) {
            entity.x = result.newPosition.x;
            entity.y = result.newPosition.y;
        }

        // Update grid position
        if (result.newGridPosition) {
            entity.gridX = result.newGridPosition.gridX;
            entity.gridY = result.newGridPosition.gridY;
        }

        // Update direction
        if (result.newDirection) {
            entity.direction = result.newDirection;
        }

        // Update movement state
        entity.isMoving = result.result === MOVEMENT_RESULTS.MOVED;
    }

    /**
     * Convert movement system event to GameModel event format
     * @param {Object} event - Movement system event
     * @param {ModelEntity} entity - Source entity
     * @returns {Object} - GameModel formatted event
     */
    convertMovementEvent(event, entity) {
        const baseEvent = {
            entityId: entity.id,
            entityType: entity.type,
            gridX: entity.gridX,
            gridY: entity.gridY
        };

        switch (event.type) {
        case 'tile_enter':
            return {
                ...baseEvent,
                type: 'tile_center_reached',
                previousTile: event.previousTile
            };

        case 'center_reached':
            return {
                ...baseEvent,
                type: 'tile_center_reached'
            };

        case 'warp':
            return {
                ...baseEvent,
                type: 'tunnel_wrap',
                from: event.from,
                to: event.to
            };

        case 'hit_wall':
            return {
                ...baseEvent,
                type: 'wall_collision',
                direction: event.direction
            };

        case 'turned':
            return {
                ...baseEvent,
                type: 'direction_changed',
                fromDirection: event.fromDirection,
                toDirection: event.toDirection
            };

        default:
            return {
                ...baseEvent,
                type: event.type,
                ...event.data
            };
        }
    }

    /**
     * Update maze data (called when level changes)
     * @param {Array<Array<number>>} maze - New maze data
     */
    updateMaze(maze) {
        this.mazeQuery = new MazeQueryAdapter(maze);
    }

    /**
     * Get adapter statistics
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            engineStats: this.movementEngine.getStats()
        };
    }

    /**
     * Reset adapter state
     */
    reset() {
        this.stats = {
            movesProcessed: 0,
            eventsGenerated: 0
        };
        this.movementEngine.resetStats();
    }
}

/**
 * Factory function to create movement adapter with configuration
 * @param {GameModel} gameModel - Game model instance
 * @param {Object} config - Optional configuration
 * @returns {MovementAdapter}
 */
export function createMovementAdapter(gameModel, config = {}) {
    return new MovementAdapter(gameModel, config);
}
