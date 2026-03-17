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
        if (this.musicPlaying || !this.enabled) {return;}

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
            // Phrase 1 - Opening motif (loud, full bass)
            { freq: 523.25, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 587.33, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 698.46, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.5, volume: 1.0, intensity: 2 },
            { freq: 698.46, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 587.33, duration: 0.5, volume: 1.0, intensity: 2 },
            
            // Phrase 2 - Rising
            { freq: 523.25, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 587.33, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.5, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.5, volume: 1.0, intensity: 2 },
            
            // Phrase 3 - Climbing
            { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 698.46, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 987.77, duration: 0.5, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.25, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2 },
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
            // Fast arpeggios - C major
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 1046.50, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.4, volume: 1.0, intensity: 2 },
            
            // G major arpeggio
            { freq: 392.00, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 493.88, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 587.33, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 587.33, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 493.88, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 392.00, duration: 0.4, volume: 1.0, intensity: 2 },
            
            // A minor arpeggio
            { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 440.00, duration: 0.4, volume: 1.0, intensity: 2 },
            
            // F major arpeggio
            { freq: 349.23, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 698.46, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2 },
            { freq: 349.23, duration: 0.4, volume: 1.0, intensity: 2 },
            
            // Triplets - rising
            { freq: 523.25, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 587.33, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 698.46, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 987.77, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 1046.50, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 987.77, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 880.00, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 783.99, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 698.46, duration: 0.167, volume: 1.0, intensity: 2 },
            { freq: 659.25, duration: 0.5, volume: 1.0, intensity: 2 },
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
            // Big chords (arpeggiated)
            { freq: 523.25, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 659.25, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 1046.50, duration: 0.4, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 659.25, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 523.25, duration: 0.4, volume: 1.3, intensity: 2 },
            
            { freq: 659.25, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 987.77, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 1318.51, duration: 0.4, volume: 1.3, intensity: 2 },  // E6
            { freq: 987.77, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2 },
            { freq: 659.25, duration: 0.4, volume: 1.3, intensity: 2 },
            
            // Rising to climax
            { freq: 1046.50, duration: 0.25, volume: 1.4, intensity: 2 },
            { freq: 1174.66, duration: 0.25, volume: 1.4, intensity: 2 },
            { freq: 1318.51, duration: 0.25, volume: 1.4, intensity: 2 },
            { freq: 1396.91, duration: 0.25, volume: 1.4, intensity: 2 },  // F6
            { freq: 1567.98, duration: 0.5, volume: 1.5, intensity: 2 },  // G6 - peak!
            { freq: 1396.91, duration: 0.25, volume: 1.4, intensity: 2 },
            { freq: 1318.51, duration: 0.25, volume: 1.4, intensity: 2 },
            { freq: 1046.50, duration: 0.5, volume: 1.4, intensity: 2 },
            
            // Final sustained notes - epic ending
            { freq: 783.99, duration: 0.5, volume: 1.3, intensity: 2 },
            { freq: 880.00, duration: 0.5, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 0.5, volume: 1.3, intensity: 2 },
            { freq: 659.25, duration: 0.5, volume: 1.3, intensity: 2 },
            { freq: 523.25, duration: 0.75, volume: 1.3, intensity: 2 },
            { freq: 659.25, duration: 0.75, volume: 1.3, intensity: 2 },
            { freq: 783.99, duration: 1.0, volume: 1.3, intensity: 2 },
            { freq: 1046.50, duration: 2.0, volume: 1.5, intensity: 2 },  // C6 - epic final sustain!
            
            // Brief silence before loop
            { freq: 0, duration: 1.0, volume: 0, intensity: 0 },
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

            // Add bass note based on intensity (0 = no bass, 1 = light, 2 = full)
            const intensity = note.intensity !== undefined ? note.intensity : 1;
            if (intensity > 0 && noteIndex % 2 === 0) {
                const bassOsc = this.audioContext.createOscillator();
                const bassGain = this.audioContext.createGain();
                
                bassOsc.connect(bassGain);
                bassGain.connect(this.audioContext.destination);
                
                bassOsc.type = 'sawtooth'; // Bass uses sawtooth for more depth
                bassOsc.frequency.setValueAtTime(note.freq / 2, this.audioContext.currentTime); // One octave down
                
                // Bass volume scales with intensity (0.3 for light, 0.6 for full)
                const bassVolume = noteVolume * 0.3 * intensity;
                bassGain.gain.setValueAtTime(bassVolume, this.audioContext.currentTime);
                bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + noteTime * 0.8);
                
                bassOsc.start(this.audioContext.currentTime);
                bassOsc.stop(this.audioContext.currentTime + noteTime);
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
    }
}
