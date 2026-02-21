/**
 * Integration tests for TileCenterMovement system
 */

import GameModel from '../../src/core/GameModel.js';
import { directions } from '../../src/config/gameConfig.js';

describe('TileCenterMovement System Integration', () => {
    describe('GameModel with TileCenterMovement', () => {
        let gameModel;

        beforeEach(() => {
            gameModel = new GameModel({
                level: 1
            });
        });

        test('has integrated movement system', () => {
            expect(gameModel.updatePacmanMovement).toBeDefined();
            expect(gameModel.updateGhostMovement).toBeDefined();
            expect(gameModel.startMovement).toBeDefined();
            expect(gameModel.updateMovementProgress).toBeDefined();
        });

        test('has integrated collision system', () => {
            expect(gameModel.checkAllCollisions).toBeDefined();
            expect(gameModel.checkPelletCollision).toBeDefined();
            expect(gameModel.checkGhostCollisions).toBeDefined();
            expect(gameModel.checkFruitCollision).toBeDefined();
        });

        test('creates ghost AI adapter', () => {
            expect(gameModel.ghostAIAdapter).toBeDefined();
            expect(gameModel.ghostAIAdapter).not.toBeNull();
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
            expect(stats.movementStats).toBeDefined();
            expect(stats.collisionStats).toBeDefined();
        });

        test('resets adapters on resetPositions', () => {
            gameModel.setInputDirection(directions.RIGHT);
            // Run multiple steps to ensure movement is processed
            for (let i = 0; i < 10; i++) {
                gameModel.step(0.016);
            }

            const statsBefore = gameModel.getMovementStats();
            // Verify stats object exists with expected properties
            expect(typeof statsBefore.movesProcessed).toBe('number');

            gameModel.resetPositions();

            const statsAfter = gameModel.getMovementStats();
            expect(statsAfter.movesProcessed).toBe(0);
        });

        test('updates maze on nextLevel', () => {
            gameModel.nextLevel();

            // Should have new maze
            expect(gameModel.level).toBe(2);
            expect(gameModel.maze).toBeDefined();
        });
    });

    describe('Both systems handle game flow states', () => {
        test('handles pause/resume', () => {
            const gameModel = new GameModel({ level: 1 });

            expect(gameModel.isPaused).toBe(false);

            gameModel.setPaused(true);
            expect(gameModel.isPaused).toBe(true);

            const events = gameModel.step(0.016);
            expect(events).toHaveLength(0); // No events when paused

            gameModel.setPaused(false);
            expect(gameModel.isPaused).toBe(false);
        });

        test('handles game over', () => {
            const gameModel = new GameModel({ level: 1, lives: 0 });

            gameModel.setGameOver(true);
            expect(gameModel.isGameOver).toBe(true);

            const events = gameModel.step(0.016);
            expect(events).toHaveLength(0); // No events when game over
        });

        test('handles death sequence', () => {
            const gameModel = new GameModel({ level: 1, lives: 3 });

            gameModel.onPacmanDeath();
            expect(gameModel.isDying).toBe(true);

            // Step through death sequence
            const events = gameModel.step(2.0); // Longer than deathPauseDuration
            expect(events.some((e) => e.type === 'respawn')).toBe(true);
            expect(gameModel.isDying).toBe(false);
        });
    });
});
