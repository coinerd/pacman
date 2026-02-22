/**
 * MazeAdapter
 * Adapter für Maze-Daten
 * Entkoppelt Movement System von konkretem Maze-Format
 * Implementiert IMazeAdapter
 */

import { IMazeAdapter } from '../interfaces/IMazeAdapter.js';
import { Direction } from '../core/Direction.js';

/**
 * Standard-Konfiguration für Tile-Typen
 */
export const DEFAULT_TILE_CONFIG = {
    wallValue: 1,
    pathValue: 0,
    virusCoreValue: 4,
    virusCoreDoorValue: 5,
    walkableValues: [0, 4, 5] // Path, VirusCore, VirusCoreDoor
};

/**
 * Adapter für Maze-Daten
 * Bietet einheitliche Schnittstelle unabhängig vom Maze-Format
 */
export class MazeAdapter {
    /**
     * @param {Array<Array<number>>} mazeGrid - 2D-Array des Mazes
     * @param {Object} config - Konfiguration
     * @param {number} config.tileSize - Tile-Größe in Pixeln
     * @param {Object} config.tileConfig - Tile-Typ-Konfiguration
     */
    constructor(mazeGrid, config = {}) {
        this.maze = mazeGrid;
        this.config = {
            tileSize: config.tileSize ?? 20,
            tileConfig: {
                ...DEFAULT_TILE_CONFIG,
                ...config.tileConfig
            },
            tunnelRow: config.tunnelRow ?? 15
        };

        // Caching für Performance
        this._width = mazeGrid[0]?.length ?? 0;
        this._height = mazeGrid.length;
        this._validDirectionsCache = new Map();
    }

    /**
     * Prüft ob ein Tile begehbar ist
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {boolean}
     */
    isWalkable(gridX, gridY) {
        // Tunnel-Logik: Außerhalb der X-Grenzen ist begehbar (in der Tunnel-Zeile)
        if (gridY === this.config.tunnelRow) {
            if (gridX < 0 || gridX >= this._width) {
                return true;
            }
        }

        // Y-Grenzen checken
        if (gridY < 0 || gridY >= this._height) {
            return false;
        }

        // X-Grenzen checken (außer Tunnel)
        if (gridX < 0 || gridX >= this._width) {
            return false;
        }

        const tile = this.maze[gridY][gridX];
        const { walkableValues } = this.config.tileConfig;

        return walkableValues.includes(tile);
    }

    /**
     * Gibt alle gültigen Richtungen von einer Position aus zurück
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {Array<Direction>}
     */
    getValidDirections(gridX, gridY) {
        // Cache-Key
        const cacheKey = `${gridX},${gridY}`;

        // Prüfe Cache
        if (this._validDirectionsCache.has(cacheKey)) {
            return [...this._validDirectionsCache.get(cacheKey)];
        }

        const valid = [];

        // Alle vier Richtungen testen
        const directions = [
            Direction.UP,
            Direction.DOWN,
            Direction.LEFT,
            Direction.RIGHT
        ];

        for (const dir of directions) {
            const newX = gridX + dir.x;
            const newY = gridY + dir.y;

            // Spezialfall: Horizontaler Tunnel
            if (newY === this.config.tunnelRow &&
                (newX < 0 || newX >= this._width) &&
                dir.x !== 0) {
                valid.push(dir);
                continue;
            }

            if (this.isWalkable(newX, newY)) {
                valid.push(dir);
            }
        }

        // Cache Ergebnis
        this._validDirectionsCache.set(cacheKey, [...valid]);

        return valid;
    }

    /**
     * Gibt die Pixel-Koordinate des Tile-Zentrums zurück
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {Object} - {x, y}
     */
    getTileCenter(gridX, gridY) {
        const ts = this.config.tileSize;
        return {
            x: gridX * ts + ts / 2,
            y: gridY * ts + ts / 2
        };
    }

    /**
     * Konvertiert Pixel-Koordinaten zu Grid-Koordinaten
     * @param {number} pixelX - Pixel-X
     * @param {number} pixelY - Pixel-Y
     * @returns {Object} - {x, y}
     */
    pixelToGrid(pixelX, pixelY) {
        const ts = this.config.tileSize;
        return {
            x: Math.floor(pixelX / ts),
            y: Math.floor(pixelY / ts)
        };
    }

    /**
     * Konvertiert Grid-Koordinaten zu Pixel-Koordinaten (Top-Left)
     * @param {number} gridX - Grid-X
     * @param {number} gridY - Grid-Y
     * @returns {Object} - {x, y}
     */
    gridToPixel(gridX, gridY) {
        const ts = this.config.tileSize;
        return {
            x: gridX * ts,
            y: gridY * ts
        };
    }

    /**
     * Prüft ob eine Position ein Tunnel ist
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {boolean}
     */
    isTunnel(gridX, gridY) {
        return gridY === this.config.tunnelRow &&
               (gridX < 0 || gridX >= this._width);
    }

    /**
     * Gibt den Tile-Typ zurück
     * @param {number} gridX - Grid-X
     * @param {number} gridY - Grid-Y
     * @returns {number|null}
     */
    getTileType(gridX, gridY) {
        if (gridY < 0 || gridY >= this._height ||
            gridX < 0 || gridX >= this._width) {
            return null;
        }
        return this.maze[gridY][gridX];
    }

    /**
     * Prüft ob ein Tile eine Wand ist
     * @param {number} gridX - Grid-X
     * @param {number} gridY - Grid-Y
     * @returns {boolean}
     */
    isWall(gridX, gridY) {
        const tile = this.getTileType(gridX, gridY);
        return tile === this.config.tileConfig.wallValue;
    }

    /**
     * Gibt die Breite des Mazes zurück
     * @returns {number}
     */
    getWidth() {
        return this._width;
    }

    /**
     * Gibt die Höhe des Mazes zurück
     * @returns {number}
     */
    getHeight() {
        return this._height;
    }

    /**
     * Gibt die Tile-Größe zurück
     * @returns {number}
     */
    getTileSize() {
        return this.config.tileSize;
    }

    /**
     * Berechnet die euklidische Distanz zwischen zwei Grid-Positionen
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - Ziel X
     * @param {number} y2 - Ziel Y
     * @returns {number}
     */
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    /**
     * Berechnet die Manhattan-Distanz
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - Ziel X
     * @param {number} y2 - Ziel Y
     * @returns {number}
     */
    getManhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    /**
     * Findet den nächsten begehbaren Tile
     * @param {number} gridX - Start X
     * @param {number} gridY - Start Y
     * @param {number} maxSearchRadius - Maximaler Suchradius
     * @returns {Object|null} - {x, y} oder null
     */
    findNearestWalkable(gridX, gridY, maxSearchRadius = 5) {
        if (this.isWalkable(gridX, gridY)) {
            return { x: gridX, y: gridY };
        }

        for (let radius = 1; radius <= maxSearchRadius; radius++) {
            // Suche in expandierenden Quadraten
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
                        continue; // Nur Rand des Quadrats
                    }
                    const x = gridX + dx;
                    const y = gridY + dy;
                    if (this.isWalkable(x, y)) {
                        return { x, y };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Clears den Cache für gültige Richtungen
     */
    clearCache() {
        this._validDirectionsCache.clear();
    }

    /**
     * Gibt Statistiken über den Cache zurück
     * @returns {Object}
     */
    getCacheStats() {
        return {
            size: this._validDirectionsCache.size,
            maxSize: this._width * this._height
        };
    }
}
