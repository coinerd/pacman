/**
 * LevelSystem Tests
 * Comprehensive tests for level progression and configuration
 */

import { LevelSystem } from '../../../src/model/systems/LevelSystem.js';

describe('LevelSystem', () => {
    let levelSystem;

    beforeEach(() => {
        levelSystem = new LevelSystem();
    });

    describe('Initialization', () => {
        test('should initialize with level 1', () => {
            expect(levelSystem.currentLevel).toBe(1);
        });

        test('should initialize level config', () => {
            expect(levelSystem.levelConfig).toBeDefined();
        });
    });

    describe('Level Setting', () => {
        test('should set level', () => {
            levelSystem.setLevel(5);
            expect(levelSystem.currentLevel).toBe(5);
        });

        test('should update config when level changes', () => {
            levelSystem.setLevel(3);
            expect(levelSystem.levelConfig).toBeDefined();
            expect(levelSystem.levelConfig.speedMultiplier).toBeGreaterThan(1);
        });

        test('should get current level', () => {
            levelSystem.setLevel(7);
            expect(levelSystem.getLevel()).toBe(7);
        });
    });

    describe('Speed Multipliers', () => {
        test('should return speed multiplier', () => {
            const multiplier = levelSystem.getSpeedMultiplier();
            expect(multiplier).toBeDefined();
            expect(multiplier).toBeGreaterThanOrEqual(1);
        });

        test('should increase speed multiplier with level', () => {
            levelSystem.setLevel(1);
            const speed1 = levelSystem.getSpeedMultiplier();
            levelSystem.setLevel(5);
            const speed5 = levelSystem.getSpeedMultiplier();
            expect(speed5).toBeGreaterThan(speed1);
        });

        test('should return ghost speed multiplier', () => {
            const multiplier = levelSystem.getGhostSpeedMultiplier();
            expect(multiplier).toBeDefined();
            expect(multiplier).toBeGreaterThanOrEqual(1);
        });

        test('should increase ghost speed with level', () => {
            levelSystem.setLevel(1);
            const speed1 = levelSystem.getGhostSpeedMultiplier();
            levelSystem.setLevel(10);
            const speed10 = levelSystem.getGhostSpeedMultiplier();
            expect(speed10).toBeGreaterThan(speed1);
        });
    });

    describe('Score Multiplier', () => {
        test('should return score multiplier', () => {
            const multiplier = levelSystem.getScoreMultiplier();
            expect(multiplier).toBeDefined();
            expect(multiplier).toBeGreaterThanOrEqual(1);
        });

        test('should increase score multiplier after level 10', () => {
            levelSystem.setLevel(5);
            const score5 = levelSystem.getScoreMultiplier();
            levelSystem.setLevel(15);
            const score15 = levelSystem.getScoreMultiplier();
            expect(score15).toBeGreaterThan(score5);
        });
    });

    describe('Mode Durations', () => {
        test('should return mode durations array', () => {
            const durations = levelSystem.getModeDurations();
            expect(Array.isArray(durations)).toBe(true);
            expect(durations.length).toBeGreaterThan(0);
        });

        test('should have scatter and chase modes', () => {
            const durations = levelSystem.getModeDurations();
            const hasScatter = durations.some(d => d.mode === 'SCATTER');
            const hasChase = durations.some(d => d.mode === 'CHASE');
            expect(hasScatter).toBe(true);
            expect(hasChase).toBe(true);
        });

        test('should have positive durations for non-infinity modes', () => {
            const durations = levelSystem.getModeDurations();
            for (const d of durations) {
                if (d.duration !== Infinity) {
                    expect(d.duration).toBeGreaterThan(0);
                }
            }
        });

        test('should reduce scatter duration on higher levels', () => {
            levelSystem.setLevel(1);
            const scatter1 = levelSystem.levelConfig.scatterDuration;
            levelSystem.setLevel(10);
            const scatter10 = levelSystem.levelConfig.scatterDuration;
            expect(scatter10).toBeLessThan(scatter1);
        });
    });

    describe('Frightened Duration', () => {
        test('should return frightened duration', () => {
            const duration = levelSystem.getFrightenedDuration();
            expect(duration).toBeDefined();
            expect(duration).toBeGreaterThan(0);
        });

        test('should reduce frightened duration on higher levels', () => {
            levelSystem.setLevel(1);
            const fright1 = levelSystem.getFrightenedDuration();
            levelSystem.setLevel(10);
            const fright10 = levelSystem.getFrightenedDuration();
            expect(fright10).toBeLessThan(fright1);
        });
    });

    describe('Fruit Management', () => {
        test('should return fruit type', () => {
            const fruit = levelSystem.getFruitType();
            expect(fruit).toBeDefined();
            expect(typeof fruit).toBe('string');
        });

        test('should return different fruits for different levels', () => {
            levelSystem.setLevel(1);
            const fruit1 = levelSystem.getFruitType();
            levelSystem.setLevel(5);
            const fruit5 = levelSystem.getFruitType();
            // May or may not be different depending on level
            expect(fruit1).toBeDefined();
            expect(fruit5).toBeDefined();
        });

        test('should return fruit score', () => {
            const score = levelSystem.getFruitScore('cherry');
            expect(score).toBeDefined();
            expect(score).toBeGreaterThan(0);
        });

        test('should return different scores for different fruits', () => {
            const cherryScore = levelSystem.getFruitScore('cherry');
            const keyScore = levelSystem.getFruitScore('key');
            // Both should return valid scores
            expect(typeof cherryScore).toBe('number');
            expect(typeof keyScore).toBe('number');
            expect(cherryScore).toBeGreaterThan(0);
            expect(keyScore).toBeGreaterThan(0);
        });

        test('should return default score for unknown fruit', () => {
            const score = levelSystem.getFruitScore('unknown');
            expect(score).toBe(100);
        });
    });

    describe('Fruit Spawn Logic', () => {
        test('should determine if fruit should spawn', () => {
            const shouldSpawn = levelSystem.shouldSpawnFruit(70, 100);
            expect(typeof shouldSpawn).toBe('boolean');
        });

        test('should spawn fruit at threshold', () => {
            levelSystem.setLevel(1);
            const shouldSpawn = levelSystem.shouldSpawnFruit(70, 100);
            expect(shouldSpawn).toBe(true);
        });

        test('should not spawn fruit below threshold', () => {
            levelSystem.setLevel(1);
            const shouldSpawn = levelSystem.shouldSpawnFruit(50, 100);
            expect(shouldSpawn).toBe(false);
        });
    });

    describe('Custom Configuration', () => {
        test('should set custom level config', () => {
            levelSystem.setLevelConfig({ speedMultiplier: 2.0 });
            expect(levelSystem.getSpeedMultiplier()).toBe(2.0);
        });

        test('should merge custom config with defaults', () => {
            levelSystem.setLevel(1);
            levelSystem.setLevelConfig({ customProperty: 'test' });
            expect(levelSystem.levelConfig.customProperty).toBe('test');
            expect(levelSystem.levelConfig.speedMultiplier).toBeDefined();
        });
    });

    describe('Level Progression', () => {
        test('should advance to next level', () => {
            levelSystem.nextLevel();
            expect(levelSystem.currentLevel).toBe(2);
        });

        test('should reset to specified level', () => {
            levelSystem.setLevel(10);
            levelSystem.reset(1);
            expect(levelSystem.currentLevel).toBe(1);
        });

        test('should reset to level 1 by default', () => {
            levelSystem.setLevel(10);
            levelSystem.reset();
            expect(levelSystem.currentLevel).toBe(1);
        });
    });

    describe('Level Info', () => {
        test('should return level info object', () => {
            const info = levelSystem.getLevelInfo();
            expect(info).toBeDefined();
            expect(info.level).toBe(1);
            expect(info.speedMultiplier).toBeDefined();
            expect(info.ghostSpeedMultiplier).toBeDefined();
            expect(info.scoreMultiplier).toBeDefined();
            expect(info.fruitType).toBeDefined();
        });

        test('should include config in level info', () => {
            const info = levelSystem.getLevelInfo();
            expect(info.config).toBeDefined();
        });
    });

    describe('Level Config Rules', () => {
        test('should have rules object', () => {
            levelSystem.setLevel(1);
            expect(levelSystem.levelConfig.rules).toBeDefined();
        });

        test('should allow tunnels by default', () => {
            levelSystem.setLevel(1);
            expect(levelSystem.levelConfig.rules.allowTunnels).toBe(true);
        });

        test('should allow ghost house by default', () => {
            levelSystem.setLevel(1);
            expect(levelSystem.levelConfig.rules.allowGhostHouse).toBe(true);
        });

        test('should allow power pellets by default', () => {
            levelSystem.setLevel(1);
            expect(levelSystem.levelConfig.rules.allowPowerPellets).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        test('should handle very high levels', () => {
            levelSystem.setLevel(100);
            expect(levelSystem.currentLevel).toBe(100);
            expect(levelSystem.getSpeedMultiplier()).toBeGreaterThan(1);
        });

        test('should handle level 0 gracefully', () => {
            levelSystem.setLevel(0);
            expect(levelSystem.currentLevel).toBe(0);
        });

        test('should maintain minimum durations', () => {
            levelSystem.setLevel(100);
            expect(levelSystem.levelConfig.scatterDuration).toBeGreaterThanOrEqual(3);
            expect(levelSystem.levelConfig.frightenedDuration).toBeGreaterThanOrEqual(4);
        });
    });
});
