/**
 * RenderCoordinator
 * Frame-synchronized rendering coordination
 * Manages render timing and batching for optimal performance
 */

export class RenderCoordinator {
    constructor(scene) {
        this.scene = scene;
        this.renderQueue = [];
        this.isRendering = false;
        this.frameCount = 0;
        this.lastRenderTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;

        // Render phases
        this.renderPhases = {
            BACKGROUND: 0,
            WORLD: 1,
            ENTITIES: 2,
            EFFECTS: 3,
            UI: 4
        };

        // Registered renderers by phase
        this.phaseRenderers = new Map([
            [this.renderPhases.BACKGROUND, []],
            [this.renderPhases.WORLD, []],
            [this.renderPhases.ENTITIES, []],
            [this.renderPhases.EFFECTS, []],
            [this.renderPhases.UI, []]
        ]);

        // Performance metrics
        this.metrics = {
            frameTime: 0,
            renderTime: 0,
            queueLength: 0
        };
    }

    /**
     * Register a renderer for a specific phase
     * @param {string} phase - Render phase
     * @param {Object} renderer - Renderer object with render() method
     * @param {number} priority - Render priority (lower = earlier)
     */
    registerRenderer(phase, renderer, priority = 0) {
        if (!this.phaseRenderers.has(phase)) {
            return;
        }

        const renderers = this.phaseRenderers.get(phase);
        renderers.push({ renderer, priority });

        // Sort by priority
        renderers.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Unregister a renderer
     * @param {Object} renderer - Renderer to unregister
     */
    unregisterRenderer(renderer) {
        for (const [, renderers] of this.phaseRenderers) {
            const index = renderers.findIndex(r => r.renderer === renderer);
            if (index !== -1) {
                renderers.splice(index, 1);
                return;
            }
        }
    }

    /**
     * Main render call - should be called once per frame
     * @param {number} deltaTime - Time since last frame
     */
    render(deltaTime) {
        const startTime = performance.now();
        this.frameCount++;

        // Performance optimization: Improved frame rate limiting
        // Use timestamp from deltaTime parameter if available (more accurate)
        const now = startTime;
        const elapsed = now - this.lastRenderTime;

        // Skip frame if not enough time has passed
        // But allow slight timing variations to avoid stuttering
        if (elapsed < this.frameInterval * 0.95) {
            return; // Skip frame
        }

        // Update last render time, accounting for any accumulated lag
        // This prevents spiral of death when frames take too long
        if (elapsed > this.frameInterval * 2) {
            // If we're way behind, reset to current time to avoid catching up
            this.lastRenderTime = now;
        } else {
            // Normal case: advance by exactly one frame interval
            this.lastRenderTime += this.frameInterval;
        }

        this.isRendering = true;

        // Execute render phases in order
        // Performance: Cache phase count to avoid repeated lookups
        const phases = Object.values(this.renderPhases);
        for (let i = 0; i < phases.length; i++) {
            this.renderPhase(phases[i], deltaTime);
        }

        // Clear render queue
        this.renderQueue.length = 0;

        this.isRendering = false;

        // Update metrics
        this.metrics.renderTime = performance.now() - startTime;
        this.metrics.frameTime = deltaTime;
    }

    /**
     * Render a specific phase
     * @param {number} phase - Phase number
     * @param {number} deltaTime - Time since last frame
     */
    renderPhase(phase, deltaTime) {
        const renderers = this.phaseRenderers.get(phase);
        if (!renderers || renderers.length === 0) {
            return;
        }

        // Performance optimization: Use for loop instead of for...of
        // Cache length to avoid repeated property access
        const length = renderers.length;
        for (let i = 0; i < length; i++) {
            const renderer = renderers[i].renderer;
            if (renderer && typeof renderer.render === 'function') {
                try {
                    renderer.render(deltaTime);
                } catch (error) {
                    console.error('[RenderCoordinator] Error in renderer:', error);
                }
            }
        }
    }

    /**
     * Add item to render queue for batched rendering
     * @param {Object} item - Render item
     * @param {number} priority - Render priority
     */
    queueRender(item, priority = 0) {
        this.renderQueue.push({ item, priority });
        this.metrics.queueLength = this.renderQueue.length;
    }

    /**
     * Process render queue
     */
    processQueue() {
        if (this.renderQueue.length === 0) {
            return;
        }

        // Sort by priority
        this.renderQueue.sort((a, b) => a.priority - b.priority);

        // Process items
        for (const { item } of this.renderQueue) {
            if (typeof item.render === 'function') {
                item.render();
            }
        }

        this.renderQueue.length = 0;
        this.metrics.queueLength = 0;
    }

    /**
     * Set target FPS
     * @param {number} fps - Target frames per second
     */
    setTargetFPS(fps) {
        this.targetFPS = fps;
        this.frameInterval = 1000 / fps;
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Check if currently rendering
     * @returns {boolean}
     */
    isCurrentlyRendering() {
        return this.isRendering;
    }

    /**
     * Get frame count
     * @returns {number}
     */
    getFrameCount() {
        return this.frameCount;
    }

    /**
     * Reset coordinator state
     */
    reset() {
        this.renderQueue.length = 0;
        this.frameCount = 0;
        this.lastRenderTime = 0;
        this.isRendering = false;

        // Clear all phase renderers
        for (const renderers of this.phaseRenderers.values()) {
            renderers.length = 0;
        }

        this.metrics = {
            frameTime: 0,
            renderTime: 0,
            queueLength: 0
        };
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.reset();
        this.phaseRenderers.clear();
    }
}

export default RenderCoordinator;
