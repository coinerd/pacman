import Pacman from '../../src/entities/Pacman.js';
import Ghost from '../../src/entities/Ghost.js';
import { gameConfig, directions, ghostSpeedMultipliers } from '../../src/config/gameConfig.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { createMockScene, createMockMaze } from '../utils/testHelpers.js';

describe('Tunnel Behavior Integration', () => {
    let mockScene;
    let pacman;
    let ghost;
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

    describe('Ghost Tunnel Wrapping', () => {
        beforeEach(() => {
            ghost = new Ghost(mockScene, 1, TUNNEL_ROW, 'blinky', 0xFF0000);
        });

        test('tunnel wrap left to right', () => {
            ghost.x = -10;
            ghost.gridY = TUNNEL_ROW;
            ghost.handleTunnelWrap();

            expect(ghost.x).toBe(MAZE_WIDTH);
        });

        test('tunnel wrap right to left', () => {
            ghost.x = MAZE_WIDTH + 10;
            ghost.gridY = TUNNEL_ROW;
            ghost.handleTunnelWrap();

            expect(ghost.x).toBe(0);
        });

        test('no wrap when not on tunnel row', () => {
            ghost.x = -10;
            ghost.gridY = TUNNEL_ROW + 1;
            ghost.handleTunnelWrap();

            expect(ghost.x).toBe(-10);
        });
    });

    describe('Entity Behavior at Tunnel Entrance', () => {
        test('Pacman enters left tunnel entrance', () => {
            pacman = new Pacman(mockScene, 1, TUNNEL_ROW);
            pacman.setDirection(directions.LEFT);
            pacman.isMoving = true;

            pacman.update(100, mockMaze);

            expect(pacman.x).toBeLessThan(pacman.prevX);
        });

        test('Pacman enters right tunnel entrance', () => {
            pacman = new Pacman(mockScene, 26, TUNNEL_ROW);
            pacman.setDirection(directions.RIGHT);
            pacman.isMoving = true;

            pacman.update(100, mockMaze);

            expect(pacman.x).toBeGreaterThan(pacman.prevX);
        });

        test('Ghost enters left tunnel entrance', () => {
            ghost = new Ghost(mockScene, 1, TUNNEL_ROW, 'blinky', 0xFF0000);
            ghost.direction = directions.LEFT;
            ghost.isMoving = true;
            ghost.scene.ghostAISystem = { chooseDirection: jest.fn() };

            ghost.moveGhost(100, mockMaze, pacman);

            expect(ghost.x).toBeLessThan(ghost.prevX);
        });
    });

    describe('Multiple Consecutive Warps', () => {
        test('Pacman warps back and forth multiple times', () => {
            pacman = new Pacman(mockScene, 1, TUNNEL_ROW);
            pacman.setDirection(directions.LEFT);
            pacman.isMoving = true;
            pacman.gridY = TUNNEL_ROW;

            let directionsTried = 0;
            let startX = pacman.x;

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

        test('Ghost warps back and forth multiple times', () => {
            ghost = new Ghost(mockScene, 1, TUNNEL_ROW, 'blinky', 0xFF0000);
            ghost.gridY = TUNNEL_ROW;

            ghost.x = -5;
            ghost.handleTunnelWrap();
            expect(ghost.x).toBe(MAZE_WIDTH);

            ghost.x = MAZE_WIDTH + 5;
            ghost.handleTunnelWrap();
            expect(ghost.x).toBe(0);

            ghost.x = -10;
            ghost.handleTunnelWrap();
            expect(ghost.x).toBe(MAZE_WIDTH);
        });
    });

    describe('Ghost Speed Reduction in Tunnel', () => {
        beforeEach(() => {
            ghost = new Ghost(mockScene, 1, TUNNEL_ROW, 'blinky', 0xFF0000);
        });

        test('speed reduced when on tunnel row', () => {
            ghost.gridY = TUNNEL_ROW;
            const normalSpeed = ghost.speed;
            const tunnelSpeed = normalSpeed * ghostSpeedMultipliers.tunnel;

            const expectedSpeed = tunnelSpeed;

            expect(expectedSpeed).toBe(normalSpeed * 0.4);
        });

        test('speed normal when not on tunnel row', () => {
            ghost.gridY = TUNNEL_ROW + 1;
            const normalSpeed = ghost.speed;

            expect(ghost.speed).toBe(normalSpeed);
        });

        test('speed reduction applied during movement', () => {
            ghost.gridY = TUNNEL_ROW;
            ghost.direction = directions.LEFT;
            ghost.isMoving = true;
            ghost.scene.ghostAISystem = { chooseDirection: jest.fn() };

            const normalSpeed = ghost.speed;
            const tunnelSpeed = normalSpeed * ghostSpeedMultipliers.tunnel;
            const delta = 100;

            const expectedMoveStep = tunnelSpeed * (delta / 1000);
            ghost.moveGhost(delta, mockMaze, pacman);

            const actualMoveStep = Math.abs(ghost.x - ghost.prevX);
            expect(actualMoveStep).toBeCloseTo(expectedMoveStep, 1);
        });
    });

    describe('Portal Traversal vs Tunnel Wrap', () => {
        test('tunnel wrap handles out-of-bounds positions', () => {
            pacman = new Pacman(mockScene, 1, TUNNEL_ROW);
            pacman.x = -20;
            pacman.gridY = TUNNEL_ROW;

            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(MAZE_WIDTH);
        });

        test('portal traversal handles grid-based transitions', () => {
            pacman = new Pacman(mockScene, 0, TUNNEL_ROW);
            pacman.x = -10;
            pacman.gridX = 0;
            pacman.gridY = TUNNEL_ROW;

            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(MAZE_WIDTH);
            expect(pacman.gridX).toBe(0);
        });

        test('both mechanisms work together', () => {
            ghost = new Ghost(mockScene, 1, TUNNEL_ROW, 'blinky', 0xFF0000);
            ghost.gridY = TUNNEL_ROW;

            ghost.x = -15;
            ghost.handleTunnelWrap();
            expect(ghost.x).toBe(MAZE_WIDTH);

            ghost.gridX = 27;
            ghost.x = MAZE_WIDTH + 15;
            ghost.handleTunnelWrap();
            expect(ghost.x).toBe(0);
        });

        test('entity maintains direction after warp', () => {
            pacman = new Pacman(mockScene, 1, TUNNEL_ROW);
            pacman.direction = directions.LEFT;
            pacman.nextDirection = directions.NONE;
            pacman.isMoving = true;
            pacman.gridY = TUNNEL_ROW;

            pacman.x = -10;
            pacman.handleTunnelWrap();

            expect(pacman.direction).toBe(directions.LEFT);
            expect(pacman.x).toBe(MAZE_WIDTH);
        });
    });

    describe('Edge Cases', () => {
        test('entity exactly at boundary (x=0)', () => {
            pacman = new Pacman(mockScene, 0, TUNNEL_ROW);
            pacman.x = 0;
            pacman.gridY = TUNNEL_ROW;

            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(0);
        });

        test('entity exactly at boundary (x=mazeWidth)', () => {
            pacman = new Pacman(mockScene, 27, TUNNEL_ROW);
            pacman.x = MAZE_WIDTH;
            pacman.gridY = TUNNEL_ROW;

            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(MAZE_WIDTH);
        });

        test('entity just past boundary (x=-1)', () => {
            pacman = new Pacman(mockScene, 0, TUNNEL_ROW);
            pacman.x = -1;
            pacman.gridY = TUNNEL_ROW;

            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(MAZE_WIDTH);
        });

        test('entity just past boundary (x=mazeWidth+1)', () => {
            pacman = new Pacman(mockScene, 27, TUNNEL_ROW);
            pacman.x = MAZE_WIDTH + 1;
            pacman.gridY = TUNNEL_ROW;

            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(0);
        });
    });
});

function createTunnelTestMaze() {
    const maze = [];
    for (let y = 0; y < 31; y++) {
        const row = [];
        for (let x = 0; x < 28; x++) {
            if (y === 0 || y === 30) {
                row.push(TILE_TYPES.WALL);
            } else if (y === gameConfig.tunnelRow && (x === 0 || x === 27)) {
                row.push(TILE_TYPES.PATH);
            } else if (y === gameConfig.tunnelRow && x >= 1 && x <= 26) {
                row.push(TILE_TYPES.PATH);
            } else if (x === 0 || x === 27) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
}
