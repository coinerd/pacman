/**
 * NoiseGenerator
 * Generates procedural noise for sound effects
 */

export class NoiseGenerator {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.scriptProcessor = null;
    }

    /**
     * Create a noise buffer
     * @param {number} duration - Duration in seconds
     * @param {string} type - Noise type ('white', 'pink', 'brown')
     * @returns {AudioBuffer}
     */
    createNoiseBuffer(duration, type = 'white') {
        const bufferSize = Math.ceil(this.audioContext.sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = this.generateNoiseSample(type, i);
        }

        return buffer;
    }

    /**
     * Generate a single noise sample
     * @param {string} type - Noise type
     * @param {number} index - Sample index
     * @returns {number}
     */
    generateNoiseSample(type, _index) {
        switch (type) {
        case 'white':
            return Math.random() * 2 - 1;

        case 'pink': {
            // Pink noise using Paul Kellett's refined method
            if (!this.pinkState) {
                this.pinkState = { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0 };
            }
            const white = Math.random() * 2 - 1;
            this.pinkState.b0 = 0.99886 * this.pinkState.b0 + white * 0.0555179;
            this.pinkState.b1 = 0.99332 * this.pinkState.b1 + white * 0.0750759;
            this.pinkState.b2 = 0.96900 * this.pinkState.b2 + white * 0.1538520;
            this.pinkState.b3 = 0.86650 * this.pinkState.b3 + white * 0.3104856;
            this.pinkState.b4 = 0.55000 * this.pinkState.b4 + white * 0.5329522;
            this.pinkState.b5 = -0.7616 * this.pinkState.b5 - white * 0.0168980;
            return this.pinkState.b0 + this.pinkState.b1 + this.pinkState.b2 + this.pinkState.b3 + this.pinkState.b4 + this.pinkState.b5 + this.pinkState.b6 + white * 0.5362;
        }

        case 'brown': {
            // Brown noise using simple filter
            if (!this.brownState) {
                this.brownState = { lastOut: 0 };
            }
            const brownWhite = Math.random() * 2 - 1;
            this.brownState.lastOut = (this.brownState.lastOut + (0.02 * brownWhite)) / 1.02;
            return this.brownState.lastOut * 3.5;
        }

        default:
            return Math.random() * 2 - 1;
        }
    }

    /**
     * Play noise
     * @param {number} duration - Duration in seconds
     * @param {string} type - Noise type
     * @param {number} volume - Volume level
     * @returns {void}
     */
    playNoise(duration, type = 'white', volume = 0.3) {
        const buffer = this.createNoiseBuffer(duration, type);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        source.connect(gain);
        gain.connect(this.audioContext.destination);

        source.start(this.audioContext.currentTime);
        source.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Create a circuit hum sound
     * @param {number} baseFreq - Base frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {number} volume - Volume level
     * @returns {void}
     */
    playCircuitHum(baseFreq, duration, volume) {
        const noiseBuffer = this.createNoiseBuffer(duration, 'pink');
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        // Create low-pass filter
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        filter.Q.setValueAtTime(5, this.audioContext.currentTime);

        // Create oscillator for fundamental frequency
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);

        // Create gain nodes
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.5, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        const oscGain = this.audioContext.createGain();
        oscGain.gain.setValueAtTime(volume * 0.3, this.audioContext.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        // Connect nodes
        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        oscillator.connect(oscGain);
        oscGain.connect(this.audioContext.destination);

        // Start and stop
        noiseSource.start(this.audioContext.currentTime);
        noiseSource.stop(this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Create a glitch sound (burst of high-frequency noise)
     * @param {number} duration - Duration in seconds
     * @param {number} volume - Volume level
     * @returns {void}
     */
    playGlitch(duration = 0.02, volume = 0.3) {
        const buffer = this.createNoiseBuffer(duration, 'white');
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        // High-pass filter for crisp glitch sound
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.Q.setValueAtTime(10, this.audioContext.currentTime);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        source.start(this.audioContext.currentTime);
        source.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Create a data stream sound (sequence of high-frequency chirps)
     * @param {number} count - Number of chirps
     * @param {number} interval - Interval between chirps
     * @param {number} volume - Volume level
     * @returns {void}
     */
    playDataStream(count = 3, interval = 0.05, volume = 0.2) {
        for (let i = 0; i < count; i++) {
            const startTime = this.audioContext.currentTime + (i * interval);
            const duration = 0.01 + Math.random() * 0.02;
            const frequency = 2000 + Math.random() * 3000;

            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(frequency, startTime);

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            oscillator.connect(gain);
            gain.connect(this.audioContext.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        }
    }

    /**
     * Reset internal state
     */
    reset() {
        this.pinkState = null;
        this.brownState = null;
    }
}
