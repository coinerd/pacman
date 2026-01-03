import { UIController } from '../../../src/scenes/systems/UIController.js';
import { createMockScene } from '../../utils/testHelpers.js';

describe('UIController', () => {
    let controller;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();

        const createTextMock = () => ({
            setOrigin: jest.fn().mockReturnValue({}),
            setAlpha: jest.fn().mockReturnValue({}),
            setText: jest.fn(),
            destroy: jest.fn()
        });

        mockScene.add = {
            text: jest.fn(createTextMock),
            container: jest.fn().mockReturnValue({
                setVisible: jest.fn(),
                destroy: jest.fn()
            })
        };
        mockScene.tweens = {
            add: jest.fn()
        };
        mockScene.time = {
            delayedCall: jest.fn()
        };
        mockScene.scale = {
            width: 560,
            height: 620
        };
        controller = new UIController(mockScene, mockScene.gameState);
    });

    describe('initialization', () => {
        test('should store scene and gameState references', () => {
            expect(controller.scene).toBe(mockScene);
            expect(controller.gameState).toBe(mockScene.gameState);
        });
    });

    describe('create', () => {
        test('should create score text', () => {
            controller.create();

            expect(mockScene.add.text).toHaveBeenCalledWith(
                10,
                10,
                'SCORE: 0',
                expect.objectContaining({
                    fontSize: expect.any(String),
                    color: expect.any(String)
                })
            );
        });

        test('should create high score text', () => {
            controller.create();

            expect(mockScene.add.text).toHaveBeenCalledWith(
                10,
                35,
                'HIGH SCORE: 0',
                expect.any(Object)
            );
        });

        test('should create lives text', () => {
            controller.create();

            expect(mockScene.add.text).toHaveBeenCalledWith(
                550,
                10,
                'LIVES: 3',
                expect.any(Object)
            );
        });

        test('should create level text', () => {
            controller.create();

            expect(mockScene.add.text).toHaveBeenCalledWith(
                280,
                10,
                'LEVEL: 1',
                expect.any(Object)
            );
        });
    });

    describe('update', () => {
        beforeEach(() => {
            controller.create();
            mockScene.gameState.score = 100;
            mockScene.gameState.highScore = 5000;
            mockScene.gameState.lives = 2;
            mockScene.gameState.level = 3;
        });

        test('should update score text', () => {
            controller.update();

            expect(controller.scoreText.setText).toHaveBeenCalledWith('SCORE: 100');
        });

        test('should update high score text', () => {
            controller.update();

            expect(controller.highScoreText.setText).toHaveBeenCalledWith('HIGH SCORE: 5000');
        });

        test('should update lives text', () => {
            controller.update();

            expect(controller.livesText.setText).toHaveBeenCalledWith('LIVES: 2');
        });

        test('should update level text', () => {
            controller.update();

            expect(controller.levelText.setText).toHaveBeenCalledWith('LEVEL: 3');
        });
    });

    describe('showReadyMessage', () => {
        test('should show ready message', () => {
            controller.showReadyMessage();

            expect(mockScene.add.text).toHaveBeenCalledWith(
                280,
                310,
                'READY!',
                expect.any(Object)
            );
        });

        test('should animate message fade in and out', () => {
            controller.showReadyMessage();

            expect(mockScene.tweens.add).toHaveBeenCalled();
        });
    });

    describe('showLevelMessage', () => {
        beforeEach(() => {
            mockScene.gameState.level = 5;
        });

        test('should show level message', () => {
            controller.showLevelMessage();

            expect(mockScene.add.text).toHaveBeenCalledWith(
                280,
                310,
                'LEVEL 5',
                expect.any(Object)
            );
        });

        test('should fade in and out', () => {
            controller.showLevelMessage();

            expect(mockScene.tweens.add).toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        test('should destroy all UI elements', () => {
            controller.create();

            controller.cleanup();

            expect(controller.scoreText.destroy).toHaveBeenCalled();
            expect(controller.highScoreText.destroy).toHaveBeenCalled();
            expect(controller.livesText.destroy).toHaveBeenCalled();
            expect(controller.levelText.destroy).toHaveBeenCalled();
        });
    });
});
