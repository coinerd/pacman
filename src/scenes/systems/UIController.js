/**
 * UIController
 * Manages all UI elements including score, lives, level, and messages
 */

import { uiConfig, animationConfig } from '../../config/gameConfig.js';

export class UIController {
    /**
     * Create UIController
     * @param {Object} gameScene - The GameScene instance
     * @param {Object} gameState - Game state object
     */
    constructor(gameScene, gameState) {
        this.scene = gameScene;
        this.gameState = gameState;
        this.scoreText = null;
        this.highScoreText = null;
        this.livesText = null;
        this.levelText = null;
        this.messageContainer = null;
    }

    /**
     * Create all UI elements
     */
    create() {
        const fontConfig = uiConfig.fonts.small;

        this.scoreText = this.scene.add.text(
            10,
            10,
            `SCORE: ${this.gameState.score}`,
            {
                fontSize: fontConfig.size,
                color: uiConfig.colors.accent,
                fontFamily: fontConfig.family,
                fontStyle: 'bold'
            }
        );

        this.highScoreText = this.scene.add.text(
            10,
            35,
            `HIGH SCORE: ${this.gameState.highScore}`,
            {
                fontSize: fontConfig.size,
                color: uiConfig.colors.primary,
                fontFamily: fontConfig.family
            }
        );

        this.livesText = this.scene.add.text(
            this.scene.scale.width - 10,
            10,
            `LIVES: ${this.gameState.lives}`,
            {
                fontSize: fontConfig.size,
                color: uiConfig.colors.primary,
                fontFamily: fontConfig.family,
                fontStyle: 'bold'
            }
        );
        this.livesText.setOrigin(1, 0);

        this.levelText = this.scene.add.text(
            this.scene.scale.width / 2,
            10,
            `LEVEL: ${this.gameState.level}`,
            {
                fontSize: fontConfig.size,
                color: uiConfig.colors.success,
                fontFamily: fontConfig.family,
                fontStyle: 'bold'
            }
        );
        this.levelText.setOrigin(0.5, 0);
    }

    /**
     * Update all UI elements with current game state
     */
    update() {
        this.scoreText.setText(`SCORE: ${this.gameState.score}`);
        this.highScoreText.setText(`HIGH SCORE: ${this.gameState.highScore}`);
        this.livesText.setText(`LIVES: ${this.gameState.lives}`);
        this.levelText.setText(`LEVEL: ${this.gameState.level}`);
    }

    /**
     * Show ready message
     */
    showReadyMessage() {
        const messageText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'READY!',
            {
                fontSize: uiConfig.fonts.title.size,
                color: uiConfig.colors.primary,
                fontFamily: uiConfig.fonts.title.family,
                fontStyle: uiConfig.fonts.title.style
            }
        );
        messageText.setOrigin(0.5);
        messageText.setAlpha(0);

        this.scene.tweens.add({
            targets: messageText,
            alpha: 1,
            duration: 300,
            onComplete: () => {
                this.scene.time.delayedCall(animationConfig.countdownDuration, () => {
                    this.scene.tweens.add({
                        targets: messageText,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => messageText.destroy()
                    });
                });
            }
        });
    }

    /**
     * Show level message
     */
    showLevelMessage() {
        const messageText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            `LEVEL ${this.gameState.level}`,
            {
                fontSize: uiConfig.fonts.subtitle.size,
                color: uiConfig.colors.success,
                fontFamily: uiConfig.fonts.subtitle.family,
                fontStyle: uiConfig.fonts.subtitle.style
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
            onYoyo: () => {
                this.scene.time.delayedCall(1500, () => messageText.destroy());
            }
        });
    }

    /**
     * Cleanup UI elements
     */
    cleanup() {
        if (this.scoreText) this.scoreText.destroy();
        if (this.highScoreText) this.highScoreText.destroy();
        if (this.livesText) this.livesText.destroy();
        if (this.levelText) this.levelText.destroy();
        if (this.messageContainer) this.messageContainer.destroy();
    }
}
