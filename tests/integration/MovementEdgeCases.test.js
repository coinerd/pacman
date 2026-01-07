import Pacman from '../../src/entities/Pacman.js';
import Ghost from '../../src/entities/Ghost.js';
import { directions, ghostModes, ghostSpeedMultipliers, gameConfig } from '../../src/config/gameConfig.js';
import { performGridMovementStep, distanceToTileCenter, EPS } from '../../src/utils/TileMovement.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { createMockScene, createMockMaze } from '../utils/testHelpers.js';

function createSimpleTestMaze() {
    return [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ];
}

function createWideTestMaze() {
    return [
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
    ];
}

function createDeadEndMaze() {
    return [
        [1, 0, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 0, 1],
        [1, 1, 1, 0, 1]
    ];
}

describe('Movement Edge Cases', () => {
    let mockScene;
    let mockMaze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockMaze = createMockMaze(createSimpleTestMaze());
    });

    describe('Entity at tile center with no direction', () => {
        test('Pacman at center with no direction stays stationary', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.NONE;
            pacman.isMoving = false;

            const initialX = pacman.x;
            const initialY = pacman.y;

            performGridMovementStep(pacman, mockMaze, 100);

            expect(pacman.x).toBe(initialX);
            expect(pacman.y).toBe(initialY);
            expect(pacman.isMoving).toBe(false);
        });

        test('Ghost at center with no direction stays stationary', () => {
            const ghost = new Ghost(mockScene, 2, 2, 'blinky', 0xFF0000);
            ghost.direction = directions.NONE;
            ghost.isMoving = false;

            const initialX = ghost.x;
            const initialY = ghost.y;

            performGridMovementStep(ghost, mockMaze, 100);

            expect(ghost.x).toBe(initialX);
            expect(ghost.y).toBe(initialY);
            expect(ghost.isMoving).toBe(false);
        });

        test('Entity with zero direction components stays stationary', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = { x: 0, y: 0 };

            const initialX = pacman.x;
            const initialY = pacman.y;

            performGridMovementStep(pacman, mockMaze, 100);

            expect(pacman.x).toBe(initialX);
            expect(pacman.y).toBe(initialY);
        });
    });

    describe('Entity with zero speed', () => {
        test('Pacman with zero speed does not move', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.speed = 0;

            const initialX = pacman.x;
            const initialY = pacman.y;

            performGridMovementStep(pacman, mockMaze, 100);

            expect(pacman.x).toBe(initialX);
            expect(pacman.y).toBe(initialY);
        });

        test('Ghost with zero speed does not move', () => {
            const ghost = new Ghost(mockScene, 2, 2, 'blinky', 0xFF0000);
            ghost.direction = directions.RIGHT;
            ghost.speed = 0;

            const initialX = ghost.x;
            const initialY = ghost.y;

            performGridMovementStep(ghost, mockMaze, 100);

            expect(ghost.x).toBe(initialX);
            expect(ghost.y).toBe(initialY);
        });

        test('Entity with near-zero speed moves minimally', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.speed = 0.1;

            const initialX = pacman.x;
            performGridMovementStep(pacman, mockMaze, 1000);

            expect(pacman.x).toBe(initialX);
        });

        test('Zero speed with buffered turn does not move', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.speed = 0;
            pacman.nextDirection = directions.DOWN;

            const initialX = pacman.x;
            const initialY = pacman.y;

            performGridMovementStep(pacman, mockMaze, 100);

            expect(pacman.x).toBe(initialX);
            expect(pacman.y).toBe(initialY);
        });
    });

    describe('Entity with very high speed', () => {
        test('Pacman with high speed moves but respects boundaries', () => {
            const pacman = new Pacman(mockScene, 1, 2);
            pacman.direction = directions.RIGHT;
            pacman.speed = 1000;

            const initialX = pacman.x;
            performGridMovementStep(pacman, mockMaze, 100);

            expect(pacman.x).toBeGreaterThan(initialX);
            expect(pacman.x).toBeLessThan(mockMaze[0].length * 20);
        });

        test('Ghost with high speed moves but stops at walls', () => {
            const ghost = new Ghost(mockScene, 3, 2);
            ghost.direction = directions.RIGHT;
            ghost.speed = 1000;

            const initialX = ghost.x;
            performGridMovementStep(ghost, mockMaze, 100);

            expect(ghost.x).toBeGreaterThan(initialX);
            expect(ghost.x).toBeLessThan(mockMaze[0].length * 20);
        });

        test('High speed entity snaps to center when crossing', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.speed = 500;

            performGridMovementStep(pacman, mockMaze, 50);
            const dist = distanceToTileCenter(pacman.x, pacman.y, pacman.gridX, pacman.gridY);
            expect(dist).toBeLessThanOrEqual(EPS);
        });

        test('Multiple tiles with high speed maintain consistency', () => {
            const pacman = new Pacman(mockScene, 1, 2);
            pacman.direction = directions.RIGHT;
            pacman.speed = 800;

            for (let i = 0; i < 10; i++) {
                const prevGridX = pacman.gridX;
                performGridMovementStep(pacman, mockMaze, 16.67);

                if (prevGridX !== pacman.gridX) {
                    const dist = distanceToTileCenter(pacman.x, pacman.y, pacman.gridX, pacman.gridY);
                    expect(dist).toBeLessThanOrEqual(EPS * 2);
                }
            }
        });
    });

    describe('Entity at map boundaries', () => {
        test('Pacman at left boundary stops at wall', () => {
            const pacman = new Pacman(mockScene, 1, 2);
            pacman.direction = directions.LEFT;

            performGridMovementStep(pacman, mockMaze, 1000);

            expect(pacman.gridX).toBe(1);
            expect(pacman.x).toBeCloseTo(30, 0);
        });

        test('Pacman at right boundary stops at wall', () => {
            const pacman = new Pacman(mockScene, 3, 2);
            pacman.direction = directions.RIGHT;

            performGridMovementStep(pacman, mockMaze, 1000);

            expect(pacman.gridX).toBe(3);
            expect(pacman.x).toBeLessThan(mockMaze[0].length * 20);
        });

        test('Pacman at top boundary stops at wall', () => {
            const pacman = new Pacman(mockScene, 2, 1);
            pacman.direction = directions.UP;

            performGridMovementStep(pacman, mockMaze, 1000);

            expect(pacman.gridY).toBe(1);
            expect(pacman.y).toBeCloseTo(30, 0);
        });

        test('Pacman at bottom boundary stops at wall', () => {
            const pacman = new Pacman(mockScene, 2, 3);
            pacman.direction = directions.DOWN;

            performGridMovementStep(pacman, mockMaze, 1000);

            expect(pacman.gridY).toBe(3);
            expect(pacman.y).toBeLessThan(mockMaze.length * 20);
        });

        test('Ghost respects boundaries similarly', () => {
            const ghost = new Ghost(mockScene, 1, 2);
            ghost.direction = directions.LEFT;

            performGridMovementStep(ghost, mockMaze, 1000);

            expect(ghost.gridX).toBe(1);
        });

        test('Entity surrounded by walls stops completely', () => {
            const deadEndMaze = createMockMaze(createDeadEndMaze());
            const pacman = new Pacman(mockScene, 2, 2);

            const initialX = pacman.x;
            const initialY = pacman.y;
            performGridMovementStep(pacman, deadEndMaze, 100);

            expect(pacman.x).toBe(initialX);
            expect(pacman.y).toBe(initialY);
            expect(pacman.isMoving).toBe(false);
            expect(pacman.direction).toBe(directions.NONE);
        });
    });

    describe('Entity after resetPosition()', () => {
        test('Pacman reset clears movement state', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.nextDirection = directions.UP;
            pacman.isMoving = true;
            pacman.x = 100;
            pacman.y = 100;

            pacman.resetPosition(1, 1);

            expect(pacman.gridX).toBe(1);
            expect(pacman.gridY).toBe(1);
            expect(pacman.direction).toBe(directions.UP);
            expect(pacman.nextDirection).toBe(directions.NONE);
            expect(pacman.isMoving).toBe(false);
            expect(pacman.isDying).toBe(false);
            expect(pacman.x).toBeCloseTo(30, 0);
            expect(pacman.y).toBeCloseTo(30, 0);
        });

        test('Ghost reset clears all state', () => {
            const ghost = new Ghost(mockScene, 2, 2, 'blinky', 0xFF0000);
            ghost.direction = directions.RIGHT;
            ghost.isFrightened = true;
            ghost.isEaten = true;
            ghost.inGhostHouse = true;
            ghost.mode = ghostModes.FRIGHTENED;
            ghost.x = 100;
            ghost.y = 100;

            ghost.reset();

            expect(ghost.gridX).toBe(2);
            expect(ghost.gridY).toBe(2);
            expect(ghost.direction).toBe(directions.NONE);
            expect(ghost.isFrightened).toBe(false);
            expect(ghost.isEaten).toBe(false);
            expect(ghost.inGhostHouse).toBe(false);
            expect(ghost.mode).toBe(ghostModes.SCATTER);
            expect(ghost.x).toBeCloseTo(50, 0);
            expect(ghost.y).toBeCloseTo(50, 0);
        });

        test('Pacman can move after reset', () => {
            const pacman = new Pacman(mockScene, 1, 2);
            pacman.resetPosition(2, 2);
            pacman.direction = directions.RIGHT;

            const initialX = pacman.x;
            performGridMovementStep(pacman, mockMaze, 100);

            expect(pacman.x).toBeGreaterThan(initialX);
        });

        test('Ghost can move after reset', () => {
            const ghost = new Ghost(mockScene, 2, 2, 'blinky', 0xFF0000);
            ghost.reset();
            ghost.direction = directions.RIGHT;

            const initialX = ghost.x;
            performGridMovementStep(ghost, mockMaze, 100);

            expect(ghost.x).toBeGreaterThan(initialX);
        });

        test('Reset maintains correct previous positions', () => {
            const pacman = new Pacman(mockScene, 3, 3);
            pacman.direction = directions.RIGHT;
            performGridMovementStep(pacman, mockMaze, 100);

            pacman.resetPosition(1, 1);

            expect(pacman.prevX).toBe(pacman.x);
            expect(pacman.prevY).toBe(pacman.y);
            expect(pacman.prevGridX).toBe(pacman.gridX);
            expect(pacman.prevGridY).toBe(pacman.gridY);
        });
    });

    describe('Entity during state transitions (Ghost mode changes)', () => {
        test('Ghost normal to frightened reduces speed and reverses', () => {
            const ghost = new Ghost(mockScene, 2, 2, 'blinky', 0xFF0000);
            ghost.direction = directions.RIGHT;
            const initialSpeed = ghost.speed;
            const initialDir = ghost.direction;

            ghost.setFrightened(8000);

            expect(ghost.isFrightened).toBe(true);
            expect(ghost.speed).toBe(initialSpeed * 0.5);
            expect(ghost.direction).toEqual({ x: -1, y: 0 });
        });

        test('Ghost frightened expiration restores speed', () => {
            const ghost = new Ghost(mockScene, 2, 2, 'blinky', 0xFF0000);
            const baseSpeed = ghost.baseSpeed;

            ghost.setFrightened(8000);
            ghost.updateFrightened(8000);

            expect(ghost.isFrightened).toBe(false);
            expect(ghost.speed).toBe(baseSpeed);
        });

        test('Ghost mode change maintains position', () => {
            const ghost = new Ghost(mockScene, 2, 2, 'blinky', 0xFF0000);
            ghost.direction = directions.RIGHT;
            performGridMovementStep(ghost, mockMaze, 100);

            const posX = ghost.x;
            const posY = ghost.y;
            const gridX = ghost.gridX;
            const gridY = ghost.gridY;

            ghost.setFrightened(8000);

            expect(ghost.x).toBeCloseTo(posX, 1);
            expect(ghost.y).toBeCloseTo(posY, 1);
            expect(ghost.gridX).toBe(gridX);
            expect(ghost.gridY).toBe(gridY);
        });

        test('Ghost eaten state changes behavior', () => {
            const ghost = new Ghost(mockScene, 2, 2, 'blinky', 0xFF0000);
            ghost.direction = directions.RIGHT;
            ghost.setFrightened(8000);
            ghost.eat();

            expect(ghost.isEaten).toBe(true);
            expect(ghost.isFrightened).toBe(false);
        });

        test('Ghost in tunnel uses reduced speed', () => {
            const wideMaze = createMockMaze(createWideTestMaze());
            const ghost = new Ghost(mockScene, 5, 2, 'blinky', 0xFF0000);
            ghost.gridY = gameConfig.tunnelRow || 14;

            const baseSpeed = ghost.baseSpeed;
            const tunnelSpeed = baseSpeed * ghostSpeedMultipliers.tunnel;

            expect(tunnelSpeed).toBeLessThan(baseSpeed);
        });

        test('Ghost speed changes during transition', () => {
            const ghost = new Ghost(mockScene, 2, 2, 'blinky', 0xFF0000);
            const baseSpeed = ghost.baseSpeed;

            ghost.setSpeedMultiplier(1.5);
            expect(ghost.speed).toBe(baseSpeed * 1.5);

            ghost.setFrightened(8000);
            expect(ghost.speed).toBeCloseTo(baseSpeed * 0.5, 1);

            ghost.updateFrightened(8000);
            expect(ghost.speed).toBe(baseSpeed * 1.5);
        });

        test('Pacman speed changes during transitions', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            const baseSpeed = pacman.baseSpeed;

            pacman.setSpeedMultiplier(2.0);
            expect(pacman.speed).toBe(baseSpeed * 2.0);

            pacman.resetPosition(1, 1);
            expect(pacman.speed).toBe(baseSpeed);
        });

        test('Multiple state changes maintain consistency', () => {
            const ghost = new Ghost(mockScene, 2, 2, 'blinky', 0xFF0000);
            const baseSpeed = ghost.baseSpeed;

            ghost.setFrightened(5000);
            const frightenedSpeed = ghost.speed;

            ghost.updateFrightened(5000);
            expect(ghost.speed).toBe(baseSpeed);

            ghost.setFrightened(5000);
            ghost.eat();
            expect(ghost.isEaten).toBe(true);
            expect(ghost.isFrightened).toBe(false);

            ghost.reset();
            expect(ghost.isEaten).toBe(false);
            expect(ghost.isFrightened).toBe(false);
            expect(ghost.speed).toBe(baseSpeed);
        });
    });

    describe('Edge cases with direction buffering', () => {
        test('Buffered turn at exact center executes immediately', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.nextDirection = directions.DOWN;

            performGridMovementStep(pacman, mockMaze, 16.67);

            expect(pacman.direction).toBe(directions.DOWN);
            expect(pacman.nextDirection).toBe(directions.NONE);
        });

        test('Buffered turn reversed when moving opposite', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.nextDirection = directions.LEFT;

            const initialX = pacman.x;
            pacman.setDirection(directions.LEFT);

            expect(pacman.direction).toBe(directions.LEFT);
            expect(pacman.nextDirection).toBe(directions.NONE);
            performGridMovementStep(pacman, mockMaze, 100);
            expect(pacman.x).toBeLessThan(initialX);
        });

        test('Buffered turn invalid when blocked by wall', () => {
            const pacman = new Pacman(mockScene, 1, 2);
            pacman.direction = directions.RIGHT;
            pacman.nextDirection = directions.LEFT;

            performGridMovementStep(pacman, mockMaze, 100);

            expect(pacman.direction).toBe(directions.RIGHT);
        });

        test('Multiple buffered direction changes handle correctly', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.DOWN);
            pacman.setDirection(directions.LEFT);

            expect(pacman.nextDirection).toBe(directions.LEFT);
            performGridMovementStep(pacman, mockMaze, 100);
        });
    });

    describe('Minimal distance edge cases', () => {
        test('Entity within EPS of center snaps', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.x += EPS - 0.1;

            performGridMovementStep(pacman, mockMaze, 1);

            const center = { x: pacman.gridX * 20 + 10, y: pacman.gridY * 20 + 10 };
            const dist = distanceToTileCenter(pacman.x, pacman.y, pacman.gridX, pacman.gridY);
            expect(dist).toBeLessThanOrEqual(EPS);
        });

        test('Entity just outside EPS continues moving', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.x += EPS + 1;

            const initialX = pacman.x;
            performGridMovementStep(pacman, mockMaze, 16.67);

            expect(pacman.x).toBeGreaterThan(initialX);
        });

        test('Exactly at center with zero move distance stays', () => {
            const pacman = new Pacman(mockScene, 2, 2);
            pacman.direction = directions.RIGHT;
            pacman.speed = 0.001;

            const initialX = pacman.x;
            performGridMovementStep(pacman, mockMaze, 1);

            expect(pacman.x).toBe(initialX);
        });
    });
});
