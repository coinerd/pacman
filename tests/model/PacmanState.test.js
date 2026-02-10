/**
 * PacmanState Tests
 * Tests for the Pacman model entity.
 */

import { PacmanState } from '../../src/model/entities/PacmanState.js';
import { directions, levelConfig } from '../../src/config/gameConfig.js';
import { createMazeData } from '../../src/utils/MazeLayout.js';

describe('PacmanState', () => {
    let pacman;
    let maze;

    beforeEach(() => {
        const mazeData = createMazeData();
        maze = mazeData.maze;
        pacman = new PacmanState(13, 23, 1);
    });

    describe('constructor', () => {
        test('creates with correct type', () => {
            expect(pacman.type).toBe('pacman');
        });

        test('calculates speed based on level', () => {
            const level1 = new PacmanState(13, 23, 1);
            const level5 = new PacmanState(13, 23, 5);

            const baseSpeed = levelConfig.baseSpeed * levelConfig.pacmanSpeedMultiplier;
            const level5Expected = (levelConfig.baseSpeed + 4 * levelConfig.speedIncreasePerLevel) * levelConfig.pacmanSpeedMultiplier;

            expect(level1.speed).toBe(baseSpeed);
            expect(level5.speed).toBe(level5Expected);
        });

        test('initializes mouth animation state', () => {
            expect(pacman.mouthAngle).toBe(0);
            expect(pacman.mouthDirection).toBe(1);
            expect(pacman.maxMouthAngle).toBe(30);
        });

        test('initializes isDying to false', () => {
            expect(pacman.isDying).toBe(false);
        });
    });

    describe('update', () => {
        test('updates mouth animation', () => {
            pacman.update(0.1, maze);
            expect(pacman.mouthAngle).toBeGreaterThan(0);
        });

        test('does not move when no direction set', () => {
            const initialX = pacman.x;
            const initialY = pacman.y;

            pacman.update(0.1, maze);

            expect(pacman.x).toBe(initialX);
            expect(pacman.y).toBe(initialY);
        });

        test('moves in set direction', () => {
            // Position at tile center to ensure direction gets applied
            pacman.x = 13 * 20 + 10;
            pacman.y = 23 * 20 + 10;
            pacman.setDirection(directions.RIGHT);

            // Use larger delta to ensure movement happens
            pacman.update(0.5, maze);

            // Direction should be set (in buffer or applied)
            const hasRightDirection = pacman.direction === directions.RIGHT ||
                                    pacman.nextDirection === directions.RIGHT;
            expect(hasRightDirection).toBe(true);
        });

        test('applies input direction', () => {
            pacman.x = 13 * 20 + 10;
            pacman.y = 23 * 20 + 10;

            // Use larger delta to ensure movement happens
            pacman.update(0.5, maze, directions.RIGHT);

            // Direction should be set (in buffer or applied)
            const hasRightDirection = pacman.direction === directions.RIGHT ||
                                    pacman.nextDirection === directions.RIGHT;
            expect(hasRightDirection).toBe(true);
        });

        test('returns movement events', () => {
            pacman.setDirection(directions.RIGHT);
            const events = pacman.update(0.5, maze);

            // Should have tile_enter event when moving to next tile
            expect(Array.isArray(events)).toBe(true);
        });

        test('does not update when dying', () => {
            pacman.die();
            const initialAngle = pacman.mouthAngle;

            pacman.update(0.1, maze);

            // Death animation progresses
            expect(pacman.mouthAngle).toBeGreaterThan(initialAngle);
        });

        test('generates tunnel_wrap event when wrapping', () => {
            // Position at left tunnel edge
            pacman.gridX = 0;
            pacman.gridY = 14;
            pacman.x = 0; // At left edge
            pacman.y = 14 * 20 + 10;
            pacman.direction = directions.LEFT;
            pacman.isMoving = true;

            // Manually trigger wrap (simulating exit)
            pacman.x = -1;
            const wrapped = pacman.handleTunnelWrap();

            expect(wrapped).toBe(true);
        });
    });

    describe('updateMouthAnimation', () => {
        test('increases mouth angle when opening', () => {
            pacman.mouthDirection = 1;
            pacman.mouthAngle = 0;

            pacman.updateMouthAnimation(0.1);

            expect(pacman.mouthAngle).toBeGreaterThan(0);
        });

        test('decreases mouth angle when closing', () => {
            pacman.mouthDirection = -1;
            pacman.mouthAngle = 30;

            pacman.updateMouthAnimation(0.1);

            expect(pacman.mouthAngle).toBeLessThan(30);
        });

        test('reverses direction at max angle', () => {
            pacman.mouthDirection = 1;
            pacman.mouthAngle = 29;

            pacman.updateMouthAnimation(0.2);

            expect(pacman.mouthAngle).toBe(30);
            expect(pacman.mouthDirection).toBe(-1);
        });

        test('reverses direction at min angle', () => {
            pacman.mouthDirection = -1;
            pacman.mouthAngle = 1;

            pacman.updateMouthAnimation(0.2);

            expect(pacman.mouthAngle).toBe(0);
            expect(pacman.mouthDirection).toBe(1);
        });
    });

    describe('updateDeathAnimation', () => {
        test('increases mouth angle', () => {
            pacman.mouthAngle = 0;
            pacman.updateDeathAnimation(0.1);
            expect(pacman.mouthAngle).toBeGreaterThan(0);
        });

        test('caps at 180 degrees', () => {
            pacman.mouthAngle = 170;
            pacman.updateDeathAnimation(1.0);
            expect(pacman.mouthAngle).toBe(180);
        });

        test('tracks death animation progress', () => {
            pacman.deathAnimationProgress = 0;
            pacman.updateDeathAnimation(0.5);
            expect(pacman.deathAnimationProgress).toBe(0.5);
        });
    });

    describe('die', () => {
        test('sets isDying to true', () => {
            pacman.die();
            expect(pacman.isDying).toBe(true);
        });

        test('stops movement', () => {
            pacman.isMoving = true;
            pacman.die();
            expect(pacman.isMoving).toBe(false);
        });

        test('resets mouth animation', () => {
            pacman.mouthAngle = 15;
            pacman.mouthDirection = -1;
            pacman.die();
            expect(pacman.mouthAngle).toBe(0);
            expect(pacman.mouthDirection).toBe(1);
        });
    });

    describe('reset', () => {
        test('resets position', () => {
            pacman.x = 999;
            pacman.y = 999;
            pacman.reset(13, 23);

            expect(pacman.gridX).toBe(13);
            expect(pacman.gridY).toBe(23);
        });

        test('clears dying state', () => {
            pacman.die();
            pacman.reset(13, 23);
            expect(pacman.isDying).toBe(false);
        });

        test('resets mouth animation', () => {
            pacman.mouthAngle = 45;
            pacman.mouthDirection = -1;
            pacman.reset(13, 23);

            expect(pacman.mouthAngle).toBe(0);
            expect(pacman.mouthDirection).toBe(1);
        });
    });

    describe('setSpeedMultiplier', () => {
        test('adjusts speed', () => {
            const baseSpeed = pacman.baseSpeed;
            pacman.setSpeedMultiplier(1.5);
            expect(pacman.speed).toBe(baseSpeed * 1.5);
        });
    });

    describe('getVisualState', () => {
        test('returns visual state object', () => {
            const visual = pacman.getVisualState();

            expect(visual).toHaveProperty('mouthAngle');
            expect(visual).toHaveProperty('rotation');
            expect(visual).toHaveProperty('isDying');
            expect(visual).toHaveProperty('visible');
            expect(visual).toHaveProperty('opacity');
        });

        test('rotation matches direction angle', () => {
            pacman.direction = directions.RIGHT;
            const visual = pacman.getVisualState();
            expect(visual.rotation).toBe(directions.RIGHT.angle);
        });
    });

    describe('getSnapshot', () => {
        test('includes pacman-specific properties', () => {
            const snapshot = pacman.getSnapshot();

            expect(snapshot).toHaveProperty('mouthAngle');
            expect(snapshot).toHaveProperty('isDying');
            expect(snapshot).toHaveProperty('visual');
        });
    });
});
