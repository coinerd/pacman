/**
 * EntityRenderer
 * Base class for all entity renderers
 * Provides common functionality for rendering game entities
 */

export class EntityRenderer {
    /**
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {Object} state - Entity state
     * @param {Object} options - Renderer options
     */
    constructor(scene, state, options = {}) {
        this.scene = scene;
        this.state = state;
        this.options = {
            depth: 100,
            visible: true,
            alpha: 1,
            ...options
        };

        // Graphics object (subclasses should initialize)
        this.graphics = null;

        // Child render elements
        this.children = [];

        // Animation state
        this.animationState = {
            isAnimating: false,
            currentAnimation: null,
            startTime: 0
        };

        // Debug logging control
        this.debug = options.debug || false;

        // Frame counter for throttled logging
        this._frameCount = 0;
    }

    /**
     * Initialize graphics object
     * @param {number} depth - Render depth
     */
    initGraphics(depth = this.options.depth) {
        this.graphics = this.scene.add.graphics();
        this.graphics.setDepth(depth);
        this.graphics.setAlpha(this.options.alpha);
        this.graphics.setVisible(this.options.visible);
    }

    /**
     * Sync visual to model state
     * Override in subclasses for specific entity rendering
     */
    sync() {
        this._frameCount++;

        // Update visibility
        if (this.graphics) {
            const visible = this.getVisualState().visible ?? this.options.visible;
            this.graphics.setVisible(visible);
        }
    }

    /**
     * Get visual state from entity state
     * Handles both state objects with getVisualState() method and plain objects
     * @returns {Object} Visual state
     */
    getVisualState() {
        if (this.state && typeof this.state.getVisualState === 'function') {
            return this.state.getVisualState();
        }

        // Return default visual state
        return {
            visible: this.state?.visible ?? this.options.visible,
            alpha: this.state?.alpha ?? this.options.alpha,
            color: this.state?.color ?? 0xffffff
        };
    }

    /**
     * Update entity position
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    setPosition(x, y) {
        if (this.state) {
            this.state.x = x;
            this.state.y = y;
        }
    }

    /**
     * Get entity position
     * @returns {Object} Position {x, y}
     */
    getPosition() {
        return {
            x: this.state?.x ?? 0,
            y: this.state?.y ?? 0
        };
    }

    /**
     * Set visibility
     * @param {boolean} visible - Visibility
     */
    setVisible(visible) {
        if (this.graphics) {
            this.graphics.setVisible(visible);
        }

        this.children.forEach(child => {
            if (child && child.setVisible) {
                child.setVisible(visible);
            }
        });
    }

    /**
     * Set alpha
     * @param {number} alpha - Alpha value (0-1)
     */
    setAlpha(alpha) {
        if (this.graphics) {
            this.graphics.setAlpha(alpha);
        }

        this.children.forEach(child => {
            if (child && child.setAlpha) {
                child.setAlpha(alpha);
            }
        });
    }

    /**
     * Set depth
     * @param {number} depth - Depth value
     */
    setDepth(depth) {
        if (this.graphics) {
            this.graphics.setDepth(depth);
        }
    }

    /**
     * Start animation
     * @param {string} animationName - Animation name
     * @param {Object} config - Animation configuration
     */
    startAnimation(animationName, config = {}) {
        this.animationState = {
            isAnimating: true,
            currentAnimation: animationName,
            startTime: performance.now(),
            config
        };
    }

    /**
     * Stop current animation
     */
    stopAnimation() {
        this.animationState.isAnimating = false;
        this.animationState.currentAnimation = null;
    }

    /**
     * Check if animation is active
     * @returns {boolean}
     */
    isAnimating() {
        return this.animationState.isAnimating;
    }

    /**
     * Add child render element
     * @param {Object} child - Child element
     */
    addChild(child) {
        this.children.push(child);
    }

    /**
     * Remove child render element
     * @param {Object} child - Child element
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }

    /**
     * Clear all graphics
     */
    clear() {
        if (this.graphics) {
            this.graphics.clear();
        }
    }

    /**
     * Destroy renderer and cleanup resources
     */
    destroy() {
        this.stopAnimation();

        // Destroy children
        this.children.forEach(child => {
            if (child && child.destroy) {
                child.destroy();
            }
        });
        this.children = [];

        // Destroy graphics
        if (this.graphics) {
            this.graphics.clear();
            this.graphics.destroy();
            this.graphics = null;
        }

        this.state = null;
    }

    /**
     * Update method called every frame
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (this.animationState.isAnimating) {
            this.updateAnimation(deltaTime);
        }
    }

    /**
     * Update animation
     * @param {number} deltaTime - Time since last frame
     */
    updateAnimation(deltaTime) {
        // Override in subclasses for specific animation logic
    }

    /**
     * Render method called by RenderCoordinator
     * @param {number} deltaTime - Time since last frame
     */
    render(deltaTime) {
        this.sync();
        this.update(deltaTime);
    }
}

export default EntityRenderer;
