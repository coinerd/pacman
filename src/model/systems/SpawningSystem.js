/**
 * SpawningSystem
 * Verwaltet Entity-Spawning, Maze-Generierung und Spawn-Punkte.
 */

import MazeGenerator from '../../utils/MazeGenerator.js';
import { countPellets, createMazeData, PELLET_TYPES } from '../../utils/MazeLayout.js';
import { gameConfig, enemyStartPositions, playerStartPosition, fruitConfig, virusCore } from '../../config/gameConfig.js';

export class SpawningSystem {
    constructor(levelSystem) {
        this.levelSystem = levelSystem;
        this.maze = null;
        this.pelletGrid = null;
        this.spawnPoints = {};
        this.totalPellets = 0;
        this.pelletsRemaining = 0;
    }

    /**
     * Generiert ein Maze für ein Level
     * @param {number} level - Level-Nummer
     * @returns {Object} { maze, pelletGrid, spawnPoints }
     */
    generateMazeForLevel(level) {
        const mazeGenerator = new MazeGenerator({
            width: 28,
            height: 31,
            tileSize: gameConfig.tileSize,
            complexity: Math.min(0.1 + (level * 0.02), 0.5), // Steigende Komplexität pro Level
            seed: level // Deterministisch pro Level
        });

        const maze = mazeGenerator.generate();
        const { pelletGrid, spawnPoints } = createMazeData(maze, {
            virusCore: virusCore,
            playerStart: playerStartPosition,
            enemyStarts: enemyStartPositions
        });

        this.maze = maze;
        this.pelletGrid = pelletGrid;
        this.spawnPoints = spawnPoints;
        this.totalPellets = countPellets(pelletGrid);
        this.pelletsRemaining = this.totalPellets;

        return {
            maze,
            pelletGrid,
            spawnPoints,
            totalPellets: this.totalPellets
        };
    }

    /**
     * Setzt ein Maze direkt (für Level-Reload oder Testing)
     * @param {Array<Array<number>>} maze - Maze-Grid
     * @param {Array<Array<number>>} pelletGrid - Pellet-Grid
     * @param {Object} spawnPoints - Spawn-Punkte
     */
    setMaze(maze, pelletGrid, spawnPoints) {
        this.maze = maze;
        this.pelletGrid = pelletGrid;
        this.spawnPoints = spawnPoints;
        this.totalPellets = countPellets(pelletGrid);
        this.pelletsRemaining = this.totalPellets;
    }

    /**
     * Gibt das aktuelle Maze zurück
     * @returns {Array<Array<number>>}
     */
    getMaze() {
        if (!this.maze) {
            console.warn('[SpawningSystem.getMaze] Maze not initialized, returning empty array');
            return [];
        }
        return this.maze;
    }

    /**
     * Gibt das Pellet-Grid zurück
     * @returns {Array<Array<number>>}
     */
    getPelletGrid() {
        if (!this.pelletGrid) {
            console.warn('[SpawningSystem.getPelletGrid] PelletGrid not initialized, returning empty array');
            return [];
        }
        return this.pelletGrid;
    }

    /**
     * Gibt die Spawn-Punkte zurück
     * @returns {Object}
     */
    getSpawnPoints() {
        return this.spawnPoints;
    }

    /**
     * Gibt den Spieler-Spawn-Punkt zurück
     * @returns {Object} { x, y }
     */
    getPlayerSpawnPoint() {
        return this.spawnPoints?.player || playerStartPosition;
    }

    /**
     * Gibt den Spawn-Punkt für einen Ghost-Typ zurück
     * @param {string} ghostType - Ghost-Typ (alpha, beta, gamma, delta)
     * @returns {Object|null} { x, y }
     */
    getGhostSpawnPoint(ghostType) {
        return this.spawnPoints?.ghosts?.[ghostType] || enemyStartPositions[ghostType] || null;
    }

    /**
     * Gibt die Ghost-Spawn-Punkte zurück
     * @returns {Object}
     */
    getGhostSpawnPoints() {
        return this.spawnPoints?.ghosts || enemyStartPositions;
    }

    /**
     * Gibt den Virus-Core zurück
     * @returns {Object} { center, entrance }
     */
    getVirusCore() {
        return virusCore;
    }

    /**
     * Gibt die Gesamtanzahl der Pellets zurück
     * @returns {number}
     */
    getTotalPellets() {
        return this.totalPellets;
    }

    /**
     * Gibt die verbleibende Anzahl der Pellets zurück
     * @returns {number}
     */
    getPelletsRemaining() {
        return this.pelletsRemaining;
    }

    /**
     * Setzt die verbleibende Anzahl der Pellets
     * @param {number} remaining
     */
    setPelletsRemaining(remaining) {
        this.pelletsRemaining = remaining;
    }

    /**
     * Prüft ob ein Pellet an einer Position existiert
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {boolean}
     */
    hasPelletAt(gridX, gridY) {
        if (!this.pelletGrid) {
            return false;
        }

        if (gridX < 0 || gridX >= this.pelletGrid[0].length) {
            return false;
        }

        if (gridY < 0 || gridY >= this.pelletGrid.length) {
            return false;
        }

        return this.pelletGrid[gridY][gridX] !== PELLET_TYPES.NONE;
    }

    /**
     * Entfernt ein Pellet an einer Position
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {boolean} True wenn Pellet entfernt wurde
     */
    removePelletAt(gridX, gridY) {
        if (!this.hasPelletAt(gridX, gridY)) {
            return false;
        }

        const pelletType = this.pelletGrid[gridY][gridX];
        this.pelletGrid[gridY][gridX] = PELLET_TYPES.NONE;
        this.pelletsRemaining--;

        return pelletType !== PELLET_TYPES.NONE;
    }

    /**
     * Gibt den Pellet-Typ an einer Position zurück
     * @param {number} gridX - Grid-X-Position
     * @param {number} gridY - Grid-Y-Position
     * @returns {number} PELLET_TYPES-Konstante
     */
    getPelletAt(gridX, gridY) {
        if (!this.pelletGrid) {
            return PELLET_TYPES.NONE;
        }

        if (gridX < 0 || gridX >= this.pelletGrid[0].length) {
            return PELLET_TYPES.NONE;
        }

        if (gridY < 0 || gridY >= this.pelletGrid.length) {
            return PELLET_TYPES.NONE;
        }

        return this.pelletGrid[gridY][gridX] || PELLET_TYPES.NONE;
    }

    /**
     * Gibt den Prozentsatz der gefressenen Pellets zurück
     * @returns {number} 0-100
     */
    getPelletsEatenPercentage() {
        if (this.totalPellets === 0) {
            return 0;
        }

        return ((this.totalPellets - this.pelletsRemaining) / this.totalPellets) * 100;
    }

    /**
     * Prüft ob das Level komplett ist (alle Pellets gefressen)
     * @returns {boolean}
     */
    isLevelComplete() {
        return this.pelletsRemaining === 0;
    }

    /**
     * Setzt das System für ein neues Level zurück
     * @param {number} level - Level-Nummer
     */
    resetForLevel(level) {
        const mazeData = this.generateMazeForLevel(level);
        return mazeData;
    }

    /**
     * Gibt Spawn-Informationen zurück
     * @returns {Object}
     */
    getSpawnInfo() {
        return {
            player: this.getPlayerSpawnPoint(),
            ghosts: this.getGhostSpawnPoints(),
            virusCore: this.getVirusCore(),
            spawnPoints: this.spawnPoints
        };
    }

    /**
     * Setzt das System zurück
     */
    reset() {
        this.maze = null;
        this.pelletGrid = null;
        this.spawnPoints = {};
        this.totalPellets = 0;
        this.pelletsRemaining = 0;
    }
}
