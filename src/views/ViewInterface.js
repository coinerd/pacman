/**
 * ViewInterface
 * Interface definition for View-Model communication
 * Ensures View only receives data through well-defined interfaces
 */

/**
 * GameSnapshot - Complete read-only snapshot of game state
 * Passed from Model to View each frame
 */
export class GameSnapshot {
    constructor(data) {
        // Read-only state
        Object.freeze(this._data = {
            // Game flow
            level: data.level,
            score: data.score,
            lives: data.lives,
            highScore: data.highScore,
            isPaused: data.isPaused,
            isGameOver: data.isGameOver,
            isDying: data.isDying,
            levelComplete: data.levelComplete,

            // Maze state
            maze: data.maze || null,
            pelletGrid: data.pelletGrid || [],
            pelletsRemaining: data.pelletsRemaining,
            totalPellets: data.totalPellets,

            // Entity states (immutable snapshots)
            pacman: data.pacman || null,
            ghosts: Object.freeze([...(data.ghosts || [])]),
            fruit: data.fruit || null,

            // Advanced features
            boss: data.boss || null,
            powerUps: Object.freeze([...(data.powerUps || [])]),
            story: data.story || null,

            // Debug info
            tickCount: data.tickCount || 0
        });
    }

    // Getters for read-only access
    get level() { return this._data.level; }
    get score() { return this._data.score; }
    get lives() { return this._data.lives; }
    get highScore() { return this._data.highScore; }
    get isPaused() { return this._data.isPaused; }
    get isGameOver() { return this._data.isGameOver; }
    get isDying() { return this._data.isDying; }
    get levelComplete() { return this._data.levelComplete; }

    get maze() { return this._data.maze; }
    get pelletGrid() { return this._data.pelletGrid; }
    get pelletsRemaining() { return this._data.pelletsRemaining; }
    get totalPellets() { return this._data.totalPellets; }

    get pacman() { return this._data.pacman; }
    get ghosts() { return this._data.ghosts; }
    get fruit() { return this._data.fruit; }

    get boss() { return this._data.boss; }
    get powerUps() { return this._data.powerUps; }
    get story() { return this._data.story; }

    get tickCount() { return this._data.tickCount; }

    /**
     * Check if pellet exists at position
     */
    hasPelletAt(gridX, gridY) {
        if (gridY < 0 || gridY >= this._data.pelletGrid.length) {
            return false;
        }
        if (gridX < 0 || gridX >= this._data.pelletGrid[0].length) {
            return false;
        }
        return this._data.pelletGrid[gridY][gridX] !== 0;
    }

    /**
     * Get ghost by type
     */
    getGhost(ghostType) {
        return this._data.ghosts.find(g => g.ghostType === ghostType) || null;
    }

    /**
     * Clone snapshot (immutable)
     */
    clone() {
        return new GameSnapshot({ ...this._data });
    }
}

/**
 * ViewContext - Context passed to View during initialization
 * Contains only necessary dependencies, not the entire GameModel
 */
export class ViewContext {
    constructor({ scene, storageManager, eventBus }) {
        this.scene = scene;
        this.storageManager = storageManager;
        this.eventBus = eventBus;
        this.config = {
            tileSize: 20
            // Add other config as needed
        };
    }
}

/**
 * ViewState - Internal view state managed by View only
 * Not shared with Model or Controller
 */
export class ViewState {
    constructor() {
        // Visual entities mapping
        this.visualEntities = new Map(); // id -> visual object

        // Pellet visibility tracking
        this.visiblePellets = new Set(); // Set of "x,y" strings

        // Animation states
        this.isAnimatingDeath = false;
        this.animationQueue = [];

        // Performance tracking
        this.lastSyncTime = 0;
        this.frameCount = 0;
    }

    /**
     * Add visual entity
     */
    addVisual(id, visual) {
        this.visualEntities.set(id, visual);
    }

    /**
     * Get visual entity
     */
    getVisual(id) {
        return this.visualEntities.get(id);
    }

    /**
     * Remove visual entity
     */
    removeVisual(id) {
        const visual = this.visualEntities.get(id);
        if (visual) {
            visual.destroy?.();
            this.visualEntities.delete(id);
        }
    }

    /**
     * Update pellet visibility
     */
    updatePelletVisibility(pelletKeys, shouldShow) {
        if (shouldShow) {
            pelletKeys.forEach(key => this.visiblePellets.add(key));
        } else {
            pelletKeys.forEach(key => this.visiblePellets.delete(key));
        }
    }

    /**
     * Check if pellet is visible
     */
    isPelletVisible(gridX, gridY) {
        return this.visiblePellets.has(`${gridX},${gridY}`);
    }

    /**
     * Clear all visual entities
     */
    clear() {
        this.visualEntities.forEach(visual => visual.destroy?.());
        this.visualEntities.clear();
        this.visiblePellets.clear();
        this.animationQueue = [];
    }
}
