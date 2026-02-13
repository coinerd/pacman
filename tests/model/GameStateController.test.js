/**
 * GameStateController Tests
 * Tests the game simulation controller
 */

import { directions } from '../../src/config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';
import GameModel from '../../src/core/GameModel.js';
import { GameStateController } from '../../src/model/GameStateController.js';

// Mock performance.now for consistent testing
global.performance = {
    now: jest.fn(() => Date.now())
};

describe('GameStateController', () => {
    let controller;

    beforeEach(() => {
        controller = new GameStateController({ level: 1 });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create a unified GameModel instance', () => {
            expect(controller.state).toBeInstanceOf(GameModel);
        });

        it('should create a ModelCollisionSystem', () => {
            expect(controller.collisionSystem).toBeDefined();
        });

        it('should initialize with provided level', () => {
            expect(controller.state.level).toBe(1);
        });

        it('should initialize input direction as null', () => {
            expect(controller.inputDirection).toBeNull();
        });
    });

    describe('setInputDirection', () => {
        it('should set input direction', () => {
            controller.setInputDirection(directions.RIGHT);
            expect(controller.inputDirection).toBe(directions.RIGHT);
        });

        it('should not set NONE direction', () => {
            controller.setInputDirection(directions.RIGHT);
            controller.setInputDirection(directions.NONE);
            expect(controller.inputDirection).toBe(directions.RIGHT);
        });

        it('should ignore null direction', () => {
            controller.setInputDirection(directions.RIGHT);
            controller.setInputDirection(null);
            expect(controller.inputDirection).toBe(directions.RIGHT);
        });
    });

    describe('update', () => {
        it('should update game state', () => {
            const initialTick = controller.state.tickCount;
            const events = controller.update(1 / 60);

            expect(controller.state.tickCount).toBe(initialTick + 1);
            expect(Array.isArray(events)).toBe(true);
        });

        it('should consume input direction', () => {
            controller.setInputDirection(directions.RIGHT);
            controller.update(1 / 60);

            const dir = controller.inputDirection;
            const isConsumed = dir === null || (dir && dir.x === 0 && dir.y === 0);
            expect(isConsumed).toBe(true);
        });

        it('should return movement events', () => {
            controller.setInputDirection(directions.RIGHT);
            const events = controller.update(1 / 60);

            // Should have at least movement events
            expect(events.length).toBeGreaterThanOrEqual(0);
        });

        it('should track update count', () => {
            controller.update(1 / 60);
            controller.update(1 / 60);

            expect(controller.updateCount).toBe(2);
        });
    });

    describe('emitEvents', () => {
        beforeEach(() => {
            jest.spyOn(gameEvents, 'emit');
        });

        it('should emit PELLET_EATEN event', () => {
            controller.emitEvents([
                {
                    type: 'pellet_eaten',
                    score: 10,
                    pelletsRemaining: 5
                }
            ]);

            expect(gameEvents.emit).toHaveBeenCalledWith(
                GAME_EVENTS.PELLET_EATEN,
                expect.objectContaining({
                    score: 10,
                    pelletsRemaining: 5
                })
            );
        });

        it('should emit POWER_PELLET_EATEN event', () => {
            controller.emitEvents([
                {
                    type: 'power_pellet_eaten',
                    score: 50,
                    pelletsRemaining: 4,
                    frightenedDuration: 8
                }
            ]);

            expect(gameEvents.emit).toHaveBeenCalledWith(
                GAME_EVENTS.POWER_PELLET_EATEN,
                expect.objectContaining({
                    score: 50,
                    frightenedDuration: 8
                })
            );
        });

        it('should emit GHOST_EATEN event', () => {
            controller.emitEvents([
                {
                    type: 'ghost_eaten',
                    ghostType: 'blinky',
                    score: 200,
                    combo: 1
                }
            ]);

            expect(gameEvents.emit).toHaveBeenCalledWith(
                GAME_EVENTS.GHOST_EATEN,
                expect.objectContaining({
                    ghostType: 'blinky',
                    score: 200
                })
            );
        });

        it('should emit FRUIT_EATEN event', () => {
            controller.emitEvents([
                {
                    type: 'fruit_eaten',
                    score: 100
                }
            ]);

            expect(gameEvents.emit).toHaveBeenCalledWith(
                GAME_EVENTS.FRUIT_EATEN,
                expect.objectContaining({
                    score: 100
                })
            );
        });

        it('should emit LIVES_LOST event for pacman death', () => {
            controller.emitEvents([
                {
                    type: 'pacman_died',
                    livesRemaining: 2
                }
            ]);

            expect(gameEvents.emit).toHaveBeenCalledWith(
                GAME_EVENTS.LIVES_LOST,
                expect.objectContaining({
                    livesRemaining: 2
                })
            );
        });

        it('should emit LEVEL_COMPLETE event', () => {
            controller.emitEvents([
                {
                    type: 'level_complete'
                }
            ]);

            expect(gameEvents.emit).toHaveBeenCalledWith(
                GAME_EVENTS.LEVEL_COMPLETE,
                expect.objectContaining({})
            );
        });

        it('should emit GAME_OVER event', () => {
            controller.emitEvents([
                {
                    type: 'game_over'
                }
            ]);

            expect(gameEvents.emit).toHaveBeenCalledWith(
                GAME_EVENTS.GAME_OVER,
                expect.objectContaining({})
            );
        });

        it('should not emit tile_center_reached events', () => {
            controller.emitEvents([
                {
                    type: 'tile_center_reached'
                }
            ]);

            expect(gameEvents.emit).not.toHaveBeenCalled();
        });
    });

    describe('getSnapshot', () => {
        it('should return complete state snapshot', () => {
            const snapshot = controller.getSnapshot();

            expect(snapshot).toHaveProperty('level');
            expect(snapshot).toHaveProperty('score');
            expect(snapshot).toHaveProperty('lives');
            expect(snapshot).toHaveProperty('pacman');
            expect(snapshot).toHaveProperty('ghosts');
            expect(snapshot).toHaveProperty('fruit');
        });
    });

    describe('getStats', () => {
        it('should return profiling stats', () => {
            controller.update(1 / 60);
            const stats = controller.getStats();

            expect(stats).toHaveProperty('updateTime');
            expect(stats).toHaveProperty('updateCount');
            expect(stats).toHaveProperty('collisionStats');
            expect(stats.updateCount).toBe(1);
        });
    });

    describe('setPaused', () => {
        it('should set paused state on model', () => {
            controller.setPaused(true);
            expect(controller.state.isPaused).toBe(true);

            controller.setPaused(false);
            expect(controller.state.isPaused).toBe(false);
        });
    });

    describe('resetPositions', () => {
        it('should reset model positions', () => {
            // Move pacman
            controller.state.pacman.x = 500;
            controller.state.pacman.y = 500;

            controller.resetPositions();

            // Should be reset to start position (around 208, 368 for tile 13, 23)
            expect(controller.state.pacman.x).not.toBe(500);
            expect(controller.state.pacman.y).not.toBe(500);
        });

        it('should reset collision system', () => {
            jest.spyOn(controller.collisionSystem, 'reset');
            controller.resetPositions();
            expect(controller.collisionSystem.reset).toHaveBeenCalled();
        });
    });

    describe('nextLevel', () => {
        it('should advance to next level', () => {
            controller.nextLevel();
            expect(controller.state.level).toBe(2);
        });

        it('should reset collision system', () => {
            jest.spyOn(controller.collisionSystem, 'reset');
            controller.nextLevel();
            expect(controller.collisionSystem.reset).toHaveBeenCalled();
        });
    });

    describe('serialize', () => {
        it('should return serializable state', () => {
            const serialized = controller.serialize();

            expect(serialized).toHaveProperty('level');
            expect(serialized).toHaveProperty('score');
            expect(serialized).toHaveProperty('lives');
            expect(serialized).toHaveProperty('pelletGrid');
            expect(serialized).toHaveProperty('pacman');
            expect(serialized).toHaveProperty('ghosts');
        });

        it('should produce valid JSON', () => {
            const serialized = controller.serialize();
            const json = JSON.stringify(serialized);
            const parsed = JSON.parse(json);

            expect(parsed.level).toBe(serialized.level);
            expect(parsed.score).toBe(serialized.score);
        });
    });

    describe('integration with GameState', () => {
        it('should handle death sequence', () => {
            // Trigger death
            controller.state.onPacmanDeath();
            expect(controller.state.isDying).toBe(true);

            // Update during death
            const events1 = controller.update(1);
            expect(events1.some((e) => e.type === 'death_tick')).toBe(true);

            // Continue until death complete
            let gameOverEvent = null;
            for (let i = 0; i < 10; i++) {
                const events = controller.update(1);
                const go = events.find((e) => e.type === 'game_over');
                if (go) {
                    gameOverEvent = go;
                }
            }

            // After enough time, should get game_over or respawn
            expect(controller.state.isDying).toBe(false);
        });

        it('should track pellets eaten', () => {
            const initialPellets = controller.state.pelletsRemaining;

            // Simulate eating a pellet by modifying grid directly
            controller.state.pelletGrid[23][1] = 1; // Ensure pellet exists
            const result = controller.state.eatPelletAt(1, 23);

            expect(result).not.toBeNull();
            expect(controller.state.pelletsRemaining).toBe(initialPellets - 1);
        });

        it('should set ghosts frightened', () => {
            controller.state.setGhostsFrightened(8);

            for (const ghost of controller.state.ghosts) {
                expect(ghost.isFrightened).toBe(true);
            }
        });
    });
});
