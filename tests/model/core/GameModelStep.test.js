/**
 * Tests for GameModelStep
 * Focusing on branch coverage for game step execution
 */

import {
    executeStep,
    createSnapshot
} from '../../../src/model/core/GameModelStep.js';
import { GAME_EVENTS, gameEvents } from '../../../src/core/EventBus.js';

describe('GameModelStep', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = {
            gameState: {
                isPaused: false,
                isGameOver: false,
                isDying: false,
                levelComplete: false,
                level: 1,
                score: 100,
                highScore: 500,
                lives: 3,
                ghostsEaten: 0,
                tick: 0,
                updateDeathTimer: jest.fn(),
                isDeathComplete: jest.fn().mockReturnValue(false),
                startDeathTimer: jest.fn(),
                incrementTick: jest.fn(),
                levelDeaths: 0
            },
            movementSystem: {
                update: jest.fn().mockReturnValue([]),
                syncToEntities: jest.fn(),
                setDirection: jest.fn(),
                resetEntity: jest.fn()
            },
            entityRegistry: {
                getPacman: jest.fn().mockReturnValue({
                    update: jest.fn(),
                    setDesiredDirection: jest.fn(),
                    getSnapshot: jest.fn().mockReturnValue({ x: 100, y: 200 })
                }),
                getGhosts: jest.fn().mockReturnValue([]),
                getFruit: jest.fn().mockReturnValue({
                    update: jest.fn(),
                    getSnapshot: jest.fn().mockReturnValue({})
                }),
                resetPositions: jest.fn()
            },
            spawningSystem: {
                getMaze: jest.fn().mockReturnValue([[]]),
                getPelletGrid: jest.fn().mockReturnValue([[]]),
                getPelletsRemaining: jest.fn().mockReturnValue(100),
                getTotalPellets: jest.fn().mockReturnValue(200),
                getSpawnPoints: jest.fn().mockReturnValue({
                    player: { x: 13, y: 23 },
                    ghosts: {
                        alpha: { x: 13, y: 14 },
                        beta: { x: 11, y: 14 }
                    }
                })
            },
            collisionHandler: {
                checkAllCollisions: jest.fn().mockReturnValue([])
            },
            scoreModule: {
                pelletsEaten: 50
            },
            levelSystem: {
                getLevelInfo: jest.fn().mockReturnValue({ level: 1 })
            },
            bossBattleSystem: {
                getSnapshot: jest.fn().mockReturnValue({})
            },
            additionalPowerUpSystem: {
                getSnapshot: jest.fn().mockReturnValue({ spawnedPowerUps: [] })
            },
            storyMode: {
                getSnapshot: jest.fn().mockReturnValue({})
            },
            movementEntityIds: {
                player: 'player-1',
                ghosts: {
                    alpha: 'ghost-alpha',
                    beta: 'ghost-beta'
                }
            }
        };
    });

    describe('executeStep', () => {
        it('should return empty array when paused', () => {
            mockContext.gameState.isPaused = true;

            const result = executeStep(mockContext, 0.016);

            expect(result).toEqual([]);
            expect(mockContext.movementSystem.update).not.toHaveBeenCalled();
        });

        it('should return empty array when game over', () => {
            mockContext.gameState.isGameOver = true;

            const result = executeStep(mockContext, 0.016);

            expect(result).toEqual([]);
            expect(mockContext.movementSystem.update).not.toHaveBeenCalled();
        });

        it('should update death sequence when dying', () => {
            mockContext.gameState.isDying = true;

            const result = executeStep(mockContext, 0.016);

            expect(mockContext.gameState.updateDeathTimer).toHaveBeenCalledWith(0.016);
            expect(result).toEqual([]);
        });

        it('should handle death complete with remaining lives', () => {
            mockContext.gameState.isDying = true;
            mockContext.gameState.isDeathComplete.mockReturnValue(true);
            mockContext.gameState.lives = 3;

            const emitSpy = jest.spyOn(gameEvents, 'emit');

            const result = executeStep(mockContext, 0.016);

            expect(mockContext.gameState.lives).toBe(2);
            expect(mockContext.gameState.isDying).toBe(false);
            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.RESPAWN);
            expect(result).toEqual([{ type: 'respawn' }]);

            emitSpy.mockRestore();
        });

        it('should handle death complete with last life', () => {
            mockContext.gameState.isDying = true;
            mockContext.gameState.isDeathComplete.mockReturnValue(true);
            mockContext.gameState.lives = 1;

            const emitSpy = jest.spyOn(gameEvents, 'emit');

            executeStep(mockContext, 0.016);

            expect(mockContext.gameState.isGameOver).toBe(true);
            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.GAME_OVER, {
                score: 100,
                highScore: 500,
                level: 1
            });

            emitSpy.mockRestore();
        });

        it('should handle input direction', () => {
            const pacman = mockContext.entityRegistry.getPacman();

            executeStep(mockContext, 0.016, { direction: 'UP' });

            expect(pacman.setDesiredDirection).toHaveBeenCalledWith('UP');
            expect(mockContext.movementSystem.setDirection).toHaveBeenCalledWith('player-1', 'UP');
        });

        it('should not set direction if no input', () => {
            const pacman = mockContext.entityRegistry.getPacman();

            executeStep(mockContext, 0.016, null);

            expect(pacman.setDesiredDirection).not.toHaveBeenCalled();
        });

        it('should not set direction if input has no direction', () => {
            const pacman = mockContext.entityRegistry.getPacman();

            executeStep(mockContext, 0.016, {});

            expect(pacman.setDesiredDirection).not.toHaveBeenCalled();
        });

        it('should update movement system with entities', () => {
            const pacman = mockContext.entityRegistry.getPacman();

            executeStep(mockContext, 0.016);

            expect(mockContext.movementSystem.update).toHaveBeenCalledWith(0.016, {
                player: pacman,
                pacman: pacman,
                ghosts: []
            });
        });

        it('should update pacman with maze', () => {
            const pacman = mockContext.entityRegistry.getPacman();

            executeStep(mockContext, 0.016);

            expect(pacman.update).toHaveBeenCalledWith(0.016, [[]]);
        });

        it('should update ghosts with maze', () => {
            const ghost1 = { update: jest.fn() };
            const ghost2 = { update: jest.fn() };
            mockContext.entityRegistry.getGhosts.mockReturnValue([ghost1, ghost2]);

            executeStep(mockContext, 0.016);

            expect(ghost1.update).toHaveBeenCalledWith(0.016, [[]]);
            expect(ghost2.update).toHaveBeenCalledWith(0.016, [[]]);
        });

        it('should handle null ghost in array', () => {
            const ghost1 = { update: jest.fn() };
            mockContext.entityRegistry.getGhosts.mockReturnValue([ghost1, null]);

            // Should not throw
            expect(() => executeStep(mockContext, 0.016)).not.toThrow();
            expect(ghost1.update).toHaveBeenCalled();
        });

        it('should update fruit', () => {
            const fruit = mockContext.entityRegistry.getFruit();

            executeStep(mockContext, 0.016);

            expect(fruit.update).toHaveBeenCalledWith(0.016);
        });

        it('should handle null fruit', () => {
            mockContext.entityRegistry.getFruit.mockReturnValue(null);

            // Should not throw
            expect(() => executeStep(mockContext, 0.016)).not.toThrow();
        });

        it('should check collisions', () => {
            const pacman = mockContext.entityRegistry.getPacman();

            executeStep(mockContext, 0.016);

            expect(mockContext.collisionHandler.checkAllCollisions).toHaveBeenCalledWith(
                {
                    pacman: pacman,
                    ghosts: [],
                    fruit: expect.any(Object)
                },
                {
                    pelletGrid: [[]],
                    pelletsRemaining: 100
                }
            );
        });

        it('should increment tick counter', () => {
            executeStep(mockContext, 0.016);

            expect(mockContext.gameState.incrementTick).toHaveBeenCalled();
        });

        it('should return combined movement and collision events', () => {
            const movementEvents = [{ type: 'movement' }];
            const collisionEvents = [{ type: 'collision' }];
            mockContext.movementSystem.update.mockReturnValue(movementEvents);
            mockContext.collisionHandler.checkAllCollisions.mockReturnValue(collisionEvents);

            const result = executeStep(mockContext, 0.016);

            expect(result).toHaveLength(2);
            expect(result).toContainEqual({ type: 'movement' });
            expect(result).toContainEqual({ type: 'collision' });
        });

        it('should emit events', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');
            mockContext.movementSystem.update.mockReturnValue([{ type: 'testEvent', data: 123 }]);

            executeStep(mockContext, 0.016);

            expect(emitSpy).toHaveBeenCalledWith('testEvent', { type: 'testEvent', data: 123 });

            emitSpy.mockRestore();
        });

        it('should handle missing movementSystem', () => {
            mockContext.movementSystem = null;

            // Should not throw
            expect(() => executeStep(mockContext, 0.016)).not.toThrow();
        });

        it('should handle missing collisionHandler', () => {
            mockContext.collisionHandler = null;

            // Should not throw
            expect(() => executeStep(mockContext, 0.016)).not.toThrow();
        });

        it('should handle missing entityRegistry', () => {
            mockContext.entityRegistry = null;

            // Should not throw
            expect(() => executeStep(mockContext, 0.016)).not.toThrow();
        });

        it('should handle pacman without update method', () => {
            mockContext.entityRegistry.getPacman.mockReturnValue({});

            // Will throw since update is called - this tests the actual behavior
            expect(() => executeStep(mockContext, 0.016)).toThrow();
        });

        it('should handle pacman as null', () => {
            mockContext.entityRegistry.getPacman.mockReturnValue(null);

            // Should not throw
            expect(() => executeStep(mockContext, 0.016)).not.toThrow();
        });

        it('should sync movement system to entities', () => {
            executeStep(mockContext, 0.016);

            expect(mockContext.movementSystem.syncToEntities).toHaveBeenCalled();
        });
    });

    describe('createSnapshot', () => {
        it('should create a complete snapshot', () => {
            const snapshot = createSnapshot(mockContext);

            expect(snapshot.tickCount).toBe(0);
            expect(snapshot.level).toBe(1);
            expect(snapshot.score).toBe(100);
            expect(snapshot.highScore).toBe(500);
            expect(snapshot.lives).toBe(3);
            expect(snapshot.pelletsEaten).toBe(50);
            expect(snapshot.ghostsEaten).toBe(0);
            expect(snapshot.pelletsRemaining).toBe(100);
            expect(snapshot.totalPellets).toBe(200);
            expect(snapshot.isPaused).toBe(false);
            expect(snapshot.isGameOver).toBe(false);
            expect(snapshot.levelComplete).toBe(false);
            expect(snapshot.isDying).toBe(false);
        });

        it('should include maze and pelletGrid', () => {
            const snapshot = createSnapshot(mockContext);

            expect(snapshot.maze).toEqual([[]]);
            expect(snapshot.pelletGrid).toEqual([[]]);
        });

        it('should include pacman snapshot', () => {
            const pacman = mockContext.entityRegistry.getPacman();
            const snapshot = createSnapshot(mockContext);

            expect(snapshot.pacman).toEqual({ x: 100, y: 200 });
            expect(pacman.getSnapshot).toHaveBeenCalled();
        });

        it('should include ghosts snapshot', () => {
            const ghost1 = { getSnapshot: jest.fn().mockReturnValue({ type: 'alpha' }) };
            const ghost2 = { getSnapshot: jest.fn().mockReturnValue({ type: 'beta' }) };
            mockContext.entityRegistry.getGhosts.mockReturnValue([ghost1, ghost2]);

            const snapshot = createSnapshot(mockContext);

            expect(snapshot.ghosts).toHaveLength(2);
            expect(snapshot.ghosts[0]).toEqual({ type: 'alpha' });
            expect(snapshot.ghosts[1]).toEqual({ type: 'beta' });
        });

        it('should include fruit snapshot', () => {
            const fruit = mockContext.entityRegistry.getFruit();
            const snapshot = createSnapshot(mockContext);

            expect(snapshot.fruit).toEqual({});
            expect(fruit.getSnapshot).toHaveBeenCalled();
        });

        it('should include boss snapshot', () => {
            const snapshot = createSnapshot(mockContext);

            expect(snapshot.boss).toEqual({});
            expect(mockContext.bossBattleSystem.getSnapshot).toHaveBeenCalled();
        });

        it('should include powerUps', () => {
            const snapshot = createSnapshot(mockContext);

            expect(snapshot.powerUps).toEqual([]);
        });

        it('should include story snapshot', () => {
            const snapshot = createSnapshot(mockContext);

            expect(snapshot.story).toEqual({});
        });

        it('should include level info', () => {
            const snapshot = createSnapshot(mockContext);

            expect(snapshot.levelInfo).toEqual({ level: 1 });
        });

        it('should handle missing gameState', () => {
            mockContext.gameState = null;

            const snapshot = createSnapshot(mockContext);

            expect(snapshot.tickCount).toBeUndefined();
            expect(snapshot.level).toBeUndefined();
        });

        it('should handle missing spawningSystem', () => {
            mockContext.spawningSystem = null;

            const snapshot = createSnapshot(mockContext);

            expect(snapshot.maze).toBeUndefined();
            expect(snapshot.pelletGrid).toBeUndefined();
        });

        it('should handle missing entityRegistry', () => {
            mockContext.entityRegistry = null;

            const snapshot = createSnapshot(mockContext);

            expect(snapshot.pacman).toBeUndefined();
            expect(snapshot.ghosts).toEqual([]);
        });

        it('should handle missing bossBattleSystem', () => {
            mockContext.bossBattleSystem = null;

            const snapshot = createSnapshot(mockContext);

            expect(snapshot.boss).toBeUndefined();
        });

        it('should handle missing additionalPowerUpSystem', () => {
            mockContext.additionalPowerUpSystem = null;

            const snapshot = createSnapshot(mockContext);

            expect(snapshot.powerUps).toEqual([]);
        });

        it('should handle missing storyMode', () => {
            mockContext.storyMode = null;

            const snapshot = createSnapshot(mockContext);

            expect(snapshot.story).toBeUndefined();
        });

        it('should handle missing levelSystem', () => {
            mockContext.levelSystem = null;

            const snapshot = createSnapshot(mockContext);

            expect(snapshot.levelInfo).toBeUndefined();
        });
    });

    describe('executeStep edge cases', () => {
        it('should handle empty ghosts array', () => {
            mockContext.entityRegistry.getGhosts.mockReturnValue([]);

            executeStep(mockContext, 0.016);

            // Should not throw
            expect(mockContext.movementSystem.update).toHaveBeenCalled();
        });

        it('should handle null movementEntityIds', () => {
            mockContext.movementEntityIds = null;

            // Should not throw when setting direction
            expect(() => executeStep(mockContext, 0.016, { direction: 'UP' })).not.toThrow();
        });

        it('should handle missing player in movementEntityIds', () => {
            mockContext.movementEntityIds = { ghosts: {} };

            // Should not throw when setting direction
            expect(() => executeStep(mockContext, 0.016, { direction: 'UP' })).not.toThrow();
        });

        it('should handle maze as null', () => {
            mockContext.spawningSystem.getMaze.mockReturnValue(null);

            // Should not throw - pacman update should handle null maze
            expect(() => executeStep(mockContext, 0.016)).not.toThrow();
        });

        it('should handle null spawningSystem', () => {
            mockContext.spawningSystem = null;

            // Should not throw
            expect(() => executeStep(mockContext, 0.016)).not.toThrow();
        });
    });
});
