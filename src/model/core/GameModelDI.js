/**
 * GameModelDI (Phase 4 - DI Adaptation)
 * Facade Pattern with Dependency Injection
 *
 * Refactored to use ServiceContainer for all service dependencies
 * - Loosely coupled through DI
 * - Easier to test (can inject mock services)
 * - Better control over service lifecycles
 *
 * Structure:
 * - GameModelCollisionHandlers.js: Collision event handlers
 * - GameModelStep.js: Game loop step logic
 * - GameModelDI.js: Main facade class (this file)
 */

import { globalContainer } from '../../core/ServiceContainer.js';
import { MovementSystem } from '../../movement/MovementSystem.js';
import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';
import { createCollisionHandlers } from './GameModelCollisionHandlers.js';
import { executeStep, createSnapshot } from './GameModelStep.js';

export default class GameModelDI {
    /**
     * @param {Object} config - Game configuration
     * @param {number} config.level - Starting level
     * @param {number} config.score - Initial score
     * @param {number} config.lives - Initial lives
     * @param {number} config.highScore - High score
     * @param {Array<Array<number>>} config.maze - Optional maze override
     * @param {Array<Array<number>>} config.pelletGrid - Optional pellet grid override
     * @param {boolean} config.useDI - Whether to use DI (default: true)
     */
    constructor(config = {}, useDI = true) {
        this.useDI = useDI;
        this.eventUnsubscribers = [];
        this.movementEntityIds = {
            player: null,
            ghosts: {}
        };

        // Always initialize when using DI, or when config is provided
        if (useDI || Object.keys(config).length > 0) {
            this.init(config);
        }
    }

    init(config = {}) {
        if (this.useDI) {
            this.initializeWithDI(config);
        } else {
            this.initializeLegacy(config);
        }
    }

    initializeWithDI(config) {
        // Services are already registered by GameScene
        // Just get them from container
        this.gameState = globalContainer.get('gameState');
        this.levelSystem = globalContainer.get('levelSystem');
        this.spawningSystem = globalContainer.get('spawningSystem');
        this.entityRegistry = globalContainer.get('entityRegistry');
        this.collisionHandler = globalContainer.get('collisionHandler');
        this.movementSystem = globalContainer.get('movementSystem');
        this.playerModule = globalContainer.get('playerModule');
        this.scoreModule = globalContainer.get('scoreModule');
        this.sessionModule = globalContainer.get('sessionModule');

        // Initialize gameState from config
        this.levelSystem.setLevel(config.level || 1);
        if (config.level !== undefined) {
            this.gameState.level = config.level;
        }
        if (config.score !== undefined) {
            this.gameState.score = config.score;
        }
        if (config.lives !== undefined) {
            this.gameState.lives = config.lives;
        }
        if (config.highScore !== undefined) {
            this.gameState.highScore = config.highScore;
        }

        this.initializeMovementSystem();
        this.registerMovementEntities();
        this.setupCollisionCallbacks();
    }

    initializeLegacy(config) {
        // Legacy initialization (backward compatibility)
        const { SpawningSystem } = require('../systems/SpawningSystem.js');
        const { EntityRegistry } = require('./EntityRegistry.js');
        const { CollisionHandler } = require('./CollisionHandler.js');
        const { GameState } = require('./GameState.js');
        const { LevelSystem } = require('../systems/LevelSystem.js');

        this.levelSystem = new LevelSystem();
        this.levelSystem.setLevel(config.level || 1);

        this.spawningSystem = new SpawningSystem({
            level: config.level || 1
        });

        this.spawningSystem.generateMazeForLevel(config.level || 1);

        this.gameState = new GameState({
            level: config.level || 1,
            lives: config.lives ?? 3,
            score: config.score || 0,
            highScore: config.highScore || 0,
            deathPauseDuration: config.deathPauseDuration
        });

        this.entityRegistry = new EntityRegistry({
            level: config.level || 1,
            spawnPoints: this.spawningSystem.getSpawnPoints()
        });

        this.collisionHandler = new CollisionHandler(
            createCollisionHandlers(this)
        );

        this.initializeMovementSystem();
        this.registerMovementEntities();
    }

    /**
     * Initialize movement system
     */
    initializeMovementSystem() {
        // Only create if not already provided via DI
        if (!this.movementSystem) {
            this.movementSystem = new MovementSystem({
                tileSize: 20,
                tunnelRow: 15,
                virusCoreCenter: { x: 13, y: 14 },
                virusCoreEntrance: { x: 13, y: 11 }
            });
        }

        // Initialize if the method exists (might be a mock)
        if (this.movementSystem.initialize) {
            this.movementSystem.initialize(this.spawningSystem.getMaze(), {
                tileConfig: { wall: 1, pellet: 2, empty: 0 },
                modeDurations: this.levelSystem.getModeDurations(),
                frightenedDuration: this.levelSystem.getFrightenedDuration()
            });
        }
    }

    /**
     * Register entities in movement system
     */
    registerMovementEntities() {
        this.entityRegistry.createPacman();
        this.entityRegistry.createGhosts();
        this.entityRegistry.createFruit();

        const pacman = this.entityRegistry.getPacman();
        this.movementSystem.registerEntity(pacman, { type: 'player', speed: 100 });
        this.movementEntityIds.player = pacman.id;

        for (const ghost of this.entityRegistry.getGhosts()) {
            this.movementSystem.registerEntity(ghost, {
                type: 'ghost',
                speed: 80,
                aiType: ghost.ghostType,
                initialMode: 'SCATTER'
            });
            this.movementEntityIds.ghosts[ghost.ghostType] = ghost.id;
        }

        // Setup feature system event listeners
        this.setupFeatureSystemEventListeners();
    }

    /**
     * Setup event listeners for feature systems
     */
    setupFeatureSystemEventListeners() {
        // BOSS_DEFEATED - Add bonus score when boss is defeated
        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.BOSS_DEFEATED, (data) => {
                this.score += data.scoreBonus;
                this.checkHighScore();
            })
        );

        // CHAPTER_COMPLETED - Add bonus score when chapter is completed
        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.CHAPTER_COMPLETED, (data) => {
                this.score += data.bonusPoints;
                this.checkHighScore();
            })
        );

        // PELLET_MAGNET_EAT - Data Magnet Power-Up effect
        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.PELLET_MAGNET_EAT, (data) => {
                const result = this.eatPelletAt(data.x, data.y);
                if (result) {
                    this.score += 10;
                    gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {
                        score: 10,
                        pelletsRemaining: this.pelletsRemaining,
                        gridX: data.x,
                        gridY: data.y
                    });
                }
            })
        );

        // Register gameState in entityRegistry
        this.entityRegistry.registerEntity('gameState', {
            isBossBattleActive: () => this.bossBattleSystem?.isBossBattleActive() || false
        });

        // Register pelletGrid in entityRegistry
        this.entityRegistry.registerEntity('pelletGrid', this.spawningSystem.getPelletGrid());
    }

    /**
     * Setup collision callbacks
     */
    setupCollisionCallbacks() {
        const handlers = createCollisionHandlers(this);
        Object.assign(this.collisionHandler, handlers);
    }

    // === Main Game Loop ===

    step(deltaSeconds, input = null) {
        return executeStep(this, deltaSeconds, input);
    }

    // === Level Management ===

    startLevel(level) {
        this.level = level;
        const mazeData = this.spawningSystem.generateMazeForLevel(level);
        const EntityRegistry = require('./EntityRegistry.js').default;
        this.entityRegistry = new EntityRegistry({
            level,
            spawnPoints: mazeData.spawnPoints
        });
        this.resetPositions();
        this.gameState.resetForLevel(level);
    }

    nextLevel() {
        const next = this.level + 1;
        this.level = next;
        this.startLevel(next);
    }

    shouldSpawnFruit() {
        return this.levelSystem.shouldSpawnFruit(this.pelletsEaten, this.totalPellets);
    }

    // === Input Handling ===

    setDesiredDirection(direction) {
        const pacman = this.entityRegistry?.getPacman();
        if (pacman) {
            pacman.setDesiredDirection(direction);
        }
        if (this.movementSystem && this.movementEntityIds?.player) {
            this.movementSystem.setDirection(this.movementEntityIds.player, direction);
        }
    }

    setInputDirection(direction) {
        this.setDesiredDirection(direction);
    }

    // === Ghost Management ===

    setGhostsFrightened(duration) {
        const ghosts = this.entityRegistry?.getGhosts() || [];
        for (const ghost of ghosts) {
            if (ghost) {
                ghost.setFrightened(duration);
            }
        }
    }

    resetPositions() {
        if (this.entityRegistry) {
            this.entityRegistry.resetPositions();
        }

        if (this.movementSystem && this.spawningSystem) {
            const spawnPoints = this.spawningSystem.getSpawnPoints();
            const spawnPoint = spawnPoints?.player || { x: 13, y: 23 };

            if (this.movementEntityIds?.player) {
                this.movementSystem.resetEntity(
                    this.movementEntityIds.player,
                    spawnPoint.x,
                    spawnPoint.y
                );
            }

            const ghostSpawns = spawnPoints?.ghosts || {};
            const ghosts = this.entityRegistry?.getGhosts() || [];
            for (const ghost of ghosts) {
                const ghostId = this.movementEntityIds?.ghosts?.[ghost.ghostType];
                const ghostSpawn = ghostSpawns[ghost.ghostType];
                if (ghostId && ghostSpawn) {
                    this.movementSystem.resetEntity(ghostId, ghostSpawn.x, ghostSpawn.y);
                }
            }
        }
    }

    // === High Score ===

    checkHighScore() {
        if (this.gameState.score > this.gameState.highScore) {
            this.gameState.highScore = this.gameState.score;
        }
    }

    // === Utility Methods ===

    eatPelletAt(x, y) {
        return this.spawningSystem.removePelletAt(x, y);
    }

    // === Snapshots & Serialization ===

    getSnapshot() {
        return createSnapshot(this);
    }

    serialize() {
        return JSON.stringify(this.getSnapshot());
    }

    getStats() {
        return {
            ...this.gameState.getProfilingStats(),
            movement: this.movementSystem?.getStats() || {},
            collision: this.collisionHandler.getStats()
        };
    }

    // === Backward Compatibility ===

    /**
     * @deprecated Access properties directly
     */
    get state() {
        return this;
    }

    /**
     * Get DI statistics
     */
    getDIStats() {
        return {
            usingDI: this.useDI,
            serviceStats: globalContainer.getServiceNames(),
            instantiatedStats: globalContainer.getInstanceNames()
        };
    }

    /**
     * Cleanup - unsubscribe all event listeners
     */
    destroy() {
        this.eventUnsubscribers.forEach((unsubscribe) => unsubscribe());
        this.eventUnsubscribers = [];
    }

    // === Property Getters/Setters ===

    get tickCount() {
        return this.gameState.tick;
    }
    set tickCount(value) {
        this.gameState.tick = value;
    }

    get level() {
        return this.gameState.level;
    }
    set level(value) {
        this.gameState.level = value;
    }

    get score() {
        return this.gameState.score;
    }
    set score(value) {
        this.gameState.score = value;
    }

    get highScore() {
        return this.gameState.highScore;
    }
    set highScore(value) {
        this.gameState.highScore = value;
    }

    get lives() {
        return this.gameState.lives;
    }
    set lives(value) {
        this.gameState.lives = value;
    }

    get pelletsEaten() {
        return this.scoreModule.pelletsEaten;
    }
    set pelletsEaten(value) {
        this.scoreModule.pelletsEaten = value;
    }

    get ghostsEaten() {
        return this.scoreModule.ghostsEaten;
    }
    set ghostsEaten(value) {
        this.scoreModule.ghostsEaten = value;
    }

    get pelletsRemaining() {
        return this.spawningSystem.getPelletsRemaining();
    }
    set pelletsRemaining(value) {
        this.spawningSystem.setPelletsRemaining(value);
    }

    get totalPellets() {
        return this.spawningSystem.getTotalPellets();
    }

    get isPaused() {
        return this.gameState.isPaused;
    }
    set isPaused(value) {
        this.gameState.isPaused = value;
    }

    get isGameOver() {
        return this.gameState.isGameOver;
    }
    set isGameOver(value) {
        this.gameState.isGameOver = value;
    }

    get levelComplete() {
        return this.gameState.levelComplete;
    }
    set levelComplete(value) {
        this.gameState.levelComplete = value;
    }

    get isDying() {
        return this.gameState.isDying;
    }
    set isDying(value) {
        this.gameState.isDying = value;
    }

    get levelDeaths() {
        return this.gameState.levelDeaths;
    }
    set levelDeaths(value) {
        this.gameState.levelDeaths = value;
    }

    get pacman() {
        return this.entityRegistry.getPacman();
    }
    get ghosts() {
        return this.entityRegistry.getGhosts();
    }
    get fruit() {
        return this.entityRegistry.getFruit();
    }

    get maze() {
        return this.spawningSystem.getMaze();
    }
    get pelletGrid() {
        return this.spawningSystem.getPelletGrid();
    }

    getGhostByType(ghostType) {
        return this.entityRegistry.getGhostByType(ghostType);
    }

    // === Level Config ===

    setLevelConfig(config) {
        this.levelSystem.setLevelConfig(config);
    }

    getSpeedMultiplier() {
        return this.levelSystem.getSpeedMultiplier();
    }

    getFrightenedDuration() {
        return this.levelSystem.getFrightenedDuration();
    }

    // === Control Methods ===

    setPaused(paused) {
        this.isPaused = paused;
        if (paused) {
            this.movementSystem?.pause();
        } else {
            this.movementSystem?.resume();
        }
    }

    togglePaused() {
        this.setPaused(!this.isPaused);
    }

    setGameOver(isGameOver) {
        this.isGameOver = isGameOver;
    }
}
