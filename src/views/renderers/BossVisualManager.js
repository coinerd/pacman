/**
 * BossVisualManager
 * Manages boss entity visualization (sprite, health bar, phase indicator)
 */

import { gameConfig } from '../../config/gameConfig.js';

export class BossVisualManager {
    constructor(scene) {
        this.scene = scene;

        // Boss visual (single instance, not a Map)
        this.bossVisual = null;
    }

    /**
     * Get boss colors and configuration for a boss type
     * @param {string} bossType - Boss type (alpha, beta, gamma, delta)
     * @returns {Object} - Boss configuration
     */
    getBossColors(bossType) {
        const colors = {
            alpha: { color: 0x9900ff, name: 'Alpha Virus' },
            beta: { color: 0x00ff00, name: 'Beta Virus' },
            gamma: { color: 0xff0000, name: 'Gamma Virus' },
            delta: { color: 0xff8800, name: 'Delta Virus' }
        };
        return { bossConfig: colors[bossType] || colors.alpha };
    }

    /**
     * Create boss visual with sprite, health bar, and phase indicator
     * @param {string} bossType - Boss type
     * @param {Object} bossData - Boss data with position and health
     */
    createBossVisual(bossType, bossData) {
        if (this.bossVisual) {
            return;
        }

        const radius = gameConfig.tileSize * 0.6;

        this.bossVisual = {
            sprite: this.createBossSprite(bossType, bossData.x, bossData.y, radius),
            healthBar: this.createBossHealthBar(bossData, radius),
            phaseIndicator: this.createPhaseIndicator(bossData.x, bossData.y, radius),
            bossType
        };

        this.updateBossVisualPhase(bossType, bossData.phase || 1);
    }

    /**
     * Create boss sprite based on type
     * @param {string} bossType - Boss type
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} radius - Sprite radius
     * @returns {Phaser.GameObjects.Image}
     */
    createBossSprite(bossType, x, y, radius) {
        const { bossConfig } = this.getBossColors(bossType);
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });

        graphics.lineStyle(4, bossConfig.color, 1);

        const sides = this.getBossSides(bossType);

        for (let i = 0; i <= sides; i++) {
            const angle = ((i * 360) / sides - 90) * (Math.PI / 180);
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);

            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }

        graphics.strokePath();
        graphics.generateTexture(`boss-${bossType}`, radius * 3, radius * 3);
        graphics.destroy();

        return this.scene.add.image(x, y, `boss-${bossType}`).setDepth(105);
    }

    /**
     * Get number of sides for boss polygon based on type
     * @param {string} bossType - Boss type
     * @returns {number}
     */
    getBossSides(bossType) {
        switch (bossType) {
        case 'alpha': return 4;
        case 'beta': return 3;
        case 'gamma': return 5;
        case 'delta': return 6;
        default: return 6;
        }
    }

    /**
     * Create boss health bar
     * @param {Object} bossData - Boss data with health info
     * @param {number} radius - Boss radius for positioning
     * @returns {Object} - Health bar with background and fill
     */
    createBossHealthBar(bossData, radius) {
        const barWidth = gameConfig.tileSize * 2;
        const barHeight = 8;

        const background = this.scene.add
            .rectangle(bossData.x, bossData.y - radius - 20, barWidth, barHeight, 0x333333, 1)
            .setDepth(110);

        const maxHealth = bossData.bossMaxHealth || 100;
        const health = bossData.health || 0;

        const fill = this.scene.add
            .rectangle(
                bossData.x - barWidth / 2,
                bossData.y - radius - 20,
                barWidth * (health / maxHealth),
                barHeight,
                0x00ff00,
                1
            )
            .setDepth(111);

        return { background, fill };
    }

    /**
     * Create phase indicator text
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} radius - Boss radius for positioning
     * @returns {Phaser.GameObjects.Text}
     */
    createPhaseIndicator(x, y, radius) {
        const text = this.scene.add
            .text(x, y + radius + 15, 'PHASE 1', {
                fontSize: '12px',
                color: '#00ffaa',
                fontStyle: 'bold'
            })
            .setOrigin(0.5)
            .setDepth(111);

        return text;
    }

    /**
     * Update boss visual from snapshot data
     * @param {Object} bossData - Boss snapshot data
     */
    updateFromSnapshot(bossData) {
        if (!bossData) {
            // Remove boss visual if boss no longer exists
            if (this.bossVisual) {
                this.removeBossVisual();
            }
            return;
        }

        // Create boss visual if it doesn't exist
        if (!this.bossVisual) {
            this.createBossVisual(bossData.type, bossData);
        }

        // Update existing boss visual
        if (this.bossVisual) {
            this.bossVisual.sprite.x = bossData.x;
            this.bossVisual.sprite.y = bossData.y;

            const barWidth = gameConfig.tileSize * 2;
            const healthPercent = bossData.healthPercent || 1;
            this.bossVisual.healthBar.fill.width = barWidth * healthPercent;
            this.bossVisual.healthBar.fill.x = bossData.x - barWidth / 2;

            const healthColor = this.getHealthColor(healthPercent);
            this.bossVisual.healthBar.fill.setFillStyle(healthColor);
        }
    }

    /**
     * Get health color based on percentage
     * @param {number} healthPercent - Health percentage (0-1)
     * @returns {number} - Color value
     */
    getHealthColor(healthPercent) {
        if (healthPercent > 0.5) {return 0x00ff00;}
        if (healthPercent > 0.25) {return 0xffff00;}
        return 0xff0000;
    }

    /**
     * Update boss visual phase
     * @param {string} bossType - Boss type
     * @param {number} phase - Current phase (1, 2, 3, ...)
     */
    updateBossVisualPhase(bossType, phase) {
        if (!this.bossVisual) {
            return;
        }

        this.bossVisual.phaseIndicator.setText(`PHASE ${phase}`);

        const intensity = phase === 1 ? 1 : 1.5;
        this.bossVisual.sprite.setScale(intensity);

        if (phase > 1) {
            this.scene.tweens.add({
                targets: this.bossVisual.sprite,
                scale: intensity + 0.1,
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        }
    }

    /**
     * Flash boss visual for damage feedback
     * @param {string} bossType - Boss type
     */
    flashBossVisual(_bossType) {
        if (!this.bossVisual) {
            return;
        }

        this.scene.tweens.add({
            targets: this.bossVisual.sprite,
            alpha: 0.3,
            duration: 50,
            yoyo: true,
            repeat: 3
        });
    }

    /**
     * Show boss warning message
     * @param {string} bossType - Boss type
     */
    showBossWarning(bossType) {
        const { bossConfig } = this.getBossColors(bossType);

        const warningText = this.scene.add
            .text(
                this.scene.scale.width / 2,
                this.scene.scale.height / 2,
                `${bossConfig.name} APPROACHING`,
                {
                    fontSize: '32px',
                    color: '#ff0000',
                    fontStyle: 'bold',
                    backgroundColor: '#000000',
                    padding: { x: 20, y: 10 }
                }
            )
            .setOrigin(0.5)
            .setDepth(200);

        this.scene.tweens.add({
            targets: warningText,
            alpha: 0,
            duration: 3000,
            delay: 1000,
            onComplete: () => warningText.destroy()
        });
    }

    /**
     * Show boss defeat message
     * @param {number} scoreBonus - Score bonus for defeating boss
     */
    showBossDefeatMessage(scoreBonus) {
        const defeatText = this.scene.add
            .text(
                this.scene.scale.width / 2,
                this.scene.scale.height / 2,
                `BOSS DEFEATED!\n+${scoreBonus} POINTS`,
                {
                    fontSize: '32px',
                    color: '#00ffaa',
                    fontStyle: 'bold',
                    backgroundColor: '#000000',
                    padding: { x: 20, y: 10 }
                }
            )
            .setOrigin(0.5)
            .setDepth(200);

        this.scene.tweens.add({
            targets: defeatText,
            alpha: 0,
            duration: 3000,
            delay: 1000,
            onComplete: () => defeatText.destroy()
        });
    }

    /**
     * Remove boss visual completely
     */
    removeBossVisual() {
        if (!this.bossVisual) {
            return;
        }

        // Kill all tweens on boss sprite before destroying
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this.bossVisual.sprite);
        }

        this.bossVisual.sprite.destroy();
        this.bossVisual.healthBar.background.destroy();
        this.bossVisual.healthBar.fill.destroy();
        this.bossVisual.phaseIndicator.destroy();

        this.bossVisual = null;
    }

    /**
     * Check if boss visual exists
     * @returns {boolean}
     */
    hasBossVisual() {
        return this.bossVisual !== null;
    }

    /**
     * Clean up all boss visuals
     */
    cleanup() {
        this.removeBossVisual();
    }
}
