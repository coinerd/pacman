/**
 * Win Scene
 * Displays when player completes a level
 */

import Phaser from 'phaser';
import { colors, uiConfig, animationConfig } from '../config/gameConfig.js';

export default class WinScene extends Phaser.Scene {
    constructor() {
        super('WinScene');
    }

    init(data) {
        this.score = data.score || 0;
        this.level = data.level || 1;
        this.highScore = data.highScore || 0;
    }

    create() {
        this.createBackground();
        this.createTitle();
        this.createScoreDisplay();
        this.createLevelDisplay();
        this.createNextPrompt();

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene', {
                score: this.score,
                level: this.level
            });
        });

        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    /**
     * Create background
     */
    createBackground() {
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            colors.background
        );
    }

    /**
     * Create level complete title
     */
    createTitle() {
        const titleText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.2,
            'LEVEL COMPLETE!',
            {
                fontSize: uiConfig.fonts.title.size,
                color: uiConfig.colors.success,
                fontFamily: uiConfig.fonts.title.family,
                fontStyle: uiConfig.fonts.title.style,
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        titleText.setOrigin(0.5);

        // Add celebration animation
        this.tweens.add({
            targets: titleText,
            scale: { from: 0.5, to: 1.1 },
            alpha: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: titleText,
                    scale: { from: 1.1, to: 1 },
                    duration: 300,
                    ease: 'Sine.easeOut'
                });
            }
        });
    }

    /**
     * Create score display
     */
    createScoreDisplay() {
        const scoreText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.4,
            `Score: ${this.score}`,
            {
                fontSize: uiConfig.fonts.subtitle.size,
                color: uiConfig.colors.accent,
                fontFamily: uiConfig.fonts.subtitle.family,
                fontStyle: 'bold'
            }
        );
        scoreText.setOrigin(0.5);

        const highScoreText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.48,
            `High Score: ${this.highScore}`,
            {
                fontSize: uiConfig.fonts.text.size,
                color: uiConfig.colors.primary,
                fontFamily: uiConfig.fonts.text.family
            }
        );
        highScoreText.setOrigin(0.5);
    }

    /**
     * Create next level display
     */
    createLevelDisplay() {
        const levelText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.58,
            `Next Level: ${this.level}`,
            {
                fontSize: uiConfig.fonts.text.size,
                color: uiConfig.colors.info,
                fontFamily: uiConfig.fonts.text.family,
                fontStyle: 'bold'
            }
        );
        levelText.setOrigin(0.5);

        // Add level progression info
        const infoText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.65,
            'Ghosts will be faster!',
            {
                fontSize: uiConfig.fonts.small.size,
                color: uiConfig.colors.danger,
                fontFamily: uiConfig.fonts.small.family
            }
        );
        infoText.setOrigin(0.5);
    }

    /**
     * Create continue prompt with animation
     */
    createNextPrompt() {
        const nextText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.8,
            'Press SPACE to Continue',
            {
                fontSize: uiConfig.fonts.text.size,
                color: uiConfig.colors.success,
                fontFamily: uiConfig.fonts.text.family,
                fontStyle: 'bold'
            }
        );
        nextText.setOrigin(0.5);

        this.tweens.add({
            targets: nextText,
            alpha: { from: 1, to: 0.3 },
            duration: animationConfig.textFadeSpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}
