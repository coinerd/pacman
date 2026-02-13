/**
 * Pause Scene
 * Displays when game is paused
 * Tech-themed with circuit aesthetics
 */

import Phaser from 'phaser';
import { themeConfig, themeUtils } from '../config/themeConfig.js';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        this.theme = themeConfig;
        this.utils = themeUtils;

        this.createOverlay();
        this.createTitle();
        this.createInstructions();
        this.createControls();

        this.input.keyboard.once('keydown-P', () => {
            this.scene.resume('ModelDrivenGameScene');
            this.scene.stop();
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.resume('ModelDrivenGameScene');
            this.scene.stop();
        });

        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.stop();
            const gameScene = this.scene.get('ModelDrivenGameScene');
            if (gameScene) {
                gameScene.cleanup();
            }
            this.scene.start('MenuScene');
        });
    }

    /**
	 * Create semi-transparent overlay with circuit grid
	 */
    createOverlay() {
        const colors = this.theme.colors;
        const animConfig = this.theme.animations;

        // Semi-transparent background
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.8
        );

        // Add subtle circuit grid
        const graphics = this.add.graphics();
        const gridSize = 40;
        const gridAlpha = 0.15;

        graphics.lineStyle(1, colors.circuit.traceDim, gridAlpha);
        for (let x = 0; x <= this.scale.width; x += gridSize) {
            graphics.lineBetween(x, 0, x, this.scale.height);
        }
        for (let y = 0; y <= this.scale.height; y += gridSize) {
            graphics.lineBetween(0, y, this.scale.width, y);
        }
    }

    /**
	 * Create pause title with tech styling
	 */
    createTitle() {
        const titleFont = this.theme.fonts.overlay.title;
        const colors = this.theme.colors;
        const panelConfig = this.theme.circuit.panel;

        const titleText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.3,
            'PAUSED',
            {
                fontFamily: titleFont.family,
                fontSize: titleFont.size,
                fontStyle: titleFont.style,
                fontWeight: titleFont.weight,
                letterSpacing: titleFont.letterSpacing,
                textTransform: titleFont.textTransform,
                color: `#${colors.warning.toString(16).padStart(6, '0')}`,
                shadowColor: `#${colors.warning.toString(16).padStart(6, '0')}`,
                shadowBlur: 12,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        );
        titleText.setOrigin(0.5);

        // Add circuit panel behind title
        const panelWidth = 300;
        const panelHeight = 80;
        const panel = this.add.graphics();

        panel.fillStyle(colors.panel.background, 0.9);
        panel.lineStyle(2, colors.panel.border, 1);

        panel.fillRoundedRect(
            this.scale.width / 2 - panelWidth / 2,
            this.scale.height * 0.3 - panelHeight / 2,
            panelWidth,
            panelHeight,
            panelConfig.cornerRadius
        );

        panel.strokeRoundedRect(
            this.scale.width / 2 - panelWidth / 2,
            this.scale.height * 0.3 - panelHeight / 2,
            panelWidth,
            panelHeight,
            panelConfig.cornerRadius
        );

        // Move title to be above panel
        titleText.setDepth(10);
    }

    /**
	 * Create instructions
	 */
    createInstructions() {
        const overlayFont = this.theme.fonts.overlay.message;
        const colors = this.theme.colors;

        const instructions = [
            'Press P or SPACE to Resume',
            'Press ESC to Return to Menu'
        ];

        let y = this.scale.height * 0.5;
        for (const instruction of instructions) {
            this.add
                .text(this.scale.width / 2, y, instruction, {
                    fontFamily: overlayFont.family,
                    fontSize: overlayFont.size,
                    fontStyle: overlayFont.style,
                    fontWeight: overlayFont.weight,
                    lineHeight: overlayFont.lineHeight,
                    color: `#${colors.text.primary.toString(16).padStart(6, '0')}`
                })
                .setOrigin(0.5);
            y += 40;
        }
    }

    /**
	 * Create controls display
	 */
    createControls() {
        const techBody = this.theme.fonts.tech.body;
        const colors = this.theme.colors;

        const controls = [
            'ARROW KEYS / WASD - Move',
            'P - Pause/Resume',
            'ESC - Return to Menu'
        ];

        let y = this.scale.height * 0.7;
        for (const control of controls) {
            this.add
                .text(this.scale.width / 2, y, control, {
                    fontFamily: techBody.family,
                    fontSize: techBody.size,
                    fontStyle: techBody.style,
                    fontWeight: techBody.weight,
                    color: `#${colors.status.info.toString(16).padStart(6, '0')}`
                })
                .setOrigin(0.5);
            y += 25;
        }
    }
}
