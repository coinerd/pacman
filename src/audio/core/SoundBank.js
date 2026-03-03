/**
 * SoundBank
 * Sound configuration and asset management
 */

export class SoundBank {
    constructor() {
        this.soundConfig = this.getDefaultSoundConfig();
        this.enemyModeConfig = this.getDefaultEnemyModeConfig();
        this.circuitHumConfig = this.getDefaultCircuitHumConfig();
        this.glitchConfig = this.getDefaultGlitchConfig();
    }

    /**
     * Get default sound configuration
     * @returns {Object}
     */
    getDefaultSoundConfig() {
        return {
            waka: {
                baseFreq: 400,
                variance: 50,
                duration: 0.1,
                wave: 'square',
                harmonics: [2, 3]
            },

            eat: {
                baseFreq: 600,
                variance: 80,
                duration: 0.08,
                wave: 'sawtooth',
                harmonics: [1.5, 2.5]
            },

            power: {
                startFreq: 300,
                endFreq: 1200,
                duration: 0.3,
                wave: 'square',
                harmonics: [2, 4, 6]
            },

            death: {
                startFreq: 800,
                endFreq: 50,
                duration: 0.8,
                wave: 'sawtooth',
                glitch: true,
                steps: 8
            },

            ghostEaten: {
                baseFreq: 900,
                variance: 100,
                duration: 0.2,
                wave: 'square',
                harmonics: [3, 5],
                echo: true
            },

            levelComplete: {
                frequencies: [523, 659, 784, 1047, 1319],
                duration: 0.25,
                wave: 'sine',
                delay: 150
            },

            fruit: {
                baseFreq: 700,
                variance: 60,
                duration: 0.15,
                wave: 'sine',
                harmonics: [2]
            }
        };
    }

    /**
     * Get default enemy mode configuration
     * @returns {Object}
     */
    getDefaultEnemyModeConfig() {
        return {
            encrypted: {
                startFreq: 600,
                endFreq: 50,
                duration: 1.5,
                wave: 'sawtooth',
                glitch: true,
                volume: 0.6
            },
            win: {
                frequencies: [523, 659, 784, 1047, 1319],
                duration: 0.2,
                wave: 'sine',
                volume: 0.5
            },
            pause: {
                baseFreq: 440,
                duration: 0.15,
                wave: 'sine',
                volume: 0.4
            },
            resume: {
                baseFreq: 550,
                duration: 0.15,
                wave: 'sine',
                volume: 0.4
            }
        };
    }

    /**
     * Get default circuit hum configuration
     * @returns {Object}
     */
    getDefaultCircuitHumConfig() {
        return {
            baseFreq: 50,
            harmonics: [2, 3, 5, 7],
            volume: 0.05,
            filterFreq: 200,
            filterQ: 5
        };
    }

    /**
     * Get default glitch effect configuration
     * @returns {Object}
     */
    getDefaultGlitchConfig() {
        return {
            probability: 0.1,
            intensity: 200,
            duration: 0.02,
            maxJumps: 3
        };
    }

    /**
     * Get sound configuration for a specific sound
     * @param {string} soundName - Sound name
     * @returns {Object|undefined}
     */
    getSoundConfig(soundName) {
        return this.soundConfig[soundName];
    }

    /**
     * Get enemy mode configuration
     * @param {string} mode - Enemy mode name
     * @returns {Object|undefined}
     */
    getEnemyModeConfig(mode) {
        return this.enemyModeConfig[mode];
    }

    /**
     * Get circuit hum configuration
     * @returns {Object}
     */
    getCircuitHumConfig() {
        return this.circuitHumConfig;
    }

    /**
     * Get glitch configuration
     * @returns {Object}
     */
    getGlitchConfig() {
        return this.glitchConfig;
    }

    /**
     * Update sound configuration
     * @param {string} soundName - Sound name
     * @param {Object} config - New configuration
     */
    updateSoundConfig(soundName, config) {
        if (this.soundConfig[soundName]) {
            this.soundConfig[soundName] = { ...this.soundConfig[soundName], ...config };
        }
    }

    /**
     * Reset all configurations to defaults
     */
    resetToDefaults() {
        this.soundConfig = this.getDefaultSoundConfig();
        this.enemyModeConfig = this.getDefaultEnemyModeConfig();
        this.circuitHumConfig = this.getDefaultCircuitHumConfig();
        this.glitchConfig = this.getDefaultGlitchConfig();
    }
}
