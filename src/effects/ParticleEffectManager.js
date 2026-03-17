/**
 * ParticleEffectManager
 * Tech-themed particle effects system for ADA-Woman
 * Manages lifecycle of all active particle effects
 */

import { ParticleEffect } from './ParticleEffect.js';
import { CircuitPulseEffect } from './CircuitPulseEffect.js';
import { DigitalDissolutionEffect } from './DigitalDissolutionEffect.js';
import { DataStreamEffect } from './DataStreamEffect.js';
import { HolographicEffect } from './HolographicEffect.js';

/**
 * Central manager for all particle effects
 * Handles creation, updates, and cleanup of effects
 */
class ParticleEffectManager {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = [];
        this.maxEffects = 50;
        this.maxParticlesPerEffect = 100;
        this.totalParticleCount = 0;
        this.maxTotalParticles = 500;
    }

    /**
     * Create a circuit pulse effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {object} config - Effect configuration
     * @returns {CircuitPulseEffect}
     */
    createCircuitPulse(x, y, config = {}) {
        return this.createEffect(CircuitPulseEffect, { x, y, ...config });
    }

    /**
     * Create a digital dissolution effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {object} config - Effect configuration
     * @returns {DigitalDissolutionEffect}
     */
    createDigitalDissolution(x, y, config = {}) {
        return this.createEffect(DigitalDissolutionEffect, { x, y, ...config });
    }

    /**
     * Create a data stream effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {object} config - Effect configuration
     * @returns {DataStreamEffect}
     */
    createDataStream(x, y, config = {}) {
        return this.createEffect(DataStreamEffect, { x, y, ...config });
    }

    /**
     * Create a holographic effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {object} config - Effect configuration
     * @returns {HolographicEffect}
     */
    createHolographic(x, y, config = {}) {
        return this.createEffect(HolographicEffect, { x, y, ...config });
    }

    /**
     * Generic effect creation
     * @param {class} EffectClass - Effect class to instantiate
     * @param {object} config - Effect configuration
     * @returns {ParticleEffect}
     */
    createEffect(EffectClass, config = {}) {
        // Enforce max effects limit
        if (this.activeEffects.length >= this.maxEffects) {
            console.warn(
                `ParticleEffectManager: Max effects (${this.maxEffects}) reached, removing oldest effect`
            );
            this.removeOldestEffect();
        }

        // Enforce max particles per effect
        if (
            config.particleCount &&
            config.particleCount > this.maxParticlesPerEffect
        ) {
            config.particleCount = this.maxParticlesPerEffect;
        }

        const effect = new EffectClass(this.scene, config);
        effect.onComplete = () => {
            this.removeEffect(effect);
        };

        this.activeEffects.push(effect);
        effect.play();

        return effect;
    }

    /**
     * Update all active effects
     * @param {number} deltaTime - Time since last frame in ms
     */
    update(deltaTime) {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.update(deltaTime);

            if (!effect.isPlaying) {
                this.removeEffect(effect);
            }
        }
    }

    /**
     * Remove a specific effect
     * @param {ParticleEffect} effect - Effect to remove
     */
    removeEffect(effect) {
        const index = this.activeEffects.indexOf(effect);
        if (index !== -1) {
            this.activeEffects.splice(index, 1);
            effect.stop();
        }
    }

    /**
     * Remove the oldest active effect
     */
    removeOldestEffect() {
        if (this.activeEffects.length > 0) {
            const oldestEffect = this.activeEffects[0];
            this.removeEffect(oldestEffect);
        }
    }

    /**
     * Clean up all effects
     */
    cleanup() {
        this.activeEffects.forEach((effect) => {
            effect.stop();
        });
        this.activeEffects = [];
    }

    /**
     * Get count of active effects
     * @returns {number}
     */
    getActiveEffectCount() {
        return this.activeEffects.length;
    }

    /**
     * Pause all effects
     */
    pause() {
        this.activeEffects.forEach((effect) => {
            effect.isPlaying = false;
        });
    }

    /**
     * Resume all effects
     */
    resume() {
        this.activeEffects.forEach((effect) => {
            effect.isPlaying = true;
        });
    }
}

// Export both the manager and effect classes
export { ParticleEffect };
export { CircuitPulseEffect };
export { DigitalDissolutionEffect };
export { DataStreamEffect };
export { HolographicEffect };

export default ParticleEffectManager;
