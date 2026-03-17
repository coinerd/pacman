/**
 * Tests for ToneGenerator
 */

import { ToneGenerator } from '../../../src/audio/generators/ToneGenerator.js';
import { createMockAudioContext } from '../../mocks/audioContext.js';

describe('ToneGenerator', () => {
    let mockAudioContext;
    let toneGenerator;

    beforeEach(() => {
        mockAudioContext = createMockAudioContext();
        toneGenerator = new ToneGenerator(mockAudioContext);
    });

    describe('constructor', () => {
        test('should store audioContext reference', () => {
            expect(toneGenerator.audioContext).toBe(mockAudioContext);
        });
    });

    describe('createOscillator', () => {
        test('should create oscillator with correct type', () => {
            const oscillator = toneGenerator.createOscillator('square', 440);

            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
            expect(oscillator.type).toBe('square');
        });

        test('should set frequency correctly', () => {
            const oscillator = toneGenerator.createOscillator('sine', 880);

            expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
                880,
                mockAudioContext.currentTime
            );
        });

        test('should support different wave types', () => {
            const waves = ['sine', 'square', 'sawtooth', 'triangle'];

            for (const wave of waves) {
                const oscillator = toneGenerator.createOscillator(wave, 440);
                expect(oscillator.type).toBe(wave);
            }
        });
    });

    describe('createGain', () => {
        test('should create gain node', () => {
            toneGenerator.createGain(0.5);

            expect(mockAudioContext.createGain).toHaveBeenCalled();
        });

        test('should set initial volume', () => {
            const gain = toneGenerator.createGain(0.8);

            expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(
                0.8,
                mockAudioContext.currentTime
            );
        });

        test('should use default volume of 1.0', () => {
            const gain = toneGenerator.createGain();

            expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(
                1.0,
                mockAudioContext.currentTime
            );
        });
    });

    describe('addHarmonics', () => {
        test('should create harmonic oscillators', () => {
            const baseOsc = toneGenerator.createOscillator('square', 440);
            const outputGain = toneGenerator.createGain(0.5);

            toneGenerator.addHarmonics(baseOsc, outputGain, [2, 3], 0.5);

            // Should create oscillators for each harmonic
            expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3); // 1 base + 2 harmonics
        });

        test('should handle empty harmonics array', () => {
            const baseOsc = toneGenerator.createOscillator('square', 440);
            const outputGain = toneGenerator.createGain(0.5);

            toneGenerator.addHarmonics(baseOsc, outputGain, [], 0.5);

            // Should not create additional oscillators
            expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
        });
    });

    describe('addModulation', () => {
        test('should create modulator oscillator', () => {
            const baseOsc = toneGenerator.createOscillator('sine', 440);

            const modulator = toneGenerator.addModulation(baseOsc, 10, 5);

            expect(modulator).toBeDefined();
            expect(modulator.start).toHaveBeenCalled();
        });

        test('should create gain for modulation depth', () => {
            const baseOsc = toneGenerator.createOscillator('sine', 440);

            toneGenerator.addModulation(baseOsc, 20, 3);

            // Should create gain for modulator
            expect(mockAudioContext.createGain).toHaveBeenCalled();
        });
    });

    describe('addGlitchEffect', () => {
        test('should return duration', () => {
            const baseOsc = toneGenerator.createOscillator('square', 440);
            const duration = 0.5;

            const result = toneGenerator.addGlitchEffect(baseOsc, duration, 3);

            expect(result).toBe(duration);
        });

        test('should handle maxJumps parameter', () => {
            const baseOsc = toneGenerator.createOscillator('square', 440);

            // Should not throw
            toneGenerator.addGlitchEffect(baseOsc, 0.5, 5);
        });
    });

    describe('createEcho', () => {
        test('should create delay node', () => {
            // Mock createDelay
            mockAudioContext.createDelay = jest.fn(() => ({
                delayTime: { setValueAtTime: jest.fn() },
                connect: jest.fn()
            }));

            const baseOsc = toneGenerator.createOscillator('sine', 440);

            toneGenerator.createEcho(baseOsc, 0.3, 0.5, 0.3);

            expect(mockAudioContext.createDelay).toHaveBeenCalled();
        });
    });

    describe('playDigitalTone', () => {
        test('should create oscillator and gain', () => {
            toneGenerator.playDigitalTone(440, 0.2, { volume: 0.5 });

            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
            expect(mockAudioContext.createGain).toHaveBeenCalled();
        });

        test('should use default config values', () => {
            toneGenerator.playDigitalTone(440, 0.2);

            // Should not throw
            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        });

        test('should handle harmonics config', () => {
            toneGenerator.playDigitalTone(440, 0.2, {
                harmonics: [2, 3]
            });

            // Should create oscillators for harmonics
            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        });

        test('should handle modulation config', () => {
            toneGenerator.playDigitalTone(440, 0.2, {
                modDepth: 10,
                modSpeed: 5
            });

            // Should not throw
            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        });

        test('should handle glitch config', () => {
            toneGenerator.playDigitalTone(440, 0.2, {
                glitch: true,
                maxJumps: 3
            });

            // Should not throw
            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        });

        test('should start and stop oscillator', () => {
            toneGenerator.playDigitalTone(440, 0.2);

            const oscillator = mockAudioContext.createOscillator.mock.results[0].value;
            expect(oscillator.start).toHaveBeenCalled();
            expect(oscillator.stop).toHaveBeenCalled();
        });
    });
});
