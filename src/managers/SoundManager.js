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

        // Retro chiptune melody - catchy arcade style
        // Note frequencies (Hz) - simple pentatonic scale for happy retro feel
        const melody = [
            // Phrase 1 - upbeat opening
            { freq: 523.25, duration: 0.15 },  // C5
            { freq: 587.33, duration: 0.15 },  // D5
            { freq: 659.25, duration: 0.15 },  // E5
            { freq: 698.46, duration: 0.15 },  // F5
            { freq: 783.99, duration: 0.3 },   // G5
            { freq: 698.46, duration: 0.15 },  // F5
            { freq: 659.25, duration: 0.15 },  // E5
            { freq: 587.33, duration: 0.3 },   // D5
            
            // Phrase 2 - call and response
            { freq: 523.25, duration: 0.15 },  // C5
            { freq: 587.33, duration: 0.15 },  // D5
            { freq: 659.25, duration: 0.15 },  // E5
            { freq: 783.99, duration: 0.15 },  // G5
            { freq: 880.00, duration: 0.3 },   // A5
            { freq: 783.99, duration: 0.15 },  // G5
            { freq: 659.25, duration: 0.15 },  // E5
            { freq: 523.25, duration: 0.3 },   // C5
            
            // Phrase 3 - climbing up
            { freq: 659.25, duration: 0.15 },  // E5
            { freq: 698.46, duration: 0.15 },  // F5
            { freq: 783.99, duration: 0.15 },  // G5
            { freq: 880.00, duration: 0.15 },  // A5
            { freq: 987.77, duration: 0.3 },   // B5
            { freq: 880.00, duration: 0.15 },  // A5
            { freq: 783.99, duration: 0.15 },  // G5
            { freq: 659.25, duration: 0.3 },   // E5
            
            // Phrase 4 - resolution
            { freq: 523.25, duration: 0.2 },   // C5
            { freq: 659.25, duration: 0.2 },   // E5
            { freq: 783.99, duration: 0.2 },   // G5
            { freq: 523.25, duration: 0.2 },   // C5
            { freq: 659.25, duration: 0.2 },   // E5
            { freq: 783.99, duration: 0.2 },   // G5
            { freq: 1046.50, duration: 0.4 },  // C6 - high note finale
        ];

        let noteIndex = 0;
        const bpm = 180; // Beats per minute - fast and energetic
        const beatDuration = 60 / bpm; // Duration of one beat in seconds

        // Play the melody in a loop
        const playMelodyNote = () => {
            if (!this.musicPlaying || !this.audioContext) {return;}

            const note = melody[noteIndex];
            
            // Create oscillator for melody (square wave for classic 8-bit sound)
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'square'; // Classic 8-bit sound
            oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);

            // Volume envelope - quick attack, sustain, quick release
            const noteTime = note.duration * beatDuration;
            gainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + noteTime * 0.9);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + noteTime);

            // Add bass note (one octave lower, every other note for driving rhythm)
            if (noteIndex % 2 === 0) {
                const bassOsc = this.audioContext.createOscillator();
                const bassGain = this.audioContext.createGain();
                
                bassOsc.connect(bassGain);
                bassGain.connect(this.audioContext.destination);
                
                bassOsc.type = 'sawtooth'; // Bass uses sawtooth for more depth
                bassOsc.frequency.setValueAtTime(note.freq / 2, this.audioContext.currentTime); // One octave down
                
                bassGain.gain.setValueAtTime(this.musicVolume * 0.5, this.audioContext.currentTime);
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
