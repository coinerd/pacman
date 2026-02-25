/**
 * UIController
 * Coordinates all HUD widgets and gameplay messages.
 */

import { animationConfig } from '../../config/gameConfig.js';
import { themeConfig, themeUtils } from '../../config/themeConfig.js';
import {
    ScoreBoard,
    HighScoreWidget,
    LivesWidget,
    LevelWidget
} from '../../view/components/hud/index.js';

export class UIController {
    /**
	 * Create UIController
	 * @param {Object} gameScene - The GameScene instance
	 * @param {Object} playerScoreFacade - Facade for player + score HUD state
	 */
    constructor(gameScene, playerScoreFacade) {
        this.scene = gameScene;
        this.playerScoreFacade = playerScoreFacade;
        this.snapshot = null;
        this.theme = themeConfig;
        this.utils = themeUtils;

        this.scoreBoard = new ScoreBoard();
        this.highScoreWidget = new HighScoreWidget();
        this.livesWidget = new LivesWidget();
        this.levelWidget = new LevelWidget();

        this.previousHighScore = 0;
    }

    /**
	 * Create all UI elements
	 */
    create() {
        this.scoreBoard.create(this.scene);
        this.highScoreWidget.create(this.scene);
        this.livesWidget.create(this.scene);
        this.levelWidget.create(this.scene);
    }

    /**
	 * Update all UI elements with current game state
	 */
    update() {
        const fallbackScoreState = this.playerScoreFacade?.getScoreState?.() || {};
        const fallbackPlayerState = this.playerScoreFacade?.getPlayerState?.() || {};

        const score = this.getHudValue('score', fallbackScoreState.score ?? 0);
        const highScore = this.getHudValue('highScore', fallbackScoreState.highScore ?? 0);
        const lives = this.getHudValue('lives', fallbackPlayerState.lives ?? 3);
        const level = this.getHudValue('level', fallbackPlayerState.level ?? 1);

        this.scoreBoard.update(score);
        this.highScoreWidget.update(highScore);
        this.livesWidget.update(lives);
        this.levelWidget.update(level);

        if (highScore > this.previousHighScore) {
            this.highScoreWidget.highlightIfNewRecord();
        }
        this.previousHighScore = highScore;
    }


    /**
	 * Read a value from the latest HUD snapshot.
	 * Falls back to facade-provided state when needed.
	 * @param {string} key
	 * @param {number} fallback
	 * @returns {number}
	 */
    getHudValue(key, fallback = 0) {
        if (this.snapshot && Object.prototype.hasOwnProperty.call(this.snapshot, key)) {
            return this.snapshot[key];
        }
        return fallback;
    }

    /**
	 * Update UI from snapshot (new architecture)
	 * @param {Object} snapshot - Game state snapshot
	 */
    updateFromSnapshot(snapshot) {
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
        this.scoreBoard.destroy();
        this.highScoreWidget.destroy();
        this.livesWidget.destroy();
        this.levelWidget.destroy();
    }
}
