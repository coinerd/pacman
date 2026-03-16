/**
 * RenderCoordinator Tests
 * Tests for frame-synchronized rendering coordination
 */

import { RenderCoordinator } from '../../../src/views/core/RenderCoordinator.js';

describe('RenderCoordinator', () => {
    let renderCoordinator;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                graphics: jest.fn(() => ({
                    destroy: jest.fn()
                }))
            }
        };

        renderCoordinator = new RenderCoordinator(mockScene);
    });

    afterEach(() => {
        renderCoordinator = null;
    });

    describe('Constructor', () => {
        test('should initialize with default values', () => {
            expect(renderCoordinator.scene).toBe(mockScene);
            expect(renderCoordinator.renderQueue).toEqual([]);
            expect(renderCoordinator.isRendering).toBe(false);
            expect(renderCoordinator.frameCount).toBe(0);
            expect(renderCoordinator.lastRenderTime).toBe(0);
            expect(renderCoordinator.targetFPS).toBe(60);
        });

        test('should initialize render phases', () => {
            expect(renderCoordinator.renderPhases).toBeDefined();
            expect(renderCoordinator.renderPhases.BACKGROUND).toBeDefined();
            expect(renderCoordinator.renderPhases.WORLD).toBeDefined();
            expect(renderCoordinator.renderPhases.ENTITIES).toBeDefined();
            expect(renderCoordinator.renderPhases.EFFECTS).toBeDefined();
            expect(renderCoordinator.renderPhases.UI).toBeDefined();
        });

        test('should initialize phase renderers map', () => {
            expect(renderCoordinator.phaseRenderers).toBeDefined();
            expect(renderCoordinator.phaseRenderers.size).toBe(5);
        });

        test('should initialize performance metrics', () => {
            expect(renderCoordinator.metrics).toBeDefined();
            expect(renderCoordinator.metrics.frameTime).toBe(0);
            expect(renderCoordinator.metrics.renderTime).toBe(0);
            expect(renderCoordinator.metrics.queueLength).toBe(0);
        });
    });

    describe('registerRenderer()', () => {
        test('should register renderer for valid phase', () => {
            const mockRenderer = { render: jest.fn() };

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer
            );

            const renderers = renderCoordinator.phaseRenderers.get(
                renderCoordinator.renderPhases.ENTITIES
            );
            expect(renderers.length).toBe(1);
            expect(renderers[0].renderer).toBe(mockRenderer);
        });

        test('should register renderer with priority', () => {
            const mockRenderer1 = { render: jest.fn() };
            const mockRenderer2 = { render: jest.fn() };

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer1,
                10
            );

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer2,
                5
            );

            const renderers = renderCoordinator.phaseRenderers.get(
                renderCoordinator.renderPhases.ENTITIES
            );
            expect(renderers[0].priority).toBe(5);
            expect(renderers[1].priority).toBe(10);
        });

        test('should not register for invalid phase', () => {
            const mockRenderer = { render: jest.fn() };

            renderCoordinator.registerRenderer(999, mockRenderer);

            expect(renderCoordinator.phaseRenderers.has(999)).toBe(false);
        });

        test('should sort renderers by priority', () => {
            const mockRenderer1 = { render: jest.fn() };
            const mockRenderer2 = { render: jest.fn() };
            const mockRenderer3 = { render: jest.fn() };

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer1,
                10
            );

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer2,
                5
            );

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer3,
                15
            );

            const renderers = renderCoordinator.phaseRenderers.get(
                renderCoordinator.renderPhases.ENTITIES
            );
            expect(renderers[0].priority).toBe(5);
            expect(renderers[1].priority).toBe(10);
            expect(renderers[2].priority).toBe(15);
        });
    });

    describe('unregisterRenderer()', () => {
        test('should unregister renderer', () => {
            const mockRenderer = { render: jest.fn() };

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer
            );

            renderCoordinator.unregisterRenderer(mockRenderer);

            const renderers = renderCoordinator.phaseRenderers.get(
                renderCoordinator.renderPhases.ENTITIES
            );
            expect(renderers.length).toBe(0);
        });

        test('should handle unregistering non-existent renderer', () => {
            const mockRenderer = { render: jest.fn() };

            expect(() => {
                renderCoordinator.unregisterRenderer(mockRenderer);
            }).not.toThrow();
        });

        test('should unregister correct renderer', () => {
            const mockRenderer1 = { render: jest.fn() };
            const mockRenderer2 = { render: jest.fn() };

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer1
            );

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer2
            );

            renderCoordinator.unregisterRenderer(mockRenderer1);

            const renderers = renderCoordinator.phaseRenderers.get(
                renderCoordinator.renderPhases.ENTITIES
            );
            expect(renderers.length).toBe(1);
            expect(renderers[0].renderer).toBe(mockRenderer2);
        });
    });

    describe('render()', () => {
        test('should increment frame count', () => {
            renderCoordinator.render(16.67);
            expect(renderCoordinator.frameCount).toBe(1);
        });

        test('should update metrics', () => {
            renderCoordinator.render(16.67);
            expect(renderCoordinator.metrics.frameTime).toBeGreaterThan(0);
        });

        test('should handle zero delta time', () => {
            expect(() => renderCoordinator.render(0)).not.toThrow();
        });

        test('should handle negative delta time', () => {
            expect(() => renderCoordinator.render(-16.67)).not.toThrow();
        });

        test('should call registered renderers', () => {
            const mockRenderer = { render: jest.fn() };

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer
            );

            // Wait for frame interval
            renderCoordinator.lastRenderTime = 0;
            renderCoordinator.render(16.67);

            expect(mockRenderer.render).toHaveBeenCalled();
        });

        test('should respect frame rate limiting', () => {
            const mockRenderer = { render: jest.fn() };

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer
            );

            // First render
            renderCoordinator.lastRenderTime = 0;
            renderCoordinator.render(16.67);
            expect(mockRenderer.render).toHaveBeenCalledTimes(1);

            // Second render too soon (should be skipped)
            renderCoordinator.render(5);
            expect(mockRenderer.render).toHaveBeenCalledTimes(1);
        });
    });

    describe('Frame Rate Management', () => {
        test('should calculate frame interval correctly', () => {
            expect(renderCoordinator.frameInterval).toBe(1000 / 60);
        });

        test('should handle frame skipping when behind', () => {
            renderCoordinator.lastRenderTime = 0;

            // Simulate being way behind
            renderCoordinator.render(100);

            // Should reset lastRenderTime to avoid spiral of death
            expect(renderCoordinator.lastRenderTime).toBeGreaterThan(0);
        });
    });

    describe('Performance Metrics', () => {
        test('should track frame time', () => {
            renderCoordinator.render(16.67);
            expect(renderCoordinator.metrics.frameTime).toBeDefined();
        });

        test('should track render time', () => {
            renderCoordinator.render(16.67);
            expect(renderCoordinator.metrics.renderTime).toBeDefined();
        });

        test('should track queue length', () => {
            renderCoordinator.render(16.67);
            expect(renderCoordinator.metrics.queueLength).toBeDefined();
        });

        test('should get metrics', () => {
            const metrics = renderCoordinator.getMetrics();
            expect(metrics).toBeDefined();
        });
    });

    describe('Render Phases', () => {
        test('should execute phases in order', () => {
            const callOrder = [];

            const backgroundRenderer = {
                render: jest.fn(() => callOrder.push('BACKGROUND'))
            };
            const worldRenderer = {
                render: jest.fn(() => callOrder.push('WORLD'))
            };
            const entitiesRenderer = {
                render: jest.fn(() => callOrder.push('ENTITIES'))
            };

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.BACKGROUND,
                backgroundRenderer
            );

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.WORLD,
                worldRenderer
            );

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                entitiesRenderer
            );

            renderCoordinator.lastRenderTime = 0;
            renderCoordinator.render(16.67);

            expect(callOrder).toEqual(['BACKGROUND', 'WORLD', 'ENTITIES']);
        });
    });

    describe('Edge Cases', () => {
        test('should handle no registered renderers', () => {
            expect(() => renderCoordinator.render(16.67)).not.toThrow();
        });

        test('should handle multiple rapid render calls', () => {
            for (let i = 0; i < 10; i++) {
                renderCoordinator.lastRenderTime = 0;
                renderCoordinator.render(16.67);
            }
            // Should not throw
        });

        test('should handle renderer without render method', () => {
            const mockRenderer = {};

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer
            );

            renderCoordinator.lastRenderTime = 0;
            expect(() => renderCoordinator.render(16.67)).not.toThrow();
        });
    });

    describe('Performance', () => {
        test('should handle many renderers', () => {
            for (let i = 0; i < 20; i++) {
                const mockRenderer = { render: jest.fn() };
                renderCoordinator.registerRenderer(
                    renderCoordinator.renderPhases.ENTITIES,
                    mockRenderer,
                    i
                );
            }

            renderCoordinator.lastRenderTime = 0;
            expect(() => renderCoordinator.render(16.67)).not.toThrow();
        });

        test('should handle rapid register/unregister', () => {
            for (let i = 0; i < 10; i++) {
                const mockRenderer = { render: jest.fn() };
                renderCoordinator.registerRenderer(
                    renderCoordinator.renderPhases.ENTITIES,
                    mockRenderer
                );
                renderCoordinator.unregisterRenderer(mockRenderer);
            }
            // Should not throw
        });
    });

    describe('Integration Scenarios', () => {
        test('should support typical usage flow', () => {
            // Register renderers
            const backgroundRenderer = { render: jest.fn() };
            const entitiesRenderer = { render: jest.fn() };
            const uiRenderer = { render: jest.fn() };

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.BACKGROUND,
                backgroundRenderer,
                0
            );

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                entitiesRenderer,
                10
            );

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.UI,
                uiRenderer,
                20
            );

            // Render frame
            renderCoordinator.lastRenderTime = 0;
            renderCoordinator.render(16.67);

            // Check metrics
            const metrics = renderCoordinator.getMetrics();
            expect(metrics).toBeDefined();
        });

        test('should handle game loop simulation', () => {
            const mockRenderer = { render: jest.fn() };

            renderCoordinator.registerRenderer(
                renderCoordinator.renderPhases.ENTITIES,
                mockRenderer
            );

            // Simulate 60 frames
            for (let frame = 0; frame < 60; frame++) {
                renderCoordinator.lastRenderTime = frame * 16.67;
                renderCoordinator.render(16.67);
            }

            expect(renderCoordinator.frameCount).toBeGreaterThan(0);
        });
    });
});
