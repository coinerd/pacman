// tests/utils/MazeConfigLoader.test.js

import {
    MazeConfigLoader,
    mazeConfigLoader,
    PRESETS
} from '../../src/utils/MazeConfigLoader.js';

describe('MazeConfigLoader', () => {
    let loader;

    beforeEach(() => {
        loader = new MazeConfigLoader();
    });

    describe('constructor', () => {
        test('should initialize with default state', () => {
            expect(loader.customConfig).toBeNull();
            expect(loader.levelScaling).toBeDefined();
            expect(loader.levelScaling.pathDensityReduction).toBeDefined();
            expect(loader.levelScaling.deadEndIncrease).toBeDefined();
        });
    });

    describe('loadConfig', () => {
        test('should load default preset for level 1', () => {
            const config = loader.loadConfig(1, 'default');

            expect(config.meta).toBeDefined();
            expect(config.meta.name).toBe('Default');
            expect(config.dimensions).toBeDefined();
            expect(config.generation).toBeDefined();
            expect(config.rules).toBeDefined();
        });

        test('should return same structure for all presets', () => {
            const presets = ['default', 'easy', 'medium', 'hard', 'expert'];

            for (const preset of presets) {
                const config = loader.loadConfig(1, preset);

                expect(config.meta).toBeDefined();
                expect(config.dimensions).toBeDefined();
                expect(config.generation).toBeDefined();
                expect(config.rules).toBeDefined();
            }
        });

        test('should fallback to default for unknown preset', () => {
            const config = loader.loadConfig(1, 'nonexistent');

            expect(config.meta.name).toBe('Default');
        });

        test('should apply overrides correctly', () => {
            const config = loader.loadConfig(1, 'medium', {
                generation: { pathDensity: 0.9 }
            });

            expect(config.generation.pathDensity).toBe(0.9);
            // Other generation params should come from medium preset
            expect(config.generation.algorithm).toBe('dfs');
        });

        test('should include level and preset in metadata', () => {
            const config = loader.loadConfig(5, 'hard', { generation: { pathDensity: 0.5 } });

            expect(config._level).toBe(5);
            expect(config._preset).toBe('hard');
        });

        test('should default to level 1 and default preset', () => {
            const config = loader.loadConfig();

            expect(config._level).toBe(1);
            expect(config._preset).toBe('default');
        });

        test('should handle nested overrides', () => {
            const config = loader.loadConfig(1, 'easy', {
                rules: {
                    deadEnds: { maxDensity: 0.05 }
                }
            });

            expect(config.rules.deadEnds.maxDensity).toBe(0.05);
            // Other rule params should be preserved
            expect(config.rules.connectivity.minCoverage).toBe(1.0);
        });
    });

    describe('applyLevelScaling', () => {
        test('should return same config for level 1', () => {
            const baseConfig = loader.loadConfig(1, 'medium');
            const scaled = loader.applyLevelScaling(baseConfig, 1);

            // Level 1 should not scale
            expect(scaled.generation.pathDensity).toBe(baseConfig.generation.pathDensity);
        });

        test('should reduce path density at higher levels', () => {
            const level1 = loader.loadConfig(1, 'medium');
            const level10 = loader.loadConfig(10, 'medium');

            expect(level10.generation.pathDensity).toBeLessThan(level1.generation.pathDensity);
        });

        test('should increase dead end factor at higher levels', () => {
            const level1 = loader.loadConfig(1, 'medium');
            const level10 = loader.loadConfig(10, 'medium');

            expect(level10.generation.deadEndFactor).toBeGreaterThan(level1.generation.deadEndFactor);
        });

        test('should increase max corridor length at higher levels', () => {
            const level1 = loader.loadConfig(1, 'medium');
            const level10 = loader.loadConfig(10, 'medium');

            expect(level10.rules.corridors.maxLength).toBeGreaterThanOrEqual(
                level1.rules.corridors.maxLength
            );
        });

        test('should reduce alternative paths at very high levels', () => {
            const level1 = loader.loadConfig(1, 'easy');
            const level10 = loader.loadConfig(10, 'easy');

            // Easy starts with minPaths=3, level 10 should reduce it
            expect(level10.rules.alternativePaths.minPaths).toBeLessThanOrEqual(
                level1.rules.alternativePaths.minPaths
            );
        });

        test('should cap scaling at level 10', () => {
            const level10 = loader.loadConfig(10, 'medium');
            const level20 = loader.loadConfig(20, 'medium');

            // Scaling should be similar (capped)
            expect(level20.generation.pathDensity).toBeCloseTo(level10.generation.pathDensity, 4);
        });
    });

    describe('deepMerge', () => {
        test('should merge flat objects', () => {
            const target = { a: 1, b: 2 };
            const source = { b: 3, c: 4 };

            const result = loader.deepMerge(target, source);

            expect(result).toEqual({ a: 1, b: 3, c: 4 });
        });

        test('should recursively merge nested objects', () => {
            const target = { a: { x: 1, y: 2 }, b: 3 };
            const source = { a: { y: 5, z: 6 } };

            const result = loader.deepMerge(target, source);

            expect(result).toEqual({ a: { x: 1, y: 5, z: 6 }, b: 3 });
        });

        test('should replace arrays, not merge them', () => {
            const target = { arr: [1, 2, 3] };
            const source = { arr: [4, 5] };

            const result = loader.deepMerge(target, source);

            expect(result.arr).toEqual([4, 5]);
        });

        test('should not mutate target', () => {
            const target = { a: { x: 1 } };
            const source = { a: { y: 2 } };

            loader.deepMerge(target, source);

            expect(target.a).toEqual({ x: 1 });
        });
    });

    describe('validateConfig', () => {
        test('should validate correct config', () => {
            const config = loader.loadConfig(1, 'default');
            const result = loader.validateConfig(config);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should detect missing required fields', () => {
            const config = { meta: {} };

            const result = loader.validateConfig(config);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('dimensions');
            expect(result.missingFields).toContain('generation');
            expect(result.missingFields).toContain('rules');
        });

        test('should validate pathDensity range', () => {
            const config = loader.loadConfig(1, 'default');
            config.generation.pathDensity = 0.1; // Too low

            const result = loader.validateConfig(config);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('pathDensity'))).toBe(true);
        });

        test('should validate dimension ranges', () => {
            const config = loader.loadConfig(1, 'default');
            config.dimensions.width = 5; // Too small

            const result = loader.validateConfig(config);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('width'))).toBe(true);
        });

        test('should validate deadEndFactor range', () => {
            const config = loader.loadConfig(1, 'default');
            config.generation.deadEndFactor = 1.5; // Too high

            const result = loader.validateConfig(config);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('deadEndFactor'))).toBe(true);
        });
    });

    describe('listPresets', () => {
        test('should list all available presets', () => {
            const presets = loader.listPresets();

            expect(presets.length).toBe(5);
            expect(presets.map(p => p.id)).toContain('default');
            expect(presets.map(p => p.id)).toContain('easy');
            expect(presets.map(p => p.id)).toContain('medium');
            expect(presets.map(p => p.id)).toContain('hard');
            expect(presets.map(p => p.id)).toContain('expert');
        });

        test('should include preset metadata', () => {
            const presets = loader.listPresets();
            const hard = presets.find(p => p.id === 'hard');

            expect(hard.name).toBe('Hard');
            expect(hard.description).toBeDefined();
            expect(hard.difficulty).toBe('hard');
            expect(hard.riskFactor).toBe(0.7);
        });
    });

    describe('getPreset', () => {
        test('should return preset by name', () => {
            const preset = loader.getPreset('easy');

            expect(preset).toBeDefined();
            expect(preset.meta.name).toBe('Easy');
        });

        test('should return null for unknown preset', () => {
            const preset = loader.getPreset('nonexistent');

            expect(preset).toBeNull();
        });
    });

    describe('hasPreset', () => {
        test('should return true for existing presets', () => {
            expect(loader.hasPreset('default')).toBe(true);
            expect(loader.hasPreset('easy')).toBe(true);
            expect(loader.hasPreset('medium')).toBe(true);
            expect(loader.hasPreset('hard')).toBe(true);
            expect(loader.hasPreset('expert')).toBe(true);
        });

        test('should return false for unknown preset', () => {
            expect(loader.hasPreset('nonexistent')).toBe(false);
        });
    });

    describe('toGeneratorConfig', () => {
        test('should convert config to MazeGenerator format', () => {
            const config = loader.loadConfig(5, 'hard');
            const generatorConfig = loader.toGeneratorConfig(config);

            expect(generatorConfig.width).toBe(25);
            expect(generatorConfig.height).toBe(33);
            expect(generatorConfig.pathDensity).toBeDefined();
            expect(generatorConfig.maxRetries).toBeDefined();
        });

        test('should preserve preset metadata', () => {
            const config = loader.loadConfig(3, 'medium');
            const generatorConfig = loader.toGeneratorConfig(config);

            expect(generatorConfig._preset).toBe('medium');
            expect(generatorConfig._level).toBe(3);
        });

        test('should use defaults for missing fields', () => {
            const config = { dimensions: {}, generation: {}, rules: {} };
            const generatorConfig = loader.toGeneratorConfig(config);

            expect(generatorConfig.width).toBe(25);
            expect(generatorConfig.height).toBe(33);
            expect(generatorConfig.pathDensity).toBe(0.7);
        });
    });

    describe('customConfig', () => {
        test('should save and load custom config', () => {
            const custom = loader.loadConfig(1, 'hard');

            loader.saveCustomConfig(custom);
            const loaded = loader.loadCustomConfig();

            expect(loaded).toEqual(custom);
        });

        test('should clear custom config', () => {
            const custom = loader.loadConfig(1, 'easy');
            loader.saveCustomConfig(custom);

            loader.clearCustomConfig();

            expect(loader.customConfig).toBeNull();
        });
    });

    describe('setLevelScaling', () => {
        test('should update scaling parameters', () => {
            loader.setLevelScaling({ pathDensityReduction: 0.3 });

            expect(loader.levelScaling.pathDensityReduction).toBe(0.3);
        });

        test('should preserve existing parameters', () => {
            const originalDeadEnd = loader.levelScaling.deadEndIncrease;

            loader.setLevelScaling({ pathDensityReduction: 0.3 });

            expect(loader.levelScaling.deadEndIncrease).toBe(originalDeadEnd);
        });
    });

    describe('getDefaultConfig', () => {
        test('should return a copy of default config', () => {
            const default1 = loader.getDefaultConfig();
            const default2 = loader.getDefaultConfig();

            default1.meta.name = 'Modified';

            expect(default2.meta.name).toBe('Default');
        });
    });
});

describe('mazeConfigLoader (singleton)', () => {
    test('should be an instance of MazeConfigLoader', () => {
        expect(mazeConfigLoader).toBeInstanceOf(MazeConfigLoader);
    });

    test('should provide same functionality as new instance', () => {
        const config = mazeConfigLoader.loadConfig(1, 'default');

        expect(config.meta).toBeDefined();
        expect(config.generation).toBeDefined();
    });
});

describe('PRESETS export', () => {
    test('should contain all preset configurations', () => {
        expect(PRESETS.default).toBeDefined();
        expect(PRESETS.easy).toBeDefined();
        expect(PRESETS.medium).toBeDefined();
        expect(PRESETS.hard).toBeDefined();
        expect(PRESETS.expert).toBeDefined();
    });

    test('should have valid structure for each preset', () => {
        for (const preset of Object.values(PRESETS)) {
            expect(preset.meta).toBeDefined();
            expect(preset.dimensions).toBeDefined();
            expect(preset.generation).toBeDefined();
            expect(preset.rules).toBeDefined();
        }
    });
});

describe('Preset difficulty progression', () => {
    test('path density should decrease with difficulty', () => {
        const loader = new MazeConfigLoader();
        const easy = loader.loadConfig(1, 'easy');
        const medium = loader.loadConfig(1, 'medium');
        const hard = loader.loadConfig(1, 'hard');
        const expert = loader.loadConfig(1, 'expert');

        expect(easy.generation.pathDensity).toBeGreaterThan(medium.generation.pathDensity);
        expect(medium.generation.pathDensity).toBeGreaterThan(hard.generation.pathDensity);
        expect(hard.generation.pathDensity).toBeGreaterThan(expert.generation.pathDensity);
    });

    test('dead end factor should increase with difficulty', () => {
        const loader = new MazeConfigLoader();
        const easy = loader.loadConfig(1, 'easy');
        const medium = loader.loadConfig(1, 'medium');
        const hard = loader.loadConfig(1, 'hard');
        const expert = loader.loadConfig(1, 'expert');

        expect(easy.generation.deadEndFactor).toBeLessThan(medium.generation.deadEndFactor);
        expect(medium.generation.deadEndFactor).toBeLessThan(hard.generation.deadEndFactor);
        expect(hard.generation.deadEndFactor).toBeLessThan(expert.generation.deadEndFactor);
    });

    test('risk factor should increase with difficulty', () => {
        const loader = new MazeConfigLoader();
        const easy = loader.loadConfig(1, 'easy');
        const medium = loader.loadConfig(1, 'medium');
        const hard = loader.loadConfig(1, 'hard');
        const expert = loader.loadConfig(1, 'expert');

        expect(easy.difficulty.riskFactor).toBeLessThan(medium.difficulty.riskFactor);
        expect(medium.difficulty.riskFactor).toBeLessThan(hard.difficulty.riskFactor);
        expect(hard.difficulty.riskFactor).toBeLessThan(expert.difficulty.riskFactor);
    });
});
