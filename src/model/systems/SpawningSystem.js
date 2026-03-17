/**
 * SpawningSystem
 * Verwaltet Entity-Spawning, Maze-Generierung und Spawn-Punkte.
 *
 * Phase 3 Integration:
 * - Nutzt MazeConfigLoader für konfigurierbare Maze-Presets
 * - Nutzt MazeSeedManager für reproduzierbare Seeds
 * - Unterstützt verschiedene Randomisierungs-Modi
 */

import MazeGenerator from '../../utils/MazeGenerator.js';
import { countPellets, createMazeData, PELLET_TYPES } from '../../utils/MazeLayout.js';
import { gameConfig, enemyStartPositions, playerStartPosition, virusCore } from '../../config/gameConfig.js';
import { mazeConfigLoader } from '../../utils/MazeConfigLoader.js';
import { mazeSeedManager } from '../../utils/MazeSeedManager.js';

/**
 * @typedef {'default' | 'easy' | 'medium' | 'hard' | 'expert'} MazePreset
 */

/**
 * @typedef {'full_random' | 'level_sequence' | 'daily_challenge' | 'seeded'} SeedMode
 */

export class SpawningSystem {
    /**
     * @param {Object} levelSystem - Das Level-System
     * @param {Object} [options={}] - Zusätzliche Optionen
     * @param {MazePreset} [options.preset='default'] - Maze-Preset
     * @param {SeedMode} [options.seedMode='level_sequence'] - Seed-Modus
     * @param {number} [options.overrideSeed] - Optionaler manueller Seed
     */
    constructor(levelSystem, options = {}) {
        this.levelSystem = levelSystem;
        this.maze = null;
        this.pelletGrid = null;
        this.spawnPoints = {};
        this.totalPellets = 0;
        this.pelletsRemaining = 0;

        // Phase 3: Maze-Konfiguration
        /** @type {MazePreset} */
        this.preset = options.preset || 'default';

        /** @type {SeedMode} */
        this.seedMode = options.seedMode || 'full_random';

        /** @type {number|null} */
        this.overrideSeed = options.overrideSeed || null;

        // Aktuelle Maze-Informationen für Replay
        this.currentSeedInfo = null;
        this.currentConfig = null;
    }

    /**
     * Setzt das Maze-Preset
     * @param {MazePreset} preset - Preset-Name
     */
    setPreset(preset) {
        if (mazeConfigLoader.hasPreset(preset)) {
            this.preset = preset;
        } else {
            console.warn(`[SpawningSystem] Unbekanntes Preset: ${preset}, nutze 'default'`);
            this.preset = 'default';
        }
    }

    /**
     * Setzt den Seed-Modus
     * @param {SeedMode} mode - Seed-Modus
     */
    setSeedMode(mode) {
        this.seedMode = mode;
    }

    /**
     * Setzt einen manuellen Seed (für Replay)
     * @param {number} seed - Seed-Wert
     */
    setOverrideSeed(seed) {
        this.overrideSeed = seed;
        this.seedMode = 'seeded';
    }

    /**
     * Generiert ein Maze für ein Level
     * @param {number} level - Level-Nummer
     * @param {Object} [options={}] - Optionale Overrides
     * @returns {Object} { maze, pelletGrid, spawnPoints, seedInfo, config }
     */
    generateMazeForLevel(level, options = {}) {
        // Phase 3: Nutze MazeConfigLoader für Konfiguration
        const preset = options.preset || this.preset;
        const overrides = options.configOverrides || {};

        // Lade konfigurierte Maze-Parameter
        const mazeConfig = mazeConfigLoader.loadConfig(level, preset, overrides);
        this.currentConfig = mazeConfig;

        // Generiere Seed mit MazeSeedManager
        const seedInfo = mazeSeedManager.generateSeed(level, preset, {
            mode: this.seedMode,
            overrideSeed: this.overrideSeed
        });
        this.currentSeedInfo = seedInfo;

        // Konvertiere Config zu MazeGenerator-Format
        const generatorConfig = mazeConfigLoader.toGeneratorConfig(mazeConfig);

        // Erstelle MazeGenerator mit konfigurierten Parametern
        const mazeGenerator = new MazeGenerator({
            width: generatorConfig.width,
            height: generatorConfig.height,
            tileSize: gameConfig.tileSize,
            pathDensity: generatorConfig.pathDensity,
            deadEndFactor: generatorConfig.deadEndFactor,
            symmetry: generatorConfig.symmetry,
            cellularAutomataIterations: generatorConfig.cellularAutomataIterations,
            minAlternativePaths: generatorConfig.minAlternativePaths,
            deadEndDensityThreshold: generatorConfig.deadEndDensityThreshold,
            maxStraightCorridorLength: generatorConfig.maxStraightCorridorLength,
            spawnSafetyRadius: generatorConfig.spawnSafetyRadius,
            spawnSafetyMinFreedomSteps: generatorConfig.spawnSafetyMinFreedomSteps,
            maxRetries: generatorConfig.maxRetries,
            fallbackSeedOffset: generatorConfig.fallbackSeedOffset,
            seed: seedInfo.seed,
            // Behalte bestehende Spawn-Targets bei
            playerSpawnTarget: playerStartPosition,
            ghostSpawnTargets: enemyStartPositions,
            virusCore: virusCore,
            tunnelRow: generatorConfig.tunnelRow
        });

        // Generiere Maze
        const result = mazeGenerator.generate();
        const { maze, stats, validationResult } = result;

        // Erstelle vollständiges MazeData-Objekt
        const mazeData = createMazeData(maze, {
            virusCore: virusCore,
            playerStart: playerStartPosition,
            enemyStarts: enemyStartPositions
        });

        this.maze = maze;
        this.pelletGrid = mazeData.pelletGrid;
        this.spawnPoints = mazeData.spawnPoints;
        this.totalPellets = countPellets(this.pelletGrid);
        this.pelletsRemaining = this.totalPellets;

        return {
            maze: this.maze,
            pelletGrid: this.pelletGrid,
            spawnPoints: this.spawnPoints,
            totalPellets: this.totalPellets,
            // Phase 3: Zusätzliche Informationen
            seedInfo,
            config: mazeConfig,
            stats,
            validationResult
        };
    }

    /**
     * Gibt die aktuellen Maze-Seed-Informationen zurück (für Replay)
     * @returns {Object|null}
     */
    getSeedInfo() {
        return this.currentSeedInfo;
    }

    /**
     * Gibt die aktuelle Maze-Konfiguration zurück
     * @returns {Object|null}
     */
    getMazeConfig() {
        return this.currentConfig;
    }

    /**
     * Erstellt einen Replay-Record für das aktuelle Maze
     * @returns {Object}
     */
    createReplayRecord() {
        if (!this.currentSeedInfo) {
            return null;
        }

        return mazeSeedManager.createReplayRecord(
            this.currentSeedInfo.seed,
            this.currentSeedInfo.level,
            this.currentSeedInfo.preset,
            {
                configName: this.currentConfig?.meta?.name || 'Unknown'
            }
        );
    }

    /**
     * Lädt ein Maze aus einem Replay-Record
     * @param {Object} replayRecord - Replay-Record mit seed, level, preset
     * @returns {Object} Generiertes Maze
     */
    loadFromReplayRecord(replayRecord) {
        const validation = mazeSeedManager.validateReplayRecord(replayRecord);
        if (!validation.isValid) {
            throw new Error(`Invalid replay record: ${validation.errors.join(', ')}`);
        }

        this.overrideSeed = replayRecord.seed;
        this.seedMode = 'seeded';
        this.preset = replayRecord.preset || 'default';

        return this.generateMazeForLevel(replayRecord.level);
    }

    /**
     * Listet verfügbare Presets auf
     * @returns {Array}
     */
    listAvailablePresets() {
        return mazeConfigLoader.listPresets();
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
