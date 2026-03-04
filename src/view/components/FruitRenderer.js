/**
 * FruitRenderer
 * Renders Fruit entity using Phaser graphics.
 * Pure view component - no game logic.
 */

import { gameConfig, fruitConfig } from '../../config/gameConfig.js';

export class FruitRenderer {
    /**
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {FruitState} fruitState - Fruit model state
     */
    constructor(scene, fruitState) {
        this.scene = scene;
        this.state = fruitState;

        // Create graphics object for drawing fruit
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(90);

        // Create score text (shown when eaten)
        this.scoreText = scene.add.text(0, 0, '', {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontStyle: 'bold'
        });
        this.scoreText.setOrigin(0.5);
        this.scoreText.setDepth(91);
        this.scoreText.setVisible(false);

        this.lastFruitType = null;
    }

    /**
	 * Update fruit renderer with new state data
	 * @param {Object} data - Fruit state data
	 */
    update(data) {
        if (!data) {
            return;
        }

        // Update internal state
        this.state = { ...this.state, ...data };

        // Sync visuals
        this.sync();
    }

    /**
     * Sync visual to model state
     */
    sync() {
        if (!this.state) {
            return;
        }

        // Handle both FruitState instances and snapshot objects
        const visualState = this.state.visual || (typeof this.state.getVisualState === 'function' ? this.state.getVisualState() : { active: this.state.active ?? false, bobOffset: 0 });

        if (!visualState.active || !this.state.active) {
            this.graphics.clear();
            this.scoreText.setVisible(false);
            return;
        }

        // Update position with bobbing
        const bobOffset = visualState.bobOffset || 0;
        const drawX = this.state.x;
        const drawY = this.state.y + bobOffset;

        // Get fruit type info - handle both state and snapshot
        const fruitTypeName = visualState.fruitType || (typeof this.state.getFruitType === 'function' ? this.state.getFruitType().name : 'cherry');
        const fruitType = fruitConfig.types.find(t => t.name === fruitTypeName) || fruitConfig.types[0];

        // Redraw if fruit type changed
        if (fruitType.name !== this.lastFruitType) {
            this.lastFruitType = fruitType.name;
        }

        // Clear and redraw
        this.graphics.clear();
        this.drawFruit(drawX, drawY, fruitType);

        // Update score text position
        this.scoreText.x = drawX;
        this.scoreText.y = drawY;
    }

    /**
     * Draw the fruit based on type
     */
    drawFruit(x, y, fruitType) {
        const radius = gameConfig.tileSize * 0.6;

        switch (fruitType.name) {
        case 'cherry':
            this.drawCherry(x, y, radius);
            break;
        case 'strawberry':
            this.drawStrawberry(x, y, radius);
            break;
        case 'orange':
            this.drawOrange(x, y, radius);
            break;
        case 'apple':
            this.drawApple(x, y, radius);
            break;
        case 'melon':
            this.drawMelon(x, y, radius);
            break;
        case 'galaxian':
            this.drawGalaxian(x, y, radius);
            break;
        case 'bell':
            this.drawBell(x, y, radius);
            break;
        case 'key':
            this.drawKey(x, y, radius);
            break;
        default:
            // Default circle
            this.graphics.fillStyle(fruitType.color, 1);
            this.graphics.fillCircle(x, y, radius * 0.5);
        }
    }

    /**
     * Draw cherry (two circles + stem)
     */
    drawCherry(x, y, radius) {
        const color = fruitConfig.types[0].color;

        // Stem
        this.graphics.lineStyle(2, 0x00FF00, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(x, y - radius * 0.5);
        this.graphics.lineTo(x, y - radius);
        this.graphics.strokePath();

        // Two cherries
        this.graphics.fillStyle(color, 1);
        this.graphics.fillCircle(x - radius * 0.3, y + radius * 0.2, radius * 0.35);
        this.graphics.fillCircle(x + radius * 0.3, y + radius * 0.2, radius * 0.35);
    }

    /**
     * Draw strawberry
     */
    drawStrawberry(x, y, radius) {
        const color = fruitConfig.types[1].color;

        this.graphics.fillStyle(color, 1);

        // Body (triangle-ish)
        this.graphics.beginPath();
        this.graphics.moveTo(x, y - radius * 0.8);
        this.graphics.lineTo(x + radius * 0.6, y + radius * 0.4);
        this.graphics.lineTo(x, y + radius * 0.6);
        this.graphics.lineTo(x - radius * 0.6, y + radius * 0.4);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Seeds
        this.graphics.fillStyle(0xFFFF00, 1);
        this.graphics.fillCircle(x, y - radius * 0.2, 2);
        this.graphics.fillCircle(x - radius * 0.2, y + radius * 0.1, 2);
        this.graphics.fillCircle(x + radius * 0.2, y + radius * 0.1, 2);
    }

    /**
     * Draw orange
     */
    drawOrange(x, y, radius) {
        const color = fruitConfig.types[2].color;

        // Main circle
        this.graphics.fillStyle(color, 1);
        this.graphics.fillCircle(x, y, radius * 0.5);

        // Stem
        this.graphics.fillStyle(0x00FF00, 1);
        this.graphics.fillCircle(x, y - radius * 0.5, radius * 0.15);

        // Texture dots
        this.graphics.fillStyle(0xFFA500, 1);
        this.graphics.fillCircle(x - radius * 0.2, y, 2);
        this.graphics.fillCircle(x + radius * 0.2, y, 2);
        this.graphics.fillCircle(x, y - radius * 0.2, 2);
    }

    /**
     * Draw apple
     */
    drawApple(x, y, radius) {
        const color = fruitConfig.types[3].color;

        this.graphics.fillStyle(color, 1);
        this.graphics.fillCircle(x, y + radius * 0.1, radius * 0.45);
        this.graphics.fillCircle(x - radius * 0.25, y - radius * 0.2, radius * 0.35);
        this.graphics.fillCircle(x + radius * 0.25, y - radius * 0.2, radius * 0.35);

        // Stem
        this.graphics.lineStyle(2, 0x8B4513, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(x, y - radius * 0.4);
        this.graphics.lineTo(x, y - radius * 0.7);
        this.graphics.strokePath();
    }

    /**
     * Draw melon
     */
    drawMelon(x, y, radius) {
        const color = fruitConfig.types[4].color;

        // Main body
        this.graphics.fillStyle(color, 1);
        this.graphics.fillEllipse(x, y, radius, radius * 1.2);

        // Stripes
        this.graphics.fillStyle(0x000000, 0.3);
        this.graphics.fillEllipse(x - radius * 0.3, y, radius * 0.1, radius * 0.8);
        this.graphics.fillEllipse(x + radius * 0.3, y, radius * 0.1, radius * 0.8);
    }

    /**
     * Draw Galaxian flagship
     */
    drawGalaxian(x, y, radius) {
        const color = fruitConfig.types[5].color;

        // Main body (triangle)
        this.graphics.fillStyle(color, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(x, y - radius * 0.6);
        this.graphics.lineTo(x + radius * 0.5, y + radius * 0.3);
        this.graphics.lineTo(x - radius * 0.5, y + radius * 0.3);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Wings
        this.graphics.fillStyle(0xFFFFFF, 1);
        this.graphics.fillCircle(x, y, radius * 0.15);
    }

    /**
     * Draw bell
     */
    drawBell(x, y, radius) {
        const color = fruitConfig.types[6].color;

        // Bell body
        this.graphics.fillStyle(color, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(x - radius * 0.4, y - radius * 0.3);
        this.graphics.lineTo(x + radius * 0.4, y - radius * 0.3);
        this.graphics.lineTo(x + radius * 0.5, y + radius * 0.4);
        this.graphics.lineTo(x - radius * 0.5, y + radius * 0.4);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Clapper
        this.graphics.fillStyle(0xFFD700, 1);
        this.graphics.fillCircle(x, y + radius * 0.4, radius * 0.15);
    }

    /**
     * Draw key
     */
    drawKey(x, y, radius) {
        const color = fruitConfig.types[7].color;

        // Key head (circle)
        this.graphics.lineStyle(3, color, 1);
        this.graphics.strokeCircle(x, y - radius * 0.2, radius * 0.25);

        // Key shaft
        this.graphics.lineStyle(3, color, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(x + radius * 0.25, y - radius * 0.2);
        this.graphics.lineTo(x + radius * 0.5, y + radius * 0.4);
        this.graphics.strokePath();

        // Key teeth
        this.graphics.beginPath();
        this.graphics.moveTo(x + radius * 0.35, y + radius * 0.2);
        this.graphics.lineTo(x + radius * 0.5, y + radius * 0.2);
        this.graphics.strokePath();
    }

    /**
     * Show score text temporarily
     * @param {number} score - Score to display
     */
    showScore(score) {
        this.scoreText.setText(score.toString());
        this.scoreText.setVisible(true);

        // Hide after animation
        this.scene.time.delayedCall(1000, () => {
            this.scoreText.setVisible(false);
        });
    }

    /**
     * Destroy visual elements
     */
    destroy() {
        this.graphics.destroy();
        this.scoreText.destroy();
    }
}
