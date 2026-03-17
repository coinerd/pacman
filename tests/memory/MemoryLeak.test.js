/**
 * Memory Leak Prevention Tests
 * Tests for proper cleanup of intervals, timeouts, and event listeners
 */

import { InputManager } from '../../src/input/InputManager.js';
import { InputAdapter } from '../../src/input/InputAdapter.js';
import { GameController } from '../../src/controllers/GameController.js';
import { gameEvents } from '../../src/core/EventBus.js';

// Mock adapter for testing
class MockAdapter extends InputAdapter {
    constructor() {
        super();
        this.destroyed = false;
    }

    destroy() {
        this.destroyed = true;
    }
}

// Mock GameModel for testing
class MockGameModel {
    constructor() {
        this.state = { isGameOver: false, isDying: false, isPaused: false };
    }

    setInputDirection() {}
    togglePaused() {}
}

describe('Memory Leak Prevention', () => {
    describe('InputManager', () => {
        test('should track pending timeouts', () => {
            const manager = new InputManager();
            const adapter = new MockAdapter();
            manager.registerAdapter('mock', adapter);

            expect(manager.pendingTimeouts).toBeInstanceOf(Set);
            expect(manager.pendingTimeouts.size).toBe(0);

            manager.destroy();
        });

        test('should clear pending timeouts on destroy', async () => {
            const manager = new InputManager();
            const adapter = new MockAdapter();
            manager.registerAdapter('mock', adapter);

            // Start temp switch with long duration
            manager.tempSwitch('mock', 10000);

            // Verify timeout is tracked
            expect(manager.pendingTimeouts.size).toBe(1);

            // Destroy before timeout completes
            manager.destroy();

            // Timeout should be cleared
            expect(manager.pendingTimeouts.size).toBe(0);
        });

        test('should remove timeout from tracking when it completes', async () => {
            const manager = new InputManager();
            const adapter = new MockAdapter();
            manager.registerAdapter('mock', adapter);

            // Start temp switch with short duration
            const promise = manager.tempSwitch('mock', 10);

            // Verify timeout is tracked
            expect(manager.pendingTimeouts.size).toBe(1);

            // Wait for timeout to complete
            await promise;

            // Timeout should be removed from tracking
            expect(manager.pendingTimeouts.size).toBe(0);

            manager.destroy();
        });

        test('should destroy all adapters on destroy', () => {
            const manager = new InputManager();
            const adapter1 = new MockAdapter();
            const adapter2 = new MockAdapter();

            manager.registerAdapter('adapter1', adapter1);
            manager.registerAdapter('adapter2', adapter2);

            expect(adapter1.destroyed).toBe(false);
            expect(adapter2.destroyed).toBe(false);

            manager.destroy();

            expect(adapter1.destroyed).toBe(true);
            expect(adapter2.destroyed).toBe(true);
        });
    });

    describe('GameController', () => {
        test('should have eventUnsubscribers array initialized', () => {
            const model = new MockGameModel();
            const controller = new GameController({ gameModel: model });

            expect(controller.eventUnsubscribers).toEqual([]);
            expect(controller.eventUnsubscribers.length).toBe(0);

            controller.destroy();
        });

        test('should track event subscriptions in bindSceneTransitionEvents', () => {
            const model = new MockGameModel();
            const controller = new GameController({ gameModel: model });

            controller.bindSceneTransitionEvents();

            // Should have 6 event subscriptions
            expect(controller.eventUnsubscribers.length).toBe(6);

            controller.destroy();
        });

        test('should unsubscribe from all events on destroy', () => {
            const model = new MockGameModel();
            const controller = new GameController({ gameModel: model });

            controller.bindSceneTransitionEvents();

            // Get initial listener counts
            const initialWinCount = gameEvents.listenerCount('GAME_WIN');
            const initialOverCount = gameEvents.listenerCount('GAME_OVER');

            // Verify listeners were added
            expect(gameEvents.listenerCount('GAME_WIN')).toBe(initialWinCount);
            expect(gameEvents.listenerCount('GAME_OVER')).toBe(initialOverCount);

            // Destroy should remove all listeners
            controller.destroy();

            // Listeners should be removed
            expect(gameEvents.listenerCount('GAME_WIN')).toBe(initialWinCount - 1);
            expect(gameEvents.listenerCount('GAME_OVER')).toBe(initialOverCount - 1);
        });

        test('should clear eventUnsubscribers array after destroy', () => {
            const model = new MockGameModel();
            const controller = new GameController({ gameModel: model });

            controller.bindSceneTransitionEvents();
            expect(controller.eventUnsubscribers.length).toBe(6);

            controller.destroy();

            expect(controller.eventUnsubscribers.length).toBe(0);
        });

        test('should destroy input manager on destroy', () => {
            const model = new MockGameModel();
            const inputManager = new InputManager();
            const adapter = new MockAdapter();
            inputManager.registerAdapter('mock', adapter);

            const controller = new GameController({
                gameModel: model,
                inputManager: inputManager
            });

            expect(adapter.destroyed).toBe(false);

            controller.destroy();

            expect(adapter.destroyed).toBe(true);
            expect(controller.inputManager).toBeNull();
        });

        test('should clear model reference on destroy', () => {
            const model = new MockGameModel();
            const controller = new GameController({ gameModel: model });

            expect(controller.gameModel).toBe(model);

            controller.destroy();

            expect(controller.gameModel).toBeNull();
        });
    });
});
