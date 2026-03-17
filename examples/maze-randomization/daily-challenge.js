/**
 * Daily Challenge Example
 * Demonstrates implementing a daily challenge mode with deterministic seeds
 */

import { MazeConfigLoader } from '../../src/utils/MazeConfigLoader.js';
import { MazeSeedManager } from '../../src/utils/MazeSeedManager.js';
import MazeGenerator from '../../src/utils/MazeGenerator.js';

// ============================================================
// Example 1: Generate daily challenge seed
// ============================================================

function getDailyChallengeSeed(date = new Date()) {
    const seedManager = new MazeSeedManager();
    
    const seedInfo = seedManager.generateSeed(1, 'hard', {
        mode: 'daily_challenge',
        date
    });
    
    return seedInfo;
}

function dailyChallengeDemo() {
    const seedManager = new MazeSeedManager();
    
    console.log('\n=== Daily Challenge Demo ===\n');
    
    // Get today's challenge
    const today = new Date();
    const todaySeed = seedManager.generateSeed(1, 'hard', {
        mode: 'daily_challenge',
        date: today
    });
    
    console.log('Today\'s Daily Challenge:');
    console.log('  Date:', today.toISOString().split('T')[0]);
    console.log('  Seed:', todaySeed.seed);
    console.log('  Preset:', 'hard');
    
    // Generate the maze
    const loader = new MazeConfigLoader();
    const config = loader.loadConfig(1, 'hard');
    const generator = new MazeGenerator({
        ...loader.toGeneratorConfig(config),
        seed: todaySeed.seed
    });
    
    const result = generator.generate();
    console.log('  Maze path tiles:', result.stats.pathTiles);
    console.log('  Valid:', result.validationResult.isValid ? '✓' : '✗');
    
    return { seedInfo: todaySeed, result };
}

// ============================================================
// Example 2: Same seed for same date (all players)
// ============================================================

function verifyDailyConsistency() {
    const seedManager = new MazeSeedManager();
    
    console.log('\n=== Daily Consistency Verification ===\n');
    
    const testDate = new Date(2026, 2, 17); // March 17, 2026
    
    // Generate seed multiple times
    const seeds = [];
    for (let i = 0; i < 5; i++) {
        const seedInfo = seedManager.generateSeed(1, 'hard', {
            mode: 'daily_challenge',
            date: testDate
        });
        seeds.push(seedInfo.seed);
    }
    
    console.log('Seeds generated for', testDate.toISOString().split('T')[0] + ':');
    seeds.forEach((seed, i) => console.log(`  Run ${i + 1}: ${seed}`));
    
    // All should be identical
    const allSame = seeds.every(s => s === seeds[0]);
    console.log('\nAll seeds identical:', allSame ? '✓ YES' : '✗ NO');
    
    // Different date = different seed
    const nextDay = new Date(2026, 2, 18);
    const nextDaySeed = seedManager.generateSeed(1, 'hard', {
        mode: 'daily_challenge',
        date: nextDay
    });
    
    console.log('Next day seed:', nextDaySeed.seed);
    console.log('Different from today:', nextDaySeed.seed !== seeds[0] ? '✓ YES' : '✗ NO');
    
    return { seeds, allSame, nextDaySeed };
}

// ============================================================
// Example 3: Weekly challenge series
// ============================================================

function weeklyChallengeSeries() {
    const seedManager = new MazeSeedManager();
    const loader = new MazeConfigLoader();
    
    console.log('\n=== Weekly Challenge Series ===\n');
    
    const today = new Date();
    const weekDays = [];
    
    // Generate challenges for the week
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const seedInfo = seedManager.generateSeed(1, 'hard', {
            mode: 'daily_challenge',
            date
        });
        
        weekDays.push({
            date: date.toISOString().split('T')[0],
            dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
            seed: seedInfo.seed
        });
    }
    
    console.log('This week\'s Daily Challenges:');
    weekDays.forEach(day => {
        console.log(`  ${day.dayName.padEnd(9)} (${day.date}): seed = ${day.seed}`);
    });
    
    // Verify all unique
    const uniqueSeeds = new Set(weekDays.map(d => d.seed));
    console.log('\nAll seeds unique:', uniqueSeeds.size === 7 ? '✓' : '✗');
    
    return weekDays;
}

// ============================================================
// Example 4: Daily challenge leaderboard entry
// ============================================================

function createDailyLeaderboardEntry(score, playerName) {
    const seedManager = new MazeSeedManager();
    const loader = new MazeConfigLoader();
    
    const today = new Date();
    const seedInfo = seedManager.generateSeed(1, 'hard', {
        mode: 'daily_challenge',
        date: today
    });
    
    const entry = {
        date: today.toISOString().split('T')[0],
        seed: seedInfo.seed,
        preset: 'hard',
        playerName,
        score,
        timestamp: Date.now(),
        // Verification data (to prevent cheating)
        verification: {
            mazePathTiles: null, // Would be filled with actual value
            deadEndCount: null
        }
    };
    
    console.log('\n=== Daily Leaderboard Entry ===\n');
    console.log(JSON.stringify(entry, null, 2));
    
    return entry;
}

// ============================================================
// Example 5: Verify a leaderboard entry
// ============================================================

function verifyLeaderboardEntry(entry) {
    const seedManager = new MazeSeedManager();
    const loader = new MazeConfigLoader();
    
    console.log('\n=== Verifying Leaderboard Entry ===\n');
    
    // Parse the date from entry
    const [year, month, day] = entry.date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Regenerate the expected seed
    const expectedSeedInfo = seedManager.generateSeed(1, entry.preset, {
        mode: 'daily_challenge',
        date
    });
    
    // Check if seed matches
    const seedValid = entry.seed === expectedSeedInfo.seed;
    console.log('Seed valid:', seedValid ? '✓' : '✗');
    
    // Regenerate the maze
    const config = loader.loadConfig(1, entry.preset);
    const generator = new MazeGenerator({
        ...loader.toGeneratorConfig(config),
        seed: entry.seed
    });
    
    const result = generator.generate();
    
    // Verify maze properties if provided
    if (entry.verification.mazePathTiles !== null) {
        const pathTilesValid = result.stats.pathTiles === entry.verification.mazePathTiles;
        console.log('Path tiles valid:', pathTilesValid ? '✓' : '✗');
    }
    
    console.log('Entry verification:', seedValid ? '✓ PASSED' : '✗ FAILED');
    
    return { seedValid, result };
}

// ============================================================
// Example 6: Daily challenge with retry limit
// ============================================================

function dailyChallengeWithRetryLimit() {
    console.log('\n=== Daily Challenge with Retry Limit ===\n');
    
    // Simulate a daily challenge session
    const session = {
        date: new Date().toISOString().split('T')[0],
        attempts: 0,
        maxAttempts: 3,
        bestScore: 0,
        scores: []
    };
    
    console.log(`Daily Challenge: ${session.date}`);
    console.log(`Attempts allowed: ${session.maxAttempts}`);
    
    // Simulate attempts
    for (let attempt = 1; attempt <= session.maxAttempts; attempt++) {
        const score = Math.floor(Math.random() * 50000) + 10000;
        session.scores.push(score);
        session.attempts++;
        
        if (score > session.bestScore) {
            session.bestScore = score;
        }
        
        console.log(`  Attempt ${attempt}: ${score} points`);
    }
    
    console.log(`\nBest score: ${session.bestScore}`);
    console.log(`Average: ${Math.floor(session.scores.reduce((a, b) => a + b, 0) / session.scores.length)}`);
    
    return session;
}

// ============================================================
// Run all demos
// ============================================================

console.log('Maze Randomization - Daily Challenge Examples\n');

dailyChallengeDemo();
verifyDailyConsistency();
weeklyChallengeSeries();
createDailyLeaderboardEntry(42850, 'ADA-Player');
verifyLeaderboardEntry({
    date: '2026-03-17',
    seed: 2026031701,
    preset: 'hard',
    score: 42850,
    verification: { mazePathTiles: null, deadEndCount: null }
});
dailyChallengeWithRetryLimit();

export {
    getDailyChallengeSeed,
    dailyChallengeDemo,
    verifyDailyConsistency,
    weeklyChallengeSeries,
    createDailyLeaderboardEntry,
    verifyLeaderboardEntry,
    dailyChallengeWithRetryLimit
};
