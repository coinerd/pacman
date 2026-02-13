/**
 * Win Scene
 * Displays when player completes a level
 * Tech-themed with circuit aesthetics and digital displays
 */

import Phaser from 'phaser';
import { themeConfig, themeUtils } from '../config/themeConfig.js';

export default class WinScene extends Phaser.Scene {
    constructor() {
        super('WinScene');
    }

    init(data) {
        this.score = data.score || 0;
        this.level = data.level || 1;
        this.highScore = data.highScore || 0;
        this.theme = themeConfig;
        this.utils = themeUtils;
    }

    create() {
        this.createDigitalBackground();
        this.createCircuitPanel();
        this.createTitle();
        this.createScoreDisplay();
        this.createLevelDisplay();
        this.createNextPrompt();
        this.createScanlineOverlay();

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('ModelDrivenGameScene', {
                score: this.score,
                level: this.level + 1,
                highScore: this.highScore
            });
        });

        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    createDigitalBackground() {
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            this.theme.colors.background
        );

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

    createTechPanel(x, y, width, height, bgColor, borderColor, cornerRadius) {
        const graphics = this.add.graphics();

        graphics.fillStyle(bgColor, 0.95);
        graphics.fillRoundedRect(x, y, width, height, cornerRadius);

        graphics.lineStyle(2, borderColor, 1);
        graphics.strokeRoundedRect(x, y, width, height, cornerRadius);

        graphics.lineStyle(1, this.theme.colors.circuit.trace, 0.6);
        const traceOffset = 15;

        graphics.strokePoints([
            { x: x + traceOffset, y: y + traceOffset },
            { x: x + width - traceOffset, y: y + traceOffset }
        ]);

        graphics.strokePoints([
            { x: x + traceOffset, y: y + traceOffset },
            { x: x + traceOffset, y: y + height - traceOffset }
        ]);

        graphics.strokePoints([
            { x: x + width - traceOffset, y: y + traceOffset },
            { x: x + width - traceOffset, y: y + height - traceOffset }
        ]);

        graphics.strokePoints([
            { x: x + traceOffset, y: y + height - traceOffset },
            { x: x + width - traceOffset, y: y + height - traceOffset }
        ]);

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

    createCircuitNode(graphics, x, y) {
        graphics.fillStyle(this.theme.colors.circuit.node, 1);
        graphics.fillCircle(x, y, 4);

        graphics.fillStyle(this.theme.colors.circuit.nodeGlow, 0.4);
        graphics.fillCircle(x, y, 8);
    }

    createTitle() {
        const titleFont = this.theme.fonts.tech.title;
        const colors = this.theme.colors;

        const titleText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.25,
            'LEVEL COMPLETE',
            {
                fontFamily: titleFont.family,
                fontSize: '48px',
                color: `#${colors.status.success.toString(16).padStart(6, '0')}`,
                fontStyle: titleFont.style,
                fontWeight: titleFont.weight,
                letterSpacing: titleFont.letterSpacing,
                textTransform: titleFont.textTransform,
                shadowColor: `#${colors.status.success.toString(16).padStart(6, '0')}`,
                shadowBlur: 16,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        );
        titleText.setOrigin(0.5);
        titleText.setAlpha(0);
        titleText.setScale(0.5);

        this.tweens.add({
            targets: titleText,
            alpha: 1,
            scale: 1,
            duration: 600,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.addPulseEffect(titleText);
            }
        });
    }

    addPulseEffect(textObject) {
        const pulseConfig = this.theme.animations.pulse;

        this.tweens.add({
            targets: textObject,
            scaleX: pulseConfig.maxScale,
            scaleY: pulseConfig.maxScale,
            alpha: pulseConfig.maxAlpha,
            duration: pulseConfig.speed / 2,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createScoreDisplay() {
        const digitalFont = this.theme.fonts.digital.sevenSegment;
        const techSubtitle = this.theme.fonts.tech.subtitle;
        const colors = this.theme.colors;

        const labelY = this.scale.height * 0.4;
        const scoreY = this.scale.height * 0.46;
        const highScoreY = this.scale.height * 0.53;

        this.add
            .text(this.scale.width / 2, labelY, 'CURRENT SCORE', {
                fontFamily: techSubtitle.family,
                fontSize: '18px',
                color: `#${colors.text.secondary.toString(16).padStart(6, '0')}`,
                fontStyle: techSubtitle.style,
                fontWeight: techSubtitle.weight,
                letterSpacing: techSubtitle.letterSpacing,
                textTransform: techSubtitle.textTransform
            })
            .setOrigin(0.5);

        const scoreText = this.add
            .text(this.scale.width / 2, scoreY, this.score.toString(), {
                fontFamily: digitalFont.family,
                fontSize: '40px',
                color: `#${colors.digital.active.toString(16).padStart(6, '0')}`,
                fontStyle: digitalFont.style,
                fontWeight: digitalFont.weight,
                letterSpacing: digitalFont.letterSpacing,
                shadowColor: `#${colors.digital.glow.toString(16).padStart(6, '0')}`,
                shadowBlur: digitalFont.shadowBlur,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            })
            .setOrigin(0.5);
        scoreText.setAlpha(0);

        this.tweens.add({
            targets: scoreText,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            delay: 400
        });

        this.add
            .text(this.scale.width / 2, highScoreY, `HIGH SCORE: ${this.highScore}`, {
                fontFamily: techSubtitle.family,
                fontSize: '16px',
                color: `#${colors.text.secondary.toString(16).padStart(6, '0')}`,
                fontStyle: techSubtitle.style,
                fontWeight: techSubtitle.weight
            })
            .setOrigin(0.5);
    }

    createLevelDisplay() {
        const digitalFont = this.theme.fonts.digital.sevenSegment;
        const techBody = this.theme.fonts.tech.body;
        const colors = this.theme.colors;

        const valueY = this.scale.height * 0.63;

        this.add
            .text(this.scale.width / 2, valueY - 25, 'NEXT LEVEL', {
                fontFamily: techBody.family,
                fontSize: '16px',
                color: `#${colors.text.secondary.toString(16).padStart(6, '0')}`,
                fontStyle: 'bold',
                fontWeight: 'bold'
            })
            .setOrigin(0.5);

        const levelText = this.add
            .text(this.scale.width / 2, valueY + 10, (this.level + 1).toString(), {
                fontFamily: digitalFont.family,
                fontSize: '56px',
                color: `#${colors.status.info.toString(16).padStart(6, '0')}`,
                fontStyle: digitalFont.style,
                fontWeight: digitalFont.weight,
                letterSpacing: digitalFont.letterSpacing,
                shadowColor: `#${colors.status.info.toString(16).padStart(6, '0')}`,
                shadowBlur: 16,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            })
            .setOrigin(0.5);
        levelText.setAlpha(0);
        levelText.setScale(0.5);

        this.tweens.add({
            targets: levelText,
            alpha: 1,
            scale: 1,
            duration: 700,
            ease: 'Back.easeOut',
            delay: 600
        });

        this.add
            .text(this.scale.width / 2, valueY + 55, '⚠ VIRUSES WILL BE FASTER', {
                fontFamily: techBody.family,
                fontSize: '14px',
                color: `#${colors.status.warning.toString(16).padStart(6, '0')}`,
                fontStyle: 'italic',
                fontWeight: 'bold'
            })
            .setOrigin(0.5);
    }

    createNextPrompt() {
        const techBody = this.theme.fonts.tech.body;
        const colors = this.theme.colors;
        const animConfig = this.theme.animations;

        const nextText = this.add
            .text(
                this.scale.width / 2,
                this.scale.height * 0.8,
                'PRESS SPACE TO CONTINUE',
                {
                    fontFamily: techBody.family,
                    fontSize: '16px',
                    color: `#${colors.text.primary.toString(16).padStart(6, '0')}`,
                    fontStyle: 'bold',
                    letterSpacing: '2px'
                }
            )
            .setOrigin(0.5);
        nextText.setAlpha(0);

        this.tweens.add({
            targets: nextText,
            alpha: 1,
            duration: animConfig.transition.fade,
            ease: 'Power2',
            delay: 900,
            onComplete: () => {
                this.tweens.add({
                    targets: nextText,
                    alpha: { from: 1, to: 0.4 },
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

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
