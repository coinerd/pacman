/**
 * Pause Scene
 * Displays when game is paused
 */

import Phaser from 'phaser';
import { colors, uiConfig, animationConfig } from '../config/gameConfig.js';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        this.createOverlay();
        this.createTitle();
        this.createInstructions();
        this.createControls();

        this.input.keyboard.once('keydown-P', () => {
            this.scene.resume('GameScene');
            this.scene.stop();
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.resume('GameScene');
            this.scene.stop();
        });

        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.stop();
            const gameScene = this.scene.get('GameScene');
            if (gameScene) {
                gameScene.cleanup();
            }
            this.scene.start('MenuScene');
        });
    }

    /**
     * Create semi-transparent overlay
     */
    createOverlay() {
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.7
        );
    }

    /**
     * Create pause title
     */
    createTitle() {
        const titleText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.3,
            'PAUSED',
            {
                fontSize: uiConfig.fonts.title.size,
                color: uiConfig.colors.primary,
                fontFamily: uiConfig.fonts.title.family,
                fontStyle: uiConfig.fonts.title.style,
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        titleText.setOrigin(0.5);
    }

    /**
     * Create instructions
     */
    createInstructions() {
        const instructions = [
            'Press P or SPACE to Resume',
            'Press ESC to Return to Menu'
        ];

        let y = this.scale.height * 0.5;
        for (const instruction of instructions) {
            const text = this.add.text(
                this.scale.width / 2,
                y,
                instruction,
                {
                    fontSize: uiConfig.fonts.text.size,
                    color: uiConfig.colors.primary,
                    fontFamily: uiConfig.fonts.text.family
                }
            );
            text.setOrigin(0.5);
            y += 40;
        }
    }

    /**
     * Create controls display
     */
    createControls() {
        const controls = [
            'ARROW KEYS / WASD - Move',
            'P - Pause/Resume',
            'ESC - Return to Menu'
        ];

        let y = this.scale.height * 0.7;
        for (const control of controls) {
            this.add.text(
                this.scale.width / 2,
                y,
                control,
                {
                    fontSize: uiConfig.fonts.small.size,
                    color: uiConfig.colors.info,
                    fontFamily: uiConfig.fonts.small.family
                }
            ).setOrigin(0.5);
            y += 25;
        }
    }
}
