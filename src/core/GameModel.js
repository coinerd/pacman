/**
 * GameModel
 * Single source of truth for all game state and logic.
 * Pure data model - NO Phaser dependencies.
 *
 * Phase 5: MovementSystem integration
 * - Full MovementSystem for entity movement and AI
 * - Cleaned up legacy movement code
 */

import {
    directions,
    enemyStartPositions,
    fruitConfig,
    playerStartPosition,
    virusCore,
    scatterTargets
} from '../config/gameConfig.js';
import { scoreValues } from '../config/gameConfig.js';
import { gameConfig } from '../config/gameConfig.js';
import { MovementSystem } from '../movement/index.js';
import { EnemyState } from '../model/entities/EnemyState.js';
import { FruitState } from '../model/entities/FruitState.js';
import {
    PlayerModule,
    ScoreModule,
    SessionModule
} from '../model/systems/index.js';
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
import { VIEW_EVENTS } from '../views/ViewEvents.js';

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
        this.sessionModule = new SessionModule({
            level: config.level || 1,
            lives: config.lives
        });
        this.scoreModule = new ScoreModule({
            score: config.score,
            highScore: config.highScore
        });
        this.level = this.sessionModule.level;
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
        this.playerModule = new PlayerModule({
            level: this.level,
            spawnPoint: this.spawnPoints?.player || playerStartPosition
        });

        this.pacman = this.createPacman();
        this.ghosts = this.createGhosts();
        this.fruit = this.createFruit();

        // Entity state tracking for view events
        this.lastPacmanDirection = null;
        this.lastGhostModes = new Map(); // ghostType -> mode

        // Timers
        this.deathTimer = 0;
        this.deathPauseDuration = config.deathPauseDuration ?? 2;

        // Input buffer
        this.inputDirection = null;
        this.desiredDirection = null;

        // Frame/tick counter for replay determinism
        this.tickCount = 0;

        // Initialize Movement System
        this.initializeMovementSystem();

        // Initialize entity state tracking
        this.initializeEntityStateTracking();
    }

    /**
     * Initialize entity state tracking for view events
     * Sets initial values to avoid emitting events on first frame
     */
    initializeEntityStateTracking() {
        // Track initial Pacman direction
        this.lastPacmanDirection = this.pacman?.direction || null;

        // Track initial ghost modes
        for (const ghost of this.ghosts) {
            this.lastGhostModes.set(ghost.ghostType, ghost.mode);
        }

        // Collision statistics
        this.collisionStats = {
            checksPerformed: 0,
            collisionsDetected: 0
        };
        this.lastPelletGrid = { x: null, y: null };

        this.bossBattleSystem = new BossBattleSystem(this);
        this.additionalPowerUpSystem = new AdditionalPowerUpSystem(this);
        this.storyMode = new StoryMode(this);

        // Profiling
        this.lastUpdateTime = 0;
        this.updateCount = 0;

        // Movement statistics
        this.movementStats = {
            movesProcessed: 0,
            movesAttempted: 0
        };
    }

    /**
     * Backward compatibility: state property
     * Returns 'this' to support old pattern gameModel.state.score
     * @deprecated Access properties directly: gameModel.score
     */
    get state() {
        return this;
    }

    get level() { return this.sessionModule.level; }
    set level(value) { this.sessionModule.level = value; }

    get score() { return this.scoreModule.score; }
    set score(value) { this.scoreModule.score = value; }

    get highScore() { return this.scoreModule.highScore; }
    set highScore(value) { this.scoreModule.highScore = value; }

    get ghostsEaten() { return this.scoreModule.ghostsEaten; }
    set ghostsEaten(value) { this.scoreModule.ghostsEaten = value; }

    get currentComboGhosts() { return this.scoreModule.currentComboGhosts; }
    set currentComboGhosts(value) { this.scoreModule.currentComboGhosts = value; }

    get maxComboGhosts() { return this.scoreModule.maxComboGhosts; }
    set maxComboGhosts(value) { this.scoreModule.maxComboGhosts = value; }

    get pelletsEaten() { return this.scoreModule.pelletsEaten; }
    set pelletsEaten(value) { this.scoreModule.pelletsEaten = value; }

    get lives() { return this.sessionModule.lives; }
    set lives(value) { this.sessionModule.lives = value; }

    get isPaused() { return this.sessionModule.isPaused; }
    set isPaused(value) { this.sessionModule.isPaused = Boolean(value); }

    get isGameOver() { return this.sessionModule.isGameOver; }
    set isGameOver(value) { this.sessionModule.isGameOver = Boolean(value); }

    get levelComplete() { return this.sessionModule.levelComplete; }
    set levelComplete(value) { this.sessionModule.levelComplete = Boolean(value); }

    get levelDeaths() { return this.sessionModule.levelDeaths; }
    set levelDeaths(value) { this.sessionModule.levelDeaths = value; }

    get isDying() { return this.playerModule.isDying; }
    set isDying(value) { this.playerModule.setDying(value); }

    /**
     * Create Player entity
     * @returns {PlayerState}
     */
    createPacman() {
        this.playerModule.setLevel(this.level);
        this.playerModule.setSpawnPoint(this.spawnPoints?.player || playerStartPosition);
        return this.playerModule.createPlayer();
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
     * Initialize new Movement System
     */
    initializeMovementSystem() {
        this.movementSystem = new MovementSystem({
            tileSize: gameConfig.tileSize,
            tunnelRow: gameConfig.tunnelRow,
            virusCoreCenter: virusCore.center,
            virusCoreEntrance: virusCore.entrance
        });

        this.movementSystem.initialize(this.maze, {
            virusCoreCenter: virusCore.center
        });

        // Register player
        this.movementSystem.registerEntity(this.pacman);

        // Register ghosts with AI
        for (const ghost of this.ghosts) {
            this.movementSystem.registerEntity(ghost, {
                aiType: ghost.ghostType,
                scatterTarget: scatterTargets[ghost.ghostType],
                initialMode: 'SCATTER'
            });
        }
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
     * Uses MovementSystem for entity movement and AI
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

        // Apply player input direction to movement system
        if (this.desiredDirection && this.pacman?.id) {
            this.movementSystem.setDirection(this.pacman.id, this.desiredDirection);
        }

        // Update via MovementSystem
        const movementEvents = this.movementSystem.update(deltaSeconds, {
            player: this.pacman,
            allEntities: this.ghosts
        });
        events.push(...movementEvents);

        // Track Pacman direction changes for view events
        this.trackPacmanDirectionChange();

        // Update Pacman state (animations, etc.)
        const pacmanStateEvents = this.pacman.update(
            deltaSeconds,
            this.maze,
            null, // Input already handled by movement system
            true
        );
        events.push(...pacmanStateEvents);

        // Update ghosts state
        for (const ghost of this.ghosts) {
            const ghostStateEvents = ghost.update(
                deltaSeconds,
                this.maze,
                this.pacman,
                true
            );
            events.push(...ghostStateEvents);

            // Track ghost mode changes for view events
            this.trackGhostModeChange(ghost);
        }

        // Update fruit
        const fruitEvents = this.fruit.update(deltaSeconds);
        events.push(...fruitEvents);

        // Clear consumed direction if it was applied
        if (
            (this.pacman.direction !== directions.NONE &&
                this.desiredDirection === this.pacman.direction) ||
            this.pacman.direction === directions.NONE
        ) {
            this.desiredDirection = null;
            this.inputDirection = null;
        }

        // Check collisions (integrated from CollisionAdapter)
        const collisionEvents = this.checkAllCollisions();
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
            this.playerModule.setDying(false);

            if (this.lives <= 0) {
                this.sessionModule.setGameOver(true);
                events.push({ type: 'game_over' });
            } else {
                this.sessionModule.consumeLife();
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
        this.scoreModule.applyEvent(event);

        switch (event.type) {
        case 'power_pellet_eaten':
            this.setGhostsFrightened(event.frightenedDuration);
            break;

        case 'pacman_died':
            this.sessionModule.onPacmanDeath();
            this.onPacmanDeath();
            break;

        case 'level_complete':
            this.sessionModule.markLevelComplete();
            break;

        default:
            break;
        }
    }

    /**
     * Check and update high score
     */
    checkHighScore() {
        this.scoreModule.checkHighScore();
    }

    /**
     * Set all ghosts to frightened mode
     * @param {number} duration - Duration in seconds
     */
    setGhostsFrightened(duration) {
        this.movementSystem.setFrightened(duration);
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
        this.deathTimer = 0;
        this.sessionModule.levelComplete = false;
        this.playerModule.onPacmanDeath(this.pacman);
    }

    /**
     * Reset positions after death
     */
    resetPositions() {
        this.playerModule.resetPlayer(this.pacman);

        for (const ghost of this.ghosts) {
            ghost.reset();
        }

        this.fruit.reset();
        this.scoreModule.resetCombo();
        this.additionalPowerUpSystem.reset();

        this.resetMovementStats();
        this.resetCollisionStats();

        this.movementSystem.reset();
        // Re-register entities after reset
        this.movementSystem.registerEntity(this.pacman);
        for (const ghost of this.ghosts) {
            this.movementSystem.registerEntity(ghost, {
                aiType: ghost.ghostType,
                scatterTarget: scatterTargets[ghost.ghostType],
                initialMode: 'SCATTER'
            });
        }

        // Reset tracking
        this.lastPacmanDirection = null;
        this.lastGhostModes.clear();
    }

    /**
     * Track Pacman direction changes and emit view events
     * Phase 3: Emits VIEW_EVENTS.PACMAN_DIRECTION_CHANGED
     */
    trackPacmanDirectionChange() {
        const currentDirection = this.pacman.direction;

        if (this.lastPacmanDirection !== currentDirection) {
            gameEvents.emit(VIEW_EVENTS.PACMAN_DIRECTION_CHANGED, {
                oldDirection: this.lastPacmanDirection,
                newDirection: currentDirection,
                gridX: this.pacman.gridX,
                gridY: this.pacman.gridY,
                timestamp: Date.now()
            });

            this.lastPacmanDirection = currentDirection;
        }
    }

    /**
     * Track ghost mode changes and emit view events
     * Phase 3: Emits VIEW_EVENTS.GHOST_MODE_CHANGED
     * @param {EnemyState} ghost - Ghost entity to track
     */
    trackGhostModeChange(ghost) {
        const lastMode = this.lastGhostModes.get(ghost.ghostType);
        const currentMode = ghost.mode;

        if (lastMode !== currentMode) {
            gameEvents.emit(VIEW_EVENTS.GHOST_MODE_CHANGED, {
                ghostType: ghost.ghostType,
                oldMode: lastMode,
                newMode: currentMode,
                isFrightened: ghost.isFrightened,
                isEaten: ghost.isEaten,
                timestamp: Date.now()
            });

            this.lastGhostModes.set(ghost.ghostType, currentMode);
        }
    }

    /**
     * Advance to next level
     */
    nextLevel() {
        // Complete story chapter if applicable
        this.storyMode.completeChapter();

        this.sessionModule.startNextLevel();
        this.level = this.sessionModule.level;

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
        this.scoreModule.resetCombo();
        this.additionalPowerUpSystem.reset();

        this.resetMovementStats();
        this.resetCollisionStats();

        // Reinitialize MovementSystem for new level
        this.initializeMovementSystem();
    }

    /**
     * Emit events via EventBus for view layer
     * Phase 3: Emits both GAME_EVENTS and VIEW_EVENTS
     * - GAME_EVENTS: Game-flow specific (Level Complete, Game Over, etc.)
     * - VIEW_EVENTS: Rendering-specific (Entity movement, Pellet eaten, etc.)
     * @param {Array<Object>} events - Events to emit
     */
    emitEvents(events) {
        for (const event of events) {
            switch (event.type) {
            case 'pellet_eaten':
                // GAME_EVENTS: For controller and game flow
                gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {
                    score: event.score,
                    pelletsRemaining: event.pelletsRemaining,
                    gridX: event.gridX,
                    gridY: event.gridY
                });
                // VIEW_EVENTS: For view rendering (particle effects, etc.)
                gameEvents.emit(VIEW_EVENTS.PELLET_EATEN, {
                    score: event.score,
                    pelletsRemaining: event.pelletsRemaining,
                    gridX: event.gridX,
                    gridY: event.gridY,
                    timestamp: Date.now()
                });
                break;

            case 'power_pellet_eaten':
                // GAME_EVENTS: For controller and game flow
                gameEvents.emit(GAME_EVENTS.POWER_PELLET_EATEN, {
                    score: event.score,
                    pelletsRemaining: event.pelletsRemaining,
                    frightenedDuration: event.frightenedDuration,
                    gridX: event.gridX,
                    gridY: event.gridY
                });
                // VIEW_EVENTS: For view rendering (visual effects)
                gameEvents.emit(VIEW_EVENTS.PELLET_EATEN, {
                    score: event.score,
                    pelletsRemaining: event.pelletsRemaining,
                    gridX: event.gridX,
                    gridY: event.gridY,
                    type: 'power_pellet',
                    timestamp: Date.now()
                });
                // Screen flash effect
                gameEvents.emit(VIEW_EVENTS.SCREEN_FLASH, {
                    color: 0xffff00,
                    duration: 200,
                    timestamp: Date.now()
                });
                break;

            case 'ghost_eaten':
                // GAME_EVENTS: For controller and game flow
                gameEvents.emit(GAME_EVENTS.GHOST_EATEN, {
                    score: event.score,
                    ghostType: event.ghostType,
                    combo: event.combo
                });
                // VIEW_EVENTS: For view rendering (ghost disappearing effect)
                gameEvents.emit(VIEW_EVENTS.GHOST_EATEN, {
                    score: event.score,
                    ghostType: event.ghostType,
                    combo: event.combo,
                    timestamp: Date.now()
                });
                break;

            case 'fruit_eaten':
                // GAME_EVENTS: For controller and game flow
                gameEvents.emit(GAME_EVENTS.FRUIT_EATEN, {
                    score: event.score
                });
                // VIEW_EVENTS: For view rendering (fruit collected effect)
                gameEvents.emit(VIEW_EVENTS.FRUIT_EATEN, {
                    score: event.score,
                    timestamp: Date.now()
                });
                break;

            case 'pacman_died':
                // GAME_EVENTS: For controller and game flow
                gameEvents.emit(GAME_EVENTS.LIVES_LOST, {
                    livesRemaining: event.livesRemaining ?? this.lives
                });
                // VIEW_EVENTS: For view rendering (death animation)
                gameEvents.emit(VIEW_EVENTS.PACMAN_DEATH_STARTED, {
                    livesRemaining: event.livesRemaining ?? this.lives,
                    timestamp: Date.now()
                });
                break;

            case 'level_complete':
                // GAME_EVENTS: For controller and game flow
                gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, {
                    level: this.level,
                    score: this.score
                });
                // VIEW_EVENTS: For view rendering (completion effect)
                gameEvents.emit(VIEW_EVENTS.EFFECT_CREATED, {
                    effectType: 'level_complete',
                    timestamp: Date.now()
                });
                break;

            case 'game_over':
                // GAME_EVENTS: For controller and game flow
                gameEvents.emit(GAME_EVENTS.GAME_OVER, {
                    score: this.score,
                    highScore: this.highScore
                });
                // VIEW_EVENTS: For view rendering (screen shake, flash)
                gameEvents.emit(VIEW_EVENTS.SCREEN_SHAKE, {
                    intensity: 10,
                    duration: 500,
                    timestamp: Date.now()
                });
                gameEvents.emit(VIEW_EVENTS.SCREEN_FLASH, {
                    color: 0xff0000,
                    duration: 300,
                    timestamp: Date.now()
                });
                break;

            case 'respawn':
                // GAME_EVENTS: For controller and game flow
                gameEvents.emit(GAME_EVENTS.RESPAWN, {
                    livesRemaining: this.lives
                });
                // VIEW_EVENTS: For view rendering (respawn effect)
                gameEvents.emit(VIEW_EVENTS.EFFECT_CREATED, {
                    effectType: 'respawn',
                    timestamp: Date.now()
                });
                break;

            case 'score_changed':
                // GAME_EVENTS: For controller and game flow
                gameEvents.emit(GAME_EVENTS.SCORE_CHANGED, {
                    score: this.score,
                    highScore: this.highScore
                });
                // No view event needed - score is part of snapshot
                break;

            case 'movement_started':
                // Internal event - emit view event for entity movement
                gameEvents.emit(VIEW_EVENTS.ENTITY_MOVED, {
                    entityId: event.entityId,
                    direction: event.direction,
                    fromGrid: event.fromGrid,
                    toGrid: event.toGrid,
                    timestamp: Date.now()
                });
                break;

            case 'movement_completed':
                // Internal event - no view event needed (position in snapshot)
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
        const isPaused = this.sessionModule.setPaused(paused);
        gameEvents.emit(GAME_EVENTS.PAUSE_TOGGLED, { isPaused });
    }

    /**
     * Toggle paused state
     * @returns {boolean} - New paused state
     */
    togglePaused() {
        const isPaused = this.sessionModule.togglePaused();
        gameEvents.emit(GAME_EVENTS.PAUSE_TOGGLED, { isPaused });
        return isPaused;
    }

    /**
     * Set game over state
     * @param {boolean} isGameOver
     */
    setGameOver(isGameOver) {
        this.sessionModule.setGameOver(isGameOver);
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
            this.sessionModule.markLevelComplete();
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

        // Notify MovementSystem
        this.movementSystem.onGhostEaten(ghost);

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
     * Returns an immutable GameSnapshot object for view consumption
     * @returns {GameSnapshot}
     */
    getSnapshot() {
        // Deep freeze maze and pelletGrid arrays for true immutability
        const deepFreezeArray = (arr) => {
            if (!arr) {
                return arr;
            }
            const frozen = arr.map(row => Object.freeze([...row]));
            return Object.freeze(frozen);
        };

        const snapshotData = {
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

            // Maze data for view rendering (deep frozen for immutability)
            maze: deepFreezeArray(this.maze),
            pelletGrid: deepFreezeArray(this.pelletGrid),

            // Entity snapshots
            pacman: Object.freeze(this.pacman.getSnapshot()),
            ghosts: Object.freeze(this.ghosts.map((g) => Object.freeze(g.getSnapshot()))),
            fruit: Object.freeze(this.fruit.getSnapshot()),

            // Advanced features
            boss: Object.freeze(this.bossBattleSystem.getSnapshot()),
            powerUps: Object.freeze(this.additionalPowerUpSystem.getSnapshot()),
            story: Object.freeze(this.storyMode.getSnapshot()),

            // Debug info
            tickCount: this.tickCount
        };

        // Return immutable snapshot (Object.freeze makes it read-only)
        return Object.freeze(snapshotData);
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
            movementStats: this.getMovementStats(),
            collisionStats: this.getCollisionStats()
        };
    }

    // ============================================================
    // MOVEMENT METHODS
    // ============================================================

    /**
     * Get movement statistics
     * @returns {Object}
     */
    getMovementStats() {
        return this.movementStats;
    }

    /**
     * Reset movement statistics
     */
    resetMovementStats() {
        this.movementStats = {
            movesProcessed: 0,
            movesAttempted: 0
        };
    }

    // ============================================================
    // COLLISION METHODS (Integrated from CollisionAdapter)
    // ============================================================

    /**
     * Check all collisions for current frame
     * @returns {Array<Object>} - Collision events
     */
    checkAllCollisions() {
        const events = [];

        const pelletEvents = this.checkPelletCollision();
        events.push(...pelletEvents);

        const ghostEvent = this.checkGhostCollisions();
        if (ghostEvent) {
            events.push(ghostEvent);
        }

        const fruitEvent = this.checkFruitCollision();
        if (fruitEvent) {
            events.push(fruitEvent);
        }

        return events;
    }

    /**
     * Check pellet collision at Pacman's position
     * @returns {Array<Object>} - Array of collision events
     */
    checkPelletCollision() {
        const pacman = this.pacman;
        const gridX = Math.floor(pacman.x / gameConfig.tileSize);
        const gridY = Math.floor(pacman.y / gameConfig.tileSize);

        // Prevent duplicate eating at same position
        if (gridX === this.lastPelletGrid.x && gridY === this.lastPelletGrid.y) {
            return [];
        }

        const pelletType = this.getPelletAt(gridX, gridY);
        if (pelletType === PELLET_TYPES.NONE) {
            return [];
        }

        // Simple distance check for eating
        const tileCenterX = gridX * gameConfig.tileSize + gameConfig.tileSize / 2;
        const tileCenterY = gridY * gameConfig.tileSize + gameConfig.tileSize / 2;
        const dx = pacman.x - tileCenterX;
        const dy = pacman.y - tileCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > gameConfig.tileSize * 0.5) {
            return [];
        }

        const result = this.eatPelletAt(gridX, gridY);
        if (!result) {
            return [];
        }

        this.lastPelletGrid = { x: gridX, y: gridY };

        const isPowerPellet = result.type === 'power_pellet';
        const score = isPowerPellet ? scoreValues.powerPellet : scoreValues.pellet;

        const pelletEvent = {
            type: isPowerPellet ? 'power_pellet_eaten' : 'pellet_eaten',
            gridX: result.gridX,
            gridY: result.gridY,
            score: score,
            pelletsRemaining: result.pelletsRemaining
        };

        if (isPowerPellet) {
            pelletEvent.frightenedDuration = this.getFrightenedDuration();
        }

        this.collisionStats.checksPerformed++;
        this.collisionStats.collisionsDetected++;

        const events = [pelletEvent];
        if (result.levelComplete) {
            events.push({
                type: 'level_complete',
                score: this.score,
                level: this.level
            });
        }

        return events;
    }

    /**
     * Check collisions between Pacman and all ghosts
     * @returns {Object|null}
     */
    checkGhostCollisions() {
        const pacman = this.pacman;
        const collisionRadius = gameConfig.tileSize * 0.6;

        for (const ghost of this.ghosts) {
            if (ghost.isEaten) {
                continue;
            }

            const dx = pacman.x - ghost.x;
            const dy = pacman.y - ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= collisionRadius) {
                this.collisionStats.checksPerformed++;
                this.collisionStats.collisionsDetected++;
                return this.handleGhostCollision(ghost);
            }
        }

        return null;
    }

    /**
     * Handle ghost collision result
     * @param {EnemyState} ghost - Ghost that collided
     * @returns {Object}
     */
    handleGhostCollision(ghost) {
        if (ghost.isFrightened) {
            const scoreIndex = Math.min(this.currentComboGhosts, 3);
            const scores = [200, 400, 800, 1600];
            const score = scores[scoreIndex];

            ghost.eat();

            return {
                type: 'ghost_eaten',
                ghostType: ghost.ghostType,
                score: score,
                combo: this.currentComboGhosts + 1
            };
        } else {
            return {
                type: 'pacman_died',
                livesRemaining: this.lives
            };
        }
    }

    /**
     * Check fruit collision
     * @returns {Object|null}
     */
    checkFruitCollision() {
        const fruit = this.fruit;
        if (!fruit.active) {
            return null;
        }

        const pacman = this.pacman;
        const collisionRadius = gameConfig.tileSize;

        const dx = pacman.x - fruit.x;
        const dy = pacman.y - fruit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > collisionRadius) {
            return null;
        }

        const score = fruit.eat();

        this.collisionStats.checksPerformed++;
        this.collisionStats.collisionsDetected++;

        return {
            type: 'fruit_eaten',
            score: score,
            fruitType: fruit.getFruitType().name
        };
    }

    /**
     * Get collision statistics
     * @returns {Object}
     */
    getCollisionStats() {
        return this.collisionStats;
    }

    /**
     * Reset collision statistics
     */
    resetCollisionStats() {
        this.lastPelletGrid = { x: null, y: null };
        this.collisionStats = {
            checksPerformed: 0,
            collisionsDetected: 0
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
