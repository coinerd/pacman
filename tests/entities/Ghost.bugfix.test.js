import {
    directions,
    gameConfig,
    ghostModes,
    ghostSpeedMultipliers,
    levelConfig
} from '../../src/config/gameConfig.js';
import Enemy from '../../src/entities/Enemy.js';
import { msToSeconds } from '../../src/utils/Time.js';
import { createMockScene, createSimpleMaze } from '../utils/testHelpers.js';

describe('Enemy - Bug Fixes', () => {
    let mockScene;
    let ghost;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockScene.ghostAISystem = {
            chooseDirection: jest.fn()
        };
        maze = createSimpleMaze(10, 10);
        ghost = new Enemy(mockScene, 5, 5, 'blinky', 0xff0000);
    });

    describe('Bug Fix: Tunnel wrapping on correct row only', () => {
        test('wraps through tunnel on tunnel row', () => {
            ghost.gridY = gameConfig.tunnelRow;
            ghost.x = -20;
            ghost.y = 280;
            ghost.direction = directions.LEFT;
            ghost.isMoving = true;

            ghost.handleTunnelWrap();

            expect(ghost.x).toBe(gameConfig.mazeWidth * gameConfig.tileSize);
        });

        test('does not wrap on wrong row', () => {
            ghost.gridY = 10;
            ghost.x = -20;
            ghost.y = 200;
            ghost.direction = directions.LEFT;
            ghost.isMoving = true;

            const originalX = ghost.x;

            ghost.handleTunnelWrap();

            expect(ghost.x).toBe(originalX);
        });

        test('no vertical drift during horizontal tunnel wrap', () => {
            ghost.gridY = gameConfig.tunnelRow;
            ghost.x = -20;
            ghost.y = 280;
            ghost.direction = directions.LEFT;
            ghost.isMoving = true;

            const originalY = ghost.y;

            ghost.handleTunnelWrap();

            expect(ghost.y).toBe(originalY);
        });

        test('wraps correctly from right to left', () => {
            ghost.gridY = gameConfig.tunnelRow;
            ghost.x = gameConfig.mazeWidth * gameConfig.tileSize + 20;
            ghost.y = 280;
            ghost.direction = directions.RIGHT;
            ghost.isMoving = true;

            ghost.handleTunnelWrap();

            expect(ghost.x).toBe(0);
        });
    });

    describe('Bug Fix: Center detection uses correct threshold', () => {
        test('does not update grid when distance equals moveStep', () => {
            ghost.x = 100;
            ghost.y = 100;
            ghost.direction = directions.RIGHT;
            ghost.speed = 100;

            const deltaSeconds = msToSeconds(100);
            const moveStep = ghost.speed * deltaSeconds;

            ghost.update(deltaSeconds, maze, { x: 0, y: 0 });

            expect(ghost.gridX).toBe(5);
        });

        test('does not update grid when distance is not less than moveStep', () => {
            const speed = 150;
            const deltaSeconds = msToSeconds(16);
            const moveStep = speed * deltaSeconds;

            ghost.x = 100;
            ghost.y = 100;
            ghost.speed = speed;
            ghost.direction = directions.RIGHT;

            ghost.update(deltaSeconds, maze, { x: 0, y: 0 });

            const gridPos = {
                x: Math.floor(ghost.x / gameConfig.tileSize),
                y: Math.floor(ghost.y / gameConfig.tileSize)
            };
            const centerPixel = {
                x: gridPos.x * gameConfig.tileSize + gameConfig.tileSize / 2,
                y: gridPos.y * gameConfig.tileSize + gameConfig.tileSize / 2
            };
            const distToCenter = Math.sqrt(
                (ghost.x - centerPixel.x) ** 2 + (ghost.y - centerPixel.y) ** 2
            );

            expect(distToCenter).toBeGreaterThanOrEqual(moveStep);
        });
    });

    describe('Bug Fix: Cannot go through walls', () => {
        test('stops at wall boundary when moving right', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            ghost.gridX = 1;
            ghost.gridY = 1;
            const center = {
                x: gameConfig.tileSize * 1.5,
                y: gameConfig.tileSize * 1.5
            };
            ghost.x = center.x;
            ghost.y = center.y;
            ghost.direction = directions.RIGHT;
            ghost.isMoving = true;

            ghost.update(msToSeconds(100), maze, { x: 0, y: 0 });

            expect(ghost.x).toBe(center.x);
        });

        test('stops at wall boundary when moving left', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            ghost.gridX = 1;
            ghost.gridY = 1;
            const center = {
                x: gameConfig.tileSize * 1.5,
                y: gameConfig.tileSize * 1.5
            };
            ghost.x = center.x;
            ghost.y = center.y;
            ghost.direction = directions.LEFT;
            ghost.isMoving = true;

            ghost.update(msToSeconds(100), maze, { x: 0, y: 0 });

            expect(ghost.x).toBe(center.x);
        });

        test('stops at wall boundary when moving up', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            ghost.gridX = 1;
            ghost.gridY = 1;
            const center = {
                x: gameConfig.tileSize * 1.5,
                y: gameConfig.tileSize * 1.5
            };
            ghost.x = center.x;
            ghost.y = center.y;
            ghost.direction = directions.UP;
            ghost.isMoving = true;

            ghost.update(msToSeconds(100), maze, { x: 0, y: 0 });

            expect(ghost.y).toBe(center.y);
        });

        test('stops at wall boundary when moving down', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            ghost.gridX = 1;
            ghost.gridY = 1;
            const center = {
                x: gameConfig.tileSize * 1.5,
                y: gameConfig.tileSize * 1.5
            };
            ghost.x = center.x;
            ghost.y = center.y;
            ghost.direction = directions.DOWN;
            ghost.isMoving = true;

            ghost.update(msToSeconds(100), maze, { x: 0, y: 0 });

            expect(ghost.y).toBe(center.y);
        });
    });

    describe('Bug Fix: Speed variations with tunnel', () => {
        test('uses tunnel speed multiplier on tunnel row', () => {
            // Create a larger maze that includes the tunnel row (row 14)
            maze = createSimpleMaze(20, 20);
            ghost.resetPosition(5, gameConfig.tunnelRow);
            ghost.speed = 100;
            const deltaSeconds = msToSeconds(100);

            const moveStep =
				ghost.speed * ghostSpeedMultipliers.tunnel * deltaSeconds;
            ghost.direction = directions.RIGHT;
            ghost.isMoving = true; // resetPosition() sets isMoving=false, so we need to set it true
            const initialX = ghost.x;

            ghost.update(deltaSeconds, maze, { x: 0, y: 0 });

            expect(ghost.x - initialX).toBeCloseTo(moveStep, 1);
        });

        test('uses normal speed multiplier off tunnel row', () => {
            ghost.resetPosition(ghost.gridX, 10);
            ghost.speed = 100;
            const deltaSeconds = msToSeconds(100);

            ghost.direction = directions.RIGHT;
            const initialX = ghost.x;

            ghost.update(deltaSeconds, maze, { x: 0, y: 0 });

            expect(ghost.x - initialX).toBeLessThan(15);
        });
    });
});
