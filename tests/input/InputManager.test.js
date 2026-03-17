/**
 * Tests for InputManager
 */

import { InputManager } from '../../src/input/InputManager.js';
import { InputAdapter, INPUT_TYPES } from '../../src/input/InputAdapter.js';

// Mock adapter for testing
class MockAdapter extends InputAdapter {
    constructor(name = 'mock') {
        super();
        this.name = name;
        this.updateCalled = false;
    }

    update(_deltaTime) {
        this.updateCalled = true;
    }
}

describe('InputManager', () => {
    let manager;

    beforeEach(() => {
        manager = new InputManager();
    });

    afterEach(() => {
        manager.destroy();
    });

    describe('constructor', () => {
        it('should initialize with empty adapters map', () => {
            expect(manager.adapters.size).toBe(0);
        });

        it('should initialize with empty active adapters set', () => {
            expect(manager.activeAdapters.size).toBe(0);
        });

        it('should have default options', () => {
            expect(manager.options.allowMultipleActive).toBe(false);
        });

        it('should respect custom options', () => {
            const customManager = new InputManager({ allowMultipleActive: true });
            expect(customManager.options.allowMultipleActive).toBe(true);
            customManager.destroy();
        });
    });

    describe('registerAdapter', () => {
        it('should register an adapter', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);

            expect(manager.adapters.has('test')).toBe(true);
            expect(manager.getAdapter('test')).toBe(adapter);
        });

        it('should throw if adapter is not InputAdapter instance', () => {
            expect(() => {
                manager.registerAdapter('invalid', {});
            }).toThrow('Adapter must be an instance of InputAdapter');
        });

        it('should auto-activate default adapter', () => {
            const managerWithDefault = new InputManager({ defaultAdapter: 'default' });
            const adapter = new MockAdapter();

            managerWithDefault.registerAdapter('default', adapter);

            expect(managerWithDefault.activeAdapters.has('default')).toBe(true);
            managerWithDefault.destroy();
        });

        it('should replace existing adapter with same name', () => {
            const adapter1 = new MockAdapter();
            const adapter2 = new MockAdapter();

            manager.registerAdapter('test', adapter1);
            manager.registerAdapter('test', adapter2);

            expect(manager.getAdapter('test')).toBe(adapter2);
        });

        it('should return manager for chaining', () => {
            const adapter = new MockAdapter();
            const result = manager.registerAdapter('test', adapter);

            expect(result).toBe(manager);
        });
    });

    describe('unregisterAdapter', () => {
        it('should remove adapter', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.unregisterAdapter('test');

            expect(manager.adapters.has('test')).toBe(false);
        });

        it('should deactivate adapter before removing', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');

            manager.unregisterAdapter('test');

            expect(manager.activeAdapters.has('test')).toBe(false);
        });

        it('should not throw for non-existent adapter', () => {
            expect(() => {
                manager.unregisterAdapter('nonexistent');
            }).not.toThrow();
        });
    });

    describe('setActiveAdapter', () => {
        it('should activate single adapter', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');

            expect(manager.activeAdapters.has('test')).toBe(true);
            expect(adapter.isEnabled).toBe(true);
        });

        it('should deactivate previous adapter', () => {
            const adapter1 = new MockAdapter();
            const adapter2 = new MockAdapter();

            manager.registerAdapter('first', adapter1);
            manager.registerAdapter('second', adapter2);

            manager.setActiveAdapter('first');
            manager.setActiveAdapter('second');

            expect(manager.activeAdapters.has('first')).toBe(false);
            expect(manager.activeAdapters.has('second')).toBe(true);
            expect(adapter1.isEnabled).toBe(false);
            expect(adapter2.isEnabled).toBe(true);
        });

        it('should allow multiple active when configured', () => {
            const multiManager = new InputManager({ allowMultipleActive: true });
            const adapter1 = new MockAdapter();
            const adapter2 = new MockAdapter();

            multiManager.registerAdapter('first', adapter1);
            multiManager.registerAdapter('second', adapter2);
            multiManager.setActiveAdapter(['first', 'second']);

            expect(multiManager.activeAdapters.has('first')).toBe(true);
            expect(multiManager.activeAdapters.has('second')).toBe(true);
            multiManager.destroy();
        });

        it('should throw when trying to activate multiple without permission', () => {
            expect(() => {
                manager.setActiveAdapter(['first', 'second']);
            }).toThrow('Multiple active adapters not allowed');
        });

        it('should warn for non-existent adapter', () => {
            console.warn = jest.fn();
            manager.setActiveAdapter('nonexistent');
            expect(console.warn).toHaveBeenCalledWith('InputManager: Adapter \'nonexistent\' not found');
        });
    });

    describe('onInput', () => {
        it('should register global listener', () => {
            const callback = jest.fn();
            manager.onInput(callback);

            expect(manager.globalListeners).toContain(callback);
        });

        it('should return unsubscribe function', () => {
            const callback = jest.fn();
            const unsubscribe = manager.onInput(callback);

            unsubscribe();
            expect(manager.globalListeners).not.toContain(callback);
        });

        it('should receive input from active adapter', () => {
            const callback = jest.fn();
            const adapter = new MockAdapter();

            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');
            manager.onInput(callback);

            adapter.emitInput({ type: INPUT_TYPES.DIRECTION, value: { x: 1, y: 0 } });

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[0][0].type).toBe(INPUT_TYPES.DIRECTION);
            expect(callback.mock.calls[0][0].adapter).toBe('test');
        });

        it('should not receive input when paused', () => {
            const callback = jest.fn();
            const adapter = new MockAdapter();

            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');
            manager.onInput(callback);
            manager.pause();

            adapter.emitInput({ type: INPUT_TYPES.DIRECTION, value: { x: 1, y: 0 } });

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update active adapters', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');

            manager.update(16);

            expect(adapter.updateCalled).toBe(true);
        });

        it('should not update when paused', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');
            manager.pause();

            manager.update(16);

            expect(adapter.updateCalled).toBe(false);
        });

        it('should update all active adapters', () => {
            const multiManager = new InputManager({ allowMultipleActive: true });
            const adapter1 = new MockAdapter();
            const adapter2 = new MockAdapter();

            multiManager.registerAdapter('first', adapter1);
            multiManager.registerAdapter('second', adapter2);
            multiManager.setActiveAdapter(['first', 'second']);

            multiManager.update(16);

            expect(adapter1.updateCalled).toBe(true);
            expect(adapter2.updateCalled).toBe(true);
            multiManager.destroy();
        });
    });

    describe('pause/resume', () => {
        it('should set isPaused to true when paused', () => {
            manager.pause();
            expect(manager.isPaused).toBe(true);
        });

        it('should set isPaused to false when resumed', () => {
            manager.pause();
            manager.resume();
            expect(manager.isPaused).toBe(false);
        });
    });

    describe('input history', () => {
        it('should record input in history', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');

            adapter.emitInput({ type: INPUT_TYPES.DIRECTION, value: { x: 1, y: 0 } });

            expect(manager.inputHistory).toHaveLength(1);
        });

        it('should limit history size', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');

            // Add more inputs than max history size
            for (let i = 0; i < 1100; i++) {
                adapter.emitInput({ type: INPUT_TYPES.DIRECTION, value: { x: 1, y: 0 } });
            }

            expect(manager.inputHistory.length).toBeLessThanOrEqual(1000);
        });

        it('should return recent history with getInputHistory(count)', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');

            for (let i = 0; i < 5; i++) {
                adapter.emitInput({ type: INPUT_TYPES.DIRECTION, value: { x: i, y: 0 } });
            }

            const recent = manager.getInputHistory(3);
            expect(recent).toHaveLength(3);
            expect(recent[2].value.x).toBe(4); // Most recent
        });

        it('should clear history', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');

            adapter.emitInput({ type: INPUT_TYPES.DIRECTION, value: { x: 1, y: 0 } });
            manager.clearHistory();

            expect(manager.inputHistory).toHaveLength(0);
        });
    });

    describe('getStatus', () => {
        it('should return current status', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');

            const status = manager.getStatus();

            expect(status.registeredAdapters).toContain('test');
            expect(status.activeAdapters).toContain('test');
            expect(status.isPaused).toBe(false);
        });
    });

    describe('destroy', () => {
        it('should destroy all adapters', () => {
            const adapter = new MockAdapter();
            const destroySpy = jest.spyOn(adapter, 'destroy');

            manager.registerAdapter('test', adapter);
            manager.destroy();

            expect(destroySpy).toHaveBeenCalled();
        });

        it('should clear all collections', () => {
            const adapter = new MockAdapter();
            manager.registerAdapter('test', adapter);
            manager.setActiveAdapter('test');
            manager.onInput(jest.fn());

            manager.destroy();

            expect(manager.adapters.size).toBe(0);
            expect(manager.activeAdapters.size).toBe(0);
            expect(manager.globalListeners).toEqual([]);
        });
    });
});
