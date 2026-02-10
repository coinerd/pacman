/**
 * Tests for AIInputAdapter and ScriptedAIAdapter
 */

import { AIInputAdapter, ScriptedAIAdapter } from '../../src/input/adapters/AIInputAdapter.js';
import { INPUT_TYPES } from '../../src/input/InputAdapter.js';
import { directions } from '../../src/config/gameConfig.js';

// Mock PacmanAI
jest.mock('../../src/systems/PacmanAI.js', () => ({
    PacmanAI: jest.fn().mockImplementation(() => ({
        enable: jest.fn(),
        disable: jest.fn(),
        getDirection: jest.fn(),
        lastDecisionGridX: -1,
        lastDecisionGridY: -1,
        lastDirection: null
    }))
}));

describe('AIInputAdapter', () => {
    let adapter;
    let mockGameModel;

    beforeEach(() => {
        mockGameModel = {
            pacman: { x: 100, y: 100, gridX: 5, gridY: 5 },
            maze: [],
            pelletGrid: [],
            ghosts: []
        };

        adapter = new AIInputAdapter();
    });

    afterEach(() => {
        if (adapter) {
            adapter.destroy();
        }
    });

    describe('constructor', () => {
        it('should set name to "ai"', () => {
            expect(adapter.name).toBe('ai');
        });

        it('should create PacmanAI instance if not provided', () => {
            expect(adapter.ai).toBeDefined();
        });

        it('should use provided AI instance', () => {
            const { PacmanAI } = require('../../src/systems/PacmanAI.js');
            const customAI = new PacmanAI();
            const customAdapter = new AIInputAdapter({ aiInstance: customAI });

            expect(customAdapter.ai).toBe(customAI);
            customAdapter.destroy();
        });

        it('should use default options', () => {
            expect(adapter.options.decisionInterval).toBe(100);
            expect(adapter.options.continuousMode).toBe(true);
        });

        it('should accept custom options', () => {
            const customAdapter = new AIInputAdapter({ decisionInterval: 200 });
            expect(customAdapter.options.decisionInterval).toBe(200);
            customAdapter.destroy();
        });
    });

    describe('setGameModel', () => {
        it('should store game model reference', () => {
            adapter.setGameModel(mockGameModel);
            expect(adapter.gameModel).toBe(mockGameModel);
        });

        it('should enable AI when connected', () => {
            adapter.setGameModel(mockGameModel);
            expect(adapter.ai.enable).toHaveBeenCalled();
        });
    });

    describe('disconnect', () => {
        it('should clear game model reference', () => {
            adapter.setGameModel(mockGameModel);
            adapter.disconnect();
            expect(adapter.gameModel).toBeNull();
        });

        it('should disable AI when disconnected', () => {
            adapter.setGameModel(mockGameModel);
            adapter.disconnect();
            expect(adapter.ai.disable).toHaveBeenCalled();
        });
    });

    describe('enable/disable', () => {
        it('should enable AI when adapter is enabled', () => {
            adapter.enable();
            expect(adapter.ai.enable).toHaveBeenCalled();
        });

        it('should disable AI when adapter is disabled', () => {
            adapter.enable();
            adapter.disable();
            expect(adapter.ai.disable).toHaveBeenCalled();
        });
    });

    describe('getCurrentInput', () => {
        beforeEach(() => {
            adapter.setGameModel(mockGameModel);
        });

        it('should return null when disabled', () => {
            adapter.disable();
            const input = adapter.getCurrentInput();
            expect(input).toBeNull();
        });

        it('should return null when no game model', () => {
            adapter.disconnect();
            const input = adapter.getCurrentInput();
            expect(input).toBeNull();
        });

        it('should return direction input from AI', () => {
            adapter.ai.getDirection.mockReturnValue(directions.RIGHT);

            const input = adapter.getCurrentInput();

            expect(input).toEqual({
                type: INPUT_TYPES.DIRECTION,
                value: directions.RIGHT
            });
        });

        it('should return null when AI returns same direction', () => {
            adapter.ai.getDirection.mockReturnValue(directions.RIGHT);

            adapter.getCurrentInput(); // First call
            const input = adapter.getCurrentInput(); // Second call with same direction

            expect(input).toBeNull();
        });

        it('should track decision count', () => {
            adapter.ai.getDirection.mockReturnValue(directions.RIGHT);

            adapter.getCurrentInput();

            expect(adapter.decisionCount).toBe(1);
        });
    });

    describe('update', () => {
        beforeEach(() => {
            adapter.setGameModel(mockGameModel);
        });

        it('should emit direction in continuous mode', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.ai.getDirection.mockReturnValue(directions.RIGHT);

            adapter.update(16);

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                type: INPUT_TYPES.DIRECTION,
                value: directions.RIGHT
            }));
        });

        it('should respect decision interval when not in continuous mode', () => {
            adapter.options.continuousMode = false;
            adapter.options.decisionInterval = 100;

            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.ai.getDirection.mockReturnValue(directions.RIGHT);

            adapter.update(50); // Not enough time
            expect(callback).not.toHaveBeenCalled();

            adapter.update(50); // Now 100ms total
            expect(callback).toHaveBeenCalled();
        });

        it('should not update when disabled', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.disable();

            adapter.update(16);

            expect(callback).not.toHaveBeenCalled();
        });

        it('should not update when no game model', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.disconnect();

            adapter.update(16);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('forceDecision', () => {
        beforeEach(() => {
            adapter.setGameModel(mockGameModel);
        });

        it('should force immediate AI decision', () => {
            adapter.ai.getDirection.mockReturnValue(directions.UP);

            const input = adapter.forceDecision();

            expect(input).toEqual({
                type: INPUT_TYPES.DIRECTION,
                value: directions.UP
            });
        });

        it('should emit input event', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.ai.getDirection.mockReturnValue(directions.UP);

            adapter.forceDecision();

            expect(callback).toHaveBeenCalled();
        });

        it('should reset decision timer', () => {
            adapter.options.continuousMode = false;
            adapter.lastDecisionTime = 50;

            adapter.forceDecision();

            expect(adapter.lastDecisionTime).toBe(0);
        });

        it('should return null when AI returns no direction', () => {
            adapter.ai.getDirection.mockReturnValue(null);

            const input = adapter.forceDecision();

            expect(input).toBeNull();
        });
    });

    describe('getStats', () => {
        it('should return AI statistics', () => {
            adapter.decisionCount = 10;
            adapter.lastDirection = directions.RIGHT;

            const stats = adapter.getStats();

            expect(stats.decisionCount).toBe(10);
            expect(stats.isEnabled).toBe(true);
            expect(stats.isConnected).toBe(false);
            expect(stats.lastDirection).toBe(directions.RIGHT);
        });

        it('should report connected when game model is set', () => {
            adapter.setGameModel(mockGameModel);

            const stats = adapter.getStats();

            expect(stats.isConnected).toBe(true);
        });
    });

    describe('reset', () => {
        it('should reset state', () => {
            adapter.lastDecisionTime = 100;
            adapter.lastDirection = directions.RIGHT;
            adapter.decisionCount = 5;

            adapter.reset();

            expect(adapter.lastDecisionTime).toBe(0);
            expect(adapter.lastDirection).toBeNull();
            expect(adapter.decisionCount).toBe(0);
        });

        it('should reset AI internal state', () => {
            adapter.ai.lastDecisionGridX = 5;
            adapter.ai.lastDecisionGridY = 5;
            adapter.ai.lastDirection = directions.RIGHT;

            adapter.reset();

            expect(adapter.ai.lastDecisionGridX).toBe(-1);
            expect(adapter.ai.lastDecisionGridY).toBe(-1);
            expect(adapter.ai.lastDirection).toBeNull();
        });
    });

    describe('destroy', () => {
        it('should disconnect from game model', () => {
            adapter.setGameModel(mockGameModel);
            adapter.destroy();

            expect(adapter.gameModel).toBeNull();
        });

        it('should clear AI reference', () => {
            adapter.destroy();
            expect(adapter.ai).toBeNull();
        });
    });
});

describe('ScriptedAIAdapter', () => {
    let adapter;
    const script = [
        { time: 0, direction: directions.RIGHT },
        { time: 100, direction: directions.UP },
        { time: 200, direction: directions.LEFT }
    ];

    beforeEach(() => {
        adapter = new ScriptedAIAdapter(script);
    });

    afterEach(() => {
        if (adapter) {
            adapter.destroy();
        }
    });

    describe('constructor', () => {
        it('should set name to "scripted_ai"', () => {
            expect(adapter.name).toBe('scripted_ai');
        });

        it('should store script', () => {
            expect(adapter.script).toEqual(script);
        });

        it('should use default loop option', () => {
            expect(adapter.options.loop).toBe(false);
        });
    });

    describe('playback', () => {
        it('should start script', () => {
            adapter.start();
            expect(adapter.isPlaying).toBe(true);
            expect(adapter.elapsedTime).toBe(0);
        });

        it('should stop script', () => {
            adapter.start();
            adapter.stop();
            expect(adapter.isPlaying).toBe(false);
        });

        it('should emit scripted inputs', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.start();

            adapter.update(50); // Should emit first event at t=0
            expect(callback).toHaveBeenCalledTimes(1);

            adapter.update(60); // t=110, should emit second event at t=100
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should emit direction inputs', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.start();

            adapter.update(0);

            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                type: INPUT_TYPES.DIRECTION,
                value: directions.RIGHT
            }));
        });

        it('should loop when configured', () => {
            const loopAdapter = new ScriptedAIAdapter(script, { loop: true });
            loopAdapter.start();

            loopAdapter.update(300); // Past all events

            expect(loopAdapter.currentIndex).toBe(0);
            expect(loopAdapter.isPlaying).toBe(true);

            loopAdapter.destroy();
        });

        it('should stop at end when not looping', () => {
            adapter.start();
            adapter.update(300);

            expect(adapter.isPlaying).toBe(false);
        });

        it('should not update when not playing', () => {
            const callback = jest.fn();
            adapter.onInput(callback);

            adapter.update(100);

            expect(callback).not.toHaveBeenCalled();
        });

        it('should not update when disabled', () => {
            const callback = jest.fn();
            adapter.onInput(callback);
            adapter.start();
            adapter.disable();

            adapter.update(100);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('should stop playback', () => {
            adapter.start();
            adapter.destroy();
            expect(adapter.isPlaying).toBe(false);
        });

        it('should clear script', () => {
            adapter.destroy();
            expect(adapter.script).toEqual([]);
        });
    });
});
