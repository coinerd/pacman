/**
 * Menu Scene
 * Main menu with enhanced visuals and "How to Play" section
 */

import Phaser from 'phaser';
import { colors, uiConfig, animationConfig } from '../config/gameConfig.js';
import { StorageManager } from '../managers/StorageManager.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.storageManager = new StorageManager();
        this.highScore = this.storageManager.getHighScore();

        this.createBackground();
        this.createTitle();
        this.createHighScore();
        this.createInstructions();
        this.createHowToPlay();
        this.createControls();
        this.createStartPrompt();

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene', { level: 1, score: 0 });
        });

        this.input.keyboard.once('keydown-H', () => {
            this.toggleHowToPlay();
        });

        this.input.keyboard.on('keydown-S', () => {
            this.scene.start('SettingsScene');
        });
    }

    /**
     * Create background with animated pattern
     */
    createBackground() {
        // Main background
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            colors.background
        );

        // Add subtle animated dots
        const graphics = this.add.graphics();
        graphics.fillStyle(0x111122, 0.5);

        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.scale.width;
            const y = Math.random() * this.scale.height;
            const size = Math.random() * 3 + 1;
            graphics.fillCircle(x, y, size);
        }
    }

    /**
     * Create animated title
     */
    createTitle() {
        const titleText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.15,
            'PAC-MAN',
            {
                fontSize: uiConfig.fonts.title.size,
                color: colors.pacman,
                fontFamily: uiConfig.fonts.title.family,
                fontStyle: uiConfig.fonts.title.style,
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        titleText.setOrigin(0.5);

        // Add glow effect
        const glowText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.15,
            'PAC-MAN',
            {
                fontSize: uiConfig.fonts.title.size,
                color: colors.pacman,
                fontFamily: uiConfig.fonts.title.family,
                fontStyle: uiConfig.fonts.title.style,
                blur: 10
            }
        );
        glowText.setOrigin(0.5);
        glowText.setAlpha(0.3);

        // Pulse animation
        this.tweens.add({
            targets: [titleText, glowText],
            scale: { from: 1, to: 1.05 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Create high score display
     */
    createHighScore() {
        const highScoreText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.25,
            `HIGH SCORE: ${this.highScore}`,
            {
                fontSize: uiConfig.fonts.text.size,
                color: uiConfig.colors.accent,
                fontFamily: uiConfig.fonts.text.family,
                fontStyle: 'bold'
            }
        );
        highScoreText.setOrigin(0.5);
    }

    /**
     * Create basic instructions
     */
    createInstructions() {
        const instructions = [
            'Press SPACE to Start',
            'Press H for How to Play'
        ];

        let y = this.scale.height * 0.35;
        for (const instruction of instructions) {
            this.add.text(
                this.scale.width / 2,
                y,
                instruction,
                {
                    fontSize: uiConfig.fonts.small.size,
                    color: uiConfig.colors.primary,
                    fontFamily: uiConfig.fonts.small.family
                }
            ).setOrigin(0.5);
            y += 30;
        }
    }

    /**
     * Create how to play section
     */
    createHowToPlay() {
        this.howToPlayContainer = this.add.container();
        this.howToPlayContainer.setVisible(false);

        const panel = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width * 0.8,
            this.scale.height * 0.6,
            0x000033,
            0.95
        );
        panel.setStrokeStyle(2, uiConfig.colors.accent);

        const title = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.25,
            'HOW TO PLAY',
            {
                fontSize: uiConfig.fonts.subtitle.size,
                color: uiConfig.colors.primary,
                fontFamily: uiConfig.fonts.subtitle.family,
                fontStyle: uiConfig.fonts.subtitle.style
            }
        );
        title.setOrigin(0.5);

        const instructions = [
            '• Navigate the maze and eat all pellets to complete each level',
            '• Avoid the ghosts! They will chase you through the maze',
            '• Eat power pellets (large dots) to turn ghosts blue',
            '• When ghosts are blue, you can eat them for bonus points',
            '• Fruits appear periodically for extra points',
            '• Each level gets faster and more challenging',
            '',
            'SCORING:',
            '• Pellet: 10 points',
            '• Power Pellet: 50 points',
            '• Ghost: 200, 400, 800, 1600 points (combo)',
            '• Fruit: 100-5000 points (varies by type)'
        ];

        let y = this.scale.height * 0.35;
        for (const instruction of instructions) {
            this.add.text(
                this.scale.width / 2,
                y,
                instruction,
                {
                    fontSize: uiConfig.fonts.small.size,
                    color: uiConfig.colors.primary,
                    fontFamily: uiConfig.fonts.small.family
                }
            ).setOrigin(0.5);
            y += 22;
        }

        const closeText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.75,
            'Press H or ESC to Close',
            {
                fontSize: uiConfig.fonts.small.size,
                color: uiConfig.colors.info,
                fontFamily: uiConfig.fonts.small.family
            }
        );
        closeText.setOrigin(0.5);

        this.howToPlayContainer.add([panel, title, closeText]);
    }

    /**
     * Create controls display
     */
    createControls() {
        const controlsContainer = this.add.container();

        const title = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.55,
            'CONTROLS',
            {
                fontSize: uiConfig.fonts.text.size,
                color: uiConfig.colors.info,
                fontFamily: uiConfig.fonts.text.family,
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5);

        const controls = [
            'ARROW KEYS / WASD - Move',
            'P - Pause Game',
            'ESC - Return to Menu',
            'S - Settings'
        ];

        let y = this.scale.height * 0.60;
        for (const control of controls) {
            this.add.text(
                this.scale.width / 2,
                y,
                control,
                {
                    fontSize: uiConfig.fonts.small.size,
                    color: uiConfig.colors.primary,
                    fontFamily: uiConfig.fonts.small.family
                }
            ).setOrigin(0.5);
            y += 25;
        }

        controlsContainer.add([title]);
    }

    /**
     * Create start prompt with animation
     */
    createStartPrompt() {
        const startText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.85,
            'Press SPACE to Start',
            {
                fontSize: uiConfig.fonts.text.size,
                color: uiConfig.colors.success,
                fontFamily: uiConfig.fonts.text.family,
                fontStyle: 'bold'
            }
        );
        startText.setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: { from: 1, to: 0.3 },
            duration: animationConfig.textFadeSpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Toggle how to play visibility
     */
    toggleHowToPlay() {
        const isVisible = !this.howToPlayContainer.visible;
        this.howToPlayContainer.setVisible(isVisible);

        if (isVisible) {
            this.input.keyboard.once('keydown-H', () => this.toggleHowToPlay());
            this.input.keyboard.once('keydown-ESC', () => this.toggleHowToPlay());
        }
    }
}
