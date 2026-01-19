import { collisionConfig, scoreValues } from '../config/gameConfig.js';
import {
    pixelToGrid,
    countPellets,
    getPelletType,
    consumePelletAt,
    PELLET_TYPES
} from '../utils/MazeLayout.js';
import { capsuleCollision } from '../utils/CollisionUtils.js';
import { DebugLogger } from '../utils/DebugLogger.js';


export class CollisionSystem {
    /**
     * Collision System
     * Manages collision detection between Pacman, ghosts, and pellets
     */
    /**
     * Creates a new CollisionSystem instance
     * @param {Phaser.Scene} scene - The scene this collision system belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.pacman = null;
        this.ghosts = [];
        this.maze = null;
        this.pelletGrid = null;
        this.pelletSprites = [];
        this.powerPelletSprites = [];
        this.pelletPool = null;
        this.powerPelletPool = null;
        this.ghostsEatenCount = 0;
        this.debugLogger = DebugLogger.getInstance();
        this.totalPellets = null;
        this.pelletsRemaining = null;
        this.lastPelletGrid = { x: null, y: null };
        this.lastCollisionMs = 0;
        this.lastPelletCollisionMs = 0;
        this.lastGhostCollisionMs = 0;
        this.lastCollisionChecks = { pellets: 0, ghosts: 0 };
        this.collisionAvgMs = 0;
        this.collisionBudgetMs = collisionConfig.budgetMs ?? 1;
        this.budgetCooldownMs = collisionConfig.warnCooldownMs ?? 1000;
        this.budgetEmaAlpha = collisionConfig.emaAlpha ?? 0.2;
        this.lastBudgetWarning = 0;
    }

    /**
     * Sets the Pacman entity for collision detection
     * @param {Pacman} pacman - The Pacman entity
     */
    setPacman(pacman) {
        this.pacman = pacman;
    }

    /**
     * Sets the ghost entities for collision detection
     * @param {Ghost[]} ghosts - Array of ghost entities
     */
    setGhosts(ghosts) {
        this.ghosts = ghosts;
    }

    /**
     * Sets the maze layout for collision detection
     * @param {Array<Array<number>>} maze - The maze grid
     */
    setMaze(maze) {
        this.maze = maze;
    }

    setPelletGrid(pelletGrid) {
        this.pelletGrid = pelletGrid;
    }

    setPelletCounts(totalPellets) {
        this.totalPellets = totalPellets;
        this.pelletsRemaining = totalPellets;
        this.lastPelletGrid = { x: null, y: null };
    }

    getPelletsRemaining() {
        return this.pelletsRemaining;
    }

    /**
     * Sets the pellet and power pellet sprites for collision detection
     * @param {Array} pelletSprites - Array of pellet sprites
     * @param {Array} powerPelletSprites - Array of power pellet sprites
     */
    setPelletSprites(pelletSprites, powerPelletSprites) {
        this.pelletSprites = pelletSprites;
        this.powerPelletSprites = powerPelletSprites;
    }

    /**
     * Sets the pellet pool for sprite management
     * @param {Object} pelletPool - The pellet pool object
     */
    setPelletPool(pelletPool) {
        this.pelletPool = pelletPool;
    }

    /**
     * Sets the power pellet pool for sprite management
     * @param {Object} powerPelletPool - The power pellet pool object
     */
    setPowerPelletPool(powerPelletPool) {
        this.powerPelletPool = powerPelletPool;
    }

    /**
     * Checks and handles collision between Pacman and regular pellets
     * @param {Object} snapshot - Collision snapshot
     * @returns {number} Score value if collision occurred, 0 otherwise
     */
    checkPelletCollision(snapshot) {
        const result = this.checkPelletTileCollision(snapshot, {
            allowPellet: true,
            allowPowerPellet: false,
            bypassRepeatCheck: true
        });

        return result.pelletScore;
    }

    /**
     * Checks and handles collision between Pacman and power pellets
     * @param {Object} snapshot - Collision snapshot
     * @returns {number} Score value if collision occurred, 0 otherwise
     */
    checkPowerPelletCollision(snapshot) {
        const result = this.checkPelletTileCollision(snapshot, {
            allowPellet: false,
            allowPowerPellet: true,
            bypassRepeatCheck: true
        });

        return result.powerPelletScore;
    }

    /**
     * Checks and handles collision between Pacman and ghosts
     * @returns {{type: string, score: number}|null} Collision result object or null if no collision
     */
    checkGhostCollision(snapshot) {
        const resolvedSnapshot = snapshot ?? this.createCollisionSnapshot();
        if (!resolvedSnapshot?.pacman) {
            return null;
        }

        for (const ghostSnapshot of resolvedSnapshot.ghosts) {
            const ghost = ghostSnapshot.ghost;
            if (ghost.isEaten) {continue;}

            if (!ghost || ghost.x === undefined || ghost.y === undefined) {
                continue;
            }

            if (this.checkCapsuleCollision(resolvedSnapshot.pacman, ghostSnapshot)) {
                return this.handleGhostCollisionWithLogging(ghost, 'capsule', resolvedSnapshot.pacman, ghostSnapshot);
            }
        }

        return null;
    }

    /**
     * Checks all collisions (pellets, power pellets, ghosts)
     * @returns {{pelletScore: number, powerPelletScore: number, ghostCollision: object|null}} Results object containing all collision results
     */
    checkAllCollisions() {
        const snapshot = this.createCollisionSnapshot();
        const startTime = getCollisionNow();
        const pelletStart = getCollisionNow();
        const pelletCheckResult = this.checkPelletTileCollision(snapshot, {
            allowPellet: true,
            allowPowerPellet: true,
            bypassRepeatCheck: false
        });
        const pelletMs = getCollisionNow() - pelletStart;
        const ghostStart = getCollisionNow();
        const ghostCollision = this.checkGhostCollision(snapshot);
        const ghostMs = getCollisionNow() - ghostStart;

        const elapsedMs = getCollisionNow() - startTime;
        this.lastCollisionMs = elapsedMs;
        this.lastPelletCollisionMs = pelletMs;
        this.lastGhostCollisionMs = ghostMs;
        this.collisionAvgMs = this.collisionAvgMs === 0
            ? elapsedMs
            : (this.collisionAvgMs * (1 - this.budgetEmaAlpha)) + (elapsedMs * this.budgetEmaAlpha);
        this.lastCollisionChecks = {
            pellets: snapshot?.pacman ? 1 : 0,
            ghosts: snapshot?.ghosts?.length || 0
        };

        if (this.collisionAvgMs > this.collisionBudgetMs) {
            const now = Date.now();
            if (now - this.lastBudgetWarning > this.budgetCooldownMs) {
                console.warn(
                    `[CollisionSystem] Collision checks exceeded budget: ${elapsedMs.toFixed(2)}ms (avg ${this.collisionAvgMs.toFixed(2)}ms)`
                );
                this.lastBudgetWarning = now;
            }
        }

        const results = {
            pelletScore: pelletCheckResult.pelletScore,
            powerPelletScore: pelletCheckResult.powerPelletScore,
            ghostCollision: ghostCollision,
            pelletsConsumed: pelletCheckResult.pelletsConsumed
        };

        return results;
    }

    /**
     * Handles ghost collision
     * @param {Ghost} ghost - The ghost entity
     * @returns {{type: string, score: number}|null} Collision result object or null if no collision
     */
    handleGhostCollision(ghost) {
        if (ghost.isFrightened) {
            ghost.eat();
            this.ghostsEatenCount++;
            const scoreIndex = Math.min(this.ghostsEatenCount - 1, scoreValues.ghost.length - 1);
            return {
                type: 'ghost_eaten',
                score: scoreValues.ghost[scoreIndex]
            };
        } else {
            return {
                type: 'pacman_died',
                score: 0
            };
        }
    }

    /**
     * Checks collision using a swept capsule test
     * @param {Pacman} pacman - The Pacman entity
     * @param {Ghost} ghost - The ghost entity
     * @returns {boolean} True if collision detected, false otherwise
     */
    checkCapsuleCollision(pacmanSnapshot, ghostSnapshot) {
        const pacmanPrevX = pacmanSnapshot.prevX ?? pacmanSnapshot.x;
        const pacmanPrevY = pacmanSnapshot.prevY ?? pacmanSnapshot.y;
        const ghostPrevX = ghostSnapshot.prevX ?? ghostSnapshot.x;
        const ghostPrevY = ghostSnapshot.prevY ?? ghostSnapshot.y;

        return capsuleCollision(
            pacmanPrevX, pacmanPrevY, pacmanSnapshot.x, pacmanSnapshot.y,
            ghostPrevX, ghostPrevY, ghostSnapshot.x, ghostSnapshot.y,
            collisionConfig.radius
        );
    }

    /**
     * Handles ghost collision with debug logging
     * @param {Ghost} ghost - The ghost entity
     * @param {string} method - The collision method used
     * @returns {{type: string, score: number}|null} Collision result object
     */
    handleGhostCollisionWithLogging(ghost, method, pacmanSnapshot, ghostSnapshot) {
        const result = this.handleGhostCollision(ghost);

        const logData = {
            timestamp: new Date().toISOString(),
            type: 'ghost_collision_check',
            method: method,
            pacman: {
                x: Math.round(pacmanSnapshot.x),
                y: Math.round(pacmanSnapshot.y),
                prevX: pacmanSnapshot.prevX !== undefined ? Math.round(pacmanSnapshot.prevX) : undefined,
                prevY: pacmanSnapshot.prevY !== undefined ? Math.round(pacmanSnapshot.prevY) : undefined
            },
            ghost: {
                x: Math.round(ghostSnapshot.x),
                y: Math.round(ghostSnapshot.y),
                prevX: ghostSnapshot.prevX !== undefined ? Math.round(ghostSnapshot.prevX) : undefined,
                prevY: ghostSnapshot.prevY !== undefined ? Math.round(ghostSnapshot.prevY) : undefined,
                name: ghost.name || 'Unknown',
                isFrightened: ghost.isFrightened
            },
            collision: true,
            result: result
        };

        if (this.debugLogger.enabled) {
            console.log(JSON.stringify(logData, null, 2));
        }

        return result;
    }

    /**
     * Checks if the win condition is met (all pellets eaten)
     * @returns {boolean} True if all pellets are eaten, false otherwise
     */
    checkWinCondition() {
        if (typeof this.pelletsRemaining === 'number') {
            return this.pelletsRemaining === 0;
        }
        if (!this.pelletGrid) {
            return false;
        }
        const pelletsRemaining = countPellets(this.pelletGrid);
        return pelletsRemaining === 0;
    }

    /**
     * Resets the collision system state
     */
    reset() {
        this.ghostsEatenCount = 0;
    }

    decrementPelletsRemaining(amount) {
        if (typeof this.pelletsRemaining !== 'number') {
            return;
        }

        this.pelletsRemaining = Math.max(0, this.pelletsRemaining - amount);
    }

    getProfilingInfo() {
        return {
            collisionMs: this.lastCollisionMs,
            pelletMs: this.lastPelletCollisionMs,
            ghostMs: this.lastGhostCollisionMs,
            checks: this.lastCollisionChecks,
            pelletsRemaining: this.pelletsRemaining,
            totalPellets: this.totalPellets
        };
    }

    createCollisionSnapshot() {
        if (!this.pacman || this.pacman.x === undefined || this.pacman.y === undefined) {
            return null;
        }

        const pacmanGrid = pixelToGrid(this.pacman.x, this.pacman.y);

        const pacmanSnapshot = {
            x: this.pacman.x,
            y: this.pacman.y,
            prevX: this.pacman.prevX ?? this.pacman.x,
            prevY: this.pacman.prevY ?? this.pacman.y,
            grid: pacmanGrid
        };

        const ghostSnapshots = this.ghosts.map((ghost) => ({
            ghost,
            x: ghost.x,
            y: ghost.y,
            prevX: ghost.prevX ?? ghost.x,
            prevY: ghost.prevY ?? ghost.y
        }));

        return {
            pacman: pacmanSnapshot,
            ghosts: ghostSnapshots
        };
    }

    checkPelletTileCollision(snapshot, options) {
        const resolvedSnapshot = snapshot ?? this.createCollisionSnapshot();
        const emptyResult = {
            pelletScore: 0,
            powerPelletScore: 0,
            pelletsConsumed: 0
        };

        if (!resolvedSnapshot?.pacman || !this.maze || !this.pelletGrid) {
            return emptyResult;
        }

        const pacmanGrid = resolvedSnapshot.pacman.grid;

        if (!pacmanGrid || isNaN(pacmanGrid.x) || isNaN(pacmanGrid.y) ||
            pacmanGrid.x < 0 || pacmanGrid.y < 0 ||
            pacmanGrid.y >= this.maze.length || pacmanGrid.x >= this.maze[0].length) {
            return emptyResult;
        }

        if (!options.bypassRepeatCheck) {
            if (pacmanGrid.x === this.lastPelletGrid.x && pacmanGrid.y === this.lastPelletGrid.y) {
                return emptyResult;
            }

            this.lastPelletGrid = { x: pacmanGrid.x, y: pacmanGrid.y };
        }

        const pelletType = getPelletType(this.pelletGrid, pacmanGrid.x, pacmanGrid.y);

        const logData = {
            timestamp: new Date().toISOString(),
            type: 'pellet_tile_check',
            pacman: {
                x: Math.round(resolvedSnapshot.pacman.x),
                y: Math.round(resolvedSnapshot.pacman.y),
                gridX: pacmanGrid.x,
                gridY: pacmanGrid.y
            },
            pelletType: pelletType,
            collision: pelletType === PELLET_TYPES.PELLET || pelletType === PELLET_TYPES.POWER_PELLET
        };

        if (this.debugLogger.enabled) {
            console.log(JSON.stringify(logData, null, 2));
        }

        if (pelletType === PELLET_TYPES.PELLET && options.allowPellet) {
            consumePelletAt(this.pelletGrid, pacmanGrid.x, pacmanGrid.y);

            const pellet = this.pelletPool?.getByGrid(pacmanGrid.x, pacmanGrid.y);
            if (pellet) {
                this.pelletPool.release(pellet);
            }

            this.decrementPelletsRemaining(1);
            return {
                pelletScore: scoreValues.pellet,
                powerPelletScore: 0,
                pelletsConsumed: 1
            };
        }

        if (pelletType === PELLET_TYPES.POWER_PELLET && options.allowPowerPellet) {
            consumePelletAt(this.pelletGrid, pacmanGrid.x, pacmanGrid.y);

            const powerPellet = this.powerPelletPool?.getByGrid(pacmanGrid.x, pacmanGrid.y);
            if (powerPellet) {
                this.powerPelletPool.release(powerPellet);
            }

            this.ghostsEatenCount = 0;
            this.decrementPelletsRemaining(1);
            return {
                pelletScore: 0,
                powerPelletScore: scoreValues.powerPellet,
                pelletsConsumed: 1
            };
        }

        return emptyResult;
    }
}

function getCollisionNow() {
    if (typeof performance !== 'undefined' && performance.now) {
        return performance.now();
    }

    return Date.now();
}
