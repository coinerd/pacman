/**
 * Theme Colors
 * Tech-themed color palette for ADA-Woman
 */

import { colors } from '../gameConfig.js';

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

export default themeColors;
