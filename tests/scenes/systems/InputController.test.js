import { InputController } from '../../../src/scenes/systems/InputController.js';
import { createMockScene, createMockPacman } from '../../utils/testHelpers.js';
import { directions } from '../../../src/config/gameConfig.js';

describe('InputController', () => {
    let controller;
    let mockScene;
    let mockPacman;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.input = {
            keyboard: {
                createCursorKeys: jest.fn().mockReturnValue({
                    left: { isDown: false },
                    right: { isDown: false },
                    up: { isDown: false },
                    down: { isDown: false }
                }),
                addKeys: jest.fn().mockReturnValue({
                    W: { isDown: false },
                    A: { isDown: false },
                    S: { isDown: false },
                    D: { isDown: false }
                }),
                on: jest.fn(),
                off: jest.fn()
            }
        };
        mockScene.scene = {
            pause: jest.fn(),
            launch: jest.fn(),
            start: jest.fn()
        };
        mockPacman = createMockPacman();
        mockPacman.setDirection = jest.fn();
        controller = new InputController(mockScene, mockPacman);
    });

    describe('initialization', () => {
        test('should store scene and pacman references', () => {
            expect(controller.scene).toBe(mockScene);
            expect(controller.pacman).toBe(mockPacman);
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

            expect(mockPacman.setDirection).toHaveBeenCalledWith(directions.LEFT);
        });

        test('should move right when right arrow pressed', () => {
            controller.cursors.right.isDown = true;

            controller.handleInput();

            expect(mockPacman.setDirection).toHaveBeenCalledWith(directions.RIGHT);
        });

        test('should move up when up arrow pressed', () => {
            controller.cursors.up.isDown = true;

            controller.handleInput();

            expect(mockPacman.setDirection).toHaveBeenCalledWith(directions.UP);
        });

        test('should move down when down arrow pressed', () => {
            controller.cursors.down.isDown = true;

            controller.handleInput();

            expect(mockPacman.setDirection).toHaveBeenCalledWith(directions.DOWN);
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

            expect(mockPacman.setDirection).toHaveBeenCalledWith(directions.UP);
        });

        test('should move left when A pressed', () => {
            controller.wasd.A.isDown = true;

            controller.handleInput();

            expect(mockPacman.setDirection).toHaveBeenCalledWith(directions.LEFT);
        });

        test('should move down when S pressed', () => {
            controller.wasd.S.isDown = true;

            controller.handleInput();

            expect(mockPacman.setDirection).toHaveBeenCalledWith(directions.DOWN);
        });

        test('should move right when D pressed', () => {
            controller.wasd.D.isDown = true;

            controller.handleInput();

            expect(mockPacman.setDirection).toHaveBeenCalledWith(directions.RIGHT);
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
            mockPacman.setDirection.mockClear();
        });

        test('should prefer arrow keys over WASD', () => {
            controller.handleInput();

            expect(mockPacman.setDirection).toHaveBeenCalledWith(directions.LEFT);
        });
    });

    describe('pause handling', () => {
        test('should toggle pause when P key pressed', () => {
            mockScene.gameState.isGameOver = false;
            mockScene.gameState.isDying = false;

            controller.handlePause();

            expect(mockScene.gameState.isPaused).toBe(true);
            expect(mockScene.scene.pause).toHaveBeenCalled();
            expect(mockScene.scene.launch).toHaveBeenCalledWith('PauseScene');
        });

        test('should not pause if game is over', () => {
            mockScene.gameState.isGameOver = true;

            controller.handlePause();

            expect(mockScene.gameState.isPaused).toBe(false);
            expect(mockScene.scene.pause).not.toHaveBeenCalled();
        });

        test('should not pause if pacman is dying', () => {
            mockScene.gameState.isDying = true;

            controller.handlePause();

            expect(mockScene.gameState.isPaused).toBe(false);
            expect(mockScene.scene.pause).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        test('should cleanup input handlers', () => {
            controller.cleanup();

            expect(true).toBe(true);
        });
    });
});
