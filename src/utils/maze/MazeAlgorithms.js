/**
 * MazeAlgorithms
 * Core maze generation algorithms (DFS, Cellular Automata)
 */

import { TILE_TYPES } from '../MazeLayout.js';

/**
 * Carves paths through maze using DFS algorithm
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {object} virusCore - Virus core configuration
 * @param {function} rng - Seeded random number generator
 * @param {function} isVirusCoreArea - Function to check if position is in virus core
 */
export function carveDFSMaze(maze, width, height, virusCore, rng, _isVirusCoreArea) {
    const startX = 1;
    const startY = 1;

    const visited = [];
    for (let y = 0; y < height; y++) {
        visited.push(new Array(width).fill(false));
    }

    carvePath(startX, startY, maze, width, height, visited, virusCore, rng);
}

/**
 * Recursive path carving for DFS maze generation
 */
function carvePath(x, y, maze, width, height, visited, virusCore, rng) {
    visited[y][x] = true;
    maze[y][x] = TILE_TYPES.PATH;

    const directions = [
        { x: 0, y: -2 },
        { x: 0, y: 2 },
        { x: -2, y: 0 },
        { x: 2, y: 0 }
    ];

    shuffleArray(directions, rng);

    for (const dir of directions) {
        const newX = x + dir.x;
        const newY = y + dir.y;
        const wallX = x + dir.x / 2;
        const wallY = y + dir.y / 2;

        if (
            newX > 0 &&
            newX < width - 1 &&
            newY > 0 &&
            newY < height - 1 &&
            !visited[newY][newX] &&
            maze[newY][newX] !== TILE_TYPES.VIRUS_CORE &&
            maze[newY][newX] !== TILE_TYPES.VIRUS_CORE_DOOR
        ) {
            if (
                wallY >= 0 &&
                wallY < height &&
                wallX >= 0 &&
                wallX < width
            ) {
                maze[wallY][wallX] = TILE_TYPES.PATH;
            }

            carvePath(newX, newY, maze, width, height, visited, virusCore, rng);
        }
    }
}

/**
 * Adds extra paths to increase maze complexity
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {number} pathDensity - Density factor for extra paths
 * @param {function} rng - Seeded random number generator
 * @param {function} isVirusCoreArea - Function to check virus core area
 */
export function addExtraPaths(maze, width, height, pathDensity, rng, isVirusCoreArea) {
    const numExtraPaths = Math.floor(
        (width * height * pathDensity) / 10
    );

    for (let i = 0; i < numExtraPaths; i++) {
        const x = Math.floor(rng() * (width - 2)) + 1;
        const y = Math.floor(rng() * (height - 2)) + 1;

        if (isVirusCoreArea(x, y)) {
            continue;
        }

        if (maze[y][x] !== TILE_TYPES.WALL) {
            continue;
        }

        const pathNeighbors = countPathNeighbors(maze, width, height, x, y);

        if (pathNeighbors >= 1 && pathNeighbors <= 3) {
            maze[y][x] = TILE_TYPES.PATH;
        }
    }
}

/**
 * Counts path neighbors for a given tile
 */
export function countPathNeighbors(maze, width, height, x, y) {
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
            newX < width &&
            newY >= 0 &&
            newY < height &&
            (maze[newY][newX] === TILE_TYPES.PATH ||
                maze[newY][newX] === TILE_TYPES.VIRUS_CORE ||
                maze[newY][newX] === TILE_TYPES.VIRUS_CORE_DOOR)
        ) {
            count++;
        }
    }

    return count;
}

/**
 * Applies cellular automata smoothing to the maze
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {number} iterations - Number of CA iterations
 * @param {function} isVirusCoreArea - Function to check virus core area
 */
export function applyCellularAutomata(maze, width, height, iterations, isVirusCoreArea) {
    let currentMaze = maze;

    for (let iter = 0; iter < iterations; iter++) {
        const newMaze = [];

        for (let y = 0; y < height; y++) {
            const newRow = [];
            for (let x = 0; x < width; x++) {
                if (isVirusCoreArea(x, y)) {
                    newRow.push(currentMaze[y][x]);
                    continue;
                }

                const tile = currentMaze[y][x];
                const neighbors = countPathNeighbors(currentMaze, width, height, x, y);

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

        currentMaze = newMaze;
    }

    // Copy results back to original maze
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            maze[y][x] = currentMaze[y][x];
        }
    }
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @param {function} rng - Seeded random number generator
 */
export function shuffleArray(array, rng) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
