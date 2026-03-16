// tests/model/PlayerState.test.js

import { PlayerState } from '../../src/model/entities/PlayerState.js';
import { Direction } from '../../src/movement/core/Direction.js';
import {
    resetEntityCounters
} from '../../src/model/ModelEntity.js';

describe('PlayerState', () => {
    let player;

    beforeEach(() => {
        resetEntityCounters();
        player = new PlayerState(13, 23, 1);
    });

    describe('constructor', () => {
        test('should initialize with grid position and level', () => {
            expect(player.gridX).toBe(13);
            expect(player.gridY).toBe(23);
            expect(player.type).toBe('player');
        });

        test('should initialize animation state', () => {
            expect(player.mouthAngle).toBe(0);
            expect(player.mouthDirection).toBe(1);
            expect(player.maxMouthAngle).toBe(30);
        });

        test('should initialize power-up flags', () => {
            expect(player.isDying).toBe(false);
            expect(player.isShielded).toBe(false);
            expect(player.hasSpeedBoost).toBe(false);
            expect(player.hasDataMagnet).toBe(false);
        });

        test('should have speed property', () => {
            // Speed calculation depends on levelConfig import
            // Just verify the property exists and is a number
            expect(typeof player.baseSpeed).toBe('number');
        });
    });

    describe('update', () => {
        test('should update mouth animation when not dying', () => {
            const initialAngle = player.mouthAngle;
            player.update(0.1, null);

            expect(player.mouthAngle).toBeGreaterThan(initialAngle);
        });

        test('should update death animation when dying', () => {
            player.die();
            player.update(0.1, null);

            expect(player.mouthAngle).toBeGreaterThan(0);
            expect(player.deathAnimationProgress).toBeGreaterThan(0);
        });

        test('should return events array', () => {
            const events = player.update(0.1, null);

            expect(Array.isArray(events)).toBe(true);
        });

        test('should apply input direction to buffer', () => {
            // Use setDesiredDirection which queues to buffer
            player.setDesiredDirection(Direction.UP);

            expect(player.nextDirection).toBe(Direction.UP);
        });

        test('should update isMoving based on direction', () => {
            player.direction = Direction.UP;
            player.update(0.1, null);

            expect(player.isMoving).toBe(true);
        });
    });

    describe('updateMouthAnimation', () => {
        test('should animate mouth opening and closing', () => {
            // Open mouth
            player.updateMouthAnimation(0.1);
            expect(player.mouthAngle).toBeGreaterThan(0);

            // Continue until max
            while (player.mouthAngle < player.maxMouthAngle) {
                player.updateMouthAnimation(0.1);
            }

            expect(player.mouthDirection).toBe(-1); // Now closing
        });

        test('should reverse direction at max angle', () => {
            player.mouthAngle = player.maxMouthAngle - 0.1;
            player.updateMouthAnimation(0.2);

            expect(player.mouthDirection).toBe(-1);
        });

        test('should reverse direction at zero angle', () => {
            player.mouthAngle = 0.1;
            player.mouthDirection = -1;
            player.updateMouthAnimation(0.2);

            expect(player.mouthDirection).toBe(1);
        });
    });

    describe('updateDeathAnimation', () => {
        test('should increase mouth angle during death', () => {
            player.isDying = true;
            player.updateDeathAnimation(0.1);

            expect(player.mouthAngle).toBeGreaterThan(0);
        });

        test('should cap mouth angle at 180', () => {
            player.isDying = true;
            player.mouthAngle = 179;
            player.updateDeathAnimation(0.5);

            expect(player.mouthAngle).toBeLessThanOrEqual(180);
        });

        test('should track death animation progress', () => {
            player.isDying = true;
            player.updateDeathAnimation(0.5);

            expect(player.deathAnimationProgress).toBe(0.5);
        });
    });

    describe('die', () => {
        test('should set dying state', () => {
            player.die();

            expect(player.isDying).toBe(true);
            expect(player.isMoving).toBe(false);
        });

        test('should reset animation state for death', () => {
            player.mouthAngle = 15;
            player.mouthDirection = -1;

            player.die();

            expect(player.mouthAngle).toBe(0);
            expect(player.mouthDirection).toBe(1);
            expect(player.deathAnimationProgress).toBe(0);
        });
    });

    describe('reset', () => {
        test('should reset position and state', () => {
            player.die();
            player.direction = Direction.UP;

            player.reset(13, 23);

            expect(player.isDying).toBe(false);
            expect(player.mouthAngle).toBe(0);
            expect(player.gridX).toBe(13);
            expect(player.gridY).toBe(23);
        });
    });

    describe('setSpeedMultiplier', () => {
        test('should modify effective speed', () => {
            const baseSpeed = player.baseSpeed;
            player.setSpeedMultiplier(2.0);

            expect(player.speed).toBe(baseSpeed * 2.0);
        });
    });

    describe('getVisualState', () => {
        test('should return visual properties', () => {
            player.direction = Direction.UP;

            const visual = player.getVisualState();

            expect(visual.mouthAngle).toBeDefined();
            expect(visual.rotation).toBe(270); // UP angle
            expect(visual.isDying).toBe(false);
        });

        test('should include dying state', () => {
            player.die();

            const visual = player.getVisualState();

            expect(visual.isDying).toBe(true);
        });
    });

    describe('getSnapshot', () => {
        test('should return complete state snapshot', () => {
            const snapshot = player.getSnapshot();

            expect(snapshot.id).toBeDefined();
            expect(snapshot.type).toBe('player');
            expect(snapshot.mouthAngle).toBe(0);
            expect(snapshot.visual).toBeDefined();
        });
    });
});
