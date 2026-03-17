/**
 * MazeAesthetics
 * Circuit-style aesthetics and symmetry for maze generation
 */

import { TILE_TYPES } from '../MazeLayout.js';
import { countPathNeighbors } from './MazeAlgorithms.js';

/**
 * Applies circuit-style aesthetics to maze
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {function} rng - Seeded random number generator
 * @param {function} isVirusCoreArea - Function to check virus core area
 */
export function applyCircuitAesthetics(maze, width, height, rng, isVirusCoreArea) {
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (isVirusCoreArea(x, y)) {
                continue;
            }

            const tile = maze[y][x];
            if (tile !== TILE_TYPES.PATH) {
                continue;
            }

            const neighbors = countPathNeighbors(maze, width, height, x, y);

            if (neighbors >= 3) {
                fixIntersection(maze, width, height, x, y, rng);
            }
        }
    }
}

/**
 * Fixes intersections to avoid 4-way crossings
 */
function fixIntersection(maze, width, height, x, y, rng) {
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
            newX < width &&
            newY >= 0 &&
            newY < height &&
            maze[newY][newX] === TILE_TYPES.PATH
        ) {
            pathNeighbors.push({ x: newX, y: newY, dir: dir.name });
        }
    }

    if (pathNeighbors.length > 3) {
        const removeIndex = Math.floor(rng() * pathNeighbors.length);
        const remove = pathNeighbors[removeIndex];
        maze[remove.y][remove.x] = TILE_TYPES.WALL;
    }
}

/**
 * Applies symmetry to the maze
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {string} symmetryType - 'none', 'horizontal', 'vertical', or 'radial'
 * @param {function} isVirusCoreArea - Function to check virus core area
 */
export function applySymmetry(maze, width, height, symmetryType, isVirusCoreArea) {
    if (symmetryType === 'none') {
        return;
    }

    const halfHeight = Math.floor(height / 2);

    if (symmetryType === 'horizontal') {
        applyHorizontalSymmetry(maze, width, height, halfHeight, isVirusCoreArea);
    } else if (symmetryType === 'vertical') {
        applyVerticalSymmetry(maze, width, height, isVirusCoreArea);
    } else if (symmetryType === 'radial') {
        applyRadialSymmetry(maze, width, height, halfHeight, isVirusCoreArea);
    }
}

/**
 * Applies horizontal symmetry (top-bottom mirror)
 */
function applyHorizontalSymmetry(maze, width, height, halfHeight, isVirusCoreArea) {
    for (let y = 0; y < halfHeight; y++) {
        const mirrorY = height - 1 - y;
        for (let x = 0; x < width; x++) {
            if (isVirusCoreArea(x, mirrorY)) {
                continue;
            }
            maze[mirrorY][x] = maze[y][x];
        }
    }
}

/**
 * Applies vertical symmetry (left-right mirror)
 */
function applyVerticalSymmetry(maze, width, height, isVirusCoreArea) {
    const halfWidth = Math.floor(width / 2);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < halfWidth; x++) {
            const mirrorX = width - 1 - x;
            if (isVirusCoreArea(mirrorX, y)) {
                continue;
            }
            maze[y][mirrorX] = maze[y][x];
        }
    }
}

/**
 * Applies radial symmetry (4-way mirror)
 */
function applyRadialSymmetry(maze, width, height, halfHeight, isVirusCoreArea) {
    const halfWidth = Math.floor(width / 2);

    for (let y = 0; y < halfHeight; y++) {
        const mirrorY = height - 1 - y;
        for (let x = 0; x < halfWidth; x++) {
            const mirrorX = width - 1 - x;

            if (isVirusCoreArea(mirrorX, mirrorY)) {
                continue;
            }

            maze[y][mirrorX] = maze[y][x];
            maze[mirrorY][x] = maze[y][x];
            maze[mirrorY][mirrorX] = maze[y][x];
        }
    }
}

/**
 * Creates warp tunnel on specified row
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {number} tunnelRow - Row for tunnel
 */
export function createWarpTunnel(maze, width, height, tunnelRow) {
    if (tunnelRow < 0 || tunnelRow >= height) {
        return;
    }

    maze[tunnelRow][0] = TILE_TYPES.PATH;
    maze[tunnelRow][width - 1] = TILE_TYPES.PATH;
}
