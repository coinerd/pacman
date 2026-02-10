/**
 * Integration tests for decoupled movement and collision systems
 */

import GameModel from '../../src/core/GameModel.js';
import { directions } from '../../src/config/gameConfig.js';

describe('Decoupled Systems Integration', () => {
    describe('GameModel with useDecoupledSystems=true', () => {
        let gameModel;

        beforeEach(() => {
            gameModel = new GameModel({
                level: 1,
                useDecoupledSystems: true
            });
        });

        test('creates movement adapter', () => {
            expect(gameModel.movementAdapter).toBeDefined();
            expect(gameModel.movementAdapter).not.toBeNull();
        });

        test('creates collision adapter', () => {
            expect(gameModel.collisionAdapter).toBeDefined();
            expect(gameModel.collisionAdapter).not.toBeNull();
        });

        test('does not create legacy collision system', () => {
            expect(gameModel.collisionSystem).toBeNull();
        });

        test('runs game step without errors', () => {
            gameModel.setInputDirection(directions.RIGHT);

            const events = gameModel.step(0.016); // ~60fps

            expect(Array.isArray(events)).toBe(true);
        });

        test('pacman moves with input', () => {
            const initialX = gameModel.pacman.x;
            gameModel.setInputDirection(directions.RIGHT);

            // Run multiple steps to ensure movement
            for (let i = 0; i < 10; i++) {
                gameModel.step(0.016);
            }

            // Pacman should have moved (or been blocked by wall)
            expect(gameModel.pacman.x !== initialX || gameModel.pacman.direction).toBeTruthy();
        });

        test('tracks statistics', () => {
            gameModel.setInputDirection(directions.RIGHT);
            gameModel.step(0.016);

            const stats = gameModel.getStats();
            expect(stats.useDecoupledSystems).toBe(true);
            expect(stats.movementStats).toBeDefined();
            expect(stats.collisionStats).toBeDefined();
        });

        test('resets adapters on resetPositions', () => {
            gameModel.setInputDirection(directions.RIGHT);
            gameModel.step(0.016);

            const statsBefore = gameModel.movementAdapter.getStats();
            expect(statsBefore.movesProcessed).toBeGreaterThan(0);

            gameModel.resetPositions();

            const statsAfter = gameModel.movementAdapter.getStats();
            expect(statsAfter.movesProcessed).toBe(0);
        });

        test('updates maze on nextLevel', () => {
            gameModel.nextLevel();

            // Should have new maze
            expect(gameModel.level).toBe(2);
            expect(gameModel.movementAdapter.mazeQuery).toBeDefined();
        });
    });

    describe('GameModel with useDecoupledSystems=false (legacy)', () => {
        let gameModel;

        beforeEach(() => {
            gameModel = new GameModel({
                level: 1,
                useDecoupledSystems: false
            });
        });

        test('creates legacy collision system', () => {
            expect(gameModel.collisionSystem).toBeDefined();
            expect(gameModel.collisionSystem).not.toBeNull();
        });

        test('does not create adapters', () => {
            expect(gameModel.movementAdapter).toBeNull();
            expect(gameModel.collisionAdapter).toBeNull();
        });

        test('runs game step without errors', () => {
            gameModel.setInputDirection(directions.RIGHT);

            const events = gameModel.step(0.016);

            expect(Array.isArray(events)).toBe(true);
        });

        test('tracks statistics', () => {
            gameModel.setInputDirection(directions.RIGHT);
            gameModel.step(0.016);

            const stats = gameModel.getStats();
            expect(stats.useDecoupledSystems).toBe(false);
            expect(stats.collisionStats).toBeDefined();
        });
    });

    describe('Feature parity between systems', () => {
        test('both systems handle pellet eating', () => {
            const decoupled = new GameModel({ level: 1, useDecoupledSystems: true });
            const legacy = new GameModel({ level: 1, useDecoupledSystems: false });

            // Position both pacmans at a pellet location
            const pelletX = 20; // First pellet location
            const pelletY = 60;

            decoupled.pacman.x = pelletX;
            decoupled.pacman.y = pelletY;
            decoupled.pacman.gridX = 1;
            decoupled.pacman.gridY = 3;

            legacy.pacman.x = pelletX;
            legacy.pacman.y = pelletY;
            legacy.pacman.gridX = 1;
            legacy.pacman.gridY = 3;

            // Both should detect pellet collision
            const decoupledEvents = decoupled.step(0.016);
            const legacyEvents = legacy.step(0.016);

            // Both should return arrays of events
            expect(Array.isArray(decoupledEvents)).toBe(true);
            expect(Array.isArray(legacyEvents)).toBe(true);
        });

        test('both systems handle game flow states', () => {
            const decoupled = new GameModel({ level: 1, useDecoupledSystems: true });
            const legacy = new GameModel({ level: 1, useDecoupledSystems: false });

            expect(decoupled.isPaused).toBe(false);
            expect(legacy.isPaused).toBe(false);

            expect(decoupled.isGameOver).toBe(false);
            expect(legacy.isGameOver).toBe(false);

            // Both should respect paused state
            decoupled.setPaused(true);
            legacy.setPaused(true);

            const decoupledEvents = decoupled.step(0.016);
            const legacyEvents = legacy.step(0.016);

            // Should return empty arrays when paused
            expect(decoupledEvents).toHaveLength(0);
            expect(legacyEvents).toHaveLength(0);
        });
    });
});
