/**
 * Music / Melody Definitions
 *
 * Each theme contains a melody note array and playback configuration.
 * Imported by SoundManager – no inline melody data in the manager.
 *
 * Note object shape:
 *   { freq, duration, volume, intensity, bass? }
 *   - freq: frequency in Hz (0 = REST)
 *   - duration: relative duration in beats
 *   - volume: dynamic multiplier (0.0-1.5)
 *   - intensity: bass level (0-2)
 *   - bass: 'single' | 'chord2' | 'chord3' | 'arp' (optional)
 */

export const backgroundMusic = {
    bpm: 120,
    waveform: 'square',
    bassWaveform: 'sawtooth',
    envelopeRelease: 0.9,
    useMinorThird: false,
    melody: [
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
        { freq: 523.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 587.33, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 698.46, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 783.99, duration: 0.5, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 698.46, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 587.33, duration: 0.5, volume: 1.0, intensity: 2 },

        // Phrase 2 - Rising (with arpeggiated bass)
        { freq: 523.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 587.33, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 880.00, duration: 0.5, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 523.25, duration: 0.5, volume: 1.0, intensity: 2 },

        // Phrase 3 - Climbing (power chords)
        { freq: 659.25, duration: 0.25, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 698.46, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 880.00, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 987.77, duration: 0.5, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 880.00, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 783.99, duration: 0.25, volume: 1.0, intensity: 2, bass: 'single' },
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
        { freq: 523.25, duration: 0.4, volume: 1.0, intensity: 2, bass: 'single' },

        // G major arpeggio
        { freq: 392.00, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 493.88, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 587.33, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 783.99, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 587.33, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 493.88, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 392.00, duration: 0.4, volume: 1.0, intensity: 2, bass: 'single' },

        // A minor arpeggio
        { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 880.00, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 440.00, duration: 0.4, volume: 1.0, intensity: 2, bass: 'single' },

        // F major arpeggio
        { freq: 349.23, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 698.46, duration: 0.2, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2 },
        { freq: 349.23, duration: 0.4, volume: 1.0, intensity: 2, bass: 'single' },

        // Triplets - rising (power chords)
        { freq: 523.25, duration: 0.167, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 587.33, duration: 0.167, volume: 1.0, intensity: 2 },
        { freq: 659.25, duration: 0.167, volume: 1.0, intensity: 2 },
        { freq: 698.46, duration: 0.167, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 783.99, duration: 0.167, volume: 1.0, intensity: 2 },
        { freq: 880.00, duration: 0.167, volume: 1.0, intensity: 2 },
        { freq: 987.77, duration: 0.167, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 1046.50, duration: 0.167, volume: 1.0, intensity: 2 },
        { freq: 987.77, duration: 0.167, volume: 1.0, intensity: 2 },
        { freq: 880.00, duration: 0.167, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 783.99, duration: 0.167, volume: 1.0, intensity: 2 },
        { freq: 698.46, duration: 0.167, volume: 1.0, intensity: 2 },
        { freq: 659.25, duration: 0.5, volume: 1.0, intensity: 2, bass: 'single' },
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
        { freq: 523.25, duration: 0.2, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.2, volume: 1.3, intensity: 2 },
        { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 1046.50, duration: 0.4, volume: 1.3, intensity: 2, bass: 'arp' },
        { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2 },
        { freq: 659.25, duration: 0.2, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 523.25, duration: 0.4, volume: 1.3, intensity: 2, bass: 'single' },

        { freq: 659.25, duration: 0.2, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2 },
        { freq: 987.77, duration: 0.2, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 1318.51, duration: 0.4, volume: 1.3, intensity: 2, bass: 'arp' },  // E6
        { freq: 987.77, duration: 0.2, volume: 1.3, intensity: 2 },
        { freq: 783.99, duration: 0.2, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.4, volume: 1.3, intensity: 2, bass: 'single' },

        // Rising to climax (full power chords)
        { freq: 1046.50, duration: 0.25, volume: 1.4, intensity: 2, bass: 'single' },
        { freq: 1174.66, duration: 0.25, volume: 1.4, intensity: 2 },
        { freq: 1318.51, duration: 0.25, volume: 1.4, intensity: 2, bass: 'single' },
        { freq: 1396.91, duration: 0.25, volume: 1.4, intensity: 2 },  // F6
        { freq: 1567.98, duration: 0.5, volume: 1.5, intensity: 2, bass: 'single' },  // G6 - peak!
        { freq: 1396.91, duration: 0.25, volume: 1.4, intensity: 2 },
        { freq: 1318.51, duration: 0.25, volume: 1.4, intensity: 2, bass: 'single' },
        { freq: 1046.50, duration: 0.5, volume: 1.4, intensity: 2, bass: 'single' },

        // Final sustained notes - epic ending with full chords
        { freq: 783.99, duration: 0.5, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 880.00, duration: 0.5, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 783.99, duration: 0.5, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.5, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 523.25, duration: 0.75, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.75, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 783.99, duration: 1.0, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 1046.50, duration: 2.0, volume: 1.5, intensity: 2, bass: 'single' },  // C6 - epic final sustain!
        { freq: 659.25, duration: 0.75, volume: 1.3, intensity: 2 },
        { freq: 783.99, duration: 1.0, volume: 1.3, intensity: 2 },
        { freq: 1046.50, duration: 2.0, volume: 1.5, intensity: 2 },  // C6 - epic final sustain!

        // Brief silence before loop
        { freq: 0, duration: 1.0, volume: 0, intensity: 0 }
    ]
};

export const darkTheme = {
    bpm: 100,
    waveform: 'square',
    bassWaveform: 'sawtooth',
    envelopeRelease: 0.9,
    useMinorThird: true,
    melody: [
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
        { freq: 329.63, duration: 0.33, volume: 0.45, intensity: 0.6, bass: 'single' },
        { freq: 466.16, duration: 0.33, volume: 0.45, intensity: 0.6 },  // Bb4 - tritone (diminished)
        { freq: 493.88, duration: 0.33, volume: 0.45, intensity: 0.6 },
        { freq: 659.25, duration: 0.33, volume: 0.45, intensity: 0.6, bass: 'single' },
        { freq: 466.16, duration: 0.33, volume: 0.45, intensity: 0.6 },  // Tritone again
        { freq: 493.88, duration: 0.33, volume: 0.45, intensity: 0.6 },
        { freq: 329.63, duration: 0.75, volume: 0.5, intensity: 0.8, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST - ominous silence

        // ============================================
        // DARK THEME A - Main Theme in Minor (0:25-1:20)
        // ============================================
        // Phrase 1 - Ominous motif (minor key, heavy bass)
        { freq: 329.63, duration: 0.33, volume: 0.8, intensity: 2, bass: 'single' },
        { freq: 392.00, duration: 0.33, volume: 0.8, intensity: 2 },
        { freq: 440.00, duration: 0.33, volume: 0.8, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.33, volume: 0.8, intensity: 2 },
        { freq: 587.33, duration: 0.66, volume: 0.8, intensity: 2, bass: 'single' },  // Minor 7th
        { freq: 493.88, duration: 0.33, volume: 0.8, intensity: 2 },
        { freq: 440.00, duration: 0.33, volume: 0.8, intensity: 2, bass: 'single' },
        { freq: 392.00, duration: 0.66, volume: 0.8, intensity: 2 },

        // Phrase 2 - Descending into darkness
        { freq: 329.63, duration: 0.33, volume: 0.85, intensity: 2, bass: 'arp' },
        { freq: 392.00, duration: 0.33, volume: 0.85, intensity: 2 },
        { freq: 440.00, duration: 0.33, volume: 0.85, intensity: 2, bass: 'arp' },
        { freq: 493.88, duration: 0.33, volume: 0.85, intensity: 2 },
        { freq: 587.33, duration: 0.66, volume: 0.9, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.33, volume: 0.85, intensity: 2 },
        { freq: 440.00, duration: 0.33, volume: 0.85, intensity: 2, bass: 'single' },
        { freq: 329.63, duration: 0.66, volume: 0.85, intensity: 2 },

        // Phrase 3 - Climbing tension
        { freq: 440.00, duration: 0.33, volume: 0.9, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.33, volume: 0.9, intensity: 2 },
        { freq: 587.33, duration: 0.33, volume: 0.9, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.33, volume: 0.9, intensity: 2 },
        { freq: 783.99, duration: 0.66, volume: 0.95, intensity: 2, bass: 'single' },  // G5
        { freq: 659.25, duration: 0.33, volume: 0.9, intensity: 2 },
        { freq: 587.33, duration: 0.33, volume: 0.9, intensity: 2, bass: 'single' },
        { freq: 440.00, duration: 0.66, volume: 0.9, intensity: 2 },

        // Phrase 4 - Dark resolution
        { freq: 329.63, duration: 0.5, volume: 0.9, intensity: 2, bass: 'single' },
        { freq: 440.00, duration: 0.5, volume: 0.9, intensity: 2 },
        { freq: 493.88, duration: 0.5, volume: 0.9, intensity: 2, bass: 'single' },
        { freq: 329.63, duration: 0.5, volume: 0.9, intensity: 2 },
        { freq: 440.00, duration: 0.5, volume: 0.9, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.5, volume: 0.9, intensity: 2 },
        { freq: 659.25, duration: 1.5, volume: 1.0, intensity: 2, bass: 'single' },  // E5 - sustained

        // Theme A variation - darker
        { freq: 587.33, duration: 0.33, volume: 0.8, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.33, volume: 0.8, intensity: 2 },
        { freq: 783.99, duration: 0.33, volume: 0.8, intensity: 2, bass: 'single' },
        { freq: 880.00, duration: 0.33, volume: 0.8, intensity: 2 },  // A5
        { freq: 783.99, duration: 0.66, volume: 0.8, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.33, volume: 0.8, intensity: 2 },
        { freq: 587.33, duration: 0.33, volume: 0.8, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.66, volume: 0.8, intensity: 2 },

        { freq: 440.00, duration: 0.33, volume: 0.8, intensity: 2, bass: 'arp' },
        { freq: 493.88, duration: 0.33, volume: 0.8, intensity: 2 },
        { freq: 587.33, duration: 0.33, volume: 0.8, intensity: 2, bass: 'arp' },
        { freq: 659.25, duration: 0.33, volume: 0.8, intensity: 2 },
        { freq: 783.99, duration: 0.66, volume: 0.85, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.33, volume: 0.8, intensity: 2 },
        { freq: 587.33, duration: 0.33, volume: 0.8, intensity: 2, bass: 'single' },
        { freq: 440.00, duration: 0.66, volume: 0.8, intensity: 2 },

        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

        // ============================================
        // DARK BRIDGE B - Even Darker (1:20-2:15)
        // ============================================
        // Descending into the abyss - very low register
        { freq: 293.66, duration: 0.33, volume: 0.6, intensity: 1.2, bass: 'single' },  // D4
        { freq: 329.63, duration: 0.33, volume: 0.6, intensity: 1.2 },
        { freq: 392.00, duration: 0.33, volume: 0.6, intensity: 1.2, bass: 'single' },
        { freq: 440.00, duration: 0.33, volume: 0.6, intensity: 1.2 },
        { freq: 493.88, duration: 0.66, volume: 0.65, intensity: 1.5, bass: 'single' },
        { freq: 440.00, duration: 0.33, volume: 0.6, intensity: 1.2 },
        { freq: 392.00, duration: 0.33, volume: 0.6, intensity: 1.2, bass: 'single' },
        { freq: 329.63, duration: 0.66, volume: 0.6, intensity: 1.2 },

        // Phrase 2 - Deep descent
        { freq: 293.66, duration: 0.33, volume: 0.65, intensity: 1.5, bass: 'single' },
        { freq: 261.63, duration: 0.33, volume: 0.65, intensity: 1.5 },  // C4 - darker
        { freq: 246.94, duration: 0.33, volume: 0.65, intensity: 1.5, bass: 'single' },  // B3
        { freq: 220.00, duration: 0.33, volume: 0.65, intensity: 1.5 },  // A3 - very low
        { freq: 196.00, duration: 0.66, volume: 0.7, intensity: 1.7, bass: 'single' },  // G3
        { freq: 220.00, duration: 0.33, volume: 0.65, intensity: 1.5 },
        { freq: 246.94, duration: 0.33, volume: 0.65, intensity: 1.5, bass: 'single' },
        { freq: 293.66, duration: 0.66, volume: 0.65, intensity: 1.5 },

        // Phrase 3 - Rising from depths (crescendo)
        { freq: 293.66, duration: 0.33, volume: 0.7, intensity: 1.6, bass: 'single' },
        { freq: 329.63, duration: 0.33, volume: 0.75, intensity: 1.7 },
        { freq: 392.00, duration: 0.33, volume: 0.8, intensity: 1.8, bass: 'single' },
        { freq: 440.00, duration: 0.33, volume: 0.85, intensity: 1.9 },
        { freq: 493.88, duration: 0.66, volume: 0.9, intensity: 2, bass: 'single' },
        { freq: 440.00, duration: 0.33, volume: 0.85, intensity: 1.9 },
        { freq: 392.00, duration: 0.33, volume: 0.8, intensity: 1.8, bass: 'single' },
        { freq: 329.63, duration: 0.66, volume: 0.75, intensity: 1.7 },

        // Phrase 4 - Transition with dissonance
        { freq: 311.13, duration: 0.33, volume: 0.8, intensity: 2, bass: 'single' },  // Eb4 - tritone
        { freq: 329.63, duration: 0.33, volume: 0.85, intensity: 2 },
        { freq: 392.00, duration: 0.33, volume: 0.9, intensity: 2, bass: 'single' },
        { freq: 440.00, duration: 0.33, volume: 0.95, intensity: 2 },
        { freq: 466.16, duration: 0.33, volume: 1.0, intensity: 2, bass: 'single' },  // Bb4 - tritone
        { freq: 493.88, duration: 0.33, volume: 1.0, intensity: 2 },
        { freq: 587.33, duration: 0.66, volume: 1.0, intensity: 2, bass: 'single' },
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
        { freq: 329.63, duration: 0.5, volume: 1.0, intensity: 2, bass: 'single' },

        // B diminished arpeggio (darker)
        { freq: 246.94, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // B3
        { freq: 293.66, duration: 0.25, volume: 1.0, intensity: 2 },  // D4
        { freq: 349.23, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // F4
        { freq: 493.88, duration: 0.25, volume: 1.0, intensity: 2 },  // B4
        { freq: 349.23, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 293.66, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 246.94, duration: 0.5, volume: 1.0, intensity: 2, bass: 'single' },

        // A minor arpeggio
        { freq: 220.00, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // A3
        { freq: 261.63, duration: 0.25, volume: 1.0, intensity: 2 },  // C4
        { freq: 329.63, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // E4
        { freq: 440.00, duration: 0.25, volume: 1.0, intensity: 2 },  // A4
        { freq: 329.63, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 261.63, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 220.00, duration: 0.5, volume: 1.0, intensity: 2, bass: 'single' },

        // F# diminished arpeggio (very dark)
        { freq: 185.00, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // F#3
        { freq: 220.00, duration: 0.25, volume: 1.0, intensity: 2 },  // A3
        { freq: 261.63, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },  // C4
        { freq: 369.99, duration: 0.25, volume: 1.0, intensity: 2 },  // F#4
        { freq: 261.63, duration: 0.25, volume: 1.0, intensity: 2, bass: 'arp' },
        { freq: 220.00, duration: 0.25, volume: 1.0, intensity: 2 },
        { freq: 185.00, duration: 0.5, volume: 1.0, intensity: 2, bass: 'single' },

        // Rising chromatic tension
        { freq: 329.63, duration: 0.2, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 349.23, duration: 0.2, volume: 1.0, intensity: 2 },  // F4
        { freq: 392.00, duration: 0.2, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 415.30, duration: 0.2, volume: 1.0, intensity: 2 },  // Ab4
        { freq: 440.00, duration: 0.2, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 466.16, duration: 0.2, volume: 1.0, intensity: 2 },  // Bb4
        { freq: 493.88, duration: 0.2, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 523.25, duration: 0.2, volume: 1.0, intensity: 2 },  // C5
        { freq: 587.33, duration: 0.2, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 622.25, duration: 0.2, volume: 1.0, intensity: 2 },  // Eb5
        { freq: 659.25, duration: 0.2, volume: 1.0, intensity: 2, bass: 'single' },
        { freq: 698.46, duration: 0.2, volume: 1.0, intensity: 2 },  // F5
        { freq: 783.99, duration: 0.66, volume: 1.1, intensity: 2, bass: 'single' },  // G5
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
        { freq: 329.63, duration: 0.66, volume: 0.4, intensity: 0.5, bass: 'single' },
        { freq: 392.00, duration: 0.66, volume: 0.45, intensity: 0.6 },
        { freq: 493.88, duration: 0.66, volume: 0.5, intensity: 0.7, bass: 'single' },
        { freq: 659.25, duration: 0.66, volume: 0.55, intensity: 0.8 },

        { freq: 587.33, duration: 0.66, volume: 0.6, intensity: 0.9, bass: 'single' },
        { freq: 523.25, duration: 0.66, volume: 0.65, intensity: 1.0 },
        { freq: 493.88, duration: 0.66, volume: 0.7, intensity: 1.1, bass: 'single' },
        { freq: 440.00, duration: 0.66, volume: 0.75, intensity: 1.3 },
        { freq: 392.00, duration: 0.66, volume: 0.8, intensity: 1.5, bass: 'single' },
        { freq: 329.63, duration: 0.66, volume: 0.85, intensity: 1.7 },
        { freq: 293.66, duration: 0.66, volume: 0.9, intensity: 1.9, bass: 'single' },

        { freq: 0, duration: 0.66, volume: 0, intensity: 0 },  // REST - dramatic pause

        // ============================================
        // DARK THEME A RETURN - Full Power (3:50-4:40)
        // ============================================
        // Phrase 1 - Back to main theme (maximum darkness)
        { freq: 329.63, duration: 0.33, volume: 1.1, intensity: 2, bass: 'single' },
        { freq: 392.00, duration: 0.33, volume: 1.1, intensity: 2 },
        { freq: 440.00, duration: 0.33, volume: 1.1, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.33, volume: 1.1, intensity: 2 },
        { freq: 587.33, duration: 0.66, volume: 1.1, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.33, volume: 1.1, intensity: 2 },
        { freq: 440.00, duration: 0.33, volume: 1.1, intensity: 2, bass: 'single' },
        { freq: 392.00, duration: 0.66, volume: 1.1, intensity: 2 },

        // Phrase 2
        { freq: 329.63, duration: 0.33, volume: 1.15, intensity: 2, bass: 'arp' },
        { freq: 392.00, duration: 0.33, volume: 1.15, intensity: 2 },
        { freq: 440.00, duration: 0.33, volume: 1.15, intensity: 2, bass: 'arp' },
        { freq: 493.88, duration: 0.33, volume: 1.15, intensity: 2 },
        { freq: 587.33, duration: 0.66, volume: 1.2, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.33, volume: 1.15, intensity: 2 },
        { freq: 440.00, duration: 0.33, volume: 1.15, intensity: 2, bass: 'single' },
        { freq: 329.63, duration: 0.66, volume: 1.15, intensity: 2 },

        // Phrase 3 - High intensity
        { freq: 587.33, duration: 0.33, volume: 1.2, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.33, volume: 1.2, intensity: 2 },
        { freq: 783.99, duration: 0.33, volume: 1.2, intensity: 2, bass: 'single' },
        { freq: 880.00, duration: 0.33, volume: 1.2, intensity: 2 },  // A5
        { freq: 987.77, duration: 0.66, volume: 1.25, intensity: 2, bass: 'single' },  // B5
        { freq: 880.00, duration: 0.33, volume: 1.2, intensity: 2 },
        { freq: 783.99, duration: 0.33, volume: 1.2, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.66, volume: 1.2, intensity: 2 },

        // Phrase 4 - Building to finale
        { freq: 587.33, duration: 0.33, volume: 1.25, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.33, volume: 1.25, intensity: 2 },
        { freq: 587.33, duration: 0.33, volume: 1.25, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.33, volume: 1.25, intensity: 2 },
        { freq: 440.00, duration: 0.66, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 392.00, duration: 0.66, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 440.00, duration: 0.66, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.66, volume: 1.3, intensity: 2, bass: 'single' },

        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

        // ============================================
        // DARK FINALE - Epic Doom (4:40-5:15)
        // ============================================
        // Massive dark chords
        { freq: 329.63, duration: 0.25, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 392.00, duration: 0.25, volume: 1.3, intensity: 2 },
        { freq: 493.88, duration: 0.25, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.5, volume: 1.3, intensity: 2, bass: 'arp' },
        { freq: 493.88, duration: 0.25, volume: 1.3, intensity: 2 },
        { freq: 392.00, duration: 0.25, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 329.63, duration: 0.5, volume: 1.3, intensity: 2, bass: 'single' },

        { freq: 392.00, duration: 0.25, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.25, volume: 1.3, intensity: 2 },
        { freq: 587.33, duration: 0.25, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 783.99, duration: 0.5, volume: 1.3, intensity: 2, bass: 'arp' },  // G5
        { freq: 587.33, duration: 0.25, volume: 1.3, intensity: 2 },
        { freq: 493.88, duration: 0.25, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 392.00, duration: 0.5, volume: 1.3, intensity: 2, bass: 'single' },

        // Rising to dark climax
        { freq: 659.25, duration: 0.33, volume: 1.4, intensity: 2, bass: 'single' },
        { freq: 739.99, duration: 0.33, volume: 1.4, intensity: 2 },  // F#5
        { freq: 783.99, duration: 0.33, volume: 1.4, intensity: 2, bass: 'single' },  // G5
        { freq: 880.00, duration: 0.33, volume: 1.4, intensity: 2 },  // A5
        { freq: 987.77, duration: 0.66, volume: 1.5, intensity: 2, bass: 'single' },  // B5 - peak!
        { freq: 880.00, duration: 0.33, volume: 1.4, intensity: 2 },
        { freq: 783.99, duration: 0.33, volume: 1.4, intensity: 2, bass: 'single' },
        { freq: 659.25, duration: 0.66, volume: 1.4, intensity: 2, bass: 'single' },

        // Final descent into darkness
        { freq: 587.33, duration: 0.66, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 493.88, duration: 0.66, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 440.00, duration: 0.66, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 392.00, duration: 0.66, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 329.63, duration: 1.0, volume: 1.3, intensity: 2, bass: 'single' },
        { freq: 293.66, duration: 1.0, volume: 1.3, intensity: 2, bass: 'single' },  // D4
        { freq: 329.63, duration: 1.5, volume: 1.4, intensity: 2, bass: 'single' },  // E4 - resolution
        { freq: 261.63, duration: 2.5, volume: 1.5, intensity: 2, bass: 'single' },  // C4 - dark final sustain!

        // Silence before loop
        { freq: 0, duration: 1.33, volume: 0, intensity: 0 }
    ]
};

export const rhythmicTheme = {
    bpm: 100,
    waveform: 'square',
    bassWaveform: 'sawtooth',
    envelopeRelease: 0.8,
    useMinorThird: false,
    melody: [
        // ============================================
        // GROOVE INTRO (0:00-0:25) - Establish the beat
        // ============================================
        // Simple 4-bar intro with bass hits
        { freq: 587.33, duration: 0.5, volume: 0.6, intensity: 0, bass: 'single' },  // D5 - long
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST
        { freq: 587.33, duration: 0.5, volume: 0.6, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

        { freq: 659.25, duration: 0.5, volume: 0.65, intensity: 0, bass: 'single' },  // E5
        { freq: 587.33, duration: 0.25, volume: 0.6, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },  // REST
        { freq: 739.99, duration: 0.5, volume: 0.65, intensity: 0, bass: 'single' },  // F#5
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

        // ============================================
        // MAIN GROOVE A (0:25-1:10) - The catchy pattern
        // ============================================
        // 4-bar repeating pattern
        { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },  // D5
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },  // REST
        { freq: 659.25, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },  // E5
        { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },

        { freq: 739.99, duration: 0.5, volume: 0.75, intensity: 0, bass: 'single' },  // F#5
        { freq: 659.25, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },  // REST

        // Bar 2 - variation
        { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 880.00, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },  // A5
        { freq: 739.99, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },

        { freq: 659.25, duration: 0.5, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 3
        { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 659.25, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 739.99, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },

        { freq: 880.00, duration: 0.5, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 739.99, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 4 - resolution
        { freq: 659.25, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 587.33, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },

        { freq: 587.33, duration: 0.5, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

        // ============================================
        // BRIDGE B (1:10-1:55) - Slight variation
        // ============================================
        // Same groove, different notes
        { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },  // F#5
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 880.00, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },  // A5
        { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },

        { freq: 987.77, duration: 0.5, volume: 0.8, intensity: 0, bass: 'single' },  // B5
        { freq: 880.00, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 2
        { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 1174.66, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },  // D6
        { freq: 987.77, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },

        { freq: 880.00, duration: 0.5, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 3
        { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 880.00, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 987.77, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },

        { freq: 1174.66, duration: 0.5, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 987.77, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 4 - back to root
        { freq: 880.00, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 739.99, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 659.25, duration: 0.25, volume: 0.75, intensity: 0, bass: 'single' },

        { freq: 587.33, duration: 0.5, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

        // ============================================
        // GROOVE C (1:55-2:40) - Main groove returns
        // ============================================
        // Back to the catchy pattern
        { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 659.25, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },

        { freq: 739.99, duration: 0.5, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 659.25, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 2
        { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 880.00, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 739.99, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },

        { freq: 659.25, duration: 0.5, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 3
        { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 659.25, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 739.99, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },

        { freq: 880.00, duration: 0.5, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 739.99, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 4
        { freq: 659.25, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 587.33, duration: 0.25, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 739.99, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },

        { freq: 587.33, duration: 0.5, volume: 0.8, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

        // ============================================
        // BREAKDOWN D (2:40-3:25) - Minimal groove
        // ============================================
        // Strip back to essentials
        { freq: 587.33, duration: 0.5, volume: 0.5, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },
        { freq: 587.33, duration: 0.5, volume: 0.5, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },

        { freq: 659.25, duration: 0.5, volume: 0.55, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },
        { freq: 739.99, duration: 0.5, volume: 0.55, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },

        // Building back
        { freq: 587.33, duration: 0.25, volume: 0.6, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 659.25, duration: 0.25, volume: 0.6, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        { freq: 739.99, duration: 0.25, volume: 0.65, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 880.00, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        { freq: 739.99, duration: 0.5, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 659.25, duration: 0.25, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // ============================================
        // GROOVE A RETURN (3:25-4:10) - Full energy
        // ============================================
        { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 659.25, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },

        { freq: 739.99, duration: 0.5, volume: 0.9, intensity: 0, bass: 'single' },
        { freq: 659.25, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 2
        { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 880.00, duration: 0.25, volume: 0.9, intensity: 0, bass: 'single' },
        { freq: 739.99, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },

        { freq: 659.25, duration: 0.5, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 3
        { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 659.25, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 739.99, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },

        { freq: 880.00, duration: 0.5, volume: 0.9, intensity: 0, bass: 'single' },
        { freq: 739.99, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },

        // Bar 4
        { freq: 659.25, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 587.33, duration: 0.25, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.25, volume: 0, intensity: 0 },
        { freq: 739.99, duration: 0.25, volume: 0.9, intensity: 0, bass: 'single' },

        { freq: 587.33, duration: 0.5, volume: 0.85, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },  // REST

        // ============================================
        // OUTRO (4:10-4:30) - Wind down
        // ============================================
        { freq: 587.33, duration: 0.5, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },
        { freq: 659.25, duration: 0.5, volume: 0.7, intensity: 0, bass: 'single' },
        { freq: 0, duration: 0.5, volume: 0, intensity: 0 },

        { freq: 739.99, duration: 1.0, volume: 0.75, intensity: 0, bass: 'single' },
        { freq: 587.33, duration: 1.0, volume: 0.8, intensity: 0, bass: 'single' },

        // Brief silence before loop
        { freq: 0, duration: 1.0, volume: 0, intensity: 0 }
    ]
};
