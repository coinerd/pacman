import { GhostAISystem } from '../../src/systems/GhostAISystem.js';
import { ghostModes, directions } from '../../src/config/gameConfig.js';
import { createMazeData } from '../../src/utils/MazeLayout.js';

const maze = createMazeData();

describe('GhostAISystem', () => {
    let aiSystem;
    let mockGhosts;
    let mockPacman;

    beforeEach(() => {
        aiSystem = new GhostAISystem();

        mockPacman = {
            gridX: 14,
            gridY: 14,
            direction: directions.RIGHT
        };

        mockGhosts = [
            {
                type: 'blinky',
                gridX: 2,
                gridY: 1,
                direction: directions.RIGHT,
                mode: ghostModes.SCATTER,
                isFrightened: false,
                isEaten: false,
                targetX: 0,
                targetY: 0,
                modeTimer: 0
            },
            {
                type: 'pinky',
                gridX: 24,
                gridY: 1,
                direction: directions.LEFT,
                mode: ghostModes.SCATTER,
                isFrightened: false,
                isEaten: false,
                targetX: 0,
                targetY: 0,
                modeTimer: 0
            },
            {
                type: 'inky',
                gridX: 2,
                gridY: 25,
                direction: directions.UP,
                mode: ghostModes.SCATTER,
                isFrightened: false,
                isEaten: false,
                targetX: 0,
                targetY: 0,
                modeTimer: 0
            },
            {
                type: 'clyde',
                gridX: 24,
                gridY: 25,
                direction: directions.DOWN,
                mode: ghostModes.SCATTER,
                isFrightened: false,
                isEaten: false,
                targetX: 0,
                targetY: 0,
                modeTimer: 0
            }
        ];

        aiSystem.setGhosts(mockGhosts);
    });

    describe('Constructor', () => {
        test('initializes with empty ghosts array', () => {
            const system = new GhostAISystem();
            expect(system.ghosts).toEqual([]);
        });

        test('initializes globalModeTimer to 0', () => {
            expect(aiSystem.globalModeTimer).toBe(0);
        });

        test('initializes globalMode to SCATTER', () => {
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);
        });

        test('initializes cycleIndex to 0', () => {
            expect(aiSystem.cycleIndex).toBe(0);
        });

        test('has correct cycle durations', () => {
            expect(aiSystem.cycles.length).toBe(8);
            expect(aiSystem.cycles[0].mode).toBe(ghostModes.SCATTER);
            expect(aiSystem.cycles[0].duration).toBe(7000);
            expect(aiSystem.cycles[1].mode).toBe(ghostModes.CHASE);
            expect(aiSystem.cycles[1].duration).toBe(20000);
            expect(aiSystem.cycles[aiSystem.cycles.length - 1].duration).toBe(-1);
        });
    });

    describe('setGhosts()', () => {
        test('sets the ghosts array', () => {
            const system = new GhostAISystem();
            system.setGhosts(mockGhosts);
            expect(system.ghosts).toBe(mockGhosts);
        });
    });

    describe('updateGlobalMode()', () => {
        test('does not change mode if timer not elapsed', () => {
            aiSystem.updateGlobalMode(5000);
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);
            expect(aiSystem.globalModeTimer).toBe(5000);
            expect(aiSystem.cycleIndex).toBe(0);
        });

        test('transitions to CHASE after first scatter duration', () => {
            aiSystem.updateGlobalMode(7000);
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
            expect(aiSystem.globalModeTimer).toBe(0);
            expect(aiSystem.cycleIndex).toBe(1);
        });

        test('transitions through multiple cycles', () => {
            aiSystem.updateGlobalMode(7000);
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
            expect(aiSystem.cycleIndex).toBe(1);

            aiSystem.updateGlobalMode(20000);
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);
            expect(aiSystem.cycleIndex).toBe(2);
        });

        test('handles partial timer increments', () => {
            aiSystem.updateGlobalMode(5000);
            expect(aiSystem.globalModeTimer).toBe(5000);
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);

            aiSystem.updateGlobalMode(2000);
            expect(aiSystem.globalModeTimer).toBe(0);
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
        });

        test('does not change mode when in permanent chase (duration -1)', () => {
            aiSystem.cycleIndex = 7;
            aiSystem.globalMode = ghostModes.CHASE;
            aiSystem.globalModeTimer = 1000;

            aiSystem.updateGlobalMode(5000);

            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
            expect(aiSystem.cycleIndex).toBe(7);
        });
    });

    describe('updateBlinkyTarget()', () => {
        test('targets scatter corner in SCATTER mode', () => {
            const blinky = mockGhosts[0];
            blinky.mode = ghostModes.SCATTER;
            aiSystem.updateBlinkyTarget(blinky, mockPacman);

            expect(blinky.targetX).toBeDefined();
            expect(blinky.targetY).toBeDefined();
        });

        test('targets Pacman in CHASE mode', () => {
            const blinky = mockGhosts[0];
            blinky.mode = ghostModes.CHASE;
            aiSystem.updateBlinkyTarget(blinky, mockPacman);

            expect(blinky.targetX).toBe(mockPacman.gridX);
            expect(blinky.targetY).toBe(mockPacman.gridY);
        });
    });

    describe('updatePinkyTarget()', () => {
        test('targets scatter corner in SCATTER mode', () => {
            const pinky = mockGhosts[1];
            pinky.mode = ghostModes.SCATTER;
            aiSystem.updatePinkyTarget(pinky, mockPacman);

            expect(pinky.targetX).toBeDefined();
            expect(pinky.targetY).toBeDefined();
        });

        test('targets 4 tiles ahead of Pacman in CHASE mode (RIGHT)', () => {
            const pinky = mockGhosts[1];
            pinky.mode = ghostModes.CHASE;
            mockPacman.direction = directions.RIGHT;

            aiSystem.updatePinkyTarget(pinky, mockPacman);

            expect(pinky.targetX).toBe(mockPacman.gridX + 4);
            expect(pinky.targetY).toBe(mockPacman.gridY);
        });

        test('targets 4 tiles ahead of Pacman in CHASE mode (DOWN)', () => {
            const pinky = mockGhosts[1];
            pinky.mode = ghostModes.CHASE;
            mockPacman.direction = directions.DOWN;

            aiSystem.updatePinkyTarget(pinky, mockPacman);

            expect(pinky.targetX).toBe(mockPacman.gridX);
            expect(pinky.targetY).toBe(mockPacman.gridY + 4);
        });

        test('replicates arcade bug when Pacman is moving UP', () => {
            const pinky = mockGhosts[1];
            pinky.mode = ghostModes.CHASE;
            mockPacman.direction = directions.UP;

            aiSystem.updatePinkyTarget(pinky, mockPacman);

            expect(pinky.targetX).toBe(mockPacman.gridX - 4);
            expect(pinky.targetY).toBe(mockPacman.gridY - 4);
        });

        test('replicates arcade bug when Pacman is moving LEFT', () => {
            const pinky = mockGhosts[1];
            pinky.mode = ghostModes.CHASE;
            mockPacman.direction = directions.LEFT;

            aiSystem.updatePinkyTarget(pinky, mockPacman);

            expect(pinky.targetX).toBe(mockPacman.gridX - 4);
            expect(pinky.targetY).toBe(mockPacman.gridY);
        });
    });

    describe('updateInkyTarget()', () => {
        test('targets scatter corner in SCATTER mode', () => {
            const inky = mockGhosts[2];
            inky.mode = ghostModes.SCATTER;
            aiSystem.updateInkyTarget(inky, mockPacman);

            expect(inky.targetX).toBeDefined();
            expect(inky.targetY).toBeDefined();
        });

        test('targets Pacman when Blinky not found', () => {
            const inky = mockGhosts[2];
            inky.mode = ghostModes.CHASE;
            aiSystem.setGhosts([inky]);

            aiSystem.updateInkyTarget(inky, mockPacman);

            expect(inky.targetX).toBe(mockPacman.gridX);
            expect(inky.targetY).toBe(mockPacman.gridY);
        });

        test('calculates vector from Blinky through pivot in CHASE mode', () => {
            const inky = mockGhosts[2];
            const blinky = mockGhosts[0];
            inky.mode = ghostModes.CHASE;
            mockPacman.direction = directions.RIGHT;

            aiSystem.updateInkyTarget(inky, mockPacman);

            expect(inky.targetX).toBeDefined();
            expect(inky.targetY).toBeDefined();
        });
    });

    describe('updateClydeTarget()', () => {
        test('targets scatter corner in SCATTER mode', () => {
            const clyde = mockGhosts[3];
            clyde.mode = ghostModes.SCATTER;
            aiSystem.updateClydeTarget(clyde, mockPacman);

            expect(clyde.targetX).toBeDefined();
            expect(clyde.targetY).toBeDefined();
        });

        test('targets Pacman when distance > 8', () => {
            const clyde = mockGhosts[3];
            clyde.mode = ghostModes.CHASE;
            clyde.gridX = 1;
            clyde.gridY = 1;
            mockPacman.gridX = 14;
            mockPacman.gridY = 14;

            aiSystem.updateClydeTarget(clyde, mockPacman);

            expect(clyde.targetX).toBe(mockPacman.gridX);
            expect(clyde.targetY).toBe(mockPacman.gridY);
        });

        test('targets scatter corner when distance <= 8', () => {
            const clyde = mockGhosts[3];
            clyde.mode = ghostModes.CHASE;
            clyde.gridX = 14;
            clyde.gridY = 14;
            mockPacman.gridX = 16;
            mockPacman.gridY = 16;

            aiSystem.updateClydeTarget(clyde, mockPacman);

            expect(clyde.targetX).toBeDefined();
            expect(clyde.targetY).toBeDefined();
        });
    });

    describe('updateGhostTarget()', () => {
        test('targets ghost house when ghost is eaten', () => {
            const blinky = mockGhosts[0];
            blinky.isEaten = true;

            aiSystem.updateGhostTarget(blinky, mockPacman);

            expect(blinky.targetX).toBe(13);
            expect(blinky.targetY).toBe(14);
        });

        test('does not change target when frightened', () => {
            const blinky = mockGhosts[0];
            blinky.isFrightened = true;
            blinky.targetX = 5;
            blinky.targetY = 5;

            aiSystem.updateGhostTarget(blinky, mockPacman);

            expect(blinky.targetX).toBe(5);
            expect(blinky.targetY).toBe(5);
        });

        test('calls appropriate target update method based on ghost type', () => {
            const blinky = mockGhosts[0];
            blinky.mode = ghostModes.CHASE;

            aiSystem.updateGhostTarget(blinky, mockPacman);

            expect(blinky.targetX).toBe(mockPacman.gridX);
            expect(blinky.targetY).toBe(mockPacman.gridY);
        });
    });

    describe('getGhostByType()', () => {
        test('returns correct ghost by type', () => {
            expect(aiSystem.getGhostByType('blinky')).toBe(mockGhosts[0]);
            expect(aiSystem.getGhostByType('pinky')).toBe(mockGhosts[1]);
            expect(aiSystem.getGhostByType('inky')).toBe(mockGhosts[2]);
            expect(aiSystem.getGhostByType('clyde')).toBe(mockGhosts[3]);
        });

        test('returns undefined for non-existent type', () => {
            expect(aiSystem.getGhostByType('unknown')).toBeUndefined();
        });
    });

    describe('chooseDirection()', () => {
        test('chooses only available direction', () => {
            const blinky = mockGhosts[0];
            blinky.gridX = 2;
            blinky.gridY = 1;
            blinky.direction = directions.NONE;

            aiSystem.chooseDirection(blinky, maze);

            expect(blinky.direction).not.toBe(directions.NONE);
        });

        test('cannot reverse direction when multiple options available', () => {
            const blinky = mockGhosts[0];
            blinky.gridX = 10;
            blinky.gridY = 10;
            blinky.direction = directions.RIGHT;
            const originalDir = blinky.direction;

            aiSystem.chooseDirection(blinky, maze);

            expect(blinky.direction).not.toBe(directions.LEFT);
        });

        test('chooses direction minimizing distance to target', () => {
            const blinky = mockGhosts[0];
            blinky.gridX = 2;
            blinky.gridY = 1;
            blinky.direction = directions.RIGHT;
            blinky.targetX = 20;
            blinky.targetY = 20;

            aiSystem.chooseDirection(blinky, maze);

            expect(blinky.direction).not.toBe(directions.NONE);
        });

        test('chooses random direction when frightened', () => {
            const blinky = mockGhosts[0];
            blinky.gridX = 10;
            blinky.gridY = 10;
            blinky.direction = directions.RIGHT;
            blinky.isFrightened = true;

            const chosenDirections = new Set();
            for (let i = 0; i < 10; i++) {
                aiSystem.chooseDirection(blinky, maze);
                if (blinky.direction !== directions.NONE) {
                    chosenDirections.add(`${blinky.direction.x},${blinky.direction.y}`);
                }
            }

            expect(chosenDirections.size).toBeGreaterThan(0);
        });
    });

    describe('getReverseDirection()', () => {
        test('returns LEFT for RIGHT', () => {
            expect(aiSystem.getReverseDirection(directions.RIGHT)).toBe(directions.LEFT);
        });

        test('returns RIGHT for LEFT', () => {
            expect(aiSystem.getReverseDirection(directions.LEFT)).toBe(directions.RIGHT);
        });

        test('returns DOWN for UP', () => {
            expect(aiSystem.getReverseDirection(directions.UP)).toBe(directions.DOWN);
        });

        test('returns UP for DOWN', () => {
            expect(aiSystem.getReverseDirection(directions.DOWN)).toBe(directions.UP);
        });

        test('returns NONE for invalid direction', () => {
            expect(aiSystem.getReverseDirection(directions.NONE)).toBe(directions.NONE);
        });
    });

    describe('update()', () => {
        test('updates global mode timer', () => {
            aiSystem.update(5000, maze, mockPacman);
            expect(aiSystem.globalModeTimer).toBe(5000);
        });

        test('syncs ghost mode with global mode when not frightened or eaten', () => {
            const blinky = mockGhosts[0];
            blinky.mode = ghostModes.SCATTER;
            aiSystem.globalMode = ghostModes.CHASE;

            aiSystem.update(0, maze, mockPacman);

            expect(blinky.mode).toBe(ghostModes.CHASE);
        });

        test('does not change ghost mode when frightened', () => {
            const blinky = mockGhosts[0];
            blinky.mode = ghostModes.SCATTER;
            blinky.isFrightened = true;
            aiSystem.globalMode = ghostModes.CHASE;

            aiSystem.update(0, maze, mockPacman);

            expect(blinky.mode).toBe(ghostModes.SCATTER);
        });

        test('does not change ghost mode when eaten', () => {
            const blinky = mockGhosts[0];
            blinky.mode = ghostModes.SCATTER;
            blinky.isEaten = true;
            aiSystem.globalMode = ghostModes.CHASE;

            aiSystem.update(0, maze, mockPacman);

            expect(blinky.mode).toBe(ghostModes.SCATTER);
        });

        test('reverses ghost direction when mode changes', () => {
            const blinky = mockGhosts[0];
            blinky.mode = ghostModes.SCATTER;
            blinky.direction = directions.RIGHT;
            aiSystem.globalMode = ghostModes.CHASE;

            aiSystem.update(0, maze, mockPacman);

            expect(blinky.direction).toBe(directions.LEFT);
        });

        test('updates ghost targets', () => {
            const blinky = mockGhosts[0];
            aiSystem.globalMode = ghostModes.CHASE;
            blinky.mode = ghostModes.SCATTER;
            blinky.targetX = 0;
            blinky.targetY = 0;

            aiSystem.update(0, maze, mockPacman);

            expect(blinky.targetX).toBe(mockPacman.gridX);
            expect(blinky.targetY).toBe(mockPacman.gridY);
        });
    });

    describe('Integration: Mode Cycle', () => {
        test('completes full mode cycle sequence', () => {
            const expectedModes = [
                ghostModes.SCATTER, ghostModes.CHASE,
                ghostModes.SCATTER, ghostModes.CHASE,
                ghostModes.SCATTER, ghostModes.CHASE,
                ghostModes.SCATTER, ghostModes.CHASE
            ];

            const durations = [7000, 20000, 7000, 20000, 5000, 20000, 5000, 20000];

            for (let i = 0; i < expectedModes.length; i++) {
                expect(aiSystem.globalMode).toBe(expectedModes[i]);
                aiSystem.update(durations[i], maze, mockPacman);
            }

            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
        });
    });

    describe('Integration: Ghost AI', () => {
        test('all ghosts update targets correctly in SCATTER mode', () => {
            mockGhosts.forEach(ghost => {
                ghost.mode = ghostModes.SCATTER;
                aiSystem.updateGhostTarget(ghost, mockPacman);

                expect(ghost.targetX).toBeDefined();
                expect(ghost.targetY).toBeDefined();
            });
        });

        test('all ghosts update targets correctly in CHASE mode', () => {
            mockGhosts.forEach(ghost => {
                ghost.mode = ghostModes.CHASE;
                aiSystem.updateGhostTarget(ghost, mockPacman);

                expect(ghost.targetX).toBeDefined();
                expect(ghost.targetY).toBeDefined();
            });
        });
    });
});
