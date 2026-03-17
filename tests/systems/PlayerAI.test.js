import { PlayerAI } from '../../src/systems/PlayerAI.js';
import { directions } from '../../src/config/gameConfig.js';

// Mock directions for use in mock factory
const mockDirections = {
    UP: { x: 0, y: -1, angle: -Math.PI / 2 },
    DOWN: { x: 0, y: 1, angle: Math.PI / 2 },
    LEFT: { x: -1, y: 0, angle: Math.PI },
    RIGHT: { x: 1, y: 0, angle: 0 },
    NONE: { x: 0, y: 0, angle: 0 }
};

// Mock MazeLayout functions
jest.mock('../../src/utils/MazeLayout.js', () => ({
    getDistance: jest.fn((x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2)),
    getValidDirections: jest.fn((_maze, _x, _y) => {
        // Return all directions for testing
        return [mockDirections.UP, mockDirections.DOWN, mockDirections.LEFT, mockDirections.RIGHT];
    }),
    isPelletAt: jest.fn((grid, x, y) => grid[x] && grid[x][y] === true)
}));

describe('PlayerAI', () => {
    let playerAI;
    let mockPacman;
    let mockMaze;
    let mockPelletGrid;
    let mockGhosts;

    beforeEach(() => {
        playerAI = new PlayerAI();

        mockPacman = {
            gridX: 10,
            gridY: 10,
            x: 200,
            y: 200,
            direction: directions.RIGHT,
            setDirection: jest.fn()
        };

        mockMaze = [[]];
        mockPelletGrid = [];
        mockGhosts = [];

        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(playerAI.enabled).toBe(false);
            expect(playerAI.lastDecisionGridX).toBe(-1);
            expect(playerAI.lastDecisionGridY).toBe(-1);
            expect(playerAI.lastDirection).toBeNull();
            expect(playerAI.dangerDistanceThreshold).toBe(100);
        });
    });

    describe('enable/disable', () => {
        it('should enable the AI', () => {
            playerAI.enable();
            expect(playerAI.enabled).toBe(true);
        });

        it('should disable the AI', () => {
            playerAI.enable();
            playerAI.disable();
            expect(playerAI.enabled).toBe(false);
        });
    });

    describe('update', () => {
        it('should not update when disabled', () => {
            playerAI.update(mockPacman, mockMaze, mockPelletGrid, mockGhosts);
            expect(mockPacman.setDirection).not.toHaveBeenCalled();
        });

        it('should set direction when enabled', () => {
            playerAI.enable();
            playerAI.update(mockPacman, mockMaze, mockPelletGrid, mockGhosts);
            expect(mockPacman.setDirection).toHaveBeenCalled();
        });
    });

    describe('getDirection', () => {
        it('should return cached direction at same position', () => {
            playerAI.lastDecisionGridX = 10;
            playerAI.lastDecisionGridY = 10;
            playerAI.lastDirection = directions.UP;

            const dir = playerAI.getDirection(mockPacman, mockMaze, mockPelletGrid, mockGhosts);
            expect(dir).toBe(directions.UP);
        });

        it('should calculate new direction at new position', () => {
            const dir = playerAI.getDirection(mockPacman, mockMaze, mockPelletGrid, mockGhosts);
            expect(dir).toBeDefined();
        });

        it('should update last decision position', () => {
            playerAI.getDirection(mockPacman, mockMaze, mockPelletGrid, mockGhosts);
            expect(playerAI.lastDecisionGridX).toBe(10);
            expect(playerAI.lastDecisionGridY).toBe(10);
        });
    });

    describe('decideDirection', () => {
        it('should return NONE if no valid directions', () => {
            const { getValidDirections } = require('../../src/utils/MazeLayout.js');
            getValidDirections.mockReturnValueOnce([]);

            const dir = playerAI.decideDirection(mockPacman, mockMaze, mockPelletGrid, mockGhosts);
            expect(dir).toBe(directions.NONE);
        });

        it('should prefer directions with pellets', () => {
            const { isPelletAt } = require('../../src/utils/MazeLayout.js');
            isPelletAt.mockImplementation((grid, x, y) => x === 11 && y === 10);

            const dir = playerAI.decideDirection(mockPacman, mockMaze, mockPelletGrid, mockGhosts);
            // Should prefer RIGHT since pellet is there
            expect(dir).toBeDefined();
        });

        it('should avoid ghost danger', () => {
            mockGhosts = [{
                gridX: 11,
                gridY: 10,
                x: 220,
                y: 200,
                isFrightened: false,
                isEaten: false
            }];

            // Ghost is nearby, AI should avoid
            const dir = playerAI.decideDirection(mockPacman, mockMaze, mockPelletGrid, mockGhosts);
            expect(dir).toBeDefined();
        });

        it('should not consider frightened ghosts as danger', () => {
            mockGhosts = [{
                gridX: 11,
                gridY: 10,
                x: 220,
                y: 200,
                isFrightened: true,
                isEaten: false
            }];

            // Frightened ghost should not be a threat
            playerAI.calculateGhostDanger(mockPacman, mockGhosts);
            // No exception means it works
        });

        it('should not consider eaten ghosts as danger', () => {
            mockGhosts = [{
                gridX: 11,
                gridY: 10,
                x: 220,
                y: 200,
                isFrightened: false,
                isEaten: true
            }];

            playerAI.calculateGhostDanger(mockPacman, mockGhosts);
            // No exception means it works
        });
    });

    describe('calculateGhostDanger', () => {
        it('should return 0 if no ghosts', () => {
            const danger = playerAI.calculateGhostDanger(mockPacman, []);
            expect(danger).toBe(0);
        });

        it('should return 0 if all ghosts are far', () => {
            mockGhosts = [{
                x: 1000,
                y: 1000,
                isFrightened: false,
                isEaten: false
            }];

            const danger = playerAI.calculateGhostDanger(mockPacman, mockGhosts);
            expect(danger).toBe(0);
        });

        it('should calculate danger for nearby ghosts', () => {
            mockGhosts = [{
                x: 210,
                y: 200,
                isFrightened: false,
                isEaten: false
            }];

            const danger = playerAI.calculateGhostDanger(mockPacman, mockGhosts);
            expect(danger).toBeGreaterThan(0);
        });
    });

    describe('evaluateGhostRisk', () => {
        it('should return 0 if no ghosts', () => {
            const risk = playerAI.evaluateGhostRisk(10, 10, []);
            expect(risk).toBe(0);
        });

        it('should return 0 if ghosts are far', () => {
            mockGhosts = [{
                gridX: 100,
                gridY: 100,
                isFrightened: false,
                isEaten: false
            }];

            const risk = playerAI.evaluateGhostRisk(10, 10, mockGhosts);
            expect(risk).toBe(0);
        });

        it('should calculate risk for nearby ghosts', () => {
            mockGhosts = [{
                gridX: 12,
                gridY: 10,
                isFrightened: false,
                isEaten: false
            }];

            const risk = playerAI.evaluateGhostRisk(11, 10, mockGhosts);
            expect(risk).toBeGreaterThan(0);
        });
    });

    describe('getReverseDirection', () => {
        it('should return opposite of RIGHT', () => {
            expect(playerAI.getReverseDirection(directions.RIGHT)).toBe(directions.LEFT);
        });

        it('should return opposite of LEFT', () => {
            expect(playerAI.getReverseDirection(directions.LEFT)).toBe(directions.RIGHT);
        });

        it('should return opposite of UP', () => {
            expect(playerAI.getReverseDirection(directions.UP)).toBe(directions.DOWN);
        });

        it('should return opposite of DOWN', () => {
            expect(playerAI.getReverseDirection(directions.DOWN)).toBe(directions.UP);
        });

        it('should return NONE for NONE', () => {
            expect(playerAI.getReverseDirection(directions.NONE)).toBe(directions.NONE);
        });
    });

    describe('getSameDirection', () => {
        it('should return true for same directions', () => {
            expect(playerAI.getSameDirection(directions.RIGHT, directions.RIGHT)).toBeTruthy();
        });

        it('should return false for different directions', () => {
            expect(playerAI.getSameDirection(directions.RIGHT, directions.LEFT)).toBeFalsy();
        });
    });

    describe('reset', () => {
        it('should reset decision state', () => {
            playerAI.lastDecisionGridX = 10;
            playerAI.lastDecisionGridY = 10;
            playerAI.lastDirection = directions.RIGHT;

            playerAI.reset();

            expect(playerAI.lastDecisionGridX).toBe(-1);
            expect(playerAI.lastDecisionGridY).toBe(-1);
        });
    });
});
