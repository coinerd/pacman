import { gameConfig, scoreValues } from '../config/gameConfig.js';
import { pixelToGrid, getDistance, setTileType, countPellets } from '../utils/MazeLayout.js';
import { TILE_TYPES } from '../utils/MazeLayout.js';
import { sweptAABBCollision, distanceCollision, lineSegmentsIntersect, pointToLineSegmentDistance } from '../utils/CollisionUtils.js';
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

            if (this.checkCrossedPathCollision(this.pacman, ghost)) {
                return this.handleGhostCollisionWithLogging(ghost, 'crossed_path');
            }

            if (this.checkSweptAABBCollision(this.pacman, ghost)) {
                return this.handleGhostCollisionWithLogging(ghost, 'swept_aabb');
            }

            if (this.checkDistanceCollision(this.pacman, ghost)) {
                return this.handleGhostCollisionWithLogging(ghost, 'distance');
            }
        }

        return null;
    }

    /**
     * Checks if Pacman and ghost paths crossed
     * @param {Pacman} pacman - The Pacman entity
     * @param {Ghost} ghost - The ghost entity
     * @returns {boolean} True if paths crossed, false otherwise
     */
    checkCrossedPathCollision(pacman, ghost) {
        if (pacman.prevX === undefined || pacman.prevY === undefined ||
            ghost.prevX === undefined || ghost.prevY === undefined) {
            return false;
        }

        const crossed = lineSegmentsIntersect(
            pacman.prevX, pacman.prevY, pacman.x, pacman.y,
            ghost.prevX, ghost.prevY, ghost.x, ghost.y
        );

        return crossed;
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
     * Checks collision using distance-based methods
     * @param {Pacman} pacman - The Pacman entity
     * @param {Ghost} ghost - The ghost entity
     * @returns {boolean} True if collision detected, false otherwise
     */
    checkDistanceCollision(pacman, ghost) {
        const radius = gameConfig.tileSize * 0.8;

        const bothPrevExist = (pacman.prevX !== undefined && ghost.prevX !== undefined);
        const pacmanMoved = bothPrevExist &&
            (pacman.x !== pacman.prevX || pacman.y !== pacman.prevY);
        const ghostMoved = bothPrevExist &&
            (ghost.x !== ghost.prevX || ghost.y !== ghost.prevY);

        if (!pacmanMoved && !ghostMoved) {
            return distanceCollision(pacman.x, pacman.y, ghost.x, ghost.y, radius);
        }

        if (pacmanMoved && ghostMoved) {
            return distanceCollision(pacman.x, pacman.y, ghost.x, ghost.y, radius);
        }

        if (bothPrevExist) {
            if (pacmanMoved && !ghostMoved) {
                const dist = pointToLineSegmentDistance(
                    ghost.x, ghost.y,
                    pacman.prevX, pacman.prevY, pacman.x, pacman.y
                );
                return dist < radius;
            } else if (!pacmanMoved && ghostMoved) {
                const dist = pointToLineSegmentDistance(
                    pacman.x, pacman.y,
                    ghost.prevX, ghost.prevY, ghost.x, ghost.y
                );
                return dist < radius;
            }
        }

        return distanceCollision(pacman.x, pacman.y, ghost.x, ghost.y, radius);
    }

    /**
     * Checks collision using swept AABB method
     * @param {Pacman} pacman - The Pacman entity
     * @param {Ghost} ghost - The ghost entity
     * @returns {boolean} True if collision detected, false otherwise
     */
    checkSweptAABBCollision(pacman, ghost) {
        const radius = gameConfig.tileSize * 0.8;

        return sweptAABBCollision(
            ghost.prevX, ghost.prevY, ghost.x, ghost.y,
            pacman.x, pacman.y,
            radius
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
