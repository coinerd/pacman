/**
 * EnemyState Tests
 * Tests for the Enemy model entity.
 */

import {
    directions,
    ghostModes,
    ghostSpeedMultipliers,
    levelConfig
} from '../../src/config/gameConfig.js';
import { EnemyState } from '../../src/model/entities/EnemyState.js';
import { createMazeData } from '../../src/utils/MazeLayout.js';

describe('EnemyState', () => {
    let ghost;
    let maze;

    beforeEach(() => {
        const mazeData = createMazeData();
        maze = mazeData.maze;
        ghost = new EnemyState(13, 11, 'blinky', 1);
    });

    describe('constructor', () => {
        test('creates with correct type and ghostType', () => {
            expect(ghost.type).toBe('enemy');
            expect(ghost.ghostType).toBe('blinky');
            expect(ghost.name).toBe('blinky');
        });

        test('Assigns color based on ghost type', () => {
            const alpha = new EnemyState(0, 0, 'alpha', 1);
            const beta = new EnemyState(0, 0, 'beta', 1);

            expect(alpha.color).toBe(0x9b59b6); // ALPHA purple
            expect(beta.color).toBe(0x7fff00); // BETA green
        });

        test('stores start position', () => {
            expect(ghost.startGridX).toBe(13);
            expect(ghost.startGridY).toBe(11);
        });

        test('calculates speed based on level', () => {
            const level1 = new EnemyState(13, 11, 'blinky', 1);
            const level5 = new EnemyState(13, 11, 'blinky', 5);

            expect(level5.speed).toBeGreaterThan(level1.speed);
        });

        test('initializes mode to SCATTER', () => {
            expect(ghost.mode).toBe(ghostModes.SCATTER);
        });

        test('initializes state flags', () => {
            expect(ghost.isEaten).toBe(false);
            expect(ghost.isFrightened).toBe(false);
            expect(ghost.isBlinking).toBe(false);
        });
    });

    describe('speed calculation', () => {
        test('applies speedMultiplier', () => {
            const baseSpeed = ghost.baseSpeed;
            ghost.speedMultiplier = 1.5;
            expect(ghost.speed).toBe(baseSpeed * 1.5);
        });

        test('applies speedModifier', () => {
            const baseSpeed = ghost.baseSpeed;
            ghost.speedModifier = 0.5;
            expect(ghost.speed).toBe(baseSpeed * 0.5);
        });

        test('applies both multipliers', () => {
            const baseSpeed = ghost.baseSpeed;
            ghost.speedMultiplier = 1.5;
            ghost.speedModifier = 0.5;
            expect(ghost.speed).toBe(baseSpeed * 1.5 * 0.5);
        });
    });

    describe('update', () => {
        test('updates frightened state timer', () => {
            ghost.setFrightened(5);
            const initialTimer = ghost.frightenedTimer;

            ghost.update(0.1, maze);

            expect(ghost.frightenedTimer).toBeLessThan(initialTimer);
        });

        test('returns movement events', () => {
            ghost.setDirection(directions.RIGHT);
            const events = ghost.update(0.1, maze);

            expect(Array.isArray(events)).toBe(true);
        });

        test('handles eaten state differently', () => {
            ghost.eat();
            const events = ghost.update(0.1, maze);

            expect(Array.isArray(events)).toBe(true);
        });
    });

    describe('setFrightened', () => {
        test('sets frightened state', () => {
            ghost.setFrightened(5);
            expect(ghost.isFrightened).toBe(true);
            expect(ghost.frightenedTimer).toBe(5);
        });

        test('applies speed modifier', () => {
            ghost.setFrightened(5);
            expect(ghost.speedModifier).toBe(ghostSpeedMultipliers.frightened);
        });

    });

    describe('updateFrightened', () => {
        test('decrements timer', () => {
            ghost.setFrightened(5);
            ghost.updateFrightened(1);
            expect(ghost.frightenedTimer).toBe(4);
        });

        test('starts blinking in last 2 seconds', () => {
            ghost.setFrightened(2.5);
            ghost.updateFrightened(0.6);
            expect(ghost.isBlinking).toBe(true);
        });

        test('ends frightened state when timer expires', () => {
            ghost.setFrightened(1);
            ghost.updateFrightened(1.1);
            expect(ghost.isFrightened).toBe(false);
            expect(ghost.speedModifier).toBe(1.0);
        });
    });

    describe('eat', () => {
        test('sets isEaten to true', () => {
            ghost.eat();
            expect(ghost.isEaten).toBe(true);
        });

        test('clears frightened state', () => {
            ghost.setFrightened(5);
            ghost.eat();
            expect(ghost.isFrightened).toBe(false);
        });

        test('clears frightened timer', () => {
            ghost.setFrightened(5);
            ghost.eat();
            expect(ghost.speedModifier).toBe(1.0);
        });
    });

    describe('chooseDirectionToTarget', () => {
        test('chooses direction toward target', () => {
            ghost.gridX = 13;
            ghost.gridY = 11;
            ghost.direction = directions.NONE;

            // Target to the right
            ghost.chooseDirectionToTarget(maze, 20, 11);

            // Direction should be set (either in buffer or applied)
            // The chosen direction should minimize distance to target
            const direction =
				ghost.nextDirection.x !== 0 || ghost.nextDirection.y !== 0
				    ? ghost.nextDirection
				    : ghost.direction;

            // Direction should be one of the valid directions
            expect(direction.x !== 0 || direction.y !== 0).toBe(true);
        });
    });

    describe('reset', () => {
        test('resets position to start', () => {
            ghost.gridX = 99;
            ghost.gridY = 99;
            ghost.reset();

            expect(ghost.gridX).toBe(13);
            expect(ghost.gridY).toBe(11);
        });

        test('clears all state flags', () => {
            ghost.isEaten = true;
            ghost.isFrightened = true;
            ghost.inGhostHouse = true;

            ghost.reset();

            expect(ghost.isEaten).toBe(false);
            expect(ghost.isFrightened).toBe(false);
            expect(ghost.inGhostHouse).toBe(false);
        });

        test('resets speed modifiers', () => {
            ghost.speedMultiplier = 2;
            ghost.speedModifier = 0.5;

            ghost.reset();

            expect(ghost.speedMultiplier).toBe(1.0);
            expect(ghost.speedModifier).toBe(1.0);
        });
    });

    describe('setSpeedMultiplier', () => {
        test('sets speed multiplier', () => {
            ghost.setSpeedMultiplier(1.5);
            expect(ghost.speedMultiplier).toBe(1.5);
        });
    });

    describe('getVisualState', () => {
        test('returns normal color when not frightened', () => {
            const visual = ghost.getVisualState();
            expect(visual.color).toBe(ghost.color);
        });

        test('returns blue color when frightened', () => {
            ghost.setFrightened(5);
            const visual = ghost.getVisualState();
            expect(visual.color).toBe(0x0000ff);
        });

        test('returns white when blinking', () => {
            ghost.setFrightened(1);
            ghost.isBlinking = true;
            ghost.blinkTimer = 0;
            const visual = ghost.getVisualState();
            expect(visual.color).toBe(0xffffff);
        });

        test('returns reduced opacity when eaten', () => {
            ghost.isEaten = true;
            const visual = ghost.getVisualState();
            expect(visual.opacity).toBe(0.4);
        });
    });

    describe('getSnapshot', () => {
        test('includes ghost-specific properties', () => {
            const snapshot = ghost.getSnapshot();

            expect(snapshot).toHaveProperty('ghostType', 'blinky');
            expect(snapshot).toHaveProperty('mode');
            expect(snapshot).toHaveProperty('isFrightened');
            expect(snapshot).toHaveProperty('isEaten');
        });
    });
});
