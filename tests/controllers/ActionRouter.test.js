/**
 * Tests for ActionRouter and clean GameController (Phase 6)
 */

import { ActionRouter, ActionContext, GameController } from '../../src/controllers/ActionRouter.js';
import { INPUT_TYPES, INPUT_ACTIONS } from '../../src/input/InputAdapter.js';
import { gameEvents, GAME_EVENTS } from '../../src/core/EventBus.js';

// Mock directions
const directions = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

describe('ActionContext', () => {
    let context;
    let mockGameModel;

    beforeEach(() => {
        mockGameModel = {
            state: {
                isGameOver: false,
                isDying: false,
                isPaused: false
            }
        };
        context = new ActionContext(mockGameModel);
    });

    describe('canAcceptInput', () => {
        it('should return true when game is active', () => {
            expect(context.canAcceptInput()).toBe(true);
        });

        it('should return false when game is over', () => {
            mockGameModel.state.isGameOver = true;
            expect(context.canAcceptInput()).toBe(false);
        });

        it('should return false when dying', () => {
            mockGameModel.state.isDying = true;
            expect(context.canAcceptInput()).toBe(false);
        });
    });

    describe('canPause', () => {
        it('should return true when game is active and not paused', () => {
            expect(context.canPause()).toBe(true);
        });

        it('should return false when already paused', () => {
            mockGameModel.state.isPaused = true;
            expect(context.canPause()).toBe(false);
        });

        it('should return false when game is over', () => {
            mockGameModel.state.isGameOver = true;
            expect(context.canPause()).toBe(false);
        });
    });

    describe('canResume', () => {
        it('should return false when not paused', () => {
            expect(context.canResume()).toBe(false);
        });

        it('should return true when paused', () => {
            mockGameModel.state.isPaused = true;
            expect(context.canResume()).toBe(true);
        });
    });
});

describe('ActionRouter', () => {
    let router;
    let mockGameModel;
    let mockReplaySystem;

    beforeEach(() => {
        mockGameModel = {
            state: {
                isGameOver: false,
                isDying: false,
                isPaused: false
            },
            setDesiredDirection: jest.fn(),
            togglePaused: jest.fn().mockReturnValue(true)
        };
        mockReplaySystem = {
            isRecording: false,
            isReplaying: false,
            startRecording: jest.fn(),
            stopRecording: jest.fn(),
            getRecordings: jest.fn().mockReturnValue(['recording1']),
            loadRecording: jest.fn()
        };
        router = new ActionRouter(mockGameModel, mockReplaySystem);
    });

    afterEach(() => {
        router.clearHandlers();
    });

    describe('constructor', () => {
        it('should store game model', () => {
            expect(router.gameModel).toBe(mockGameModel);
        });

        it('should store replay system', () => {
            expect(router.replaySystem).toBe(mockReplaySystem);
        });

        it('should register default handlers', () => {
            expect(router.actionHandlers.size).toBeGreaterThan(0);
        });
    });

    describe('registerHandler', () => {
        it('should register a handler for an action', () => {
            const handler = jest.fn();
            router.registerHandler('custom_action', handler);

            expect(router.hasHandler('custom_action')).toBe(true);
        });

        it('should allow multiple handlers for same action', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            router.registerHandler('multi', handler1);
            router.registerHandler('multi', handler2);

            router.route({ type: INPUT_TYPES.ACTION, value: 'multi' });

            expect(handler1).toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });

        it('should throw for non-function handler', () => {
            expect(() => {
                router.registerHandler('bad', 'not a function');
            }).toThrow('Handler must be a function');
        });

        it('should support chaining', () => {
            const result = router.registerHandler('test', jest.fn());
            expect(result).toBe(router);
        });
    });

    describe('unregisterHandler', () => {
        it('should remove a specific handler', () => {
            const handler = jest.fn();
            router.registerHandler('test', handler);
            router.unregisterHandler('test', handler);

            router.route({ type: INPUT_TYPES.ACTION, value: 'test' });

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('route - direction input', () => {
        it('should set direction on game model', () => {
            const input = { type: INPUT_TYPES.DIRECTION, value: directions.RIGHT };
            router.route(input);

            expect(mockGameModel.setDesiredDirection).toHaveBeenCalledWith(directions.RIGHT);
        });

        it('should emit DIRECTION_CHANGED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');
            const input = { type: INPUT_TYPES.DIRECTION, value: directions.UP };

            router.route(input);

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.DIRECTION_CHANGED, { direction: directions.UP });
            emitSpy.mockRestore();
        });

        it('should not set direction when cannot accept input', () => {
            mockGameModel.state.isGameOver = true;
            const input = { type: INPUT_TYPES.DIRECTION, value: directions.RIGHT };

            router.route(input);

            expect(mockGameModel.setDesiredDirection).not.toHaveBeenCalled();
        });
    });

    describe('route - pause action', () => {
        it('should toggle pause when can pause', () => {
            const input = { type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.PAUSE };
            router.route(input);

            expect(mockGameModel.togglePaused).toHaveBeenCalled();
        });

        it('should emit PAUSE_REQUESTED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');
            const input = { type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.PAUSE };

            router.route(input);

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.PAUSE_REQUESTED);
            emitSpy.mockRestore();
        });

        it('should resume when already paused', () => {
            mockGameModel.state.isPaused = true;
            mockGameModel.togglePaused.mockReturnValue(false);
            const emitSpy = jest.spyOn(gameEvents, 'emit');

            const input = { type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.PAUSE };
            router.route(input);

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.RESUME_REQUESTED);
            emitSpy.mockRestore();
        });

        it('should not pause when game is over', () => {
            mockGameModel.state.isGameOver = true;
            const input = { type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.PAUSE };

            router.route(input);

            expect(mockGameModel.togglePaused).not.toHaveBeenCalled();
        });
    });

    describe('route - return to menu', () => {
        it('should emit RETURN_TO_MENU_REQUESTED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');
            const input = { type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.RETURN_TO_MENU };

            router.route(input);

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.RETURN_TO_MENU_REQUESTED);
            emitSpy.mockRestore();
        });

        it('should not emit when game is over', () => {
            mockGameModel.state.isGameOver = true;
            const emitSpy = jest.spyOn(gameEvents, 'emit');
            const input = { type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.RETURN_TO_MENU };

            router.route(input);

            expect(emitSpy).not.toHaveBeenCalledWith(GAME_EVENTS.RETURN_TO_MENU_REQUESTED);
            emitSpy.mockRestore();
        });
    });

    describe('route - restart', () => {
        it('should emit RESTART_LEVEL_REQUESTED event', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');
            const input = { type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.RESTART };

            router.route(input);

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.RESTART_LEVEL_REQUESTED);
            emitSpy.mockRestore();
        });
    });

    describe('route - replay toggle', () => {
        it('should emit REPLAY_TOGGLE_REQUESTED with replay system', () => {
            const emitSpy = jest.spyOn(gameEvents, 'emit');
            const input = { type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.TOGGLE_REPLAY };

            router.route(input);

            expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.REPLAY_TOGGLE_REQUESTED, {
                replaySystem: mockReplaySystem
            });
            emitSpy.mockRestore();
        });

        it('should not emit when no replay system', () => {
            const routerWithoutReplay = new ActionRouter(mockGameModel, null);
            const emitSpy = jest.spyOn(gameEvents, 'emit');
            const input = { type: INPUT_TYPES.ACTION, value: INPUT_ACTIONS.TOGGLE_REPLAY };

            routerWithoutReplay.route(input);

            expect(emitSpy).not.toHaveBeenCalledWith(GAME_EVENTS.REPLAY_TOGGLE_REQUESTED, expect.anything());
            emitSpy.mockRestore();
        });
    });

    describe('routeBatch', () => {
        it('should route multiple inputs', () => {
            const inputs = [
                { type: INPUT_TYPES.DIRECTION, value: directions.RIGHT },
                { type: INPUT_TYPES.DIRECTION, value: directions.UP }
            ];

            const count = router.routeBatch(inputs);

            expect(count).toBe(2);
            expect(mockGameModel.setDesiredDirection).toHaveBeenCalledTimes(2);
        });

        it('should return 0 for invalid input', () => {
            const count = router.routeBatch('not an array');
            expect(count).toBe(0);
        });
    });

    describe('getRegisteredActions', () => {
        it('should return all registered action names', () => {
            const actions = router.getRegisteredActions();
            expect(actions).toContain(INPUT_TYPES.DIRECTION);
            expect(actions).toContain(INPUT_ACTIONS.PAUSE);
            expect(actions).toContain(INPUT_ACTIONS.RETURN_TO_MENU);
        });
    });

    describe('hasHandler', () => {
        it('should return true for registered actions', () => {
            expect(router.hasHandler(INPUT_TYPES.DIRECTION)).toBe(true);
        });

        it('should return false for unregistered actions', () => {
            expect(router.hasHandler('unknown_action')).toBe(false);
        });
    });

    describe('clearHandlers', () => {
        it('should remove all handlers', () => {
            router.clearHandlers();
            expect(router.actionHandlers.size).toBe(0);
        });
    });

    describe('resetHandlers', () => {
        it('should restore default handlers after clearing', () => {
            router.clearHandlers();
            router.resetHandlers();
            expect(router.hasHandler(INPUT_TYPES.DIRECTION)).toBe(true);
        });
    });
});

describe('GameController (Phase 6 Clean)', () => {
    let controller;
    let mockGameModel;
    let mockInputManager;
    let mockReplaySystem;

    beforeEach(() => {
        mockGameModel = {
            state: {}
        };
        mockReplaySystem = {};
        mockInputManager = {
            onInput: jest.fn().mockReturnValue(jest.fn())
        };

        controller = new GameController({
            gameModel: mockGameModel,
            replaySystem: mockReplaySystem,
            inputManager: mockInputManager
        });
    });

    afterEach(() => {
        if (controller) {
            controller.destroy();
        }
    });

    describe('constructor', () => {
        it('should create ActionRouter', () => {
            expect(controller.actionRouter).toBeDefined();
        });

        it('should store game model', () => {
            expect(controller.gameModel).toBe(mockGameModel);
        });

        it('should subscribe to input manager', () => {
            expect(mockInputManager.onInput).toHaveBeenCalled();
        });
    });

    describe('setInputManager', () => {
        it('should unsubscribe from previous manager', () => {
            const unsubscribe = jest.fn();
            const oldManager = { onInput: jest.fn().mockReturnValue(unsubscribe) };
            const newManager = { onInput: jest.fn().mockReturnValue(jest.fn()) };

            controller.setInputManager(oldManager);
            controller.setInputManager(newManager);

            expect(unsubscribe).toHaveBeenCalled();
        });

        it('should subscribe to new manager', () => {
            const newManager = { onInput: jest.fn().mockReturnValue(jest.fn()) };
            controller.setInputManager(newManager);

            expect(newManager.onInput).toHaveBeenCalled();
        });
    });

    describe('handleInput', () => {
        beforeEach(() => {
            controller.activate();
        });

        it('should route input through action router', () => {
            const routeSpy = jest.spyOn(controller.actionRouter, 'route');
            const input = { type: INPUT_TYPES.DIRECTION, value: directions.RIGHT };

            controller.handleInput(input);

            expect(routeSpy).toHaveBeenCalledWith(input);
            routeSpy.mockRestore();
        });

        it('should not route when inactive', () => {
            controller.deactivate();
            const routeSpy = jest.spyOn(controller.actionRouter, 'route');

            controller.handleInput({ type: INPUT_TYPES.DIRECTION, value: directions.RIGHT });

            expect(routeSpy).not.toHaveBeenCalled();
            routeSpy.mockRestore();
        });

        it('should not route null input', () => {
            const routeSpy = jest.spyOn(controller.actionRouter, 'route');

            controller.handleInput(null);

            expect(routeSpy).not.toHaveBeenCalled();
            routeSpy.mockRestore();
        });
    });

    describe('activate/deactivate', () => {
        it('should activate controller', () => {
            controller.deactivate();
            controller.activate();
            expect(controller.isActive).toBe(true);
        });

        it('should deactivate controller', () => {
            controller.activate();
            controller.deactivate();
            expect(controller.isActive).toBe(false);
        });

        it('should report active status', () => {
            controller.activate();
            expect(controller.getIsActive()).toBe(true);
        });
    });

    describe('destroy', () => {
        it('should unsubscribe from input', () => {
            const unsubscribe = jest.fn();
            controller.unsubscribeInput = unsubscribe;

            controller.destroy();

            expect(unsubscribe).toHaveBeenCalled();
        });

        it('should deactivate', () => {
            controller.activate();
            controller.destroy();
            expect(controller.isActive).toBe(false);
        });

        it('should clear references', () => {
            controller.destroy();
            expect(controller.gameModel).toBeNull();
            expect(controller.inputManager).toBeNull();
            expect(controller.actionRouter).toBeNull();
        });
    });
});
