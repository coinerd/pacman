/**
 * Tests for TechSoundManager
 */

import { TechSoundManager } from '../../src/managers/TechSoundManager.js';

// Mock dependencies
jest.mock('../../src/audio/core/SoundEngine.js');
jest.mock('../../src/audio/core/SoundBank.js');
jest.mock('../../src/audio/generators/SoundBuilder.js');

import { SoundEngine } from '../../src/audio/core/SoundEngine.js';
import { SoundBank } from '../../src/audio/core/SoundBank.js';
import { SoundBuilder } from '../../src/audio/generators/SoundBuilder.js';

describe('TechSoundManager', () => {
    let mockScene;
    let techSoundManager;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock scene
        mockScene = {};

        // Mock SoundEngine
        SoundEngine.mockImplementation(() => ({
            initialize: jest.fn(),
            isInitialized: jest.fn(() => true),
            getContext: jest.fn(() => ({})),
            resume: jest.fn(),
            setVolume: jest.fn(),
            isEnabled: jest.fn(() => true),
            setEnabled: jest.fn()
        }));

        // Mock SoundBank
        SoundBank.mockImplementation(() => ({
            getSoundConfig: jest.fn((name) => ({
                baseFreq: 440,
                duration: 0.1
            }))
        }));

        // Mock SoundBuilder
        SoundBuilder.mockImplementation(() => ({
            buildSound: jest.fn()
        }));

        techSoundManager = new TechSoundManager(mockScene);
    });

    describe('constructor', () => {
        test('should store scene reference', () => {
            expect(techSoundManager.scene).toBe(mockScene);
        });

        test('should create SoundEngine instance', () => {
            expect(SoundEngine).toHaveBeenCalled();
        });

        test('should create SoundBank instance', () => {
            expect(SoundBank).toHaveBeenCalled();
        });

        test('should initialize with default sound profile', () => {
            expect(techSoundManager.soundProfile).toBe('tech');
        });

        test('should not be initialized by default', () => {
            expect(techSoundManager.initialized).toBe(false);
        });

        test('should have null soundBuilder initially', () => {
            expect(techSoundManager.soundBuilder).toBeNull();
        });
    });

    describe('initialize', () => {
        test('should call soundEngine.initialize', () => {
            techSoundManager.initialize();

            expect(techSoundManager.soundEngine.initialize).toHaveBeenCalled();
        });

        test('should set initialized flag from soundEngine', () => {
            techSoundManager.initialize();

            expect(techSoundManager.initialized).toBe(true);
        });

        test('should create SoundBuilder when initialized', () => {
            techSoundManager.initialize();

            expect(SoundBuilder).toHaveBeenCalled();
            expect(techSoundManager.soundBuilder).toBeDefined();
        });
    });

    describe('resume', () => {
        test('should call soundEngine.resume', () => {
            techSoundManager.resume();

            expect(techSoundManager.soundEngine.resume).toHaveBeenCalled();
        });
    });

    describe('setVolume', () => {
        test('should call soundEngine.setVolume', () => {
            techSoundManager.setVolume(0.5);

            expect(techSoundManager.soundEngine.setVolume).toHaveBeenCalledWith(0.5);
        });
    });

    describe('setEnabled', () => {
        test('should call soundEngine.setEnabled', () => {
            techSoundManager.setEnabled(false);

            expect(techSoundManager.soundEngine.setEnabled).toHaveBeenCalledWith(false);
        });
    });

    describe('setSoundProfile', () => {
        test('should update sound profile', () => {
            techSoundManager.setSoundProfile('classic');

            expect(techSoundManager.soundProfile).toBe('classic');
        });
    });

    describe('playWakaWaka', () => {
        test('should build tone sound when enabled and initialized', () => {
            techSoundManager.initialize();
            techSoundManager.playWakaWaka();

            expect(techSoundManager.soundBuilder.buildSound).toHaveBeenCalled();
        });

        test('should not build sound when not initialized', () => {
            techSoundManager.playWakaWaka();

            expect(techSoundManager.soundBuilder).toBeNull();
        });
    });

    describe('playEat', () => {
        test('should build tone sound when enabled', () => {
            techSoundManager.initialize();
            techSoundManager.playEat();

            expect(techSoundManager.soundBuilder.buildSound).toHaveBeenCalled();
        });
    });

    describe('playPowerPellet', () => {
        test('should build sweep sound', () => {
            techSoundManager.initialize();
            techSoundManager.playPowerPellet();

            expect(techSoundManager.soundBuilder.buildSound).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'sweep' }),
                0.4
            );
        });
    });

    describe('playDeath', () => {
        test('should build sweep sound with glitch', () => {
            techSoundManager.initialize();
            techSoundManager.playDeath();

            expect(techSoundManager.soundBuilder.buildSound).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'sweep' }),
                0.5
            );
        });
    });

    describe('playLevelComplete', () => {
        test('should build melody sound', () => {
            techSoundManager.initialize();
            techSoundManager.playLevelComplete();

            expect(techSoundManager.soundBuilder.buildSound).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'melody' }),
                0.5
            );
        });
    });
});
