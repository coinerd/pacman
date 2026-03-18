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
        this.musicPlaying = false;
        this.musicInterval = null;
        this.musicVolume = 0.15; // Lower volume for background music
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
    async playTone(frequency, duration, type = 'square') {
        // Initialize AudioContext on first sound (browser autoplay policy requires user interaction)
        if (!this.initialized) {
            this.initialize();
        }

        // Resume AudioContext if suspended (browser autoplay policy) - MUST await!
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

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

    /**
     * Start retro background music
     * Creates an 8-bit chiptune melody that loops continuously
     */
    async startBackgroundMusic() {
        // Stop any existing music first (handles hot-reload scenarios)
        this.stopBackgroundMusic();

        // Initialize AudioContext if needed
        if (!this.initialized) {
            this.initialize();
        }

        // Resume AudioContext if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (!this.audioContext) {return;}

        this.musicPlaying = true;

        // EPIC 5-MINUTE RETRO CHIPTUNE - Full dynamic piece with multiple themes
        // Structure: Intro → Theme A → A Var → Bridge B → Theme C → Bridge D → Theme A Return → Finale
        // Total: ~5 minutes before loop

        // Note: volume = dynamic multiplier (0.0-1.5), intensity = bass level (0-2)
        const melody = [
            // ============================================
            // INTRO (0:00-0:20) - Quiet, building atmosphere
            // ============================================
            // Soft opening - melody only, no bass
            { freq: 523.25, duration: 0.5, volume: 0.3, intensity: 0 },   // C5
            { freq: 659.25, duration: 0.5, volume: 0.3, intensity: 0 },   // E5
            { freq: 783.99, duration: 0.5, volume: 0.3, intensity: 0 },   // G5
            { freq: 1046.50, duration: 1.0, volume: 0.3, intensity: 0 },  // C6 - sustained

            // Repeat with slight variation, add subtle bass
            { freq: 523.25, duration: 0.5, volume: 0.4, intensity: 0.5 },
            { freq: 659.25, duration: 0.5, volume: 0.4, intensity: 0.5 },
            { freq: 783.99, duration: 0.5, volume: 0.4, intensity: 0.5 },
            { freq: 987.77, duration: 0.5, volume: 0.4, intensity: 0.5 },  // B5
            { freq: 1046.50, duration: 1.0, volume: 0.5, intensity: 0.5 }, // C6

            // Building - add arpeggios
            { freq: 523.25, duration: 0.25, volume: 0.5, intensity: 1 },
            { freq: 659.25, duration: 0.25, volume: 0.5, intensity: 1 },
            { freq: 783.99, duration: 0.25, volume: 0.5, intensity: 1 },
            { freq: 1046.50, duration: 0.25, volume: 0.5, intensity: 1 },
            { freq: 783.99, duration: 0.25, volume: 0.5, intensity: 1 },
            { freq: 659.25, duration: 0.25, volume: 0.5, intensity: 1 },
            { freq: 523.25, duration: 0.5, volume: 0.6, intensity: 1 },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },  // REST

            // ============================================
            // THEME A - Main Theme (0:20-1:10) - Full energy
            // ============================================
            // Phrase 1 - Opening motif (loud, full bass with power chords)
            { freq: 523.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 587.33, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'chord3' },
            { freq: 698.46, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.5, volume: 1.0, intensity: 2, bass: 'chord3' },
            { freq: 698.46, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 587.33, duration: 0.5, volume: 1.0, intensity: 2 },

            // Phrase 2 - Rising (with arpeggiated bass)
            { freq: 523.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 587.33, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.5, volume: 1.0, intensity: 2, bass: 'chord3' },
            { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 523.25, duration: 0.5, volume: 1.0, intensity: 2 },

            // Phrase 3 - Climbing (power chords)
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 698.46, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2, bass: 'chord3' },
            { freq: 880.00, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 987.77, duration: 0.5, volume: 1.0, intensity: 2, bass: 'chord3' },
            { freq: 880.00, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 659.25, duration: 0.5, volume: 1.0, intensity: 2 },

            // Phrase 4 - Resolution
            { freq: 523.25, duration: 0.33, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.33, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.33, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.33, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.33, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.33, volume: 1.0, intensity: 2 },
            { freq: 1046.50, duration: 1.0, volume: 1.0, intensity: 2 },

            // Theme A - Repeat with variation (softer)
            { freq: 783.99, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 880.00, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 987.77, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 1046.50, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 987.77, duration: 0.5, volume: 0.8, intensity: 1.5 },
            { freq: 880.00, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 783.99, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 698.46, duration: 0.5, volume: 0.8, intensity: 1.5 },

            { freq: 659.25, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 783.99, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 880.00, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 987.77, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 1046.50, duration: 0.5, volume: 0.8, intensity: 1.5 },
            { freq: 987.77, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 880.00, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 659.25, duration: 0.5, volume: 0.8, intensity: 1.5 },

            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST - transition

            // ============================================
            // BRIDGE B - Minor Key (1:10-2:00) - Mysterious, quieter
            // ============================================
            // Phrase 1 - Minor feel (quieter, less bass)
            { freq: 440.00, duration: 0.25, volume: 0.6, intensity: 1 },
            { freq: 493.88, duration: 0.25, volume: 0.6, intensity: 1 },
            { freq: 523.25, duration: 0.25, volume: 0.6, intensity: 1 },
            { freq: 587.33, duration: 0.25, volume: 0.6, intensity: 1 },
            { freq: 659.25, duration: 0.5, volume: 0.6, intensity: 1 },
            { freq: 587.33, duration: 0.25, volume: 0.6, intensity: 1 },
            { freq: 523.25, duration: 0.25, volume: 0.6, intensity: 1 },
            { freq: 493.88, duration: 0.5, volume: 0.6, intensity: 1 },

            // Phrase 2 - Descending (building)
            { freq: 440.00, duration: 0.25, volume: 0.7, intensity: 1.2 },
            { freq: 392.00, duration: 0.25, volume: 0.7, intensity: 1.2 },
            { freq: 349.23, duration: 0.25, volume: 0.7, intensity: 1.2 },
            { freq: 329.63, duration: 0.25, volume: 0.7, intensity: 1.2 },
            { freq: 293.66, duration: 0.5, volume: 0.7, intensity: 1.2 },
            { freq: 329.63, duration: 0.25, volume: 0.7, intensity: 1.2 },
            { freq: 349.23, duration: 0.25, volume: 0.7, intensity: 1.2 },
            { freq: 392.00, duration: 0.5, volume: 0.7, intensity: 1.2 },

            // Phrase 3 - Tension building (crescendo)
            { freq: 440.00, duration: 0.25, volume: 0.8, intensity: 1.5 },
            { freq: 523.25, duration: 0.25, volume: 0.85, intensity: 1.5 },
            { freq: 587.33, duration: 0.25, volume: 0.9, intensity: 1.5 },
            { freq: 659.25, duration: 0.25, volume: 0.95, intensity: 1.5 },
            { freq: 698.46, duration: 0.5, volume: 1.0, intensity: 1.5 },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 1.5 },
            { freq: 587.33, duration: 0.25, volume: 1.0, intensity: 1.5 },
            { freq: 523.25, duration: 0.5, volume: 1.0, intensity: 1.5 },

            // Phrase 4 - Transition (loud)
            { freq: 493.88, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 587.33, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 698.46, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.5, volume: 1.0, intensity: 2 },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

            // ============================================
            // THEME C - New Material (2:00-2:50) - Arpeggiated, energetic
            // ============================================
            // Fast arpeggios - C major with arpeggiated bass
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 1046.50, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 783.99, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.4, volume: 1.0, intensity: 2, bass: 'chord3' },

            // G major arpeggio
            { freq: 392.00, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 493.88, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 587.33, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 587.33, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 493.88, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 392.00, duration: 0.4, volume: 1.0, intensity: 2, bass: 'chord3' },

            // A minor arpeggio
            { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 440.00, duration: 0.4, volume: 1.0, intensity: 2, bass: 'chord3' },

            // F major arpeggio
            { freq: 349.23, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 698.46, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 349.23, duration: 0.4, volume: 1.0, intensity: 2, bass: 'chord3' },

            // Triplets - rising (power chords)
            { freq: 523.25, duration: 0.167, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 587.33, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 698.46, duration: 0.167, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 783.99, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 987.77, duration: 0.167, volume: 1.0, intensity: 2, bass: 'chord3' },
            { freq: 1046.50, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 987.77, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.167, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 783.99, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 698.46, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.5, volume: 1.0, intensity: 2, bass: 'chord3' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },  // REST

            // ============================================
            // BRIDGE D - Quiet Interlude (2:50-3:30) - Soft, melodic
            // ============================================
            // Very soft, minimal bass
            { freq: 659.25, duration: 0.5, volume: 0.4, intensity: 0.3 },
            { freq: 783.99, duration: 0.5, volume: 0.4, intensity: 0.3 },
            { freq: 880.00, duration: 0.5, volume: 0.4, intensity: 0.3 },
            { freq: 783.99, duration: 0.5, volume: 0.4, intensity: 0.3 },

            { freq: 659.25, duration: 0.5, volume: 0.5, intensity: 0.5 },
            { freq: 523.25, duration: 0.5, volume: 0.5, intensity: 0.5 },
            { freq: 587.33, duration: 0.5, volume: 0.5, intensity: 0.5 },
            { freq: 659.25, duration: 1.0, volume: 0.5, intensity: 0.5 },

            // Slowly building
            { freq: 523.25, duration: 0.5, volume: 0.6, intensity: 0.7 },
            { freq: 659.25, duration: 0.5, volume: 0.6, intensity: 0.7 },
            { freq: 783.99, duration: 0.5, volume: 0.7, intensity: 0.9 },
            { freq: 1046.50, duration: 0.5, volume: 0.8, intensity: 1.1 },

            { freq: 987.77, duration: 0.5, volume: 0.9, intensity: 1.3 },
            { freq: 880.00, duration: 0.5, volume: 0.9, intensity: 1.5 },
            { freq: 783.99, duration: 0.5, volume: 1.0, intensity: 1.7 },
            { freq: 659.25, duration: 0.5, volume: 1.0, intensity: 2 },

            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST - dramatic pause

            // ============================================
            // THEME A RETURN (3:30-4:20) - Full power
            // ============================================
            // Phrase 1 - Back to main theme (loudest!)
            { freq: 523.25, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 587.33, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 698.46, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 783.99, duration: 0.5, volume: 1.2, intensity: 2 },
            { freq: 698.46, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 587.33, duration: 0.5, volume: 1.2, intensity: 2 },

            // Phrase 2
            { freq: 523.25, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 587.33, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 783.99, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 880.00, duration: 0.5, volume: 1.2, intensity: 2 },
            { freq: 783.99, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 523.25, duration: 0.5, volume: 1.2, intensity: 2 },

            // Phrase 3 - High energy
            { freq: 783.99, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 880.00, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 987.77, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 1046.50, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 1174.66, duration: 0.5, volume: 1.2, intensity: 2 },  // D6
            { freq: 1046.50, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 987.77, duration: 0.25, volume: 1.2, intensity: 2 },
            { freq: 880.00, duration: 0.5, volume: 1.2, intensity: 2 },

            // Phrase 4 - Building to finale
            { freq: 783.99, duration: 0.25, volume: 1.3, intensity: 2 },
            { freq: 880.00, duration: 0.25, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 0.25, volume: 1.3, intensity: 2 },
            { freq: 698.46, duration: 0.25, volume: 1.3, intensity: 2 },
            { freq: 659.25, duration: 0.5, volume: 1.3, intensity: 2 },
            { freq: 523.25, duration: 0.5, volume: 1.3, intensity: 2 },
            { freq: 659.25, duration: 0.5, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 0.5, volume: 1.3, intensity: 2 },

            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST - before finale

            // ============================================
            // GRAND FINALE (4:20-5:00) - Epic conclusion
            // ============================================
            // Big chords (arpeggiated with full bass chords)
            { freq: 523.25, duration: 0.2, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 1046.50, duration: 0.4, volume: 1.3, intensity: 2, bass: 'arp' },
            { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 659.25, duration: 0.2, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 523.25, duration: 0.4, volume: 1.3, intensity: 2, bass: 'chord3' },

            { freq: 659.25, duration: 0.2, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 987.77, duration: 0.2, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 1318.51, duration: 0.4, volume: 1.3, intensity: 2, bass: 'arp' },  // E6
            { freq: 987.77, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.4, volume: 1.3, intensity: 2, bass: 'chord3' },

            // Rising to climax (full power chords)
            { freq: 1046.50, duration: 0.25, volume: 1.4, intensity: 2, bass: 'chord3' },
            { freq: 1174.66, duration: 0.25, volume: 1.4, intensity: 2 },
            { freq: 1318.51, duration: 0.25, volume: 1.4, intensity: 2, bass: 'chord3' },
            { freq: 1396.91, duration: 0.25, volume: 1.4, intensity: 2 },  // F6
            { freq: 1567.98, duration: 0.5, volume: 1.5, intensity: 2, bass: 'chord3' },  // G6 - peak!
            { freq: 1396.91, duration: 0.25, volume: 1.4, intensity: 2 },
            { freq: 1318.51, duration: 0.25, volume: 1.4, intensity: 2, bass: 'chord3' },
            { freq: 1046.50, duration: 0.5, volume: 1.4, intensity: 2, bass: 'chord3' },

            // Final sustained notes - epic ending with full chords
            { freq: 783.99, duration: 0.5, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 880.00, duration: 0.5, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 783.99, duration: 0.5, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.5, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 523.25, duration: 0.75, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.75, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 783.99, duration: 1.0, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 1046.50, duration: 2.0, volume: 1.5, intensity: 2, bass: 'chord3' },  // C6 - epic final sustain!
            { freq: 659.25, duration: 0.75, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 1.0, volume: 1.3, intensity: 2 },
            { freq: 1046.50, duration: 2.0, volume: 1.5, intensity: 2 },  // C6 - epic final sustain!

            // Brief silence before loop
            { freq: 0, duration: 1.0, volume: 0, intensity: 0 }
        ];

        let noteIndex = 0;
        const bpm = 120; // Tempo
        const beatDuration = 60 / bpm; // Duration of one beat in seconds

        // Play the melody in a loop
        const playMelodyNote = () => {
            if (!this.musicPlaying || !this.audioContext) {return;}

            const note = melody[noteIndex];

            // Handle REST (freq 0)
            if (note.freq === 0) {
                noteIndex = (noteIndex + 1) % melody.length;
                return;
            }

            // Get dynamic volume for this note
            const noteVolume = this.musicVolume * (note.volume || 1.0);

            // Create oscillator for melody (square wave for classic 8-bit sound)
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'square'; // Classic 8-bit sound
            oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);

            // Volume envelope - quick attack, sustain, quick release
            const noteTime = note.duration * beatDuration;
            gainNode.gain.setValueAtTime(noteVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + noteTime * 0.9);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + noteTime);

            // Add bass based on intensity and bass type
            const intensity = note.intensity !== undefined ? note.intensity : 1;
            const bassType = note.bass || 'single'; // 'single', 'chord2', 'chord3', 'arp'

            if (intensity > 0 && noteIndex % 2 === 0) {
                const bassVolume = noteVolume * 0.25 * intensity;
                const rootFreq = note.freq / 2; // One octave down

                // Frequency ratios for chord tones
                const major3rd = rootFreq * 1.26;  // Major 3rd
                const minor3rd = rootFreq * 1.189; // Minor 3rd
                const perfect5th = rootFreq * 1.498; // Perfect 5th

                // Determine if major or minor based on melody context
                const isMinor = note.freq === 440 || note.freq === 493.88 || note.freq === 587.33; // A, B, D frequencies
                const thirdFreq = isMinor ? minor3rd : major3rd;

                // Helper function to create a bass oscillator
                const createBassOsc = (freq, startTime, duration, type = 'sawtooth') => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();

                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);

                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, startTime);

                    gain.gain.setValueAtTime(bassVolume, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.8);

                    osc.start(startTime);
                    osc.stop(startTime + duration);
                };

                // Play bass based on type
                switch (bassType) {
                case 'chord2': // Power chord (root + 5th)
                    createBassOsc(rootFreq, this.audioContext.currentTime, noteTime);
                    createBassOsc(perfect5th, this.audioContext.currentTime, noteTime);
                    break;

                case 'chord3': // Full chord (root + 3rd + 5th)
                    createBassOsc(rootFreq, this.audioContext.currentTime, noteTime);
                    createBassOsc(thirdFreq, this.audioContext.currentTime, noteTime);
                    createBassOsc(perfect5th, this.audioContext.currentTime, noteTime);
                    break;

                case 'arp': { // Arpeggio (root, 3rd, 5th in sequence)
                    const arpDuration = noteTime / 3;
                    createBassOsc(rootFreq, this.audioContext.currentTime, arpDuration);
                    createBassOsc(thirdFreq, this.audioContext.currentTime + arpDuration, arpDuration);
                    createBassOsc(perfect5th, this.audioContext.currentTime + arpDuration * 2, arpDuration);
                    break;
                }

                case 'single':
                default: // Single bass note
                    createBassOsc(rootFreq, this.audioContext.currentTime, noteTime);
                    break;
                }
            }

            // Move to next note
            noteIndex = (noteIndex + 1) % melody.length;
        };

        // Start playing immediately
        playMelodyNote();

        // Schedule notes using the timing from the melody
        let lastNoteDuration = melody[0].duration * beatDuration * 1000; // Convert to ms
        const scheduleNextNote = () => {
            if (!this.musicPlaying) {return;}

            playMelodyNote();
            const currentNoteDuration = melody[noteIndex === 0 ? melody.length - 1 : noteIndex - 1].duration * beatDuration * 1000;
            this.musicInterval = setTimeout(scheduleNextNote, currentNoteDuration);
        };

        // Start the scheduling loop
        this.musicInterval = setTimeout(scheduleNextNote, lastNoteDuration);
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
        // Close AudioContext to stop ALL audio (handles hot-reload scenarios)
        if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
            this.initialized = false;
        }
    }

    /**
     * Start dark background music theme - E minor version
     * Dark, ominous reinterpretation of the main theme
     */
    startDarkTheme() {
        // Stop any existing music first (handles hot-reload scenarios)
        this.stopBackgroundMusic();

        if (!this.initialized) {
            this.initialize();
        }

        this.musicPlaying = true;

        // DARK THEME - E Minor, ominous reinterpretation
        // Same structure but lower register, minor intervals, dissonance
        // Key: E minor (E4 = 329.63 Hz as root, lower for ominous feel)

        const melody = [
            // ============================================
            // DARK INTRO (0:00-0:25) - Ominous, building dread
            // ============================================
            // Low, slow opening - minor key atmosphere
            { freq: 329.63, duration: 0.75, volume: 0.25, intensity: 0 },    // E4 - root, quiet
            { freq: 392.00, duration: 0.75, volume: 0.25, intensity: 0 },    // G4 - minor 3rd
            { freq: 493.88, duration: 0.75, volume: 0.25, intensity: 0 },    // B4 - perfect 5th
            { freq: 659.25, duration: 1.5, volume: 0.3, intensity: 0 },      // E5 - octave, sustained

            // Repeat with slight variation, add subtle dissonant bass
            { freq: 329.63, duration: 0.75, volume: 0.35, intensity: 0.4, bass: 'single' },
            { freq: 392.00, duration: 0.75, volume: 0.35, intensity: 0.4 },
            { freq: 493.88, duration: 0.75, volume: 0.35, intensity: 0.4 },
            { freq: 587.33, duration: 0.75, volume: 0.35, intensity: 0.4 },  // D5 - minor 7th (darker)
            { freq: 659.25, duration: 1.5, volume: 0.4, intensity: 0.5 },

            // Building tension with tritones
            { freq: 329.63, duration: 0.33, volume: 0.45, intensity: 0.6, bass: 'chord2' },
            { freq: 466.16, duration: 0.33, volume: 0.45, intensity: 0.6 },  // Bb4 - tritone (diminished)
            { freq: 493.88, duration: 0.33, volume: 0.45, intensity: 0.6 },
            { freq: 659.25, duration: 0.33, volume: 0.45, intensity: 0.6, bass: 'chord2' },
            { freq: 466.16, duration: 0.33, volume: 0.45, intensity: 0.6 },  // Tritone again
            { freq: 493.88, duration: 0.33, volume: 0.45, intensity: 0.6 },
            { freq: 329.63, duration: 0.75, volume: 0.5, intensity: 0.8, bass: 'chord3' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST - ominous silence

            // ============================================
            // DARK THEME A - Main Theme in Minor (0:25-1:20)
            // ============================================
            // Phrase 1 - Ominous motif (minor key, heavy bass)
            { freq: 329.63, duration: 0.33, volume: 0.8, intensity: 2, bass: 'chord3' },
            { freq: 392.00, duration: 0.33, volume: 0.8, intensity: 2 },
            { freq: 440.00, duration: 0.33, volume: 0.8, intensity: 2, bass: 'chord3' },
            { freq: 493.88, duration: 0.33, volume: 0.8, intensity: 2 },
            { freq: 587.33, duration: 0.66, volume: 0.8, intensity: 2, bass: 'chord3' },  // Minor 7th
            { freq: 493.88, duration: 0.33, volume: 0.8, intensity: 2 },
            { freq: 440.00, duration: 0.33, volume: 0.8, intensity: 2, bass: 'chord2' },
            { freq: 392.00, duration: 0.66, volume: 0.8, intensity: 2 },

            // Phrase 2 - Descending into darkness
            { freq: 329.63, duration: 0.33, volume: 0.85, intensity: 2, bass: 'arp' },
            { freq: 392.00, duration: 0.33, volume: 0.85, intensity: 2 },
            { freq: 440.00, duration: 0.33, volume: 0.85, intensity: 2, bass: 'arp' },
            { freq: 493.88, duration: 0.33, volume: 0.85, intensity: 2 },
            { freq: 587.33, duration: 0.66, volume: 0.9, intensity: 2, bass: 'chord3' },
            { freq: 493.88, duration: 0.33, volume: 0.85, intensity: 2 },
            { freq: 440.00, duration: 0.33, volume: 0.85, intensity: 2, bass: 'chord2' },
            { freq: 329.63, duration: 0.66, volume: 0.85, intensity: 2 },

            // Phrase 3 - Climbing tension
            { freq: 440.00, duration: 0.33, volume: 0.9, intensity: 2, bass: 'chord2' },
            { freq: 493.88, duration: 0.33, volume: 0.9, intensity: 2 },
            { freq: 587.33, duration: 0.33, volume: 0.9, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.33, volume: 0.9, intensity: 2 },
            { freq: 783.99, duration: 0.66, volume: 0.95, intensity: 2, bass: 'chord3' },  // G5
            { freq: 659.25, duration: 0.33, volume: 0.9, intensity: 2 },
            { freq: 587.33, duration: 0.33, volume: 0.9, intensity: 2, bass: 'chord2' },
            { freq: 440.00, duration: 0.66, volume: 0.9, intensity: 2 },

            // Phrase 4 - Dark resolution
            { freq: 329.63, duration: 0.5, volume: 0.9, intensity: 2, bass: 'chord3' },
            { freq: 440.00, duration: 0.5, volume: 0.9, intensity: 2 },
            { freq: 493.88, duration: 0.5, volume: 0.9, intensity: 2, bass: 'chord3' },
            { freq: 329.63, duration: 0.5, volume: 0.9, intensity: 2 },
            { freq: 440.00, duration: 0.5, volume: 0.9, intensity: 2, bass: 'chord2' },
            { freq: 493.88, duration: 0.5, volume: 0.9, intensity: 2 },
            { freq: 659.25, duration: 1.5, volume: 1.0, intensity: 2, bass: 'chord3' },  // E5 - sustained

            // Theme A variation - darker
            { freq: 587.33, duration: 0.33, volume: 0.8, intensity: 2, bass: 'chord2' },
            { freq: 659.25, duration: 0.33, volume: 0.8, intensity: 2 },
            { freq: 783.99, duration: 0.33, volume: 0.8, intensity: 2, bass: 'chord3' },
            { freq: 880.00, duration: 0.33, volume: 0.8, intensity: 2 },  // A5
            { freq: 783.99, duration: 0.66, volume: 0.8, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.33, volume: 0.8, intensity: 2 },
            { freq: 587.33, duration: 0.33, volume: 0.8, intensity: 2, bass: 'chord2' },
            { freq: 493.88, duration: 0.66, volume: 0.8, intensity: 2 },

            { freq: 440.00, duration: 0.33, volume: 0.8, intensity: 2, bass: 'arp' },
            { freq: 493.88, duration: 0.33, volume: 0.8, intensity: 2 },
            { freq: 587.33, duration: 0.33, volume: 0.8, intensity: 2, bass: 'arp' },
            { freq: 659.25, duration: 0.33, volume: 0.8, intensity: 2 },
            { freq: 783.99, duration: 0.66, volume: 0.85, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.33, volume: 0.8, intensity: 2 },
            { freq: 587.33, duration: 0.33, volume: 0.8, intensity: 2, bass: 'chord2' },
            { freq: 440.00, duration: 0.66, volume: 0.8, intensity: 2 },

            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

            // ============================================
            // DARK BRIDGE B - Even Darker (1:20-2:15)
            // ============================================
            // Descending into the abyss - very low register
            { freq: 293.66, duration: 0.33, volume: 0.6, intensity: 1.2, bass: 'chord2' },  // D4
            { freq: 329.63, duration: 0.33, volume: 0.6, intensity: 1.2 },
            { freq: 392.00, duration: 0.33, volume: 0.6, intensity: 1.2, bass: 'chord2' },
            { freq: 440.00, duration: 0.33, volume: 0.6, intensity: 1.2 },
            { freq: 493.88, duration: 0.66, volume: 0.65, intensity: 1.5, bass: 'chord3' },
            { freq: 440.00, duration: 0.33, volume: 0.6, intensity: 1.2 },
            { freq: 392.00, duration: 0.33, volume: 0.6, intensity: 1.2, bass: 'chord2' },
            { freq: 329.63, duration: 0.66, volume: 0.6, intensity: 1.2 },

            // Phrase 2 - Deep descent
            { freq: 293.66, duration: 0.33, volume: 0.65, intensity: 1.5, bass: 'chord2' },
            { freq: 261.63, duration: 0.33, volume: 0.65, intensity: 1.5 },  // C4 - darker
            { freq: 246.94, duration: 0.33, volume: 0.65, intensity: 1.5, bass: 'chord2' },  // B3
            { freq: 220.00, duration: 0.33, volume: 0.65, intensity: 1.5 },  // A3 - very low
            { freq: 196.00, duration: 0.66, volume: 0.7, intensity: 1.7, bass: 'chord3' },  // G3
            { freq: 220.00, duration: 0.33, volume: 0.65, intensity: 1.5 },
            { freq: 246.94, duration: 0.33, volume: 0.65, intensity: 1.5, bass: 'chord2' },
            { freq: 293.66, duration: 0.66, volume: 0.65, intensity: 1.5 },

            // Phrase 3 - Rising from depths (crescendo)
            { freq: 293.66, duration: 0.33, volume: 0.7, intensity: 1.6, bass: 'chord2' },
            { freq: 329.63, duration: 0.33, volume: 0.75, intensity: 1.7 },
            { freq: 392.00, duration: 0.33, volume: 0.8, intensity: 1.8, bass: 'chord2' },
            { freq: 440.00, duration: 0.33, volume: 0.85, intensity: 1.9 },
            { freq: 493.88, duration: 0.66, volume: 0.9, intensity: 2, bass: 'chord3' },
            { freq: 440.00, duration: 0.33, volume: 0.85, intensity: 1.9 },
            { freq: 392.00, duration: 0.33, volume: 0.8, intensity: 1.8, bass: 'chord2' },
            { freq: 329.63, duration: 0.66, volume: 0.75, intensity: 1.7 },

            // Phrase 4 - Transition with dissonance
            { freq: 311.13, duration: 0.33, volume: 0.8, intensity: 2, bass: 'chord2' },  // Eb4 - tritone
            { freq: 329.63, duration: 0.33, volume: 0.85, intensity: 2 },
            { freq: 392.00, duration: 0.33, volume: 0.9, intensity: 2, bass: 'chord2' },
            { freq: 440.00, duration: 0.33, volume: 0.95, intensity: 2 },
            { freq: 466.16, duration: 0.33, volume: 1.0, intensity: 2, bass: 'chord2' },  // Bb4 - tritone
            { freq: 493.88, duration: 0.33, volume: 1.0, intensity: 2 },
            { freq: 587.33, duration: 0.66, volume: 1.0, intensity: 2, bass: 'chord3' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

            // ============================================
            // DARK THEME C - Ominous Arpeggios (2:15-3:05)
            // ============================================
            // E minor arpeggios - dark and foreboding
            { freq: 329.63, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 392.00, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 493.88, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 493.88, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 392.00, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 329.63, duration: 0.5, volume: 1.0, intensity: 2, bass: 'chord3' },

            // B diminished arpeggio (darker)
            { freq: 246.94, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // B3
            { freq: 293.66, duration: 0.25, volume: 1.0, intensity: 2 },  // D4
            { freq: 349.23, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // F4
            { freq: 493.88, duration: 0.25, volume: 1.0, intensity: 2 },  // B4
            { freq: 349.23, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 293.66, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 246.94, duration: 0.5, volume: 1.0, intensity: 2, bass: 'chord3' },

            // A minor arpeggio
            { freq: 220.00, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // A3
            { freq: 261.63, duration: 0.25, volume: 1.0, intensity: 2 },  // C4
            { freq: 329.63, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // E4
            { freq: 440.00, duration: 0.25, volume: 1.0, intensity: 2 },  // A4
            { freq: 329.63, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 261.63, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 220.00, duration: 0.5, volume: 1.0, intensity: 2, bass: 'chord3' },

            // F# diminished arpeggio (very dark)
            { freq: 185.00, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // F#3
            { freq: 220.00, duration: 0.25, volume: 1.0, intensity: 2 },  // A3
            { freq: 261.63, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // C4
            { freq: 369.99, duration: 0.25, volume: 1.0, intensity: 2 },  // F#4
            { freq: 261.63, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
            { freq: 220.00, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 185.00, duration: 0.5, volume: 1.0, intensity: 2, bass: 'chord3' },

            // Rising chromatic tension
            { freq: 329.63, duration: 0.2, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 349.23, duration: 0.2, volume: 1.0, intensity: 2 },  // F4
            { freq: 392.00, duration: 0.2, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 415.30, duration: 0.2, volume: 1.0, intensity: 2 },  // Ab4
            { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 466.16, duration: 0.2, volume: 1.0, intensity: 2 },  // Bb4
            { freq: 493.88, duration: 0.2, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },  // C5
            { freq: 587.33, duration: 0.2, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 622.25, duration: 0.2, volume: 1.0, intensity: 2 },  // Eb5
            { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2, bass: 'chord2' },
            { freq: 698.46, duration: 0.2, volume: 1.0, intensity: 2 },  // F5
            { freq: 783.99, duration: 0.66, volume: 1.1, intensity: 2, bass: 'chord3' },  // G5
            { freq: 0, duration: 0.33, volume: 0, intensity: 0 },  // REST

            // ============================================
            // DARK BRIDGE D - Quiet Dread (3:05-3:50)
            // ============================================
            // Very soft, suspenseful - waiting for something
            { freq: 493.88, duration: 0.66, volume: 0.3, intensity: 0.2, bass: 'single' },
            { freq: 587.33, duration: 0.66, volume: 0.3, intensity: 0.2 },
            { freq: 659.25, duration: 0.66, volume: 0.3, intensity: 0.2, bass: 'single' },
            { freq: 587.33, duration: 0.66, volume: 0.3, intensity: 0.2 },

            { freq: 493.88, duration: 0.66, volume: 0.35, intensity: 0.3, bass: 'single' },
            { freq: 392.00, duration: 0.66, volume: 0.35, intensity: 0.3 },
            { freq: 440.00, duration: 0.66, volume: 0.35, intensity: 0.3, bass: 'single' },
            { freq: 493.88, duration: 1.33, volume: 0.35, intensity: 0.3 },

            // Slowly building dread
            { freq: 329.63, duration: 0.66, volume: 0.4, intensity: 0.5, bass: 'chord2' },
            { freq: 392.00, duration: 0.66, volume: 0.45, intensity: 0.6 },
            { freq: 493.88, duration: 0.66, volume: 0.5, intensity: 0.7, bass: 'chord2' },
            { freq: 659.25, duration: 0.66, volume: 0.55, intensity: 0.8 },

            { freq: 587.33, duration: 0.66, volume: 0.6, intensity: 0.9, bass: 'chord2' },
            { freq: 523.25, duration: 0.66, volume: 0.65, intensity: 1.0 },
            { freq: 493.88, duration: 0.66, volume: 0.7, intensity: 1.1, bass: 'chord2' },
            { freq: 440.00, duration: 0.66, volume: 0.75, intensity: 1.3 },
            { freq: 392.00, duration: 0.66, volume: 0.8, intensity: 1.5, bass: 'chord3' },
            { freq: 329.63, duration: 0.66, volume: 0.85, intensity: 1.7 },
            { freq: 293.66, duration: 0.66, volume: 0.9, intensity: 1.9, bass: 'chord3' },

            { freq: 0, duration: 0.66, volume: 0, intensity: 0 },  // REST - dramatic pause

            // ============================================
            // DARK THEME A RETURN - Full Power (3:50-4:40)
            // ============================================
            // Phrase 1 - Back to main theme (maximum darkness)
            { freq: 329.63, duration: 0.33, volume: 1.1, intensity: 2, bass: 'chord3' },
            { freq: 392.00, duration: 0.33, volume: 1.1, intensity: 2 },
            { freq: 440.00, duration: 0.33, volume: 1.1, intensity: 2, bass: 'chord3' },
            { freq: 493.88, duration: 0.33, volume: 1.1, intensity: 2 },
            { freq: 587.33, duration: 0.66, volume: 1.1, intensity: 2, bass: 'chord3' },
            { freq: 493.88, duration: 0.33, volume: 1.1, intensity: 2 },
            { freq: 440.00, duration: 0.33, volume: 1.1, intensity: 2, bass: 'chord3' },
            { freq: 392.00, duration: 0.66, volume: 1.1, intensity: 2 },

            // Phrase 2
            { freq: 329.63, duration: 0.33, volume: 1.15, intensity: 2, bass: 'arp' },
            { freq: 392.00, duration: 0.33, volume: 1.15, intensity: 2 },
            { freq: 440.00, duration: 0.33, volume: 1.15, intensity: 2, bass: 'arp' },
            { freq: 493.88, duration: 0.33, volume: 1.15, intensity: 2 },
            { freq: 587.33, duration: 0.66, volume: 1.2, intensity: 2, bass: 'chord3' },
            { freq: 493.88, duration: 0.33, volume: 1.15, intensity: 2 },
            { freq: 440.00, duration: 0.33, volume: 1.15, intensity: 2, bass: 'chord3' },
            { freq: 329.63, duration: 0.66, volume: 1.15, intensity: 2 },

            // Phrase 3 - High intensity
            { freq: 587.33, duration: 0.33, volume: 1.2, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.33, volume: 1.2, intensity: 2 },
            { freq: 783.99, duration: 0.33, volume: 1.2, intensity: 2, bass: 'chord3' },
            { freq: 880.00, duration: 0.33, volume: 1.2, intensity: 2 },  // A5
            { freq: 987.77, duration: 0.66, volume: 1.25, intensity: 2, bass: 'chord3' },  // B5
            { freq: 880.00, duration: 0.33, volume: 1.2, intensity: 2 },
            { freq: 783.99, duration: 0.33, volume: 1.2, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.66, volume: 1.2, intensity: 2 },

            // Phrase 4 - Building to finale
            { freq: 587.33, duration: 0.33, volume: 1.25, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.33, volume: 1.25, intensity: 2 },
            { freq: 587.33, duration: 0.33, volume: 1.25, intensity: 2, bass: 'chord3' },
            { freq: 493.88, duration: 0.33, volume: 1.25, intensity: 2 },
            { freq: 440.00, duration: 0.66, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 392.00, duration: 0.66, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 440.00, duration: 0.66, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 493.88, duration: 0.66, volume: 1.3, intensity: 2, bass: 'chord3' },

            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

            // ============================================
            // DARK FINALE - Epic Doom (4:40-5:15)
            // ============================================
            // Massive dark chords
            { freq: 329.63, duration: 0.25, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 392.00, duration: 0.25, volume: 1.3, intensity: 2 },
            { freq: 493.88, duration: 0.25, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.5, volume: 1.3, intensity: 2, bass: 'arp' },
            { freq: 493.88, duration: 0.25, volume: 1.3, intensity: 2 },
            { freq: 392.00, duration: 0.25, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 329.63, duration: 0.5, volume: 1.3, intensity: 2, bass: 'chord3' },

            { freq: 392.00, duration: 0.25, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 493.88, duration: 0.25, volume: 1.3, intensity: 2 },
            { freq: 587.33, duration: 0.25, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 783.99, duration: 0.5, volume: 1.3, intensity: 2, bass: 'arp' },  // G5
            { freq: 587.33, duration: 0.25, volume: 1.3, intensity: 2 },
            { freq: 493.88, duration: 0.25, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 392.00, duration: 0.5, volume: 1.3, intensity: 2, bass: 'chord3' },

            // Rising to dark climax
            { freq: 659.25, duration: 0.33, volume: 1.4, intensity: 2, bass: 'chord3' },
            { freq: 739.99, duration: 0.33, volume: 1.4, intensity: 2 },  // F#5
            { freq: 783.99, duration: 0.33, volume: 1.4, intensity: 2, bass: 'chord3' },  // G5
            { freq: 880.00, duration: 0.33, volume: 1.4, intensity: 2 },  // A5
            { freq: 987.77, duration: 0.66, volume: 1.5, intensity: 2, bass: 'chord3' },  // B5 - peak!
            { freq: 880.00, duration: 0.33, volume: 1.4, intensity: 2 },
            { freq: 783.99, duration: 0.33, volume: 1.4, intensity: 2, bass: 'chord3' },
            { freq: 659.25, duration: 0.66, volume: 1.4, intensity: 2, bass: 'chord3' },

            // Final descent into darkness
            { freq: 587.33, duration: 0.66, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 493.88, duration: 0.66, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 440.00, duration: 0.66, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 392.00, duration: 0.66, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 329.63, duration: 1.0, volume: 1.3, intensity: 2, bass: 'chord3' },
            { freq: 293.66, duration: 1.0, volume: 1.3, intensity: 2, bass: 'chord3' },  // D4
            { freq: 329.63, duration: 1.5, volume: 1.4, intensity: 2, bass: 'chord3' },  // E4 - resolution
            { freq: 261.63, duration: 2.5, volume: 1.5, intensity: 2, bass: 'chord3' },  // C4 - dark final sustain!

            // Silence before loop
            { freq: 0, duration: 1.33, volume: 0, intensity: 0 }
        ];

        let noteIndex = 0;
        const bpm = 100; // Slower tempo for darker feel (was 120)
        const beatDuration = 60 / bpm;

        // Play the melody in a loop
        const playMelodyNote = () => {
            if (!this.musicPlaying || !this.audioContext) {return;}

            const note = melody[noteIndex];

            // Handle REST (freq 0)
            if (note.freq === 0) {
                noteIndex = (noteIndex + 1) % melody.length;
                return;
            }

            // Get dynamic volume for this note
            const noteVolume = this.musicVolume * (note.volume || 1.0);

            // Create oscillator for melody (square wave for classic 8-bit sound)
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);

            // Volume envelope
            const noteTime = note.duration * beatDuration;
            gainNode.gain.setValueAtTime(noteVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + noteTime * 0.9);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + noteTime);

            // Add bass based on intensity and bass type
            const intensity = note.intensity !== undefined ? note.intensity : 1;
            const bassType = note.bass || 'single';

            if (intensity > 0 && noteIndex % 2 === 0) {
                const bassVolume = noteVolume * 0.25 * intensity;
                const rootFreq = note.freq / 2;

                // Frequency ratios for chord tones
                const major3rd = rootFreq * 1.26;
                const minor3rd = rootFreq * 1.189;
                const perfect5th = rootFreq * 1.498;

                // Dark theme: Always use minor 3rd for darker sound
                const thirdFreq = minor3rd;

                const createBassOsc = (freq, startTime, duration, type = 'sawtooth') => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();

                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);

                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, startTime);

                    gain.gain.setValueAtTime(bassVolume, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.8);

                    osc.start(startTime);
                    osc.stop(startTime + duration);
                };

                switch (bassType) {
                case 'chord2':
                    createBassOsc(rootFreq, this.audioContext.currentTime, noteTime);
                    createBassOsc(perfect5th, this.audioContext.currentTime, noteTime);
                    break;
                case 'chord3':
                    createBassOsc(rootFreq, this.audioContext.currentTime, noteTime);
                    createBassOsc(thirdFreq, this.audioContext.currentTime, noteTime);
                    createBassOsc(perfect5th, this.audioContext.currentTime, noteTime);
                    break;
                case 'arp': {
                    const arpDuration = noteTime / 3;
                    createBassOsc(rootFreq, this.audioContext.currentTime, arpDuration);
                    createBassOsc(thirdFreq, this.audioContext.currentTime + arpDuration, arpDuration);
                    createBassOsc(perfect5th, this.audioContext.currentTime + arpDuration * 2, arpDuration);
                    break;
                }
                case 'single':
                default:
                    createBassOsc(rootFreq, this.audioContext.currentTime, noteTime);
                    break;
                }
            }

            noteIndex = (noteIndex + 1) % melody.length;
        };

        playMelodyNote();

        let lastNoteDuration = melody[0].duration * beatDuration * 1000;
        const scheduleNextNote = () => {
            if (!this.musicPlaying) {return;}

            playMelodyNote();
            const currentNoteDuration = melody[noteIndex === 0 ? melody.length - 1 : noteIndex - 1].duration * beatDuration * 1000;
            this.musicInterval = setTimeout(scheduleNextNote, currentNoteDuration);
        };

        this.musicInterval = setTimeout(scheduleNextNote, lastNoteDuration);
    }

    /**
     * Start rhythmic background music theme - D major version
     * Groovy, relaxed, steady beat - NOT hectic!
     */
    startRhythmicTheme() {
        // Stop any existing music first (handles hot-reload scenarios)
        this.stopBackgroundMusic();

        if (!this.initialized) {
            this.initialize();
        }

        this.musicPlaying = true;

        // GROOVY RHYTHMIC THEME - D Major, relaxed, steady groove
        // Key: D major (D4 = 293.66 Hz as root)
        // Tempo: 100 BPM - relaxed, not hectic
        // Focus: Steady groove, catchy patterns, space to breathe

        const melody = [
            // ============================================
            // GROOVE INTRO (0:00-0:25) - Establish the beat
            // ============================================
            // Simple 4-bar intro with bass hits
            { freq: 587.33, duration: 0.5, volume: 0.6, intensity: 1, bass: 'chord2' },  // D5 - long
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST
            { freq: 587.33, duration: 0.5, volume: 0.6, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

            { freq: 659.25, duration: 0.5, volume: 0.65, intensity: 1, bass: 'chord2' },  // E5
            { freq: 587.33, duration: 0.25, volume: 0.6, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },  // REST
            { freq: 739.99, duration: 0.5, volume: 0.65, intensity: 1, bass: 'chord2' },  // F#5
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

            // ============================================
            // MAIN GROOVE A (0:25-1:10) - The catchy pattern
            // ============================================
            // 4-bar repeating pattern
            { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 1, bass: 'chord2' },  // D5
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },  // REST
            { freq: 659.25, duration: 0.25, volume: 0.7, intensity: 1, bass: 'single' },  // E5
            { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 1, bass: 'chord2' },

            { freq: 739.99, duration: 0.5, volume: 0.75, intensity: 1, bass: 'chord2' },  // F#5
            { freq: 659.25, duration: 0.25, volume: 0.7, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },  // REST

            // Bar 2 - variation
            { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 880.00, duration: 0.25, volume: 0.75, intensity: 1, bass: 'chord2' },  // A5
            { freq: 739.99, duration: 0.25, volume: 0.7, intensity: 1, bass: 'single' },

            { freq: 659.25, duration: 0.5, volume: 0.7, intensity: 1, bass: 'chord2' },
            { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 3
            { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 659.25, duration: 0.25, volume: 0.7, intensity: 1, bass: 'single' },
            { freq: 739.99, duration: 0.25, volume: 0.7, intensity: 1, bass: 'chord2' },

            { freq: 880.00, duration: 0.5, volume: 0.75, intensity: 1, bass: 'chord2' },
            { freq: 739.99, duration: 0.25, volume: 0.7, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 4 - resolution
            { freq: 659.25, duration: 0.25, volume: 0.7, intensity: 1, bass: 'chord2' },
            { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 1, bass: 'chord2' },

            { freq: 587.33, duration: 0.5, volume: 0.7, intensity: 1, bass: 'chord3' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

            // ============================================
            // BRIDGE B (1:10-1:55) - Slight variation
            // ============================================
            // Same groove, different notes
            { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 1, bass: 'chord2' },  // F#5
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 880.00, duration: 0.25, volume: 0.75, intensity: 1, bass: 'single' },  // A5
            { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 1, bass: 'chord2' },

            { freq: 987.77, duration: 0.5, volume: 0.8, intensity: 1, bass: 'chord2' },  // B5
            { freq: 880.00, duration: 0.25, volume: 0.75, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 2
            { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 1174.66, duration: 0.25, volume: 0.8, intensity: 1, bass: 'chord2' },  // D6
            { freq: 987.77, duration: 0.25, volume: 0.75, intensity: 1, bass: 'single' },

            { freq: 880.00, duration: 0.5, volume: 0.75, intensity: 1, bass: 'chord2' },
            { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 3
            { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 880.00, duration: 0.25, volume: 0.75, intensity: 1, bass: 'single' },
            { freq: 987.77, duration: 0.25, volume: 0.8, intensity: 1, bass: 'chord2' },

            { freq: 1174.66, duration: 0.5, volume: 0.85, intensity: 1, bass: 'chord2' },
            { freq: 987.77, duration: 0.25, volume: 0.8, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 4 - back to root
            { freq: 880.00, duration: 0.25, volume: 0.75, intensity: 1, bass: 'chord2' },
            { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 659.25, duration: 0.25, volume: 0.75, intensity: 1, bass: 'chord2' },

            { freq: 587.33, duration: 0.5, volume: 0.75, intensity: 1, bass: 'chord3' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

            // ============================================
            // GROOVE C (1:55-2:40) - Main groove returns
            // ============================================
            // Back to the catchy pattern
            { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 659.25, duration: 0.25, volume: 0.8, intensity: 1, bass: 'single' },
            { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 1, bass: 'chord2' },

            { freq: 739.99, duration: 0.5, volume: 0.85, intensity: 1, bass: 'chord2' },
            { freq: 659.25, duration: 0.25, volume: 0.8, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 2
            { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 880.00, duration: 0.25, volume: 0.85, intensity: 1, bass: 'chord2' },
            { freq: 739.99, duration: 0.25, volume: 0.8, intensity: 1, bass: 'single' },

            { freq: 659.25, duration: 0.5, volume: 0.8, intensity: 1, bass: 'chord2' },
            { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 3
            { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 659.25, duration: 0.25, volume: 0.8, intensity: 1, bass: 'single' },
            { freq: 739.99, duration: 0.25, volume: 0.8, intensity: 1, bass: 'chord2' },

            { freq: 880.00, duration: 0.5, volume: 0.85, intensity: 1, bass: 'chord2' },
            { freq: 739.99, duration: 0.25, volume: 0.8, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 4
            { freq: 659.25, duration: 0.25, volume: 0.8, intensity: 1, bass: 'chord2' },
            { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 739.99, duration: 0.25, volume: 0.85, intensity: 1, bass: 'chord2' },

            { freq: 587.33, duration: 0.5, volume: 0.8, intensity: 1, bass: 'chord3' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

            // ============================================
            // BREAKDOWN D (2:40-3:25) - Minimal groove
            // ============================================
            // Strip back to essentials
            { freq: 587.33, duration: 0.5, volume: 0.5, intensity: 0.5, bass: 'single' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },
            { freq: 587.33, duration: 0.5, volume: 0.5, intensity: 0.5, bass: 'single' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },

            { freq: 659.25, duration: 0.5, volume: 0.55, intensity: 0.7, bass: 'single' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },
            { freq: 739.99, duration: 0.5, volume: 0.55, intensity: 0.7, bass: 'single' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },

            // Building back
            { freq: 587.33, duration: 0.25, volume: 0.6, intensity: 0.8, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 659.25, duration: 0.25, volume: 0.6, intensity: 0.8, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            { freq: 739.99, duration: 0.25, volume: 0.65, intensity: 0.9, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 880.00, duration: 0.25, volume: 0.7, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            { freq: 739.99, duration: 0.5, volume: 0.75, intensity: 1, bass: 'chord2' },
            { freq: 659.25, duration: 0.25, volume: 0.7, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // ============================================
            // GROOVE A RETURN (3:25-4:10) - Full energy
            // ============================================
            { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 659.25, duration: 0.25, volume: 0.85, intensity: 1, bass: 'single' },
            { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 1, bass: 'chord2' },

            { freq: 739.99, duration: 0.5, volume: 0.9, intensity: 1, bass: 'chord2' },
            { freq: 659.25, duration: 0.25, volume: 0.85, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 2
            { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 880.00, duration: 0.25, volume: 0.9, intensity: 1, bass: 'chord2' },
            { freq: 739.99, duration: 0.25, volume: 0.85, intensity: 1, bass: 'single' },

            { freq: 659.25, duration: 0.5, volume: 0.85, intensity: 1, bass: 'chord2' },
            { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 3
            { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 659.25, duration: 0.25, volume: 0.85, intensity: 1, bass: 'single' },
            { freq: 739.99, duration: 0.25, volume: 0.85, intensity: 1, bass: 'chord2' },

            { freq: 880.00, duration: 0.5, volume: 0.9, intensity: 1, bass: 'chord2' },
            { freq: 739.99, duration: 0.25, volume: 0.85, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

            // Bar 4
            { freq: 659.25, duration: 0.25, volume: 0.85, intensity: 1, bass: 'chord2' },
            { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 1, bass: 'single' },
            { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
            { freq: 739.99, duration: 0.25, volume: 0.9, intensity: 1, bass: 'chord2' },

            { freq: 587.33, duration: 0.5, volume: 0.85, intensity: 1, bass: 'chord3' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

            // ============================================
            // OUTRO (4:10-4:30) - Wind down
            // ============================================
            { freq: 587.33, duration: 0.5, volume: 0.7, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },
            { freq: 659.25, duration: 0.5, volume: 0.7, intensity: 1, bass: 'chord2' },
            { freq: 0, duration: 0.5, volume: 0, intensity: 0 },

            { freq: 739.99, duration: 1.0, volume: 0.75, intensity: 1, bass: 'chord3' },
            { freq: 587.33, duration: 1.0, volume: 0.8, intensity: 1, bass: 'chord3' },

            // Brief silence before loop
            { freq: 0, duration: 1.0, volume: 0, intensity: 0 }
        ];

        let noteIndex = 0;
        const bpm = 100; // Relaxed tempo - NOT 130!
        const beatDuration = 60 / bpm;

        // Play the melody in a loop
        const playMelodyNote = () => {
            if (!this.musicPlaying || !this.audioContext) {return;}

            const note = melody[noteIndex];

            // Handle REST (freq 0)
            if (note.freq === 0) {
                noteIndex = (noteIndex + 1) % melody.length;
                return;
            }

            // Get dynamic volume for this note
            const noteVolume = this.musicVolume * (note.volume || 1.0);

            // Create oscillator for melody (square wave for classic 8-bit sound)
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);

            // Volume envelope - smooth, not punchy
            const noteTime = note.duration * beatDuration;
            gainNode.gain.setValueAtTime(noteVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + noteTime * 0.8);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + noteTime);

            // Add bass based on intensity and bass type
            const intensity = note.intensity !== undefined ? note.intensity : 1;
            const bassType = note.bass || 'single';

            if (intensity > 0 && noteIndex % 2 === 0) {
                const bassVolume = noteVolume * 0.25 * intensity;
                const rootFreq = note.freq / 2;

                // Frequency ratios for chord tones
                const major3rd = rootFreq * 1.26;
                const perfect5th = rootFreq * 1.498;

                const createBassOsc = (freq, startTime, duration, type = 'sawtooth') => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();

                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);

                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, startTime);

                    // Smooth envelope for relaxed feel
                    gain.gain.setValueAtTime(bassVolume, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.75);

                    osc.start(startTime);
                    osc.stop(startTime + duration);
                };

                switch (bassType) {
                case 'chord2':
                    createBassOsc(rootFreq, this.audioContext.currentTime, noteTime);
                    createBassOsc(perfect5th, this.audioContext.currentTime, noteTime);
                    break;
                case 'chord3':
                    createBassOsc(rootFreq, this.audioContext.currentTime, noteTime);
                    createBassOsc(major3rd, this.audioContext.currentTime, noteTime);
                    createBassOsc(perfect5th, this.audioContext.currentTime, noteTime);
                    break;
                case 'single':
                default:
                    createBassOsc(rootFreq, this.audioContext.currentTime, noteTime);
                    break;
                }
            }

            noteIndex = (noteIndex + 1) % melody.length;
        };

        playMelodyNote();

        let lastNoteDuration = melody[0].duration * beatDuration * 1000;
        const scheduleNextNote = () => {
            if (!this.musicPlaying) {return;}

            playMelodyNote();
            const currentNoteDuration = melody[noteIndex === 0 ? melody.length - 1 : noteIndex - 1].duration * beatDuration * 1000;
            this.musicInterval = setTimeout(scheduleNextNote, currentNoteDuration);
        };

        this.musicInterval = setTimeout(scheduleNextNote, lastNoteDuration);
    }
}
