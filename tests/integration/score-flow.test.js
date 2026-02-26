/**
 * Test for the complete score flow:
 * GameModel -> PlayerScoreFacade -> UIController -> ScoreBoard
 */

import GameModel from '../../src/core/GameModel.js';
import { PlayerScoreFacade } from '../../src/model/PlayerScoreFacade.js';
import { UIController } from '../../src/scenes/systems/UIController.js';

describe('Score Flow Integration', () => {
    let gameModel;
    let playerScoreFacade;
    let mockScene;
    let scoreUpdateLog;

    // Helper to create a complete mock text object
    const createMockText = (x, y, text, style) => {
        const textObj = {
            x, y, text, style,
            setOrigin: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setText: jest.fn(function(newText) {
                this.text = newText;
                scoreUpdateLog.push({ method: 'setText', text: newText });
                return this;
            }),
            destroy: jest.fn()
        };
        return textObj;
    };

    beforeEach(() => {
        scoreUpdateLog = [];

        // Create a minimal mock scene
        mockScene = {
            scale: { width: 560, height: 620 },
            add: {
                text: jest.fn(createMockText),
                rectangle: jest.fn(() => ({
                    setStrokeStyle: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                graphics: jest.fn(() => ({
                    lineStyle: jest.fn().mockReturnThis(),
                    beginPath: jest.fn().mockReturnThis(),
                    moveTo: jest.fn().mockReturnThis(),
                    lineTo: jest.fn().mockReturnThis(),
                    strokePath: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                }))
            },
            tweens: { add: jest.fn(), killTweensOf: jest.fn() },
            time: { delayedCall: jest.fn() }
        };

        // Create GameModel
        gameModel = new GameModel({
            score: 0,
            lives: 3,
            level: 1,
            highScore: 0
        });

        // Create PlayerScoreFacade
        playerScoreFacade = new PlayerScoreFacade(gameModel);
    });

    describe('PlayerScoreFacade.toHudSnapshot()', () => {
        it('should return correct initial score', () => {
            const snapshot = playerScoreFacade.toHudSnapshot();
            console.log('Initial snapshot:', snapshot);
            expect(snapshot.score).toBe(0);
            expect(snapshot.highScore).toBe(0);
            expect(snapshot.lives).toBe(3);
            expect(snapshot.level).toBe(1);
        });

        it('should reflect score changes in GameModel', () => {
            // Manually set score
            gameModel.score = 100;

            const snapshot = playerScoreFacade.toHudSnapshot();
            console.log('After setting score to 100:', snapshot);
            expect(snapshot.score).toBe(100);
        });

        it('should reflect score changes via scoreModule', () => {
            // Apply a pellet score event
            gameModel.scoreModule.applyEvent({ type: 'pellet_eaten', score: 10 });

            const snapshot = playerScoreFacade.toHudSnapshot();
            console.log('After pellet eaten:', snapshot);
            expect(snapshot.score).toBe(10);
        });
    });

    describe('UIController.updateFromSnapshot()', () => {
        let uiController;

        beforeEach(() => {
            uiController = new UIController(mockScene, playerScoreFacade);
            uiController.create();
        });

        it('should update score text when snapshot changes', () => {
            // Initial update
            const snapshot1 = playerScoreFacade.toHudSnapshot();
            uiController.updateFromSnapshot(snapshot1);

            console.log('Score update log after initial update:', scoreUpdateLog);

            // Change score
            gameModel.score = 500;

            // Update with new snapshot
            const snapshot2 = playerScoreFacade.toHudSnapshot();
            console.log('Snapshot2:', snapshot2);
            uiController.updateFromSnapshot(snapshot2);

            console.log('Score update log after score change:', scoreUpdateLog);

            // Find the last setText call for score
            const scoreUpdates = scoreUpdateLog.filter(log => log.text === '500');
            expect(scoreUpdates.length).toBeGreaterThan(0);
        });

        it('should propagate score changes from GameModel to ScoreBoard', () => {
            // Set up initial state
            const initialSnapshot = playerScoreFacade.toHudSnapshot();
            uiController.updateFromSnapshot(initialSnapshot);

            // Simulate pellet eaten
            gameModel.applyCollisionEffect({ type: 'pellet_eaten', score: 10 });

            // Get new snapshot
            const newSnapshot = playerScoreFacade.toHudSnapshot();
            console.log('New snapshot after pellet:', newSnapshot);

            // Update UI
            uiController.updateFromSnapshot(newSnapshot);

            console.log('Score update log:', scoreUpdateLog);

            // Verify score was updated
            expect(newSnapshot.score).toBe(10);
        });
    });

    describe('Complete flow: GameModel -> Facade -> UIController', () => {
        it('should correctly propagate score through the entire chain', () => {
            // Create UIController
            const uiController = new UIController(mockScene, playerScoreFacade);
            uiController.create();

            // Initial state
            expect(gameModel.score).toBe(0);

            // Get initial snapshot
            let snapshot = playerScoreFacade.toHudSnapshot();
            expect(snapshot.score).toBe(0);

            // Update UI
            uiController.updateFromSnapshot(snapshot);

            // Apply score change
            gameModel.scoreModule.applyEvent({ type: 'pellet_eaten', score: 10 });

            // Verify GameModel has new score
            expect(gameModel.score).toBe(10);

            // Get new snapshot
            snapshot = playerScoreFacade.toHudSnapshot();
            console.log('Snapshot after pellet eaten:', snapshot);
            expect(snapshot.score).toBe(10);

            // Update UI
            uiController.updateFromSnapshot(snapshot);

            // Check that ScoreBoard received the update
            const lastUpdate = scoreUpdateLog[scoreUpdateLog.length - 1];
            console.log('Last score update:', lastUpdate);
            expect(lastUpdate.text).toBe('10');
        });
    });
});
