/**
 * Movement Interface
 * Pure interface for entity movement - NO external dependencies
 *
 * This module defines the contracts for movement systems following
 * the Interface Segregation Principle. All movement implementations
 * must adhere to these interfaces.
 */

/**
 * Movement result types
 * @readonly
 * @enum {string}
 */
export const MOVEMENT_RESULTS = {
    /** Entity successfully moved */
    MOVED: 'moved',
    /** Entity blocked by wall/obstacle */
    BLOCKED: 'blocked',
    /** Entity warped through portal */
    WARPED: 'warped',
    /** Entity changed direction */
    TURNED: 'turned',
    /** Entity stopped moving */
    STOPPED: 'stopped',
    /** No movement (zero delta or speed) */
    NONE: 'none'
};

/**
 * Movement event types
 * @readonly
 * @enum {string}
 */
export const MOVEMENT_EVENTS = {
    /** Entity entered a new tile */
    TILE_ENTER: 'tile_enter',
    /** Entity reached tile center */
    CENTER_REACHED: 'center_reached',
    /** Entity hit a wall */
    WALL_HIT: 'wall_hit',
    /** Entity used warp tunnel */
    WARP: 'warp'
};

/**
 * Abstract base class for movement strategies
 * @abstract
 */
export class MovementInterface {
    /**
     * Move an entity
     * @param {Object} entity - Entity state (position, direction, speed)
     * @param {Object} entity.x - Current X position in pixels
     * @param {Object} entity.y - Current Y position in pixels
     * @param {Object} entity.gridX - Current grid X coordinate
     * @param {Object} entity.gridY - Current grid Y coordinate
     * @param {Object} entity.direction - Current direction vector {x, y, angle}
     * @param {number} entity.speed - Speed in pixels per second
     * @param {Object} context - Movement context
     * @param {MazeQueryInterface} context.mazeQuery - Maze query interface
     * @param {number} deltaSeconds - Time delta in seconds
     * @returns {MovementResult} Movement result
     */
    move(entity, context, deltaSeconds) {
        throw new Error('MovementInterface.move() must be implemented by subclass');
    }

    /**
     * Check if entity can move in direction
     * @param {Object} entity - Entity state
     * @param {Object} context - Movement context
     * @param {Object} direction - Direction to check {x, y}
     * @returns {boolean} True if can move
     */
    canMove(entity, context, direction) {
        throw new Error('MovementInterface.canMove() must be implemented by subclass');
    }

    /**
     * Calculate distance to move based on speed and time
     * @protected
     * @param {number} speed - Speed in pixels per second
     * @param {number} deltaSeconds - Time delta in seconds
     * @returns {number} Distance in pixels
     */
    calculateMoveDistance(speed, deltaSeconds) {
        return speed * deltaSeconds;
    }
}

/**
 * @typedef {Object} MovementResult
 * @property {string} result - Result type from MOVEMENT_RESULTS
 * @property {Object} [newPosition] - New pixel position {x, y}
 * @property {Object} [newGridPosition] - New grid position {gridX, gridY}
 * @property {Object} [newDirection] - New direction {x, y, angle}
 * @property {boolean} isMoving - Whether entity is still moving
 * @property {Array<Object>} events - Movement events that occurred
 * @property {number} distanceMoved - Actual distance moved in pixels
 */

/**
 * @typedef {Object} MovementEvent
 * @property {string} type - Event type from MOVEMENT_EVENTS
 * @property {number} [tileX] - Tile X coordinate (for tile events)
 * @property {number} [tileY] - Tile Y coordinate (for tile events)
 * @property {Object} [from] - Previous position (for warp events)
 * @property {Object} [to] - New position (for warp events)
 */
