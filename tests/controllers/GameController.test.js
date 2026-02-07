import { GameController } from '../../src/controllers/GameController.js';
import { gameEvents, GAME_EVENTS } from '../../src/core/EventBus.js';

describe('GameController', () => {
    let mockScene;
    let mockGameModel;
    let mockReplaySystem;
    let controller;

    beforeEach(() => {
        mockScene = {
            cleanup: jest.fn(),
            scene: {
                pause: jest.fn(),
                launch: jest.fn(),
                start: jest.fn()
            }
        };

        mockGameModel = {
            state: {
                isDying: false,
                isGameOver: false
            },
            setDesiredDirection: jest.fn(),
            togglePaused: jest.fn()
        };

        mockReplaySystem = {
            isRecording: false,
            isReplaying: false,
            startRecording: jest.fn(),
            stopRecording: jest.fn(),
            getRecordings: jest.fn().mockReturnValue([]),
            loadRecording: jest.fn()
        };

        controller = new GameController({
            scene: mockScene,
            gameModel: mockGameModel,
            replaySystem: mockReplaySystem
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('maps directional input from keys/touch to model intent', () => {
        const direction = { x: 1, y: 0 };
        const emitSpy = jest.spyOn(gameEvents, 'emit');

        controller.handleInput({
            direction,
            pause: false,
            replayToggle: false,
            returnToMenu: false,
            loadReplay: false
        });

        expect(mockGameModel.setDesiredDirection).toHaveBeenCalledWith(direction);
        expect(emitSpy).toHaveBeenCalledWith(GAME_EVENTS.DIRECTION_CHANGED, { direction });
    });

    test('ignores directional input while dying', () => {
        mockGameModel.state.isDying = true;
        const emitSpy = jest.spyOn(gameEvents, 'emit');

        controller.handleInput({
            direction: { x: 0, y: -1 },
            pause: false,
            replayToggle: false,
            returnToMenu: false,
            loadReplay: false
        });

        expect(mockGameModel.setDesiredDirection).not.toHaveBeenCalled();
        expect(emitSpy).not.toHaveBeenCalled();
    });

    test('pause action toggles and opens pause scene', () => {
        mockGameModel.togglePaused.mockReturnValue(true);

        controller.handleInput({ pause: true });

        expect(mockGameModel.togglePaused).toHaveBeenCalled();
        expect(mockScene.scene.pause).toHaveBeenCalled();
        expect(mockScene.scene.launch).toHaveBeenCalledWith('PauseScene');
    });

    test('resume action does not relaunch pause scene', () => {
        mockGameModel.togglePaused.mockReturnValue(false);

        controller.handleInput({ pause: true });

        expect(mockGameModel.togglePaused).toHaveBeenCalled();
        expect(mockScene.scene.pause).not.toHaveBeenCalled();
        expect(mockScene.scene.launch).not.toHaveBeenCalled();
    });

    test('replay toggle stops recording when already recording', () => {
        mockReplaySystem.isRecording = true;

        controller.handleInput({ replayToggle: true });

        expect(mockReplaySystem.stopRecording).toHaveBeenCalled();
        expect(mockReplaySystem.startRecording).not.toHaveBeenCalled();
    });

    test('replay toggle starts recording when idle', () => {
        mockReplaySystem.isRecording = false;
        mockReplaySystem.isReplaying = false;

        controller.handleInput({ replayToggle: true });

        expect(mockReplaySystem.startRecording).toHaveBeenCalled();
        expect(mockReplaySystem.stopRecording).not.toHaveBeenCalled();
    });

    test('replay toggle does nothing during playback', () => {
        mockReplaySystem.isRecording = false;
        mockReplaySystem.isReplaying = true;

        controller.handleInput({ replayToggle: true });

        expect(mockReplaySystem.startRecording).not.toHaveBeenCalled();
        expect(mockReplaySystem.stopRecording).not.toHaveBeenCalled();
    });

    test('load replay uses latest recording when available', () => {
        const recordingA = { id: 'a' };
        const recordingB = { id: 'b' };
        mockReplaySystem.getRecordings.mockReturnValue([recordingA, recordingB]);

        controller.handleInput({ loadReplay: true });

        expect(mockReplaySystem.loadRecording).toHaveBeenCalledWith(recordingB);
    });
});
