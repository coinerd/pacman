/**
 * Seed Replay Example
 * Demonstrates using seeds for reproducible mazes and replay functionality
 */

import { MazeConfigLoader } from '../../src/utils/MazeConfigLoader.js';
import { MazeSeedManager } from '../../src/utils/MazeSeedManager.js';
import MazeGenerator from '../../src/utils/MazeGenerator.js';

// ============================================================
// Example 1: Generate reproducible mazes with seeds
// ============================================================

function reproducibleMazes() {
    const loader = new MazeConfigLoader();
    const seed = 99999;
    
    console.log('\n=== Reproducible Mazes (Seed: ' + seed + ') ===\n');
    
    // Generate first maze
    const config1 = loader.loadConfig(1, 'medium');
    const generator1 = new MazeGenerator({
        ...loader.toGeneratorConfig(config1),
        seed
    });
    const result1 = generator1.generate();
    
    // Generate second maze with same seed
    const config2 = loader.loadConfig(1, 'medium');
    const generator2 = new MazeGenerator({
        ...loader.toGeneratorConfig(config2),
        seed
    });
    const result2 = generator2.generate();
    
    // Compare
    const identical = JSON.stringify(result1.maze) === JSON.stringify(result2.maze);
    
    console.log('First maze path tiles:', result1.stats.pathTiles);
    console.log('Second maze path tiles:', result2.stats.pathTiles);
    console.log('Mazes identical:', identical ? '✓ YES' : '✗ NO');
    
    return { result1, result2, identical };
}

// ============================================================
// Example 2: Level sequence mode (same level = same maze)
// ============================================================

function levelSequenceDemo() {
    const loader = new MazeConfigLoader();
    const seedManager = new MazeSeedManager({
        defaultMode: 'level_sequence',
        baseSeed: 42
    });
    
    console.log('\n=== Level Sequence Mode ===\n');
    
    // Generate seeds for levels 1-5
    console.log('Generating seeds for levels 1-5:');
    for (let level = 1; level <= 5; level++) {
        const seedInfo = seedManager.generateSeed(level, 'medium', {
            mode: 'level_sequence'
        });
        console.log(`  Level ${level}: seed = ${seedInfo.seed}`);
    }
    
    // Verify same level produces same seed
    const seed1 = seedManager.generateSeed(3, 'medium', { mode: 'level_sequence' });
    const seed2 = seedManager.generateSeed(3, 'medium', { mode: 'level_sequence' });
    
    console.log('\nSame level (3), same seed:', seed1.seed === seed2.seed ? '✓' : '✗');
    
    return { seed1, seed2 };
}

// ============================================================
// Example 3: Replay record creation and loading
// ============================================================

function replayRecordDemo() {
    const loader = new MazeConfigLoader();
    const seedManager = new MazeSeedManager();
    
    console.log('\n=== Replay Record Demo ===\n');
    
    // Generate a maze and create replay record
    const level = 5;
    const preset = 'hard';
    
    const seedInfo = seedManager.generateSeed(level, preset, {
        mode: 'seeded',
        overrideSeed: 12345
    });
    
    // Create replay record
    const replayRecord = seedManager.createReplayRecord(
        seedInfo.seed,
        level,
        preset,
        {
            playerName: 'ADA-Woman',
            score: 50000,
            timestamp: Date.now()
        }
    );
    
    console.log('Replay record created:');
    console.log(JSON.stringify(replayRecord, null, 2));
    
    // Validate record
    const validation = seedManager.validateReplayRecord(replayRecord);
    console.log('\nValidation:', validation.isValid ? '✓ Valid' : '✗ Invalid');
    
    // Serialize for storage
    const serialized = seedManager.serializeReplayRecord(replayRecord);
    console.log('\nSerialized length:', serialized.length, 'bytes');
    
    // Deserialize
    const loaded = seedManager.deserializeReplayRecord(serialized);
    console.log('Loaded seed:', loaded.seed);
    console.log('Loaded level:', loaded.level);
    console.log('Loaded preset:', loaded.preset);
    
    // Regenerate maze from replay
    const config = loader.loadConfig(loaded.level, loaded.preset);
    const generator = new MazeGenerator({
        ...loader.toGeneratorConfig(config),
        seed: loaded.seed
    });
    
    const regenerated = generator.generate();
    console.log('\nRegenerated maze from replay:');
    console.log('  Path tiles:', regenerated.stats.pathTiles);
    console.log('  Dead ends:', regenerated.stats.deadEnds);
    
    return { replayRecord, regenerated };
}

// ============================================================
// Example 4: Save and load replay from localStorage
// ============================================================

function localStorageDemo() {
    const seedManager = new MazeSeedManager();
    
    console.log('\n=== LocalStorage Demo ===\n');
    
    // Create a replay record
    const record = seedManager.createReplayRecord(54321, 7, 'expert', {
        playerName: 'Champion',
        score: 100000
    });
    
    // Save to localStorage (simulated)
    const storageKey = 'maze_replay_latest';
    const serialized = seedManager.serializeReplayRecord(record);
    
    console.log('Saving to localStorage...');
    // In browser: localStorage.setItem(storageKey, serialized);
    // For demo, we'll use a mock
    const mockStorage = {};
    mockStorage[storageKey] = serialized;
    
    // Load from localStorage
    console.log('Loading from localStorage...');
    // In browser: const loaded = localStorage.getItem(storageKey);
    const loaded = mockStorage[storageKey];
    
    const parsedRecord = seedManager.deserializeReplayRecord(loaded);
    
    console.log('Loaded record:');
    console.log('  Seed:', parsedRecord.seed);
    console.log('  Level:', parsedRecord.level);
    console.log('  Preset:', parsedRecord.preset);
    console.log('  Score:', parsedRecord.score);
    
    return parsedRecord;
}

// ============================================================
// Example 5: Batch seed generation
// ============================================================

function batchSeedDemo() {
    const seedManager = new MazeSeedManager();
    
    console.log('\n=== Batch Seed Generation ===\n');
    
    // Generate seeds for 10 levels
    const seeds = seedManager.generateSeedBatch(1, 10, 'medium', 'level_sequence');
    
    console.log('Seeds for levels 1-10:');
    seeds.forEach(({ level, seed }) => {
        console.log(`  Level ${level.toString().padStart(2)}: ${seed}`);
    });
    
    // Verify uniqueness
    const uniqueSeeds = new Set(seeds.map(s => s.seed));
    console.log('\nUnique seeds:', uniqueSeeds.size, '/', seeds.length);
    
    return seeds;
}

// ============================================================
// Example 6: Fork seeds for sub-generation
// ============================================================

function forkSeedDemo() {
    const seedManager = new MazeSeedManager();
    
    console.log('\n=== Fork Seed Demo ===\n');
    
    const baseSeed = 12345;
    
    // Fork the base seed for different purposes
    const mazeSeed = baseSeed;
    const pelletSeed = seedManager.forkSeed(baseSeed, 'pellets');
    const enemySeed = seedManager.forkSeed(baseSeed, 'enemies');
    const powerUpSeed = seedManager.forkSeed(baseSeed, 'powerups');
    
    console.log('Base seed:', baseSeed);
    console.log('Maze seed:', mazeSeed);
    console.log('Pellet seed:', pelletSeed);
    console.log('Enemy seed:', enemySeed);
    console.log('Power-up seed:', powerUpSeed);
    
    // All seeds are deterministic but different
    const allSeeds = [mazeSeed, pelletSeed, enemySeed, powerUpSeed];
    const uniqueCount = new Set(allSeeds).size;
    console.log('\nAll seeds unique:', uniqueCount === allSeeds.length ? '✓' : '✗');
    
    return { baseSeed, mazeSeed, pelletSeed, enemySeed, powerUpSeed };
}

// ============================================================
// Run all demos
// ============================================================

console.log('Maze Randomization - Seed Replay Examples\n');

reproducibleMazes();
levelSequenceDemo();
replayRecordDemo();
localStorageDemo();
batchSeedDemo();
forkSeedDemo();

export {
    reproducibleMazes,
    levelSequenceDemo,
    replayRecordDemo,
    localStorageDemo,
    batchSeedDemo,
    forkSeedDemo
};
