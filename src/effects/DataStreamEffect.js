/**
 * DataStreamEffect
 * Creates an inward-flowing data stream absorption effect
 */

/* global Phaser */

import { ParticleEffect, effectColors } from './ParticleEffect.js';

/**
 * Data stream particle effect
 * Particles flow inward from edges toward center
 */
export class DataStreamEffect extends ParticleEffect {
    constructor(scene, config = {}) {
        super(scene, {
            duration: 1000,
            particleCount: 25,
            streamRadius: 60,
            absorbSpeed: 200,
            ...config
        });

        this.streamRadius = this.config.streamRadius;
        this.absorbSpeed = this.config.absorbSpeed;
    }

    createParticles() {
        const colors = [
            effectColors.circuit.trace,
            effectColors.circuit.node,
            effectColors.digital.active
        ];

        colors.forEach((color) => {
            this.createStreamEmitter(color);
        });

        this.createAbsorptionGlow();

        // Stop emitters after initial burst
        this.scene.time.delayedCall(300, () => {
            this.emitters.forEach((emitter) => {
                if (emitter && !emitter.removed) {
                    emitter.stop();
                }
            });
        });
    }

    createStreamEmitter(color) {
        const texture = ParticleEffect.createParticleTexture(
            this.scene,
            6,
            color,
            'hexagon'
        );

        const emitter = this.scene.add.particles(0, 0, texture, {
            x: {
                min: this.config.x - this.streamRadius,
                max: this.config.x + this.streamRadius
            },
            y: {
                min: this.config.y - this.streamRadius,
                max: this.config.y + this.streamRadius
            },
            speedX: { min: -this.absorbSpeed, max: this.absorbSpeed },
            speedY: { min: -this.absorbSpeed, max: this.absorbSpeed },
            scale: { start: 1, end: 0.3 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            quantity: Math.floor(this.config.particleCount / 3),
            frequency: 20,
            blendMode: 'ADD',
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Circle(
                    this.config.x,
                    this.config.y,
                    this.streamRadius
                ),
                quantity: 50,
                stepRate: 0
            },
            onParticleEmit: (particle) => {
                const angle = Phaser.Math.Angle.Between(
                    particle.x,
                    particle.y,
                    this.config.x,
                    this.config.y
                );
                particle.velocityX = Math.cos(angle) * this.absorbSpeed;
                particle.velocityY = Math.sin(angle) * this.absorbSpeed;
            }
        });

        this.emitters.push(emitter);
    }

    createAbsorptionGlow() {
        const glowTexture = ParticleEffect.createParticleTexture(
            this.scene,
            20,
            effectColors.effect.glow,
            'circle'
        );

        const emitter = this.scene.add.particles(0, 0, glowTexture, {
            x: this.config.x,
            y: this.config.y,
            speed: 0,
            scale: { start: 0.5, end: 2 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 500,
            quantity: 5,
            frequency: 100,
            blendMode: 'ADD',
            emitting: false
        });

        this.emitters.push(emitter);
        emitter.explode(5, this.config.x, this.config.y);
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Update particle velocities to converge on center
        this.emitters.forEach((emitter) => {
            if (emitter && !emitter.removed) {
                emitter.forEachAlive((particle) => {
                    const angle = Phaser.Math.Angle.Between(
                        particle.x,
                        particle.y,
                        this.config.x,
                        this.config.y
                    );
                    const dist = Phaser.Math.Distance.Between(
                        particle.x,
                        particle.y,
                        this.config.x,
                        this.config.y
                    );

                    const speed =
                        this.absorbSpeed *
                        (1 + (this.streamRadius - dist) / this.streamRadius);
                    particle.velocityX = Math.cos(angle) * speed;
                    particle.velocityY = Math.sin(angle) * speed;
                });
            }
        });
    }
}

export default DataStreamEffect;
