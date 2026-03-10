/**
 * ModelEntity
 * Base class for all game entities (player, enemies, etc.)
 * Pure data representation with no Phaser dependencies
 */

import {
    gameConfig
} from '../config/gameConfig.js';
import { Direction } from '../movement/core/Direction.js';
import {
    getCenterPixel,
    isWalkableTile
} from '../utils/MazeLayout.js';
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

        // Target position (for smooth movement)
        this.targetGridX = gridX;
        this.targetGridY = gridY;

        // Pixel position (for rendering)
        const pixel = getCenterPixel(gridX, gridY);
        this.x = pixel.x;
        this.y = pixel.y;
        this.prevX = this.x;
        this.prevY = this.y;

        // Movement
        this.speed = config.speed || gameConfig.defaultSpeed;
        this.direction = Direction.NONE;
        this.nextDirection = Direction.NONE;
        this.moveProgress = 0;
        this.isMoving = false;
        this.speedMultiplier = 1.0;

        // Visual state
        this.visualState = {
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            visible: true
        };

        // Direction buffer for input queuing
        this.directionBuffer = new DirectionBuffer();
    }

    /**
	 * Set the desired direction (handles input queuing)
	 * @param {Object} direction - Direction to move
	 */
    setDesiredDirection(direction) {
        this.directionBuffer.queue(direction);
        this.nextDirection = direction;
    }

    /**
	 * Get the buffered direction
	 * @returns {Object} - Buffered direction or NONE
	 */
    getBufferedDirection() {
        return this.directionBuffer.getBuffered();
    }

    /**
	 * Clear the direction buffer
	 */
    clearDirectionBuffer() {
        this.directionBuffer.clear();
        this.nextDirection = Direction.NONE;
    }

    /**
	 * Set speed multiplier (for power-ups, etc.)
	 * @param {number} multiplier - Speed multiplier
	 */
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
    }

    /**
	 * Get effective speed
	 * @returns {number} - Effective speed in pixels per second
	 */
    getEffectiveSpeed() {
        return this.speed * this.speedMultiplier;
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
            moveProgress: this.moveProgress,
            targetGridX: this.targetGridX,
            targetGridY: this.targetGridY,
            visualState: { ...this.visualState }
        };
    }

    /**
	 * Update entity (to be overridden by subclasses)
	 * @param {number} _deltaSeconds - Time since last frame
	 * @param {Array<Array<number>>} _maze - Maze grid
	 */
    update(_deltaSeconds, _maze) {
        // Override in subclasses
    }

    /**
	 * Check if entity can move in given direction
	 * @param {Object} direction - Direction to check
	 * @param {Array<Array<number>>} maze - Maze grid
	 * @returns {boolean} - True if can move
	 */
    canMove(direction, maze) {
        if (!direction || direction === Direction.NONE) {
            return false;
        }
        const nextX = this.gridX + direction.x;
        const nextY = this.gridY + direction.y;
        return isWalkableTile(nextX, nextY, maze);
    }

    /**
	 * Reset entity to starting position
	 * @param {number} gridX - Reset X position
	 * @param {number} gridY - Reset Y position
	 */
    resetPosition(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.prevGridX = gridX;
        this.prevGridY = gridY;
        this.targetGridX = gridX;
        this.targetGridY = gridY;
        this.moveProgress = 0;
        this.directionBuffer.reset();
        this.direction = Direction.NONE;
        this.isMoving = false;

        const pixel = getCenterPixel(gridX, gridY);
        this.x = pixel.x;
        this.y = pixel.y;
        this.prevX = this.x;
        this.prevY = this.y;
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
            this.x = (gameConfig.mazeWidth - 1) * gameConfig.tileSize;
            this.gridX = 0;
            wrapped = true;
        } else if (this.x >= mazeWidth) {
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
	 * Start movement to target tile
	 * @param {number} targetGridX - Target grid X
	 * @param {number} targetGridY - Target grid Y
	 * @param {Object} direction - Movement direction
	 */
    startMove(targetGridX, targetGridY, direction) {
        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;

        this.targetGridX = targetGridX;
        this.targetGridY = targetGridY;

        this.direction = direction;
        this.moveProgress = 0.001; // Start moving
        this.isMoving = true;
    }

    /**
	 * Complete movement to target
	 */
    completeMove() {
        this.gridX = this.targetGridX;
        this.gridY = this.targetGridY;
        this.moveProgress = 0;
        this.isMoving = false;

        const pixel = getCenterPixel(this.gridX, this.gridY);
        this.x = pixel.x;
        this.y = pixel.y;
    }

    /**
	 * Update pixel position based on move progress
	 */
    updatePixelPosition() {
        const fromPixel = getCenterPixel(this.prevGridX, this.prevGridY);
        const toPixel = getCenterPixel(this.targetGridX, this.targetGridY);

        this.x = fromPixel.x + (toPixel.x - fromPixel.x) * this.moveProgress;
        this.y = fromPixel.y + (toPixel.y - fromPixel.y) * this.moveProgress;
    }
}
