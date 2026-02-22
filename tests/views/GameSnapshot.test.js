/**
 * GameSnapshot Tests
 * Tests for GameSnapshot immutability and data integrity
 */

import { GameSnapshot, ViewContext, ViewState } from '../../src/views/ViewInterface.js';

describe('GameSnapshot', () => {
    it('should create snapshot with all required properties', () => {
        const snapshotData = {
            level: 1,
            score: 100,
            lives: 3,
            highScore: 500,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 200,
            totalPellets: 240,
            pelletsEatenPercent: 16.67,
            maze: [[0, 1], [1, 0]],
            pelletGrid: [[1, 0], [0, 1]],
            pacman: { x: 10, y: 10, direction: 'RIGHT' },
            ghosts: [
                { ghostType: 'alpha', x: 5, y: 5 },
                { ghostType: 'beta', x: 6, y: 6 }
            ],
            fruit: { active: false },
            boss: null,
            powerUps: [],
            story: null,
            tickCount: 100
        };

        const snapshot = new GameSnapshot(snapshotData);

        // Check all getters
        expect(snapshot.level).toBe(1);
        expect(snapshot.score).toBe(100);
        expect(snapshot.lives).toBe(3);
        expect(snapshot.highScore).toBe(500);
        expect(snapshot.isPaused).toBe(false);
        expect(snapshot.isGameOver).toBe(false);
        expect(snapshot.isDying).toBe(false);
        expect(snapshot.levelComplete).toBe(false);
        expect(snapshot.pelletsRemaining).toBe(200);
        expect(snapshot.totalPellets).toBe(240);
        expect(snapshot.maze).toEqual([[0, 1], [1, 0]]);
        expect(snapshot.pelletGrid).toEqual([[1, 0], [0, 1]]);
        expect(snapshot.pacman).toEqual({ x: 10, y: 10, direction: 'RIGHT' });
        expect(snapshot.ghosts.length).toBe(2);
        expect(snapshot.fruit).toEqual({ active: false });
        expect(snapshot.boss).toBeNull();
        expect(snapshot.powerUps).toEqual([]);
        expect(snapshot.story).toBeNull();
        expect(snapshot.tickCount).toBe(100);
    });

    it('should handle missing optional properties', () => {
        const snapshotData = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 0,
            totalPellets: 0
        };

        const snapshot = new GameSnapshot(snapshotData);

        expect(snapshot.maze).toBeNull();
        expect(snapshot.pelletGrid).toEqual([]);
        expect(snapshot.pacman).toBeNull();
        expect(snapshot.ghosts).toEqual([]);
        expect(snapshot.fruit).toBeNull();
        expect(snapshot.boss).toBeNull();
        expect(snapshot.powerUps).toEqual([]);
        expect(snapshot.story).toBeNull();
    });

    it('should check if pellet exists at position', () => {
        const snapshotData = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 2,
            totalPellets: 4,
            pelletGrid: [
                [1, 0],
                [0, 1]
            ]
        };

        const snapshot = new GameSnapshot(snapshotData);

        expect(snapshot.hasPelletAt(0, 0)).toBe(true);
        expect(snapshot.hasPelletAt(1, 1)).toBe(true);
        expect(snapshot.hasPelletAt(0, 1)).toBe(false);
        expect(snapshot.hasPelletAt(1, 0)).toBe(false);
        expect(snapshot.hasPelletAt(-1, 0)).toBe(false);
        expect(snapshot.hasPelletAt(0, 10)).toBe(false);
    });

    it('should get ghost by type', () => {
        const snapshotData = {
            level: 1,
            score: 0,
            lives: 3,
            highScore: 0,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 0,
            totalPellets: 0,
            ghosts: [
                { ghostType: 'alpha', x: 5, y: 5 },
                { ghostType: 'beta', x: 6, y: 6 }
            ]
        };

        const snapshot = new GameSnapshot(snapshotData);

        const alphaGhost = snapshot.getGhost('alpha');
        expect(alphaGhost).toEqual({ ghostType: 'alpha', x: 5, y: 5 });

        const betaGhost = snapshot.getGhost('beta');
        expect(betaGhost).toEqual({ ghostType: 'beta', x: 6, y: 6 });

        const gammaGhost = snapshot.getGhost('gamma');
        expect(gammaGhost).toBeNull();
    });

    it('should clone snapshot', () => {
        const snapshotData = {
            level: 1,
            score: 100,
            lives: 3,
            highScore: 500,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            levelComplete: false,
            pelletsRemaining: 200,
            totalPellets: 240
        };

        const snapshot = new GameSnapshot(snapshotData);
        const clonedSnapshot = snapshot.clone();

        expect(clonedSnapshot.level).toBe(1);
        expect(clonedSnapshot.score).toBe(100);
        expect(clonedSnapshot.lives).toBe(3);

        // Clone should create new object
        expect(clonedSnapshot._data).not.toBe(snapshot._data);
    });

    describe('ViewContext', () => {
        it('should create view context with dependencies', () => {
            const mockScene = {
                add: {},
                make: {}
            };
            const mockStorageManager = {
                saveHighScore: () => {}
            };
            const mockEventBus = {
                on: () => {},
                emit: () => {}
            };

            const context = new ViewContext({
                scene: mockScene,
                storageManager: mockStorageManager,
                eventBus: mockEventBus
            });

            expect(context.scene).toBe(mockScene);
            expect(context.storageManager).toBe(mockStorageManager);
            expect(context.eventBus).toBe(mockEventBus);
            expect(context.config).toBeDefined();
            expect(context.config.tileSize).toBe(20);
        });
    });

    describe('ViewState', () => {
        it('should manage visual entities', () => {
            const state = new ViewState();
            const mockVisual = {
                destroy: () => {}
            };

            // Add visual
            state.addVisual('test-id', mockVisual);
            expect(state.getVisual('test-id')).toBe(mockVisual);

            // Remove visual
            state.removeVisual('test-id');
            expect(state.getVisual('test-id')).toBeUndefined();
        });

        it('should track pellet visibility', () => {
            const state = new ViewState();

            // Add visible pellets
            state.updatePelletVisibility(['0,0', '1,1'], true);
            expect(state.isPelletVisible(0, 0)).toBe(true);
            expect(state.isPelletVisible(1, 1)).toBe(true);
            expect(state.isPelletVisible(0, 1)).toBe(false);

            // Remove visible pellets
            state.updatePelletVisibility(['0,0'], false);
            expect(state.isPelletVisible(0, 0)).toBe(false);
            expect(state.isPelletVisible(1, 1)).toBe(true);
        });

        it('should clear all state', () => {
            const state = new ViewState();
            const mockVisual = {
                destroy: () => {}
            };

            state.addVisual('test-id', mockVisual);
            state.updatePelletVisibility(['0,0'], true);
            state.animationQueue = ['test'];

            state.clear();

            expect(state.getVisual('test-id')).toBeUndefined();
            expect(state.isPelletVisible(0, 0)).toBe(false);
            expect(state.animationQueue).toEqual([]);
        });
    });
});
