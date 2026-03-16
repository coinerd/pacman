/**
 * EventBus Comprehensive Tests
 * Tests for event pub/sub system
 */

import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';

describe('EventBus', () => {
    beforeEach(() => {
        // Clear all event listeners before each test
        gameEvents.clear();
    });

    describe('Event Constants', () => {
        test('should have PELLET_EATEN event', () => {
            expect(GAME_EVENTS.PELLET_EATEN).toBeDefined();
        });

        test('should have POWER_PELLET_EATEN event', () => {
            expect(GAME_EVENTS.POWER_PELLET_EATEN).toBeDefined();
        });

        test('should have GHOST_EATEN event', () => {
            expect(GAME_EVENTS.GHOST_EATEN).toBeDefined();
        });

        test('should have GAME_OVER event', () => {
            expect(GAME_EVENTS.GAME_OVER).toBeDefined();
        });

        test('should have SCORE_CHANGED event', () => {
            expect(GAME_EVENTS.SCORE_CHANGED).toBeDefined();
        });

        test('should have LEVEL_COMPLETE event', () => {
            expect(GAME_EVENTS.LEVEL_COMPLETE).toBeDefined();
        });

        test('should have PAUSE_TOGGLED event', () => {
            expect(GAME_EVENTS.PAUSE_TOGGLED).toBeDefined();
        });

        test('should have DIRECTION_CHANGED event', () => {
            expect(GAME_EVENTS.DIRECTION_CHANGED).toBeDefined();
        });

        test('should have RESPAWN event', () => {
            expect(GAME_EVENTS.RESPAWN).toBeDefined();
        });
    });

    describe('Basic Pub/Sub', () => {
        test('should emit and receive events', () => {
            const callback = jest.fn();
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, callback);
            gameEvents.emit(GAME_EVENTS.PELLET_EATEN, { x: 1, y: 2 });
            expect(callback).toHaveBeenCalled();
        });

        test('should pass data to callback', () => {
            const callback = jest.fn();
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, callback);
            gameEvents.emit(GAME_EVENTS.PELLET_EATEN, { x: 1, y: 2 });
            expect(callback).toHaveBeenCalledWith({ x: 1, y: 2 });
        });

        test('should support multiple listeners', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, callback1);
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, callback2);
            gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {});
            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });

        test('should support once subscription', () => {
            const callback = jest.fn();
            gameEvents.once(GAME_EVENTS.PELLET_EATEN, callback);
            gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {});
            gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {});
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('should support off unsubscription', () => {
            const callback = jest.fn();
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, callback);
            gameEvents.off(GAME_EVENTS.PELLET_EATEN, callback);
            gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {});
            expect(callback).not.toHaveBeenCalled();
        });

        test('should support clear', () => {
            const callback = jest.fn();
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, callback);
            gameEvents.clear();
            gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {});
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('Event Flow', () => {
        test('should handle pellet eat flow', () => {
            const pelletCallback = jest.fn();
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, pelletCallback);
            gameEvents.emit(GAME_EVENTS.PELLET_EATEN, { gridX: 5, gridY: 10, score: 10 });
            expect(pelletCallback).toHaveBeenCalledWith(expect.objectContaining({ score: 10 }));
        });

        test('should handle power pellet flow', () => {
            const powerCallback = jest.fn();
            gameEvents.on(GAME_EVENTS.POWER_PELLET_EATEN, powerCallback);
            gameEvents.emit(GAME_EVENTS.POWER_PELLET_EATEN, { gridX: 0, gridY: 0, score: 50 });
            expect(powerCallback).toHaveBeenCalled();
        });

        test('should handle ghost eat flow', () => {
            const ghostCallback = jest.fn();
            gameEvents.on(GAME_EVENTS.GHOST_EATEN, ghostCallback);
            gameEvents.emit(GAME_EVENTS.GHOST_EATEN, { ghostType: 'alpha', score: 200 });
            expect(ghostCallback).toHaveBeenCalled();
        });

        test('should handle game over flow', () => {
            const gameOverCallback = jest.fn();
            gameEvents.on(GAME_EVENTS.GAME_OVER, gameOverCallback);
            gameEvents.emit(GAME_EVENTS.GAME_OVER, { score: 1000 });
            expect(gameOverCallback).toHaveBeenCalled();
        });

        test('should handle level complete flow', () => {
            const levelCallback = jest.fn();
            gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, levelCallback);
            gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, { level: 1 });
            expect(levelCallback).toHaveBeenCalled();
        });

        test('should handle respawn flow', () => {
            const respawnCallback = jest.fn();
            gameEvents.on(GAME_EVENTS.RESPAWN, respawnCallback);
            gameEvents.emit(GAME_EVENTS.RESPAWN, {});
            expect(respawnCallback).toHaveBeenCalled();
        });
    });
});
