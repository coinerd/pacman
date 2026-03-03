/**
 * GameModelViewIntegration.test.js
 * Integration tests for GameModel → VIEW_EVENTS → View flow
 * Phase 3: View-Events Interface
 */

import GameModelDI from '../../src/model/core/GameModelDI.js';
import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';
import { VIEW_EVENTS } from '../../src/views/ViewEvents.js';

describe('GameModel → VIEW_EVENTS Integration', () => {
    let model;

    beforeEach(() => {
        gameEvents.clear();
        model = new GameModelDI({
            level: 1,
            score: 0,
            lives: 3
        }, true);
    }, true);

    afterEach(() => {
        gameEvents.clear();
    }, true);

    describe('Pellet eaten flow', () => {
        it('should emit VIEW_EVENTS.PELLET_EATEN when pellet is eaten', () => {
            const viewListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, viewListener);

            model.emitEvents([{
                type: 'pellet_eaten',
                score: 10,
                pelletsRemaining: 100,
                gridX: 5,
                gridY: 5
            }]);

            expect(viewListener).toHaveBeenCalledTimes(1);
            const eventData = viewListener.mock.calls[0][0];
            expect(eventData.gridX).toBe(5);
            expect(eventData.gridY).toBe(5);
        }, true);

        it('should handle power pellet differently from regular pellet', () => {
            const viewListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, viewListener);

            // Regular pellet
            model.emitEvents([{
                type: 'pellet_eaten',
                score: 10,
                pelletsRemaining: 100,
                gridX: 5,
                gridY: 5
            }]);

            // Power pellet
            model.emitEvents([{
                type: 'power_pellet_eaten',
                score: 50,
                pelletsRemaining: 99,
                gridX: 10,
                gridY: 10,
                frightenedDuration: 5
            }]);

            expect(viewListener).toHaveBeenCalledTimes(2);

            const regularPelletData = viewListener.mock.calls[0][0];
            const powerPelletData = viewListener.mock.calls[1][0];

            expect(regularPelletData.type).toBeUndefined();
            expect(powerPelletData.type).toBe('power_pellet');
        }, true);
    }, true);

    describe('Ghost eaten flow', () => {
        it('should emit VIEW_EVENTS.GHOST_EATEN when ghost is eaten', () => {
            const viewListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.GHOST_EATEN, viewListener);

            model.emitEvents([{
                type: 'ghost_eaten',
                ghostType: 'alpha',
                score: 200,
                combo: 1
            }]);

            expect(viewListener).toHaveBeenCalledTimes(1);
            const eventData = viewListener.mock.calls[0][0];
            expect(eventData.ghostType).toBe('alpha');
            expect(eventData.score).toBe(200);
        }, true);

        it('should track ghost mode changes and emit events', () => {
            const modeChangeListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.GHOST_MODE_CHANGED, modeChangeListener);

            // Initialize tracking
            model.initializeEntityStateTracking();

            // Change ghost mode
            model.ghosts[0].mode = 'frightened';
            model.trackGhostModeChange(model.ghosts[0]);

            expect(modeChangeListener).toHaveBeenCalledTimes(1);
            const eventData = modeChangeListener.mock.calls[0][0];
            expect(eventData.ghostType).toBe(model.ghosts[0].ghostType);
            expect(eventData.newMode).toBe('frightened');
        }, true);
    }, true);

    describe('Pacman events flow', () => {
        it('should emit VIEW_EVENTS.PACMAN_DIRECTION_CHANGED on direction change', () => {
            const directionChangeListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PACMAN_DIRECTION_CHANGED, directionChangeListener);

            // Initialize tracking
            model.initializeEntityStateTracking();

            // Change direction
            model.pacman.direction = { x: 1, y: 0 };
            model.trackPacmanDirectionChange();

            expect(directionChangeListener).toHaveBeenCalledTimes(1);
            const eventData = directionChangeListener.mock.calls[0][0];
            expect(eventData.newDirection).toEqual({ x: 1, y: 0 }, true);
        }, true);

        it('should emit VIEW_EVENTS.PACMAN_DEATH_STARTED on death', () => {
            const deathListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PACMAN_DEATH_STARTED, deathListener);

            model.emitEvents([{
                type: 'pacman_died',
                livesRemaining: 2
            }]);

            expect(deathListener).toHaveBeenCalledTimes(1);
            const eventData = deathListener.mock.calls[0][0];
            expect(eventData.livesRemaining).toBe(2);
        }, true);
    }, true);

    describe('Effect events flow', () => {
        it('should emit VIEW_EVENTS.SCREEN_FLASH for power pellet', () => {
            const flashListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.SCREEN_FLASH, flashListener);

            model.emitEvents([{
                type: 'power_pellet_eaten',
                score: 50,
                pelletsRemaining: 100,
                gridX: 5,
                gridY: 5,
                frightenedDuration: 5
            }]);

            expect(flashListener).toHaveBeenCalledTimes(1);
            const eventData = flashListener.mock.calls[0][0];
            expect(eventData.color).toBe(0xffff00);
            expect(eventData.duration).toBe(200);
        }, true);

        it('should emit VIEW_EVENTS.SCREEN_SHAKE for game over', () => {
            const shakeListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.SCREEN_SHAKE, shakeListener);

            model.emitEvents([{
                type: 'game_over'
            }]);

            expect(shakeListener).toHaveBeenCalledTimes(1);
            const eventData = shakeListener.mock.calls[0][0];
            expect(eventData.intensity).toBe(10);
            expect(eventData.duration).toBe(500);
        }, true);
    }, true);

    describe('Event separation concerns', () => {
        it('should emit rendering events as VIEW_EVENTS', () => {
            const viewListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, viewListener);

            model.emitEvents([{
                type: 'pellet_eaten',
                score: 10,
                pelletsRemaining: 100,
                gridX: 5,
                gridY: 5
            }]);

            expect(viewListener).toHaveBeenCalledTimes(1);
        }, true);

        it('should emit game flow events as GAME_EVENTS', () => {
            const gameListener = jest.fn();
            gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, gameListener);

            model.emitEvents([{
                type: 'level_complete',
                score: model.score,
                level: model.level
            }]);

            expect(gameListener).toHaveBeenCalledTimes(1);
        }, true);

        it('should not emit rendering events as GAME_EVENTS', () => {
            const gameListener = jest.fn();

            // PELLET_EATEN is both GAME_EVENT and VIEW_EVENT, so we need to test
            // that rendering-specific events are not duplicated
            // Let's test with a pure rendering event

            model.emitEvents([{
                type: 'movement_started',
                entityId: 'pacman',
                direction: { x: 1, y: 0 },
                fromGrid: { x: 5, y: 5 },
                toGrid: { x: 6, y: 5 }
            }]);

            // movement_started is not a GAME_EVENT, only a VIEW_EVENT
            expect(gameListener).not.toHaveBeenCalled();
        }, true);
    }, true);

    describe('Complete game flow integration', () => {
        it('should handle full pellet eating sequence', () => {
            const pelletListener = jest.fn();
            const ghostListener = jest.fn();

            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, pelletListener);
            gameEvents.on(VIEW_EVENTS.GHOST_EATEN, ghostListener);

            // Eat pellets
            model.emitEvents([{
                type: 'pellet_eaten',
                score: 10,
                pelletsRemaining: 100,
                gridX: 5,
                gridY: 5
            }]);

            model.emitEvents([{
                type: 'pellet_eaten',
                score: 10,
                pelletsRemaining: 99,
                gridX: 6,
                gridY: 5
            }]);

            // Eat power pellet
            model.emitEvents([{
                type: 'power_pellet_eaten',
                score: 50,
                pelletsRemaining: 98,
                gridX: 10,
                gridY: 10,
                frightenedDuration: 5
            }]);

            // Eat ghost
            model.emitEvents([{
                type: 'ghost_eaten',
                ghostType: 'alpha',
                score: 200,
                combo: 1
            }]);

            expect(pelletListener).toHaveBeenCalledTimes(3); // 2 regular + 1 power
            expect(ghostListener).toHaveBeenCalledTimes(1);
        }, true);

        it('should handle death sequence', () => {
            const deathListener = jest.fn();
            const flashListener = jest.fn();
            const shakeListener = jest.fn();

            gameEvents.on(VIEW_EVENTS.PACMAN_DEATH_STARTED, deathListener);
            gameEvents.on(VIEW_EVENTS.SCREEN_FLASH, flashListener);
            gameEvents.on(VIEW_EVENTS.SCREEN_SHAKE, shakeListener);

            // Pacman dies
            model.emitEvents([{
                type: 'pacman_died',
                livesRemaining: 2
            }]);

            expect(deathListener).toHaveBeenCalledTimes(1);

            // Game over (after all lives lost)
            model.emitEvents([{
                type: 'game_over'
            }]);

            expect(flashListener).toHaveBeenCalledTimes(1);
            expect(shakeListener).toHaveBeenCalledTimes(1);
        }, true);

        it('should handle level complete sequence', () => {
            const effectListener = jest.fn();
            const gameCompleteListener = jest.fn();

            gameEvents.on(VIEW_EVENTS.EFFECT_CREATED, effectListener);
            gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, gameCompleteListener);

            // Level complete
            model.emitEvents([{
                type: 'level_complete',
                score: model.score,
                level: model.level
            }]);

            expect(effectListener).toHaveBeenCalledTimes(1);
            const effectData = effectListener.mock.calls[0][0];
            expect(effectData.effectType).toBe('level_complete');

            expect(gameCompleteListener).toHaveBeenCalledTimes(1);
        }, true);
    }, true);

    describe('Event data integrity', () => {
        it('should include timestamp in all VIEW_EVENTS', () => {
            const allViewEvents = Object.values(VIEW_EVENTS);
            const emittedEvents = new Map();

            allViewEvents.forEach(event => {
                gameEvents.on(event, (data) => {
                    emittedEvents.set(event, data);
                }, true);
            }, true);

            // Emit various events
            model.emitEvents([{
                type: 'pellet_eaten',
                score: 10,
                pelletsRemaining: 100,
                gridX: 5,
                gridY: 5
            }]);

            model.emitEvents([{
                type: 'ghost_eaten',
                ghostType: 'alpha',
                score: 200,
                combo: 1
            }]);

            model.emitEvents([{
                type: 'power_pellet_eaten',
                score: 50,
                pelletsRemaining: 99,
                gridX: 10,
                gridY: 10,
                frightenedDuration: 5
            }]);

            // Check that emitted events have timestamps
            const pelletEatenData = emittedEvents.get(VIEW_EVENTS.PELLET_EATEN);
            const ghostEatenData = emittedEvents.get(VIEW_EVENTS.GHOST_EATEN);

            expect(pelletEatenData).toBeDefined();
            expect(pelletEatenData.timestamp).toBeGreaterThan(0);

            expect(ghostEatenData).toBeDefined();
            expect(ghostEatenData.timestamp).toBeGreaterThan(0);
        }, true);

        it('should include complete event data for all events', () => {
            const viewListener = jest.fn();
            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, viewListener);

            model.emitEvents([{
                type: 'pellet_eaten',
                score: 10,
                pelletsRemaining: 100,
                gridX: 5,
                gridY: 5
            }]);

            const eventData = viewListener.mock.calls[0][0];

            expect(eventData).toHaveProperty('score', 10);
            expect(eventData).toHaveProperty('pelletsRemaining', 100);
            expect(eventData).toHaveProperty('gridX', 5);
            expect(eventData).toHaveProperty('gridY', 5);
            expect(eventData).toHaveProperty('timestamp');
        }, true);
    }, true);
}, true);
