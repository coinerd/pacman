/**
 * Maze Query Interface
 * Abstract interface for querying maze data - decouples movement from maze representation
 *
 * This interface allows movement systems to query maze data without knowing
 * the underlying maze representation. Any maze implementation can be used
 * as long as it implements this interface.
 */

/**
 * @typedef {Object} TilePosition
 * @property {number} tileX - Tile X coordinate
 * @property {number} tileY - Tile Y coordinate
 */

/**
 * @typedef {Object} WorldPosition
 * @property {number} x - X position in pixels
 * @property {number} y - Y position in pixels
 */

/**
 * Abstract base class for maze query interfaces
 * @abstract
 */
export class MazeQueryInterface {
    /**
     * Check if tile is walkable
     * @abstract
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {boolean} True if tile can be walked on
     */
    isWalkable(tileX, tileY) {
        throw new Error('MazeQueryInterface.isWalkable() must be implemented by subclass');
    }

    /**
     * Get tile center in world coordinates
     * @abstract
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {WorldPosition} Center position in pixels
     */
    getTileCenter(tileX, tileY) {
        throw new Error('MazeQueryInterface.getTileCenter() must be implemented by subclass');
    }

    /**
     * Get world position from tile coordinates
     * @abstract
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {WorldPosition} Top-left position in pixels
     */
    tileToWorld(tileX, tileY) {
        throw new Error('MazeQueryInterface.tileToWorld() must be implemented by subclass');
    }

    /**
     * Get tile coordinates from world position
     * @abstract
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     * @returns {TilePosition} Tile coordinates
     */
    worldToTile(x, y) {
        throw new Error('MazeQueryInterface.worldToTile() must be implemented by subclass');
    }

    /**
     * Get warp target if tile is a portal
     * @abstract
     * @param {number} tileX - Current tile X
     * @param {number} tileY - Current tile Y
     * @param {Object} direction - Movement direction {x, y}
     * @returns {TilePosition|null} Target tile or null if no warp
     */
    getWarpTarget(tileX, tileY, direction) {
        throw new Error('MazeQueryInterface.getWarpTarget() must be implemented by subclass');
    }

    /**
     * Get tile size in pixels
     * @abstract
     * @returns {number} Tile size
     */
    getTileSize() {
        throw new Error('MazeQueryInterface.getTileSize() must be implemented by subclass');
    }

    /**
     * Check if coordinates are within maze bounds
     * @abstract
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {boolean} True if within bounds
     */
    isInBounds(tileX, tileY) {
        throw new Error('MazeQueryInterface.isInBounds() must be implemented by subclass');
    }

    /**
     * Get maze width in tiles
     * @abstract
     * @returns {number} Width in tiles
     */
    getWidth() {
        throw new Error('MazeQueryInterface.getWidth() must be implemented by subclass');
    }

    /**
     * Get maze height in tiles
     * @abstract
     * @returns {number} Height in tiles
     */
    getHeight() {
        throw new Error('MazeQueryInterface.getHeight() must be implemented by subclass');
    }
}
