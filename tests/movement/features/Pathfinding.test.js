/**
 * Tests für Pathfinding Features
 */

import {
    findPathBFS,
    findPathAStar,
    hasDirectPath,
    findEscapeRoutes
} from '../../../src/movement/features/Pathfinding.js';
import { MazeAdapter } from '../../../src/movement/adapters/MazeAdapter.js';
import { Direction } from '../../../src/movement/core/Direction.js';

describe('Pathfinding', () => {
    // Simple test maze
    const createTestMaze = () => [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ];

    describe('findPathBFS', () => {
        test('should find direct path', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);

            const path = findPathBFS(1, 1, 3, 1, adapter);

            expect(path).not.toBeNull();
            expect(path.length).toBe(2);
            expect(path[0]).toBe(Direction.RIGHT);
            expect(path[1]).toBe(Direction.RIGHT);
        });

        test('should find path around obstacle', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);

            // Path from (1,1) to (3,3) - needs to go around center wall at (2,2)
            const path = findPathBFS(1, 1, 3, 3, adapter);

            expect(path).not.toBeNull();
            expect(path.length).toBeGreaterThan(2);
        });

        test('should return empty array for same position', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);

            const path = findPathBFS(1, 1, 1, 1, adapter);

            expect(path).toEqual([]);
        });
    });

    describe('findPathAStar', () => {
        test('should find optimal path', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);

            const path = findPathAStar(1, 1, 3, 1, adapter);

            expect(path).not.toBeNull();
            expect(path.length).toBe(2); // Direct path should be optimal
        });
    });

    describe('hasDirectPath', () => {
        test('should return true for horizontal direct path', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);

            expect(hasDirectPath(1, 1, 3, 1, adapter)).toBe(true);
        });

        test('should return false if blocked', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);

            // (1,2) has wall at (2,2) in between
            expect(hasDirectPath(1, 2, 3, 2, adapter)).toBe(false);
        });
    });

    describe('findEscapeRoutes', () => {
        test('should find routes away from danger', () => {
            const maze = createTestMaze();
            const adapter = new MazeAdapter(maze);

            // At (2,1), danger at (1,1) - should suggest going right
            const routes = findEscapeRoutes(2, 1, 1, 1, adapter);

            expect(routes.length).toBeGreaterThan(0);
        });
    });
});
