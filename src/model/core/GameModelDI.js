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
import { registerFeatureSystems } from '../../core/ServiceRegistry.js';
import { MovementSystem } from '../../movement/MovementSystem.js';
import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';
import { Direction } from '../../movement/core/Direction.js';

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

        if (useDI) {
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
        } else {
            // Legacy initialization (backward compatibility)
            this.initializeLegacy(config);
        }

        // Register feature systems (PHASE 6: no longer depend on GameModel)
        if (useDI) {
            registerFeatureSystems(globalContainer);
            this.bossBattleSystem = globalContainer.get('bossBattleSystem');
            this.additionalPowerUpSystem = globalContainer.get('additionalPowerUpSystem');
            this.storyMode = globalContainer.get('storyMode');
        } else {
            this.bossBattleSystem = new (require('../../systems/BossBattleSystem.js').default)();
            this.additionalPowerUpSystem = new (require('../../systems/AdditionalPowerUpSystem.js').default)(this.entityRegistry, gameEvents);
            this.storyMode = new (require('../../systems/StoryMode.js').default)();
        }

        // Initialize collision callbacks
        this.setupCollisionCallbacks();

        // Register entities in movement system
        this.registerMovementEntities();

        // Calculate pellet counts from spawning system
        if (this.spawningSystem) {
            const pelletGrid = this.spawningSystem.getPelletGrid();
            if (pelletGrid) {
                this.totalPellets = 0;
                for (const row of pelletGrid) {
                    for (const cell of row) {
                        if (cell > 0) {
                            this.totalPellets++;
                        }
                    }
                }
                this.pelletsRemaining = this.totalPellets;
            }
        }

        // Input buffer
        this.inputDirection = null;
        this.desiredDirection = null;

        // Tick counter (for testing)
        this.tickCount = 0;
        this.tick = 0;

        // Profiling
        this.gameState.startProfiling();

        // Initialization complete
    }

    /**
     * Legacy initialization (backward compatibility)
     */
    initializeLegacy(config) {
        const GameStateModule = require('./GameState.js');
        const GameState = GameStateModule.default;
        const EntityRegistryModule = require('./EntityRegistry.js');
        const EntityRegistry = EntityRegistryModule.default;
        const CollisionHandlerModule = require('./CollisionHandler.js');
        const CollisionHandler = CollisionHandlerModule.default;
        const LevelSystem = require('../systems/LevelSystem.js').LevelSystem;
        const SpawningSystem = require('../systems/SpawningSystem.js').SpawningSystem;
        const PlayerModule = require('../systems/PlayerModule.js').default;
        const ScoreModule = require('../systems/ScoreModule.js').default;
        const SessionModule = require('../systems/SessionModule.js').default;

        this.gameState = new GameState({
            level: config.level || 1,
            lives: config.lives || 3,
            score: config.score || 0,
            highScore: config.highScore || 0,
            deathPauseDuration: config.deathPauseDuration
        });

        this.levelSystem = new LevelSystem();
        this.levelSystem.setLevel(config.level || 1);

        this.spawningSystem = new SpawningSystem(this.levelSystem);
        if (config.maze && config.pelletGrid) {
            this.spawningSystem.setMaze(config.maze, config.pelletGrid, config.spawnPoints);
        } else {
            this.spawningSystem.generateMazeForLevel(config.level || 1);
        }

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

        this.playerModule = new PlayerModule();
        this.scoreModule = new ScoreModule();
        this.sessionModule = new SessionModule();
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

    /**
     * Register entities in movement system
     */
    registerMovementEntities() {
        this.entityRegistry.createPacman();
        this.entityRegistry.createGhosts();
        this.entityRegistry.createFruit();

        const pacman = this.entityRegistry.getPacman();
        const playerMovement = this.movementSystem.registerEntity(pacman, { type: 'player', speed: 100 });
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
     * Initialize movement system (legacy path)
     */
    initializeMovementSystem() {
        // Get maze and pellet grid from spawning system
        // Note: This is only called in legacy path, DI path uses spawningSystem directly

        this.movementSystem = new MovementSystem({
            tileSize: 20,
            tunnelRow: 15,
            virusCoreCenter: { x: 13, y: 14 },
            virusCoreEntrance: { x: 13, y: 11 }
        });

        const scatterDuration = this.levelSystem.getLevelConfig().scatterDuration || 7;
        const chaseDuration = this.levelSystem.getLevelConfig().chaseDuration || 20;

        this.movementSystem.initialize(
            this.maze || (this.spawningSystem?.getMaze() || []),
            {
                tileSize: 20,
                modeDurations: [
                    { mode: 'SCATTER', duration: scatterDuration },
                    { mode: 'CHASE', duration: chaseDuration },
                    { mode: 'SCATTER', duration: scatterDuration },
                    { mode: 'CHASE', duration: chaseDuration },
                    { mode: 'SCATTER', duration:5 },
                    { mode: 'CHASE', duration: chaseDuration },
                    { mode: 'SCATTER', duration: 5 },
                    { mode: 'CHASE', duration: Infinity }
                ],
                frightenedDuration: this.levelSystem.getFrightenedDuration() || 8
            }
        );
    }

    // === Main Update Loop ===

    /**
     * Haupt-Update-Funktion
     * @param {number} deltaSeconds - Zeit seit letztem Update in Sekunden
     * @param {Object} input - Optional input
     * @returns {Array} Event-Liste für View
     */
    step(deltaSeconds, input = null) {
        this.gameState.updateProfiling();

        // Pause/GameOver Check
        if (this.isPaused || this.isGameOver) {
            return [];
        }

        // Death Sequence
        if (this.isDying) {
            return this.updateDeathSequence(deltaSeconds);
        }

        // Input Handling
        const inputDirection = input?.direction;
        if (inputDirection && inputDirection !== 0) {
            this.setDesiredDirection(inputDirection);
        }

        // Update Movement
        const pacman = this.entityRegistry.getPacman();
        const movementEvents = this.movementSystem.update(deltaSeconds, {
            player: pacman,
            pacman: pacman,
            ghosts: this.entityRegistry.getGhosts()
        }) || [];

        // Update Entities
        pacman.update(deltaSeconds, this.spawningSystem.getMaze());

        for (const ghost of this.entityRegistry.getGhosts()) {
            ghost.update(deltaSeconds, this.spawningSystem.getMaze());
        }

        this.entityRegistry.getFruit()?.update(deltaSeconds);

        // Check Collisions
        const entities = {
            pacman: this.entityRegistry.getPacman(),
            ghosts: this.entityRegistry.getGhosts(),
            fruit: this.entityRegistry.getFruit()
        };

        const collisionEvents = this.collisionHandler.checkAllCollisions(entities, {
            pelletGrid: this.spawningSystem.getPelletGrid(),
            pelletsRemaining: this.spawningSystem.getPelletsRemaining()
        });

        // Apply Collision Effects
        for (const event of collisionEvents) {
            this.applyCollisionEffect(event);
        }

        // Debug: Log pelletsRemaining alle 100 frames
        if (this.tickCount % 100 === 0) {
            console.log('pelletsRemaining:', this.pelletsRemaining, 'totalPellets:', this.totalPellets);
        }

        // Prüfe auf Level-Complete (nur wenn nicht bereits complete)
        // Wichtig: Prüfe direkt am SpawningSystem, nicht am Event!
        if (!this.levelComplete && this.pelletsRemaining === 0 && this.totalPellets > 0) {
            console.log('Level Complete detected! pelletsRemaining is 0');
            this.levelComplete = true;
            // Emit LEVEL_COMPLETE Event nur EINMAL
            gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, {
                level: this.level,
                score: this.score,
                highScore: this.highScore
            });
        }

        // Emit Events
        const events = [...movementEvents, ...collisionEvents];
        this.emitEvents(events);

        // Update tick counter
        this.gameState.incrementTick();
        this.tickCount = this.gameState.tick;

        return events;
    }

    // === Collision Event Handlers ===

    handlePelletEaten(data) {
        this.scoreModule.pelletsEaten++;
        this.gameState.score += 10;
        this.spawningSystem.removePelletAt(data.gridX, data.gridY);
        this.checkHighScore();
    }

    handlePowerPelletEaten(data) {
        this.scoreModule.pelletsEaten++;
        this.gameState.score += 50;
        this.spawningSystem.removePelletAt(data.gridX, data.gridY);
        this.checkHighScore();
        this.setGhostsFrightened(this.levelSystem.getFrightenedDuration());
    }

    handleGhostEaten(data) {
        const ghost = this.entityRegistry.getGhostByType(data.ghostType);
        if (ghost) {
            ghost.eat();

            // Sichere Berechnung des Scores
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

    handlePacmanDied(data) {
        this.onPacmanDeath();
    }

    handleFruitEaten(data) {
        const fruit = this.entityRegistry.getFruit();
        if (fruit) {
            fruit.eat();
            const score = this.levelSystem.getFruitScore(data.fruitType);
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

    // === Level Management ===

    setLevelConfig(levelConfig) {
        this.levelSystem.setLevelConfig(levelConfig);
    }

    getSpeedMultiplier() {
        return this.levelSystem.getSpeedMultiplier();
    }

    getFrightenedDuration() {
        return this.levelSystem.getFrightenedDuration();
    }

    getGhostSpeedMultiplier() {
        return this.levelSystem.getGhostSpeedMultiplier();
    }

    getScoreMultiplier() {
        return this.levelSystem.getScoreMultiplier();
    }

    shouldSpawnFruit() {
        return this.levelSystem.shouldSpawnFruit(this.pelletsEaten, this.totalPellets);
    }

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

    // === Input Handling ===

    setInputDirection(direction) {
        this.inputDirection = direction;
        // Immediately update movement system with the new direction
        this.setDesiredDirection(direction);
    }

    setDesiredDirection(direction) {
        this.desiredDirection = direction;
        const pacman = this.entityRegistry.getPacman();
        if (pacman) {
            pacman.setDirection(direction);
            // Also update movement system with converted direction
            const movementDirection = this.convertToMovementDirection(direction);
            if (movementDirection) {
                this.movementSystem.setDirection(pacman.id, movementDirection);
            }
        }
    }

    /**
     * Convert gameConfig direction to MovementSystem Direction
     * @param {Object} direction - gameConfig direction
     * @returns {Object|null} MovementSystem Direction
     */
    convertToMovementDirection(direction) {
        if (!direction) {return null;}
        if (direction.x === 0 && direction.y === -1) {return Direction.UP;}
        if (direction.x === 0 && direction.y === 1) {return Direction.DOWN;}
        if (direction.x === -1 && direction.y === 0) {return Direction.LEFT;}
        if (direction.x === 1 && direction.y === 0) {return Direction.RIGHT;}
        return Direction.NONE;
    }

    // === Ghost Management ===

    setGhostsFrightened(duration) {
        for (const ghost of this.entityRegistry.getGhosts()) {
            ghost.setFrightened(duration);
        }
    }

    resetPositions() {
        // Reset positions in entity registry
        this.entityRegistry.resetPositions();

        // Also reset positions in movement system to keep them in sync
        if (this.movementSystem) {
            const spawnPoint = this.spawningSystem.getSpawnPoints()?.player || { x: 13, y: 23 };

            if (this.movementEntityIds.player) {
                this.movementSystem.resetEntity(this.movementEntityIds.player, spawnPoint.x, spawnPoint.y);
            }

            // Reset ghosts in movement system
            const ghostSpawns = this.spawningSystem.getSpawnPoints()?.ghosts || {};
            for (const ghost of this.entityRegistry.getGhosts()) {
                const ghostId = this.movementEntityIds.ghosts[ghost.ghostType];
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

    // === State Management (Delegated) ===

    get level() { return this.gameState.level; }
    set level(value) {
        this.gameState.level = value;
        this.levelSystem.setLevel(value);
    }

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

    get currentComboGhosts() { return this.scoreModule.currentComboGhosts; }
    set currentComboGhosts(value) { this.scoreModule.currentComboGhosts = value; }

    get maxComboGhosts() { return this.gameState.maxComboGhosts; }
    set maxComboGhosts(value) { this.gameState.maxComboGhosts = value; }

    get isPaused() { return this.gameState.isPaused; }
    set isPaused(value) { this.gameState.isPaused = value; }

    get isGameOver() { return this.gameState.isGameOver; }
    set isGameOver(value) { this.gameState.isGameOver = value; }

    get levelComplete() { return this.gameState.levelComplete; }
    set levelComplete(value) { this.gameState.levelComplete = value; }

    get levelDeaths() { return this.gameState.levelDeaths; }
    set levelDeaths(value) { this.gameState.levelDeaths = value; }

    get isDying() { return this.gameState.isDying; }
    set isDying(value) { this.gameState.isDying = value; }

    get pelletsRemaining() { return this.spawningSystem.getPelletsRemaining(); }
    set pelletsRemaining(value) { this.spawningSystem.setPelletsRemaining(value); }

    get totalPellets() { return this.spawningSystem.getTotalPellets(); }
    set totalPellets(value) { this.spawningSystem.totalPellets = value; }

    // === Entity Access ===

    get pacman() { return this.entityRegistry.getPacman(); }
    get ghosts() { return this.entityRegistry.getGhosts(); }
    get fruit() { return this.entityRegistry.getFruit(); }

    get maze() { return this.spawningSystem.getMaze(); }
    get pelletGrid() { return this.spawningSystem.getPelletGrid(); }

    getGhostByType(ghostType) {
        return this.entityRegistry.getGhostByType(ghostType);
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

    // === Snapshots & Serialization ===

    getSnapshot() {
        const pelletGrid = this.pelletGrid;
        const pacmanSnapshot = this.pacman?.getSnapshot();
        const snapshot = {
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
            pelletGrid: pelletGrid,
            pacman: pacmanSnapshot,
            ghosts: this.ghosts.map(g => g.getSnapshot()),
            fruit: this.fruit?.getSnapshot(),
            boss: this.bossBattleSystem?.getSnapshot(),
            powerUps: this.additionalPowerUpSystem?.getSnapshot(),
            story: this.storyMode?.getSnapshot(),
            levelInfo: this.levelSystem.getLevelInfo()
        };

        // Clone arrays for immutability
        const mazeCopy = (snapshot.maze && Array.isArray(snapshot.maze)) ? snapshot.maze.map(row => [...row]) : [];
        const pelletGridCopy = (snapshot.pelletGrid && Array.isArray(snapshot.pelletGrid)) ? snapshot.pelletGrid.map(row => [...row]) : [];
        const ghostsCopy = (snapshot.ghosts && Array.isArray(snapshot.ghosts)) ? [...snapshot.ghosts] : [];
        const powerUpsCopy = (snapshot.powerUps && Array.isArray(snapshot.powerUps)) ? [...snapshot.powerUps] : [];

        // Update snapshot with copied arrays
        snapshot.maze = mazeCopy;
        snapshot.pelletGrid = pelletGridCopy;
        snapshot.ghosts = ghostsCopy;
        snapshot.powerUps = powerUpsCopy;

        // PHASE 6: Deep freeze for immutability - freeze each row
        Object.freeze(snapshot.maze);
        if (Array.isArray(snapshot.maze)) {
            snapshot.maze.forEach(row => Object.freeze(row));
        }

        Object.freeze(snapshot.pelletGrid);
        if (Array.isArray(snapshot.pelletGrid)) {
            snapshot.pelletGrid.forEach(row => Object.freeze(row));
        }

        Object.freeze(snapshot.ghosts);
        Object.freeze(snapshot.powerUps);

        // Freeze entire snapshot
        return Object.freeze(snapshot);
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
}
