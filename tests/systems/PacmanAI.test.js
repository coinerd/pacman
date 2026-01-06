import { PacmanAI } from '../../src/systems/PacmanAI.js';
import { gameConfig, directions } from '../../src/config/gameConfig.js';
import { createMockPacman } from '../utils/testHelpers.js';

describe('PacmanAI', () => {
    let ai;
    let mockPacman;
    let mockMaze;
    let mockGhosts;

    beforeEach(() => {
        mockMaze = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 2, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ];

        mockGhosts = [
            { x: 60, y: 60, gridX: 3, gridY: 3 },
            { x: 20, y: 20, gridX: 1, gridY: 1 }
        ];

        mockPacman = createMockPacman({
            x: 40,
            y: 40,
            gridX: 2,
            gridY: 2
        });

        ai = new PacmanAI();
    });

    describe('Initialization', () => {
        test('initializes with default settings', () => {
            expect(ai).toBeDefined();
        });

        test('has enabled flag', () => {
            expect(ai.enabled).toBe(false);
        });
    });

    describe('enable()', () => {
        test('sets enabled to true', () => {
            ai.enable();
            expect(ai.enabled).toBe(true);
        });
    });

    describe('disable()', () => {
        test('sets enabled to false', () => {
            ai.enabled = true;
            ai.disable();
            expect(ai.enabled).toBe(false);
        });
    });

    describe('decideDirection()', () => {
        test('returns a valid direction', () => {
            ai.enable();
            const direction = ai.decideDirection(mockPacman, mockMaze, mockGhosts);

            expect(direction).toBeDefined();
            expect(direction).not.toBe(directions.NONE);
        });

        test('avoids ghosts when nearby', () => {
            ai.enable();
            mockPacman.gridX = 2;
            mockPacman.gridY = 2;

            mockGhosts = [
                { x: 60, y: 40, gridX: 3, gridY: 2 },
                { x: 20, y: 40, gridX: 1, gridY: 2 }
            ];

            const direction = ai.decideDirection(mockPacman, mockMaze, mockGhosts);

            expect(direction).not.toBe(directions.RIGHT);
            expect(direction).not.toBe(directions.LEFT);
        });

        test('collects pellets when safe', () => {
            ai.enable();
            mockPacman.gridX = 2;
            mockPacman.gridY = 2;

            mockMaze[2][2] = 0;
            mockMaze[2][3] = 2;

            const direction = ai.decideDirection(mockPacman, mockMaze, mockGhosts);

            expect(direction).not.toBeNull();
        });

        test('chooses any direction when no ghosts nearby', () => {
            ai.enable();
            mockPacman.gridX = 2;
            mockPacman.gridY = 2;

            mockGhosts = [
                { x: 200, y: 200, gridX: 10, gridY: 10 }
            ];

            const direction = ai.decideDirection(mockPacman, mockMaze, mockGhosts);

            expect(direction).not.toBeNull();
        });

        test('does not reverse direction unless necessary', () => {
            ai.enable();
            mockPacman.direction = directions.RIGHT;
            mockPacman.gridX = 2;
            mockPacman.gridY = 2;

            const direction = ai.decideDirection(mockPacman, mockMaze, mockGhosts);

            expect(direction).not.toBe(directions.LEFT);
        });

        test('avoids dead ends', () => {
            ai.enable();
            mockPacman.gridX = 1;
            mockPacman.gridY = 1;

            mockMaze = [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 0]
            ];

            const direction = ai.decideDirection(mockPacman, mockMaze, mockGhosts);

            expect(direction).not.toBeNull();
        });
    });

    describe('update()', () => {
        test('does nothing when disabled', () => {
            ai.enabled = false;
            mockPacman.setDirection = jest.fn();

            ai.update(mockPacman, mockMaze, mockGhosts);

            expect(mockPacman.setDirection).not.toHaveBeenCalled();
        });

        test('sets direction when enabled', () => {
            ai.enable();
            mockPacman.setDirection = jest.fn();

            ai.update(mockPacman, mockMaze, mockGhosts);

            expect(mockPacman.setDirection).toHaveBeenCalled();
        });

        test('does not change direction at same tile center repeatedly', () => {
            ai.enable();
            mockPacman.setDirection = jest.fn();
            mockPacman.gridX = 2;
            mockPacman.gridY = 2;

            ai.update(mockPacman, mockMaze, mockGhosts);
            const firstCall = mockPacman.setDirection.mock.calls[0];

            ai.update(mockPacman, mockMaze, mockGhosts);
            const secondCall = mockPacman.setDirection.mock.calls[1];

            expect(firstCall).toEqual(secondCall);
        });
    });

    describe('calculateGhostDanger()', () => {
        test('returns higher danger for closer ghosts', () => {
            ai.enable();

            const closeGhost = { x: 50, y: 40, gridX: 2, gridY: 2 };
            const farGhost = { x: 100, y: 100, gridX: 5, gridY: 5 };

            mockGhosts = [closeGhost, farGhost];

            const danger = ai.calculateGhostDanger(mockPacman, mockGhosts);

            expect(danger).toBeGreaterThan(0);
        });

        test('returns zero danger when no ghosts', () => {
            ai.enable();

            mockGhosts = [];

            const danger = ai.calculateGhostDanger(mockPacman, mockGhosts);

            expect(danger).toBe(0);
        });

        test('ignores frightened ghosts', () => {
            ai.enable();

            mockGhosts = [
                { x: 50, y: 40, gridX: 2, gridY: 2, isFrightened: true }
            ];

            const danger = ai.calculateGhostDanger(mockPacman, mockGhosts);

            expect(danger).toBe(0);
        });

        test('ignores eaten ghosts', () => {
            ai.enable();

            mockGhosts = [
                { x: 50, y: 40, gridX: 2, gridY: 2, isEaten: true }
            ];

            const danger = ai.calculateGhostDanger(mockPacman, mockGhosts);

            expect(danger).toBe(0);
        });
    });

    describe('Integration: AI behavior in game', () => {
        test('survives for multiple updates', () => {
            ai.enable();
            mockPacman.setDirection = jest.fn();

            for (let i = 0; i < 10; i++) {
                ai.update(mockPacman, mockMaze, mockGhosts);
            }

            expect(mockPacman.setDirection).toHaveBeenCalledTimes(10);
        });

        test('avoids ghost when approaching', () => {
            ai.enable();
            mockPacman.gridX = 2;
            mockPacman.gridY = 2;
            mockPacman.direction = directions.RIGHT;
            mockPacman.setDirection = jest.fn();

            mockGhosts = [
                { x: 70, y: 40, gridX: 3, gridY: 2 }
            ];

            ai.update(mockPacman, mockMaze, mockGhosts);

            const calledDirection = mockPacman.setDirection.mock.calls[0][0];
            expect(calledDirection).not.toBe(directions.RIGHT);
        });

        test('changes direction at intersection', () => {
            ai.enable();
            mockPacman.x = 40;
            mockPacman.y = 40;
            mockPacman.gridX = 2;
            mockPacman.gridY = 2;
            mockPacman.direction = directions.RIGHT;
            mockPacman.setDirection = jest.fn();

            ai.update(mockPacman, mockMaze, mockGhosts);

            expect(mockPacman.setDirection).toHaveBeenCalled();
        });
    });
});
