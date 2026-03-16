/**
 * Tests for SoundBuilder
 */

import { SoundBuilder } from '../../../src/audio/generators/SoundBuilder.js';
import { createMockAudioContext } from '../../mocks/audioContext.js';

describe('SoundBuilder', () => {
    let mockAudioContext;
    let soundBuilder;

    beforeEach(() => {
        mockAudioContext = createMockAudioContext();
        soundBuilder = new SoundBuilder(mockAudioContext);
    });

    describe('constructor', () => {
        test('should store audioContext reference', () => {
            expect(soundBuilder.audioContext).toBe(mockAudioContext);
        });

        test('should create toneGenerator', () => {
            expect(soundBuilder.toneGenerator).toBeDefined();
        });

        test('should create noiseGenerator', () => {
            expect(soundBuilder.noiseGenerator).toBeDefined();
        });
    });

    describe('buildSound', () => {
        test('should build tone sound', () => {
            const config = { type: 'tone', params: { baseFreq: 440, duration: 0.1 } };
            soundBuilder.buildSound(config, 0.5);
            // Should not throw
        });

        test('should build noise sound', () => {
            const config = { type: 'noise', params: { duration: 0.1 } };
            soundBuilder.buildSound(config, 0.5);
            // Should not throw
        });

        test('should build circuit sound', () => {
            const config = { type: 'circuit', params: { baseFreq: 60, duration: 0.1 } };
            soundBuilder.buildSound(config, 0.5);
            // Should not throw
        });

        test('should build glitch sound', () => {
            const config = { type: 'glitch', params: { duration: 0.02 } };
            soundBuilder.buildSound(config, 0.5);
            // Should not throw
        });

        test('should build datastream sound', () => {
            const config = { type: 'datastream', params: { count: 3, interval: 0.05 } };
            soundBuilder.buildSound(config, 0.5);
            // Should not throw
        });

        test('should build sweep sound', () => {
            const config = {
                type: 'sweep',
                params: { startFreq: 200, endFreq: 800, duration: 0.2 }
            };
            soundBuilder.buildSound(config, 0.5);

            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
            expect(mockAudioContext.createGain).toHaveBeenCalled();
        });

        test('should build melody sound', () => {
            const config = {
                type: 'melody',
                params: {
                    frequencies: [440, 880],
                    duration: 0.2,
                    wave: 'square',
                    delay: 0.1,
                    steps: 2
                }
            };
            soundBuilder.buildSound(config, 0.5);

            // Should create 2 oscillators (one per frequency)
            expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
        });

        test('should warn on unknown sound type', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const config = { type: 'unknown', params: {} };

            soundBuilder.buildSound(config, 0.5);

            expect(warnSpy).toHaveBeenCalledWith('[SoundBuilder] Unknown sound type: unknown');
            warnSpy.mockRestore();
        });

        test('should use default volume if not specified', () => {
            const config = { type: 'noise', params: { duration: 0.1 } };
            soundBuilder.buildSound(config);
            // Should not throw
        });
    });

    describe('buildSweep', () => {
        test('should create oscillator and gain', () => {
            soundBuilder.buildSweep({
                startFreq: 200,
                endFreq: 800,
                duration: 0.2,
                wave: 'sine'
            }, 0.5);

            expect(mockAudioContext.createOscillator).toHaveBeenCalled();
            expect(mockAudioContext.createGain).toHaveBeenCalled();
        });

        test('should start and stop oscillator', () => {
            soundBuilder.buildSweep({
                startFreq: 200,
                endFreq: 800,
                duration: 0.2
            }, 0.5);

            const oscillator = mockAudioContext._sources[0] ||
                mockAudioContext.createOscillator.mock.results[0].value;

            expect(oscillator.start).toHaveBeenCalled();
            expect(oscillator.stop).toHaveBeenCalled();
        });
    });

    describe('buildMelody', () => {
        test('should create oscillators for each frequency', () => {
            soundBuilder.buildMelody({
                frequencies: [440, 880, 660],
                duration: 0.3,
                wave: 'square',
                delay: 0.1,
                steps: 3
            }, 0.5);

            expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
        });

        test('should use default wave type', () => {
            soundBuilder.buildMelody({
                frequencies: [440],
                duration: 0.1,
                delay: 0,
                steps: 1
            }, 0.5);

            const oscillator = mockAudioContext.createOscillator.mock.results[0].value;
            expect(oscillator.type).toBe('sine');
        });
    });

    describe('getToneGenerator', () => {
        test('should return toneGenerator instance', () => {
            const toneGenerator = soundBuilder.getToneGenerator();
            expect(toneGenerator).toBe(soundBuilder.toneGenerator);
        });
    });

    describe('getNoiseGenerator', () => {
        test('should return noiseGenerator instance', () => {
            const noiseGenerator = soundBuilder.getNoiseGenerator();
            expect(noiseGenerator).toBe(soundBuilder.noiseGenerator);
        });
    });
});
