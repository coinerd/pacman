// tests/managers/SoundManager.test.js

import { SoundManager } from '../../src/managers/SoundManager.js';

describe('SoundManager', () => {
    let soundManager;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            time: {
                delayedCall: jest.fn((delay, callback) => setTimeout(callback, delay))
            }
        };
        soundManager = new SoundManager(mockScene);
    });

    afterEach(() => {
        soundManager = null;
    });

    describe('constructor', () => {
        test('should initialize with default values', () => {
            expect(soundManager.enabled).toBe(true);
            expect(soundManager.volume).toBe(0.5);
            expect(soundManager.initialized).toBe(false);
        });

        test('should store scene reference', () => {
            expect(soundManager.scene).toBe(mockScene);
        });
    });

    describe('initialize', () => {
        test('should set initialized flag', () => {
            soundManager.initialize();

            expect(soundManager.initialized).toBe(true);
        });

        test('should not reinitialize if already initialized', () => {
            soundManager.initialize();
            const firstContext = soundManager.audioContext;

            soundManager.initialize();

            expect(soundManager.audioContext).toBe(firstContext);
        });
    });

    describe('playTone', () => {
        test('should not play if disabled', () => {
            soundManager.enabled = false;

            expect(() => soundManager.playTone(440, 0.1)).not.toThrow();
        });

        test('should not play if audioContext missing', () => {
            soundManager.audioContext = null;

            expect(() => soundManager.playTone(440, 0.1)).not.toThrow();
        });
    });

    describe('playWakaWaka', () => {
        test('should not throw when disabled', () => {
            soundManager.enabled = false;

            expect(() => soundManager.playWakaWaka()).not.toThrow();
        });
    });

    describe('playPowerPellet', () => {
        test('should not throw when disabled', () => {
            soundManager.enabled = false;

            expect(() => soundManager.playPowerPellet()).not.toThrow();
        });

        test('should not throw when scene is null', () => {
            soundManager.scene = null;

            expect(() => soundManager.playPowerPellet()).not.toThrow();
        });
    });

    describe('playGhostEaten', () => {
        test('should not throw when disabled', () => {
            soundManager.enabled = false;

            expect(() => soundManager.playGhostEaten()).not.toThrow();
        });
    });

    describe('playDeath', () => {
        test('should not throw when disabled', () => {
            soundManager.enabled = false;

            expect(() => soundManager.playDeath()).not.toThrow();
        });
    });

    describe('playLevelComplete', () => {
        test('should not throw when disabled', () => {
            soundManager.enabled = false;

            expect(() => soundManager.playLevelComplete()).not.toThrow();
        });
    });

    describe('playFruitEat', () => {
        test('should not throw when disabled', () => {
            soundManager.enabled = false;

            expect(() => soundManager.playFruitEat()).not.toThrow();
        });
    });

    describe('setEnabled', () => {
        test('should toggle enabled state', () => {
            soundManager.setEnabled(false);
            expect(soundManager.enabled).toBe(false);

            soundManager.setEnabled(true);
            expect(soundManager.enabled).toBe(true);
        });
    });

    describe('setVolume', () => {
        test('should set volume level', () => {
            soundManager.setVolume(0.8);

            expect(soundManager.volume).toBe(0.8);
        });

        test('should clamp volume to 0-1 range', () => {
            soundManager.setVolume(1.5);
            expect(soundManager.volume).toBe(1);

            soundManager.setVolume(-0.5);
            expect(soundManager.volume).toBe(0);
        });
    });

    describe('resume', () => {
        test('should not throw when audioContext is null', () => {
            soundManager.audioContext = null;

            expect(() => soundManager.resume()).not.toThrow();
        });
    });
});
