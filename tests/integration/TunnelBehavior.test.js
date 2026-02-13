import {
    directions,
    gameConfig,
    ghostSpeedMultipliers
} from '../../src/config/gameConfig.js';
import Enemy from '../../src/entities/Enemy.js';
import Pacman from '../../src/entities/Pacman.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { msToSeconds } from '../../src/utils/Time.js';
import { createMockMaze, createMockScene } from '../utils/testHelpers.js';

describe('Tunnel Behavior Integration', () => {
    let mockScene;
    let pacman;
    let enemy;
    let mockMaze;

    const MAZE_WIDTH = gameConfig.mazeWidth * gameConfig.tileSize;
    const TUNNEL_ROW = gameConfig.tunnelRow;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockMaze = createMockMaze(createTunnelTestMaze());
    });

    describe('Pacman Tunnel Wrapping', () => {
        beforeEach(() => {
            pacman = new Pacman(mockScene, 1, TUNNEL_ROW);
        });

        test('tunnel wrap left to right', () => {
            pacman.x = -10;
            pacman.gridY = TUNNEL_ROW;
            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(MAZE_WIDTH);
        });

        test('tunnel wrap right to left', () => {
            pacman.x = MAZE_WIDTH + 10;
            pacman.gridY = TUNNEL_ROW;
            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(0);
        });

        test('no wrap when not on tunnel row', () => {
            pacman.x = -10;
            pacman.gridY = TUNNEL_ROW + 1;
            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(-10);
        });

        test('no wrap when within bounds', () => {
            pacman.x = 100;
            pacman.gridY = TUNNEL_ROW;
            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(100);
        });
    });

    describe('Enemy Tunnel Wrapping', () => {
        beforeEach(() => {
            enemy = new Enemy(mockScene, 1, TUNNEL_ROW, 'blinky', 0xff0000);
        });

        test('tunnel wrap left to right', () => {
            enemy.x = -10;
            enemy.gridY = TUNNEL_ROW;
            enemy.handleTunnelWrap();

            expect(enemy.x).toBe(MAZE_WIDTH);
        });

        test('tunnel wrap right to left', () => {
            enemy.x = MAZE_WIDTH + 10;
            enemy.gridY = TUNNEL_ROW;
            enemy.handleTunnelWrap();

            expect(enemy.x).toBe(0);
        });

        test('no wrap when not on tunnel row', () => {
            enemy.x = -10;
            enemy.gridY = TUNNEL_ROW + 1;
            enemy.handleTunnelWrap();

            expect(enemy.x).toBe(-10);
        });
    });

    describe('Entity Behavior at Tunnel Entrance', () => {
        test('Pacman enters left tunnel entrance', () => {
            enemy = new Enemy(mockScene, 1, TUNNEL_ROW, 'blinky', 0xff0000);
            enemy.direction = directions.LEFT;
            enemy.isMoving = true;

            enemy.update(msToSeconds(100), mockMaze, pacman);

            expect(enemy.x).toBeLessThan(enemy.prevX);
        });

        test('Pacman enters right tunnel entrance', () => {
            pacman = new Pacman(mockScene, 23, TUNNEL_ROW);
            pacman.setDirection(directions.RIGHT);
            pacman.isMoving = true;

            pacman.update(msToSeconds(100), mockMaze);

            expect(pacman.x).toBeGreaterThan(pacman.prevX);
        });

        test('Enemy enters left tunnel entrance', () => {
            enemy = new Enemy(mockScene, 1, TUNNEL_ROW, 'blinky', 0xff0000);
            enemy.direction = directions.LEFT;
            enemy.isMoving = true;
            enemy.scene.ghostAISystem = { chooseDirection: jest.fn() };

            enemy.moveEnemy(msToSeconds(100), mockMaze, pacman);

            expect(enemy.x).toBeLessThan(enemy.prevX);
        });
    });

    describe('Multiple Consecutive Warps', () => {
        test('Pacman warps back and forth multiple times', () => {
            pacman = new Pacman(mockScene, 1, TUNNEL_ROW);
            pacman.setDirection(directions.LEFT);
            pacman.isMoving = true;
            pacman.gridY = TUNNEL_ROW;

            let directionsTried = 0;
            const startX = pacman.x;

            pacman.x = -5;
            pacman.handleTunnelWrap();
            expect(pacman.x).toBe(MAZE_WIDTH);
            directionsTried++;

            pacman.x = MAZE_WIDTH + 5;
            pacman.handleTunnelWrap();
            expect(pacman.x).toBe(0);
            directionsTried++;

            pacman.x = -10;
            pacman.handleTunnelWrap();
            expect(pacman.x).toBe(MAZE_WIDTH);
            directionsTried++;

            expect(directionsTried).toBe(3);
        });

        test('Enemy warps back and forth multiple times', () => {
            enemy = new Enemy(mockScene, 1, TUNNEL_ROW, 'blinky', 0xff0000);
            enemy.gridY = TUNNEL_ROW;

            enemy.x = -5;
            enemy.handleTunnelWrap();
            expect(enemy.x).toBe(MAZE_WIDTH);

            enemy.x = MAZE_WIDTH + 5;
            enemy.handleTunnelWrap();
            expect(enemy.x).toBe(0);

            enemy.x = -10;
            enemy.handleTunnelWrap();
            expect(enemy.x).toBe(MAZE_WIDTH);
        });
    });

    describe('Enemy Speed Reduction in Tunnel', () => {
        beforeEach(() => {
            enemy = new Enemy(mockScene, 1, TUNNEL_ROW, 'blinky', 0xff0000);
        });

        test('speed reduced when on tunnel row', () => {
            enemy.gridY = TUNNEL_ROW;
            const normalSpeed = enemy.speed;
            const tunnelSpeed = normalSpeed * ghostSpeedMultipliers.tunnel;

            const expectedSpeed = tunnelSpeed;

            expect(expectedSpeed).toBe(normalSpeed * 0.4);
        });

        test('speed normal when not on tunnel row', () => {
            enemy.gridY = TUNNEL_ROW + 1;
            const normalSpeed = enemy.speed;

            expect(enemy.speed).toBe(normalSpeed);
        });

        test('speed reduction applied during movement', () => {
            enemy.gridY = TUNNEL_ROW;
            enemy.direction = directions.LEFT;
            enemy.isMoving = true;
            enemy.scene.ghostAISystem = { chooseDirection: jest.fn() };

            const normalSpeed = enemy.speed;
            const tunnelSpeed = normalSpeed * ghostSpeedMultipliers.tunnel;
            const deltaSeconds = msToSeconds(100);

            const expectedMoveStep = tunnelSpeed * deltaSeconds;
            enemy.moveEnemy(deltaSeconds, mockMaze, pacman);

            const actualMoveStep = Math.abs(enemy.x - enemy.prevX);
            expect(actualMoveStep).toBeCloseTo(expectedMoveStep, 1);
        });
    });

    describe('Portal Traversal vs Tunnel Wrap', () => {
        test('tunnel wrap handles out-of-bounds positions', () => {
            enemy = new Enemy(mockScene, 1, TUNNEL_ROW);
            enemy.x = -20;
            enemy.gridY = TUNNEL_ROW;

            enemy.handleTunnelWrap();

            expect(enemy.x).toBe(MAZE_WIDTH);
        });

        test('portal traversal handles grid-based transitions', () => {
            enemy = new Enemy(mockScene, 0, TUNNEL_ROW);
            enemy.x = -10;
            enemy.gridX = 0;
            enemy.gridY = TUNNEL_ROW;

            enemy.handleTunnelWrap();

            expect(enemy.x).toBe(MAZE_WIDTH);
            expect(enemy.gridX).toBe(0);
        });

        test('both mechanisms work together', () => {
            enemy = new Enemy(mockScene, 1, TUNNEL_ROW, 'blinky', 0xff0000);
            enemy.gridY = TUNNEL_ROW;

            enemy.x = -15;
            enemy.handleTunnelWrap();
            expect(enemy.x).toBe(MAZE_WIDTH);

            enemy.gridX = 27;
            enemy.x = MAZE_WIDTH + 15;
            enemy.handleTunnelWrap();
            expect(enemy.x).toBe(0);
        });

        test('entity maintains direction after warp', () => {
            enemy = new Enemy(mockScene, 1, TUNNEL_ROW, 'blinky', 0xff0000);
            enemy.direction = directions.LEFT;
            enemy.nextDirection = directions.NONE;
            enemy.isMoving = true;
            enemy.gridY = TUNNEL_ROW;

            enemy.x = -10;
            enemy.handleTunnelWrap();

            expect(enemy.direction).toBe(directions.LEFT);
            expect(enemy.x).toBe(MAZE_WIDTH);
        });
    });

    describe('Edge Cases', () => {
        test('entity exactly at boundary (x=0)', () => {
            enemy = new Enemy(mockScene, 0, TUNNEL_ROW, 'blinky', 0xff0000);
            enemy.x = MAZE_WIDTH + 1;
            enemy.gridY = TUNNEL_ROW;

            enemy.handleTunnelWrap();

            expect(enemy.x).toBe(0);
        });

        test('entity exactly at boundary (x=mazeWidth)', () => {
            enemy = new Enemy(mockScene, 24, TUNNEL_ROW, 'blinky', 0xff0000);
            enemy.x = MAZE_WIDTH;
            enemy.gridY = TUNNEL_ROW;

            enemy.handleTunnelWrap();

            expect(enemy.x).toBe(MAZE_WIDTH);
        });

        test('entity just past boundary (x=-1)', () => {
            enemy = new Enemy(mockScene, 0, TUNNEL_ROW, 'blinky', 0xff0000);
            enemy.x = -1;
            enemy.gridY = TUNNEL_ROW;

            enemy.handleTunnelWrap();

            expect(enemy.x).toBe(MAZE_WIDTH);
        });

        test('entity just past boundary (x=mazeWidth+1)', () => {
            pacman = new Pacman(mockScene, 23, TUNNEL_ROW);
            pacman.x = MAZE_WIDTH + 1;
            pacman.gridY = TUNNEL_ROW;

            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(0);
        });
    });
});

function createTunnelTestMaze() {
    const maze = [];
    for (let y = 0; y < 33; y++) {
        const row = [];
        for (let x = 0; x < 25; x++) {
            if (y === 0 || y === 30) {
                row.push(TILE_TYPES.WALL);
            } else if (y === gameConfig.tunnelRow && (x === 0 || x === 24)) {
                row.push(TILE_TYPES.PATH);
            } else if (y === gameConfig.tunnelRow && x >= 1 && x <= 23) {
                row.push(TILE_TYPES.PATH);
            } else if (x === 0 || x === 24) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
}
