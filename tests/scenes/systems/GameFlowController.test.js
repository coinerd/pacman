/**
 * Tests for GameFlowController
 * Manages game state, scoring, level progression, and win/lose conditions
 */

import { GameFlowController } from '../../../src/scenes/systems/GameFlowController.js';

describe('GameFlowController', () => {
    let gameFlowController;
    let mockScene;
    let mockGameModel;
    let mockStorageManager;
    let mockSoundManager;

    beforeEach(() => {
        mockGameModel = {
            score: 0,
            level: 1,
            highScore: 1000,
            isGameOver: false,
            onPelletEaten: jest.fn(),
            onPowerPelletEaten: jest.fn(),
            onGhostEaten: jest.fn(),
            onPacmanDeath: jest.fn(),
            onFruitEaten: jest.fn(),
            onLevelComplete: jest.fn(),
            setGameOver: jest.fn(),
            decrementLives: jest.fn()
        };

        mockStorageManager = {
            saveHighScore: jest.fn()
        };

        mockSoundManager = {
            playWakaWaka: jest.fn(),
            playPowerPellet: jest.fn(),
            playGhostEaten: jest.fn(),
            playDeath: jest.fn(),
            playFruitEat: jest.fn(),
            playLevelComplete: jest.fn()
        };

        mockScene = {
            gameModel: mockGameModel,
            storageManager: mockStorageManager,
            soundManager: mockSoundManager,
            ghosts: [],
            fruit: {
                getScore: jest.fn(() => 500),
                deactivate: jest.fn()
            },
            deathHandler: {
                handleDeath: jest.fn()
            },
            scene: {
                start: jest.fn()
            }
        };

        gameFlowController = new GameFlowController(mockScene);
    });

    describe('constructor', () => {
        test('stores scene reference', () => {
            expect(gameFlowController.scene).toBe(mockScene);
        });

        test('stores game model reference', () => {
            expect(gameFlowController.gameModel).toBe(mockGameModel);
        });

        test('stores storage manager reference', () => {
            expect(gameFlowController.storageManager).toBe(mockStorageManager);
        });

        test('stores sound manager reference', () => {
            expect(gameFlowController.soundManager).toBe(mockSoundManager);
        });
    });

    describe('handlePelletEaten', () => {
        test('calls onPelletEaten on game model', () => {
            gameFlowController.handlePelletEaten(10, 100);

            expect(mockGameModel.onPelletEaten).toHaveBeenCalledWith(10, 100);
        });

        test('plays waka waka sound', () => {
            gameFlowController.handlePelletEaten(10, 100);

            expect(mockSoundManager.playWakaWaka).toHaveBeenCalled();
        });
    });

    describe('handlePowerPelletEaten', () => {
        test('calls onPowerPelletEaten on game model', () => {
            gameFlowController.handlePowerPelletEaten(50, 6, 99);

            expect(mockGameModel.onPowerPelletEaten).toHaveBeenCalledWith(50, 99);
        });

        test('plays power pellet sound', () => {
            gameFlowController.handlePowerPelletEaten(50, 6, 99);

            expect(mockSoundManager.playPowerPellet).toHaveBeenCalled();
        });

        test('sets frightened on non-eaten ghosts', () => {
            const ghost1 = {
                isEaten: false,
                setFrightened: jest.fn()
            };
            const ghost2 = {
                isEaten: true,
                setFrightened: jest.fn()
            };
            mockScene.ghosts = [ghost1, ghost2];

            gameFlowController.handlePowerPelletEaten(50, 6, 99);

            expect(ghost1.setFrightened).toHaveBeenCalledWith(6);
            expect(ghost2.setFrightened).not.toHaveBeenCalled();
        });
    });

    describe('handleGhostCollision', () => {
        test('handles ghost_eaten result', () => {
            const result = { type: 'ghost_eaten', score: 200 };

            gameFlowController.handleGhostCollision(result);

            expect(mockGameModel.onGhostEaten).toHaveBeenCalledWith(200);
            expect(mockSoundManager.playGhostEaten).toHaveBeenCalled();
        });

        test('handles pacman_died result', () => {
            const result = { type: 'pacman_died' };

            gameFlowController.handleGhostCollision(result);

            expect(mockGameModel.onPacmanDeath).toHaveBeenCalled();
            expect(mockScene.deathHandler.handleDeath).toHaveBeenCalled();
            expect(mockSoundManager.playDeath).toHaveBeenCalled();
        });

        test('ignores unknown result types', () => {
            const result = { type: 'unknown' };

            gameFlowController.handleGhostCollision(result);

            expect(mockGameModel.onGhostEaten).not.toHaveBeenCalled();
            expect(mockGameModel.onPacmanDeath).not.toHaveBeenCalled();
        });
    });

    describe('handleFruitEaten', () => {
        test('calls onFruitEaten with fruit score', () => {
            gameFlowController.handleFruitEaten();

            expect(mockGameModel.onFruitEaten).toHaveBeenCalledWith(500);
        });

        test('plays fruit eat sound', () => {
            gameFlowController.handleFruitEaten();

            expect(mockSoundManager.playFruitEat).toHaveBeenCalled();
        });

        test('deactivates fruit', () => {
            gameFlowController.handleFruitEaten();

            expect(mockScene.fruit.deactivate).toHaveBeenCalled();
        });
    });

    describe('handleWin', () => {
        test('calls onLevelComplete on game model', () => {
            gameFlowController.handleWin();

            expect(mockGameModel.onLevelComplete).toHaveBeenCalled();
        });

        test('plays level complete sound', () => {
            gameFlowController.handleWin();

            expect(mockSoundManager.playLevelComplete).toHaveBeenCalled();
        });

        test('saves high score', () => {
            gameFlowController.handleWin();

            expect(mockStorageManager.saveHighScore).toHaveBeenCalledWith(mockGameModel.score);
        });

        test('starts WinScene with correct data', () => {
            gameFlowController.handleWin();

            expect(mockScene.scene.start).toHaveBeenCalledWith('WinScene', {
                score: mockGameModel.score,
                level: mockGameModel.level,
                highScore: mockGameModel.highScore
            });
        });
    });

    describe('handleGameOver', () => {
        test('sets game over state', () => {
            gameFlowController.handleGameOver();

            expect(mockGameModel.setGameOver).toHaveBeenCalledWith(true);
        });

        test('saves high score', () => {
            gameFlowController.handleGameOver();

            expect(mockStorageManager.saveHighScore).toHaveBeenCalledWith(mockGameModel.score);
        });

        test('starts GameOverScene with correct data', () => {
            gameFlowController.handleGameOver();

            expect(mockScene.scene.start).toHaveBeenCalledWith('GameOverScene', {
                score: mockGameModel.score,
                highScore: mockGameModel.highScore
            });
        });
    });

    describe('decrementLives', () => {
        test('calls decrementLives on game model', () => {
            mockGameModel.decrementLives.mockReturnValue(false);

            gameFlowController.decrementLives();

            expect(mockGameModel.decrementLives).toHaveBeenCalled();
        });

        test('returns result from game model', () => {
            mockGameModel.decrementLives.mockReturnValue(true);

            const result = gameFlowController.decrementLives();

            expect(result).toBe(true);
        });
    });
});
