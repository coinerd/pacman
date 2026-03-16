/**
 * Tests for FruitRenderer
 * Tests fruit rendering component
 */

import { FruitRenderer } from '../../../src/view/components/FruitRenderer.js';

// Mock Phaser Scene
const createMockScene = () => ({
    add: {
        graphics: jest.fn(() => ({
            setDepth: jest.fn(),
            clear: jest.fn(),
            destroy: jest.fn(),
            fillStyle: jest.fn(),
            lineStyle: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            closePath: jest.fn(),
            fillPath: jest.fn(),
            strokePath: jest.fn(),
            fillCircle: jest.fn(),
            fillEllipse: jest.fn(),
            strokeCircle: jest.fn()
        })),
        text: jest.fn(() => ({
            setOrigin: jest.fn(),
            setDepth: jest.fn(),
            setVisible: jest.fn(),
            setText: jest.fn(),
            destroy: jest.fn(),
            x: 0,
            y: 0
        }))
    },
    time: {
        delayedCall: jest.fn()
    }
});

// Mock fruit state
const createMockFruitState = (overrides = {}) => ({
    x: 100,
    y: 200,
    active: true,
    visual: {
        active: true,
        bobOffset: 0,
        fruitType: 'cherry'
    },
    getVisualState: jest.fn(() => ({
        active: true,
        bobOffset: 0,
        fruitType: 'cherry'
    })),
    getFruitType: jest.fn(() => ({ name: 'cherry', color: 0xff0000, points: 100 })),
    ...overrides
});

describe('FruitRenderer', () => {
    let mockScene;
    let mockState;
    let renderer;

    beforeEach(() => {
        mockScene = createMockScene();
        mockState = createMockFruitState();
        renderer = new FruitRenderer(mockScene, mockState);
    });

    describe('constructor', () => {
        it('should create graphics object', () => {
            expect(mockScene.add.graphics).toHaveBeenCalled();
        });

        it('should create score text', () => {
            expect(mockScene.add.text).toHaveBeenCalled();
        });

        it('should set graphics depth to 90', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            expect(graphics.setDepth).toHaveBeenCalledWith(90);
        });

        it('should set score text depth to 91', () => {
            const text = mockScene.add.text.mock.results[0].value;
            expect(text.setDepth).toHaveBeenCalledWith(91);
        });

        it('should initialize score text as hidden', () => {
            const text = mockScene.add.text.mock.results[0].value;
            expect(text.setVisible).toHaveBeenCalledWith(false);
        });
    });

    describe('update', () => {
        it('should return early if no data provided', () => {
            renderer.sync = jest.fn();
            renderer.update(null);

            expect(renderer.sync).not.toHaveBeenCalled();
        });

        it('should merge data into state', () => {
            renderer.update({ x: 150, y: 250 });

            expect(renderer.state.x).toBe(150);
            expect(renderer.state.y).toBe(250);
        });

        it('should call sync after updating state', () => {
            renderer.sync = jest.fn();
            renderer.update({ x: 150 });

            expect(renderer.sync).toHaveBeenCalled();
        });
    });

    describe('sync', () => {
        it('should return early if no state', () => {
            renderer.state = null;
            expect(() => renderer.sync()).not.toThrow();
        });

        it('should clear graphics when fruit is inactive', () => {
            renderer.state = createMockFruitState({
                active: false,
                visual: { active: false }
            });

            renderer.sync();

            const graphics = mockScene.add.graphics.mock.results[0].value;
            expect(graphics.clear).toHaveBeenCalled();
        });

        it('should draw fruit when active', () => {
            renderer.sync();

            const graphics = mockScene.add.graphics.mock.results[0].value;
            expect(graphics.clear).toHaveBeenCalled();
        });

        it('should apply bob offset to position', () => {
            renderer.state = createMockFruitState({
                visual: { active: true, bobOffset: 5, fruitType: 'cherry' }
            });

            renderer.sync();

            // Should have drawn something (cherry)
            const graphics = mockScene.add.graphics.mock.results[0].value;
            expect(graphics.fillStyle).toHaveBeenCalled();
        });
    });

    describe('drawFruit', () => {
        it('should draw cherry for cherry type', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'cherry', color: 0xff0000 });

            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should draw strawberry for strawberry type', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'strawberry', color: 0xff0000 });

            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should draw orange for orange type', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'orange', color: 0xffa500 });

            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should draw apple for apple type', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'apple', color: 0x00ff00 });

            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should draw melon for melon type', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'melon', color: 0x90ee90 });

            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should draw galaxian for galaxian type', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'galaxian', color: 0x0000ff });

            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should draw bell for bell type', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'bell', color: 0xffd700 });

            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should draw key for key type', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.lineStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'key', color: 0xffd700 });

            expect(graphics.lineStyle).toHaveBeenCalled();
        });

        it('should map dataFragment to cherry', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'dataFragment', color: 0xff0000 });

            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should map powerCore to strawberry', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'powerCore', color: 0xff0000 });

            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should draw default circle for unknown type', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawFruit(100, 200, { name: 'unknown', color: 0xff0000 });

            expect(graphics.fillCircle).toHaveBeenCalled();
        });
    });

    describe('showScore', () => {
        it('should set score text', () => {
            const text = mockScene.add.text.mock.results[0].value;
            renderer.showScore(100);

            expect(text.setText).toHaveBeenCalledWith('100');
        });

        it('should make score text visible', () => {
            const text = mockScene.add.text.mock.results[0].value;
            renderer.showScore(100);

            expect(text.setVisible).toHaveBeenCalledWith(true);
        });

        it('should schedule hiding the score', () => {
            renderer.showScore(100);

            expect(mockScene.time.delayedCall).toHaveBeenCalledWith(1000, expect.any(Function));
        });
    });

    describe('destroy', () => {
        it('should destroy graphics', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            renderer.destroy();

            expect(graphics.destroy).toHaveBeenCalled();
        });

        it('should destroy score text', () => {
            const text = mockScene.add.text.mock.results[0].value;
            renderer.destroy();

            expect(text.destroy).toHaveBeenCalled();
        });
    });
});
