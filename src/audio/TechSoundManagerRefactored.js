/**
 * TechSoundManager (Refactored)
 * Facade for audio system using new modular architecture
 * Maintains backward compatibility with original API
 */

import { SoundEngine } from './SoundEngine.js';
import { SoundBank } from './SoundBank.js';
import { SoundBuilder } from './SoundBuilder.js';

export class TechSoundManagerRefactored {
    constructor(scene) {
        this.scene = scene;
        this.soundEngine = new SoundEngine();
        this.soundBank = new SoundBank();
        this.soundBuilder = null; // Will be initialized after audio context
        this.soundProfile = 'tech';
        this.enemyModeAudio = null;
        this.circuitHumAudio = null;
    }

    /**
	 * Initialize audio context
	 * Must be called after user interaction due to browser autoplay policies
	 */
    initialize() {
        this.soundEngine.initialize();

        if (this.soundEngine.isInitialized()) {
            const audioContext = this.soundEngine.getContext();
            this.soundBuilder = new SoundBuilder(audioContext);
        }
    }

    /**
	 * Resume audio context
	 */
    resume() {
        this.soundEngine.resume();
    }

    /**
	 * Set master volume
	 * @param {number} volume - Volume level (0.0 to 1.0)
	 */
    setVolume(volume) {
        this.soundEngine.setVolume(volume);
    }

    /**
	 * Enable or disable audio
	 * @param {boolean} enabled - Whether audio is enabled
	 */
    setEnabled(enabled) {
        this.soundEngine.setEnabled(enabled);
    }

    /**
	 * Set sound profile
	 * @param {string} profile - Sound profile name
	 */
    setSoundProfile(profile) {
        this.soundProfile = profile;
    }

    // === Game Sound Methods ===

    playWakaWaka() {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getSoundConfig('waka');
        this.soundBuilder.buildSound({
            type: 'tone',
            params: config
        }, 0.3);
    }

    playEat() {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getSoundConfig('eat');
        this.soundBuilder.buildSound({
            type: 'tone',
            params: config
        }, 0.3);
    }

    playPowerPellet() {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getSoundConfig('power');
        this.soundBuilder.buildSound({
            type: 'sweep',
            params: config
        }, 0.4);
    }

    playGhostEaten() {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getSoundConfig('ghostEaten');
        this.soundBuilder.buildSound({
            type: 'tone',
            params: config
        }, 0.4);
    }

    playDeath() {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getSoundConfig('death');
        this.soundBuilder.buildSound({
            type: 'sweep',
            params: {
                startFreq: config.startFreq,
                endFreq: config.endFreq,
                duration: config.duration,
                wave: config.wave,
                glitch: true
            }
        }, 0.5);
    }

    playLevelComplete() {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getSoundConfig('levelComplete');
        this.soundBuilder.buildSound({
            type: 'melody',
            params: config
        }, 0.5);
    }

    playFruitEat() {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getSoundConfig('fruit');
        this.soundBuilder.buildSound({
            type: 'tone',
            params: config
        }, 0.3);
    }

    // === Enemy Mode Audio ===

    startEnemyModeAudio(mode) {
        this.stopEnemyModeAudio();
        if (!this.soundEngine.isEnabled()) return;

        const config = this.soundBank.getEnemyModeConfig(mode);
        if (mode === 'encrypted') {
            this.enemyModeAudio = () => {
                this.soundBuilder.buildSound({
                    type: 'sweep',
                    params: config
                }, config.volume);
            };
            this.enemyModeAudio();
        }
    }

    stopEnemyModeAudio() {
        if (this.enemyModeAudio) {
            // Stop enemy mode audio if using intervals
            this.enemyModeAudio = null;
        }
    }

    playEncryptedMode() {
        this.startEnemyModeAudio('encrypted');
    }

    playDecryptedMode() {
        this.stopEnemyModeAudio();
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getEnemyModeConfig('win');
        this.soundBuilder.buildSound({
            type: 'melody',
            params: config
        }, config.volume);
    }

    // === Menu Sounds ===

    playMenuNav() {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'tone',
            params: {
                baseFreq: 300,
                variance: 20,
                duration: 0.08,
                wave: 'sine'
            }
        }, 0.2);
    }

    playMenuSelect() {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'tone',
            params: {
                baseFreq: 500,
                variance: 30,
                duration: 0.1,
                wave: 'sine',
                harmonics: [2]
            }
        }, 0.3);
    }

    playMenuConfirm() {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'melody',
            params: {
                frequencies: [523, 659],
                duration: 0.15,
                wave: 'square',
                delay: 0.05
            }
        }, 0.4);
    }

    playMenuBack() {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'tone',
            params: {
                baseFreq: 400,
                variance: 20,
                duration: 0.12,
                wave: 'sawtooth'
            }
        }, 0.3);
    }

    playPause() {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getEnemyModeConfig('pause');
        this.soundBuilder.buildSound({
            type: 'tone',
            params: config
        }, config.volume);
    }

    playResume() {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getEnemyModeConfig('resume');
        this.soundBuilder.buildSound({
            type: 'tone',
            params: config
        }, config.volume);
    }

    playButtonHover() {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'tone',
            params: {
                baseFreq: 350,
                variance: 15,
                duration: 0.05,
                wave: 'sine'
            }
        }, 0.15);
    }

    playButtonClick() {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'tone',
            params: {
                baseFreq: 600,
                variance: 25,
                duration: 0.08,
                wave: 'sine',
                harmonics: [2]
            }
        }, 0.25);
    }

    // === Notification Sounds ===

    playNotification() {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'melody',
            params: {
                frequencies: [880, 1100],
                duration: 0.2,
                wave: 'sine',
                delay: 0.08
            }
        }, 0.4);
    }

    playError() {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'glitch',
            params: {
                duration: 0.15
            }
        }, 0.5);
    }

    playSuccess() {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'melody',
            params: {
                frequencies: [659, 784, 1047],
                duration: 0.2,
                wave: 'sine',
                delay: 0.1
            }
        }, 0.5);
    }

    playGameOver() {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'sweep',
            params: {
                startFreq: 800,
                endFreq: 50,
                duration: 1.2,
                wave: 'sawtooth',
                glitch: true,
                steps: 12
            }
        }, 0.6);
    }

    playWin() {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getEnemyModeConfig('win');
        this.soundBuilder.buildSound({
            type: 'melody',
            params: config
        }, config.volume);
    }

    // === Tech-Specific Sounds ===

    playCircuitHum(duration = 0.5, volume = 1.0) {
        if (!this.soundEngine.isEnabled()) return;
        const config = this.soundBank.getCircuitHumConfig();
        this.soundBuilder.buildSound({
            type: 'circuit',
            params: {
                baseFreq: config.baseFreq,
                duration,
                volume: volume * config.volume
            }
        }, 1.0);
    }

    playDataStream(count = 3, interval = 0.05) {
        if (!this.soundEngine.isEnabled()) return;
        this.soundBuilder.buildSound({
            type: 'datastream',
            params: { count, interval }
        }, 0.2);
    }

    // === Cleanup ===

    destroy() {
        this.stopEnemyModeAudio();
        this.soundEngine.destroy();
        this.soundBank.resetToDefaults();
        this.soundBuilder = null;
    }

    // === Getters for Testing ===

    getSoundEngine() {
        return this.soundEngine;
    }

    getSoundBank() {
        return this.soundBank;
    }

    getSoundBuilder() {
        return this.soundBuilder;
    }
}

// For backward compatibility;
