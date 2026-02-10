/**
 * ModelEntity
 * Base class for pure data entities in the game model.
 * NO Phaser dependencies - can run in headless mode.
 */

import { gameConfig, directions } from '../config/gameConfig.js';
import { getCenterPixel, gridToPixel, isWalkableTile } from '../utils/MazeLayout.js';
import { DirectionBuffer } from '../utils/movement/DirectionBuffer.js';

let entityIdCounter = 0;

export function generateEntityId() {
    return `entity_${++entityIdCounter}_${Date.now()}`;
}

export class ModelEntity {
    /**
     * @param {number} gridX - Initial grid X position
     * @param {number} gridY - Initial grid Y position
     * @param {Object} config - Entity configuration
     * @param {number} config.speed - Movement speed in pixels per second
     * @param {string} config.type - Entity type identifier
     */
    constructor(gridX, gridY, config = {}) {
        this.id = generateEntityId();
        this.type = config.type || 'generic';

        // Grid position (logical)
        this.gridX = gridX;
        this.gridY = gridY;
        this.prevGridX = gridX;
        this.prevGridY = gridY;

        // Pixel position (for collision and sync)
        const pixel = getCenterPixel(gridX, gridY);
        this.x = pixel.x;
        this.y = pixel.y;
        this.prevX = this.x;
        this.prevY = this.y;

        // Movement
        this.speed = config.speed || 100;
        this.directionBuffer = new DirectionBuffer();
        this.directionBuffer.apply(directions.NONE);
        this.isMoving = false;

        // Visual state (data only, no rendering)
        this.visualState = {
            visible: true,
            opacity: 1.0,
            scale: 1.0
        };
    }

    /**
     * Get current direction from buffer
     */
    get direction() {
        return this.directionBuffer.getCurrent();
    }

    set direction(value) {
        this.directionBuffer.apply(value);
    }

    /**
     * Get next/buffered direction
     */
    get nextDirection() {
        return this.directionBuffer.getBuffered();
    }

    set nextDirection(value) {
        this.directionBuffer.queue(value);
    }

    /**
     * Queue a direction change
     * @param {Object} direction - Direction to queue
     */
    setDirection(direction) {
        this.directionBuffer.queue(direction);
    }

    /**
     * Check if entity can move in a direction
     * @param {Object} direction - Direction to check
     * @param {Array<Array<number>>} maze - Maze grid
     * @returns {boolean}
     */
    canMoveInDirection(direction, maze) {
        if (!direction || direction === directions.NONE) {
            return false;
        }

        const nextGridX = this.gridX + direction.x;
        const nextGridY = this.gridY + direction.y;

        return this.isValidPosition(nextGridX, nextGridY, maze);
    }

    /**
     * Check if a grid position is valid (walkable)
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @param {Array<Array<number>>} maze - Maze grid
     * @returns {boolean}
     */
    isValidPosition(gridX, gridY, maze) {
        if (!maze || gridY < 0 || gridY >= maze.length) {
            return false;
        }

        if (gridX < 0 || gridX >= maze[0].length) {
            // Allow tunnel wrapping on horizontal edges
            return true;
        }

        return isWalkableTile(maze, gridX, gridY);
    }

    /**
     * Handle tunnel wrapping
     * @returns {boolean} - True if wrapped
     */
    handleTunnelWrap() {
        const mazeWidth = gameConfig.mazeWidth * gameConfig.tileSize;

        if (this.gridY !== gameConfig.tunnelRow) {
            return false;
        }

        let wrapped = false;
        if (this.x < 0) {
            this.x = mazeWidth;
            this.gridX = gameConfig.mazeWidth - 1;
            wrapped = true;
        } else if (this.x > mazeWidth) {
            this.x = 0;
            this.gridX = 0;
            wrapped = true;
        }

        return wrapped;
    }

    /**
     * Update previous position tracking (call before movement)
     */
    updatePreviousPosition() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;
    }

    /**
     * Reset entity to a position
     * @param {number} gridX - New grid X
     * @param {number} gridY - New grid Y
     */
    resetPosition(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.prevGridX = gridX;
        this.prevGridY = gridY;
        this.directionBuffer.reset();
        this.direction = directions.NONE;
        this.isMoving = false;

        const pixel = getCenterPixel(gridX, gridY);
        this.x = pixel.x;
        this.y = pixel.y;
        this.prevX = this.x;
        this.prevY = this.y;
    }

    /**
     * Get grid position
     * @returns {{x: number, y: number}}
     */
    getGridPosition() {
        return { x: this.gridX, y: this.gridY };
    }

    /**
     * Get pixel position
     * @returns {{x: number, y: number}}
     */
    getPixelPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Get state snapshot for serialization
     * @returns {Object}
     */
    getSnapshot() {
        return {
            id: this.id,
            type: this.type,
            gridX: this.gridX,
            gridY: this.gridY,
            x: this.x,
            y: this.y,
            direction: this.direction,
            isMoving: this.isMoving,
            speed: this.speed,
            visualState: { ...this.visualState }
        };
    }

    /**
     * Update entity (to be overridden by subclasses)
     * @param {number} deltaSeconds - Time since last frame
     * @param {Array<Array<number>>} maze - Maze grid
     * @returns {Array<Object>} - Events generated during update
     */
    update(deltaSeconds, maze) {
        // Base implementation - subclasses override
        return [];
    }
}
