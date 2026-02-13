/**
 * UIController
 * Manages all UI elements including score, lives, level, and messages
 */

import { animationConfig } from '../../config/gameConfig.js';
import { themeConfig, themeUtils } from '../../config/themeConfig.js';

export class UIController {
    /**
	 * Create UIController
	 * @param {Object} gameScene - The GameScene instance
	 * @param {Object} gameState - Game state object
	 */
    constructor(gameScene, gameState) {
        this.scene = gameScene;
        this.gameState = gameState;
        this.theme = themeConfig;
        this.utils = themeUtils;

        this.scoreText = null;
        this.highScoreText = null;
        this.livesText = null;
        this.levelText = null;
        this.messageContainer = null;

        this.scorePanel = null;
        this.highScorePanel = null;
        this.livesPanel = null;
        this.levelPanel = null;
    }

    /**
	 * Create all UI elements
	 */
    create() {
        const scoreFont = this.theme.fonts.hud.score;
        const techSmall = this.theme.fonts.tech.small;
        const colors = this.theme.colors;
        const circuit = this.theme.circuit;

        const panelHeight = 45;
        const padding = this.theme.layout.spacing.md;
        const borderStyle = circuit.border;

        this.createScorePanel(
            panelHeight,
            padding,
            borderStyle,
            scoreFont,
            techSmall,
            colors,
            circuit
        );
        this.createHighScorePanel(
            panelHeight,
            padding,
            borderStyle,
            scoreFont,
            techSmall,
            colors,
            circuit
        );
        this.createLivesPanel(
            panelHeight,
            padding,
            borderStyle,
            techSmall,
            colors,
            circuit
        );
        this.createLevelPanel(
            panelHeight,
            padding,
            borderStyle,
            scoreFont,
            techSmall,
            colors,
            circuit
        );
    }

    /**
	 * Create score display with circuit panel and digital font
	 */
    createScorePanel(
        panelHeight,
        padding,
        borderStyle,
        scoreFont,
        techSmall,
        colors,
        circuit
    ) {
        const x = 10;
        const y = 10;
        const labelWidth = 75;
        const valueWidth = 120;
        const panelWidth = labelWidth + valueWidth + padding * 2;

        this.scorePanel = this.createCircuitPanel(
            x,
            y,
            panelWidth,
            panelHeight,
            borderStyle,
            colors.panel.background,
            colors.panel.border,
            circuit
        );

        this.scene.add.text(x + padding, y + 10, 'SCORE', {
            fontFamily: techSmall.family,
            fontSize: techSmall.size,
            color: `#${colors.text.secondary.toString(16).padStart(6, '0')}`
        });

        this.scoreText = this.scene.add.text(
            x + labelWidth + padding,
            y + 10,
            `${this.gameState.score}`,
            {
                fontFamily: scoreFont.family,
                fontSize: scoreFont.size,
                color: `#${scoreFont.color.toString(16).padStart(6, '0')}`,
                fontStyle: scoreFont.style,
                fontWeight: scoreFont.weight,
                letterSpacing: scoreFont.letterSpacing,
                shadowColor: `#${scoreFont.shadowColor.toString(16).padStart(6, '0')}`,
                shadowBlur: scoreFont.shadowBlur,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        );
    }

    /**
	 * Create high score display with circuit panel and digital font
	 */
    createHighScorePanel(
        panelHeight,
        padding,
        borderStyle,
        scoreFont,
        techSmall,
        colors,
        circuit
    ) {
        const x = 10;
        const y = 60;
        const labelWidth = 85;
        const valueWidth = 120;
        const panelWidth = labelWidth + valueWidth + padding * 2;

        this.highScorePanel = this.createCircuitPanel(
            x,
            y,
            panelWidth,
            panelHeight,
            borderStyle,
            colors.panel.background,
            colors.panel.border,
            circuit
        );

        this.scene.add.text(x + padding, y + 10, 'HIGH SCORE', {
            fontFamily: techSmall.family,
            fontSize: techSmall.size,
            color: `#${colors.text.secondary.toString(16).padStart(6, '0')}`
        });

        this.highScoreText = this.scene.add.text(
            x + labelWidth + padding,
            y + 10,
            `${this.gameState.highScore}`,
            {
                fontFamily: scoreFont.family,
                fontSize: scoreFont.size,
                color: `#${colors.primary.toString(16).padStart(6, '0')}`,
                fontStyle: scoreFont.style,
                fontWeight: scoreFont.weight,
                letterSpacing: scoreFont.letterSpacing
            }
        );
    }

    /**
	 * Create lives display with circuit panel
	 */
    createLivesPanel(
        panelHeight,
        padding,
        borderStyle,
        techSmall,
        colors,
        circuit
    ) {
        const x = this.scene.scale.width - 10;
        const y = 10;
        const labelWidth = 50;
        const valueWidth = 40;
        const panelWidth = labelWidth + valueWidth + padding * 2;

        this.livesPanel = this.createCircuitPanel(
            x - panelWidth,
            y,
            panelWidth,
            panelHeight,
            borderStyle,
            colors.panel.background,
            colors.panel.border,
            circuit
        );

        this.scene.add.text(x - panelWidth + padding, y + 10, 'LIVES', {
            fontFamily: techSmall.family,
            fontSize: techSmall.size,
            color: `#${colors.text.secondary.toString(16).padStart(6, '0')}`
        });

        this.livesText = this.scene.add.text(
            x - padding,
            y + 10,
            `${this.gameState.lives}`,
            {
                fontFamily: techSmall.family,
                fontSize: '24px',
                color: `#${colors.primary.toString(16).padStart(6, '0')}`,
                fontStyle: 'bold'
            }
        );
        this.livesText.setOrigin(1, 0);
    }

    /**
	 * Create level display with circuit panel and digital font
	 */
    createLevelPanel(
        panelHeight,
        padding,
        borderStyle,
        scoreFont,
        techSmall,
        colors,
        circuit
    ) {
        const x = this.scene.scale.width / 2;
        const y = 10;
        const labelWidth = 50;
        const valueWidth = 50;
        const panelWidth = labelWidth + valueWidth + padding * 2;

        this.levelPanel = this.createCircuitPanel(
            x - panelWidth / 2,
            y,
            panelWidth,
            panelHeight,
            borderStyle,
            colors.panel.background,
            colors.text.accent,
            circuit
        );

        this.scene.add.text(x - panelWidth / 2 + padding, y + 10, 'LVL', {
            fontFamily: techSmall.family,
            fontSize: techSmall.size,
            color: `#${colors.text.secondary.toString(16).padStart(6, '0')}`
        });

        this.levelText = this.scene.add.text(
            x + panelWidth / 2 - padding,
            y + 10,
            `${this.gameState.level}`,
            {
                fontFamily: scoreFont.family,
                fontSize: scoreFont.size,
                color: `#${colors.text.accent.toString(16).padStart(6, '0')}`,
                fontStyle: scoreFont.style,
                fontWeight: scoreFont.weight,
                letterSpacing: scoreFont.letterSpacing,
                shadowColor: `#${scoreFont.shadowColor.toString(16).padStart(6, '0')}`,
                shadowBlur: scoreFont.shadowBlur,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        );
        this.levelText.setOrigin(1, 0);
    }

    /**
	 * Update all UI elements with current game state
	 */
    update() {
        this.scoreText.setText(`${this.gameState.score}`);
        this.highScoreText.setText(`${this.gameState.highScore}`);
        this.livesText.setText(`${this.gameState.lives}`);
        this.levelText.setText(`${this.gameState.level}`);
    }

    /**
	 * Show ready message with tech typography and glow effects
	 */
    showReadyMessage() {
        const titleFont = this.theme.fonts.tech.title;
        const colors = this.theme.colors;

        const messageText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'READY!',
            {
                fontFamily: titleFont.family,
                fontSize: titleFont.size,
                color: `#${colors.text.primary.toString(16).padStart(6, '0')}`,
                fontStyle: titleFont.style,
                fontWeight: titleFont.weight,
                letterSpacing: titleFont.letterSpacing,
                shadowColor: `#${titleFont.shadowColor.toString(16).padStart(6, '0')}`,
                shadowBlur: titleFont.shadowBlur,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        );
        messageText.setOrigin(0.5);
        messageText.setAlpha(0);

        this.scene.tweens.add({
            targets: messageText,
            alpha: 1,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.addPulseGlowEffect(messageText);

                this.scene.time.delayedCall(animationConfig.countdownDuration, () => {
                    this.scene.tweens.add({
                        targets: messageText,
                        alpha: 0,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => messageText.destroy()
                    });
                });
            }
        });
    }

    /**
	 * Show level message with tech typography and glow effects
	 */
    showLevelMessage() {
        const subtitleFont = this.theme.fonts.tech.subtitle;
        const colors = this.theme.colors;

        const messageText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            `LEVEL ${this.gameState.level}`,
            {
                fontFamily: subtitleFont.family,
                fontSize: subtitleFont.size,
                color: `#${colors.text.primary.toString(16).padStart(6, '0')}`,
                fontStyle: subtitleFont.style,
                fontWeight: subtitleFont.weight,
                letterSpacing: subtitleFont.letterSpacing,
                textTransform: subtitleFont.textTransform
            }
        );
        messageText.setOrigin(0.5);
        messageText.setAlpha(0);

        this.scene.tweens.add({
            targets: messageText,
            alpha: 1,
            duration: 300,
            yoyo: true,
            hold: 1500,
            ease: 'Power2',
            onYoyo: () => {
                this.addPulseGlowEffect(messageText);
                this.scene.time.delayedCall(1500, () => messageText.destroy());
            }
        });
    }

    /**
	 * Add pulse glow effect to a text object
	 */
    addPulseGlowEffect(textObject) {
        const pulseConfig = this.theme.animations.pulse;

        this.scene.tweens.add({
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

    /**
	 * Create a circuit-style panel background with glowing borders
	 */
    createCircuitPanel(
        x,
        y,
        width,
        height,
        borderStyle,
        bgColor,
        borderColor,
        circuit
    ) {
        const graphics = this.scene.add.graphics();

        graphics.fillStyle(bgColor, 1);
        graphics.fillRoundedRect(x, y, width, height, borderStyle.cornerRadius);

        graphics.lineStyle(borderStyle.thickness, borderColor, 1);
        graphics.strokeRoundedRect(x, y, width, height, borderStyle.cornerRadius);

        graphics.lineStyle(circuit.trace.width, circuit.trace.color, 0.8);
        graphics.strokePoints([
            {
                x: x + borderStyle.cornerRadius + circuit.trace.nodeRadius,
                y: y + borderStyle.thickness / 2
            },
            {
                x: x + width - borderStyle.cornerRadius - circuit.trace.nodeRadius,
                y: y + borderStyle.thickness / 2
            }
        ]);

        graphics.lineStyle(circuit.trace.width, circuit.trace.color, 0.8);
        graphics.strokePoints([
            {
                x: x + borderStyle.thickness / 2,
                y: y + borderStyle.cornerRadius + circuit.trace.nodeRadius
            },
            {
                x: x + borderStyle.thickness / 2,
                y: y + height - borderStyle.cornerRadius - circuit.trace.nodeRadius
            }
        ]);

        this.createCircuitNode(
            graphics,
            x + borderStyle.cornerRadius,
            y + borderStyle.cornerRadius,
            circuit
        );
        this.createCircuitNode(
            graphics,
            x + width - borderStyle.cornerRadius,
            y + borderStyle.cornerRadius,
            circuit
        );
        this.createCircuitNode(
            graphics,
            x + borderStyle.cornerRadius,
            y + height - borderStyle.cornerRadius,
            circuit
        );
        this.createCircuitNode(
            graphics,
            x + width - borderStyle.cornerRadius,
            y + height - borderStyle.cornerRadius,
            circuit
        );

        return graphics;
    }

    /**
	 * Create a circuit node (glowing connection point)
	 */
    createCircuitNode(graphics, x, y, circuit) {
        graphics.fillStyle(circuit.trace.color, 1);
        graphics.fillCircle(x, y, circuit.trace.nodeRadius);

        graphics.fillStyle(circuit.trace.glowColor, 0.3);
        graphics.fillCircle(x, y, circuit.trace.nodeGlowRadius);
    }

    /**
	 * Cleanup UI elements
	 */
    cleanup() {
        if (this.scoreText) {
            this.scoreText.destroy();
        }
        if (this.highScoreText) {
            this.highScoreText.destroy();
        }
        if (this.livesText) {
            this.livesText.destroy();
        }
        if (this.levelText) {
            this.levelText.destroy();
        }
        if (this.messageContainer) {
            this.messageContainer.destroy();
        }
        if (this.scorePanel) {
            this.scorePanel.destroy();
        }
        if (this.highScorePanel) {
            this.highScorePanel.destroy();
        }
        if (this.livesPanel) {
            this.livesPanel.destroy();
        }
        if (this.levelPanel) {
            this.levelPanel.destroy();
        }
    }
}
