/**
 * Theme Styles
 * Circuit styles, animations, and component styles
 */

import { themeColors } from './colors.js';
import { layout } from './layout.js';

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

export default {
    circuitStyles,
    themeAnimations,
    componentStyles
};
