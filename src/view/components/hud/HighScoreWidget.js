/**
 * HighScoreWidget - Zeigt den High Score an
 */
export class HighScoreWidget {
    constructor() {
        this.scene = null;
        this.container = null;
        this.highScoreText = null;
        this.highScoreLabel = null;
        this.crownIcon = null;
        this.currentDisplayHighScore = 0;
        this.activeTweens = [];
    }

    create(scene, x, y) {
        this.scene = scene;

        // Container für das gesamte Widget
        this.container = scene.add.container(x, y);
        this.container.setDepth(1100);
        this.container.setScrollFactor(0);

        // Crown Icon
        this.crownIcon = scene.add.text(
            0,
            -2,
            '♔',
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#ffdd00'
            }
        );
        this.crownIcon.setOrigin(0, 0);
        this.crownIcon.setDepth(1101);
        this.crownIcon.setShadow(0, 0, '#ffaa00', 4, false, true);

        // Label - "HIGH"
        this.highScoreLabel = scene.add.text(
            16,
            0,
            'HIGH',
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                fontStyle: 'bold',
                color: '#ffaa00'
            }
        );
        this.highScoreLabel.setOrigin(0, 0);
        this.highScoreLabel.setDepth(1101);

        // High Score Value
        this.highScoreText = scene.add.text(
            0,
            14,
            '000000',
            {
                fontFamily: 'Courier New, monospace',
                fontSize: '22px',
                fontStyle: 'bold',
                color: '#ffdd00'
            }
        );
        this.highScoreText.setOrigin(0, 0);
        this.highScoreText.setDepth(1101);
        this.highScoreText.setShadow(0, 0, '#ffaa00', 6, false, true);

        this.container.add([this.crownIcon, this.highScoreLabel, this.highScoreText]);
        this.currentDisplayHighScore = 0;
    }

    update(highScore) {
        if (!this.highScoreText || !this.scene) {return;}

        // Robuste Konvertierung des High Score-Werts
        let safeHighScore;
        if (highScore === undefined || highScore === null) {
            safeHighScore = this.currentDisplayHighScore;
        } else if (typeof highScore === 'number') {
            safeHighScore = Number.isFinite(highScore) ? Math.max(0, highScore) : this.currentDisplayHighScore;
        } else if (typeof highScore === 'string') {
            const parsed = parseInt(highScore, 10);
            safeHighScore = Number.isNaN(parsed) ? this.currentDisplayHighScore : Math.max(0, parsed);
        } else {
            safeHighScore = this.currentDisplayHighScore;
        }

        // Prüfe auf neuen Rekord
        if (safeHighScore > this.currentDisplayHighScore && this.currentDisplayHighScore > 0) {
            this.highlightIfNewRecord();
        }

        this.highScoreText.setText(this.formatScore(safeHighScore));
        this.currentDisplayHighScore = safeHighScore;
    }

    formatScore(score) {
        return score.toString().padStart(6, '0');
    }

    highlightIfNewRecord() {
        if (!this.scene) {return;}

        // Kill existing tweens before creating new ones
        this.scene.tweens.killTweensOf([this.highScoreText, this.crownIcon]);

        const tween = this.scene.tweens.add({
            targets: [this.highScoreText, this.crownIcon],
            scale: { from: 1, to: 1.2 },
            duration: 200,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeOut'
        });
        this.activeTweens.push(tween);
    }

    destroy() {
        // Stop all active tweens
        this.activeTweens.forEach(tween => {
            if (tween && tween.stop) {
                tween.stop();
            }
        });
        this.activeTweens = [];

        // Kill tweens on elements
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf([this.highScoreText, this.crownIcon]);
        }

        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.highScoreText = null;
        this.highScoreLabel = null;
        this.crownIcon = null;
    }
}
