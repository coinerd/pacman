/**
 * Tests for ReplayAdapter and ReplayRecorder
 */

import { ReplayAdapter, ReplayRecorder } from '../../src/input/adapters/ReplayAdapter.js';
import { INPUT_TYPES } from '../../src/input/InputAdapter.js';
import { directions } from '../../src/config/gameConfig.js';

describe('ReplayAdapter', () => {
    let adapter;
    const sampleReplayData = [
        { time: 0, input: { type: INPUT_TYPES.DIRECTION, value: directions.RIGHT } },
        { time: 500, input: { type: INPUT_TYPES.DIRECTION, value: directions.UP } },
        { time: 1000, input: { type: INPUT_TYPES.DIRECTION, value: directions.LEFT } },
        { time: 1500, input: { type: INPUT_TYPES.DIRECTION, value: directions.DOWN } }
    ];

    beforeEach(() => {
        jest.useFakeTimers();
        adapter = new ReplayAdapter(sampleReplayData, { autoStart: false });
    });

    afterEach(() => {
        jest.useRealTimers();
        if (adapter) {
            adapter.destroy();
        }
    });

    describe('constructor', () => {
        it('should set name to "replay"', () => {
            expect(adapter.name).toBe('replay');
        });

        it('should store replay data', () => {
            expect(adapter.replayData).toEqual(sampleReplayData);
        });

        it('should use default options', () => {
            expect(adapter.options.loop).toBe(false);
            expect(adapter.options.speed).toBe(1.0);
            expect(adapter.options.autoStart).toBe(false);
        });

        it('should auto-start when configured', () => {
            const autoAdapter = new ReplayAdapter(sampleReplayData, { autoStart: true });
            expect(autoAdapter.isPlaying).toBe(true);
            autoAdapter.destroy();
        });

        it('should initialize with zero index and time', () => {
            expect(adapter.currentIndex).toBe(0);
            expect(adapter.elapsedTime).toBe(0);
        });
    });

    describe('playback control', () => {
        it('should start playback', () => {
            adapter.start();
            expect(adapter.isPlaying).toBe(true);
            expect(adapter.isPaused).toBe(false);
        });

        it('should pause playback', () => {
            adapter.start();
            adapter.pause();
            expect(adapter.isPaused).toBe(true);
        });

        it('should resume playback', () => {
            adapter.start();
            adapter.pause();
            adapter.resume();
            expect(adapter.isPaused).toBe(false);
        });

        it('should stop playback and reset', () => {
            adapter.start();
            adapter.update(1000);
            adapter.stop();

            expect(adapter.isPlaying).toBe(false);
            expect(adapter.currentIndex).toBe(0);
            expect(adapter.elapsedTime).toBe(0);
        });

        it('should not resume if not playing', () => {
            adapter.resume();
            expect(adapter.isPaused).toBe(false);
            expect(adapter.isPlaying).toBe(false);
        });
    });

    describe('seek', () => {
        it('should seek to specific time', () => {
            adapter.seek(750);
            expect(adapter.elapsedTime).toBe(750);
            expect(adapter.currentIndex).toBe(2); // Should be at third event
        });

        it('should not allow negative time', () => {
            adapter.seek(-100);
            expect(adapter.elapsedTime).toBe(0);
        });
    });

    describe('update', () => {
        it('should emit inputs at correct times', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.start();

            adapter.update(100); // t=100
            expect(callback).toHaveBeenCalledTimes(1); // First event at t=0

            adapter.update(450); // t=550
            expect(callback).toHaveBeenCalledTimes(2); // Second event at t=500
        });

        it('should respect playback speed', () => {
            const speedAdapter = new ReplayAdapter(sampleReplayData, {
                autoStart: false,
                speed: 2.0
            });

            const callback = jest.fn();
            speedAdapter.onInput(callback);
            speedAdapter.start();

            // At 2x speed, 250ms real time = 500ms replay time
            speedAdapter.update(250);
            expect(callback).toHaveBeenCalledTimes(2); // Events at t=0 and t=500

            speedAdapter.destroy();
        });

        it('should not update when not playing', () => {
            const callback = jest.fn();
            adapter.onInput(callback);

            adapter.update(1000);
            expect(callback).not.toHaveBeenCalled();
        });

        it('should not update when paused', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.start();
            adapter.pause();

            adapter.update(1000);
            expect(callback).not.toHaveBeenCalled();
        });

        it('should emit completion event when finished', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.start();

            adapter.update(2000); // Past all events

            expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({
                type: INPUT_TYPES.ACTION,
                value: 'replay_complete'
            }));
        });

        it('should loop when configured', () => {
            const loopAdapter = new ReplayAdapter(sampleReplayData, {
                autoStart: false,
                loop: true
            });

            loopAdapter.start();
            loopAdapter.update(2000); // Complete first loop

            expect(loopAdapter.currentIndex).toBe(0);
            expect(loopAdapter.elapsedTime).toBe(0);
            expect(loopAdapter.isPlaying).toBe(true);

            loopAdapter.destroy();
        });
    });

    describe('getProgress', () => {
        it('should return progress information', () => {
            adapter.start();
            adapter.update(750);

            const progress = adapter.getProgress();
            expect(progress.current).toBe(750);
            expect(progress.total).toBe(1500);
            expect(progress.percentage).toBe(50);
            expect(progress.frame).toBe(2);
            expect(progress.totalFrames).toBe(4);
        });

        it('should return 100% for empty replay', () => {
            const emptyAdapter = new ReplayAdapter([]);
            const progress = emptyAdapter.getProgress();
            expect(progress.percentage).toBe(100);
            emptyAdapter.destroy();
        });
    });

    describe('getIsPlaying', () => {
        it('should return true when playing', () => {
            adapter.start();
            expect(adapter.getIsPlaying()).toBe(true);
        });

        it('should return false when paused', () => {
            adapter.start();
            adapter.pause();
            expect(adapter.getIsPlaying()).toBe(false);
        });

        it('should return false when stopped', () => {
            expect(adapter.getIsPlaying()).toBe(false);
        });
    });

    describe('loadReplay', () => {
        it('should load new replay data', () => {
            const newData = [
                { time: 0, input: { type: INPUT_TYPES.DIRECTION, value: directions.UP } }
            ];

            adapter.loadReplay(newData, false);

            expect(adapter.replayData).toEqual(newData);
            expect(adapter.isPlaying).toBe(false);
        });

        it('should auto-start when configured', () => {
            const newData = [
                { time: 0, input: { type: INPUT_TYPES.DIRECTION, value: directions.UP } }
            ];

            adapter.loadReplay(newData, true);

            expect(adapter.isPlaying).toBe(true);
        });
    });

    describe('serialization', () => {
        it('should serialize replay to JSON', () => {
            const json = adapter.serialize();
            const parsed = JSON.parse(json);

            expect(parsed.version).toBe('1.0');
            expect(parsed.frames).toEqual(sampleReplayData);
            expect(parsed.created).toBeDefined();
        });

        it('should deserialize replay from JSON', () => {
            const json = adapter.serialize();
            const result = adapter.deserialize(json);

            expect(result).toBe(true);
            expect(adapter.replayData).toEqual(sampleReplayData);
        });

        it('should return false for invalid JSON', () => {
            const result = adapter.deserialize('invalid json');
            expect(result).toBe(false);
        });

        it('should return false for JSON without frames', () => {
            const result = adapter.deserialize('{"version": "1.0"}');
            expect(result).toBe(false);
        });
    });

    describe('destroy', () => {
        it('should stop playback', () => {
            adapter.start();
            adapter.destroy();
            expect(adapter.isPlaying).toBe(false);
        });

        it('should clear replay data', () => {
            adapter.destroy();
            expect(adapter.replayData).toEqual([]);
        });
    });
});

describe('ReplayRecorder', () => {
    let recorder;

    beforeEach(() => {
        jest.useFakeTimers();
        recorder = new ReplayRecorder();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('recording', () => {
        it('should start recording', () => {
            recorder.start();
            expect(recorder.isRecording).toBe(true);
            expect(recorder.frames).toEqual([]);
        });

        it('should stop recording', () => {
            recorder.start();
            recorder.stop();
            expect(recorder.isRecording).toBe(false);
        });

        it('should record input events with timestamps', () => {
            jest.setSystemTime(1000);
            recorder.start();

            jest.advanceTimersByTime(100);
            recorder.record({ type: INPUT_TYPES.DIRECTION, value: directions.RIGHT });

            expect(recorder.frames).toHaveLength(1);
            expect(recorder.frames[0].time).toBe(100);
            expect(recorder.frames[0].input.type).toBe(INPUT_TYPES.DIRECTION);
        });

        it('should not record when not recording', () => {
            recorder.record({ type: INPUT_TYPES.DIRECTION, value: directions.RIGHT });
            expect(recorder.frames).toHaveLength(0);
        });

        it('should record multiple events', () => {
            recorder.start();

            recorder.record({ type: INPUT_TYPES.DIRECTION, value: directions.RIGHT });
            jest.advanceTimersByTime(100);
            recorder.record({ type: INPUT_TYPES.DIRECTION, value: directions.UP });

            expect(recorder.frames).toHaveLength(2);
        });
    });

    describe('data access', () => {
        it('should return copy of replay data', () => {
            recorder.start();
            recorder.record({ type: INPUT_TYPES.DIRECTION, value: directions.RIGHT });

            const data = recorder.getReplayData();
            data.push({ time: 999, input: {} }); // Modify returned array

            expect(recorder.frames).toHaveLength(1); // Original unchanged
        });
    });

    describe('export', () => {
        it('should export to JSON format', () => {
            recorder.start({ player: 'test' });
            recorder.record({ type: INPUT_TYPES.DIRECTION, value: directions.RIGHT });

            const json = recorder.export();
            const parsed = JSON.parse(json);

            expect(parsed.version).toBe('1.0');
            expect(parsed.metadata).toEqual({ player: 'test' });
            expect(parsed.frames).toHaveLength(1);
        });
    });

    describe('clear', () => {
        it('should clear all recorded data', () => {
            recorder.start();
            recorder.record({ type: INPUT_TYPES.DIRECTION, value: directions.RIGHT });
            recorder.clear();

            expect(recorder.frames).toHaveLength(0);
            expect(recorder.isRecording).toBe(false);
        });
    });
});
