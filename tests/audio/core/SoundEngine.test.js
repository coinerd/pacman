/**
 * SoundEngine Tests
 * Tests for the Web Audio API wrapper
 */

import { SoundEngine } from '../../../src/audio/core/SoundEngine.js';

// Mock Web Audio API
global.window = global;
window.AudioContext = jest.fn().mockImplementation(() => ({
    createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: {
            setValueAtTime: jest.fn()
        }
    })),
    destination: {},
    currentTime: 0,
    state: 'running',
    resume: jest.fn()
}));

window.webkitAudioContext = window.AudioContext;

describe('SoundEngine', () => {
    let soundEngine;

    beforeEach(() => {
        jest.clearAllMocks();
        soundEngine = new SoundEngine();
    });

    afterEach(() => {
        soundEngine = null;
    });

    describe('Constructor', () => {
        test('should initialize with default values', () => {
            expect(soundEngine.audioContext).toBeNull();
            expect(soundEngine.masterGain).toBeNull();
            expect(soundEngine.initialized).toBe(false);
            expect(soundEngine.enabled).toBe(true);
            expect(soundEngine.volume).toBe(0.5);
        });
    });

    describe('initialize()', () => {
        test('should create audio context', () => {
            soundEngine.initialize();
            expect(window.AudioContext).toHaveBeenCalled();
            expect(soundEngine.audioContext).toBeDefined();
        });

        test('should set initialized flag', () => {
            soundEngine.initialize();
            expect(soundEngine.initialized).toBe(true);
        });

        test('should create master gain node', () => {
            soundEngine.initialize();
            expect(soundEngine.masterGain).toBeDefined();
        });

        test('should not reinitialize if already initialized', () => {
            soundEngine.initialize();
            const firstContext = soundEngine.audioContext;

            soundEngine.initialize();

            expect(soundEngine.audioContext).toBe(firstContext);
        });

        test('should handle AudioContext not supported', () => {
            window.AudioContext.mockImplementationOnce(() => {
                throw new Error('Web Audio API not supported');
            });

            soundEngine = new SoundEngine();
            soundEngine.initialize();

            expect(soundEngine.enabled).toBe(false);
        });
    });

    describe('resume()', () => {
        test('should resume suspended audio context', () => {
            soundEngine.initialize();
            soundEngine.audioContext.state = 'suspended';

            soundEngine.resume();

            expect(soundEngine.audioContext.resume).toHaveBeenCalled();
        });

        test('should not resume if audio context is null', () => {
            soundEngine.resume();
            // Should not throw
        });

        test('should not resume if not enabled', () => {
            soundEngine.initialize();
            soundEngine.enabled = false;

            soundEngine.resume();

            expect(soundEngine.audioContext.resume).not.toHaveBeenCalled();
        });

        test('should not resume if already running', () => {
            soundEngine.initialize();
            soundEngine.audioContext.state = 'running';

            soundEngine.resume();

            expect(soundEngine.audioContext.resume).not.toHaveBeenCalled();
        });
    });

    describe('setVolume()', () => {
        test('should set volume', () => {
            soundEngine.setVolume(0.7);
            expect(soundEngine.volume).toBe(0.7);
        });

        test('should clamp volume to 0', () => {
            soundEngine.setVolume(-0.5);
            expect(soundEngine.volume).toBe(0);
        });

        test('should clamp volume to 1', () => {
            soundEngine.setVolume(1.5);
            expect(soundEngine.volume).toBe(1);
        });

        test('should update master gain when initialized', () => {
            soundEngine.initialize();
            soundEngine.setVolume(0.8);

            expect(soundEngine.masterGain.gain.setValueAtTime).toHaveBeenCalledWith(
                0.8,
                expect.any(Number)
            );
        });

        test('should not update master gain when not initialized', () => {
            soundEngine.setVolume(0.8);
            // Should not throw
        });
    });

    describe('setEnabled()', () => {
        test('should enable audio', () => {
            soundEngine.setEnabled(true);
            expect(soundEngine.enabled).toBe(true);
        });

        test('should disable audio', () => {
            soundEngine.setEnabled(false);
            expect(soundEngine.enabled).toBe(false);
        });

        test('should set volume to 0 when disabled', () => {
            soundEngine.initialize();
            soundEngine.setEnabled(false);

            expect(soundEngine.masterGain.gain.setValueAtTime).toHaveBeenCalledWith(
                0,
                expect.any(Number)
            );
        });

        test('should restore volume when enabled', () => {
            soundEngine.initialize();
            soundEngine.volume = 0.6;
            soundEngine.setEnabled(true);

            expect(soundEngine.masterGain.gain.setValueAtTime).toHaveBeenCalledWith(
                0.6,
                expect.any(Number)
            );
        });
    });

    describe('getContext()', () => {
        test('should return audio context', () => {
            soundEngine.initialize();
            const context = soundEngine.getContext();
            expect(context).toBeDefined();
        });

        test('should return null when not initialized', () => {
            const context = soundEngine.getContext();
            expect(context).toBeNull();
        });
    });

    describe('getMasterGain()', () => {
        test('should return master gain node', () => {
            soundEngine.initialize();
            const gain = soundEngine.getMasterGain();
            expect(gain).toBeDefined();
        });

        test('should return null when not initialized', () => {
            const gain = soundEngine.getMasterGain();
            expect(gain).toBeNull();
        });
    });

    describe('isInitialized()', () => {
        test('should return false before initialization', () => {
            expect(soundEngine.isInitialized()).toBe(false);
        });

        test('should return true after initialization', () => {
            soundEngine.initialize();
            expect(soundEngine.isInitialized()).toBe(true);
        });
    });

    describe('isEnabled()', () => {
        test('should return false when not initialized', () => {
            expect(soundEngine.isEnabled()).toBe(false);
        });

        test('should return true when initialized and enabled', () => {
            soundEngine.initialize();
            expect(soundEngine.isEnabled()).toBe(true);
        });

        test('should return false when disabled', () => {
            soundEngine.initialize();
            soundEngine.enabled = false;
            expect(soundEngine.isEnabled()).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        test('should handle multiple initialize calls', () => {
            soundEngine.initialize();
            soundEngine.initialize();
            soundEngine.initialize();
            // Should not throw
        });

        test('should handle rapid volume changes', () => {
            soundEngine.initialize();
            for (let i = 0; i < 10; i++) {
                soundEngine.setVolume(Math.random());
            }
            // Should not throw
        });

        test('should handle enable/disable toggling', () => {
            soundEngine.initialize();
            for (let i = 0; i < 5; i++) {
                soundEngine.setEnabled(false);
                soundEngine.setEnabled(true);
            }
            // Should not throw
        });

        test('should handle volume at boundaries', () => {
            soundEngine.setVolume(0);
            expect(soundEngine.volume).toBe(0);

            soundEngine.setVolume(1);
            expect(soundEngine.volume).toBe(1);
        });
    });

    describe('Integration Scenarios', () => {
        test('should support typical usage flow', () => {
            // Initialize
            soundEngine.initialize();
            expect(soundEngine.isInitialized()).toBe(true);

            // Set volume
            soundEngine.setVolume(0.7);
            expect(soundEngine.volume).toBe(0.7);

            // Resume
            soundEngine.resume();

            // Get context for sound generation
            const context = soundEngine.getContext();
            expect(context).toBeDefined();
        });

        test('should handle disable during playback', () => {
            soundEngine.initialize();
            soundEngine.setVolume(0.5);

            // Simulate playback start
            const context = soundEngine.getContext();

            // Disable mid-playback
            soundEngine.setEnabled(false);
            expect(soundEngine.enabled).toBe(false);

            // Re-enable
            soundEngine.setEnabled(true);
            expect(soundEngine.enabled).toBe(true);
        });
    });
});
