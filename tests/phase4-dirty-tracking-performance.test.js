/**
 * Phase 4: Dirty-Tracking Performance Tests
 * Compare performance with and without Dirty-Tracking
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import ModelDrivenGameView from '../src/views/ModelDrivenGameView.js';
import { GameSnapshot, ViewContext } from '../src/views/ViewInterface.js';
import { gameEvents } from '../src/core/EventBus.js';

describe('Phase 4: Dirty-Tracking Performance', () => {
    let scene;
    let view;
    let mockContext;

    beforeEach(() => {
        // Mock Phaser scene
        scene = {
            add: {
                rectangle: () => ({ setDepth: () => ({}), setStrokeStyle: () => ({}) }),
                image: () => ({ setDepth: () => ({}), destroy: () => ({}) }),
                circle: () => ({ setVisible: () => ({}), setActive: () => ({}), setPosition: () => ({}), destroy: () => ({}) }),
                text: () => ({ setOrigin: () => ({}), setDepth: () => ({}), destroy: () => ({}) }),
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
        const mockStorageManager = {
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

    describe('Dirty-Tracking Efficiency', () => {
        it('should skip update for identical snapshot (performance win)', () => {
            const snapshot = createMockSnapshot({
                tickCount: 10,
                score: 100,
                level: 1,
                lives: 3
            });

            // Time update with identical snapshot
            const startTime = performance.now();
            view.updateFromSnapshot(snapshot);
            const firstUpdateTime = performance.now() - startTime;

            const startTime2 = performance.now();
            view.updateFromSnapshot(snapshot); // Same snapshot - should skip
            const secondUpdateTime = performance.now() - startTime2;

            // Second update should be much faster (early return)
            expect(secondUpdateTime).toBeLessThan(firstUpdateTime);
        });

        it('should only increment frameCount on actual changes', () => {
            const snapshot = createMockSnapshot({ tickCount: 10 });

            view.updateFromSnapshot(snapshot);
            expect(view.frameCount).toBe(1);

            // Multiple calls with same snapshot
            for (let i = 0; i < 100; i++) {
                view.updateFromSnapshot(snapshot);
            }
            expect(view.frameCount).toBe(1); // Still 1

            // Change snapshot
            const newSnapshot = createMockSnapshot({ tickCount: 11 });
            view.updateFromSnapshot(newSnapshot);
            expect(view.frameCount).toBe(2);
        });

        it('should handle rapid identical updates efficiently', () => {
            const snapshot = createMockSnapshot({ tickCount: 10 });

            const startTime = performance.now();

            // Simulate 1000 frames with no state changes
            for (let i = 0; i < 1000; i++) {
                view.updateFromSnapshot(snapshot);
            }

            const elapsed = performance.now() - startTime;

            // Should complete quickly (early returns)
            expect(elapsed).toBeLessThan(100); // < 100ms for 1000 calls
            expect(view.frameCount).toBe(1); // Only processed once
        });
    });

    describe('Pellet Grid Comparison Performance', () => {
        it('should efficiently compare large pellet grids', () => {
            // Create a large pellet grid (e.g., 25x33)
            const pelletGrid = createLargePelletGrid(25, 33);

            const startTime = performance.now();
            const result = view.pelletGridEquals(pelletGrid, pelletGrid);
            const elapsed = performance.now() - startTime;

            expect(result).toBe(true);
            expect(elapsed).toBeLessThan(10); // < 10ms for comparison
        });

        it('should quickly detect differences in pellet grids', () => {
            const pelletGrid1 = createLargePelletGrid(25, 33);
            const pelletGrid2 = createLargePelletGrid(25, 33);

            // Make a single change
            pelletGrid2[10][10] = 0;

            const startTime = performance.now();
            const result = view.pelletGridEquals(pelletGrid1, pelletGrid2);
            const elapsed = performance.now() - startTime;

            expect(result).toBe(false);
            expect(elapsed).toBeLessThan(10); // < 10ms to detect change
        });
    });

    describe('Snapshot Comparison Performance', () => {
        it('should efficiently compare snapshots with tickCount check', () => {
            const snapshot1 = createMockSnapshot({ tickCount: 10 });
            const snapshot2 = createMockSnapshot({ tickCount: 11 });

            const startTime = performance.now();
            const result = view.snapshotEquals(snapshot1, snapshot2);
            const elapsed = performance.now() - startTime;

            expect(result).toBe(false);
            // Should be very fast (early exit on tickCount)
            expect(elapsed).toBeLessThan(5);
        });

        it('should efficiently compare identical snapshots', () => {
            const snapshot = createMockSnapshot({
                tickCount: 10,
                score: 100,
                level: 1
            });

            const startTime = performance.now();
            const result = view.snapshotEquals(snapshot, snapshot);
            const elapsed = performance.now() - startTime;

            expect(result).toBe(true);
            expect(elapsed).toBeLessThan(20); // < 20ms for full comparison
        });
    });

    describe('Memory Efficiency', () => {
        it('should not store duplicate pellet state in View', () => {
            const pelletGrid = createLargePelletGrid(25, 33);

            view.createPellets(pelletGrid);

            // View should not have activePellets Map
            expect(view.activePellets).toBeUndefined();

            // Pools should track pellets via gridIndex
            expect(view.pelletPool.gridIndex.size).toBeGreaterThan(0);
            expect(view.powerPelletPool.gridIndex.size).toBeGreaterThan(0);
        });

        it('should not store duplicate boss state in Map', () => {
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

            // Should not have bossVisuals Map
            expect(view.bossVisuals).toBeUndefined();

            // Should have single bossVisual
            expect(view.bossVisual).toBeDefined();
            expect(view.bossVisual.bossType).toBe('alpha');
        });
    });

    describe('Real-world Simulation', () => {
        it('should simulate 60 FPS with efficient updates', () => {
            const snapshots = [];
            for (let i = 0; i < 3600; i++) { // 60 seconds at 60 FPS
                snapshots.push(createMockSnapshot({
                    tickCount: i,
                    score: Math.floor(i * 0.1)
                }));
            }

            const startTime = performance.now();

            // Simulate game loop
            for (let i = 0; i < snapshots.length; i++) {
                view.updateFromSnapshot(snapshots[i]);
            }

            const elapsed = performance.now() - startTime;

            // Should complete in reasonable time
            expect(elapsed).toBeLessThan(1000); // < 1 second for 3600 updates

            // All snapshots should have been processed
            expect(view.frameCount).toBe(3600);
        });

        it('should handle state changes efficiently', () => {
            // Create base snapshot
            const baseSnapshot = createMockSnapshot({ tickCount: 10 });

            // Create snapshots with intermittent changes
            const snapshots = [];
            for (let i = 0; i < 100; i++) {
                if (i % 10 === 0) {
                    // Every 10th frame has a change
                    snapshots.push(createMockSnapshot({
                        tickCount: 10 + i,
                        score: i * 10
                    }));
                } else {
                    // Same snapshot repeated
                    snapshots.push(createMockSnapshot({
                        tickCount: 10
                    }));
                }
            }

            const startTime = performance.now();

            for (const snapshot of snapshots) {
                view.updateFromSnapshot(snapshot);
            }

            const elapsed = performance.now() - startTime;

            // Should be fast due to dirty-tracking
            expect(elapsed).toBeLessThan(100);

            // Only 10 frames should have been processed
            expect(view.frameCount).toBe(10);
        });
    });

    describe('Pellet Update Performance', () => {
        it('should efficiently update pellets from snapshot', () => {
            const pelletGrid1 = createLargePelletGrid(25, 33);
            const pelletGrid2 = createLargePelletGrid(25, 33);

            // Remove some pellets
            pelletGrid2[10][10] = 0;
            pelletGrid2[10][11] = 0;

            view.createPellets(pelletGrid1);

            const startTime = performance.now();
            view.updatePelletVisuals(pelletGrid2);
            const elapsed = performance.now() - startTime;

            // Should complete quickly
            expect(elapsed).toBeLessThan(50);
        });

        it('should handle no pellet changes efficiently', () => {
            const pelletGrid = createLargePelletGrid(25, 33);

            view.createPellets(pelletGrid);

            const startTime = performance.now();
            view.updatePelletVisuals(pelletGrid); // Same grid
            const elapsed = performance.now() - startTime;

            // Should be very fast (no changes to make)
            expect(elapsed).toBeLessThan(20);
        });
    });
});

/**
 * Helper function to create large pellet grid
 */
function createLargePelletGrid(width, height) {
    const grid = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            // Create a mix of pellets, power pellets, and empty spaces
            if ((x + y) % 20 === 0) {
                row.push(2); // Power pellet
            } else if ((x + y) % 3 === 0) {
                row.push(1); // Regular pellet
            } else {
                row.push(0); // Empty
            }
        }
        grid.push(row);
    }
    return grid;
}

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
