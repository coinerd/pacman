/**
 * LogoCreator
 * Creates programmatic ADA-Woman logo with hexagon/circuit pattern
 * Tech-themed visual identity generation
 */

import { themeConfig } from '../config/themeConfig.js';

export class LogoCreator {
    /**
	 * Create ADA-Woman logo in a scene
	 * @param {Phaser.Scene} scene - The scene to add the logo to
	 * @param {Object} options - Configuration options
	 * @param {number} options.x - X position (default: center)
	 * @param {number} options.y - Y position (default: center)
	 * @param {number} options.scale - Scale factor (default: 1)
	 * @param {boolean} options.animated - Enable animations (default: true)
	 * @returns {Phaser.GameObjects.Container} - Logo container for positioning
	 */
    static createADAWomanLogo(scene, options = {}) {
        const {
            x = scene.scale.width / 2,
            y = scene.scale.height * 0.15,
            scale = 1,
            animated = true
        } = options;

        const colors = themeConfig.colors;
        const container = scene.add.container(x, y);
        container.setScale(scale);

        // Create hexagon base
        const hexagonGraphics = this.createHexagon(scene, colors);
        container.add(hexagonGraphics);

        // Create inner circuit pattern
        const circuitGraphics = this.createInnerCircuit(scene, colors);
        container.add(circuitGraphics);

        // Create digital eye
        const eyeGraphics = this.createDigitalEye(scene, colors);
        container.add(eyeGraphics);

        // Create text label below logo
        const labelText = this.createLogoText(scene, colors);
        container.add(labelText);

        // Add animations if enabled
        if (animated) {
            this.addLogoAnimations(scene, container, hexagonGraphics, circuitGraphics, eyeGraphics);
        }

        return container;
    }

    /**
	 * Create hexagon shape for ADA-Woman
	 */
    static createHexagon(scene, colors) {
        const graphics = scene.add.graphics();
        const size = 50;
        const points = [];

        // Calculate hexagon vertices
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            points.push({
                x: Math.cos(angle) * size,
                y: Math.sin(angle) * size
            });
        }

        // Draw hexagon with glow
        graphics.lineStyle(3, colors.primary, 1);
        graphics.fillStyle(colors.primary, 0.2);

        graphics.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                graphics.moveTo(point.x, point.y);
            } else {
                graphics.lineTo(point.x, point.y);
            }
        });
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();

        // Add outer glow ring
        graphics.lineStyle(1, colors.effect.glow, 0.5);
        graphics.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                graphics.moveTo(point.x, point.y);
            } else {
                graphics.lineTo(point.x, point.y);
            }
        });
        graphics.closePath();
        graphics.strokePath();

        return graphics;
    }

    /**
	 * Create inner circuit pattern
	 */
    static createInnerCircuit(scene, colors) {
        const graphics = scene.add.graphics();
        const size = 30;

        graphics.lineStyle(1, colors.circuit.trace, 0.8);

        // Draw circuit nodes at hexagon vertices
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;

            // Draw node
            graphics.fillStyle(colors.circuit.node, 1);
            graphics.fillCircle(x, y, 3);

            // Draw node glow
            graphics.fillStyle(colors.circuit.nodeGlow, 0.4);
            graphics.fillCircle(x, y, 6);
        }

        // Draw circuit traces connecting nodes
        const tracePoints = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            tracePoints.push({
                x: Math.cos(angle) * size,
                y: Math.sin(angle) * size
            });
        }

        // Connect every other node to create pattern
        for (let i = 0; i < tracePoints.length; i++) {
            const current = tracePoints[i];
            const next = tracePoints[(i + 2) % tracePoints.length];

            graphics.beginPath();
            graphics.moveTo(current.x, current.y);
            graphics.lineTo(next.x, next.y);
            graphics.strokePath();
        }

        // Draw inner core
        graphics.fillStyle(colors.effect.pulse, 0.3);
        graphics.fillCircle(0, 0, 12);

        return graphics;
    }

    /**
	 * Create digital eye
	 */
    static createDigitalEye(scene, colors) {
        const graphics = scene.add.graphics();

        // Eye glow
        graphics.fillStyle(colors.effect.glow, 0.6);
        graphics.fillCircle(0, -8, 10);

        // Eye pupil
        graphics.fillStyle(colors.digital.active, 1);
        graphics.fillCircle(0, -8, 5);

        // Eye highlight
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillCircle(2, -10, 2);

        return graphics;
    }

    /**
	 * Create logo text
	 */
    static createLogoText(scene, colors) {
        const titleFont = themeConfig.fonts.menu.title;

        const text = scene.add.text(
            0,
            75,
            'ADA-WOMAN',
            {
                fontFamily: titleFont.family,
                fontSize: titleFont.size,
                fontStyle: titleFont.style,
                fontWeight: titleFont.weight,
                letterSpacing: titleFont.letterSpacing,
                color: `#${colors.primary.toString(16).padStart(6, '0')}`,
                shadowColor: `#${colors.effect.pulse.toString(16).padStart(6, '0')}`,
                shadowBlur: titleFont.shadowBlur,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        );
        text.setOrigin(0.5);

        return text;
    }

    /**
	 * Add logo animations
	 */
    static addLogoAnimations(scene, container, hexagonGraphics, circuitGraphics, eyeGraphics) {
        const animConfig = themeConfig.animations;

        // Hexagon pulse animation
        scene.tweens.add({
            targets: container,
            scale: { from: 1, to: 1.05 },
            duration: animConfig.pulse.speed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Circuit trace animation - subtle rotation
        scene.tweens.add({
            targets: circuitGraphics,
            rotation: Math.PI * 2,
            duration: animConfig.circuit.speed * 2,
            repeat: -1,
            ease: 'Linear'
        });

        // Eye glow pulse
        scene.tweens.add({
            targets: eyeGraphics,
            alpha: { from: 1, to: 0.7 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
	 * Create small logo variant (for UI elements)
	 */
    static createSmallLogo(scene, options = {}) {
        const {
            x = 0,
            y = 0,
            scale = 0.5
        } = options;

        return this.createADAWomanLogo(scene, {
            x,
            y,
            scale,
            animated: false
        });
    }

    /**
	 * Create minimal logo (just hexagon + text, no circuits)
	 */
    static createMinimalLogo(scene, options = {}) {
        const {
            x = scene.scale.width / 2,
            y = scene.scale.height * 0.12,
            scale = 0.8
        } = options;

        const colors = themeConfig.colors;
        const container = scene.add.container(x, y);
        container.setScale(scale);

        // Simple hexagon
        const graphics = scene.add.graphics();
        const size = 35;
        const points = [];

        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            points.push({
                x: Math.cos(angle) * size,
                y: Math.sin(angle) * size
            });
        }

        graphics.lineStyle(2, colors.primary, 1);
        graphics.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                graphics.moveTo(point.x, point.y);
            } else {
                graphics.lineTo(point.x, point.y);
            }
        });
        graphics.closePath();
        graphics.strokePath();

        container.add(graphics);

        // Text
        const titleFont = themeConfig.fonts.tech.subtitle;
        const text = scene.add.text(
            0,
            55,
            'ADA-WOMAN',
            {
                fontFamily: titleFont.family,
                fontSize: '28px',
                fontStyle: titleFont.style,
                fontWeight: titleFont.weight,
                letterSpacing: titleFont.letterSpacing,
                color: `#${colors.primary.toString(16).padStart(6, '0')}`
            }
        );
        text.setOrigin(0.5);
        container.add(text);

        return container;
    }
}
