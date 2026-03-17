/**
 * CircuitPulseEffect
 * Creates a circuit-board style pulse effect with traces and nodes
 */

/* global Phaser */

import { ParticleEffect, effectColors } from './ParticleEffect.js';

/**
 * Circuit pulse particle effect
 * Radiates circuit traces and glowing nodes from center
 */
export class CircuitPulseEffect extends ParticleEffect {
    constructor(scene, config = {}) {
        super(scene, {
            duration: 800,
            particleCount: 12,
            pulseSpeed: 3,
            ...config
        });

        this.pulseSpeed = this.config.pulseSpeed;
    }

    createParticles() {
        this.createNodeParticles();
        this.createGlowParticles();
        this.createCircuitTraces();
    }

    createNodeParticles() {
        const nodeTexture = ParticleEffect.createParticleTexture(
            this.scene,
            8,
            effectColors.circuit.node,
            'circle'
        );

        const emitter = this.scene.add.particles(0, 0, nodeTexture, {
            x: this.config.x,
            y: this.config.y,
            speed: { min: 20, max: 50 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            quantity: this.config.particleCount,
            frequency: -1,
            blendMode: 'ADD',
            emitting: false
        });

        this.emitters.push(emitter);
        emitter.explode(this.config.particleCount, this.config.x, this.config.y);
    }

    createGlowParticles() {
        const glowTexture = ParticleEffect.createParticleTexture(
            this.scene,
            16,
            effectColors.circuit.traceGlow,
            'circle'
        );

        const emitter = this.scene.add.particles(0, 0, glowTexture, {
            x: this.config.x,
            y: this.config.y,
            speed: { min: 10, max: 30 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0.5 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 800,
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

    createCircuitTraces() {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, effectColors.circuit.trace, 0.8);

        const numTraces = 6;
        for (let i = 0; i < numTraces; i++) {
            const angle = ((i * 360) / numTraces) * (Math.PI / 180);
            const length = 30 + Math.random() * 20;
            const endX = this.config.x + Math.cos(angle) * length;
            const endY = this.config.y + Math.sin(angle) * length;

            graphics.beginPath();
            graphics.moveTo(this.config.x, this.config.y);
            graphics.lineTo(endX, endY);
            graphics.strokePath();

            // Add node at midpoint
            const nodeX = this.config.x + Math.cos(angle) * (length / 2);
            const nodeY = this.config.y + Math.sin(angle) * (length / 2);
            graphics.fillStyle(effectColors.circuit.node, 0.9);
            graphics.fillCircle(nodeX, nodeY, 3);
        }

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: this.config.duration,
            onComplete: () => graphics.destroy()
        });

        this.particles.push({ graphic: graphics });
    }
}

export default CircuitPulseEffect;
