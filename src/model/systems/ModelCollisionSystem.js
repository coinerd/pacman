/**
 * ModelCollisionSystem
 * Pure collision detection using model entity states.
 * NO Phaser dependencies.
 *
 * @deprecated This class is deprecated. Use the decoupled collision system instead:
 * - CollisionEngine in src/collision/CollisionEngine.js
 * - CollisionAdapter in src/model/adapters/CollisionAdapter.js
 *
 * This legacy class will be removed in a future release.
 *
 * Phase 3 Update: Collision system now only DETECTS collisions.
 * Score and state updates are handled by GameModel.applyCollisionEffect()
 */

import { gameConfig, scoreValues } from '../../config/gameConfig.js';
import { PELLET_TYPES } from '../../utils/MazeLayout.js';
import { pixelToGrid, getDistance } from '../../utils/MazeLayout.js';
import { capsuleCollision } from '../../utils/CollisionUtils.js';

// Deprecation warning (only shown once)
let deprecationWarningShown = false;
function showDeprecationWarning() {
    if (!deprecationWarningShown && typeof console !== 'undefined') {
        console.warn('[DEPRECATED] ModelCollisionSystem is deprecated. Use CollisionEngine with CollisionAdapter instead.');
        deprecationWarningShown = true;
    }
}

export class ModelCollisionSystem {
    /**
     * @param {GameModel} gameState - Game model reference
     */
    constructor(gameState) {
        showDeprecationWarning();
        this.gameState = gameState;
        this.collisionRadius = gameConfig.tileSize * 0.6;
        this.lastPelletGrid = { x: null, y: null };
    }

    /**
     * Check all collisions for current frame
     * @returns {Array<Object>} - Collision events
     */
    checkAllCollisions() {
        const events = [];

        // Check pellet collisions
        const pelletEvent = this.checkPelletCollision();
        if (pelletEvent) {
            events.push(pelletEvent);
        }

        // Check ghost collisions
        const ghostEvent = this.checkGhostCollisions();
        if (ghostEvent) {
            events.push(ghostEvent);
        }

        // Check fruit collision
        const fruitEvent = this.checkFruitCollision();
        if (fruitEvent) {
            events.push(fruitEvent);
        }

        return events;
    }

    /**
     * Check pellet collision at Pacman's position
     * @returns {Object|null}
     */
    checkPelletCollision() {
        const pacman = this.gameState.pacman;

        // Get grid position
        const gridPos = pixelToGrid(pacman.x, pacman.y);

        // Prevent duplicate checks on same tile
        if (gridPos.x === this.lastPelletGrid.x && gridPos.y === this.lastPelletGrid.y) {
            return null;
        }

        const pelletType = this.gameState.getPelletAt(gridPos.x, gridPos.y);

        if (pelletType === PELLET_TYPES.NONE) {
            return null;
        }

        // Eat the pellet (modifies pellet grid)
        const result = this.gameState.eatPelletAt(gridPos.x, gridPos.y);

        if (!result) {
            return null;
        }

        this.lastPelletGrid = { x: gridPos.x, y: gridPos.y };

        // Determine score (but don't apply it - GameModel will handle that)
        const score = result.type === 'power_pellet'
            ? scoreValues.powerPellet
            : scoreValues.pellet;

        const event = {
            type: result.type === 'power_pellet' ? 'power_pellet_eaten' : 'pellet_eaten',
            gridX: result.gridX,
            gridY: result.gridY,
            score: score,
            pelletsRemaining: result.pelletsRemaining
        };

        // If power pellet, include frightened duration
        if (result.type === 'power_pellet') {
            event.frightenedDuration = this.gameState.getFrightenedDuration();
        }

        // Check level complete
        if (result.levelComplete) {
            event.levelComplete = true;
        }

        return event;
    }

    /**
     * Check collisions between Pacman and all ghosts
     * @returns {Object|null}
     */
    checkGhostCollisions() {
        const pacman = this.gameState.pacman;

        for (const ghost of this.gameState.ghosts) {
            if (ghost.isEaten) {
                continue;
            }

            if (this.checkEntityCollision(pacman, ghost)) {
                return this.handleGhostCollision(ghost);
            }
        }

        return null;
    }

    /**
     * Check collision between two entities using swept capsule test
     * @param {ModelEntity} entity1 - First entity
     * @param {ModelEntity} entity2 - Second entity
     * @returns {boolean}
     */
    checkEntityCollision(entity1, entity2) {
        return capsuleCollision(
            entity1.prevX ?? entity1.x,
            entity1.prevY ?? entity1.y,
            entity1.x,
            entity1.y,
            entity2.prevX ?? entity2.x,
            entity2.prevY ?? entity2.y,
            entity2.x,
            entity2.y,
            this.collisionRadius
        );
    }

    /**
     * Handle ghost collision result
     * @param {GhostState} ghost - Ghost that collided
     * @returns {Object}
     */
    handleGhostCollision(ghost) {
        if (ghost.isFrightened) {
            // Increment combo counter
            this.gameState.currentComboGhosts++;

            // Calculate score based on current combo
            const scoreIndex = Math.min(this.gameState.currentComboGhosts - 1, 3);
            const scores = [200, 400, 800, 1600];
            const score = scores[scoreIndex];

            // Mark ghost as eaten
            ghost.eat();

            return {
                type: 'ghost_eaten',
                ghostType: ghost.ghostType,
                score: score,
                combo: this.gameState.currentComboGhosts
            };
        } else {
            // Pacman dies - return event for GameModel to handle
            return {
                type: 'pacman_died',
                livesRemaining: this.gameState.lives
            };
        }
    }

    /**
     * Check fruit collision
     * @returns {Object|null}
     */
    checkFruitCollision() {
        const fruit = this.gameState.fruit;

        if (!fruit.active) {
            return null;
        }

        const pacman = this.gameState.pacman;
        const dist = getDistance(
            pacman.x / gameConfig.tileSize,
            pacman.y / gameConfig.tileSize,
            fruit.x / gameConfig.tileSize,
            fruit.y / gameConfig.tileSize
        ) * gameConfig.tileSize;

        if (dist < gameConfig.tileSize) {
            // Get score from fruit (marks as eaten)
            const score = fruit.eat();

            return {
                type: 'fruit_eaten',
                score: score,
                fruitType: fruit.getFruitType().name
            };
        }

        return null;
    }

    /**
     * Reset collision system state
     */
    reset() {
        this.lastPelletGrid = { x: null, y: null };
    }

    /**
     * Get collision statistics for debugging
     * @returns {Object}
     */
    getStats() {
        return {
            collisionRadius: this.collisionRadius,
            lastPelletGrid: { ...this.lastPelletGrid }
        };
    }
}
