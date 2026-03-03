/**
 * PowerUpVisualManager
 * Manages power-up visualization and effects
 */

import { gridToPixel } from '../../utils/MazeLayout.js';
import { gameConfig } from '../../config/gameConfig.js';

export class PowerUpVisualManager {
    constructor(scene) {
        this.scene = scene;
        this.powerUpVisuals = new Map(); // key -> visual object
    }

    /**
     * Get power-up colors and configuration for a type
     * @param {string} type - Power-up type (SHIELD, SPEED_BOOST, DATA_MAGNET)
     * @returns {Object} - Power-up configuration
     */
    getPowerUpColors(type) {
        const configs = {
            SHIELD: { color: 0x00ced1, icon: '⛨', name: 'Shield' },
            SPEED_BOOST: { color: 0xffd700, icon: '⚡', name: 'Speed Boost' },
            DATA_MAGNET: { color: 0x00ff7f, icon: '⧲', name: 'Data Magnet' }
        };
        return { powerUpConfig: configs[type] || configs.SHIELD };
    }

    /**
     * Create a power-up visual
     * @param {string} type - Power-up type
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     */
    createPowerUpVisual(type, gridX, gridY) {
        const key = `${type}_${gridX}_${gridY}`;

        if (this.powerUpVisuals.has(key)) {
            return;
        }

        const pixel = gridToPixel(gridX, gridY);
        const radius = gameConfig.tileSize * 0.35;

        const { powerUpConfig } = this.getPowerUpColors(type);

        // Create power-up texture
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(powerUpConfig.color, 1);

        const shape = this.getShapeForType(type);

        this.drawShape(graphics, shape, radius);

        graphics.generateTexture(`powerup-${type}`, radius * 2, radius * 2);
        graphics.destroy();

        // Create sprite
        const sprite = this.scene.add
            .image(pixel.x + radius, pixel.y + radius, `powerup-${type}`)
            .setDepth(99)
            .setScale(0);

        // Create icon text
        const text = this.scene.add
            .text(pixel.x + radius, pixel.y + radius, powerUpConfig.icon, {
                fontSize: '20px'
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.powerUpVisuals.set(key, { sprite, text, type, gridX, gridY });

        // Animate appearance
        this.animatePowerUpAppearance(sprite, pixel, radius);
    }

    /**
     * Get shape type for power-up type
     * @param {string} type - Power-up type
     * @returns {string}
     */
    getShapeForType(type) {
        switch (type) {
            case 'SHIELD': return 'circle';
            case 'SPEED_BOOST': return 'triangle';
            case 'DATA_MAGNET': return 'square';
            default: return 'circle';
        }
    }

    /**
     * Draw shape to graphics context
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics context
     * @param {string} shape - Shape type
     * @param {number} radius - Radius/size
     */
    drawShape(graphics, shape, radius) {
        if (shape === 'circle') {
            graphics.fillCircle(radius, radius, radius);
        } else if (shape === 'triangle') {
            graphics.beginPath();
            graphics.moveTo(radius, 0);
            graphics.lineTo(0, radius * 2);
            graphics.lineTo(radius * 2, radius * 2);
            graphics.closePath();
            graphics.fillPath();
        } else {
            graphics.fillRect(0, 0, radius * 2, radius * 2);
        }
    }

    /**
     * Animate power-up appearance
     * @param {Phaser.GameObjects.Image} sprite - Power-up sprite
     * @param {Object} pixel - Pixel position
     * @param {number} radius - Radius
     */
    animatePowerUpAppearance(sprite, pixel, radius) {
        // Scale in animation
        this.scene.tweens.add({
            targets: sprite,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        // Float animation
        this.scene.tweens.add({
            targets: sprite,
            y: pixel.y + radius + 3,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Pulse animation
        this.scene.tweens.add({
            targets: sprite,
            alpha: 0.6,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * Update power-up visuals from snapshot data
     * @param {Array<Object>} powerUpsSnapshot - Array of power-up data
     */
    updateFromSnapshot(powerUpsSnapshot) {
        if (!powerUpsSnapshot) {
            // Remove all power-ups
            this.clearAllPowerUps();
            return;
        }

        const currentKeys = new Set();

        // Create or update power-ups from snapshot
        for (const powerUpData of powerUpsSnapshot) {
            const key = `${powerUpData.type}_${powerUpData.gridX}_${powerUpData.gridY}`;
            currentKeys.add(key);

            if (!this.powerUpVisuals.has(key)) {
                this.createPowerUpVisual(powerUpData.type, powerUpData.gridX, powerUpData.gridY);
            }
        }

        // Remove power-ups that are no longer in snapshot
        const keysToRemove = [];
        for (const key of this.powerUpVisuals.keys()) {
            if (!currentKeys.has(key)) {
                keysToRemove.push(key);
            }
        }

        for (const key of keysToRemove) {
            const visual = this.powerUpVisuals.get(key);
            this.removePowerUpVisual(visual);
        }
    }

    /**
     * Remove a specific power-up visual
     * @param {Object} visual - Visual object
     */
    removePowerUpVisual(visual) {
        if (!visual) {
            return;
        }
        visual.sprite.destroy();
        visual.text.destroy();
        const key = `${visual.type}_${visual.gridX}_${visual.gridY}`;
        this.powerUpVisuals.delete(key);
    }

    /**
     * Show power-up collection effect
     * @param {string} type - Power-up type
     * @param {Object} visual - Visual object
     */
    showPowerUpCollectionEffect(type, visual) {
        const { powerUpConfig } = this.getPowerUpColors(type);

        // Scale out animation
        this.scene.tweens.add({
            targets: visual.sprite,
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                visual.text.destroy();
            }
        });

        // Floating text effect
        const effect = this.scene.add
            .text(visual.sprite.x, visual.sprite.y - 20, `+${powerUpConfig.name}!`, {
                fontSize: '16px',
                color: `#${powerUpConfig.color.toString(16).padStart(6, '0')}`,
                fontStyle: 'bold'
            })
            .setOrigin(0.5)
            .setDepth(120);

        this.scene.tweens.add({
            targets: effect,
            y: effect.y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => effect.destroy()
        });
    }

    /**
     * Clear all power-up visuals
     */
    clearAllPowerUps() {
        for (const visual of this.powerUpVisuals.values()) {
            visual.sprite.destroy();
            visual.text.destroy();
        }
        this.powerUpVisuals.clear();
    }

    /**
     * Check if any power-up visuals exist
     * @returns {boolean}
     */
    hasPowerUps() {
        return this.powerUpVisuals.size > 0;
    }

    /**
     * Get power-up visual by key
     * @param {string} type - Power-up type
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {Object|null}
     */
    getPowerUpVisual(type, gridX, gridY) {
        const key = `${type}_${gridX}_${gridY}`;
        return this.powerUpVisuals.get(key) || null;
    }

    /**
     * Clean up all power-up visuals
     */
    cleanup() {
        this.clearAllPowerUps();
    }
}
