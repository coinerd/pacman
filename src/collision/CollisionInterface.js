/**
 * Collision Interface
 * Pure interface for collision detection - NO external dependencies
 */

/**
 * Collision types for classification
 */
export const COLLISION_TYPES = {
    NONE: 'none',
    ENTITY_ENTITY: 'entity_entity',
    ENTITY_TILE: 'entity_tile',
    ENTITY_PELLET: 'entity_pellet',
    ENTITY_POWER_PELLET: 'entity_power_pellet'
};

/**
 * Collision events emitted during detection
 */
export const COLLISION_EVENTS = {
    COLLISION_DETECTED: 'collision_detected',
    PELLET_CONSUMED: 'pellet_consumed',
    POWER_PELLET_CONSUMED: 'power_pellet_consumed',
    GHOST_COLLISION: 'ghost_collision',
    GHOST_EATEN: 'ghost_eaten',
    PACMAN_DIED: 'pacman_died'
};

/**
 * Abstract base class for collision detection strategies
 * All methods are pure functions with no side effects
 */
export class CollisionInterface {
    /**
     * Check collision between two entities
     * @param {Object} entityA - First entity state (must have x, y, and optionally prevX, prevY)
     * @param {Object} entityB - Second entity state (must have x, y, and optionally prevX, prevY)
     * @param {Object} config - Collision configuration (radius, etc.)
     * @returns {Object|null} Collision result or null if no collision
     */
    checkEntityCollision(entityA, entityB, _config = {}) {
        throw new Error('CollisionInterface.checkEntityCollision() must be implemented by subclass');
    }

    /**
     * Check collision between entity and tile
     * @param {Object} entity - Entity state
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @param {Object} config - Collision configuration
     * @returns {Object|null} Collision result or null if no collision
     */
    checkTileCollision(entity, tileX, tileY, _config = {}) {
        throw new Error('CollisionInterface.checkTileCollision() must be implemented by subclass');
    }

    /**
     * Check collision between entity and point
     * @param {Object} entity - Entity state
     * @param {number} pointX - Point X coordinate
     * @param {number} pointY - Point Y coordinate
     * @param {Object} config - Collision configuration
     * @returns {Object|null} Collision result or null if no collision
     */
    checkPointCollision(entity, pointX, pointY, _config = {}) {
        throw new Error('CollisionInterface.checkPointCollision() must be implemented by subclass');
    }

    /**
     * Get all collisions for an entity against a list of other entities
     * @param {Object} entity - Entity state
     * @param {Array<Object>} others - Array of other entities
     * @param {Object} config - Collision configuration
     * @returns {Array<Object>} Array of collision results
     */
    getAllEntityCollisions(entity, others, _config = {}) {
        throw new Error('CollisionInterface.getAllEntityCollisions() must be implemented by subclass');
    }
}

/**
 * Immutable collision result object
 */
export class CollisionResult {
    /**
     * @param {string} type - Collision type from COLLISION_TYPES
     * @param {Object} entityA - First entity involved
     * @param {Object} entityB - Second entity involved (null for tile/pellet collisions)
     * @param {Object} position - Collision position {x, y}
     * @param {Object} data - Additional collision data
     * @param {Array<string>} events - Events to emit
     */
    constructor(type, entityA, entityB, position, data = {}, events = []) {
        this.type = type;
        this.entityA = entityA;
        this.entityB = entityB;
        this.position = position;
        this.data = data;
        this.events = events;
        this.timestamp = Date.now();
    }

    /**
     * Create a simple entity-entity collision result
     */
    static entityEntity(entityA, entityB, position, data = {}) {
        return new CollisionResult(
            COLLISION_TYPES.ENTITY_ENTITY,
            entityA,
            entityB,
            position,
            data,
            [COLLISION_EVENTS.COLLISION_DETECTED]
        );
    }

    /**
     * Create a pellet collision result
     */
    static pellet(entity, position, scoreValue, data = {}) {
        return new CollisionResult(
            COLLISION_TYPES.ENTITY_PELLET,
            entity,
            null,
            position,
            { score: scoreValue, ...data },
            [COLLISION_EVENTS.PELLET_CONSUMED]
        );
    }

    /**
     * Create a power pellet collision result
     */
    static powerPellet(entity, position, scoreValue, data = {}) {
        return new CollisionResult(
            COLLISION_TYPES.ENTITY_POWER_PELLET,
            entity,
            null,
            position,
            { score: scoreValue, ...data },
            [COLLISION_EVENTS.POWER_PELLET_CONSUMED]
        );
    }

    /**
     * Create a ghost collision result (Pacman dies)
     */
    static pacmanDied(pacman, ghost, position) {
        return new CollisionResult(
            COLLISION_TYPES.ENTITY_ENTITY,
            pacman,
            ghost,
            position,
            { type: 'pacman_died', score: 0 },
            [COLLISION_EVENTS.PACMAN_DIED]
        );
    }

    /**
     * Create a ghost eaten result (Pacman eats ghost)
     */
    static ghostEaten(pacman, ghost, position, scoreValue) {
        return new CollisionResult(
            COLLISION_TYPES.ENTITY_ENTITY,
            pacman,
            ghost,
            position,
            { type: 'ghost_eaten', score: scoreValue },
            [COLLISION_EVENTS.GHOST_EATEN]
        );
    }
}
