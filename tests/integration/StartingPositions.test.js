/**
 * Starting Positions Validation Tests
 * Purpose: Validate that all entities spawn on valid (non-wall) tiles
 */

import { pacmanStartPosition, ghostStartPositions } from '../../src/config/gameConfig.js';
import { mazeLayout } from '../../src/utils/MazeLayout.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';

describe('Starting Positions Validation', () => {
    describe('Pacman Starting Position', () => {
        test('Pacman starts on PATH tile (not a WALL)', () => {
            const tileType = mazeLayout[pacmanStartPosition.y][pacmanStartPosition.x];
            console.log(`Pacman at (${pacmanStartPosition.x}, ${pacmanStartPosition.y}) = tile type ${tileType}`);

            expect(tileType).not.toBe(TILE_TYPES.WALL);
            expect(tileType).toBe(TILE_TYPES.PATH);
        });

        test('Pacman starting position coordinates are within maze bounds', () => {
            expect(pacmanStartPosition.x).toBeGreaterThanOrEqual(0);
            expect(pacmanStartPosition.x).toBeLessThan(mazeLayout[0].length);
            expect(pacmanStartPosition.y).toBeGreaterThanOrEqual(0);
            expect(pacmanStartPosition.y).toBeLessThan(mazeLayout.length);
        });
    });

    describe('Ghost Starting Positions', () => {
        test('All ghosts start on PATH tiles (not WALL)', () => {
            for (const [name, pos] of Object.entries(ghostStartPositions)) {
                const tileType = mazeLayout[pos.y][pos.x];
                console.log(`${name} at (${pos.x}, ${pos.y}) = tile type ${tileType}`);

                expect(tileType).not.toBe(TILE_TYPES.WALL);
                expect([TILE_TYPES.PATH, TILE_TYPES.GHOST_HOUSE]).toContain(tileType);
            }
        });

        test('All ghost starting position coordinates are within maze bounds', () => {
            for (const [name, pos] of Object.entries(ghostStartPositions)) {
                expect(pos.x).toBeGreaterThanOrEqual(0);
                expect(pos.x).toBeLessThan(mazeLayout[0].length);
                expect(pos.y).toBeGreaterThanOrEqual(0);
                expect(pos.y).toBeLessThan(mazeLayout.length);
            }
        });
    });

    describe('Starting Position Walkability Check', () => {
        test('Pacman should be able to move from starting position', () => {
            const tileType = mazeLayout[pacmanStartPosition.y][pacmanStartPosition.x];
            console.log(`Pacman tile type: ${tileType}`);

            const x = pacmanStartPosition.x;
            const y = pacmanStartPosition.y;

            const adjacentTiles = [
                mazeLayout[y]?.[x - 1],
                mazeLayout[y]?.[x + 1],
                mazeLayout[y - 1]?.[x],
                mazeLayout[y + 1]?.[x]
            ];

            const hasWalkableAdjacent = adjacentTiles.some(tile =>
                tile !== undefined && tile !== TILE_TYPES.WALL
            );

            expect(hasWalkableAdjacent).toBe(true);
        });
    });

    describe('Maze Layout Analysis', () => {
        test('Maze has valid dimensions', () => {
            expect(mazeLayout).toBeDefined();
            expect(mazeLayout.length).toBeGreaterThan(0);
            expect(mazeLayout[0].length).toBeGreaterThan(0);
        });

        test('Maze contains valid tile types only', () => {
            const validTileTypes = [TILE_TYPES.WALL, TILE_TYPES.PATH, 2]; // 2 = POWER_PELLET (converted to PATH)

            for (let y = 0; y < mazeLayout.length; y++) {
                for (let x = 0; x < mazeLayout[y].length; x++) {
                    const tile = mazeLayout[y][x];
                    expect(validTileTypes).toContain(tile);
                }
            }
        });
    });
});
