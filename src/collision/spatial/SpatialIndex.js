/**
 * Spatial Index
 * Efficient spatial queries for collision detection using uniform grid
 * No external dependencies - completely self-contained
 */

/**
 * Uniform grid spatial index for fast nearest-neighbor queries
 */
export class SpatialIndex {
    /**
     * @param {number} cellSize - Size of each grid cell (default 20)
     */
    constructor(cellSize = 20) {
        this.cellSize = cellSize;
        this.cells = new Map();
        this.entityCells = new Map(); // Track which cell each entity is in
    }

    /**
     * Clear all entities from the spatial index
     */
    clear() {
        this.cells.clear();
        this.entityCells.clear();
    }

    /**
     * Get the cell key for a position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {string} Cell key in format "x,y"
     */
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    /**
     * Get the cell coordinates for a position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {{x: number, y: number}} Cell coordinates
     */
    getCellCoords(x, y) {
        return {
            x: Math.floor(x / this.cellSize),
            y: Math.floor(y / this.cellSize)
        };
    }

    /**
     * Insert an entity into the spatial index
     * @param {Object} entity - Entity with x, y properties and optionally id
     */
    insert(entity) {
        if (entity.x === undefined || entity.y === undefined) {
            return;
        }

        const key = this.getCellKey(entity.x, entity.y);

        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }

        this.cells.get(key).push(entity);

        // Track which cell this entity is in
        if (entity.id !== undefined) {
            this.entityCells.set(entity.id, key);
        }
    }

    /**
     * Remove an entity from the spatial index
     * @param {Object} entity - Entity to remove
     */
    remove(entity) {
        if (entity.id === undefined) {
            return;
        }

        const key = this.entityCells.get(entity.id);
        if (!key) {
            return;
        }

        const cell = this.cells.get(key);
        if (cell) {
            const index = cell.findIndex(e => e.id === entity.id);
            if (index !== -1) {
                cell.splice(index, 1);
            }
        }

        this.entityCells.delete(entity.id);
    }

    /**
     * Update an entity's position in the spatial index
     * @param {Object} entity - Entity with updated position
     */
    update(entity) {
        if (entity.id === undefined || entity.x === undefined || entity.y === undefined) {
            return;
        }

        const currentKey = this.entityCells.get(entity.id);
        const newKey = this.getCellKey(entity.x, entity.y);

        if (currentKey !== newKey) {
            // Remove from old cell
            if (currentKey) {
                const oldCell = this.cells.get(currentKey);
                if (oldCell) {
                    const index = oldCell.findIndex(e => e.id === entity.id);
                    if (index !== -1) {
                        oldCell.splice(index, 1);
                    }
                    // Remove empty cell
                    if (oldCell.length === 0) {
                        this.cells.delete(currentKey);
                    }
                }
                this.entityCells.delete(entity.id);
            }
            // Insert into new cell
            this.insert(entity);
        }
    }

    /**
     * Query entities near a position within a radius
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Search radius
     * @returns {Array<Object>} Nearby entities
     */
    query(x, y, radius) {
        const results = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCell = this.getCellCoords(x, y);

        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const key = `${centerCell.x + dx},${centerCell.y + dy}`;
                const cell = this.cells.get(key);
                if (cell) {
                    // Filter by actual distance
                    for (const entity of cell) {
                        const dist = Math.sqrt(
                            Math.pow(entity.x - x, 2) +
                            Math.pow(entity.y - y, 2)
                        );
                        if (dist <= radius) {
                            results.push(entity);
                        }
                    }
                }
            }
        }

        return results;
    }

    /**
     * Query entities in a rectangular region
     * @param {number} minX - Minimum X coordinate
     * @param {number} minY - Minimum Y coordinate
     * @param {number} maxX - Maximum X coordinate
     * @param {number} maxY - Maximum Y coordinate
     * @returns {Array<Object>} Entities in the region
     */
    queryRect(minX, minY, maxX, maxY) {
        const results = [];
        const minCell = this.getCellCoords(minX, minY);
        const maxCell = this.getCellCoords(maxX, maxY);

        for (let cx = minCell.x; cx <= maxCell.x; cx++) {
            for (let cy = minCell.y; cy <= maxCell.y; cy++) {
                const key = `${cx},${cy}`;
                const cell = this.cells.get(key);
                if (cell) {
                    for (const entity of cell) {
                        if (entity.x >= minX && entity.x <= maxX &&
                            entity.y >= minY && entity.y <= maxY) {
                            results.push(entity);
                        }
                    }
                }
            }
        }

        return results;
    }

    /**
     * Get all entities in the spatial index
     * @returns {Array<Object>} All entities
     */
    getAll() {
        const results = [];
        for (const cell of this.cells.values()) {
            results.push(...cell);
        }
        return results;
    }

    /**
     * Get the number of entities in the spatial index
     * @returns {number} Entity count
     */
    getCount() {
        let count = 0;
        for (const cell of this.cells.values()) {
            count += cell.length;
        }
        return count;
    }

    /**
     * Get statistics about the spatial index
     * @returns {{cellCount: number, entityCount: number, avgEntitiesPerCell: number}}
     */
    getStats() {
        const cellCount = this.cells.size;
        const entityCount = this.getCount();
        return {
            cellCount,
            entityCount,
            avgEntitiesPerCell: cellCount > 0 ? entityCount / cellCount : 0
        };
    }
}

/**
 * Dynamic spatial index that automatically updates entity positions
 */
export class DynamicSpatialIndex extends SpatialIndex {
    /**
     * @param {number} cellSize - Size of each grid cell
     */
    constructor(cellSize = 20) {
        super(cellSize);
        this.trackedEntities = new Set();
    }

    /**
     * Start tracking an entity
     * @param {Object} entity - Entity to track
     */
    track(entity) {
        if (entity.id === undefined) {
            throw new Error('Entity must have an id to be tracked');
        }
        this.trackedEntities.add(entity.id);
        this.insert(entity);
    }

    /**
     * Stop tracking an entity
     * @param {Object} entity - Entity to stop tracking
     */
    untrack(entity) {
        this.trackedEntities.delete(entity.id);
        this.remove(entity);
    }

    /**
     * Update all tracked entities
     */
    updateAll() {
        for (const entityId of this.trackedEntities) {
            // Find entity in cells and update
            for (const [_key, cell] of this.cells) {
                const entity = cell.find(e => e.id === entityId);
                if (entity) {
                    this.update(entity);
                    break;
                }
            }
        }
    }

    /**
     * Clear all tracked entities and cells
     */
    clear() {
        super.clear();
        this.trackedEntities.clear();
    }
}
