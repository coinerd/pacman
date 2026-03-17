/**
 * Memory Leak Prevention Tests
 * Tests for proper cleanup of intervals, timeouts, and event listeners
 */

import { InputManager } from '../../src/input/InputManager.js';
import { InputAdapter } from '../../src/input/InputAdapter.js';

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
            const promise = manager.tempSwitch('mock', 10000);

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
});
