/**
 * Spawn Validator
 * Validates spawn points and finds nearest valid spawn locations
 */

import { isWalkableTile } from './MazeLayout.js';

export function validateSpawnPoint(gridX, gridY, maze) {
    // Check bounds
    if (gridY < 0 || gridY >= maze.length) {return false;}
    if (gridX < 0 || gridX >= maze[0].length) {return false;}

    // Check tile type
    return isWalkableTile(maze, gridX, gridY);
}

export function findNearestValidSpawn(targetX, targetY, maze) {
    const searchRadius = 10;
    let nearestPoint = null;
    let nearestDist = Infinity;

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            const x = targetX + dx;
            const y = targetY + dy;

            if (validateSpawnPoint(x, y, maze)) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestPoint = { x, y };
                }
            }
        }
    }

    return nearestPoint;
}

export function validateAllSpawnPoints(spawnPositions, maze) {
    const results = [];

    for (const spawn of spawnPositions) {
        const isValid = validateSpawnPoint(spawn.x, spawn.y, maze);
        results.push({
            ...spawn,
            isValid,
            message: isValid ? 'Valid spawn point' : 'Invalid spawn point: on wall or out of bounds'
        });
    }

    return results;
}
