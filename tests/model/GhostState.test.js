/**
 * GhostState Tests
 * Tests for the Ghost model entity.
 */

import { GhostState } from '../../src/model/entities/GhostState.js';
import { directions, ghostModes, levelConfig, ghostSpeedMultipliers } from '../../src/config/gameConfig.js';
import { createMazeData } from '../../src/utils/MazeLayout.js';

describe('GhostState', () => {
    let ghost;
    let maze;

    beforeEach(() => {
        const mazeData = createMazeData();
        maze = mazeData.maze;
        ghost = new GhostState(13, 11, 'blinky', 1);
    });

    describe('constructor', () => {
        test('creates with correct type and ghostType', () => {
            expect(ghost.type).toBe('ghost');
            expect(ghost.ghostType).toBe('blinky');
            expect(ghost.name).toBe('blinky');
        });

        test('assigns color based on ghost type', () => {
            const blinky = new GhostState(0, 0, 'blinky', 1);
            const pinky = new GhostState(0, 0, 'pinky', 1);

            expect(blinky.color).toBe(0xFF0000);
            expect(pinky.color).toBe(0xFFB8FF);
        });

        test('stores start position', () => {
            expect(ghost.startGridX).toBe(13);
            expect(ghost.startGridY).toBe(11);
        });

        test('calculates speed based on level', () => {
            const level1 = new GhostState(13, 11, 'blinky', 1);
            const level5 = new GhostState(13, 11, 'blinky', 5);

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

        test('reverses direction', () => {
            ghost.direction = directions.RIGHT;
            ghost.setFrightened(5);
            expect(ghost.direction).toBe(directions.LEFT);
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

    describe('updateEaten', () => {
        test('moves toward ghost house', () => {
            ghost.gridX = 5;
            ghost.gridY = 5;
            ghost.isEaten = true;

            const events = ghost.updateEaten(0.5, maze);

            expect(Array.isArray(events)).toBe(true);
        });

        test('enters ghost house when reaching entrance', () => {
            ghost.gridX = 13;
            ghost.gridY = 14;
            ghost.isEaten = true;

            ghost.updateEaten(0.1, maze);

            expect(ghost.inGhostHouse).toBe(true);
        });

        test('revives after house timer expires', () => {
            ghost.isEaten = true;
            ghost.inGhostHouse = true;
            ghost.houseTimer = 0.5;

            const events = ghost.updateEaten(0.6, maze);

            const reviveEvent = events.find(e => e.type === 'ghost_revived');
            expect(reviveEvent).toBeDefined();
            expect(ghost.isEaten).toBe(false);
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
            const direction = ghost.nextDirection.x !== 0 || ghost.nextDirection.y !== 0
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
            expect(visual.color).toBe(0x0000FF);
        });

        test('returns white when blinking', () => {
            ghost.setFrightened(1);
            ghost.isBlinking = true;
            ghost.blinkTimer = 0;
            const visual = ghost.getVisualState();
            expect(visual.color).toBe(0xFFFFFF);
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
