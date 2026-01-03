import { gameEvents } from '../core/EventBus.js';

/**
 * ReplaySystem - Record and replay gameplay sessions
 * Allows users to record their gameplay and watch replays later
 */
export class ReplaySystem {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.isRecording = false;
    this.isReplaying = false;
    this.recording = {
      inputs: [],
      score: 0,
      level: 1,
      timestamp: 0
    };
    this.playback = null;
    this.currentIndex = 0;
  }

  /**
   * Start recording a new gameplay session
   */
  startRecording() {
    this.isRecording = true;
    this.isReplaying = false;
    this.recording = {
      inputs: [],
      score: 0,
      level: 1,
      timestamp: Date.now()
    };

    gameEvents.emit('recording:started');
  }

  /**
   * Stop recording and save the session
   */
  stopRecording() {
    this.isRecording = false;
    this.saveRecording();

    gameEvents.emit('recording:stopped');
  }

  /**
   * Record an input event during gameplay
   * @param {Object} input - Input to record with type and data
   */
  recordInput(input) {
    if (!this.isRecording) return;

    this.recording.inputs.push({
      timestamp: Date.now(),
      type: input.type,
      data: input.data
    });
  }

  /**
   * Record the current score
   * @param {number} score - Current game score
   */
  recordScore(score) {
    if (!this.isRecording) return;
    this.recording.score = score;
  }

  /**
   * Record the current level
   * @param {number} level - Current game level
   */
  recordLevel(level) {
    if (!this.isRecording) return;
    this.recording.level = level;
  }

  /**
   * Save recording to localStorage
   */
  saveRecording() {
    const recording = JSON.stringify(this.recording);
    const timestamp = this.recording.timestamp;

    this.storage.setItem(`pacman_replay_${timestamp}`, recording);

    const keys = this.storage.store
      ? Object.keys(this.storage.store)
      : Object.keys(this.storage);

    const replayKeys = keys
      .filter(k => k.startsWith('pacman_replay_'))
      .sort();

    if (replayKeys.length > 10) {
      const oldestKey = replayKeys[0];
      this.storage.removeItem(oldestKey);
    }
  }

  /**
   * Load a recording for playback
   * @param {Object} recording - Recording object to load
   */
  loadRecording(recording) {
    this.playback = recording;
    this.currentIndex = 0;
    this.isReplaying = true;
    this.isRecording = false;
  }

  /**
   * Get all saved recordings
   * @returns {Array} Array of recording objects
   */
  getRecordings() {
    const keys = this.storage.store
      ? Object.keys(this.storage.store)
      : Object.keys(this.storage);

    return keys
      .filter(k => k.startsWith('pacman_replay_'))
      .sort()
      .map(k => {
        try {
          return JSON.parse(this.storage.getItem(k));
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * Delete a specific recording
   * @param {string} key - Storage key of the recording to delete
   */
  deleteRecording(key) {
    this.storage.removeItem(key);
  }

  /**
   * Update playback state (called each frame during replay)
   * @param {number} delta - Time since last update
   */
  update(delta) {
    if (!this.isReplaying || !this.playback) return;

    const now = Date.now();
    const elapsed = now - this.playback.timestamp;

    while (this.currentIndex < this.playback.inputs.length) {
      const input = this.playback.inputs[this.currentIndex];
      const inputTime = input.timestamp - this.playback.timestamp;

      if (inputTime <= elapsed) {
        gameEvents.emit('replay:input', input.data);
        this.currentIndex++;
      } else {
        break;
      }
    }

    if (this.currentIndex >= this.playback.inputs.length) {
      this.isReplaying = false;
      gameEvents.emit('replay:finished');
    }
  }

  /**
   * Clean up system state
   */
  cleanup() {
    this.isRecording = false;
    this.isReplaying = false;
    this.playback = null;
    this.currentIndex = 0;
  }
}
