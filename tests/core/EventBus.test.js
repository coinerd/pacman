// tests/core/EventBus.test.js

import { EventBus, GAME_EVENTS } from '../../src/core/EventBus.js';

describe('EventBus', () => {
    let eventBus;
    let subscriber1;
    let subscriber2;
    let receivedEvents;

    beforeEach(() => {
        eventBus = new EventBus();
        receivedEvents = [];
        subscriber1 = jest.fn((data) => receivedEvents.push({ sub: 1, data }));
        subscriber2 = jest.fn((data) => receivedEvents.push({ sub: 2, data }));
    });

    afterEach(() => {
        eventBus.clear();
    });

    describe('subscription', () => {
        test('should allow subscribing to events', () => {
            const unsubscribe = eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

            expect(typeof unsubscribe).toBe('function');
        });

        test('should pass data to subscribers', () => {
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });

            expect(subscriber1).toHaveBeenCalledWith({ score: 10 });
        });

        test('should support multiple subscribers', () => {
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber2);

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });

            expect(subscriber1).toHaveBeenCalled();
            expect(subscriber2).toHaveBeenCalled();
        });

        test('should throw if callback is not a function', () => {
            expect(() => {
                eventBus.on(GAME_EVENTS.PELLET_EATEN, 'not a function');
            }).toThrow('Callback must be a function');
        });

        test('should throw if callback is null', () => {
            expect(() => {
                eventBus.on(GAME_EVENTS.PELLET_EATEN, null);
            }).toThrow('Callback must be a function');
        });

        test('should throw if callback is undefined', () => {
            expect(() => {
                eventBus.on(GAME_EVENTS.PELLET_EATEN, undefined);
            }).toThrow('Callback must be a function');
        });
    });

    describe('unsubscription', () => {
        test('should stop receiving events after unsubscribe', () => {
            const unsubscribe = eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

            unsubscribe();

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });

            expect(subscriber1).not.toHaveBeenCalled();
        });

        test('should allow specific callback unsubscription', () => {
            const otherSub = jest.fn();
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);
            eventBus.on(GAME_EVENTS.PELLET_EATEN, otherSub);

            const unsubscribe = eventBus.off(GAME_EVENTS.PELLET_EATEN, subscriber1);
            unsubscribe();

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });

            expect(subscriber1).not.toHaveBeenCalled();
            expect(otherSub).toHaveBeenCalled();
        });

        test('should return empty function when off called for non-existent event', () => {
            const unsubscribe = eventBus.off('non-existent-event', subscriber1);

            expect(typeof unsubscribe).toBe('function');
        });

        test('should return empty function when callback not found', () => {
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

            const unsubscribe = eventBus.off(GAME_EVENTS.PELLET_EATEN, () => {});

            expect(typeof unsubscribe).toBe('function');
        });

        test('should clean up empty listener arrays', () => {
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

            const unsubscribe = eventBus.off(GAME_EVENTS.PELLET_EATEN, subscriber1);
            unsubscribe();

            expect(eventBus.listeners.has(GAME_EVENTS.PELLET_EATEN)).toBe(false);
        });
    });

    describe('once subscription', () => {
        test('should receive event only once', () => {
            eventBus.once(GAME_EVENTS.PELLET_EATEN, subscriber1);

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });
            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 20 });

            expect(subscriber1).toHaveBeenCalledTimes(1);
        });

        test('should receive correct data', () => {
            eventBus.once(GAME_EVENTS.PELLET_EATEN, subscriber1);

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });

            expect(subscriber1).toHaveBeenCalledWith({ score: 10 });
        });

        test('should support context', () => {
            const context = { name: 'TestContext' };
            const fn = jest.fn(function() { return this.name; });

            eventBus.once(GAME_EVENTS.PELLET_EATEN, fn, context);

            eventBus.emit(GAME_EVENTS.PELLET_EATEN);

            expect(fn.mock.contexts[0]).toBe(context);
        });
    });

    describe('context support', () => {
        test('should call callback with provided context', () => {
            const context = { name: 'TestContext' };
            const fn = jest.fn(function() { return this.name; });

            eventBus.on(GAME_EVENTS.PELLET_EATEN, fn, context);

            eventBus.emit(GAME_EVENTS.PELLET_EATEN);

            expect(fn.mock.contexts[0]).toBe(context);
        });
    });

    describe('emit', () => {
        test('should not throw when emitting to no listeners', () => {
            expect(() => {
                eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });
            }).not.toThrow();
        });

        test('should handle null data', () => {
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, null);

            expect(subscriber1).toHaveBeenCalledWith(null);
        });

        test('should handle undefined data', () => {
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

            eventBus.emit(GAME_EVENTS.PELLET_EATEN);

            // Default value is null
            expect(subscriber1).toHaveBeenCalledWith(null);
        });

        test('should handle error in listener gracefully', () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation();
            const errorFn = jest.fn(() => {
                throw new Error('Test error');
            });

            eventBus.on(GAME_EVENTS.PELLET_EATEN, errorFn);
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });

            expect(errorFn).toHaveBeenCalled();
            expect(subscriber1).toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalled();

            errorSpy.mockRestore();
        });

        test('should handle null listener gracefully', () => {
            // Manually add a null listener to test the null check
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);
            eventBus.listeners.get(GAME_EVENTS.PELLET_EATEN).push(null);

            expect(() => {
                eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });
            }).not.toThrow();

            expect(subscriber1).toHaveBeenCalled();
        });

        test('should continue calling listeners after one unsubscribes during emit', () => {
            // Test that if one listener unsubscribes another during emit,
            // the remaining listeners are still called
            const subscriber1Unsub = jest.fn();
            const subscriber2 = jest.fn();
            const subscriber3 = jest.fn();

            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1Unsub);
            const unsubscribe2 = eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber2);

            // First listener will unsubscribe the second listener
            eventBus.on(GAME_EVENTS.PELLET_EATEN, () => {
                unsubscribe2();
            });
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber3);

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });

            // All listeners except the unsubscribed one should be called
            expect(subscriber1Unsub).toHaveBeenCalled();
            expect(subscriber2).toHaveBeenCalled(); // Was called before being unsubscribed
            expect(subscriber3).toHaveBeenCalled(); // Should still be called despite subscriber2 being removed
        });
    });

    describe('clear', () => {
        test('should remove all subscribers', () => {
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

            eventBus.clear();

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });

            expect(subscriber1).not.toHaveBeenCalled();
        });

        test('should remove all event types', () => {
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);
            eventBus.on(GAME_EVENTS.GHOST_EATEN, subscriber2);

            eventBus.clear();

            eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });
            eventBus.emit(GAME_EVENTS.GHOST_EATEN, { score: 200 });

            expect(subscriber1).not.toHaveBeenCalled();
            expect(subscriber2).not.toHaveBeenCalled();
        });
    });

    describe('listenerCount', () => {
        test('should return 0 for event with no listeners', () => {
            expect(eventBus.listenerCount(GAME_EVENTS.PELLET_EATEN)).toBe(0);
        });

        test('should return correct count for event with listeners', () => {
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);
            eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber2);

            expect(eventBus.listenerCount(GAME_EVENTS.PELLET_EATEN)).toBe(2);
        });

        test('should update count after unsubscribe', () => {
            const unsubscribe = eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

            expect(eventBus.listenerCount(GAME_EVENTS.PELLET_EATEN)).toBe(1);

            unsubscribe();

            expect(eventBus.listenerCount(GAME_EVENTS.PELLET_EATEN)).toBe(0);
        });
    });

    describe('GAME_EVENTS constants', () => {
        test('should have all required event types', () => {
            expect(GAME_EVENTS.PELLET_EATEN).toBe('pellet:eaten');
            expect(GAME_EVENTS.POWER_PELLET_EATEN).toBe('power-pellet:eaten');
            expect(GAME_EVENTS.FRUIT_EATEN).toBe('fruit:eaten');
            expect(GAME_EVENTS.GHOST_EATEN).toBe('ghost:eaten');
            expect(GAME_EVENTS.LEVEL_COMPLETE).toBe('level:complete');
            expect(GAME_EVENTS.GAME_OVER).toBe('game:over');
            expect(GAME_EVENTS.LIVES_LOST).toBe('lives:lost');
            expect(GAME_EVENTS.SCORE_CHANGED).toBe('score:changed');
            expect(GAME_EVENTS.HIGH_SCORE_CHANGED).toBe('high-score:changed');
            expect(GAME_EVENTS.PAUSE_TOGGLED).toBe('pause:toggled');
            expect(GAME_EVENTS.GAME_STARTED).toBe('game:started');
            expect(GAME_EVENTS.GAME_RESET).toBe('game:reset');
            expect(GAME_EVENTS.ACHIEVEMENT_UNLOCKED).toBe('achievement:unlocked');
            expect(GAME_EVENTS.DIRECTION_CHANGED).toBe('direction:changed');
            expect(GAME_EVENTS.RESPAWN).toBe('game:respawn');
            expect(GAME_EVENTS.BOSS_SPAWNED).toBe('boss:spawned');
            expect(GAME_EVENTS.BOSS_DEFEATED).toBe('boss:defeated');
        });
    });
});
