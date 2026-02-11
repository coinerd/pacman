/**
 * EffectManager
 * Manages visual effects like flashes, animations, and particle effects
 */

import { gameConfig } from '../../config/gameConfig.js';

export class EffectManager {
    /**
     * Create EffectManager
     * @param {Object} gameScene - The GameScene instance
     */
    constructor(gameScene) {
        this.scene = gameScene;
    }

    /**
     * Create power pellet activation flash effect
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     */
    createPowerPelletEffect(x, y) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xFFFFFF, 0.5);
        graphics.fillCircle(x, y, gameConfig.tileSize * 2);

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => graphics.destroy()
        });
    }

    /**
     * Create ghost eaten flash effect
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     */
    createGhostEatenEffect(x, y) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xFFFFFF, 0.8);
        graphics.fillCircle(x, y, gameConfig.tileSize * 1.5);

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: () => graphics.destroy()
        });
    }

    /**
     * Create fruit eat effect
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     * @param {string} color - Color of the fruit effect
     */
    createFruitEatEffect(x, y, color) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 0.8);
        graphics.fillCircle(x, y, gameConfig.tileSize * 1.5);

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            scale: 2,
            duration: 400,
            onComplete: () => graphics.destroy()
        });
    }

    /**
     * Cleanup all effects
     */
    cleanup() {
    }
}
