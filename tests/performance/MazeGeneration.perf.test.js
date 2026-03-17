/**
 * Maze Generation Performance Tests
 * Benchmarks maze generation with different presets and configurations
 *
 * Phase 3 Performance Testing:
 * - Generation time benchmarks
 * - Memory usage estimation
 * - Validation performance
 * - Retry behavior analysis
 */

import MazeGenerator from '../../src/utils/MazeGenerator.js';
import { MazeConfigLoader } from '../../src/utils/MazeConfigLoader.js';
import { MazeSeedManager } from '../../src/utils/MazeSeedManager.js';
import { validateAgainstRules } from '../../src/utils/maze/MazeRules.js';

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
    GENERATION_MAX: 500,       // Max time for single generation
    GENERATION_AVG: 150,       // Average time should be under this
    VALIDATION_MAX: 50,        // Max time for validation
    FULL_PIPELINE_MAX: 500,    // Max time for complete pipeline
    HUNDRED_MAZES_MAX: 20000   // Max time for 100 mazes
};

// Number of iterations for benchmarking
const BENCHMARK_ITERATIONS = 10;

describe('Maze Generation Performance', () => {
    let configLoader;
    let seedManager;

    beforeEach(() => {
        configLoader = new MazeConfigLoader();
        seedManager = new MazeSeedManager();
    });

    // =====================================================
    // GENERATION TIME BENCHMARKS
    // =====================================================

    describe('Generation Time Benchmarks', () => {
        const presets = ['easy', 'medium', 'hard', 'expert'];

        test.each(presets)('should generate %s preset within time limit', (preset) => {
            const config = configLoader.loadConfig(1, preset);
            const generatorConfig = configLoader.toGeneratorConfig(config);

            const times = [];

            for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
                const seedInfo = seedManager.generateSeed(i + 1, preset, { mode: 'level_sequence' });

                const start = performance.now();
                const generator = new MazeGenerator({
                    ...generatorConfig,
                    seed: seedInfo.seed
                });
                generator.generate();
                const end = performance.now();

                times.push(end - start);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);

            console.log(`[${preset}] Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);

            expect(maxTime).toBeLessThan(THRESHOLDS.GENERATION_MAX);
            expect(avgTime).toBeLessThan(THRESHOLDS.GENERATION_AVG);
        });

        test('should generate 100 mazes within reasonable total time', () => {
            const config = configLoader.loadConfig(1, 'medium');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            const start = performance.now();

            for (let i = 0; i < 100; i++) {
                const generator = new MazeGenerator({
                    ...generatorConfig,
                    seed: i
                });
                generator.generate();
            }

            const totalTime = performance.now() - start;
            const avgTime = totalTime / 100;

            console.log(`[100 Mazes] Total: ${totalTime.toFixed(0)}ms, Avg: ${avgTime.toFixed(2)}ms`);

            // 100 mazes should take less than 20 seconds total
            expect(totalTime).toBeLessThan(THRESHOLDS.HUNDRED_MAZES_MAX);
        });

        test('should have consistent performance across levels', () => {
            const times = [];

            for (let level = 1; level <= 10; level++) {
                const config = configLoader.loadConfig(level, 'medium');
                const generatorConfig = configLoader.toGeneratorConfig(config);
                const seedInfo = seedManager.generateSeed(level, 'medium', { mode: 'level_sequence' });

                const start = performance.now();
                const generator = new MazeGenerator({
                    ...generatorConfig,
                    seed: seedInfo.seed
                });
                generator.generate();
                const end = performance.now();

                times.push({ level, time: end - start });
            }

            console.log('Level Performance:', times.map(t => `L${t.level}:${t.time.toFixed(1)}ms`).join(', '));

            // All levels should be within reasonable range
            const maxTime = Math.max(...times.map(t => t.time));
            const minTime = Math.min(...times.map(t => t.time));
            const variance = maxTime / minTime;

            // Variance should not be extreme (max 3x difference)
            expect(variance).toBeLessThan(3);
        });
    });

    // =====================================================
    // VALIDATION PERFORMANCE
    // =====================================================

    describe('Validation Performance', () => {
        test('should validate maze within time limit', () => {
            const config = configLoader.loadConfig(1, 'medium');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            const generator = new MazeGenerator({
                ...generatorConfig,
                seed: 42
            });
            const result = generator.generate();

            const times = [];

            for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
                const start = performance.now();
                validateAgainstRules(
                    result.maze,
                    result.maze[0].length,
                    result.maze.length,
                    result.spawnPoints,
                    config
                );
                const end = performance.now();

                times.push(end - start);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);

            console.log(`[Validation] Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);

            expect(maxTime).toBeLessThan(THRESHOLDS.VALIDATION_MAX);
        });

        test('should handle validation with many power pellets efficiently', () => {
            const config = configLoader.loadConfig(1, 'medium');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            const generator = new MazeGenerator({
                ...generatorConfig,
                seed: 123
            });
            const result = generator.generate();

            // Add many extra power pellets to test performance
            const spawnPointsWithManyPP = {
                ...result.spawnPoints,
                powerPellets: [
                    ...result.spawnPoints.powerPellets,
                    { x: 5, y: 5 },
                    { x: 10, y: 5 },
                    { x: 15, y: 5 },
                    { x: 20, y: 5 },
                    { x: 5, y: 15 },
                    { x: 10, y: 15 },
                    { x: 15, y: 15 },
                    { x: 20, y: 15 }
                ]
            };

            const start = performance.now();
            validateAgainstRules(
                result.maze,
                result.maze[0].length,
                result.maze.length,
                spawnPointsWithManyPP,
                config
            );
            const time = performance.now() - start;

            console.log(`[Validation with 12 PP] Time: ${time.toFixed(2)}ms`);

            // Should still be fast
            expect(time).toBeLessThan(THRESHOLDS.VALIDATION_MAX * 2);
        });
    });

    // =====================================================
    // RETRY BEHAVIOR ANALYSIS
    // =====================================================

    describe('Retry Behavior Analysis', () => {
        test('should complete generation with retry mechanism', () => {
            const config = configLoader.loadConfig(1, 'easy');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            let totalRetries = 0;
            let fallbacks = 0;
            let successfulGenerations = 0;

            for (let i = 0; i < 50; i++) {
                const generator = new MazeGenerator({
                    ...generatorConfig,
                    seed: i * 1000
                });
                const result = generator.generate();

                totalRetries += result.stats.retries || 0;
                if (result.stats.fallbackUsed) {fallbacks++;}

                // Check if maze was generated (even with fallback)
                if (result.maze && result.maze.length > 0) {
                    successfulGenerations++;
                }
            }

            const avgRetries = totalRetries / 50;
            console.log(`[Easy Preset] Avg retries: ${avgRetries.toFixed(2)}, ` +
                        `Fallbacks: ${fallbacks}/50, ` +
                        `Successful: ${successfulGenerations}/50`);

            // All generations should succeed (with or without fallback)
            expect(successfulGenerations).toBe(50);

            // Fallbacks are acceptable as long as we get valid mazes
            // This test documents the retry behavior
        });

        test('should handle hard presets with retry mechanism', () => {
            const config = configLoader.loadConfig(1, 'hard');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            let totalRetries = 0;
            let fallbacks = 0;
            let successfulGenerations = 0;

            for (let i = 0; i < 50; i++) {
                const generator = new MazeGenerator({
                    ...generatorConfig,
                    seed: i * 1000
                });
                const result = generator.generate();

                totalRetries += result.stats.retries || 0;
                if (result.stats.fallbackUsed) {fallbacks++;}

                if (result.maze && result.maze.length > 0) {
                    successfulGenerations++;
                }
            }

            const avgRetries = totalRetries / 50;
            console.log(`[Hard Preset] Avg retries: ${avgRetries.toFixed(2)}, ` +
                        `Fallbacks: ${fallbacks}/50, ` +
                        `Successful: ${successfulGenerations}/50`);

            // All generations should succeed (with or without fallback)
            expect(successfulGenerations).toBe(50);

            // Hard presets naturally need more retries due to stricter constraints
        });
    });

    // =====================================================
    // MEMORY ESTIMATION
    // =====================================================

    describe('Memory Estimation', () => {
        test('should estimate memory usage for maze data', () => {
            const config = configLoader.loadConfig(1, 'medium');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            const generator = new MazeGenerator({
                ...generatorConfig,
                seed: 42
            });
            const result = generator.generate();

            // Estimate memory usage
            const width = result.maze[0].length;
            const height = result.maze.length;

            // Maze: 2D array of numbers (8 bytes each for JS numbers, but optimized)
            // Conservative estimate: ~4 bytes per cell
            const mazeMemory = width * height * 4;

            // Pellet grid: similar
            const pelletGridMemory = width * height * 4;

            // Spawn points: small object
            const spawnPointsMemory = 500; // ~500 bytes

            // Total estimate
            const totalEstimate = mazeMemory + pelletGridMemory + spawnPointsMemory;

            console.log(`[Memory Estimate] Maze: ${(mazeMemory / 1024).toFixed(1)}KB, ` +
                        `PelletGrid: ${(pelletGridMemory / 1024).toFixed(1)}KB, ` +
                        `Total: ${(totalEstimate / 1024).toFixed(1)}KB`);

            // For standard 25x33 maze, should be under 50KB
            expect(totalEstimate).toBeLessThan(50 * 1024);
        });

        test('should not leak memory on repeated generations', () => {
            const config = configLoader.loadConfig(1, 'medium');
            const generatorConfig = configLoader.toGeneratorConfig(config);

            // Force garbage collection if available (Node.js with --expose-gc)
            const gc = global.gc;

            const getMemoryUsage = () => {
                if (process.memoryUsage) {
                    return process.memoryUsage().heapUsed;
                }
                return 0;
            };

            // Warm up
            for (let i = 0; i < 10; i++) {
                const generator = new MazeGenerator({
                    ...generatorConfig,
                    seed: i
                });
                generator.generate();
            }

            if (gc) {gc();}

            const memoryBefore = getMemoryUsage();

            // Generate 100 mazes
            for (let i = 0; i < 100; i++) {
                const generator = new MazeGenerator({
                    ...generatorConfig,
                    seed: i + 100
                });
                generator.generate();
            }

            if (gc) {gc();}

            const memoryAfter = getMemoryUsage();
            const memoryDiff = memoryAfter - memoryBefore;

            console.log(`[Memory Leak Test] Before: ${(memoryBefore / 1024 / 1024).toFixed(1)}MB, ` +
                        `After: ${(memoryAfter / 1024 / 1024).toFixed(1)}MB, ` +
                        `Diff: ${(memoryDiff / 1024).toFixed(1)}KB`);

            // Memory diff should be reasonable
            // Note: Without explicit GC, memory may accumulate
            // This test is informational rather than strict
            // We just check it doesn't grow excessively (> 50MB)
            expect(memoryDiff).toBeLessThan(50 * 1024 * 1024);
        });
    });

    // =====================================================
    // FULL PIPELINE BENCHMARKS
    // =====================================================

    describe('Full Pipeline Benchmarks', () => {
        test('should complete full pipeline (config + seed + generate + validate) within limit', () => {
            const times = [];

            for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
                const start = performance.now();

                // Load config
                const config = configLoader.loadConfig(i + 1, 'medium');

                // Generate seed
                const seedInfo = seedManager.generateSeed(i + 1, 'medium', { mode: 'level_sequence' });

                // Convert config
                const generatorConfig = configLoader.toGeneratorConfig(config);

                // Generate maze
                const generator = new MazeGenerator({
                    ...generatorConfig,
                    seed: seedInfo.seed
                });
                const result = generator.generate();

                // Validate (already done in generate, but test explicit call)
                validateAgainstRules(
                    result.maze,
                    result.maze[0].length,
                    result.maze.length,
                    result.spawnPoints,
                    config
                );

                const end = performance.now();
                times.push(end - start);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);

            console.log(`[Full Pipeline] Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);

            expect(maxTime).toBeLessThan(THRESHOLDS.FULL_PIPELINE_MAX);
        });

        test('should benchmark all presets comparatively', () => {
            const results = {};

            for (const preset of ['easy', 'medium', 'hard', 'expert']) {
                const times = [];

                for (let i = 0; i < 20; i++) {
                    const config = configLoader.loadConfig(1, preset);
                    const generatorConfig = configLoader.toGeneratorConfig(config);

                    const start = performance.now();
                    const generator = new MazeGenerator({
                        ...generatorConfig,
                        seed: i
                    });
                    generator.generate();
                    const end = performance.now();

                    times.push(end - start);
                }

                results[preset] = {
                    avg: times.reduce((a, b) => a + b, 0) / times.length,
                    min: Math.min(...times),
                    max: Math.max(...times)
                };
            }

            console.log('\n=== PRESET BENCHMARKS ===');
            for (const [preset, stats] of Object.entries(results)) {
                console.log(`${preset.padEnd(8)}: avg=${stats.avg.toFixed(1)}ms, ` +
                            `min=${stats.min.toFixed(1)}ms, max=${stats.max.toFixed(1)}ms`);
            }

            // All presets should complete within reasonable time
            for (const stats of Object.values(results)) {
                expect(stats.max).toBeLessThan(THRESHOLDS.GENERATION_MAX);
            }
        });
    });

    // =====================================================
    // BENCHMARK DOCUMENTATION
    // =====================================================

    describe('Benchmark Documentation', () => {
        test('should document benchmark results', () => {
            const benchmarks = {
                timestamp: new Date().toISOString(),
                thresholds: THRESHOLDS,
                results: {}
            };

            for (const preset of ['easy', 'medium', 'hard', 'expert']) {
                const config = configLoader.loadConfig(1, preset);
                const generatorConfig = configLoader.toGeneratorConfig(config);

                const times = [];
                let retries = 0;

                for (let i = 0; i < 50; i++) {
                    const start = performance.now();
                    const generator = new MazeGenerator({
                        ...generatorConfig,
                        seed: i * 100
                    });
                    const result = generator.generate();
                    const end = performance.now();

                    times.push(end - start);
                    retries += result.stats.retries || 0;
                }

                benchmarks.results[preset] = {
                    avgGenerationTime: times.reduce((a, b) => a + b, 0) / times.length,
                    minGenerationTime: Math.min(...times),
                    maxGenerationTime: Math.max(...times),
                    avgRetries: retries / 50,
                    sampleSize: 50
                };
            }

            console.log('\n========================================');
            console.log('MAZE GENERATION BENCHMARK RESULTS');
            console.log('========================================');
            console.log(JSON.stringify(benchmarks, null, 2));
            console.log('========================================\n');

            // This test always passes - it's just for documentation
            expect(true).toBe(true);
        });
    });
});
