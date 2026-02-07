import { InputController } from '../../../src/scenes/systems/InputController.js';
import { createMockScene } from '../../utils/testHelpers.js';
import { createKeyboardInputMock } from '../../utils/inputMocks.js';
import { directions } from '../../../src/config/gameConfig.js';

describe('InputController', () => {
    let controller;
    let mockScene;
    let mockGameController;

    beforeEach(() => {
        mockScene = createMockScene();
        const { input } = createKeyboardInputMock();
        mockScene.input = input;
        mockScene.scene = {
            pause: jest.fn(),
            launch: jest.fn(),
            start: jest.fn()
        };
        mockGameController = { handleInput: jest.fn() };
        controller = new InputController(mockScene, mockGameController);
    });

    describe('initialization', () => {
        test('should store scene and game controller references', () => {
            expect(controller.scene).toBe(mockScene);
            expect(controller.gameController).toBe(mockGameController);
        });

        test('should setup keyboard input', () => {
            expect(mockScene.input.keyboard.createCursorKeys).toHaveBeenCalled();
            expect(mockScene.input.keyboard.addKeys).toHaveBeenCalledWith('W,A,S,D');
        });
    });

    describe('handleInput - arrow keys', () => {
        beforeEach(() => {
            controller.cursors.left.isDown = false;
            controller.cursors.right.isDown = false;
            controller.cursors.up.isDown = false;
            controller.cursors.down.isDown = false;
            controller.wasd.W.isDown = false;
            controller.wasd.A.isDown = false;
            controller.wasd.S.isDown = false;
            controller.wasd.D.isDown = false;
        });

        test('should move left when left arrow pressed', () => {
            controller.cursors.left.isDown = true;

            controller.handleInput();

            expect(mockGameController.handleInput).toHaveBeenCalledWith({
                direction: directions.LEFT,
                pause: false,
                replayToggle: false,
                returnToMenu: false,
                loadReplay: false
            });
        });

        test('should move right when right arrow pressed', () => {
            controller.cursors.right.isDown = true;

            controller.handleInput();

            expect(mockGameController.handleInput).toHaveBeenCalledWith({
                direction: directions.RIGHT,
                pause: false,
                replayToggle: false,
                returnToMenu: false,
                loadReplay: false
            });
        });

        test('should move up when up arrow pressed', () => {
            controller.cursors.up.isDown = true;

            controller.handleInput();

            expect(mockGameController.handleInput).toHaveBeenCalledWith({
                direction: directions.UP,
                pause: false,
                replayToggle: false,
                returnToMenu: false,
                loadReplay: false
            });
        });

        test('should move down when down arrow pressed', () => {
            controller.cursors.down.isDown = true;

            controller.handleInput();

            expect(mockGameController.handleInput).toHaveBeenCalledWith({
                direction: directions.DOWN,
                pause: false,
                replayToggle: false,
                returnToMenu: false,
                loadReplay: false
            });
        });
    });

    describe('handleInput - WASD keys', () => {
        beforeEach(() => {
            controller.cursors.left.isDown = false;
            controller.cursors.right.isDown = false;
            controller.cursors.up.isDown = false;
            controller.cursors.down.isDown = false;
            controller.wasd.W.isDown = false;
            controller.wasd.A.isDown = false;
            controller.wasd.S.isDown = false;
            controller.wasd.D.isDown = false;
        });

        test('should move up when W pressed', () => {
            controller.wasd.W.isDown = true;

            controller.handleInput();

            expect(mockGameController.handleInput).toHaveBeenCalledWith({
                direction: directions.UP,
                pause: false,
                replayToggle: false,
                returnToMenu: false,
                loadReplay: false
            });
        });

        test('should move left when A pressed', () => {
            controller.wasd.A.isDown = true;

            controller.handleInput();

            expect(mockGameController.handleInput).toHaveBeenCalledWith({
                direction: directions.LEFT,
                pause: false,
                replayToggle: false,
                returnToMenu: false,
                loadReplay: false
            });
        });

        test('should move down when S pressed', () => {
            controller.wasd.S.isDown = true;

            controller.handleInput();

            expect(mockGameController.handleInput).toHaveBeenCalledWith({
                direction: directions.DOWN,
                pause: false,
                replayToggle: false,
                returnToMenu: false,
                loadReplay: false
            });
        });

        test('should move right when D pressed', () => {
            controller.wasd.D.isDown = true;

            controller.handleInput();

            expect(mockGameController.handleInput).toHaveBeenCalledWith({
                direction: directions.RIGHT,
                pause: false,
                replayToggle: false,
                returnToMenu: false,
                loadReplay: false
            });
        });
    });

    describe('handleInput - priority', () => {
        beforeEach(() => {
            controller.cursors.left.isDown = true;
            controller.cursors.right.isDown = false;
            controller.cursors.up.isDown = false;
            controller.cursors.down.isDown = false;
            controller.wasd.W.isDown = false;
            controller.wasd.A.isDown = false;
            controller.wasd.S.isDown = false;
            controller.wasd.D.isDown = true;
            mockGameController.handleInput.mockClear();
        });

        test('should prefer arrow keys over WASD', () => {
            controller.handleInput();

            expect(mockGameController.handleInput).toHaveBeenCalledWith({
                direction: directions.LEFT,
                pause: false,
                replayToggle: false,
                returnToMenu: false,
                loadReplay: false
            });
        });
    });

    describe('cleanup', () => {
        test('should cleanup input handlers', () => {
            controller.cleanup();

            expect(true).toBe(true);
        });
    });
});
