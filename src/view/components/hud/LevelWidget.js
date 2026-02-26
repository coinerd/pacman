import { themeConfig } from '../../../config/themeConfig.js';

export class LevelWidget {
    constructor() {
        this.panel = null;
        this.levelText = null;
        this.levelLabel = null;
        this.corners = [];
    }

    create(scene) {
        const scoreFont = themeConfig.fonts.hud.score;
        const techSmall = themeConfig.fonts.tech.small;
        const colors = themeConfig.colors;
        const circuit = themeConfig.circuit;
        const borderStyle = circuit.border;

        const panelHeight = 45;
        const padding = themeConfig.layout.spacing.md;
        const x = 10;
        const y = panelHeight * 3 + 40;
        const labelWidth = 75;
        const valueWidth = 80;
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
        this.panel.setVisible(false); // Disable panel for visibility
        
        console.log('[LevelWidget.create] Panel DISABLED for visibility');

        this.corners = this.createCircuitCorners(scene, x, y, panelWidth, panelHeight, colors, circuit);

        this.levelLabel = scene.add.text(
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
        this.levelLabel.setOrigin(0.5);
        this.levelLabel.setDepth(950);
        this.levelLabel.setScrollFactor(0);

        this.levelText = scene.add.text(
            x + padding + labelWidth + valueWidth / 2,
            y + panelHeight / 2,
            '1',
            {
                fontFamily: 'Courier New, monospace', // Same as ScoreBoard
                fontSize: '32px', // Same as ScoreBoard
                color: '#00ff00', // Bright green for visibility
                backgroundColor: '#000000', // Black background
                padding: { x: 5, y: 2 }
            }
        );
        this.levelText.setOrigin(0.5);
        this.levelText.setDepth(1001); // Same depth as ScoreBoard
        this.levelText.setScrollFactor(0);
        this.levelText.setVisible(true);
        this.levelText.setAlpha(1);
        
        console.log('[LevelWidget.create] levelText created with hardcoded values:', {
            x: this.levelText.x,
            y: this.levelText.y,
            text: this.levelText.text,
            visible: this.levelText.visible,
            alpha: this.levelText.alpha,
            depth: this.levelText.depth,
            color: this.levelText.style.color
        });
    }

    update(level) {
        if (!this.levelText) {
            return;
        }

        this.levelText.setText(`${level}`);
        
        // Force visibility
        this.levelText.setVisible(true);
        this.levelText.setAlpha(1);
        this.levelLabel.setVisible(true);
        this.levelLabel.setAlpha(1);
    }

    destroy() {
        if (this.levelText) { this.levelText.destroy(); }
        if (this.levelLabel) { this.levelLabel.destroy(); }
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
