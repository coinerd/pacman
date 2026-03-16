// tests/utils/SpawnValidator.test.js

import {
    validateSpawnPoint,
    findNearestValidSpawn,
    validateAllSpawnPoints
} from '../../src/utils/SpawnValidator.js';

describe('SpawnValidator', () => {
    let mockMaze;

    beforeEach(() => {
        // 0 = walkable, 1 = wall
        mockMaze = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ];
    });

    describe('validateSpawnPoint', () => {
        test('should return true for walkable tile', () => {
            const result = validateSpawnPoint(2, 2, mockMaze);

            expect(result).toBe(true);
        });

        test('should return false for wall tile', () => {
            const result = validateSpawnPoint(0, 0, mockMaze);

            expect(result).toBe(false);
        });

        test('should return false for out of bounds', () => {
            const result = validateSpawnPoint(-1, 0, mockMaze);

            expect(result).toBe(false);
        });

        test('should return false for out of bounds (too large)', () => {
            const result = validateSpawnPoint(10, 10, mockMaze);

            expect(result).toBe(false);
        });
    });

    describe('findNearestValidSpawn', () => {
        test('should find valid spawn point', () => {
            const result = findNearestValidSpawn(2, 2, mockMaze);

            expect(result).not.toBeNull();
            expect(result.x).toBeDefined();
            expect(result.y).toBeDefined();
        });

        test('should return nearest valid point', () => {
            const result = findNearestValidSpawn(2, 2, mockMaze);

            // Should find (2, 2) which is walkable
            expect(result.x).toBe(2);
            expect(result.y).toBe(2);
        });
    });

    describe('validateAllSpawnPoints', () => {
        test('should validate all spawn points', () => {
            const spawns = [
                { x: 2, y: 2 },
                { x: 0, y: 0 }
            ];

            const results = validateAllSpawnPoints(spawns, mockMaze);

            expect(results.length).toBe(2);
            expect(results[0].isValid).toBe(true);
            expect(results[1].isValid).toBe(false);
        });

        test('should include validation messages', () => {
            const spawns = [{ x: 2, y: 2 }];

            const results = validateAllSpawnPoints(spawns, mockMaze);

            expect(results[0].message).toBeDefined();
        });
    });
});
