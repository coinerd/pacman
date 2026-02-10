/**
 * Tests for KeyboardAdapter
 */

import { KeyboardAdapter } from '../../src/input/adapters/KeyboardAdapter.js';
import { INPUT_TYPES, INPUT_ACTIONS } from '../../src/input/InputAdapter.js';
import { directions } from '../../src/config/gameConfig.js';

// Mock Phaser input
const createMockPhaserInput = () => {
    const listeners = {};

    return {
        keyboard: {
            createCursorKeys: jest.fn(() => ({
                left: { isDown: false },
                right: { isDown: false },
                up: { isDown: false },
                down: { isDown: false }
            })),
            addKeys: jest.fn(() => ({
                W: { isDown: false },
                A: { isDown: false },
                S: { isDown: false },
                D: { isDown: false }
            })),
            on: jest.fn((event, callback) => {
                if (!listeners[event]) {listeners[event] = [];}
                listeners[event].push(callback);
            }),
            off: jest.fn((event, callback) => {
                if (listeners[event]) {
                    const index = listeners[event].indexOf(callback);
                    if (index !== -1) {listeners[event].splice(index, 1);}
                }
            }),
            // Helper to trigger events in tests
            _trigger: (event) => {
                if (listeners[event]) {
                    listeners[event].forEach(cb => cb());
                }
            }
        },
        _listeners: listeners
    };
};

describe('KeyboardAdapter', () => {
    let mockInput;
    let adapter;

    beforeEach(() => {
        mockInput = createMockPhaserInput();
        adapter = new KeyboardAdapter(mockInput);
    });

    afterEach(() => {
        if (adapter) {
            adapter.destroy();
        }
    });

    describe('constructor', () => {
        it('should set name to "keyboard"', () => {
            expect(adapter.name).toBe('keyboard');
        });

        it('should store phaser input reference', () => {
            expect(adapter.phaserInput).toBe(mockInput);
        });

        it('should use default options', () => {
            expect(adapter.options.useWASD).toBe(true);
            expect(adapter.options.useArrowKeys).toBe(true);
        });

        it('should accept custom options', () => {
            const customAdapter = new KeyboardAdapter(mockInput, { useWASD: false });
            expect(customAdapter.options.useWASD).toBe(false);
            customAdapter.destroy();
        });

        it('should setup keyboard on construction', () => {
            expect(mockInput.keyboard.createCursorKeys).toHaveBeenCalled();
            expect(mockInput.keyboard.addKeys).toHaveBeenCalledWith('W,A,S,D');
        });

        it('should warn if keyboard not available', () => {
            console.warn = jest.fn();
            const invalidAdapter = new KeyboardAdapter({});
            expect(console.warn).toHaveBeenCalledWith('KeyboardAdapter: Phaser keyboard not available');
            invalidAdapter.destroy();
        });
    });

    describe('action keys', () => {
        it('should setup pause key listener', () => {
            const callback = jest.fn();
            adapter.onInput(callback);

            mockInput.keyboard._trigger('keydown-P');

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.PAUSE
            }));
        });

        it('should setup return to menu key listener', () => {
            const callback = jest.fn();
            adapter.onInput(callback);

            mockInput.keyboard._trigger('keydown-ESC');

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.RETURN_TO_MENU
            }));
        });

        it('should setup replay toggle key listener', () => {
            const callback = jest.fn();
            adapter.onInput(callback);

            mockInput.keyboard._trigger('keydown-R');

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.TOGGLE_REPLAY
            }));
        });

        it('should setup load replay key listener', () => {
            const callback = jest.fn();
            adapter.onInput(callback);

            mockInput.keyboard._trigger('keydown-L');

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.LOAD_REPLAY
            }));
        });
    });

    describe('directional input', () => {
        it('should return LEFT when left arrow is down', () => {
            adapter.cursors.left.isDown = true;
            const input = adapter.getCurrentInput();

            expect(input).toEqual({
                type: INPUT_TYPES.DIRECTION,
                value: directions.LEFT
            });
        });

        it('should return RIGHT when right arrow is down', () => {
            adapter.cursors.right.isDown = true;
            const input = adapter.getCurrentInput();

            expect(input).toEqual({
                type: INPUT_TYPES.DIRECTION,
                value: directions.RIGHT
            });
        });

        it('should return UP when up arrow is down', () => {
            adapter.cursors.up.isDown = true;
            const input = adapter.getCurrentInput();

            expect(input).toEqual({
                type: INPUT_TYPES.DIRECTION,
                value: directions.UP
            });
        });

        it('should return DOWN when down arrow is down', () => {
            adapter.cursors.down.isDown = true;
            const input = adapter.getCurrentInput();

            expect(input).toEqual({
                type: INPUT_TYPES.DIRECTION,
                value: directions.DOWN
            });
        });

        it('should return LEFT when A key is down', () => {
            adapter.cursors = null; // Disable cursors
            adapter.wasd.A.isDown = true;
            const input = adapter.getCurrentInput();

            expect(input).toEqual({
                type: INPUT_TYPES.DIRECTION,
                value: directions.LEFT
            });
        });

        it('should return RIGHT when D key is down', () => {
            adapter.cursors = null;
            adapter.wasd.D.isDown = true;
            const input = adapter.getCurrentInput();

            expect(input).toEqual({
                type: INPUT_TYPES.DIRECTION,
                value: directions.RIGHT
            });
        });

        it('should return UP when W key is down', () => {
            adapter.cursors = null;
            adapter.wasd.W.isDown = true;
            const input = adapter.getCurrentInput();

            expect(input).toEqual({
                type: INPUT_TYPES.DIRECTION,
                value: directions.UP
            });
        });

        it('should return DOWN when S key is down', () => {
            adapter.cursors = null;
            adapter.wasd.S.isDown = true;
            const input = adapter.getCurrentInput();

            expect(input).toEqual({
                type: INPUT_TYPES.DIRECTION,
                value: directions.DOWN
            });
        });

        it('should return null when no keys are down', () => {
            const input = adapter.getCurrentInput();
            expect(input).toBeNull();
        });

        it('should return null when disabled', () => {
            adapter.disable();
            adapter.cursors.left.isDown = true;
            const input = adapter.getCurrentInput();
            expect(input).toBeNull();
        });
    });

    describe('update', () => {
        it('should emit direction input when keys are pressed', () => {
            const callback = jest.fn();
            adapter.onInput(callback);

            adapter.cursors.left.isDown = true;
            adapter.update(16);

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                type: INPUT_TYPES.DIRECTION,
                value: directions.LEFT
            }));
        });

        it('should not emit when no keys are pressed', () => {
            const callback = jest.fn();
            adapter.onInput(callback);

            adapter.update(16);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('should remove all keyboard listeners', () => {
            adapter.destroy();
            expect(mockInput.keyboard.off).toHaveBeenCalledTimes(4);
        });

        it('should clear references', () => {
            adapter.destroy();
            expect(adapter.cursors).toBeNull();
            expect(adapter.wasd).toBeNull();
        });
    });
});
