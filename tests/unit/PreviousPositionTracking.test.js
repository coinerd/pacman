/**
 * Previous Position Tracking Unit Tests
 *
 * Test that entities properly track their previous positions (pixel and grid)
 * during movement to enable accurate collision detection.
 *
 * Acceptance Criteria:
 * - prevX/prevY updates on each movement
 * - prevGridX/prevGridY updates on tile crossing
 * - Positions tracked even when entity stops
 * - Works with zero speed
 * - Works with direction changes
 */

import Pacman from '../../src/entities/Pacman.js';
import Ghost from '../../src/entities/Ghost.js';
import { gameConfig, directions, ghostColors, ghostNames } from '../../src/config/gameConfig.js';
import { tileCenter } from '../../src/utils/TileMovement.js';
import { createMockScene, createSimpleMaze } from '../utils/testHelpers.js';

describe('Previous Position Tracking - Initialization', () => {
    let mockScene;
    let pacman;
    let ghost;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        pacman = new Pacman(mockScene, 5, 5);
        ghost = new Ghost(mockScene, 5, 5, ghostNames.BLINKY, ghostColors.BLINKY);
    });

    test('Pacman initializes with prevX/prevY matching current position', () => {
        expect(pacman.prevX).toBeDefined();
        expect(pacman.prevY).toBeDefined();
        expect(pacman.prevX).toBe(pacman.x);
        expect(pacman.prevY).toBe(pacman.y);
    });

    test('Pacman initializes with prevGridX/prevGridY matching current grid position', () => {
        expect(pacman.prevGridX).toBeDefined();
        expect(pacman.prevGridY).toBeDefined();
        expect(pacman.prevGridX).toBe(pacman.gridX);
        expect(pacman.prevGridY).toBe(pacman.gridY);
    });

    test('Ghost initializes with prevGridX/prevGridY matching current grid position', () => {
        expect(ghost.prevGridX).toBeDefined();
        expect(ghost.prevGridY).toBeDefined();
        expect(ghost.prevGridX).toBe(ghost.gridX);
        expect(ghost.prevGridY).toBe(ghost.gridY);
    });

    test('prevX/prevY set to current pixel position at construction', () => {
        const expectedX = tileCenter(5, 5).x;
        const expectedY = tileCenter(5, 5).y;

        expect(pacman.prevX).toBeCloseTo(expectedX, 0);
        expect(pacman.prevY).toBeCloseTo(expectedY, 0);
    });
});

describe('Previous Position Tracking - prevX/prevY Updates on Movement', () => {
    let mockScene;
    let pacman;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
    });

    test('prevX/prevY update when moving right', () => {
        const initialX = pacman.x;
        const initialY = pacman.y;

        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        pacman.update(100, maze);

        expect(pacman.prevX).toBe(initialX);
        expect(pacman.prevY).toBe(initialY);
        expect(pacman.x).toBeGreaterThan(initialX);
    });

    test('prevX/prevY update when moving left', () => {
        const initialX = pacman.x;
        const initialY = pacman.y;

        pacman.direction = directions.LEFT;
        pacman.isMoving = true;

        pacman.update(100, maze);

        expect(pacman.prevX).toBe(initialX);
        expect(pacman.prevY).toBe(initialY);
        expect(pacman.x).toBeLessThan(initialX);
    });

    test('prevX/prevY update when moving up', () => {
        const initialX = pacman.x;
        const initialY = pacman.y;

        pacman.direction = directions.UP;
        pacman.isMoving = true;

        pacman.update(100, maze);

        expect(pacman.prevX).toBe(initialX);
        expect(pacman.prevY).toBe(initialY);
        expect(pacman.y).toBeLessThan(initialY);
    });

    test('prevX/prevY update when moving down', () => {
        const initialX = pacman.x;
        const initialY = pacman.y;

        pacman.direction = directions.DOWN;
        pacman.isMoving = true;

        pacman.update(100, maze);

        expect(pacman.prevX).toBe(initialX);
        expect(pacman.prevY).toBe(initialY);
        expect(pacman.y).toBeGreaterThan(initialY);
    });

    test('prevX/prevY update continuously across multiple updates', () => {
        const positions = [];

        for (let i = 0; i < 3; i++) {
            positions.push({ x: pacman.x, y: pacman.y });

            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(50, maze);

            expect(pacman.prevX).toBe(positions[i].x);
            expect(pacman.prevY).toBe(positions[i].y);
        }
    });

    test('prevX/prevY update each cycle to track position from previous frame', () => {
        const initialX = pacman.x;
        const initialY = pacman.y;

        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        pacman.update(100, maze);

        const afterFirstPrevX = pacman.prevX;
        const afterFirstPrevY = pacman.prevY;
        const afterFirstX = pacman.x;
        const afterFirstY = pacman.y;

        pacman.update(100, maze);

        expect(pacman.prevX).toBe(afterFirstX);
        expect(pacman.prevY).toBe(afterFirstY);
        expect(afterFirstPrevX).toBe(initialX);
        expect(afterFirstPrevY).toBe(initialY);
    });
});

describe('Previous Position Tracking - prevGridX/prevGridY Updates on Tile Crossing', () => {
    let mockScene;
    let pacman;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
    });

    test('prevGridX updates when crossing tile boundary horizontally', () => {
        const initialGridX = pacman.gridX;

        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        const center = tileCenter(5, 5);
        pacman.x = center.x;
        pacman.y = center.y;

        pacman.update(100, maze);

        expect(pacman.prevGridX).toBe(initialGridX);
    });

    test('prevGridY updates when crossing tile boundary vertically', () => {
        const initialGridY = pacman.gridY;

        pacman.direction = directions.DOWN;
        pacman.isMoving = true;

        const center = tileCenter(5, 5);
        pacman.x = center.x;
        pacman.y = center.y;

        pacman.update(100, maze);

        expect(pacman.prevGridY).toBe(initialGridY);
    });

    test('prevGridX/prevGridY remain same when not crossing tile boundary', () => {
        pacman.gridX = 5;
        pacman.gridY = 5;
        pacman.prevGridX = 5;
        pacman.prevGridY = 5;

        const center = tileCenter(5, 5);
        pacman.x = center.x - 5;
        pacman.y = center.y;
        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        pacman.update(10, maze);

        expect(pacman.gridX).toBe(5);
        expect(pacman.gridY).toBe(5);
        expect(pacman.prevGridX).toBe(5);
        expect(pacman.prevGridY).toBe(5);
    });

    test('prevGridX/prevGridY update correctly on diagonal movement', () => {
        pacman.gridX = 5;
        pacman.gridY = 5;

        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        const center = tileCenter(5, 5);
        pacman.x = center.x;
        pacman.y = center.y;

        pacman.update(100, maze);

        expect(pacman.prevGridX).toBe(5);
        expect(pacman.prevGridY).toBe(5);
    });
});

describe('Previous Position Tracking - Zero Speed and Stopped Entities', () => {
    let mockScene;
    let pacman;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
    });

    test('prevX/prevY tracked even when speed is zero', () => {
        pacman.speed = 0;
        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        const initialX = pacman.x;
        const initialY = pacman.y;

        pacman.update(100, maze);

        expect(pacman.prevX).toBe(initialX);
        expect(pacman.prevY).toBe(initialY);
        expect(pacman.x).toBe(initialX);
        expect(pacman.y).toBe(initialY);
    });

    test('prevX/prevY tracked even when entity is not moving', () => {
        pacman.speed = 100;
        pacman.direction = directions.NONE;
        pacman.isMoving = false;

        const initialX = pacman.x;
        const initialY = pacman.y;

        pacman.update(100, maze);

        expect(pacman.prevX).toBe(initialX);
        expect(pacman.prevY).toBe(initialY);
        expect(pacman.x).toBe(initialX);
        expect(pacman.y).toBe(initialY);
    });

    test('prevGridX/prevGridY remain same when entity cannot move', () => {
        maze[5][5] = 0;
        maze[5][6] = 1;

        pacman.gridX = 5;
        pacman.gridY = 5;
        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        const initialGridX = pacman.gridX;
        const initialGridY = pacman.gridY;
        const initialPrevGridX = pacman.prevGridX;
        const initialPrevGridY = pacman.prevGridY;

        pacman.update(500, maze);

        expect(pacman.prevGridX).toBe(initialPrevGridX);
        expect(pacman.prevGridY).toBe(initialPrevGridY);
    });
});

describe('Previous Position Tracking - Direction Changes', () => {
    let mockScene;
    let pacman;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
    });

    test('prevX/prevY track correctly during direction change at center', () => {
        const center = tileCenter(5, 5);
        pacman.x = center.x;
        pacman.y = center.y;
        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        pacman.update(50, maze);

        const afterFirstUpdateX = pacman.x;
        const afterFirstUpdateY = pacman.y;

        pacman.setDirection(directions.UP);
        pacman.update(50, maze);

        expect(pacman.prevX).toBe(afterFirstUpdateX);
        expect(pacman.prevY).toBe(afterFirstUpdateY);
    });

    test('prevX/prevY track correctly on immediate direction reversal', () => {
        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        pacman.update(50, maze);

        const afterFirstUpdateX = pacman.x;
        const afterFirstUpdateY = pacman.y;

        pacman.setDirection(directions.LEFT);
        pacman.update(50, maze);

        expect(pacman.prevX).toBe(afterFirstUpdateX);
        expect(pacman.prevY).toBe(afterFirstUpdateY);
    });

    test('prevGridX/prevGridY remain consistent during buffered direction changes', () => {
        const center = tileCenter(5, 5);
        pacman.x = center.x - 8;
        pacman.y = center.y;
        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        pacman.update(10, maze);

        const initialPrevGridX = pacman.prevGridX;
        const initialPrevGridY = pacman.prevGridY;

        pacman.setDirection(directions.UP);
        pacman.update(20, maze);

        expect(pacman.prevGridX).toBe(initialPrevGridX);
        expect(pacman.prevGridY).toBe(initialPrevGridY);
    });
});

describe('Previous Position Tracking - Edge Cases', () => {
    let mockScene;
    let pacman;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
    });

    test('prevX/prevY handle very small movements correctly', () => {
        const initialX = pacman.x;
        const initialY = pacman.y;

        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;
        pacman.speed = 1;

        pacman.update(10, maze);

        expect(pacman.prevX).toBe(initialX);
        expect(pacman.prevY).toBe(initialY);
    });

    test('prevX/prevY handle large delta times correctly', () => {
        const initialX = pacman.x;
        const initialY = pacman.y;

        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        pacman.update(1000, maze);

        expect(pacman.prevX).toBe(initialX);
        expect(pacman.prevY).toBe(initialY);
        expect(pacman.x).toBeGreaterThan(initialX);
    });

    test('position tracking remains accurate after resetPosition', () => {
        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        pacman.update(100, maze);

        expect(pacman.prevX).toBeDefined();
        expect(pacman.prevY).toBeDefined();

        pacman.resetPosition(3, 3);

        expect(pacman.prevGridX).toBe(3);
        expect(pacman.prevGridY).toBe(3);
    });

    test('prevX/prevY do not interfere with collision detection logic', () => {
        pacman.direction = directions.RIGHT;
        pacman.isMoving = true;

        for (let i = 0; i < 5; i++) {
            const currentX = pacman.x;
            const currentY = pacman.y;

            pacman.update(50, maze);

            expect(pacman.prevX).toBe(currentX);
            expect(pacman.prevY).toBe(currentY);
            expect(Math.abs(pacman.x - pacman.prevX)).toBeLessThan(pacman.speed * 0.1);
        }
    });
});
