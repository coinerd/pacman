/**
 * Tests for EffectOrchestrator
 */

import { EffectOrchestrator } from '../../../src/views/core/EffectOrchestrator.js';

// Mock gameConfig
jest.mock('../../../src/config/gameConfig.js', () => ({
    colors: {
        primary: 0x00ffaa,
        secondary: 0xff00ff,
        effect: {
            glow: 0x00ffaa,
            pulse: 0x00ff00
        }
    }
}));

describe('EffectOrchestrator', () => {
    let mockScene;
    let orchestrator;

    beforeEach(() => {
        mockScene = {
            scale: { width: 800, height: 600 },
            time: {
                delayedCall: jest.fn((delay, callback) => {
                    // Simulate delayed call
                    setTimeout(callback, 0);
                    return { destroy: jest.fn() };
                })
            },
            tweens: {
                add: jest.fn(() => ({ destroy: jest.fn() }))
            },
            add: {
                graphics: jest.fn(() => ({
                    fillStyle: jest.fn().mockReturnThis(),
                    fillRect: jest.fn().mockReturnThis(),
                    clear: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                circle: jest.fn(() => ({
                    setFillStyle: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                rectangle: jest.fn(() => ({
                    setFillStyle: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                }))
            },
            cameras: {
                main: {
                    shake: jest.fn(),
                    flash: jest.fn()
                }
            }
        };

        orchestrator = new EffectOrchestrator(mockScene);
    });

    describe('constructor', () => {
        test('should store scene reference', () => {
            expect(orchestrator.scene).toBe(mockScene);
        });

        test('should initialize activeEffects Map', () => {
            expect(orchestrator.activeEffects).toBeInstanceOf(Map);
        });

        test('should initialize effectIdCounter to 0', () => {
            expect(orchestrator.effectIdCounter).toBe(0);
        });

        test('should initialize effectPools Map', () => {
            expect(orchestrator.effectPools).toBeInstanceOf(Map);
        });

        test('should initialize effectQueues Map', () => {
            expect(orchestrator.effectQueues).toBeInstanceOf(Map);
        });

        test('should create presets', () => {
            expect(orchestrator.presets).toBeDefined();
        });
    });

    describe('createPresets', () => {
        test('should create pelletEaten preset', () => {
            expect(orchestrator.presets.pelletEaten).toBeDefined();
            expect(orchestrator.presets.pelletEaten.duration).toBe(200);
        });

        test('should create powerPelletEaten preset', () => {
            expect(orchestrator.presets.powerPelletEaten).toBeDefined();
            expect(orchestrator.presets.powerPelletEaten.particles).toBe(true);
        });

        test('should create ghostEaten preset', () => {
            expect(orchestrator.presets.ghostEaten).toBeDefined();
            expect(orchestrator.presets.ghostEaten.rotation).toBeDefined();
        });

        test('should create fruitEaten preset', () => {
            expect(orchestrator.presets.fruitEaten).toBeDefined();
        });

        test('should create bossDamage preset', () => {
            expect(orchestrator.presets.bossDamage).toBeDefined();
            expect(orchestrator.presets.bossDamage.flash).toBe(true);
        });

        test('should create bossDefeated preset', () => {
            expect(orchestrator.presets.bossDefeated).toBeDefined();
            expect(orchestrator.presets.bossDefeated.explosion).toBe(true);
        });

        test('should create screenFlash preset', () => {
            expect(orchestrator.presets.screenFlash).toBeDefined();
        });

        test('should create screenShake preset', () => {
            expect(orchestrator.presets.screenShake).toBeDefined();
        });
    });

    describe('play', () => {
        test('should return effect ID for valid preset', () => {
            const id = orchestrator.play('pelletEaten', 100, 100);
            expect(id).toMatch(/^effect_\d+$/);
        });

        test('should return null for invalid preset', () => {
            const id = orchestrator.play('invalidPreset', 100, 100);
            expect(id).toBeNull();
        });

        test('should add effect to activeEffects', () => {
            orchestrator.play('pelletEaten', 100, 100);
            expect(orchestrator.activeEffects.size).toBe(1);
        });

        test('should increment effectIdCounter', () => {
            orchestrator.play('pelletEaten', 100, 100);
            expect(orchestrator.effectIdCounter).toBe(1);
        });

        test('should create multiple unique effect IDs', () => {
            const id1 = orchestrator.play('pelletEaten', 100, 100);
            const id2 = orchestrator.play('pelletEaten', 200, 200);
            expect(id1).not.toBe(id2);
        });
    });

    describe('createEffect', () => {
        test('should schedule delayed cleanup', () => {
            orchestrator.createEffect({ duration: 500 });

            expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
                500,
                expect.any(Function)
            );
        });

        test('should handle particles config', () => {
            orchestrator.createEffect({ particles: true, x: 100, y: 100, duration: 100 });

            // Should create particle effect
            expect(orchestrator.activeEffects.size).toBe(1);
        });

        test('should handle flash config', () => {
            orchestrator.createEffect({ flash: true, duration: 100 });

            expect(orchestrator.activeEffects.size).toBe(1);
        });

        test('should handle shake config', () => {
            orchestrator.createEffect({
                shake: { intensity: 5, duration: 200 },
                duration: 100
            });

            expect(orchestrator.activeEffects.size).toBe(1);
        });

        test('should handle screenFlash config', () => {
            orchestrator.createEffect({ screenFlash: true, duration: 100, color: 0xff0000 });

            // createScreenFlash creates a rectangle and tweens it
            expect(mockScene.add.rectangle).toHaveBeenCalled();
        });
    });

    describe('activeEffects management', () => {
        test('should track active effects', () => {
            orchestrator.play('pelletEaten', 100, 100);
            orchestrator.play('ghostEaten', 200, 200);

            expect(orchestrator.activeEffects.size).toBe(2);
        });

        test('should store effect config in activeEffects', () => {
            orchestrator.play('pelletEaten', 100, 100);
            const effect = Array.from(orchestrator.activeEffects.values())[0];

            expect(effect.config).toBeDefined();
            expect(effect.startTime).toBeDefined();
        });
    });
});
