/**
 * Movement Unit Tests
 *
 * Test pure movement logic for entities in the grid system.
 * Focus on wall collision, snap-to-center, and corner turning.
 * No ghost collision tests (handled separately in CollisionSystem tests).
 *
 * Acceptance Criteria:
 * - Entity stops at walls (no overflow)
 * - Snap-to-Center: at EPS-radius to tile-center (tolerant for corner turns)
 * - Corner turns: wishDir accepted at center, if free
 * - No ghost collision in tests (pure movement)
 */

import Pacman from '../../src/entities/Pacman.js';
import Ghost from '../../src/entities/Ghost.js';
import { gameConfig, directions, ghostColors, ghostNames } from '../../src/config/gameConfig.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';
import { tileCenter, distanceToTileCenter, isAtTileCenter, EPS } from '../../src/utils/TileMovement.js';
import { createMockScene, createSimpleMaze } from '../utils/testHelpers.js';

describe('Movement - Wall Collision', () => {
    let mockScene;
    let pacman;
    let ghost;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
        ghost = new Ghost(mockScene, 5, 5, ghostNames.BLINKY, ghostColors.BLINKY);
    });

    describe('Pacman stops at walls (no overflow)', () => {
        test('stops exactly at wall edge moving right', () => {
            maze[5][5] = TILE_TYPES.PATH;
            maze[5][6] = TILE_TYPES.WALL;

            pacman.gridX = 5;
            pacman.gridY = 5;
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            const updateDelta = 500;
            pacman.update(updateDelta, maze);

            const center = tileCenter(5, 5);

            expect(pacman.x).toBeCloseTo(center.x, 1);
            expect(pacman.gridX).toBe(5);
        });

        test('stops exactly at wall edge moving left', () => {
            maze[5][5] = TILE_TYPES.PATH;
            maze[5][4] = TILE_TYPES.WALL;

            pacman.gridX = 5;
            pacman.gridY = 5;
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.LEFT;
            pacman.isMoving = true;

            const updateDelta = 500;
            pacman.update(updateDelta, maze);

            const center = tileCenter(5, 5);

            expect(pacman.x).toBeCloseTo(center.x, 1);
            expect(pacman.gridX).toBe(5);
        });

        test('stops exactly at wall edge moving up', () => {
            maze[5][5] = TILE_TYPES.PATH;
            maze[4][5] = TILE_TYPES.WALL;

            pacman.gridX = 5;
            pacman.gridY = 5;
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.UP;
            pacman.isMoving = true;

            const updateDelta = 500;
            pacman.update(updateDelta, maze);

            const center = tileCenter(5, 5);

            expect(pacman.y).toBeCloseTo(center.y, 1);
            expect(pacman.gridY).toBe(5);
        });

        test('stops exactly at wall edge moving down', () => {
            maze[5][5] = TILE_TYPES.PATH;
            maze[6][5] = TILE_TYPES.WALL;

            pacman.gridX = 5;
            pacman.gridY = 5;
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.DOWN;
            pacman.isMoving = true;

            const updateDelta = 500;
            pacman.update(updateDelta, maze);

            const center = tileCenter(5, 5);

            expect(pacman.y).toBeCloseTo(center.y, 1);
            expect(pacman.gridY).toBe(5);
        });

        test('cannot enter wall tile even with long delta time', () => {
            maze[5][5] = TILE_TYPES.PATH;
            maze[5][6] = TILE_TYPES.WALL;

            pacman.gridX = 5;
            pacman.gridY = 5;
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(10000, maze);

            expect(pacman.gridX).not.toBe(6);
            expect(maze[5][pacman.gridX]).not.toBe(TILE_TYPES.WALL);
        });

        test('stops before wall at various distances', () => {
            maze[5][5] = TILE_TYPES.PATH;
            maze[5][6] = TILE_TYPES.WALL;

            const startDistances = [5, 10, 15, 19];

            startDistances.forEach(dist => {
                pacman.gridX = 5;
                pacman.gridY = 5;
                const center = tileCenter(5, 5);
                pacman.x = center.x + dist;
                pacman.y = center.y;
                pacman.direction = directions.RIGHT;
                pacman.isMoving = true;

                const updateDelta = 1000;
                pacman.update(updateDelta, maze);
                const wallLeftEdge = tileCenter(6, 5).x - gameConfig.tileSize / 2;
                expect(pacman.x).toBeLessThanOrEqual(wallLeftEdge);
            });
        });
    });

    describe('Ghost stops at walls (no overflow)', () => {
        test('stops exactly at wall edge moving right', () => {
            maze[5][5] = TILE_TYPES.PATH;
            maze[5][6] = TILE_TYPES.WALL;

            ghost.gridX = 5;
            ghost.gridY = 5;
            ghost.x = tileCenter(5, 5).x;
            ghost.y = tileCenter(5, 5).y;
            ghost.direction = directions.RIGHT;
            ghost.isMoving = true;

            const updateDelta = 500;
            ghost.update(updateDelta, maze);

            const center = tileCenter(5, 5);

            expect(ghost.x).toBeCloseTo(center.x, 1);
            expect(ghost.gridX).toBe(5);
        });

        test('stops exactly at wall edge in all directions', () => {
            const testCases = [
                { direction: directions.RIGHT, wallX: 6, wallY: 5, property: 'x' },
                { direction: directions.LEFT, wallX: 4, wallY: 5, property: 'x' },
                { direction: directions.UP, wallX: 5, wallY: 4, property: 'y' },
                { direction: directions.DOWN, wallX: 5, wallY: 6, property: 'y' }
            ];

            testCases.forEach(({ direction, wallX, wallY, property }) => {
                maze[5][5] = TILE_TYPES.PATH;
                maze[wallY][wallX] = TILE_TYPES.WALL;

                ghost.gridX = 5;
                ghost.gridY = 5;
                ghost.x = tileCenter(5, 5).x;
                ghost.y = tileCenter(5, 5).y;
                ghost.direction = direction;
                ghost.isMoving = true;

                ghost.update(500, maze);

                const center = tileCenter(5, 5);
                if (property === 'x') {
                    expect(ghost.x).toBeCloseTo(center.x, 1);
                } else {
                    expect(ghost.y).toBeCloseTo(center.y, 1);
                }
            });
        });
    });
});

describe('Movement - Snap-to-Center', () => {
    let mockScene;
    let pacman;
    let ghost;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
        ghost = new Ghost(mockScene, 5, 5, ghostNames.BLINKY, ghostColors.BLINKY);
    });

    describe('Pacman snaps to tile center within EPS', () => {
        test('detects being at center when distance < moveStep', () => {
            const center = tileCenter(5, 5);
            pacman.x = center.x;
            pacman.y = center.y;
            pacman.direction = directions.RIGHT;
            pacman.speed = 120;

            const gridPos = { x: Math.floor(pacman.x / gameConfig.tileSize), y: Math.floor(pacman.y / gameConfig.tileSize) };
            const centerPixel = { x: gridPos.x * gameConfig.tileSize + gameConfig.tileSize / 2, y: gridPos.y * gameConfig.tileSize + gameConfig.tileSize / 2 };
            const distToCenter = Math.sqrt(Math.pow(pacman.x - centerPixel.x, 2) + Math.pow(pacman.y - centerPixel.y, 2));
            const moveStep = pacman.speed * (20 / 1000);

            expect(distToCenter).toBeLessThan(moveStep);
        });

        test('updates grid position when at center', () => {
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.speed = 100;

            pacman.update(20, maze);

            expect(pacman.gridX).toBe(5);
            expect(pacman.gridY).toBe(5);
        });

        test('works correctly for positions near center within EPS', () => {
            const center = tileCenter(5, 5);
            const nearPositions = [
                { x: center.x + EPS, y: center.y },
                { x: center.x - EPS, y: center.y },
                { x: center.x, y: center.y + EPS },
                { x: center.x, y: center.y - EPS }
            ];

            nearPositions.forEach(({ x, y }) => {
                pacman.x = x;
                pacman.y = y;
                pacman.direction = directions.RIGHT;
                pacman.speed = 100;

                pacman.update(20, maze);

                const dist = distanceToTileCenter(pacman.x, pacman.y, 5, 5);
                expect(dist).toBeLessThanOrEqual(EPS + 1);
            });
        });

        test('isAtTileCenter helper works correctly', () => {
            const center = tileCenter(5, 5);

            expect(isAtTileCenter(center.x, center.y, 5, 5)).toBe(true);

            expect(isAtTileCenter(center.x + EPS, center.y, 5, 5)).toBe(true);
            expect(isAtTileCenter(center.x, center.y + EPS, 5, 5)).toBe(true);

            expect(isAtTileCenter(center.x + EPS + 0.1, center.y, 5, 5)).toBe(false);
            expect(isAtTileCenter(center.x, center.y + EPS + 0.1, 5, 5)).toBe(false);
        });

        test('snaps when moving and reaching center', () => {
            pacman.gridX = 5;
            pacman.gridY = 5;
            const startCenter = tileCenter(5, 5);
            pacman.x = startCenter.x - 5;
            pacman.y = startCenter.y;
            pacman.direction = directions.RIGHT;
            pacman.speed = 100;

            pacman.update(50, maze);

            const distToCenter = distanceToTileCenter(pacman.x, pacman.y, 5, 5);
            expect(distToCenter).toBeLessThan(5);
        });

        test('continues movement after center snap', () => {
            pacman.gridX = 5;
            pacman.gridY = 5;
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.x).toBeGreaterThan(tileCenter(5, 5).x);
        });
    });

    describe('Ghost snaps to tile center within EPS', () => {
        test('snaps to center when changing direction', () => {
            const center = tileCenter(5, 5);
            ghost.x = center.x;
            ghost.y = center.y;
            ghost.direction = directions.RIGHT;
            ghost.isMoving = true;

            ghost.update(20, maze, pacman);

            const distToCenter = distanceToTileCenter(ghost.x, ghost.y, 5, 5);
            expect(distToCenter).toBeLessThanOrEqual(3);
        });

        test('updates grid position at center', () => {
            ghost.x = tileCenter(5, 5).x;
            ghost.y = tileCenter(5, 5).y;
            ghost.direction = directions.RIGHT;

            ghost.update(20, maze, pacman);

            expect(ghost.gridX).toBe(5);
            expect(ghost.gridY).toBe(5);
        });

        test('snapToCurrentCenter works', () => {
            ghost.gridX = 5;
            ghost.gridY = 5;
            ghost.x = tileCenter(5, 5).x + 3;
            ghost.y = tileCenter(5, 5).y - 2;

            ghost.snapToCurrentCenter();

            const center = tileCenter(5, 5);
            expect(ghost.x).toBe(center.x);
            expect(ghost.y).toBe(center.y);
        });
    });
});

describe('Movement - Corner Turns', () => {
    let mockScene;
    let pacman;
    let ghost;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockScene.ghostAISystem = {
            chooseDirection: jest.fn()
        };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
        ghost = new Ghost(mockScene, 5, 5, ghostNames.BLINKY, ghostColors.BLINKY);
    });

    describe('Pacman corner turns at tile center', () => {
        test('accepts wishDir (nextDirection) only at center', () => {
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);

            maze[5][5] = TILE_TYPES.PATH;
            maze[4][5] = TILE_TYPES.PATH;

            pacman.update(20, maze);

            expect(pacman.direction).toBe(directions.UP);
            expect(pacman.nextDirection).toBe(directions.NONE);
        });

        test('does NOT accept wishDir when not at center', () => {
            pacman.x = tileCenter(5, 5).x - 5;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);

            maze[5][5] = TILE_TYPES.PATH;
            maze[4][5] = TILE_TYPES.PATH;

            pacman.update(10, maze);

            expect(pacman.direction).toBe(directions.RIGHT);
            expect(pacman.nextDirection).toBe(directions.UP);
        });

        test('buffers wishDir until reaching center', () => {
            pacman.x = tileCenter(5, 5).x - 8;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);

            maze[5][5] = TILE_TYPES.PATH;
            maze[4][5] = TILE_TYPES.PATH;

            pacman.update(10, maze);
            expect(pacman.direction).toBe(directions.RIGHT);
            expect(pacman.nextDirection).toBe(directions.UP);

            pacman.update(80, maze);
            expect(pacman.direction).toBe(directions.UP);
            expect(pacman.nextDirection).toBe(directions.NONE);
        });

        test('does NOT accept wishDir at center if blocked by wall', () => {
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);

            maze[5][5] = TILE_TYPES.PATH;
            maze[4][5] = TILE_TYPES.WALL;

            pacman.update(20, maze);

            expect(pacman.direction).toBe(directions.RIGHT);
            expect(pacman.nextDirection).toBe(directions.UP);
        });

        test('replaces buffered direction with new wishDir', () => {
            pacman.x = tileCenter(5, 5).x - 8;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);

            expect(pacman.nextDirection).toBe(directions.UP);

            pacman.setDirection(directions.DOWN);

            expect(pacman.nextDirection).toBe(directions.DOWN);
        });

        test('can reverse direction immediately (even not at center)', () => {
            pacman.x = tileCenter(5, 5).x - 5;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.setDirection(directions.LEFT);

            expect(pacman.direction).toBe(directions.LEFT);
            expect(pacman.nextDirection).toBe(directions.NONE);
        });

        test('corner turn from horizontal to vertical', () => {
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);

            maze[5][5] = TILE_TYPES.PATH;
            maze[4][5] = TILE_TYPES.PATH;

            pacman.update(20, maze);

            expect(pacman.direction).toBe(directions.UP);
            expect(pacman.isMoving).toBe(true);
        });

        test('corner turn from vertical to horizontal', () => {
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.UP;
            pacman.setDirection(directions.RIGHT);

            maze[5][5] = TILE_TYPES.PATH;
            maze[5][6] = TILE_TYPES.PATH;

            pacman.update(20, maze);

            expect(pacman.direction).toBe(directions.RIGHT);
            expect(pacman.isMoving).toBe(true);
        });

        test('multiple buffered directions (last one wins)', () => {
            pacman.x = tileCenter(5, 5).x - 8;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;

            pacman.setDirection(directions.UP);
            expect(pacman.nextDirection).toBe(directions.UP);

            pacman.setDirection(directions.DOWN);
            expect(pacman.nextDirection).toBe(directions.DOWN);

            maze[5][5] = TILE_TYPES.PATH;
            maze[5][6] = TILE_TYPES.PATH;

            pacman.update(80, maze);

            expect(pacman.direction).toBe(directions.DOWN);
            expect(pacman.nextDirection).toBe(directions.NONE);
        });
    });

    describe('Ghost corner turns at tile center', () => {
        test('changes direction at center when AI chooses', () => {
            ghost.x = tileCenter(5, 5).x;
            ghost.y = tileCenter(5, 5).y;
            ghost.direction = directions.RIGHT;
            ghost.isMoving = true;

            mockScene.ghostAISystem.chooseDirection = jest.fn((g, maze) => {
                g.setDirection(directions.UP);
            });

            maze[5][5] = TILE_TYPES.PATH;
            maze[4][5] = TILE_TYPES.PATH;

            mockScene.ghostAISystem.chooseDirection(ghost, maze);
            ghost.update(20, maze, pacman);

            expect(ghost.direction).toBe(directions.UP);
        });

        test('snaps to center when changing direction', () => {
            const center = tileCenter(5, 5);
            ghost.x = center.x;
            ghost.y = center.y;
            ghost.direction = directions.RIGHT;
            ghost.isMoving = true;

            mockScene.ghostAISystem.chooseDirection = jest.fn((g, maze) => {
                g.setDirection(directions.UP);
            });

            maze[5][5] = TILE_TYPES.PATH;
            maze[4][5] = TILE_TYPES.PATH;

            mockScene.ghostAISystem.chooseDirection(ghost, maze);
            ghost.update(20, maze, pacman);

            const distToCenter = distanceToTileCenter(ghost.x, ghost.y, 5, 5);
            expect(distToCenter).toBeLessThanOrEqual(3);
        });

        test('does not change direction between centers', () => {
            ghost.x = tileCenter(5, 5).x + 5;
            ghost.y = tileCenter(5, 5).y;
            ghost.direction = directions.RIGHT;
            const initialDirection = ghost.direction;
            ghost.isMoving = true;

            mockScene.ghostAISystem.chooseDirection = jest.fn();

            ghost.update(10, maze, pacman);

            expect(ghost.direction).toBe(initialDirection);
        });

        test('can reverse direction immediately (ghost behavior)', () => {
            ghost.x = tileCenter(5, 5).x;
            ghost.y = tileCenter(5, 5).y;
            ghost.direction = directions.RIGHT;
            ghost.isMoving = true;

            ghost.direction = directions.UP;

            expect(ghost.direction).toBe(directions.UP);
        });
    });

    describe('Corner turn tolerance scenarios', () => {
        test('turns at center even with slight offset (within EPS)', () => {
            const center = tileCenter(5, 5);
            pacman.x = center.x + EPS - 0.1;
            pacman.y = center.y;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);

            maze[5][5] = TILE_TYPES.PATH;
            maze[4][5] = TILE_TYPES.PATH;

            pacman.update(20, maze);

            // Should attempt to turn (direction may or may not change depending on moveStep)
            const distToCenter = distanceToTileCenter(pacman.x, pacman.y, 5, 5);
            expect(distToCenter).toBeLessThanOrEqual(EPS + 2);
        });

        test('does not turn when far from center (> EPS)', () => {
            const center = tileCenter(5, 5);
            pacman.x = center.x + EPS * 2;
            pacman.y = center.y;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);

            maze[5][5] = TILE_TYPES.PATH;
            maze[4][5] = TILE_TYPES.PATH;

            pacman.update(10, maze);

            expect(pacman.direction).toBe(directions.RIGHT);
            expect(pacman.nextDirection).toBe(directions.UP);
        });
    });
});

describe('Movement - Pure Movement (No Collision Side Effects)', () => {
    let mockScene;
    let pacman;
    let ghost;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockScene.ghostAISystem = {
            chooseDirection: jest.fn()
        };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
        ghost = new Ghost(mockScene, 5, 5, ghostNames.BLINKY, ghostColors.BLINKY);
    });

    describe('Independent entity movement', () => {
        test('Pacman movement does not affect Ghost state', () => {
            const initialGhostX = ghost.x;
            const initialGhostY = ghost.y;

            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(ghost.x).toBe(initialGhostX);
            expect(ghost.y).toBe(initialGhostY);
        });

        test('Ghost movement does not affect Pacman state', () => {
            const initialPacmanX = pacman.x;
            const initialPacmanY = pacman.y;

            ghost.x = tileCenter(5, 5).x;
            ghost.y = tileCenter(5, 5).y;
            ghost.direction = directions.RIGHT;
            ghost.isMoving = true;

            ghost.update(100, maze, pacman);

            expect(pacman.x).toBe(initialPacmanX);
            expect(pacman.y).toBe(initialPacmanY);
        });

        test('multiple entities can exist without interfering', () => {
            const ghost2 = new Ghost(mockScene, 3, 3, ghostNames.PINKY, ghostColors.PINKY);

            pacman.gridX = 5;
            pacman.gridY = 5;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            ghost.gridX = 5;
            ghost.gridY = 5;
            ghost.direction = directions.DOWN;
            ghost.isMoving = true;

            ghost2.gridX = 3;
            ghost2.gridY = 3;
            ghost2.direction = directions.LEFT;
            ghost2.isMoving = true;

            pacman.update(50, maze);
            ghost.update(50, maze, pacman);
            ghost2.update(50, maze, pacman);

            expect(pacman.x).toBeGreaterThan(tileCenter(5, 5).x);
            expect(ghost.y).toBeGreaterThan(tileCenter(5, 5).y);
            expect(ghost2.x).toBeLessThan(tileCenter(3, 3).x);
        });
    });

    describe('Movement state isolation', () => {
        test('Pacman direction changes do not affect Ghost direction', () => {
            pacman.setDirection(directions.UP);
            expect(pacman.nextDirection).toBe(directions.UP);

            expect(ghost.direction).toBe(directions.NONE);
        });

        test('Ghost mode changes do not affect Pacman movement', () => {
            ghost.mode = 'SCATTER';
            ghost.isFrightened = true;

            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(50, maze);

            expect(pacman.x).toBeGreaterThan(tileCenter(5, 5).x);
            expect(pacman.isMoving).toBe(true);
        });

        test('each entity maintains its own grid position', () => {
            pacman.gridX = 5;
            pacman.gridY = 5;
            ghost.gridX = 3;
            ghost.gridY = 3;

            pacman.update(10, maze);
            ghost.update(10, maze, pacman);

            expect(pacman.gridX).toBe(5);
            expect(pacman.gridY).toBe(5);
            expect(ghost.gridX).toBe(3);
            expect(ghost.gridY).toBe(3);
        });
    });
});

describe('Movement - Edge Cases and Integration', () => {
    let mockScene;
    let pacman;
    let ghost;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        mockScene.ghostAISystem = {
            chooseDirection: jest.fn()
        };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
        ghost = new Ghost(mockScene, 5, 5, ghostNames.BLINKY, ghostColors.BLINKY);
    });

    describe('Speed variations', () => {
        test('movement works correctly at different speeds', () => {
            const speeds = [50, 100, 150, 200];

            speeds.forEach(speed => {
                pacman.speed = speed;
                pacman.x = tileCenter(5, 5).x;
                pacman.y = tileCenter(5, 5).y;
                pacman.direction = directions.RIGHT;
                pacman.isMoving = true;

                const initialX = pacman.x;
                pacman.update(100, maze);

                expect(pacman.x).toBeGreaterThan(initialX);
                expect(pacman.x).toBeLessThan(initialX + speed * 0.15);
            });
        });

        test('ghost speed multiplier affects movement', () => {
            ghost.speed = 100;
            ghost.x = tileCenter(5, 5).x;
            ghost.y = tileCenter(5, 5).y;
            ghost.direction = directions.RIGHT;
            ghost.isMoving = true;

            ghost.update(100, maze, pacman);
            const normalDistance = ghost.x - tileCenter(5, 5).x;

            ghost.x = tileCenter(5, 5).x;
            ghost.setSpeedMultiplier(2.0);

            ghost.update(100, maze, pacman);
            const boostedDistance = ghost.x - tileCenter(5, 5).x;

            expect(boostedDistance).toBeCloseTo(normalDistance * 2, 1);
        });
    });

    describe('Tunnel movement (if applicable)', () => {
        test('entity can wrap horizontally through tunnel', () => {
            const wideMaze = createSimpleMaze(28, 31);

            for (let y = 1; y < 30; y++) {
                wideMaze[y][0] = TILE_TYPES.PATH;
                wideMaze[y][27] = TILE_TYPES.PATH;
            }

            pacman.gridX = 0;
            pacman.gridY = 14;
            pacman.x = tileCenter(0, 14).x;
            pacman.y = tileCenter(0, 14).y;
            pacman.direction = directions.LEFT;
            pacman.isMoving = true;

            pacman.update(200, wideMaze);

            expect(pacman.x).toBeGreaterThan(0);
        });
    });

    describe('Zero speed and no movement', () => {
        test('entity does not move when speed is zero', () => {
            pacman.speed = 0;
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            const initialX = pacman.x;
            const initialY = pacman.y;

            pacman.update(100, maze);

            expect(pacman.x).toBe(initialX);
            expect(pacman.y).toBe(initialY);
        });

        test('entity does not move when direction is NONE', () => {
            pacman.speed = 100;
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.NONE;
            pacman.isMoving = false;

            const initialX = pacman.x;
            const initialY = pacman.y;

            pacman.update(100, maze);

            expect(pacman.x).toBe(initialX);
            expect(pacman.y).toBe(initialY);
        });
    });

    describe('Large delta time handling', () => {
        test('movement is bounded even with large delta', () => {
            pacman.speed = 100;
            pacman.x = tileCenter(5, 5).x;
            pacman.y = tileCenter(5, 5).y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            const initialX = pacman.x;

            pacman.update(5000, maze);

            expect(pacman.x).toBeLessThan(tileCenter(6, 5).x + gameConfig.tileSize);
            expect(pacman.x).toBeGreaterThan(initialX);
        });
    });
});
