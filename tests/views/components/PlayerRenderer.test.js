/**
 * Tests for PlayerRenderer
 * Tests player rendering component
 */

import { PlayerRenderer } from '../../../src/view/components/PlayerRenderer.js';

// Mock Phaser Scene
const createMockScene = () => ({
    add: {
        graphics: jest.fn(() => ({
            setDepth: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            clear: jest.fn(),
            destroy: jest.fn(),
            fillStyle: jest.fn(),
            fillCircle: jest.fn(),
            lineStyle: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            closePath: jest.fn(),
            fillPath: jest.fn(),
            strokePath: jest.fn(),
            scene: {}
        })),
        circle: jest.fn(() => ({
            setDepth: jest.fn(),
            x: 0,
            y: 0,
            setVisible: jest.fn(),
            destroy: jest.fn()
        }))
    }
});

// Mock player state
const createMockPlayerState = (overrides = {}) => ({
    x: 100,
    y: 200,
    direction: { x: 1, y: 0, angle: 0 },
    isDying: false,
    visualState: { visible: true },
    ...overrides
});

describe('PlayerRenderer', () => {
    let mockScene;
    let mockState;
    let renderer;

    beforeEach(() => {
        mockScene = createMockScene();
        mockState = createMockPlayerState();
        renderer = new PlayerRenderer(mockScene, mockState);
    });

    describe('constructor', () => {
        it('should create graphics object', () => {
            expect(mockScene.add.graphics).toHaveBeenCalled();
        });

        it('should set graphics depth to 100', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            expect(graphics.setDepth).toHaveBeenCalledWith(100);
        });

        it('should create eye circle when state has position', () => {
            expect(mockScene.add.circle).toHaveBeenCalled();
        });

        it('should set eye depth to 101', () => {
            const eye = mockScene.add.circle.mock.results[0].value;
            expect(eye.setDepth).toHaveBeenCalledWith(101);
        });

        it('should not create eye when state has no position', () => {
            mockScene = createMockScene();
            renderer = new PlayerRenderer(mockScene, null);

            expect(mockScene.add.circle).not.toHaveBeenCalled();
            expect(renderer.eye).toBeNull();
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

        it('should create eye if not exists and position provided', () => {
            renderer.eye = null;
            mockScene.add.circle.mockClear();

            renderer.update({ x: 100, y: 200 });

            expect(mockScene.add.circle).toHaveBeenCalled();
        });

        it('should call sync after updating', () => {
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

        it('should return early if state has no position', () => {
            renderer.state = { direction: { x: 1, y: 0 } };
            expect(() => renderer.sync()).not.toThrow();
        });

        it('should update eye position for right direction', () => {
            renderer.state = createMockPlayerState({
                direction: { x: 1, y: 0, angle: 0 }
            });

            renderer.sync();

            const eye = mockScene.add.circle.mock.results[0].value;
            expect(eye.x).toBeGreaterThan(100); // Offset to the right
        });

        it('should update eye position for left direction', () => {
            renderer.state = createMockPlayerState({
                direction: { x: -1, y: 0, angle: 180 }
            });

            renderer.sync();

            const eye = mockScene.add.circle.mock.results[0].value;
            expect(eye.x).toBeLessThan(100); // Offset to the left
        });

        it('should update eye position for up direction', () => {
            renderer.state = createMockPlayerState({
                direction: { x: 0, y: -1, angle: 270 }
            });

            renderer.sync();

            const eye = mockScene.add.circle.mock.results[0].value;
            expect(eye.y).toBeLessThan(200); // Eye above center
        });

        it('should update eye position for down direction', () => {
            renderer.state = createMockPlayerState({
                direction: { x: 0, y: 1, angle: 90 }
            });

            renderer.sync();

            const eye = mockScene.add.circle.mock.results[0].value;
            expect(eye.y).toBeGreaterThan(200); // Eye below center
        });

        it('should set alpha during dying state', () => {
            renderer.state = createMockPlayerState({
                isDying: true,
                mouthAngle: 15
            });

            renderer.sync();

            const graphics = mockScene.add.graphics.mock.results[0].value;
            expect(graphics.setAlpha).toHaveBeenCalledWith(0.5); // 15/30
        });

        it('should hide eye during dying state', () => {
            renderer.state = createMockPlayerState({
                isDying: true,
                mouthAngle: 15
            });

            renderer.sync();

            const eye = mockScene.add.circle.mock.results[0].value;
            expect(eye.setVisible).toHaveBeenCalledWith(false);
        });

        it('should set full alpha when not dying', () => {
            renderer.state = createMockPlayerState({
                isDying: false
            });

            renderer.sync();

            const graphics = mockScene.add.graphics.mock.results[0].value;
            expect(graphics.setAlpha).toHaveBeenCalledWith(1);
        });

        it('should show eye when not dying', () => {
            renderer.state = createMockPlayerState({
                isDying: false
            });

            renderer.sync();

            const eye = mockScene.add.circle.mock.results[0].value;
            expect(eye.setVisible).toHaveBeenCalledWith(true);
        });

        it('should update visibility from visualState', () => {
            renderer.state = createMockPlayerState({
                visualState: { visible: false }
            });

            renderer.sync();

            const graphics = mockScene.add.graphics.mock.results[0].value;
            expect(graphics.setVisible).toHaveBeenCalledWith(false);
        });
    });

    describe('drawPlayer', () => {
        it('should clear graphics before drawing', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.clear.mockClear();

            renderer.drawPlayer(100, 200, { x: 1, y: 0 });

            expect(graphics.clear).toHaveBeenCalled();
        });

        it('should set fill style for circles', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillStyle.mockClear();

            renderer.drawPlayer(100, 200, { x: 1, y: 0 });

            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should draw 30 circles in 7-row pattern', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            graphics.fillCircle.mockClear();

            renderer.drawPlayer(100, 200, { x: 1, y: 0 });

            // Pattern: 3+4+5+6+5+4+3 = 30 circles
            expect(graphics.fillCircle).toHaveBeenCalledTimes(30);
        });

        it('should fill circles for hexagonal pattern', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;

            renderer.drawPlayer(100, 200, { x: 1, y: 0 });

            expect(graphics.fillCircle).toHaveBeenCalled();
            expect(graphics.fillStyle).toHaveBeenCalled();
        });
    });

    describe('updateDirectionAnimation', () => {
        it('should reset pulse phase', () => {
            renderer.pulsePhase = 10;
            renderer.updateDirectionAnimation({ x: 0, y: -1 });

            expect(renderer.pulsePhase).toBe(0);
        });
    });

    describe('destroy', () => {
        it('should clear and destroy graphics', () => {
            const graphics = mockScene.add.graphics.mock.results[0].value;
            renderer.destroy();

            expect(graphics.clear).toHaveBeenCalled();
            expect(graphics.destroy).toHaveBeenCalled();
        });

        it('should destroy eye if exists', () => {
            const eye = mockScene.add.circle.mock.results[0].value;
            renderer.destroy();

            expect(eye.destroy).toHaveBeenCalled();
        });

        it('should not throw if eye is null', () => {
            renderer.eye = null;
            expect(() => renderer.destroy()).not.toThrow();
        });
    });
});
