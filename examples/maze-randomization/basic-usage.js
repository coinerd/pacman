/**
 * Basic Usage Example
 * Demonstrates the fundamental maze generation workflow
 */

import { MazeConfigLoader } from '../../src/utils/MazeConfigLoader.js';
import { MazeSeedManager } from '../../src/utils/MazeSeedManager.js';
import MazeGenerator from '../../src/utils/MazeGenerator.js';

// ============================================================
// Example 1: Simple maze generation with default preset
// ============================================================

function generateDefaultMaze() {
    const loader = new MazeConfigLoader();
    
    // Load default configuration for level 1
    const config = loader.loadConfig(1, 'default');
    
    // Convert to generator format
    const generatorConfig = loader.toGeneratorConfig(config);
    
    // Create generator with a seed
    const generator = new MazeGenerator({
        ...generatorConfig,
        seed: Date.now()
    });
    
    // Generate the maze
    const result = generator.generate();
    
    console.log('=== Default Maze ===');
    console.log('Dimensions:', result.maze[0].length, 'x', result.maze.length);
    console.log('Valid:', result.validationResult.isValid);
    console.log('Retries:', result.stats.retries);
    
    return result;
}

// ============================================================
// Example 2: Generate maze for specific level with scaling
// ============================================================

function generateMazeForLevel(level, preset = 'medium') {
    const loader = new MazeConfigLoader();
    const seedManager = new MazeSeedManager();
    
    // Load configuration with level scaling applied
    const config = loader.loadConfig(level, preset);
    
    // Generate a deterministic seed for this level
    const seedInfo = seedManager.generateSeed(level, preset, {
        mode: 'level_sequence'
    });
    
    const generatorConfig = loader.toGeneratorConfig(config);
    
    const generator = new MazeGenerator({
        ...generatorConfig,
        seed: seedInfo.seed
    });
    
    const result = generator.generate();
    
    console.log(`=== Level ${level} Maze (${preset}) ===`);
    console.log('Seed:', seedInfo.seed);
    console.log('Path density:', config.generation.pathDensity.toFixed(2));
    console.log('Dead end factor:', config.generation.deadEndFactor.toFixed(2));
    
    return { ...result, seedInfo, config };
}

// ============================================================
// Example 3: Using SpawningSystem integration
// ============================================================

function generateWithSpawningSystem(level, preset) {
    // Note: This requires LevelSystem to be available
    // In a real game, you would import these:
    // import { SpawningSystem } from '../../src/model/systems/SpawningSystem.js';
    // import { LevelSystem } from '../../src/model/systems/LevelSystem.js';
    
    /*
    const levelSystem = new LevelSystem();
    const spawningSystem = new SpawningSystem(levelSystem, {
        preset: preset,
        seedMode: 'level_sequence'
    });
    
    const result = spawningSystem.generateMazeForLevel(level);
    
    console.log('Spawn points:', result.spawnPoints);
    console.log('Seed info:', result.seedInfo);
    
    return result;
    */
    
    // Alternative: Direct generation
    const loader = new MazeConfigLoader();
    const config = loader.loadConfig(level, preset);
    const generatorConfig = loader.toGeneratorConfig(config);
    
    const generator = new MazeGenerator(generatorConfig);
    return generator.generate();
}

// ============================================================
// Example 4: List available presets
// ============================================================

function listAvailablePresets() {
    const loader = new MazeConfigLoader();
    const presets = loader.listPresets();
    
    console.log('\n=== Available Presets ===');
    presets.forEach(preset => {
        console.log(`- ${preset.id}: ${preset.name}`);
        console.log(`  Description: ${preset.description}`);
        console.log(`  Risk Factor: ${preset.riskFactor}`);
    });
    
    return presets;
}

// ============================================================
// Example 5: Generate and display maze stats
// ============================================================

function generateWithStats(level, preset) {
    const loader = new MazeConfigLoader();
    const config = loader.loadConfig(level, preset);
    const generatorConfig = loader.toGeneratorConfig(config);
    
    const generator = new MazeGenerator({
        ...generatorConfig,
        seed: Math.floor(Math.random() * 100000)
    });
    
    const result = generator.generate();
    
    console.log(`\n=== Maze Stats (${preset}, Level ${level}) ===`);
    console.log('Dimensions:', generatorConfig.width, 'x', generatorConfig.height);
    console.log('Path tiles:', result.stats.pathTiles);
    console.log('Dead ends:', result.stats.deadEnds);
    console.log('Junctions:', result.stats.junctions);
    console.log('Connectivity:', (result.stats.connectivity * 100).toFixed(1) + '%');
    console.log('Max corridor:', result.stats.maxCorridorLength);
    
    // Difficulty KPIs
    if (result.validationResult.difficultyKPIs) {
        const kpis = result.validationResult.difficultyKPIs;
        console.log('\nDifficulty KPIs:');
        console.log('- Dead end density:', (kpis.deadEndDensity * 100).toFixed(1) + '%');
        console.log('- Min alternative paths:', kpis.minAlternativePaths);
        console.log('- Spawn freedom:', kpis.spawnFreedom, 'tiles');
    }
    
    return result;
}

// ============================================================
// Run examples
// ============================================================

console.log('Maze Randomization - Basic Usage Examples\n');

// Generate mazes with different presets
generateDefaultMaze();
generateMazeForLevel(1, 'easy');
generateMazeForLevel(5, 'medium');
generateMazeForLevel(10, 'hard');

// List presets
listAvailablePresets();

// Generate with detailed stats
generateWithStats(1, 'expert');

export {
    generateDefaultMaze,
    generateMazeForLevel,
    generateWithSpawningSystem,
    listAvailablePresets,
    generateWithStats
};
