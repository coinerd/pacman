/**
 * ParticleEffectManager
 * Tech-themed particle effects system for ADA-Woman
 * Features circuit pulse, digital dissolution, data stream, and holographic effects
 */

/* global Phaser */

import { themeColors } from '../config/themeConfig.js';

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

    play() {
        this.isPlaying = true;
        this.elapsedTime = 0;
        this.createParticles();
    }

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

    createParticles() {}

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
        const nodeTexture = ParticleEffect.createParticleTexture(
            this.scene,
            8,
            themeColors.circuit.node,
            'circle'
        );

        const emitterManager = this.scene.add.particles(0, 0, nodeTexture, {
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

        const glowTexture = ParticleEffect.createParticleTexture(
            this.scene,
            16,
            themeColors.circuit.traceGlow,
            'circle'
        );

        const glowEmitter = this.scene.add.particles(0, 0, glowTexture, {
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

        this.emitters.push(emitterManager, glowEmitter);

        this.createCircuitTraces();

        emitterManager.explode(
            this.config.particleCount,
            this.config.x,
            this.config.y
        );
        glowEmitter.explode(
            Math.floor(this.config.particleCount / 2),
            this.config.x,
            this.config.y
        );
    }

    createCircuitTraces() {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, themeColors.circuit.trace, 0.8);

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

            const nodeX = this.config.x + Math.cos(angle) * (length / 2);
            const nodeY = this.config.y + Math.sin(angle) * (length / 2);
            graphics.fillStyle(themeColors.circuit.node, 0.9);
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
            themeColors.circuit.trace,
            themeColors.digital.active,
            themeColors.circuit.node,
            themeColors.effect.highlight
        ];

        colors.forEach((color, index) => {
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
                quantity: Math.floor(this.config.particleCount / colors.length),
                frequency: -1,
                blendMode: 'ADD',
                emitting: false
            });

            this.emitters.push(emitter);

            this.scene.time.delayedCall(index * 50, () => {
                emitter.explode(
                    Math.floor(this.config.particleCount / colors.length),
                    this.config.x,
                    this.config.y
                );
            });
        });

        this.createGlitchLines();

        this.scene.cameras.main.shake(100, 0.005);
    }

    createGlitchLines() {
        const numLines = 4;
        for (let i = 0; i < numLines; i++) {
            const isHorizontal = Math.random() > 0.5;
            const graphics = this.scene.add.graphics();

            if (isHorizontal) {
                const y = this.config.y + (Math.random() - 0.5) * 40;
                const width = 40 + Math.random() * 40;
                graphics.fillStyle(themeColors.effect.highlight, 0.3);
                graphics.fillRect(
                    this.config.x - width / 2,
                    y,
                    width,
                    2 + Math.random() * 3
                );
            } else {
                const x = this.config.x + (Math.random() - 0.5) * 40;
                const height = 40 + Math.random() * 40;
                graphics.fillStyle(themeColors.circuit.trace, 0.3);
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
            themeColors.circuit.trace,
            themeColors.circuit.node,
            themeColors.digital.active
        ];

        colors.forEach((color) => {
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
                quantity: Math.floor(this.config.particleCount / colors.length),
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

            this.scene.time.delayedCall(300, () => {
                emitter.stop();
            });
        });

        this.createAbsorptionGlow();
    }

    createAbsorptionGlow() {
        const glowTexture = ParticleEffect.createParticleTexture(
            this.scene,
            20,
            themeColors.effect.glow,
            'circle'
        );

        const glowEmitter = this.scene.add.particles(0, 0, glowTexture, {
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

        this.emitters.push(glowEmitter);
        glowEmitter.explode(5, this.config.x, this.config.y);
    }

    update(deltaTime) {
        super.update(deltaTime);

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

export class HolographicEffect extends ParticleEffect {
    constructor(scene, config = {}) {
        super(scene, {
            duration: 1200,
            particleCount: 40,
            shimmerIntensity: 0.5,
            ...config
        });

        this.shimmerIntensity = this.config.shimmerIntensity;
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
            themeColors.effect.glow,
            'circle'
        );

        const baseEmitter = this.scene.add.particles(0, 0, baseTexture, {
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

        this.emitters.push(baseEmitter);
        baseEmitter.explode(
            Math.floor(this.config.particleCount / 2),
            this.config.x,
            this.config.y
        );
    }

    createShimmerParticles() {
        const shimmerColors = [
            themeColors.effect.highlight,
            themeColors.circuit.node,
            themeColors.digital.active
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
            graphics.fillStyle(themeColors.digital.active, 0.15);
            graphics.fillRect(this.config.x - 30, y, 60, 2);
        }

        this.scanlineY = 0;
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
        graphics.lineStyle(2, themeColors.effect.glow, 0.6);

        const cx = this.config.x;
        const cy = this.config.y;
        const radius = 25;

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

        for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
            const px = cx + radius * Math.cos(angle);
            const py = cy + radius * Math.sin(angle);

            graphics.fillStyle(themeColors.circuit.node, 0.8);
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

export class ParticleEffectManager {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = [];
        this.maxEffects = 50;
        this.maxParticlesPerEffect = 100;
        this.totalParticleCount = 0;
        this.maxTotalParticles = 500;
    }

    createCircuitPulse(x, y, config = {}) {
        return this.createEffect(CircuitPulseEffect, { x, y, ...config });
    }

    createDigitalDissolution(x, y, config = {}) {
        return this.createEffect(DigitalDissolutionEffect, { x, y, ...config });
    }

    createDataStream(x, y, config = {}) {
        return this.createEffect(DataStreamEffect, { x, y, ...config });
    }

    createHolographic(x, y, config = {}) {
        return this.createEffect(HolographicEffect, { x, y, ...config });
    }

    createEffect(EffectClass, config = {}) {
        if (this.activeEffects.length >= this.maxEffects) {
            console.warn(
                `ParticleEffectManager: Max effects (${this.maxEffects}) reached, removing oldest effect`
            );
            this.removeOldestEffect();
        }

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

    update(deltaTime) {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.update(deltaTime);

            if (!effect.isPlaying) {
                this.removeEffect(effect);
            }
        }
    }

    removeEffect(effect) {
        const index = this.activeEffects.indexOf(effect);
        if (index !== -1) {
            this.activeEffects.splice(index, 1);
            effect.stop();
        }
    }

    removeOldestEffect() {
        if (this.activeEffects.length > 0) {
            const oldestEffect = this.activeEffects[0];
            this.removeEffect(oldestEffect);
        }
    }

    cleanup() {
        this.activeEffects.forEach((effect) => {
            effect.stop();
        });
        this.activeEffects = [];
    }

    getActiveEffectCount() {
        return this.activeEffects.length;
    }

    pause() {
        this.activeEffects.forEach((effect) => {
            effect.isPlaying = false;
        });
    }

    resume() {
        this.activeEffects.forEach((effect) => {
            effect.isPlaying = true;
        });
    }
};
