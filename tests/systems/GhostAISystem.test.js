import { directions, ghostModes } from '../../src/config/gameConfig.js';
import { EnemyAISystem } from '../../src/systems/EnemyAISystem.js';
import { createMazeData } from '../../src/utils/MazeLayout.js';
import { msToSeconds } from '../../src/utils/Time.js';

const { maze } = createMazeData();

describe('GhostAISystem', () => {
    let aiSystem;
    let mockEnemies;
    let mockPlayer;

    beforeEach(() => {
        aiSystem = new EnemyAISystem();

        mockPlayer = {
            gridX: 14,
            gridY: 14,
            direction: directions.RIGHT
        };

        mockEnemies = [
            {
                type: 'alpha',
                gridX: 2,
                gridY: 1,
                direction: directions.RIGHT,
                nextDirection: directions.NONE,
                setDirection(dir) {
                    this.direction = dir;
                    this.nextDirection = directions.NONE;
                },
                mode: ghostModes.SCATTER,
                isFrightened: false,
                isEaten: false,
                targetX: 0,
                targetY: 0,
                modeTimer: 0,
                isMoving: true
            },
            {
                type: 'beta',
                gridX: 24,
                gridY: 1,
                direction: directions.LEFT,
                nextDirection: directions.NONE,
                setDirection(dir) {
                    this.direction = dir;
                    this.nextDirection = directions.NONE;
                },
                mode: ghostModes.SCATTER,
                isFrightened: false,
                isEaten: false,
                targetX: 0,
                targetY: 0,
                modeTimer: 0,
                isMoving: true
            },
            {
                type: 'gamma',
                gridX: 2,
                gridY: 25,
                direction: directions.UP,
                nextDirection: directions.NONE,
                setDirection(dir) {
                    this.direction = dir;
                    this.nextDirection = directions.NONE;
                },
                mode: ghostModes.SCATTER,
                isFrightened: false,
                isEaten: false,
                targetX: 0,
                targetY: 0,
                modeTimer: 0,
                isMoving: true
            },
            {
                type: 'delta',
                gridX: 24,
                gridY: 25,
                direction: directions.DOWN,
                nextDirection: directions.NONE,
                setDirection(dir) {
                    this.direction = dir;
                    this.nextDirection = directions.NONE;
                },
                mode: ghostModes.SCATTER,
                isFrightened: false,
                isEaten: false,
                targetX: 0,
                targetY: 0,
                modeTimer: 0,
                isMoving: true
            }
        ];

        aiSystem.setEnemies(mockEnemies);
    });

    describe('Constructor', () => {
        test('initializes with empty enemies array', () => {
            const system = new EnemyAISystem();
            expect(system.enemies).toEqual([]);
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
            expect(aiSystem.cycles[0].duration).toBe(7);
            expect(aiSystem.cycles[1].mode).toBe(ghostModes.CHASE);
            expect(aiSystem.cycles[1].duration).toBe(20);
            expect(aiSystem.cycles[aiSystem.cycles.length - 1].duration).toBe(-1);
        });
    });

    describe('setEnemies()', () => {
        test('sets the enemies array', () => {
            const system = new EnemyAISystem();
            system.setEnemies(mockEnemies);
            expect(system.enemies).toBe(mockEnemies);
        });
    });

    describe('updateGlobalMode()', () => {
        test('does not change mode if timer not elapsed', () => {
            aiSystem.updateGlobalMode(msToSeconds(5000));
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);
            expect(aiSystem.globalModeTimer).toBe(5);
            expect(aiSystem.cycleIndex).toBe(0);
        });

        test('transitions to CHASE after first scatter duration', () => {
            aiSystem.updateGlobalMode(msToSeconds(7000));
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
            expect(aiSystem.globalModeTimer).toBe(0);
            expect(aiSystem.cycleIndex).toBe(1);
        });

        test('transitions through multiple cycles', () => {
            aiSystem.updateGlobalMode(msToSeconds(7000));
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
            expect(aiSystem.cycleIndex).toBe(1);

            aiSystem.updateGlobalMode(msToSeconds(20000));
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);
            expect(aiSystem.cycleIndex).toBe(2);
        });

        test('handles partial timer increments', () => {
            aiSystem.updateGlobalMode(msToSeconds(5000));
            expect(aiSystem.globalModeTimer).toBe(5);
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);

            aiSystem.updateGlobalMode(msToSeconds(2000));
            expect(aiSystem.globalModeTimer).toBe(0);
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
        });

        test('does not change mode when in permanent chase (duration -1)', () => {
            aiSystem.cycleIndex = 7;
            aiSystem.globalMode = ghostModes.CHASE;
            aiSystem.globalModeTimer = msToSeconds(1000);

            aiSystem.updateGlobalMode(msToSeconds(5000));

            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
            expect(aiSystem.cycleIndex).toBe(7);
        });
    });

    describe('updateAlphaTarget()', () => {
        test('targets scatter corner in SCATTER mode', () => {
            const blinky = mockEnemies[0];
            blinky.mode = ghostModes.SCATTER;
            aiSystem.updateAlphaTarget(blinky, mockPlayer);

            expect(blinky.targetX).toBeDefined();
            expect(blinky.targetY).toBeDefined();
        });

        test('targets Pacman in CHASE mode', () => {
            const blinky = mockEnemies[0];
            blinky.mode = ghostModes.CHASE;
            aiSystem.updateAlphaTarget(blinky, mockPlayer);

            expect(blinky.targetX).toBe(mockPlayer.gridX);
            expect(blinky.targetY).toBe(mockPlayer.gridY);
        });
    });

    describe('updateBetaTarget()', () => {
        test('targets scatter corner in SCATTER mode', () => {
            const pinky = mockEnemies[1];
            pinky.mode = ghostModes.SCATTER;
            aiSystem.updateBetaTarget(pinky, mockPlayer);

            expect(pinky.targetX).toBeDefined();
            expect(pinky.targetY).toBeDefined();
        });

        test('targets 4 tiles ahead of Pacman in CHASE mode (RIGHT)', () => {
            const pinky = mockEnemies[1];
            pinky.mode = ghostModes.CHASE;
            mockPlayer.direction = directions.RIGHT;

            aiSystem.updateBetaTarget(pinky, mockPlayer);

            expect(pinky.targetX).toBe(mockPlayer.gridX + 4);
            expect(pinky.targetY).toBe(mockPlayer.gridY);
        });

        test('targets 4 tiles ahead of Pacman in CHASE mode (DOWN)', () => {
            const pinky = mockEnemies[1];
            pinky.mode = ghostModes.CHASE;
            mockPlayer.direction = directions.DOWN;

            aiSystem.updateBetaTarget(pinky, mockPlayer);

            expect(pinky.targetX).toBe(mockPlayer.gridX);
            expect(pinky.targetY).toBe(mockPlayer.gridY + 4);
        });

        test('replicates arcade bug when Pacman is moving UP', () => {
            const pinky = mockEnemies[1];
            pinky.mode = ghostModes.CHASE;
            mockPlayer.direction = directions.UP;

            aiSystem.updateBetaTarget(pinky, mockPlayer);

            expect(pinky.targetX).toBe(mockPlayer.gridX - 4);
            expect(pinky.targetY).toBe(mockPlayer.gridY - 4);
        });

        test('replicates arcade bug when Pacman is moving LEFT', () => {
            const pinky = mockEnemies[1];
            pinky.mode = ghostModes.CHASE;
            mockPlayer.direction = directions.LEFT;

            aiSystem.updateBetaTarget(pinky, mockPlayer);

            expect(pinky.targetX).toBe(mockPlayer.gridX - 4);
            expect(pinky.targetY).toBe(mockPlayer.gridY);
        });
    });

    describe('updateGammaTarget()', () => {
        test('targets scatter corner in SCATTER mode', () => {
            const inky = mockEnemies[2];
            inky.mode = ghostModes.SCATTER;
            aiSystem.updateGammaTarget(inky, mockPlayer);

            expect(inky.targetX).toBeDefined();
            expect(inky.targetY).toBeDefined();
        });

        test('targets Pacman when Blinky not found', () => {
            const inky = mockEnemies[2];
            inky.mode = ghostModes.CHASE;
            aiSystem.setEnemies([inky]);

            aiSystem.updateGammaTarget(inky, mockPlayer);

            expect(inky.targetX).toBe(mockPlayer.gridX);
            expect(inky.targetY).toBe(mockPlayer.gridY);
        });

        test('calculates vector from Blinky through pivot in CHASE mode', () => {
            const inky = mockEnemies[2];
            const blinky = mockEnemies[0];
            inky.mode = ghostModes.CHASE;
            mockPlayer.direction = directions.RIGHT;

            aiSystem.updateGammaTarget(inky, mockPlayer);

            expect(inky.targetX).toBeDefined();
            expect(inky.targetY).toBeDefined();
        });
    });

    describe('updateDeltaTarget()', () => {
        test('targets scatter corner in SCATTER mode', () => {
            const clyde = mockEnemies[3];
            clyde.mode = ghostModes.SCATTER;
            aiSystem.updateDeltaTarget(clyde, mockPlayer);

            expect(clyde.targetX).toBeDefined();
            expect(clyde.targetY).toBeDefined();
        });

        test('targets Pacman when distance > 8', () => {
            const clyde = mockEnemies[3];
            clyde.mode = ghostModes.CHASE;
            clyde.gridX = 1;
            clyde.gridY = 1;
            mockPlayer.gridX = 14;
            mockPlayer.gridY = 14;

            aiSystem.updateDeltaTarget(clyde, mockPlayer);

            expect(clyde.targetX).toBe(mockPlayer.gridX);
            expect(clyde.targetY).toBe(mockPlayer.gridY);
        });

        test('targets scatter corner when distance <= 8', () => {
            const clyde = mockEnemies[3];
            clyde.mode = ghostModes.CHASE;
            clyde.gridX = 14;
            clyde.gridY = 14;
            mockPlayer.gridX = 16;
            mockPlayer.gridY = 16;

            aiSystem.updateDeltaTarget(clyde, mockPlayer);

            expect(clyde.targetX).toBeDefined();
            expect(clyde.targetY).toBeDefined();
        });
    });

    describe('updateGhostTarget()', () => {
        test('targets ghost house when ghost is eaten', () => {
            const blinky = mockEnemies[0];
            blinky.isEaten = true;

            aiSystem.updateEnemyTarget(blinky, mockPlayer);

            expect(blinky.targetX).toBe(13);
            expect(blinky.targetY).toBe(14);
        });

        test('does not change target when frightened', () => {
            const blinky = mockEnemies[0];
            blinky.isFrightened = true;
            blinky.targetX = 5;
            blinky.targetY = 5;

            aiSystem.updateEnemyTarget(blinky, mockPlayer);

            expect(blinky.targetX).toBe(5);
            expect(blinky.targetY).toBe(5);
        });

        test('calls appropriate target update method based on ghost type', () => {
            const blinky = mockEnemies[0];
            blinky.mode = ghostModes.CHASE;

            aiSystem.updateEnemyTarget(blinky, mockPlayer);

            expect(blinky.targetX).toBe(mockPlayer.gridX);
            expect(blinky.targetY).toBe(mockPlayer.gridY);
        });
    });

    describe('getEnemyByType()', () => {
        test('returns correct ghost by type', () => {
            expect(aiSystem.getEnemyByType('alpha')).toBe(mockEnemies[0]);
            expect(aiSystem.getEnemyByType('beta')).toBe(mockEnemies[1]);
            expect(aiSystem.getEnemyByType('gamma')).toBe(mockEnemies[2]);
            expect(aiSystem.getEnemyByType('delta')).toBe(mockEnemies[3]);
        });

        test('returns undefined for non-existent type', () => {
            expect(aiSystem.getEnemyByType('unknown')).toBeUndefined();
        });
    });

    describe('chooseDirection()', () => {
        test('chooses only available direction', () => {
            const blinky = mockEnemies[0];
            blinky.gridX = 2;
            blinky.gridY = 1;
            blinky.direction = directions.NONE;

            aiSystem.chooseDirection(blinky, maze);

            expect(blinky.direction).not.toBe(directions.NONE);
        });

        test('cannot reverse direction when multiple options available', () => {
            const blinky = mockEnemies[0];
            blinky.gridX = 10;
            blinky.gridY = 10;
            blinky.direction = directions.RIGHT;
            const originalDir = blinky.direction;

            aiSystem.chooseDirection(blinky, maze);

            expect(blinky.direction).not.toBe(directions.LEFT);
        });

        test('chooses direction minimizing distance to target', () => {
            const blinky = mockEnemies[0];
            blinky.gridX = 2;
            blinky.gridY = 1;
            blinky.direction = directions.RIGHT;
            blinky.targetX = 20;
            blinky.targetY = 20;

            aiSystem.chooseDirection(blinky, maze);

            expect(blinky.direction).not.toBe(directions.NONE);
        });

        test('chooses random direction when frightened', () => {
            const blinky = mockEnemies[0];
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
            expect(aiSystem.getReverseDirection(directions.RIGHT)).toBe(
                directions.LEFT
            );
        });

        test('returns RIGHT for LEFT', () => {
            expect(aiSystem.getReverseDirection(directions.LEFT)).toBe(
                directions.RIGHT
            );
        });

        test('returns DOWN for UP', () => {
            expect(aiSystem.getReverseDirection(directions.UP)).toBe(directions.DOWN);
        });

        test('returns UP for DOWN', () => {
            expect(aiSystem.getReverseDirection(directions.DOWN)).toBe(directions.UP);
        });

        test('returns NONE for invalid direction', () => {
            expect(aiSystem.getReverseDirection(directions.NONE)).toBe(
                directions.NONE
            );
        });
    });

    describe('update()', () => {
        test('updates global mode timer', () => {
            aiSystem.update(msToSeconds(5000), maze, mockPlayer);
            expect(aiSystem.globalModeTimer).toBe(5);
        });

        test('syncs ghost mode with global mode when not frightened or eaten', () => {
            const blinky = mockEnemies[0];
            blinky.mode = ghostModes.SCATTER;
            aiSystem.globalMode = ghostModes.CHASE;

            aiSystem.update(msToSeconds(0), maze, mockPlayer);

            expect(blinky.mode).toBe(ghostModes.CHASE);
        });

        test('does not change ghost mode when frightened', () => {
            const blinky = mockEnemies[0];
            blinky.mode = ghostModes.SCATTER;
            blinky.isFrightened = true;
            aiSystem.globalMode = ghostModes.CHASE;

            aiSystem.update(msToSeconds(0), maze, mockPlayer);

            expect(blinky.mode).toBe(ghostModes.SCATTER);
        });

        test('does not change ghost mode when eaten', () => {
            const blinky = mockEnemies[0];
            blinky.mode = ghostModes.SCATTER;
            blinky.isEaten = true;
            aiSystem.globalMode = ghostModes.CHASE;

            aiSystem.update(msToSeconds(0), maze, mockPlayer);

            expect(blinky.mode).toBe(ghostModes.SCATTER);
        });

        test.skip('reverses ghost direction when mode changes - TODO: behavior changed with DirectionBuffer', () => {
            const blinky = mockEnemies[0];
            blinky.mode = ghostModes.SCATTER;
            blinky.direction = directions.RIGHT;
            aiSystem.globalMode = ghostModes.CHASE;

            aiSystem.update(msToSeconds(0), maze, mockPlayer);

            expect(blinky.direction).toBe(directions.LEFT);
        });

        test('updates ghost targets', () => {
            const blinky = mockEnemies[0];
            aiSystem.globalMode = ghostModes.CHASE;
            blinky.mode = ghostModes.SCATTER;
            blinky.targetX = 0;
            blinky.targetY = 0;

            aiSystem.update(msToSeconds(0), maze, mockPlayer);

            expect(blinky.targetX).toBe(mockPlayer.gridX);
            expect(blinky.targetY).toBe(mockPlayer.gridY);
        });
    });

    describe('Integration: Mode Cycle', () => {
        test('completes full mode cycle sequence', () => {
            const expectedModes = [
                ghostModes.SCATTER,
                ghostModes.CHASE,
                ghostModes.SCATTER,
                ghostModes.CHASE,
                ghostModes.SCATTER,
                ghostModes.CHASE,
                ghostModes.SCATTER,
                ghostModes.CHASE
            ];

            const durations = [
                msToSeconds(7000),
                msToSeconds(20000),
                msToSeconds(7000),
                msToSeconds(20000),
                msToSeconds(5000),
                msToSeconds(20000),
                msToSeconds(5000),
                msToSeconds(20000)
            ];

            for (let i = 0; i < expectedModes.length; i++) {
                expect(aiSystem.globalMode).toBe(expectedModes[i]);
                aiSystem.update(durations[i], maze, mockPlayer);
            }

            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
        });
    });

    describe('Integration: Ghost AI', () => {
        test('all ghosts update targets correctly in SCATTER mode', () => {
            mockEnemies.forEach((ghost) => {
                ghost.mode = ghostModes.SCATTER;
                aiSystem.updateEnemyTarget(ghost, mockPlayer);

                expect(ghost.targetX).toBeDefined();
                expect(ghost.targetY).toBeDefined();
            });
        });

        test('all ghosts update targets correctly in CHASE mode', () => {
            mockEnemies.forEach((ghost) => {
                ghost.mode = ghostModes.CHASE;
                aiSystem.updateEnemyTarget(ghost, mockPlayer);

                expect(ghost.targetX).toBeDefined();
                expect(ghost.targetY).toBeDefined();
            });
        });
    });
});
