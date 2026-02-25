/**
 * Menu Scene
 * Main menu with enhanced visuals and "How to Play" section
 */

import Phaser from 'phaser';
import { themeConfig, themeUtils } from '../config/themeConfig.js';
import { SoundManager } from '../managers/SoundManager.js';
import { StorageManager } from '../managers/StorageManager.js';
import { LogoCreator } from '../utils/LogoCreator.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.storageManager = new StorageManager();
        this.highScore = this.storageManager.getHighScore();
        this.soundManager = new SoundManager(this);
        this.theme = themeConfig;
        this.utils = themeUtils;

        this.createBackground();
        this.createTitle();
        this.createHighScore();
        this.createInstructions();
        this.createHowToPlay();
        this.createControls();
        this.createStartPrompt();

        // Keyboard start
        this.input.keyboard.once('keydown-SPACE', () => {
            this.startGame();
        });

        // Touch start - add touch listener for mobile
        this.input.on('pointerdown', () => {
            this.startGame();
        });

        // Also add visible touch buttons for mobile
        this.createTouchStartButton();
        this.createTouchSettingsButton();
        this.createTouchHowToPlayButton();
    }

    /**
	 * Start the game
	 */
    startGame() {
        this.soundManager.initialize();

        const settings = this.storageManager.getSettings();
        if (settings) {
            if (settings.soundEnabled !== undefined) {
                this.soundManager.setEnabled(settings.soundEnabled);
            }
            if (settings.volume !== undefined) {
                this.soundManager.setVolume(settings.volume);
            }
        }

        // Pass high score to GameScene
        this.scene.start('GameScene', {
            level: 1,
            score: 0,
            highScore: this.highScore
        });
    }

    /**
	 * Create touch-friendly start button for mobile
	 */
    createTouchStartButton() {
        const menuFont = this.theme.fonts.menu.item;
        const colors = this.theme.colors;

        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = this.scale.width / 2;
        const buttonY = this.scale.height * 0.85;

        // Button background
        const buttonBg = this.add.rectangle(
            buttonX,
            buttonY,
            buttonWidth,
            buttonHeight,
            0x004444
        );
        buttonBg.setOrigin(0.5);
        buttonBg.setStrokeStyle(2, colors.status.success);

        // Button text
        const buttonText = this.add.text(
            buttonX,
            buttonY,
            'START GAME',
            {
                fontFamily: menuFont.family,
                fontSize: menuFont.size,
                fontStyle: menuFont.style,
                fontWeight: menuFont.weight,
                letterSpacing: menuFont.letterSpacing,
                color: `#${colors.status.success.toString(16).padStart(6, '0')}`
            }
        );
        buttonText.setOrigin(0.5);

        // Make interactive
        buttonBg.setInteractive({ useHandCursor: true });
        buttonBg.on('pointerdown', () => {
            this.startGame();
        });

        // Pulse animation
        this.tweens.add({
            targets: buttonBg,
            scaleX: { from: 1, to: 1.05 },
            scaleY: { from: 1, to: 1.05 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Store references
        this.startButton = {
            bg: buttonBg,
            text: buttonText
        };
    }

    /**
	 * Create touch-friendly settings button for mobile
	 */
    createTouchSettingsButton() {
        const colors = this.theme.colors;
        const buttonSize = 60;
        const margin = 15;

        const buttonBg = this.add.rectangle(
            this.scale.width - margin - buttonSize / 2,
            margin + buttonSize / 2,
            buttonSize,
            buttonSize,
            0x004444
        );
        buttonBg.setOrigin(0.5);
        buttonBg.setStrokeStyle(2, colors.text.primary);

        const buttonText = this.add.text(
            this.scale.width - margin - buttonSize / 2,
            margin + buttonSize / 2,
            '⚙️',
            {
                fontSize: '24px'
            }
        );
        buttonText.setOrigin(0.5);

        buttonBg.setInteractive({ useHandCursor: true });
        buttonBg.on('pointerdown', () => {
            this.scene.start('SettingsScene');
        });

        this.settingsButton = { bg: buttonBg, text: buttonText };
    }

    /**
	 * Create touch-friendly how-to-play button for mobile
	 */
    createTouchHowToPlayButton() {
        const colors = this.theme.colors;
        const buttonWidth = 180;
        const buttonHeight = 50;
        const buttonX = this.scale.width / 2;
        const buttonY = this.scale.height * 0.7;

        const buttonBg = this.add.rectangle(
            buttonX,
            buttonY,
            buttonWidth,
            buttonHeight,
            0x004444
        );
        buttonBg.setOrigin(0.5);
        buttonBg.setStrokeStyle(2, colors.status.info);

        const buttonText = this.add.text(
            buttonX,
            buttonY,
            '? HOW TO PLAY',
            {
                fontSize: '18px',
                color: `#${colors.status.info.toString(16).padStart(6, '0')}`
            }
        );
        buttonText.setOrigin(0.5);

        buttonBg.setInteractive({ useHandCursor: true });
        buttonBg.on('pointerdown', () => {
            this.toggleHowToPlay();
        });

        this.howToPlayButton = { bg: buttonBg, text: buttonText };
    }

    /**
	 * Create background with animated pattern
	 */
    createBackground() {
        const colors = this.theme.colors;

        // Main background
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            colors.background
        );

        // Add circuit grid pattern
        const graphics = this.add.graphics();
        const gridSize = 40;
        const gridAlpha = 0.1;

        // Draw grid lines
        graphics.lineStyle(1, colors.circuit.traceDim, gridAlpha);
        for (let x = 0; x <= this.scale.width; x += gridSize) {
            graphics.lineBetween(x, 0, x, this.scale.height);
        }
        for (let y = 0; y <= this.scale.height; y += gridSize) {
            graphics.lineBetween(0, y, this.scale.width, y);
        }

        // Add circuit nodes
        const nodeSpacing = 120;
        for (let x = nodeSpacing; x < this.scale.width; x += nodeSpacing) {
            for (let y = nodeSpacing; y < this.scale.height; y += nodeSpacing) {
                graphics.fillStyle(colors.circuit.node, 0.15);
                graphics.fillCircle(x, y, 2);

                if ((x + y) % (nodeSpacing * 3) === 0) {
                    graphics.fillStyle(colors.circuit.nodeGlow, 0.3);
                    graphics.fillCircle(x, y, 4);
                }
            }
        }
    }

    /**
	 * Create animated title with tech styling
	 */
    createTitle() {
        this.logoContainer = LogoCreator.createADAWomanLogo(this, {
            x: this.scale.width / 2,
            y: this.scale.height * 0.15,
            scale: 1.2,
            animated: true
        });
    }

    /**
	 * Create high score display
	 */
    createHighScore() {
        const hudFont = this.theme.fonts.hud.score;
        const colors = this.theme.colors;

        const highScoreText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.25,
            `HIGH SCORE: ${this.highScore}`,
            {
                fontFamily: hudFont.family,
                fontSize: hudFont.size,
                fontStyle: hudFont.style,
                fontWeight: hudFont.weight,
                letterSpacing: hudFont.letterSpacing,
                color: `#${colors.accent.toString(16).padStart(6, '0')}`,
                shadowColor: `#${colors.effect.glow.toString(16).padStart(6, '0')}`,
                shadowBlur: hudFont.shadowBlur
            }
        );
        highScoreText.setOrigin(0.5);
    }

    /**
	 * Create basic instructions
	 */
    createInstructions() {
        const menuFont = this.theme.fonts.menu.item;
        const colors = this.theme.colors;

        const instructions = ['Press SPACE to Start', 'Press H for How to Play'];

        let y = this.scale.height * 0.35;
        for (const instruction of instructions) {
            this.add
                .text(this.scale.width / 2, y, instruction, {
                    fontFamily: menuFont.family,
                    fontSize: menuFont.size,
                    fontStyle: menuFont.style,
                    fontWeight: menuFont.weight,
                    letterSpacing: menuFont.letterSpacing,
                    color: `#${colors.text.primary.toString(16).padStart(6, '0')}`
                })
                .setOrigin(0.5);
            y += 30;
        }
    }

    /**
	 * Create how to play section
	 */
    createHowToPlay() {
        this.howToPlayContainer = this.add.container();
        this.howToPlayContainer.setVisible(false);

        const panelWidth = this.scale.width * 0.8;
        const panelHeight = this.scale.height * 0.6;
        const colors = this.theme.colors;
        const panel = this.add.graphics();

        // Panel background
        panel.fillStyle(colors.panel.background, 0.95);
        panel.fillRoundedRect(
            this.scale.width / 2 - panelWidth / 2,
            this.scale.height / 2 - panelHeight / 2,
            panelWidth,
            panelHeight,
            this.theme.circuit.panel.cornerRadius
        );

        // Panel border with circuit style
        panel.lineStyle(2, colors.panel.border, 1);
        panel.strokeRoundedRect(
            this.scale.width / 2 - panelWidth / 2,
            this.scale.height / 2 - panelHeight / 2,
            panelWidth,
            panelHeight,
            this.theme.circuit.panel.cornerRadius
        );

        // Circuit trace decorations
        const traceOffset = 15;
        panel.lineStyle(1, colors.circuit.trace, 0.6);
        panel.strokePoints([
            {
                x: this.scale.width / 2 - panelWidth / 2 + traceOffset,
                y: this.scale.height / 2 - panelHeight / 2 + traceOffset
            },
            {
                x: this.scale.width / 2 + panelWidth / 2 - traceOffset,
                y: this.scale.height / 2 - panelHeight / 2 + traceOffset
            }
        ]);

        const techSubtitle = this.theme.fonts.tech.subtitle;
        const title = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.25,
            'HOW TO PLAY',
            {
                fontFamily: techSubtitle.family,
                fontSize: techSubtitle.size,
                fontStyle: techSubtitle.style,
                fontWeight: techSubtitle.weight,
                letterSpacing: techSubtitle.letterSpacing,
                textTransform: techSubtitle.textTransform,
                color: `#${colors.primary.toString(16).padStart(6, '0')}`
            }
        );
        title.setOrigin(0.5);

        const techBody = this.theme.fonts.tech.body;
        const instructions = [
            '• Navigate maze and collect data bits to complete each level',
            '• Avoid viruses! They will chase you through the maze',
            '• Grab power packets to decrypt viruses temporarily',
            '• When viruses are decrypted, you can eliminate them',
            '• Data fragments appear for extra points',
            '• Each level gets faster and more challenging',
            '',
            'SCORING:',
            '• Data Bit: 10 points',
            '• Power Packet: 50 points',
            '• Virus: 200, 400, 800, 1600 points (combo)',
            '• Data Fragment: 100-5000 points (varies by type)'
        ];

        let y = this.scale.height * 0.35;
        for (const instruction of instructions) {
            this.add
                .text(this.scale.width / 2, y, instruction, {
                    fontFamily: techBody.family,
                    fontSize: techBody.size,
                    fontStyle: techBody.style,
                    fontWeight: techBody.weight,
                    lineHeight: techBody.lineHeight,
                    color: `#${colors.text.primary.toString(16).padStart(6, '0')}`
                })
                .setOrigin(0.5);
            y += 22;
        }

        const closeText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.75,
            'Press H or ESC to Close',
            {
                fontFamily: techBody.family,
                fontSize: techBody.size,
                fontStyle: techBody.style,
                fontWeight: techBody.weight,
                color: `#${colors.status.info.toString(16).padStart(6, '0')}`
            }
        );
        closeText.setOrigin(0.5);

        this.howToPlayContainer.add([panel, title, closeText]);
    }

    /**
	 * Create controls display
	 */
    createControls() {
        const techHeader = this.theme.fonts.tech.header;
        const techBody = this.theme.fonts.tech.body;
        const colors = this.theme.colors;

        const controlsContainer = this.add.container();

        const title = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.55,
            'CONTROLS',
            {
                fontFamily: techHeader.family,
                fontSize: techHeader.size,
                fontStyle: techHeader.style,
                fontWeight: techHeader.weight,
                letterSpacing: techHeader.letterSpacing,
                color: `#${colors.status.info.toString(16).padStart(6, '0')}`
            }
        );
        title.setOrigin(0.5);

        const controls = [
            'ARROW KEYS / WASD - Move',
            'P - Pause Game',
            'ESC - Return to Menu',
            'S - Settings'
        ];

        let y = this.scale.height * 0.6;
        for (const control of controls) {
            this.add
                .text(this.scale.width / 2, y, control, {
                    fontFamily: techBody.family,
                    fontSize: techBody.size,
                    fontStyle: techBody.style,
                    fontWeight: techBody.weight,
                    color: `#${colors.text.primary.toString(16).padStart(6, '0')}`
                })
                .setOrigin(0.5);
            y += 25;
        }

        controlsContainer.add([title]);
    }

    /**
	 * Create start prompt with animation
	 */
    createStartPrompt() {
        const menuFont = this.theme.fonts.menu.item;
        const colors = this.theme.colors;
        const animConfig = this.theme.animations;

        const startText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.85,
            'Press SPACE to Start',
            {
                fontFamily: menuFont.family,
                fontSize: menuFont.size,
                fontStyle: menuFont.style,
                fontWeight: menuFont.weight,
                letterSpacing: menuFont.letterSpacing,
                color: `#${colors.status.success.toString(16).padStart(6, '0')}`
            }
        );
        startText.setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: { from: 1, to: 0.3 },
            duration: animConfig.text.fade.in,
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
