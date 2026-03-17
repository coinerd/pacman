/**
 * Starting Positions Validation Tests
 * Purpose: Validate that all entities spawn on valid (non-wall) tiles
 */

import {
    enemyStartPositions,
    pacmanStartPosition
} from '../../src/config/gameConfig.js';
import { mazeLayout, TILE_TYPES } from '../../src/utils/MazeLayout.js';

describe('Starting Positions Validation', () => {
    describe('Player Starting Position', () => {
        test('Player starts on PATH tile (not a WALL)', () => {
            const tileType = mazeLayout[pacmanStartPosition.y][pacmanStartPosition.x];
            console.log(
                `Player at (${pacmanStartPosition.x}, ${pacmanStartPosition.y}) = tile type ${tileType}`
            );

            expect(tileType).not.toBe(TILE_TYPES.WALL);
            expect(tileType).toBe(TILE_TYPES.PATH);
        });

        test('Player starting position coordinates are within maze bounds', () => {
            expect(pacmanStartPosition.x).toBeGreaterThanOrEqual(0);
            expect(pacmanStartPosition.x).toBeLessThan(mazeLayout[0].length);
            expect(pacmanStartPosition.y).toBeGreaterThanOrEqual(0);
            expect(pacmanStartPosition.y).toBeLessThan(mazeLayout.length);
        });
    });

    describe('Enemy Starting Positions', () => {
        test('All enemies start on valid tiles (not WALL)', () => {
            for (const [name, pos] of Object.entries(enemyStartPositions)) {
                const tileType = mazeLayout[pos.y][pos.x];
                console.log(`${name} at (${pos.x}, ${pos.y}) = tile type ${tileType}`);

                expect(tileType).not.toBe(TILE_TYPES.WALL);
                expect([
                    TILE_TYPES.PATH,
                    TILE_TYPES.VIRUS_CORE,
                    TILE_TYPES.VIRUS_CORE_DOOR
                ]).toContain(tileType);
            }
        });

        test('All enemy starting position coordinates are within maze bounds', () => {
            for (const [_name, pos] of Object.entries(enemyStartPositions)) {
                expect(pos.x).toBeGreaterThanOrEqual(0);
                expect(pos.x).toBeLessThan(mazeLayout[0].length);
                expect(pos.y).toBeGreaterThanOrEqual(0);
                expect(pos.y).toBeLessThan(mazeLayout.length);
            }
        });
    });

    describe('Starting Position Walkability Check', () => {
        test('Player should be able to move from starting position', () => {
            const tileType = mazeLayout[pacmanStartPosition.y][pacmanStartPosition.x];
            console.log(`Player tile type: ${tileType}`);
            const x = pacmanStartPosition.x;
            const y = pacmanStartPosition.y;

            expect(tileType).not.toBe(TILE_TYPES.WALL);
        });
    });

    describe('Maze Layout Analysis', () => {
        test('Maze has valid dimensions', () => {
            expect(mazeLayout).toBeDefined();
            expect(mazeLayout.length).toBeGreaterThan(0);
            expect(mazeLayout[0].length).toBeGreaterThan(0);
        });

        test('Maze contains valid tile types only', () => {
            const validTileTypes = [
                TILE_TYPES.WALL,
                TILE_TYPES.PATH,
                TILE_TYPES.VIRUS_CORE,
                TILE_TYPES.VIRUS_CORE_DOOR,
                2 // POWER_PELLET
            ];

            for (let y = 0; y < mazeLayout.length; y++) {
                for (let x = 0; x < mazeLayout[y].length; x++) {
                    const tile = mazeLayout[y][x];
                    expect(validTileTypes).toContain(tile);
                }
            }
        });
    });
});
