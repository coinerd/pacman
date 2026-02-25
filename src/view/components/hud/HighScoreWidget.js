import { themeConfig } from '../../../config/themeConfig.js';

export class HighScoreWidget {
    constructor() {
        this.scene = null;
        this.panel = null;
        this.highScoreText = null;
        this.highScoreLabel = null;
        this.corners = [];
        this.lastHighScore = 0;
    }

    create(scene) {
        this.scene = scene;

        const scoreFont = themeConfig.fonts.hud.score;
        const techSmall = themeConfig.fonts.tech.small;
        const colors = themeConfig.colors;
        const circuit = themeConfig.circuit;
        const borderStyle = circuit.border;

        const panelHeight = 45;
        const padding = themeConfig.layout.spacing.md;
        const x = 10;
        const y = panelHeight + 20;
        const labelWidth = 100;
        const valueWidth = 120;
        const panelWidth = labelWidth + valueWidth + padding * 2;

        this.panel = scene.add.rectangle(
            x + panelWidth / 2,
            y + panelHeight / 2,
            panelWidth,
            panelHeight,
            colors.panel.background
        );
        this.panel.setStrokeStyle(borderStyle.width, borderStyle.color, borderStyle.alpha);
        this.panel.setAlpha(colors.panel.alpha);
        this.panel.setDepth(900);
        this.panel.setScrollFactor(0);

        this.corners = this.createCircuitCorners(scene, x, y, panelWidth, panelHeight, colors, circuit);

        this.highScoreLabel = scene.add.text(
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
        this.highScoreLabel.setOrigin(0.5);
        this.highScoreLabel.setDepth(950);
        this.highScoreLabel.setScrollFactor(0);

        this.highScoreText = scene.add.text(
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

    update(highScore) {
        if (!this.highScoreText) {
            return;
        }

        const safeHighScore = Number.isFinite(Number(highScore)) ? Number(highScore) : 0;
        this.highScoreText.setText(`${safeHighScore}`);
        this.lastHighScore = safeHighScore;
    }

    highlightIfNewRecord() {
        if (!this.scene || !this.highScoreText) {
            return;
        }

        this.scene.tweens.killTweensOf(this.highScoreText);
        this.highScoreText.setScale(1);
        this.scene.tweens.add({
            targets: this.highScoreText,
            scale: { from: 1, to: 1.15 },
            duration: 180,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeOut'
        });
    }

    destroy() {
        if (this.highScoreText) { this.highScoreText.destroy(); }
        if (this.highScoreLabel) { this.highScoreLabel.destroy(); }
        if (this.panel) { this.panel.destroy(); }
        this.corners.forEach((corner) => corner.destroy());
        this.corners = [];
    }

    createCircuitCorners(scene, x, y, width, height, colors, circuit) {
        const cornerSize = circuit.cornerSize;
        const positions = [
            [[x, y + cornerSize], [x, y], [x + cornerSize, y]],
            [[x + width - cornerSize, y], [x + width, y], [x + width, y + cornerSize]],
            [[x, y + height - cornerSize], [x, y + height], [x + cornerSize, y + height]],
            [[x + width - cornerSize, y + height], [x + width, y + height], [x + width, y + height - cornerSize]]
        ];

        return positions.map((points) => {
            const graphic = scene.add.graphics();
            graphic.lineStyle(2, colors.circuit.traceDim, 0.5);
            graphic.beginPath();
            graphic.moveTo(points[0][0], points[0][1]);
            graphic.lineTo(points[1][0], points[1][1]);
            graphic.lineTo(points[2][0], points[2][1]);
            graphic.strokePath();
            graphic.setDepth?.(905);
            graphic.setScrollFactor?.(0);
            return graphic;
        });
    }
}
