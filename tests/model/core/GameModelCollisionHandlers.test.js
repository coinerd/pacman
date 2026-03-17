/**
 * Tests for GameModelCollisionHandlers
 * Focusing on branch coverage for collision handling
 */

import {
    createCollisionHandlers,
    applyCollisionEffect
} from '../../../src/model/core/GameModelCollisionHandlers.js';
import { GAME_EVENTS, gameEvents } from '../../../src/core/EventBus.js';

describe('GameModelCollisionHandlers', () => {
    let mockContext;
    let handlers;

    beforeEach(() => {
        // Create mock context with all required services
        mockContext = {
            scoreModule: {
                pelletsEaten: 0,
                currentComboGhosts: 0
            },
            gameState: {
                score: 0,
                highScore: 0,
                ghostsEaten: 0,
                maxComboGhosts: 0,
                isDying: false,
                levelDeaths: 0,
                level: 1,
                startDeathTimer: jest.fn()
            },
            spawningSystem: {
                removePelletAt: jest.fn().mockReturnValue(true),
                getPelletsRemaining: jest.fn().mockReturnValue(100)
            },
            levelSystem: {
                getFrightenedDuration: jest.fn().mockReturnValue(6),
                getScoreMultiplier: jest.fn().mockReturnValue(1),
                getFruitScore: jest.fn().mockReturnValue(100)
            },
            entityRegistry: {
                getGhostByType: jest.fn(),
                getGhosts: jest.fn().mockReturnValue([]),
                getFruit: jest.fn()
            }
        };

        handlers = createCollisionHandlers(mockContext);
    });

    describe('createCollisionHandlers', () => {
        it('should create all collision handlers', () => {
            expect(handlers.onPelletEaten).toBeInstanceOf(Function);
            expect(handlers.onPowerPelletEaten).toBeInstanceOf(Function);
            expect(handlers.onGhostEaten).toBeInstanceOf(Function);
            expect(handlers.onPacmanDied).toBeInstanceOf(Function);
            expect(handlers.onFruitEaten).toBeInstanceOf(Function);
        });
    });

    describe('handlePelletEaten', () => {
        it('should increment pelletsEaten and score', () => {
            handlers.onPelletEaten({ gridX: 5, gridY: 5 });

            expect(mockContext.scoreModule.pelletsEaten).toBe(1);
            expect(mockContext.gameState.score).toBe(10);
            expect(mockContext.spawningSystem.removePelletAt).toHaveBeenCalledWith(5, 5);
        });

        it('should handle missing data gracefully', () => {
            handlers.onPelletEaten(null);

            expect(mockContext.scoreModule.pelletsEaten).toBe(1);
            expect(mockContext.gameState.score).toBe(10);
            expect(mockContext.spawningSystem.removePelletAt).toHaveBeenCalledWith(undefined, undefined);
        });

        it('should update high score when score exceeds it', () => {
            mockContext.gameState.highScore = 5;

            handlers.onPelletEaten({ gridX: 5, gridY: 5 });

            expect(mockContext.gameState.highScore).toBe(10);
        });

        it('should not update high score when score is lower', () => {
            mockContext.gameState.highScore = 100;

            handlers.onPelletEaten({ gridX: 5, gridY: 5 });

            expect(mockContext.gameState.highScore).toBe(100);
        });

        it('should emit LEVEL_COMPLETE when pellets reach zero', () => {
            mockContext.spawningSystem.getPelletsRemaining.mockReturnValue(0);

            const emitSpy = jest.spyOn(gameEvents, 'emit');

            handlers.onPelletEaten({ gridX: 5, gridY: 5 });

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.LEVEL_COMPLETE, {
                level: 1,
                score: 10
            });

            emitSpy.mockRestore();
        });

        it('should not emit LEVEL_COMPLETE if already complete', () => {
            mockContext.spawningSystem.getPelletsRemaining.mockReturnValue(0);
            mockContext.gameState.levelComplete = true;

            const emitSpy = jest.spyOn(gameEvents, 'emit');

            handlers.onPelletEaten({ gridX: 5, gridY: 5 });

            expect(emitSpy).not.toHaveBeenCalledWith(
                GAME_EVENTS.LEVEL_COMPLETE,
                expect.any(Object)
            );

            emitSpy.mockRestore();
        });

        it('should do nothing if scoreModule is missing', () => {
            const contextWithoutScoreModule = { ...mockContext, scoreModule: null };
            const handlersNoScore = createCollisionHandlers(contextWithoutScoreModule);

            handlersNoScore.onPelletEaten({ gridX: 5, gridY: 5 });

            expect(mockContext.spawningSystem.removePelletAt).not.toHaveBeenCalled();
        });

        it('should do nothing if gameState is missing', () => {
            const contextWithoutGameState = { ...mockContext, gameState: null };
            const handlersNoState = createCollisionHandlers(contextWithoutGameState);

            handlersNoState.onPelletEaten({ gridX: 5, gridY: 5 });

            expect(mockContext.spawningSystem.removePelletAt).not.toHaveBeenCalled();
        });

        it('should do nothing if spawningSystem is missing', () => {
            const contextWithoutSpawning = { ...mockContext, spawningSystem: null };
            const handlersNoSpawning = createCollisionHandlers(contextWithoutSpawning);

            handlersNoSpawning.onPelletEaten({ gridX: 5, gridY: 5 });

            // Score should still update (checkHighScore called before checkLevelComplete)
            // But removePelletAt should not be called since spawningSystem is null
            expect(mockContext.spawningSystem.removePelletAt).not.toHaveBeenCalled();
        });
    });

    describe('handlePowerPelletEaten', () => {
        it('should increment pelletsEaten and score with 50 points', () => {
            handlers.onPowerPelletEaten({ gridX: 10, gridY: 10 });

            expect(mockContext.scoreModule.pelletsEaten).toBe(1);
            expect(mockContext.gameState.score).toBe(50);
            expect(mockContext.spawningSystem.removePelletAt).toHaveBeenCalledWith(10, 10);
        });

        it('should set ghosts frightened', () => {
            const mockGhost = {
                setFrightened: jest.fn()
            };
            mockContext.entityRegistry.getGhosts.mockReturnValue([mockGhost]);

            handlers.onPowerPelletEaten({ gridX: 10, gridY: 10 });

            expect(mockGhost.setFrightened).toHaveBeenCalledWith(6);
        });

        it('should handle multiple ghosts', () => {
            const mockGhosts = [
                { setFrightened: jest.fn() },
                { setFrightened: jest.fn() },
                { setFrightened: jest.fn() }
            ];
            mockContext.entityRegistry.getGhosts.mockReturnValue(mockGhosts);

            handlers.onPowerPelletEaten({ gridX: 10, gridY: 10 });

            mockGhosts.forEach(ghost => {
                expect(ghost.setFrightened).toHaveBeenCalledWith(6);
            });
        });

        it('should handle null ghosts in array', () => {
            const mockGhosts = [
                { setFrightened: jest.fn() },
                null,
                { setFrightened: jest.fn() }
            ];
            mockContext.entityRegistry.getGhosts.mockReturnValue(mockGhosts);

            // Should not throw
            handlers.onPowerPelletEaten({ gridX: 10, gridY: 10 });

            expect(mockGhosts[0].setFrightened).toHaveBeenCalled();
            expect(mockGhosts[2].setFrightened).toHaveBeenCalled();
        });

        it('should do nothing if scoreModule is missing', () => {
            const contextWithoutScoreModule = { ...mockContext, scoreModule: null };
            const handlersNoScore = createCollisionHandlers(contextWithoutScoreModule);

            handlersNoScore.onPowerPelletEaten({ gridX: 10, gridY: 10 });

            expect(mockContext.spawningSystem.removePelletAt).not.toHaveBeenCalled();
        });

        it('should do nothing if levelSystem is missing', () => {
            const contextWithoutLevel = { ...mockContext, levelSystem: null };
            const handlersNoLevel = createCollisionHandlers(contextWithoutLevel);

            handlersNoLevel.onPowerPelletEaten({ gridX: 10, gridY: 10 });

            expect(mockContext.spawningSystem.removePelletAt).not.toHaveBeenCalled();
        });
    });

    describe('handleGhostEaten', () => {
        it('should eat ghost and add score', () => {
            const mockGhost = {
                eat: jest.fn(),
                eatenCount: 0
            };
            mockContext.entityRegistry.getGhostByType.mockReturnValue(mockGhost);

            handlers.onGhostEaten({ ghostType: 'alpha' });

            expect(mockGhost.eat).toHaveBeenCalled();
            expect(mockContext.gameState.score).toBe(200); // First ghost = 200
            expect(mockContext.scoreModule.currentComboGhosts).toBe(1);
            expect(mockContext.gameState.ghostsEaten).toBe(1);
        });

        it('should calculate correct score for second ghost', () => {
            const mockGhost = {
                eat: jest.fn(),
                eatenCount: 1
            };
            mockContext.entityRegistry.getGhostByType.mockReturnValue(mockGhost);

            handlers.onGhostEaten({ ghostType: 'alpha' });

            expect(mockContext.gameState.score).toBe(400); // Second ghost = 400
        });

        it('should calculate correct score for third ghost', () => {
            const mockGhost = {
                eat: jest.fn(),
                eatenCount: 2
            };
            mockContext.entityRegistry.getGhostByType.mockReturnValue(mockGhost);

            handlers.onGhostEaten({ ghostType: 'alpha' });

            expect(mockContext.gameState.score).toBe(800); // Third ghost = 800
        });

        it('should calculate correct score for fourth ghost', () => {
            const mockGhost = {
                eat: jest.fn(),
                eatenCount: 3
            };
            mockContext.entityRegistry.getGhostByType.mockReturnValue(mockGhost);

            handlers.onGhostEaten({ ghostType: 'alpha' });

            expect(mockContext.gameState.score).toBe(1600); // Fourth ghost = 1600
        });

        it('should wrap around eatenCount with modulo', () => {
            const mockGhost = {
                eat: jest.fn(),
                eatenCount: 5 // 5 % 4 = 1, so should be 400
            };
            mockContext.entityRegistry.getGhostByType.mockReturnValue(mockGhost);

            handlers.onGhostEaten({ ghostType: 'alpha' });

            expect(mockContext.gameState.score).toBe(400);
        });

        it('should apply score multiplier', () => {
            const mockGhost = {
                eat: jest.fn(),
                eatenCount: 0
            };
            mockContext.entityRegistry.getGhostByType.mockReturnValue(mockGhost);
            mockContext.levelSystem.getScoreMultiplier.mockReturnValue(2);

            handlers.onGhostEaten({ ghostType: 'alpha' });

            expect(mockContext.gameState.score).toBe(400); // 200 * 2
        });

        it('should update maxComboGhosts', () => {
            const mockGhost = {
                eat: jest.fn(),
                eatenCount: 0
            };
            mockContext.entityRegistry.getGhostByType.mockReturnValue(mockGhost);
            mockContext.scoreModule.currentComboGhosts = 5;

            handlers.onGhostEaten({ ghostType: 'alpha' });

            expect(mockContext.gameState.maxComboGhosts).toBe(6);
        });

        it('should do nothing if ghost not found', () => {
            mockContext.entityRegistry.getGhostByType.mockReturnValue(null);

            handlers.onGhostEaten({ ghostType: 'unknown' });

            expect(mockContext.gameState.score).toBe(0);
        });

        it('should do nothing if entityRegistry is missing', () => {
            const contextWithoutRegistry = { ...mockContext, entityRegistry: null };
            const handlersNoRegistry = createCollisionHandlers(contextWithoutRegistry);

            handlersNoRegistry.onGhostEaten({ ghostType: 'alpha' });

            expect(mockContext.gameState.score).toBe(0);
        });

        it('should handle missing ghostType in data', () => {
            const mockGhost = {
                eat: jest.fn(),
                eatenCount: 0
            };
            mockContext.entityRegistry.getGhostByType.mockReturnValue(mockGhost);

            handlers.onGhostEaten(null);

            expect(mockContext.entityRegistry.getGhostByType).toHaveBeenCalledWith(undefined);
        });

        it('should handle missing eatenCount on ghost', () => {
            const mockGhost = {
                eat: jest.fn()
                // No eatenCount property
            };
            mockContext.entityRegistry.getGhostByType.mockReturnValue(mockGhost);

            handlers.onGhostEaten({ ghostType: 'alpha' });

            // Should default to 200 (index 0 of array)
            expect(mockContext.gameState.score).toBe(200);
        });
    });

    describe('handlePacmanDied', () => {
        it('should set isDying to true', () => {
            handlers.onPacmanDied({});

            expect(mockContext.gameState.isDying).toBe(true);
        });

        it('should start death timer', () => {
            handlers.onPacmanDied({});

            expect(mockContext.gameState.startDeathTimer).toHaveBeenCalled();
        });

        it('should increment levelDeaths', () => {
            handlers.onPacmanDied({});

            expect(mockContext.gameState.levelDeaths).toBe(1);
        });

        it('should work without data parameter', () => {
            handlers.onPacmanDied();

            expect(mockContext.gameState.isDying).toBe(true);
        });
    });

    describe('handleFruitEaten', () => {
        it('should eat fruit and add score', () => {
            const mockFruit = {
                eat: jest.fn()
            };
            mockContext.entityRegistry.getFruit.mockReturnValue(mockFruit);

            handlers.onFruitEaten({ fruitType: 'cherry' });

            expect(mockFruit.eat).toHaveBeenCalled();
            expect(mockContext.gameState.score).toBe(100);
        });

        it('should update high score when exceeding it', () => {
            const mockFruit = {
                eat: jest.fn()
            };
            mockContext.entityRegistry.getFruit.mockReturnValue(mockFruit);
            mockContext.gameState.highScore = 50;

            handlers.onFruitEaten({ fruitType: 'cherry' });

            expect(mockContext.gameState.highScore).toBe(100);
        });

        it('should do nothing if fruit not found', () => {
            mockContext.entityRegistry.getFruit.mockReturnValue(null);

            handlers.onFruitEaten({ fruitType: 'cherry' });

            expect(mockContext.gameState.score).toBe(0);
        });

        it('should do nothing if entityRegistry is missing', () => {
            const contextWithoutRegistry = { ...mockContext, entityRegistry: null };
            const handlersNoRegistry = createCollisionHandlers(contextWithoutRegistry);

            handlersNoRegistry.onFruitEaten({ fruitType: 'cherry' });

            expect(mockContext.gameState.score).toBe(0);
        });

        it('should handle missing fruitType', () => {
            const mockFruit = {
                eat: jest.fn()
            };
            mockContext.entityRegistry.getFruit.mockReturnValue(mockFruit);

            handlers.onFruitEaten(null);

            expect(mockContext.levelSystem.getFruitScore).toHaveBeenCalledWith(undefined);
        });
    });

    describe('applyCollisionEffect', () => {
        it('should handle pelletEaten event (no-op)', () => {
            // pelletEaten is a no-op in applyCollisionEffect
            expect(() => applyCollisionEffect(mockContext, { type: 'pelletEaten' })).not.toThrow();
        });

        it('should handle powerPelletEaten event (no-op)', () => {
            expect(() => applyCollisionEffect(mockContext, { type: 'powerPelletEaten' })).not.toThrow();
        });

        it('should handle ghostEaten event (no-op)', () => {
            expect(() => applyCollisionEffect(mockContext, { type: 'ghostEaten' })).not.toThrow();
        });

        it('should handle fruitEaten event (no-op)', () => {
            expect(() => applyCollisionEffect(mockContext, { type: 'fruitEaten' })).not.toThrow();
        });

        it('should handle pacmanDied event', () => {
            applyCollisionEffect(mockContext, { type: 'pacmanDied' });

            expect(mockContext.gameState.isDying).toBe(true);
        });

        it('should handle unknown event type (no-op)', () => {
            expect(() => applyCollisionEffect(mockContext, { type: 'unknown' })).not.toThrow();
        });
    });
});
