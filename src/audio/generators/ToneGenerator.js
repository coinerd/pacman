/**
 * ToneGenerator
 * Generates procedural digital tones using Web Audio API oscillators
 */

export class ToneGenerator {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    /**
     * Create an oscillator
     * @param {string} type - Waveform type (sine, square, sawtooth, triangle)
     * @param {number} frequency - Frequency in Hz
     * @returns {OscillatorNode}
     */
    createOscillator(type, frequency) {
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        return oscillator;
    }

    /**
     * Create a gain node
     * @param {number} volume - Initial volume (0.0 to 1.0)
     * @returns {GainNode}
     */
    createGain(volume = 1.0) {
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        return gain;
    }

    /**
     * Add harmonics to an oscillator for richer sound
     * @param {OscillatorNode} baseOscillator - Base oscillator
     * @param {GainNode} outputGain - Output gain node
     * @param {Array<number>} harmonics - Harmonic multipliers
     * @param {number} masterVolume - Master volume multiplier
     */
    addHarmonics(baseOscillator, outputGain, harmonics, masterVolume = 1.0) {
        for (const harmonic of harmonics) {
            const harmonicOscillator = this.createOscillator(baseOscillator.type, baseOscillator.frequency.value * harmonic);
            const harmonicGain = this.createGain(masterVolume / harmonics.length);
            harmonicOscillator.connect(harmonicGain);
            harmonicGain.connect(outputGain);
            harmonicOscillator.start(this.audioContext.currentTime);
            harmonicOscillator.stop(this.audioContext.currentTime + 1); // Will be stopped by parent
        }
    }

    /**
     * Add frequency modulation to an oscillator
     * @param {OscillatorNode} oscillator - Oscillator to modulate
     * @param {number} depth - Modulation depth in Hz
     * @param {number} speed - Modulation speed in Hz
     * @returns {OscillatorNode} - The modulator oscillator (must be stopped)
     */
    addModulation(oscillator, depth, speed) {
        const modulator = this.createOscillator('sine', speed);
        const modulatorGain = this.createGain(depth);
        modulator.connect(modulatorGain);
        modulatorGain.connect(oscillator.frequency);
        modulator.start(this.audioContext.currentTime);
        return modulator;
    }

    /**
     * Add glitch effect to an oscillator (random frequency jumps)
     * @param {OscillatorNode} oscillator - Oscillator to glitch
     * @param {number} duration - Total duration
     * @param {number} maxJumps - Maximum number of frequency jumps
     * @returns {number} - Duration with glitches
     */
    addGlitchEffect(oscillator, duration, maxJumps = 3) {
        const numJumps = Math.floor(Math.random() * maxJumps) + 1;
        const glitchDuration = duration / (numJumps + 1);
        const currentFreq = oscillator.frequency.value;

        for (let i = 0; i < numJumps; i++) {
            const jumpFreq = currentFreq + (Math.random() - 0.5) * 400;
            const jumpTime = this.audioContext.currentTime + (i + 1) * glitchDuration;
            oscillator.frequency.setValueAtTime(jumpFreq, jumpTime);
            oscillator.frequency.linearRampToValueAtTime(currentFreq, jumpTime + glitchDuration * 0.5);
        }

        return duration;
    }

    /**
     * Create echo effect
     * @param {AudioNode} source - Source node to echo
     * @param {number} delayTime - Delay time in seconds
     * @param {number} feedback - Feedback level (0.0 to 1.0)
     * @param {number} wetLevel - Echo volume level
     * @returns {DelayNode} - The delay node
     */
    createEcho(source, delayTime, feedback, wetLevel) {
        const delay = this.audioContext.createDelay(delayTime * 2);
        delay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);

        const feedbackGain = this.createGain(feedback);
        const wetGain = this.createGain(wetLevel);

        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
        delay.connect(wetGain);
        source.connect(delay);

        return delay;
    }

    /**
     * Play a digital tone
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {Object} config - Tone configuration
     * @param {string} config.wave - Waveform type
     * @param {number} config.volume - Volume level
     * @param {Array<number>} config.harmonics - Harmonic multipliers
     * @param {number} config.modDepth - Modulation depth
     * @param {number} config.modSpeed - Modulation speed
     * @param {boolean} config.glitch - Add glitch effect
     * @param {number} config.maxJumps - Max glitch jumps
     * @param {boolean} config.echo - Add echo effect
     * @returns {void}
     */
    playDigitalTone(frequency, duration, config = {}) {
        const {
            wave = 'square',
            volume = 0.3,
            harmonics = [],
            modDepth = 0,
            modSpeed = 0,
            glitch = false,
            maxJumps = 3,
            echo = false
        } = config;

        const oscillator = this.createOscillator(wave, frequency);
        const gain = this.createGain(volume);
        const modulator = modDepth > 0 ? this.addModulation(oscillator, modDepth, modSpeed) : null;

        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);

        if (harmonics.length > 0) {
            this.addHarmonics(oscillator, gain, harmonics, volume);
        }

        const actualDuration = glitch ? this.addGlitchEffect(oscillator, duration, maxJumps) : duration;

        oscillator.start(this.audioContext.currentTime);
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + actualDuration);
        oscillator.stop(this.audioContext.currentTime + actualDuration);

        if (echo) {
            this.createEcho(gain, 0.1, 0.3, 0.5);
        }

        if (modulator) {
            modulator.stop(this.audioContext.currentTime + actualDuration);
        }
    }
}
