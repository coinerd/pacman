/**
 * SoundBuilder
 * Composes complex sounds from tone and noise generators
 */

import { ToneGenerator } from './ToneGenerator.js';
import { NoiseGenerator } from './NoiseGenerator.js';

export class SoundBuilder {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.toneGenerator = new ToneGenerator(audioContext);
        this.noiseGenerator = new NoiseGenerator(audioContext);
    }

    /**
     * Build and play a sound from configuration
     * @param {Object} config - Sound configuration
     * @param {string} config.type - Sound type (tone, noise, circuit, glitch, datastream)
     * @param {Object} config.params - Sound parameters
     * @param {number} volume - Volume level
     */
    buildSound(config, volume = 0.3) {
        const { type, params = {} } = config;

        switch (type) {
        case 'tone':
            this.buildTone(params, volume);
            break;

        case 'noise':
            this.buildNoise(params, volume);
            break;

        case 'circuit':
            this.buildCircuit(params, volume);
            break;

        case 'glitch':
            this.buildGlitch(params, volume);
            break;

        case 'datastream':
            this.buildDataStream(params, volume);
            break;

        case 'sweep':
            this.buildSweep(params, volume);
            break;

        case 'melody':
            this.buildMelody(params, volume);
            break;

        default:
            console.warn(`[SoundBuilder] Unknown sound type: ${type}`);
        }
    }

    /**
     * Build a simple tone
     * @param {Object} params - Tone parameters
     * @param {number} volume - Volume level
     */
    buildTone(params, volume) {
        this.toneGenerator.playDigitalTone(
            params.baseFreq + (Math.random() - 0.5) * (params.variance || 0),
            params.duration,
            {
                wave: params.wave || 'sine',
                volume,
                harmonics: params.harmonics || [],
                glitch: params.glitch || false,
                maxJumps: params.maxJumps || 3,
                echo: params.echo || false
            }
        );
    }

    /**
     * Build noise sound
     * @param {Object} params - Noise parameters
     * @param {number} volume - Volume level
     */
    buildNoise(params, volume) {
        this.noiseGenerator.playNoise(
            params.duration,
            params.type || 'white',
            volume
        );
    }

    /**
     * Build circuit hum sound
     * @param {Object} params - Circuit parameters
     * @param {number} volume - Volume level
     */
    buildCircuit(params, volume) {
        this.noiseGenerator.playCircuitHum(
            params.baseFreq,
            params.duration,
            volume
        );
    }

    /**
     * Build glitch sound
     * @param {Object} params - Glitch parameters
     * @param {number} volume - Volume level
     */
    buildGlitch(params, volume) {
        this.noiseGenerator.playGlitch(
            params.duration || 0.02,
            volume
        );
    }

    /**
     * Build data stream sound
     * @param {Object} params - Data stream parameters
     * @param {number} volume - Volume level
     */
    buildDataStream(params, volume) {
        this.noiseGenerator.playDataStream(
            params.count || 3,
            params.interval || 0.05,
            volume
        );
    }

    /**
     * Build a frequency sweep tone
     * @param {Object} params - Sweep parameters
     * @param {number} volume - Volume level
     */
    buildSweep(params, volume) {
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        oscillator.type = params.wave || 'sine';
        oscillator.frequency.setValueAtTime(params.startFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(params.endFreq, this.audioContext.currentTime + params.duration);

        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + params.duration);

        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + params.duration);
    }

    /**
     * Build a melody from frequencies
     * @param {Object} params - Melody parameters
     * @param {number} volume - Volume level
     */
    buildMelody(params, volume) {
        const { frequencies, duration, wave = 'sine', delay = 0, steps = 1 } = params;

        for (let i = 0; i < frequencies.length; i++) {
            const startTime = this.audioContext.currentTime + (i * delay);
            const noteDuration = duration / steps;

            const oscillator = this.audioContext.createOscillator();
            oscillator.type = wave;
            oscillator.frequency.setValueAtTime(frequencies[i], startTime);

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

            oscillator.connect(gain);
            gain.connect(this.audioContext.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + noteDuration);
        }
    }

    /**
     * Get tone generator (for advanced use)
     * @returns {ToneGenerator}
     */
    getToneGenerator() {
        return this.toneGenerator;
    }

    /**
     * Get noise generator (for advanced use)
     * @returns {NoiseGenerator}
     */
    getNoiseGenerator() {
        return this.noiseGenerator;
    }
}
