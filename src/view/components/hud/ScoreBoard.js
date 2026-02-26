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
        const y = 10; // Reset to original position
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
        this.panel.setVisible(false); // Permanently disable panel for visibility
        
        console.log('[ScoreBoard.create] Panel DISABLED for visibility');
        
        console.log('[ScoreBoard.create] Panel created:', {
            x: this.panel.x,
            y: this.panel.y,
            width: panelWidth,
            height: panelHeight,
            alpha: this.panel.alpha,
            depth: this.panel.depth,
            zIndex: this.panel.z,
            visible: this.panel.visible
        });

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
                fontFamily: 'Courier New, monospace', // Hardcoded font
                fontSize: '32px', // Hardcoded size
                color: '#00ff00', // Bright green color for visibility test
                backgroundColor: '#000000', // Black background
                padding: { x: 5, y: 2 }
            }
        );
        this.scoreText.setOrigin(0.5);
        this.scoreText.setDepth(1001);
        this.scoreText.setScrollFactor(0);
        this.scoreText.setVisible(true);
        this.scoreText.setAlpha(1);
        
        console.log('[ScoreBoard.create] scoreText recreated with hardcoded values:', {
            x: this.scoreText.x,
            y: this.scoreText.y,
            text: this.scoreText.text,
            visible: this.scoreText.visible,
            alpha: this.scoreText.alpha,
            depth: this.scoreText.depth,
            fontFamily: this.scoreText.style.fontFamily,
            fontSize: this.scoreText.style.fontSize,
            color: this.scoreText.style.color
        });
    }

    update(score) {
        console.log('[ScoreBoard.update] Called with score:', score, 'scoreText exists:', !!this.scoreText);
        if (!this.scoreText) {
            console.warn('[ScoreBoard.update] scoreText is null, cannot update');
            return;
        }

        const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;
        this.scoreText.setText(`${safeScore}`);
        
        // Force visibility
        this.scoreText.setVisible(true);
        this.scoreText.setAlpha(1);
        this.scoreLabel.setVisible(true);
        this.scoreLabel.setAlpha(1);
        if (this.panel) {
            this.panel.setVisible(false); // Keep panel disabled
        }
        
        console.log('[ScoreBoard.update] Score updated:', {
            text: this.scoreText.text,
            x: this.scoreText.x,
            y: this.scoreText.y,
            visible: this.scoreText.visible,
            alpha: this.scoreText.alpha,
            color: this.scoreText.style.color
        });
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
