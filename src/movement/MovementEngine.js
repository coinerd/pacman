/**
 * Movement Engine
 * Coordinates movement for all entities using configured strategies
 *
 * The MovementEngine is a coordinator that manages multiple movement
 * strategies and applies them to entities. It does not contain
 * movement logic itself - that is delegated to the strategies.
 */

import { MovementInterface, MOVEMENT_RESULTS } from './MovementInterface.js';

/**
 * Movement Engine
 * Coordinates entity movement using pluggable strategies
 */
export class MovementEngine {
    /**
     * @param {Object} config - Configuration
     * @param {MovementInterface} [config.defaultStrategy] - Default movement strategy
     */
    constructor(config = {}) {
        /** @type {Map<string, MovementInterface>} */
        this.strategies = new Map();
        /** @type {MovementInterface|null} */
        this.defaultStrategy = config.defaultStrategy || null;
        /** @type {Object} Statistics tracking */
        this.stats = {
            totalMoves: 0,
            totalTime: 0
        };
    }

    /**
     * Register a movement strategy
     * @param {string} name - Strategy name/identifier
     * @param {MovementInterface} strategy - Movement strategy instance
     * @returns {MovementEngine} This engine for chaining
     */
    registerStrategy(name, strategy) {
        if (!(strategy instanceof MovementInterface)) {
            throw new Error('Strategy must extend MovementInterface');
        }
        this.strategies.set(name, strategy);
        return this;
    }

    /**
     * Unregister a movement strategy
     * @param {string} name - Strategy name
     * @returns {boolean} True if strategy was removed
     */
    unregisterStrategy(name) {
        return this.strategies.delete(name);
    }

    /**
     * Set the default strategy
     * @param {string} name - Strategy name
     * @returns {MovementEngine} This engine for chaining
     * @throws {Error} If strategy not found
     */
    setDefaultStrategy(name) {
        if (!this.strategies.has(name)) {
            throw new Error(`Strategy not found: ${name}`);
        }
        this.defaultStrategy = this.strategies.get(name);
        return this;
    }

    /**
     * Get a registered strategy
     * @param {string} name - Strategy name
     * @returns {MovementInterface|null} Strategy or null if not found
     */
    getStrategy(name) {
        return this.strategies.get(name) || null;
    }

    /**
     * Check if a strategy is registered
     * @param {string} name - Strategy name
     * @returns {boolean}
     */
    hasStrategy(name) {
        return this.strategies.has(name);
    }

    /**
     * Get all registered strategy names
     * @returns {Array<string>} Strategy names
     */
    getStrategyNames() {
        return Array.from(this.strategies.keys());
    }

    /**
     * Move a single entity
     * @param {Object} entity - Entity state
     * @param {Object} context - Movement context
     * @param {number} deltaSeconds - Time delta
     * @param {string} [strategyName] - Strategy to use (defaults to defaultStrategy)
     * @returns {import('./MovementInterface.js').MovementResult} Movement result
     * @throws {Error} If no strategy available
     */
    move(entity, context, deltaSeconds, strategyName = null) {
        const strategy = strategyName
            ? this.strategies.get(strategyName)
            : this.defaultStrategy;

        if (!strategy) {
            throw new Error(
                `No movement strategy available${
                    strategyName ? `: ${strategyName}` : ''
                }`
            );
        }

        const startTime = performance.now();
        const result = strategy.move(entity, context, deltaSeconds);

        // Update statistics
        this.stats.totalMoves++;
        this.stats.totalTime += performance.now() - startTime;

        return result;
    }

    /**
     * Move multiple entities
     * @param {Array<Object>} entities - Entities to move
     * @param {Object} context - Movement context
     * @param {number} deltaSeconds - Time delta
     * @param {string} [strategyName] - Strategy to use
     * @returns {Array<import('./MovementInterface.js').MovementResult>} Movement results
     */
    moveAll(entities, context, deltaSeconds, strategyName = null) {
        const results = [];
        for (const entity of entities) {
            results.push(this.move(entity, context, deltaSeconds, strategyName));
        }
        return results;
    }

    /**
     * Move entities with individual contexts
     * @param {Array<{entity: Object, context: Object}>} entityContexts - Entity-context pairs
     * @param {number} deltaSeconds - Time delta
     * @param {string} [strategyName] - Strategy to use
     * @returns {Array<import('./MovementInterface.js').MovementResult>} Movement results
     */
    moveWithContexts(entityContexts, deltaSeconds, strategyName = null) {
        return entityContexts.map(({ entity, context }) =>
            this.move(entity, context, deltaSeconds, strategyName)
        );
    }

    /**
     * Check if an entity can move in a direction
     * @param {Object} entity - Entity state
     * @param {Object} context - Movement context
     * @param {Object} direction - Direction to check
     * @param {string} [strategyName] - Strategy to use
     * @returns {boolean}
     * @throws {Error} If no strategy available
     */
    canMove(entity, context, direction, strategyName = null) {
        const strategy = strategyName
            ? this.strategies.get(strategyName)
            : this.defaultStrategy;

        if (!strategy) {
            throw new Error(
                `No movement strategy available${
                    strategyName ? `: ${strategyName}` : ''
                }`
            );
        }

        return strategy.canMove(entity, context, direction);
    }

    /**
     * Calculate distances for entities without moving them
     * Useful for AI pathfinding
     * @param {Array<Object>} entities - Entities
     * @param {number} deltaSeconds - Time delta
     * @returns {Array<number>} Distances each entity would move
     */
    calculateDistances(entities, deltaSeconds) {
        return entities.map(entity => {
            if (!entity || !entity.speed || deltaSeconds <= 0) {
                return 0;
            }
            return entity.speed * deltaSeconds;
        });
    }

    /**
     * Batch move with collision avoidance (future enhancement)
     * @param {Array<Object>} entities - Entities to move
     * @param {Object} context - Movement context
     * @param {number} deltaSeconds - Time delta
     * @param {string} [strategyName] - Strategy to use
     * @returns {Array<import('./MovementInterface.js').MovementResult>} Movement results
     */
    moveWithCollisionAvoidance(entities, context, deltaSeconds, strategyName = null) {
        // Future: Implement collision avoidance between entities
        // For now, just move all normally
        return this.moveAll(entities, context, deltaSeconds, strategyName);
    }

    /**
     * Clear all registered strategies
     */
    clearStrategies() {
        this.strategies.clear();
        this.defaultStrategy = null;
    }

    /**
     * Get engine statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            registeredStrategies: this.strategies.size,
            strategyNames: this.getStrategyNames(),
            hasDefaultStrategy: this.defaultStrategy !== null,
            ...this.stats
        };
    }

    /**
     * Reset engine statistics
     */
    resetStats() {
        this.stats = {
            totalMoves: 0,
            totalTime: 0
        };
    }
}
