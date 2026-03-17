/**
 * MazeGenerator
 * Procedural circuit-style maze generation using DFS algorithm
 * Creates playable mazes with valid spawn points and connectivity
 *
 * This is the main coordinator class that delegates to specialized modules:
 * - MazeAlgorithms: Core generation algorithms (DFS, Cellular Automata)
 * - MazeValidation: Maze validation and pathfinding
 * - MazeAesthetics: Circuit aesthetics and symmetry
 * - MazeUtils: Utility functions (virus core, pellets, stats)
 */

import { TILE_TYPES } from './MazeLayout.js';
import { findNearestValidSpawn } from './SpawnValidator.js';
import { createSeededRandomFn } from './SeededRandom.js';

// Import maze modules
import {
    carveDFSMaze,
    addExtraPaths,
    applyCellularAutomata
} from './maze/MazeAlgorithms.js';
import { validateMaze } from './maze/MazeValidation.js';
import {
    applyCircuitAesthetics,
    applySymmetry,
    createWarpTunnel
} from './maze/MazeAesthetics.js';
import {
    generateVirusCore,
    createVirusCoreChecker,
    placePellets,
    calculateStats,
    fixConnectivity,
    initializeMaze,
    countPathTilesInMaze
} from './maze/MazeUtils.js';

const DEFAULT_CONFIG = {
    width: 25,
    height: 33,
    pathDensity: 0.7,
    deadEndFactor: 0.3,
    symmetry: 'none',
    cellularAutomataIterations: 0,
    seed: null,
    playerSpawnTarget: { x: 13, y: 27 },
    ghostSpawnTargets: {
        alpha: { x: 2, y: 1 },
        beta: { x: 22, y: 1 },
        gamma: { x: 2, y: 26 },
        delta: { x: 21, y: 26 }
    },
    powerPelletTargets: [
        { x: 1, y: 1 },
        { x: 23, y: 1 },
        { x: 1, y: 26 },
        { x: 23, y: 26 }
    ],
    virusCore: {
        entrance: { x: 12, y: 15 },
        center: { x: 12, y: 13 }
    },
    tunnelRow: 15,
    minConnectivityCoverage: 1,
    minAlternativePaths: 1,
    deadEndDensityThreshold: 0.2,
    maxStraightCorridorLength: 8,
    spawnSafetyRadius: 2,
    spawnSafetyMinFreedomSteps: 12,
    maxRetries: 20,
    fallbackSeedOffset: 1000003
};

/**
 * Main MazeGenerator class
 * Coordinates maze generation using modular components
 */
export default class MazeGenerator {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.width = this.config.width;
        this.height = this.config.height;
        this.seed = this.config.seed || Date.now();
        this.rng = this.createSeededRNG(this.seed);

        this.maze = [];
        this.pelletGrid = [];

        this.spawnPoints = {
            player: { ...this.config.playerSpawnTarget },
            ghosts: { ...this.config.ghostSpawnTargets },
            powerPellets: [...this.config.powerPelletTargets]
        };

        this.virusCore = { ...this.config.virusCore };

        // Create virus core area checker
        this.isVirusCoreArea = createVirusCoreChecker(this.virusCore);

        this.stats = {
            pathTiles: 0,
            wallTiles: 0,
            deadEnds: 0,
            generatedTime: 0
        };
    }

    /**
     * Creates seeded random number generator
     */
    createSeededRNG(seed) {
        return createSeededRandomFn(seed);
    }

    /**
     * Main generation entry point
     */
    generate() {
        return this.generateWithRetries();
    }

    /**
     * Generates maze with retry logic for validation failures
     */
    generateWithRetries() {
        const startTime = performance.now();

        let lastResult = null;
        const maxRetries = Math.max(1, this.config.maxRetries);

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const candidateSeed = this.seed + attempt;
            this.rng = this.createSeededRNG(candidateSeed);
            lastResult = this.generateSingleAttempt();

            if (lastResult.validationResult.isValid) {
                lastResult.stats.generatedTime = performance.now() - startTime;
                lastResult.stats.retries = attempt;
                lastResult.stats.finalSeed = candidateSeed;
                lastResult.stats.fallbackUsed = false;
                return lastResult;
            }
        }

        // Fallback to guaranteed working seed
        const fallbackSeed = this.seed + this.config.fallbackSeedOffset;
        this.rng = this.createSeededRNG(fallbackSeed);
        lastResult = this.generateSingleAttempt();

        if (!lastResult.validationResult.isValid) {
            console.warn(`Maze fallback warning: ${lastResult.validationResult.message}`);
            fixConnectivity(
                this.maze,
                this.width,
                this.height,
                this.spawnPoints.player,
                this.isVirusCoreArea
            );
            this.pelletGrid = placePellets(
                this.maze,
                this.width,
                this.height,
                this.spawnPoints.powerPellets
            );
            Object.assign(this.stats, calculateStats(this.maze, this.width, this.height));
        }

        lastResult.validationResult = this.performValidation();
        lastResult.stats.generatedTime = performance.now() - startTime;
        lastResult.stats.retries = maxRetries;
        lastResult.stats.finalSeed = fallbackSeed;
        lastResult.stats.fallbackUsed = true;

        return lastResult;
    }

    /**
     * Generates a single maze attempt
     */
    generateSingleAttempt() {
        // Initialize maze with walls
        this.maze = initializeMaze(this.width, this.height);

        // Generate virus core area
        generateVirusCore(this.maze, this.width, this.height, this.virusCore);

        if (!this.maze || this.maze.length === 0) {
            console.warn('Maze not properly initialized after virus core generation');
            this.maze = initializeMaze(this.width, this.height);
        }

        // Generate maze using DFS algorithm
        carveDFSMaze(
            this.maze,
            this.width,
            this.height,
            this.virusCore,
            this.rng,
            this.isVirusCoreArea
        );

        // Add extra paths for variety
        addExtraPaths(
            this.maze,
            this.width,
            this.height,
            this.config.pathDensity,
            this.rng,
            this.isVirusCoreArea
        );

        // Apply circuit-style aesthetics
        applyCircuitAesthetics(
            this.maze,
            this.width,
            this.height,
            this.rng,
            this.isVirusCoreArea
        );

        // Apply cellular automata if configured
        if (this.config.cellularAutomataIterations > 0) {
            applyCellularAutomata(
                this.maze,
                this.width,
                this.height,
                this.config.cellularAutomataIterations,
                this.isVirusCoreArea
            );
        }

        // Apply symmetry
        applySymmetry(
            this.maze,
            this.width,
            this.height,
            this.config.symmetry,
            this.isVirusCoreArea
        );

        // Create warp tunnel
        createWarpTunnel(this.maze, this.width, this.height, this.config.tunnelRow);

        // Adjust spawn points to valid positions
        this.adjustSpawnPoints();

        // Place power pellets
        this.placePowerPellets();

        // Place pellets
        this.pelletGrid = placePellets(
            this.maze,
            this.width,
            this.height,
            this.spawnPoints.powerPellets
        );

        // Calculate statistics
        Object.assign(this.stats, calculateStats(this.maze, this.width, this.height));

        // Validate maze
        const validationResult = this.performValidation();

        return {
            maze: this.maze,
            pelletGrid: this.pelletGrid,
            spawnPoints: this.spawnPoints,
            stats: { ...this.stats },
            validationResult
        };
    }

    /**
     * Adjusts spawn points to nearest valid positions
     */
    adjustSpawnPoints() {
        // Adjust player spawn
        const validPlayerSpawn = findNearestValidSpawn(
            this.spawnPoints.player.x,
            this.spawnPoints.player.y,
            this.maze
        );
        if (validPlayerSpawn) {
            this.spawnPoints.player = validPlayerSpawn;
        }

        // Adjust ghost spawns
        for (const ghostType of Object.keys(this.spawnPoints.ghosts)) {
            const ghost = this.spawnPoints.ghosts[ghostType];
            const validGhostSpawn = findNearestValidSpawn(
                ghost.x,
                ghost.y,
                this.maze
            );
            if (validGhostSpawn) {
                this.spawnPoints.ghosts[ghostType] = validGhostSpawn;
            }
        }

        // Adjust power pellet positions
        for (let i = 0; i < this.spawnPoints.powerPellets.length; i++) {
            const pp = this.spawnPoints.powerPellets[i];
            const validPP = findNearestValidSpawn(pp.x, pp.y, this.maze);
            if (validPP) {
                this.spawnPoints.powerPellets[i] = validPP;
            }
        }
    }

    /**
     * Places power pellets at spawn positions
     */
    placePowerPellets() {
        for (const pp of this.spawnPoints.powerPellets) {
            if (pp.x >= 0 && pp.x < this.width && pp.y >= 0 && pp.y < this.height) {
                this.maze[pp.y][pp.x] = TILE_TYPES.PATH;
            }
        }
    }

    /**
     * Performs maze validation using validation module
     */
    performValidation() {
        return validateMaze(
            this.maze,
            this.width,
            this.height,
            this.spawnPoints,
            {
                minAlternativePaths: this.config.minAlternativePaths,
                deadEndDensityThreshold: this.config.deadEndDensityThreshold,
                maxStraightCorridorLength: this.config.maxStraightCorridorLength,
                spawnSafetyRadius: this.config.spawnSafetyRadius,
                spawnSafetyMinFreedomSteps: this.config.spawnSafetyMinFreedomSteps,
                stats: this.stats
            }
        );
    }

    /**
     * Static generation method
     */
    static generate(config = {}) {
        const generator = new MazeGenerator(config);
        return generator.generate();
    }

    /**
     * Counts path tiles in maze (exposed for compatibility)
     */
    countPathTilesInMaze(maze) {
        return countPathTilesInMaze(maze);
    }
}
