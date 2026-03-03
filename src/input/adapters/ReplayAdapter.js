/**
 * ReplayAdapter
 * Replays recorded input sequences for demos, testing, and debugging.
 * Can be used to reproduce bugs or showcase gameplay.
 */

import { InputAdapter, INPUT_TYPES } from '../InputAdapter.js';

/**
 * @typedef {Object} ReplayFrame
 * @property {number} time - Time in ms when this input should fire
 * @property {Object} input - The input event to emit
 * @property {string} input.type - Input type
 * @property {*} input.value - Input value
 */

export class ReplayAdapter extends InputAdapter {
    /**
     * Create ReplayAdapter
     * @param {Array<ReplayFrame>} replayData - Array of timed input events
     * @param {Object} options - Configuration options
     * @param {boolean} options.loop - Loop the replay when finished (default: false)
     * @param {number} options.speed - Playback speed multiplier (default: 1.0)
     * @param {boolean} options.autoStart - Start replay immediately (default: true)
     */
    constructor(replayData = [], options = {}) {
        super();
        this.name = 'replay';
        this.replayData = replayData;
        this.options = {
            loop: false,
            speed: 1.0,
            autoStart: true,
            ...options
        };

        this.currentIndex = 0;
        this.elapsedTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.lastFrameTime = 0;

        if (this.options.autoStart) {
            this.start();
        }
    }

    /**
     * Start or resume replay playback
     */
    start() {
        this.isPlaying = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
    }

    /**
     * Pause replay playback
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume replay playback
     */
    resume() {
        if (this.isPlaying) {
            this.isPaused = false;
            this.lastFrameTime = performance.now();
        }
    }

    /**
     * Stop replay playback and reset to beginning
     */
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentIndex = 0;
        this.elapsedTime = 0;
    }

    /**
     * Seek to a specific time in the replay
     * @param {number} time - Time in ms to seek to
     */
    seek(time) {
        this.elapsedTime = Math.max(0, time);
        this.currentIndex = this.findIndexForTime(this.elapsedTime);
    }

    /**
     * Find the replay index for a given time
     * @private
     * @param {number} time - Target time
     * @returns {number} Index in replayData
     */
    findIndexForTime(time) {
        for (let i = 0; i < this.replayData.length; i++) {
            if (this.replayData[i].time > time) {
                return i;
            }
        }
        return this.replayData.length;
    }

    /**
     * Update replay playback
     * @param {number} deltaTime - Time since last frame in ms
     */
    update(deltaTime) {
        if (!this.isPlaying || this.isPaused || !this.isEnabled) {return;}

        // Apply playback speed
        const scaledDelta = deltaTime * this.options.speed;
        this.elapsedTime += scaledDelta;

        // Process all events that should fire at this time
        while (this.currentIndex < this.replayData.length) {
            const frame = this.replayData[this.currentIndex];

            if (frame.time <= this.elapsedTime) {
                this.emitInput(frame.input);
                this.currentIndex++;
            } else {
                break;
            }
        }

        // Check if replay is complete
        if (this.currentIndex >= this.replayData.length) {
            this.handleComplete();
        }
    }

    /**
     * Handle replay completion
     * @private
     */
    handleComplete() {
        if (this.options.loop) {
            this.currentIndex = 0;
            this.elapsedTime = 0;
            this.lastFrameTime = performance.now();
        } else {
            this.isPlaying = false;
            this.emitInput({
                type: INPUT_TYPES.ACTION,
                value: 'replay_complete'
            });
        }
    }

    /**
     * Get current replay progress
     * @returns {Object} Progress information
     */
    getProgress() {
        if (this.replayData.length === 0) {
            return { current: 0, total: 0, percentage: 100 };
        }

        const totalTime = this.replayData[this.replayData.length - 1].time;
        const percentage = totalTime > 0 ? (this.elapsedTime / totalTime) * 100 : 0;

        return {
            current: this.elapsedTime,
            total: totalTime,
            percentage: Math.min(percentage, 100),
            frame: this.currentIndex,
            totalFrames: this.replayData.length
        };
    }

    /**
     * Check if replay is currently playing
     * @returns {boolean}
     */
    getIsPlaying() {
        return this.isPlaying && !this.isPaused;
    }

    /**
     * Load new replay data
     * @param {Array<ReplayFrame>} replayData - New replay data
     * @param {boolean} autoStart - Whether to start immediately
     */
    loadReplay(replayData, autoStart = true) {
        this.stop();
        this.replayData = replayData;
        if (autoStart) {
            this.start();
        }
    }

    /**
     * Get replay data as JSON string (for saving)
     * @returns {string} JSON string of replay data
     */
    serialize() {
        return JSON.stringify({
            version: '1.0',
            created: new Date().toISOString(),
            frames: this.replayData
        });
    }

    /**
     * Load replay data from JSON string
     * @param {string} json - JSON string to parse
     * @returns {boolean} True if successful
     */
    deserialize(json) {
        try {
            const data = JSON.parse(json);
            if (data.frames && Array.isArray(data.frames)) {
                this.loadReplay(data.frames);
                return true;
            }
        } catch (error) {
            console.error('Failed to deserialize replay data:', error);
        }
        return false;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stop();
        this.replayData = [];
        super.destroy();
    }
}

/**
 * ReplayRecorder
 * Records input events for later playback
 */
export class ReplayRecorder {
    constructor() {
        this.frames = [];
        this.isRecording = false;
        this.startTime = 0;
        this.metadata = {};
    }

    /**
     * Start recording
     * @param {Object} metadata - Optional metadata to store with replay
     */
    start(metadata = {}) {
        this.frames = [];
        this.isRecording = true;
        this.startTime = performance.now();
        this.metadata = metadata;
    }

    /**
     * Stop recording
     */
    stop() {
        this.isRecording = false;
    }

    /**
     * Record an input event
     * @param {Object} input - Input event to record
     */
    record(input) {
        if (!this.isRecording) {return;}

        const time = performance.now() - this.startTime;
        this.frames.push({
            time,
            input: {
                type: input.type,
                value: input.value
            }
        });
    }

    /**
     * Get recorded replay data
     * @returns {Array<ReplayFrame>} Recorded frames
     */
    getReplayData() {
        return [...this.frames];
    }

    /**
     * Export replay as JSON
     * @returns {string} JSON string
     */
    export() {
        return JSON.stringify({
            version: '1.0',
            created: new Date().toISOString(),
            metadata: this.metadata,
            frames: this.frames
        }, null, 2);
    }

    /**
     * Clear recorded data
     */
    clear() {
        this.frames = [];
        this.isRecording = false;
    }
};
