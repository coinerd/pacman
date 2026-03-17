/**
 * IMazeAdapter
 * Interface für Maze-Abstraktion
 * Entkoppelt Movement System von konkreter Maze-Implementierung
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X-Koordinate
 * @property {number} y - Y-Koordinate
 */

/**
 * Interface das jeder Maze-Adapter implementieren muss
 */
export class IMazeAdapter {
    /**
     * Prüft ob ein Tile begehbar ist
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {boolean}
     */
    isWalkable(_gridX, _gridY) {
        throw new Error('Not implemented');
    }

    /**
     * Gibt alle gültigen Richtungen von einer Position aus zurück
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {Array<Direction>} - Array gültiger Richtungen
     */
    getValidDirections(_gridX, _gridY) {
        throw new Error('Not implemented');
    }

    /**
     * Gibt die Pixel-Koordinate des Tile-Zentrums zurück
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {Position} - {x, y} Pixel-Koordinaten
     */
    getTileCenter(_gridX, _gridY) {
        throw new Error('Not implemented');
    }

    /**
     * Prüft ob eine Position ein Tunnel ist
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {boolean}
     */
    isTunnel(_gridX, _gridY) {
        throw new Error('Not implemented');
    }

    /**
     * Gibt die Breite des Mazes zurück
     * @returns {number}
     */
    getWidth() {
        throw new Error('Not implemented');
    }

    /**
     * Gibt die Höhe des Mazes zurück
     * @returns {number}
     */
    getHeight() {
        throw new Error('Not implemented');
    }

    /**
     * Gibt die Tile-Größe zurück
     * @returns {number}
     */
    getTileSize() {
        throw new Error('Not implemented');
    }

    /**
     * Berechnet die Distanz zwischen zwei Grid-Positionen
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - Ziel X
     * @param {number} y2 - Ziel Y
     * @returns {number} - Euklidische Distanz
     */
    getDistance(_x1, _y1, _x2, _y2) {
        throw new Error('Not implemented');
    }
}
