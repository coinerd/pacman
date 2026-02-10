/**
 * CollisionAdapter
 * Bridges the decoupled CollisionEngine with the existing GameModel.
 * Maintains backward compatibility while using the new pure collision system.
 */

import { CollisionEngine } from '../../collision/CollisionEngine.js';
import { gameConfig, scoreValues } from '../../config/gameConfig.js';
import { PELLET_TYPES } from '../../utils/MazeLayout.js';

/**
 * Adapter that wraps the decoupled CollisionEngine for use with existing GameModel
 */
export class CollisionAdapter {
    /**
     * @param {GameModel} gameModel - The game model to adapt for
     */
    constructor(gameModel) {
        this.gameModel = gameModel;

        // Initialize the decoupled collision engine
        this.collisionEngine = new CollisionEngine({
            cellSize: gameConfig.tileSize,
            collisionRadius: gameConfig.tileSize * 0.6,
            useSpatialIndex: true
        });

        // Last pellet grid position (to prevent duplicate eating)
        this.lastPelletGrid = { x: null, y: null };

        // Statistics
        this.stats = {
            checksPerformed: 0,
            collisionsDetected: 0
        };
    }

    /**
     * Check all collisions for current frame
     * @returns {Array<Object>} - Collision events in GameModel format
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
        const pacman = this.gameModel.pacman;

        // Get grid position
        const gridX = Math.floor(pacman.x / gameConfig.tileSize);
        const gridY = Math.floor(pacman.y / gameConfig.tileSize);

        // Prevent duplicate checks on same tile
        if (gridX === this.lastPelletGrid.x && gridY === this.lastPelletGrid.y) {
            return null;
        }

        // Check if there's a pellet at this position
        const pelletType = this.gameModel.getPelletAt(gridX, gridY);

        if (pelletType === PELLET_TYPES.NONE) {
            return null;
        }

        // Use decoupled collision engine to check pellet collision
        const eatRadius = gameConfig.tileSize * 0.5;

        const pelletCollisions = this.collisionEngine.checkPelletCollisions(
            pacman,
            this.gameModel.pelletGrid,
            {
                tileSize: gameConfig.tileSize,
                eatRadius: eatRadius,
                pelletScore: scoreValues.pellet,
                powerPelletScore: scoreValues.powerPellet
            }
        );

        if (pelletCollisions.length === 0) {
            return null;
        }

        // Eat the pellet
        const result = this.gameModel.eatPelletAt(gridX, gridY);

        if (!result) {
            return null;
        }

        this.lastPelletGrid = { x: gridX, y: gridY };

        // Determine event type and score
        const isPowerPellet = result.type === 'power_pellet';
        const score = isPowerPellet ? scoreValues.powerPellet : scoreValues.pellet;

        const event = {
            type: isPowerPellet ? 'power_pellet_eaten' : 'pellet_eaten',
            gridX: result.gridX,
            gridY: result.gridY,
            score: score,
            pelletsRemaining: result.pelletsRemaining
        };

        // If power pellet, include frightened duration
        if (isPowerPellet) {
            event.frightenedDuration = this.gameModel.getFrightenedDuration();
        }

        // Check level complete
        if (result.levelComplete) {
            event.levelComplete = true;
        }

        this.stats.checksPerformed++;
        this.stats.collisionsDetected++;

        return event;
    }

    /**
     * Check collisions between Pacman and all ghosts
     * @returns {Object|null}
     */
    checkGhostCollisions() {
        const pacman = this.gameModel.pacman;

        // Build entity list for collision detection
        const ghostEntities = this.gameModel.ghosts
            .filter(g => !g.isEaten)
            .map(g => ({
                id: g.id,
                x: g.x,
                y: g.y,
                prevX: g.prevX ?? g.x,
                prevY: g.prevY ?? g.y,
                ghost: g // Reference to original ghost
            }));

        if (ghostEntities.length === 0) {
            return null;
        }

        // Use decoupled collision engine
        const pacmanEntity = {
            id: pacman.id,
            x: pacman.x,
            y: pacman.y,
            prevX: pacman.prevX ?? pacman.x,
            prevY: pacman.prevY ?? pacman.y
        };

        const collisions = this.collisionEngine.getAllEntityCollisions(
            pacmanEntity,
            ghostEntities,
            { collisionRadius: gameConfig.tileSize * 0.6 }
        );

        if (collisions.length === 0) {
            return null;
        }

        // Get the first collision
        const collision = collisions[0];
        const ghost = collision.entityB.ghost;

        this.stats.checksPerformed++;
        this.stats.collisionsDetected++;

        return this.handleGhostCollision(ghost);
    }

    /**
     * Handle ghost collision result
     * @param {GhostState} ghost - Ghost that collided
     * @returns {Object}
     */
    handleGhostCollision(ghost) {
        if (ghost.isFrightened) {
            // Increment combo counter
            this.gameModel.currentComboGhosts++;

            // Calculate score based on current combo
            const scoreIndex = Math.min(this.gameModel.currentComboGhosts - 1, 3);
            const scores = [200, 400, 800, 1600];
            const score = scores[scoreIndex];

            // Mark ghost as eaten
            ghost.eat();

            return {
                type: 'ghost_eaten',
                ghostType: ghost.ghostType,
                score: score,
                combo: this.gameModel.currentComboGhosts
            };
        } else {
            // Pacman dies
            return {
                type: 'pacman_died',
                livesRemaining: this.gameModel.lives
            };
        }
    }

    /**
     * Check fruit collision
     * @returns {Object|null}
     */
    checkFruitCollision() {
        const fruit = this.gameModel.fruit;

        if (!fruit.active) {
            return null;
        }

        const pacman = this.gameModel.pacman;

        // Use decoupled collision engine for point collision
        const result = this.collisionEngine.checkPointCollision(
            pacman,
            fruit.x,
            fruit.y,
            { collisionRadius: gameConfig.tileSize }
        );

        if (!result) {
            return null;
        }

        // Get score from fruit (marks as eaten)
        const score = fruit.eat();

        this.stats.checksPerformed++;
        this.stats.collisionsDetected++;

        return {
            type: 'fruit_eaten',
            score: score,
            fruitType: fruit.getFruitType().name
        };
    }

    /**
     * Reset collision system state
     */
    reset() {
        this.lastPelletGrid = { x: null, y: null };
        this.collisionEngine.clear();
        this.stats = {
            checksPerformed: 0,
            collisionsDetected: 0
        };
    }

    /**
     * Get collision statistics for debugging
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            lastPelletGrid: { ...this.lastPelletGrid },
            engineStats: this.collisionEngine.getStats()
        };
    }
}

/**
 * Factory function to create collision adapter
 * @param {GameModel} gameModel - Game model instance
 * @returns {CollisionAdapter}
 */
export function createCollisionAdapter(gameModel) {
    return new CollisionAdapter(gameModel);
}
