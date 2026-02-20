/**
 * VisualPlayer
 * Phaser visual representation of Player model entity.
 * Syncs Phaser sprite to PlayerState.
 */

import Phaser from 'phaser';
import { gameConfig } from '../../config/gameConfig.js';

export class VisualPlayer {
    /**
	 * @param {Phaser.Scene} scene - Phaser scene
	 * @param {PlayerState} playerState - Player model state
	 */
    constructor(scene, playerState) {
        this.scene = scene;
        this.state = playerState;

        const radius = gameConfig.tileSize * 0.4;
        const cyanColor = 0x00ced1;

        // Create hexagon points (flat array of x, y values)
        const hexagonPoints = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            hexagonPoints.push(radius * Math.cos(angle));
            hexagonPoints.push(radius * Math.sin(angle));
        }

        // Use scene.add.polygon() with flat array
        this.sprite = scene.add.polygon(
            playerState.x,
            playerState.y,
            hexagonPoints,
            cyanColor
        );

        // Set origin to center so rotation works correctly
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setDepth(100);
        this.sprite.setRotation((playerState.direction.angle * Math.PI) / 180);

        // Use scene.add.circle() instead of new Phaser.GameObjects.Arc()
        this.eye = scene.add.circle(
            playerState.x,
            playerState.y - radius * 0.3,
            radius * 0.15,
            0x000000
        );
        this.eye.setDepth(101);

        this.pulsePhase = 0;

        this.powerUpEffects = new Map();
        this.shieldEffect = null;
        this.speedTrail = [];
        this.magnetField = null;
    }

    /**
	 * Sync visual to model state
     * Uses interpolation when entity is moving between tiles
	 */
    sync() {
        const radius = gameConfig.tileSize * 0.4;

        // Check if entity is moving between tiles (interpolation needed)
        if (this.state.moveProgress > 0) {
            const tileSize = gameConfig.tileSize;

            // Interpolate between previous and target tile centers
            const prevCenterX = this.state.prevGridX * tileSize + tileSize / 2;
            const prevCenterY = this.state.prevGridY * tileSize + tileSize / 2;
            const nextCenterX = this.state.targetGridX * tileSize + tileSize / 2;
            const nextCenterY = this.state.targetGridY * tileSize + tileSize / 2;

            // Lerp based on moveProgress
            this.sprite.x = prevCenterX + (nextCenterX - prevCenterX) * this.state.moveProgress;
            this.sprite.y = prevCenterY + (nextCenterY - prevCenterY) * this.state.moveProgress;
        } else {
            // At rest - use exact grid position
            this.sprite.x = this.state.x;
            this.sprite.y = this.state.y;
        }

        const rotation = (this.state.direction.angle * Math.PI) / 180;
        this.sprite.setRotation(rotation);

        this.pulsePhase += 0.05;
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.05;
        this.sprite.setScale(pulseScale);

        // Use sprite position for eye (syncs with interpolated movement)
        const eyeOffset = radius * 0.3;

        const angle = this.state.direction.angle;
        if (angle === 0) {
            this.eye.x = this.sprite.x + eyeOffset;
            this.eye.y = this.sprite.y - eyeOffset;
        } else if (angle === 180) {
            this.eye.x = this.state.x - eyeOffset;
            this.eye.y = this.state.y - eyeOffset;
        } else if (angle === 270) {
            this.eye.x = this.sprite.x;
            this.eye.y = this.sprite.y - eyeOffset * 1.5;
        } else if (angle === 90) {
            this.eye.x = this.sprite.x;
            this.eye.y = this.sprite.y - eyeOffset * 0.5;
        } else {
            this.eye.x = this.sprite.x + eyeOffset;
            this.eye.y = this.sprite.y - eyeOffset;
        }

        if (this.state.isDying) {
            const deathScale = 1 + (1 - this.state.mouthAngle / 30) * 0.5;
            this.sprite.setScale(deathScale);
            this.sprite.setAlpha(this.state.mouthAngle / 30);
            this.eye.setVisible(false);
        } else {
            this.eye.setVisible(true);
        }

        this.sprite.setVisible(this.state.visualState.visible);
        this.eye.setVisible(this.state.visualState.visible && !this.state.isDying);
        this.sprite.setAlpha(
            this.state.isDying
                ? this.state.mouthAngle / 30
                : this.state.visualState.opacity
        );

        this.updatePowerUpEffects();
    }

    updatePowerUpEffects() {
        if (this.powerUpEffects.has('SPEED_BOOST')) {
            this.createSpeedTrailEffect();
        }

        if (this.shieldEffect) {
            this.shieldEffect.clear();
            this.shieldEffect.lineStyle(3, 0x00ced1, 0.6);
            const radius = gameConfig.tileSize * 0.5;
            this.shieldEffect.strokeCircle(this.sprite.x, this.sprite.y, radius);
        }

        if (this.magnetField) {
            this.magnetField.clear();
            this.magnetField.lineStyle(1, 0x00ff7f, 0.4);
            const radius = gameConfig.tileSize * 0.7;
            for (let i = 0; i < 3; i++) {
                this.magnetField.strokeCircle(
                    this.sprite.x,
                    this.sprite.y,
                    radius * (i + 1) * 0.3
                );
            }
        }
    }

    addPowerUpEffect(type) {
        this.powerUpEffects.set(type, Date.now());

        switch (type) {
        case 'SHIELD':
            this.createShieldEffect();
            break;
        case 'SPEED_BOOST':
            this.createSpeedTrailEffect();
            break;
        case 'DATA_MAGNET':
            this.createMagnetFieldEffect();
            break;
        }
    }

    removePowerUpEffect(type) {
        this.powerUpEffects.delete(type);

        switch (type) {
        case 'SHIELD':
            this.destroyShieldEffect();
            break;
        case 'SPEED_BOOST':
            this.destroySpeedTrailEffect();
            break;
        case 'DATA_MAGNET':
            this.destroyMagnetFieldEffect();
            break;
        }
    }

    createShieldEffect() {
        if (this.shieldEffect) {return;}

        const radius = gameConfig.tileSize * 0.5;
        this.shieldEffect = this.scene.add.graphics();
        this.shieldEffect.lineStyle(3, 0x00ced1, 0.6);
        this.shieldEffect.strokeCircle(this.sprite.x, this.sprite.y, radius);
        this.shieldEffect.setDepth(95);

        this.scene.tweens.add({
            targets: this.shieldEffect,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    destroyShieldEffect() {
        if (this.shieldEffect) {
            this.shieldEffect.destroy();
            this.shieldEffect = null;
        }
    }

    createSpeedTrailEffect() {
        if (this.speedTrail.length > 5) {
            const oldest = this.speedTrail.shift();
            oldest.destroy();
        }

        const trail = this.scene.add
            .circle(
                this.sprite.x,
                this.sprite.y,
                gameConfig.tileSize * 0.2,
                0xffd700,
                0.3
            )
            .setDepth(95);

        this.speedTrail.push(trail);

        this.scene.tweens.add({
            targets: trail,
            scale: 0,
            alpha: 0,
            duration: 300,
            ease: 'Power2'
        });
    }

    destroySpeedTrailEffect() {
        for (const trail of this.speedTrail) {
            trail.destroy();
        }
        this.speedTrail = [];
    }

    createMagnetFieldEffect() {
        if (this.magnetField) {return;}

        const radius = gameConfig.tileSize * 0.7;
        this.magnetField = this.scene.add.graphics();
        this.magnetField.lineStyle(1, 0x00ff7f, 0.4);

        for (let i = 0; i < 3; i++) {
            this.magnetField.strokeCircle(
                this.sprite.x,
                this.sprite.y,
                radius * (i + 1) * 0.3
            );
        }

        this.magnetField.setDepth(94);

        this.scene.tweens.add({
            targets: this.magnetField,
            alpha: 0.2,
            duration: 600,
            yoyo: true,
            repeat: -1
        });
    }

    destroyMagnetFieldEffect() {
        if (this.magnetField) {
            this.magnetField.destroy();
            this.magnetField = null;
        }
    }

    /**
	 * Destroy visual elements
	 */
    destroy() {
        this.sprite.destroy();
        this.eye.destroy();

        this.destroyShieldEffect();
        this.destroySpeedTrailEffect();
        this.destroyMagnetFieldEffect();

        this.powerUpEffects.clear();
    }
}
