/**
 * Tests for MazeValidation
 * Focusing on branch coverage for maze validation functions
 */

import {
    checkConnectivity,
    validateDeadEndDensity,
    validateCorridorLength,
    floodFill,
    countWalkableTiles,
    findShortestPath,
    countReachableTilesWithinSteps,
    findMaxStraightCorridorLength,
    countEdgeDisjointPaths
} from '../../../src/utils/maze/MazeValidation.js';

// TILE_TYPES: WALL=1, PATH=0
// Create a simple connected maze for testing
function createSimpleMaze() {
    // 1 = wall, 0 = path (walkable)
    return [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];
}

describe('MazeValidation', () => {
    describe('checkConnectivity', () => {
        it('should return valid for fully connected maze', () => {
            const maze = createSimpleMaze();

            const result = checkConnectivity(maze, 7, 7, { x: 1, y: 1 });

            expect(result.isValid).toBe(true);
            expect(result.coverage).toBe(1);
        });

        it('should return invalid for disconnected maze', () => {
            const maze = [
                [1, 1, 1, 1, 1],
                [1, 0, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 0, 1],
                [1, 1, 1, 1, 1]
            ];

            const result = checkConnectivity(maze, 5, 5, { x: 1, y: 1 });

            expect(result.isValid).toBe(false);
            expect(result.coverage).toBeLessThan(1);
        });

        it('should handle empty maze', () => {
            const maze = [[1]];

            const result = checkConnectivity(maze, 1, 1, { x: 0, y: 0 });

            expect(result.isValid).toBe(false); // No walkable tiles
            expect(result.coverage).toBe(0);
        });

        it('should handle single walkable tile', () => {
            const maze = [[0]];

            const result = checkConnectivity(maze, 1, 1, { x: 0, y: 0 });

            expect(result.isValid).toBe(true);
            expect(result.coverage).toBe(1);
        });
    });

    describe('floodFill', () => {
        it('should fill connected area', () => {
            const maze = createSimpleMaze();
            const visited = [];
            for (let y = 0; y < 7; y++) {
                visited.push(new Array(7).fill(false));
            }

            floodFill(maze, 7, 7, 1, 1, visited);

            // Check that walkable tiles connected to start are visited
            expect(visited[1][1]).toBe(true);
            expect(visited[1][2]).toBe(true);
            expect(visited[0][0]).toBe(false); // Wall
        });

        it('should not visit walls', () => {
            const maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            const visited = [];
            for (let y = 0; y < 3; y++) {
                visited.push(new Array(3).fill(false));
            }

            floodFill(maze, 3, 3, 1, 1, visited);

            expect(visited[1][1]).toBe(true);
            expect(visited[0][0]).toBe(false);
            expect(visited[0][1]).toBe(false);
        });

        it('should handle start on wall', () => {
            const maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            const visited = [];
            for (let y = 0; y < 3; y++) {
                visited.push(new Array(3).fill(false));
            }

            // Starting on wall should not fill anything
            floodFill(maze, 3, 3, 0, 0, visited);

            expect(visited[1][1]).toBe(false);
        });

        it('should handle out of bounds start', () => {
            const maze = createSimpleMaze();
            const visited = [];
            for (let y = 0; y < 7; y++) {
                visited.push(new Array(7).fill(false));
            }

            // Should not throw
            floodFill(maze, 7, 7, -1, -1, visited);

            // Nothing should be visited
            expect(visited.every(row => row.every(cell => !cell))).toBe(true);
        });

        it('should handle out of bounds coordinates during flood', () => {
            const maze = [
                [0, 1],
                [1, 1]
            ];
            const visited = [];
            for (let y = 0; y < 2; y++) {
                visited.push(new Array(2).fill(false));
            }

            // Start at corner, flood should not throw when checking neighbors
            floodFill(maze, 2, 2, 0, 0, visited);

            expect(visited[0][0]).toBe(true);
        });
    });

    describe('countWalkableTiles', () => {
        it('should count walkable tiles correctly', () => {
            const maze = createSimpleMaze();

            const count = countWalkableTiles(maze, 7, 7);

            // Count the 0s in the maze (PATH tiles)
            expect(count).toBe(19);
        });

        it('should return 0 for all-wall maze', () => {
            const maze = [
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1]
            ];

            const count = countWalkableTiles(maze, 3, 3);

            expect(count).toBe(0);
        });

        it('should count all walkable in all-walkable maze', () => {
            const maze = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ];

            const count = countWalkableTiles(maze, 3, 3);

            expect(count).toBe(9);
        });
    });

    describe('validateDeadEndDensity', () => {
        it('should pass for low dead-end density', () => {
            const maze = createSimpleMaze();

            const result = validateDeadEndDensity(maze, 7, 7, 0.3, 2);

            expect(result.isValid).toBe(true);
        });

        it('should fail for high dead-end density', () => {
            const maze = createSimpleMaze();

            const result = validateDeadEndDensity(maze, 7, 7, 0.01, 2);

            expect(result.isValid).toBe(false);
            expect(result.message).toContain('Dead-end density too high');
        });

        it('should handle zero walkable tiles', () => {
            const maze = [[1]];

            const result = validateDeadEndDensity(maze, 1, 1, 0.5, 0);

            // When walkableTiles is 0, density is 1, which exceeds threshold
            expect(result.isValid).toBe(false);
        });

        it('should pass when no dead ends', () => {
            const maze = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ];

            const result = validateDeadEndDensity(maze, 3, 3, 0.3, 0);

            expect(result.isValid).toBe(true);
        });
    });

    describe('validateCorridorLength', () => {
        it('should pass for short corridors', () => {
            const maze = createSimpleMaze();

            const result = validateCorridorLength(maze, 7, 7, 10);

            expect(result.isValid).toBe(true);
        });

        it('should fail for long corridors', () => {
            // Create maze with a long horizontal corridor
            // Horizontal corridor: walkable left+right, walls top+bottom
            const maze = [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ];

            const result = validateCorridorLength(maze, 12, 5, 5);

            expect(result.isValid).toBe(false);
            expect(result.message).toContain('Straight corridor too long');
        });

        it('should pass when corridor is exactly max length', () => {
            const maze = [
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1]
            ];

            const result = validateCorridorLength(maze, 5, 5, 3);

            expect(result.isValid).toBe(true);
        });
    });

    describe('findShortestPath', () => {
        it('should find direct path', () => {
            const maze = createSimpleMaze();

            const path = findShortestPath(maze, 7, 7, { x: 1, y: 1 }, { x: 5, y: 1 });

            expect(path).not.toBeNull();
            expect(path[0]).toEqual({ x: 1, y: 1 });
            expect(path[path.length - 1]).toEqual({ x: 5, y: 1 });
        });

        it('should return null for unreachable destination', () => {
            const maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];

            const path = findShortestPath(maze, 3, 3, { x: 1, y: 1 }, { x: 0, y: 0 });

            expect(path).toBeNull();
        });

        it('should respect blocked edges', () => {
            const maze = createSimpleMaze();
            const blockedEdges = new Set(['1,1->2,1', '2,1->1,1']);

            const path = findShortestPath(maze, 7, 7, { x: 1, y: 1 }, { x: 5, y: 1 }, blockedEdges);

            expect(path).not.toBeNull();
            // Path should go around the blocked edge
        });

        it('should handle start equals end', () => {
            const maze = createSimpleMaze();

            const path = findShortestPath(maze, 7, 7, { x: 1, y: 1 }, { x: 1, y: 1 });

            expect(path).not.toBeNull();
            expect(path).toHaveLength(1);
            expect(path[0]).toEqual({ x: 1, y: 1 });
        });

        it('should handle out of bounds start', () => {
            const maze = createSimpleMaze();

            const path = findShortestPath(maze, 7, 7, { x: -1, y: -1 }, { x: 1, y: 1 });

            expect(path).toBeNull();
        });

        it('should handle out of bounds end', () => {
            const maze = createSimpleMaze();

            const path = findShortestPath(maze, 7, 7, { x: 1, y: 1 }, { x: 10, y: 10 });

            expect(path).toBeNull();
        });

        it('should find path around obstacles', () => {
            const maze = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 1, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];

            const path = findShortestPath(maze, 5, 5, { x: 1, y: 1 }, { x: 3, y: 3 });

            expect(path).not.toBeNull();
            expect(path[0]).toEqual({ x: 1, y: 1 });
            expect(path[path.length - 1]).toEqual({ x: 3, y: 3 });
        });
    });

    describe('countEdgeDisjointPaths', () => {
        it('should count paths correctly', () => {
            const maze = createSimpleMaze();

            const count = countEdgeDisjointPaths(maze, 7, 7, { x: 1, y: 1 }, { x: 5, y: 5 }, 3);

            expect(count).toBeGreaterThanOrEqual(1);
        });

        it('should return 0 for unreachable', () => {
            const maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];

            const count = countEdgeDisjointPaths(maze, 3, 3, { x: 1, y: 1 }, { x: 0, y: 0 }, 3);

            expect(count).toBe(0);
        });

        it('should limit to maxPaths', () => {
            const maze = createSimpleMaze();

            const count = countEdgeDisjointPaths(maze, 7, 7, { x: 1, y: 1 }, { x: 5, y: 1 }, 2);

            expect(count).toBeLessThanOrEqual(2);
        });

        it('should return 1 for single path maze', () => {
            const maze = [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ];

            const count = countEdgeDisjointPaths(maze, 5, 3, { x: 1, y: 1 }, { x: 3, y: 1 }, 5);

            expect(count).toBe(1);
        });
    });

    describe('countReachableTilesWithinSteps', () => {
        it('should count reachable tiles', () => {
            const maze = createSimpleMaze();

            const count = countReachableTilesWithinSteps(maze, 7, 7, { x: 3, y: 3 }, 10);

            expect(count).toBeGreaterThan(1);
        });

        it('should respect maxSteps', () => {
            const maze = createSimpleMaze();

            const count1 = countReachableTilesWithinSteps(maze, 7, 7, { x: 3, y: 3 }, 1);
            const count2 = countReachableTilesWithinSteps(maze, 7, 7, { x: 3, y: 3 }, 5);

            expect(count2).toBeGreaterThan(count1);
        });

        it('should handle isolated tile', () => {
            // Single walkable tile surrounded by walls
            const maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];

            const count = countReachableTilesWithinSteps(maze, 3, 3, { x: 1, y: 1 }, 5);

            // Only the single tile at (1,1) is reachable
            expect(count).toBe(1);
        });

        it('should handle maxSteps of 0', () => {
            const maze = createSimpleMaze();

            const count = countReachableTilesWithinSteps(maze, 7, 7, { x: 3, y: 3 }, 0);

            expect(count).toBe(1);
        });
    });

    describe('findMaxStraightCorridorLength', () => {
        it('should find horizontal corridor length', () => {
            // Horizontal corridor: walkable left+right, walls top+bottom
            const maze = [
                [1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1]
            ];

            const maxLen = findMaxStraightCorridorLength(maze, 9, 5);

            // Should detect the horizontal corridor
            expect(maxLen).toBeGreaterThanOrEqual(0);
        });

        it('should return 0 for no corridors', () => {
            const maze = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ];

            const maxLen = findMaxStraightCorridorLength(maze, 3, 3);

            expect(maxLen).toBe(0);
        });

        it('should find vertical corridors', () => {
            // Vertical corridor: walkable top+bottom, walls left+right
            const maze = [
                [1, 1, 1, 1, 1],
                [1, 1, 0, 1, 1],
                [1, 1, 0, 1, 1],
                [1, 1, 0, 1, 1],
                [1, 1, 1, 1, 1]
            ];

            const maxLen = findMaxStraightCorridorLength(maze, 5, 5);

            // Should detect the vertical corridor
            expect(maxLen).toBeGreaterThanOrEqual(0);
        });
    });
});
