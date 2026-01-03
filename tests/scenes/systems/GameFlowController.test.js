import { GameFlowController } from '../../../src/scenes/systems/GameFlowController.js';
import { createMockScene, createMockGhost } from '../../utils/testHelpers.js';

describe('GameFlowController', () => {
    let controller;
    let mockScene;
    let mockGhosts;

    beforeEach(() => {
        mockScene = createMockScene();
        mockScene.scene = { start: jest.fn() };
        mockScene.deathHandler = { handleDeath: jest.fn() };
        mockGhosts = [
            createMockGhost({ type: 'blinky', isEaten: false }),
            createMockGhost({ type: 'pinky', isEaten: false }),
            createMockGhost({ type: 'inky', isEaten: true }),
            createMockGhost({ type: 'clyde', isEaten: false })
        ];
        mockScene.ghosts = mockGhosts;
        controller = new GameFlowController(mockScene);
    });

    describe('initialization', () => {
        test('should store references to scene components', () => {
            expect(controller.scene).toBe(mockScene);
            expect(controller.gameState).toBe(mockScene.gameState);
            expect(controller.soundManager).toBe(mockScene.soundManager);
        });
    });

    describe('pellet handling', () => {
        test('should update score when pellet is eaten', () => {
            const initialScore = mockScene.gameState.score;
            controller.handlePelletEaten(10);

            expect(mockScene.gameState.score).toBe(initialScore + 10);
        });

        test('should play waka-waka sound', () => {
            controller.handlePelletEaten(10);

            expect(mockScene.soundManager.playWakaWaka).toHaveBeenCalled();
        });
    });

    describe('power pellet handling', () => {
        test('should update score when power pellet is eaten', () => {
            const initialScore = mockScene.gameState.score;
            controller.handlePowerPelletEaten(50, 8000);

            expect(mockScene.gameState.score).toBe(initialScore + 50);
        });

        test('should set ghosts frightened for correct duration', () => {
            controller.handlePowerPelletEaten(50, 8000);

            expect(mockGhosts[0].setFrightened).toHaveBeenCalledWith(8000);
            expect(mockGhosts[1].setFrightened).toHaveBeenCalledWith(8000);
            expect(mockGhosts[3].setFrightened).toHaveBeenCalledWith(8000);
        });

        test('should not set eaten ghosts frightened', () => {
            controller.handlePowerPelletEaten(50, 8000);

            expect(mockGhosts[2].setFrightened).not.toHaveBeenCalled();
        });

        test('should play power pellet sound', () => {
            controller.handlePowerPelletEaten(50, 8000);

            expect(mockScene.soundManager.playPowerPellet).toHaveBeenCalled();
        });
    });

    describe('ghost collision handling', () => {
        test('should update score when ghost is eaten', () => {
            const result = { type: 'ghost_eaten', score: 200 };
            const initialScore = mockScene.gameState.score;

            controller.handleGhostCollision(result);

            expect(mockScene.gameState.score).toBe(initialScore + 200);
        });

        test('should play ghost eaten sound when ghost is eaten', () => {
            const result = { type: 'ghost_eaten', score: 200 };

            controller.handleGhostCollision(result);

            expect(mockScene.soundManager.playGhostEaten).toHaveBeenCalled();
        });

        test('should call scene deathHandler when pacman dies', () => {
            const result = { type: 'pacman_died' };
            mockScene.deathHandler = { handleDeath: jest.fn() };

            controller.handleGhostCollision(result);

            expect(mockScene.deathHandler.handleDeath).toHaveBeenCalled();
        });

        test('should play death sound when pacman dies', () => {
            const result = { type: 'pacman_died' };
            mockScene.deathHandler = { handleDeath: jest.fn() };

            controller.handleGhostCollision(result);

            expect(mockScene.soundManager.playDeath).toHaveBeenCalled();
        });
    });

    describe('fruit handling', () => {
        beforeEach(() => {
            mockScene.fruit = {
                getScore: () => 100,
                deactivate: jest.fn()
            };
        });

        test('should update score when fruit is eaten', () => {
            const initialScore = mockScene.gameState.score;

            controller.handleFruitEaten();

            expect(mockScene.gameState.score).toBe(initialScore + 100);
        });

        test('should play fruit eat sound', () => {
            controller.handleFruitEaten();

            expect(mockScene.soundManager.playFruitEat).toHaveBeenCalled();
        });

        test('should deactivate fruit when eaten', () => {
            controller.handleFruitEaten();

            expect(mockScene.fruit.deactivate).toHaveBeenCalled();
        });
    });

    describe('level completion', () => {
        test('should increment level on win', () => {
            const initialLevel = mockScene.gameState.level;

            controller.handleWin();

            expect(mockScene.gameState.level).toBe(initialLevel + 1);
        });

        test('should save high score on win', () => {
            controller.handleWin();

            expect(mockScene.storageManager.saveHighScore).toHaveBeenCalledWith(
                mockScene.gameState.score
            );
        });

        test('should play level complete sound', () => {
            controller.handleWin();

            expect(mockScene.soundManager.playLevelComplete).toHaveBeenCalled();
        });

        test('should start WinScene with correct data', () => {
            controller.handleWin();

            expect(mockScene.scene.start).toHaveBeenCalledWith('WinScene', {
                score: mockScene.gameState.score,
                level: mockScene.gameState.level,
                highScore: mockScene.gameState.highScore
            });
        });
    });

    describe('game over handling', () => {
        test('should set game over flag', () => {
            controller.handleGameOver();

            expect(mockScene.gameState.isGameOver).toBe(true);
        });

        test('should save high score', () => {
            controller.handleGameOver();

            expect(mockScene.storageManager.saveHighScore).toHaveBeenCalledWith(
                mockScene.gameState.score
            );
        });

        test('should start GameOverScene with correct data', () => {
            controller.handleGameOver();

            expect(mockScene.scene.start).toHaveBeenCalledWith('GameOverScene', {
                score: mockScene.gameState.score,
                highScore: mockScene.gameState.highScore
            });
        });
    });

    describe('lives handling', () => {
        test('should decrement lives', () => {
            const initialLives = mockScene.gameState.lives;

            controller.decrementLives();

            expect(mockScene.gameState.lives).toBe(initialLives - 1);
        });

        test('should return true when lives reach zero', () => {
            mockScene.gameState.lives = 1;

            const result = controller.decrementLives();

            expect(result).toBe(true);
        });

        test('should return false when lives remain', () => {
            mockScene.gameState.lives = 3;

            const result = controller.decrementLives();

            expect(result).toBe(false);
        });
    });
});
