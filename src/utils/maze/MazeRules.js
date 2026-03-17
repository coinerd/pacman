/**
 * MazeRules
 * Rule-based maze validation system
 *
 * Defines validation rules with categories and severities.
 * Each rule validates a specific aspect of maze quality.
 */

import {
    checkConnectivity,
    countEdgeDisjointPaths,
    countWalkableTiles,
    countReachableTilesWithinSteps,
    findMaxStraightCorridorLength
} from './MazeValidation.js';
import { isWalkableTile } from '../MazeLayout.js';
import { calculateStats } from './MazeUtils.js';

/**
 * Rule categories
 * @enum {string}
 */
export const RULE_CATEGORIES = {
    CONNECTIVITY: 'connectivity',
    NAVIGATION: 'navigation',
    BALANCE: 'balance',
    GAMEPLAY: 'gameplay',
    FAIRNESS: 'fairness'
};

/**
 * Rule severities
 * @enum {string}
 */
export const RULE_SEVERITIES = {
    ERROR: 'error',     // Maze unplayable - requires retry
    WARNING: 'warning', // Maze suboptimal - retry preferred
    INFO: 'info'        // Information only - no impact
};

/**
 * Default rule configuration thresholds
 */
const DEFAULT_THRESHOLDS = {
    connectivity: {
        minCoverage: 1.0
    },
    alternativePaths: {
        minPaths: 2
    },
    deadEnds: {
        maxDensity: 0.2,
        minCount: 0,
        maxCount: 50
    },
    corridors: {
        maxLength: 8
    },
    spawnSafety: {
        playerRadius: 2,
        minFreedomSteps: 12,
        minWalkableInRadius: 5
    },
    powerPellets: {
        count: 4,
        minDistanceFromSpawn: 8
    }
};

/**
 * Gets effective thresholds by merging config with defaults
 * @param {object} config - Configuration object
 * @returns {object} Merged thresholds
 */
function getThresholds(config) {
    return {
        connectivity: {
            minCoverage: config?.rules?.connectivity?.minCoverage
                ?? config?.minConnectivityCoverage
                ?? DEFAULT_THRESHOLDS.connectivity.minCoverage
        },
        alternativePaths: {
            minPaths: config?.rules?.alternativePaths?.minPaths
                ?? config?.minAlternativePaths
                ?? DEFAULT_THRESHOLDS.alternativePaths.minPaths
        },
        deadEnds: {
            maxDensity: config?.rules?.deadEnds?.maxDensity
                ?? config?.deadEndDensityThreshold
                ?? DEFAULT_THRESHOLDS.deadEnds.maxDensity,
            minCount: config?.rules?.deadEnds?.minCount
                ?? DEFAULT_THRESHOLDS.deadEnds.minCount,
            maxCount: config?.rules?.deadEnds?.maxCount
                ?? DEFAULT_THRESHOLDS.deadEnds.maxCount
        },
        corridors: {
            maxLength: config?.rules?.corridors?.maxLength
                ?? config?.maxStraightCorridorLength
                ?? DEFAULT_THRESHOLDS.corridors.maxLength
        },
        spawnSafety: {
            playerRadius: config?.rules?.spawnSafety?.playerRadius
                ?? config?.spawnSafetyRadius
                ?? DEFAULT_THRESHOLDS.spawnSafety.playerRadius,
            minFreedomSteps: config?.rules?.spawnSafety?.minFreedomSteps
                ?? config?.spawnSafetyMinFreedomSteps
                ?? DEFAULT_THRESHOLDS.spawnSafety.minFreedomSteps,
            minWalkableInRadius: config?.rules?.spawnSafety?.minWalkableInRadius
                ?? DEFAULT_THRESHOLDS.spawnSafety.minWalkableInRadius
        },
        powerPellets: {
            count: config?.rules?.powerPellets?.count
                ?? DEFAULT_THRESHOLDS.powerPellets.count,
            minDistanceFromSpawn: config?.rules?.powerPellets?.minDistanceFromSpawn
                ?? DEFAULT_THRESHOLDS.powerPellets.minDistanceFromSpawn
        }
    };
}

/**
 * Helper: Get Manhattan distance between two points
 */
function getManhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Helper: Count walkable tiles in radius around a point
 */
function countWalkableInRadius(maze, width, height, center, radius) {
    let count = 0;
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const x = center.x + dx;
            const y = center.y + dy;
            if (x >= 0 && x < width && y >= 0 && y < height) {
                if (isWalkableTile(maze, x, y)) {
                    count++;
                }
            }
        }
    }
    return count;
}

/**
 * MAZE RULES DEFINITIONS
 * Each rule has:
 * - id: Unique identifier
 * - category: Rule category for grouping
 * - description: Human-readable description
 * - severity: error | warning | info
 * - validate: Function that returns { passed, value, threshold, message, details? }
 */
export const MAZE_RULES = {
    // === CONNECTIVITY RULES ===
    CONNECTIVITY_FULL: {
        id: 'connectivity_full',
        category: RULE_CATEGORIES.CONNECTIVITY,
        description: 'Alle begehbaren Tiles müssen verbunden sein',
        severity: RULE_SEVERITIES.ERROR,
        validate: (maze, width, height, spawnPoints, config) => {
            const thresholds = getThresholds(config);
            const result = checkConnectivity(maze, width, height, spawnPoints.player);
            const minCoverage = thresholds.connectivity.minCoverage;

            return {
                passed: result.coverage >= minCoverage,
                value: result.coverage,
                threshold: minCoverage,
                message: result.coverage < minCoverage
                    ? `Connectivity unzureichend: ${(result.coverage * 100).toFixed(1)}% (min: ${(minCoverage * 100).toFixed(1)}%)`
                    : 'Maze vollständig verbunden',
                kpi: { coverage: result.coverage }
            };
        }
    },

    // === NAVIGATION RULES ===
    ALTERNATIVE_PATHS_MIN: {
        id: 'alternative_paths_min',
        category: RULE_CATEGORIES.NAVIGATION,
        description: 'Mindestens N alternative Fluchtwege zu wichtigen Zielen',
        severity: RULE_SEVERITIES.WARNING,
        validate: (maze, width, height, spawnPoints, config) => {
            const thresholds = getThresholds(config);
            const minPaths = thresholds.alternativePaths.minPaths;
            const requiredPaths = minPaths + 1;

            const results = [];
            const allTargets = [
                ...Object.values(spawnPoints.ghosts),
                ...(spawnPoints.powerPellets || [])
            ];

            for (const target of allTargets) {
                const pathCount = countEdgeDisjointPaths(
                    maze, width, height,
                    spawnPoints.player, target, requiredPaths + 1
                );
                results.push({
                    target: { x: target.x, y: target.y },
                    pathCount,
                    passed: pathCount >= requiredPaths
                });
            }

            const minPathCount = results.length > 0
                ? Math.min(...results.map(r => r.pathCount))
                : 0;
            const allPassed = results.every(r => r.passed);
            const failedTargets = results.filter(r => !r.passed);

            return {
                passed: allPassed,
                value: minPathCount,
                threshold: requiredPaths,
                details: results,
                message: allPassed
                    ? `Alternative Pfade OK (min: ${minPathCount})`
                    : `Unzureichende Pfade zu ${failedTargets.length} Ziel(en)`,
                kpi: {
                    minAlternativePaths: minPathCount,
                    targetCount: allTargets.length,
                    failedTargets: failedTargets.length
                }
            };
        }
    },

    // === BALANCE RULES ===
    DEAD_END_DENSITY: {
        id: 'dead_end_density',
        category: RULE_CATEGORIES.BALANCE,
        description: 'Sackgassen-Dichte muss im erlaubten Bereich liegen',
        severity: RULE_SEVERITIES.WARNING,
        validate: (maze, width, height, _spawnPoints, config) => {
            const thresholds = getThresholds(config);
            const stats = calculateStats(maze, width, height);
            const walkableTiles = countWalkableTiles(maze, width, height);
            const density = walkableTiles > 0 ? stats.deadEnds / walkableTiles : 0;
            const maxDensity = thresholds.deadEnds.maxDensity;
            const { minCount, maxCount } = thresholds.deadEnds;

            const densityOk = density <= maxDensity;
            const countOk = stats.deadEnds >= minCount && stats.deadEnds <= maxCount;

            return {
                passed: densityOk && countOk,
                value: density,
                threshold: maxDensity,
                details: {
                    deadEndCount: stats.deadEnds,
                    density,
                    minCount,
                    maxCount
                },
                message: !densityOk
                    ? `Sackgassen-Dichte zu hoch: ${(density * 100).toFixed(1)}% (max: ${(maxDensity * 100).toFixed(1)}%)`
                    : !countOk && stats.deadEnds < minCount
                        ? `Zu wenige Sackgassen: ${stats.deadEnds} (min: ${minCount})`
                        : !countOk && stats.deadEnds > maxCount
                            ? `Zu viele Sackgassen: ${stats.deadEnds} (max: ${maxCount})`
                            : `Sackgassen-Dichte OK: ${(density * 100).toFixed(1)}% (${stats.deadEnds} Sackgassen)`,
                kpi: {
                    deadEndCount: stats.deadEnds,
                    deadEndDensity: density,
                    walkableTiles
                }
            };
        }
    },

    POWER_PELLET_DISTRIBUTION: {
        id: 'power_pellet_distribution',
        category: RULE_CATEGORIES.BALANCE,
        description: 'Power Pellets müssen gut verteilt sein',
        severity: RULE_SEVERITIES.INFO,
        validate: (maze, width, height, spawnPoints, config) => {
            const thresholds = getThresholds(config);
            const minDist = thresholds.powerPellets.minDistanceFromSpawn;
            const powerPellets = spawnPoints.powerPellets || [];

            const results = powerPellets.map(pp => {
                const dist = getManhattanDistance(
                    spawnPoints.player.x, spawnPoints.player.y,
                    pp.x, pp.y
                );
                return { position: pp, distance: dist, passed: dist >= minDist };
            });

            const allPassed = results.every(r => r.passed);
            const avgDistance = results.length > 0
                ? results.reduce((sum, r) => sum + r.distance, 0) / results.length
                : 0;
            const minDistance = results.length > 0
                ? Math.min(...results.map(r => r.distance))
                : 0;

            return {
                passed: allPassed,
                details: results,
                message: allPassed
                    ? `Power Pellets gut verteilt (⌀${avgDistance.toFixed(1)} Tiles vom Spawn)`
                    : `${results.filter(r => !r.passed).length} Power Pellet(s) zu nah am Spawn`,
                kpi: {
                    powerPelletCount: powerPellets.length,
                    avgDistanceFromSpawn: avgDistance,
                    minDistanceFromSpawn: minDistance
                }
            };
        }
    },

    // === GAMEPLAY RULES ===
    CORRIDOR_MAX_LENGTH: {
        id: 'corridor_max_length',
        category: RULE_CATEGORIES.GAMEPLAY,
        description: 'Gerade Korridore dürfen maximale Länge nicht überschreiten',
        severity: RULE_SEVERITIES.WARNING,
        validate: (maze, width, height, _spawnPoints, config) => {
            const thresholds = getThresholds(config);
            const maxLen = findMaxStraightCorridorLength(maze, width, height);
            const threshold = thresholds.corridors.maxLength;

            return {
                passed: maxLen <= threshold,
                value: maxLen,
                threshold: threshold,
                message: maxLen > threshold
                    ? `Korridor zu lang: ${maxLen} Tiles (max: ${threshold})`
                    : `Korridor-Länge OK: max ${maxLen} Tiles`,
                kpi: { maxCorridorLength: maxLen }
            };
        }
    },

    // === FAIRNESS RULES ===
    SPAWN_SAFETY_ZONE: {
        id: 'spawn_safety_zone',
        category: RULE_CATEGORIES.FAIRNESS,
        description: 'Spawn-Bereich muss ausreichend Bewegungsfreiheit bieten',
        severity: RULE_SEVERITIES.ERROR,
        validate: (maze, width, height, spawnPoints, config) => {
            const thresholds = getThresholds(config);
            const radius = thresholds.spawnSafety.playerRadius;
            const minSteps = thresholds.spawnSafety.minFreedomSteps;
            const minWalkableInRadius = thresholds.spawnSafety.minWalkableInRadius;

            const walkableInRadius = countWalkableInRadius(
                maze, width, height, spawnPoints.player, radius
            );

            const reachableSteps = countReachableTilesWithinSteps(
                maze, width, height, spawnPoints.player, minSteps
            );

            const radiusOk = walkableInRadius >= minWalkableInRadius;
            const freedomOk = reachableSteps >= minSteps;
            const passed = radiusOk && freedomOk;

            return {
                passed,
                values: { walkableInRadius, reachableSteps },
                thresholds: {
                    minWalkableInRadius,
                    minFreedomSteps: minSteps
                },
                message: !radiusOk
                    ? `Spawn-Bereich zu eng: ${walkableInRadius} Tiles im Radius ${radius} (min: ${minWalkableInRadius})`
                    : !freedomOk
                        ? `Bewegungsfreiheit unzureichend: ${reachableSteps} Tiles in ${minSteps} Schritten`
                        : `Spawn-Bereich sicher: ${reachableSteps} Tiles in ${minSteps} Schritten erreichbar`,
                kpi: {
                    walkableInRadius,
                    reachableInSteps: reachableSteps,
                    playerRadius: radius
                }
            };
        }
    }
};

/**
 * Validates maze against all active rules
 * @param {number[][]} maze - The maze grid
 * @param {number} width - Maze width
 * @param {number} height - Maze height
 * @param {object} spawnPoints - Spawn points { player, ghosts, powerPellets }
 * @param {object} config - Configuration with rule thresholds
 * @param {string[]} [activeRules] - Optional array of rule IDs to run (default: all)
 * @returns {object} Validation result { isValid, errors, warnings, info, results, kpis, summary }
 */
export function validateAgainstRules(maze, width, height, spawnPoints, config, activeRules = null) {
    const results = [];
    const errors = [];
    const warnings = [];
    const info = [];
    const kpis = {};

    // Determine which rules to run
    const rulesToRun = activeRules
        ? Object.entries(MAZE_RULES).filter(([key]) => activeRules.includes(key))
        : Object.entries(MAZE_RULES);

    for (const [key, rule] of rulesToRun) {
        try {
            const result = rule.validate(maze, width, height, spawnPoints, config);

            const ruleResult = {
                rule: key,
                ruleId: rule.id,
                category: rule.category,
                severity: rule.severity,
                description: rule.description,
                passed: result.passed,
                value: result.value,
                threshold: result.threshold,
                message: result.message,
                details: result.details || null,
                values: result.values || null,
                thresholds: result.thresholds || null
            };

            results.push(ruleResult);

            // Collect KPIs
            if (result.kpi) {
                kpis[rule.id] = result.kpi;
            }

            // Categorize by severity
            if (!result.passed) {
                if (rule.severity === RULE_SEVERITIES.ERROR) {
                    errors.push(ruleResult);
                } else if (rule.severity === RULE_SEVERITIES.WARNING) {
                    warnings.push(ruleResult);
                } else {
                    info.push(ruleResult);
                }
            }
        } catch (error) {
            // Rule execution failed - treat as error
            const errorResult = {
                rule: key,
                ruleId: rule.id,
                category: rule.category,
                severity: RULE_SEVERITIES.ERROR,
                description: rule.description,
                passed: false,
                error: error.message,
                message: `Regel-Validierung fehlgeschlagen: ${error.message}`
            };
            results.push(errorResult);
            errors.push(errorResult);
        }
    }

    const summary = {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        errorCount: errors.length,
        warningCount: warnings.length,
        infoCount: info.length
    };

    return {
        isValid: errors.length === 0,
        results,
        errors,
        warnings,
        info,
        kpis,
        summary,

        // Convenience methods
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        hasInfo: info.length > 0,

        // Get all messages for a category
        getMessagesByCategory: (category) =>
            results.filter(r => r.category === category).map(r => r.message),

        // Get all failed rules
        getFailedRules: () =>
            results.filter(r => !r.passed),

        // Get KPIs for difficulty scoring
        getDifficultyKPIs: () => ({
            deadEndDensity: kpis.dead_end_density?.deadEndDensity ?? 0,
            maxCorridorLength: kpis.corridor_max_length?.maxCorridorLength ?? 0,
            minAlternativePaths: kpis.alternative_paths_min?.minAlternativePaths ?? 0,
            spawnFreedom: kpis.spawn_safety_zone?.reachableInSteps ?? 0,
            powerPelletDistance: kpis.power_pellet_distribution?.avgDistanceFromSpawn ?? 0
        })
    };
}

/**
 * Gets rule definition by ID
 * @param {string} ruleId - Rule ID
 * @returns {object|null} Rule definition or null if not found
 */
export function getRuleById(ruleId) {
    return Object.values(MAZE_RULES).find(rule => rule.id === ruleId) || null;
}

/**
 * Gets all rules for a category
 * @param {string} category - Rule category
 * @returns {object[]} Array of rule definitions
 */
export function getRulesByCategory(category) {
    return Object.values(MAZE_RULES).filter(rule => rule.category === category);
}

/**
 * Gets all rule IDs
 * @returns {string[]} Array of rule IDs
 */
export function getAllRuleIds() {
    return Object.keys(MAZE_RULES);
}

/**
 * Creates a summary report of validation results
 * @param {object} validationResult - Result from validateAgainstRules
 * @returns {string} Human-readable report
 */
export function createValidationReport(validationResult) {
    const lines = [
        '=== Maze Validation Report ===',
        '',
        `Status: ${validationResult.isValid ? '✓ VALID' : '✗ INVALID'}`,
        '',
        `Summary: ${validationResult.summary.passed}/${validationResult.summary.total} rules passed`,
        `  Errors: ${validationResult.summary.errorCount}`,
        `  Warnings: ${validationResult.summary.warningCount}`,
        `  Info: ${validationResult.summary.infoCount}`,
        ''
    ];

    if (validationResult.errors.length > 0) {
        lines.push('ERRORS:');
        for (const err of validationResult.errors) {
            lines.push(`  [${err.ruleId}] ${err.message}`);
        }
        lines.push('');
    }

    if (validationResult.warnings.length > 0) {
        lines.push('WARNINGS:');
        for (const warn of validationResult.warnings) {
            lines.push(`  [${warn.ruleId}] ${warn.message}`);
        }
        lines.push('');
    }

    if (validationResult.info.length > 0) {
        lines.push('INFO:');
        for (const inf of validationResult.info) {
            lines.push(`  [${inf.ruleId}] ${inf.message}`);
        }
        lines.push('');
    }

    lines.push('KPIs:');
    const difficultyKPIs = validationResult.getDifficultyKPIs();
    lines.push(`  Dead-end density: ${(difficultyKPIs.deadEndDensity * 100).toFixed(1)}%`);
    lines.push(`  Max corridor length: ${difficultyKPIs.maxCorridorLength}`);
    lines.push(`  Min alternative paths: ${difficultyKPIs.minAlternativePaths}`);
    lines.push(`  Spawn freedom: ${difficultyKPIs.spawnFreedom} tiles`);
    lines.push(`  Avg power pellet distance: ${difficultyKPIs.powerPelletDistance.toFixed(1)}`);

    return lines.join('\n');
}
