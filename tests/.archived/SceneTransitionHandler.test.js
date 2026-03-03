/**
 * SceneTransitionHandler Tests
 * Phase 2: Scene-Transition Handler Tests
 */

import { SceneTransitionHandler } from '../src/views/SceneTransitionHandler.js';
import { GAME_EVENTS, gameEvents } from '../src/core/EventBus.js';

describe('SceneTransitionHandler', () => {
    let handler;
    let eventSpy;

    beforeEach(() => {
        // Clear all listeners before each test
        gameEvents.clear();
        handler = new SceneTransitionHandler({ eventBus: gameEvents });
    });

    afterEach(() => {
        if (handler) {
            // Cleanup
        }
        gameEvents.clear();
    });

    describe('requestSceneTransition', () => {
        it('should emit GAME_WIN event for WinScene', (done) => {
            gameEvents.on('GAME_WIN', (data) => {
                expect(data).toBeDefined();
                expect(data.sceneKey).toBe('WinScene');
                expect(data.data).toEqual({ score: 100, level: 1 });
                expect(data.timestamp).toBeDefined();
                done();
            });

            handler.requestSceneTransition('WinScene', { score: 100, level: 1 });
        });

        it('should emit GAME_OVER event for GameOverScene', (done) => {
            gameEvents.on('GAME_OVER', (data) => {
                expect(data).toBeDefined();
                expect(data.sceneKey).toBe('GameOverScene');
                expect(data.data).toEqual({ score: 50 });
                done();
            });

            handler.requestSceneTransition('GameOverScene', { score: 50 });
        });

        it('should emit RETURN_TO_MENU event for MenuScene', (done) => {
            gameEvents.on('RETURN_TO_MENU', (data) => {
                expect(data).toBeDefined();
                expect(data.sceneKey).toBe('MenuScene');
                done();
            });

            handler.requestSceneTransition('MenuScene');
        });

        it('should emit PAUSE_GAME event for PauseScene', (done) => {
            gameEvents.on('PAUSE_GAME', (data) => {
                expect(data).toBeDefined();
                expect(data.sceneKey).toBe('PauseScene');
                done();
            });

            handler.requestSceneTransition('PauseScene');
        });

        it('should emit OPEN_SETTINGS event for SettingsScene', (done) => {
            gameEvents.on('OPEN_SETTINGS', (data) => {
                expect(data).toBeDefined();
                expect(data.sceneKey).toBe('SettingsScene');
                done();
            });

            handler.requestSceneTransition('SettingsScene');
        });

        it('should emit generic NAVIGATE_TO_* event for unknown scenes', (done) => {
            gameEvents.on('NAVIGATE_TO_CUSTOMSCENE', (data) => {
                expect(data).toBeDefined();
                expect(data.sceneKey).toBe('CustomScene');
                done();
            });

            handler.requestSceneTransition('CustomScene', { test: true });
        });

        it('should handle empty data object', (done) => {
            gameEvents.on('GAME_WIN', (data) => {
                expect(data).toBeDefined();
                expect(data.data).toEqual({});
                done();
            });

            handler.requestSceneTransition('WinScene');
        });

        it('should include timestamp in event data', (done) => {
            const beforeTime = Date.now();

            gameEvents.on('GAME_WIN', (data) => {
                expect(data.timestamp).toBeGreaterThanOrEqual(beforeTime);
                expect(data.timestamp).toBeLessThanOrEqual(Date.now());
                done();
            });

            handler.requestSceneTransition('WinScene');
        });
    });

    describe('requestPause', () => {
        it('should emit PAUSE_REQUESTED event', (done) => {
            gameEvents.on('PAUSE_REQUESTED', () => {
                done();
            });

            handler.requestPause();
        });
    });

    describe('requestResume', () => {
        it('should emit RESUME_REQUESTED event', (done) => {
            gameEvents.on('RESUME_REQUESTED', () => {
                done();
            });

            handler.requestResume();
        });
    });

    describe('requestRestart', () => {
        it('should emit RESTART_LEVEL_REQUESTED event', (done) => {
            gameEvents.on(GAME_EVENTS.RESTART_LEVEL_REQUESTED, () => {
                done();
            });

            handler.requestRestart();
        });
    });

    describe('requestReturnToMenu', () => {
        it('should emit RETURN_TO_MENU_REQUESTED event', (done) => {
            gameEvents.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
                done();
            });

            handler.requestReturnToMenu();
        });
    });

    describe('Event Data Structure', () => {
        it('should maintain consistent event data structure', (done) => {
            gameEvents.on('GAME_WIN', (data) => {
                expect(data).toHaveProperty('sceneKey');
                expect(data).toHaveProperty('data');
                expect(data).toHaveProperty('timestamp');
                expect(typeof data.sceneKey).toBe('string');
                expect(typeof data.data).toBe('object');
                expect(typeof data.timestamp).toBe('number');
                done();
            });

            handler.requestSceneTransition('WinScene', { score: 100 });
        });
    });

    describe('Multiple Listeners', () => {
        it('should notify all listeners', (done) => {
            let count = 0;
            const expectedCount = 3;

            const checkDone = () => {
                count++;
                if (count === expectedCount) {
                    done();
                }
            };

            gameEvents.on('GAME_WIN', checkDone);
            gameEvents.on('GAME_WIN', checkDone);
            gameEvents.on('GAME_WIN', checkDone);

            handler.requestSceneTransition('WinScene');
        });
    });

    describe('Error Handling', () => {
        it('should handle missing eventBus gracefully', () => {
            expect(() => {
                new SceneTransitionHandler({ eventBus: null });
            }).not.toThrow();
        });

        it('should handle missing data parameter', (done) => {
            gameEvents.on('GAME_WIN', (data) => {
                expect(data.data).toEqual({});
                done();
            });

            handler.requestSceneTransition('WinScene', undefined);
        });
    });
});
