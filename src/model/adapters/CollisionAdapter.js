/**
 * CollisionAdapter
 * Bridges decoupled CollisionEngine with existing GameModel.
 * Maintains backward compatibility while using the new pure collision system.
 * Includes tunnel-aware collision detection for warp tunnel scenarios.
 */

import { CollisionEngine } from '../../collision/CollisionEngine.js';
import { gameConfig, scoreValues } from '../../config/gameConfig.js';
import { PELLET_TYPES } from '../../utils/MazeLayout.js';
import { isWarping } from '../../utils/WarpTunnel.js';

export class CollisionAdapter {
    /**
     * @param {GameModel} gameModel - The game model to adapt for
     */
    constructor(gameModel) {
        this.gameModel = gameModel;

        // Initialize decoupled collision engine
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

        const pelletEvents = this.checkPelletCollision();
        events.push(...pelletEvents);

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
     * @returns {Array<Object>} - Array of collision events (0, 1, or 2 events)
     */
    checkPelletCollision() {
        const pacman = this.gameModel.pacman;

        const gridX = Math.floor(pacman.x / gameConfig.tileSize);
        const gridY = Math.floor(pacman.y / gameConfig.tileSize);

        if (gridX === this.lastPelletGrid.x && gridY === this.lastPelletGrid.y) {
            return [];
        }

        const pelletType = this.gameModel.getPelletAt(gridX, gridY);

        if (pelletType === PELLET_TYPES.NONE) {
            return [];
        }

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
            return [];
        }

        const result = this.gameModel.eatPelletAt(gridX, gridY);

        if (!result) {
            return [];
        }

        this.lastPelletGrid = { x: gridX, y: gridY };

        const isPowerPellet = result.type === 'power_pellet';
        const score = isPowerPellet ? scoreValues.powerPellet : scoreValues.pellet;

        const pelletEvent = {
            type: isPowerPellet ? 'power_pellet_eaten' : 'pellet_eaten',
            gridX: result.gridX,
            gridY: result.gridY,
            score: score,
            pelletsRemaining: result.pelletsRemaining
        };

        if (isPowerPellet) {
            pelletEvent.frightenedDuration = this.gameModel.getFrightenedDuration();
        }

        this.stats.checksPerformed++;
        this.stats.collisionsDetected++;

        const events = [pelletEvent];
        if (result.levelComplete) {
            events.push({
                type: 'level_complete',
                score: this.gameModel.score,
                level: this.gameModel.level
            });
        }

        return events;
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

        // Check for tunnel collisions separately (warp tunnel edge case)
        const tunnelCollision = this.checkTunnelCollisions(pacman, ghostEntities);
        if (tunnelCollision) {
            this.stats.checksPerformed++;
            this.stats.collisionsDetected++;
            return this.handleGhostCollision(tunnelCollision.ghost);
        }

        // Use decoupled collision engine with adjusted positions for tunnel warping
        const adjustedPacman = this.adjustEntityForTunnel(pacman);
        const adjustedGhosts = ghostEntities.map(g => this.adjustEntityForTunnel(g));

        const collisions = this.collisionEngine.getAllEntityCollisions(
            adjustedPacman,
            adjustedGhosts,
            { collisionRadius: gameConfig.tileSize * 0.6 }
        );

        if (collisions.length === 0) {
            return null;
        }

        // Get first collision
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
     * Check for collisions in warp tunnel
     * Handles edge case where entities are on opposite sides due to tunnel wrap
     * @param {Object} pacman - Pacman entity
     * @param {Array<Object>} ghostEntities - List of ghost entities
     * @returns {Object|null} - Ghost that collided or null
     */
    checkTunnelCollisions(pacman, ghostEntities) {
        // Only check if pacman is in tunnel area
        const pacmanInTunnel = isWarping(pacman.x, pacman.y);
        if (!pacmanInTunnel) {
            return null;
        }

        const tileSize = gameConfig.tileSize;
        const collisionDist = tileSize * 0.6; // Collision radius
        const mazeWidthPx = 28 * tileSize; // 28 tiles wide

        for (const ghost of ghostEntities) {
            // Skip eaten ghosts
            if (ghost.ghost && ghost.ghost.isEaten) {
                continue;
            }

            const ghostInTunnel = isWarping(ghost.x, ghost.y);
            if (!ghostInTunnel) {
                continue;
            }

            // Calculate tunnel-aware distance
            // If entities are on opposite sides, they might be close through the wrap
            let dx = Math.abs(pacman.x - ghost.x);
            let dy = Math.abs(pacman.y - ghost.y);

            // Handle wrap-around: if distance is large, check if they're on opposite edges
            if (dx > mazeWidthPx / 2) {
                dx = mazeWidthPx - dx;
            }

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= collisionDist) {
                return ghost;
            }
        }

        return null;
    }

    /**
     * Adjust entity position for tunnel warping in collision detection
     * This prevents false positives when entities wrap around
     * @param {Object} entity - Entity with x, y, prevX, prevY
     * @returns {Object} - Adjusted entity for collision detection
     */
    adjustEntityForTunnel(entity) {
        const mazeWidthPx = 28 * gameConfig.tileSize;
        const result = {
            id: entity.id,
            x: entity.x,
            y: entity.y,
            prevX: entity.prevX ?? entity.x,
            prevY: entity.prevY ?? entity.y,
            ghost: entity.ghost // Preserve ghost reference for collision handling
        };

        // If entity wrapped from right to left (x decreased significantly)
        if (entity.prevX && entity.x < entity.prevX - mazeWidthPx / 2) {
            // Entity wrapped right to left, adjust prevX to be on the "other side"
            result.prevX = entity.prevX - mazeWidthPx;
        }
        // If entity wrapped from left to right (x increased significantly)
        else if (entity.prevX && entity.x > entity.prevX + mazeWidthPx / 2) {
            // Entity wrapped left to right, adjust prevX to be on the "other side"
            result.prevX = entity.prevX + mazeWidthPx;
        }

        return result;
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

export function createCollisionAdapter(gameModel) {
    return new CollisionAdapter(gameModel);
}
