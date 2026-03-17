/**
 * DigitalDissolutionEffect
 * Creates a digital pixel dissolution/glitch effect
 */

/* global Phaser */

import { ParticleEffect, effectColors } from './ParticleEffect.js';

/**
 * Digital dissolution particle effect
 * Pixels fly apart with glitch lines
 */
export class DigitalDissolutionEffect extends ParticleEffect {
    constructor(scene, config = {}) {
        super(scene, {
            duration: 600,
            particleCount: 30,
            pixelSize: 4,
            ...config
        });

        this.pixelSize = this.config.pixelSize;
    }

    createParticles() {
        const colors = [
            effectColors.circuit.trace,
            effectColors.digital.active,
            effectColors.circuit.node,
            effectColors.effect.highlight
        ];

        colors.forEach((color, index) => {
            this.createColorEmitter(color, index, colors.length);
        });

        this.createGlitchLines();
        this.scene.cameras.main.shake(100, 0.005);
    }

    createColorEmitter(color, index, totalColors) {
        const texture = ParticleEffect.createParticleTexture(
            this.scene,
            this.pixelSize,
            color,
            'pixel'
        );

        const emitter = this.scene.add.particles(0, 0, texture, {
            x: this.config.x,
            y: this.config.y,
            speed: { min: 40, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400 + Math.random() * 200,
            quantity: Math.floor(this.config.particleCount / totalColors),
            frequency: -1,
            blendMode: 'ADD',
            emitting: false
        });

        this.emitters.push(emitter);

        this.scene.time.delayedCall(index * 50, () => {
            emitter.explode(
                Math.floor(this.config.particleCount / totalColors),
                this.config.x,
                this.config.y
            );
        });
    }

    createGlitchLines() {
        const numLines = 4;
        for (let i = 0; i < numLines; i++) {
            const isHorizontal = Math.random() > 0.5;
            const graphics = this.scene.add.graphics();

            if (isHorizontal) {
                const y = this.config.y + (Math.random() - 0.5) * 40;
                const width = 40 + Math.random() * 40;
                graphics.fillStyle(effectColors.effect.highlight, 0.3);
                graphics.fillRect(
                    this.config.x - width / 2,
                    y,
                    width,
                    2 + Math.random() * 3
                );
            } else {
                const x = this.config.x + (Math.random() - 0.5) * 40;
                const height = 40 + Math.random() * 40;
                graphics.fillStyle(effectColors.circuit.trace, 0.3);
                graphics.fillRect(
                    x,
                    this.config.y - height / 2,
                    2 + Math.random() * 3,
                    height
                );
            }

            this.scene.tweens.add({
                targets: graphics,
                alpha: 0,
                duration: 200 + Math.random() * 200,
                onComplete: () => graphics.destroy()
            });

            this.particles.push({ graphic: graphics });
        }
    }
}

export default DigitalDissolutionEffect;
