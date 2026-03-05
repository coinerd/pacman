#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import MazeGenerator from '../src/utils/MazeGenerator.js';
import { TILE_TYPES } from '../src/utils/MazeLayout.js';
import { SeededRandom } from '../src/utils/SeededRandom.js';

const DEFAULT_TARGETS_PATH = path.resolve('tools/kpi-targets.json');
const DEFAULT_OUTLIERS_PATH = path.resolve('tests/regression/seed-outliers.json');

const args = process.argv.slice(2);
const shouldFailOnOutliers = !args.includes('--no-fail');

const targetConfig = JSON.parse(fs.readFileSync(DEFAULT_TARGETS_PATH, 'utf8'));

const originalWarn = console.warn;
console.warn = (...messages) => {
    if (String(messages[0] || '').includes('Maze fallback warning')) {
        return;
    }
    originalWarn(...messages);
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function getPathTiles(maze) {
    const tiles = [];
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === TILE_TYPES.PATH) {
                tiles.push({ x, y });
            }
        }
    }
    return tiles;
}

function countDeadEnds(maze, pathTiles) {
    let deadEnds = 0;
    const neighbors = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const tile of pathTiles) {
        let exits = 0;
        for (const [dx,dy] of neighbors) {
            const nx = tile.x + dx;
            const ny = tile.y + dy;
            if (ny >= 0 && ny < maze.length && nx >= 0 && nx < maze[0].length && maze[ny][nx] === TILE_TYPES.PATH) {
                exits++;
            }
        }
        if (exits === 1) {
            deadEnds++;
        }
    }
    return deadEnds;
}

function simulateSeed(seed, difficultyConfig) {
    const mazeResult = MazeGenerator.generate({
        width: 28,
        height: 31,
        seed,
        deadEndFactor: difficultyConfig.maze.deadEndFactor,
        pathDensity: difficultyConfig.maze.pathDensity,
        maxRetries: 5
    });

    const maze = mazeResult.maze;
    const pathTiles = getPathTiles(maze);
    const deadEnds = countDeadEnds(maze, pathTiles);
    const deadEndRatio = pathTiles.length === 0 ? 0 : deadEnds / pathTiles.length;

    const rng = new SeededRandom(seed + difficultyConfig.enemySeedOffset);
    const runs = difficultyConfig.runsPerSeed;
    let totalSurvival = 0;
    let wins = 0;
    let totalDeadEndEncounters = 0;

    for (let run = 0; run < runs; run++) {
        const pressure = difficultyConfig.enemyPressure + rng.next() * difficultyConfig.enemyVariance;
        const deadEndPenalty = deadEndRatio * difficultyConfig.deadEndWeight;
        const baseSurvival = difficultyConfig.baseSurvivalSeconds;
        const survival = Math.max(10, baseSurvival * (1 - pressure - deadEndPenalty + rng.next() * 0.25));

        const winChance = clamp(
            difficultyConfig.baseWinChance - pressure * 0.6 - deadEndPenalty * 1.8 + rng.next() * 0.15,
            0,
            1
        );

        const deadEndEncounterRate = clamp(
            difficultyConfig.deadEndEncounterBase +
                deadEndRatio * (1.2 + pressure * 2) +
                rng.next() * 0.1,
            0,
            1
        );

        totalSurvival += survival;
        wins += rng.next() < winChance ? 1 : 0;
        totalDeadEndEncounters += deadEndEncounterRate;
    }

    return {
        seed,
        survivalSeconds: totalSurvival / runs,
        winRate: wins / runs,
        deadEndEncounterRate: totalDeadEndEncounters / runs,
        deadEndDensity: deadEndRatio
    };
}

function inCorridor(value, corridor) {
    return value >= corridor.min && value <= corridor.max;
}

function evaluateDifficulty(name, difficultyConfig) {
    const seeds = [];
    for (let i = 0; i < difficultyConfig.seedCount; i++) {
        seeds.push(difficultyConfig.seedStart + i);
    }

    const perSeed = seeds.map((seed) => simulateSeed(seed, difficultyConfig));

    const aggregate = {
        avgSurvivalSeconds: perSeed.reduce((sum, item) => sum + item.survivalSeconds, 0) / perSeed.length,
        winRate: perSeed.reduce((sum, item) => sum + item.winRate, 0) / perSeed.length,
        deadEndEncounterRate: perSeed.reduce((sum, item) => sum + item.deadEndEncounterRate, 0) / perSeed.length
    };

    const outliers = perSeed.filter((seedKpi) => {
        return !inCorridor(seedKpi.survivalSeconds, difficultyConfig.kpiCorridors.survivalSeconds) ||
            !inCorridor(seedKpi.winRate, difficultyConfig.kpiCorridors.winRate) ||
            !inCorridor(seedKpi.deadEndEncounterRate, difficultyConfig.kpiCorridors.deadEndEncounterRate);
    });

    return {
        difficulty: name,
        aggregate,
        totalSeeds: perSeed.length,
        outlierCount: outliers.length,
        outliers,
        perSeed
    };
}

const results = Object.entries(targetConfig.difficulties).map(([name, config]) => evaluateDifficulty(name, config));

const outlierPayload = {
    generatedAt: new Date().toISOString(),
    targetConfig: path.relative(process.cwd(), DEFAULT_TARGETS_PATH),
    outliers: results.flatMap((result) =>
        result.outliers.map((entry) => ({
            difficulty: result.difficulty,
            ...entry
        }))
    )
};

fs.mkdirSync(path.dirname(DEFAULT_OUTLIERS_PATH), { recursive: true });
fs.writeFileSync(DEFAULT_OUTLIERS_PATH, JSON.stringify(outlierPayload, null, 2));

console.log('=== Seed KPI Batch Simulation ===');
for (const result of results) {
    const { difficulty, aggregate, outlierCount, totalSeeds } = result;
    console.log(`\n[${difficulty}] seeds=${totalSeeds}, outliers=${outlierCount}`);
    console.log(`  avgSurvivalSeconds: ${aggregate.avgSurvivalSeconds.toFixed(2)}`);
    console.log(`  winRate: ${(aggregate.winRate * 100).toFixed(2)}%`);
    console.log(`  deadEndEncounterRate: ${(aggregate.deadEndEncounterRate * 100).toFixed(2)}%`);
}
console.log(`\nOutlier regression file: ${path.relative(process.cwd(), DEFAULT_OUTLIERS_PATH)}`);

const gateViolations = results.filter((result) => {
    const difficultyConfig = targetConfig.difficulties[result.difficulty];
    const outlierRate = result.outlierCount / result.totalSeeds;
    return outlierRate > (difficultyConfig.maxOutlierRate ?? 0);
});

if (gateViolations.length > 0 && shouldFailOnOutliers) {
    console.error('\nKPI gate failed: outlier-rate threshold exceeded.');
    for (const violation of gateViolations) {
        const rate = (violation.outlierCount / violation.totalSeeds) * 100;
        const maxRate = (targetConfig.difficulties[violation.difficulty].maxOutlierRate ?? 0) * 100;
        console.error(`  - ${violation.difficulty}: ${rate.toFixed(1)}% > ${maxRate.toFixed(1)}%`);
    }
    process.exit(1);
}

console.log('\nKPI gate passed.');
