/**
 * MazeUtils
 * Utility functions for maze operations
 */

import { TILE_TYPES, PELLET_TYPES, isWalkableTile } from '../MazeLayout.js';
import { floodFill } from './MazeValidation.js';
import { countPathNeighbors } from './MazeAlgorithms.js';

/**
 * Generates virus core area in maze
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {object} virusCore - Virus core configuration
 */
export function generateVirusCore(maze, width, height, virusCore) {
    const coreWidth = 4;
    const coreHeight = 2;
    const startX = virusCore.center.x - Math.floor(coreWidth / 2);
    const startY = virusCore.center.y - Math.floor(coreHeight / 2);

    for (let dy = 0; dy < coreHeight; dy++) {
        for (let dx = 0; dx < coreWidth; dx++) {
            const x = startX + dx;
            const y = startY + dy;

            if (x >= 0 && x < width && y >= 0 && y < height) {
                if (dy === coreHeight - 1) {
                    maze[y][x] = TILE_TYPES.VIRUS_CORE_DOOR;
                } else {
                    maze[y][x] = TILE_TYPES.VIRUS_CORE;
                }
            }
        }
    }

    const entranceX = virusCore.entrance.x;
    const entranceY = virusCore.entrance.y;

    if (entranceY >= 0 && entranceY < height) {
        maze[entranceY][entranceX] = TILE_TYPES.VIRUS_CORE_DOOR;

        for (let y = entranceY + 1; y < startY; y++) {
            if (y >= 0 && y < height) {
                maze[y][entranceX] = TILE_TYPES.PATH;
            }
        }
    }
}

/**
 * Creates virus core area checker function
 * @param {object} virusCore - Virus core configuration
 * @returns {function} Checker function
 */
export function createVirusCoreChecker(virusCore) {
    const coreWidth = 4;
    const coreHeight = 2;
    const startX = virusCore.center.x - Math.floor(coreWidth / 2);
    const startY = virusCore.center.y - Math.floor(coreHeight / 2);

    return function (x, y) {
        return (
            x >= startX &&
            x < startX + coreWidth &&
            y >= startY &&
            y < startY + coreHeight
        );
    };
}

/**
 * Places pellets in maze
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {Array} powerPelletPositions - Power pellet spawn positions
 * @returns {number[][]} Pellet grid
 */
export function placePellets(maze, width, height, powerPelletPositions) {
    const pelletGrid = [];

    for (let y = 0; y < height; y++) {
        const row = [];
        const mazeRow = maze[y];

        for (let x = 0; x < width; x++) {
            // Handle undefined or missing rows
            const tile = mazeRow ? mazeRow[x] : TILE_TYPES.WALL;

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

            const isPowerPellet = powerPelletPositions.some(
                (pp) => pp.x === x && pp.y === y
            );

            if (isPowerPellet) {
                row.push(PELLET_TYPES.POWER_PELLET);
            } else {
                row.push(PELLET_TYPES.PELLET);
            }
        }
        pelletGrid.push(row);
    }

    return pelletGrid;
}

/**
 * Calculates maze statistics
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @returns {object} Statistics object
 */
export function calculateStats(maze, width, height) {
    const stats = {
        pathTiles: 0,
        wallTiles: 0,
        deadEnds: 0
    };

    for (let y = 0; y < height; y++) {
        const mazeRow = maze[y];
        if (!mazeRow) {continue;}

        for (let x = 0; x < width; x++) {
            const tile = mazeRow[x];

            if (tile === TILE_TYPES.PATH) {
                stats.pathTiles++;

                const neighbors = countPathNeighbors(maze, width, height, x, y);
                if (neighbors === 1) {
                    stats.deadEnds++;
                }
            } else if (tile === TILE_TYPES.WALL) {
                stats.wallTiles++;
            }
        }
    }

    return stats;
}

/**
 * Fixes connectivity issues in maze
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {object} playerSpawn - Player spawn point
 * @param {function} isVirusCoreArea - Function to check virus core area
 */
export function fixConnectivity(maze, width, height, playerSpawn, isVirusCoreArea) {
    const visited = [];
    for (let y = 0; y < height; y++) {
        visited.push(new Array(width).fill(false));
    }

    floodFill(maze, width, height, playerSpawn.x, playerSpawn.y, visited);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (
                !visited[y][x] &&
                isWalkableTile(maze, x, y) &&
                !isVirusCoreArea(x, y)
            ) {
                const nearest = findNearestVisitedPath(maze, width, height, x, y, visited);

                if (nearest) {
                    createPathTo(maze, x, y, nearest.x, nearest.y);
                    visited[y][x] = true;
                }
            }
        }
    }
}

/**
 * Finds nearest visited path tile
 */
function findNearestVisitedPath(maze, width, height, x, y, visited) {
    let nearest = null;
    let nearestDist = Infinity;

    for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
            const checkX = x + dx;
            const checkY = y + dy;

            if (
                checkX >= 0 &&
                checkX < width &&
                checkY >= 0 &&
                checkY < height &&
                visited[checkY][checkX] &&
                isWalkableTile(maze, checkX, checkY)
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

/**
 * Creates path between two points
 */
function createPathTo(maze, x1, y1, x2, y2) {
    let x = x1;
    let y = y1;

    while (x < x2) {
        if (x >= 0 && x < maze[0]?.length) {
            maze[y][x] = TILE_TYPES.PATH;
        }
        x += x < x2 ? 1 : -1;
    }

    while (y < y2) {
        if (y >= 0 && y < maze.length) {
            maze[y][x] = TILE_TYPES.PATH;
        }
        y += y < y2 ? 1 : -1;
    }
}

/**
 * Initializes maze with all walls
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @returns {number[][]} Initialized maze
 */
export function initializeMaze(width, height) {
    const maze = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            row.push(TILE_TYPES.WALL);
        }
        maze.push(row);
    }
    return maze;
}

/**
 * Counts path tiles in maze (static helper)
 * @param {number[][]} maze - The maze grid
 * @returns {number} Path tile count
 */
export function countPathTilesInMaze(maze) {
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
