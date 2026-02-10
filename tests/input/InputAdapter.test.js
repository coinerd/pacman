/**
 * Tests for InputAdapter base class
 */

import { InputAdapter, INPUT_TYPES, INPUT_ACTIONS, InputEventNormalizer } from '../../src/input/InputAdapter.js';

describe('InputAdapter', () => {
    let adapter;

    beforeEach(() => {
        adapter = new InputAdapter();
    });

    afterEach(() => {
        adapter.destroy();
    });

    describe('constructor', () => {
        it('should initialize with empty listeners array', () => {
            expect(adapter.listeners).toEqual([]);
        });

        it('should be enabled by default', () => {
            expect(adapter.isEnabled).toBe(true);
        });

        it('should have name "base"', () => {
            expect(adapter.name).toBe('base');
        });
    });

    describe('onInput', () => {
        it('should add callback to listeners', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            expect(adapter.listeners).toContain(callback);
        });

        it('should return unsubscribe function', () => {
            const callback = jest.fn();
            const unsubscribe = adapter.onInput(callback);

            unsubscribe();
            expect(adapter.listeners).not.toContain(callback);
        });

        it('should allow multiple listeners', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            adapter.onInput(callback1);
            adapter.onInput(callback2);

            expect(adapter.listeners).toHaveLength(2);
        });
    });

    describe('emitInput', () => {
        it('should call all listeners with enriched input', () => {
            const callback = jest.fn();
            adapter.onInput(callback);

            const input = { type: INPUT_TYPES.DIRECTION, value: { x: 1, y: 0 } };
            adapter.emitInput(input);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[0][0]).toMatchObject({
                type: INPUT_TYPES.DIRECTION,
                value: { x: 1, y: 0 },
                source: 'base'
            });
            expect(callback.mock.calls[0][0].timestamp).toBeDefined();
        });

        it('should not emit when disabled', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.disable();

            adapter.emitInput({ type: INPUT_TYPES.DIRECTION, value: { x: 1, y: 0 } });

            expect(callback).not.toHaveBeenCalled();
        });

        it('should preserve custom timestamp if provided', () => {
            const callback = jest.fn();
            adapter.onInput(callback);

            const customTimestamp = 12345;
            adapter.emitInput({
                type: INPUT_TYPES.DIRECTION,
                value: { x: 1, y: 0 },
                timestamp: customTimestamp
            });

            expect(callback.mock.calls[0][0].timestamp).toBe(customTimestamp);
        });
    });

    describe('enable/disable', () => {
        it('should set isEnabled to true when enable is called', () => {
            adapter.disable();
            adapter.enable();
            expect(adapter.isEnabled).toBe(true);
        });

        it('should set isEnabled to false when disable is called', () => {
            adapter.enable();
            adapter.disable();
            expect(adapter.isEnabled).toBe(false);
        });
    });

    describe('getCurrentInput', () => {
        it('should return null by default', () => {
            expect(adapter.getCurrentInput()).toBeNull();
        });
    });

    describe('update', () => {
        it('should not throw when called', () => {
            expect(() => adapter.update(16)).not.toThrow();
        });
    });

    describe('destroy', () => {
        it('should clear all listeners', () => {
            adapter.onInput(jest.fn());
            adapter.onInput(jest.fn());

            adapter.destroy();

            expect(adapter.listeners).toEqual([]);
        });

        it('should set isEnabled to false', () => {
            adapter.destroy();
            expect(adapter.isEnabled).toBe(false);
        });
    });
});

describe('INPUT_TYPES', () => {
    it('should define all expected input types', () => {
        expect(INPUT_TYPES.DIRECTION).toBe('direction');
        expect(INPUT_TYPES.ACTION).toBe('action');
        expect(INPUT_TYPES.PAUSE).toBe('pause');
        expect(INPUT_TYPES.RESUME).toBe('resume');
        expect(INPUT_TYPES.RESTART).toBe('restart');
        expect(INPUT_TYPES.MENU).toBe('menu');
        expect(INPUT_TYPES.REPLAY_TOGGLE).toBe('replay_toggle');
        expect(INPUT_TYPES.LOAD_REPLAY).toBe('load_replay');
    });
});

describe('INPUT_ACTIONS', () => {
    it('should define all expected actions', () => {
        expect(INPUT_ACTIONS.PAUSE).toBe('pause');
        expect(INPUT_ACTIONS.RESUME).toBe('resume');
        expect(INPUT_ACTIONS.RESTART).toBe('restart');
        expect(INPUT_ACTIONS.RETURN_TO_MENU).toBe('return_to_menu');
        expect(INPUT_ACTIONS.TOGGLE_REPLAY).toBe('toggle_replay');
        expect(INPUT_ACTIONS.LOAD_REPLAY).toBe('load_replay');
    });
});

describe('InputEventNormalizer', () => {
    describe('normalizeDirection', () => {
        it('should return null for null/undefined', () => {
            expect(InputEventNormalizer.normalizeDirection(null)).toBeNull();
            expect(InputEventNormalizer.normalizeDirection(undefined)).toBeNull();
        });

        it('should return direction object as-is if it has x/y', () => {
            const dir = { x: 1, y: 0, angle: 0 };
            expect(InputEventNormalizer.normalizeDirection(dir)).toBe(dir);
        });

        it('should convert string key to direction', () => {
            const result = InputEventNormalizer.normalizeDirection('UP');
            expect(result).toEqual({ x: 0, y: -1, angle: 270 });
        });
    });

    describe('directionFromKey', () => {
        it('should return correct direction for UP', () => {
            expect(InputEventNormalizer.directionFromKey('UP')).toEqual({ x: 0, y: -1, angle: 270 });
        });

        it('should return correct direction for DOWN', () => {
            expect(InputEventNormalizer.directionFromKey('DOWN')).toEqual({ x: 0, y: 1, angle: 90 });
        });

        it('should return correct direction for LEFT', () => {
            expect(InputEventNormalizer.directionFromKey('LEFT')).toEqual({ x: -1, y: 0, angle: 180 });
        });

        it('should return correct direction for RIGHT', () => {
            expect(InputEventNormalizer.directionFromKey('RIGHT')).toEqual({ x: 1, y: 0, angle: 0 });
        });

        it('should be case-insensitive', () => {
            expect(InputEventNormalizer.directionFromKey('up')).toEqual({ x: 0, y: -1, angle: 270 });
            expect(InputEventNormalizer.directionFromKey('Down')).toEqual({ x: 0, y: 1, angle: 90 });
        });

        it('should return null for invalid key', () => {
            expect(InputEventNormalizer.directionFromKey('INVALID')).toBeNull();
        });
    });

    describe('normalizeAction', () => {
        it('should return null for null/undefined', () => {
            expect(InputEventNormalizer.normalizeAction(null)).toBeNull();
            expect(InputEventNormalizer.normalizeAction(undefined)).toBeNull();
        });

        it('should convert action to lowercase', () => {
            expect(InputEventNormalizer.normalizeAction('PAUSE')).toBe('pause');
            expect(InputEventNormalizer.normalizeAction('Restart')).toBe('restart');
        });
    });
});
