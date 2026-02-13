/**
 * GameState Tests
 * Tests for the game state aggregator.
 */

import { directions } from '../../src/config/gameConfig.js';
import { EnemyState } from '../../src/model/entities/EnemyState.js';
import { FruitState } from '../../src/model/entities/FruitState.js';
import { PlayerState } from '../../src/model/entities/PlayerState.js';
import { GameState } from '../../src/model/GameState.js';

describe('GameState', () => {
    let gameState;

    beforeEach(() => {
        gameState = new GameState({ level: 1 });
    });

    describe('constructor', () => {
        test('creates with default level 1', () => {
            expect(gameState.level).toBe(1);
        });

        test('creates maze data', () => {
            expect(gameState.maze).toBeDefined();
            expect(gameState.maze.length).toBeGreaterThan(0);
            expect(gameState.pelletGrid).toBeDefined();
        });

        test('counts pellets', () => {
            expect(gameState.totalPellets).toBeGreaterThan(0);
            expect(gameState.pelletsRemaining).toBe(gameState.totalPellets);
        });

        test('creates Pacman', () => {
            expect(gameState.pacman).toBeInstanceOf(PlayerState);
        });

        test('creates all ghosts', () => {
            expect(gameState.ghosts).toHaveLength(4);
            gameState.ghosts.forEach((ghost) => {
                expect(ghost).toBeInstanceOf(EnemyState);
            });
        });

        test('creates Fruit', () => {
            expect(gameState.fruit).toBeInstanceOf(FruitState);
        });

        test('initializes game state', () => {
            expect(gameState.score).toBe(0);
            expect(gameState.lives).toBe(3);
            expect(gameState.isPaused).toBe(false);
            expect(gameState.isGameOver).toBe(false);
        });

        test('initializes combo tracking', () => {
            expect(gameState.ghostsEaten).toBe(0);
            expect(gameState.currentComboGhosts).toBe(0);
            expect(gameState.maxComboGhosts).toBe(0);
        });
    });

    describe('createPacman', () => {
        test('creates at start position', () => {
            expect(gameState.pacman.gridX).toBe(13);
            expect(gameState.pacman.gridY).toBe(27);
        });
    });

    describe('createGhosts', () => {
        test('creates all 4 ghost types', () => {
            const types = gameState.ghosts.map((g) => g.ghostType);
            expect(types).toContain('alpha');
            expect(types).toContain('beta');
            expect(types).toContain('gamma');
            expect(types).toContain('delta');
        });
    });

    describe('update', () => {
        test('increments tick count', () => {
            const initialTick = gameState.tickCount;
            gameState.update(0.1, {});
            expect(gameState.tickCount).toBe(initialTick + 1);
        });

        test('returns empty array when paused', () => {
            gameState.isPaused = true;
            const events = gameState.update(0.1, {});
            expect(events).toEqual([]);
        });

        test('returns empty array when game over', () => {
            gameState.isGameOver = true;
            const events = gameState.update(0.1, {});
            expect(events).toEqual([]);
        });

        test('processes input direction', () => {
            gameState.desiredDirection = null;
            gameState.update(0.1, { direction: directions.RIGHT });
            // Direction is stored (may be in buffer or applied depending on position)
            const hasDirection =
				gameState.pacman.nextDirection.x === directions.RIGHT.x ||
				gameState.pacman.direction.x === directions.RIGHT.x;
            expect(hasDirection).toBe(true);
        });

        test('returns events from entity updates', () => {
            // Give pacman a direction to move
            gameState.pacman.setDirection(directions.RIGHT);
            const events = gameState.update(0.5, {});
            expect(Array.isArray(events)).toBe(true);
        });
    });

    describe('updateDeathSequence', () => {
        test('increments death timer', () => {
            gameState.onPacmanDeath();
            const initialTimer = gameState.deathTimer;

            gameState.updateDeathSequence(0.1);

            expect(gameState.deathTimer).toBeGreaterThan(initialTimer);
        });

        test('returns death_tick events', () => {
            gameState.onPacmanDeath();
            const events = gameState.updateDeathSequence(0.1);

            expect(events).toContainEqual(
                expect.objectContaining({
                    type: 'death_tick'
                })
            );
        });

        test('decrements lives after duration', () => {
            gameState.onPacmanDeath();
            const initialLives = gameState.lives;

            gameState.updateDeathSequence(gameState.deathPauseDuration + 0.1);

            expect(gameState.lives).toBe(initialLives - 1);
        });

        test('returns respawn event', () => {
            gameState.onPacmanDeath();
            const events = gameState.updateDeathSequence(
                gameState.deathPauseDuration + 0.1
            );

            expect(events).toContainEqual(
                expect.objectContaining({
                    type: 'respawn'
                })
            );
        });

        test('returns game_over when no lives', () => {
            gameState.lives = 0;
            gameState.onPacmanDeath();
            const events = gameState.updateDeathSequence(
                gameState.deathPauseDuration + 0.1
            );

            expect(events).toContainEqual(
                expect.objectContaining({
                    type: 'game_over'
                })
            );
            expect(gameState.isGameOver).toBe(true);
        });
    });

    describe('onPacmanDeath', () => {
        test('sets isDying flag', () => {
            gameState.onPacmanDeath();
            expect(gameState.isDying).toBe(true);
        });

        test('starts pacman death animation', () => {
            gameState.onPacmanDeath();
            expect(gameState.pacman.isDying).toBe(true);
        });
    });

    describe('eatPelletAt', () => {
        test('removes pellet from grid', () => {
            // Find a position with a pellet
            let pelletX = -1,
                pelletY = -1;
            for (let y = 0; y < gameState.pelletGrid.length; y++) {
                for (let x = 0; x < gameState.pelletGrid[y].length; x++) {
                    if (gameState.pelletGrid[y][x] === 1) {
                        // PELLET
                        pelletX = x;
                        pelletY = y;
                        break;
                    }
                }
                if (pelletX !== -1) {
                    break;
                }
            }

            if (pelletX !== -1) {
                gameState.eatPelletAt(pelletX, pelletY);
                expect(gameState.pelletGrid[pelletY][pelletX]).toBe(0); // NONE
            }
        });

        test('decrements pelletsRemaining', () => {
            const initialCount = gameState.pelletsRemaining;

            // Find and eat a pellet
            for (let y = 0; y < gameState.pelletGrid.length; y++) {
                for (let x = 0; x < gameState.pelletGrid[y].length; x++) {
                    if (gameState.pelletGrid[y][x] === 1) {
                        gameState.eatPelletAt(x, y);
                        expect(gameState.pelletsRemaining).toBe(initialCount - 1);
                        return;
                    }
                }
            }
        });

        test('returns null for empty position', () => {
            // Find an empty position
            let emptyX = -1,
                emptyY = -1;
            for (let y = 0; y < gameState.pelletGrid.length; y++) {
                for (let x = 0; x < gameState.pelletGrid[y].length; x++) {
                    if (gameState.pelletGrid[y][x] === 0) {
                        // NONE
                        emptyX = x;
                        emptyY = y;
                        break;
                    }
                }
                if (emptyX !== -1) {
                    break;
                }
            }

            if (emptyX !== -1) {
                const result = gameState.eatPelletAt(emptyX, emptyY);
                expect(result).toBeNull();
            }
        });
    });

    describe('eatGhost', () => {
        test('marks ghost as eaten', () => {
            const ghost = gameState.ghosts[0];
            ghost.setFrightened(5);

            gameState.eatGhost(ghost);

            expect(ghost.isEaten).toBe(true);
        });

        test('adds score', () => {
            const ghost = gameState.ghosts[0];
            ghost.setFrightened(5);
            const initialScore = gameState.score;

            gameState.eatGhost(ghost);

            expect(gameState.score).toBeGreaterThan(initialScore);
        });

        test('increments combo', () => {
            const ghost1 = gameState.ghosts[0];
            const ghost2 = gameState.ghosts[1];
            ghost1.setFrightened(5);
            ghost2.setFrightened(5);

            gameState.eatGhost(ghost1);
            expect(gameState.currentComboGhosts).toBe(1);

            gameState.eatGhost(ghost2);
            expect(gameState.currentComboGhosts).toBe(2);
        });

        test('returns null if ghost not frightened', () => {
            const ghost = gameState.ghosts[0];
            const result = gameState.eatGhost(ghost);
            expect(result).toBeNull();
        });
    });

    describe('setGhostsFrightened', () => {
        test('sets all ghosts to frightened', () => {
            gameState.setGhostsFrightened(5);

            gameState.ghosts.forEach((ghost) => {
                expect(ghost.isFrightened).toBe(true);
            });
        });

        test('does not affect eaten ghosts', () => {
            gameState.ghosts[0].eat();
            gameState.setGhostsFrightened(5);

            expect(gameState.ghosts[0].isFrightened).toBe(false);
        });

        test('resets combo counter', () => {
            gameState.currentComboGhosts = 3;
            gameState.setGhostsFrightened(5);
            expect(gameState.currentComboGhosts).toBe(0);
        });
    });

    describe('resetPositions', () => {
        test('resets pacman position', () => {
            gameState.pacman.gridX = 99;
            gameState.resetPositions();
            expect(gameState.pacman.gridX).toBe(13);
        });

        test('resets all ghost positions', () => {
            gameState.ghosts[0].gridX = 99;
            gameState.resetPositions();
            expect(gameState.ghosts[0].gridX).toBe(gameState.ghosts[0].startGridX);
        });

        test('resets combo', () => {
            gameState.currentComboGhosts = 3;
            gameState.resetPositions();
            expect(gameState.currentComboGhosts).toBe(0);
        });
    });

    describe('nextLevel', () => {
        test('increments level', () => {
            const initialLevel = gameState.level;
            gameState.nextLevel();
            expect(gameState.level).toBe(initialLevel + 1);
        });

        test('resets level complete flag', () => {
            gameState.levelComplete = true;
            gameState.nextLevel();
            expect(gameState.levelComplete).toBe(false);
        });

        test('refreshes pellet grid', () => {
            const initialTotal = gameState.totalPellets;
            // Eat some pellets
            gameState.eatPelletAt(1, 1);

            gameState.nextLevel();

            expect(gameState.pelletsRemaining).toBe(initialTotal);
        });
    });

    describe('getGhostByType', () => {
        test('returns ghost by type', () => {
            const alpha = gameState.getGhostByType('alpha');
            expect(alpha).toBeDefined();
            expect(alpha.ghostType).toBe('alpha');
        });

        test('returns null for unknown type', () => {
            const result = gameState.getGhostByType('unknown');
            expect(result).toBeNull();
        });
    });

    describe('getPelletsEatenPercentage', () => {
        test('returns 0 when no pellets eaten', () => {
            expect(gameState.getPelletsEatenPercentage()).toBe(0);
        });

        test('returns correct percentage', () => {
            // Eat one pellet
            for (let y = 0; y < gameState.pelletGrid.length; y++) {
                for (let x = 0; x < gameState.pelletGrid[y].length; x++) {
                    if (gameState.pelletGrid[y][x] === 1) {
                        gameState.eatPelletAt(x, y);
                        const percentage = (1 / gameState.totalPellets) * 100;
                        expect(gameState.getPelletsEatenPercentage()).toBeCloseTo(
                            percentage
                        );
                        return;
                    }
                }
            }
        });
    });

    describe('getFrightenedDuration', () => {
        test('decreases with level', () => {
            const level1 = new GameState({ level: 1 });
            const level5 = new GameState({ level: 5 });

            expect(level5.getFrightenedDuration()).toBeLessThan(
                level1.getFrightenedDuration()
            );
        });

        test('has minimum of 2 seconds', () => {
            const highLevel = new GameState({ level: 20 });
            expect(highLevel.getFrightenedDuration()).toBe(2);
        });
    });

    describe('getSpeedMultiplier', () => {
        test('increases with level', () => {
            const level1 = new GameState({ level: 1 });
            const level5 = new GameState({ level: 5 });

            expect(level5.getSpeedMultiplier()).toBeGreaterThan(
                level1.getSpeedMultiplier()
            );
        });
    });

    describe('getSnapshot', () => {
        test('returns complete state snapshot', () => {
            const snapshot = gameState.getSnapshot();

            expect(snapshot).toHaveProperty('level');
            expect(snapshot).toHaveProperty('score');
            expect(snapshot).toHaveProperty('lives');
            expect(snapshot).toHaveProperty('pacman');
            expect(snapshot).toHaveProperty('ghosts');
            expect(snapshot).toHaveProperty('fruit');
            expect(snapshot).toHaveProperty('pelletsRemaining');
            expect(snapshot).toHaveProperty('tickCount');
        });

        test('includes entity snapshots', () => {
            const snapshot = gameState.getSnapshot();

            expect(snapshot.pacman).toHaveProperty('id');
            expect(snapshot.ghosts).toHaveLength(4);
            snapshot.ghosts.forEach((ghost) => {
                expect(ghost).toHaveProperty('id');
            });
        });
    });

    describe('serialize', () => {
        test('returns serializable state', () => {
            const serialized = gameState.serialize();

            expect(serialized).toHaveProperty('level');
            expect(serialized).toHaveProperty('score');
            expect(serialized).toHaveProperty('lives');
            expect(serialized).toHaveProperty('pelletGrid');
            expect(serialized).toHaveProperty('pacman');
            expect(serialized).toHaveProperty('ghosts');
            expect(serialized).toHaveProperty('tickCount');
        });

        test('clones pellet grid', () => {
            const serialized = gameState.serialize();

            // Modify serialized grid
            serialized.pelletGrid[0][0] = 999;

            // Original should be unchanged
            expect(gameState.pelletGrid[0][0]).not.toBe(999);
        });
    });
});
