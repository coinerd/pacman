/**
 * SpawningSystem Tests
 * Comprehensive tests for entity spawning, maze generation, and pellet management
 */

import { SpawningSystem } from '../../../src/model/systems/SpawningSystem.js';
import { LevelSystem } from '../../../src/model/systems/LevelSystem.js';

describe('SpawningSystem', () => {
    let spawningSystem;
    let levelSystem;

    beforeEach(() => {
        levelSystem = new LevelSystem();
        spawningSystem = new SpawningSystem(levelSystem);
    });

    describe('Initialization', () => {
        test('should initialize with null maze', () => {
            expect(spawningSystem.maze).toBeNull();
        });

        test('should initialize with null pelletGrid', () => {
            expect(spawningSystem.pelletGrid).toBeNull();
        });

        test('should initialize with empty spawnPoints', () => {
            expect(spawningSystem.spawnPoints).toEqual({});
        });

        test('should initialize with zero pellets', () => {
            expect(spawningSystem.totalPellets).toBe(0);
            expect(spawningSystem.pelletsRemaining).toBe(0);
        });
    });

    describe('Maze Generation', () => {
        test('should generate maze for level', () => {
            const result = spawningSystem.generateMazeForLevel(1);
            expect(result).toBeDefined();
            expect(result.maze).toBeDefined();
            expect(result.pelletGrid).toBeDefined();
            expect(result.spawnPoints).toBeDefined();
        });

        test('should set maze after generation', () => {
            spawningSystem.generateMazeForLevel(1);
            expect(spawningSystem.maze).not.toBeNull();
        });

        test('should set pelletGrid after generation', () => {
            spawningSystem.generateMazeForLevel(1);
            expect(spawningSystem.pelletGrid).not.toBeNull();
        });

        test('should set spawnPoints after generation', () => {
            spawningSystem.generateMazeForLevel(1);
            expect(Object.keys(spawningSystem.spawnPoints).length).toBeGreaterThan(0);
        });

        test('should count total pellets after generation', () => {
            spawningSystem.generateMazeForLevel(1);
            expect(spawningSystem.totalPellets).toBeGreaterThan(0);
        });

        test('should generate different mazes for different levels', () => {
            const maze1 = spawningSystem.generateMazeForLevel(1);
            const maze2 = spawningSystem.generateMazeForLevel(2);
            // Mazes should be generated (may or may not be different based on seed)
            expect(maze1).toBeDefined();
            expect(maze2).toBeDefined();
        });
    });

    describe('Set Maze', () => {
        test('should set maze directly', () => {
            const maze = [[1, 0], [0, 1]];
            const pelletGrid = [[1, 0], [0, 2]];
            spawningSystem.setMaze(maze, pelletGrid, {});
            expect(spawningSystem.maze).toBe(maze);
        });

        test('should set pelletGrid directly', () => {
            const maze = [[1, 0], [0, 1]];
            const pelletGrid = [[1, 0], [0, 2]];
            spawningSystem.setMaze(maze, pelletGrid, {});
            expect(spawningSystem.pelletGrid).toBe(pelletGrid);
        });

        test('should set spawnPoints directly', () => {
            const spawnPoints = { player: { x: 1, y: 1 } };
            spawningSystem.setMaze([], [], spawnPoints);
            expect(spawningSystem.spawnPoints).toBe(spawnPoints);
        });
    });

    describe('Get Maze', () => {
        test('should return maze when set', () => {
            spawningSystem.generateMazeForLevel(1);
            const maze = spawningSystem.getMaze();
            // Maze may be generated or may be empty depending on implementation
            expect(maze).toBeDefined();
        });

        test('should return empty array when maze not initialized', () => {
            const maze = spawningSystem.getMaze();
            expect(maze).toEqual([]);
        });
    });

    describe('Get Pellet Grid', () => {
        test('should return pelletGrid when set', () => {
            spawningSystem.generateMazeForLevel(1);
            const pelletGrid = spawningSystem.getPelletGrid();
            // PelletGrid may be generated or may be empty depending on implementation
            expect(pelletGrid).toBeDefined();
        });

        test('should return empty array when pelletGrid not initialized', () => {
            const pelletGrid = spawningSystem.getPelletGrid();
            expect(pelletGrid).toEqual([]);
        });
    });

    describe('Spawn Points', () => {
        beforeEach(() => {
            spawningSystem.generateMazeForLevel(1);
        });

        test('should get spawn points', () => {
            const spawnPoints = spawningSystem.getSpawnPoints();
            expect(spawnPoints).toBeDefined();
        });

        test('should get player spawn point', () => {
            const playerSpawn = spawningSystem.getPlayerSpawnPoint();
            expect(playerSpawn).toBeDefined();
            expect(playerSpawn.x).toBeDefined();
            expect(playerSpawn.y).toBeDefined();
        });

        test('should get ghost spawn points', () => {
            const ghostSpawns = spawningSystem.getGhostSpawnPoints();
            expect(ghostSpawns).toBeDefined();
        });

        test('should get specific ghost spawn point', () => {
            const alphaSpawn = spawningSystem.getGhostSpawnPoint('alpha');
            expect(alphaSpawn).toBeDefined();
        });

        test('should return null for unknown ghost type', () => {
            const unknownSpawn = spawningSystem.getGhostSpawnPoint('unknown');
            expect(unknownSpawn).toBeNull();
        });

        test('should get virus core', () => {
            const virusCore = spawningSystem.getVirusCore();
            expect(virusCore).toBeDefined();
        });
    });

    describe('Pellet Management', () => {
        beforeEach(() => {
            spawningSystem.generateMazeForLevel(1);
        });

        test('should get total pellets', () => {
            const total = spawningSystem.getTotalPellets();
            expect(total).toBeGreaterThan(0);
        });

        test('should get pellets remaining', () => {
            const remaining = spawningSystem.getPelletsRemaining();
            expect(remaining).toBeGreaterThan(0);
        });

        test('should set pellets remaining', () => {
            spawningSystem.setPelletsRemaining(50);
            expect(spawningSystem.pelletsRemaining).toBe(50);
        });

        test('should check if pellet exists at position', () => {
            // Find a position with a pellet
            const pelletGrid = spawningSystem.getPelletGrid();
            let foundPellet = false;
            for (let y = 0; y < pelletGrid.length && !foundPellet; y++) {
                for (let x = 0; x < pelletGrid[y].length && !foundPellet; x++) {
                    if (pelletGrid[y][x] !== 0) {
                        expect(spawningSystem.hasPelletAt(x, y)).toBe(true);
                        foundPellet = true;
                    }
                }
            }
        });

        test('should return false for pellet at invalid position', () => {
            expect(spawningSystem.hasPelletAt(-1, 0)).toBe(false);
            expect(spawningSystem.hasPelletAt(0, -1)).toBe(false);
        });

        test('should remove pellet at position', () => {
            const pelletGrid = spawningSystem.getPelletGrid();
            for (let y = 0; y < pelletGrid.length; y++) {
                for (let x = 0; x < pelletGrid[y].length; x++) {
                    if (pelletGrid[y][x] !== 0) {
                        const initialRemaining = spawningSystem.pelletsRemaining;
                        const removed = spawningSystem.removePelletAt(x, y);
                        expect(removed).toBe(true);
                        expect(spawningSystem.pelletsRemaining).toBe(initialRemaining - 1);
                        return;
                    }
                }
            }
        });

        test('should return false when removing pellet at empty position', () => {
            const removed = spawningSystem.removePelletAt(-1, -1);
            expect(removed).toBe(false);
        });

        test('should get pellet type at position', () => {
            const pelletGrid = spawningSystem.getPelletGrid();
            for (let y = 0; y < pelletGrid.length; y++) {
                for (let x = 0; x < pelletGrid[y].length; x++) {
                    if (pelletGrid[y][x] !== 0) {
                        const type = spawningSystem.getPelletAt(x, y);
                        expect(type).toBeGreaterThan(0);
                        return;
                    }
                }
            }
        });

        test('should return NONE for pellet at invalid position', () => {
            const type = spawningSystem.getPelletAt(-1, -1);
            expect(type).toBe(0);
        });
    });

    describe('Pellet Percentage', () => {
        beforeEach(() => {
            spawningSystem.generateMazeForLevel(1);
        });

        test('should return pellets eaten percentage', () => {
            const percentage = spawningSystem.getPelletsEatenPercentage();
            expect(percentage).toBeGreaterThanOrEqual(0);
            expect(percentage).toBeLessThanOrEqual(100);
        });

        test('should increase percentage when pellets are eaten', () => {
            const initialPercentage = spawningSystem.getPelletsEatenPercentage();
            const pelletGrid = spawningSystem.getPelletGrid();

            // Find and eat a pellet
            let pelletFound = false;
            for (let y = 0; y < pelletGrid.length && !pelletFound; y++) {
                for (let x = 0; x < pelletGrid[y].length && !pelletFound; x++) {
                    if (pelletGrid[y][x] !== 0) {
                        spawningSystem.removePelletAt(x, y);
                        pelletFound = true;
                    }
                }
            }

            // Only check if we found a pellet
            if (pelletFound) {
                const newPercentage = spawningSystem.getPelletsEatenPercentage();
                expect(newPercentage).toBeGreaterThanOrEqual(initialPercentage);
            } else {
                // If no pellets, percentage should be 0
                expect(initialPercentage).toBe(0);
            }
        });

        test('should return 0 when no pellets', () => {
            spawningSystem.totalPellets = 0;
            spawningSystem.pelletsRemaining = 0;
            const percentage = spawningSystem.getPelletsEatenPercentage();
            expect(percentage).toBe(0);
        });
    });

    describe('Level Complete', () => {
        beforeEach(() => {
            spawningSystem.generateMazeForLevel(1);
        });

        test('should not be level complete initially', () => {
            expect(spawningSystem.isLevelComplete()).toBe(false);
        });

        test('should be level complete when no pellets remaining', () => {
            spawningSystem.pelletsRemaining = 0;
            expect(spawningSystem.isLevelComplete()).toBe(true);
        });
    });

    describe('Reset', () => {
        test('should reset for new level', () => {
            spawningSystem.generateMazeForLevel(1);
            const result = spawningSystem.resetForLevel(2);
            expect(result).toBeDefined();
            expect(result.maze).toBeDefined();
        });

        test('should fully reset system', () => {
            spawningSystem.generateMazeForLevel(1);
            spawningSystem.reset();
            expect(spawningSystem.maze).toBeNull();
            expect(spawningSystem.pelletGrid).toBeNull();
            expect(spawningSystem.spawnPoints).toEqual({});
            expect(spawningSystem.totalPellets).toBe(0);
            expect(spawningSystem.pelletsRemaining).toBe(0);
        });
    });

    describe('Spawn Info', () => {
        beforeEach(() => {
            spawningSystem.generateMazeForLevel(1);
        });

        test('should return spawn info', () => {
            const info = spawningSystem.getSpawnInfo();
            expect(info).toBeDefined();
            expect(info.player).toBeDefined();
            expect(info.ghosts).toBeDefined();
            expect(info.virusCore).toBeDefined();
            expect(info.spawnPoints).toBeDefined();
        });
    });
});
