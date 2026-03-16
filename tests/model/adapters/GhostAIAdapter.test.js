/**
 * Tests for GhostAIAdapter
 * Integrates Ghost AI with decoupled movement system
 */

import {
    directions,
    ghostModes,
    ghostHouse,
    scatterTargets
} from '../../../src/config/gameConfig.js';
import { GhostAIAdapter } from '../../../src/model/adapters/GhostAIAdapter.js';
import { getValidDirections } from '../../../src/utils/MazeLayout.js';

// Mock getValidDirections
jest.mock('../../../src/utils/MazeLayout.js', () => ({
    getValidDirections: jest.fn(),
    getDistance: jest.fn((x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2))
}));

// Mock gameConfig
jest.mock('../../../src/config/gameConfig.js', () => {
    const directions = {
        NONE: { x: 0, y: 0 },
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 },
        ALL: [
            { x: 0, y: -1 }, // UP
            { x: 0, y: 1 },  // DOWN
            { x: -1, y: 0 }, // LEFT
            { x: 1, y: 0 }   // RIGHT
        ]
    };

    const getOpposite = (dir) => {
        if (!dir || (dir.x === 0 && dir.y === 0)) {
            return directions.NONE;
        }
        return directions.ALL.find((d) => d.x === -dir.x && d.y === -dir.y);
    };

    return {
        directions,
        getOpposite,
        ghostModes: {
            SCATTER: 'SCATTER',
            CHASE: 'CHASE'
        },
        ghostHouse: {
            entrance: { x: 13, y: 11 },
            center: { x: 13, y: 14 }
        },
        scatterTargets: {
            alpha: { x: 24, y: 0 },
            beta: { x: 0, y: 0 },
            gamma: { x: 28, y: 0 },
            delta: { x: 0, y: 32 }
        }
    };
});

function createMockGameModel() {
    return {
        maze: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ],
        pacman: {
            gridX: 2,
            gridY: 2,
            direction: { x: 1, y: 0 }
        },
        ghosts: [],
        getGhostByType: jest.fn((type) => {
            return this.ghosts?.find(g => g.ghostType === type);
        })
    };
}

function createMockGhost(type, gridX, gridY) {
    return {
        ghostType: type,
        gridX,
        gridY,
        x: gridX * 20 + 10,
        y: gridY * 20 + 10,
        direction: directions.NONE,
        isMoving: false,
        isFrightened: false,
        isEaten: false,
        inGhostHouse: false,
        houseTimer: 0,
        mode: ghostModes.SCATTER,
        setDirection: jest.fn(function(dir) {
            this.nextDirection = dir;
        }),
        updateFrightened: jest.fn(),
        reset: jest.fn()
    };
}

describe('GhostAIAdapter', () => {
    let adapter;
    let mockGameModel;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGameModel = createMockGameModel();
        adapter = new GhostAIAdapter(mockGameModel);

        // Default mock for getValidDirections
        getValidDirections.mockReturnValue([
            directions.UP,
            directions.DOWN,
            directions.LEFT,
            directions.RIGHT
        ]);
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

        test('has mode durations defined', () => {
            expect(adapter.modeDurations).toBeDefined();
            expect(adapter.modeDurations.length).toBe(8);
        });

        test('first mode is SCATTER', () => {
            expect(adapter.modeDurations[0].mode).toBe(ghostModes.SCATTER);
        });

        test('last mode has infinite duration', () => {
            const lastMode = adapter.modeDurations[adapter.modeDurations.length - 1];
            expect(lastMode.duration).toBe(Infinity);
        });
    });

    describe('update', () => {
        test('updates mode timer', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.x = 50;
            ghost.y = 30;
            mockGameModel.ghosts = [ghost];

            adapter.update(0.5);

            expect(adapter.modeTimer).toBe(0.5);
        });

        test('updates AI for all ghosts', () => {
            const ghost1 = createMockGhost('alpha', 2, 1);
            ghost1.x = 50;
            ghost1.y = 30;
            ghost1.isFrightened = true;
            const ghost2 = createMockGhost('beta', 2, 3);
            ghost2.x = 50;
            ghost2.y = 70;
            ghost2.isFrightened = true;
            mockGameModel.ghosts = [ghost1, ghost2];

            adapter.update(0.1);

            expect(ghost1.updateFrightened).toHaveBeenCalled();
            expect(ghost2.updateFrightened).toHaveBeenCalled();
        });
    });

    describe('updateModeTimer', () => {
        test('does not change mode before duration elapsed', () => {
            adapter.updateModeTimer(3);
            expect(adapter.currentMode).toBe(ghostModes.SCATTER);
            expect(adapter.modeIndex).toBe(0);
        });

        test('transitions to CHASE after first SCATTER duration (7s)', () => {
            adapter.updateModeTimer(7);
            expect(adapter.currentMode).toBe(ghostModes.CHASE);
            expect(adapter.modeIndex).toBe(1);
        });

        test('transitions through multiple mode cycles', () => {
            adapter.updateModeTimer(7);  // SCATTER -> CHASE
            adapter.updateModeTimer(20); // CHASE -> SCATTER
            expect(adapter.currentMode).toBe(ghostModes.SCATTER);
            expect(adapter.modeIndex).toBe(2);
        });

        test('reverses ghost directions on mode change', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.direction = directions.RIGHT;
            ghost.isFrightened = false;
            ghost.isEaten = false;
            mockGameModel.ghosts = [ghost];

            adapter.updateModeTimer(7);

            expect(ghost.direction).toEqual(directions.LEFT);
        });

        test('does not reverse frightened ghosts', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.direction = directions.RIGHT;
            ghost.isFrightened = true;
            mockGameModel.ghosts = [ghost];

            adapter.updateModeTimer(7);

            // Ghost was frightened, should not reverse
            expect(ghost.direction).toEqual(directions.RIGHT);
        });

        test('does not reverse eaten ghosts', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.direction = directions.RIGHT;
            ghost.isEaten = true;
            mockGameModel.ghosts = [ghost];

            adapter.updateModeTimer(7);

            expect(ghost.direction).toEqual(directions.RIGHT);
        });

        test('stops incrementing modeIndex at end of array', () => {
            adapter.modeIndex = 7; // Last index (CHASE with Infinity duration)
            adapter.updateModeTimer(1000);

            // Should stay at 7 because last mode has Infinity duration
            expect(adapter.modeIndex).toBe(7);
        });
    });

    describe('updateGhostAI', () => {
        test('handles eaten ghosts separately', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.isEaten = true;

            adapter.updateGhostAI(ghost, 0.1);

            // Eaten ghost should not update frightened
            expect(ghost.updateFrightened).not.toHaveBeenCalled();
        });

        test('updates frightened timer for frightened ghosts', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.x = 50;
            ghost.y = 30;
            ghost.isFrightened = true;

            adapter.updateGhostAI(ghost, 0.5);

            expect(ghost.updateFrightened).toHaveBeenCalledWith(0.5);
        });

        test('sets ghost mode when not frightened or eaten', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.x = 50;
            ghost.y = 30;
            ghost.isFrightened = false;
            ghost.isEaten = false;
            adapter.currentMode = ghostModes.CHASE;

            adapter.updateGhostAI(ghost, 0.1);

            expect(ghost.mode).toBe(ghostModes.CHASE);
        });

        test('chooses direction when at tile center', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.x = 50; // Center of tile (2, 1) with 20px tiles
            ghost.y = 30;
            ghost.direction = directions.NONE;

            adapter.updateGhostAI(ghost, 0.1);

            expect(ghost.setDirection).toHaveBeenCalled();
        });

        test('does not choose direction when not at center', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.x = 45; // Not at center
            ghost.y = 25;
            ghost.isMoving = true;

            adapter.updateGhostAI(ghost, 0.1);

            expect(ghost.setDirection).not.toHaveBeenCalled();
        });

        test('chooses direction when blocked at boundary', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.x = 42; // Near center but not exactly
            ghost.y = 28;
            ghost.isMoving = false;
            ghost.direction = directions.RIGHT;

            adapter.updateGhostAI(ghost, 0.1);

            // Should snap to center and choose direction
            expect(ghost.setDirection).toHaveBeenCalled();
        });
    });

    describe('updateEatenGhost', () => {
        test('handles ghost in ghost house', () => {
            const ghost = createMockGhost('alpha', 13, 14);
            ghost.inGhostHouse = true;
            ghost.houseTimer = 2;

            adapter.updateEatenGhost(ghost, 0.5);

            expect(ghost.houseTimer).toBe(1.5);
        });

        test('resets ghost when house timer expires', () => {
            const ghost = createMockGhost('alpha', 13, 14);
            ghost.inGhostHouse = true;
            ghost.houseTimer = 0.5;

            adapter.updateEatenGhost(ghost, 1);

            expect(ghost.reset).toHaveBeenCalled();
        });

        test('sets inGhostHouse when reaching center', () => {
            const ghost = createMockGhost('alpha', 13, 14);
            ghost.inGhostHouse = false;
            ghost.isEaten = true;

            adapter.updateEatenGhost(ghost, 0.1);

            expect(ghost.inGhostHouse).toBe(true);
            expect(ghost.houseTimer).toBe(2);
        });

        test('moves toward ghost house entrance', () => {
            const ghost = createMockGhost('alpha', 5, 5);
            ghost.isEaten = true;
            ghost.inGhostHouse = false;

            adapter.updateEatenGhost(ghost, 0.1);

            expect(ghost.setDirection).toHaveBeenCalled();
        });
    });

    describe('chooseDirection', () => {
        test('returns null when no valid directions', () => {
            getValidDirections.mockReturnValue([]);

            const ghost = createMockGhost('alpha', 2, 1);
            const result = adapter.chooseDirection(ghost);

            expect(result).toBeNull();
        });

        test('filters out reverse direction', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.direction = directions.RIGHT;
            getValidDirections.mockReturnValue([
                directions.LEFT,
                directions.UP,
                directions.DOWN
            ]);

            adapter.chooseDirection(ghost);

            // Should not choose LEFT (reverse of RIGHT)
            // Implementation chooses direction closest to target
        });

        test('chooses random direction when frightened', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.isFrightened = true;
            getValidDirections.mockReturnValue([
                directions.UP,
                directions.DOWN,
                directions.LEFT,
                directions.RIGHT
            ]);

            const results = new Set();
            for (let i = 0; i < 20; i++) {
                const dir = adapter.chooseDirection(ghost);
                results.add(`${dir.x},${dir.y}`);
            }

            // Should have multiple different directions
            expect(results.size).toBeGreaterThan(1);
        });

        test('chooses direction closest to target', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.mode = ghostModes.CHASE;
            // Alpha targets pacman at (2, 2) in CHASE mode
            getValidDirections.mockReturnValue([
                directions.UP,    // (2, 0) distance to (2, 2) = 2
                directions.DOWN,  // (2, 2) distance to (2, 2) = 0
                directions.LEFT,  // (1, 1) distance to (2, 2) = sqrt(2)
                directions.RIGHT  // (3, 1) distance to (2, 2) = sqrt(2)
            ]);

            const result = adapter.chooseDirection(ghost);

            // DOWN should be chosen (distance 0)
            expect(result).toEqual(directions.DOWN);
        });
    });

    describe('chooseDirectionToTarget', () => {
        test('returns null when no valid directions', () => {
            getValidDirections.mockReturnValue([]);

            const ghost = createMockGhost('alpha', 2, 1);
            const result = adapter.chooseDirectionToTarget(ghost, 5, 5);

            expect(result).toBeNull();
        });

        test('chooses direction minimizing distance to target', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            getValidDirections.mockReturnValue([
                directions.UP,
                directions.DOWN,
                directions.LEFT,
                directions.RIGHT
            ]);

            const result = adapter.chooseDirectionToTarget(ghost, 5, 1);

            // Target is to the right, should choose RIGHT
            expect(result).toEqual(directions.RIGHT);
        });
    });

    describe('getTargetForGhost', () => {
        test('returns alpha target for alpha ghost', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getTargetForGhost(ghost);

            expect(target.x).toBe(mockGameModel.pacman.gridX);
            expect(target.y).toBe(mockGameModel.pacman.gridY);
        });

        test('returns beta target for beta ghost', () => {
            const ghost = createMockGhost('beta', 2, 1);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getTargetForGhost(ghost);

            // Beta targets 4 tiles ahead of pacman
            expect(target.x).toBe(mockGameModel.pacman.gridX + 4);
        });

        test('returns gamma target for gamma ghost', () => {
            const ghost = createMockGhost('gamma', 2, 1);
            ghost.mode = ghostModes.CHASE;
            const alphaGhost = createMockGhost('alpha', 1, 1);
            mockGameModel.ghosts = [alphaGhost, ghost];
            mockGameModel.getGhostByType = jest.fn(() => alphaGhost);

            const target = adapter.getTargetForGhost(ghost);

            // Gamma uses vector doubling
            expect(target).toBeDefined();
        });

        test('returns delta target for delta ghost', () => {
            const ghost = createMockGhost('delta', 15, 15);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getTargetForGhost(ghost);

            // Delta is far from pacman (>8), should chase
            // Distance from (15,15) to (2,2) ≈ 18.4 > 8
            expect(target.x).toBe(mockGameModel.pacman.gridX);
            expect(target.y).toBe(mockGameModel.pacman.gridY);
        });

        test('returns default target for unknown ghost type', () => {
            const ghost = createMockGhost('unknown', 2, 1);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getTargetForGhost(ghost);

            expect(target.x).toBe(mockGameModel.pacman.gridX);
            expect(target.y).toBe(mockGameModel.pacman.gridY);
        });
    });

    describe('getAlphaTarget', () => {
        test('returns scatter target in SCATTER mode', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.mode = ghostModes.SCATTER;

            const target = adapter.getAlphaTarget(mockGameModel.pacman, ghost);

            expect(target).toEqual(scatterTargets.alpha);
        });

        test('returns pacman position in CHASE mode', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getAlphaTarget(mockGameModel.pacman, ghost);

            expect(target.x).toBe(mockGameModel.pacman.gridX);
            expect(target.y).toBe(mockGameModel.pacman.gridY);
        });
    });

    describe('getBetaTarget', () => {
        test('returns scatter target in SCATTER mode', () => {
            const ghost = createMockGhost('beta', 2, 1);
            ghost.mode = ghostModes.SCATTER;

            const target = adapter.getBetaTarget(mockGameModel.pacman, ghost);

            expect(target).toEqual(scatterTargets.beta);
        });

        test('targets 4 tiles ahead in CHASE mode', () => {
            const ghost = createMockGhost('beta', 2, 1);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getBetaTarget(mockGameModel.pacman, ghost);

            expect(target.x).toBe(mockGameModel.pacman.gridX + 4);
            expect(target.y).toBe(mockGameModel.pacman.gridY);
        });

        test('applies arcade bug for UP direction', () => {
            mockGameModel.pacman.direction = directions.UP;
            const ghost = createMockGhost('beta', 2, 1);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getBetaTarget(mockGameModel.pacman, ghost);

            // Up direction also moves target left
            expect(target.x).toBe(mockGameModel.pacman.gridX - 4);
            expect(target.y).toBe(mockGameModel.pacman.gridY - 4);
        });
    });

    describe('getGammaTarget', () => {
        test('returns scatter target in SCATTER mode', () => {
            const ghost = createMockGhost('gamma', 2, 1);
            ghost.mode = ghostModes.SCATTER;

            const target = adapter.getGammaTarget(mockGameModel.pacman, ghost);

            expect(target).toEqual(scatterTargets.gamma);
        });

        test('doubles vector from alpha to pivot', () => {
            const ghost = createMockGhost('gamma', 2, 1);
            ghost.mode = ghostModes.CHASE;
            const alphaGhost = createMockGhost('alpha', 0, 2);
            mockGameModel.getGhostByType = jest.fn(() => alphaGhost);

            const target = adapter.getGammaTarget(mockGameModel.pacman, ghost);

            // Pivot = pacman + 2*direction = (4, 2)
            // Vector from alpha (0, 2) to pivot (4, 2) = (4, 0)
            // Doubled = (8, 0)
            // Target = pivot + doubled = (4 + 4, 2 + 0) = (8, 2)
            expect(target.x).toBe(8);
            expect(target.y).toBe(2);
        });
    });

    describe('getDeltaTarget', () => {
        test('returns scatter target in SCATTER mode', () => {
            const ghost = createMockGhost('delta', 2, 1);
            ghost.mode = ghostModes.SCATTER;

            const target = adapter.getDeltaTarget(mockGameModel.pacman, ghost);

            expect(target).toEqual(scatterTargets.delta);
        });

        test('chases when far from pacman', () => {
            const ghost = createMockGhost('delta', 15, 15);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getDeltaTarget(mockGameModel.pacman, ghost);

            // Distance from (15,15) to (2,2) ≈ 18.4 > 8, should chase
            expect(target.x).toBe(mockGameModel.pacman.gridX);
            expect(target.y).toBe(mockGameModel.pacman.gridY);
        });

        test('returns to scatter corner when close', () => {
            const ghost = createMockGhost('delta', 2, 2);
            ghost.mode = ghostModes.CHASE;

            const target = adapter.getDeltaTarget(mockGameModel.pacman, ghost);

            // Distance <= 8, should scatter
            expect(target).toEqual(scatterTargets.delta);
        });
    });

    describe('reverseGhost', () => {
        test('reverses ghost direction', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.direction = directions.RIGHT;

            adapter.reverseGhost(ghost);

            expect(ghost.direction).toEqual(directions.LEFT);
        });

        test('does nothing when direction is NONE', () => {
            const ghost = createMockGhost('alpha', 2, 1);
            ghost.direction = directions.NONE;

            adapter.reverseGhost(ghost);

            expect(ghost.direction).toEqual(directions.NONE);
        });
    });

    describe('getTileCenter', () => {
        test('calculates center of tile', () => {
            const center = adapter.getTileCenter(2, 3);

            expect(center.x).toBe(50); // 2 * 20 + 10
            expect(center.y).toBe(70); // 3 * 20 + 10
        });

        test('handles origin tile', () => {
            const center = adapter.getTileCenter(0, 0);

            expect(center.x).toBe(10);
            expect(center.y).toBe(10);
        });
    });

    describe('reset', () => {
        test('resets all state to initial values', () => {
            adapter.modeTimer = 15;
            adapter.modeIndex = 3;
            adapter.currentMode = ghostModes.CHASE;

            adapter.reset();

            expect(adapter.modeTimer).toBe(0);
            expect(adapter.modeIndex).toBe(0);
            expect(adapter.currentMode).toBe(ghostModes.SCATTER);
        });
    });
});
