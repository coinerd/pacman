/**
 * SoundEngine
 * Web Audio API Wrapper for audio context and master gain management
 */

export class SoundEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
        this.enabled = true;
        this.volume = 0.5;
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

            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.setValueAtTime(
                this.volume,
                this.audioContext.currentTime
            );
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.enabled = false;
        }
    }

    /**
     * Resume audio context (must be called after user interaction)
     */
    resume() {
        if (!this.audioContext || !this.enabled) {
            return;
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Set master volume
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
     * Enable or disable audio
     * @param {boolean} enabled - Whether audio is enabled
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
     * Get audio context (for internal use by other modules)
     * @returns {AudioContext|null}
     */
    getContext() {
        return this.audioContext;
    }

    /**
     * Get master gain node (for internal use by other modules)
     * @returns {GainNode|null}
     */
    getMasterGain() {
        return this.masterGain;
    }

    /**
     * Check if audio is enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled && this.initialized;
    }

    /**
     * Check if initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Destroy audio engine
     */
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.masterGain = null;
        this.initialized = false;
    }
}
