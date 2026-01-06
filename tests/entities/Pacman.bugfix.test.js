import Pacman from '../../src/entities/Pacman.js';
import { gameConfig, directions, levelConfig } from '../../src/config/gameConfig.js';
import { createMockScene, createSimpleMaze } from '../utils/testHelpers.js';

describe('Pacman - Bug Fixes', () => {
    let mockScene;
    let pacman;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
    });

    describe('Bug Fix: Center detection uses correct threshold', () => {
        test('does not update grid when distance equals moveStep', () => {
            pacman.x = 100;
            pacman.y = 100;
            pacman.direction = directions.RIGHT;
            pacman.speed = 100;

            const delta = 100;
            const moveStep = pacman.speed * (delta / 1000);

            pacman.update(delta, maze);

            expect(pacman.gridX).toBe(5);
        });

        test('does not update grid when distance is not less than moveStep', () => {
            const speed = 150;
            const delta = 16;
            const moveStep = speed * (delta / 1000);

            pacman.x = 100;
            pacman.y = 100;
            pacman.speed = speed;
            pacman.direction = directions.RIGHT;

            pacman.update(delta, maze);

            const gridPos = { x: Math.floor(pacman.x / gameConfig.tileSize), y: Math.floor(pacman.y / gameConfig.tileSize) };
            const centerPixel = { x: gridPos.x * gameConfig.tileSize + gameConfig.tileSize / 2, y: gridPos.y * gameConfig.tileSize + gameConfig.tileSize / 2 };
            const distToCenter = Math.sqrt(Math.pow(pacman.x - centerPixel.x, 2) + Math.pow(pacman.y - centerPixel.y, 2));

            expect(distToCenter).toBeGreaterThanOrEqual(moveStep);
        });

        test('does not make premature direction changes', () => {
            pacman.x = 99;
            pacman.y = 100;
            pacman.direction = directions.RIGHT;
            pacman.nextDirection = directions.UP;
            pacman.speed = 120;

            const delta = 16;
            const oldDirection = { ...pacman.direction };

            pacman.update(delta, maze);

            expect(pacman.direction).toEqual(oldDirection);
        });
    });

    describe('Bug Fix: Cannot go through walls', () => {
        test('stops at wall boundary when moving right', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            pacman.x = 50;
            pacman.y = 50;
            pacman.direction = directions.RIGHT;
            pacman.nextDirection = directions.NONE;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.x).toBeLessThan(70);
        });

        test('stops at wall boundary when moving left', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            pacman.x = 50;
            pacman.y = 50;
            pacman.direction = directions.LEFT;
            pacman.nextDirection = directions.NONE;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.x).toBeGreaterThan(30);
        });

        test('stops at wall boundary when moving up', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            pacman.x = 50;
            pacman.y = 50;
            pacman.direction = directions.UP;
            pacman.nextDirection = directions.NONE;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.y).toBeGreaterThan(30);
        });

        test('stops at wall boundary when moving down', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            pacman.x = 50;
            pacman.y = 50;
            pacman.direction = directions.DOWN;
            pacman.nextDirection = directions.NONE;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.y).toBeLessThan(70);
        });
    });

    describe('Bug Fix: Direction changes only at tile centers', () => {
        test('waits until center to change direction', () => {
            pacman.x = 95;
            pacman.y = 100;
            pacman.direction = directions.RIGHT;
            pacman.nextDirection = directions.UP;
            pacman.isMoving = true;

            const delta = 10;
            pacman.update(delta, maze);

            expect(pacman.direction).toBe(directions.RIGHT);
        });

        test('changes direction at tile center', () => {
            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);
            pacman.isMoving = true;
            pacman.gridX = 5;
            pacman.gridY = 5;

            maze[5][5] = 0;
            maze[5][6] = 0;
            maze[4][5] = 0;

            pacman.update(20, maze);

            expect(pacman.direction).toBe(directions.UP);
        });

        test('does not change direction if new direction is blocked', () => {
            pacman.x = 100;
            pacman.y = 100;
            pacman.direction = directions.RIGHT;
            pacman.nextDirection = directions.UP;
            pacman.isMoving = true;

            maze[5][5] = 0;
            maze[5][6] = 0;
            maze[4][5] = 1;

            pacman.update(20, maze);

            expect(pacman.direction).toBe(directions.RIGHT);
        });
    });

    describe('Bug Fix: Tunnel wrapping on correct row only', () => {
        test('wraps through tunnel on row 14', () => {
            pacman.gridY = 14;
            pacman.x = -5;
            pacman.y = 280;
            pacman.direction = directions.LEFT;
            pacman.isMoving = true;

            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(560);
        });

        test('does not wrap on wrong row', () => {
            pacman.gridY = 10;
            pacman.x = -5;
            pacman.y = 200;
            pacman.direction = directions.LEFT;
            pacman.isMoving = true;

            const originalX = pacman.x;

            pacman.handleTunnelWrap();

            expect(pacman.x).toBe(originalX);
        });

        test('no vertical drift during horizontal tunnel wrap', () => {
            pacman.gridY = 14;
            pacman.x = -5;
            pacman.y = 280;
            pacman.direction = directions.LEFT;
            pacman.isMoving = true;

            const originalY = pacman.y;

            pacman.handleTunnelWrap();

            expect(pacman.y).toBe(originalY);
        });
    });

    describe('Bug Fix: Center detection with small speeds', () => {
        test('works correctly with slow speeds', () => {
            pacman.x = 99;
            pacman.y = 100;
            pacman.speed = 50;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            const delta = 16;
            pacman.update(delta, maze);

            expect(pacman.x).toBeLessThan(101);
        });

        test('works correctly with high speeds', () => {
            pacman.x = 90;
            pacman.y = 100;
            pacman.speed = 200;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            const delta = 16;
            pacman.update(delta, maze);

            expect(pacman.x).toBeGreaterThan(90);
        });
    });
});
