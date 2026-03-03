/**
 * Tests für MazeAdapter
 */

import { MazeAdapter, DEFAULT_TILE_CONFIG } from '../../src/movement/adapters/MazeAdapter.js';
import { Direction } from '../../src/movement/core/Direction.js';

describe('MazeAdapter', () => {
    // Test maze: 5x5 with walls around and cross in middle
    const testMaze = [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ];

    describe('Constructor', () => {
        test('should create with maze grid', () => {
            const adapter = new MazeAdapter(testMaze);

            expect(adapter.getWidth()).toBe(5);
            expect(adapter.getHeight()).toBe(5);
            expect(adapter.getTileSize()).toBe(20); // default
        });

        test('should accept custom config', () => {
            const adapter = new MazeAdapter(testMaze, {
                tileSize: 30,
                tunnelRow: 2
            });

            expect(adapter.getTileSize()).toBe(30);
            expect(adapter.config.tunnelRow).toBe(2);
        });
    });

    describe('isWalkable', () => {
        let adapter;

        beforeEach(() => {
            adapter = new MazeAdapter(testMaze);
        });

        test('should return true for path tiles', () => {
            expect(adapter.isWalkable(1, 1)).toBe(true);
            expect(adapter.isWalkable(2, 1)).toBe(true);
            expect(adapter.isWalkable(3, 1)).toBe(true);
        });

        test('should return false for wall tiles', () => {
            expect(adapter.isWalkable(0, 0)).toBe(false);
            expect(adapter.isWalkable(2, 2)).toBe(false); // Center wall
            expect(adapter.isWalkable(4, 4)).toBe(false);
        });

        test('should return false for out of bounds (except tunnel)', () => {
            expect(adapter.isWalkable(-1, 1)).toBe(false);
            expect(adapter.isWalkable(5, 1)).toBe(false);
            expect(adapter.isWalkable(1, -1)).toBe(false);
            expect(adapter.isWalkable(1, 5)).toBe(false);
        });

        test('should return true for tunnel positions', () => {
            const tunnelMaze = [
                [1, 1, 1],
                [0, 0, 0],
                [1, 1, 1]
            ];
            const tunnelAdapter = new MazeAdapter(tunnelMaze, { tunnelRow: 1 });

            expect(tunnelAdapter.isWalkable(-1, 1)).toBe(true);
            expect(tunnelAdapter.isWalkable(3, 1)).toBe(true);
        });
    });

    describe('getValidDirections', () => {
        let adapter;

        beforeEach(() => {
            adapter = new MazeAdapter(testMaze);
        });

        test('should return all valid directions from center', () => {
            // Position (2, 1) has 3 valid directions (UP and LEFT blocked by wall)
            const directions = adapter.getValidDirections(2, 1);

            expect(directions.length).toBe(3);
            expect(directions).toContain(Direction.DOWN);
            expect(directions).toContain(Direction.LEFT);
            expect(directions).toContain(Direction.RIGHT);
            expect(directions).not.toContain(Direction.UP);
        });

        test('should handle tunnel directions', () => {
            const tunnelMaze = [
                [1, 1, 1],
                [0, 0, 0],
                [1, 1, 1]
            ];
            const tunnelAdapter = new MazeAdapter(tunnelMaze, { tunnelRow: 1 });

            const directions = tunnelAdapter.getValidDirections(0, 1);

            expect(directions).toContain(Direction.LEFT);
            expect(directions).toContain(Direction.RIGHT);
        });

        test('should cache results', () => {
            const directions1 = adapter.getValidDirections(1, 1);
            const directions2 = adapter.getValidDirections(1, 1);

            // Should be same array reference due to caching
            expect(adapter.getCacheStats().size).toBe(1);
        });

        test('should return empty array for completely blocked position', () => {
            // Corner (0, 0) surrounded by walls
            const directions = adapter.getValidDirections(0, 0);
            expect(directions).toEqual([]);
        });
    });

    describe('Coordinate Conversion', () => {
        let adapter;

        beforeEach(() => {
            adapter = new MazeAdapter(testMaze, { tileSize: 20 });
        });

        test('getTileCenter should return center coordinates', () => {
            const center = adapter.getTileCenter(1, 1);

            expect(center.x).toBe(30); // 1 * 20 + 10
            expect(center.y).toBe(30); // 1 * 20 + 10
        });

        test('gridToPixel should return top-left coordinates', () => {
            const pixel = adapter.gridToPixel(2, 3);

            expect(pixel.x).toBe(40); // 2 * 20
            expect(pixel.y).toBe(60); // 3 * 20
        });

        test('pixelToGrid should convert pixel to grid', () => {
            const grid = adapter.pixelToGrid(35, 75);

            expect(grid.x).toBe(1); // floor(35/20)
            expect(grid.y).toBe(3); // floor(75/20)
        });
    });

    describe('Distances', () => {
        let adapter;

        beforeEach(() => {
            adapter = new MazeAdapter(testMaze);
        });

        test('getDistance should calculate euclidean distance', () => {
            const dist = adapter.getDistance(0, 0, 3, 4);

            expect(dist).toBe(5); // 3-4-5 triangle
        });

        test('getManhattanDistance should calculate manhattan distance', () => {
            const dist = adapter.getManhattanDistance(0, 0, 3, 4);

            expect(dist).toBe(7); // |3| + |4|
        });
    });

    describe('Tile Information', () => {
        let adapter;

        beforeEach(() => {
            adapter = new MazeAdapter(testMaze);
        });

        test('getTileType should return tile value', () => {
            expect(adapter.getTileType(0, 0)).toBe(1);
            expect(adapter.getTileType(1, 1)).toBe(0);
        });

        test('getTileType should return null for out of bounds', () => {
            expect(adapter.getTileType(-1, 0)).toBeNull();
            expect(adapter.getTileType(0, 5)).toBeNull();
        });

        test('isWall should return true for walls', () => {
            expect(adapter.isWall(0, 0)).toBe(true);
            expect(adapter.isWall(1, 1)).toBe(false);
        });

        test('isTunnel should return true for tunnel positions', () => {
            const tunnelMaze = [
                [1, 1, 1],
                [0, 0, 0],
                [1, 1, 1]
            ];
            const tunnelAdapter = new MazeAdapter(tunnelMaze, { tunnelRow: 1 });

            expect(tunnelAdapter.isTunnel(-1, 1)).toBe(true);
            expect(tunnelAdapter.isTunnel(3, 1)).toBe(true);
            expect(tunnelAdapter.isTunnel(1, 1)).toBe(false);
        });
    });

    describe('Custom Tile Config', () => {
        test('should accept custom tile values', () => {
            const customMaze = [
                [2, 2, 2],
                [2, 3, 2],
                [2, 2, 2]
            ];
            const adapter = new MazeAdapter(customMaze, {
                tileConfig: {
                    wallValue: 2,
                    walkableValues: [3]
                }
            });

            expect(adapter.isWalkable(0, 0)).toBe(false); // wall
            expect(adapter.isWalkable(1, 1)).toBe(true);  // walkable
        });
    });

    describe('findNearestWalkable', () => {
        let adapter;

        beforeEach(() => {
            adapter = new MazeAdapter(testMaze);
        });

        test('should return same position if walkable', () => {
            const result = adapter.findNearestWalkable(1, 1);

            expect(result).toEqual({ x: 1, y: 1 });
        });

        test('should find nearest walkable tile', () => {
            const result = adapter.findNearestWalkable(2, 2); // Wall at center

            expect(result).not.toBeNull();
            expect(adapter.isWalkable(result.x, result.y)).toBe(true);
        });

        test('should return null if no walkable found', () => {
            // All-walls maze
            const wallMaze = [[1, 1], [1, 1]];
            const wallAdapter = new MazeAdapter(wallMaze);

            const result = wallAdapter.findNearestWalkable(0, 0, 1);

            expect(result).toBeNull();
        });
    });

    describe('Cache Management', () => {
        let adapter;

        beforeEach(() => {
            adapter = new MazeAdapter(testMaze);
        });

        test('should track cache size', () => {
            adapter.getValidDirections(1, 1);
            adapter.getValidDirections(1, 2);
            adapter.getValidDirections(1, 3);

            const stats = adapter.getCacheStats();
            expect(stats.size).toBe(3);
        });

        test('clearCache should empty cache', () => {
            adapter.getValidDirections(1, 1);
            adapter.clearCache();

            expect(adapter.getCacheStats().size).toBe(0);
        });
    });

    describe('Dimensions', () => {
        test('should handle empty maze', () => {
            const emptyAdapter = new MazeAdapter([]);

            expect(emptyAdapter.getWidth()).toBe(0);
            expect(emptyAdapter.getHeight()).toBe(0);
        });

        test('should handle single row maze', () => {
            const singleRowMaze = [[0, 1, 0]];
            const adapter = new MazeAdapter(singleRowMaze);

            expect(adapter.getWidth()).toBe(3);
            expect(adapter.getHeight()).toBe(1);
        });
    });
});
