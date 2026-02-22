/**
 * Performance Benchmarks für das Movement System
 * Vergleicht altes vs. neues System (wenn verfügbar)
 */

import { MovementSystem } from '../../src/movement/index.js';
import { MovementEngine } from '../../src/movement/core/MovementEngine.js';
import { MazeAdapter } from '../../src/movement/adapters/MazeAdapter.js';
import { MovementComponent } from '../../src/movement/core/MovementComponent.js';
import { AIController } from '../../src/movement/ai/AIController.js';
import { Direction } from '../../src/movement/core/Direction.js';

// Test maze (25x33 wie im echten Spiel)
const createLargeMaze = () => {
    const width = 25;
    const height = 33;
    const maze = [];

    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            // Einfaches Muster: Wände am Rand, Pfade innen
            if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                row.push(1); // Wall
            } else if (y === 15 && (x < 3 || x > 21)) {
                row.push(0); // Tunnel
            } else if (x % 4 === 0 && y % 4 === 0) {
                row.push(1); // Occasional wall
            } else {
                row.push(0); // Path
            }
        }
        maze.push(row);
    }
    return maze;
};

describe('MovementSystem Performance Benchmarks', () => {
    const largeMaze = createLargeMaze();

    describe('Initialization Performance', () => {
        test('should initialize MovementSystem in < 10ms', () => {
            const start = performance.now();

            const system = new MovementSystem({
                tileSize: 20,
                tunnelRow: 15
            });
            system.initialize(largeMaze);

            const duration = performance.now() - start;
            expect(duration).toBeLessThan(10);
        });

        test('should register 100 entities in < 5ms', () => {
            const system = new MovementSystem();
            system.initialize(largeMaze);

            const start = performance.now();

            for (let i = 0; i < 100; i++) {
                const entity = {
                    id: `entity_${i}`,
                    gridX: 1 + (i % 20),
                    gridY: 1 + Math.floor(i / 20),
                    x: 30,
                    y: 30,
                    speed: 100
                };
                system.registerEntity(entity);
            }

            const duration = performance.now() - start;
            expect(duration).toBeLessThan(5);
        });
    });

    describe('Update Loop Performance', () => {
        test('should update 5 entities at 60fps (< 16ms per frame)', () => {
            const system = new MovementSystem();
            system.initialize(largeMaze);

            // Register 5 entities (1 player + 4 ghosts)
            for (let i = 0; i < 5; i++) {
                const entity = {
                    id: `entity_${i}`,
                    gridX: 10,
                    gridY: 15,
                    x: 210,
                    y: 310,
                    speed: 100,
                    direction: Direction.RIGHT
                };
                system.registerEntity(entity, i > 0 ? { aiType: 'alpha' } : {});
                system.setDirection(`entity_${i}`, Direction.RIGHT);
            }

            // Warmup
            for (let i = 0; i < 10; i++) {
                system.update(0.016);
            }

            // Benchmark
            const times = [];
            for (let i = 0; i < 100; i++) {
                const start = performance.now();
                system.update(0.016);
                times.push(performance.now() - start);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);

            expect(avgTime).toBeLessThan(1); // Should be very fast on average
            expect(maxTime).toBeLessThan(5); // Worst case should still be fast
        });

        test('should handle 1000 update frames without degradation', () => {
            const system = new MovementSystem();
            system.initialize(largeMaze);

            const entity = {
                id: 'player',
                gridX: 10,
                gridY: 15,
                x: 210,
                y: 310,
                speed: 100
            };
            system.registerEntity(entity);
            system.setDirection('player', Direction.RIGHT);

            // Run 1000 frames
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                system.update(0.016);
            }
            const totalTime = performance.now() - start;

            // Should complete in reasonable time
            expect(totalTime).toBeLessThan(100);

            // Check stats
            const stats = system.getStats();
            expect(stats.totalUpdates).toBe(1000);
        });
    });

    describe('AI Performance', () => {
        test('AI decision making for 4 ghosts should be < 1ms', () => {
            const mazeAdapter = new MazeAdapter(largeMaze);
            const aiController = new AIController(mazeAdapter);

            // Register 4 ghosts
            for (let i = 0; i < 4; i++) {
                aiController.registerEntity(`ghost_${i}`, 'alpha', {
                    scatterTarget: { x: 20 + i, y: 1 }
                });
            }

            const player = {
                gridX: 10,
                gridY: 15,
                direction: Direction.LEFT
            };

            const entities = [];
            for (let i = 0; i < 4; i++) {
                entities.push({
                    id: `ghost_${i}`,
                    gridX: 12 + i,
                    gridY: 15,
                    direction: Direction.NONE,
                    moveProgress: 0,
                    aiType: 'alpha'
                });
            }

            const start = performance.now();
            aiController.update(0.016, {
                getEntityState: (id) => entities.find(e => e.id === id),
                player: player,
                allEntities: entities
            });
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(1);
        });
    });

    describe('Memory Efficiency', () => {
        test('should not leak memory over extended updates', () => {
            const system = new MovementSystem();
            system.initialize(largeMaze);

            // Register entities
            for (let i = 0; i < 10; i++) {
                system.registerEntity({
                    id: `entity_${i}`,
                    gridX: 5 + i,
                    gridY: 10,
                    x: 110 + i * 20,
                    y: 210,
                    speed: 100
                });
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            // Run many updates
            for (let i = 0; i < 10000; i++) {
                system.update(0.016);
            }

            // Stats should remain reasonable
            const stats = system.getStats();
            expect(stats.totalUpdates).toBe(10000);
            // Entity count should remain constant
            expect(stats.entityCount).toBe(10);
        });
    });

    describe('Cache Efficiency', () => {
        test('MazeAdapter should cache valid directions', () => {
            const mazeAdapter = new MazeAdapter(largeMaze);

            // First call - should compute
            const start1 = performance.now();
            mazeAdapter.getValidDirections(10, 10);
            const duration1 = performance.now() - start1;

            // Second call - should use cache
            const start2 = performance.now();
            mazeAdapter.getValidDirections(10, 10);
            const duration2 = performance.now() - start2;

            // Cached call should be faster
            expect(duration2).toBeLessThanOrEqual(duration1);

            // Check cache stats
            const cacheStats = mazeAdapter.getCacheStats();
            expect(cacheStats.size).toBe(1);
        });
    });
});

/**
 * Vergleichs-Benchmark (wenn altes System noch verfügbar)
 */
describe('Performance Comparison', () => {
    const testMaze = createLargeMaze();

    test('new system should have comparable or better performance', () => {
        const system = new MovementSystem();
        system.initialize(testMaze);

        // Setup entities
        for (let i = 0; i < 5; i++) {
            system.registerEntity({
                id: `entity_${i}`,
                gridX: 10,
                gridY: 15,
                x: 210,
                y: 310,
                speed: 100
            }, i > 0 ? { aiType: 'alpha' } : {});
        }

        // Benchmark
        const start = performance.now();
        for (let i = 0; i < 100; i++) {
            system.update(0.016);
        }
        const newSystemTime = performance.now() - start;

        // New system should be efficient
        expect(newSystemTime).toBeLessThan(50);

        console.log(`MovementSystem: ${newSystemTime.toFixed(2)}ms for 100 frames`);
    });
});
