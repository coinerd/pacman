/**
 * GameModel.viewEvents.test.js
 * Tests for GameModel VIEW_EVENTS emission
 * Phase 3: View-Events Interface
 */

import GameModel from '../../src/core/GameModel.js';
import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';
import { VIEW_EVENTS } from '../../src/views/ViewEvents.js';

describe('GameModel VIEW_EVENTS Emission', () => {
    let model;

    beforeEach(() => {
        gameEvents.clear();
        model = new GameModel({
            level: 1,
            score: 0,
            lives: 3
        });
    });

    afterEach(() => {
        gameEvents.clear();
    });

    describe('Pellet events', () => {
        it('should emit both GAME_EVENTS.PELLET_EATEN and VIEW_EVENTS.PELLET_EATEN', () => {
            const gameEventListener = jest.fn();
            const viewEventListener = jest.fn();

            gameEvents.on(GAME_EVENTS.PELLET_EATEN, gameEventListener);
            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, viewEventListener);

            // Simulate pellet being eaten at position (1, 1)
            model.pelletGrid[1][1] = 0; // Remove pellet
            model.pelletsRemaining--;
            model.emitEvents([{
                type: 'pellet_eaten',
                score: 10,
                pelletsRemaining: model.pelletsRemaining,
                gridX: 1,
                gridY: 1
            }]);

            expect(gameEventListener).toHaveBeenCalledTimes(1);
            expect(viewEventListener).toHaveBeenCalledTimes(1);

            const viewEventData = viewEventListener.mock.calls[0][0];
            expect(viewEventData.gridX).toBe(1);
            expect(viewEventData.gridY).toBe(1);
            expect(viewEventData.timestamp).toBeGreaterThan(0);
        });

        it('should emit PELLET_EATEN with power pellet type for power pellets', () => {
            const viewEventListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, viewEventListener);

            model.emitEvents([{
                type: 'power_pellet_eaten',
                score: 50,
                pelletsRemaining: model.pelletsRemaining,
                gridX: 2,
                gridY: 3,
                frightenedDuration: 5
            }]);

            const viewEventData = viewEventListener.mock.calls[0][0];
            expect(viewEventData.type).toBe('power_pellet');
            expect(viewEventData.gridX).toBe(2);
            expect(viewEventData.gridY).toBe(3);
        });

        it('should emit SCREEN_FLASH for power pellet eaten', () => {
            const flashListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.SCREEN_FLASH, flashListener);

            model.emitEvents([{
                type: 'power_pellet_eaten',
                score: 50,
                pelletsRemaining: model.pelletsRemaining,
                gridX: 2,
                gridY: 3,
                frightenedDuration: 5
            }]);

            expect(flashListener).toHaveBeenCalledTimes(1);
            const flashData = flashListener.mock.calls[0][0];
            expect(flashData.color).toBe(0xffff00);
            expect(flashData.duration).toBe(200);
        });
    });

    describe('Ghost events', () => {
        it('should emit both GAME_EVENTS.GHOST_EATEN and VIEW_EVENTS.GHOST_EATEN', () => {
            const gameEventListener = jest.fn();
            const viewEventListener = jest.fn();

            gameEvents.on(GAME_EVENTS.GHOST_EATEN, gameEventListener);
            gameEvents.on(VIEW_EVENTS.GHOST_EATEN, viewEventListener);

            model.emitEvents([{
                type: 'ghost_eaten',
                ghostType: 'alpha',
                score: 200,
                combo: 1
            }]);

            expect(gameEventListener).toHaveBeenCalledTimes(1);
            expect(viewEventListener).toHaveBeenCalledTimes(1);

            const viewEventData = viewEventListener.mock.calls[0][0];
            expect(viewEventData.ghostType).toBe('alpha');
            expect(viewEventData.score).toBe(200);
            expect(viewEventData.combo).toBe(1);
            expect(viewEventData.timestamp).toBeGreaterThan(0);
        });

        it('should emit GHOST_MODE_CHANGED when ghost mode changes', () => {
            const modeChangeListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.GHOST_MODE_CHANGED, modeChangeListener);

            // Initial mode is set in constructor
            // Change mode by setting it on a ghost
            model.ghosts[0].mode = 'frightened';

            // Trigger tracking
            model.trackGhostModeChange(model.ghosts[0]);

            expect(modeChangeListener).toHaveBeenCalledTimes(1);
            const modeData = modeChangeListener.mock.calls[0][0];
            expect(modeData.ghostType).toBe(model.ghosts[0].ghostType);
            expect(modeData.newMode).toBe('frightened');
        });
    });

    describe('Fruit events', () => {
        it('should emit both GAME_EVENTS.FRUIT_EATEN and VIEW_EVENTS.FRUIT_EATEN', () => {
            const gameEventListener = jest.fn();
            const viewEventListener = jest.fn();

            gameEvents.on(GAME_EVENTS.FRUIT_EATEN, gameEventListener);
            gameEvents.on(VIEW_EVENTS.FRUIT_EATEN, viewEventListener);

            model.emitEvents([{
                type: 'fruit_eaten',
                score: 100
            }]);

            expect(gameEventListener).toHaveBeenCalledTimes(1);
            expect(viewEventListener).toHaveBeenCalledTimes(1);

            const viewEventData = viewEventListener.mock.calls[0][0];
            expect(viewEventData.score).toBe(100);
            expect(viewEventData.timestamp).toBeGreaterThan(0);
        });
    });

    describe('Pacman events', () => {
        it('should emit PACMAN_DEATH_STARTED when Pacman dies', () => {
            const deathListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PACMAN_DEATH_STARTED, deathListener);

            model.emitEvents([{
                type: 'pacman_died',
                livesRemaining: 2
            }]);

            expect(deathListener).toHaveBeenCalledTimes(1);
            const deathData = deathListener.mock.calls[0][0];
            expect(deathData.livesRemaining).toBe(2);
        });

        it('should emit PACMAN_DIRECTION_CHANGED when direction changes', () => {
            const directionChangeListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PACMAN_DIRECTION_CHANGED, directionChangeListener);

            // Change direction
            model.pacman.direction = { x: 1, y: 0 };

            // Trigger tracking
            model.trackPacmanDirectionChange();

            expect(directionChangeListener).toHaveBeenCalledTimes(1);
            const directionData = directionChangeListener.mock.calls[0][0];
            expect(directionData.newDirection).toEqual({ x: 1, y: 0 });
        });

        it('should not emit direction change if direction is same', () => {
            const directionChangeListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PACMAN_DIRECTION_CHANGED, directionChangeListener);

            // Initialize tracking with current direction
            model.initializeEntityStateTracking();
            const currentDirection = model.pacman.direction;

            // Trigger tracking with same direction
            model.trackPacmanDirectionChange();

            expect(directionChangeListener).not.toHaveBeenCalled();
        });
    });

    describe('Effect events', () => {
        it('should emit SCREEN_FLASH for game over', () => {
            const flashListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.SCREEN_FLASH, flashListener);

            model.emitEvents([{
                type: 'game_over'
            }]);

            expect(flashListener).toHaveBeenCalledTimes(1);
            const flashData = flashListener.mock.calls[0][0];
            expect(flashData.color).toBe(0xff0000);
            expect(flashData.duration).toBe(300);
        });

        it('should emit SCREEN_SHAKE for game over', () => {
            const shakeListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.SCREEN_SHAKE, shakeListener);

            model.emitEvents([{
                type: 'game_over'
            }]);

            expect(shakeListener).toHaveBeenCalledTimes(1);
            const shakeData = shakeListener.mock.calls[0][0];
            expect(shakeData.intensity).toBe(10);
            expect(shakeData.duration).toBe(500);
        });

        it('should emit EFFECT_CREATED for level complete', () => {
            const effectListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.EFFECT_CREATED, effectListener);

            model.emitEvents([{
                type: 'level_complete',
                score: model.score,
                level: model.level
            }]);

            expect(effectListener).toHaveBeenCalledTimes(1);
            const effectData = effectListener.mock.calls[0][0];
            expect(effectData.effectType).toBe('level_complete');
        });
    });

    describe('Entity events', () => {
        it('should emit ENTITY_MOVED for movement events', () => {
            const moveListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.ENTITY_MOVED, moveListener);

            model.emitEvents([{
                type: 'movement_started',
                entityId: 'pacman',
                direction: { x: 1, y: 0 },
                fromGrid: { x: 5, y: 5 },
                toGrid: { x: 6, y: 5 }
            }]);

            expect(moveListener).toHaveBeenCalledTimes(1);
            const moveData = moveListener.mock.calls[0][0];
            expect(moveData.entityId).toBe('pacman');
            expect(moveData.direction).toEqual({ x: 1, y: 0 });
            expect(moveData.fromGrid).toEqual({ x: 5, y: 5 });
            expect(moveData.toGrid).toEqual({ x: 6, y: 5 });
        });

        it('should not emit ENTITY_MOVED for movement_completed', () => {
            const moveListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.ENTITY_MOVED, moveListener);

            model.emitEvents([{
                type: 'movement_completed',
                entityId: 'pacman',
                gridX: 6,
                gridY: 5
            }]);

            expect(moveListener).not.toHaveBeenCalled();
        });
    });

    describe('Event emission order', () => {
        it('should emit GAME_EVENTS before VIEW_EVENTS for the same event', () => {
            const gameEventListener = jest.fn();
            const viewEventListener = jest.fn();

            let gameEmitted = false;
            let viewEmitted = false;

            gameEvents.on(GAME_EVENTS.PELLET_EATEN, () => {
                gameEmitted = true;
            });
            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, () => {
                viewEmitted = true;
                // Verify game event was emitted first
                expect(gameEmitted).toBe(true);
            });

            model.emitEvents([{
                type: 'pellet_eaten',
                score: 10,
                pelletsRemaining: 10,
                gridX: 1,
                gridY: 1
            }]);

            expect(gameEmitted).toBe(true);
            expect(viewEmitted).toBe(true);
        });
    });

    describe('Internal events', () => {
        it('should not emit view events for tile_center_reached', () => {
            const allViewEvents = Object.values(VIEW_EVENTS);
            const listeners = {};

            allViewEvents.forEach(event => {
                listeners[event] = jest.fn();
                gameEvents.on(event, listeners[event]);
            });

            model.emitEvents([{
                type: 'tile_center_reached',
                entityId: 'pacman',
                gridX: 5,
                gridY: 5
            }]);

            // No view event should have been emitted
            Object.values(listeners).forEach(listener => {
                expect(listener).not.toHaveBeenCalled();
            });
        });

        it('should not emit view events for death_tick', () => {
            const allViewEvents = Object.values(VIEW_EVENTS);
            const listeners = {};

            allViewEvents.forEach(event => {
                listeners[event] = jest.fn();
                gameEvents.on(event, listeners[event]);
            });

            model.emitEvents([{
                type: 'death_tick',
                progress: 0.5
            }]);

            // No view event should have been emitted
            Object.values(listeners).forEach(listener => {
                expect(listener).not.toHaveBeenCalled();
            });
        });
    });

    describe('Game flow events remain as GAME_EVENTS', () => {
        it('should emit LEVEL_COMPLETE as GAME_EVENT only', () => {
            const gameEventListener = jest.fn();
            const viewEventListener = jest.fn();

            gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, gameEventListener);
            gameEvents.on(VIEW_EVENTS.LEVEL_COMPLETE, viewEventListener); // This doesn't exist in VIEW_EVENTS

            model.emitEvents([{
                type: 'level_complete',
                score: model.score,
                level: model.level
            }]);

            expect(gameEventListener).toHaveBeenCalledTimes(1);
            expect(viewEventListener).not.toHaveBeenCalled();
        });

        it('should emit GAME_OVER as GAME_EVENT only', () => {
            const gameEventListener = jest.fn();
            const viewEventListener = jest.fn();

            gameEvents.on(GAME_EVENTS.GAME_OVER, gameEventListener);
            gameEvents.on(VIEW_EVENTS.GAME_OVER, viewEventListener); // This doesn't exist in VIEW_EVENTS

            model.emitEvents([{
                type: 'game_over'
            }]);

            expect(gameEventListener).toHaveBeenCalledTimes(1);
            expect(viewEventListener).not.toHaveBeenCalled();
        });

        it('should emit RESPAWN as GAME_EVENT only', () => {
            const gameEventListener = jest.fn();
            const viewEventListener = jest.fn();

            gameEvents.on(GAME_EVENTS.RESPAWN, gameEventListener);
            gameEvents.on(VIEW_EVENTS.RESPAWN, viewEventListener); // This doesn't exist in VIEW_EVENTS

            model.emitEvents([{
                type: 'respawn',
                livesRemaining: 2
            }]);

            expect(gameEventListener).toHaveBeenCalledTimes(1);
            expect(viewEventListener).not.toHaveBeenCalled();
        });
    });
});
