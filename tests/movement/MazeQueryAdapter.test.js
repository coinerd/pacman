/**
 * Tests for MazeQueryAdapter
 */

import { MazeQueryAdapter } from '../../src/movement/adapters/MazeQueryAdapter.js';

// Simple test maze (5x5)
const testMaze = [
    [1, 1, 1, 1, 1],  // Wall row
    [1, 0, 0, 0, 1],  // Walkable
    [1, 0, 1, 0, 1],  // Wall in middle
    [1, 0, 0, 0, 1],  // Walkable
    [1, 1, 1, 1, 1]   // Wall row
];

describe('MazeQueryAdapter', () => {
    let adapter;

    beforeEach(() => {
        adapter = new MazeQueryAdapter(testMaze, {
            tileSize: 20,
            tunnelRow: 2,
            portals: {
                leftPortal: { tileX: 0, tileY: 2 },
                rightPortal: { tileX: 4, tileY: 2 }
            }
        });
    });

    describe('constructor', () => {
        test('creates with maze data', () => {
            expect(adapter.maze).toBe(testMaze);
            expect(adapter.tileSize).toBe(20);
        });

        test('uses default tile size', () => {
            const a = new MazeQueryAdapter(testMaze);
            expect(a.tileSize).toBeGreaterThan(0);
        });
    });

    describe('isWalkable', () => {
        test('returns true for walkable tiles', () => {
            expect(adapter.isWalkable(1, 1)).toBe(true);
            expect(adapter.isWalkable(2, 1)).toBe(true);
            expect(adapter.isWalkable(3, 1)).toBe(true);
        });

        test('returns false for walls', () => {
            expect(adapter.isWalkable(0, 0)).toBe(false);
            expect(adapter.isWalkable(2, 2)).toBe(false);
            expect(adapter.isWalkable(4, 4)).toBe(false);
        });

        test('returns false for out of bounds', () => {
            expect(adapter.isWalkable(-1, 0)).toBe(false);
            expect(adapter.isWalkable(0, -1)).toBe(false);
            expect(adapter.isWalkable(5, 0)).toBe(false);
            expect(adapter.isWalkable(0, 5)).toBe(false);
        });
    });

    describe('getTileCenter', () => {
        test('returns correct center for tile (0, 0)', () => {
            const center = adapter.getTileCenter(0, 0);
            expect(center.x).toBe(10);
            expect(center.y).toBe(10);
        });

        test('returns correct center for tile (2, 2)', () => {
            const center = adapter.getTileCenter(2, 2);
            expect(center.x).toBe(50);
            expect(center.y).toBe(50);
        });
    });

    describe('tileToWorld', () => {
        test('converts tile to world coordinates', () => {
            const world = adapter.tileToWorld(2, 3);
            expect(world.x).toBe(40);
            expect(world.y).toBe(60);
        });

        test('handles origin', () => {
            const world = adapter.tileToWorld(0, 0);
            expect(world.x).toBe(0);
            expect(world.y).toBe(0);
        });
    });

    describe('worldToTile', () => {
        test('converts world to tile coordinates', () => {
            const tile = adapter.worldToTile(45, 65);
            expect(tile.tileX).toBe(2);
            expect(tile.tileY).toBe(3);
        });

        test('handles exact tile boundaries', () => {
            const tile = adapter.worldToTile(40, 60);
            expect(tile.tileX).toBe(2);
            expect(tile.tileY).toBe(3);
        });

        test('handles origin', () => {
            const tile = adapter.worldToTile(0, 0);
            expect(tile.tileX).toBe(0);
            expect(tile.tileY).toBe(0);
        });
    });

    describe('getWarpTarget', () => {
        test('returns warp target for left portal moving left', () => {
            const target = adapter.getWarpTarget(0, 2, { x: -1, y: 0 });
            expect(target).toEqual({ tileX: 4, tileY: 2 });
        });

        test('returns warp target for right portal moving right', () => {
            const target = adapter.getWarpTarget(4, 2, { x: 1, y: 0 });
            expect(target).toEqual({ tileX: 0, tileY: 2 });
        });

        test('returns null for wrong direction', () => {
            expect(adapter.getWarpTarget(0, 2, { x: 1, y: 0 })).toBeNull();
            expect(adapter.getWarpTarget(4, 2, { x: -1, y: 0 })).toBeNull();
        });

        test('returns null for wrong row', () => {
            expect(adapter.getWarpTarget(0, 1, { x: -1, y: 0 })).toBeNull();
        });

        test('returns null for vertical movement', () => {
            expect(adapter.getWarpTarget(0, 2, { x: 0, y: -1 })).toBeNull();
        });
    });

    describe('getTileSize', () => {
        test('returns tile size', () => {
            expect(adapter.getTileSize()).toBe(20);
        });
    });

    describe('isInBounds', () => {
        test('returns true for valid coordinates', () => {
            expect(adapter.isInBounds(0, 0)).toBe(true);
            expect(adapter.isInBounds(4, 4)).toBe(true);
            expect(adapter.isInBounds(2, 2)).toBe(true);
        });

        test('returns false for out of bounds', () => {
            expect(adapter.isInBounds(-1, 0)).toBe(false);
            expect(adapter.isInBounds(0, -1)).toBe(false);
            expect(adapter.isInBounds(5, 0)).toBe(false);
            expect(adapter.isInBounds(0, 5)).toBe(false);
        });
    });

    describe('getWidth', () => {
        test('returns maze width', () => {
            expect(adapter.getWidth()).toBe(5);
        });
    });

    describe('getHeight', () => {
        test('returns maze height', () => {
            expect(adapter.getHeight()).toBe(5);
        });
    });

    describe('getMazeData', () => {
        test('returns maze data', () => {
            expect(adapter.getMazeData()).toBe(testMaze);
        });
    });

    describe('isPortal', () => {
        test('returns true for portal tiles', () => {
            expect(adapter.isPortal(0, 2)).toBe(true);
            expect(adapter.isPortal(4, 2)).toBe(true);
        });

        test('returns false for non-portal tiles', () => {
            expect(adapter.isPortal(1, 1)).toBe(false);
            expect(adapter.isPortal(2, 2)).toBe(false);
        });
    });

    describe('getWalkableNeighbors', () => {
        test('returns all walkable neighbors', () => {
            const neighbors = adapter.getWalkableNeighbors(1, 1);
            expect(neighbors.length).toBeGreaterThan(0);

            // Should not include the wall at (2, 2)
            const hasWall = neighbors.some(n => n.tileX === 2 && n.tileY === 2);
            expect(hasWall).toBe(false);
        });

        test('returns correct directions', () => {
            const neighbors = adapter.getWalkableNeighbors(1, 1);

            // Should be able to move right to (2, 1)
            const right = neighbors.find(n => n.direction.x === 1);
            expect(right).toBeDefined();
            expect(right.tileX).toBe(2);

            // Should be able to move down to (1, 2)
            const down = neighbors.find(n => n.direction.y === 1);
            expect(down).toBeDefined();
            expect(down.tileX).toBe(1);
            expect(down.tileY).toBe(2);
        });

        test('returns empty array when surrounded by walls', () => {
            const neighbors = adapter.getWalkableNeighbors(0, 0);
            expect(neighbors).toHaveLength(0);
        });
    });
});
