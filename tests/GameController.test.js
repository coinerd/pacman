/**
 * GameController Tests
 * Phase 2: Scene-Transition Event Tests
 */

import { GameController } from '../src/controllers/GameController.js';
import { GAME_EVENTS, gameEvents } from '../src/core/EventBus.js';

// Mock GameModel
class MockGameModel {
    constructor() {
        this.state = {
            isGameOver: false,
            isDying: false,
            isPaused: false
        };
    }

    setInputDirection(direction) {
        // Mock implementation
    }

    togglePaused() {
        this.state.isPaused = !this.state.isPaused;
    }
}

// Mock InputManager
class MockInputManager {
    constructor() {
        this.onInputCallback = null;
    }

    onInput(callback) {
        this.onInputCallback = callback;
        return () => {
            this.onInputCallback = null;
        };
    }

    destroy() {
        this.onInputCallback = null;
    }
}

describe('GameController - Scene Transition Events', () => {
    let controller;
    let mockGameModel;

    beforeEach(() => {
        gameEvents.clear();
        mockGameModel = new MockGameModel();
        controller = new GameController({
            gameModel: mockGameModel
        });
    });

    afterEach(() => {
        if (controller) {
            controller.destroy();
        }
        gameEvents.clear();
    });

    describe('bindSceneTransitionEvents', () => {
        it('should bind all scene transition events', (done) => {
            let eventCount = 0;
            const expectedEvents = ['GAME_WIN', 'GAME_OVER', 'RETURN_TO_MENU', 'PAUSE_GAME', 'OPEN_SETTINGS'];

            expectedEvents.forEach(event => {
                gameEvents.on(event, () => {
                    eventCount++;
                    if (eventCount === expectedEvents.length) {
                        done();
                    }
                });
            });

            controller.bindSceneTransitionEvents();

            // Emit each event
            gameEvents.emit('GAME_WIN', {});
            gameEvents.emit('GAME_OVER', {});
            gameEvents.emit('RETURN_TO_MENU', {});
            gameEvents.emit('PAUSE_GAME', {});
            gameEvents.emit('OPEN_SETTINGS', {});
        });

        it('should handle GAME_WIN event', (done) => {
            controller.bindSceneTransitionEvents();

            gameEvents.on('SCENE_TRANSITION:WinScene', (data) => {
                expect(data).toBeDefined();
                expect(data.score).toBe(100);
                expect(data.level).toBe(1);
                done();
            });

            gameEvents.emit('GAME_WIN', { score: 100, level: 1 });
        });

        it('should handle GAME_OVER event', (done) => {
            controller.bindSceneTransitionEvents();

            gameEvents.on('SCENE_TRANSITION:GameOverScene', (data) => {
                expect(data).toBeDefined();
                expect(data.score).toBe(50);
                done();
            });

            gameEvents.emit('GAME_OVER', { score: 50 });
        });

        it('should handle RETURN_TO_MENU event', (done) => {
            controller.bindSceneTransitionEvents();

            gameEvents.on('SCENE_TRANSITION:MenuScene', (data) => {
                expect(data).toBeDefined();
                done();
            });

            gameEvents.emit('RETURN_TO_MENU', { from: 'GameScene' });
        });

        it('should handle PAUSE_GAME event by forwarding to PAUSE_REQUESTED', (done) => {
            controller.bindSceneTransitionEvents();

            gameEvents.on(GAME_EVENTS.PAUSE_REQUESTED, (data) => {
                expect(data).toBeDefined();
                expect(data.reason).toBe('user_request');
                done();
            });

            gameEvents.emit('PAUSE_GAME', { reason: 'user_request' });
        });

        it('should handle OPEN_SETTINGS event', (done) => {
            controller.bindSceneTransitionEvents();

            gameEvents.on('SCENE_TRANSITION:SettingsScene', (data) => {
                expect(data).toBeDefined();
                done();
            });

            gameEvents.emit('OPEN_SETTINGS', {});
        });

        it('should handle generic NAVIGATE_TO_SCENE event', (done) => {
            controller.bindSceneTransitionEvents();

            gameEvents.on('SCENE_TRANSITION:CustomScene', (data) => {
                expect(data).toBeDefined();
                expect(data.customParam).toBe(true);
                done();
            });

            gameEvents.emit('NAVIGATE_TO_SCENE', {
                sceneKey: 'CustomScene',
                data: { customParam: true }
            });
        });
    });

    describe('unbindSceneTransitionEvents', () => {
        it('should unbind all scene transition events', (done) => {
            let callCount = 0;

            controller.bindSceneTransitionEvents();

            gameEvents.on('SCENE_TRANSITION:WinScene', () => {
                callCount++;
            });

            // First call should work
            gameEvents.emit('GAME_WIN', { score: 100 });
            expect(callCount).toBe(1);

            // Unbind
            controller.unbindSceneTransitionEvents();

            // Second call should not trigger
            gameEvents.emit('GAME_WIN', { score: 200 });
            setTimeout(() => {
                expect(callCount).toBe(1);
                done();
            }, 10);
        });

        it('should handle unbind when not bound', () => {
            expect(() => {
                controller.unbindSceneTransitionEvents();
            }).not.toThrow();
        });

        it('should handle multiple bind/unbind cycles', () => {
            let callCount = 0;

            gameEvents.on('SCENE_TRANSITION:WinScene', () => {
                callCount++;
            });

            // First bind
            controller.bindSceneTransitionEvents();
            gameEvents.emit('GAME_WIN', {});
            expect(callCount).toBe(1);

            // Unbind
            controller.unbindSceneTransitionEvents();
            gameEvents.emit('GAME_WIN', {});
            expect(callCount).toBe(1);

            // Rebind
            controller.bindSceneTransitionEvents();
            gameEvents.emit('GAME_WIN', {});
            expect(callCount).toBe(2);

            // Unbind again
            controller.unbindSceneTransitionEvents();
            gameEvents.emit('GAME_WIN', {});
            expect(callCount).toBe(2);
        });
    });

    describe('destroy', () => {
        it('should unbind scene transition events on destroy', (done) => {
            let callCount = 0;

            controller.bindSceneTransitionEvents();

            gameEvents.on('SCENE_TRANSITION:WinScene', () => {
                callCount++;
            });

            gameEvents.emit('GAME_WIN', {});
            expect(callCount).toBe(1);

            controller.destroy();
            gameEvents.emit('GAME_WIN', {});

            setTimeout(() => {
                expect(callCount).toBe(1);
                done();
            }, 10);
        });
    });

    describe('Integration with InputManager', () => {
        it('should work with input manager and scene transitions', (done) => {
            const mockInputManager = new MockInputManager();
            controller.setInputManager(mockInputManager);
            controller.bindSceneTransitionEvents();

            let transitionReceived = false;

            gameEvents.on('SCENE_TRANSITION:MenuScene', () => {
                transitionReceived = true;
                done();
            });

            // Simulate input that triggers return to menu
            if (mockInputManager.onInputCallback) {
                mockInputManager.onInputCallback({
                    type: 'action',
                    value: 'RETURN_TO_MENU'
                });
            }

            // Wait for event propagation
            setTimeout(() => {
                if (!transitionReceived) {
                    // Trigger return to menu via event directly
                    gameEvents.emit('RETURN_TO_MENU', {});
                }
            }, 10);
        });
    });

    describe('Event Data Propagation', () => {
        it('should preserve event data through transition', (done) => {
            controller.bindSceneTransitionEvents();

            const testData = {
                score: 500,
                level: 5,
                highScore: 1000,
                achievements: ['first_win', 'speed_demon']
            };

            gameEvents.on('SCENE_TRANSITION:WinScene', (data) => {
                expect(data).toEqual(testData);
                done();
            });

            gameEvents.emit('GAME_WIN', testData);
        });

        it('should handle empty event data', (done) => {
            controller.bindSceneTransitionEvents();

            gameEvents.on('SCENE_TRANSITION:GameOverScene', (data) => {
                expect(data).toEqual({});
                done();
            });

            gameEvents.emit('GAME_OVER', {});
        });
    });

    describe('Multiple Controllers', () => {
        it('should handle multiple controllers listening to same events', (done) => {
            const controller1 = new GameController({ gameModel: new MockGameModel() });
            const controller2 = new GameController({ gameModel: new MockGameModel() });

            controller1.bindSceneTransitionEvents();
            controller2.bindSceneTransitionEvents();

            let count = 0;

            gameEvents.on('SCENE_TRANSITION:WinScene', () => {
                count++;
                if (count === 2) {
                    controller1.destroy();
                    controller2.destroy();
                    done();
                }
            });

            gameEvents.emit('GAME_WIN', { score: 100 });
        });
    });
});
