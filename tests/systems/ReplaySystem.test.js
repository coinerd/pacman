import { ReplaySystem } from '../../src/systems/ReplaySystem.js';
import { gameEvents } from '../../src/core/EventBus.js';

jest.mock('../../src/core/EventBus.js', () => ({
  ...jest.requireActual('../../src/core/EventBus.js'),
  gameEvents: {
    emit: jest.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  store: {},
  getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  }),
  key: jest.fn((index) => {
    const keys = Object.keys(mockLocalStorage.store);
    return keys[index] || null;
  })
};

// Make Object.keys work on mockLocalStorage
Object.defineProperty(mockLocalStorage, 'length', {
  get: () => Object.keys(mockLocalStorage.store).length
});

// Proxy to make Object.keys work correctly
const localStorageProxy = new Proxy(mockLocalStorage, {
  ownKeys: () => Object.keys(mockLocalStorage.store),
  getOwnPropertyDescriptor: (target, prop) => {
    if (prop in mockLocalStorage.store) {
      return { enumerable: true, configurable: true, value: mockLocalStorage.store[prop] };
    }
    return Object.getOwnPropertyDescriptor(target, prop);
  }
});

global.localStorage = localStorageProxy;

describe('ReplaySystem', () => {
  let system;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.store = {};
    system = new ReplaySystem(mockLocalStorage);
  });

  afterEach(() => {
    if (system) {
      system.cleanup();
    }
  });

  describe('initialization', () => {
    test('should initialize with recording set to false', () => {
      expect(system.isRecording).toBe(false);
    });

    test('should initialize with replaying set to false', () => {
      expect(system.isReplaying).toBe(false);
    });

    test('should initialize with empty recording object', () => {
      expect(system.recording).toBeDefined();
      expect(system.recording.inputs).toEqual([]);
      expect(system.recording.score).toBe(0);
      expect(system.recording.level).toBe(1);
    });

    test('should initialize with null playback', () => {
      expect(system.playback).toBeNull();
    });

    test('should initialize with current index at 0', () => {
      expect(system.currentIndex).toBe(0);
    });
  });

  describe('startRecording', () => {
    test('should set isRecording to true', () => {
      system.startRecording();

      expect(system.isRecording).toBe(true);
    });

    test('should set isReplaying to false', () => {
      system.isReplaying = true;
      system.startRecording();

      expect(system.isReplaying).toBe(false);
    });

    test('should reset recording data', () => {
      system.recording.inputs = [{ type: 'test', data: {} }];
      system.recording.score = 1000;

      system.startRecording();

      expect(system.recording.inputs).toEqual([]);
      expect(system.recording.score).toBe(0);
      expect(system.recording.level).toBe(1);
    });

    test('should set recording timestamp', () => {
      system.startRecording();

      expect(system.recording.timestamp).toBeDefined();
      expect(typeof system.recording.timestamp).toBe('number');
    });

    test('should emit RECORDING_STARTED event', () => {
      const { gameEvents } = require('../../src/core/EventBus.js');
      system.startRecording();

      expect(gameEvents.emit).toHaveBeenCalledWith('recording:started');
    });
  });

  describe('stopRecording', () => {
    beforeEach(() => {
      system.startRecording();
    });

    test('should set isRecording to false', () => {
      system.stopRecording();

      expect(system.isRecording).toBe(false);
    });

    test('should save recording to localStorage', () => {
      system.recording.inputs = [{ type: 'direction', data: { direction: 'UP' } }];
      system.recording.score = 500;
      system.recording.level = 2;

      system.stopRecording();

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      expect(setItemCall[0]).toMatch(/^pacman_replay_\d+$/);
    });

    test('should emit RECORDING_STOPPED event', () => {
      const { gameEvents } = require('../../src/core/EventBus.js');
      system.stopRecording();

      expect(gameEvents.emit).toHaveBeenCalledWith('recording:stopped');
    });

    test('should save recording with all data', () => {
      system.recording.inputs = [
        { timestamp: 1000, type: 'direction', data: { direction: 'UP' } },
        { timestamp: 2000, type: 'direction', data: { direction: 'LEFT' } }
      ];
      system.recording.score = 1500;
      system.recording.level = 3;

      system.stopRecording();

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.inputs).toHaveLength(2);
      expect(savedData.score).toBe(1500);
      expect(savedData.level).toBe(3);
    });
  });

  describe('recordInput', () => {
    beforeEach(() => {
      system.startRecording();
    });

    test('should add input to recording when recording', () => {
      const input = { type: 'direction', data: { direction: 'UP' } };
      system.recordInput(input);

      expect(system.recording.inputs).toHaveLength(1);
      expect(system.recording.inputs[0]).toEqual(expect.objectContaining({
        type: 'direction',
        data: { direction: 'UP' }
      }));
    });

    test('should set timestamp on recorded input', () => {
      const input = { type: 'direction', data: { direction: 'UP' } };
      system.recordInput(input);

      expect(system.recording.inputs[0].timestamp).toBeDefined();
      expect(typeof system.recording.inputs[0].timestamp).toBe('number');
    });

    test('should not record input when not recording', () => {
      system.isRecording = false;
      const input = { type: 'direction', data: { direction: 'UP' } };

      system.recordInput(input);

      expect(system.recording.inputs).toHaveLength(0);
    });

    test('should record multiple inputs', () => {
      const input1 = { type: 'direction', data: { direction: 'UP' } };
      const input2 = { type: 'direction', data: { direction: 'LEFT' } };

      system.recordInput(input1);
      system.recordInput(input2);

      expect(system.recording.inputs).toHaveLength(2);
    });
  });

  describe('recordScore', () => {
    beforeEach(() => {
      system.startRecording();
    });

    test('should update recording score when recording', () => {
      system.recordScore(1000);

      expect(system.recording.score).toBe(1000);
    });

    test('should update recording level when recording', () => {
      system.recordLevel(3);

      expect(system.recording.level).toBe(3);
    });

    test('should not update score when not recording', () => {
      system.isRecording = false;
      system.recordScore(1000);

      expect(system.recording.score).toBe(0);
    });
  });

  describe('saveRecording', () => {
    test('should save recording to localStorage with unique key', () => {
      system.startRecording();
      system.recording.timestamp = 1234567890;

      system.saveRecording();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pacman_replay_1234567890',
        expect.stringContaining('inputs')
      );
    });

    test('should limit recordings to 10', () => {
      const timestamp = Date.now();

      // Create 10 existing recordings
      for (let i = 0; i < 10; i++) {
        mockLocalStorage.store[`pacman_replay_${timestamp + i}`] = '{}';
      }

      system.startRecording();
      system.recording.timestamp = timestamp + 10;
      system.saveRecording();

      // Should have removed the oldest recording
      const keys = Object.keys(mockLocalStorage.store).filter(k => k.startsWith('pacman_replay_'));
      expect(keys.length).toBe(10);
    });

    test('should stringify recording when saving', () => {
      system.startRecording();
      system.recording.inputs = [{ type: 'test', data: {} }];

      system.saveRecording();

      const saved = mockLocalStorage.setItem.mock.calls[0][1];
      expect(typeof saved).toBe('string');
    });
  });

  describe('getRecordings', () => {
    test('should return empty array when no recordings exist', () => {
      const recordings = system.getRecordings();

      expect(recordings).toEqual([]);
    });

    test('should return all saved recordings', () => {
      const recording1 = { inputs: [], score: 100, level: 1, timestamp: 12345 };
      const recording2 = { inputs: [], score: 200, level: 2, timestamp: 12346 };

      mockLocalStorage.store['pacman_replay_12345'] = JSON.stringify(recording1);
      mockLocalStorage.store['pacman_replay_12346'] = JSON.stringify(recording2);

      const recordings = system.getRecordings();

      expect(recordings).toHaveLength(2);
    });

    test('should parse recordings from JSON', () => {
      const recording = { inputs: [], score: 500, level: 3, timestamp: 12345 };
      mockLocalStorage.store['pacman_replay_12345'] = JSON.stringify(recording);

      const recordings = system.getRecordings();

      expect(recordings[0]).toEqual(recording);
    });

    test('should ignore non-replay keys', () => {
      mockLocalStorage.store['other_key'] = '{}';
      mockLocalStorage.store['pacman_replay_12345'] = JSON.stringify({ inputs: [], score: 100, level: 1, timestamp: 12345 });

      const recordings = system.getRecordings();

      expect(recordings).toHaveLength(1);
    });
  });

  describe('loadRecording', () => {
    test('should set playback data', () => {
      const recording = { inputs: [], score: 100, level: 1, timestamp: 12345 };
      system.loadRecording(recording);

      expect(system.playback).toEqual(recording);
    });

    test('should reset current index', () => {
      system.currentIndex = 5;
      const recording = { inputs: [], score: 100, level: 1, timestamp: 12345 };

      system.loadRecording(recording);

      expect(system.currentIndex).toBe(0);
    });

    test('should set isReplaying to true', () => {
      const recording = { inputs: [], score: 100, level: 1, timestamp: 12345 };
      system.loadRecording(recording);

      expect(system.isReplaying).toBe(true);
    });

    test('should set isRecording to false', () => {
      system.isRecording = true;
      const recording = { inputs: [], score: 100, level: 1, timestamp: 12345 };

      system.loadRecording(recording);

      expect(system.isRecording).toBe(false);
    });
  });

  describe('update during playback', () => {
    beforeEach(() => {
      const { gameEvents } = require('../../src/core/EventBus.js');
      gameEvents.emit.mockClear();
    });

    test('should not emit inputs when not replaying', () => {
      const { gameEvents } = require('../../src/core/EventBus.js');

      system.update(16);

      expect(gameEvents.emit).not.toHaveBeenCalled();
    });

    test('should not emit inputs when no playback data', () => {
      const { gameEvents } = require('../../src/core/EventBus.js');
      system.isReplaying = true;

      system.update(16);

      expect(gameEvents.emit).not.toHaveBeenCalled();
    });

    test('should emit input when time matches', () => {
      const { gameEvents } = require('../../src/core/EventBus.js');
      const now = Date.now();
      const recording = {
        timestamp: now - 1000,
        inputs: [
          { timestamp: now - 100, type: 'direction', data: { direction: 'UP' } }
        ],
        score: 0,
        level: 1
      };

      system.loadRecording(recording);
      system.update(16);

      expect(gameEvents.emit).toHaveBeenCalledWith('replay:input', { direction: 'UP' });
    });

    test('should not emit input when time has not elapsed', () => {
      const { gameEvents } = require('../../src/core/EventBus.js');
      const now = Date.now();
      const recording = {
        timestamp: now,
        inputs: [
          { timestamp: now + 1000, type: 'direction', data: { direction: 'UP' } }
        ],
        score: 0,
        level: 1
      };

      system.loadRecording(recording);
      system.update(16);

      expect(gameEvents.emit).not.toHaveBeenCalled();
    });

    test('should emit REPLAY_FINISHED when all inputs processed', () => {
      const { gameEvents } = require('../../src/core/EventBus.js');
      const now = Date.now();
      const recording = {
        timestamp: now - 2000,
        inputs: [
          { timestamp: now - 100, type: 'direction', data: { direction: 'UP' } }
        ],
        score: 0,
        level: 1
      };

      system.loadRecording(recording);
      system.update(16);

      expect(gameEvents.emit).toHaveBeenCalledWith('replay:finished');
    });

    test('should set isReplaying to false when finished', () => {
      const { gameEvents } = require('../../src/core/EventBus.js');
      const now = Date.now();
      const recording = {
        timestamp: now - 2000,
        inputs: [{ timestamp: now - 100, type: 'direction', data: { direction: 'UP' } }],
        score: 0,
        level: 1
      };

      system.loadRecording(recording);
      system.update(16);

      expect(system.isReplaying).toBe(false);
    });
  });

  describe('deleteRecording', () => {
    test('should remove recording from localStorage', () => {
      mockLocalStorage.store['pacman_replay_12345'] = '{}';

      system.deleteRecording('pacman_replay_12345');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pacman_replay_12345');
      expect(mockLocalStorage.store['pacman_replay_12345']).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    test('should reset system state', () => {
      system.startRecording();
      system.cleanup();

      expect(system.isRecording).toBe(false);
      expect(system.isReplaying).toBe(false);
      expect(system.playback).toBeNull();
    });
  });
});
