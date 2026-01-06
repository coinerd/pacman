import Phaser from 'phaser';
import { gameConfig, fruitConfig, colors } from '../config/gameConfig.js';
import { getCenterPixel } from '../utils/MazeLayout.js';

/**
 * Generate fruit textures programmatically
 * @param {Phaser.Scene} scene - The scene to generate textures for
 */
export function generateFruitTextures(scene) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;

    fruitConfig.types.forEach(fruitType => {
        graphics.clear();
        const radius = size * 0.35;

        graphics.fillStyle(fruitType.color, 1);

        switch (fruitType.name) {
        case 'cherry':
            graphics.fillCircle(-radius * 0.4, radius * 0.2, radius * 0.6);
            graphics.fillCircle(radius * 0.4, radius * 0.2, radius * 0.6);
            graphics.lineStyle(2, 0x00FF00);
            graphics.beginPath();
            graphics.moveTo(-radius * 0.4, -radius * 0.4);
            graphics.lineTo(0, -radius * 0.8);
            graphics.lineTo(radius * 0.4, -radius * 0.4);
            graphics.strokePath();
            break;

        case 'strawberry': {
            // Heart shape with polygon approximation
            graphics.beginPath();
            const heartTop = -radius * 0.3;
            const heartWidth = radius * 0.8;
            const heartHeight = radius * 0.7;
            graphics.moveTo(0, heartHeight);
            graphics.lineTo(-heartWidth, heartTop);
            graphics.lineTo(-heartWidth * 0.5, -radius);
            graphics.lineTo(0, -radius * 0.6);
            graphics.lineTo(heartWidth * 0.5, -radius);
            graphics.lineTo(heartWidth, heartTop);
            graphics.closePath();
            graphics.fillPath();

            graphics.fillStyle(0xFFFFFF, 1);
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const seedX = Math.cos(angle) * radius * 0.5;
                const seedY = Math.sin(angle) * radius * 0.5;
                graphics.fillCircle(seedX, seedY, 1);
            }
            break;
        }

        case 'orange':
            graphics.fillCircle(0, 0, radius);
            graphics.fillStyle(0xFFA500, 0.3);
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const dotX = Math.cos(angle) * radius * 0.6;
                const dotY = Math.sin(angle) * radius * 0.6;
                graphics.fillCircle(dotX, dotY, 1);
            }
            break;

        case 'apple':
            // Apple shape with polygon approximation
            graphics.beginPath();
            graphics.moveTo(0, -radius);
            graphics.lineTo(radius * 0.6, -radius * 0.5);
            graphics.lineTo(radius * 0.8, 0);
            graphics.lineTo(radius * 0.6, radius * 0.6);
            graphics.lineTo(0, radius);
            graphics.lineTo(-radius * 0.6, radius * 0.6);
            graphics.lineTo(-radius * 0.8, 0);
            graphics.lineTo(-radius * 0.6, -radius * 0.5);
            graphics.closePath();
            graphics.fillPath();

            graphics.fillStyle(0x8B4513, 1);
            graphics.fillRect(-1, -radius - 3, 2, 4);

            graphics.fillStyle(0x00FF00, 1);
            graphics.beginPath();
            graphics.moveTo(2, -radius - 5);
            graphics.lineTo(6, -radius - 3);
            graphics.lineTo(5, -radius - 1);
            graphics.lineTo(1, -radius - 3);
            graphics.closePath();
            graphics.fillPath();
            break;

        case 'melon':
            graphics.fillCircle(0, 0, radius);
            graphics.fillStyle(0x006400, 0.5);
            graphics.fillRect(-radius * 0.8, -2, radius * 1.6, 4);
            graphics.fillRect(-radius * 0.6, -radius * 0.5, radius * 1.2, 4);
            graphics.fillRect(-radius * 0.6, radius * 0.5, radius * 1.2, 4);
            break;

        case 'galaxian':
            graphics.beginPath();
            graphics.moveTo(0, -radius);
            graphics.lineTo(radius, radius);
            graphics.lineTo(0, radius * 0.5);
            graphics.lineTo(-radius, radius);
            graphics.closePath();
            graphics.fillPath();

            graphics.fillStyle(0xFFFFFF, 1);
            graphics.fillCircle(0, 0, radius * 0.3);
            break;

        case 'bell':
            graphics.beginPath();
            graphics.moveTo(-radius * 0.5, -radius);
            graphics.lineTo(radius * 0.5, -radius);
            graphics.lineTo(radius * 0.7, 0);
            graphics.lineTo(radius * 0.5, radius);
            graphics.lineTo(-radius * 0.5, radius);
            graphics.lineTo(-radius * 0.7, 0);
            graphics.closePath();
            graphics.fillPath();

            graphics.fillStyle(0xFFD700, 1);
            graphics.fillCircle(0, radius + 2, 2);
            break;

        case 'key':
            graphics.lineStyle(2, 0xFFFFFF);
            graphics.strokeCircle(0, -radius * 0.3, radius * 0.4);
            graphics.fillRect(-1, 0, 2, radius * 0.8);
            graphics.fillRect(0, radius * 0.3, radius * 0.3, 2);
            graphics.fillRect(0, radius * 0.5, radius * 0.2, 2);
            break;

        default:
            graphics.fillCircle(0, 0, radius);
        }

        graphics.generateTexture(`fruit-${fruitType.name}`, size, size);
    });

    graphics.destroy();
}

export default class Fruit extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, typeIndex = 0) {
        const pixel = getCenterPixel(x, y);

        super(scene, pixel.x, pixel.y, 'fruit-cherry');

        this.scene = scene;
        this.scene.add.existing(this);
        this.setDepth(100);

        this.gridX = x;
        this.gridY = y;
        this.typeIndex = typeIndex;
        this.fruitType = fruitConfig.types[Math.min(typeIndex, fruitConfig.types.length - 1)];

        this.active = false;
        this.timer = 0;

        this.setVisible(false);
        this.setScale(0);
    }

    activate(duration = 10000) {
        this.active = true;
        this.timer = duration;
        this.setVisible(true);
        this.setScale(0);

        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        this.pulseTween = this.scene.tweens.add({
            targets: this,
            scale: { from: 1, to: 1.1 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    deactivate() {
        this.active = false;
        this.timer = 0;

        if (this.pulseTween) {
            this.pulseTween.stop();
            this.pulseTween = null;
        }

        this.scene.tweens.add({
            targets: this,
            scale: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.setVisible(false);
                this.setScale(1);
            }
        });
    }

    update(delta) {
        if (!this.active) {return false;}

        this.timer -= delta;

        if (this.timer <= 0) {
            this.deactivate();
            return false;
        }

        return false;
    }

    getScore() {
        return this.fruitType.score;
    }

    getGridPosition() {
        return { x: this.gridX, y: this.gridY };
    }

    getPixelPosition() {
        return { x: this.x, y: this.y };
    }

    reset(typeIndex = 0) {
        this.typeIndex = typeIndex;
        this.fruitType = fruitConfig.types[Math.min(typeIndex, fruitConfig.types.length - 1)];
        this.active = false;
        this.timer = 0;
        this.setVisible(false);
        this.setScale(1);

        if (this.pulseTween) {
            this.pulseTween.stop();
            this.pulseTween = null;
        }

        this.setFrame(this.fruitType.name);
    }
}
