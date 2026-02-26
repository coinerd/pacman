import { themeConfig } from '../../../config/themeConfig.js';

export class LivesWidget {
    constructor() {
        this.panel = null;
        this.livesText = null;
        this.livesLabel = null;
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
        const y = panelHeight * 2 + 30;
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
        
        console.log('[LivesWidget.create] Panel DISABLED for visibility');

        this.corners = this.createCircuitCorners(scene, x, y, panelWidth, panelHeight, colors, circuit);

        this.livesLabel = scene.add.text(
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
        this.livesLabel.setOrigin(0.5);
        this.livesLabel.setDepth(950);
        this.livesLabel.setScrollFactor(0);

        this.livesText = scene.add.text(
            x + padding + labelWidth + valueWidth / 2,
            y + panelHeight / 2,
            '3',
            {
                fontFamily: 'Courier New, monospace', // Same as ScoreBoard
                fontSize: '32px', // Same as ScoreBoard
                color: '#00ff00', // Bright green for visibility
                backgroundColor: '#000000', // Black background
                padding: { x: 5, y: 2 }
            }
        );
        this.livesText.setOrigin(0.5);
        this.livesText.setDepth(1001); // Same depth as ScoreBoard
        this.livesText.setScrollFactor(0);
        this.livesText.setVisible(true);
        this.livesText.setAlpha(1);
        
        console.log('[LivesWidget.create] livesText created with hardcoded values:', {
            x: this.livesText.x,
            y: this.livesText.y,
            text: this.livesText.text,
            visible: this.livesText.visible,
            alpha: this.livesText.alpha,
            depth: this.livesText.depth,
            color: this.livesText.style.color
        });
        
        console.log('[LivesWidget.create] livesText rendering check:', {
            x: this.livesText.x,
            y: this.livesText.y,
            visible: this.livesText.visible,
            alpha: this.livesText.alpha,
            depth: this.livesText.depth,
            worldAlpha: this.livesText.worldAlpha,
            worldVisible: this.livesText.worldVisible,
            worldX: this.livesText.worldPosition?.x,
            worldY: this.livesText.worldPosition?.y,
            fontSize: this.livesText.style.fontSize,
            fontFamily: this.livesText.style.fontFamily,
            color: this.livesText.style.color,
            displayList: this.livesText.displayList
        });
    }

    update(lives) {
        if (!this.livesText) {
            return;
        }

        this.livesText.setText(`${lives}`);
        
        // Force visibility
        this.livesText.setVisible(true);
        this.livesText.setAlpha(1);
        this.livesLabel.setVisible(true);
        this.livesLabel.setAlpha(1);
    }

    destroy() {
        if (this.livesText) { this.livesText.destroy(); }
        if (this.livesLabel) { this.livesLabel.destroy(); }
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
