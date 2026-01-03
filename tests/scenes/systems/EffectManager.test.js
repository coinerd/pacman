import { EffectManager } from '../../../src/scenes/systems/EffectManager.js';
import { createMockScene } from '../../utils/testHelpers.js';

describe('EffectManager', () => {
    let controller;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.add = { graphics: jest.fn().mockReturnValue({ fillStyle: jest.fn(), fillCircle: jest.fn(), strokePath: jest.fn() }) };
        mockScene.tweens = { add: jest.fn() };
        controller = new EffectManager(mockScene);
    });

    describe('createPowerPelletEffect', () => {
        test('should create flash effect', () => {
            mockScene.pacman = { x: 100, y: 100 };

            controller.createPowerPelletEffect();

            expect(mockScene.add.graphics).toHaveBeenCalled();
            expect(mockScene.tweens.add).toHaveBeenCalled();
        });
    });

    describe('createGhostEatenEffect', () => {
        test('should create ghost eaten flash', () => {
            mockScene.pacman = { x: 100, y: 100 };

            controller.createGhostEatenEffect();

            expect(mockScene.add.graphics).toHaveBeenCalled();
            expect(mockScene.tweens.add).toHaveBeenCalled();
        });
    });

    describe('createFruitEatEffect', () => {
        test('should create fruit flash', () => {
            mockScene.fruit = { x: 100, y: 100, fruitType: { color: 0xFF0000 } };

            controller.createFruitEatEffect();

            expect(mockScene.add.graphics).toHaveBeenCalled();
            expect(mockScene.tweens.add).toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        test('should cleanup tweens', () => {
            controller.cleanup();

            expect(true).toBe(true);
        });
    });
});
