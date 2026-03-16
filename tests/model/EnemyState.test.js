// tests/model/EnemyState.test.js

import { EnemyState } from '../../src/model/entities/EnemyState.js';
import { Direction } from '../../src/movement/core/Direction.js';
import { ghostModes } from '../../src/config/gameConfig.js';
import {
    resetEntityCounters
} from '../../src/model/ModelEntity.js';

describe('EnemyState', () => {
    let enemy;
    let mockMaze;
    let mockPlayerState;

    beforeEach(() => {
        resetEntityCounters();
        enemy = new EnemyState(13, 14, 'alpha', 1);

        // Simple 3x3 mock maze with all walkable
        mockMaze = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];

        mockPlayerState = {
            gridX: 1,
            gridY: 0,
            direction: Direction.UP
        };
    });

    describe('constructor', () => {
        test('should initialize with grid position and ghost type', () => {
            expect(enemy.gridX).toBe(13);
            expect(enemy.gridY).toBe(14);
            expect(enemy.ghostType).toBe('alpha');
            expect(enemy.type).toBe('enemy');
        });

        test('should set ghost color based on type', () => {
            expect(enemy.color).toBeDefined();
        });

        test('should store starting position', () => {
            expect(enemy.startGridX).toBe(13);
            expect(enemy.startGridY).toBe(14);
        });

        test('should initialize in SCATTER mode', () => {
            expect(enemy.mode).toBe(ghostModes.SCATTER);
        });

        test('should initialize state flags', () => {
            expect(enemy.isEaten).toBe(false);
            expect(enemy.isFrightened).toBe(false);
            expect(enemy.inGhostHouse).toBe(false);
        });

        test('should calculate speed based on level', () => {
            const level1Enemy = new EnemyState(0, 0, 'alpha', 1);
            const level5Enemy = new EnemyState(0, 0, 'alpha', 5);

            expect(level5Enemy.baseSpeed).toBeGreaterThan(level1Enemy.baseSpeed);
        });
    });

    describe('update', () => {
        test('should return events array', () => {
            const events = enemy.update(0.1, mockMaze);

            expect(Array.isArray(events)).toBe(true);
        });

        test('should update frightened timer when frightened', () => {
            enemy.isFrightened = true;
            enemy.frightenedTimer = 5;

            enemy.update(0.1, mockMaze);

            expect(enemy.frightenedTimer).toBeLessThan(5);
        });

        test('should update mode transition timer', () => {
            enemy.modeTransitionTimer = 5;

            enemy.update(0.1, mockMaze);

            expect(enemy.modeTransitionTimer).toBeLessThan(5);
        });
    });

    describe('updateFrightened', () => {
        test('should decrease frightened timer', () => {
            enemy.isFrightened = true;
            enemy.frightenedTimer = 5;

            enemy.updateFrightened(0.5);

            expect(enemy.frightenedTimer).toBe(4.5);
        });

        test('should start blinking in last 2 seconds', () => {
            enemy.isFrightened = true;
            enemy.frightenedTimer = 1.5;

            enemy.updateFrightened(0.1);

            expect(enemy.isBlinking).toBe(true);
        });

        test('should end frightened state when timer expires', () => {
            enemy.isFrightened = true;
            enemy.frightenedTimer = 0.1;

            enemy.updateFrightened(0.2);

            expect(enemy.isFrightened).toBe(false);
            expect(enemy.speedModifier).toBe(1.0);
        });
    });

    describe('setFrightened', () => {
        test('should set frightened state', () => {
            enemy.setFrightened(8);

            expect(enemy.isFrightened).toBe(true);
            expect(enemy.frightenedTimer).toBe(8);
        });

        test('should apply frightened speed modifier', () => {
            enemy.setFrightened(8);

            expect(enemy.speedModifier).toBeLessThan(1.0);
        });
    });

    describe('eat', () => {
        test('should mark enemy as eaten', () => {
            enemy.eat();

            expect(enemy.isEaten).toBe(true);
        });

        test('should clear frightened state', () => {
            enemy.isFrightened = true;
            enemy.eat();

            expect(enemy.isFrightened).toBe(false);
        });

        test('should increment eaten count', () => {
            enemy.eat();
            enemy.eat();

            expect(enemy.eatenCount).toBe(2);
        });
    });

    describe('reset', () => {
        test('should reset to starting position', () => {
            enemy.gridX = 5;
            enemy.gridY = 5;
            enemy.isEaten = true;

            enemy.reset();

            expect(enemy.gridX).toBe(13);
            expect(enemy.gridY).toBe(14);
            expect(enemy.isEaten).toBe(false);
        });

        test('should clear all state flags', () => {
            enemy.isEaten = true;
            enemy.isFrightened = true;
            enemy.inGhostHouse = true;

            enemy.reset();

            expect(enemy.isEaten).toBe(false);
            expect(enemy.isFrightened).toBe(false);
            expect(enemy.inGhostHouse).toBe(false);
        });

        test('should reset speed modifiers', () => {
            enemy.speedMultiplier = 2.0;
            enemy.speedModifier = 0.5;

            enemy.reset();

            expect(enemy.speedMultiplier).toBe(1.0);
            expect(enemy.speedModifier).toBe(1.0);
        });

        test('should reset eaten count', () => {
            enemy.eatenCount = 3;

            enemy.reset();

            expect(enemy.eatenCount).toBe(0);
        });
    });

    describe('getOppositeDirection', () => {
        test('should return opposite of UP', () => {
            const opposite = enemy.getOppositeDirection(Direction.UP);
            expect(opposite.y).toBe(1);
        });

        test('should return opposite of LEFT', () => {
            const opposite = enemy.getOppositeDirection(Direction.LEFT);
            expect(opposite.x).toBe(1);
        });
    });

    describe('updateTarget', () => {
        test('should target virus core when eaten', () => {
            enemy.isEaten = true;

            enemy.updateTarget(mockPlayerState);

            expect(enemy.targetX).toBe(13);
            expect(enemy.targetY).toBe(14);
        });

        test('should target scatter corner in SCATTER mode', () => {
            enemy.mode = ghostModes.SCATTER;
            enemy.ghostType = 'alpha';

            enemy.updateTarget(mockPlayerState);

            expect(enemy.targetX).toBeDefined();
            expect(enemy.targetY).toBeDefined();
        });

        test('should target player in CHASE mode for alpha ghost', () => {
            enemy.mode = ghostModes.CHASE;
            enemy.ghostType = 'alpha';

            enemy.updateTarget(mockPlayerState);

            expect(enemy.targetX).toBe(mockPlayerState.gridX);
            expect(enemy.targetY).toBe(mockPlayerState.gridY);
        });
    });

    describe('getVisualState', () => {
        test('should return default color when normal', () => {
            const visual = enemy.getVisualState();

            expect(visual.color).toBe(enemy.color);
            expect(visual.opacity).toBe(1.0);
        });

        test('should return blue when frightened', () => {
            enemy.isFrightened = true;

            const visual = enemy.getVisualState();

            expect(visual.color).toBe(0x0000ff);
        });

        test('should return white when eaten', () => {
            enemy.isEaten = true;

            const visual = enemy.getVisualState();

            expect(visual.color).toBe(0xffffff);
            expect(visual.opacity).toBe(0.4);
        });
    });

    describe('getSnapshot', () => {
        test('should return complete state snapshot', () => {
            const snapshot = enemy.getSnapshot();

            expect(snapshot.id).toBeDefined();
            expect(snapshot.type).toBe('enemy');
            expect(snapshot.ghostType).toBe('alpha');
            expect(snapshot.mode).toBeDefined();
            expect(snapshot.visual).toBeDefined();
        });
    });

    describe('speed calculation', () => {
        test('should calculate speed with modifiers', () => {
            enemy.baseSpeed = 100;
            enemy.speedMultiplier = 1.5;
            enemy.speedModifier = 0.8;

            expect(enemy.speed).toBe(100 * 1.5 * 0.8);
        });
    });
});
