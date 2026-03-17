/**
 * ParticleEffect - Base class for all particle effects
 * Provides common lifecycle management and texture generation
 */

/* global Phaser */

import { themeColors } from '../config/themeConfig.js';

/**
 * Base particle effect class
 */
class ParticleEffect {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = {
            x: config.x || 0,
            y: config.y || 0,
            duration: config.duration || 1000,
            particleCount: config.particleCount || 20,
            ...config
        };
        this.particles = [];
        this.emitters = [];
        this.isPlaying = false;
        this.elapsedTime = 0;
        this.onComplete = config.onComplete || null;
    }

    /**
     * Start the effect
     */
    play() {
        this.isPlaying = true;
        this.elapsedTime = 0;
        this.createParticles();
    }

    /**
     * Update effect each frame
     * @param {number} deltaTime - Time since last frame in ms
     */
    update(deltaTime) {
        if (!this.isPlaying) {
            return;
        }

        this.elapsedTime += deltaTime;

        this.particles.forEach((particle) => {
            if (particle.update) {
                particle.update(deltaTime);
            }
        });

        if (this.elapsedTime >= this.config.duration) {
            this.stop();
        }
    }

    /**
     * Stop the effect and cleanup
     */
    stop() {
        this.isPlaying = false;

        this.emitters.forEach((emitter) => {
            if (emitter && !emitter.removed) {
                emitter.stop();
                emitter.remove();
            }
        });
        this.emitters = [];

        this.particles.forEach((particle) => {
            if (particle.graphic && !particle.graphic.scene) {
                particle.graphic.destroy();
            }
        });
        this.particles = [];

        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * Override in subclasses to create particles
     */
    createParticles() {}

    /**
     * Creates a particle texture for reuse
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {number} size - Texture size in pixels
     * @param {number} color - Fill color
     * @param {string} shape - Shape type (circle, rect, triangle, pixel, hexagon)
     * @returns {string} Texture key
     */
    static createParticleTexture(scene, size, color, shape = 'circle') {
        const key = `particle_${shape}_${size}_${color}`;

        if (scene.textures.exists(key)) {
            return key;
        }

        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(color, 1);

        switch (shape) {
        case 'circle':
            graphics.fillCircle(size / 2, size / 2, size / 2);
            break;
        case 'rect':
            graphics.fillRect(0, 0, size, size);
            break;
        case 'triangle':
            graphics.fillTriangle(size / 2, 0, size, size, 0, size);
            break;
        case 'pixel':
            graphics.fillRect(0, 0, size, size);
            break;
        case 'hexagon': {
            const cx = size / 2;
            const cy = size / 2;
            const r = size / 2;
            const sides = 6;
            graphics.beginPath();
            for (let i = 0; i <= sides; i++) {
                const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
                const px = cx + r * Math.cos(angle);
                const py = cy + r * Math.sin(angle);
                if (i === 0) {
                    graphics.moveTo(px, py);
                } else {
                    graphics.lineTo(px, py);
                }
            }
            graphics.closePath();
            graphics.fillPath();
            break;
        }
        }

        graphics.generateTexture(key, size, size);
        graphics.destroy();

        return key;
    }
}

// Export theme colors for effects
export const effectColors = themeColors;

export { ParticleEffect };
export default ParticleEffect;
