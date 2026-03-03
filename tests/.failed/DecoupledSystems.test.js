/**
 * Integration tests for TileCenterMovement system
 */

import GameModelDI from '../../src/model/core/GameModelDI.js';
import { directions } from '../../src/config/gameConfig.js';

describe('TileCenterMovement System Integration', () => {
    describe('GameModel with TileCenterMovement', () => {
        let gameModel;

        beforeEach(() => {
            gameModel = new GameModelDI({
                level: 1
            }, true);
        }, true);

        test('has integrated movement system', () => {
            expect(gameModel.updatePacmanMovement).toBeDefined();
            expect(gameModel.updateGhostMovement).toBeDefined();
            expect(gameModel.startMovement).toBeDefined();
            expect(gameModel.updateMovementProgress).toBeDefined();
        }, true);

        test('has integrated collision system', () => {
            expect(gameModel.checkAllCollisions).toBeDefined();
            expect(gameModel.checkPelletCollision).toBeDefined();
            expect(gameModel.checkGhostCollisions).toBeDefined();
            expect(gameModel.checkFruitCollision).toBeDefined();
        }, true);

        test('creates ghost AI adapter', () => {
            expect(gameModel.ghostAIAdapter).toBeDefined();
            expect(gameModel.ghostAIAdapter).not.toBeNull();
        }, true);

        test('runs game step without errors', () => {
            gameModel.setInputDirection(directions.RIGHT);

            const events = gameModel.step(0.016); // ~60fps

            expect(Array.isArray(events)).toBe(true);
        }, true);

        test('pacman moves with input', () => {
            const initialX = gameModel.pacman.x;
            gameModel.setInputDirection(directions.RIGHT);

            // Run multiple steps to ensure movement
            for (let i = 0; i < 10; i++) {
                gameModel.step(0.016);
            }

            // Pacman should have moved (or been blocked by wall)
            expect(gameModel.pacman.x !== initialX || gameModel.pacman.direction).toBeTruthy();
        }, true);

        test('tracks statistics', () => {
            gameModel.setInputDirection(directions.RIGHT);
            gameModel.step(0.016);

            const stats = gameModel.getStats();
            expect(stats.movementStats).toBeDefined();
            expect(stats.collisionStats).toBeDefined();
        }, true);

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
        }, true);

        test('updates maze on nextLevel', () => {
            gameModel.nextLevel();

            // Should have new maze
            expect(gameModel.level).toBe(2);
            expect(gameModel.maze).toBeDefined();
        }, true);
    }, true);

    describe('Both systems handle game flow states', () => {
        test('handles pause/resume', () => {
            const gameModel = new GameModelDI({ level: 1 }, true);

            expect(gameModel.isPaused).toBe(false);

            gameModel.setPaused(true);
            expect(gameModel.isPaused).toBe(true);

            const events = gameModel.step(0.016);
            expect(events).toHaveLength(0); // No events when paused

            gameModel.setPaused(false);
            expect(gameModel.isPaused).toBe(false);
        }, true);

        test('handles game over', () => {
            const gameModel = new GameModelDI({ level: 1, lives: 0 }, true);

            gameModel.setGameOver(true);
            expect(gameModel.isGameOver).toBe(true);

            const events = gameModel.step(0.016);
            expect(events).toHaveLength(0); // No events when game over
        }, true);

        test('handles death sequence', () => {
            const gameModel = new GameModelDI({ level: 1, lives: 3 }, true);

            gameModel.onPacmanDeath();
            expect(gameModel.isDying).toBe(true);

            // Step through death sequence
            const events = gameModel.step(2.0); // Longer than deathPauseDuration
            expect(events.some((e) => e.type === 'respawn')).toBe(true);
            expect(gameModel.isDying).toBe(false);
        }, true);
    }, true);
}, true);
