/**
 * GameModelDI (Phase 4 - DI Adaptation)
 * Facade Pattern with Dependency Injection
 *
 * Refactored to use ServiceContainer for all service dependencies
 * - Loosely coupled through DI
 * - Easier to test (can inject mock services)
 * - Better control over service lifecycles
 */

import { globalContainer } from '../../core/ServiceContainer.js';
import { MovementSystem } from '../../movement/MovementSystem.js';
import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';

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
        if (config.level !== undefined) {this.gameState.level = config.level;}
        if (config.score !== undefined) {this.gameState.score = config.score;}
        if (config.lives !== undefined) {this.gameState.lives = config.lives;}
        if (config.highScore !== undefined) {this.gameState.highScore = config.highScore;}

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

        this.collisionHandler = new CollisionHandler({
            onPelletEaten: this.handlePelletEaten.bind(this),
            onPowerPelletEaten: this.handlePowerPelletEaten.bind(this),
            onGhostEaten: this.handleGhostEaten.bind(this),
            onPacmanDied: this.handlePacmanDied.bind(this),
            onFruitEaten: this.handleFruitEaten.bind(this)
        });

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

        // PHASE 6: Setup feature system event listeners
        this.setupFeatureSystemEventListeners();
    }

    /**
     * PHASE 6: Setup event listeners for feature systems
     * Feature systems communicate via EventBus instead of direct GameModel access
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

        // Register gameState in entityRegistry (for BossBattleSystem check)
        this.entityRegistry.registerEntity('gameState', {
            isBossBattleActive: () => this.bossBattleSystem?.isBossBattleActive() || false
        });

        // Register pelletGrid in entityRegistry (for AdditionalPowerUpSystem)
        this.entityRegistry.registerEntity('pelletGrid', this.spawningSystem.getPelletGrid());
    }

    /**
     * Setup collision callbacks
     */
    setupCollisionCallbacks() {
        this.collisionHandler.onPelletEaten = this.handlePelletEaten.bind(this);
        this.collisionHandler.onPowerPelletEaten = this.handlePowerPelletEaten.bind(this);
        this.collisionHandler.onGhostEaten = this.handleGhostEaten.bind(this);
        this.collisionHandler.onPacmanDied = this.handlePacmanDied.bind(this);
        this.collisionHandler.onFruitEaten = this.handleFruitEaten.bind(this);
    }

    // === Main Game Loop ===

    step(deltaSeconds, input = null) {
        // Pause/GameOver Check
        if (this.isPaused || this.isGameOver) {
            return [];
        }

        // Death Sequence
        if (this.isDying) {
            return this.updateDeathSequence(deltaSeconds);
        }

        // Input Handling
        if (input?.direction) {
            this.setDesiredDirection(input.direction);
        }

        // Update Movement - with null guards
        const pacman = this.entityRegistry?.getPacman();
        const ghosts = this.entityRegistry?.getGhosts() || [];
        const movementEvents = this.movementSystem?.update(deltaSeconds, {
            player: pacman,
            pacman: pacman,
            ghosts: ghosts
        }) || [];

        // Update Entities - with null guards
        const maze = this.spawningSystem?.getMaze();
        if (pacman && maze) {
            pacman.update(deltaSeconds, maze);
        }

        for (const ghost of ghosts) {
            if (ghost && maze) {
                ghost.update(deltaSeconds, maze);
            }
        }

        // Update Fruit - with null guard
        const fruit = this.entityRegistry?.getFruit();
        if (fruit) {
            fruit.update(deltaSeconds);
        }

        // Collision Detection - with null guards
        const entities = {
            pacman: pacman,
            ghosts: ghosts,
            fruit: fruit
        };

        const collisionEvents = this.collisionHandler?.checkAllCollisions(entities, {
            pelletGrid: this.spawningSystem?.getPelletGrid(),
            pelletsRemaining: this.spawningSystem?.getPelletsRemaining()
        }) || [];

        // Apply Collision Effects
        for (const event of collisionEvents) {
            this.applyCollisionEffect(event);
        }

        // Sync Movement to Entities - with null guard
        this.movementSystem?.syncToEntities();

        // Emit Events
        const events = [...movementEvents, ...collisionEvents];
        this.emitEvents(events);

        // Update tick counter - with null guard
        if (this.gameState) {
            this.gameState.incrementTick();
            this.tickCount = this.gameState.tick;
        }

        return events;
    }

    updateDeathSequence(deltaSeconds) {
        this.gameState.updateDeathTimer(deltaSeconds);

        if (this.gameState.isDeathComplete()) {
            if (this.lives <= 1) {
                // Last life lost - game over
                this.setGameOver(true);
                gameEvents.emit(GAME_EVENTS.GAME_OVER, {
                    score: this.score,
                    highScore: this.highScore,
                    level: this.level
                });
            } else {
                this.lives--;
                this.resetPositions();
                this.isDying = false;
                gameEvents.emit(GAME_EVENTS.RESPAWN);
                return [{ type: 'respawn' }];
            }
        }

        return [];
    }

    // === Collision Event Handlers ===

    handlePelletEaten(data) {
        if (!this.scoreModule || !this.gameState || !this.spawningSystem) {return;}
        this.scoreModule.pelletsEaten++;
        this.gameState.score += 10;
        this.spawningSystem.removePelletAt(data?.gridX, data?.gridY);
        this.checkHighScore();
        this.checkLevelComplete();
    }

    handlePowerPelletEaten(data) {
        if (!this.scoreModule || !this.gameState || !this.spawningSystem || !this.levelSystem) {return;}
        this.scoreModule.pelletsEaten++;
        this.gameState.score += 50;
        this.spawningSystem.removePelletAt(data?.gridX, data?.gridY);
        this.checkHighScore();
        this.checkLevelComplete();
        this.setGhostsFrightened(this.levelSystem.getFrightenedDuration());
    }

    checkLevelComplete() {
        if (!this.spawningSystem) {return;}
        if (this.pelletsRemaining === 0 && !this.levelComplete) {
            this.levelComplete = true;
            gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, {
                level: this.level,
                score: this.score
            });
        }
    }

    handleGhostEaten(data) {
        if (!this.entityRegistry || !this.scoreModule || !this.gameState || !this.levelSystem) {return;}
        const ghost = this.entityRegistry.getGhostByType(data?.ghostType);
        if (ghost) {
            ghost.eat();
            const eatenCount = ghost.eatenCount ?? 0;
            const baseScore = [200, 400, 800, 1600][eatenCount % 4] ?? 200;
            const multiplier = this.levelSystem.getScoreMultiplier() ?? 1;
            const score = baseScore * multiplier;

            this.scoreModule.currentComboGhosts++;
            this.gameState.score += score;
            this.gameState.ghostsEaten++;
            this.gameState.maxComboGhosts = Math.max(
                this.gameState.maxComboGhosts,
                this.scoreModule.currentComboGhosts
            );
            this.checkHighScore();
        }
    }

    handlePacmanDied(_data) {
        this.onPacmanDeath();
    }

    handleFruitEaten(data) {
        if (!this.entityRegistry || !this.levelSystem || !this.gameState) {return;}
        const fruit = this.entityRegistry.getFruit();
        if (fruit) {
            fruit.eat();
            const score = this.levelSystem.getFruitScore(data?.fruitType);
            this.gameState.score += score;
            this.checkHighScore();
        }
    }

    // === Collision Effect Application ===

    applyCollisionEffect(event) {
        switch (event.type) {
        case 'pelletEaten':
        case 'powerPelletEaten':
        case 'ghostEaten':
        case 'fruitEaten':
            // Already handled in callbacks
            break;
        case 'pacmanDied':
            this.onPacmanDeath();
            break;
        }
    }

    // === Death Sequence ===

    onPacmanDeath() {
        this.isDying = true;
        this.gameState.startDeathTimer();
        this.levelDeaths++;
    }

    // === Level Management ===

    startLevel(level) {
        this.level = level;
        const mazeData = this.spawningSystem.generateMazeForLevel(level);
        this.entityRegistry = new (require('./EntityRegistry.js').default)({
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
        // Also update movement system with the new direction
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
        // Reset positions in entity registry - with null guard
        if (this.entityRegistry) {
            this.entityRegistry.resetPositions();
        }

        // Also reset positions in movement system to keep them in sync
        if (this.movementSystem && this.spawningSystem) {
            const spawnPoints = this.spawningSystem.getSpawnPoints();
            const spawnPoint = spawnPoints?.player || { x: 13, y: 23 };

            if (this.movementEntityIds?.player) {
                this.movementSystem.resetEntity(this.movementEntityIds.player, spawnPoint.x, spawnPoint.y);
            }

            // Reset ghosts in movement system
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

    // === Event Emission ===

    emitEvents(events) {
        for (const event of events) {
            gameEvents.emit(event.type, event);
        }
    }

    // === Utility Methods ===

    eatPelletAt(x, y) {
        return this.spawningSystem.removePelletAt(x, y);
    }

    // === Snapshots & Serialization ===

    getSnapshot() {
        const ghostsSnapshot = new Array(this.ghosts.length);
        for (let i = 0; i < this.ghosts.length; i++) {
            ghostsSnapshot[i] = this.ghosts[i].getSnapshot();
        }

        return {
            tickCount: this.tickCount,
            level: this.level,
            score: this.score,
            highScore: this.highScore,
            lives: this.lives,
            pelletsEaten: this.pelletsEaten,
            ghostsEaten: this.ghostsEaten,
            pelletsRemaining: this.pelletsRemaining,
            totalPellets: this.totalPellets,
            isPaused: this.isPaused,
            isGameOver: this.isGameOver,
            levelComplete: this.levelComplete,
            isDying: this.isDying,
            maze: this.maze,
            pelletGrid: this.pelletGrid,
            pacman: this.pacman?.getSnapshot(),
            ghosts: ghostsSnapshot,
            fruit: this.fruit?.getSnapshot(),
            boss: this.bossBattleSystem?.getSnapshot(),
            powerUps: this.additionalPowerUpSystem?.getSnapshot()?.spawnedPowerUps || [],
            story: this.storyMode?.getSnapshot(),
            levelInfo: this.levelSystem.getLevelInfo()
        };
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
        this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
        this.eventUnsubscribers = [];
    }

    // === Property Getters/Setters ===

    get tickCount() { return this.gameState.tick; }
    set tickCount(value) { this.gameState.tick = value; }

    get level() { return this.gameState.level; }
    set level(value) { this.gameState.level = value; }

    get score() { return this.gameState.score; }
    set score(value) { this.gameState.score = value; }

    get highScore() { return this.gameState.highScore; }
    set highScore(value) { this.gameState.highScore = value; }

    get lives() { return this.gameState.lives; }
    set lives(value) { this.gameState.lives = value; }

    get pelletsEaten() { return this.scoreModule.pelletsEaten; }
    set pelletsEaten(value) { this.scoreModule.pelletsEaten = value; }

    get ghostsEaten() { return this.scoreModule.ghostsEaten; }
    set ghostsEaten(value) { this.scoreModule.ghostsEaten = value; }

    get pelletsRemaining() { return this.spawningSystem.getPelletsRemaining(); }
    set pelletsRemaining(value) { this.spawningSystem.setPelletsRemaining(value); }

    get totalPellets() { return this.spawningSystem.getTotalPellets(); }
    // totalPellets is read-only, calculated from pelletGrid

    get isPaused() { return this.gameState.isPaused; }
    set isPaused(value) { this.gameState.isPaused = value; }

    get isGameOver() { return this.gameState.isGameOver; }
    set isGameOver(value) { this.gameState.isGameOver = value; }

    get levelComplete() { return this.gameState.levelComplete; }
    set levelComplete(value) { this.gameState.levelComplete = value; }

    get isDying() { return this.gameState.isDying; }
    set isDying(value) { this.gameState.isDying = value; }

    get levelDeaths() { return this.gameState.levelDeaths; }
    set levelDeaths(value) { this.gameState.levelDeaths = value; }

    get pacman() { return this.entityRegistry.getPacman(); }
    get ghosts() { return this.entityRegistry.getGhosts(); }
    get fruit() { return this.entityRegistry.getFruit(); }

    get maze() { return this.spawningSystem.getMaze(); }
    get pelletGrid() { return this.spawningSystem.getPelletGrid(); }

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
