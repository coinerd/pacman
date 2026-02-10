/**
 * GameStateController
 *
 * Phase 3 Update: Now a wrapper around unified GameModel.
 * Maintains backward compatibility with existing tests and code.
 *
 * For new code, use GameModel directly:
 *   const model = new GameModel({ level: 1 });
 *   const events = model.step(deltaSeconds);
 */

import GameModel from '../core/GameModel.js';
import { directions } from '../config/gameConfig.js';
import { gameEvents, GAME_EVENTS } from '../core/EventBus.js';

export class GameStateController {
    /**
     * @param {Object} config - Configuration
     * @param {number} config.level - Starting level
     * @param {number} config.score - Initial score
     * @param {number} config.lives - Initial lives
     * @param {Array<Array<number>>} config.maze - Optional maze override
     * @param {Array<Array<number>>} config.pelletGrid - Optional pellet grid override
     */
    constructor(config = {}) {
        // Create unified GameModel with legacy systems for backward compatibility
        this.model = new GameModel({
            ...config,
            useDecoupledSystems: false
        });

        // For backward compatibility: state should reference the model itself
        // since GameModel now has all the properties GameState had
        this.state = this.model;

        // Collision system reference
        this.collisionSystem = this.model.collisionSystem;

        // Input state (also maintained in model)
        this.inputDirection = null;

        // Profiling (also maintained in model)
        this.lastUpdateTime = 0;
        this.updateCount = 0;
    }

    /**
     * Set input direction for next update
     * @param {Object} direction - Direction from directions enum
     */
    setInputDirection(direction) {
        if (direction && direction !== directions.NONE) {
            this.model.setInputDirection(direction);
            this.inputDirection = direction;
        }
    }

    /**
     * Main game update - runs simulation for one frame
     * @param {number} deltaSeconds - Time since last frame
     * @returns {Array<Object>} - Events generated this frame
     */
    update(deltaSeconds) {
        const result = this.model.step(deltaSeconds);

        // Normalize return value to always be an array
        // (model.step() may return a single legacy-format object during death)
        let events;
        if (Array.isArray(result)) {
            events = result;
        } else if (result && result.event) {
            // Convert legacy format { event: 'deathTick' } to new format { type: 'death_tick' }
            const typeMap = {
                'deathTick': 'death_tick',
                'respawn': 'respawn',
                'gameOver': 'game_over'
            };
            events = [{ type: typeMap[result.event] || result.event }];
        } else if (result) {
            events = [result];
        } else {
            events = [];
        }

        // Update backward-compatible properties
        this.lastUpdateTime = this.model.lastUpdateTime;
        this.updateCount = this.model.updateCount;
        this.inputDirection = this.model.inputDirection;

        return events;
    }

    /**
     * Emit events via EventBus
     * @param {Array<Object>} events - Events to emit
     * @deprecated Events are now emitted automatically in step()
     */
    emitEvents(events) {
        this.model.emitEvents(events);
    }

    /**
     * Get complete state snapshot for view sync
     * @returns {Object}
     */
    getSnapshot() {
        return this.model.getSnapshot();
    }

    /**
     * Get collision system stats for debugging
     * @returns {Object}
     */
    getStats() {
        return this.model.getStats();
    }

    /**
     * Set paused state
     * @param {boolean} paused
     */
    setPaused(paused) {
        this.model.setPaused(paused);
    }

    /**
     * Reset positions after death
     */
    resetPositions() {
        this.model.resetPositions();
    }

    /**
     * Advance to next level
     */
    nextLevel() {
        this.model.nextLevel();
    }

    /**
     * Serialize for save/replay
     * @returns {Object}
     */
    serialize() {
        return this.model.serialize();
    }
}
