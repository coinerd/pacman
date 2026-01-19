import { directions } from '../../config/gameConfig.js';

/**
 * Manages direction state with buffered turns
 *
 * Responsibilities:
 * - Store current and buffered direction
 * - Queue direction changes (immediate reverse vs buffered)
 * - Apply buffered direction when movement is possible
 * - Validate direction changes (opposite direction rules)
 */
export class DirectionBuffer {
    constructor() {
        this.current = directions.NONE;
        this.buffered = directions.NONE;
    }

    /**
     * Queue a new direction
     * - If opposite to current: apply immediately
     * - Otherwise: buffer for later application
     *
     * @param {Object} newDirection - Direction object from directions.js
     */
    queue(newDirection) {
        if (this._isOpposite(newDirection, this.current)) {
            this.apply(newDirection);
        } else {
            this.buffered = newDirection;
        }
    }

    /**
     * Apply buffered direction if movement is possible in that direction
     *
     * @param {Function} canMoveFunction - Function that returns true if movement is possible
     * @returns {boolean} True if direction was applied
     */
    applyIfCanMove(canMoveFunction) {
        if (this.buffered === directions.NONE) {
            return false;
        }

        if (canMoveFunction(this.buffered)) {
            this.apply(this.buffered);
            this.buffered = directions.NONE;
            return true;
        }

        return false;
    }

    /**
     * Apply a direction immediately
     *
     * @param {Object} direction - Direction object to apply
     */
    apply(direction) {
        this.current = direction;
        this.buffered = directions.NONE;
    }

    /**
     * Check if two directions are opposite
     *
     * @param {Object} dir1 - First direction
     * @param {Object} dir2 - Second direction
     * @returns {boolean} True if directions are opposite
     */
    _isOpposite(dir1, dir2) {
        if (!dir1 || !dir2) {
            return false;
        }
        return (dir1.x === -dir2.x && dir1.y === -dir2.y);
    }

    /**
     * Get current direction (for backward compatibility)
     */
    getCurrent() {
        return this.current;
    }

    /**
     * Get buffered direction (for backward compatibility)
     */
    getBuffered() {
        return this.buffered;
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.current = directions.NONE;
        this.buffered = directions.NONE;
    }
}
