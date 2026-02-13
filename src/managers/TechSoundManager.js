/**
 * TechSoundManager - Enhanced audio system with synthesized digital tones and circuit hums
 *
 * Tech-themed audio system using Web Audio API for synthesized sounds:
 * - Digital tones: Square/sawtooth waveforms with harmonics
 * - Circuit hums: Low frequency oscillation with noise
 * - Glitch effects: Random frequency bursts and modulation
 * - Data stream: High-frequency chirps and blips
 */

export class TechSoundManager {
    constructor(scene) {
        this.scene = scene;
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.5;
        this.initialized = false;
        this.soundProfile = 'tech';

        this.soundConfig = {
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

        this.enemyModeConfig = {
            encrypted: {
                baseFreq: 200,
                wave: 'square',
                harmonics: [3, 5],
                modulation: {
                    enabled: true,
                    depth: 0.1,
                    speed: 8
                }
            },
            decrypted: {
                baseFreq: 150,
                wave: 'sawtooth',
                harmonics: [2, 4],
                modulation: {
                    enabled: true,
                    depth: 0.3,
                    speed: 4,
                    glitch: true
                }
            }
        };

        this.uiSounds = {
            menuNav: {
                baseFreq: 800,
                duration: 0.05,
                wave: 'square',
                volume: 0.3
            },
            menuSelect: {
                baseFreq: 1000,
                duration: 0.1,
                wave: 'square',
                harmonics: [2],
                volume: 0.4
            },
            menuConfirm: {
                frequencies: [600, 800],
                duration: 0.15,
                wave: 'triangle',
                volume: 0.5
            },
            menuBack: {
                frequencies: [800, 600],
                duration: 0.15,
                wave: 'triangle',
                volume: 0.5
            },
            gameOver: {
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

        this.circuitHumConfig = {
            baseFreq: 50,
            harmonics: [2, 3, 5, 7],
            volume: 0.05,
            filterFreq: 200,
            filterQ: 5
        };

        this.glitchConfig = {
            probability: 0.1,
            intensity: 200,
            duration: 0.02,
            maxJumps: 3
        };
    }

    /**
	 * Initialize the audio context
	 * Must be called after user interaction due to browser autoplay policies
	 */
    initialize() {
        if (this.initialized) {
            return;
        }

        try {
            this.audioContext = new (
                window.AudioContext || window.webkitAudioContext
            )();
            this.initialized = true;

            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.setValueAtTime(
                this.volume,
                this.audioContext.currentTime
            );

            this.circuitFilter = this.audioContext.createBiquadFilter();
            this.circuitFilter.type = 'lowpass';
            this.circuitFilter.frequency.setValueAtTime(
                this.circuitHumConfig.filterFreq,
                this.audioContext.currentTime
            );
            this.circuitFilter.Q.setValueAtTime(
                this.circuitHumConfig.filterQ,
                this.audioContext.currentTime
            );
            this.circuitFilter.connect(this.masterGain);
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.enabled = false;
        }
    }

    /**
	 * Resume audio context if suspended
	 */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
	 * Set the master volume
	 * @param {number} volume - Volume level (0.0 to 1.0)
	 */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                this.volume,
                this.audioContext.currentTime
            );
        }
    }

    /**
	 * Enable or disable sound
	 * @param {boolean} enabled
	 */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                enabled ? this.volume : 0,
                this.audioContext.currentTime
            );
        }
    }

    /**
	 * Set the sound profile (retro or tech)
	 * @param {string} profile - 'retro' or 'tech'
	 */
    setSoundProfile(profile) {
        if (profile === 'retro' || profile === 'tech') {
            this.soundProfile = profile;
        }
    }

    /**
	 * Create an oscillator with specified type and frequency
	 * @param {string} type - Waveform type
	 * @param {number} frequency - Frequency in Hz
	 * @returns {OscillatorNode}
	 */
    createOscillator(type, frequency) {
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
            frequency,
            this.audioContext.currentTime
        );
        return oscillator;
    }

    /**
	 * Create a gain node for volume control
	 * @param {number} volume - Initial volume (0.0 to 1.0)
	 * @returns {GainNode}
	 */
    createGain(volume = 1.0) {
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        return gain;
    }

    /**
	 * Add harmonics to a sound for richer digital tone
	 * @param {OscillatorNode} baseOscillator - Base oscillator
	 * @param {GainNode} outputGain - Output gain node
	 * @param {Array<number>} harmonics - Harmonic multipliers
	 * @param {number} masterVolume - Master volume for harmonics
	 */
    addHarmonics(baseOscillator, outputGain, harmonics, masterVolume = 1.0) {
        harmonics.forEach((multiplier, index) => {
            const harmonicOsc = this.createOscillator(baseOscillator.type, 0);
            const harmonicGain = this.createGain(masterVolume / (index + 2));

            baseOscillator.frequency.connect(harmonicOsc.frequency);
            harmonicOsc.frequency.gain.value = multiplier;

            harmonicOsc.connect(harmonicGain);
            harmonicGain.connect(outputGain);

            harmonicOsc.start(this.audioContext.currentTime);
            harmonicOsc.stop(this.audioContext.currentTime + 10);
        });
    }

    /**
	 * Add frequency modulation (vibrato) to an oscillator
	 * @param {OscillatorNode} oscillator - Oscillator to modulate
	 * @param {number} depth - Modulation depth (0.0 to 1.0)
	 * @param {number} speed - Modulation speed in Hz
	 */
    addModulation(oscillator, depth, speed) {
        const modOscillator = this.audioContext.createOscillator();
        const modGain = this.audioContext.createGain();

        modOscillator.type = 'sine';
        modOscillator.frequency.setValueAtTime(
            speed,
            this.audioContext.currentTime
        );
        modGain.gain.setValueAtTime(
            depth * oscillator.frequency.value,
            this.audioContext.currentTime
        );

        modOscillator.connect(modGain);
        modGain.connect(oscillator.frequency);

        modOscillator.start(this.audioContext.currentTime);

        return modOscillator;
    }

    /**
	 * Add glitch effect to sound
	 * @param {OscillatorNode} oscillator - Oscillator to glitch
	 * @param {number} duration - Sound duration
	 * @param {number} maxJumps - Maximum frequency jumps
	 */
    addGlitchEffect(oscillator, duration, maxJumps = 3) {
        const jumpCount = Math.floor(Math.random() * maxJumps) + 1;

        for (let i = 0; i < jumpCount; i++) {
            const jumpTime =
				this.audioContext.currentTime + (duration * (i + 1)) / (jumpCount + 1);
            const jumpFreq =
				oscillator.frequency.value +
				(Math.random() - 0.5) * this.glitchConfig.intensity;

            oscillator.frequency.linearRampToValueAtTime(
                Math.max(50, jumpFreq),
                jumpTime
            );
        }
    }

    /**
	 * Create echo/delay effect
	 * @param {AudioNode} source - Source node
	 * @param {number} delayTime - Delay time in seconds
	 * @param {number} feedback - Feedback amount (0.0 to 1.0)
	 * @param {number} wetLevel - Wet signal level
	 */
    createEcho(source, delayTime, feedback, wetLevel) {
        const delay = this.audioContext.createDelay();
        const feedbackGain = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();

        delay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);
        feedbackGain.gain.setValueAtTime(feedback, this.audioContext.currentTime);
        wetGain.gain.setValueAtTime(wetLevel, this.audioContext.currentTime);

        source.connect(delay);
        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
        delay.connect(wetGain);

        return wetGain;
    }

    /**
	 * Create a digital tone with tech characteristics
	 * @param {number} frequency - Base frequency in Hz
	 * @param {number} duration - Duration in seconds
	 * @param {Object} config - Sound configuration
	 * @returns {Object} Nodes for cleanup
	 */
    playDigitalTone(frequency, duration, config = {}) {
        if (!this.enabled || !this.audioContext) {
            return null;
        }

        const {
            wave = 'square',
            harmonics = [],
            volume = 1.0,
            modulation = null,
            glitch = false,
            echo = false
        } = config;

        try {
            const oscillator = this.createOscillator(wave, frequency);
            const gainNode = this.createGain(volume);

            if (harmonics.length > 0) {
                this.addHarmonics(oscillator, gainNode, harmonics, volume * 0.3);
            }

            if (modulation && modulation.enabled) {
                this.addModulation(oscillator, modulation.depth, modulation.speed);
            }

            if (glitch) {
                this.addGlitchEffect(oscillator, duration);
            }

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(
                volume,
                this.audioContext.currentTime + 0.01
            );
            gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                this.audioContext.currentTime + duration
            );

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);

            return { oscillator, gainNode };
        } catch (error) {
            console.warn('Error playing digital tone:', error);
            return null;
        }
    }

    /**
	 * Create circuit hum effect
	 * @param {number} duration - Duration in seconds
	 * @param {number} volume - Volume level
	 */
    playCircuitHum(duration = 0.5, volume = 1.0) {
        if (!this.enabled || !this.audioContext) {
            return;
        }

        try {
            const baseOsc = this.createOscillator(
                'sine',
                this.circuitHumConfig.baseFreq
            );
            const baseGain = this.createGain(volume * this.circuitHumConfig.volume);

            this.circuitHumConfig.harmonics.forEach((harmonic, index) => {
                const harmonicOsc = this.createOscillator(
                    'sine',
                    this.circuitHumConfig.baseFreq * harmonic
                );
                const harmonicGain = this.createGain(
                    (volume * this.circuitHumConfig.volume) / (index + 2)
                );

                harmonicOsc.connect(harmonicGain);
                harmonicGain.connect(this.circuitFilter);

                harmonicOsc.start(this.audioContext.currentTime);
                harmonicOsc.stop(this.audioContext.currentTime + duration);
            });

            baseOsc.connect(baseGain);
            baseGain.connect(this.circuitFilter);

            baseGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            baseGain.gain.linearRampToValueAtTime(
                volume * this.circuitHumConfig.volume,
                this.audioContext.currentTime + 0.05
            );
            baseGain.gain.exponentialRampToValueAtTime(
                0.001,
                this.audioContext.currentTime + duration
            );

            baseOsc.start(this.audioContext.currentTime);
            baseOsc.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing circuit hum:', error);
        }
    }

    /**
	 * Play data stream effect (high-frequency chirps and blips)
	 * @param {number} count - Number of blips
	 * @param {number} interval - Time between blips
	 */
    playDataStream(count = 3, interval = 0.05) {
        if (!this.enabled) {
            return;
        }

        for (let i = 0; i < count; i++) {
            setTimeout(
                () => {
                    const freq = 1500 + Math.random() * 500;
                    this.playDigitalTone(freq, 0.02, {
                        wave: 'square',
                        volume: 0.2
                    });
                },
                i * interval * 1000
            );
        }
    }

    /**
	 * Play waka-waka sound (data crunch)
	 * Alternating tones for each pellet eaten
	 */
    playWakaWaka() {
        if (!this.enabled) {
            return;
        }

        if (this.soundProfile === 'retro') {
            this.playDigitalTone(400, 0.1, { wave: 'triangle', volume: 0.8 });
        } else {
            const variance = this.soundConfig.waka.variance;
            const freq =
				this.soundConfig.waka.baseFreq + (Math.random() - 0.5) * variance;

            this.playDigitalTone(freq, this.soundConfig.waka.duration, {
                wave: this.soundConfig.waka.wave,
                harmonics: this.soundConfig.waka.harmonics,
                volume: 0.7
            });
        }
    }

    /**
	 * Play pellet eating sound (data absorption)
	 */
    playEat() {
        if (!this.enabled) {
            return;
        }

        if (this.soundProfile === 'retro') {
            this.playDigitalTone(600, 0.08, { wave: 'square', volume: 0.7 });
        } else {
            const variance = this.soundConfig.eat.variance;
            const freq =
				this.soundConfig.eat.baseFreq + (Math.random() - 0.5) * variance;

            this.playDigitalTone(freq, this.soundConfig.eat.duration, {
                wave: this.soundConfig.eat.wave,
                harmonics: this.soundConfig.eat.harmonics,
                volume: 0.6
            });
        }
    }

    /**
	 * Play power pellet activation sound (circuit activation)
	 */
    playPowerPellet() {
        if (!this.enabled || !this.scene) {
            return;
        }

        if (this.soundProfile === 'retro') {
            this.playDigitalTone(600, 0.3, { wave: 'square', volume: 0.8 });
            setTimeout(() => {
                this.playDigitalTone(800, 0.2, { wave: 'square', volume: 0.8 });
            }, 100);
        } else {
            const config = this.soundConfig.power;

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createGain(0.8);

            oscillator.type = config.wave;
            oscillator.frequency.setValueAtTime(
                config.startFreq,
                this.audioContext.currentTime
            );
            oscillator.frequency.exponentialRampToValueAtTime(
                config.endFreq,
                this.audioContext.currentTime + config.duration
            );

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(
                0.8,
                this.audioContext.currentTime + 0.05
            );
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                this.audioContext.currentTime + config.duration
            );

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + config.duration);

            setTimeout(() => {
                this.playCircuitHum(0.2, 0.5);
            }, config.duration * 500);
        }
    }

    /**
	 * Play ghost eaten sound (data absorption)
	 */
    playGhostEaten() {
        if (!this.enabled || !this.scene) {
            return;
        }

        if (this.soundProfile === 'retro') {
            this.playDigitalTone(800, 0.2, { wave: 'square', volume: 0.8 });
            setTimeout(() => {
                this.playDigitalTone(1000, 0.15, { wave: 'square', volume: 0.8 });
            }, 150);
        } else {
            const config = this.soundConfig.ghostEaten;
            const variance = config.variance;
            const freq = config.baseFreq + (Math.random() - 0.5) * variance;

            this.playDigitalTone(freq, config.duration, {
                wave: config.wave,
                harmonics: config.harmonics,
                volume: 0.8
            });

            setTimeout(() => {
                const freq2 = freq * 1.2;
                this.playDigitalTone(freq2, config.duration * 0.75, {
                    wave: config.wave,
                    harmonics: config.harmonics,
                    volume: 0.6
                });
            }, 150);
        }
    }

    /**
	 * Play death sound (digital breakdown/glitch)
	 */
    playDeath() {
        if (!this.enabled || !this.scene) {
            return;
        }

        if (this.soundProfile === 'retro') {
            const frequencies = [400, 350, 300, 250, 200, 150, 100];
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    this.playDigitalTone(freq, 0.15, { wave: 'sawtooth', volume: 0.8 });
                }, index * 100);
            });
        } else {
            const config = this.soundConfig.death;

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createGain(0.8);

            oscillator.type = config.wave;
            oscillator.frequency.setValueAtTime(
                config.startFreq,
                this.audioContext.currentTime
            );
            oscillator.frequency.exponentialRampToValueAtTime(
                config.endFreq,
                this.audioContext.currentTime + config.duration
            );

            const glitchCount = 5;
            for (let i = 0; i < glitchCount; i++) {
                const glitchTime =
					this.audioContext.currentTime +
					(config.duration * (i + 1)) / (glitchCount + 1);
                const glitchFreq =
					config.startFreq * (1 - i / glitchCount) +
					(Math.random() - 0.5) * 300;
                oscillator.frequency.linearRampToValueAtTime(
                    Math.max(50, glitchFreq),
                    glitchTime
                );
            }

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(
                0.8,
                this.audioContext.currentTime + 0.05
            );
            gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                this.audioContext.currentTime + config.duration
            );

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + config.duration);

            setTimeout(() => {
                this.playCircuitHum(0.3, 0.3);
            }, config.duration * 800);
        }
    }

    /**
	 * Play level complete sound (system boot sequence)
	 */
    playLevelComplete() {
        if (!this.enabled || !this.scene) {
            return;
        }

        const config = this.soundConfig.levelComplete;

        config.frequencies.forEach((freq, index) => {
            setTimeout(() => {
                if (this.soundProfile === 'retro') {
                    this.playDigitalTone(freq, config.duration, {
                        wave: 'sine',
                        volume: 0.8
                    });
                } else {
                    this.playDigitalTone(freq, config.duration, {
                        wave: config.wave,
                        volume: 0.8
                    });
                    this.playDataStream(2, 0.03);
                }
            }, index * config.delay);
        });
    }

    /**
	 * Play fruit eaten sound (bonus data)
	 */
    playFruitEat() {
        if (!this.enabled || !this.scene) {
            return;
        }

        if (this.soundProfile === 'retro') {
            this.playDigitalTone(500, 0.15, { wave: 'sine', volume: 0.8 });
            setTimeout(() => {
                this.playDigitalTone(700, 0.15, { wave: 'sine', volume: 0.8 });
            }, 100);
        } else {
            const config = this.soundConfig.fruit;
            const variance = config.variance;
            const freq = config.baseFreq + (Math.random() - 0.5) * variance;

            this.playDigitalTone(freq, config.duration, {
                wave: config.wave,
                harmonics: config.harmonics,
                volume: 0.8
            });

            setTimeout(() => {
                const freq2 = freq * 1.4;
                this.playDigitalTone(freq2, config.duration * 0.8, {
                    wave: config.wave,
                    volume: 0.7
                });
            }, 100);
        }
    }


    /**
	 * Play encrypted mode sound (enemy hunting)
	 * Higher pitch, digital warning tone
	 */
    playEncryptedMode() {
        if (!this.enabled) {
            return;
        }

        const config = this.enemyModeConfig.encrypted;

        this.playDigitalTone(config.baseFreq, 0.1, {
            wave: config.wave,
            harmonics: config.harmonics,
            modulation: config.modulation,
            volume: 0.3
        });
    }

    /**
	 * Play decrypted mode sound (enemy vulnerable)
	 * Lower pitch, glitchy/intermittent
	 */
    playDecryptedMode() {
        if (!this.enabled) {
            return;
        }

        const config = this.enemyModeConfig.decrypted;

        this.playDigitalTone(config.baseFreq, 0.15, {
            wave: config.wave,
            harmonics: config.harmonics,
            modulation: config.modulation,
            volume: 0.4
        });
    }

    /**
	 * Start continuous enemy mode audio
	 * @param {string} mode - 'encrypted' or 'decrypted'
	 */
    startEnemyModeAudio(mode) {
        this.stopEnemyModeAudio();

        if (mode !== 'encrypted' && mode !== 'decrypted') {
            return;
        }

        const config = this.enemyModeConfig[mode];
        this.enemyModeInterval = setInterval(() => {
            this.playDigitalTone(config.baseFreq + Math.random() * 50, 0.05, {
                wave: config.wave,
                harmonics: config.harmonics,
                modulation: config.modulation,
                volume: 0.15
            });
        }, 500);
    }

    /**
	 * Stop continuous enemy mode audio
	 */
    stopEnemyModeAudio() {
        if (this.enemyModeInterval) {
            clearInterval(this.enemyModeInterval);
            this.enemyModeInterval = null;
        }
    }


    /**
	 * Play menu navigation sound
	 */
    playMenuNav() {
        if (!this.enabled) {
            return;
        }

        const config = this.uiSounds.menuNav;
        this.playDigitalTone(config.baseFreq, config.duration, {
            wave: config.wave,
            volume: config.volume
        });
    }

    /**
	 * Play menu selection sound
	 */
    playMenuSelect() {
        if (!this.enabled) {
            return;
        }

        const config = this.uiSounds.menuSelect;
        this.playDigitalTone(config.baseFreq, config.duration, {
            wave: config.wave,
            harmonics: config.harmonics,
            volume: config.volume
        });
    }

    /**
	 * Play menu confirmation sound
	 */
    playMenuConfirm() {
        if (!this.enabled) {
            return;
        }

        const config = this.uiSounds.menuConfirm;
        config.frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playDigitalTone(freq, config.duration, {
                    wave: config.wave,
                    volume: config.volume
                });
            }, index * 100);
        });
    }

    /**
	 * Play menu back sound
	 */
    playMenuBack() {
        if (!this.enabled) {
            return;
        }

        const config = this.uiSounds.menuBack;
        config.frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playDigitalTone(freq, config.duration, {
                    wave: config.wave,
                    volume: config.volume
                });
            }, index * 100);
        });
    }

    /**
	 * Play game over sound (system shutdown)
	 */
    playGameOver() {
        if (!this.enabled) {
            return;
        }

        const config = this.uiSounds.gameOver;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.createGain(config.volume);

        oscillator.type = config.wave;
        oscillator.frequency.setValueAtTime(
            config.startFreq,
            this.audioContext.currentTime
        );
        oscillator.frequency.exponentialRampToValueAtTime(
            config.endFreq,
            this.audioContext.currentTime + config.duration
        );

        const glitchCount = 8;
        for (let i = 0; i < glitchCount; i++) {
            const glitchTime =
				this.audioContext.currentTime +
				(config.duration * (i + 1)) / (glitchCount + 1);
            const glitchFreq =
				config.startFreq * (1 - i / glitchCount) + (Math.random() - 0.5) * 200;
            oscillator.frequency.linearRampToValueAtTime(
                Math.max(30, glitchFreq),
                glitchTime
            );
        }

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            config.volume,
            this.audioContext.currentTime + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            this.audioContext.currentTime + config.duration
        );

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + config.duration);
    }

    /**
	 * Play win sound
	 */
    playWin() {
        if (!this.enabled) {
            return;
        }

        const config = this.uiSounds.win;
        config.frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playDigitalTone(freq, config.duration, {
                    wave: config.wave,
                    volume: config.volume
                });
            }, index * 150);
        });
    }

    /**
	 * Play pause sound
	 */
    playPause() {
        if (!this.enabled) {
            return;
        }

        const config = this.uiSounds.pause;
        this.playDigitalTone(config.baseFreq, config.duration, {
            wave: config.wave,
            volume: config.volume
        });
    }

    /**
	 * Play resume sound
	 */
    playResume() {
        if (!this.enabled) {
            return;
        }

        const config = this.uiSounds.resume;
        this.playDigitalTone(config.baseFreq, config.duration, {
            wave: config.wave,
            volume: config.volume
        });
    }

    /**
	 * Play button hover sound
	 */
    playButtonHover() {
        if (!this.enabled) {
            return;
        }

        this.playDigitalTone(900, 0.03, {
            wave: 'sine',
            volume: 0.2
        });
    }

    /**
	 * Play button click sound
	 */
    playButtonClick() {
        if (!this.enabled) {
            return;
        }

        this.playDigitalTone(700, 0.05, {
            wave: 'square',
            volume: 0.3
        });
    }

    /**
	 * Play notification sound
	 */
    playNotification() {
        if (!this.enabled) {
            return;
        }

        this.playDigitalTone(1100, 0.1, {
            wave: 'sine',
            volume: 0.5
        });

        setTimeout(() => {
            this.playDigitalTone(1300, 0.1, {
                wave: 'sine',
                volume: 0.5
            });
        }, 50);
    }

    /**
	 * Play error sound
	 */
    playError() {
        if (!this.enabled) {
            return;
        }

        this.playDigitalTone(200, 0.2, {
            wave: 'sawtooth',
            volume: 0.4,
            glitch: true
        });
    }

    /**
	 * Play success sound
	 */
    playSuccess() {
        if (!this.enabled) {
            return;
        }

        const frequencies = [523, 659, 784];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playDigitalTone(freq, 0.15, {
                    wave: 'sine',
                    volume: 0.5
                });
            }, index * 100);
        });
    }


    /**
	 * Cleanup and stop all audio
	 */
    destroy() {
        this.stopEnemyModeAudio();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.initialized = false;
    }

    /**
	 * Get current audio state
	 * @returns {Object} Audio state information
	 */
    getState() {
        return {
            enabled: this.enabled,
            volume: this.volume,
            initialized: this.initialized,
            soundProfile: this.soundProfile,
            audioContextState: this.audioContext
                ? this.audioContext.state
                : 'not created'
        };
    }
}

export default TechSoundManager;
