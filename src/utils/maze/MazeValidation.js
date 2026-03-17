/**
 * MazeValidation
 * Comprehensive maze validation utilities
 */

import { isWalkableTile } from '../MazeLayout.js';

/**
 * Validates complete maze configuration
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {object} spawnPoints - Player and ghost spawn points
 * @param {object} config - Validation configuration
 * @returns {object} Validation result {isValid, message}
 */
export function validateMaze(maze, width, height, spawnPoints, config) {
    // Validate player spawn
    if (!isWalkableTile(maze, spawnPoints.player.x, spawnPoints.player.y)) {
        return { isValid: false, message: 'Player spawn point is invalid' };
    }

    // Validate ghost spawns
    for (const ghostType of Object.keys(spawnPoints.ghosts)) {
        const ghost = spawnPoints.ghosts[ghostType];
        if (!isWalkableTile(maze, ghost.x, ghost.y)) {
            return {
                isValid: false,
                message: `Ghost ${ghostType} spawn point is invalid`
            };
        }
    }

    // Check connectivity
    const connectivity = checkConnectivity(maze, width, height, spawnPoints.player);
    if (!connectivity.isValid) {
        return { isValid: false, message: 'Not all areas are connected' };
    }

    // Validate alternative paths
    const alternativePathValidation = validateAlternativePaths(
        maze, width, height, spawnPoints, config.minAlternativePaths
    );
    if (!alternativePathValidation.isValid) {
        return alternativePathValidation;
    }

    // Validate dead-end density
    const deadEndValidation = validateDeadEndDensity(
        maze, width, height,
        config.deadEndDensityThreshold,
        config.stats.deadEnds
    );
    if (!deadEndValidation.isValid) {
        return deadEndValidation;
    }

    // Validate corridor length
    const corridorValidation = validateCorridorLength(
        maze, width, height,
        config.maxStraightCorridorLength
    );
    if (!corridorValidation.isValid) {
        return corridorValidation;
    }

    // Validate spawn safety zone
    const spawnSafetyValidation = validateSpawnSafetyZone(
        maze, width, height,
        spawnPoints.player,
        config.spawnSafetyRadius,
        config.spawnSafetyMinFreedomSteps
    );
    if (!spawnSafetyValidation.isValid) {
        return spawnSafetyValidation;
    }

    return { isValid: true, message: 'Maze is valid' };
}

/**
 * Checks maze connectivity using flood fill
 */
export function checkConnectivity(maze, width, height, playerSpawn) {
    const visited = [];
    for (let y = 0; y < height; y++) {
        visited.push(new Array(width).fill(false));
    }

    floodFill(maze, width, height, playerSpawn.x, playerSpawn.y, visited);

    let totalWalkable = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (isWalkableTile(maze, x, y)) {
                totalWalkable++;
            }
        }
    }

    let visitedWalkable = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (visited[y][x] && isWalkableTile(maze, x, y)) {
                visitedWalkable++;
            }
        }
    }

    const coverage = totalWalkable > 0 ? visitedWalkable / totalWalkable : 0;
    return {
        isValid: coverage >= 1.0,
        coverage
    };
}

/**
 * Validates that there are enough alternative paths
 */
export function validateAlternativePaths(maze, width, height, spawnPoints, minAlternativePaths) {
    const keyTargets = [
        ...Object.values(spawnPoints.ghosts),
        ...spawnPoints.powerPellets
    ];

    const requiredPaths = minAlternativePaths + 1;
    for (const target of keyTargets) {
        const pathCount = countEdgeDisjointPaths(
            maze, width, height,
            spawnPoints.player,
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

/**
 * Validates dead-end density is within threshold
 */
export function validateDeadEndDensity(maze, width, height, threshold, deadEndCount) {
    const walkableTiles = countWalkableTiles(maze, width, height);
    const deadEndDensity = walkableTiles > 0 ? deadEndCount / walkableTiles : 1;

    if (deadEndDensity > threshold) {
        return {
            isValid: false,
            message: `Dead-end density too high (${deadEndDensity.toFixed(3)})`
        };
    }

    return { isValid: true };
}

/**
 * Validates corridor lengths
 */
export function validateCorridorLength(maze, width, height, maxLength) {
    const maxLen = findMaxStraightCorridorLength(maze, width, height);
    if (maxLen > maxLength) {
        return {
            isValid: false,
            message: `Straight corridor too long (${maxLen})`
        };
    }

    return { isValid: true };
}

/**
 * Validates spawn safety zone has enough freedom
 */
export function validateSpawnSafetyZone(maze, width, height, playerSpawn, radius, minFreedomSteps) {
    let freeTiles = 0;

    for (let y = playerSpawn.y - radius; y <= playerSpawn.y + radius; y++) {
        for (let x = playerSpawn.x - radius; x <= playerSpawn.x + radius; x++) {
            if (x < 0 || y < 0 || x >= width || y >= height) {
                continue;
            }

            if (Math.abs(x - playerSpawn.x) + Math.abs(y - playerSpawn.y) > radius) {
                continue;
            }

            if (isWalkableTile(maze, x, y)) {
                freeTiles++;
            }
        }
    }

    const reachableSteps = countReachableTilesWithinSteps(
        maze, width, height,
        playerSpawn,
        minFreedomSteps
    );

    if (freeTiles < 5) {
        return {
            isValid: false,
            message: `Spawn safety zone too tight (walkable in radius=${freeTiles})`
        };
    }

    if (reachableSteps < minFreedomSteps) {
        return {
            isValid: false,
            message: `Insufficient early freedom near spawn (${reachableSteps}/${minFreedomSteps})`
        };
    }

    return { isValid: true };
}

/**
 * Flood fill algorithm for connectivity checking
 */
export function floodFill(maze, width, height, startX, startY, visited) {
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
        const { x, y } = stack.pop();

        if (
            x < 0 ||
            x >= width ||
            y < 0 ||
            y >= height ||
            visited[y][x]
        ) {
            continue;
        }

        if (!isWalkableTile(maze, x, y)) {
            continue;
        }

        visited[y][x] = true;

        stack.push({ x: x + 1, y: y });
        stack.push({ x: x - 1, y: y });
        stack.push({ x: x, y: y + 1 });
        stack.push({ x: x, y: y - 1 });
    }
}

/**
 * Counts walkable tiles in maze
 */
export function countWalkableTiles(maze, width, height) {
    let count = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (isWalkableTile(maze, x, y)) {
                count++;
            }
        }
    }
    return count;
}

/**
 * Counts edge-disjoint paths between two points
 */
export function countEdgeDisjointPaths(maze, width, height, start, end, maxPaths) {
    const blockedEdges = new Set();
    let pathCount = 0;

    for (let i = 0; i < maxPaths; i++) {
        const path = findShortestPath(maze, width, height, start, end, blockedEdges);
        if (!path) {
            break;
        }

        pathCount++;
        for (let idx = 0; idx < path.length - 1; idx++) {
            const a = path[idx];
            const b = path[idx + 1];
            blockedEdges.add(edgeKey(a, b));
            blockedEdges.add(edgeKey(b, a));
        }
    }

    return pathCount;
}

/**
 * Finds shortest path using BFS
 */
export function findShortestPath(maze, width, height, start, end, blockedEdges = new Set()) {
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
            return reconstructPath(parents, start, end);
        }

        for (const dir of directions) {
            const nx = current.x + dir.x;
            const ny = current.y + dir.y;
            const key = `${nx},${ny}`;

            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
                continue;
            }

            if (!isWalkableTile(maze, nx, ny) || visited.has(key)) {
                continue;
            }

            if (blockedEdges.has(edgeKey(current, { x: nx, y: ny }))) {
                continue;
            }

            visited.add(key);
            parents.set(key, current);
            queue.push({ x: nx, y: ny });
        }
    }

    return null;
}

/**
 * Reconstructs path from parent map
 */
function reconstructPath(parents, start, end) {
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

/**
 * Creates edge key for pathfinding
 */
function edgeKey(a, b) {
    return `${a.x},${a.y}->${b.x},${b.y}`;
}

/**
 * Counts reachable tiles within N steps
 */
export function countReachableTilesWithinSteps(maze, width, height, start, maxSteps) {
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

            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
                continue;
            }

            if (visited.has(key) || !isWalkableTile(maze, nx, ny)) {
                continue;
            }

            visited.add(key);
            queue.push({ x: nx, y: ny, steps: current.steps + 1 });
        }
    }

    return reachable;
}

/**
 * Finds maximum straight corridor length
 */
export function findMaxStraightCorridorLength(maze, width, height) {
    let maxLength = 0;

    // Check horizontal corridors
    for (let y = 1; y < height - 1; y++) {
        let run = 0;
        for (let x = 1; x < width - 1; x++) {
            if (isHorizontalCorridorTile(maze, x, y)) {
                run++;
                maxLength = Math.max(maxLength, run);
            } else {
                run = 0;
            }
        }
    }

    // Check vertical corridors
    for (let x = 1; x < width - 1; x++) {
        let run = 0;
        for (let y = 1; y < height - 1; y++) {
            if (isVerticalCorridorTile(maze, x, y)) {
                run++;
                maxLength = Math.max(maxLength, run);
            } else {
                run = 0;
            }
        }
    }

    return maxLength;
}

/**
 * Checks if tile is part of horizontal corridor
 */
function isHorizontalCorridorTile(maze, x, y) {
    if (!isWalkableTile(maze, x, y)) {
        return false;
    }

    return (
        isWalkableTile(maze, x - 1, y) &&
        isWalkableTile(maze, x + 1, y) &&
        !isWalkableTile(maze, x, y - 1) &&
        !isWalkableTile(maze, x, y + 1)
    );
}

/**
 * Checks if tile is part of vertical corridor
 */
function isVerticalCorridorTile(maze, x, y) {
    if (!isWalkableTile(maze, x, y)) {
        return false;
    }

    return (
        isWalkableTile(maze, x, y - 1) &&
        isWalkableTile(maze, x, y + 1) &&
        !isWalkableTile(maze, x - 1, y) &&
        !isWalkableTile(maze, x + 1, y)
    );
}
