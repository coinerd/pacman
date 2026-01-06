import Ghost from '../../src/entities/Ghost.js';
import { gameConfig, ghostModes, directions, animationConfig, levelConfig } from '../../src/config/gameConfig.js';
import { createMockScene, createSimpleMaze, createMockPacman } from '../utils/testHelpers.js';

describe('Ghost Entity', () => {
    let mockScene;
    let ghost;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        maze = createSimpleMaze(10, 10);
        ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
    });

    describe('Initialization', () => {
        test('initializes with correct type and color', () => {
            expect(ghost.type).toBe('blinky');
            expect(ghost.color).toBe(0xFF0000);
        });

        test('calculates speed based on level', () => {
            mockScene.gameState = { level: 1 };
            ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
            const expectedSpeed = levelConfig.baseSpeed * levelConfig.ghostSpeedMultiplier;
            expect(ghost.speed).toBe(expectedSpeed);
        });

        test('increases speed with level progression', () => {
            mockScene.gameState = { level: 2 };
            ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
            const level2Speed = (levelConfig.baseSpeed + levelConfig.speedIncreasePerLevel) * levelConfig.ghostSpeedMultiplier;
            expect(ghost.speed).toBe(level2Speed);
        });

        test('sets initial mode to SCATTER', () => {
            expect(ghost.mode).toBe(ghostModes.SCATTER);
        });

        test('initializes all state flags correctly', () => {
            expect(ghost.isEaten).toBe(false);
            expect(ghost.isFrightened).toBe(false);
            expect(ghost.inGhostHouse).toBe(false);
            expect(ghost.houseTimer).toBe(0);
        });

        test('stores start grid positions', () => {
            ghost = new Ghost(mockScene, 5, 7, 'pinky', 0xFFB8FF);
            expect(ghost.startGridX).toBe(5);
            expect(ghost.startGridY).toBe(7);
        });

        test('initializes timers to zero', () => {
            expect(ghost.frightenedTimer).toBe(0);
            expect(ghost.blinkTimer).toBe(0);
        });

        test('sets initial direction to NONE', () => {
            expect(ghost.direction).toBe(directions.NONE);
        });

        test('stores base speed for reference', () => {
            expect(ghost.baseSpeed).toBe(ghost.speed);
        });
    });

    describe('update()', () => {
        test('calls updateEaten when ghost is eaten', () => {
            ghost.isEaten = true;
            ghost.updateEaten = jest.fn();
            ghost.update(100, maze, createMockPacman());
            expect(ghost.updateEaten).toHaveBeenCalledWith(100, maze);
        });

        test('calls updateFrightened and moveGhost when not eaten', () => {
            ghost.isEaten = false;
            ghost.updateFrightened = jest.fn();
            ghost.moveGhost = jest.fn();
            const pacman = createMockPacman();
            ghost.update(100, maze, pacman);
            expect(ghost.updateFrightened).toHaveBeenCalledWith(100);
            expect(ghost.moveGhost).toHaveBeenCalledWith(100, maze, pacman);
        });

        test('calls updateVisuals in all cases', () => {
            ghost.updateVisuals = jest.fn();
            ghost.update(100, maze, createMockPacman());
            expect(ghost.updateVisuals).toHaveBeenCalled();
        });
    });

    describe('moveGhost()', () => {
        test('does not move when direction is NONE', () => {
            const initialX = ghost.x;
            ghost.direction = directions.NONE;
            ghost.moveGhost(100, maze, createMockPacman());
            expect(ghost.x).toBe(initialX);
        });

        test('moves in current direction', () => {
            ghost.direction = directions.RIGHT;
            const initialX = ghost.x;
            ghost.moveGhost(1000, maze, createMockPacman());
            expect(ghost.x).toBeGreaterThan(initialX);
        });

        test('calculates move step based on speed and delta', () => {
            ghost.direction = directions.RIGHT;
            ghost.speed = 100;
            const delta = 100;
            const expectedMove = 100 * (100 / 1000);
            const initialX = ghost.x;
            ghost.moveGhost(delta, maze, createMockPacman());
            // Ghost is at gridY 14 (tunnel row), so tunnel speed multiplier (0.4) is applied
            const expectedMoveWithTunnel = 100 * 0.4 * (100 / 1000);
            expect(ghost.x - initialX).toBeCloseTo(expectedMoveWithTunnel, 1);
        });

        test('handles tunnel wrapping', () => {
            ghost.direction = directions.RIGHT;
            ghost.x = gameConfig.mazeWidth * gameConfig.tileSize;
            ghost.handleTunnelWrap = jest.fn();
            ghost.moveGhost(100, maze, createMockPacman());
            expect(ghost.handleTunnelWrap).toHaveBeenCalled();
        });
    });

    describe('updateFrightened()', () => {
        test('decrements frightenedTimer when frightened', () => {
            ghost.isFrightened = true;
            ghost.frightenedTimer = 5000;
            ghost.updateFrightened(1000);
            expect(ghost.frightenedTimer).toBe(4000);
        });

        test('does not decrement when not frightened', () => {
            ghost.isFrightened = false;
            ghost.frightenedTimer = 5000;
            ghost.updateFrightened(1000);
            expect(ghost.frightenedTimer).toBe(5000);
        });

        test('increments blinkTimer when frightened', () => {
            ghost.isFrightened = true;
            ghost.blinkTimer = 0;
            ghost.updateFrightened(100);
            expect(ghost.blinkTimer).toBe(100);
        });

        test('sets isBlinking true when timer <= 2000', () => {
            ghost.isFrightened = true;
            ghost.frightenedTimer = 2001;
            ghost.updateFrightened(1);
            expect(ghost.isBlinking).toBe(true);
        });

        test('sets isBlinking false when timer > 2000', () => {
            ghost.isFrightened = true;
            ghost.frightenedTimer = 2001;
            ghost.isBlinking = false;
            ghost.updateFrightened(0);
            expect(ghost.isBlinking).toBe(false);
        });

        test('clears frightened state when timer reaches zero', () => {
            ghost.isFrightened = true;
            ghost.isBlinking = true;
            ghost.frightenedTimer = 100;
            ghost.speed = 50;
            ghost.updateFrightened(100);
            expect(ghost.isFrightened).toBe(false);
            expect(ghost.isBlinking).toBe(false);
            expect(ghost.speed).toBe(ghost.baseSpeed);
        });
    });

    describe('updateEaten()', () => {
        test('decrements houseTimer when in ghost house', () => {
            ghost.inGhostHouse = true;
            ghost.houseTimer = 2000;
            ghost.updateEaten(100, maze);
            expect(ghost.houseTimer).toBe(1900);
        });

        test('calls reset when houseTimer reaches zero', () => {
            ghost.inGhostHouse = true;
            ghost.houseTimer = 100;
            ghost.reset = jest.fn();
            ghost.updateEaten(100, maze);
            expect(ghost.reset).toHaveBeenCalled();
        });

        test('does not move when in ghost house', () => {
            ghost.inGhostHouse = true;
            const initialX = ghost.x;
            ghost.updateEaten(100, maze);
            expect(ghost.x).toBe(initialX);
        });
    });

    describe('updateVisuals()', () => {
        test('sets frightened color when isFrightened and not blinking', () => {
            ghost.isFrightened = true;
            ghost.isBlinking = false;
            ghost.setFillStyle = jest.fn();
            ghost.updateVisuals();
            expect(ghost.setFillStyle).toHaveBeenCalledWith(expect.any(Number), 1);
        });

        test('sets blinking color when isFrightened and isBlinking', () => {
            ghost.isFrightened = true;
            ghost.isBlinking = true;
            ghost.blinkTimer = 0;
            ghost.setFillStyle = jest.fn();
            ghost.updateVisuals();
            expect(ghost.setFillStyle).toHaveBeenCalled();
        });

        test('sets transparent white when isEaten', () => {
            ghost.isEaten = true;
            ghost.setFillStyle = jest.fn();
            ghost.updateVisuals();
            expect(ghost.setFillStyle).toHaveBeenCalledWith(0xFFFFFF, 0.4);
        });

        test('sets normal color when not frightened or eaten', () => {
            ghost.isFrightened = false;
            ghost.isEaten = false;
            ghost.color = 0xFF0000;
            ghost.setFillStyle = jest.fn();
            ghost.updateVisuals();
            expect(ghost.setFillStyle).toHaveBeenCalledWith(0xFF0000, 1);
        });
    });

    describe('setFrightened()', () => {
        test('sets isFrightened to true', () => {
            ghost.setFrightened(5000);
            expect(ghost.isFrightened).toBe(true);
        });

        test('sets frightenedTimer to duration', () => {
            ghost.setFrightened(3000);
            expect(ghost.frightenedTimer).toBe(3000);
        });

        test('sets isBlinking to false', () => {
            ghost.setFrightened(5000);
            expect(ghost.isBlinking).toBe(false);
        });

        test('reduces speed to 50%', () => {
            ghost.baseSpeed = 100;
            ghost.setFrightened(5000);
            expect(ghost.speed).toBe(50);
        });

        test('reverses direction when direction is not NONE', () => {
            ghost.direction = directions.RIGHT;
            ghost.setFrightened(5000);
            expect(ghost.direction).toBe(directions.LEFT);
        });

        test('does not reverse when direction is NONE', () => {
            ghost.direction = directions.NONE;
            ghost.setFrightened(5000);
            expect(ghost.direction).toBe(directions.NONE);
        });
    });

    describe('eat()', () => {
        test('sets isEaten to true', () => {
            ghost.eat();
            expect(ghost.isEaten).toBe(true);
        });

        test('clears isFrightened state', () => {
            ghost.isFrightened = true;
            ghost.eat();
            expect(ghost.isFrightened).toBe(false);
        });
    });

    describe('reset()', () => {
        test('resets position to startGridX/startGridY', () => {
            ghost.startGridX = 5;
            ghost.startGridY = 7;
            ghost.gridX = 10;
            ghost.gridY = 12;
            ghost.reset();
            expect(ghost.gridX).toBe(5);
            expect(ghost.gridY).toBe(7);
        });

        test('resets direction to NONE', () => {
            ghost.direction = directions.RIGHT;
            ghost.reset();
            expect(ghost.direction).toBe(directions.NONE);
        });

        test('clears isEaten flag', () => {
            ghost.isEaten = true;
            ghost.reset();
            expect(ghost.isEaten).toBe(false);
        });

        test('clears isFrightened flag', () => {
            ghost.isFrightened = true;
            ghost.reset();
            expect(ghost.isFrightened).toBe(false);
        });

        test('clears inGhostHouse flag', () => {
            ghost.inGhostHouse = true;
            ghost.reset();
            expect(ghost.inGhostHouse).toBe(false);
        });

        test('resets houseTimer to zero', () => {
            ghost.houseTimer = 1000;
            ghost.reset();
            expect(ghost.houseTimer).toBe(0);
        });

        test('resets pixel position to tile center', () => {
            ghost.startGridX = 3;
            ghost.startGridY = 4;
            ghost.reset();
            const expectedX = 3 * gameConfig.tileSize + gameConfig.tileSize / 2;
            const expectedY = 4 * gameConfig.tileSize + gameConfig.tileSize / 2;
            expect(ghost.x).toBeCloseTo(expectedX, 1);
            expect(ghost.y).toBeCloseTo(expectedY, 1);
        });

        test('resets speed to baseSpeed', () => {
            ghost.speed = 200;
            ghost.baseSpeed = 100;
            ghost.reset();
            expect(ghost.speed).toBe(100);
        });

        test('resets mode to SCATTER', () => {
            ghost.mode = ghostModes.CHASE;
            ghost.reset();
            expect(ghost.mode).toBe(ghostModes.SCATTER);
        });
    });

    describe('setSpeedMultiplier()', () => {
        test('multiplies base speed by multiplier', () => {
            ghost.baseSpeed = 100;
            ghost.setSpeedMultiplier(1.5);
            expect(ghost.speed).toBe(150);
        });

        test('sets current speed to baseSpeed * multiplier', () => {
            ghost.baseSpeed = 80;
            ghost.setSpeedMultiplier(2.0);
            expect(ghost.speed).toBe(160);
        });
    });

    describe('chooseDirectionToTarget()', () => {
        test('sets direction to minimize distance to target', () => {
            ghost.gridX = 2;
            ghost.gridY = 1;
            const targetX = 10;
            const targetY = 10;
            ghost.chooseDirectionToTarget(maze, targetX, targetY);
            expect(ghost.direction).not.toBe(directions.NONE);
        });
    });

    describe('getReverseDirection()', () => {
        test('returns LEFT for RIGHT', () => {
            expect(ghost.getReverseDirection(directions.RIGHT)).toBe(directions.LEFT);
        });

        test('returns RIGHT for LEFT', () => {
            expect(ghost.getReverseDirection(directions.LEFT)).toBe(directions.RIGHT);
        });

        test('returns UP for DOWN', () => {
            expect(ghost.getReverseDirection(directions.DOWN)).toBe(directions.UP);
        });

        test('returns DOWN for UP', () => {
            expect(ghost.getReverseDirection(directions.UP)).toBe(directions.DOWN);
        });

        test('returns NONE for invalid direction', () => {
            expect(ghost.getReverseDirection(directions.NONE)).toBe(directions.NONE);
        });
    });

    describe('snapToCurrentCenter()', () => {
        test('snaps x and y to tile center', () => {
            ghost.gridX = 5;
            ghost.gridY = 7;
            ghost.x = 95;
            ghost.y = 145;
            ghost.snapToCurrentCenter();
            const expectedX = 5 * gameConfig.tileSize + gameConfig.tileSize / 2;
            const expectedY = 7 * gameConfig.tileSize + gameConfig.tileSize / 2;
            expect(ghost.x).toBeCloseTo(expectedX, 1);
            expect(ghost.y).toBeCloseTo(expectedY, 1);
        });
    });

    describe('Bug Fix: Mode reset on respawn', () => {
        test('resets mode to SCATTER when reset() is called', () => {
            ghost.mode = ghostModes.CHASE;
            ghost.reset();
            expect(ghost.mode).toBe(ghostModes.SCATTER);
        });
    });

    describe('Bug Fix: FrightenedTimer clamping', () => {
        test('clamps frightenedTimer to zero when negative delta', () => {
            ghost.isFrightened = true;
            ghost.frightenedTimer = 10;
            ghost.updateFrightened(20);
            ghost.updateFrightened(0);
            expect(ghost.frightenedTimer).toBe(0);
            expect(ghost.isFrightened).toBe(false);
        });
    });

    describe('Bug Fix: HouseTimer clamping', () => {
        test('clamps houseTimer to zero when negative delta', () => {
            ghost.inGhostHouse = true;
            ghost.houseTimer = 10;
            ghost.reset = jest.fn();
            ghost.updateEaten(20, maze);
            expect(ghost.houseTimer).toBe(0);
            expect(ghost.reset).toHaveBeenCalled();
        });
    });
});
