/**
 * GameModel
 * Single source of truth for all game state and logic.
 * Pure data model - NO Phaser dependencies.
 *
 * Phase 3 Refactor: Merged GameState into GameModel
 * - Owns entity states (PacmanState, GhostState, FruitState)
 * - Owns world state (maze, pelletGrid)
 * - Runs complete game loop (update + collision)
 * - Emits events via EventBus
 */

import { gameEvents, GAME_EVENTS } from './EventBus.js';
import { PacmanState } from '../model/entities/PacmanState.js';
import { GhostState } from '../model/entities/GhostState.js';
import { FruitState } from '../model/entities/FruitState.js';
import { ModelCollisionSystem } from '../model/systems/ModelCollisionSystem.js';
import { MovementAdapter, CollisionAdapter } from '../model/adapters/index.js';
import {
    gameConfig,
    ghostStartPositions,
    pacmanStartPosition,
    directions,
    fruitConfig
} from '../config/gameConfig.js';
import { createMazeData, countPellets, PELLET_TYPES } from '../utils/MazeLayout.js';

export default class GameModel {
    /**
     * @param {Object} config - Game configuration
     * @param {number} config.level - Starting level
     * @param {number} config.score - Initial score
     * @param {number} config.lives - Initial lives
     * @param {number} config.highScore - High score
     * @param {Array<Array<number>>} config.maze - Optional maze override
     * @param {Array<Array<number>>} config.pelletGrid - Optional pellet grid override
     * @param {boolean} config.useDecoupledSystems - Use new decoupled movement/collision
     */
    constructor(config = {}) {
        // Level and configuration
        this.level = config.level || 1;
        this.levelConfig = null;

        // Feature flag for decoupled systems (default false for backward compatibility)
        this.useDecoupledSystems = config.useDecoupledSystems ?? false;

        // World state
        const mazeData = config.maze && config.pelletGrid
            ? { maze: config.maze, pelletGrid: config.pelletGrid }
            : createMazeData();

        this.maze = mazeData.maze;
        this.pelletGrid = mazeData.pelletGrid;
        this.totalPellets = countPellets(this.pelletGrid);
        this.pelletsRemaining = this.totalPellets;

        // Backward compatibility: allow overriding pellet counts
        if (config.totalPellets !== undefined) {
            this.totalPellets = config.totalPellets;
        }
        if (config.pelletsRemaining !== undefined) {
            this.pelletsRemaining = config.pelletsRemaining;
        }

        // Create entities
        this.pacman = this.createPacman();
        this.ghosts = this.createGhosts();
        this.fruit = this.createFruit();

        // Game flow state
        this.score = config.score ?? 0;
        this.lives = config.lives ?? 3;
        this.highScore = config.highScore ?? 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.isDying = false;
        this.levelComplete = false;

        // Ghost combo tracking
        this.ghostsEaten = 0;
        this.currentComboGhosts = 0;
        this.maxComboGhosts = 0;

        // Legacy tracking (for backward compatibility)
        this.pelletsEaten = 0;
        this.levelDeaths = 0;

        // Timers
        this.deathTimer = 0;
        this.deathPauseDuration = config.deathPauseDuration ?? 2;

        // Input buffer
        this.inputDirection = null;
        this.desiredDirection = null;

        // Frame/tick counter for replay determinism
        this.tickCount = 0;

        // Initialize movement/collision systems
        if (this.useDecoupledSystems) {
            // Use new decoupled systems
            this.movementAdapter = new MovementAdapter(this);
            this.collisionAdapter = new CollisionAdapter(this);
            this.collisionSystem = null; // Not used in decoupled mode
        } else {
            // Use legacy systems
            this.movementAdapter = null;
            this.collisionAdapter = null;
            this.collisionSystem = new ModelCollisionSystem(this);
        }

        // Profiling
        this.lastUpdateTime = 0;
        this.updateCount = 0;
    }

    /**
     * Backward compatibility: state property
     * Returns 'this' to support old pattern gameModel.state.score
     * @deprecated Access properties directly: gameModel.score
     */
    get state() {
        return this;
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
     * Set level configuration
     * @param {Object} levelConfig
     */
    setLevelConfig(levelConfig) {
        this.levelConfig = levelConfig;
    }

    /**
     * Set input direction for next update
     * @param {Object} direction - Direction from directions enum
     */
    setInputDirection(direction) {
        if (direction && direction !== directions.NONE) {
            this.inputDirection = direction;
        }
    }

    /**
     * Main game step - runs simulation for one frame
     * @param {number} deltaSeconds - Time since last frame
     * @param {Object} input - Optional input override
     * @returns {Array<Object>} - Events generated this frame
     */
    step(deltaSeconds, input = null) {
        const startTime = performance.now();
        const events = [];

        if (this.isPaused || this.isGameOver) {
            return events;
        }

        this.tickCount++;

        // Handle death sequence (legacy mode returns single object)
        if (this.isDying) {
            const deathEvents = this.updateDeathSequence(deltaSeconds);
            this.lastUpdateTime = performance.now() - startTime;
            this.emitEvents(deathEvents);

            // Backward compatibility: return single event object for legacy tests
            const deathEvent = deathEvents[0];
            if (deathEvent) {
                const legacyEventMap = {
                    'death_tick': 'deathTick',
                    'respawn': 'respawn',
                    'game_over': 'gameOver'
                };
                return { event: legacyEventMap[deathEvent.type] || deathEvent.type };
            }
            return null;
        }

        // Get input direction (from parameter or queued input)
        const inputDirection = input?.direction || this.inputDirection;
        if (inputDirection) {
            this.desiredDirection = inputDirection;
        }

        if (this.useDecoupledSystems) {
            // Use decoupled movement and collision systems
            // Update Pacman
            const pacmanMoveEvents = this.movementAdapter.updateEntity(
                this.pacman,
                deltaSeconds,
                this.desiredDirection
            );
            events.push(...pacmanMoveEvents);

            // Update ghosts
            for (const ghost of this.ghosts) {
                const ghostMoveEvents = this.movementAdapter.updateEntity(ghost, deltaSeconds);
                events.push(...ghostMoveEvents);
            }

            // Update fruit
            const fruitEvents = this.fruit.update(deltaSeconds);
            events.push(...fruitEvents);

            // Clear consumed direction if it was applied
            if (this.pacman.direction !== directions.NONE &&
                this.desiredDirection === this.pacman.direction) {
                this.desiredDirection = null;
                this.inputDirection = null;
            }

            // Check collisions using decoupled system
            const collisionEvents = this.collisionAdapter.checkAllCollisions();
            events.push(...collisionEvents);

            // Apply collision effects
            for (const event of collisionEvents) {
                this.applyCollisionEffect(event);
            }
        } else {
            // Use legacy systems
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
                this.inputDirection = null;
            }

            // Check collisions using legacy system
            const collisionEvents = this.collisionSystem.checkAllCollisions();
            events.push(...collisionEvents);

            // Apply collision effects
            for (const event of collisionEvents) {
                this.applyCollisionEffect(event);
            }
        }

        // Profiling
        this.lastUpdateTime = performance.now() - startTime;
        this.updateCount++;

        // Emit all events
        this.emitEvents(events);

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
            events.push({
                type: 'death_tick',
                progress: this.deathTimer / this.deathPauseDuration
            });
        }

        return events;
    }

    /**
     * Apply effects from collision events
     * @param {Object} event - Collision event
     */
    applyCollisionEffect(event) {
        switch (event.type) {
        case 'pellet_eaten':
            this.score += event.score;
            this.pelletsEaten++;
            this.checkHighScore();
            break;

        case 'power_pellet_eaten':
            this.score += event.score;
            this.currentComboGhosts = 0;
            this.checkHighScore();
            this.setGhostsFrightened(event.frightenedDuration);
            break;

        case 'ghost_eaten':
            this.score += event.score;
            this.ghostsEaten++;
            this.currentComboGhosts++;
            this.maxComboGhosts = Math.max(this.maxComboGhosts, this.currentComboGhosts);
            this.checkHighScore();
            break;

        case 'fruit_eaten':
            this.score += event.score;
            this.checkHighScore();
            break;

        case 'pacman_died':
            this.levelDeaths++;
            this.onPacmanDeath();
            break;

        case 'level_complete':
            this.levelComplete = true;
            break;
        }
    }

    /**
     * Check and update high score
     */
    checkHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
    }

    /**
     * Set all ghosts to frightened mode
     * @param {number} duration - Duration in seconds
     */
    setGhostsFrightened(duration) {
        for (const ghost of this.ghosts) {
            if (!ghost.isEaten) {
                ghost.setFrightened(duration);
            }
        }
    }

    /**
     * Handle Pacman death
     */
    onPacmanDeath() {
        this.isDying = true;
        this.deathTimer = 0;
        this.levelComplete = false;
        this.pacman.die();
    }

    /**
     * Reset positions after death
     */
    resetPositions() {
        this.pacman.reset(pacmanStartPosition.x, pacmanStartPosition.y);

        for (const ghost of this.ghosts) {
            ghost.reset();
        }

        this.fruit.reset();
        this.currentComboGhosts = 0;

        if (this.useDecoupledSystems) {
            this.movementAdapter.reset();
            this.collisionAdapter.reset();
        } else {
            this.collisionSystem.reset();
        }
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

        // Recreate entities for new level
        this.pacman = this.createPacman();
        this.ghosts = this.createGhosts();
        this.fruit = this.createFruit();
        this.currentComboGhosts = 0;

        if (this.useDecoupledSystems) {
            this.movementAdapter.updateMaze(this.maze);
            this.movementAdapter.reset();
            this.collisionAdapter.reset();
        } else {
            this.collisionSystem.reset();
        }
    }

    /**
     * Emit events via EventBus for view layer
     * @param {Array<Object>} events - Events to emit
     */
    emitEvents(events) {
        for (const event of events) {
            switch (event.type) {
            case 'pellet_eaten':
                gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {
                    score: event.score,
                    pelletsRemaining: event.pelletsRemaining,
                    gridX: event.gridX,
                    gridY: event.gridY
                });
                break;

            case 'power_pellet_eaten':
                gameEvents.emit(GAME_EVENTS.POWER_PELLET_EATEN, {
                    score: event.score,
                    pelletsRemaining: event.pelletsRemaining,
                    frightenedDuration: event.frightenedDuration,
                    gridX: event.gridX,
                    gridY: event.gridY
                });
                break;

            case 'ghost_eaten':
                gameEvents.emit(GAME_EVENTS.GHOST_EATEN, {
                    score: event.score,
                    ghostType: event.ghostType,
                    combo: event.combo
                });
                break;

            case 'fruit_eaten':
                gameEvents.emit(GAME_EVENTS.FRUIT_EATEN, {
                    score: event.score
                });
                break;

            case 'pacman_died':
                gameEvents.emit(GAME_EVENTS.LIVES_LOST, {
                    livesRemaining: event.livesRemaining ?? this.lives
                });
                break;

            case 'level_complete':
                gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, {
                    level: this.level,
                    score: this.score
                });
                break;

            case 'game_over':
                gameEvents.emit(GAME_EVENTS.GAME_OVER, {
                    score: this.score,
                    highScore: this.highScore
                });
                break;

            case 'respawn':
                gameEvents.emit(GAME_EVENTS.RESPAWN, {
                    livesRemaining: this.lives
                });
                break;

            case 'score_changed':
                gameEvents.emit(GAME_EVENTS.SCORE_CHANGED, {
                    score: this.score,
                    highScore: this.highScore
                });
                break;

            case 'tile_center_reached':
            case 'death_tick':
                // Internal events - don't emit to view
                break;

            default:
                // Unknown event type - log for debugging
                if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
                    console.warn('Unknown model event:', event.type);
                }
            }
        }
    }

    /**
     * Set paused state
     * @param {boolean} paused
     */
    setPaused(paused) {
        this.isPaused = paused;
        gameEvents.emit(GAME_EVENTS.PAUSE_TOGGLED, { isPaused: paused });
    }

    /**
     * Toggle paused state
     * @returns {boolean} - New paused state
     */
    togglePaused() {
        this.isPaused = !this.isPaused;
        gameEvents.emit(GAME_EVENTS.PAUSE_TOGGLED, { isPaused: this.isPaused });
        return this.isPaused;
    }

    /**
     * Set game over state
     * @param {boolean} isGameOver
     */
    setGameOver(isGameOver) {
        this.isGameOver = isGameOver;
        if (isGameOver) {
            gameEvents.emit(GAME_EVENTS.GAME_OVER, {
                score: this.score,
                highScore: this.highScore
            });
        }
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
     * Eat a pellet at position (called by collision system)
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
     * Eat a ghost (called by collision system)
     * @param {GhostState} ghost - Ghost to eat
     * @returns {Object|null} - Eat result with score
     */
    eatGhost(ghost) {
        if (!ghost.isFrightened || ghost.isEaten) {
            return null;
        }

        ghost.eat();

        // Calculate score based on combo
        const scoreIndex = Math.min(this.currentComboGhosts, 3);
        const scores = [200, 400, 800, 1600];
        const score = scores[scoreIndex];

        return {
            type: 'ghost_eaten',
            ghost: ghost.ghostType,
            score: score,
            combo: this.currentComboGhosts + 1
        };
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
        if (!this.levelConfig) {
            return Math.max(2, 8 - (this.level - 1) * 0.5);
        }
        return Math.max(
            2,
            this.levelConfig.frightenedDuration -
                (this.level - 1) * this.levelConfig.frightenedDecreasePerLevel
        );
    }

    /**
     * Get speed multiplier for current level
     * @returns {number}
     */
    getSpeedMultiplier() {
        return 1 + (this.level - 1) * 0.05;
    }

    /**
     * Get complete state snapshot for view sync
     * @returns {Object}
     */
    getSnapshot() {
        return {
            level: this.level,
            score: this.score,
            lives: this.lives,
            highScore: this.highScore,
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
     * Get level snapshot for save/load
     * @returns {Object|null}
     */
    getLevelSnapshot() {
        return {
            maze: this.maze.map(row => [...row]),
            pelletGrid: this.pelletGrid.map(row => [...row])
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
            highScore: this.highScore,
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

    /**
     * Get collision system stats for debugging
     * @returns {Object}
     */
    getStats() {
        const baseStats = {
            updateTime: this.lastUpdateTime,
            updateCount: this.updateCount,
            tickCount: this.tickCount,
            useDecoupledSystems: this.useDecoupledSystems
        };

        if (this.useDecoupledSystems) {
            return {
                ...baseStats,
                movementStats: this.movementAdapter.getStats(),
                collisionStats: this.collisionAdapter.getStats()
            };
        } else {
            return {
                ...baseStats,
                collisionStats: this.collisionSystem.getStats()
            };
        }
    }

    // ============================================================
    // BACKWARD COMPATIBILITY METHODS (Legacy GameModel Interface)
    // ============================================================
    // These methods maintain compatibility with existing code that
    // uses the old GameModel interface from before Phase 3 refactor.

    /**
     * Legacy: state property for backward compatibility
     * Old code used gameModel.state.score, now uses gameModel.score directly
     * This getter returns 'this' to support the old pattern
     * @returns {GameModel} - Returns this for compatibility
     * @deprecated Access properties directly: gameModel.score instead of gameModel.state.score
     */
    /**
     * Legacy: Get state snapshot in old nested format
     * @returns {Object} - State snapshot with nested state object
     * @deprecated Use getSnapshot() instead
     */
    getStateSnapshot() {
        return {
            score: this.score,
            lives: this.lives,
            level: this.level,
            highScore: this.highScore,
            isPaused: this.isPaused,
            isGameOver: this.isGameOver,
            isDying: this.isDying,
            levelComplete: this.levelComplete,
            pelletsEaten: this.pelletsEaten,
            pelletsRemaining: this.pelletsRemaining,
            totalPellets: this.totalPellets,
            ghostsEaten: this.ghostsEaten,
            currentComboGhosts: this.currentComboGhosts,
            maxComboGhosts: this.maxComboGhosts,
            levelDeaths: this.levelDeaths,
            fruitsCollected: 0, // Legacy field - not tracked
            deathPauseDuration: this.deathPauseDuration
        };
    }

    /**
     * Legacy: Add score and emit events
     * @param {number} amount - Score to add
     * @deprecated Use applyCollisionEffect() instead
     */
    addScore(amount) {
        const previousHighScore = this.highScore;
        this.score += amount;
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        gameEvents.emit(GAME_EVENTS.SCORE_CHANGED, {
            score: this.score,
            level: this.level,
            highScore: this.highScore
        });
        if (this.highScore > previousHighScore) {
            gameEvents.emit(GAME_EVENTS.HIGH_SCORE_CHANGED, {
                highScore: this.highScore
            });
        }
    }

    /**
     * Legacy: Handle pellet eaten event
     * @param {number} score - Score to add
     * @param {number} pelletsRemaining - Pellets remaining
     * @deprecated Use applyCollisionEffect() instead
     */
    onPelletEaten(score, pelletsRemaining) {
        this.addScore(score);
        this.pelletsEaten++;
        if (pelletsRemaining !== undefined) {
            this.pelletsRemaining = pelletsRemaining;
        }
        gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {
            score,
            pelletsRemaining: this.pelletsRemaining
        });
    }

    /**
     * Legacy: Handle power pellet eaten event
     * @param {number} score - Score to add
     * @param {number} pelletsRemaining - Pellets remaining
     * @deprecated Use applyCollisionEffect() instead
     */
    onPowerPelletEaten(score, pelletsRemaining) {
        this.addScore(score);
        this.pelletsEaten++;
        this.currentComboGhosts = 0;
        if (pelletsRemaining !== undefined) {
            this.pelletsRemaining = pelletsRemaining;
        }
        this.setGhostsFrightened(this.getFrightenedDuration());
        gameEvents.emit(GAME_EVENTS.POWER_PELLET_EATEN, {
            score,
            pelletsRemaining: this.pelletsRemaining,
            frightenedDuration: this.getFrightenedDuration()
        });
    }

    /**
     * Legacy: Handle ghost eaten event
     * @param {number} score - Score to add
     * @deprecated Use applyCollisionEffect() instead
     */
    onGhostEaten(score) {
        this.addScore(score);
        this.ghostsEaten++;
        this.currentComboGhosts++;
        this.maxComboGhosts = Math.max(this.maxComboGhosts, this.currentComboGhosts);
        gameEvents.emit(GAME_EVENTS.GHOST_EATEN, { score });
    }

    /**
     * Legacy: Handle fruit eaten event
     * @param {number} score - Score to add
     * @deprecated Use applyCollisionEffect() instead
     */
    onFruitEaten(score) {
        this.addScore(score);
        gameEvents.emit(GAME_EVENTS.FRUIT_EATEN, { score });
    }

    /**
     * Legacy: Handle level complete event
     * @deprecated Use nextLevel() instead
     */
    onLevelComplete() {
        this.level++;
        this.levelComplete = true;
        gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, {});
    }

    /**
     * Legacy: Apply pellet collision results
     * @param {Object} result - Collision result
     * @deprecated Use step() with collision detection instead
     */
    applyPelletCollision({ pelletScore, powerPelletScore, pelletsConsumed }) {
        if (typeof pelletsConsumed === 'number' && pelletsConsumed > 0) {
            this.pelletsRemaining = Math.max(0, this.pelletsRemaining - pelletsConsumed);
        }

        if (pelletScore > 0) {
            this.onPelletEaten(pelletScore, this.pelletsRemaining);
        }

        if (powerPelletScore > 0) {
            this.onPowerPelletEaten(powerPelletScore, this.pelletsRemaining);
        }

        if (this.pelletsRemaining === 0 && !this.levelComplete) {
            this.onLevelComplete();
        }
    }

    /**
     * Legacy: Begin death sequence
     * @deprecated Use onPacmanDeath() instead
     */
    beginDeath() {
        this.onPacmanDeath();
    }

    /**
     * Legacy: Apply ghost collision result
     * @param {Object} result - Collision result
     * @deprecated Use applyCollisionEffect() instead
     */
    applyGhostCollision(result) {
        if (!result) {
            return;
        }

        if (result.type === 'ghost_eaten') {
            this.onGhostEaten(result.score);
            return;
        }

        if (result.type === 'pacman_died') {
            this.levelDeaths++;
            this.onPacmanDeath();
            gameEvents.emit(GAME_EVENTS.LIVES_LOST, { livesRemaining: this.lives });
        }
    }

    /**
     * Legacy: Set pellet counts
     * @param {number} totalPellets - Total pellets
     * @deprecated Use constructor options instead
     */
    setPelletCounts(totalPellets) {
        this.totalPellets = totalPellets;
        this.pelletsRemaining = totalPellets;
    }

    /**
     * Legacy: Decrement lives
     * @returns {boolean} - True if game over
     * @deprecated Death handling is now automatic in step()
     */
    decrementLives() {
        this.lives--;
        return this.lives <= 0;
    }

    /**
     * Legacy: Set desired direction
     * @param {Object} direction - Direction
     * @deprecated Use setInputDirection() instead
     */
    setDesiredDirection(direction) {
        this.setInputDirection(direction);
    }

    /**
     * Legacy: Consume desired direction
     * @returns {Object} - Direction
     * @deprecated Input is now consumed automatically in step()
     */
    consumeDesiredDirection() {
        const direction = this.desiredDirection;
        this.desiredDirection = null;
        return direction;
    }

    /**
     * Legacy: Get level data
     * @returns {Object} - Level data
     * @deprecated Use maze and pelletGrid properties directly
     */
    getLevelData() {
        return {
            maze: this.maze,
            pelletGrid: this.pelletGrid
        };
    }

    /**
     * Legacy: Set level data
     * @param {Object} data - Level data
     * @deprecated Use constructor options instead
     */
    setLevelData({ maze, pelletGrid }) {
        this.maze = maze;
        this.pelletGrid = pelletGrid;
        this.totalPellets = 0;
        for (const row of pelletGrid) {
            for (const cell of row) {
                if (cell !== 0) {this.totalPellets++;}
            }
        }
        this.pelletsRemaining = this.totalPellets;
    }
}
