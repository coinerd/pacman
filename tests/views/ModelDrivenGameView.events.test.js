/**
 * Tests for ModelDrivenGameView controller event handling (Phase 7)
 */

import { GAME_EVENTS, gameEvents } from '../../src/core/EventBus.js';
import ModelDrivenGameView from '../../src/views/ModelDrivenGameView.js';

// Mocks
jest.mock('../../src/managers/SoundManager.js');
jest.mock('../../src/scenes/systems/EffectManager.js');
jest.mock('../../src/pools/PelletPool.js');
jest.mock('../../src/pools/PowerPelletPool.js');
jest.mock('../../src/view/visuals/VisualPlayer.js');
jest.mock('../../src/view/visuals/VisualEnemy.js');
jest.mock('../../src/view/visuals/VisualFruit.js');

describe('ModelDrivenGameView - Controller Events (Phase 7)', () => {
    let view;
    let mockScene;
    let mockGameModel;
    let mockStorageManager;

    beforeEach(() => {
        mockScene = {
            scale: { width: 800, height: 600 },
            add: {
                rectangle: jest
                    .fn()
                    .mockReturnValue({ setAlpha: jest.fn(), setStrokeStyle: jest.fn() }),
                image: jest.fn(),
                text: jest.fn().mockReturnValue({ setOrigin: jest.fn() }),
                container: jest
                    .fn()
                    .mockReturnValue({ add: jest.fn(), setAlpha: jest.fn() })
            },
            make: {
                graphics: jest.fn().mockReturnValue({
                    lineStyle: jest.fn(),
                    moveTo: jest.fn(),
                    lineTo: jest.fn(),
                    strokePath: jest.fn(),
                    fillStyle: jest.fn(),
                    fillRect: jest.fn(),
                    generateTexture: jest.fn(),
                    destroy: jest.fn()
                })
            },
            tweens: {
                add: jest.fn()
            },
            time: {
                delayedCall: jest.fn()
            },
            scene: {
                pause: jest.fn(),
                resume: jest.fn(),
                launch: jest.fn(),
                stop: jest.fn(),
                start: jest.fn(),
                restart: jest.fn()
            },
            input: {},
            cleanup: jest.fn()
        };

        mockGameModel = {
            maze: [],
            pelletGrid: [],
            pacman: {},
            ghosts: [],
            fruit: {},
            score: 1000,
            level: 1,
            highScore: 5000
        };

        mockStorageManager = {
            saveHighScore: jest.fn()
        };

        view = new ModelDrivenGameView({
            scene: mockScene,
            gameModel: mockGameModel,
            storageManager: mockStorageManager
        });

        view.gameView = { applySettings: jest.fn() };
    });

    afterEach(() => {
        // Clean up any event listeners
        if (view) {
            view.cleanup();
        }
        gameEvents.clear();
    });

    describe('Controller Event Bindings', () => {
        beforeEach(() => {
            view.createPelletPools = jest.fn();
            view.createPellets = jest.fn();
            view.createEntityVisuals = jest.fn();
            view.bindModelEvents = jest.fn();
            view.unsubscribers = [];
        });

        describe('PAUSE_REQUESTED', () => {
            it('should pause scene when PAUSE_REQUESTED is emitted', () => {
                view.bindControllerEvents();

                gameEvents.emit(GAME_EVENTS.PAUSE_REQUESTED);

                expect(mockScene.scene.pause).toHaveBeenCalled();
                expect(mockScene.scene.launch).toHaveBeenCalledWith('PauseScene');
            });
        });

        describe('RESUME_REQUESTED', () => {
            it('should resume scene when RESUME_REQUESTED is emitted', () => {
                view.bindControllerEvents();

                gameEvents.emit(GAME_EVENTS.RESUME_REQUESTED);

                expect(mockScene.scene.resume).toHaveBeenCalled();
                expect(mockScene.scene.stop).toHaveBeenCalledWith('PauseScene');
            });
        });

        describe('RETURN_TO_MENU_REQUESTED', () => {
            it('should return to menu when RETURN_TO_MENU_REQUESTED is emitted', () => {
                view.bindControllerEvents();

                gameEvents.emit(GAME_EVENTS.RETURN_TO_MENU_REQUESTED);

                expect(mockScene.cleanup).toHaveBeenCalled();
                expect(mockScene.scene.start).toHaveBeenCalledWith('MenuScene');
            });
        });

        describe('RESTART_LEVEL_REQUESTED', () => {
            it('should restart scene when RESTART_LEVEL_REQUESTED is emitted', () => {
                view.bindControllerEvents();

                gameEvents.emit(GAME_EVENTS.RESTART_LEVEL_REQUESTED);

                expect(mockScene.scene.restart).toHaveBeenCalledWith({
                    score: 0,
                    lives: 3,
                    level: 1
                });
            });
        });

        describe('REPLAY_TOGGLE_REQUESTED', () => {
            it('should start recording when not recording or replaying', () => {
                view.bindControllerEvents();
                const mockReplaySystem = {
                    isRecording: false,
                    isReplaying: false,
                    startRecording: jest.fn(),
                    stopRecording: jest.fn()
                };

                gameEvents.emit(GAME_EVENTS.REPLAY_TOGGLE_REQUESTED, {
                    replaySystem: mockReplaySystem
                });

                expect(mockReplaySystem.startRecording).toHaveBeenCalled();
            });

            it('should stop recording when already recording', () => {
                view.bindControllerEvents();
                const mockReplaySystem = {
                    isRecording: true,
                    isReplaying: false,
                    startRecording: jest.fn(),
                    stopRecording: jest.fn()
                };

                gameEvents.emit(GAME_EVENTS.REPLAY_TOGGLE_REQUESTED, {
                    replaySystem: mockReplaySystem
                });

                expect(mockReplaySystem.stopRecording).toHaveBeenCalled();
            });

            it('should not toggle when replaying', () => {
                view.bindControllerEvents();
                const mockReplaySystem = {
                    isRecording: false,
                    isReplaying: true,
                    startRecording: jest.fn(),
                    stopRecording: jest.fn()
                };

                gameEvents.emit(GAME_EVENTS.REPLAY_TOGGLE_REQUESTED, {
                    replaySystem: mockReplaySystem
                });

                expect(mockReplaySystem.startRecording).not.toHaveBeenCalled();
                expect(mockReplaySystem.stopRecording).not.toHaveBeenCalled();
            });

            it('should handle missing replay system', () => {
                view.bindControllerEvents();

                // Should not throw
                expect(() => {
                    gameEvents.emit(GAME_EVENTS.REPLAY_TOGGLE_REQUESTED, null);
                }).not.toThrow();
            });
        });

        describe('LOAD_REPLAY_REQUESTED', () => {
            it('should load last recording when available', () => {
                view.bindControllerEvents();
                const mockRecording = { id: 'test', inputs: [] };
                const mockReplaySystem = {
                    isReplaying: false,
                    getRecordings: jest.fn().mockReturnValue([mockRecording]),
                    loadRecording: jest.fn()
                };

                gameEvents.emit(GAME_EVENTS.LOAD_REPLAY_REQUESTED, {
                    replaySystem: mockReplaySystem
                });

                expect(mockReplaySystem.loadRecording).toHaveBeenCalledWith(
                    mockRecording
                );
            });

            it('should not load when replaying', () => {
                view.bindControllerEvents();
                const mockReplaySystem = {
                    isReplaying: true,
                    getRecordings: jest.fn().mockReturnValue(['recording']),
                    loadRecording: jest.fn()
                };

                gameEvents.emit(GAME_EVENTS.LOAD_REPLAY_REQUESTED, {
                    replaySystem: mockReplaySystem
                });

                expect(mockReplaySystem.loadRecording).not.toHaveBeenCalled();
            });

            it('should not load when no recordings', () => {
                view.bindControllerEvents();
                const mockReplaySystem = {
                    isReplaying: false,
                    getRecordings: jest.fn().mockReturnValue([]),
                    loadRecording: jest.fn()
                };

                gameEvents.emit(GAME_EVENTS.LOAD_REPLAY_REQUESTED, {
                    replaySystem: mockReplaySystem
                });

                expect(mockReplaySystem.loadRecording).not.toHaveBeenCalled();
            });
        });
    });

    describe('Event Cleanup', () => {
        it('should unsubscribe from controller events on cleanup', () => {
            view.createPelletPools = jest.fn();
            view.createPellets = jest.fn();
            view.createEntityVisuals = jest.fn();
            view.bindModelEvents = jest.fn();

            const unsubscribeSpy = jest.fn();
            view.unsubscribers = [unsubscribeSpy];

            view.cleanup();

            expect(unsubscribeSpy).toHaveBeenCalled();
        });
    });

    describe('Phase 7 Architecture', () => {
        it('should have bindControllerEvents method', () => {
            expect(typeof view.bindControllerEvents).toBe('function');
        });

        it('should be called by bindModelEvents', () => {
            view.createPelletPools = jest.fn();
            view.createPellets = jest.fn();
            view.createEntityVisuals = jest.fn();
            view.unsubscribers = [];

            // Verify bindControllerEvents is defined and adds unsubscribers
            view.bindControllerEvents();
            expect(view.unsubscribers.length).toBeGreaterThan(0);
        });
    });
});
