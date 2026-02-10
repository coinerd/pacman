/**
 * Maze Query Adapter
 * Adapts existing maze data structures to MazeQueryInterface
 *
 * This adapter allows the decoupled movement system to work with
 * the existing maze representation without direct dependencies.
 */

import { MazeQueryInterface } from '../MazeQueryInterface.js';
import { isWalkableTile, PELLET_TYPES } from '../../utils/MazeLayout.js';
import { tileCenter } from '../../utils/TileMath.js';
import { gameConfig } from '../../config/gameConfig.js';
import { PORTAL_TILES } from '../../utils/WarpTunnel.js';

/**
 * Adapter for existing maze data
 */
export class MazeQueryAdapter extends MazeQueryInterface {
    /**
     * @param {Array<Array<number>>} maze - Maze grid data
     * @param {Object} [config] - Configuration
     * @param {number} [config.tileSize] - Tile size (defaults to gameConfig.tileSize)
     * @param {Object} [config.portals] - Portal configuration (defaults to PORTAL_TILES)
     * @param {number} [config.tunnelRow] - Tunnel row (defaults to gameConfig.tunnelRow)
     */
    constructor(maze, config = {}) {
        super();
        this.maze = maze;
        this.tileSize = config.tileSize || gameConfig.tileSize;
        this.portals = config.portals || PORTAL_TILES;
        this.tunnelRow = config.tunnelRow !== undefined
            ? config.tunnelRow
            : gameConfig.tunnelRow;
    }

    /**
     * Check if tile is walkable
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {boolean}
     */
    isWalkable(tileX, tileY) {
        return isWalkableTile(this.maze, tileX, tileY);
    }

    /**
     * Get tile center in world coordinates
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {{x: number, y: number}}
     */
    getTileCenter(tileX, tileY) {
        return tileCenter(tileX, tileY);
    }

    /**
     * Get world position from tile coordinates
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {{x: number, y: number}}
     */
    tileToWorld(tileX, tileY) {
        return {
            x: tileX * this.tileSize,
            y: tileY * this.tileSize
        };
    }

    /**
     * Get tile coordinates from world position
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     * @returns {{tileX: number, tileY: number}}
     */
    worldToTile(x, y) {
        return {
            tileX: Math.floor(x / this.tileSize),
            tileY: Math.floor(y / this.tileSize)
        };
    }

    /**
     * Get warp target if tile is a portal
     * @param {number} tileX - Current tile X
     * @param {number} tileY - Current tile Y
     * @param {Object} direction - Movement direction {x, y}
     * @returns {{tileX: number, tileY: number}|null}
     */
    getWarpTarget(tileX, tileY, direction) {
        // Only allow warping on tunnel row with horizontal movement
        if (tileY !== this.tunnelRow || direction.y !== 0) {
            return null;
        }

        // Check left portal
        if (direction.x < 0 &&
            tileX === this.portals.leftPortal.tileX &&
            tileY === this.portals.leftPortal.tileY) {
            return {
                tileX: this.portals.rightPortal.tileX,
                tileY: this.portals.rightPortal.tileY
            };
        }

        // Check right portal
        if (direction.x > 0 &&
            tileX === this.portals.rightPortal.tileX &&
            tileY === this.portals.rightPortal.tileY) {
            return {
                tileX: this.portals.leftPortal.tileX,
                tileY: this.portals.leftPortal.tileY
            };
        }

        return null;
    }

    /**
     * Get tile size in pixels
     * @returns {number}
     */
    getTileSize() {
        return this.tileSize;
    }

    /**
     * Check if coordinates are within maze bounds
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {boolean}
     */
    isInBounds(tileX, tileY) {
        return tileY >= 0 &&
               tileY < this.maze.length &&
               tileX >= 0 &&
               tileX < this.maze[0].length;
    }

    /**
     * Get maze width in tiles
     * @returns {number}
     */
    getWidth() {
        return this.maze[0]?.length || 0;
    }

    /**
     * Get maze height in tiles
     * @returns {number}
     */
    getHeight() {
        return this.maze.length;
    }

    /**
     * Get the underlying maze data (for advanced use cases)
     * @returns {Array<Array<number>>} Maze grid
     */
    getMazeData() {
        return this.maze;
    }

    /**
     * Check if position is a portal
     * @param {number} tileX - Tile X
     * @param {number} tileY - Tile Y
     * @returns {boolean}
     */
    isPortal(tileX, tileY) {
        return (tileX === this.portals.leftPortal.tileX &&
                tileY === this.portals.leftPortal.tileY) ||
               (tileX === this.portals.rightPortal.tileX &&
                tileY === this.portals.rightPortal.tileY);
    }

    /**
     * Get all walkable neighbors of a tile
     * @param {number} tileX - Tile X
     * @param {number} tileY - Tile Y
     * @returns {Array<{tileX: number, tileY: number, direction: Object}>}
     */
    getWalkableNeighbors(tileX, tileY) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }, // Left
            { x: 1, y: 0 }   // Right
        ];

        for (const dir of directions) {
            const nextX = tileX + dir.x;
            const nextY = tileY + dir.y;

            if (this.isWalkable(nextX, nextY)) {
                neighbors.push({
                    tileX: nextX,
                    tileY: nextY,
                    direction: dir
                });
            }
        }

        return neighbors;
    }
}
