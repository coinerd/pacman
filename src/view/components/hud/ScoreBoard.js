import { themeConfig } from '../../../config/themeConfig.js';

/**
 * ScoreBoard - Zeigt den aktuellen Score an
 */
export class ScoreBoard {
    constructor() {
        this.scene = null;
        this.container = null;
        this.scoreText = null;
        this.scoreLabel = null;
        this.currentDisplayScore = 0;
    }

    create(scene, x, y) {
        this.scene = scene;

        // Container für das gesamte Widget
        this.container = scene.add.container(x, y);
        this.container.setDepth(1100);
        this.container.setScrollFactor(0);

        // Label - "SCORE"
        this.scoreLabel = scene.add.text(
            0,
            0,
            'SCORE',
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                fontStyle: 'bold',
                color: '#00aaaa'
            }
        );
        this.scoreLabel.setOrigin(0, 0);
        this.scoreLabel.setDepth(1101);

        // Score Value
        this.scoreText = scene.add.text(
            0,
            14,
            '000000',
            {
                fontFamily: 'Courier New, monospace',
                fontSize: '22px',
                fontStyle: 'bold',
                color: '#00ffaa'
            }
        );
        this.scoreText.setOrigin(0, 0);
        this.scoreText.setDepth(1101);

        // Glow-Effekt
        this.scoreText.setShadow(0, 0, '#00ffaa', 6, false, true);

        this.container.add([this.scoreLabel, this.scoreText]);
        this.currentDisplayScore = 0;
    }

    update(score) {
        if (!this.scoreText || !this.scene) {return;}

        // Robuste Konvertierung des Score-Werts
        let safeScore;

        // Prüfe auf NaN (NaN !== NaN)
        if (score !== score) {
            safeScore = this.currentDisplayScore;
        } else if (score === undefined || score === null) {
            safeScore = this.currentDisplayScore;
        } else if (typeof score === 'number') {
            safeScore = Number.isFinite(score) ? Math.max(0, score) : this.currentDisplayScore;
        } else if (typeof score === 'string') {
            const parsed = parseInt(score, 10);
            safeScore = Number.isNaN(parsed) ? this.currentDisplayScore : Math.max(0, parsed);
        } else {
            safeScore = this.currentDisplayScore;
        }

        // Animation bei Score-Änderung
        if (safeScore !== this.currentDisplayScore) {
            this.animateScoreChange(safeScore);
        }

        this.currentDisplayScore = safeScore;
    }

    formatScore(score) {
        return score.toString().padStart(6, '0');
    }

    animateScoreChange(newScore) {
        // Aktualisiere den Text sofort
        this.scoreText.setText(this.formatScore(newScore));

        if (!this.scene) {return;}

        // Scale-Animation bei Score-Anstieg
        this.scene.tweens.killTweensOf(this.scoreText);

        this.scene.tweens.add({
            targets: this.scoreText,
            scale: { from: 1.3, to: 1 },
            duration: 200,
            ease: 'Back.easeOut'
        });

        // Farb-Flash
        this.scoreText.setColor('#ffffff');
        this.scoreText.setShadow(0, 0, '#ffffff', 10, false, true);

        this.scene.time.delayedCall(100, () => {
            if (this.scoreText) {
                this.scoreText.setColor('#00ffaa');
                this.scoreText.setShadow(0, 0, '#00ffaa', 6, false, true);
            }
        });
    }

    destroy() {
        // Kill tweens on score elements
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf([this.scoreText, this.scoreLabel]);
        }

        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.scoreText = null;
        this.scoreLabel = null;
    }
}
