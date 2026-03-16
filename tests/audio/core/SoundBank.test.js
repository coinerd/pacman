/**
 * SoundBank Tests
 * Tests for sound configuration and asset management
 */

import { SoundBank } from '../../../src/audio/core/SoundBank.js';

describe('SoundBank', () => {
    let soundBank;

    beforeEach(() => {
        soundBank = new SoundBank();
    });

    afterEach(() => {
        soundBank = null;
    });

    describe('Constructor', () => {
        test('should initialize with default configurations', () => {
            expect(soundBank.soundConfig).toBeDefined();
            expect(soundBank.enemyModeConfig).toBeDefined();
            expect(soundBank.circuitHumConfig).toBeDefined();
            expect(soundBank.glitchConfig).toBeDefined();
        });
    });

    describe('getDefaultSoundConfig()', () => {
        test('should return sound configuration object', () => {
            const config = soundBank.getDefaultSoundConfig();
            expect(config).toBeDefined();
            expect(typeof config).toBe('object');
        });

        test('should include waka sound config', () => {
            const config = soundBank.getDefaultSoundConfig();
            expect(config.waka).toBeDefined();
            expect(config.waka.baseFreq).toBeDefined();
            expect(config.waka.duration).toBeDefined();
        });

        test('should include eat sound config', () => {
            const config = soundBank.getDefaultSoundConfig();
            expect(config.eat).toBeDefined();
            expect(config.eat.baseFreq).toBeDefined();
        });

        test('should include power sound config', () => {
            const config = soundBank.getDefaultSoundConfig();
            expect(config.power).toBeDefined();
            expect(config.power.startFreq).toBeDefined();
            expect(config.power.endFreq).toBeDefined();
        });

        test('should include death sound config', () => {
            const config = soundBank.getDefaultSoundConfig();
            expect(config.death).toBeDefined();
            expect(config.death.startFreq).toBeDefined();
            expect(config.death.endFreq).toBeDefined();
        });

        test('should include ghostEaten sound config', () => {
            const config = soundBank.getDefaultSoundConfig();
            expect(config.ghostEaten).toBeDefined();
        });

        test('should include levelComplete sound config', () => {
            const config = soundBank.getDefaultSoundConfig();
            expect(config.levelComplete).toBeDefined();
            expect(config.levelComplete.frequencies).toBeDefined();
        });

        test('should include fruit sound config', () => {
            const config = soundBank.getDefaultSoundConfig();
            expect(config.fruit).toBeDefined();
        });
    });

    describe('getSoundConfig()', () => {
        test('should return config for valid sound name', () => {
            const config = soundBank.getSoundConfig('waka');
            expect(config).toBeDefined();
            expect(config.baseFreq).toBe(400);
        });

        test('should return undefined for invalid sound name', () => {
            const config = soundBank.getSoundConfig('nonexistent');
            expect(config).toBeUndefined();
        });

        test('should return eat sound config', () => {
            const config = soundBank.getSoundConfig('eat');
            expect(config).toBeDefined();
            expect(config.baseFreq).toBe(600);
        });

        test('should return power sound config', () => {
            const config = soundBank.getSoundConfig('power');
            expect(config).toBeDefined();
            expect(config.startFreq).toBe(300);
            expect(config.endFreq).toBe(1200);
        });

        test('should return death sound config', () => {
            const config = soundBank.getSoundConfig('death');
            expect(config).toBeDefined();
            expect(config.startFreq).toBe(800);
            expect(config.endFreq).toBe(50);
        });
    });

    describe('getDefaultEnemyModeConfig()', () => {
        test('should return enemy mode configuration', () => {
            const config = soundBank.getDefaultEnemyModeConfig();
            expect(config).toBeDefined();
            expect(typeof config).toBe('object');
        });

        test('should include mode configurations', () => {
            const config = soundBank.getDefaultEnemyModeConfig();
            // Structure depends on implementation
            expect(config).toBeDefined();
        });
    });

    describe('getDefaultCircuitHumConfig()', () => {
        test('should return circuit hum configuration', () => {
            const config = soundBank.getDefaultCircuitHumConfig();
            expect(config).toBeDefined();
            expect(typeof config).toBe('object');
        });
    });

    describe('getDefaultGlitchConfig()', () => {
        test('should return glitch configuration', () => {
            const config = soundBank.getDefaultGlitchConfig();
            expect(config).toBeDefined();
            expect(typeof config).toBe('object');
        });
    });

    describe('Sound Configuration Structure', () => {
        test('waka config should have required properties', () => {
            const config = soundBank.getSoundConfig('waka');
            expect(config).toHaveProperty('baseFreq');
            expect(config).toHaveProperty('variance');
            expect(config).toHaveProperty('duration');
            expect(config).toHaveProperty('wave');
        });

        test('power config should have frequency sweep properties', () => {
            const config = soundBank.getSoundConfig('power');
            expect(config).toHaveProperty('startFreq');
            expect(config).toHaveProperty('endFreq');
            expect(config).toHaveProperty('duration');
        });

        test('levelComplete config should have frequencies array', () => {
            const config = soundBank.getSoundConfig('levelComplete');
            expect(config).toHaveProperty('frequencies');
            expect(Array.isArray(config.frequencies)).toBe(true);
        });

        test('death config should have glitch property', () => {
            const config = soundBank.getSoundConfig('death');
            expect(config).toHaveProperty('glitch');
        });
    });

    describe('Configuration Validation', () => {
        test('all sound configs should have duration', () => {
            const config = soundBank.getDefaultSoundConfig();
            const sounds = Object.keys(config);

            sounds.forEach(soundName => {
                const soundConfig = config[soundName];
                if (soundConfig.duration !== undefined) {
                    expect(typeof soundConfig.duration).toBe('number');
                    expect(soundConfig.duration).toBeGreaterThan(0);
                }
            });
        });

        test('baseFreq should be positive number', () => {
            const config = soundBank.getDefaultSoundConfig();
            const soundsWithBaseFreq = ['waka', 'eat', 'ghostEaten', 'fruit'];

            soundsWithBaseFreq.forEach(soundName => {
                const soundConfig = config[soundName];
                if (soundConfig && soundConfig.baseFreq !== undefined) {
                    expect(typeof soundConfig.baseFreq).toBe('number');
                    expect(soundConfig.baseFreq).toBeGreaterThan(0);
                }
            });
        });

        test('frequency sweep should have start < end for ascending', () => {
            const powerConfig = soundBank.getSoundConfig('power');
            expect(powerConfig.startFreq).toBeLessThan(powerConfig.endFreq);
        });

        test('frequency sweep should have start > end for descending', () => {
            const deathConfig = soundBank.getSoundConfig('death');
            expect(deathConfig.startFreq).toBeGreaterThan(deathConfig.endFreq);
        });
    });

    describe('Edge Cases', () => {
        test('should handle multiple getSoundConfig calls', () => {
            for (let i = 0; i < 10; i++) {
                soundBank.getSoundConfig('waka');
            }
            // Should not throw
        });

        test('should handle empty sound name', () => {
            const config = soundBank.getSoundConfig('');
            expect(config).toBeUndefined();
        });

        test('should handle null sound name', () => {
            const config = soundBank.getSoundConfig(null);
            expect(config).toBeUndefined();
        });

        test('should handle numeric sound name', () => {
            const config = soundBank.getSoundConfig(123);
            expect(config).toBeUndefined();
        });
    });

    describe('Performance', () => {
        test('should handle rapid config lookups', () => {
            const sounds = ['waka', 'eat', 'power', 'death', 'ghostEaten', 'levelComplete', 'fruit'];

            for (let i = 0; i < 100; i++) {
                sounds.forEach(sound => {
                    soundBank.getSoundConfig(sound);
                });
            }
            // Should not throw
        });
    });

    describe('Integration Scenarios', () => {
        test('should provide all necessary configs for game sounds', () => {
            const requiredSounds = ['waka', 'eat', 'power', 'death', 'ghostEaten', 'levelComplete', 'fruit'];

            requiredSounds.forEach(sound => {
                const config = soundBank.getSoundConfig(sound);
                expect(config).toBeDefined();
            });
        });
    });
});
