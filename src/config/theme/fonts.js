/**
 * Theme Fonts
 * Digital and segmented display styles
 */

import { themeColors } from './colors.js';

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

export default themeFonts;
