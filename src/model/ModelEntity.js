/**
 * ModelEntity
 * Base class for pure data entities in the game model.
 * NO Phaser dependencies - can run in headless mode.
 */

import { directions, gameConfig } from '../config/gameConfig.js';
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

        // Previous grid position (for interpolation)
        this.prevGridX = gridX;
        this.prevGridY = gridY;

        // Target grid position (for movement progress)
        this.targetGridX = gridX;
        this.targetGridY = gridY;

        // Pixel position (for collision and sync) - always derived from grid position
        const pixel = getCenterPixel(gridX, gridY);
        this.x = pixel.x;
        this.y = pixel.y;
        this.prevX = this.x;
        this.prevY = this.y;

        // Movement progress (0.0 = at current tile, 1.0 = at target tile)
        this.moveProgress = 0.0;

        // Movement
        this.speed = config.speed || 100;
        this.directionBuffer = new DirectionBuffer();
        this.directionBuffer.apply(directions.NONE);
        this.isMoving = false;

        // Current direction (direct value, not buffered)
        this.direction = directions.NONE;

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
        // No direct assignment - use the buffer's getCurrent() via getter
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
	 * Update movement progress
	 * @param {number} deltaTime - Time since last frame in seconds
	 */
    updateMovement(deltaTime) {
        if (this.moveProgress > 0) {
            const tileSize = gameConfig.tileSize;
            const tilesPerSecond = this.speed / tileSize;
            this.moveProgress += tilesPerSecond * deltaTime;

            if (this.moveProgress >= 1.0) {
                // Arrived at target tile
                this.gridX = this.targetGridX;
                this.gridY = this.targetGridY;

                // Update pixel position from new grid position
                const pixel = getCenterPixel(this.gridX, this.gridY);
                this.x = pixel.x;
                this.y = pixel.y;

                this.moveProgress = 0;
                this.isMoving = false;

                return true; // Movement completed
            }
        }
        return false; // Still moving
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
        this.targetGridX = gridX;
        this.targetGridY = gridY;
        this.moveProgress = 0;
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
	 * OPTIMIZED: Reuse snapshot object to reduce GC pressure
	 * @returns {Object}
	 */
    getSnapshot() {
        if (!this._cachedSnapshot) {
            this._cachedSnapshot = this._createSnapshot();
        }

        const snap = this._cachedSnapshot;
        snap.id = this.id;
        snap.type = this.type;
        snap.gridX = this.gridX;
        snap.gridY = this.gridY;
        snap.x = this.x;
        snap.y = this.y;
        snap.direction = this.direction;
        snap.isMoving = this.isMoving;
        snap.speed = this.speed;
        snap.moveProgress = this.moveProgress;
        snap.targetGridX = this.targetGridX;
        snap.targetGridY = this.targetGridY;

        // Copy visualState properties instead of spreading
        const vs = this.visualState;
        const vSnap = snap.visualState;
        vSnap.scaleX = vs.scaleX;
        vSnap.scaleY = vs.scaleY;
        vSnap.alpha = vs.alpha;
        vSnap.visible = vs.visible;

        return snap;
    }

    _createSnapshot() {
        return {
            id: null,
            type: null,
            gridX: 0,
            gridY: 0,
            x: 0,
            y: 0,
            direction: null,
            isMoving: false,
            speed: 0,
            moveProgress: 0,
            targetGridX: 0,
            targetGridY: 0,
            visualState: { scaleX: 1, scaleY: 1, alpha: 1, visible: true }
        };
    }

    /**
	 * Update entity (to be overridden by subclasses)
	 * @param {number} _deltaSeconds - Time since last frame
	 * @param {Array<Array<number>>} _maze - Maze grid
	 * @returns {Array<Object>} - Events generated during update
	 */
    update(_deltaSeconds, _maze) {
        // Base implementation - subclasses override
        return [];
    }
}
