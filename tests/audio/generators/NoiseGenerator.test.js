/**
 * Tests for NoiseGenerator
 */

import { NoiseGenerator } from '../../../src/audio/generators/NoiseGenerator.js';
import { createMockAudioContext } from '../../mocks/audioContext.js';

describe('NoiseGenerator', () => {
    let mockAudioContext;
    let noiseGenerator;

    beforeEach(() => {
        mockAudioContext = createMockAudioContext();
        noiseGenerator = new NoiseGenerator(mockAudioContext);
    });

    describe('constructor', () => {
        test('should store audioContext reference', () => {
            expect(noiseGenerator.audioContext).toBe(mockAudioContext);
        });

        test('should initialize with null scriptProcessor', () => {
            expect(noiseGenerator.scriptProcessor).toBeNull();
        });
    });

    describe('createNoiseBuffer', () => {
        test('should create buffer with correct duration', () => {
            const duration = 0.5;
            const buffer = noiseGenerator.createNoiseBuffer(duration);

            expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(
                1,
                expect.any(Number),
                44100
            );
            expect(buffer).toBeDefined();
        });

        test('should create white noise by default', () => {
            const buffer = noiseGenerator.createNoiseBuffer(0.1, 'white');
            expect(buffer).toBeDefined();
        });

        test('should create pink noise', () => {
            const buffer = noiseGenerator.createNoiseBuffer(0.1, 'pink');
            expect(buffer).toBeDefined();
        });

        test('should create brown noise', () => {
            const buffer = noiseGenerator.createNoiseBuffer(0.1, 'brown');
            expect(buffer).toBeDefined();
        });

        test('should default to white noise for unknown type', () => {
            const buffer = noiseGenerator.createNoiseBuffer(0.1, 'unknown');
            expect(buffer).toBeDefined();
        });
    });

    describe('generateNoiseSample', () => {
        test('should generate white noise sample in valid range', () => {
            for (let i = 0; i < 100; i++) {
                const sample = noiseGenerator.generateNoiseSample('white', i);
                expect(sample).toBeGreaterThanOrEqual(-1);
                expect(sample).toBeLessThanOrEqual(1);
            }
        });

        test('should generate pink noise sample in valid range', () => {
            for (let i = 0; i < 100; i++) {
                const sample = noiseGenerator.generateNoiseSample('pink', i);
                expect(typeof sample).toBe('number');
            }
        });

        test('should generate brown noise sample in valid range', () => {
            for (let i = 0; i < 100; i++) {
                const sample = noiseGenerator.generateNoiseSample('brown', i);
                expect(typeof sample).toBe('number');
            }
        });

        test('should default to white noise for unknown type', () => {
            const sample = noiseGenerator.generateNoiseSample('unknown', 0);
            expect(sample).toBeGreaterThanOrEqual(-1);
            expect(sample).toBeLessThanOrEqual(1);
        });
    });

    describe('playNoise', () => {
        test('should create buffer source', () => {
            noiseGenerator.playNoise(0.1, 'white', 0.5);

            expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
        });

        test('should create gain node', () => {
            noiseGenerator.playNoise(0.1, 'white', 0.5);

            expect(mockAudioContext.createGain).toHaveBeenCalled();
        });

        test('should start the source', () => {
            noiseGenerator.playNoise(0.1, 'white', 0.5);

            const source = mockAudioContext._sources[0];
            expect(source.start).toHaveBeenCalledWith(mockAudioContext.currentTime);
        });

        test('should stop the source after duration', () => {
            noiseGenerator.playNoise(0.1, 'white', 0.5);

            const source = mockAudioContext._sources[0];
            expect(source.stop).toHaveBeenCalled();
        });
    });
});
