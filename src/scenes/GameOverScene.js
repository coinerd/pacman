/**
 * Game Over Scene
 * Displays when the player loses all lives
 */

import Phaser from 'phaser';
import { colors, uiConfig, animationConfig } from '../config/gameConfig.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }
    
    init(data) {
        this.finalScore = data.score || 0;
        this.highScore = data.highScore || 0;
        this.isNewHighScore = this.finalScore > this.highScore;
    }
    
    create() {
        this.createBackground();
        this.createTitle();
        this.createScoreDisplay();
        this.createHighScoreDisplay();
        this.createRestartPrompt();
        
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MenuScene');
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
     * Create game over title
     */
    createTitle() {
        const titleText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.2,
            'GAME OVER',
            {
                fontSize: uiConfig.fonts.title.size,
                color: uiConfig.colors.danger,
                fontFamily: uiConfig.fonts.title.family,
                fontStyle: uiConfig.fonts.title.style,
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        titleText.setOrigin(0.5);
        
        // Add shake animation
        this.tweens.add({
            targets: titleText,
            x: { from: this.scale.width / 2 - 5, to: this.scale.width / 2 + 5 },
            duration: 50,
            yoyo: true,
            repeat: 10,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                titleText.x = this.scale.width / 2;
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
            `Final Score: ${this.finalScore}`,
            {
                fontSize: uiConfig.fonts.subtitle.size,
                color: uiConfig.colors.accent,
                fontFamily: uiConfig.fonts.subtitle.family,
                fontStyle: 'bold'
            }
        );
        scoreText.setOrigin(0.5);
    }
    
    /**
     * Create high score display
     */
    createHighScoreDisplay() {
        let highScoreText;
        let color = uiConfig.colors.primary;
        
        if (this.isNewHighScore) {
            highScoreText = this.add.text(
                this.scale.width / 2,
                this.scale.height * 0.5,
                `NEW HIGH SCORE: ${this.finalScore}!`,
                {
                    fontSize: uiConfig.fonts.text.size,
                    color: uiConfig.colors.success,
                    fontFamily: uiConfig.fonts.text.family,
                    fontStyle: 'bold'
                }
            );
            
            // Add celebration animation
            this.tweens.add({
                targets: highScoreText,
                scale: { from: 1.2, to: 1 },
                alpha: { from: 0, to: 1 },
                duration: 500,
                ease: 'Back.easeOut'
            });
        } else {
            highScoreText = this.add.text(
                this.scale.width / 2,
                this.scale.height * 0.5,
                `High Score: ${this.highScore}`,
                {
                    fontSize: uiConfig.fonts.text.size,
                    color: uiConfig.colors.primary,
                    fontFamily: uiConfig.fonts.text.family
                }
            );
        }
        
        highScoreText.setOrigin(0.5);
    }
    
    /**
     * Create restart prompt with animation
     */
    createRestartPrompt() {
        const restartText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.75,
            'Press SPACE or ESC to Return to Menu',
            {
                fontSize: uiConfig.fonts.text.size,
                color: uiConfig.colors.primary,
                fontFamily: uiConfig.fonts.text.family
            }
        );
        restartText.setOrigin(0.5);
        
        this.tweens.add({
            targets: restartText,
            alpha: { from: 1, to: 0.3 },
            duration: animationConfig.textFadeSpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}
