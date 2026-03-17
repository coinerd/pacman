/**
 * HolographicEffect
 * Creates a holographic shimmer effect with scanlines
 */

/* global Phaser */

import { ParticleEffect, effectColors } from './ParticleEffect.js';

/**
 * Holographic particle effect
 * Features shimmer particles, scanlines, and hexagonal outline
 */
export class HolographicEffect extends ParticleEffect {
    constructor(scene, config = {}) {
        super(scene, {
            duration: 1200,
            particleCount: 40,
            shimmerIntensity: 0.5,
            ...config
        });

        this.shimmerIntensity = this.config.shimmerIntensity;
        this.scanlineY = 0;
    }

    createParticles() {
        this.createHolographicBase();
        this.createShimmerParticles();
        this.createScanlines();
        this.createHolographicOutline();
    }

    createHolographicBase() {
        const baseTexture = ParticleEffect.createParticleTexture(
            this.scene,
            12,
            effectColors.effect.glow,
            'circle'
        );

        const emitter = this.scene.add.particles(0, 0, baseTexture, {
            x: this.config.x,
            y: this.config.y,
            speed: { min: 5, max: 20 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 1 },
            alpha: { start: 0.4, end: 0 },
            lifespan: 1000,
            quantity: Math.floor(this.config.particleCount / 2),
            frequency: -1,
            blendMode: 'ADD',
            emitting: false
        });

        this.emitters.push(emitter);
        emitter.explode(
            Math.floor(this.config.particleCount / 2),
            this.config.x,
            this.config.y
        );
    }

    createShimmerParticles() {
        const shimmerColors = [
            effectColors.effect.highlight,
            effectColors.circuit.node,
            effectColors.digital.active
        ];

        shimmerColors.forEach((color) => {
            const texture = ParticleEffect.createParticleTexture(
                this.scene,
                4,
                color,
                'triangle'
            );

            const emitter = this.scene.add.particles(0, 0, texture, {
                x: { min: this.config.x - 20, max: this.config.x + 20 },
                y: { min: this.config.y - 20, max: this.config.y + 20 },
                speed: { min: 10, max: 30 },
                angle: { min: -45, max: 45 },
                scale: { start: 1, end: 0 },
                alpha: { start: this.shimmerIntensity, end: 0 },
                lifespan: 600 + Math.random() * 400,
                quantity: Math.floor(this.config.particleCount / 3),
                frequency: 50,
                blendMode: 'ADD',
                emitting: false
            });

            this.emitters.push(emitter);

            this.scene.time.delayedCall(Math.random() * 200, () => {
                emitter.start();
            });

            this.scene.time.delayedCall(600, () => {
                emitter.stop();
            });
        });
    }

    createScanlines() {
        const graphics = this.scene.add.graphics();
        const numScanlines = 8;
        const height = 40;

        for (let i = 0; i < numScanlines; i++) {
            const y = this.config.y - height / 2 + (i * height) / numScanlines;
            graphics.fillStyle(effectColors.digital.active, 0.15);
            graphics.fillRect(this.config.x - 30, y, 60, 2);
        }

        this.scene.tweens.add({
            targets: this,
            scanlineY: 1,
            duration: 400,
            yoyo: true,
            repeat: 2,
            onUpdate: () => {
                const offset = this.scanlineY * 10;
                graphics.y = this.config.y + offset;
            },
            onComplete: () => graphics.destroy()
        });

        this.particles.push({ graphic: graphics });
    }

    createHolographicOutline() {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, effectColors.effect.glow, 0.6);

        const cx = this.config.x;
        const cy = this.config.y;
        const radius = 25;

        // Draw hexagonal outline
        graphics.beginPath();
        for (let i = 0; i <= 6; i++) {
            const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
            const px = cx + radius * Math.cos(angle);
            const py = cy + radius * Math.sin(angle);

            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        graphics.closePath();
        graphics.strokePath();

        // Add corner nodes
        for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
            const px = cx + radius * Math.cos(angle);
            const py = cy + radius * Math.sin(angle);

            graphics.fillStyle(effectColors.circuit.node, 0.8);
            graphics.fillCircle(px, py, 4);
        }

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            scale: 1.2,
            duration: this.config.duration,
            onComplete: () => graphics.destroy()
        });

        this.particles.push({ graphic: graphics });
    }
}

export default HolographicEffect;
