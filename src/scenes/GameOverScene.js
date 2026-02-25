/**
 * Game Over Scene
 * Displays when player loses all lives
 * Tech-themed with circuit aesthetics and digital displays
 */

import Phaser from 'phaser';
import { themeConfig, themeUtils } from '../config/themeConfig.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.highScore = data.highScore || 0;
        this.isNewHighScore = this.finalScore > this.highScore;
        this.theme = themeConfig;
        this.utils = themeUtils;
    }

    create() {
        this.createDigitalBackground();
        this.createCircuitPanel();
        this.createTitle();
        this.createScoreDisplay();
        this.createHighScoreDisplay();
        this.createRestartPrompt();
        this.createScanlineOverlay();

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MenuScene');
        });

        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    /**
	 * Create digital background with grid pattern
	 */
    createDigitalBackground() {
        // Dark background
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            this.theme.colors.background
        );

        // Subtle grid pattern
        const graphics = this.add.graphics();
        graphics.lineStyle(1, this.theme.colors.circuit.traceDim, 0.2);

        const gridSize = 40;
        for (let x = 0; x < this.scale.width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.scale.height);
        }
        for (let y = 0; y < this.scale.height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.scale.width, y);
        }
        graphics.strokePath();
    }

    /**
	 * Create main circuit panel
	 */
    createCircuitPanel() {
        const panelWidth = 400;
        const panelHeight = 500;
        const x = this.scale.width / 2 - panelWidth / 2;
        const y = this.scale.height / 2 - panelHeight / 2;

        this.mainPanel = this.createTechPanel(
            x,
            y,
            panelWidth,
            panelHeight,
            this.theme.colors.panel.background,
            this.theme.colors.panel.border,
            this.theme.circuit.border.cornerRadius
        );
    }

    /**
	 * Create tech-styled panel with circuit traces
	 */
    createTechPanel(x, y, width, height, bgColor, borderColor, cornerRadius) {
        const graphics = this.add.graphics();

        // Panel background
        graphics.fillStyle(bgColor, 0.95);
        graphics.fillRoundedRect(x, y, width, height, cornerRadius);

        // Outer border with glow
        graphics.lineStyle(2, borderColor, 1);
        graphics.strokeRoundedRect(x, y, width, height, cornerRadius);

        // Circuit trace lines
        graphics.lineStyle(1, this.theme.colors.circuit.trace, 0.6);
        const traceOffset = 15;

        // Top trace
        graphics.strokePoints([
            { x: x + traceOffset, y: y + traceOffset },
            { x: x + width - traceOffset, y: y + traceOffset }
        ]);

        // Left trace
        graphics.strokePoints([
            { x: x + traceOffset, y: y + traceOffset },
            { x: x + traceOffset, y: y + height - traceOffset }
        ]);

        // Right trace
        graphics.strokePoints([
            { x: x + width - traceOffset, y: y + traceOffset },
            { x: x + width - traceOffset, y: y + height - traceOffset }
        ]);

        // Bottom trace
        graphics.strokePoints([
            { x: x + traceOffset, y: y + height - traceOffset },
            { x: x + width - traceOffset, y: y + height - traceOffset }
        ]);

        // Corner nodes
        this.createCircuitNode(graphics, x + traceOffset, y + traceOffset);
        this.createCircuitNode(graphics, x + width - traceOffset, y + traceOffset);
        this.createCircuitNode(graphics, x + traceOffset, y + height - traceOffset);
        this.createCircuitNode(
            graphics,
            x + width - traceOffset,
            y + height - traceOffset
        );

        return graphics;
    }

    /**
	 * Create circuit node with glow
	 */
    createCircuitNode(graphics, x, y) {
        graphics.fillStyle(this.theme.colors.circuit.node, 1);
        graphics.fillCircle(x, y, 4);

        graphics.fillStyle(this.theme.colors.circuit.nodeGlow, 0.4);
        graphics.fillCircle(x, y, 8);
    }

    /**
	 * Create game over title with glitch effect
	 */
    createTitle() {
        const titleFont = this.theme.fonts.tech.title;
        const colors = this.theme.colors;

        const titleText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.3,
            'GAME OVER',
            {
                fontFamily: titleFont.family,
                fontSize: '56px',
                color: `#${colors.status.error.toString(16).padStart(6, '0')}`,
                fontStyle: titleFont.style,
                fontWeight: titleFont.weight,
                letterSpacing: titleFont.letterSpacing,
                textTransform: titleFont.textTransform,
                shadowColor: `#${colors.status.error.toString(16).padStart(6, '0')}`,
                shadowBlur: 16,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        );
        titleText.setOrigin(0.5);
        titleText.setAlpha(0);

        // Fade in with glitch effect
        this.tweens.add({
            targets: titleText,
            alpha: 1,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                this.addGlitchEffect(titleText);
            }
        });
    }

    /**
	 * Add glitch effect to text
	 */
    addGlitchEffect(textObject) {
        const glitchConfig = this.theme.animations.glitch;

        // Ensure minimum delay to prevent infinite loop
        const delay = Math.max(glitchConfig.frequency, 50); // Minimum 50ms

        const originalX = textObject.x;
        const originalY = textObject.y;

        this.time.addEvent({
            delay: delay,
            callback: () => {
                if (Math.random() < glitchConfig.probability) {
                    const offsetX = (Math.random() - 0.5) * glitchConfig.intensity * 4;
                    const offsetY = (Math.random() - 0.5) * glitchConfig.intensity * 2;
                    textObject.x = originalX + offsetX;
                    textObject.y = originalY + offsetY;

                    const randomColor =
						glitchConfig.colors[
						    Math.floor(Math.random() * glitchConfig.colors.length)
						];
                    textObject.setTint(randomColor);

                    this.time.delayedCall(glitchConfig.duration, () => {
                        textObject.x = originalX;
                        textObject.y = originalY;
                        textObject.clearTint();
                    });
                }
            },
            loop: true
        });
    }

    /**
	 * Create score display with digital font
	 */
    createScoreDisplay() {
        const digitalFont = this.theme.fonts.digital.sevenSegment;
        const techSubtitle = this.theme.fonts.tech.subtitle;
        const colors = this.theme.colors;

        const labelY = this.scale.height * 0.42;
        const valueY = this.scale.height * 0.48;

        this.add
            .text(this.scale.width / 2, labelY, 'FINAL SCORE', {
                fontFamily: techSubtitle.family,
                fontSize: '20px',
                color: `#${colors.text.secondary.toString(16).padStart(6, '0')}`,
                fontStyle: techSubtitle.style,
                fontWeight: techSubtitle.weight,
                letterSpacing: techSubtitle.letterSpacing,
                textTransform: techSubtitle.textTransform
            })
            .setOrigin(0.5);

        const scoreText = this.add.text(
            this.scale.width / 2,
            valueY,
            this.finalScore.toString(),
            {
                fontFamily: digitalFont.family,
                fontSize: '48px',
                color: `#${colors.digital.active.toString(16).padStart(6, '0')}`,
                fontStyle: digitalFont.style,
                fontWeight: digitalFont.weight,
                letterSpacing: digitalFont.letterSpacing,
                shadowColor: `#${colors.digital.glow.toString(16).padStart(6, '0')}`,
                shadowBlur: digitalFont.shadowBlur,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        );
        scoreText.setOrigin(0.5);
        scoreText.setAlpha(0);

        this.tweens.add({
            targets: scoreText,
            alpha: 1,
            duration: 600,
            ease: 'Power2',
            delay: 500
        });
    }

    /**
	 * Create high score display
	 */
    createHighScoreDisplay() {
        const digitalFont = this.theme.fonts.digital.sevenSegment;
        const techBody = this.theme.fonts.tech.body;
        const colors = this.theme.colors;

        let highScoreText;
        const valueY = this.scale.height * 0.58;

        if (this.isNewHighScore) {
            this.add
                .text(this.scale.width / 2, valueY - 35, 'NEW HIGH SCORE!', {
                    fontFamily: techBody.family,
                    fontSize: '18px',
                    color: `#${colors.status.success.toString(16).padStart(6, '0')}`,
                    fontStyle: 'bold',
                    fontWeight: 'bold'
                })
                .setOrigin(0.5);

            highScoreText = this.add.text(
                this.scale.width / 2,
                valueY,
                this.finalScore.toString(),
                {
                    fontFamily: digitalFont.family,
                    fontSize: '56px',
                    color: `#${colors.status.success.toString(16).padStart(6, '0')}`,
                    fontStyle: digitalFont.style,
                    fontWeight: digitalFont.weight,
                    letterSpacing: digitalFont.letterSpacing,
                    shadowColor: `#${colors.status.success.toString(16).padStart(6, '0')}`,
                    shadowBlur: 16,
                    shadowOffsetX: 0,
                    shadowOffsetY: 0
                }
            );
            highScoreText.setOrigin(0.5);
            highScoreText.setAlpha(0);
            highScoreText.setScale(0.5);

            this.tweens.add({
                targets: highScoreText,
                alpha: 1,
                scale: 1,
                duration: 800,
                ease: 'Back.easeOut',
                delay: 700
            });
        } else {
            this.add
                .text(this.scale.width / 2, valueY - 25, 'HIGH SCORE', {
                    fontFamily: techBody.family,
                    fontSize: '16px',
                    color: `#${colors.text.secondary.toString(16).padStart(6, '0')}`
                })
                .setOrigin(0.5);

            highScoreText = this.add.text(
                this.scale.width / 2,
                valueY + 15,
                this.highScore.toString(),
                {
                    fontFamily: digitalFont.family,
                    fontSize: '40px',
                    color: `#${colors.text.dim.toString(16).padStart(6, '0')}`,
                    fontStyle: digitalFont.style,
                    fontWeight: digitalFont.weight,
                    letterSpacing: digitalFont.letterSpacing
                }
            );
            highScoreText.setOrigin(0.5);
            highScoreText.setAlpha(0);

            this.tweens.add({
                targets: highScoreText,
                alpha: 1,
                duration: 600,
                ease: 'Power2',
                delay: 600
            });
        }
    }

    /**
	 * Create restart prompt with animation
	 */
    createRestartPrompt() {
        const techBody = this.theme.fonts.tech.body;
        const colors = this.theme.colors;
        const animConfig = this.theme.animations;

        const restartText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.75,
            'PRESS SPACE OR ESC TO RETURN TO MENU',
            {
                fontFamily: techBody.family,
                fontSize: '16px',
                color: `#${colors.text.primary.toString(16).padStart(6, '0')}`,
                fontStyle: 'bold',
                letterSpacing: '2px'
            }
        );
        restartText.setOrigin(0.5);
        restartText.setAlpha(0);

        this.tweens.add({
            targets: restartText,
            alpha: 1,
            duration: animConfig.transition.fade,
            ease: 'Power2',
            delay: 800,
            onComplete: () => {
                this.tweens.add({
                    targets: restartText,
                    alpha: { from: 1, to: 0.4 },
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    /**
	 * Create scanline overlay effect
	 */
    createScanlineOverlay() {
        const scanlines = this.add.graphics();
        scanlines.lineStyle(1, 0x000000, 0.05);

        for (let y = 0; y < this.scale.height; y += 3) {
            scanlines.moveTo(0, y);
            scanlines.lineTo(this.scale.width, y);
        }
        scanlines.strokePath();

        scanlines.setScrollFactor(0);
    }
}
