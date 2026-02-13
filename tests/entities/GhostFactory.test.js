import {
    enemyColors,
    enemyNames,
    enemyStartPositions
} from '../../src/config/gameConfig.js';
import Enemy from '../../src/entities/Enemy.js';
import { EnemyFactory } from '../../src/entities/EnemyFactory.js';
import { msToSeconds } from '../../src/utils/Time.js';

jest.mock('../../src/entities/Enemy.js');

describe('EnemyFactory', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                sprite: jest.fn(),
                graphics: jest.fn()
            },
            children: [],
            maze: Array(31)
                .fill(null)
                .map(() => Array(28).fill(0))
        };

        Enemy.mockClear();
        Enemy.mockImplementation((scene, startX, startY, type, color) => {
            return {
                scene,
                x: startX * 16 + 8,
                y: startY * 16 + 8,
                gridX: startX,
                gridY: startY,
                type,
                color,
                direction: { x: 0, y: 0 },
                speed: 80,
                baseSpeed: 80,
                isFrightened: false,
                isEaten: false,
                mode: 'SCATTER',
                frightenedTimer: 0,
                houseTimer: 0,
                inGhostHouse: false,
                targetX: 0,
                targetY: 0,
                reset: jest.fn(),
                setFrightened: jest.fn(),
                update: jest.fn()
            };
        });
    });

    describe('createEnemies()', () => {
        test('creates array of 4 enemies', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            expect(Array.isArray(enemies)).toBe(true);
            expect(enemies.length).toBe(4);
        });

        test('creates Enemy instances for each enemy', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            expect(Enemy).toHaveBeenCalledTimes(4);
        });

        test('creates Alpha with correct properties', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            const alpha = enemies.find((g) => g.type === enemyNames.ALPHA);

            expect(alpha).toBeDefined();
            expect(alpha.gridX).toBe(enemyStartPositions.alpha.x);
            expect(alpha.gridY).toBe(enemyStartPositions.alpha.y);
            expect(alpha.color).toBe(enemyColors.ALPHA);
            expect(alpha.scene).toBe(mockScene);
        });

        test('creates Beta with correct properties', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            const beta = enemies.find((g) => g.type === enemyNames.BETA);

            expect(beta).toBeDefined();
            expect(beta.gridX).toBe(enemyStartPositions.beta.x);
            expect(beta.gridY).toBe(enemyStartPositions.beta.y);
            expect(beta.color).toBe(enemyColors.BETA);
            expect(beta.scene).toBe(mockScene);
        });

        test('creates Gamma with correct properties', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            const gamma = enemies.find((g) => g.type === enemyNames.GAMMA);

            expect(gamma).toBeDefined();
            expect(gamma.gridX).toBe(enemyStartPositions.gamma.x);
            expect(gamma.gridY).toBe(enemyStartPositions.gamma.y);
            expect(gamma.color).toBe(enemyColors.GAMMA);
            expect(gamma.scene).toBe(mockScene);
        });

        test('creates Delta with correct properties', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            const delta = enemies.find((g) => g.type === enemyNames.DELTA);

            expect(delta).toBeDefined();
            expect(delta.gridX).toBe(enemyStartPositions.delta.x);
            expect(delta.gridY).toBe(enemyStartPositions.delta.y);
            expect(delta.color).toBe(enemyColors.DELTA);
            expect(delta.scene).toBe(mockScene);
        });

        test('creates enemies in order: Alpha, Beta, Gamma, Delta', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            expect(enemies[0].type).toBe(enemyNames.ALPHA);
            expect(enemies[1].type).toBe(enemyNames.BETA);
            expect(enemies[2].type).toBe(enemyNames.GAMMA);
            expect(enemies[3].type).toBe(enemyNames.DELTA);
        });

        test('all enemies have unique types', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            const types = enemies.map((g) => g.type);

            expect(new Set(types).size).toBe(4);
        });

        test('all enemies have correct start positions', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            enemies.forEach((enemy) => {
                const expectedPos = enemyStartPositions[enemy.type];
                expect(enemy.gridX).toBe(expectedPos.x);
                expect(enemy.gridY).toBe(expectedPos.y);
            });
        });

        test('all enemies have correct colors', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            enemies.forEach((enemy) => {
                const expectedColor = enemyColors[enemy.type.toUpperCase()];
                expect(enemy.color).toBe(expectedColor);
            });
        });
    });

    describe('resetEnemies()', () => {
        test('calls reset() on all enemies', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            EnemyFactory.resetEnemies(enemies);

            enemies.forEach((enemy) => {
                expect(enemy.reset).toHaveBeenCalledTimes(1);
            });
        });

        test('does not modify enemy array', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            const originalLength = enemies.length;

            EnemyFactory.resetEnemies(enemies);

            expect(enemies.length).toBe(originalLength);
        });
    });

    describe('setEnemiesDecrypted()', () => {
        test('calls setFrightened() on all non-eaten enemies', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            enemies[0].isEaten = false;
            enemies[1].isEaten = false;
            enemies[2].isEaten = true;
            enemies[3].isEaten = false;

            EnemyFactory.setEnemiesDecrypted(enemies, msToSeconds(5000));

            expect(enemies[0].setFrightened).toHaveBeenCalledWith(msToSeconds(5000));
            expect(enemies[1].setFrightened).toHaveBeenCalledWith(msToSeconds(5000));
            expect(enemies[2].setFrightened).not.toHaveBeenCalled();
            expect(enemies[3].setFrightened).toHaveBeenCalledWith(msToSeconds(5000));
        });

        test('does not call setFrightened() on eaten enemies', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            enemies.forEach((enemy) => {
                enemy.isEaten = true;
            });

            EnemyFactory.setEnemiesDecrypted(enemies, msToSeconds(5000));

            enemies.forEach((enemy) => {
                expect(enemy.setFrightened).not.toHaveBeenCalled();
            });
        });

        test('calls setFrightened() with correct duration', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            const duration = msToSeconds(8000);

            EnemyFactory.setEnemiesDecrypted(enemies, duration);

            enemies.forEach((enemy) => {
                if (!enemy.isEaten) {
                    expect(enemy.setFrightened).toHaveBeenCalledWith(duration);
                }
            });
        });

        test('handles mixed enemy states correctly', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            enemies[0].isEaten = false;
            enemies[1].isEaten = true;
            enemies[2].isEaten = false;
            enemies[3].isEaten = false;

            EnemyFactory.setEnemiesDecrypted(enemies, msToSeconds(6000));

            expect(enemies[0].setFrightened).toHaveBeenCalledTimes(1);
            expect(enemies[1].setFrightened).not.toHaveBeenCalled();
            expect(enemies[2].setFrightened).toHaveBeenCalledTimes(1);
            expect(enemies[3].setFrightened).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEnemiesByType()', () => {
        test('returns empty array when no enemies match type', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            const result = EnemyFactory.getEnemiesByType(enemies, 'unknown');

            expect(result).toEqual([]);
        });

        test('returns single enemy when one enemy matches type', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            const alphaEnemies = EnemyFactory.getEnemiesByType(
                enemies,
                enemyNames.ALPHA
            );

            expect(alphaEnemies.length).toBe(1);
            expect(alphaEnemies[0].type).toBe(enemyNames.ALPHA);
        });

        test('returns all enemies of specified type', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            const result = EnemyFactory.getEnemiesByType(enemies, enemyNames.ALPHA);

            expect(Array.isArray(result)).toBe(true);
            result.forEach((enemy) => {
                expect(enemy.type).toBe(enemyNames.ALPHA);
            });
        });

        test('returns enemy array in same order as input', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            const result = EnemyFactory.getEnemiesByType(enemies, enemyNames.BETA);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toBe(enemies[1]);
        });

        test('handles case sensitivity of type parameter', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            const result1 = EnemyFactory.getEnemiesByType(enemies, 'ALPHA');
            const result2 = EnemyFactory.getEnemiesByType(enemies, enemyNames.ALPHA);

            expect(result1.length).toBe(0);
            expect(result2.length).toBe(1);
        });

        test('does not modify original enemy array', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);
            const originalLength = enemies.length;

            EnemyFactory.getEnemiesByType(enemies, enemyNames.ALPHA);

            expect(enemies.length).toBe(originalLength);
        });
    });

    describe('Integration: Complete enemy lifecycle', () => {
        test('creates enemies, resets, and applies decrypted state', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            expect(enemies.length).toBe(4);

            EnemyFactory.resetEnemies(enemies);

            enemies.forEach((enemy) => {
                expect(enemy.reset).toHaveBeenCalled();
            });

            EnemyFactory.setEnemiesDecrypted(enemies, msToSeconds(5000));

            enemies.forEach((enemy) => {
                if (!enemy.isEaten) {
                    expect(enemy.setFrightened).toHaveBeenCalledWith(msToSeconds(5000));
                }
            });
        });

        test('can filter and manipulate specific enemy types', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            const alpha = EnemyFactory.getEnemiesByType(enemies, enemyNames.ALPHA);
            const beta = EnemyFactory.getEnemiesByType(enemies, enemyNames.BETA);

            expect(alpha[0].type).toBe(enemyNames.ALPHA);
            expect(beta[0].type).toBe(enemyNames.BETA);
            expect(alpha[0]).toBe(enemies[0]);
            expect(beta[0]).toBe(enemies[1]);
        });
    });

    describe('Edge Cases', () => {
        test('handles empty enemy array for resetEnemies', () => {
            const enemies = [];

            expect(() => {
                EnemyFactory.resetEnemies(enemies);
            }).not.toThrow();
        });

        test('handles empty enemy array for setEnemiesDecrypted', () => {
            const enemies = [];

            expect(() => {
                EnemyFactory.setEnemiesDecrypted(enemies, msToSeconds(5000));
            }).not.toThrow();
        });

        test('handles empty enemy array for getEnemiesByType', () => {
            const enemies = [];

            const result = EnemyFactory.getEnemiesByType(enemies, enemyNames.ALPHA);

            expect(result).toEqual([]);
        });

        test('handles enemy array with no matching types', () => {
            const enemies = EnemyFactory.createEnemies(mockScene);

            const result = EnemyFactory.getEnemiesByType(enemies, 'nonexistent');

            expect(result).toEqual([]);
        });
    });
});
