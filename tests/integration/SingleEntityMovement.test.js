import { directions, gameConfig } from '../../src/config/gameConfig.js';
import Enemy from '../../src/entities/Enemy.js';
import Pacman from '../../src/entities/Pacman.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { msToSeconds } from '../../src/utils/Time.js';
import { createMockMaze, createMockScene } from '../utils/testHelpers.js';

describe('Single Entity Movement Integration', () => {
    let mockScene;
    let mockMaze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockMaze = createMockMaze(createTestMaze());
    });

    describe('Pacman Movement', () => {
        let pacman;

        beforeEach(() => {
            pacman = new Pacman(mockScene, 3, 3);
        });

        test('straight line movement', () => {
            const initialX = pacman.x;
            const initialY = pacman.y;

            pacman.setDirection(directions.RIGHT);
            pacman.update(msToSeconds(16.67), mockMaze);

            expect(pacman.x).toBeGreaterThan(initialX);
            expect(pacman.y).toBe(initialY);
        });

        test('90-degree turn at intersection', () => {
            pacman.setDirection(directions.RIGHT);
            const initialY = pacman.y;

            pacman.update(msToSeconds(16.67), mockMaze);
            pacman.setDirection(directions.DOWN);
            pacman.update(msToSeconds(16.67), mockMaze);
            pacman.update(msToSeconds(16.67), mockMaze);
            pacman.update(msToSeconds(16.67), mockMaze);
            pacman.update(msToSeconds(16.67), mockMaze);
            pacman.update(msToSeconds(16.67), mockMaze);
            pacman.update(msToSeconds(16.67), mockMaze);

            expect(pacman.direction).toBe(directions.DOWN);
            expect(pacman.y).toBeGreaterThan(initialY);
        });

        test('180-degree turn with direction buffer', () => {
            pacman.direction = directions.RIGHT;
            pacman.nextDirection = directions.LEFT;

            const initialX = pacman.x;
            pacman.update(msToSeconds(16.67), mockMaze);

            expect(pacman.direction).toBe(directions.LEFT);
            expect(pacman.x).toBeLessThan(initialX);
        });

        test('wall collision stops movement', () => {
            pacman = new Pacman(mockScene, 2, 3);
            pacman.setDirection(directions.LEFT);

            const initialX = pacman.x;
            pacman.update(msToSeconds(1000), mockMaze);

            expect(pacman.x).toBeLessThan(initialX);
            expect(pacman.x).toBeGreaterThan(gameConfig.tileSize);
        });

        test('stops when surrounded by walls', () => {
            const surroundedMaze = createMockMaze(createSurroundedMaze());
            pacman = new Pacman(mockScene, 1, 1);
            pacman.direction = directions.RIGHT;

            const initialX = pacman.x;
            pacman.update(msToSeconds(16.67), surroundedMaze);

            expect(pacman.x).toBe(initialX);
            expect(pacman.isMoving).toBe(false);
        });
    });

    describe('Enemy Movement', () => {
        let enemy;
        let mockPlayer;

        beforeEach(() => {
            enemy = new Enemy(mockScene, 3, 3, 'blinky', 0xff0000);
            enemy.setDirection(directions.RIGHT);
            mockPlayer = {
                x: 100,
                y: 100,
                gridX: 5,
                gridY: 5,
                prevX: 100,
                prevY: 100
            };
        });

        test('straight line movement', () => {
            const initialX = enemy.x;
            const initialY = enemy.y;

            enemy.update(msToSeconds(16.67), mockMaze, mockPlayer);

            expect(enemy.x).toBeGreaterThan(initialX);
            expect(enemy.y).toBe(initialY);
        });

        test('90-degree turn at intersection', () => {
            enemy.setDirection(directions.DOWN);
            const initialY = enemy.y;

            enemy.update(msToSeconds(16.67), mockMaze, mockPlayer);
            enemy.update(msToSeconds(16.67), mockMaze, mockPlayer);
            enemy.update(msToSeconds(16.67), mockMaze, mockPlayer);
            enemy.update(msToSeconds(16.67), mockMaze, mockPlayer);
            enemy.update(msToSeconds(16.67), mockMaze, mockPlayer);
            enemy.update(msToSeconds(16.67), mockMaze, mockPlayer);
            enemy.update(msToSeconds(16.67), mockMaze, mockPlayer);

            expect(enemy.y).not.toBe(initialY);
        });

        test('wall collision stops movement', () => {
            enemy = new Enemy(mockScene, 2, 3, 'blinky', 0xff0000);
            enemy.setDirection(directions.LEFT);

            const initialX = enemy.x;
            enemy.update(msToSeconds(1000), mockMaze, mockPlayer);

            expect(enemy.x).toBeLessThan(initialX);
            expect(enemy.x).toBeGreaterThan(0);
        });
    });
});

function createTestMaze() {
    const maze = [];
    for (let y = 0; y < 7; y++) {
        const row = [];
        for (let x = 0; x < 7; x++) {
            if (x === 0 || x === 6 || y === 0 || y === 6) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
}

function createSurroundedMaze() {
    return [
        [TILE_TYPES.WALL, TILE_TYPES.WALL, TILE_TYPES.WALL],
        [TILE_TYPES.WALL, TILE_TYPES.PATH, TILE_TYPES.WALL],
        [TILE_TYPES.WALL, TILE_TYPES.WALL, TILE_TYPES.WALL]
    ];
}
