/**
 * Preset Demo Example
 * Demonstrates the differences between difficulty presets
 */

import { MazeConfigLoader } from '../../src/utils/MazeConfigLoader.js';
import MazeGenerator from '../../src/utils/MazeGenerator.js';

// ============================================================
// Compare all presets side by side
// ============================================================

function compareAllPresets(level = 1) {
    const loader = new MazeConfigLoader();
    const presets = ['easy', 'medium', 'hard', 'expert'];
    
    console.log(`\n=== Preset Comparison (Level ${level}) ===\n`);
    
    const results = presets.map(preset => {
        const config = loader.loadConfig(level, preset);
        const generatorConfig = loader.toGeneratorConfig(config);
        
        // Use same base seed for fair comparison
        const seed = 42;
        
        const generator = new MazeGenerator({
            ...generatorConfig,
            seed
        });
        
        const result = generator.generate();
        
        return {
            preset,
            config,
            result
        };
    });
    
    // Print comparison table
    console.log('| Preset  | Path Density | Dead End Factor | Valid | Retries |');
    console.log('|---------|--------------|-----------------|-------|---------|');
    
    results.forEach(({ preset, config, result }) => {
        const valid = result.validationResult.isValid ? '✓' : '✗';
        console.log(
            `| ${preset.padEnd(7)} | ` +
            `${config.generation.pathDensity.toFixed(2).padStart(12)} | ` +
            `${config.generation.deadEndFactor.toFixed(2).padStart(15)} | ` +
            `${valid.padStart(5)} | ` +
            `${String(result.stats.retries).padStart(7)} |`
        );
    });
    
    return results;
}

// ============================================================
// Analyze preset characteristics
// ============================================================

function analyzePresetCharacteristics() {
    const loader = new MazeConfigLoader();
    const presets = loader.listPresets();
    
    console.log('\n=== Preset Characteristics ===\n');
    
    presets.forEach(presetInfo => {
        const config = loader.loadConfig(1, presetInfo.id);
        
        console.log(`\n${presetInfo.name} (${presetInfo.id}):`);
        console.log(`  Description: ${presetInfo.description}`);
        console.log(`  Risk Factor: ${presetInfo.riskFactor}`);
        console.log('\n  Generation:');
        console.log(`    Algorithm: ${config.generation.algorithm}`);
        console.log(`    Path Density: ${config.generation.pathDensity}`);
        console.log(`    Dead End Factor: ${config.generation.deadEndFactor}`);
        console.log(`    Symmetry: ${config.generation.symmetry}`);
        console.log('\n  Rules:');
        console.log(`    Min Alternative Paths: ${config.rules.alternativePaths.minPaths}`);
        console.log(`    Max Dead End Density: ${(config.rules.deadEnds.maxDensity * 100).toFixed(0)}%`);
        console.log(`    Max Corridor Length: ${config.rules.corridors.maxLength}`);
        console.log(`    Spawn Safety Radius: ${config.rules.spawnSafety.playerRadius}`);
    });
}

// ============================================================
// Generate multiple mazes per preset and collect statistics
// ============================================================

function benchmarkPresets(samplesPerPreset = 10) {
    const loader = new MazeConfigLoader();
    const presets = ['easy', 'medium', 'hard', 'expert'];
    
    console.log(`\n=== Preset Benchmark (${samplesPerPreset} samples each) ===\n`);
    
    const benchmarkResults = {};
    
    presets.forEach(preset => {
        const config = loader.loadConfig(1, preset);
        const generatorConfig = loader.toGeneratorConfig(config);
        
        const stats = {
            totalRetries: 0,
            validCount: 0,
            avgDeadEnds: 0,
            avgCorridorLength: 0,
            times: []
        };
        
        for (let i = 0; i < samplesPerPreset; i++) {
            const start = performance.now();
            
            const generator = new MazeGenerator({
                ...generatorConfig,
                seed: i * 1000 + 1
            });
            
            const result = generator.generate();
            
            const time = performance.now() - start;
            stats.times.push(time);
            stats.totalRetries += result.stats.retries || 0;
            if (result.validationResult.isValid) stats.validCount++;
            stats.avgDeadEnds += result.stats.deadEnds;
            stats.avgCorridorLength += result.stats.maxCorridorLength;
        }
        
        stats.avgDeadEnds /= samplesPerPreset;
        stats.avgCorridorLength /= samplesPerPreset;
        stats.avgTime = stats.times.reduce((a, b) => a + b, 0) / samplesPerPreset;
        
        benchmarkResults[preset] = stats;
    });
    
    // Print results
    console.log('| Preset  | Valid % | Avg Retries | Avg Dead Ends | Avg Corridor | Avg Time |');
    console.log('|---------|---------|-------------|---------------|--------------|----------|');
    
    presets.forEach(preset => {
        const stats = benchmarkResults[preset];
        const validPct = ((stats.validCount / samplesPerPreset) * 100).toFixed(0);
        
        console.log(
            `| ${preset.padEnd(7)} | ` +
            `${(validPct + '%').padStart(7)} | ` +
            `${(stats.totalRetries / samplesPerPreset).toFixed(1).padStart(11)} | ` +
            `${stats.avgDeadEnds.toFixed(1).padStart(13)} | ` +
            `${stats.avgCorridorLength.toFixed(1).padStart(12)} | ` +
            `${stats.avgTime.toFixed(1).padStart(8)}ms |`
        );
    });
    
    return benchmarkResults;
}

// ============================================================
// Visualize maze differences (ASCII art)
// ============================================================

function visualizeMaze(maze, maxWidth = 40) {
    const height = Math.min(maze.length, 20);
    const width = Math.min(maze[0].length, maxWidth);
    
    let output = '';
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tile = maze[y][x];
            if (tile === 1) {
                output += '█';
            } else if (tile === 0) {
                output += '·';
            } else {
                output += '?';
            }
        }
        output += '\n';
    }
    return output;
}

function comparePresetVisuals() {
    const loader = new MazeConfigLoader();
    const presets = ['easy', 'hard'];
    
    console.log('\n=== Visual Comparison ===\n');
    
    presets.forEach(preset => {
        const config = loader.loadConfig(1, preset);
        const generatorConfig = loader.toGeneratorConfig(config);
        
        const generator = new MazeGenerator({
            ...generatorConfig,
            seed: 12345
        });
        
        const result = generator.generate();
        
        console.log(`\n--- ${preset.toUpperCase()} PRESET ---\n`);
        console.log(visualizeMaze(result.maze));
    });
}

// ============================================================
// Run demo
// ============================================================

console.log('Maze Randomization - Preset Demo\n');

compareAllPresets();
analyzePresetCharacteristics();
benchmarkPresets(10);
comparePresetVisuals();

export {
    compareAllPresets,
    analyzePresetCharacteristics,
    benchmarkPresets,
    comparePresetVisuals
};
