/**
 * Sound Manager
 * Handles all audio effects for the game using Web Audio API
 */

export class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.5;
        this.initialized = false;
    }

    /**
     * Initialize the audio context
     * Must be called after user interaction due to browser autoplay policies
     */
    initialize() {
        if (this.initialized) {return;}

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.enabled = false;
        }
    }

    /**
     * Play a tone with specified frequency and duration
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {string} type - Waveform type ('sine', 'square', 'sawtooth', 'triangle')
     */
    playTone(frequency, duration, type = 'square') {
        if (!this.enabled || !this.audioContext) {return;}

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing tone:', error);
        }
    }

    /**
     * Play waka-waka sound when eating pellets
     */
    playWakaWaka() {
        if (!this.enabled) {return;}
        this.playTone(400, 0.1, 'triangle');
    }

    /**
     * Play power pellet activation sound
     */
    playPowerPellet() {
        if (!this.enabled || !this.scene) {return;}
        this.playTone(600, 0.3, 'square');
        this.scene.time.delayedCall(100, () => this.playTone(800, 0.2, 'square'));
    }

    /**
     * Play ghost eaten sound
     */
    playGhostEaten() {
        if (!this.enabled || !this.scene) {return;}
        this.playTone(800, 0.2, 'square');
        this.scene.time.delayedCall(150, () => this.playTone(1000, 0.15, 'square'));
    }

    /**
     * Play death sound
     */
    playDeath() {
        if (!this.enabled || !this.scene) {return;}
        const frequencies = [400, 350, 300, 250, 200, 150, 100];
        frequencies.forEach((freq, index) => {
            this.scene.time.delayedCall(index * 100, () => this.playTone(freq, 0.15, 'sawtooth'));
        });
    }

    /**
     * Play level complete sound
     */
    playLevelComplete() {
        if (!this.enabled || !this.scene) {return;}
        const frequencies = [523, 659, 784, 1047];
        frequencies.forEach((freq, index) => {
            this.scene.time.delayedCall(index * 150, () => this.playTone(freq, 0.2, 'sine'));
        });
    }

    /**
     * Play fruit eaten sound
     */
    playFruitEat() {
        if (!this.enabled || !this.scene) {return;}
        this.playTone(500, 0.15, 'sine');
        this.scene.time.delayedCall(100, () => this.playTone(700, 0.15, 'sine'));
    }

    /**
     * Set the master volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Enable or disable sound
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Resume audio context if suspended
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}
