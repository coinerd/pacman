/**
 * Create a mock keyboard input API for InputController tests.
 * @returns {Object} keyboard mock plus cursor/wasd state references.
 */
export const createKeyboardInputMock = () => {
    const cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false }
    };

    const wasd = {
        W: { isDown: false },
        A: { isDown: false },
        S: { isDown: false },
        D: { isDown: false }
    };

    const keyboard = {
        createCursorKeys: jest.fn().mockReturnValue(cursors),
        addKeys: jest.fn().mockReturnValue(wasd),
        on: jest.fn(),
        off: jest.fn()
    };

    return {
        input: { keyboard },
        keyboard,
        cursors,
        wasd
    };
};

/**
 * Create a mock pointer input API for touch-driven interactions.
 * @returns {Object} input mock with emit helper.
 */
export const createTouchInputMock = () => {
    const handlers = {};

    const input = {
        on: jest.fn((event, handler) => {
            handlers[event] = handler;
        }),
        off: jest.fn((event) => {
            delete handlers[event];
        })
    };

    const emit = (event, payload) => {
        if (handlers[event]) {
            handlers[event](payload);
        }
    };

    return {
        input,
        handlers,
        emit
    };
};
