/**
 * Tests for EnemyState
 * Tests ghost state management, AI targeting, and state flags
 */

import { directions, ghostModes, scatterTargets } from '../../../src/config/gameConfig.js';
import * as MazeLayout from '../../../src/utils/MazeLayout.js';

// Mock MazeLayout functions
jest.mock('../../../src/utils/MazeLayout.js', () => ({
    getDistance: jest.fn((x1, y1, x2, y2) => Math.abs(x2 - x1) + Math.abs(y2 - y1)),
    getValidDirections: jest.fn(),
    getCenterPixel: jest.fn((x, y) => ({ x: x * 20 + 10, y: y * 20 + 10 }))
}));

// Import after mocking
import { EnemyState } from '../../../src/model/entities/EnemyState.js';

describe('EnemyState', () => {
    let enemy;

    beforeEach(() => {
        jest.clearAllMocks();
        // Set default mock return value
        MazeLayout.getValidDirections.mockReturnValue([
            directions.UP, directions.DOWN, directions.LEFT, directions.RIGHT
        ]);
    });

    describe('constructor', () => {
        test('should create alpha ghost with correct defaults', () => {
            enemy = new EnemyState(10, 10, 'alpha', 1);

            expect(enemy.ghostType).toBe('alpha');
            expect(enemy.gridX).toBe(10);
            expect(enemy.gridY).toBe(10);
            expect(enemy.startGridX).toBe(10);
            expect(enemy.startGridY).toBe(10);
            expect(enemy.mode).toBe(ghostModes.SCATTER);
            expect(enemy.isEaten).toBe(false);
            expect(enemy.isFrightened).toBe(false);
        });

        test('should create beta ghost', () => {
            enemy = new EnemyState(5, 5, 'beta', 1);
            expect(enemy.ghostType).toBe('beta');
            expect(enemy.name).toBe('beta');
        });

        test('should create gamma ghost', () => {
            enemy = new EnemyState(5, 5, 'gamma', 1);
            expect(enemy.ghostType).toBe('gamma');
        });

        test('should create delta ghost', () => {
            enemy = new EnemyState(5, 5, 'delta', 1);
            expect(enemy.ghostType).toBe('delta');
        });

        test('should set level-based speed', () => {
            const enemy1 = new EnemyState(5, 5, 'alpha', 1);
            const enemy5 = new EnemyState(5, 5, 'alpha', 5);

            expect(enemy5.baseSpeed).toBeGreaterThan(enemy1.baseSpeed);
        });
    });

    describe('speed property', () => {
        test('should calculate speed with modifiers', () => {
            enemy = new EnemyState(5, 5, 'alpha', 1);
            enemy.speedMultiplier = 1.5;
            enemy.speedModifier = 0.8;

            const expectedSpeed = enemy.baseSpeed * 1.5 * 0.8;
            expect(enemy.speed).toBeCloseTo(expectedSpeed, 2);
        });

        test('should set baseSpeed', () => {
            enemy = new EnemyState(5, 5, 'alpha', 1);
            enemy.speed = 100;

            expect(enemy.baseSpeed).toBe(100);
        });
    });

    describe('updateTarget', () => {
        const playerState = {
            gridX: 14,
            gridY: 14,
            direction: directions.RIGHT
        };

        beforeEach(() => {
            enemy = new EnemyState(10, 10, 'alpha', 1);
        });

        test('should set target to ghost house when eaten', () => {
            enemy.isEaten = true;
            enemy.mode = ghostModes.CHASE;
            enemy.updateTarget(playerState);

            // Target should be ghost house entrance
            expect(enemy.targetX).toBe(13);
            expect(enemy.targetY).toBe(14);
        });

        test('should not set specific target when frightened', () => {
            enemy.isFrightened = true;
            enemy.mode = ghostModes.CHASE;
            enemy.updateTarget(playerState);

            // Frightened ghosts don't set specific targets
            expect(enemy.targetX).toBe(0);
            expect(enemy.targetY).toBe(0);
        });

        test('should update alpha target in SCATTER mode', () => {
            enemy.mode = ghostModes.SCATTER;
            enemy.updateTarget(playerState);

            expect(enemy.targetX).toBe(scatterTargets.alpha.x);
            expect(enemy.targetY).toBe(scatterTargets.alpha.y);
        });

        test('should update alpha target in CHASE mode', () => {
            enemy.mode = ghostModes.CHASE;
            enemy.updateTarget(playerState);

            expect(enemy.targetX).toBe(playerState.gridX);
            expect(enemy.targetY).toBe(playerState.gridY);
        });

        test('should handle null playerState for alpha', () => {
            enemy.mode = ghostModes.CHASE;
            enemy.updateTarget(null);

            // Should not crash, target remains unchanged
            expect(enemy.targetX).toBe(0);
            expect(enemy.targetY).toBe(0);
        });
    });

    describe('updateBetaTarget', () => {
        beforeEach(() => {
            enemy = new EnemyState(10, 10, 'beta', 1);
        });

        test('should target scatter corner in SCATTER mode', () => {
            enemy.mode = ghostModes.SCATTER;
            enemy.updateTarget({ gridX: 14, gridY: 14, direction: directions.RIGHT });

            expect(enemy.targetX).toBe(scatterTargets.beta.x);
            expect(enemy.targetY).toBe(scatterTargets.beta.y);
        });

        test('should target 4 tiles ahead of player in CHASE mode', () => {
            enemy.mode = ghostModes.CHASE;
            enemy.updateTarget({ gridX: 14, gridY: 14, direction: directions.RIGHT });

            expect(enemy.targetX).toBe(14 + 4); // 4 tiles ahead
            expect(enemy.targetY).toBe(14);
        });

        test('should apply arcade bug for UP direction', () => {
            enemy.mode = ghostModes.CHASE;
            enemy.updateTarget({ gridX: 14, gridY: 14, direction: directions.UP });

            // Up direction also moves target left (arcade bug)
            expect(enemy.targetX).toBe(14 - 4); // Bug: also moves left
            expect(enemy.targetY).toBe(14 - 4); // 4 tiles up
        });

        test('should handle null playerState', () => {
            enemy.mode = ghostModes.CHASE;
            enemy.updateTarget(null);

            expect(enemy.targetX).toBe(0);
            expect(enemy.targetY).toBe(0);
        });
    });

    describe('updateGammaTarget', () => {
        beforeEach(() => {
            enemy = new EnemyState(10, 10, 'gamma', 1);
        });

        test('should target scatter corner in SCATTER mode', () => {
            enemy.mode = ghostModes.SCATTER;
            enemy.updateTarget({ gridX: 14, gridY: 14, direction: directions.RIGHT });

            expect(enemy.targetX).toBe(scatterTargets.gamma.x);
            expect(enemy.targetY).toBe(scatterTargets.gamma.y);
        });

        test('should target 2 tiles ahead of player in CHASE mode', () => {
            enemy.mode = ghostModes.CHASE;
            enemy.updateTarget({ gridX: 14, gridY: 14, direction: directions.RIGHT });

            expect(enemy.targetX).toBe(14 + 2);
            expect(enemy.targetY).toBe(14);
        });
    });

    describe('updateDeltaTarget', () => {
        beforeEach(() => {
            enemy = new EnemyState(10, 10, 'delta', 1);
        });

        test('should target scatter corner in SCATTER mode', () => {
            enemy.mode = ghostModes.SCATTER;
            enemy.updateTarget({ gridX: 14, gridY: 14, direction: directions.RIGHT });

            expect(enemy.targetX).toBe(scatterTargets.delta.x);
            expect(enemy.targetY).toBe(scatterTargets.delta.y);
        });

        test('should chase player when far away', () => {
            enemy.mode = ghostModes.CHASE;
            MazeLayout.getDistance.mockReturnValue(10); // Distance > 8

            enemy.updateTarget({ gridX: 14, gridY: 14, direction: directions.RIGHT });

            expect(enemy.targetX).toBe(14);
            expect(enemy.targetY).toBe(14);
        });

        test('should return to scatter corner when close', () => {
            enemy.mode = ghostModes.CHASE;
            MazeLayout.getDistance.mockReturnValue(5); // Distance <= 8

            enemy.updateTarget({ gridX: 14, gridY: 14, direction: directions.RIGHT });

            expect(enemy.targetX).toBe(scatterTargets.delta.x);
            expect(enemy.targetY).toBe(scatterTargets.delta.y);
        });
    });

    describe('chooseDirectionToTarget', () => {
        beforeEach(() => {
            enemy = new EnemyState(10, 10, 'alpha', 1);
            enemy.direction = directions.NONE; // Start with NONE to avoid setDirection call
        });

        test('should return early if no valid directions', () => {
            MazeLayout.getValidDirections.mockReturnValue([]);

            enemy.chooseDirectionToTarget([], 5, 5);

            expect(enemy.direction).toBe(directions.NONE); // Unchanged
        });

        test('should choose direction when NONE is current direction', () => {
            MazeLayout.getValidDirections.mockReturnValue([
                directions.UP, directions.DOWN, directions.LEFT, directions.RIGHT
            ]);

            enemy.chooseDirectionToTarget([], 5, 5);

            // Direction should be set directly when starting from NONE
            expect(enemy.direction).toBeDefined();
        });

        test('should choose random direction when frightened', () => {
            enemy.isFrightened = true;
            enemy.direction = directions.NONE;
            MazeLayout.getValidDirections.mockReturnValue([
                directions.UP, directions.DOWN, directions.LEFT
            ]);

            enemy.chooseDirectionToTarget([], 5, 5);

            expect(enemy.direction).toBeDefined();
        });
    });

    describe('state flags', () => {
        beforeEach(() => {
            enemy = new EnemyState(10, 10, 'alpha', 1);
        });

        test('should set frightened state', () => {
            enemy.setFrightened(5);

            expect(enemy.isFrightened).toBe(true);
            expect(enemy.frightenedTimer).toBe(5);
        });

        test('should set eaten state with eat()', () => {
            enemy.eat();

            expect(enemy.isEaten).toBe(true);
        });

        test('should reset with reset()', () => {
            enemy.gridX = 20;
            enemy.gridY = 20;
            enemy.isEaten = true;

            enemy.reset();

            expect(enemy.gridX).toBe(10);
            expect(enemy.gridY).toBe(10);
            expect(enemy.isEaten).toBe(false);
        });
    });

    describe('getOppositeDirection', () => {
        beforeEach(() => {
            enemy = new EnemyState(10, 10, 'alpha', 1);
        });

        test('should return opposite of UP', () => {
            const opposite = enemy.getOppositeDirection(directions.UP);
            expect(Math.abs(opposite.x)).toBe(0);
            expect(opposite.y).toBe(1); // DOWN
        });

        test('should return opposite of DOWN', () => {
            const opposite = enemy.getOppositeDirection(directions.DOWN);
            expect(Math.abs(opposite.x)).toBe(0);
            expect(opposite.y).toBe(-1); // UP
        });

        test('should return opposite of LEFT', () => {
            const opposite = enemy.getOppositeDirection(directions.LEFT);
            expect(opposite.x).toBe(1); // RIGHT
            expect(Math.abs(opposite.y)).toBe(0);
        });

        test('should return opposite of RIGHT', () => {
            const opposite = enemy.getOppositeDirection(directions.RIGHT);
            expect(opposite.x).toBe(-1); // LEFT
            expect(Math.abs(opposite.y)).toBe(0);
        });
    });

    describe('eatenCount', () => {
        beforeEach(() => {
            enemy = new EnemyState(10, 10, 'alpha', 1);
        });

        test('should start with eatenCount 0', () => {
            expect(enemy.eatenCount).toBe(0);
        });

        test('should increment eatenCount when eaten', () => {
            enemy.eat();

            expect(enemy.eatenCount).toBe(1);
        });
    });
});
