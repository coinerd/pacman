import Pacman from '../../src/entities/Pacman.js';
import { gameConfig, directions } from '../../src/config/gameConfig.js';
import { createMockScene, createSimpleMaze } from '../utils/testHelpers.js';
import { tileCenter, distanceToTileCenter } from '../../src/utils/TileMovement.js';

describe('Pacman - Grid Movement', () => {
    let mockScene;
    let pacman;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.gameState = { level: 1 };
        maze = createSimpleMaze(10, 10);
        pacman = new Pacman(mockScene, 5, 5);
    });

    describe('tile-center snapping', () => {
        test('snaps to tile center when within EPS', () => {
            pacman.x = 108;
            pacman.y = 110;
            pacman.directionBuffer.apply(directions.RIGHT);
            pacman.isMoving = true;
            pacman.speed = 100;

            pacman.update(20, maze);

            const center = tileCenter(5, 5);
            expect(pacman.x).toBeGreaterThanOrEqual(center.x);
            expect(pacman.y).toBe(center.y);
        });

        test('detects being at tile center', () => {
            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.speed = 100;

            pacman.update(20, maze);

            const distToCenter = distanceToTileCenter(pacman.x, pacman.y, pacman.gridX, pacman.gridY);
            expect(distToCenter).toBeLessThan(2);
        });

        test('moves from center without snapping back', () => {
            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.speed = 100;

            pacman.update(20, maze);

            const center = tileCenter(5, 5);
            expect(pacman.x).toBeGreaterThan(center.x);
        });

        test('works correctly for horizontal movement', () => {
            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.speed = 120;

            pacman.update(20, maze);

            const distToCenter = distanceToTileCenter(pacman.x, pacman.y, pacman.gridX, pacman.gridY);
            expect(distToCenter).toBeLessThan(3);
        });
    });

    describe('direction changes only at tile center', () => {
        test('does not change direction when not at center', () => {
            pacman.x = 95;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);
            pacman.isMoving = true;

            pacman.update(10, maze);

            expect(pacman.direction).toBe(directions.RIGHT);
        });

        test('changes direction when at tile center', () => {
            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);
            pacman.isMoving = true;

            maze[5][5] = 0;
            maze[4][5] = 0;

            pacman.update(20, maze);

            expect(pacman.direction).toBe(directions.UP);
        });

        test('waits until center to apply buffered direction', () => {
            pacman.x = 100;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);
            pacman.isMoving = true;

            maze[5][5] = 0;
            maze[4][5] = 0;

            pacman.update(10, maze);

            expect(pacman.direction).toBe(directions.RIGHT);
            expect(pacman.nextDirection).toBe(directions.UP);

            pacman.update(100, maze);

            expect(pacman.direction).toBe(directions.UP);
            expect(pacman.nextDirection).toBe(directions.NONE);
        });

        test('cannot turn into wall even at center', () => {
            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);
            pacman.isMoving = true;

            maze[5][5] = 0;
            maze[4][5] = 1;

            pacman.update(20, maze);

            expect(pacman.direction).toBe(directions.RIGHT);
        });
    });

    describe('buffered input handling', () => {
        test('stores nextDirection when not at center', () => {
            pacman.x = 100;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;

            pacman.setDirection(directions.UP);

            expect(pacman.nextDirection).toBe(directions.UP);
            expect(pacman.direction).toBe(directions.RIGHT);
        });

        test('applies buffered direction at tile center', () => {
            pacman.x = 100;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);
            pacman.isMoving = true;

            maze[5][5] = 0;
            maze[4][5] = 0;

            pacman.update(100, maze);

            expect(pacman.direction).toBe(directions.UP);
            expect(pacman.nextDirection).toBe(directions.NONE);
        });

        test('replaces buffered direction with new input', () => {
            pacman.x = 100;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);

            expect(pacman.nextDirection).toBe(directions.UP);

            pacman.setDirection(directions.DOWN);

            expect(pacman.nextDirection).toBe(directions.DOWN);
        });

        test('clears nextDirection after applying', () => {
            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);
            pacman.isMoving = true;

            maze[5][5] = 0;
            maze[4][5] = 0;

            pacman.update(20, maze);

            expect(pacman.nextDirection).toBe(directions.NONE);
        });
    });

    describe('wall collision prevents movement', () => {
        test('cannot move right into wall', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            const center = tileCenter(1, 1);
            pacman.x = center.x;
            pacman.y = center.y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.x).toBeCloseTo(center.x, 1);
        });

        test('cannot move left into wall', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            const center = tileCenter(1, 1);
            pacman.x = center.x;
            pacman.y = center.y;
            pacman.direction = directions.LEFT;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.x).toBeCloseTo(center.x, 1);
        });

        test('cannot move up into wall', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            const center = tileCenter(1, 1);
            pacman.x = center.x;
            pacman.y = center.y;
            pacman.direction = directions.UP;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.y).toBeCloseTo(center.y, 1);
        });

        test('cannot move down into wall', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            const center = tileCenter(1, 1);
            pacman.x = center.x;
            pacman.y = center.y;
            pacman.direction = directions.DOWN;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.y).toBeCloseTo(center.y, 1);
        });

        test('stops moving when blocked by wall', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            const center = tileCenter(1, 1);
            pacman.x = center.x;
            pacman.y = center.y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.isMoving).toBe(false);
        });
    });

    describe('movement stops when direction is blocked', () => {
        test('sets isMoving to false when blocked', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            const center = tileCenter(1, 1);
            pacman.x = center.x;
            pacman.y = center.y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.isMoving).toBe(false);
        });

        test('resets direction to NONE when blocked', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            const center = tileCenter(1, 1);
            pacman.x = center.x;
            pacman.y = center.y;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(100, maze);

            expect(pacman.direction).toBe(directions.NONE);
        });

        test('continues moving if direction is clear', () => {
            pacman.gridX = 5;
            pacman.gridY = 5;
            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(50, maze);

            expect(pacman.isMoving).toBe(true);
            expect(pacman.x).toBeGreaterThan(110);
        });
    });

    describe('entity grid position updates correctly', () => {
        test('updates gridX after moving right past center', () => {
            pacman.gridX = 5;
            pacman.gridY = 5;
            pacman.x = 110;
            pacman.y = 110;
            pacman.setDirection(directions.RIGHT);
            pacman.isMoving = true;

            pacman.update(50, maze);

            expect(pacman.gridX).toBe(5);
        });

        test('updates gridY after moving up past center', () => {
            pacman.gridX = 5;
            pacman.gridY = 5;
            pacman.x = 110;
            pacman.y = 110;
            pacman.setDirection(directions.UP);
            pacman.isMoving = true;

            pacman.update(50, maze);

            expect(pacman.gridY).toBe(5);
        });

        test('grid position matches floor of pixel position', () => {
            pacman.x = 110;
            pacman.y = 110;
            pacman.setDirection(directions.RIGHT);
            pacman.speed = 100;

            pacman.update(250, maze);

            const expectedGridX = Math.floor(pacman.x / gameConfig.tileSize);
            const expectedGridY = Math.floor(pacman.y / gameConfig.tileSize);

            expect(pacman.gridX).toBe(expectedGridX);
            expect(pacman.gridY).toBe(expectedGridY);
        });

        test('grid position updates only when crossing center', () => {
            pacman.x = 105;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.speed = 100;
            const initialGridX = pacman.gridX;

            pacman.update(10, maze);

            expect(pacman.gridX).toBe(initialGridX);

            pacman.update(20, maze);

            expect(pacman.gridX).toBe(initialGridX);
        });
    });

    describe('buffered input with wall collision', () => {
        test('discards buffered direction if blocked', () => {
            maze[5][5] = 0;
            maze[4][5] = 1;

            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);
            pacman.isMoving = true;

            pacman.update(20, maze);

            expect(pacman.direction).toBe(directions.RIGHT);
            expect(pacman.nextDirection).toBe(directions.UP);
        });

        test('keeps buffered direction for later opportunity', () => {
            maze[5][5] = 0;
            maze[4][5] = 1;
            maze[5][6] = 0;

            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.UP);
            pacman.isMoving = true;

            pacman.update(20, maze);

            expect(pacman.nextDirection).toBe(directions.UP);
        });
    });

    describe('edge cases', () => {
        test('can reverse direction immediately', () => {
            pacman.x = 110;
            pacman.y = 110;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.setDirection(directions.LEFT);

            expect(pacman.direction).toBe(directions.LEFT);
            expect(pacman.nextDirection).toBe(directions.NONE);
        });

        test('handles NONE direction correctly', () => {
            pacman.x = 100;
            pacman.y = 100;
            pacman.direction = directions.NONE;
            pacman.isMoving = false;

            pacman.update(20, maze);

            expect(pacman.x).toBe(100);
            expect(pacman.y).toBe(100);
        });

        test('stops exactly at tile center when blocked', () => {
            maze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1]
            ];
            pacman.gridX = 1;
            pacman.gridY = 1;
            pacman.x = 30;
            pacman.y = 30;
            pacman.direction = directions.RIGHT;
            pacman.isMoving = true;

            pacman.update(200, maze);

            const center = tileCenter(1, 1);
            const isAtCenter = Math.abs(pacman.x - center.x) < 2 && Math.abs(pacman.y - center.y) < 2;

            expect(isAtCenter).toBe(true);
        });
    });
});
