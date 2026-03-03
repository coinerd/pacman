/**
 * Phase 4: State Removal - Tests
 * Tests for verifying no duplicated state in View and proper Dirty-Tracking
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import ModelDrivenGameView from '../src/views/ModelDrivenGameView.js';
import { GameSnapshot, ViewContext, ViewState } from '../src/views/ViewInterface.js';
import { gameEvents } from '../src/core/EventBus.js';

describe('Phase 4: State Removal', () => {
    let scene;
    let view;
    let mockStorageManager;
    let mockContext;

    beforeEach(() => {
        // Mock Phaser scene
        scene = {
            add: {
                rectangle: () => ({ setDepth: () => ({}), setStrokeStyle: () => ({}) }),
                image: () => ({ setDepth: () => ({}), destroy: () => ({}) }),
                circle: () => ({ setVisible: () => ({}), setActive: () => ({}), setPosition: () => ({}), destroy: () => ({}) }),
                text: () => ({ setOrigin: () => ({}), setDepth: () => ({}), destroy: () => ({}), setText: () => ({}) }),
                container: () => ({ add: () => ({}), setAlpha: () => ({}), destroy: () => ({}) })
            },
            make: {
                graphics: () => ({
                    lineStyle: () => ({}),
                    moveTo: () => ({}),
                    lineTo: () => ({}),
                    strokePath: () => ({}),
                    fillRect: () => ({}),
                    fillCircle: () => ({}),
                    fillStyle: () => ({}),
                    generateTexture: () => ({}),
                    destroy: () => ({}),
                    beginPath: () => ({}),
                    closePath: () => ({}),
                    fillPath: () => ({}),
                    create: () => ({})
                })
            },
            tweens: {
                add: () => ({})
            },
            time: {
                delayedCall: () => ({})
            },
            scale: {
                width: 800,
                height: 600
            }
        };

        // Mock storage manager
        mockStorageManager = {
            saveHighScore: () => {}
        };

        // Create view context
        mockContext = new ViewContext({
            scene,
            storageManager: mockStorageManager,
            eventBus: gameEvents
        });

        // Create view
        view = new ModelDrivenGameView(mockContext);
        view.create();
    });

    afterEach(() => {
        view.cleanup();
    });

    describe('Duplicated State Removal', () => {
        it('should not have activePellets Map (Phase 4)', () => {
            expect(view.activePellets).toBeUndefined();
        });

        it('should not have bossVisuals Map (Phase 4)', () => {
            expect(view.bossVisuals).toBeUndefined();
        });

        it('should have single bossVisual instead of Map', () => {
            expect(view.bossVisual).toBeDefined();
            expect(view.bossVisual).toBeNull(); // Initially null until boss spawns
        });

        it('should have powerUpVisuals Map only for cleanup (minimal state)', () => {
            expect(view.powerUpVisuals).toBeDefined();
            expect(view.powerUpVisuals).toBeInstanceOf(Map);
            // Should be empty initially
            expect(view.powerUpVisuals.size).toBe(0);
        });

        it('should use PelletPool gridIndex for tracking pellets', () => {
            expect(view.pelletPool).toBeDefined();
            expect(view.pelletPool.gridIndex).toBeDefined();
            expect(view.pelletPool.gridIndex).toBeInstanceOf(Map);
        });

        it('should use PowerPelletPool gridIndex for tracking pellets', () => {
            expect(view.powerPelletPool).toBeDefined();
            expect(view.powerPelletPool.gridIndex).toBeDefined();
            expect(view.powerPelletPool.gridIndex).toBeInstanceOf(Map);
        });
    });

    describe('Dirty-Tracking Methods', () => {
        it('should have snapshotEquals method', () => {
            expect(view.snapshotEquals).toBeDefined();
            expect(typeof view.snapshotEquals).toBe('function');
        });

        it('should have pelletGridEquals method', () => {
            expect(view.pelletGridEquals).toBeDefined();
            expect(typeof view.pelletGridEquals).toBe('function');
        });

        it('should have mazeEquals method', () => {
            expect(view.mazeEquals).toBeDefined();
            expect(typeof view.mazeEquals).toBe('function');
        });
    });

    describe('snapshotEquals', () => {
        it('should return true for identical snapshots', () => {
            const snapshot1 = createMockSnapshot({ tickCount: 10, score: 100 });
            const snapshot2 = createMockSnapshot({ tickCount: 10, score: 100 });

            expect(view.snapshotEquals(snapshot1, snapshot2)).toBe(true);
        });

        it('should return false for different tickCount', () => {
            const snapshot1 = createMockSnapshot({ tickCount: 10 });
            const snapshot2 = createMockSnapshot({ tickCount: 11 });

            expect(view.snapshotEquals(snapshot1, snapshot2)).toBe(false);
        });

        it('should return false for different score', () => {
            const snapshot1 = createMockSnapshot({ tickCount: 10, score: 100 });
            const snapshot2 = createMockSnapshot({ tickCount: 10, score: 150 });

            expect(view.snapshotEquals(snapshot1, snapshot2)).toBe(false);
        });

        it('should return false for different lives', () => {
            const snapshot1 = createMockSnapshot({ tickCount: 10, lives: 3 });
            const snapshot2 = createMockSnapshot({ tickCount: 10, lives: 2 });

            expect(view.snapshotEquals(snapshot1, snapshot2)).toBe(false);
        });

        it('should return false for different level', () => {
            const snapshot1 = createMockSnapshot({ tickCount: 10, level: 1 });
            const snapshot2 = createMockSnapshot({ tickCount: 10, level: 2 });

            expect(view.snapshotEquals(snapshot1, snapshot2)).toBe(false);
        });

        it('should return false for different isDying state', () => {
            const snapshot1 = createMockSnapshot({ tickCount: 10, isDying: false });
            const snapshot2 = createMockSnapshot({ tickCount: 10, isDying: true });

            expect(view.snapshotEquals(snapshot1, snapshot2)).toBe(false);
        });

        it('should return false for different maze', () => {
            const maze1 = [[1, 1], [1, 1]];
            const maze2 = [[1, 0], [1, 1]];

            const snapshot1 = createMockSnapshot({ tickCount: 10, maze: maze1 });
            const snapshot2 = createMockSnapshot({ tickCount: 10, maze: maze2 });

            expect(view.snapshotEquals(snapshot1, snapshot2)).toBe(false);
        });

        it('should return false for different pelletGrid', () => {
            const pelletGrid1 = [[1, 1], [1, 1]];
            const pelletGrid2 = [[1, 0], [1, 1]];

            const snapshot1 = createMockSnapshot({ tickCount: 10, pelletGrid: pelletGrid1 });
            const snapshot2 = createMockSnapshot({ tickCount: 10, pelletGrid: pelletGrid2 });

            expect(view.snapshotEquals(snapshot1, snapshot2)).toBe(false);
        });

        it('should return false for different pacman position', () => {
            const pacman1 = { x: 100, y: 100, direction: 'RIGHT' };
            const pacman2 = { x: 120, y: 100, direction: 'RIGHT' };

            const snapshot1 = createMockSnapshot({ tickCount: 10, pacman: pacman1 });
            const snapshot2 = createMockSnapshot({ tickCount: 10, pacman: pacman2 });

            expect(view.snapshotEquals(snapshot1, snapshot2)).toBe(false);
        });

        it('should return false for different boss state', () => {
            const boss1 = { type: 'alpha', x: 400, y: 300, health: 100 };
            const boss2 = { type: 'alpha', x: 400, y: 300, health: 90 };

            const snapshot1 = createMockSnapshot({ tickCount: 10, boss: boss1 });
            const snapshot2 = createMockSnapshot({ tickCount: 10, boss: boss2 });

            expect(view.snapshotEquals(snapshot1, snapshot2)).toBe(false);
        });

        it('should return true for null snapshots', () => {
            expect(view.snapshotEquals(null, null)).toBe(true);
        });

        it('should return false for one null snapshot', () => {
            const snapshot = createMockSnapshot({ tickCount: 10 });
            expect(view.snapshotEquals(snapshot, null)).toBe(false);
            expect(view.snapshotEquals(null, snapshot)).toBe(false);
        });
    });

    describe('pelletGridEquals', () => {
        it('should return true for identical pellet grids', () => {
            const grid1 = [[1, 1, 0], [1, 2, 1], [0, 1, 1]];
            const grid2 = [[1, 1, 0], [1, 2, 1], [0, 1, 1]];

            expect(view.pelletGridEquals(grid1, grid2)).toBe(true);
        });

        it('should return false for different pellet grids', () => {
            const grid1 = [[1, 1, 0], [1, 2, 1], [0, 1, 1]];
            const grid2 = [[1, 0, 0], [1, 2, 1], [0, 1, 1]];

            expect(view.pelletGridEquals(grid1, grid2)).toBe(false);
        });

        it('should return false for different grid dimensions', () => {
            const grid1 = [[1, 1], [1, 1]];
            const grid2 = [[1, 1, 0], [1, 1, 0]];

            expect(view.pelletGridEquals(grid1, grid2)).toBe(false);
        });

        it('should return true for null grids', () => {
            expect(view.pelletGridEquals(null, null)).toBe(true);
        });

        it('should return false for one null grid', () => {
            const grid = [[1, 1], [1, 1]];
            expect(view.pelletGridEquals(grid, null)).toBe(false);
            expect(view.pelletGridEquals(null, grid)).toBe(false);
        });
    });

    describe('mazeEquals', () => {
        it('should return true for identical mazes', () => {
            const maze1 = [[1, 1, 1], [1, 0, 1], [1, 1, 1]];
            const maze2 = [[1, 1, 1], [1, 0, 1], [1, 1, 1]];

            expect(view.mazeEquals(maze1, maze2)).toBe(true);
        });

        it('should return false for different mazes', () => {
            const maze1 = [[1, 1, 1], [1, 0, 1], [1, 1, 1]];
            const maze2 = [[1, 1, 1], [1, 1, 1], [1, 1, 1]];

            expect(view.mazeEquals(maze1, maze2)).toBe(false);
        });

        it('should return false for different maze dimensions', () => {
            const maze1 = [[1, 1], [1, 1]];
            const maze2 = [[1, 1, 1], [1, 1, 1]];

            expect(view.mazeEquals(maze1, maze2)).toBe(false);
        });

        it('should return true for null mazes', () => {
            expect(view.mazeEquals(null, null)).toBe(true);
        });

        it('should return false for one null maze', () => {
            const maze = [[1, 1], [1, 1]];
            expect(view.mazeEquals(maze, null)).toBe(false);
            expect(view.mazeEquals(null, maze)).toBe(false);
        });
    });

    describe('updateFromSnapshot with Dirty-Tracking', () => {
        it('should skip update when snapshot equals last snapshot', () => {
            const snapshot = createMockSnapshot({ tickCount: 10, score: 100 });

            // First update - should process
            view.updateFromSnapshot(snapshot);
            expect(view.frameCount).toBe(1);

            // Second update with same snapshot - should skip
            view.updateFromSnapshot(snapshot);
            expect(view.frameCount).toBe(1); // Should not increment
        });

        it('should process update when snapshot changes', () => {
            const snapshot1 = createMockSnapshot({ tickCount: 10, score: 100 });
            const snapshot2 = createMockSnapshot({ tickCount: 11, score: 100 });

            view.updateFromSnapshot(snapshot1);
            expect(view.frameCount).toBe(1);

            view.updateFromSnapshot(snapshot2);
            expect(view.frameCount).toBe(2); // Should increment
        });

        it('should update frameCount only on actual changes', () => {
            const snapshot = createMockSnapshot({ tickCount: 10, score: 100 });

            view.updateFromSnapshot(snapshot);
            expect(view.frameCount).toBe(1);

            view.updateFromSnapshot(snapshot);
            expect(view.frameCount).toBe(1);

            view.updateFromSnapshot(snapshot);
            expect(view.frameCount).toBe(1);

            const newSnapshot = createMockSnapshot({ tickCount: 11, score: 100 });
            view.updateFromSnapshot(newSnapshot);
            expect(view.frameCount).toBe(2);
        });
    });

    describe('Pellet Visuals without activePellets Map', () => {
        it('should create pellets from snapshot without using activePellets Map', () => {
            const pelletGrid = [[1, 1], [1, 2]];

            view.createPellets(pelletGrid);

            // Verify activePellets doesn't exist
            expect(view.activePellets).toBeUndefined();

            // Verify pellets are in pools
            expect(view.pelletPool.getActiveCount()).toBe(3); // 3 regular pellets
            expect(view.powerPelletPool.getActiveCount()).toBe(1); // 1 power pellet
        });

        it('should update pellet visuals from snapshot', () => {
            const pelletGrid1 = [[1, 1], [1, 2]];
            const pelletGrid2 = [[1, 0], [1, 2]];

            view.createPellets(pelletGrid1);
            expect(view.pelletPool.getActiveCount()).toBe(3);

            view.updatePelletVisuals(pelletGrid2);
            expect(view.pelletPool.getActiveCount()).toBe(2); // One pellet removed
        });

        it('should use pool gridIndex for pellet tracking', () => {
            const pelletGrid = [[1, 0], [0, 2]];

            view.createPellets(pelletGrid);

            // Check that pellets are tracked in pool gridIndex
            expect(view.pelletPool.getByGrid(0, 0)).toBeDefined();
            expect(view.pelletPool.getByGrid(0, 1)).toBeNull();

            expect(view.powerPelletPool.getByGrid(1, 1)).toBeDefined();
            expect(view.powerPelletPool.getByGrid(0, 1)).toBeNull();
        });
    });

    describe('Boss Visuals without Map', () => {
        it('should have single bossVisual property', () => {
            expect(view.bossVisuals).toBeUndefined();
            expect(view.bossVisual).toBeDefined();
            expect(view.bossVisual).toBeNull();
        });

        it('should create boss visual from snapshot', () => {
            const snapshot = createMockSnapshot({
                tickCount: 10,
                boss: {
                    type: 'alpha',
                    x: 400,
                    y: 300,
                    health: 100,
                    phase: 1
                }
            });

            view.lastSnapshot = snapshot;
            view.createBossVisual('alpha');

            expect(view.bossVisual).toBeDefined();
            expect(view.bossVisual.bossType).toBe('alpha');
        });

        it('should remove boss visual without Map', () => {
            const snapshot = createMockSnapshot({
                tickCount: 10,
                boss: {
                    type: 'alpha',
                    x: 400,
                    y: 300,
                    health: 100,
                    phase: 1
                }
            });

            view.lastSnapshot = snapshot;
            view.createBossVisual('alpha');
            expect(view.bossVisual).toBeDefined();

            view.removeBossVisual();
            expect(view.bossVisual).toBeNull();
        });

        it('should sync boss visual from snapshot', () => {
            const snapshot = createMockSnapshot({
                tickCount: 10,
                boss: {
                    type: 'alpha',
                    x: 400,
                    y: 300,
                    health: 100,
                    healthPercent: 1,
                    phase: 1
                }
            });

            view.lastSnapshot = snapshot;
            view.createBossVisual('alpha');
            view.syncBossVisuals(snapshot.boss);

            expect(view.bossVisual.sprite.x).toBe(400);
            expect(view.bossVisual.sprite.y).toBe(300);
        });
    });

    describe('Power-Up Visuals with minimal tracking', () => {
        it('should track power-ups in Map for cleanup only', () => {
            const powerUps = [
                { type: 'SHIELD', gridX: 5, gridY: 5 },
                { type: 'SPEED_BOOST', gridX: 10, gridY: 10 }
            ];

            view.lastSnapshot = createMockSnapshot({ tickCount: 10, powerUps });

            powerUps.forEach(pu => {
                view.createPowerUpVisual(pu.type, pu.gridX, pu.gridY);
            });

            expect(view.powerUpVisuals.size).toBe(2);
        });

        it('should sync power-up visuals from snapshot', () => {
            const powerUps1 = [
                { type: 'SHIELD', gridX: 5, gridY: 5 }
            ];

            const powerUps2 = [
                { type: 'SHIELD', gridX: 5, gridY: 5 },
                { type: 'SPEED_BOOST', gridX: 10, gridY: 10 }
            ];

            view.lastSnapshot = createMockSnapshot({ tickCount: 10, powerUps: powerUps1 });
            view.syncPowerUpVisuals(powerUps1);

            expect(view.powerUpVisuals.size).toBe(1);

            view.syncPowerUpVisuals(powerUps2);

            expect(view.powerUpVisuals.size).toBe(2);
        });

        it('should remove power-ups that are no longer in snapshot', () => {
            const powerUps1 = [
                { type: 'SHIELD', gridX: 5, gridY: 5 },
                { type: 'SPEED_BOOST', gridX: 10, gridY: 10 }
            ];

            const powerUps2 = [
                { type: 'SHIELD', gridX: 5, gridY: 5 }
            ];

            view.lastSnapshot = createMockSnapshot({ tickCount: 10, powerUps: powerUps1 });
            view.syncPowerUpVisuals(powerUps1);

            expect(view.powerUpVisuals.size).toBe(2);

            view.syncPowerUpVisuals(powerUps2);

            expect(view.powerUpVisuals.size).toBe(1);
        });
    });
});

/**
 * Helper function to create mock GameSnapshot
 */
function createMockSnapshot(overrides = {}) {
    const defaults = {
        level: 1,
        score: 0,
        lives: 3,
        highScore: 0,
        isPaused: false,
        isGameOver: false,
        isDying: false,
        levelComplete: false,
        maze: [[1, 1], [1, 1]],
        pelletGrid: [[1, 1], [1, 1]],
        pelletsRemaining: 4,
        totalPellets: 4,
        pacman: { x: 100, y: 100, direction: 'RIGHT' },
        ghosts: [],
        fruit: null,
        boss: null,
        powerUps: [],
        story: null,
        tickCount: 0
    };

    return new GameSnapshot({ ...defaults, ...overrides });
}
