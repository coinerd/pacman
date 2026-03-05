/**
 * MazeGenerator
 * Procedural circuit-style maze generation using DFS algorithm
 * Creates playable mazes with valid spawn points and connectivity
 */

import { gameConfig } from '../config/gameConfig.js';
import {
    getTileType,
    getValidDirections,
    isWalkableTile,
    isWall,
    PELLET_TYPES,
    TILE_TYPES
} from './MazeLayout.js';
import { findNearestValidSpawn, validateSpawnPoint } from './SpawnValidator.js';

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

        this.stats = {
            pathTiles: 0,
            wallTiles: 0,
            deadEnds: 0,
            generatedTime: 0
        };
    }

    createSeededRNG(seed) {
        let s = seed;
        return () => {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
    }

    generate() {
        return this.generateWithRetries();
    }

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

        const fallbackSeed = this.seed + this.config.fallbackSeedOffset;
        this.rng = this.createSeededRNG(fallbackSeed);
        lastResult = this.generateSingleAttempt();
        if (!lastResult.validationResult.isValid) {
            console.warn(`Maze fallback warning: ${lastResult.validationResult.message}`);
            this.fixConnectivity();
            this.placePellets();
            this.calculateStats();
        }

        lastResult.validationResult = this.validateMaze();
        lastResult.stats.generatedTime = performance.now() - startTime;
        lastResult.stats.retries = maxRetries;
        lastResult.stats.finalSeed = fallbackSeed;
        lastResult.stats.fallbackUsed = true;

        return lastResult;
    }

    generateSingleAttempt() {
        this.initializeMaze();
        this.generateVirusCore();

        if (!this.maze || this.maze.length === 0) {
            console.warn('Maze not properly initialized after virus core generation');
            this.initializeMaze();
        }

        this.generateDFSMaze();
        this.applyCircuitAesthetics();

        if (this.config.cellularAutomataIterations > 0) {
            this.applyCellularAutomata(this.config.cellularAutomataIterations);
        }

        this.applySymmetry();
        this.createWarpTunnel();
        this.adjustSpawnPoints();
        this.placePowerPellets();

        this.placePellets();
        this.calculateStats();

        const validationResult = this.validateMaze();

        return {
            maze: this.maze,
            pelletGrid: this.pelletGrid,
            spawnPoints: this.spawnPoints,
            stats: { ...this.stats },
            validationResult
        };
    }

    initializeMaze() {
        this.maze = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(TILE_TYPES.WALL);
            }
            this.maze.push(row);
        }
    }

    generateVirusCore() {
        const coreWidth = 4;
        const coreHeight = 2;
        const startX = this.virusCore.center.x - Math.floor(coreWidth / 2);
        const startY = this.virusCore.center.y - Math.floor(coreHeight / 2);

        for (let dy = 0; dy < coreHeight; dy++) {
            for (let dx = 0; dx < coreWidth; dx++) {
                const x = startX + dx;
                const y = startY + dy;

                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    if (dy === coreHeight - 1) {
                        this.maze[y][x] = TILE_TYPES.VIRUS_CORE_DOOR;
                    } else {
                        this.maze[y][x] = TILE_TYPES.VIRUS_CORE;
                    }
                }
            }
        }

        const entranceX = this.virusCore.entrance.x;
        const entranceY = this.virusCore.entrance.y;

        if (entranceY >= 0 && entranceY < this.height) {
            this.maze[entranceY][entranceX] = TILE_TYPES.VIRUS_CORE_DOOR;

            for (let y = entranceY + 1; y < startY; y++) {
                if (y >= 0 && y < this.height) {
                    this.maze[y][entranceX] = TILE_TYPES.PATH;
                }
            }
        }
    }

    generateDFSMaze() {
        const startX = 1;
        const startY = 1;

        const visited = [];
        for (let y = 0; y < this.height; y++) {
            visited.push(new Array(this.width).fill(false));
        }

        this.carvePath(startX, startY, visited);
        this.addExtraPaths();
    }

    carvePath(x, y, visited) {
        visited[y][x] = true;
        this.maze[y][x] = TILE_TYPES.PATH;

        const directions = [
            { x: 0, y: -2 },
            { x: 0, y: 2 },
            { x: -2, y: 0 },
            { x: 2, y: 0 }
        ];

        this.shuffleArray(directions);

        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            const wallX = x + dir.x / 2;
            const wallY = y + dir.y / 2;

            if (
                newX > 0 &&
				newX < this.width - 1 &&
				newY > 0 &&
				newY < this.height - 1 &&
				!visited[newY][newX] &&
				this.maze[newY][newX] !== TILE_TYPES.VIRUS_CORE &&
				this.maze[newY][newX] !== TILE_TYPES.VIRUS_CORE_DOOR
            ) {
                if (
                    wallY >= 0 &&
					wallY < this.height &&
					wallX >= 0 &&
					wallX < this.width
                ) {
                    this.maze[wallY][wallX] = TILE_TYPES.PATH;
                }

                this.carvePath(newX, newY, visited);
            }
        }
    }

    addExtraPaths() {
        const numExtraPaths = Math.floor(
            (this.width * this.height * this.config.pathDensity) / 10
        );

        for (let i = 0; i < numExtraPaths; i++) {
            const x = Math.floor(this.rng() * (this.width - 2)) + 1;
            const y = Math.floor(this.rng() * (this.height - 2)) + 1;

            if (this.isVirusCoreArea(x, y)) {
                continue;
            }

            if (this.maze[y][x] !== TILE_TYPES.WALL) {
                continue;
            }

            const pathNeighbors = this.countPathNeighbors(x, y);

            if (pathNeighbors >= 1 && pathNeighbors <= 3) {
                this.maze[y][x] = TILE_TYPES.PATH;
            }
        }
    }

    countPathNeighbors(x, y) {
        let count = 0;
        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];

        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;

            if (
                newX >= 0 &&
				newX < this.width &&
				newY >= 0 &&
				newY < this.height &&
				(this.maze[newY][newX] === TILE_TYPES.PATH ||
					this.maze[newY][newX] === TILE_TYPES.VIRUS_CORE ||
					this.maze[newY][newX] === TILE_TYPES.VIRUS_CORE_DOOR)
            ) {
                count++;
            }
        }

        return count;
    }

    isVirusCoreArea(x, y) {
        const coreWidth = 4;
        const coreHeight = 2;
        const startX = this.virusCore.center.x - Math.floor(coreWidth / 2);
        const startY = this.virusCore.center.y - Math.floor(coreHeight / 2);

        return (
            x >= startX &&
			x < startX + coreWidth &&
			y >= startY &&
			y < startY + coreHeight
        );
    }

    applyCircuitAesthetics() {
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.isVirusCoreArea(x, y)) {
                    continue;
                }

                const tile = this.maze[y][x];
                if (tile !== TILE_TYPES.PATH) {
                    continue;
                }

                const neighbors = this.countPathNeighbors(x, y);

                if (neighbors >= 3) {
                    this.fixIntersection(x, y);
                }
            }
        }
    }

    fixIntersection(x, y) {
        const directions = [
            { x: 0, y: -1, name: 'up' },
            { x: 0, y: 1, name: 'down' },
            { x: -1, y: 0, name: 'left' },
            { x: 1, y: 0, name: 'right' }
        ];

        const pathNeighbors = [];
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;

            if (
                newX >= 0 &&
				newX < this.width &&
				newY >= 0 &&
				newY < this.height &&
				this.maze[newY][newX] === TILE_TYPES.PATH
            ) {
                pathNeighbors.push({ x: newX, y: newY, dir: dir.name });
            }
        }

        if (pathNeighbors.length > 3) {
            const removeIndex = Math.floor(this.rng() * pathNeighbors.length);
            const remove = pathNeighbors[removeIndex];
            this.maze[remove.y][remove.x] = TILE_TYPES.WALL;
        }
    }

    applyCellularAutomata(iterations) {
        for (let iter = 0; iter < iterations; iter++) {
            const newMaze = [];

            for (let y = 0; y < this.height; y++) {
                const newRow = [];
                for (let x = 0; x < this.width; x++) {
                    if (this.isVirusCoreArea(x, y)) {
                        newRow.push(this.maze[y][x]);
                        continue;
                    }

                    const tile = this.maze[y][x];
                    const neighbors = this.countPathNeighbors(x, y);

                    if (tile === TILE_TYPES.WALL) {
                        if (neighbors >= 6) {
                            newRow.push(TILE_TYPES.PATH);
                        } else {
                            newRow.push(TILE_TYPES.WALL);
                        }
                    } else {
                        if (neighbors >= 3) {
                            newRow.push(TILE_TYPES.PATH);
                        } else {
                            newRow.push(TILE_TYPES.WALL);
                        }
                    }
                }
                newMaze.push(newRow);
            }

            this.maze = newMaze;
        }
    }

    applySymmetry() {
        if (this.config.symmetry === 'none') {
            return;
        }

        const halfHeight = Math.floor(this.height / 2);

        if (this.config.symmetry === 'horizontal') {
            for (let y = 0; y < halfHeight; y++) {
                const mirrorY = this.height - 1 - y;
                for (let x = 0; x < this.width; x++) {
                    if (this.isVirusCoreArea(x, mirrorY)) {
                        continue;
                    }
                    this.maze[mirrorY][x] = this.maze[y][x];
                }
            }
        } else if (this.config.symmetry === 'vertical') {
            const halfWidth = Math.floor(this.width / 2);
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < halfWidth; x++) {
                    const mirrorX = this.width - 1 - x;
                    if (this.isVirusCoreArea(mirrorX, y)) {
                        continue;
                    }
                    this.maze[y][mirrorX] = this.maze[y][x];
                }
            }
        } else if (this.config.symmetry === 'radial') {
            const halfHeight = Math.floor(this.height / 2);
            const halfWidth = Math.floor(this.width / 2);

            for (let y = 0; y < halfHeight; y++) {
                const mirrorY = this.height - 1 - y;
                for (let x = 0; x < halfWidth; x++) {
                    const mirrorX = this.width - 1 - x;

                    if (this.isVirusCoreArea(mirrorX, mirrorY)) {
                        continue;
                    }

                    this.maze[y][mirrorX] = this.maze[y][x];
                    this.maze[mirrorY][x] = this.maze[y][x];
                    this.maze[mirrorY][mirrorX] = this.maze[y][x];
                }
            }
        }
    }

    createWarpTunnel() {
        const tunnelRow = this.config.tunnelRow;

        if (tunnelRow < 0 || tunnelRow >= this.height) {
            return;
        }

        this.maze[tunnelRow][0] = TILE_TYPES.PATH;
        this.maze[tunnelRow][this.width - 1] = TILE_TYPES.PATH;
    }

    adjustSpawnPoints() {
        const validPlayerSpawn = findNearestValidSpawn(
            this.spawnPoints.player.x,
            this.spawnPoints.player.y,
            this.maze
        );
        if (validPlayerSpawn) {
            this.spawnPoints.player = validPlayerSpawn;
        }

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

        for (let i = 0; i < this.spawnPoints.powerPellets.length; i++) {
            const pp = this.spawnPoints.powerPellets[i];
            const validPP = findNearestValidSpawn(pp.x, pp.y, this.maze);
            if (validPP) {
                this.spawnPoints.powerPellets[i] = validPP;
            }
        }
    }

    placePowerPellets() {
        for (const pp of this.spawnPoints.powerPellets) {
            if (pp.x >= 0 && pp.x < this.width && pp.y >= 0 && pp.y < this.height) {
                this.maze[pp.y][pp.x] = TILE_TYPES.PATH;
            }
        }
    }

    placePellets() {
        this.pelletGrid = [];

        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                const tile = this.maze[y][x];

                if (tile === TILE_TYPES.WALL) {
                    row.push(PELLET_TYPES.NONE);
                    continue;
                }

                if (
                    tile === TILE_TYPES.VIRUS_CORE ||
					tile === TILE_TYPES.VIRUS_CORE_DOOR
                ) {
                    row.push(PELLET_TYPES.NONE);
                    continue;
                }

                const isPowerPellet = this.spawnPoints.powerPellets.some(
                    (pp) => pp.x === x && pp.y === y
                );

                if (isPowerPellet) {
                    row.push(PELLET_TYPES.POWER_PELLET);
                } else {
                    row.push(PELLET_TYPES.PELLET);
                }
            }
            this.pelletGrid.push(row);
        }
    }

    validateMaze() {
        if (
            !validateSpawnPoint(
                this.spawnPoints.player.x,
                this.spawnPoints.player.y,
                this.maze
            )
        ) {
            return { isValid: false, message: 'Player spawn point is invalid' };
        }

        for (const ghostType of Object.keys(this.spawnPoints.ghosts)) {
            const ghost = this.spawnPoints.ghosts[ghostType];
            if (!validateSpawnPoint(ghost.x, ghost.y, this.maze)) {
                return {
                    isValid: false,
                    message: `Ghost ${ghostType} spawn point is invalid`
                };
            }
        }

        const connectivity = this.checkConnectivity();
        if (!connectivity.isValid) {
            return { isValid: false, message: 'Not all areas are connected' };
        }

        const alternativePathValidation = this.validateAlternativePaths();
        if (!alternativePathValidation.isValid) {
            return alternativePathValidation;
        }

        const deadEndValidation = this.validateDeadEndDensity();
        if (!deadEndValidation.isValid) {
            return deadEndValidation;
        }

        const corridorValidation = this.validateCorridorLength();
        if (!corridorValidation.isValid) {
            return corridorValidation;
        }

        const spawnSafetyValidation = this.validateSpawnSafetyZone();
        if (!spawnSafetyValidation.isValid) {
            return spawnSafetyValidation;
        }

        return { isValid: true, message: 'Maze is valid' };
    }

    checkConnectivity() {
        const visited = [];
        for (let y = 0; y < this.height; y++) {
            visited.push(new Array(this.width).fill(false));
        }

        this.floodFill(
            this.spawnPoints.player.x,
            this.spawnPoints.player.y,
            visited
        );

        let totalWalkable = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (isWalkableTile(this.maze, x, y)) {
                    totalWalkable++;
                }
            }
        }

        let visitedWalkable = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (visited[y][x] && isWalkableTile(this.maze, x, y)) {
                    visitedWalkable++;
                }
            }
        }

        const coverage = totalWalkable > 0 ? visitedWalkable / totalWalkable : 0;
        return {
            isValid: coverage >= this.config.minConnectivityCoverage,
            coverage
        };
    }

    validateAlternativePaths() {
        const keyTargets = [
            ...Object.values(this.spawnPoints.ghosts),
            ...this.spawnPoints.powerPellets
        ];

        const requiredPaths = this.config.minAlternativePaths + 1;
        for (const target of keyTargets) {
            const pathCount = this.countEdgeDisjointPaths(
                this.spawnPoints.player,
                target,
                requiredPaths
            );

            if (pathCount < requiredPaths) {
                return {
                    isValid: false,
                    message: `Not enough alternative paths to ${target.x},${target.y} (required=${requiredPaths}, got=${pathCount})`
                };
            }
        }

        return { isValid: true };
    }

    validateDeadEndDensity() {
        const walkableTiles = this.countWalkableTiles();
        const deadEndDensity = walkableTiles > 0 ? this.stats.deadEnds / walkableTiles : 1;

        if (deadEndDensity > this.config.deadEndDensityThreshold) {
            return {
                isValid: false,
                message: `Dead-end density too high (${deadEndDensity.toFixed(3)})`
            };
        }

        return { isValid: true };
    }

    validateCorridorLength() {
        const maxLen = this.findMaxStraightCorridorLength();
        if (maxLen > this.config.maxStraightCorridorLength) {
            return {
                isValid: false,
                message: `Straight corridor too long (${maxLen})`
            };
        }

        return { isValid: true };
    }

    validateSpawnSafetyZone() {
        const player = this.spawnPoints.player;
        const radius = this.config.spawnSafetyRadius;
        let freeTiles = 0;

        for (let y = player.y - radius; y <= player.y + radius; y++) {
            for (let x = player.x - radius; x <= player.x + radius; x++) {
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                    continue;
                }

                if (Math.abs(x - player.x) + Math.abs(y - player.y) > radius) {
                    continue;
                }

                if (isWalkableTile(this.maze, x, y)) {
                    freeTiles++;
                }
            }
        }

        const reachableSteps = this.countReachableTilesWithinSteps(
            player,
            this.config.spawnSafetyMinFreedomSteps
        );

        if (freeTiles < 5) {
            return {
                isValid: false,
                message: `Spawn safety zone too tight (walkable in radius=${freeTiles})`
            };
        }

        if (reachableSteps < this.config.spawnSafetyMinFreedomSteps) {
            return {
                isValid: false,
                message: `Insufficient early freedom near spawn (${reachableSteps}/${this.config.spawnSafetyMinFreedomSteps})`
            };
        }

        return { isValid: true };
    }

    countWalkableTiles() {
        let count = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (isWalkableTile(this.maze, x, y)) {
                    count++;
                }
            }
        }
        return count;
    }

    countEdgeDisjointPaths(start, end, maxPaths) {
        const blockedEdges = new Set();
        let pathCount = 0;

        for (let i = 0; i < maxPaths; i++) {
            const path = this.findShortestPath(start, end, blockedEdges);
            if (!path) {
                break;
            }

            pathCount++;
            for (let idx = 0; idx < path.length - 1; idx++) {
                const a = path[idx];
                const b = path[idx + 1];
                blockedEdges.add(this.edgeKey(a, b));
                blockedEdges.add(this.edgeKey(b, a));
            }
        }

        return pathCount;
    }

    findShortestPath(start, end, blockedEdges = new Set()) {
        const queue = [start];
        const visited = new Set([`${start.x},${start.y}`]);
        const parents = new Map();
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(parents, start, end);
            }

            for (const dir of directions) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                const key = `${nx},${ny}`;

                if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) {
                    continue;
                }

                if (!isWalkableTile(this.maze, nx, ny) || visited.has(key)) {
                    continue;
                }

                if (blockedEdges.has(this.edgeKey(current, { x: nx, y: ny }))) {
                    continue;
                }

                visited.add(key);
                parents.set(key, current);
                queue.push({ x: nx, y: ny });
            }
        }

        return null;
    }

    reconstructPath(parents, start, end) {
        const path = [{ x: end.x, y: end.y }];
        let cursor = { x: end.x, y: end.y };

        while (!(cursor.x === start.x && cursor.y === start.y)) {
            const parent = parents.get(`${cursor.x},${cursor.y}`);
            if (!parent) {
                return null;
            }
            path.push({ x: parent.x, y: parent.y });
            cursor = parent;
        }

        return path.reverse();
    }

    edgeKey(a, b) {
        return `${a.x},${a.y}->${b.x},${b.y}`;
    }

    countReachableTilesWithinSteps(start, maxSteps) {
        const queue = [{ ...start, steps: 0 }];
        const visited = new Set([`${start.x},${start.y}`]);
        let reachable = 0;
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            reachable++;

            if (current.steps >= maxSteps) {
                continue;
            }

            for (const dir of directions) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                const key = `${nx},${ny}`;

                if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) {
                    continue;
                }

                if (visited.has(key) || !isWalkableTile(this.maze, nx, ny)) {
                    continue;
                }

                visited.add(key);
                queue.push({ x: nx, y: ny, steps: current.steps + 1 });
            }
        }

        return reachable;
    }

    findMaxStraightCorridorLength() {
        let maxLength = 0;

        for (let y = 1; y < this.height - 1; y++) {
            let run = 0;
            for (let x = 1; x < this.width - 1; x++) {
                if (this.isHorizontalCorridorTile(x, y)) {
                    run++;
                    maxLength = Math.max(maxLength, run);
                } else {
                    run = 0;
                }
            }
        }

        for (let x = 1; x < this.width - 1; x++) {
            let run = 0;
            for (let y = 1; y < this.height - 1; y++) {
                if (this.isVerticalCorridorTile(x, y)) {
                    run++;
                    maxLength = Math.max(maxLength, run);
                } else {
                    run = 0;
                }
            }
        }

        return maxLength;
    }

    isHorizontalCorridorTile(x, y) {
        if (!isWalkableTile(this.maze, x, y)) {
            return false;
        }

        return (
            isWalkableTile(this.maze, x - 1, y) &&
            isWalkableTile(this.maze, x + 1, y) &&
            !isWalkableTile(this.maze, x, y - 1) &&
            !isWalkableTile(this.maze, x, y + 1)
        );
    }

    isVerticalCorridorTile(x, y) {
        if (!isWalkableTile(this.maze, x, y)) {
            return false;
        }

        return (
            isWalkableTile(this.maze, x, y - 1) &&
            isWalkableTile(this.maze, x, y + 1) &&
            !isWalkableTile(this.maze, x - 1, y) &&
            !isWalkableTile(this.maze, x + 1, y)
        );
    }

    floodFill(startX, startY, visited) {
        const stack = [{ x: startX, y: startY }];

        while (stack.length > 0) {
            const { x, y } = stack.pop();

            if (
                x < 0 ||
				x >= this.width ||
				y < 0 ||
				y >= this.height ||
				visited[y][x]
            ) {
                continue;
            }

            if (!isWalkableTile(this.maze, x, y)) {
                continue;
            }

            visited[y][x] = true;

            stack.push({ x: x + 1, y: y });
            stack.push({ x: x - 1, y: y });
            stack.push({ x: x, y: y + 1 });
            stack.push({ x: x, y: y - 1 });
        }
    }

    fixConnectivity() {
        const visited = [];
        for (let y = 0; y < this.height; y++) {
            visited.push(new Array(this.width).fill(false));
        }

        this.floodFill(
            this.spawnPoints.player.x,
            this.spawnPoints.player.y,
            visited
        );

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (
                    !visited[y][x] &&
					isWalkableTile(this.maze, x, y) &&
					!this.isVirusCoreArea(x, y)
                ) {
                    const nearest = this.findNearestVisitedPath(x, y, visited);

                    if (nearest) {
                        this.createPathTo(x, y, nearest.x, nearest.y);
                        visited[y][x] = true;
                    }
                }
            }
        }
    }

    findNearestVisitedPath(x, y, visited) {
        let nearest = null;
        let nearestDist = Infinity;

        for (let dy = -5; dy <= 5; dy++) {
            for (let dx = -5; dx <= 5; dx++) {
                const checkX = x + dx;
                const checkY = y + dy;

                if (
                    checkX >= 0 &&
					checkX < this.width &&
					checkY >= 0 &&
					checkY < this.height &&
					visited[checkY][checkX] &&
					isWalkableTile(this.maze, checkX, checkY)
                ) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    if (dist < nearestDist && dist > 0) {
                        nearestDist = dist;
                        nearest = { x: checkX, y: checkY };
                    }
                }
            }
        }

        return nearest;
    }

    createPathTo(x1, y1, x2, y2) {
        let x = x1;
        let y = y1;

        while (x < x2) {
            if (x >= 0 && x < this.width) {
                this.maze[y][x] = TILE_TYPES.PATH;
            }
            x += x < x2 ? 1 : -1;
        }

        while (y < y2) {
            if (y >= 0 && y < this.height) {
                this.maze[y][x] = TILE_TYPES.PATH;
            }
            y += y < y2 ? 1 : -1;
        }
    }

    calculateStats() {
        this.stats.pathTiles = 0;
        this.stats.wallTiles = 0;
        this.stats.deadEnds = 0;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.maze[y][x];

                if (tile === TILE_TYPES.PATH) {
                    this.stats.pathTiles++;

                    const neighbors = this.countPathNeighbors(x, y);
                    if (neighbors === 1) {
                        this.stats.deadEnds++;
                    }
                } else if (tile === TILE_TYPES.WALL) {
                    this.stats.wallTiles++;
                }
            }
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.rng() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    static generate(config = {}) {
        const generator = new MazeGenerator(config);
        return generator.generate();
    }

    countPathTilesInMaze(maze) {
        let count = 0;
        const height = maze.length;
        const width = maze[0] ? maze[0].length : 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (maze[y] && maze[y][x] === TILE_TYPES.PATH) {
                    count++;
                }
            }
        }
        return count;
    }
}
