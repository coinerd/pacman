/**
 * Tests for EnemyAIAdapter
 */

import { directions, ghostModes } from '../../src/config/gameConfig.js';
import { EnemyAIAdapter } from '../../src/model/adapters/EnemyAIAdapter.js';

// Mock GameModel
// Maze encoding: 1 = WALL, 0 = PATH (walkable)
function createMockGameModel() {
    return {
        maze: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ],
        pacman: {
            gridX: 3,
            gridY: 2,
            direction: directions.RIGHT
        },
        ghosts: []
    };
}

// Mock Enemy
function createMockGhost(type, gridX, gridY) {
    return {
        ghostType: type,
        gridX: gridX,
        gridY: gridY,
        x: gridX * 20 + 10,
        y: gridY * 20 + 10,
        direction: directions.NONE,
        nextDirection: null,
        mode: ghostModes.SCATTER,
        isFrightened: false,
        isEaten: false,
        inGhostHouse: false,
        houseTimer: 0,
        setDirection: jest.fn(function (dir) {
            this.nextDirection = dir;
        }),
        updateFrightened: jest.fn()
    };
}

describe('EnemyAIAdapter', () => {
    let adapter;
    let mockGameModel;

    beforeEach(() => {
        mockGameModel = createMockGameModel();
        adapter = new EnemyAIAdapter(mockGameModel);
    });

    describe('constructor', () => {
        test('initializes with game model', () => {
            expect(adapter.gameModel).toBe(mockGameModel);
        });

        test('initializes mode timer to 0', () => {
            expect(adapter.modeTimer).toBe(0);
        });

        test('initializes current mode to SCATTER', () => {
            expect(adapter.currentMode).toBe(ghostModes.SCATTER);
        });

        test('initializes mode index to 0', () => {
            expect(adapter.modeIndex).toBe(0);
        });
    });

    describe('updateModeTimer', () => {
        test('does not change mode if timer not elapsed', () => {
            adapter.updateModeTimer(1); // 1 second
            expect(adapter.currentMode).toBe(ghostModes.SCATTER);
            expect(adapter.modeIndex).toBe(0);
        });

        test('transitions to CHASE after first scatter duration', () => {
            adapter.updateModeTimer(7); // 7 seconds (scatter duration)
            expect(adapter.currentMode).toBe(ghostModes.CHASE);
            expect(adapter.modeIndex).toBe(1);
        });

        test('transitions through multiple cycles', () => {
            adapter.updateModeTimer(7); // SCATTER -> CHASE
            adapter.updateModeTimer(20); // CHASE -> SCATTER
            expect(adapter.currentMode).toBe(ghostModes.SCATTER);
            expect(adapter.modeIndex).toBe(2);
        });

        test('reverses ghost directions on mode change', () => {
            const ghost = createMockGhost('alpha', 1, 1);
            ghost.direction = directions.RIGHT;
            mockGameModel.ghosts = [ghost];

            adapter.updateModeTimer(7);

            expect(ghost.direction).toEqual(directions.LEFT); // Reversed
        });
    });

    describe('chooseDirection', () => {
        test('chooses only available direction', () => {
            const ghost = createMockGhost('alpha', 1, 1);
            // At (1,1), valid directions are RIGHT and DOWN
            // Enemy will choose based on target (scatter corner for Alpha)
            const direction = adapter.chooseDirection(ghost);
            // Direction should be one of the valid directions
            expect(direction.x !== 0 || direction.y !== 0).toBe(true);
        });

        test('cannot reverse direction when multiple options available', () => {
            const ghost = createMockGhost('alpha', 3, 1);
            ghost.direction = directions.RIGHT;

            const direction = adapter.chooseDirection(ghost);

            // Should not reverse (not LEFT)
            expect(direction).not.toBe(directions.LEFT);
        });

        test('chooses random direction when frightened', () => {
            const ghost = createMockGhost('alpha', 3, 1);
            ghost.isFrightened = true;
            ghost.direction = directions.RIGHT;

            // Run multiple times to verify randomness
            const directions_set = new Set();
            for (let i = 0; i < 10; i++) {
                const dir = adapter.chooseDirection(ghost);
                directions_set.add(dir);
            }

            // Should have multiple different directions over 10 runs
            expect(directions_set.size).toBeGreaterThan(1);
        });
    });

    describe('getTargetForEnemy', () => {
        test('Alpha targets scatter corner in SCATTER mode', () => {
            const ghost = createMockGhost('alpha', 1, 1);
            ghost.mode = ghostModes.SCATTER;

            const target = adapter.getTargetForEnemy(ghost);

            expect(target.x).toBe(24); // scatterTargets.alpha.x
            expect(target.y).toBe(0); // scatterTargets.alpha.y
        });

        test('Alpha targets Pacman in CHASE mode', () => {
            const ghost = createMockGhost('alpha', 1, 1);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getTargetForEnemy(ghost);

            expect(target.x).toBe(mockGameModel.pacman.gridX);
            expect(target.y).toBe(mockGameModel.pacman.gridY);
        });

        test('Beta targets 4 tiles ahead of Pacman in CHASE mode', () => {
            const ghost = createMockGhost('beta', 1, 1);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getTargetForEnemy(ghost);

            // Pacman is at (3, 2) moving RIGHT, so target is (7, 2)
            expect(target.x).toBe(7);
            expect(target.y).toBe(2);
        });

        test('Delta targets scatter corner when close to Pacman', () => {
            const ghost = createMockGhost('delta', 3, 2); // Close to Pacman at (3, 2)
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getTargetForEnemy(ghost);

            // Should target scatter corner when distance <= 8
            expect(target.x).toBe(0); // scatterTargets.delta.x
            expect(target.y).toBe(32); // scatterTargets.delta.y
        });
    });

    describe('updateEnemyAI', () => {
        test('handles eaten ghosts by moving toward ghost house', () => {
            const ghost = createMockGhost('alpha', 3, 1);
            ghost.isEaten = true;
            ghost.x = 3 * 20 + 10; // At center
            ghost.y = 1 * 20 + 10;

            adapter.updateEnemyAI(ghost, 0.1);

            // Eaten ghosts should have direction set to move toward ghost house
            expect(ghost.setDirection).toHaveBeenCalled();
        });

        test('updates frightened timer when frightened', () => {
            const ghost = createMockGhost('alpha', 1, 1);
            ghost.isFrightened = true;

            adapter.updateEnemyAI(ghost, 0.1);

            expect(ghost.updateFrightened).toHaveBeenCalledWith(0.1);
        });

        test('sets direction when at tile center', () => {
            const ghost = createMockGhost('alpha', 3, 1);
            ghost.x = 3 * 20 + 10; // Center of tile
            ghost.y = 1 * 20 + 10;
            ghost.direction = directions.NONE;

            adapter.updateEnemyAI(ghost, 0.1);

            expect(ghost.setDirection).toHaveBeenCalled();
        });

        test('does not set direction when not at tile center', () => {
            const ghost = createMockGhost('alpha', 3, 1);
            ghost.x = 3 * 20 + 5; // Not at center
            ghost.y = 1 * 20 + 5;

            adapter.updateEnemyAI(ghost, 0.1);

            expect(ghost.setDirection).not.toHaveBeenCalled();
        });
    });

    describe('reset', () => {
        test('resets mode timer to 0', () => {
            adapter.modeTimer = 10;
            adapter.reset();
            expect(adapter.modeTimer).toBe(0);
        });

        test('resets mode index to 0', () => {
            adapter.modeIndex = 3;
            adapter.reset();
            expect(adapter.modeIndex).toBe(0);
        });

        test('resets current mode to SCATTER', () => {
            adapter.currentMode = ghostModes.CHASE;
            adapter.reset();
            expect(adapter.currentMode).toBe(ghostModes.SCATTER);
        });
    });

    describe('Integration: update', () => {
        test('updates mode timer for all ghosts', () => {
            const ghost1 = createMockGhost('alpha', 1, 1);
            const ghost2 = createMockGhost('beta', 3, 1);
            mockGameModel.ghosts = [ghost1, ghost2];

            adapter.update(0.1);

            expect(adapter.modeTimer).toBe(0.1);
        });

        test('updates AI for all ghosts', () => {
            const ghost1 = createMockGhost('alpha', 3, 1);
            const ghost2 = createMockGhost('beta', 3, 1);
            mockGameModel.ghosts = [ghost1, ghost2];

            adapter.update(0.1);

            expect(ghost1.setDirection).toHaveBeenCalled();
            expect(ghost2.setDirection).toHaveBeenCalled();
        });
    });
});
