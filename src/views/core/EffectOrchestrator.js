/**
 * EffectOrchestrator
 * Coordinates visual effects and animations
 * Manages effect scheduling, batching, and cleanup
 */

import { colors } from '../../config/gameConfig.js';

export class EffectOrchestrator {
    constructor(scene) {
        this.scene = scene;

        // Active effects
        this.activeEffects = new Map();
        this.effectIdCounter = 0;

        // Effect pools for reuse
        this.effectPools = new Map();

        // Effect queues for sequential playback
        this.effectQueues = new Map();

        // Effect presets
        this.presets = this.createPresets();
    }

    /**
     * Create effect presets
     * @returns {Object} Effect presets
     */
    createPresets() {
        return {
            pelletEaten: {
                duration: 200,
                scale: { from: 1, to: 1.5 },
                alpha: { from: 1, to: 0 },
                ease: 'Power2'
            },
            powerPelletEaten: {
                duration: 500,
                scale: { from: 1, to: 2 },
                alpha: { from: 1, to: 0 },
                ease: 'Power2',
                particles: true
            },
            ghostEaten: {
                duration: 800,
                scale: { from: 1, to: 0 },
                rotation: { from: 0, to: 360 },
                ease: 'Back.easeIn',
                color: 0x00ffaa
            },
            fruitEaten: {
                duration: 600,
                y: { offset: -30 },
                alpha: { from: 1, to: 0 },
                ease: 'Power2'
            },
            bossDamage: {
                duration: 300,
                flash: true,
                shake: { intensity: 5, duration: 200 }
            },
            bossDefeated: {
                duration: 2000,
                explosion: true,
                screenFlash: true,
                particles: true
            },
            powerUpCollected: {
                duration: 500,
                scale: { from: 1, to: 1.8 },
                alpha: { from: 1, to: 0 },
                ease: 'Back.easeOut'
            },
            screenFlash: {
                duration: 300,
                color: 0xffffff,
                alpha: { from: 0.8, to: 0 }
            },
            screenShake: {
                duration: 500,
                intensity: 10
            }
        };
    }

    /**
     * Play effect by preset name
     * @param {string} presetName - Preset name
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Override options
     * @returns {string} Effect ID
     */
    play(presetName, x, y, options = {}) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.warn(`[EffectOrchestrator] Unknown preset: ${presetName}`);
            return null;
        }

        const config = { ...preset, ...options, x, y };
        return this.createEffect(config);
    }

    /**
     * Create custom effect
     * @param {Object} config - Effect configuration
     * @returns {string} Effect ID
     */
    createEffect(config) {
        const id = `effect_${++this.effectIdCounter}`;

        if (config.particles) {
            this.createParticleEffect(id, config);
        }

        if (config.explosion) {
            this.createExplosionEffect(id, config);
        }

        if (config.flash) {
            this.createFlashEffect(id, config);
        }

        if (config.shake) {
            this.createShakeEffect(id, config);
        }

        if (config.screenFlash) {
            this.createScreenFlash(config.color || 0xffffff, config.duration);
        }

        this.activeEffects.set(id, {
            config,
            startTime: performance.now(),
            completed: false
        });

        // Auto-cleanup after duration
        if (config.duration) {
            this.scene.time.delayedCall(config.duration, () => {
                this.completeEffect(id);
            });
        }

        return id;
    }

    /**
     * Create particle effect
     * @param {string} id - Effect ID
     * @param {Object} config - Effect configuration
     */
    createParticleEffect(id, config) {
        const { x, y, color = 0x00ffaa, count = 8 } = config;
        const particles = [];

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 50 + Math.random() * 50;

            const particle = this.scene.add.circle(x, y, 3, color);
            particle.setDepth(150);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: config.duration || 500,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });

            particles.push(particle);
        }

        const effect = this.activeEffects.get(id);
        if (effect) {
            effect.particles = particles;
        }
    }

    /**
     * Create explosion effect
     * @param {string} id - Effect ID
     * @param {Object} config - Effect configuration
     */
    createExplosionEffect(id, config) {
        const { x, y, color = 0xff0000 } = config;

        // Main explosion
        const explosion = this.scene.add.circle(x, y, 10, color);
        explosion.setDepth(200);

        this.scene.tweens.add({
            targets: explosion,
            scale: 5,
            alpha: 0,
            duration: config.duration || 1000,
            ease: 'Power2',
            onComplete: () => explosion.destroy()
        });

        // Shockwave ring
        const ring = this.scene.add.circle(x, y, 10);
        ring.setStrokeStyle(3, color);
        ring.setDepth(199);

        this.scene.tweens.add({
            targets: ring,
            scale: 8,
            alpha: 0,
            duration: config.duration || 1000,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });

        const effect = this.activeEffects.get(id);
        if (effect) {
            effect.explosion = { explosion, ring };
        }
    }

    /**
     * Create flash effect
     * @param {string} id - Effect ID
     * @param {Object} config - Effect configuration
     */
    createFlashEffect(id, config) {
        const { x, y } = config;

        const flash = this.scene.add.circle(x, y, 20, 0xffffff);
        flash.setDepth(200);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: config.duration || 200,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        const effect = this.activeEffects.get(id);
        if (effect) {
            effect.flash = flash;
        }
    }

    /**
     * Create shake effect
     * @param {string} id - Effect ID
     * @param {Object} config - Effect configuration
     */
    createShakeEffect(id, config) {
        const { shake } = config;
        if (!shake) {return;}

        const originalX = this.scene.cameras.main.x;
        const originalY = this.scene.cameras.main.y;

        this.scene.tweens.add({
            targets: this.scene.cameras.main,
            x: originalX + shake.intensity,
            duration: shake.duration / 4,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.scene.cameras.main.x = originalX;
                this.scene.cameras.main.y = originalY;
            }
        });

        const effect = this.activeEffects.get(id);
        if (effect) {
            effect.shake = { originalX, originalY };
        }
    }

    /**
     * Create screen flash effect
     * @param {number} color - Flash color
     * @param {number} duration - Flash duration
     */
    createScreenFlash(color = 0xffffff, duration = 300) {
        const flash = this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            color,
            0.8
        );
        flash.setDepth(1000);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
    }

    /**
     * Create screen shake effect
     * @param {number} intensity - Shake intensity
     * @param {number} duration - Shake duration
     */
    createScreenShake(intensity = 10, duration = 500) {
        const camera = this.scene.cameras.main;
        const originalX = camera.scrollX;
        const originalY = camera.scrollY;

        this.scene.tweens.add({
            targets: camera,
            x: originalX + intensity,
            y: originalY + intensity,
            duration: duration / 4,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                camera.setScroll(originalX, originalY);
            }
        });
    }

    /**
     * Queue effects for sequential playback
     * @param {string} queueId - Queue identifier
     * @param {Array<Object>} effects - Array of effect configs
     */
    queueEffects(queueId, effects) {
        this.effectQueues.set(queueId, {
            effects: [...effects],
            currentIndex: 0,
            isPlaying: false
        });
    }

    /**
     * Play queued effects
     * @param {string} queueId - Queue identifier
     */
    playQueue(queueId) {
        const queue = this.effectQueues.get(queueId);
        if (!queue || queue.isPlaying) {
            return;
        }

        queue.isPlaying = true;
        this.playNextInQueue(queueId);
    }

    /**
     * Play next effect in queue
     * @param {string} queueId - Queue identifier
     */
    playNextInQueue(queueId) {
        const queue = this.effectQueues.get(queueId);
        if (!queue || queue.currentIndex >= queue.effects.length) {
            this.effectQueues.delete(queueId);
            return;
        }

        const effectConfig = queue.effects[queue.currentIndex++];
        const id = this.createEffect(effectConfig);

        // Schedule next effect
        if (id && effectConfig.duration) {
            this.scene.time.delayedCall(effectConfig.duration, () => {
                this.playNextInQueue(queueId);
            });
        }
    }

    /**
     * Complete and cleanup effect
     * @param {string} id - Effect ID
     */
    completeEffect(id) {
        const effect = this.activeEffects.get(id);
        if (!effect) {
            return;
        }

        effect.completed = true;

        // Cleanup particles
        if (effect.particles) {
            effect.particles.forEach(p => {
                if (p.active) {p.destroy();}
            });
        }

        // Cleanup explosion
        if (effect.explosion) {
            if (effect.explosion.explosion.active) {effect.explosion.explosion.destroy();}
            if (effect.explosion.ring.active) {effect.explosion.ring.destroy();}
        }

        // Cleanup flash
        if (effect.flash && effect.flash.active) {
            effect.flash.destroy();
        }

        this.activeEffects.delete(id);
    }

    /**
     * Stop all active effects
     */
    stopAll() {
        for (const [id] of this.activeEffects) {
            this.completeEffect(id);
        }
        this.activeEffects.clear();
        this.effectQueues.clear();
    }

    /**
     * Check if effect is active
     * @param {string} id - Effect ID
     * @returns {boolean}
     */
    isActive(id) {
        const effect = this.activeEffects.get(id);
        return effect && !effect.completed;
    }

    /**
     * Get active effect count
     * @returns {number}
     */
    getActiveCount() {
        return this.activeEffects.size;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.stopAll();
        this.effectPools.clear();
    }
}

export default EffectOrchestrator;
