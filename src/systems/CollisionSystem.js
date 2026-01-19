import { collisionConfig, scoreValues } from '../config/gameConfig.js';
import { pixelToGrid, countPellets } from '../utils/MazeLayout.js';
import { TILE_TYPES } from '../utils/MazeLayout.js';
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
        this.pelletSprites = [];
        this.powerPelletSprites = [];
        this.pelletPool = null;
        this.powerPelletPool = null;
        this.ghostsEatenCount = 0;
        this.debugLogger = DebugLogger.getInstance();
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
     * @returns {number} Score value if collision occurred, 0 otherwise
     */
    checkPelletCollision() {
        if (!this.pacman || this.pacman.x === undefined || this.pacman.y === undefined) {
            return 0;
        }

        const pacmanGrid = pixelToGrid(this.pacman.x, this.pacman.y);

        if (!pacmanGrid || isNaN(pacmanGrid.x) || isNaN(pacmanGrid.y) ||
            pacmanGrid.x < 0 || pacmanGrid.y < 0 ||
            pacmanGrid.y >= this.maze.length || pacmanGrid.x >= this.maze[0].length) {
            return 0;
        }

        const tileType = this.maze[pacmanGrid.y][pacmanGrid.x];

        const logData = {
            timestamp: new Date().toISOString(),
            type: 'pellet_collision_check',
            pacman: {
                x: Math.round(this.pacman.x),
                y: Math.round(this.pacman.y),
                gridX: pacmanGrid.x,
                gridY: pacmanGrid.y
            },
            tileType: tileType,
            collision: tileType === TILE_TYPES.PELLET,
            result: tileType === TILE_TYPES.PELLET ? { score: scoreValues.pellet } : null
        };

        if (this.debugLogger.enabled) {
            console.log(JSON.stringify(logData, null, 2));
        }

        if (tileType === TILE_TYPES.PELLET) {
            this.maze[pacmanGrid.y][pacmanGrid.x] = TILE_TYPES.EMPTY;

            const pellet = this.pelletPool.getByGrid(pacmanGrid.x, pacmanGrid.y);
            if (pellet) {
                this.pelletPool.release(pellet);
            }

            return scoreValues.pellet;
        }

        return 0;
    }

    /**
     * Checks and handles collision between Pacman and power pellets
     * @returns {number} Score value if collision occurred, 0 otherwise
     */
    checkPowerPelletCollision() {
        if (!this.pacman || this.pacman.x === undefined || this.pacman.y === undefined) {
            return 0;
        }

        const pacmanGrid = pixelToGrid(this.pacman.x, this.pacman.y);

        if (!pacmanGrid || isNaN(pacmanGrid.x) || isNaN(pacmanGrid.y) ||
            pacmanGrid.x < 0 || pacmanGrid.y < 0 ||
            pacmanGrid.y >= this.maze.length || pacmanGrid.x >= this.maze[0].length) {
            return 0;
        }

        const tileType = this.maze[pacmanGrid.y][pacmanGrid.x];

        const logData = {
            timestamp: new Date().toISOString(),
            type: 'power_pellet_collision_check',
            pacman: {
                x: Math.round(this.pacman.x),
                y: Math.round(this.pacman.y),
                gridX: pacmanGrid.x,
                gridY: pacmanGrid.y
            },
            tileType: tileType,
            collision: tileType === TILE_TYPES.POWER_PELLET,
            result: tileType === TILE_TYPES.POWER_PELLET ? { score: scoreValues.powerPellet } : null
        };

        if (this.debugLogger.enabled) {
            console.log(JSON.stringify(logData, null, 2));
        }

        if (tileType === TILE_TYPES.POWER_PELLET) {
            this.maze[pacmanGrid.y][pacmanGrid.x] = TILE_TYPES.EMPTY;

            const powerPellet = this.powerPelletPool.getByGrid(pacmanGrid.x, pacmanGrid.y);
            if (powerPellet) {
                this.powerPelletPool.release(powerPellet);
            }

            this.ghostsEatenCount = 0;
            return scoreValues.powerPellet;
        }

        return 0;
    }

    /**
     * Checks and handles collision between Pacman and ghosts
     * @returns {{type: string, score: number}|null} Collision result object or null if no collision
     */
    checkGhostCollision() {
        if (!this.pacman || this.pacman.x === undefined || this.pacman.y === undefined) {
            return null;
        }

        for (const ghost of this.ghosts) {
            if (ghost.isEaten) {continue;}

            if (!ghost || ghost.x === undefined || ghost.y === undefined) {
                continue;
            }

            if (this.checkCapsuleCollision(this.pacman, ghost)) {
                return this.handleGhostCollisionWithLogging(ghost, 'capsule');
            }
        }

        return null;
    }

    /**
     * Checks all collisions (pellets, power pellets, ghosts)
     * @returns {{pelletScore: number, powerPelletScore: number, ghostCollision: object|null}} Results object containing all collision results
     */
    checkAllCollisions() {
        const results = {
            pelletScore: 0,
            powerPelletScore: 0,
            ghostCollision: null
        };

        results.pelletScore = this.checkPelletCollision();
        results.powerPelletScore = this.checkPowerPelletCollision();
        results.ghostCollision = this.checkGhostCollision();

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
    checkCapsuleCollision(pacman, ghost) {
        const pacmanPrevX = pacman.prevX ?? pacman.x;
        const pacmanPrevY = pacman.prevY ?? pacman.y;
        const ghostPrevX = ghost.prevX ?? ghost.x;
        const ghostPrevY = ghost.prevY ?? ghost.y;

        return capsuleCollision(
            pacmanPrevX, pacmanPrevY, pacman.x, pacman.y,
            ghostPrevX, ghostPrevY, ghost.x, ghost.y,
            collisionConfig.radius
        );
    }

    /**
     * Handles ghost collision with debug logging
     * @param {Ghost} ghost - The ghost entity
     * @param {string} method - The collision method used
     * @returns {{type: string, score: number}|null} Collision result object
     */
    handleGhostCollisionWithLogging(ghost, method) {
        const result = this.handleGhostCollision(ghost);

        const logData = {
            timestamp: new Date().toISOString(),
            type: 'ghost_collision_check',
            method: method,
            pacman: {
                x: Math.round(this.pacman.x),
                y: Math.round(this.pacman.y),
                prevX: this.pacman.prevX !== undefined ? Math.round(this.pacman.prevX) : undefined,
                prevY: this.pacman.prevY !== undefined ? Math.round(this.pacman.prevY) : undefined
            },
            ghost: {
                x: Math.round(ghost.x),
                y: Math.round(ghost.y),
                prevX: ghost.prevX !== undefined ? Math.round(ghost.prevX) : undefined,
                prevY: ghost.prevY !== undefined ? Math.round(ghost.prevY) : undefined,
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
        const pelletsRemaining = countPellets(this.maze);
        return pelletsRemaining === 0;
    }

    /**
     * Resets the collision system state
     */
    reset() {
        this.ghostsEatenCount = 0;
    }
}
