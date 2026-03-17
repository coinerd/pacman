/**
 * Theme Configuration
 * Tech-themed UI Configuration for ADA-Woman
 * Circuit-style design system with digital aesthetics
 *
 * Structure:
 * - theme/colors.js: Color palette
 * - theme/fonts.js: Font configurations
 * - theme/styles.js: Circuit styles, animations, component styles
 * - theme/layout.js: Layout constants
 * - themeConfig.js: Main export file (this file)
 */

// Import theme modules
import { themeColors } from './theme/colors.js';
import { themeFonts } from './theme/fonts.js';
import { circuitStyles, themeAnimations, componentStyles } from './theme/styles.js';
import { layout } from './theme/layout.js';

// Re-export all modules for direct access
export { themeColors };
export { themeFonts };
export { circuitStyles };
export { themeAnimations as animations };
export { componentStyles };
export { layout };

/**
 * Theme Configuration Export
 * Main theme object for easy importing
 */
export const themeConfig = {
    colors: themeColors,
    fonts: themeFonts,
    circuit: circuitStyles,
    animations: themeAnimations,
    layout: layout,
    components: componentStyles
};

/**
 * Utility Functions
 * Helper functions for theme operations
 */
export const themeUtils = {
    /**
     * Get a font style by category
     */
    getFont(category, style) {
        return themeFonts[category]?.[style] || null;
    },

    /**
     * Get a color by category and shade
     */
    getColor(category, shade) {
        return themeColors[category]?.[shade] || null;
    },

    /**
     * Apply circuit style to a Phaser graphics object
     */
    applyCircuitStyle(graphics, style = {}) {
        const {
            color = themeColors.panel.border,
            lineWidth = circuitStyles.border.thickness,
            alpha = 1.0
        } = style;

        graphics.lineStyle(lineWidth, color, alpha);
        return graphics;
    },

    /**
     * Apply glow effect to a Phaser game object
     */
    applyGlowEffect(gameObject) {
        if (gameObject.setTint) {
            gameObject.setTint(themeColors.effect.glow);
        }
        return gameObject;
    },

    /**
     * Parse hex color to Phaser format
     */
    parseHexColor(hex) {
        if (typeof hex === 'number') {
            return hex;
        }
        if (typeof hex === 'string' && hex.startsWith('#')) {
            return parseInt(hex.slice(1), 16);
        }
        return hex;
    },

    /**
     * Create a CSS-compatible color string from hex
     */
    toCSSColor(hex) {
        if (typeof hex === 'string' && hex.startsWith('#')) {
            return hex;
        }
        if (typeof hex === 'number') {
            return `#${hex.toString(16).padStart(6, '0')}`;
        }
        return '#000000';
    },

    /**
     * Blend two colors
     */
    blendColors(color1, color2, ratio = 0.5) {
        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;

        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;

        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);

        return (r << 16) | (g << 8) | b;
    },

    /**
     * Apply alpha to color
     */
    colorWithAlpha(color, alpha) {
        // Returns a color with alpha for canvas/web use
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        return `rgba(${r},${g},${b},${alpha})`;
    }
};

// Export theme config as default for convenience
export default themeConfig;
