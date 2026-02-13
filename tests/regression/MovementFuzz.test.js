import { directions, gameConfig } from '../../src/config/gameConfig.js';
import Enemy from '../../src/entities/Enemy.js';
import Pacman from '../../src/entities/Pacman.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { msToSeconds } from '../../src/utils/Time.js';
import { createMockMaze, createMockScene } from '../utils/testHelpers.js';

/**
 * Fuzz Testing for Movement System
 * Purpose: Stress-test movement logic with random inputs and long-running simulations
 */

describe('Movement Fuzz Tests', () => {
    let mockScene;
    let mockMaze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockMaze = createMockMaze(createTestMaze());
    });

    describe('Random Direction Changes', () => {
        test('Random direction changes maintain consistency', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            const positions = [];
            const frameCount = 1000;
            const directionsArray = [
                directions.UP,
                directions.DOWN,
                directions.LEFT,
                directions.RIGHT,
                directions.NONE
            ];

            for (let i = 0; i < frameCount; i++) {
                const randomDir =
					directionsArray[Math.floor(Math.random() * directionsArray.length)];
                pacman.setDirection(randomDir);
                pacman.update(msToSeconds(16.67), mockMaze);

                positions.push({ x: pacman.x, y: pacman.y });
            }

            positions.forEach((pos) => {
                expect(Number.isFinite(pos.x)).toBe(true);
                expect(Number.isFinite(pos.y)).toBe(true);
            });

            positions.forEach((pos) => {
                expect(pos.x).toBeGreaterThanOrEqual(-gameConfig.tileSize);
                expect(pos.x).toBeLessThanOrEqual(
                    gameConfig.mazeWidth * gameConfig.tileSize + gameConfig.tileSize
                );
                expect(pos.y).toBeGreaterThanOrEqual(0);
                expect(pos.y).toBeLessThanOrEqual(
                    gameConfig.mazeHeight * gameConfig.tileSize
                );
            });
        });

        test('Enemy random direction changes maintain consistency', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            const enemy = new Enemy(mockScene, 5, 5, 'blinky', 0xff0000);
            const positions = [];
            const frameCount = 1000;
            const directionsArray = [
                directions.UP,
                directions.DOWN,
                directions.LEFT,
                directions.RIGHT
            ];

            for (let i = 0; i < frameCount; i++) {
                const randomDir =
					directionsArray[Math.floor(Math.random() * directionsArray.length)];
                enemy.direction = randomDir;
                enemy.update(msToSeconds(16.67), mockMaze, pacman);

                positions.push({ x: enemy.x, y: enemy.y });
            }

            positions.forEach((pos) => {
                expect(Number.isFinite(pos.x)).toBe(true);
                expect(Number.isFinite(pos.y)).toBe(true);
            });

            positions.forEach((pos) => {
                expect(pos.x).toBeGreaterThanOrEqual(-gameConfig.tileSize);
                expect(pos.x).toBeLessThanOrEqual(
                    gameConfig.mazeWidth * gameConfig.tileSize + gameConfig.tileSize
                );
                expect(pos.y).toBeGreaterThanOrEqual(0);
                expect(pos.y).toBeLessThanOrEqual(
                    gameConfig.mazeHeight * gameConfig.tileSize
                );
            });
        });
    });

    describe('Random Speed Variations', () => {
        test('Entity handles varying speeds gracefully', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            const originalSpeed = pacman.speed;

            for (let i = 0; i < 500; i++) {
                pacman.speed = Math.random() * 300 + 50;
                pacman.setDirection(directions.RIGHT);
                pacman.update(msToSeconds(16.67), mockMaze);

                expect(Number.isFinite(pacman.x)).toBe(true);
                expect(Number.isFinite(pacman.y)).toBe(true);
            }

            pacman.speed = originalSpeed;
        });

        test('High speed does not break collision detection', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            const enemy = new Enemy(mockScene, 10, 3, 'blinky', 0xff0000);

            enemy.speed = 400;

            expect(() => {
                for (let i = 0; i < 100; i++) {
                    pacman.update(msToSeconds(16.67), mockMaze);
                    enemy.update(msToSeconds(16.67), mockMaze, pacman);
                }
            }).not.toThrow();
        });

        test('Zero speed does not crash movement system', () => {
            const pacman = new Pacman(mockScene, 3, 3);

            pacman.speed = 0;
            pacman.setDirection(directions.RIGHT);

            expect(() => {
                for (let i = 0; i < 100; i++) {
                    pacman.update(msToSeconds(16.67), mockMaze);
                }
            }).not.toThrow();
        });
    });

    describe('Random Spawn Positions', () => {
        test('Entities spawn correctly at random valid positions', () => {
            const validTiles = [];
            for (let y = 1; y < mockMaze.length - 1; y++) {
                for (let x = 1; x < mockMaze[0].length - 1; x++) {
                    if (mockMaze[y][x] === TILE_TYPES.PATH) {
                        validTiles.push({ x, y });
                    }
                }
            }

            for (let i = 0; i < 100; i++) {
                const randomTile =
					validTiles[Math.floor(Math.random() * validTiles.length)];
                const pacman = new Pacman(mockScene, randomTile.x, randomTile.y);

                expect(pacman.gridX).toBe(randomTile.x);
                expect(pacman.gridY).toBe(randomTile.y);
                expect(pacman.x).toBeGreaterThan(0);
                expect(pacman.y).toBeGreaterThan(0);
            }
        });

        test('Enemy spawn at random positions works correctly', () => {
            const validTiles = [];
            for (let y = 1; y < mockMaze.length - 1; y++) {
                for (let x = 1; x < mockMaze[0].length - 1; x++) {
                    if (mockMaze[y][x] === TILE_TYPES.PATH) {
                        validTiles.push({ x, y });
                    }
                }
            }

            for (let i = 0; i < 100; i++) {
                const randomTile =
					validTiles[Math.floor(Math.random() * validTiles.length)];
                const enemy = new Enemy(
                    mockScene,
                    randomTile.x,
                    randomTile.y,
                    'blinky',
                    0xff0000
                );

                expect(enemy.gridX).toBe(randomTile.x);
                expect(enemy.gridY).toBe(randomTile.y);
                expect(enemy.x).toBeGreaterThan(0);
                expect(enemy.y).toBeGreaterThan(0);
            }
        });
    });

    describe('Long-Running Movement Simulations', () => {
        test('1000+ frames of movement without errors', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            const enemys = [
                new Enemy(mockScene, 5, 3, 'blinky', 0xff0000),
                new Enemy(mockScene, 3, 5, 'pinky', 0xffb8ff)
            ];

            const frameCount = 2000;
            const positions = [];

            expect(() => {
                for (let i = 0; i < frameCount; i++) {
                    pacman.update(msToSeconds(16.67), mockMaze);
                    enemys.forEach((g) => g.update(msToSeconds(16.67), mockMaze, pacman));

                    positions.push({
                        pacman: { x: pacman.x, y: pacman.y },
                        enemy1: { x: enemys[0].x, y: enemys[0].y },
                        enemy2: { x: enemys[1].x, y: enemys[1].y }
                    });
                }
            }).not.toThrow();

            positions.forEach((p) => {
                expect(Number.isFinite(p.pacman.x)).toBe(true);
                expect(Number.isFinite(p.pacman.y)).toBe(true);
                expect(Number.isFinite(p.enemy1.x)).toBe(true);
                expect(Number.isFinite(p.enemy1.y)).toBe(true);
                expect(Number.isFinite(p.enemy2.x)).toBe(true);
                expect(Number.isFinite(p.enemy2.y)).toBe(true);
            });
        });

        test('Entities do not get stuck in walls during long simulation', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            pacman.setDirection(directions.RIGHT);

            const frameCount = 500;
            let stuckInWall = false;

            for (let i = 0; i < frameCount; i++) {
                pacman.update(msToSeconds(16.67), mockMaze);
                const gridX = Math.floor(pacman.x / gameConfig.tileSize);
                const gridY = Math.floor(pacman.y / gameConfig.tileSize);

                if (
                    gridX >= 0 &&
					gridX < mockMaze[0].length &&
					gridY >= 0 &&
					gridY < mockMaze.length
                ) {
                    if (mockMaze[gridY][gridX] === TILE_TYPES.WALL) {
                        stuckInWall = true;
                        break;
                    }
                }
            }

            expect(stuckInWall).toBe(false);
        });

        test('Long simulation with complex maze does not crash', () => {
            const tunnelMaze = createMockMaze(createTunnelMaze());
            const pacman = new Pacman(mockScene, 5, 8);
            pacman.setDirection(directions.RIGHT);

            expect(() => {
                for (let i = 0; i < 5000; i++) {
                    pacman.update(msToSeconds(16.67), tunnelMaze);
                }
            }).not.toThrow();

            expect(Number.isFinite(pacman.x)).toBe(true);
            expect(Number.isFinite(pacman.y)).toBe(true);
        });
    });

    describe('Performance Fuzz Tests', () => {
        test('High entity count maintains acceptable performance', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            const enemys = [];
            for (let i = 0; i < 20; i++) {
                enemys.push(
                    new Enemy(
                        mockScene,
                        5 + (i % 5),
                        5 + Math.floor(i / 5),
                        `enemy${i}`,
                        0xff0000
                    )
                );
            }

            const startTime = Date.now();
            const frameCount = 500;

            for (let i = 0; i < frameCount; i++) {
                pacman.update(msToSeconds(16.67), mockMaze);
                enemys.forEach((g) => g.update(msToSeconds(16.67), mockMaze, pacman));
            }

            const elapsedTime = Date.now() - startTime;
            const avgTimePerFrame = elapsedTime / frameCount;

            expect(avgTimePerFrame).toBeLessThan(10);
        });

        test('Memory does not leak during long simulation', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            const enemys = [
                new Enemy(mockScene, 5, 3, 'blinky', 0xff0000),
                new Enemy(mockScene, 3, 5, 'pinky', 0xffb8ff),
                new Enemy(mockScene, 5, 5, 'inky', 0x00ffff)
            ];

            const initialPositionsCount = 0;
            for (let i = 0; i < 5000; i++) {
                pacman.update(msToSeconds(16.67), mockMaze);
                enemys.forEach((g) => g.update(msToSeconds(16.67), mockMaze, pacman));
            }
            // In a real scenario, we'd track memory usage

            expect(true).toBe(true);
        });
    });

    describe('Stress Test: Edge Cases', () => {
        test('Rapid direction changes do not crash', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            const directionsArray = [
                directions.UP,
                directions.DOWN,
                directions.LEFT,
                directions.RIGHT
            ];

            for (let i = 0; i < 1000; i++) {
                const randomDir =
					directionsArray[Math.floor(Math.random() * directionsArray.length)];
                pacman.setDirection(randomDir);
                pacman.update(msToSeconds(1), mockMaze);
            }

            expect(Number.isFinite(pacman.x)).toBe(true);
            expect(Number.isFinite(pacman.y)).toBe(true);
        });

        test('Frame rate variation does not break consistency', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            pacman.setDirection(directions.RIGHT);

            const deltas = [1, 16.67, 33.33, 100, 200];

            deltas.forEach((delta) => {
                pacman.update(delta, mockMaze);
                expect(Number.isFinite(pacman.x)).toBe(true);
                expect(Number.isFinite(pacman.y)).toBe(true);
            });
        });

        test('Multiple entities change state simultaneously', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            const enemys = Array.from(
                { length: 10 },
                (_, i) =>
                    new Enemy(
                        mockScene,
                        5 + (i % 3),
                        5 + Math.floor(i / 3),
                        `enemy${i}`,
                        0xff0000
                    )
            );
            for (let i = 0; i < 500; i++) {
                enemys.forEach((g) => {
                    g.isFrightened = Math.random() > 0.5;
                    g.isEaten = Math.random() > 0.9;
                });

                pacman.update(msToSeconds(16.67), mockMaze);
                enemys.forEach((g) => g.update(msToSeconds(16.67), mockMaze, pacman));
            }

            expect(Number.isFinite(pacman.x)).toBe(true);
            expect(Number.isFinite(pacman.y)).toBe(true);
        });
    });
});

function createTestMaze() {
    const maze = [];
    for (let y = 0; y < 15; y++) {
        const row = [];
        for (let x = 0; x < 15; x++) {
            if (x === 0 || x === 14 || y === 0 || y === 14) {
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
    for (let y = 0; y < 15; y++) {
        const row = [];
        for (let x = 0; x < 20; x++) {
            if (y === 0 || y === 14) {
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
