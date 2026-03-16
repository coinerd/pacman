/**
 * Tests for AIStrategies
 * Pure functions for AI behavior
 */

import {
    getDistance,
    getManhattanDistance,
    alphaStrategy,
    betaStrategy,
    gammaStrategy,
    deltaStrategy,
    randomStrategy,
    returnToCoreStrategy,
    AIStrategies,
    chooseDirectionToTarget,
    calculateTarget
} from '../../../src/movement/core/AIStrategies.js';
import { Direction } from '../../../src/movement/core/Direction.js';

describe('AIStrategies', () => {
    describe('getDistance', () => {
        test('calculates euclidean distance between two points', () => {
            expect(getDistance(0, 0, 3, 4)).toBe(5);
            expect(getDistance(0, 0, 0, 0)).toBe(0);
            expect(getDistance(1, 1, 4, 5)).toBe(5);
        });

        test('handles negative coordinates', () => {
            expect(getDistance(-3, -4, 0, 0)).toBe(5);
        });

        test('handles floating point results', () => {
            const dist = getDistance(0, 0, 1, 1);
            expect(dist).toBeCloseTo(Math.sqrt(2), 5);
        });
    });

    describe('getManhattanDistance', () => {
        test('calculates manhattan distance', () => {
            expect(getManhattanDistance(0, 0, 3, 4)).toBe(7);
            expect(getManhattanDistance(0, 0, 0, 0)).toBe(0);
        });

        test('handles negative coordinates', () => {
            expect(getManhattanDistance(-2, -3, 2, 3)).toBe(10);
        });
    });

    describe('alphaStrategy', () => {
        const scatterTarget = { x: 24, y: 0 };

        test('returns scatter target in SCATTER mode', () => {
            const context = {
                player: { gridX: 5, gridY: 5, direction: Direction.RIGHT },
                mode: 'SCATTER',
                scatterTarget
            };

            const target = alphaStrategy(context);
            expect(target).toEqual(scatterTarget);
        });

        test('returns scatter target when no player', () => {
            const context = {
                player: null,
                mode: 'CHASE',
                scatterTarget
            };

            const target = alphaStrategy(context);
            expect(target).toEqual(scatterTarget);
        });

        test('returns player position in CHASE mode', () => {
            const context = {
                player: { gridX: 10, gridY: 15, direction: Direction.RIGHT },
                mode: 'CHASE',
                scatterTarget
            };

            const target = alphaStrategy(context);
            expect(target).toEqual({ x: 10, y: 15 });
        });
    });

    describe('betaStrategy', () => {
        const scatterTarget = { x: 0, y: 0 };

        test('returns scatter target in SCATTER mode', () => {
            const context = {
                player: { gridX: 5, gridY: 5, direction: Direction.RIGHT },
                mode: 'SCATTER',
                scatterTarget
            };

            const target = betaStrategy(context);
            expect(target).toEqual(scatterTarget);
        });

        test('targets 4 tiles ahead in direction player is moving', () => {
            const context = {
                player: { gridX: 10, gridY: 10, direction: Direction.RIGHT },
                mode: 'CHASE',
                scatterTarget
            };

            const target = betaStrategy(context);
            expect(target).toEqual({ x: 14, y: 10 });
        });

        test('targets 4 tiles up and 4 tiles left when moving up (arcade bug)', () => {
            const context = {
                player: { gridX: 10, gridY: 10, direction: Direction.UP },
                mode: 'CHASE',
                scatterTarget
            };

            const target = betaStrategy(context);
            // Arcade bug: up direction also moves target left
            expect(target).toEqual({ x: 6, y: 6 });
        });

        test('handles down direction', () => {
            const context = {
                player: { gridX: 10, gridY: 10, direction: Direction.DOWN },
                mode: 'CHASE',
                scatterTarget
            };

            const target = betaStrategy(context);
            expect(target).toEqual({ x: 10, y: 14 });
        });

        test('handles left direction', () => {
            const context = {
                player: { gridX: 10, gridY: 10, direction: Direction.LEFT },
                mode: 'CHASE',
                scatterTarget
            };

            const target = betaStrategy(context);
            expect(target).toEqual({ x: 6, y: 10 });
        });
    });

    describe('gammaStrategy', () => {
        const scatterTarget = { x: 28, y: 0 };

        test('returns scatter target in SCATTER mode', () => {
            const context = {
                player: { gridX: 5, gridY: 5, direction: Direction.RIGHT },
                mode: 'SCATTER',
                scatterTarget,
                allEntities: []
            };

            const target = gammaStrategy(context);
            expect(target).toEqual(scatterTarget);
        });

        test('doubles vector from alpha to pivot point', () => {
            const context = {
                player: { gridX: 10, gridY: 10, direction: Direction.RIGHT },
                mode: 'CHASE',
                scatterTarget,
                allEntities: [
                    { aiType: 'alpha', gridX: 8, gridY: 10 }
                ]
            };

            // Pivot is 2 tiles ahead: (12, 10)
            // Vector from alpha (8, 10) to pivot (12, 10) is (4, 0)
            // Double it: (8, 0)
            // Target = pivot + doubled vector = (12 + 4, 10 + 0) = (16, 10)
            const target = gammaStrategy(context);
            expect(target).toEqual({ x: 16, y: 10 });
        });

        test('returns pivot when no alpha found', () => {
            const context = {
                player: { gridX: 10, gridY: 10, direction: Direction.RIGHT },
                mode: 'CHASE',
                scatterTarget,
                allEntities: []
            };

            // No alpha, so target should be pivot (2 tiles ahead)
            const target = gammaStrategy(context);
            expect(target).toEqual({ x: 12, y: 10 });
        });
    });

    describe('deltaStrategy', () => {
        const scatterTarget = { x: 0, y: 32 };

        test('returns scatter target in SCATTER mode', () => {
            const context = {
                entity: { gridX: 5, gridY: 5 },
                player: { gridX: 10, gridY: 10 },
                mode: 'SCATTER',
                scatterTarget
            };

            const target = deltaStrategy(context);
            expect(target).toEqual(scatterTarget);
        });

        test('chases player when far away (>8 tiles)', () => {
            const context = {
                entity: { gridX: 0, gridY: 0 },
                player: { gridX: 15, gridY: 15 },
                mode: 'CHASE',
                scatterTarget
            };

            const target = deltaStrategy(context);
            expect(target).toEqual({ x: 15, y: 15 });
        });

        test('returns to scatter corner when close (<=8 tiles)', () => {
            const context = {
                entity: { gridX: 5, gridY: 5 },
                player: { gridX: 7, gridY: 7 },
                mode: 'CHASE',
                scatterTarget
            };

            const target = deltaStrategy(context);
            expect(target).toEqual(scatterTarget);
        });

        test('boundary case: exactly 8 tiles is close', () => {
            const context = {
                entity: { gridX: 0, gridY: 0 },
                player: { gridX: 8, gridY: 0 },
                mode: 'CHASE',
                scatterTarget
            };

            const target = deltaStrategy(context);
            // Distance is exactly 8, should scatter
            expect(target).toEqual(scatterTarget);
        });
    });

    describe('randomStrategy', () => {
        test('always returns null', () => {
            expect(randomStrategy()).toBeNull();
            expect(randomStrategy({})).toBeNull();
            expect(randomStrategy(null)).toBeNull();
        });
    });

    describe('returnToCoreStrategy', () => {
        test('returns virus core center from context', () => {
            const context = {
                virusCoreCenter: { x: 13, y: 14 }
            };

            const target = returnToCoreStrategy(context);
            expect(target).toEqual({ x: 13, y: 14 });
        });

        test('returns default position when no core center', () => {
            const context = {};

            const target = returnToCoreStrategy(context);
            expect(target).toEqual({ x: 13, y: 14 });
        });
    });

    describe('AIStrategies map', () => {
        test('contains all strategy types', () => {
            expect(AIStrategies.alpha).toBe(alphaStrategy);
            expect(AIStrategies.beta).toBe(betaStrategy);
            expect(AIStrategies.gamma).toBe(gammaStrategy);
            expect(AIStrategies.delta).toBe(deltaStrategy);
            expect(AIStrategies.random).toBe(randomStrategy);
            expect(AIStrategies.returnToCore).toBe(returnToCoreStrategy);
        });
    });

    describe('chooseDirectionToTarget', () => {
        const entity = { gridX: 5, gridY: 5, direction: Direction.RIGHT };

        test('returns null when no valid directions', () => {
            const result = chooseDirectionToTarget(entity, { x: 10, y: 10 }, []);
            expect(result).toBeNull();
        });

        test('returns single available direction', () => {
            const validDirs = [Direction.UP];
            const result = chooseDirectionToTarget(entity, { x: 10, y: 10 }, validDirs);
            expect(result).toBe(Direction.UP);
        });

        test('filters out reverse direction', () => {
            // Entity moving RIGHT, should not choose LEFT
            const validDirs = [Direction.LEFT, Direction.UP, Direction.DOWN];
            const result = chooseDirectionToTarget(entity, { x: 10, y: 10 }, validDirs);
            expect(result).not.toBe(Direction.LEFT);
        });

        test('uses all directions if filtering removes all', () => {
            // Only direction available is reverse
            const entityWithDir = { gridX: 5, gridY: 5, direction: Direction.RIGHT };
            const validDirs = [Direction.LEFT];
            const result = chooseDirectionToTarget(entityWithDir, { x: 0, y: 5 }, validDirs);
            // Should still return LEFT even though it's reverse
            expect(result).toBe(Direction.LEFT);
        });

        test('chooses direction closest to target', () => {
            // Entity at (5, 5), target at (10, 5)
            // RIGHT gets closer than UP or DOWN
            const validDirs = [Direction.RIGHT, Direction.UP, Direction.DOWN];
            const result = chooseDirectionToTarget(entity, { x: 10, y: 5 }, validDirs);
            expect(result).toBe(Direction.RIGHT);
        });

        test('returns random direction when no target', () => {
            const validDirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
            const results = new Set();

            for (let i = 0; i < 50; i++) {
                const result = chooseDirectionToTarget(entity, null, validDirs);
                results.add(result);
            }

            // Should have picked different directions over 50 runs
            expect(results.size).toBeGreaterThan(1);
        });

        test('handles entity with NONE direction', () => {
            const entityNone = { gridX: 5, gridY: 5, direction: Direction.NONE };
            const validDirs = [Direction.UP, Direction.DOWN];
            const result = chooseDirectionToTarget(entityNone, { x: 5, y: 0 }, validDirs);
            expect(result).toBe(Direction.UP);
        });

        test('uses custom distance function', () => {
            const mockDistance = jest.fn().mockReturnValue(1);
            const validDirs = [Direction.UP, Direction.DOWN];

            chooseDirectionToTarget(entity, { x: 10, y: 10 }, validDirs, mockDistance);

            expect(mockDistance).toHaveBeenCalled();
        });
    });

    describe('calculateTarget', () => {
        const baseContext = {
            player: { gridX: 10, gridY: 10, direction: Direction.RIGHT },
            mode: 'CHASE',
            scatterTarget: { x: 0, y: 0 },
            entity: { gridX: 0, gridY: 0 }, // Distance to player: sqrt(200) ≈ 14.14 > 8
            allEntities: []
        };

        test('returns core for eaten state', () => {
            const target = calculateTarget('alpha', baseContext, 'eaten');
            expect(target).toEqual({ x: 13, y: 14 });
        });

        test('returns null for frightened state', () => {
            const target = calculateTarget('alpha', baseContext, 'frightened');
            expect(target).toBeNull();
        });

        test('uses alpha strategy for alpha type', () => {
            const target = calculateTarget('alpha', baseContext, 'normal');
            expect(target).toEqual({ x: 10, y: 10 });
        });

        test('uses beta strategy for beta type', () => {
            const target = calculateTarget('beta', baseContext, 'normal');
            expect(target).toEqual({ x: 14, y: 10 });
        });

        test('uses delta strategy for delta type', () => {
            const target = calculateTarget('delta', baseContext, 'normal');
            // Distance > 8, should chase
            expect(target).toEqual({ x: 10, y: 10 });
        });

        test('returns null for unknown AI type', () => {
            const target = calculateTarget('unknown', baseContext, 'normal');
            expect(target).toBeNull();
        });
    });
});
