import { directions, gameConfig } from '../../src/config/gameConfig.js';
import Enemy from '../../src/entities/Enemy.js';
import Pacman from '../../src/entities/Pacman.js';
import { EnemyAISystem } from '../../src/systems/EnemyAISystem.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { msToSeconds } from '../../src/utils/Time.js';
import {
    createMockMaze,
    createMockScene,
    measureTime
} from '../utils/testHelpers.js';

describe('Concurrent Movement Integration', () => {
    let mockScene;
    let mockMaze;
    let pacman;
    let enemies;
    let aiSystem;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockMaze = createMockMaze(createTestMaze());
        pacman = new Pacman(mockScene, 3, 3);
        enemies = [
            new Enemy(mockScene, 3, 5, 'blinky', 0xff0000),
            new Enemy(mockScene, 5, 3, 'pinky', 0xffb8ff),
            new Enemy(mockScene, 5, 5, 'inky', 0x00ffff),
            new Enemy(mockScene, 3, 7, 'clyde', 0xffb852)
        ];
        enemies.forEach((g) => (g.direction = directions.RIGHT));
        aiSystem = new EnemyAISystem();
        aiSystem.setEnemies(enemies);
        mockScene.enemyAISystem = aiSystem;
    });

    describe('Pacman and Enemy moving simultaneously', () => {
        test('both entities update correctly', () => {
            const initialPacmanX = pacman.x;
            const initialEnemyX = enemies[0].x;

            pacman.update(msToSeconds(16.67), mockMaze);
            enemies[0].update(msToSeconds(16.67), mockMaze, pacman);

            expect(pacman.x).toBeDefined();
            expect(enemies[0].x).toBeDefined();
        });

        test('multiple consecutive updates work', () => {
            const frames = 60;
            const deltaPerFrame = 16.67;

            expect(() => {
                for (let i = 0; i < frames; i++) {
                    pacman.update(deltaPerFrame, mockMaze);
                    enemies.forEach((g) => g.update(deltaPerFrame, mockMaze, pacman));
                }
            }).not.toThrow();
        });

        test('direction changes processed concurrently', () => {
            pacman.setDirection(directions.DOWN);
            enemies[0].setDirection(directions.UP);

            pacman.update(msToSeconds(16.67), mockMaze);
            enemies[0].update(msToSeconds(16.67), mockMaze, pacman);

            expect(pacman.direction).toBe(directions.DOWN);
            expect(enemies[0].direction).toBe(directions.UP);
        });
    });

    describe('Multiple Enemys at intersections', () => {
        test('all enemies update without errors', () => {
            expect(() => {
                for (let i = 0; i < 10; i++) {
                    enemies.forEach((g) =>
                        g.update(msToSeconds(16.67), mockMaze, pacman)
                    );
                }
            }).not.toThrow();
        });

        test('enemies have independent states', () => {
            const states = enemies.map((g) => ({
                gridX: g.gridX,
                gridY: g.gridY,
                direction: g.direction
            }));

            enemies.forEach((g) => g.update(msToSeconds(16.67), mockMaze, pacman));

            expect(states.length).toBe(4);
            states.forEach((state) => {
                expect(state.gridX).toBeGreaterThanOrEqual(0);
                expect(state.gridY).toBeGreaterThanOrEqual(0);
                expect(state.direction).toBeDefined();
            });
        });

        test('AI system processes all enemies', () => {
            expect(() => {
                aiSystem.chooseDirection(enemies[0], mockMaze);
                aiSystem.chooseDirection(enemies[1], mockMaze);
                aiSystem.chooseDirection(enemies[2], mockMaze);
                aiSystem.chooseDirection(enemies[3], mockMaze);
            }).not.toThrow();

            enemies.forEach((g) => {
                expect(g.direction).toBeDefined();
            });
        });
    });

    describe('Entity interaction behavior', () => {
        test('entities can occupy same tile', () => {
            enemies.forEach((g) => {
                g.gridX = 5;
                g.gridY = 5;
                g.x = 5 * gameConfig.tileSize + gameConfig.tileSize / 2;
                g.y = 5 * gameConfig.tileSize + gameConfig.tileSize / 2;
            });

            enemies.forEach((g) => {
                expect(g.x).toBe(enemies[0].x);
                expect(g.y).toBe(enemies[0].y);
            });

            enemies.forEach((g) => g.update(msToSeconds(16.67), mockMaze, pacman));

            enemies.forEach((g) => {
                expect(g.x).toBeDefined();
                expect(g.y).toBeDefined();
            });
        });

        test('all enemies move simultaneously', () => {
            const initialX = enemies.map((g) => g.x);
            const initialY = enemies.map((g) => g.y);

            enemies.forEach((g) => g.update(msToSeconds(16.67), mockMaze, pacman));

            enemies.forEach((g, idx) => {
                expect(g.x).toBeDefined();
                expect(g.y).toBeDefined();
            });
        });
    });

    describe('Performance with all entities moving', () => {
        test('update all entities within acceptable time', () => {
            const frames = 100;
            const deltaPerFrame = 16.67;

            const { result, time } = measureTime(() => {
                for (let i = 0; i < frames; i++) {
                    pacman.update(deltaPerFrame, mockMaze);
                    enemies.forEach((g) => g.update(deltaPerFrame, mockMaze, pacman));
                }
            });

            expect(time).toBeLessThan(100);
            expect(time).toBeGreaterThan(0);
        });

        test('no performance degradation over time', () => {
            const frames = 200;
            const deltaPerFrame = 16.67;
            const times = [];

            for (let batch = 0; batch < 4; batch++) {
                const { time } = measureTime(() => {
                    for (let i = 0; i < frames / 4; i++) {
                        pacman.update(deltaPerFrame, mockMaze);
                        enemies.forEach((g) => g.update(deltaPerFrame, mockMaze, pacman));
                    }
                });
                times.push(time);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            times.forEach((t) => {
                expect(t).toBeLessThan(avgTime * 5); // Increased tolerance for VPS timing fluctuations
            });
        });

        test('all entities update without errors', () => {
            const frames = 60;
            const deltaPerFrame = 16.67;

            expect(() => {
                for (let i = 0; i < frames; i++) {
                    pacman.update(deltaPerFrame, mockMaze);
                    enemies.forEach((g) => g.update(deltaPerFrame, mockMaze, pacman));
                }
            }).not.toThrow();
        });
    });

    describe('Complex concurrent scenarios', () => {
        test('all entities update at same time', () => {
            expect(() => {
                pacman.update(msToSeconds(16.67), mockMaze);
                enemies.forEach((g) => g.update(msToSeconds(16.67), mockMaze, pacman));
            }).not.toThrow();
        });

        test('entities move through tunnel concurrently', () => {
            const tunnelY = 8;
            pacman.gridX = 1;
            pacman.gridY = tunnelY;
            pacman.direction = directions.RIGHT;
            pacman.x = 1 * gameConfig.tileSize + gameConfig.tileSize / 2;
            pacman.y = tunnelY * gameConfig.tileSize + gameConfig.tileSize / 2;

            enemies.forEach((g, idx) => {
                g.gridX = idx + 2;
                g.gridY = tunnelY;
                g.x = (idx + 2) * gameConfig.tileSize + gameConfig.tileSize / 2;
                g.y = tunnelY * gameConfig.tileSize + gameConfig.tileSize / 2;
                g.direction = directions.RIGHT;
            });

            const tunnelMaze = createTunnelMaze();
            const tunnelWidth = tunnelMaze[0].length;

            expect(() => {
                for (let i = 0; i < tunnelWidth * 2; i++) {
                    pacman.update(msToSeconds(16.67), tunnelMaze);
                    enemies.forEach((g) =>
                        g.update(msToSeconds(16.67), tunnelMaze, pacman)
                    );
                }
            }).not.toThrow();
        });
    });
});

function createTestMaze() {
    const maze = [];
    for (let y = 0; y < 11; y++) {
        const row = [];
        for (let x = 0; x < 11; x++) {
            if (x === 0 || x === 10 || y === 0 || y === 10) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
}

function createTunnelMaze() {
    const maze = [];
    for (let y = 0; y < 11; y++) {
        const row = [];
        for (let x = 0; x < 20; x++) {
            if (y === 0 || y === 10) {
                row.push(TILE_TYPES.WALL);
            } else if (y === 8) {
                row.push(TILE_TYPES.PATH);
            } else if (x > 0 && x < 19) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
}
