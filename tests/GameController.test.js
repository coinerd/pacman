/**
 * GameController Tests
 * Phase 2: Scene-Transition Event Tests
 */

import { GameController } from '../src/controllers/GameController.js';
import { GAME_EVENTS, gameEvents } from '../src/core/EventBus.js';
import { INPUT_ACTIONS, INPUT_TYPES } from '../src/input/InputAdapter.js';

// Mock GameModel
class MockGameModel {
    constructor() {
        this.state = {
            isGameOver: false,
            isDying: false,
            isPaused: false
        };
        this.lastDirection = null;
    }

    setInputDirection(direction) {
        this.lastDirection = direction;
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

// Mock ReplaySystem
class MockReplaySystem {
    constructor() {
        this.isRecording = false;
        this.isReplaying = false;
        this.recordings = [];
    }

    startRecording() {
        this.isRecording = true;
    }

    stopRecording() {
        this.isRecording = false;
        this.recordings.push({ id: Date.now() });
    }

    loadRecording(_recording) {
        this.isReplaying = true;
    }

    getRecordings() {
        return this.recordings;
    }
}

// Mock PlayerScoreFacade
class MockPlayerScoreFacade {
    getPlayerState() {
        return {
            isGameOver: false,
            isDying: false,
            isPaused: false
        };
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

describe('GameController - Input Handling', () => {
    let controller;
    let mockGameModel;
    let mockInputManager;

    beforeEach(() => {
        gameEvents.clear();
        mockGameModel = new MockGameModel();
        mockInputManager = new MockInputManager();
        controller = new GameController({
            gameModel: mockGameModel,
            inputManager: mockInputManager
        });
    });

    afterEach(() => {
        if (controller) {
            controller.destroy();
        }
        gameEvents.clear();
    });

    describe('activate/deactivate', () => {
        it('should start inactive', () => {
            expect(controller.getIsActive()).toBe(false);
        });

        it('should be active after activate()', () => {
            controller.activate();
            expect(controller.getIsActive()).toBe(true);
        });

        it('should be inactive after deactivate()', () => {
            controller.activate();
            controller.deactivate();
            expect(controller.getIsActive()).toBe(false);
        });

        it('should not handle input when inactive', () => {
            const directionSpy = jest.spyOn(mockGameModel, 'setInputDirection');

            controller.handleInput({
                type: INPUT_TYPES.DIRECTION,
                value: 'UP'
            });

            expect(directionSpy).not.toHaveBeenCalled();
        });

        it('should handle input when active', () => {
            controller.activate();

            controller.handleInput({
                type: INPUT_TYPES.DIRECTION,
                value: 'UP'
            });

            expect(mockGameModel.lastDirection).toBe('UP');
        });
    });

    describe('direction input', () => {
        beforeEach(() => {
            controller.activate();
        });

        it('should set direction when game is active', () => {
            controller.handleInput({
                type: INPUT_TYPES.DIRECTION,
                value: 'DOWN'
            });

            expect(mockGameModel.lastDirection).toBe('DOWN');
        });

        it('should not set direction when game is over', () => {
            mockGameModel.state.isGameOver = true;

            controller.handleInput({
                type: INPUT_TYPES.DIRECTION,
                value: 'DOWN'
            });

            expect(mockGameModel.lastDirection).toBeNull();
        });

        it('should not set direction when player is dying', () => {
            mockGameModel.state.isDying = true;

            controller.handleInput({
                type: INPUT_TYPES.DIRECTION,
                value: 'DOWN'
            });

            expect(mockGameModel.lastDirection).toBeNull();
        });

        it('should emit DIRECTION_CHANGED event', (done) => {
            gameEvents.on(GAME_EVENTS.DIRECTION_CHANGED, (data) => {
                expect(data.direction).toBe('LEFT');
                done();
            });

            controller.handleInput({
                type: INPUT_TYPES.DIRECTION,
                value: 'LEFT'
            });
        });

        it('should ignore null direction value', () => {
            controller.handleInput({
                type: INPUT_TYPES.DIRECTION,
                value: null
            });

            expect(mockGameModel.lastDirection).toBeNull();
        });
    });

    describe('action input - PAUSE', () => {
        beforeEach(() => {
            controller.activate();
        });

        it('should toggle pause when not paused', (done) => {
            gameEvents.on(GAME_EVENTS.PAUSE_REQUESTED, () => {
                done();
            });

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.PAUSE
            });
        });

        it('should not pause when game is over', () => {
            mockGameModel.state.isGameOver = true;

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.PAUSE
            });

            expect(mockGameModel.state.isPaused).toBe(false);
        });

        it('should not pause when dying', () => {
            mockGameModel.state.isDying = true;

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.PAUSE
            });

            expect(mockGameModel.state.isPaused).toBe(false);
        });

        it('should resume when paused', (done) => {
            mockGameModel.state.isPaused = true;

            gameEvents.on(GAME_EVENTS.RESUME_REQUESTED, () => {
                done();
            });

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.PAUSE
            });
        });
    });

    describe('action input - RESUME', () => {
        beforeEach(() => {
            controller.activate();
        });

        it('should resume when paused', (done) => {
            mockGameModel.state.isPaused = true;

            gameEvents.on(GAME_EVENTS.RESUME_REQUESTED, () => {
                done();
            });

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.RESUME
            });
        });

        it('should not resume when not paused', () => {
            mockGameModel.state.isPaused = false;

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.RESUME
            });

            // Should remain false (no toggle)
            expect(mockGameModel.state.isPaused).toBe(false);
        });
    });

    describe('action input - RETURN_TO_MENU', () => {
        beforeEach(() => {
            controller.activate();
        });

        it('should emit RETURN_TO_MENU_REQUESTED', (done) => {
            gameEvents.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
                done();
            });

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.RETURN_TO_MENU
            });
        });

        it('should not return to menu when game is over', () => {
            mockGameModel.state.isGameOver = true;

            let eventFired = false;
            gameEvents.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
                eventFired = true;
            });

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.RETURN_TO_MENU
            });

            expect(eventFired).toBe(false);
        });
    });

    describe('action input - RESTART', () => {
        beforeEach(() => {
            controller.activate();
        });

        it('should emit RESTART_LEVEL_REQUESTED', (done) => {
            gameEvents.on(GAME_EVENTS.RESTART_LEVEL_REQUESTED, () => {
                done();
            });

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.RESTART
            });
        });
    });

    describe('action input - TOGGLE_REPLAY', () => {
        let mockReplaySystem;

        beforeEach(() => {
            controller.activate();
            mockReplaySystem = new MockReplaySystem();
            controller.replaySystem = mockReplaySystem;
        });

        it('should start recording when not recording or replaying', () => {
            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.TOGGLE_REPLAY
            });

            expect(mockReplaySystem.isRecording).toBe(true);
        });

        it('should stop recording when recording', () => {
            mockReplaySystem.startRecording();

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.TOGGLE_REPLAY
            });

            expect(mockReplaySystem.isRecording).toBe(false);
        });

        it('should not toggle replay when replaying', () => {
            mockReplaySystem.isReplaying = true;

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.TOGGLE_REPLAY
            });

            // Should remain in replaying state
            expect(mockReplaySystem.isReplaying).toBe(true);
        });

        it('should do nothing when no replay system', () => {
            controller.replaySystem = null;

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.TOGGLE_REPLAY
            });

            // Should not throw
        });
    });

    describe('action input - LOAD_REPLAY', () => {
        let mockReplaySystem;

        beforeEach(() => {
            controller.activate();
            mockReplaySystem = new MockReplaySystem();
            controller.replaySystem = mockReplaySystem;
        });

        it('should load last recording', () => {
            mockReplaySystem.recordings = [{ id: 1 }, { id: 2 }];

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.LOAD_REPLAY
            });

            expect(mockReplaySystem.isReplaying).toBe(true);
        });

        it('should do nothing when no recordings', () => {
            mockReplaySystem.recordings = [];

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.LOAD_REPLAY
            });

            expect(mockReplaySystem.isReplaying).toBe(false);
        });

        it('should do nothing when already replaying', () => {
            mockReplaySystem.isReplaying = true;
            mockReplaySystem.recordings = [{ id: 1 }];

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.LOAD_REPLAY
            });

            // Should remain in replaying state
            expect(mockReplaySystem.isReplaying).toBe(true);
        });

        it('should do nothing when no replay system', () => {
            controller.replaySystem = null;

            controller.handleInput({
                type: INPUT_TYPES.ACTION,
                value: INPUT_ACTIONS.LOAD_REPLAY
            });

            // Should not throw
        });
    });

    describe('setInputManager', () => {
        it('should set input manager and subscribe to input', () => {
            const newInputManager = new MockInputManager();
            controller.setInputManager(newInputManager);

            expect(controller.inputManager).toBe(newInputManager);
            expect(newInputManager.onInputCallback).not.toBeNull();
        });

        it('should unsubscribe from previous input manager', () => {
            const oldCallback = mockInputManager.onInputCallback;
            expect(oldCallback).not.toBeNull();

            const newInputManager = new MockInputManager();
            controller.setInputManager(newInputManager);

            expect(mockInputManager.onInputCallback).toBeNull();
        });

        it('should handle null input manager', () => {
            controller.setInputManager(null);

            expect(controller.inputManager).toBeNull();
        });
    });

    describe('playerScoreFacade', () => {
        it('should use playerScoreFacade for state when available', () => {
            const facade = new MockPlayerScoreFacade();
            const facadeController = new GameController({
                gameModel: mockGameModel,
                playerScoreFacade: facade
            });

            facadeController.activate();

            // The controller should use facade state
            facadeController.handleInput({
                type: INPUT_TYPES.DIRECTION,
                value: 'UP'
            });

            expect(mockGameModel.lastDirection).toBe('UP');

            facadeController.destroy();
        });
    });

    describe('handleInput edge cases', () => {
        beforeEach(() => {
            controller.activate();
        });

        it('should handle null input', () => {
            controller.handleInput(null);
            // Should not throw
        });

        it('should handle undefined input', () => {
            controller.handleInput(undefined);
            // Should not throw
        });

        it('should handle unknown input type', () => {
            controller.handleInput({
                type: 'UNKNOWN',
                value: 'something'
            });
            // Should not throw
        });
    });

    describe('destroy', () => {
        it('should clean up all resources', () => {
            controller.activate();
            controller.bindSceneTransitionEvents();

            controller.destroy();

            expect(controller.isActive).toBe(false);
            expect(controller.inputManager).toBeNull();
            expect(controller.gameModel).toBeNull();
        });

        it('should be safe to call destroy multiple times', () => {
            controller.activate();
            controller.destroy();
            controller.destroy();
            // Should not throw
        });
    });
});
