import { themeConfig } from '../../../config/themeConfig.js';

export class ScoreBoard {
    constructor() {
        this.scene = null;
        this.panel = null;
        this.scoreText = null;
        this.scoreLabel = null;
        this.corners = [];
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
        const y = 10;
        const labelWidth = 75;
        const valueWidth = 120;
        const panelWidth = labelWidth + valueWidth + padding * 2;

        this.panel = scene.add.rectangle(
            x + panelWidth / 2,
            y + panelHeight / 2,
            panelWidth,
            panelHeight,
            colors.panel.background
        );
        this.panel.setStrokeStyle(borderStyle.thickness || borderStyle.width || 2, borderStyle.color, borderStyle.alpha || 1);
        this.panel.setAlpha(colors.panel.alpha);
        this.panel.setDepth(900);
        this.panel.setScrollFactor(0);

        this.corners = this.createCircuitCorners(scene, x, y, panelWidth, panelHeight, colors, circuit);

        this.scoreLabel = scene.add.text(
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
        this.scoreLabel.setOrigin(0.5);
        this.scoreLabel.setDepth(950);
        this.scoreLabel.setScrollFactor(0);

        this.scoreText = scene.add.text(
            x + padding + labelWidth + valueWidth / 2,
            y + panelHeight / 2,
            '0',
            {
                fontFamily: scoreFont.family,
                fontSize: scoreFont.size,
                fontStyle: scoreFont.style,
                fontWeight: scoreFont.weight,
                letterSpacing: scoreFont.letterSpacing,
                color: '#00ced1',
                backgroundColor: '#000000',
                padding: { x: 2, y: 2 }
            }
        );
        this.scoreText.setOrigin(0.5);
        this.scoreText.setDepth(1000);
        this.scoreText.setScrollFactor(0);
    }

    update(score) {
        if (!this.scoreText) {
            return;
        }

        this.scoreText.setText(`${score}`);
    }

    destroy() {
        if (this.scoreText) { this.scoreText.destroy(); }
        if (this.scoreLabel) { this.scoreLabel.destroy(); }
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
