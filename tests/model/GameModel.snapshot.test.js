/**
 * GameModel.getSnapshot() Tests
 * Tests for snapshot completeness and immutability
 */

import GameModel from '../../src/core/GameModel.js';
import { GameSnapshot } from '../../src/views/ViewInterface.js';

describe('GameModel.getSnapshot()', () => {
    let gameModel;

    beforeEach(() => {
        // Create a fresh game model for each test
        gameModel = new GameModel({
            level: 1,
            score: 0,
            lives: 3
        });
    });

    it('should return a snapshot with all game flow properties', () => {
        const snapshot = gameModel.getSnapshot();

        expect(snapshot).toBeDefined();
        expect(typeof snapshot).toBe('object');

        // Game flow properties
        expect(snapshot.level).toBe(1);
        expect(snapshot.score).toBe(0);
        expect(snapshot.lives).toBe(3);
        expect(snapshot.highScore).toBe(0);
        expect(snapshot.isPaused).toBe(false);
        expect(snapshot.isGameOver).toBe(false);
        expect(snapshot.isDying).toBe(false);
        expect(snapshot.levelComplete).toBe(false);
    });

    it('should include maze data in snapshot', () => {
        const snapshot = gameModel.getSnapshot();

        expect(snapshot.maze).toBeDefined();
        expect(Array.isArray(snapshot.maze)).toBe(true);
        expect(snapshot.maze.length).toBeGreaterThan(0);

        // Maze should have walls and paths
        const hasWall = snapshot.maze.some(row => row.some(cell => cell === 1));
        expect(hasWall).toBe(true);
    });

    it('should include pellet grid in snapshot', () => {
        const snapshot = gameModel.getSnapshot();

        expect(snapshot.pelletGrid).toBeDefined();
        expect(Array.isArray(snapshot.pelletGrid)).toBe(true);
        expect(snapshot.pelletGrid.length).toBeGreaterThan(0);

        // Pellet grid should have pellets
        const hasPellet = snapshot.pelletGrid.some(row => row.some(cell => cell !== 0));
        expect(hasPellet).toBe(true);
    });

    it('should include pellet counts in snapshot', () => {
        const snapshot = gameModel.getSnapshot();

        expect(snapshot.pelletsRemaining).toBeDefined();
        expect(snapshot.totalPellets).toBeDefined();
        expect(snapshot.pelletsEatenPercent).toBeDefined();

        expect(snapshot.pelletsRemaining).toBeGreaterThanOrEqual(0);
        expect(snapshot.totalPellets).toBeGreaterThan(0);
        expect(snapshot.pelletsEatenPercent).toBeGreaterThanOrEqual(0);
        expect(snapshot.pelletsEatenPercent).toBeLessThanOrEqual(100);
    });

    it('should include pacman snapshot', () => {
        const snapshot = gameModel.getSnapshot();

        expect(snapshot.pacman).toBeDefined();
        expect(snapshot.pacman.x).toBeDefined();
        expect(snapshot.pacman.y).toBeDefined();
        expect(snapshot.pacman.gridX).toBeDefined();
        expect(snapshot.pacman.gridY).toBeDefined();
    });

    it('should include all four ghosts in snapshot', () => {
        const snapshot = gameModel.getSnapshot();

        expect(snapshot.ghosts).toBeDefined();
        expect(Array.isArray(snapshot.ghosts)).toBe(true);
        expect(snapshot.ghosts.length).toBe(4);

        const ghostTypes = snapshot.ghosts.map(g => g.ghostType);
        expect(ghostTypes).toContain('alpha');
        expect(ghostTypes).toContain('beta');
        expect(ghostTypes).toContain('gamma');
        expect(ghostTypes).toContain('delta');
    });

    it('should include fruit snapshot', () => {
        const snapshot = gameModel.getSnapshot();

        expect(snapshot.fruit).toBeDefined();
        expect(snapshot.fruit.active).toBeDefined();
        expect(snapshot.fruit.x).toBeDefined();
        expect(snapshot.fruit.y).toBeDefined();
    });

    it('should include advanced features (boss, powerUps, story)', () => {
        const snapshot = gameModel.getSnapshot();

        expect(snapshot.boss).toBeDefined();
        expect(snapshot.powerUps).toBeDefined();
        expect(snapshot.story).toBeDefined();
        expect(snapshot.tickCount).toBeDefined();
    });

    it('should update snapshot after game step', () => {
        const initialSnapshot = gameModel.getSnapshot();
        const initialTickCount = initialSnapshot.tickCount;

        // Run a game step
        gameModel.step(0.016);

        const updatedSnapshot = gameModel.getSnapshot();

        expect(updatedSnapshot.tickCount).toBe(initialTickCount + 1);
    });

    it('should update snapshot after scoring', () => {
        const initialSnapshot = gameModel.getSnapshot();
        const initialScore = initialSnapshot.score;

        // Simulate scoring by modifying pellet grid
        if (gameModel.pelletGrid.length > 0 && gameModel.pelletGrid[0].length > 0) {
            const x = gameModel.pacman.gridX;
            const y = gameModel.pacman.gridY;

            // Set a pellet at pacman's position
            if (gameModel.pelletGrid[y] && gameModel.pelletGrid[y][x] !== undefined) {
                gameModel.pelletGrid[y][x] = 1;
                gameModel.pelletsRemaining++;

                // Eat the pellet
                const pelletType = gameModel.pelletGrid[y][x];
                if (pelletType !== 0) {
                    gameModel.pelletGrid[y][x] = 0;
                    gameModel.pelletsRemaining--;
                    gameModel.score += 10;
                }
            }
        }

        const updatedSnapshot = gameModel.getSnapshot();

        expect(updatedSnapshot.score).toBeGreaterThan(initialScore);
    });

    it('should be immutable - cannot modify properties', () => {
        const snapshot = gameModel.getSnapshot();

        // Try to modify a property - this should throw in strict mode or fail silently
        expect(() => {
            snapshot.level = 999;
        }).toThrow();

        // Verify the property didn't change
        expect(snapshot.level).toBe(1);
    });

    it('should be immutable - cannot modify maze array', () => {
        const snapshot = gameModel.getSnapshot();
        const originalValue = snapshot.maze[0][0];

        // Try to modify the maze array
        expect(() => {
            snapshot.maze[0][0] = 999;
        }).toThrow();

        // Verify the value didn't change
        expect(snapshot.maze[0][0]).toBe(originalValue);
    });

    it('should be immutable - cannot modify pelletGrid array', () => {
        const snapshot = gameModel.getSnapshot();

        // Try to modify the pelletGrid array
        expect(() => {
            snapshot.pelletGrid[0][0] = 999;
        }).toThrow();
    });

    it('should be immutable - ghosts array is frozen', () => {
        const snapshot = gameModel.getSnapshot();

        // Try to modify the ghosts array
        expect(() => {
            snapshot.ghosts.push({ ghostType: 'epsilon' });
        }).toThrow();
    });

    it('should be immutable - powerUps array is frozen', () => {
        const snapshot = gameModel.getSnapshot();

        // Try to modify the powerUps array
        expect(() => {
            snapshot.powerUps.push({ type: 'TEST' });
        }).toThrow();
    });

    it('should be immutable - cannot add new properties', () => {
        const snapshot = gameModel.getSnapshot();

        // Try to add a new property
        expect(() => {
            snapshot.newProperty = 'test';
        }).toThrow();

        expect(snapshot.newProperty).toBeUndefined();
    });

    it('should maintain immutability after multiple calls', () => {
        const snapshot1 = gameModel.getSnapshot();
        const snapshot2 = gameModel.getSnapshot();

        // Snapshots should be different objects
        expect(snapshot1).not.toBe(snapshot2);

        // But have the same values (at this point)
        expect(snapshot1.level).toBe(snapshot2.level);
        expect(snapshot1.score).toBe(snapshot2.score);

        // Both should be immutable
        expect(() => {
            snapshot1.level = 999;
        }).toThrow();

        expect(() => {
            snapshot2.level = 999;
        }).toThrow();
    });
});
