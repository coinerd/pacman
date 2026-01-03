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
  });

  describe('once subscription', () => {
    test('should receive event only once', () => {
      eventBus.once(GAME_EVENTS.PELLET_EATEN, subscriber1);

      eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });
      eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 20 });

      expect(subscriber1).toHaveBeenCalledTimes(1);
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

  describe('clear', () => {
    test('should remove all subscribers', () => {
      eventBus.on(GAME_EVENTS.PELLET_EATEN, subscriber1);

      eventBus.clear();

      eventBus.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });

      expect(subscriber1).not.toHaveBeenCalled();
    });
  });
});
