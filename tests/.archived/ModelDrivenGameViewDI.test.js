/**
 * ModelDrivenGameViewDI Tests
 * Phase 4: Dependency Injection Pattern
 * Fokus auf DI-Features, nicht vollständige Rendering-Logik
 */

import ModelDrivenGameViewDI from '../../src/views/ModelDrivenGameViewDI.js';
import { ViewContext, ViewState, GameSnapshot } from '../../src/views/ViewInterface.js';
import { globalContainer } from '../../src/core/ServiceContainer.js';

// Import MockFactory
import {
    createMockScene,
    createMockEventBus,
    createMockStorageManager
} from '../mocks/MockFactory.js';

describe('ModelDrivenGameViewDI', () => {
    let mockScene;
    let mockEventBus;
    let mockStorageManager;
    let viewContext;

    beforeEach(() => {
        // Clear container before each test
        globalContainer.clear();

        // Create mocks
        mockScene = createMockScene();
        mockEventBus = createMockEventBus();
        mockStorageManager = createMockStorageManager();

        // Create ViewContext
        viewContext = new ViewContext({
            scene: mockScene,
            storageManager: mockStorageManager,
            eventBus: mockEventBus
        });
    });

    afterEach(() => {
        // Clean up after each test
        globalContainer.clear();
    });

    describe('Dependency Injection', () => {
        test('should create view with DI enabled', () => {
            const view = new ModelDrivenGameViewDI(viewContext);

            expect(view.useDI).toBe(true);
            expect(view.context).toBe(viewContext);
            expect(view.gameModel).toBeNull(); // No direct model access
        });

        test('should get DI statistics', () => {
            const view = new ModelDrivenGameViewDI(viewContext);
            const stats = view.getDIStats();

            expect(stats.usingDI).toBe(true);
            expect(stats.hasSoundManager).toBe(true);
            expect(stats.hasEffectManager).toBe(true);
            expect(stats.hasPelletRenderer).toBe(true);
        });
    });

    describe('Initialization', () => {
        test('should create view components', () => {
            const view = new ModelDrivenGameViewDI(viewContext);

            expect(view.viewState).toBeInstanceOf(ViewState);
            expect(view.playerRenderer).toBeNull(); // Created lazily
            expect(view.ghostRenderers.size).toBe(0);
            expect(view.fruitRenderer).toBeNull();
        });

        test('should initialize managers', () => {
            const view = new ModelDrivenGameViewDI(viewContext);

            expect(view.soundManager).toBeDefined();
            expect(view.effectManager).toBeDefined();
            expect(view.pelletRenderer).toBeDefined();
        });
    });

    describe('Settings', () => {
        test('should apply settings without crashing', () => {
            const view = new ModelDrivenGameViewDI(viewContext);

            expect(() => {
                view.applySettings({
                    soundEnabled: false,
                    volume: 0.8
                });
            }).not.toThrow();
        });

        test('should not crash with null settings', () => {
            const view = new ModelDrivenGameViewDI(viewContext);

            expect(() => {
                view.applySettings(null);
            }).not.toThrow();
        });
    });

    describe('Snapshot Updates', () => {
        test('should handle null snapshot', () => {
            const view = new ModelDrivenGameViewDI(viewContext);

            expect(() => {
                view.updateFromSnapshot(null);
            }).not.toThrow();

            expect(view.lastSnapshot).toBeNull();
        });

        test('should update UI elements from snapshot', () => {
            const view = new ModelDrivenGameViewDI(viewContext);

            const snapshot1 = new GameSnapshot({
                level: 1,
                score: 0,
                highScore: 0,
                lives: 3,
                pacman: {
                    gridX: 10,
                    gridY: 10,
                    x: 200,
                    y: 200,
                    direction: 2,
                    isMoving: true,
                    speed: 100
                },
                ghosts: [],
                fruit: null,
                pelletGrid: Array(20).fill(null).map(() => Array(20).fill(0)),
                maze: Array(20).fill(null).map(() => Array(20).fill(0))
            });

            view.updateFromSnapshot(snapshot1);
            expect(view.viewState.score).toBe(0);

            const snapshot2 = new GameSnapshot({
                level: 1,
                score: 500,
                highScore: 0,
                lives: 3,
                pacman: {
                    gridX: 10,
                    gridY: 10,
                    x: 200,
                    y: 200,
                    direction: 2,
                    isMoving: true,
                    speed: 100
                },
                ghosts: [],
                fruit: null,
                pelletGrid: Array(20).fill(null).map(() => Array(20).fill(0)),
                maze: Array(20).fill(null).map(() => Array(20).fill(0))
            });

            view.updateFromSnapshot(snapshot2);
            expect(view.viewState.score).toBe(500);
        });
    });

    describe('Event Handling', () => {
        test('should bind model events on create', () => {
            const view = new ModelDrivenGameViewDI(viewContext);

            expect(view.unsubscribers.length).toBe(0);

            view.create();

            expect(view.unsubscribers.length).toBe(1);
        });

        test('should handle PELLET_EATEN event without crashing', () => {
            const view = new ModelDrivenGameViewDI(viewContext);
            view.create();

            expect(() => {
                mockEventBus.publish('gameEvent', {
                    type: 'PELLET_EATEN',
                    data: { x: 10, y: 10 }
                });
            }).not.toThrow();
        });

        test('should handle POWER_PELLET_EATEN event without crashing', () => {
            const view = new ModelDrivenGameViewDI(viewContext);
            view.create();

            expect(() => {
                mockEventBus.publish('gameEvent', {
                    type: 'POWER_PELLET_EATEN',
                    data: { x: 10, y: 10 }
                });
            }).not.toThrow();
        });

        test('should handle GHOST_EATEN event without crashing', () => {
            const view = new ModelDrivenGameViewDI(viewContext);
            view.create();

            expect(() => {
                mockEventBus.publish('gameEvent', {
                    type: 'GHOST_EATEN',
                    data: { x: 10, y: 10, points: 200 }
                });
            }).not.toThrow();
        });

        test('should handle PACMAN_DIED event without crashing', () => {
            const view = new ModelDrivenGameViewDI(viewContext);
            view.create();

            expect(() => {
                mockEventBus.publish('gameEvent', {
                    type: 'PACMAN_DIED',
                    data: {}
                });
            }).not.toThrow();
        });

        test('should handle LEVEL_CLEARED event without crashing', () => {
            const view = new ModelDrivenGameViewDI(viewContext);
            view.create();

            expect(() => {
                mockEventBus.publish('gameEvent', {
                    type: 'LEVEL_CLEARED',
                    data: {}
                });
            }).not.toThrow();
        });

        test('should handle GAME_OVER event without crashing', () => {
            const view = new ModelDrivenGameViewDI(viewContext);
            view.create();

            expect(() => {
                mockEventBus.publish('gameEvent', {
                    type: 'GAME_OVER',
                    data: {}
                });
            }).not.toThrow();
        });
    });

    describe('Cleanup', () => {
        test('should destroy resources without crashing', () => {
            const view = new ModelDrivenGameViewDI(viewContext);
            view.create();

            expect(() => {
                view.destroy();
            }).not.toThrow();
        });

        test('should unsubscribe from events on destroy', () => {
            const view = new ModelDrivenGameViewDI(viewContext);
            view.create();

            expect(view.unsubscribers.length).toBeGreaterThan(0);

            view.destroy();

            // Unsubscribers should be cleared
            expect(view.unsubscribers.length).toBe(0);
        });
    });

    describe('No Direct Model Access', () => {
        test('should not allow direct model access', () => {
            const view = new ModelDrivenGameViewDI(viewContext);

            expect(view.gameModel).toBeNull();
        });

        test('should work solely with snapshots', () => {
            const view = new ModelDrivenGameViewDI(viewContext);

            const snapshot = new GameSnapshot({
                level: 1,
                score: 100,
                highScore: 500,
                lives: 3,
                pacman: {
                    gridX: 10,
                    gridY: 10,
                    x: 200,
                    y: 200,
                    direction: 2,
                    isMoving: true,
                    speed: 100
                },
                ghosts: [],
                fruit: null,
                pelletGrid: Array(20).fill(null).map(() => Array(20).fill(0)),
                maze: Array(20).fill(null).map(() => Array(20).fill(0))
            });

            view.updateFromSnapshot(snapshot);

            // All state should come from snapshot, not direct model access
            expect(view.lastSnapshot).toBe(snapshot);
            expect(view.viewState.score).toBe(100);
        });
    });
});
