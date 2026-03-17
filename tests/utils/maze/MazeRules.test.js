/**
 * Tests for MazeRules
 * Testing rule-based maze validation system
 */

import {
    MAZE_RULES,
    RULE_CATEGORIES,
    RULE_SEVERITIES,
    validateAgainstRules,
    getRuleById,
    getRulesByCategory,
    getAllRuleIds,
    createValidationReport
} from '../../../src/utils/maze/MazeRules.js';

// TILE_TYPES: WALL=1, PATH=0
// Helper to create simple test mazes
function createSimpleConnectedMaze() {
    return [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];
}

function createDisconnectedMaze() {
    return [
        [1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 0, 1],
        [1, 1, 1, 1, 1]
    ];
}

function createMazeWithLongCorridor() {
    return [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
}

function createSpawnPoints(playerX = 1, playerY = 1) {
    return {
        player: { x: playerX, y: playerY },
        ghosts: {
            alpha: { x: 5, y: 1 },
            beta: { x: 5, y: 5 }
        },
        powerPellets: [
            { x: 5, y: 1 },
            { x: 5, y: 5 }
        ]
    };
}

function createDefaultConfig() {
    return {
        minAlternativePaths: 1,
        deadEndDensityThreshold: 0.3,
        maxStraightCorridorLength: 8,
        spawnSafetyRadius: 2,
        spawnSafetyMinFreedomSteps: 10,
        minConnectivityCoverage: 1.0
    };
}

describe('MazeRules', () => {
    describe('Constants', () => {
        it('should define rule categories', () => {
            expect(RULE_CATEGORIES.CONNECTIVITY).toBe('connectivity');
            expect(RULE_CATEGORIES.NAVIGATION).toBe('navigation');
            expect(RULE_CATEGORIES.BALANCE).toBe('balance');
            expect(RULE_CATEGORIES.GAMEPLAY).toBe('gameplay');
            expect(RULE_CATEGORIES.FAIRNESS).toBe('fairness');
        });

        it('should define rule severities', () => {
            expect(RULE_SEVERITIES.ERROR).toBe('error');
            expect(RULE_SEVERITIES.WARNING).toBe('warning');
            expect(RULE_SEVERITIES.INFO).toBe('info');
        });
    });

    describe('MAZE_RULES', () => {
        it('should have all expected rules defined', () => {
            expect(MAZE_RULES.CONNECTIVITY_FULL).toBeDefined();
            expect(MAZE_RULES.ALTERNATIVE_PATHS_MIN).toBeDefined();
            expect(MAZE_RULES.DEAD_END_DENSITY).toBeDefined();
            expect(MAZE_RULES.CORRIDOR_MAX_LENGTH).toBeDefined();
            expect(MAZE_RULES.SPAWN_SAFETY_ZONE).toBeDefined();
            expect(MAZE_RULES.POWER_PELLET_DISTRIBUTION).toBeDefined();
        });

        it('should have all required properties for each rule', () => {
            for (const rule of Object.values(MAZE_RULES)) {
                expect(rule.id).toBeDefined();
                expect(rule.category).toBeDefined();
                expect(rule.description).toBeDefined();
                expect(rule.severity).toBeDefined();
                expect(rule.validate).toBeDefined();
                expect(typeof rule.validate).toBe('function');
            }
        });
    });

    describe('CONNECTIVITY_FULL rule', () => {
        it('should pass for fully connected maze', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = createSpawnPoints(1, 1);
            const config = createDefaultConfig();

            const result = MAZE_RULES.CONNECTIVITY_FULL.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.passed).toBe(true);
            expect(result.value).toBe(1);
            expect(result.message).toContain('vollständig');
        });

        it('should fail for disconnected maze', () => {
            const maze = createDisconnectedMaze();
            const spawnPoints = createSpawnPoints(1, 1);
            const config = createDefaultConfig();

            const result = MAZE_RULES.CONNECTIVITY_FULL.validate(
                maze, 5, 5, spawnPoints, config
            );

            expect(result.passed).toBe(false);
            expect(result.value).toBeLessThan(1);
            expect(result.message).toContain('unzureichend');
        });

        it('should use custom minCoverage threshold', () => {
            const maze = createDisconnectedMaze();
            const spawnPoints = createSpawnPoints(1, 1);
            const config = {
                rules: { connectivity: { minCoverage: 0.4 } }
            };

            const result = MAZE_RULES.CONNECTIVITY_FULL.validate(
                maze, 5, 5, spawnPoints, config
            );

            // With lower threshold, partial connectivity should pass
            expect(result.threshold).toBe(0.4);
        });
    });

    describe('ALTERNATIVE_PATHS_MIN rule', () => {
        it('should pass when enough alternative paths exist', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = createSpawnPoints(1, 1);
            const config = { minAlternativePaths: 1 };

            const result = MAZE_RULES.ALTERNATIVE_PATHS_MIN.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.passed).toBe(true);
        });

        it('should include KPIs in result', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = createSpawnPoints(1, 1);
            const config = createDefaultConfig();

            const result = MAZE_RULES.ALTERNATIVE_PATHS_MIN.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.kpi).toBeDefined();
            expect(result.kpi.minAlternativePaths).toBeDefined();
        });
    });

    describe('DEAD_END_DENSITY rule', () => {
        it('should pass for maze with acceptable dead-end density', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = createSpawnPoints(3, 3);
            const config = { deadEndDensityThreshold: 0.5 };

            const result = MAZE_RULES.DEAD_END_DENSITY.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.passed).toBe(true);
        });

        it('should fail for high dead-end density', () => {
            // Create a maze with many dead ends (ends of paths)
            const maze = [
                [1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 0, 1],
                [1, 0, 0, 0, 1, 0, 1],
                [1, 0, 1, 1, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1]
            ];
            const spawnPoints = createSpawnPoints(1, 1);
            const config = { deadEndDensityThreshold: 0.05 };

            const result = MAZE_RULES.DEAD_END_DENSITY.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.passed).toBe(false);
            expect(result.message).toContain('zu hoch');
        });

        it('should report dead-end count in KPIs', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = createSpawnPoints(3, 3);
            const config = createDefaultConfig();

            const result = MAZE_RULES.DEAD_END_DENSITY.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.kpi.deadEndCount).toBeDefined();
            expect(result.kpi.deadEndDensity).toBeDefined();
        });
    });

    describe('CORRIDOR_MAX_LENGTH rule', () => {
        it('should pass for maze with short corridors', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = createSpawnPoints(3, 3);
            const config = { maxStraightCorridorLength: 10 };

            const result = MAZE_RULES.CORRIDOR_MAX_LENGTH.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.passed).toBe(true);
        });

        it('should fail for maze with long corridor', () => {
            const maze = createMazeWithLongCorridor();
            const spawnPoints = createSpawnPoints(1, 2);
            const config = { maxStraightCorridorLength: 5 };

            const result = MAZE_RULES.CORRIDOR_MAX_LENGTH.validate(
                maze, 12, 5, spawnPoints, config
            );

            expect(result.passed).toBe(false);
            expect(result.message).toContain('zu lang');
        });

        it('should include max length in KPIs', () => {
            const maze = createMazeWithLongCorridor();
            const spawnPoints = createSpawnPoints(1, 2);
            const config = createDefaultConfig();

            const result = MAZE_RULES.CORRIDOR_MAX_LENGTH.validate(
                maze, 12, 5, spawnPoints, config
            );

            expect(result.kpi.maxCorridorLength).toBeDefined();
        });
    });

    describe('SPAWN_SAFETY_ZONE rule', () => {
        it('should pass for spawn with enough freedom', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = createSpawnPoints(3, 3);
            const config = {
                spawnSafetyRadius: 2,
                spawnSafetyMinFreedomSteps: 5
            };

            const result = MAZE_RULES.SPAWN_SAFETY_ZONE.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.passed).toBe(true);
        });

        it('should fail for tight spawn area', () => {
            const maze = [
                [1, 1, 1, 1, 1],
                [1, 0, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1]
            ];
            const spawnPoints = createSpawnPoints(1, 1);
            const config = {
                spawnSafetyRadius: 2,
                spawnSafetyMinFreedomSteps: 10
            };

            const result = MAZE_RULES.SPAWN_SAFETY_ZONE.validate(
                maze, 5, 5, spawnPoints, config
            );

            expect(result.passed).toBe(false);
        });

        it('should include spawn freedom in KPIs', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = createSpawnPoints(3, 3);
            const config = createDefaultConfig();

            const result = MAZE_RULES.SPAWN_SAFETY_ZONE.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.kpi.reachableInSteps).toBeDefined();
            expect(result.kpi.walkableInRadius).toBeDefined();
        });
    });

    describe('POWER_PELLET_DISTRIBUTION rule', () => {
        it('should pass for well-distributed power pellets', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = {
                player: { x: 1, y: 1 },
                ghosts: {},
                powerPellets: [{ x: 5, y: 5 }]
            };
            const config = {
                rules: { powerPellets: { minDistanceFromSpawn: 5 } }
            };

            const result = MAZE_RULES.POWER_PELLET_DISTRIBUTION.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.passed).toBe(true);
        });

        it('should fail for power pellets too close to spawn', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = {
                player: { x: 1, y: 1 },
                ghosts: {},
                powerPellets: [{ x: 2, y: 1 }]
            };
            const config = {
                rules: { powerPellets: { minDistanceFromSpawn: 10 } }
            };

            const result = MAZE_RULES.POWER_PELLET_DISTRIBUTION.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.passed).toBe(false);
            expect(result.message).toContain('zu nah');
        });

        it('should handle empty power pellets array', () => {
            const maze = createSimpleConnectedMaze();
            const spawnPoints = {
                player: { x: 1, y: 1 },
                ghosts: {},
                powerPellets: []
            };
            const config = createDefaultConfig();

            const result = MAZE_RULES.POWER_PELLET_DISTRIBUTION.validate(
                maze, 7, 7, spawnPoints, config
            );

            expect(result.passed).toBe(true);
        });
    });
});

describe('validateAgainstRules', () => {
    it('should return valid result for valid maze', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 7, 7, spawnPoints, config);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for disconnected maze', () => {
        const maze = createDisconnectedMaze();
        const spawnPoints = createSpawnPoints(1, 1);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 5, 5, spawnPoints, config);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should categorize failures by severity', () => {
        const maze = createDisconnectedMaze();
        const spawnPoints = createSpawnPoints(1, 1);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 5, 5, spawnPoints, config);

        // Check that errors contain connectivity error
        const errorIds = result.errors.map(e => e.ruleId);
        expect(errorIds).toContain('connectivity_full');
    });

    it('should include summary', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 7, 7, spawnPoints, config);

        expect(result.summary).toBeDefined();
        expect(result.summary.total).toBeGreaterThan(0);
        expect(result.summary.passed).toBeGreaterThan(0);
    });

    it('should collect KPIs', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 7, 7, spawnPoints, config);

        expect(result.kpis).toBeDefined();
        expect(result.kpis['connectivity_full']).toBeDefined();
    });

    it('should provide convenience methods', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 7, 7, spawnPoints, config);

        expect(typeof result.getMessagesByCategory).toBe('function');
        expect(typeof result.getFailedRules).toBe('function');
        expect(typeof result.getDifficultyKPIs).toBe('function');
    });

    it('should get failed rules', () => {
        const maze = createDisconnectedMaze();
        const spawnPoints = createSpawnPoints(1, 1);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 5, 5, spawnPoints, config);
        const failed = result.getFailedRules();

        expect(failed.length).toBeGreaterThan(0);
        expect(failed.every(r => !r.passed)).toBe(true);
    });

    it('should get difficulty KPIs', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 7, 7, spawnPoints, config);
        const difficultyKPIs = result.getDifficultyKPIs();

        expect(difficultyKPIs.deadEndDensity).toBeDefined();
        expect(difficultyKPIs.maxCorridorLength).toBeDefined();
        expect(difficultyKPIs.minAlternativePaths).toBeDefined();
        expect(difficultyKPIs.spawnFreedom).toBeDefined();
    });

    it('should filter to active rules when specified', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = createDefaultConfig();

        const result = validateAgainstRules(
            maze, 7, 7, spawnPoints, config,
            ['CONNECTIVITY_FULL', 'DEAD_END_DENSITY']
        );

        expect(result.summary.total).toBe(2);
    });

    it('should handle rule execution errors gracefully', () => {
        const maze = null; // Invalid maze
        const spawnPoints = createSpawnPoints(3, 3);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 7, 7, spawnPoints, config);

        // Should not throw, but should report errors
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
});

describe('getRuleById', () => {
    it('should return rule by ID', () => {
        const rule = getRuleById('connectivity_full');
        expect(rule).toBeDefined();
        expect(rule.id).toBe('connectivity_full');
    });

    it('should return null for unknown ID', () => {
        const rule = getRuleById('unknown_rule');
        expect(rule).toBeNull();
    });
});

describe('getRulesByCategory', () => {
    it('should return rules for connectivity category', () => {
        const rules = getRulesByCategory(RULE_CATEGORIES.CONNECTIVITY);
        expect(rules.length).toBeGreaterThan(0);
        expect(rules.every(r => r.category === RULE_CATEGORIES.CONNECTIVITY)).toBe(true);
    });

    it('should return rules for fairness category', () => {
        const rules = getRulesByCategory(RULE_CATEGORIES.FAIRNESS);
        expect(rules.length).toBeGreaterThan(0);
        expect(rules.every(r => r.category === RULE_CATEGORIES.FAIRNESS)).toBe(true);
    });

    it('should return empty array for unknown category', () => {
        const rules = getRulesByCategory('unknown');
        expect(rules).toEqual([]);
    });
});

describe('getAllRuleIds', () => {
    it('should return all rule keys', () => {
        const ids = getAllRuleIds();
        expect(ids).toContain('CONNECTIVITY_FULL');
        expect(ids).toContain('ALTERNATIVE_PATHS_MIN');
        expect(ids).toContain('DEAD_END_DENSITY');
        expect(ids).toContain('CORRIDOR_MAX_LENGTH');
        expect(ids).toContain('SPAWN_SAFETY_ZONE');
        expect(ids).toContain('POWER_PELLET_DISTRIBUTION');
    });
});

describe('createValidationReport', () => {
    it('should create human-readable report for valid maze', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 7, 7, spawnPoints, config);
        const report = createValidationReport(result);

        expect(report).toContain('Maze Validation Report');
        expect(report).toContain('VALID');
    });

    it('should create human-readable report for invalid maze', () => {
        const maze = createDisconnectedMaze();
        const spawnPoints = createSpawnPoints(1, 1);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 5, 5, spawnPoints, config);
        const report = createValidationReport(result);

        expect(report).toContain('INVALID');
        expect(report).toContain('ERRORS:');
    });

    it('should include KPIs in report', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 7, 7, spawnPoints, config);
        const report = createValidationReport(result);

        expect(report).toContain('KPIs:');
        expect(report).toContain('Dead-end density');
    });

    it('should include summary in report', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = createDefaultConfig();

        const result = validateAgainstRules(maze, 7, 7, spawnPoints, config);
        const report = createValidationReport(result);

        expect(report).toContain('Summary:');
        expect(report).toContain('passed');
    });
});

describe('Rule configuration precedence', () => {
    it('should use rules.* format over flat config', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = {
            maxStraightCorridorLength: 5, // Flat config
            rules: {
                corridors: {
                    maxLength: 10 // Nested config should take precedence
                }
            }
        };

        const result = MAZE_RULES.CORRIDOR_MAX_LENGTH.validate(
            maze, 7, 7, spawnPoints, config
        );

        expect(result.threshold).toBe(10);
    });

    it('should use flat config when rules.* not present', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = {
            maxStraightCorridorLength: 5
        };

        const result = MAZE_RULES.CORRIDOR_MAX_LENGTH.validate(
            maze, 7, 7, spawnPoints, config
        );

        expect(result.threshold).toBe(5);
    });

    it('should use default thresholds when neither config present', () => {
        const maze = createSimpleConnectedMaze();
        const spawnPoints = createSpawnPoints(3, 3);
        const config = {};

        const result = MAZE_RULES.CORRIDOR_MAX_LENGTH.validate(
            maze, 7, 7, spawnPoints, config
        );

        expect(result.threshold).toBe(8); // Default
    });
});
