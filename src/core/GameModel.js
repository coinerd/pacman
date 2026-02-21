/**
 * GameModel
 * Single source of truth for all game state and logic.
 * Pure data model - NO Phaser dependencies.
 *
 * Phase 4: Simplified to use only TileCenterMovementStrategy
 * - Tile-based movement with center-to-center interpolation
 * - Ensures entities stay perfectly centered in corridors
 */

import {
    directions,
    enemyStartPositions,
    fruitConfig,
    playerStartPosition
} from '../config/gameConfig.js';
import { CollisionAdapter } from '../model/adapters/CollisionAdapter.js';
import { EnemyAIAdapter } from '../model/adapters/EnemyAIAdapter.js';
import { TileCenterMovementAdapter } from '../model/adapters/TileCenterMovementAdapter.js';
import { EnemyState } from '../model/entities/EnemyState.js';
import { FruitState } from '../model/entities/FruitState.js';
import { PlayerState } from '../model/entities/PlayerState.js';
import AdditionalPowerUpSystem from '../systems/AdditionalPowerUpSystem.js';
import BossBattleSystem from '../systems/BossBattleSystem.js';
import StoryMode from '../systems/StoryMode.js';
import MazeGenerator from '../utils/MazeGenerator.js';
import {
    countPellets,
    createMazeData,
    PELLET_TYPES
} from '../utils/MazeLayout.js';
import { GAME_EVENTS, gameEvents } from './EventBus.js';

export default class GameModel {
    /**
     * @param {Object} config - Game configuration
     * @param {number} config.level - Starting level
     * @param {number} config.score - Initial score
     * @param {number} config.lives - Initial lives
     * @param {number} config.highScore - High score
     * @param {Array<Array<number>>} config.maze - Optional maze override
     * @param {Array<Array<number>>} config.pelletGrid - Optional pellet grid override
     */
    constructor(config = {}) {
        // Level and configuration
        this.level = config.level || 1;
        this.levelConfig = null;

        // World state
        const mazeData = config.maze && config.pelletGrid
            ? { maze: config.maze, pelletGrid: config.pelletGrid }
            : this.generateMazeForLevel(config.level || 1);

        this.maze = mazeData.maze;
        this.pelletGrid = mazeData.pelletGrid;
        this.spawnPoints = mazeData.spawnPoints;
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

        // Tracking
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

        // Initialize movement/collision systems (TileCenterMovement only)
        this.movementAdapter = new TileCenterMovementAdapter(this.maze);
        this.collisionAdapter = new CollisionAdapter(this);
        this.ghostAIAdapter = new EnemyAIAdapter(this);

        this.bossBattleSystem = new BossBattleSystem(this);
        this.additionalPowerUpSystem = new AdditionalPowerUpSystem(this);
        this.storyMode = new StoryMode(this);

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
     * Create Player entity
     * @returns {PlayerState}
     */
    createPacman() {
        const pos = this.spawnPoints?.player || playerStartPosition;
        return new PlayerState(pos.x, pos.y, this.level);
    }

    /**
     * Create Ghost entities
     * @returns {Array<EnemyState>}
     */
    createGhosts() {
        const enemyTypes = ['alpha', 'beta', 'gamma', 'delta'];
        const enemies = [];

        for (const enemyType of enemyTypes) {
            const pos = this.spawnPoints?.ghosts?.[enemyType] || enemyStartPositions[enemyType];
            if (pos) {
                enemies.push(new EnemyState(pos.x, pos.y, enemyType, this.level));
            }
        }

        return enemies;
    }

    /**
     * Create Fruit entity
     * @returns {FruitState}
     */
    createFruit() {
        return new FruitState();
    }

    /**
     * Generate maze for specific level using MazeGenerator
     * @param {number} level - Level number
     * @returns {Object} - { maze, pelletGrid }
     */
    generateMazeForLevel(level) {
        const mazeData = MazeGenerator.generate({
            width: 25,
            height: 33,
            pathDensity: 0.6 + level * 0.05,
            deadEndFactor: 0.4 - level * 0.02,
            symmetry: level % 2 === 0 ? 'horizontal' : 'vertical',
            cellularAutomataIterations: 0,
            seed: Date.now() + level * 1000
        });

        return {
            maze: mazeData.maze,
            pelletGrid: mazeData.pelletGrid
        };
    }

    /**
     * Set level configuration
     * @param {Object} levelConfig
     */
    setLevelConfig(levelConfig) {
        this.levelConfig = levelConfig;
    }

    /**
     * Start level - handle story chapter
     * @param {number} level - Level to start
     */
    startLevel(level) {
        this.storyMode.startLevel(level);
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

        if (this.isDying) {
            const deathEvents = this.updateDeathSequence(deltaSeconds);
            this.lastUpdateTime = performance.now() - startTime;
            this.emitEvents(deathEvents);
            return deathEvents;
        }

        // Get input direction (from parameter or queued input)
        const inputDirection = input?.direction || this.inputDirection;
        if (inputDirection) {
            this.desiredDirection = inputDirection;
        }

        // Update Pacman movement
        const pacmanMoveEvents = this.movementAdapter.updatePacman(
            this.pacman,
            deltaSeconds,
            this.desiredDirection
        );
        events.push(...pacmanMoveEvents);

        // Update Pacman state (animations, etc.)
        const pacmanStateEvents = this.pacman.update(
            deltaSeconds,
            this.maze,
            null, // Input already handled by adapter
            true
        );
        events.push(...pacmanStateEvents);

        // Update Ghost AI (sets directions for all ghosts)
        this.ghostAIAdapter.update(deltaSeconds);

        // Update ghosts movement and state
        for (const ghost of this.ghosts) {
            const ghostMoveEvents = this.movementAdapter.updateGhost(
                ghost,
                deltaSeconds
            );
            events.push(...ghostMoveEvents);

            const ghostStateEvents = ghost.update(
                deltaSeconds,
                this.maze,
                this.pacman,
                true
            );
            events.push(...ghostStateEvents);
        }

        // Update fruit
        const fruitEvents = this.fruit.update(deltaSeconds);
        events.push(...fruitEvents);

        // Clear consumed direction if it was applied
        // Also clear if pacman is not moving (blocked) to allow fresh input
        if (
            (this.pacman.direction !== directions.NONE &&
                this.desiredDirection === this.pacman.direction) ||
            this.pacman.direction === directions.NONE
        ) {
            this.desiredDirection = null;
            this.inputDirection = null;
        }

        // Check collisions
        const collisionEvents = this.collisionAdapter.checkAllCollisions();
        events.push(...collisionEvents);

        // Apply collision effects
        for (const event of collisionEvents) {
            this.applyCollisionEffect(event);
        }

        this.bossBattleSystem.update(deltaSeconds);
        this.additionalPowerUpSystem.update(deltaSeconds);

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
            this.maxComboGhosts = Math.max(
                this.maxComboGhosts,
                this.currentComboGhosts
            );
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
        this.pacman.reset(playerStartPosition.x, playerStartPosition.y);

        for (const ghost of this.ghosts) {
            ghost.reset();
        }

        this.fruit.reset();
        this.currentComboGhosts = 0;
        this.additionalPowerUpSystem.reset();

        this.movementAdapter.reset();
        this.collisionAdapter.reset();
        this.ghostAIAdapter.reset();
    }

    /**
     * Advance to next level
     */
    nextLevel() {
        // Complete story chapter if applicable
        this.storyMode.completeChapter();

        this.level++;
        this.levelComplete = false;

        // Start new level's story chapter
        this.storyMode.startLevel(this.level);

        // Recreate maze with fresh pellets
        const mazeData = MazeGenerator.generate({
            width: 25,
            height: 33,
            seed: this.level * 12345,
            pathDensity: 0.7,
            symmetry: 'none',
            cellularAutomataIterations: 0
        });
        this.maze = mazeData.maze;
        this.pelletGrid = mazeData.pelletGrid;
        this.totalPellets = countPellets(this.pelletGrid);
        this.pelletsRemaining = this.totalPellets;

        // Recreate entities for new level
        this.pacman = this.createPacman();
        this.ghosts = this.createGhosts();
        this.fruit = this.createFruit();
        this.currentComboGhosts = 0;
        this.additionalPowerUpSystem.reset();

        this.movementAdapter.updateMaze(this.maze);
        this.movementAdapter.reset();
        this.collisionAdapter.reset();
        this.ghostAIAdapter.reset();
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
     * @returns {EnemyState|null}
     */
    getGhostByType(ghostType) {
        return this.ghosts.find((g) => g.ghostType === ghostType) || null;
    }

    /**
     * Get pellet type at position
     * @param {number} gridX - Grid X
     * @param {number} gridY - Grid Y
     * @returns {number} - Pellet type
     */
    getPelletAt(gridX, gridY) {
        if (
            gridY < 0 ||
            gridY >= this.pelletGrid.length ||
            gridX < 0 ||
            gridX >= this.pelletGrid[0].length
        ) {
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
        if (
            gridY < 0 ||
            gridY >= this.pelletGrid.length ||
            gridX < 0 ||
            gridX >= this.pelletGrid[0].length
        ) {
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
            result.level = this.level;
        }

        return result;
    }

    /**
     * Eat a ghost (called by collision system)
     * @param {EnemyState} ghost - Enemy to eat
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
        if (this.totalPellets === 0) {
            return 0;
        }
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
            ghosts: this.ghosts.map((g) => g.getSnapshot()),
            fruit: this.fruit.getSnapshot(),
            boss: this.bossBattleSystem.getSnapshot(),
            powerUps: this.additionalPowerUpSystem.getSnapshot(),
            story: this.storyMode.getSnapshot(),
            tickCount: this.tickCount
        };
    }

    /**
     * Get level snapshot for save/load
     * @returns {Object|null}
     */
    getLevelSnapshot() {
        return {
            maze: this.maze.map((row) => [...row]),
            pelletGrid: this.pelletGrid.map((row) => [...row])
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
            pelletGrid: this.pelletGrid.map((row) => [...row]),
            pacman: {
                gridX: this.pacman.gridX,
                gridY: this.pacman.gridY,
                direction: this.pacman.direction
            },
            ghosts: this.ghosts.map((g) => ({
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
        return {
            updateTime: this.lastUpdateTime,
            updateCount: this.updateCount,
            tickCount: this.tickCount,
            movementStats: this.movementAdapter.getStats(),
            collisionStats: this.collisionAdapter.getStats()
        };
    }

    // ============================================================
    // BACKWARD COMPATIBILITY METHODS (Legacy GameModel Interface)
    // ============================================================

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
            fruitsCollected: 0,
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
     * Legacy: setLevelData for compatibility
     * @deprecated Maze data is now set directly in constructor
     */
    setLevelData(levelData) {
        // No-op - maze data is now set in constructor
        console.warn('[DEPRECATED] setLevelData is deprecated. Pass maze in constructor instead.');
    }

    /**
     * Legacy: getLevelData for compatibility
     * @deprecated Use maze and pelletGrid properties directly
     */
    getLevelData() {
        console.warn('[DEPRECATED] getLevelData is deprecated. Access maze and pelletGrid directly.');
        return {
            maze: this.maze,
            pelletGrid: this.pelletGrid
        };
    }

    /**
     * Legacy: setHighScore for compatibility
     * @deprecated Set highScore directly
     */
    setHighScore(highScore) {
        this.highScore = highScore;
    }
}
