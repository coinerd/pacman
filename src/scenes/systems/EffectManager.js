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
     */
    createPowerPelletEffect() {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xFFFFFF, 0.5);
        graphics.fillCircle(this.scene.pacman.x, this.scene.pacman.y, gameConfig.tileSize * 2);

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
     */
    createGhostEatenEffect() {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xFFFFFF, 0.8);
        graphics.fillCircle(this.scene.pacman.x, this.scene.pacman.y, gameConfig.tileSize * 1.5);

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
     */
    createFruitEatEffect() {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(this.scene.fruit.fruitType.color, 0.8);
        graphics.fillCircle(this.scene.fruit.x, this.scene.fruit.y, gameConfig.tileSize * 1.5);

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
