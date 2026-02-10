/**
 * GameState
 * Aggregates all game entities and world state.
 * Pure data - NO Phaser dependencies.
 */

import { PacmanState } from './entities/PacmanState.js';
import { GhostState } from './entities/GhostState.js';
import { FruitState } from './entities/FruitState.js';
import { gameConfig, ghostStartPositions, pacmanStartPosition, ghostModes, directions, fruitConfig } from '../config/gameConfig.js';
import { createMazeData, countPellets, PELLET_TYPES } from '../utils/MazeLayout.js';

export class GameState {
    /**
     * @param {Object} config - Game configuration
     * @param {number} config.level - Starting level
     * @param {Array<Array<number>>} config.maze - Optional maze override
     * @param {Array<Array<number>>} config.pelletGrid - Optional pellet grid override
     */
    constructor(config = {}) {
        this.level = config.level || 1;

        // World state
        const mazeData = config.maze && config.pelletGrid
            ? { maze: config.maze, pelletGrid: config.pelletGrid }
            : createMazeData();

        this.maze = mazeData.maze;
        this.pelletGrid = mazeData.pelletGrid;
        this.totalPellets = countPellets(this.pelletGrid);
        this.pelletsRemaining = this.totalPellets;

        // Create entities
        this.pacman = this.createPacman();
        this.ghosts = this.createGhosts();
        this.fruit = this.createFruit();

        // Game flow state
        this.score = 0;
        this.lives = 3;
        this.isPaused = false;
        this.isGameOver = false;
        this.isDying = false;
        this.levelComplete = false;

        // Ghost combo tracking
        this.ghostsEaten = 0;
        this.currentComboGhosts = 0;
        this.maxComboGhosts = 0;

        // Timers
        this.deathTimer = 0;
        this.deathPauseDuration = config.deathPauseDuration || 2;

        // Input buffer
        this.desiredDirection = null;

        // Frame/tick counter for replay determinism
        this.tickCount = 0;
    }

    /**
     * Create Pacman entity
     * @returns {PacmanState}
     */
    createPacman() {
        return new PacmanState(
            pacmanStartPosition.x,
            pacmanStartPosition.y,
            this.level
        );
    }

    /**
     * Create Ghost entities
     * @returns {Array<GhostState>}
     */
    createGhosts() {
        const ghostTypes = ['blinky', 'pinky', 'inky', 'clyde'];
        const ghosts = [];

        for (const ghostType of ghostTypes) {
            const pos = ghostStartPositions[ghostType];
            if (pos) {
                ghosts.push(new GhostState(pos.x, pos.y, ghostType, this.level));
            }
        }

        return ghosts;
    }

    /**
     * Create Fruit entity
     * @returns {FruitState}
     */
    createFruit() {
        return new FruitState();
    }

    /**
     * Update entire game state
     * @param {number} deltaSeconds - Time since last frame
     * @param {Object} input - Input state { direction }
     * @returns {Array<Object>} - All events generated this frame
     */
    update(deltaSeconds, input = {}) {
        const events = [];

        if (this.isPaused || this.isGameOver) {
            return events;
        }

        this.tickCount++;

        // Handle death sequence
        if (this.isDying) {
            const deathEvents = this.updateDeathSequence(deltaSeconds);
            return events.concat(deathEvents);
        }

        // Store desired direction from input
        if (input.direction) {
            this.desiredDirection = input.direction;
        }

        // Update Pacman
        const pacmanEvents = this.pacman.update(deltaSeconds, this.maze, this.desiredDirection);
        events.push(...pacmanEvents);

        // Update ghosts
        for (const ghost of this.ghosts) {
            const ghostEvents = ghost.update(deltaSeconds, this.maze, this.pacman);
            events.push(...ghostEvents);
        }

        // Update fruit
        const fruitEvents = this.fruit.update(deltaSeconds);
        events.push(...fruitEvents);

        // Clear consumed direction if it was applied
        if (this.pacman.direction !== directions.NONE &&
            this.desiredDirection === this.pacman.direction) {
            this.desiredDirection = null;
        }

        return events;
    }

    /**
     * Update death sequence timer
     * @param {number} deltaSeconds - Time since last frame
     * @returns {Array<Object>} - Death events
     */
    updateDeathSequence(deltaSeconds) {
        const events = [];

        this.deathTimer += deltaSeconds;

        if (this.deathTimer >= this.deathPauseDuration) {
            this.deathTimer = 0;
            this.isDying = false;

            if (this.lives <= 0) {
                this.isGameOver = true;
                events.push({ type: 'game_over' });
            } else {
                this.lives--;
                this.resetPositions();
                events.push({ type: 'respawn' });
            }
        } else {
            events.push({ type: 'death_tick', progress: this.deathTimer / this.deathPauseDuration });
        }

        return events;
    }

    /**
     * Handle Pacman death
     */
    onPacmanDeath() {
        this.isDying = true;
        this.deathTimer = 0;
        this.pacman.die();
    }

    /**
     * Eat a pellet at position
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     * @returns {Object|null} - Pellet eat result or null
     */
    eatPelletAt(gridX, gridY) {
        if (gridY < 0 || gridY >= this.pelletGrid.length ||
            gridX < 0 || gridX >= this.pelletGrid[0].length) {
            return null;
        }

        const pelletType = this.pelletGrid[gridY][gridX];

        if (pelletType === PELLET_TYPES.NONE) {
            return null;
        }

        // Remove pellet
        this.pelletGrid[gridY][gridX] = PELLET_TYPES.NONE;
        this.pelletsRemaining--;

        const result = {
            type: pelletType === PELLET_TYPES.POWER_PELLET ? 'power_pellet' : 'pellet',
            gridX,
            gridY,
            pelletsRemaining: this.pelletsRemaining
        };

        // Check win condition
        if (this.pelletsRemaining === 0 && !this.levelComplete) {
            this.levelComplete = true;
            result.levelComplete = true;
        }

        return result;
    }

    /**
     * Eat a ghost
     * @param {GhostState} ghost - Ghost to eat
     * @returns {Object} - Eat result with score
     */
    eatGhost(ghost) {
        if (!ghost.isFrightened || ghost.isEaten) {
            return null;
        }

        ghost.eat();
        this.ghostsEaten++;
        this.currentComboGhosts++;
        this.maxComboGhosts = Math.max(this.maxComboGhosts, this.currentComboGhosts);

        // Calculate score based on combo
        const scoreIndex = Math.min(this.currentComboGhosts - 1, 3);
        const scores = [200, 400, 800, 1600];
        const score = scores[scoreIndex];
        this.score += score;

        return {
            type: 'ghost_eaten',
            ghost: ghost.ghostType,
            score: score,
            combo: this.currentComboGhosts
        };
    }

    /**
     * Set all ghosts to frightened mode
     * @param {number} duration - Duration in seconds
     */
    setGhostsFrightened(duration) {
        // Reset combo when power pellet eaten
        this.currentComboGhosts = 0;

        for (const ghost of this.ghosts) {
            if (!ghost.isEaten) {
                ghost.setFrightened(duration);
            }
        }
    }

    /**
     * Reset ghost positions after death
     */
    resetPositions() {
        this.pacman.reset(pacmanStartPosition.x, pacmanStartPosition.y);

        for (const ghost of this.ghosts) {
            ghost.reset();
        }

        this.fruit.reset();
        this.currentComboGhosts = 0;
    }

    /**
     * Advance to next level
     */
    nextLevel() {
        this.level++;
        this.levelComplete = false;

        // Recreate maze with fresh pellets
        const mazeData = createMazeData();
        this.maze = mazeData.maze;
        this.pelletGrid = mazeData.pelletGrid;
        this.totalPellets = countPellets(this.pelletGrid);
        this.pelletsRemaining = this.totalPellets;

        // Reset positions with new level speed
        this.resetPositions();

        // Update speeds for new level
        this.pacman = new PacmanState(
            pacmanStartPosition.x,
            pacmanStartPosition.y,
            this.level
        );

        this.ghosts = this.createGhosts();
    }

    /**
     * Get ghost by type
     * @param {string} ghostType - Ghost type name
     * @returns {GhostState|null}
     */
    getGhostByType(ghostType) {
        return this.ghosts.find(g => g.ghostType === ghostType) || null;
    }

    /**
     * Get pellet type at position
     * @param {number} gridX - Grid X
     * @param {number} gridY - Grid Y
     * @returns {number} - Pellet type
     */
    getPelletAt(gridX, gridY) {
        if (gridY < 0 || gridY >= this.pelletGrid.length ||
            gridX < 0 || gridX >= this.pelletGrid[0].length) {
            return PELLET_TYPES.NONE;
        }
        return this.pelletGrid[gridY][gridX];
    }

    /**
     * Get percentage of pellets eaten
     * @returns {number}
     */
    getPelletsEatenPercentage() {
        if (this.totalPellets === 0) {return 0;}
        return ((this.totalPellets - this.pelletsRemaining) / this.totalPellets) * 100;
    }

    /**
     * Check if fruit should spawn
     * @returns {boolean}
     */
    shouldSpawnFruit() {
        return this.getPelletsEatenPercentage() >= fruitConfig.pelletThreshold;
    }

    /**
     * Get frightened duration for current level
     * @returns {number}
     */
    getFrightenedDuration() {
        return Math.max(2, 8 - (this.level - 1) * 0.5);
    }

    /**
     * Get speed multiplier for current level
     * @returns {number}
     */
    getSpeedMultiplier() {
        return 1 + (this.level - 1) * 0.05;
    }

    /**
     * Set paused state
     * @param {boolean} paused
     */
    setPaused(paused) {
        this.isPaused = paused;
    }

    /**
     * Get complete state snapshot
     * @returns {Object}
     */
    getSnapshot() {
        return {
            level: this.level,
            score: this.score,
            lives: this.lives,
            isPaused: this.isPaused,
            isGameOver: this.isGameOver,
            isDying: this.isDying,
            levelComplete: this.levelComplete,
            pelletsRemaining: this.pelletsRemaining,
            totalPellets: this.totalPellets,
            pelletsEatenPercent: this.getPelletsEatenPercentage(),
            pacman: this.pacman.getSnapshot(),
            ghosts: this.ghosts.map(g => g.getSnapshot()),
            fruit: this.fruit.getSnapshot(),
            tickCount: this.tickCount
        };
    }

    /**
     * Serialize state for save/replay
     * @returns {Object}
     */
    serialize() {
        return {
            level: this.level,
            score: this.score,
            lives: this.lives,
            pelletGrid: this.pelletGrid.map(row => [...row]),
            pacman: {
                gridX: this.pacman.gridX,
                gridY: this.pacman.gridY,
                direction: this.pacman.direction
            },
            ghosts: this.ghosts.map(g => ({
                ghostType: g.ghostType,
                gridX: g.gridX,
                gridY: g.gridY,
                mode: g.mode,
                isFrightened: g.isFrightened,
                isEaten: g.isEaten
            })),
            tickCount: this.tickCount
        };
    }
}


