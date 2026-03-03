/**
 * Scene Transition Integration Tests
 * Phase 2: Integration Tests for View → Transition Event → Controller → Scene Change
 */

import { SceneTransitionHandler } from '../src/views/SceneTransitionHandler.js';
import { GameController } from '../src/controllers/GameController.js';
import { GAME_EVENTS, gameEvents } from '../src/core/EventBus.js';

// Mock GameModel
class MockGameModel {
    constructor() {
        this.state = {
            isGameOver: false,
            isDying: false,
            isPaused: false,
            score: 0,
            level: 1,
            highScore: 0
        };
    }

    setInputDirection(direction) {
        // Mock implementation
    }

    togglePaused() {
        this.state.isPaused = !this.state.isPaused;
    }
}

describe('Scene Transition Integration Tests', () => {
    let transitionHandler;
    let controller;
    let mockGameModel;

    beforeEach(() => {
        gameEvents.clear();
        mockGameModel = new MockGameModel();

        // Setup SceneTransitionHandler (used by View)
        transitionHandler = new SceneTransitionHandler({ eventBus: gameEvents });

        // Setup GameController
        controller = new GameController({
            gameModel: mockGameModel
        });
        controller.bindSceneTransitionEvents();
    });

    afterEach(() => {
        if (transitionHandler) {
            // Cleanup
        }
        if (controller) {
            controller.unbindSceneTransitionEvents();
            controller.destroy();
        }
        gameEvents.clear();
    });

    describe('Win Scene Transition Flow', () => {
        it('should emit SCENE_TRANSITION:WinScene when WinScene requested', () => {
            let sceneTransitionEmitted = false;
            let eventData = null;

            gameEvents.on('SCENE_TRANSITION:WinScene', (data) => {
                sceneTransitionEmitted = true;
                eventData = data;
            });

            // Request transition
            transitionHandler.requestSceneTransition('WinScene', {
                score: 100,
                level: 5,
                highScore: 500
            });

            // Verify
            expect(sceneTransitionEmitted).toBe(true);
            expect(eventData.sceneKey).toBe('WinScene');
            expect(eventData.data).toEqual({ score: 100, level: 5, highScore: 500 });
            expect(eventData.timestamp).toBeDefined();
        });

        it('should emit SCENE_TRANSITION:WinScene with GAME_WIN event', () => {
            let gameWinEmitted = false;

            gameEvents.on('GAME_WIN', () => {
                gameWinEmitted = true;
            });

            transitionHandler.requestSceneTransition('WinScene', {
                score: 100,
                level: 5,
                highScore: 500
            });

            expect(gameWinEmitted).toBe(true);
        });
    });

    describe('Game Over Scene Transition Flow', () => {
        it('should emit SCENE_TRANSITION:GameOverScene when GameOverScene requested', () => {
            let sceneTransitionEmitted = false;
            let eventData = null;

            gameEvents.on('SCENE_TRANSITION:GameOverScene', (data) => {
                sceneTransitionEmitted = true;
                eventData = data;
            });

            transitionHandler.requestSceneTransition('GameOverScene', {
                score: 250,
                highScore: 500
            });

            expect(sceneTransitionEmitted).toBe(true);
            expect(eventData.sceneKey).toBe('GameOverScene');
            expect(eventData.data).toEqual({ score: 250, highScore: 500 });
            expect(eventData.timestamp).toBeDefined();
        });

        it('should emit SCENE_TRANSITION:GameOverScene with GAME_OVER event', () => {
            let gameOverEmitted = false;

            gameEvents.on('GAME_OVER', () => {
                gameOverEmitted = true;
            });

            transitionHandler.requestSceneTransition('GameOverScene', {
                score: 250,
                highScore: 500
            });

            expect(gameOverEmitted).toBe(true);
        });
    });

    describe('Menu Scene Transition Flow', () => {
        it('should emit SCENE_TRANSITION:MenuScene when MenuScene requested', () => {
            let sceneTransitionEmitted = false;
            let eventData = null;

            gameEvents.on('SCENE_TRANSITION:MenuScene', (data) => {
                sceneTransitionEmitted = true;
                eventData = data;
            });

            transitionHandler.requestSceneTransition('MenuScene', { from: 'GameScene' });

            expect(sceneTransitionEmitted).toBe(true);
            expect(eventData.sceneKey).toBe('MenuScene');
            expect(eventData.data).toEqual({ from: 'GameScene' });
            expect(eventData.timestamp).toBeDefined();
        });

        it('should emit SCENE_TRANSITION:MenuScene with RETURN_TO_MENU event', () => {
            let returnToMenuEmitted = false;

            gameEvents.on('RETURN_TO_MENU', () => {
                returnToMenuEmitted = true;
            });

            transitionHandler.requestSceneTransition('MenuScene', { from: 'GameScene' });

            expect(returnToMenuEmitted).toBe(true);
        });
    });

    describe('Pause Game Flow', () => {
        it('should emit PAUSE_REQUESTED when pause requested', () => {
            let pauseRequested = false;

            gameEvents.on(GAME_EVENTS.PAUSE_REQUESTED, () => {
                pauseRequested = true;
            });

            transitionHandler.requestPause();

            expect(pauseRequested).toBe(true);
        });

        it('should emit RESUME_REQUESTED when resume requested', () => {
            let resumeRequested = false;

            gameEvents.on(GAME_EVENTS.RESUME_REQUESTED, () => {
                resumeRequested = true;
            });

            transitionHandler.requestResume();

            expect(resumeRequested).toBe(true);
        });
    });

    describe('Multiple Sequential Transitions', () => {
        it('should handle multiple transitions in sequence', () => {
            const transitions = [];

            gameEvents.on('SCENE_TRANSITION:WinScene', (data) => {
                transitions.push({ scene: 'WinScene', data });
            });

            gameEvents.on('SCENE_TRANSITION:MenuScene', (data) => {
                transitions.push({ scene: 'MenuScene', data });
            });

            gameEvents.on('SCENE_TRANSITION:GameOverScene', (data) => {
                transitions.push({ scene: 'GameOverScene', data });
            });

            transitionHandler.requestSceneTransition('WinScene', { score: 100 });
            transitionHandler.requestSceneTransition('MenuScene', {});
            transitionHandler.requestSceneTransition('GameOverScene', { score: 50 });

            expect(transitions).toHaveLength(3);
            expect(transitions[0].scene).toBe('WinScene');
            expect(transitions[1].scene).toBe('MenuScene');
            expect(transitions[2].scene).toBe('GameOverScene');
        });
    });

    describe('Scene Transition Handler Helper Methods', () => {
        it('should emit RESTART_LEVEL_REQUESTED when restart requested', () => {
            let restartRequested = false;

            gameEvents.on(GAME_EVENTS.RESTART_LEVEL_REQUESTED, () => {
                restartRequested = true;
            });

            transitionHandler.requestRestart();

            expect(restartRequested).toBe(true);
        });

        it('should emit RETURN_TO_MENU_REQUESTED when return to menu requested', () => {
            let returnRequested = false;

            gameEvents.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
                returnRequested = true;
            });

            transitionHandler.requestReturnToMenu();

            expect(returnRequested).toBe(true);
        });
    });
});
