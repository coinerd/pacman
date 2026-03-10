/**
 * UIController
 * Coordinates all HUD widgets in a modern horizontal layout.
 */

import { animationConfig } from '../../config/gameConfig.js';
import { themeConfig } from '../../config/themeConfig.js';
import {
    ScoreBoard,
    HighScoreWidget,
    LivesWidget,
    LevelWidget
} from '../../view/components/hud/index.js';

export class UIController {
    constructor(gameScene, playerScoreFacade) {
        this.scene = gameScene;
        this.playerScoreFacade = playerScoreFacade;
        this.theme = themeConfig;

        this.scoreBoard = new ScoreBoard();
        this.highScoreWidget = new HighScoreWidget();
        this.livesWidget = new LivesWidget();
        this.levelWidget = new LevelWidget();

        // Speichere die letzten bekannten Werte für Animationen
        this.lastScore = 0;
        this.lastHighScore = 0;
        
        this.hudContainer = null;
        this.panelBg = null;
        this.panelBorder = null;
        this.cornerDecorations = [];
    }

    create() {
        this.createHUDPanel();
        this.createWidgets();
    }

    createHUDPanel() {
        const scene = this.scene;
        const colors = themeConfig.colors;
        
        const panelWidth = 480;
        const panelHeight = 60;
        const x = 20;
        const y = 15;

        this.hudContainer = scene.add.container(x, y);
        this.hudContainer.setDepth(900);
        this.hudContainer.setScrollFactor(0);

        this.panelBg = scene.add.rectangle(
            panelWidth / 2,
            panelHeight / 2,
            panelWidth,
            panelHeight,
            colors.panel.background,
            0.7
        );
        this.panelBg.setDepth(900);

        this.panelBorder = scene.add.graphics();
        this.panelBorder.lineStyle(2, colors.panel.border, 0.8);
        this.panelBorder.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
        this.panelBorder.setDepth(901);

        this.createCornerDecorations(panelWidth, panelHeight);

        this.hudContainer.add([this.panelBg, this.panelBorder, ...this.cornerDecorations]);
        
        this.startPanelGlow();
    }

    createCornerDecorations(width, height) {
        const colors = themeConfig.colors;
        const cornerSize = 10;
        
        const positions = [
            { x: 0, y: 0, h: [1, 0], v: [0, 1] },
            { x: width, y: 0, h: [-1, 0], v: [0, 1] },
            { x: 0, y: height, h: [1, 0], v: [0, -1] },
            { x: width, y: height, h: [-1, 0], v: [0, -1] }
        ];

        positions.forEach(pos => {
            const graphics = this.scene.add.graphics();
            graphics.lineStyle(2, colors.circuit.trace, 0.6);
            
            graphics.beginPath();
            graphics.moveTo(pos.x + pos.h[0] * cornerSize, pos.y + pos.h[1] * cornerSize);
            graphics.lineTo(pos.x, pos.y);
            graphics.lineTo(pos.x + pos.v[0] * cornerSize, pos.y + pos.v[1] * cornerSize);
            graphics.strokePath();
            
            graphics.fillStyle(colors.circuit.node, 0.8);
            graphics.fillCircle(pos.x, pos.y, 3);
            
            graphics.setDepth(902);
            this.cornerDecorations.push(graphics);
        });
    }

    startPanelGlow() {
        if (!this.scene || !this.panelBorder) return;

        this.scene.tweens.add({
            targets: this.panelBorder,
            alpha: { from: 0.6, to: 1 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createWidgets() {
        // Layout: [SCORE] [HIGH♔] [♥♥♥] [1]
        const startY = 18;
        
        this.scoreBoard.create(this.scene, 35, startY);
        this.highScoreWidget.create(this.scene, 155, startY);
        this.livesWidget.create(this.scene, 295, startY);
        this.levelWidget.create(this.scene, 405, startY);
    }

    /**
     * Konvertiert einen Wert zu einer gültigen Zahl
     * Schützt vor NaN, undefined, null
     */
    toValidNumber(value, fallback = 0) {
        // Prüfe auf NaN explizit (NaN !== NaN!)
        if (value !== value) return fallback; // NaN check
        if (value === undefined || value === null) return fallback;
        if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
        if (typeof value === 'string') {
            const parsed = parseInt(value, 10);
            return Number.isNaN(parsed) ? fallback : parsed;
        }
        return fallback;
    }

    /**
     * Update all UI elements with current game state
     * Holt Daten IMMER direkt von der Facade für aktuelle Werte
     */
    update() {
        // Hole aktuelle Daten direkt von der Facade
        const scoreState = this.playerScoreFacade?.getScoreState?.() || {};
        const playerState = this.playerScoreFacade?.getPlayerState?.() || {};

        const score = this.toValidNumber(scoreState.score, 0);
        const highScore = this.toValidNumber(scoreState.highScore, 0);
        const lives = this.toValidNumber(scoreState.lives ?? playerState.lives, 3);
        const level = this.toValidNumber(playerState.level, 1);

        // Update Widgets
        this.scoreBoard.update(score);
        this.highScoreWidget.update(highScore);
        this.livesWidget.update(lives);
        this.levelWidget.update(level)

        // High Score Animation
        if (highScore > this.lastHighScore && this.lastHighScore > 0) {
            this.highScoreWidget.highlightIfNewRecord();
        }
        
        this.lastScore = score;
        this.lastHighScore = highScore;
    }

    /**
     * Update UI from snapshot (wird vom GameScene aufgerufen)
     * Ignoriert den Snapshot und holt direkt aktuelle Daten
     */
    updateFromSnapshot(snapshot) {
        // Snapshot wird ignoriert - wir holen immer direkt aktuelle Daten
        this.update();
    }

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

    showLevelMessage(level) {
        const titleFont = this.theme.fonts.tech.title;
        const colors = this.theme.colors;

        const messageText = this.scene.add.text(
            this.scene.scale.height / 2,
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

    destroy() {
        this.scoreBoard.destroy();
        this.highScoreWidget.destroy();
        this.livesWidget.destroy();
        this.levelWidget.destroy();
        
        this.cornerDecorations.forEach(decoration => decoration.destroy());
        this.cornerDecorations = [];
        
        if (this.panelBg) {
            this.panelBg.destroy();
            this.panelBg = null;
        }
        if (this.panelBorder) {
            this.panelBorder.destroy();
            this.panelBorder = null;
        }
        if (this.hudContainer) {
            this.hudContainer.destroy();
            this.hudContainer = null;
        }
    }

    cleanup() {
        this.destroy();
    }
}
