/**
 * Tests for EntityRenderer
 * Base class for entity renderers
 */

import { EntityRenderer } from '../../../src/views/renderers/EntityRenderer.js';

// Mock Phaser Scene
const createMockScene = () => ({
    add: {
        graphics: jest.fn(() => ({
            setDepth: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            clear: jest.fn(),
            destroy: jest.fn()
        }))
    }
});

// Mock state with getVisualState method
const createMockState = (overrides = {}) => ({
    x: 100,
    y: 200,
    visible: true,
    alpha: 1,
    color: 0xffffff,
    getVisualState: jest.fn(() => ({
        visible: overrides.visible ?? true,
        alpha: overrides.alpha ?? 1,
        color: overrides.color ?? 0xffffff
    })),
    ...overrides
});

describe('EntityRenderer', () => {
    let mockScene;
    let mockState;
    let renderer;

    beforeEach(() => {
        mockScene = createMockScene();
        mockState = createMockState();
        renderer = new EntityRenderer(mockScene, mockState);
    });

    describe('constructor', () => {
        it('should store scene and state', () => {
            expect(renderer.scene).toBe(mockScene);
            expect(renderer.state).toBe(mockState);
        });

        it('should set default options', () => {
            expect(renderer.options.depth).toBe(100);
            expect(renderer.options.visible).toBe(true);
            expect(renderer.options.alpha).toBe(1);
        });

        it('should merge custom options', () => {
            const customRenderer = new EntityRenderer(mockScene, mockState, {
                depth: 50,
                alpha: 0.5
            });

            expect(customRenderer.options.depth).toBe(50);
            expect(customRenderer.options.alpha).toBe(0.5);
        });

        it('should initialize animation state', () => {
            expect(renderer.animationState.isAnimating).toBe(false);
            expect(renderer.animationState.currentAnimation).toBeNull();
        });

        it('should initialize empty children array', () => {
            expect(renderer.children).toEqual([]);
        });

        it('should set debug option', () => {
            const debugRenderer = new EntityRenderer(mockScene, mockState, { debug: true });
            expect(debugRenderer.debug).toBe(true);
        });
    });

    describe('initGraphics', () => {
        it('should create graphics object', () => {
            renderer.initGraphics();

            expect(mockScene.add.graphics).toHaveBeenCalled();
            expect(renderer.graphics).toBeDefined();
        });

        it('should set graphics depth', () => {
            renderer.initGraphics(50);

            const mockGraphics = mockScene.add.graphics.mock.results[0].value;
            expect(mockGraphics.setDepth).toHaveBeenCalledWith(50);
        });

        it('should use default depth from options', () => {
            renderer.options.depth = 75;
            renderer.initGraphics();

            const mockGraphics = mockScene.add.graphics.mock.results[0].value;
            expect(mockGraphics.setDepth).toHaveBeenCalledWith(75);
        });

        it('should set graphics alpha and visibility', () => {
            renderer.initGraphics();

            const mockGraphics = mockScene.add.graphics.mock.results[0].value;
            expect(mockGraphics.setAlpha).toHaveBeenCalledWith(1);
            expect(mockGraphics.setVisible).toHaveBeenCalledWith(true);
        });
    });

    describe('sync', () => {
        it('should increment frame count', () => {
            expect(renderer._frameCount).toBe(0);
            renderer.sync();
            expect(renderer._frameCount).toBe(1);
            renderer.sync();
            expect(renderer._frameCount).toBe(2);
        });

        it('should update visibility from visual state', () => {
            renderer.initGraphics();
            mockState.getVisualState.mockReturnValue({ visible: false });

            renderer.sync();

            const mockGraphics = mockScene.add.graphics.mock.results[0].value;
            expect(mockGraphics.setVisible).toHaveBeenCalledWith(false);
        });

        it('should not throw if graphics is null', () => {
            renderer.graphics = null;
            expect(() => renderer.sync()).not.toThrow();
        });
    });

    describe('getVisualState', () => {
        it('should call state.getVisualState if available', () => {
            renderer.getVisualState();

            expect(mockState.getVisualState).toHaveBeenCalled();
        });

        it('should return default visual state if getVisualState not available', () => {
            renderer.state = { visible: false, alpha: 0.5, color: 0xff0000 };

            const state = renderer.getVisualState();

            expect(state.visible).toBe(false);
            expect(state.alpha).toBe(0.5);
            expect(state.color).toBe(0xff0000);
        });

        it('should return options as fallback if state is null', () => {
            renderer.state = null;

            const state = renderer.getVisualState();

            expect(state.visible).toBe(true);
            expect(state.alpha).toBe(1);
        });
    });

    describe('setPosition', () => {
        it('should update state position', () => {
            renderer.setPosition(300, 400);

            expect(mockState.x).toBe(300);
            expect(mockState.y).toBe(400);
        });

        it('should not throw if state is null', () => {
            renderer.state = null;
            expect(() => renderer.setPosition(100, 200)).not.toThrow();
        });
    });

    describe('getPosition', () => {
        it('should return current position', () => {
            const pos = renderer.getPosition();

            expect(pos.x).toBe(100);
            expect(pos.y).toBe(200);
        });

        it('should return 0,0 if state is null', () => {
            renderer.state = null;

            const pos = renderer.getPosition();

            expect(pos.x).toBe(0);
            expect(pos.y).toBe(0);
        });
    });

    describe('setVisible', () => {
        it('should set graphics visibility', () => {
            renderer.initGraphics();
            renderer.setVisible(false);

            const mockGraphics = mockScene.add.graphics.mock.results[0].value;
            expect(mockGraphics.setVisible).toHaveBeenCalledWith(false);
        });

        it('should set visibility on children', () => {
            const mockChild = { setVisible: jest.fn() };
            renderer.addChild(mockChild);

            renderer.setVisible(false);

            expect(mockChild.setVisible).toHaveBeenCalledWith(false);
        });

        it('should handle children without setVisible', () => {
            const mockChild = {};
            renderer.addChild(mockChild);

            expect(() => renderer.setVisible(false)).not.toThrow();
        });
    });

    describe('setAlpha', () => {
        it('should set graphics alpha', () => {
            renderer.initGraphics();
            renderer.setAlpha(0.5);

            const mockGraphics = mockScene.add.graphics.mock.results[0].value;
            expect(mockGraphics.setAlpha).toHaveBeenCalledWith(0.5);
        });

        it('should set alpha on children', () => {
            const mockChild = { setAlpha: jest.fn() };
            renderer.addChild(mockChild);

            renderer.setAlpha(0.3);

            expect(mockChild.setAlpha).toHaveBeenCalledWith(0.3);
        });

        it('should handle children without setAlpha', () => {
            const mockChild = {};
            renderer.addChild(mockChild);

            expect(() => renderer.setAlpha(0.5)).not.toThrow();
        });
    });

    describe('setDepth', () => {
        it('should set graphics depth', () => {
            renderer.initGraphics();
            renderer.setDepth(200);

            const mockGraphics = mockScene.add.graphics.mock.results[0].value;
            expect(mockGraphics.setDepth).toHaveBeenCalledWith(200);
        });
    });

    describe('startAnimation', () => {
        it('should set animation state to animating', () => {
            renderer.startAnimation('pulse');

            expect(renderer.animationState.isAnimating).toBe(true);
            expect(renderer.animationState.currentAnimation).toBe('pulse');
        });

        it('should store animation config', () => {
            const config = { duration: 1000 };
            renderer.startAnimation('pulse', config);

            expect(renderer.animationState.config).toBe(config);
        });

        it('should record start time', () => {
            const before = performance.now();
            renderer.startAnimation('pulse');
            const after = performance.now();

            expect(renderer.animationState.startTime).toBeGreaterThanOrEqual(before);
            expect(renderer.animationState.startTime).toBeLessThanOrEqual(after);
        });
    });

    describe('stopAnimation', () => {
        it('should stop current animation', () => {
            renderer.startAnimation('pulse');
            renderer.stopAnimation();

            expect(renderer.animationState.isAnimating).toBe(false);
            expect(renderer.animationState.currentAnimation).toBeNull();
        });
    });

    describe('isAnimating', () => {
        it('should return true when animating', () => {
            renderer.startAnimation('pulse');
            expect(renderer.isAnimating()).toBe(true);
        });

        it('should return false when not animating', () => {
            expect(renderer.isAnimating()).toBe(false);
        });
    });

    describe('addChild / removeChild', () => {
        it('should add child to children array', () => {
            const child = { id: 1 };
            renderer.addChild(child);

            expect(renderer.children).toContain(child);
        });

        it('should remove child from children array', () => {
            const child = { id: 1 };
            renderer.addChild(child);
            renderer.removeChild(child);

            expect(renderer.children).not.toContain(child);
        });

        it('should handle removing non-existent child', () => {
            const child = { id: 1 };
            expect(() => renderer.removeChild(child)).not.toThrow();
        });
    });

    describe('clear', () => {
        it('should clear graphics', () => {
            renderer.initGraphics();
            renderer.clear();

            const mockGraphics = mockScene.add.graphics.mock.results[0].value;
            expect(mockGraphics.clear).toHaveBeenCalled();
        });

        it('should not throw if graphics is null', () => {
            renderer.graphics = null;
            expect(() => renderer.clear()).not.toThrow();
        });
    });

    describe('destroy', () => {
        it('should stop animation', () => {
            renderer.startAnimation('pulse');
            renderer.destroy();

            expect(renderer.animationState.isAnimating).toBe(false);
        });

        it('should destroy all children', () => {
            const mockChild = { destroy: jest.fn() };
            renderer.addChild(mockChild);
            renderer.destroy();

            expect(mockChild.destroy).toHaveBeenCalled();
        });

        it('should clear children array', () => {
            renderer.addChild({ destroy: jest.fn() });
            renderer.destroy();

            expect(renderer.children).toEqual([]);
        });

        it('should destroy graphics', () => {
            renderer.initGraphics();
            renderer.destroy();

            const mockGraphics = mockScene.add.graphics.mock.results[0].value;
            expect(mockGraphics.destroy).toHaveBeenCalled();
        });

        it('should set graphics to null', () => {
            renderer.initGraphics();
            renderer.destroy();

            expect(renderer.graphics).toBeNull();
        });

        it('should set state to null', () => {
            renderer.destroy();
            expect(renderer.state).toBeNull();
        });

        it('should handle children without destroy', () => {
            const mockChild = {};
            renderer.addChild(mockChild);

            expect(() => renderer.destroy()).not.toThrow();
        });
    });

    describe('update', () => {
        it('should call updateAnimation if animating', () => {
            renderer.startAnimation('pulse');
            renderer.updateAnimation = jest.fn();

            renderer.update(16);

            expect(renderer.updateAnimation).toHaveBeenCalledWith(16);
        });

        it('should not call updateAnimation if not animating', () => {
            renderer.updateAnimation = jest.fn();

            renderer.update(16);

            expect(renderer.updateAnimation).not.toHaveBeenCalled();
        });
    });

    describe('render', () => {
        it('should call sync and update', () => {
            renderer.sync = jest.fn();
            renderer.update = jest.fn();

            renderer.render(16);

            expect(renderer.sync).toHaveBeenCalled();
            expect(renderer.update).toHaveBeenCalledWith(16);
        });
    });
});
