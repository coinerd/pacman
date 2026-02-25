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
        this.snapshot = null; // Will be updated with snapshots
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
            scoreFont,
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

        // Panel background
        this.scorePanel = this.scene.add.rectangle(
            x + panelWidth / 2,
            y + panelHeight / 2,
            panelWidth,
            panelHeight,
            colors.panel.background
        );
        this.scorePanel.setStrokeStyle(borderStyle.thickness || 2, borderStyle.color, borderStyle.alpha || 1);
        this.scorePanel.setAlpha(colors.panel.alpha);
        this.scorePanel.setDepth(900);
        this.scorePanel.setScrollFactor(0);



        // Circuit corners
        this.drawCircuitCorners(x, y, panelWidth, panelHeight, colors, circuit);

        // Score label
        const scoreLabel = this.scene.add.text(
            x + padding + labelWidth / 2,
            y + panelHeight / 2,
            'SCORE',
            {
                fontFamily: techSmall.family,
                fontSize: techSmall.size,
                fontStyle: techSmall.style,
                fontWeight: techSmall.weight,
                letterSpacing: techSmall.letterSpacing,
                color: `#${colors.accent.toString(16).padStart(6, '0')}`
            }
        );
        scoreLabel.setOrigin(0.5);
        scoreLabel.setDepth(950);
        scoreLabel.setScrollFactor(0);

        // Score value
        this.scoreText = this.scene.add.text(
            x + padding + labelWidth + valueWidth / 2,
            y + panelHeight / 2,
            '0',
            {
                fontFamily: scoreFont.family,
                fontSize: scoreFont.size,
                fontStyle: scoreFont.style,
                fontWeight: scoreFont.weight,
                letterSpacing: scoreFont.letterSpacing,
                color: '#00ced1', // Explicit cyan color
                backgroundColor: '#000000', // Add background for visibility
                padding: { x: 2, y: 2 }
            }
        );
        this.scoreText.setOrigin(0.5);
        this.scoreText.setDepth(1000);
        this.scoreText.setScrollFactor(0);
    }

    /**
	 * Create high score display
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
        const y = panelHeight + 20;
        const labelWidth = 100;
        const valueWidth = 120;
        const panelWidth = labelWidth + valueWidth + padding * 2;

        // Panel background
        this.highScorePanel = this.scene.add.rectangle(
            x + panelWidth / 2,
            y + panelHeight / 2,
            panelWidth,
            panelHeight,
            colors.panel.background
        );
        this.highScorePanel.setStrokeStyle(borderStyle.width, borderStyle.color, borderStyle.alpha);
        this.highScorePanel.setAlpha(colors.panel.alpha);
        this.highScorePanel.setDepth(900);
        this.highScorePanel.setScrollFactor(0);

        // Circuit corners
        this.drawCircuitCorners(x, y, panelWidth, panelHeight, colors, circuit);

        // High score label
        const highScoreLabel = this.scene.add.text(
            x + padding + labelWidth / 2,
            y + panelHeight / 2,
            'HIGH SCORE',
            {
                fontFamily: techSmall.family,
                fontSize: techSmall.size,
                fontStyle: techSmall.style,
                fontWeight: techSmall.weight,
                letterSpacing: techSmall.letterSpacing,
                color: `#${colors.accent.toString(16).padStart(6, '0')}`
            }
        );
        highScoreLabel.setOrigin(0.5);
        highScoreLabel.setDepth(950);
        highScoreLabel.setScrollFactor(0);

        // High score value
        this.highScoreText = this.scene.add.text(
            x + padding + labelWidth + valueWidth / 2,
            y + panelHeight / 2,
            '0',
            {
                fontFamily: scoreFont.family,
                fontSize: scoreFont.size,
                fontStyle: scoreFont.style,
                fontWeight: scoreFont.weight,
                letterSpacing: scoreFont.letterSpacing,
                color: `#${colors.text.primary.toString(16).padStart(6, '0')}`
            }
        );
        this.highScoreText.setOrigin(0.5);
        this.highScoreText.setDepth(1000);
        this.highScoreText.setScrollFactor(0);
        this.highScoreText.setVisible(true);
        this.highScoreText.setAlpha(1);
    }

    /**
	 * Create lives display
	 */
    createLivesPanel(
        panelHeight,
        padding,
        borderStyle,
        scoreFont,
        techSmall,
        colors,
        circuit
    ) {
        const x = 10;
        const y = panelHeight * 2 + 30;
        const labelWidth = 75;
        const valueWidth = 80;
        const panelWidth = labelWidth + valueWidth + padding * 2;

        // Panel background
        this.livesPanel = this.scene.add.rectangle(
            x + panelWidth / 2,
            y + panelHeight / 2,
            panelWidth,
            panelHeight,
            colors.panel.background
        );
        this.livesPanel.setStrokeStyle(borderStyle.width, borderStyle.color, borderStyle.alpha);
        this.livesPanel.setAlpha(colors.panel.alpha);
        this.livesPanel.setDepth(900);
        this.livesPanel.setScrollFactor(0);

        // Circuit corners
        this.drawCircuitCorners(x, y, panelWidth, panelHeight, colors, circuit);

        // Lives label
        const livesLabel = this.scene.add.text(
            x + padding + labelWidth / 2,
            y + panelHeight / 2,
            'LIVES',
            {
                fontFamily: techSmall.family,
                fontSize: techSmall.size,
                fontStyle: techSmall.style,
                fontWeight: techSmall.weight,
                letterSpacing: techSmall.letterSpacing,
                color: `#${colors.accent.toString(16).padStart(6, '0')}`
            }
        );
        livesLabel.setOrigin(0.5);
        livesLabel.setDepth(950);
        livesLabel.setScrollFactor(0);

        // Lives value
        this.livesText = this.scene.add.text(
            x + padding + labelWidth + valueWidth / 2,
            y + panelHeight / 2,
            '3',
            {
                fontFamily: scoreFont.family,
                fontSize: scoreFont.size,
                fontStyle: scoreFont.style,
                fontWeight: scoreFont.weight,
                letterSpacing: scoreFont.letterSpacing,
                color: `#${colors.text.primary.toString(16).padStart(6, '0')}`
            }
        );
        this.livesText.setOrigin(0.5);
        this.livesText.setDepth(1000);
        this.livesText.setScrollFactor(0);
        this.livesText.setVisible(true);
        this.livesText.setAlpha(1);
    }

    /**
	 * Create level display
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
        const x = 10;
        const y = panelHeight * 3 + 40;
        const labelWidth = 75;
        const valueWidth = 80;
        const panelWidth = labelWidth + valueWidth + padding * 2;

        // Panel background
        this.levelPanel = this.scene.add.rectangle(
            x + panelWidth / 2,
            y + panelHeight / 2,
            panelWidth,
            panelHeight,
            colors.panel.background
        );
        this.levelPanel.setStrokeStyle(borderStyle.width, borderStyle.color, borderStyle.alpha);
        this.levelPanel.setAlpha(colors.panel.alpha);
        this.levelPanel.setDepth(900);
        this.levelPanel.setScrollFactor(0);

        // Circuit corners
        this.drawCircuitCorners(x, y, panelWidth, panelHeight, colors, circuit);

        // Level label
        const levelLabel = this.scene.add.text(
            x + padding + labelWidth / 2,
            y + panelHeight / 2,
            'LEVEL',
            {
                fontFamily: techSmall.family,
                fontSize: techSmall.size,
                fontStyle: techSmall.style,
                fontWeight: techSmall.weight,
                letterSpacing: techSmall.letterSpacing,
                color: `#${colors.accent.toString(16).padStart(6, '0')}`
            }
        );
        levelLabel.setOrigin(0.5);
        levelLabel.setDepth(950);
        levelLabel.setScrollFactor(0);

        // Level value
        this.levelText = this.scene.add.text(
            x + padding + labelWidth + valueWidth / 2,
            y + panelHeight / 2,
            '1',
            {
                fontFamily: scoreFont.family,
                fontSize: scoreFont.size,
                fontStyle: scoreFont.style,
                fontWeight: scoreFont.weight,
                letterSpacing: scoreFont.letterSpacing,
                color: `#${colors.text.primary.toString(16).padStart(6, '0')}`
            }
        );
        this.levelText.setOrigin(0.5);
        this.levelText.setDepth(1000);
        this.levelText.setScrollFactor(0);
        this.levelText.setVisible(true);
        this.levelText.setAlpha(1);
    }

    /**
	 * Draw circuit corners on panel
	 */
    drawCircuitCorners(x, y, width, height, colors, circuit) {
        const cornerSize = circuit.cornerSize;

        // Top-left corner
        const tlCorner = this.scene.add.graphics();
        tlCorner.lineStyle(2, colors.circuit.traceDim, 0.5);
        tlCorner.beginPath();
        tlCorner.moveTo(x, y + cornerSize);
        tlCorner.lineTo(x, y);
        tlCorner.lineTo(x + cornerSize, y);
        tlCorner.strokePath();

        // Top-right corner
        const trCorner = this.scene.add.graphics();
        trCorner.lineStyle(2, colors.circuit.traceDim, 0.5);
        trCorner.beginPath();
        trCorner.moveTo(x + width - cornerSize, y);
        trCorner.lineTo(x + width, y);
        trCorner.lineTo(x + width, y + cornerSize);
        trCorner.strokePath();

        // Bottom-left corner
        const blCorner = this.scene.add.graphics();
        blCorner.lineStyle(2, colors.circuit.traceDim, 0.5);
        blCorner.beginPath();
        blCorner.moveTo(x, y + height - cornerSize);
        blCorner.lineTo(x, y + height);
        blCorner.lineTo(x + cornerSize, y + height);
        blCorner.strokePath();

        // Bottom-right corner
        const brCorner = this.scene.add.graphics();
        brCorner.lineStyle(2, colors.circuit.traceDim, 0.5);
        brCorner.beginPath();
        brCorner.moveTo(x + width - cornerSize, y + height);
        brCorner.lineTo(x + width, y + height);
        brCorner.lineTo(x + width, y + height - cornerSize);
        brCorner.strokePath();
    }

    /**
	 * Update all UI elements with current game state
	 */
    update() {
        // Use snapshot if available, otherwise fall back to gameState
        const score = this.snapshot?.score ?? this.gameState?.score ?? 0;
        const highScore = this.snapshot?.highScore ?? this.gameState?.highScore ?? 0;
        const lives = this.snapshot?.lives ?? this.gameState?.lives ?? 3;
        const level = this.snapshot?.level ?? this.gameState?.level ?? 1;

        // Debug: verify text objects exist
        if (!this.scoreText || !this.highScoreText || !this.livesText || !this.levelText) {
            console.error('[UIController.update] Text objects not initialized!');
            return;
        }

        this.scoreText.setText(`${score}`);
        this.highScoreText.setText(`${highScore}`);
        this.livesText.setText(`${lives}`);
        this.levelText.setText(`${level}`);
    }

    /**
	 * Update UI from snapshot (new architecture)
	 * @param {Object} snapshot - Game state snapshot
	 */
    updateFromSnapshot(snapshot) {
        console.log('[UIController.updateFromSnapshot] Called with snapshot:', {
            score: snapshot.score,
            highScore: snapshot.highScore,
            lives: snapshot.lives,
            level: snapshot.level
        });

        this.snapshot = snapshot;
        this.update();
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
    showLevelMessage(level) {
        const titleFont = this.theme.fonts.tech.title;
        const colors = this.theme.colors;

        const messageText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            `LEVEL ${level}`,
            {
                fontFamily: titleFont.family,
                fontSize: titleFont.size,
                color: `#${colors.status.success.toString(16).padStart(6, '0')}`,
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
	 * Show game over message
	 */
    showGameOverMessage() {
        const titleFont = this.theme.fonts.tech.title;
        const colors = this.theme.colors;

        const messageText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'GAME OVER',
            {
                fontFamily: titleFont.family,
                fontSize: titleFont.size,
                color: `#${colors.status.error.toString(16).padStart(6, '0')}`,
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

                this.scene.time.delayedCall(3000, () => {
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
	 * Add pulse glow effect to text
	 */
    addPulseGlowEffect(textObject) {
        this.scene.tweens.add({
            targets: textObject,
            alpha: { from: 1, to: 0.7 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
	 * Destroy all UI elements
	 */
    destroy() {
        if (this.scoreText) {this.scoreText.destroy();}
        if (this.highScoreText) {this.highScoreText.destroy();}
        if (this.livesText) {this.livesText.destroy();}
        if (this.levelText) {this.levelText.destroy();}
        if (this.scorePanel) {this.scorePanel.destroy();}
        if (this.highScorePanel) {this.highScorePanel.destroy();}
        if (this.livesPanel) {this.livesPanel.destroy();}
        if (this.levelPanel) {this.levelPanel.destroy();}
    }
}
