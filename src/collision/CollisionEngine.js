/**
 * Collision Engine
 * Pure collision detection with no game logic dependencies
 * Uses spatial indexing for efficient entity-entity collision detection
 */

import { CollisionInterface, CollisionResult, COLLISION_TYPES } from './CollisionInterface.js';
import { Capsule, AABB, distanceSquared } from './shapes/CollisionShapes.js';
import { SpatialIndex } from './spatial/SpatialIndex.js';

/**
 * Main collision engine implementing CollisionInterface
 * Provides efficient collision detection using spatial indexing and swept capsules
 */
export class CollisionEngine extends CollisionInterface {
    /**
     * @param {Object} config - Engine configuration
     * @param {number} config.cellSize - Spatial index cell size (default 20)
     * @param {number} config.collisionRadius - Default collision radius (default 12)
     * @param {boolean} config.useSpatialIndex - Whether to use spatial indexing (default true)
     */
    constructor(config = {}) {
        super();
        this.cellSize = config.cellSize || 20;
        this.collisionRadius = config.collisionRadius || 12;
        this.useSpatialIndex = config.useSpatialIndex !== false;
        this.spatialIndex = this.useSpatialIndex ? new SpatialIndex(this.cellSize) : null;

        // Statistics
        this.stats = {
            totalChecks: 0,
            collisionsFound: 0,
            spatialQueries: 0
        };
    }

    /**
     * Check collision between two entities using swept capsule detection
     * @param {Object} entityA - First entity (needs x, y, optionally prevX, prevY, id)
     * @param {Object} entityB - Second entity (needs x, y, optionally prevX, prevY, id)
     * @param {Object} config - Override config for this check
     * @returns {CollisionResult|null} Collision result or null
     */
    checkEntityCollision(entityA, entityB, config = {}) {
        this.stats.totalChecks++;

        const radius = config.collisionRadius || this.collisionRadius;

        // Quick AABB rejection test
        const boundsA = this.getEntityBounds(entityA, radius);
        const boundsB = this.getEntityBounds(entityB, radius);

        if (!this.boundsIntersect(boundsA, boundsB)) {
            return null;
        }

        // Create capsules for swept collision detection
        const capsuleA = Capsule.fromEntity(entityA, radius);
        const capsuleB = Capsule.fromEntity(entityB, radius);

        if (capsuleA.intersects(capsuleB)) {
            this.stats.collisionsFound++;

            const position = {
                x: (entityA.x + entityB.x) / 2,
                y: (entityA.y + entityB.y) / 2
            };

            return CollisionResult.entityEntity(entityA, entityB, position, {
                radius,
                swept: true
            });
        }

        return null;
    }

    /**
     * Check collision between entity and tile
     * @param {Object} entity - Entity state
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @param {Object} config - Collision config (tileSize)
     * @returns {CollisionResult|null}
     */
    checkTileCollision(entity, tileX, tileY, config = {}) {
        this.stats.totalChecks++;

        const tileSize = config.tileSize || this.cellSize;
        const radius = config.collisionRadius || this.collisionRadius;

        // Create AABB for tile
        const tileAABB = new AABB(
            tileX * tileSize,
            tileY * tileSize,
            (tileX + 1) * tileSize,
            (tileY + 1) * tileSize
        );

        // Create capsule for entity
        const capsule = Capsule.fromEntity(entity, radius);

        if (capsule.intersects(tileAABB)) {
            this.stats.collisionsFound++;

            const position = {
                x: (entity.x + tileAABB.getCenter().x) / 2,
                y: (entity.y + tileAABB.getCenter().y) / 2
            };

            return new CollisionResult(
                COLLISION_TYPES.ENTITY_TILE,
                entity,
                null,
                position,
                { tileX, tileY, tileSize }
            );
        }

        return null;
    }

    /**
     * Check collision between entity and point
     * @param {Object} entity - Entity state
     * @param {number} pointX - Point X coordinate
     * @param {number} pointY - Point Y coordinate
     * @param {Object} config - Collision config
     * @returns {CollisionResult|null}
     */
    checkPointCollision(entity, pointX, pointY, config = {}) {
        this.stats.totalChecks++;

        const radius = config.collisionRadius || this.collisionRadius;
        const distSq = distanceSquared(entity.x, entity.y, pointX, pointY);

        if (distSq <= radius * radius) {
            this.stats.collisionsFound++;

            return new CollisionResult(
                COLLISION_TYPES.ENTITY_ENTITY,
                entity,
                null,
                { x: pointX, y: pointY },
                { pointCollision: true }
            );
        }

        return null;
    }

    /**
     * Get all collisions for an entity against a list of other entities
     * @param {Object} entity - Entity to check
     * @param {Array<Object>} others - Other entities to check against
     * @param {Object} config - Collision config
     * @returns {Array<CollisionResult>}
     */
    getAllEntityCollisions(entity, others, config = {}) {
        const collisions = [];

        for (const other of others) {
            // Skip self-collision
            if (other.id !== undefined && entity.id !== undefined && other.id === entity.id) {
                continue;
            }

            const collision = this.checkEntityCollision(entity, other, config);
            if (collision) {
                collisions.push(collision);
            }
        }

        return collisions;
    }

    /**
     * Check all collisions between entities using spatial indexing
     * @param {Array<Object>} entities - All entities to check
     * @param {Object} config - Collision config
     * @returns {Array<CollisionResult>}
     */
    checkAllEntityCollisions(entities, config = {}) {
        const collisions = [];
        const radius = config.collisionRadius || this.collisionRadius;

        if (this.useSpatialIndex && this.spatialIndex) {
            // Build spatial index
            this.spatialIndex.clear();
            for (const entity of entities) {
                this.spatialIndex.insert(entity);
            }

            // Check collisions using spatial index
            for (const entity of entities) {
                const nearby = this.spatialIndex.query(entity.x, entity.y, radius * 2);

                for (const other of nearby) {
                    // Avoid duplicate checks - only check if other.id > entity.id
                    if (other.id !== undefined && entity.id !== undefined) {
                        if (other.id <= entity.id) {
                            continue;
                        }
                    }

                    const collision = this.checkEntityCollision(entity, other, config);
                    if (collision) {
                        collisions.push(collision);
                    }
                }
            }
        } else {
            // Brute force check
            for (let i = 0; i < entities.length; i++) {
                for (let j = i + 1; j < entities.length; j++) {
                    const collision = this.checkEntityCollision(entities[i], entities[j], config);
                    if (collision) {
                        collisions.push(collision);
                    }
                }
            }
        }

        return collisions;
    }

    /**
     * Check pellet collisions for an entity
     * @param {Object} entity - Entity (typically Pacman)
     * @param {Object} pelletGrid - Grid of pellet positions
     * @param {Object} config - Config with tileSize, onPelletFound callback
     * @returns {Array<CollisionResult>}
     */
    checkPelletCollisions(entity, pelletGrid, config = {}) {
        const collisions = [];
        const tileSize = config.tileSize || this.cellSize;

        // Get entity's grid position
        const gridX = Math.floor(entity.x / tileSize);
        const gridY = Math.floor(entity.y / tileSize);

        // Check current tile and neighboring tiles
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const checkX = gridX + dx;
                const checkY = gridY + dy;

                if (this.isValidPelletPosition(pelletGrid, checkX, checkY)) {
                    const pelletType = pelletGrid[checkY][checkX];

                    if (pelletType && pelletType !== 0) {
                        const tileCenterX = checkX * tileSize + tileSize / 2;
                        const tileCenterY = checkY * tileSize + tileSize / 2;

                        // Check if entity is close enough to pellet center
                        const distSq = distanceSquared(
                            entity.x, entity.y,
                            tileCenterX, tileCenterY
                        );

                        const eatRadius = config.eatRadius || tileSize * 0.5;

                        if (distSq <= eatRadius * eatRadius) {
                            // Determine pellet type and create result
                            const isPowerPellet = pelletType === 2 || pelletType === 'power';
                            const score = isPowerPellet ?
                                (config.powerPelletScore || 50) :
                                (config.pelletScore || 10);

                            const result = isPowerPellet ?
                                CollisionResult.powerPellet(entity, { x: tileCenterX, y: tileCenterY }, score, {
                                    gridX: checkX,
                                    gridY: checkY
                                }) :
                                CollisionResult.pellet(entity, { x: tileCenterX, y: tileCenterY }, score, {
                                    gridX: checkX,
                                    gridY: checkY
                                });

                            collisions.push(result);

                            // Call callback if provided
                            if (config.onPelletFound) {
                                config.onPelletFound(checkX, checkY, pelletType, result);
                            }
                        }
                    }
                }
            }
        }

        return collisions;
    }

    /**
     * Check if pellet position is valid in grid
     * @param {Object} pelletGrid - 2D array of pellets
     * @param {number} x - Grid X
     * @param {number} y - Grid Y
     * @returns {boolean}
     */
    isValidPelletPosition(pelletGrid, x, y) {
        if (!pelletGrid || !Array.isArray(pelletGrid)) {
            return false;
        }
        if (y < 0 || y >= pelletGrid.length) {
            return false;
        }
        if (x < 0 || x >= pelletGrid[y].length) {
            return false;
        }
        return true;
    }

    /**
     * Get the bounding box for an entity with radius
     * @param {Object} entity - Entity with x, y
     * @param {number} radius - Collision radius
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
     */
    getEntityBounds(entity, radius) {
        const prevX = entity.prevX ?? entity.x;
        const prevY = entity.prevY ?? entity.y;

        return {
            minX: Math.min(prevX, entity.x) - radius,
            minY: Math.min(prevY, entity.y) - radius,
            maxX: Math.max(prevX, entity.x) + radius,
            maxY: Math.max(prevY, entity.y) + radius
        };
    }

    /**
     * Check if two bounding boxes intersect
     * @param {Object} a - First bounds
     * @param {Object} b - Second bounds
     * @returns {boolean}
     */
    boundsIntersect(a, b) {
        return a.minX <= b.maxX && a.maxX >= b.minX &&
               a.minY <= b.maxY && a.maxY >= b.minY;
    }

    /**
     * Get collision statistics
     * @returns {Object} Stats object
     */
    getStats() {
        const spatialStats = this.spatialIndex ? this.spatialIndex.getStats() : null;
        return {
            ...this.stats,
            spatialIndex: spatialStats
        };
    }

    /**
     * Reset collision statistics
     */
    resetStats() {
        this.stats = {
            totalChecks: 0,
            collisionsFound: 0,
            spatialQueries: 0
        };
    }

    /**
     * Clear the spatial index
     */
    clear() {
        if (this.spatialIndex) {
            this.spatialIndex.clear();
        }
    }
}

/**
 * Simple collision detector without spatial indexing
 * Useful for small entity counts or testing
 */
export class SimpleCollisionDetector extends CollisionInterface {
    /**
     * @param {Object} config - Configuration
     * @param {number} config.collisionRadius - Default collision radius
     */
    constructor(config = {}) {
        super();
        this.collisionRadius = config.collisionRadius || 12;
    }

    checkEntityCollision(entityA, entityB, config = {}) {
        const radius = config.collisionRadius || this.collisionRadius;
        const capsuleA = Capsule.fromEntity(entityA, radius);
        const capsuleB = Capsule.fromEntity(entityB, radius);

        if (capsuleA.intersects(capsuleB)) {
            return CollisionResult.entityEntity(entityA, entityB, {
                x: (entityA.x + entityB.x) / 2,
                y: (entityA.y + entityB.y) / 2
            });
        }
        return null;
    }

    checkTileCollision(entity, tileX, tileY, config = {}) {
        const tileSize = config.tileSize || 20;
        const radius = config.collisionRadius || this.collisionRadius;

        const tileAABB = new AABB(
            tileX * tileSize,
            tileY * tileSize,
            (tileX + 1) * tileSize,
            (tileY + 1) * tileSize
        );

        const capsule = Capsule.fromEntity(entity, radius);

        if (capsule.intersects(tileAABB)) {
            return new CollisionResult(
                COLLISION_TYPES.ENTITY_TILE,
                entity,
                null,
                { x: entity.x, y: entity.y },
                { tileX, tileY }
            );
        }
        return null;
    }

    checkPointCollision(entity, pointX, pointY, config = {}) {
        const radius = config.collisionRadius || this.collisionRadius;
        const distSq = distanceSquared(entity.x, entity.y, pointX, pointY);

        if (distSq <= radius * radius) {
            return new CollisionResult(
                COLLISION_TYPES.ENTITY_ENTITY,
                entity,
                null,
                { x: pointX, y: pointY }
            );
        }
        return null;
    }

    getAllEntityCollisions(entity, others, config = {}) {
        const collisions = [];
        for (const other of others) {
            if (other.id !== undefined && entity.id !== undefined && other.id === entity.id) {
                continue;
            }
            const collision = this.checkEntityCollision(entity, other, config);
            if (collision) {
                collisions.push(collision);
            }
        }
        return collisions;
    }
}
