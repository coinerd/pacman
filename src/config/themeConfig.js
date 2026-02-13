/**
 * Tech-themed UI Configuration for ADA-Woman
 * Circuit-style design system with digital aesthetics
 */

import { colors } from './gameConfig.js';

/**
 * Theme Color Palette
 * Expands existing maze colors with tech variations
 */
export const themeColors = {
    // Primary colors (from existing maze design)
    primary: colors.player, // 0x00ced1 - cyan/teal
    accent: colors.decryptedEnemy, // 0x00ffaa - green circuit lines
    wall: colors.wall, // 0x2a3f5f - blue-gray walls
    background: colors.background, // 0x0d1b0d - dark green background

    // Circuit-style variations
    circuit: {
        trace: 0x00ffaa, // Circuit trace color
        traceGlow: 0x00ff88, // Circuit trace glow
        traceDim: 0x00aa55, // Dimmed circuit trace
        node: 0x00ffff, // Circuit node/connection point
        nodeGlow: 0x00dddd, // Node glow
        breakpoint: 0xff4444 // Circuit breakpoint/error
    },

    // Digital display colors
    digital: {
        active: 0x00ced1, // Active digit segments
        inactive: 0x0a2020, // Inactive digit segments
        background: 0x050a0a, // Digital display background
        glow: 0x00ffff // Digital glow effect
    },

    // UI panel colors
    panel: {
        background: 0x0a1a1a, // Panel background
        border: 0x00ced1, // Panel border
        borderGlow: 0x00aaaa, // Border glow
        overlay: 0x0d1b0d // Overlay transparency
    },

    // Status colors
    status: {
        online: 0x00ff00, // Online/active
        offline: 0xff4444, // Offline/inactive
        warning: 0xffaa00, // Warning
        info: 0x00aaff, // Information
        success: 0x00ffaa, // Success
        error: 0xff4444 // Error
    },

    // Text colors
    text: {
        primary: 0xffffff, // Primary text
        secondary: 0xaaaaaa, // Secondary text
        dim: 0x666666, // Dim text
        accent: 0x00ffaa, // Accent text
        warning: 0xffaa00, // Warning text
        error: 0xff4444 // Error text
    },

    // Effect colors
    effect: {
        pulse: 0x00ffff, // Pulse effect color
        glow: 0x00ced1, // Glow effect color
        highlight: 0xffffff, // Highlight color
        shadow: 0x000000 // Shadow color
    },

    // Gradient stops
    gradient: {
        start: 0x0d1b0d, // Gradient start
        mid: 0x1a3030, // Gradient middle
        end: 0x0d1b0d // Gradient end
    }
};

/**
 * Font Configurations
 * Digital and segmented display styles
 */
export const themeFonts = {
    // Digital segmented display fonts
    digital: {
        sevenSegment: {
            family: 'Courier New, monospace',
            size: '48px',
            style: 'bold',
            weight: 'bold',
            letterSpacing: '4px',
            lineHeight: '1.2',
            color: themeColors.digital.active,
            shadowColor: themeColors.digital.glow,
            shadowBlur: 8
        },
        lcd: {
            family: 'Consolas, Monaco, monospace',
            size: '36px',
            style: 'normal',
            weight: '400',
            letterSpacing: '2px',
            lineHeight: '1.3',
            color: themeColors.digital.active,
            backgroundColor: themeColors.digital.background
        }
    },

    // Tech UI fonts
    tech: {
        title: {
            family: 'Arial Black, Arial, sans-serif',
            size: '64px',
            style: 'bold',
            weight: '900',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: themeColors.text.primary,
            shadowColor: themeColors.effect.pulse,
            shadowBlur: 12
        },
        subtitle: {
            family: 'Arial, sans-serif',
            size: '32px',
            style: 'bold',
            weight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: themeColors.text.primary
        },
        header: {
            family: 'Arial, sans-serif',
            size: '24px',
            style: 'bold',
            weight: '700',
            letterSpacing: '1px',
            color: themeColors.text.primary
        },
        body: {
            family: 'Arial, sans-serif',
            size: '18px',
            style: 'normal',
            weight: '400',
            lineHeight: '1.5',
            color: themeColors.text.primary
        },
        small: {
            family: 'Arial, sans-serif',
            size: '14px',
            style: 'normal',
            weight: '400',
            lineHeight: '1.4',
            color: themeColors.text.secondary
        },
        monospace: {
            family: 'Consolas, Monaco, monospace',
            size: '16px',
            style: 'normal',
            weight: '400',
            letterSpacing: '0px',
            color: themeColors.text.accent
        }
    },

    // Score and HUD fonts
    hud: {
        score: {
            family: 'Courier New, monospace',
            size: '28px',
            style: 'bold',
            weight: 'bold',
            letterSpacing: '3px',
            color: themeColors.accent,
            shadowColor: themeColors.effect.glow,
            shadowBlur: 6
        },
        lives: {
            family: 'Arial, sans-serif',
            size: '20px',
            style: 'bold',
            weight: 'bold',
            letterSpacing: '1px',
            color: themeColors.primary
        },
        level: {
            family: 'Arial, sans-serif',
            size: '20px',
            style: 'bold',
            weight: 'bold',
            letterSpacing: '1px',
            color: themeColors.text.accent
        },
        timer: {
            family: 'Consolas, Monaco, monospace',
            size: '24px',
            style: 'bold',
            weight: 'bold',
            letterSpacing: '2px',
            color: themeColors.text.primary
        }
    },

    // Menu fonts
    menu: {
        title: {
            family: 'Arial Black, Arial, sans-serif',
            size: '56px',
            style: 'bold',
            weight: '900',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: themeColors.text.primary,
            shadowColor: themeColors.effect.pulse,
            shadowBlur: 10
        },
        item: {
            family: 'Arial, sans-serif',
            size: '28px',
            style: 'normal',
            weight: '600',
            letterSpacing: '1px',
            color: themeColors.text.primary
        },
        itemHover: {
            family: 'Arial, sans-serif',
            size: '28px',
            style: 'bold',
            weight: '700',
            letterSpacing: '1px',
            color: themeColors.text.accent,
            shadowColor: themeColors.effect.glow,
            shadowBlur: 8
        },
        hint: {
            family: 'Arial, sans-serif',
            size: '16px',
            style: 'italic',
            weight: '400',
            color: themeColors.text.secondary
        }
    },

    // Overlay fonts
    overlay: {
        title: {
            family: 'Arial Black, Arial, sans-serif',
            size: '48px',
            style: 'bold',
            weight: '900',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: themeColors.text.primary
        },
        message: {
            family: 'Arial, sans-serif',
            size: '24px',
            style: 'normal',
            weight: '400',
            lineHeight: '1.5',
            color: themeColors.text.primary
        },
        button: {
            family: 'Arial, sans-serif',
            size: '22px',
            style: 'bold',
            weight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: themeColors.text.primary
        }
    }
};

/**
 * Circuit Style Constants
 * Border styles, glow effects, panel designs
 */
export const circuitStyles = {
    // Border styles
    border: {
        thickness: 2,
        color: themeColors.panel.border,
        dashLength: 4,
        gapLength: 4,
        cornerRadius: 8,
        circuitWidth: 1,
        circuitGap: 6
    },

    // Glow effects
    glow: {
        intensity: 0.6,
        blur: 8,
        pulseSpeed: 1000, // milliseconds
        color: themeColors.effect.glow
    },

    // Panel styles
    panel: {
        background: themeColors.panel.background,
        borderColor: themeColors.panel.border,
        borderWidth: 2,
        cornerRadius: 12,
        padding: 24,
        margin: 16
    },

    // Circuit trace patterns
    trace: {
        width: 2,
        color: themeColors.circuit.trace,
        glowColor: themeColors.circuit.traceGlow,
        nodeRadius: 4,
        nodeGlowRadius: 8,
        patternSpacing: 20
    },

    // Button styles
    button: {
        background: themeColors.panel.background,
        borderColor: themeColors.panel.border,
        hoverColor: themeColors.primary,
        activeColor: themeColors.accent,
        borderWidth: 2,
        cornerRadius: 8,
        paddingX: 32,
        paddingY: 16,
        circuit: {
            width: 1,
            gap: 4,
            offset: 4
        }
    },

    // Progress bar styles
    progress: {
        background: themeColors.panel.background,
        fillColor: themeColors.accent,
        borderColor: themeColors.panel.border,
        height: 8,
        borderWidth: 1,
        cornerRadius: 4,
        circuitPattern: true
    }
};

/**
 * Animation Configurations
 * Pulse effects, glow transitions, glitch parameters
 */
export const themeAnimations = {
    // Pulse effects
    pulse: {
        enabled: true,
        speed: 1000, // milliseconds
        intensity: 0.3,
        minAlpha: 0.7,
        maxAlpha: 1.0,
        minScale: 0.95,
        maxScale: 1.05,
        colors: [themeColors.effect.pulse, themeColors.effect.glow]
    },

    // Glow transitions
    glow: {
        enabled: true,
        intensity: 0.8,
        blur: 12,
        transitionSpeed: 300, // milliseconds
        color: themeColors.effect.glow,
        hoverBlur: 16,
        activeBlur: 20
    },

    // Glitch effects
    glitch: {
        enabled: true,
        probability: 0.05, // 5% chance per frame
        duration: 50, // milliseconds
        intensity: 2, // pixel offset
        colors: [
            themeColors.effect.highlight,
            themeColors.circuit.trace,
            themeColors.status.error
        ]
    },

    // Circuit trace animations
    circuit: {
        enabled: true,
        speed: 2000, // milliseconds per cycle
        pulseCount: 2,
        intensity: 0.4,
        traceWidth: 2,
        nodeGlowRadius: 6
    },

    // Text animations
    text: {
        fade: {
            in: 400, // milliseconds
            out: 300
        },
        glitch: {
            enabled: true,
            intensity: 3,
            frequency: 100 // milliseconds
        },
        typewriter: {
            enabled: false,
            speed: 30 // milliseconds per character
        }
    },

    // UI transitions
    transition: {
        fade: 300,
        slide: 400,
        scale: 200,
        easing: 'Power2'
    },

    // Particle effects
    particle: {
        spawnRate: 5, // particles per frame
        lifetime: 1000, // milliseconds
        velocity: { x: 2, y: -3 },
        colors: [
            themeColors.circuit.trace,
            themeColors.circuit.node,
            themeColors.digital.active
        ]
    }
};

/**
 * Layout Constants
 * Spacing, sizing, positioning
 */
export const layout = {
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48
    },

    padding: {
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32
    },

    margin: {
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32
    },

    borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        round: 9999
    },

    zIndex: {
        background: 0,
        maze: 10,
        entities: 20,
        hud: 30,
        pause: 40,
        menu: 50,
        overlay: 100
    }
};

/**
 * UI Component Styles
 * Standardized styles for common UI elements
 */
export const componentStyles = {
    // Header bar
    header: {
        height: 60,
        background: themeColors.panel.background,
        borderBottom: {
            width: 2,
            color: themeColors.panel.border
        },
        padding: layout.spacing.md
    },

    // Score panel
    scorePanel: {
        width: 200,
        padding: layout.spacing.md,
        background: themeColors.panel.background,
        border: {
            width: 2,
            color: themeColors.panel.border
        },
        borderRadius: layout.borderRadius.md,
        circuitPattern: true
    },

    // Menu item
    menuItem: {
        height: 56,
        paddingX: layout.spacing.xl,
        paddingY: layout.spacing.sm,
        background: 'transparent',
        border: {
            width: 2,
            color: 'transparent'
        },
        borderRadius: layout.borderRadius.md,
        hover: {
            background: themeColors.panel.background,
            borderColor: themeColors.panel.border,
            glowIntensity: 0.5
        }
    },

    // Button
    button: {
        minWidth: 200,
        paddingX: layout.spacing.xl,
        paddingY: layout.spacing.md,
        background: themeColors.panel.background,
        border: {
            width: 2,
            color: themeColors.panel.border
        },
        borderRadius: layout.borderRadius.md,
        circuitPattern: true,
        hover: {
            background: themeColors.primary,
            borderColor: themeColors.effect.highlight,
            glowIntensity: 0.7
        },
        active: {
            background: themeColors.accent,
            borderColor: themeColors.effect.glow,
            glowIntensity: 0.9
        }
    },

    // Modal/overlay
    modal: {
        background: themeColors.panel.overlay,
        backdrop: {
            color: 0x000000,
            alpha: 0.8
        },
        padding: layout.spacing.xl,
        border: {
            width: 3,
            color: themeColors.panel.border
        },
        borderRadius: layout.borderRadius.lg,
        maxWidth: 600
    },

    // Toast/notification
    toast: {
        padding: layout.spacing.md,
        background: themeColors.panel.background,
        border: {
            width: 2,
            color: themeColors.panel.border
        },
        borderRadius: layout.borderRadius.md,
        minWidth: 300,
        maxWidth: 500
    }
};

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
    }
};

// Export theme config as default for convenience
export default themeConfig;
