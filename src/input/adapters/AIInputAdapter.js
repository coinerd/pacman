/**
 * AIInputAdapter
 * Provides AI-controlled input for bot gameplay, demos, and automated testing.
 * Wraps the existing PacmanAI system to provide input through the adapter interface.
 */

import { InputAdapter, INPUT_TYPES } from '../InputAdapter.js';
import { PacmanAI } from '../../systems/PacmanAI.js';

export class AIInputAdapter extends InputAdapter {
    /**
     * Create AIInputAdapter
     * @param {Object} options - Configuration options
     * @param {Object} options.aiInstance - Optional existing PacmanAI instance
     * @param {number} options.decisionInterval - Ms between decisions (default: 100)
     * @param {boolean} options.continuousMode - Emit direction every frame (default: true)
     */
    constructor(options = {}) {
        super();
        this.name = 'ai';
        this.ai = options.aiInstance || new PacmanAI();
        this.options = {
            decisionInterval: 100,
            continuousMode: true,
            ...options
        };

        this.gameModel = null;
        this.lastDecisionTime = 0;
        this.lastDirection = null;
        this.decisionCount = 0;
    }

    /**
     * Connect the AI to a game model
     * @param {Object} gameModel - The game model to control
     */
    setGameModel(gameModel) {
        this.gameModel = gameModel;
        if (this.ai) {
            this.ai.enable();
        }
    }

    /**
     * Disconnect from game model
     */
    disconnect() {
        this.gameModel = null;
        if (this.ai) {
            this.ai.disable();
        }
    }

    /**
     * Enable AI control
     */
    enable() {
        super.enable();
        if (this.ai) {
            this.ai.enable();
        }
    }

    /**
     * Disable AI control
     */
    disable() {
        super.disable();
        if (this.ai) {
            this.ai.disable();
        }
    }

    /**
     * Get current input from AI
     * @returns {Object|null} Direction input or null
     */
    getCurrentInput() {
        if (!this.isEnabled || !this.gameModel || !this.ai) {
            return null;
        }

        const direction = this.ai.getDirection(
            this.gameModel.pacman,
            this.gameModel.maze,
            this.gameModel.pelletGrid,
            this.gameModel.ghosts
        );

        if (direction && direction !== this.lastDirection) {
            this.lastDirection = direction;
            this.decisionCount++;
            return {
                type: INPUT_TYPES.DIRECTION,
                value: direction
            };
        }

        return null;
    }

    /**
     * Update AI decision making
     * @param {number} deltaTime - Time since last frame in ms
     */
    update(deltaTime) {
        if (!this.isEnabled || !this.gameModel) {return;}

        this.lastDecisionTime += deltaTime;

        // In continuous mode, emit direction every frame
        if (this.options.continuousMode) {
            const direction = this.ai.getDirection(
                this.gameModel.pacman,
                this.gameModel.maze,
                this.gameModel.pelletGrid,
                this.gameModel.ghosts
            );

            if (direction) {
                this.emitInput({
                    type: INPUT_TYPES.DIRECTION,
                    value: direction
                });
            }
        } else {
            // Decision interval mode - only decide at intervals
            if (this.lastDecisionTime >= this.options.decisionInterval) {
                this.lastDecisionTime = 0;
                const input = this.getCurrentInput();
                if (input) {
                    this.emitInput(input);
                }
            }
        }
    }

    /**
     * Force an immediate AI decision
     * @returns {Object|null} Direction input or null
     */
    forceDecision() {
        if (!this.isEnabled || !this.gameModel || !this.ai) {
            return null;
        }

        this.lastDecisionTime = 0;
        const direction = this.ai.getDirection(
            this.gameModel.pacman,
            this.gameModel.maze,
            this.gameModel.pelletGrid,
            this.gameModel.ghosts
        );

        if (direction) {
            this.lastDirection = direction;
            this.decisionCount++;
            const input = {
                type: INPUT_TYPES.DIRECTION,
                value: direction
            };
            this.emitInput(input);
            return input;
        }

        return null;
    }

    /**
     * Get AI statistics
     * @returns {Object} Statistics about AI performance
     */
    getStats() {
        return {
            decisionCount: this.decisionCount,
            isEnabled: this.isEnabled,
            isConnected: !!this.gameModel,
            lastDirection: this.lastDirection
        };
    }

    /**
     * Reset AI state
     */
    reset() {
        this.lastDecisionTime = 0;
        this.lastDirection = null;
        this.decisionCount = 0;
        if (this.ai) {
            // Reset AI internal state if available
            this.ai.lastDecisionGridX = -1;
            this.ai.lastDecisionGridY = -1;
            this.ai.lastDirection = null;
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.disconnect();
        this.ai = null;
        super.destroy();
    }
}

/**
 * ScriptedAIAdapter
 * AI that follows a predefined script of actions
 */
export class ScriptedAIAdapter extends InputAdapter {
    /**
     * Create ScriptedAIAdapter
     * @param {Array} script - Array of {time, action} objects
     * @param {Object} options - Configuration options
     */
    constructor(script = [], options = {}) {
        super();
        this.name = 'scripted_ai';
        this.script = script;
        this.options = {
            loop: false,
            ...options
        };

        this.currentIndex = 0;
        this.elapsedTime = 0;
        this.isPlaying = false;
    }

    /**
     * Start the script
     */
    start() {
        this.isPlaying = true;
        this.elapsedTime = 0;
        this.currentIndex = 0;
    }

    /**
     * Stop the script
     */
    stop() {
        this.isPlaying = false;
    }

    /**
     * Update script playback
     * @param {number} deltaTime - Time since last frame in ms
     */
    update(deltaTime) {
        if (!this.isPlaying || !this.isEnabled) {return;}

        this.elapsedTime += deltaTime;

        // Execute all actions that are due
        while (this.currentIndex < this.script.length) {
            const action = this.script[this.currentIndex];
            if (action.time <= this.elapsedTime) {
                this.emitInput({
                    type: INPUT_TYPES.DIRECTION,
                    value: action.direction
                });
                this.currentIndex++;
            } else {
                break;
            }
        }

        // Handle script completion
        if (this.currentIndex >= this.script.length) {
            if (this.options.loop) {
                this.elapsedTime = 0;
                this.currentIndex = 0;
            } else {
                this.isPlaying = false;
            }
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stop();
        this.script = [];
        super.destroy();
    }
}

export default AIInputAdapter;
