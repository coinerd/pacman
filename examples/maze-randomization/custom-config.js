/**
 * Custom Configuration Example
 * Demonstrates creating and using custom maze configurations
 */

import { MazeConfigLoader } from '../../src/utils/MazeConfigLoader.js';
import MazeGenerator from '../../src/utils/MazeGenerator.js';

// ============================================================
// Example 1: Override specific parameters
// ============================================================

function customOverrides() {
    const loader = new MazeConfigLoader();
    
    console.log('\n=== Custom Overrides ===\n');
    
    // Start with medium preset and customize
    const config = loader.loadConfig(1, 'medium', {
        generation: {
            pathDensity: 0.8,    // More paths than medium (0.7)
            deadEndFactor: 0.15  // Fewer dead ends than medium (0.3)
        },
        rules: {
            deadEnds: {
                maxDensity: 0.1  // Stricter dead end limit
            },
            corridors: {
                maxLength: 5     // Shorter corridors
            }
        }
    });
    
    console.log('Custom configuration:');
    console.log('  Path density:', config.generation.pathDensity);
    console.log('  Dead end factor:', config.generation.deadEndFactor);
    console.log('  Max dead end density:', config.rules.deadEnds.maxDensity);
    console.log('  Max corridor length:', config.rules.corridors.maxLength);
    
    // Generate maze
    const generator = new MazeGenerator({
        ...loader.toGeneratorConfig(config),
        seed: 42
    });
    
    const result = generator.generate();
    console.log('\nGenerated maze:');
    console.log('  Path tiles:', result.stats.pathTiles);
    console.log('  Dead ends:', result.stats.deadEnds);
    console.log('  Max corridor:', result.stats.maxCorridorLength);
    
    return { config, result };
}

// ============================================================
// Example 2: Create custom preset from scratch
// ============================================================

function createCustomPreset() {
    const loader = new MazeConfigLoader();
    
    console.log('\n=== Custom Preset from Scratch ===\n');
    
    // Define a custom "nightmare" preset
    const nightmarePreset = {
        meta: {
            name: 'Nightmare',
            description: 'Extremely challenging maze for hardcore players',
            version: '1.0.0'
        },
        generation: {
            algorithm: 'dfs',
            pathDensity: 0.35,
            deadEndFactor: 0.75,
            cellularAutomataIterations: 3,
            symmetry: 'none',
            extraPathDensity: 0.02
        },
        rules: {
            connectivity: { minCoverage: 1.0 },
            alternativePaths: { minPaths: 1 },
            deadEnds: { maxDensity: 0.5, minCount: 15, maxCount: 50 },
            corridors: { maxLength: 20 },
            spawnSafety: { playerRadius: 1, minFreedomSteps: 5 },
            powerPellets: { count: 4, minDistanceFromSpawn: 20 }
        },
        difficulty: { level: 'nightmare', riskFactor: 1.0 }
    };
    
    // Save as custom config
    loader.saveCustomConfig(nightmarePreset);
    
    // Load and use
    const config = loader.loadCustomConfig();
    
    console.log('Custom preset loaded:');
    console.log('  Name:', config.meta.name);
    console.log('  Description:', config.meta.description);
    console.log('  Risk factor:', config.difficulty.riskFactor);
    
    // Generate maze
    const generatorConfig = loader.toGeneratorConfig(config);
    const generator = new MazeGenerator({
        ...generatorConfig,
        seed: 999
    });
    
    const result = generator.generate();
    console.log('\nGenerated nightmare maze:');
    console.log('  Valid:', result.validationResult.isValid);
    console.log('  Retries needed:', result.stats.retries);
    
    return { nightmarePreset, result };
}

// ============================================================
// Example 3: Validate custom configuration
// ============================================================

function validateCustomConfig() {
    const loader = new MazeConfigLoader();
    
    console.log('\n=== Validate Custom Config ===\n');
    
    // Valid config
    const validConfig = {
        meta: { name: 'Test' },
        dimensions: { width: 25, height: 33 },
        generation: { pathDensity: 0.7, deadEndFactor: 0.3 },
        rules: { deadEnds: { maxDensity: 0.2 } }
    };
    
    const validResult = loader.validateConfig(validConfig);
    console.log('Valid config:', validResult.isValid ? '✓' : '✗');
    console.log('  Errors:', validResult.errors);
    
    // Invalid config - missing required fields
    const invalidConfig1 = {
        meta: { name: 'Invalid' }
        // Missing dimensions, generation, rules
    };
    
    const invalidResult1 = loader.validateConfig(invalidConfig1);
    console.log('\nInvalid config (missing fields):', invalidResult1.isValid ? '✓' : '✗');
    console.log('  Missing fields:', invalidResult1.missingFields);
    
    // Invalid config - out of range values
    const invalidConfig2 = {
        meta: { name: 'Invalid' },
        dimensions: { width: 5, height: 5 }, // Too small
        generation: { pathDensity: 0.1 },    // Too low
        rules: {}
    };
    
    const invalidResult2 = loader.validateConfig(invalidConfig2);
    console.log('\nInvalid config (out of range):', invalidResult2.isValid ? '✓' : '✗');
    console.log('  Errors:', invalidResult2.errors);
    
    return { validResult, invalidResult1, invalidResult2 };
}

// ============================================================
// Example 4: Progressive difficulty scaling
// ============================================================

function progressiveDifficultyDemo() {
    const loader = new MazeConfigLoader();
    
    console.log('\n=== Progressive Difficulty Demo ===\n');
    
    const levels = [1, 3, 5, 7, 10];
    const preset = 'medium';
    
    console.log(`Scaling for "${preset}" preset:\n`);
    console.log('| Level | Path Density | Dead End Factor | Min Alt Paths |');
    console.log('|-------|--------------|-----------------|---------------|');
    
    levels.forEach(level => {
        const config = loader.loadConfig(level, preset);
        
        console.log(
            `| ${String(level).padStart(5)} | ` +
            `${config.generation.pathDensity.toFixed(3).padStart(12)} | ` +
            `${config.generation.deadEndFactor.toFixed(3).padStart(15)} | ` +
            `${String(config.rules.alternativePaths.minPaths).padStart(13)} |`
        );
    });
    
    return levels.map(level => ({
        level,
        config: loader.loadConfig(level, preset)
    }));
}

// ============================================================
// Example 5: Custom level scaling parameters
// ============================================================

function customLevelScaling() {
    const loader = new MazeConfigLoader();
    
    console.log('\n=== Custom Level Scaling ===\n');
    
    // Set custom scaling factors
    loader.setLevelScaling({
        pathDensityReduction: 0.25,   // More aggressive reduction
        deadEndIncrease: 0.3,         // More dead ends at high levels
        corridorLengthIncrease: 0.15  // Longer corridors
    });
    
    console.log('Custom scaling factors applied:');
    console.log('  Path density reduction: 25%');
    console.log('  Dead end increase: 30%');
    console.log('  Corridor length increase: 15%');
    
    // Compare level 1 vs level 10
    const config1 = loader.loadConfig(1, 'medium');
    const config10 = loader.loadConfig(10, 'medium');
    
    console.log('\nLevel 1 vs Level 10 comparison:');
    console.log('  Path density:', config1.generation.pathDensity.toFixed(3), '→', config10.generation.pathDensity.toFixed(3));
    console.log('  Dead end factor:', config1.generation.deadEndFactor.toFixed(3), '→', config10.generation.deadEndFactor.toFixed(3));
    
    return { config1, config10 };
}

// ============================================================
// Example 6: Maze size variations
// ============================================================

function mazeSizeVariations() {
    const loader = new MazeConfigLoader();
    
    console.log('\n=== Maze Size Variations ===\n');
    
    const sizes = [
        { name: 'Small', width: 15, height: 19 },
        { name: 'Standard', width: 25, height: 33 },
        { name: 'Large', width: 35, height: 45 },
        { name: 'Huge', width: 45, height: 51 }
    ];
    
    sizes.forEach(size => {
        const config = loader.loadConfig(1, 'medium', {
            dimensions: {
                width: size.width,
                height: size.height
            }
        });
        
        const generator = new MazeGenerator({
            ...loader.toGeneratorConfig(config),
            seed: 123
        });
        
        const start = performance.now();
        const result = generator.generate();
        const time = performance.now() - start;
        
        console.log(`${size.name} (${size.width}x${size.height}):`);
        console.log(`  Path tiles: ${result.stats.pathTiles}`);
        console.log(`  Generation time: ${time.toFixed(1)}ms`);
        console.log(`  Valid: ${result.validationResult.isValid ? '✓' : '✗'}`);
    });
}

// ============================================================
// Run all demos
// ============================================================

console.log('Maze Randomization - Custom Configuration Examples\n');

customOverrides();
createCustomPreset();
validateCustomConfig();
progressiveDifficultyDemo();
customLevelScaling();
mazeSizeVariations();

export {
    customOverrides,
    createCustomPreset,
    validateCustomConfig,
    progressiveDifficultyDemo,
    customLevelScaling,
    mazeSizeVariations
};
