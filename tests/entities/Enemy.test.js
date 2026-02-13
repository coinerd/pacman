import {
    directions,
    gameConfig,
    ghostModes,
    ghostSpeedMultipliers,
    levelConfig
} from '../../src/config/gameConfig.js';
import Enemy from '../../src/entities/Enemy.js';
import { msToSeconds } from '../../src/utils/Time.js';
import {
    createMockPlayer,
    createMockScene,
    createSimpleMaze
} from '../utils/testHelpers.js';

describe('Enemy Entity', () => {
    let mockScene;
    let enemy;
    let maze;

    beforeEach(() => {
        mockScene = createMockScene();
        maze = createSimpleMaze(gameConfig.mazeWidth, gameConfig.mazeHeight);
        enemy = new Enemy(mockScene, 13, 14, 'blinky', 0xff0000);
    });

    describe('Initialization', () => {
        test('initializes with correct type and color', () => {
            expect(enemy.type).toBe('blinky');
            expect(enemy.color).toBe(0xff0000);
        });

        test('calculates speed based on level', () => {
            mockScene.gameState.level = 1;
            enemy = new Enemy(mockScene, 13, 14, 'blinky', 0xff0000);
            const expectedSpeed =
				levelConfig.baseSpeed * levelConfig.ghostSpeedMultiplier;
            expect(enemy.speed).toBe(expectedSpeed);
        });

        test('increases speed with level progression', () => {
            mockScene.gameState.level = 2;
            enemy = new Enemy(mockScene, 13, 14, 'blinky', 0xff0000);
            const level2Speed =
				(levelConfig.baseSpeed + levelConfig.speedIncreasePerLevel) *
				levelConfig.ghostSpeedMultiplier;
            expect(enemy.speed).toBe(level2Speed);
        });

        test('sets initial mode to SCATTER', () => {
            expect(enemy.mode).toBe(ghostModes.SCATTER);
        });

        test('initializes all state flags correctly', () => {
            expect(enemy.isEaten).toBe(false);
            expect(enemy.isFrightened).toBe(false);
            expect(enemy.inGhostHouse).toBe(false);
            expect(enemy.houseTimer).toBe(0);
        });

        test('stores start grid positions', () => {
            enemy = new Enemy(mockScene, 5, 7, 'pinky', 0xffb8ff);
            expect(enemy.startGridX).toBe(5);
            expect(enemy.startGridY).toBe(7);
        });

        test('initializes timers to zero', () => {
            expect(enemy.frightenedTimer).toBe(0);
            expect(enemy.blinkTimer).toBe(0);
        });

        test('sets initial direction to NONE', () => {
            expect(enemy.direction).toBe(directions.NONE);
        });

        test('stores base speed for reference', () => {
            expect(enemy.baseSpeed).toBe(enemy.speed);
        });
    });

    describe('update()', () => {
        test('calls updateEaten when enemy is eaten', () => {
            enemy.isEaten = true;
            enemy.updateEaten = jest.fn();
            enemy.update(msToSeconds(100), maze, createMockPlayer());
            expect(enemy.updateEaten).toHaveBeenCalledWith(msToSeconds(100), maze);
        });

        test('calls updateFrightened and moveEnemy when not eaten', () => {
            enemy.isEaten = false;
            enemy.updateFrightened = jest.fn();
            enemy.moveEnemy = jest.fn();
            const pacman = createMockPlayer();
            enemy.update(msToSeconds(100), maze, pacman);
            expect(enemy.updateFrightened).toHaveBeenCalledWith(msToSeconds(100));
            expect(enemy.moveEnemy).toHaveBeenCalledWith(
                msToSeconds(100),
                maze,
                pacman
            );
        });

        test('calls updateVisuals in all cases', () => {
            enemy.updateVisuals = jest.fn();
            enemy.update(msToSeconds(100), maze, createMockPlayer());
            expect(enemy.updateVisuals).toHaveBeenCalled();
        });
    });

    describe('moveEnemy()', () => {
        test('does not move when direction is NONE', () => {
            const initialX = enemy.x;
            enemy.direction = directions.NONE;
            enemy.moveEnemy(msToSeconds(100), maze, createMockPlayer());
            expect(enemy.x).toBe(initialX);
        });

        test('moves in current direction', () => {
            enemy.direction = directions.RIGHT;
            const initialX = enemy.x;
            enemy.moveEnemy(msToSeconds(1000), maze, createMockPlayer());
            expect(enemy.x).toBeGreaterThan(initialX);
        });

        test('calculates move step based on speed and delta', () => {
            enemy.resetPosition(13, gameConfig.tunnelRow);
            enemy.direction = directions.RIGHT;
            enemy.baseSpeed = 100;
            const deltaSeconds = msToSeconds(100);
            const initialX = enemy.x;
            enemy.moveEnemy(deltaSeconds, maze, createMockPlayer());
            // Enemy is at the tunnel row, so tunnel speed modifier is applied
            const expectedMoveWithTunnel =
				100 * ghostSpeedMultipliers.tunnel * deltaSeconds;
            expect(enemy.x - initialX).toBeCloseTo(expectedMoveWithTunnel, 1);
        });

        test('handles tunnel wrapping', () => {
            enemy.direction = directions.RIGHT;
            enemy.x = gameConfig.mazeWidth * gameConfig.tileSize;
            enemy.handleTunnelWrap = jest.fn();
            enemy.moveEnemy(msToSeconds(100), maze, createMockPlayer());
            expect(enemy.handleTunnelWrap).toHaveBeenCalled();
        });
    });

    describe('updateFrightened()', () => {
        test('decrements frightenedTimer when frightened', () => {
            enemy.isFrightened = true;
            enemy.frightenedTimer = msToSeconds(5000);
            enemy.updateFrightened(msToSeconds(1000));
            expect(enemy.frightenedTimer).toBe(4);
        });

        test('does not decrement when not frightened', () => {
            enemy.isFrightened = false;
            enemy.frightenedTimer = msToSeconds(5000);
            enemy.updateFrightened(msToSeconds(1000));
            expect(enemy.frightenedTimer).toBe(5);
        });

        test('increments blinkTimer when frightened', () => {
            enemy.isFrightened = true;
            enemy.blinkTimer = 0;
            enemy.updateFrightened(msToSeconds(100));
            expect(enemy.blinkTimer).toBe(0.1);
        });

        test('sets isBlinking true when timer <= 2000', () => {
            enemy.isFrightened = true;
            enemy.frightenedTimer = msToSeconds(2001);
            enemy.updateFrightened(msToSeconds(1));
            expect(enemy.isBlinking).toBe(true);
        });

        test('sets isBlinking false when timer > 2000', () => {
            enemy.isFrightened = true;
            enemy.frightenedTimer = msToSeconds(2001);
            enemy.isBlinking = false;
            enemy.updateFrightened(0);
            expect(enemy.isBlinking).toBe(false);
        });

        test('clears frightened state when timer reaches zero', () => {
            enemy.isFrightened = true;
            enemy.isBlinking = true;
            enemy.frightenedTimer = msToSeconds(100);
            enemy.updateFrightened(msToSeconds(100));
            expect(enemy.isFrightened).toBe(false);
            expect(enemy.isBlinking).toBe(false);
            expect(enemy.speed).toBe(enemy.baseSpeed);
            expect(enemy.speedModifier).toBe(1.0);
        });
    });

    describe('updateEaten()', () => {
        test('decrements houseTimer when in virus core', () => {
            enemy.inGhostHouse = true;
            enemy.houseTimer = msToSeconds(2000);
            enemy.updateEaten(msToSeconds(100), maze);
            expect(enemy.houseTimer).toBeCloseTo(1.9);
        });

        test('calls reset when houseTimer reaches zero', () => {
            enemy.inGhostHouse = true;
            enemy.houseTimer = msToSeconds(100);
            enemy.reset = jest.fn();
            enemy.updateEaten(msToSeconds(100), maze);
            expect(enemy.reset).toHaveBeenCalled();
        });

        test('does not move when in virus core', () => {
            enemy.inGhostHouse = true;
            const initialX = enemy.x;
            enemy.updateEaten(msToSeconds(100), maze);
            expect(enemy.x).toBe(initialX);
        });
    });

    describe('updateVisuals()', () => {
        test('sets frightened color when isFrightened and not blinking', () => {
            enemy.isFrightened = true;
            enemy.isBlinking = false;
            enemy.setFillStyle = jest.fn();
            enemy.updateVisuals();
            expect(enemy.setFillStyle).toHaveBeenCalledWith(expect.any(Number), 1);
        });

        test('sets blinking color when isFrightened and isBlinking', () => {
            enemy.isFrightened = true;
            enemy.isBlinking = true;
            enemy.blinkTimer = 0;
            enemy.setFillStyle = jest.fn();
            enemy.updateVisuals();
            expect(enemy.setFillStyle).toHaveBeenCalled();
        });

        test('sets transparent white when isEaten', () => {
            enemy.isEaten = true;
            enemy.setFillStyle = jest.fn();
            enemy.updateVisuals();
            expect(enemy.setFillStyle).toHaveBeenCalledWith(0xffffff, 0.4);
        });

        test('sets normal color when not frightened or eaten', () => {
            enemy.isFrightened = false;
            enemy.isEaten = false;
            enemy.color = 0xff0000;
            enemy.setFillStyle = jest.fn();
            enemy.updateVisuals();
            expect(enemy.setFillStyle).toHaveBeenCalledWith(0xff0000, 1);
        });
    });

    describe('setFrightened()', () => {
        test('sets isFrightened to true', () => {
            enemy.setFrightened(msToSeconds(5000));
            expect(enemy.isFrightened).toBe(true);
        });

        test('sets frightenedTimer to duration', () => {
            enemy.setFrightened(msToSeconds(3000));
            expect(enemy.frightenedTimer).toBe(3);
        });

        test('sets isBlinking to false', () => {
            enemy.setFrightened(msToSeconds(5000));
            expect(enemy.isBlinking).toBe(false);
        });

        test('reduces speed to 50%', () => {
            enemy.baseSpeed = 100;
            enemy.setFrightened(msToSeconds(5000));
            expect(enemy.speed).toBe(50);
        });

        test('reverses direction when direction is not NONE', () => {
            enemy.direction = directions.RIGHT;
            enemy.setFrightened(msToSeconds(5000));
            expect(enemy.direction).toBe(directions.LEFT);
        });

        test('does not reverse when direction is NONE', () => {
            enemy.direction = directions.NONE;
            enemy.setFrightened(msToSeconds(5000));
            expect(enemy.direction).toBe(directions.NONE);
        });
    });

    describe('eat()', () => {
        test('sets isEaten to true', () => {
            enemy.eat();
            expect(enemy.isEaten).toBe(true);
        });

        test('clears isFrightened state', () => {
            enemy.isFrightened = true;
            enemy.eat();
            expect(enemy.isFrightened).toBe(false);
        });
    });

    describe('reset()', () => {
        test('resets position to startGridX/startGridY', () => {
            enemy.startGridX = 5;
            enemy.startGridY = 7;
            enemy.gridX = 10;
            enemy.gridY = 12;
            enemy.reset();
            expect(enemy.gridX).toBe(5);
            expect(enemy.gridY).toBe(7);
        });

        test('resets direction to NONE', () => {
            enemy.direction = directions.RIGHT;
            enemy.reset();
            expect(enemy.direction).toBe(directions.NONE);
        });

        test('clears isEaten flag', () => {
            enemy.isEaten = true;
            enemy.reset();
            expect(enemy.isEaten).toBe(false);
        });

        test('clears isFrightened flag', () => {
            enemy.isFrightened = true;
            enemy.reset();
            expect(enemy.isFrightened).toBe(false);
        });

        test('clears inGhostHouse flag', () => {
            enemy.inGhostHouse = true;
            enemy.reset();
            expect(enemy.inGhostHouse).toBe(false);
        });

        test('resets houseTimer to zero', () => {
            enemy.houseTimer = 1000;
            enemy.reset();
            expect(enemy.houseTimer).toBe(0);
        });

        test('resets pixel position to tile center', () => {
            enemy.startGridX = 3;
            enemy.startGridY = 4;
            enemy.reset();
            const expectedX = 3 * gameConfig.tileSize + gameConfig.tileSize / 2;
            const expectedY = 4 * gameConfig.tileSize + gameConfig.tileSize / 2;
            expect(enemy.x).toBeCloseTo(expectedX, 1);
            expect(enemy.y).toBeCloseTo(expectedY, 1);
        });

        test('resets speed to baseSpeed', () => {
            enemy.baseSpeed = 100;
            enemy.setSpeedMultiplier(2.0);
            const modifiedSpeed = enemy.speed;
            enemy.reset();
            expect(enemy.speed).toBe(enemy.baseSpeed);
            expect(enemy.speedMultiplier).toBe(1.0);
            expect(enemy.speedModifier).toBe(1.0);
            expect(enemy.speed).toBe(modifiedSpeed / 2.0);
        });

        test('resets mode to SCATTER', () => {
            enemy.mode = ghostModes.CHASE;
            enemy.reset();
            expect(enemy.mode).toBe(ghostModes.SCATTER);
        });
    });

    describe('setSpeedMultiplier()', () => {
        test('multiplies base speed by multiplier', () => {
            enemy.baseSpeed = 100;
            enemy.setSpeedMultiplier(1.5);
            expect(enemy.speed).toBe(150);
        });

        test('sets current speed to baseSpeed * multiplier', () => {
            enemy.baseSpeed = 80;
            enemy.setSpeedMultiplier(2.0);
            expect(enemy.speed).toBe(160);
        });

        test('speed multiplier preserved after frightened state', () => {
            enemy.speedMultiplier = 2.0;
            const expectedSpeed = enemy.baseSpeed * 2.0;

            enemy.setFrightened(msToSeconds(5000));
            expect(enemy.speed).toBe(expectedSpeed * 0.5);
            expect(enemy.speedModifier).toBe(0.5);

            enemy.updateFrightened(6000);
            expect(enemy.speed).toBe(expectedSpeed);
            expect(enemy.speedMultiplier).toBe(2.0);
            expect(enemy.speedModifier).toBe(1.0);
        });
    });

    describe('chooseDirectionToTarget()', () => {
        test('sets direction to minimize distance to target', () => {
            enemy.gridX = 2;
            enemy.gridY = 1;
            const targetX = 10;
            const targetY = 10;
            enemy.chooseDirectionToTarget(maze, targetX, targetY);
            expect(enemy.direction).not.toBe(directions.NONE);
        });
    });

    describe('getReverseDirection()', () => {
        test('returns LEFT for RIGHT', () => {
            expect(enemy.getReverseDirection(directions.RIGHT)).toBe(directions.LEFT);
        });

        test('returns RIGHT for LEFT', () => {
            expect(enemy.getReverseDirection(directions.LEFT)).toBe(directions.RIGHT);
        });

        test('returns UP for DOWN', () => {
            expect(enemy.getReverseDirection(directions.DOWN)).toBe(directions.UP);
        });

        test('returns DOWN for UP', () => {
            expect(enemy.getReverseDirection(directions.UP)).toBe(directions.DOWN);
        });

        test('returns NONE for invalid direction', () => {
            expect(enemy.getReverseDirection(directions.NONE)).toBe(directions.NONE);
        });
    });

    describe('snapToCurrentCenter()', () => {
        test('snaps x and y to tile center', () => {
            enemy.gridX = 5;
            enemy.gridY = 7;
            enemy.x = 95;
            enemy.y = 145;
            enemy.snapToCurrentCenter();
            const expectedX = 5 * gameConfig.tileSize + gameConfig.tileSize / 2;
            const expectedY = 7 * gameConfig.tileSize + gameConfig.tileSize / 2;
            expect(enemy.x).toBeCloseTo(expectedX, 1);
            expect(enemy.y).toBeCloseTo(expectedY, 1);
        });
    });

    describe('Bug Fix: Mode reset on respawn', () => {
        test('resets mode to SCATTER when reset() is called', () => {
            enemy.mode = ghostModes.CHASE;
            enemy.reset();
            expect(enemy.mode).toBe(ghostModes.SCATTER);
        });
    });

    describe('Bug Fix: FrightenedTimer clamping', () => {
        test('clamps frightenedTimer to zero when negative delta', () => {
            enemy.isFrightened = true;
            enemy.frightenedTimer = msToSeconds(10);
            enemy.updateFrightened(msToSeconds(20));
            enemy.updateFrightened(0);
            expect(enemy.frightenedTimer).toBe(0);
            expect(enemy.isFrightened).toBe(false);
        });
    });

    describe('Bug Fix: HouseTimer clamping', () => {
        test('clamps houseTimer to zero when negative delta', () => {
            enemy.inGhostHouse = true;
            enemy.houseTimer = msToSeconds(10);
            enemy.reset = jest.fn();
            enemy.updateEaten(msToSeconds(20), maze);
            expect(enemy.houseTimer).toBe(0);
            expect(enemy.reset).toHaveBeenCalled();
        });
    });
});
