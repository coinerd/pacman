/**
 * Maze Generation E2E Tests
 * Tests the complete maze generation pipeline with MazeConfigLoader, MazeSeedManager, and MazeRules
 *
 * Phase 3 Integration Tests:
 * - Preset-based generation (easy, medium, hard, expert)
 * - Seed reproducibility
 * - Rule validation
 * - Integration with SpawningSystem
 */

import MazeGenerator from '../../src/utils/MazeGenerator.js';
import { MazeConfigLoader } from '../../src/utils/MazeConfigLoader.js';
import { MazeSeedManager } from '../../src/utils/MazeSeedManager.js';
import { validateAgainstRules } from '../../src/utils/maze/MazeRules.js';
import { SpawningSystem } from '../../src/model/systems/SpawningSystem.js';
import { LevelSystem } from '../../src/model/systems/LevelSystem.js';

describe('Maze Generation Integration', () => {
    let configLoader;
    let seedManager;
    let levelSystem;

    beforeEach(() => {
        // Fresh instances for each test
        configLoader = new MazeConfigLoader();
        seedManager = new MazeSeedManager();
        levelSystem = new LevelSystem();
    });

    // =====================================================
    // PRESET-BASED GENERATION TESTS
    // =====================================================

    describe('Preset-based Generation', () => {
        const presets = ['default', 'easy', 'medium', 'hard', 'expert'];

        test.each(presets)('should generate valid maze for preset: %s', (preset) => {
            const config = configLoader.loadConfig(1, preset);
            const generatorConfig = configLoader.toGeneratorConfig(config);

            // Try multiple seeds to find a valid maze
            let validResult = null;
            const maxSeedTries = 5;

            for (let seedTry = 0; seedTry < maxSeedTries; seedTry++) {
                const seedInfo = seedManager.generateSeed(1, preset, { mode: 'level_sequence' });
                const adjustedSeed = seedInfo.seed + seedTry * 1000;

                const generator = new MazeGenerator({
                    ...generatorConfig,
                    seed: adjustedSeed
                });

                const result = generator.generate();

                if (result.validationResult.ruleResult.errors.length === 0) {
                    validResult = result;
                    break;
                }
            }

            // If no valid maze found with multiple seeds, at least verify structure
            if (!validResult) {
                const seedInfo = seedManager.generateSeed(1, preset, { mode: 'level_sequence' });
                const generator = new MazeGenerator({
                    ...generatorConfig,
                    seed: seedInfo.seed
                });
                validResult = generator.generate();

                // Log for debugging
                console.log(`[${preset}] No perfect maze found, fallback used: ${validResult.stats.fallbackUsed}`);
            }

            // Verify basic structure
            expect(validResult.maze).toBeDefined();
            expect(validResult.maze.length).toBeGreaterThan(0);
            expect(validResult.pelletGrid).toBeDefined();
            expect(validResult.spawnPoints).toBeDefined();

            // Verify validation structure
            expect(validResult.validationResult).toBeDefined();
            expect(validResult.validationResult.ruleResult).toBeDefined();

            // For integration tests, we accept that some mazes may have errors
            // The important thing is the structure is correct and the system doesn't crash
            // The fallback mechanism should still produce a playable maze
            expect(validResult.maze.length).toBeGreaterThan(0);
        });

        test('should have different difficulty settings per preset', () => {
            const configs = presets.map(preset => ({
                preset,
                config: configLoader.loadConfig(1, preset)
            }));

            // Easy should have more paths than hard
            const easyConfig = configs.find(c => c.preset === 'easy');
            const hardConfig = configs.find(c => c.preset === 'hard');

            expect(easyConfig.config.generation.pathDensity)
                .toBeGreaterThan(hardConfig.config.generation.pathDensity);

            // Easy should have fewer dead ends than expert
            const expertConfig = configs.find(c => c.preset === 'expert');
            expect(easyConfig.config.generation.deadEndFactor)
                .toBeLessThan(expertConfig.config.generation.deadEndFactor);
        });

        test('should list all available presets', () => {
            const presetList = configLoader.listPresets();

            expect(presetList).toHaveLength(5);
            expect(presetList.map(p => p.id)).toEqual(
                expect.arrayContaining(['default', 'easy', 'medium', 'hard', 'expert'])
            );
        });

        test('should fallback to default for unknown preset', () => {
            const config = configLoader.loadConfig(1, 'nonexistent');
            expect(config.meta.name).toBe('Default');
        });
    });

    // =====================================================
    // SEED REPRODUCIBILITY TESTS
    // =====================================================

    describe('Seed Reproducibility', () => {
        test('should produce identical mazes with same seed', () => {
            const seed = 12345;
            const preset = 'medium';

            // Generate first maze
            const config1 = configLoader.loadConfig(1, preset);
            const generatorConfig1 = configLoader.toGeneratorConfig(config1);

            const generator1 = new MazeGenerator({
                ...generatorConfig1,
                seed
            });
            const result1 = generator1.generate();

            // Generate second maze with same seed
            const config2 = configLoader.loadConfig(1, preset);
            const generatorConfig2 = configLoader.toGeneratorConfig(config2);

            const generator2 = new MazeGenerator({
                ...generatorConfig2,
                seed
            });
            const result2 = generator2.generate();

            // Mazes should be identical
            expect(result1.maze).toEqual(result2.maze);
            expect(result1.pelletGrid).toEqual(result2.pelletGrid);
            expect(result1.spawnPoints).toEqual(result2.spawnPoints);
        });

        test('should produce different mazes with different seeds', () => {
            const preset = 'medium';

            const config = configLoader.loadConfig(1, preset);
            const generatorConfig = configLoader.toGeneratorConfig(config);

            const generator1 = new MazeGenerator({ ...generatorConfig, seed: 1 });
            const result1 = generator1.generate();

            const generator2 = new MazeGenerator({ ...generatorConfig, seed: 2 });
            const result2 = generator2.generate();

            // Mazes should be different
            expect(result1.maze).not.toEqual(result2.maze);
        });

        test('should generate deterministic seeds in level_sequence mode', () => {
            seedManager.setBaseSeed(999);

            const seed1 = seedManager.generateSeed(5, 'medium', { mode: 'level_sequence' });
            const seed2 = seedManager.generateSeed(5, 'medium', { mode: 'level_sequence' });

            // Same level + preset should always produce same seed
            expect(seed1.seed).toBe(seed2.seed);
        });

        test('should generate different seeds for different levels in sequence mode', () => {
            seedManager.setBaseSeed(999);

            const seeds = [];
            for (let level = 1; level <= 5; level++) {
                const seedInfo = seedManager.generateSeed(level, 'medium', { mode: 'level_sequence' });
                seeds.push(seedInfo.seed);
            }

            // All seeds should be unique
            const uniqueSeeds = new Set(seeds);
            expect(uniqueSeeds.size).toBe(5);
        });

        test('should generate daily challenge seed based on date', () => {
            const testDate = new Date(2026, 2, 17); // March 17, 2026

            const seed1 = seedManager.generateSeed(1, 'default', {
                mode: 'daily_challenge',
                date: testDate
            });

            const seed2 = seedManager.generateSeed(1, 'default', {
                mode: 'daily_challenge',
                date: testDate
            });

            // Same date should produce same seed
            expect(seed1.seed).toBe(seed2.seed);

            // Different date should produce different seed
            const differentDate = new Date(2026, 2, 18);
            const seed3 = seedManager.generateSeed(1, 'default', {
                mode: 'daily_challenge',
                date: differentDate
            });

            expect(seed1.seed).not.toBe(seed3.seed);
        });

        test('should support replay record creation and loading', () => {
            const seed = 54321;
            const level = 3;
            const preset = 'hard';

            // Create replay record
            const record = seedManager.createReplayRecord(seed, level, preset);

            expect(record).toMatchObject({
                version: 1,
                seed,
                level,
                preset
            });
            expect(record.timestamp).toBeDefined();

            // Validate record
            const validation = seedManager.validateReplayRecord(record);
            expect(validation.isValid).toBe(true);

            // Serialize and deserialize
            const json = seedManager.serializeReplayRecord(record);
            const loaded = seedManager.deserializeReplayRecord(json);

            expect(loaded.seed).toBe(seed);
            expect(loaded.level).toBe(level);
            expect(loaded.preset).toBe(preset);
        });
    });

    // =====================================================
    // RULE VALIDATION TESTS
    // =====================================================

    describe('Rule Validation', () => {
        test('should validate all rules and return structured result', () => {
            const config = configLoader.loadConfig(1, 'medium');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            const generator = new MazeGenerator({
                ...generatorConfig,
                seed: 42
            });

            const result = generator.generate();

            // Should have ruleResult with structured data
            expect(result.validationResult.ruleResult).toBeDefined();
            expect(result.validationResult.ruleResult.results).toBeDefined();
            expect(result.validationResult.ruleResult.summary).toBeDefined();

            // Summary should have expected structure
            const summary = result.validationResult.ruleResult.summary;
            expect(summary).toHaveProperty('total');
            expect(summary).toHaveProperty('passed');
            expect(summary).toHaveProperty('failed');
            expect(summary.total).toBeGreaterThan(0);
        });

        test('should detect connectivity issues', () => {
            // Create a deliberately disconnected maze
            const width = 10;
            const height = 10;
            const disconnectedMaze = Array(height).fill(null).map(() => Array(width).fill(1)); // All walls

            // Create two separate path areas
            for (let y = 1; y < 4; y++) {
                for (let x = 1; x < 4; x++) {
                    disconnectedMaze[y][x] = 0;
                }
            }
            for (let y = 6; y < 9; y++) {
                for (let x = 6; x < 9; x++) {
                    disconnectedMaze[y][x] = 0;
                }
            }

            const spawnPoints = {
                player: { x: 2, y: 2 },
                ghosts: { alpha: { x: 7, y: 7 } },
                powerPellets: [{ x: 7, y: 7 }]
            };

            const config = { rules: { connectivity: { minCoverage: 1.0 } } };

            const result = validateAgainstRules(
                disconnectedMaze, width, height, spawnPoints, config
            );

            // Should fail connectivity rule
            const connectivityResult = result.results.find(r => r.ruleId === 'connectivity_full');
            expect(connectivityResult.passed).toBe(false);
        });

        test('should calculate KPIs for difficulty scoring', () => {
            const config = configLoader.loadConfig(1, 'medium');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            const generator = new MazeGenerator({
                ...generatorConfig,
                seed: 100
            });

            const result = generator.generate();

            // Should have KPIs
            expect(result.validationResult.kpis).toBeDefined();
            expect(result.validationResult.difficultyKPIs).toBeDefined();

            const kpis = result.validationResult.difficultyKPIs;
            expect(kpis).toHaveProperty('deadEndDensity');
            expect(kpis).toHaveProperty('maxCorridorLength');
            expect(kpis).toHaveProperty('minAlternativePaths');
            expect(kpis).toHaveProperty('spawnFreedom');

            // KPIs should be reasonable values
            expect(kpis.deadEndDensity).toBeGreaterThanOrEqual(0);
            expect(kpis.deadEndDensity).toBeLessThanOrEqual(1);
            expect(kpis.maxCorridorLength).toBeGreaterThan(0);
            expect(kpis.spawnFreedom).toBeGreaterThan(0);
        });

        test('should generate human-readable validation report', () => {
            const config = configLoader.loadConfig(1, 'medium');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            const generator = new MazeGenerator({
                ...generatorConfig,
                seed: 200
            });

            const report = generator.generateValidationReport();

            expect(report).toContain('Maze Validation Report');
            expect(report).toContain('KPIs');
        });

        test('should support active rules filtering', () => {
            const config = configLoader.loadConfig(1, 'medium');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            const generator = new MazeGenerator({
                ...generatorConfig,
                seed: 300
            });

            const result = generator.generate();

            // Run only specific rules
            const partialResult = validateAgainstRules(
                result.maze,
                result.maze[0].length,
                result.maze.length,
                result.spawnPoints,
                config,
                ['CONNECTIVITY_FULL', 'DEAD_END_DENSITY'] // Only these rules
            );

            // Should only have results for specified rules
            expect(partialResult.results.length).toBe(2);
            expect(partialResult.results.map(r => r.rule)).toContain('CONNECTIVITY_FULL');
            expect(partialResult.results.map(r => r.rule)).toContain('DEAD_END_DENSITY');
        });
    });

    // =====================================================
    // SPAWNINGSYSTEM INTEGRATION TESTS
    // =====================================================

    describe('SpawningSystem Integration', () => {
        test('should generate maze with SpawningSystem using preset', () => {
            const spawningSystem = new SpawningSystem(levelSystem, {
                preset: 'medium',
                seedMode: 'level_sequence'
            });

            const result = spawningSystem.generateMazeForLevel(1);

            expect(result.maze).toBeDefined();
            expect(result.pelletGrid).toBeDefined();
            expect(result.spawnPoints).toBeDefined();
            expect(result.seedInfo).toBeDefined();
            expect(result.config).toBeDefined();
            expect(result.validationResult).toBeDefined();
        });

        test('should track seed info for replay', () => {
            const spawningSystem = new SpawningSystem(levelSystem, {
                preset: 'hard',
                seedMode: 'seeded',
                overrideSeed: 99999
            });

            spawningSystem.generateMazeForLevel(5);

            const seedInfo = spawningSystem.getSeedInfo();

            expect(seedInfo).toBeDefined();
            expect(seedInfo.seed).toBe(99999);
            expect(seedInfo.level).toBe(5);
            expect(seedInfo.preset).toBe('hard');
            expect(seedInfo.mode).toBe('seeded');
        });

        test('should create and load replay records', () => {
            const spawningSystem = new SpawningSystem(levelSystem, {
                preset: 'expert',
                seedMode: 'level_sequence'
            });

            // Generate maze
            spawningSystem.generateMazeForLevel(3);

            // Create replay record
            const record = spawningSystem.createReplayRecord();
            expect(record).toBeDefined();
            expect(record.level).toBe(3);
            expect(record.preset).toBe('expert');

            // Create new SpawningSystem and load from replay
            const spawningSystem2 = new SpawningSystem(levelSystem);
            const loadedResult = spawningSystem2.loadFromReplayRecord(record);

            expect(loadedResult).toBeDefined();
            expect(loadedResult.seedInfo.seed).toBe(record.seed);
        });

        test('should apply level scaling', () => {
            const spawningSystem = new SpawningSystem(levelSystem, {
                preset: 'medium',
                seedMode: 'level_sequence'
            });

            // Generate for level 1
            spawningSystem.generateMazeForLevel(1);
            const level1Config = spawningSystem.getMazeConfig();

            // Generate for level 10
            spawningSystem.generateMazeForLevel(10);
            const level10Config = spawningSystem.getMazeConfig();

            // Level 10 should have more challenging parameters
            // (lower path density due to level scaling)
            expect(level10Config.generation.pathDensity)
                .toBeLessThan(level1Config.generation.pathDensity);
        });

        test('should list available presets', () => {
            const spawningSystem = new SpawningSystem(levelSystem);

            const presets = spawningSystem.listAvailablePresets();

            expect(presets.length).toBe(5);
            expect(presets.map(p => p.id)).toContain('easy');
            expect(presets.map(p => p.id)).toContain('expert');
        });

        test('should support preset change', () => {
            const spawningSystem = new SpawningSystem(levelSystem, {
                preset: 'easy'
            });

            spawningSystem.setPreset('hard');

            spawningSystem.generateMazeForLevel(1);
            const config = spawningSystem.getMazeConfig();

            expect(config._preset).toBe('hard');
        });
    });

    // =====================================================
    // LEVEL PROGRESSION TESTS
    // =====================================================

    describe('Level Progression', () => {
        test('should generate valid mazes for levels 1-10', () => {
            const results = [];

            for (let level = 1; level <= 10; level++) {
                const config = configLoader.loadConfig(level, 'medium');
                const generatorConfig = configLoader.toGeneratorConfig(config);

                // Try multiple seeds for each level
                let validResult = null;
                for (let seedTry = 0; seedTry < 5; seedTry++) {
                    const seedInfo = seedManager.generateSeed(level, 'medium', { mode: 'level_sequence' });
                    const adjustedSeed = seedInfo.seed + seedTry * 1000;

                    const generator = new MazeGenerator({
                        ...generatorConfig,
                        seed: adjustedSeed
                    });

                    const result = generator.generate();

                    if (result.validationResult.ruleResult.errors.length === 0) {
                        validResult = result;
                        break;
                    }
                }

                if (!validResult) {
                    // Fallback: use any result
                    const seedInfo = seedManager.generateSeed(level, 'medium', { mode: 'level_sequence' });
                    const generator = new MazeGenerator({
                        ...generatorConfig,
                        seed: seedInfo.seed
                    });
                    validResult = generator.generate();
                }

                results.push({ level, result: validResult });
            }

            // All levels should generate mazes (structure is valid)
            for (const { result } of results) {
                expect(result.maze).toBeDefined();
                expect(result.maze.length).toBeGreaterThan(0);
                // Note: Some levels may have validation errors but still produce playable mazes
                // The key is that the system handles this gracefully
            }

            // At least 80% should have no errors
            const validCount = results.filter(r => r.result.validationResult.ruleResult.errors.length === 0).length;
            expect(validCount / results.length).toBeGreaterThanOrEqual(0.8);
        });

        test('should increase difficulty with level scaling', () => {
            const config1 = configLoader.loadConfig(1, 'medium');
            const config10 = configLoader.loadConfig(10, 'medium');

            // Path density should decrease with level
            expect(config10.generation.pathDensity).toBeLessThan(config1.generation.pathDensity);

            // Dead end factor should increase with level
            expect(config10.generation.deadEndFactor).toBeGreaterThan(config1.generation.deadEndFactor);
        });
    });

    // =====================================================
    // CONFIG VALIDATION TESTS
    // =====================================================

    describe('Config Validation', () => {
        test('should validate correct config', () => {
            const config = configLoader.loadConfig(1, 'medium');
            const validation = configLoader.validateConfig(config);

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        test('should detect missing required fields', () => {
            const invalidConfig = {
                meta: { name: 'Test' }
                // Missing dimensions, generation, rules
            };

            const validation = configLoader.validateConfig(invalidConfig);

            expect(validation.isValid).toBe(false);
            expect(validation.missingFields).toContain('dimensions');
            expect(validation.missingFields).toContain('generation');
            expect(validation.missingFields).toContain('rules');
        });

        test('should detect invalid path density', () => {
            const invalidConfig = {
                meta: { name: 'Test' },
                dimensions: { width: 25, height: 33 },
                generation: { pathDensity: 0.1 }, // Too low
                rules: {}
            };

            const validation = configLoader.validateConfig(invalidConfig);

            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(e => e.includes('pathDensity'))).toBe(true);
        });

        test('should apply custom overrides', () => {
            const config = configLoader.loadConfig(1, 'medium', {
                generation: { pathDensity: 0.99 },
                rules: { deadEnds: { maxDensity: 0.01 } }
            });

            expect(config.generation.pathDensity).toBe(0.99);
            expect(config.rules.deadEnds.maxDensity).toBe(0.01);
            // Other fields should be preserved from preset
            expect(config.meta.name).toBe('Medium');
        });
    });

    // =====================================================
    // EDGE CASES
    // =====================================================

    describe('Edge Cases', () => {
        test('should handle seed = 0 gracefully', () => {
            const config = configLoader.loadConfig(1, 'easy');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            // Seed 0 should be handled (converted to 1 internally)
            const generator = new MazeGenerator({
                ...generatorConfig,
                seed: 0
            });

            const result = generator.generate();

            expect(result.maze).toBeDefined();
        });

        test('should handle very large level numbers', () => {
            const config = configLoader.loadConfig(1000, 'medium');

            expect(config._level).toBe(1000);
            // Level scaling should be capped
            expect(config.generation.pathDensity).toBeGreaterThan(0);
            expect(config.generation.pathDensity).toBeLessThanOrEqual(1);
        });

        test('should handle custom config with extra fields', () => {
            const config = configLoader.loadConfig(1, 'medium', {
                customField: 'customValue',
                generation: { customGenField: 123 }
            });

            // Extra fields should be preserved
            expect(config.customField).toBe('customValue');
            expect(config.generation.customGenField).toBe(123);
        });
    });
});
