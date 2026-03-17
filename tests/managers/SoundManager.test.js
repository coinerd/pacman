/**
 * Tests for SoundManager
 * Focusing on branch coverage for sound management functions
 */

import { SoundManager } from '../../src/managers/SoundManager.js';

// Mock Phaser scene
class MockScene {
    constructor() {
        this.time = {
            delayedCall: jest.fn((delay, callback) => {
                callback();
            })
        };
    }
}

describe('SoundManager', () => {
    let soundManager;
    let mockScene;

    beforeEach(() => {
        mockScene = new MockScene();
        soundManager = new SoundManager(mockScene);
    });

    afterEach(() => {
        if (soundManager) {
            soundManager.enabled = false;
        }
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(soundManager.scene).toBe(mockScene);
            expect(soundManager.audioContext).toBeNull();
            expect(soundManager.enabled).toBe(true);
            expect(soundManager.volume).toBe(0.5);
            expect(soundManager.initialized).toBe(false);
        });

        it('should accept null scene', () => {
            const sm = new SoundManager(null);
            expect(sm.scene).toBeNull();
        });
    });

    describe('initialize', () => {
        it('should return early if already initialized', () => {
            soundManager.initialized = true;

            soundManager.initialize();

            // audioContext should still be null (early return)
            expect(soundManager.audioContext).toBeNull();
        });

        it('should set initialized to true on success', () => {
            // Mock AudioContext
            window.AudioContext = jest.fn().mockImplementation(() => ({
                createOscillator: jest.fn(),
                createGain: jest.fn(),
                destination: {},
                currentTime: 0
            }));

            soundManager.initialize();

            expect(soundManager.initialized).toBe(true);

            delete window.AudioContext;
        });

        it('should set enabled to false if AudioContext not available', () => {
            // Remove AudioContext
            const originalAudioContext = window.AudioContext;
            const originalWebkitAudioContext = window.webkitAudioContext;
            delete window.AudioContext;
            delete window.webkitAudioContext;

            soundManager.initialize();

            expect(soundManager.enabled).toBe(false);

            // Restore
            window.AudioContext = originalAudioContext;
            window.webkitAudioContext = originalWebkitAudioContext;
        });
    });

    describe('playTone', () => {
        it('should return early if disabled', () => {
            soundManager.enabled = false;

            soundManager.playTone(400, 0.1);

            // Should not throw
        });

        it('should return early if no audioContext', () => {
            soundManager.audioContext = null;

            soundManager.playTone(400, 0.1);

            // Should not throw
        });

        it('should handle errors gracefully', () => {
            // Mock AudioContext that throws
            soundManager.audioContext = {
                createOscillator: jest.fn(() => {
                    throw new Error('Test error');
                }),
                currentTime: 0
            };
            soundManager.initialized = true;

            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            soundManager.playTone(400, 0.1);

            expect(consoleWarnSpy).toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });
    });

    describe('playWakaWaka', () => {
        it('should return early if disabled', () => {
            soundManager.enabled = false;

            soundManager.playWakaWaka();

            // Should not throw
        });

        it('should call playTone when enabled', () => {
            soundManager.audioContext = {
                createOscillator: jest.fn(() => ({
                    connect: jest.fn(),
                    frequency: { setValueAtTime: jest.fn() },
                    type: 'sine',
                    start: jest.fn(),
                    stop: jest.fn()
                })),
                createGain: jest.fn(() => ({
                    connect: jest.fn(),
                    gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
                })),
                destination: {},
                currentTime: 0
            };
            soundManager.initialized = true;

            soundManager.playWakaWaka();

            // Should not throw
        });
    });

    describe('playPowerPellet', () => {
        it('should return early if disabled', () => {
            soundManager.enabled = false;

            soundManager.playPowerPellet();

            // Should not throw
        });

        it('should return early if no scene', () => {
            soundManager.scene = null;

            soundManager.playPowerPellet();

            // Should not throw
        });

        it('should play tones when enabled with scene', () => {
            soundManager.audioContext = {
                createOscillator: jest.fn(() => ({
                    connect: jest.fn(),
                    frequency: { setValueAtTime: jest.fn() },
                    type: 'sine',
                    start: jest.fn(),
                    stop: jest.fn()
                })),
                createGain: jest.fn(() => ({
                    connect: jest.fn(),
                    gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
                })),
                destination: {},
                currentTime: 0
            };
            soundManager.initialized = true;

            soundManager.playPowerPellet();

            // Should have called delayedCall
            expect(mockScene.time.delayedCall).toHaveBeenCalled();
        });
    });

    describe('playGhostEaten', () => {
        it('should return early if disabled', () => {
            soundManager.enabled = false;

            soundManager.playGhostEaten();

            // Should not throw
        });

        it('should return early if no scene', () => {
            soundManager.scene = null;

            soundManager.playGhostEaten();

            // Should not throw
        });
    });

    describe('playDeath', () => {
        it('should return early if disabled', () => {
            soundManager.enabled = false;

            soundManager.playDeath();

            // Should not throw
        });

        it('should return early if no scene', () => {
            soundManager.scene = null;

            soundManager.playDeath();

            // Should not throw
        });

        it('should play multiple tones for death sequence', () => {
            soundManager.audioContext = {
                createOscillator: jest.fn(() => ({
                    connect: jest.fn(),
                    frequency: { setValueAtTime: jest.fn() },
                    type: 'sine',
                    start: jest.fn(),
                    stop: jest.fn()
                })),
                createGain: jest.fn(() => ({
                    connect: jest.fn(),
                    gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
                })),
                destination: {},
                currentTime: 0
            };
            soundManager.initialized = true;

            soundManager.playDeath();

            // 7 frequencies, 7 delayedCall invocations
            expect(mockScene.time.delayedCall).toHaveBeenCalledTimes(7);
        });
    });

    describe('playLevelComplete', () => {
        it('should return early if disabled', () => {
            soundManager.enabled = false;

            soundManager.playLevelComplete();

            // Should not throw
        });

        it('should return early if no scene', () => {
            soundManager.scene = null;

            soundManager.playLevelComplete();

            // Should not throw
        });

        it('should play multiple tones for level complete', () => {
            soundManager.audioContext = {
                createOscillator: jest.fn(() => ({
                    connect: jest.fn(),
                    frequency: { setValueAtTime: jest.fn() },
                    type: 'sine',
                    start: jest.fn(),
                    stop: jest.fn()
                })),
                createGain: jest.fn(() => ({
                    connect: jest.fn(),
                    gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
                })),
                destination: {},
                currentTime: 0
            };
            soundManager.initialized = true;

            soundManager.playLevelComplete();

            // 4 frequencies, 4 delayedCall invocations
            expect(mockScene.time.delayedCall).toHaveBeenCalledTimes(4);
        });
    });

    describe('playFruitEat', () => {
        it('should return early if disabled', () => {
            soundManager.enabled = false;

            soundManager.playFruitEat();

            // Should not throw
        });

        it('should return early if no scene', () => {
            soundManager.scene = null;

            soundManager.playFruitEat();

            // Should not throw
        });

        it('should play tones when enabled', () => {
            soundManager.audioContext = {
                createOscillator: jest.fn(() => ({
                    connect: jest.fn(),
                    frequency: { setValueAtTime: jest.fn() },
                    type: 'sine',
                    start: jest.fn(),
                    stop: jest.fn()
                })),
                createGain: jest.fn(() => ({
                    connect: jest.fn(),
                    gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
                })),
                destination: {},
                currentTime: 0
            };
            soundManager.initialized = true;

            soundManager.playFruitEat();

            // Initial tone + delayed call
            expect(mockScene.time.delayedCall).toHaveBeenCalled();
        });
    });

    describe('setVolume', () => {
        it('should set volume within valid range', () => {
            soundManager.setVolume(0.8);
            expect(soundManager.volume).toBe(0.8);
        });

        it('should clamp volume to maximum 1', () => {
            soundManager.setVolume(2);
            expect(soundManager.volume).toBe(1);
        });

        it('should clamp volume to minimum 0', () => {
            soundManager.setVolume(-0.5);
            expect(soundManager.volume).toBe(0);
        });

        it('should handle edge case of 0', () => {
            soundManager.setVolume(0);
            expect(soundManager.volume).toBe(0);
        });

        it('should handle edge case of 1', () => {
            soundManager.setVolume(1);
            expect(soundManager.volume).toBe(1);
        });
    });

    describe('setEnabled', () => {
        it('should enable sound', () => {
            soundManager.setEnabled(true);
            expect(soundManager.enabled).toBe(true);
        });

        it('should disable sound', () => {
            soundManager.setEnabled(false);
            expect(soundManager.enabled).toBe(false);
        });
    });

    describe('resume', () => {
        it('should resume suspended audio context', () => {
            soundManager.audioContext = {
                state: 'suspended',
                resume: jest.fn()
            };

            soundManager.resume();

            expect(soundManager.audioContext.resume).toHaveBeenCalled();
        });

        it('should not resume if audio context is running', () => {
            soundManager.audioContext = {
                state: 'running',
                resume: jest.fn()
            };

            soundManager.resume();

            expect(soundManager.audioContext.resume).not.toHaveBeenCalled();
        });

        it('should handle null audio context', () => {
            soundManager.audioContext = null;

            soundManager.resume();

            // Should not throw
        });
    });
});
