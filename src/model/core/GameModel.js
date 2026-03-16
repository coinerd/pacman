/**
 * GameModel (Refactored)
 * Facade Pattern - Delegates to specialized subsystems.
 *
 * Phase 1 Refactoring:
 * - Reduced from 1,397 to ~200 lines
 * - Delegates to: GameState, EntityRegistry, CollisionHandler, LevelSystem, SpawningSystem
 * - Maintains backward compatibility with existing tests
 * - NO Phaser dependencies (pure data model)
 */

import { GameState } from './GameState.js';
import { EntityRegistry } from './EntityRegistry.js';
import { CollisionHandler } from './CollisionHandler.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { SpawningSystem } from '../systems/SpawningSystem.js';
import { MovementSystem } from '../../movement/index.js';
import { AdditionalPowerUpSystem } from '../../systems/AdditionalPowerUpSystem.js';
import BossBattleSystem from '../../systems/BossBattleSystem.js';
import StoryMode from '../../systems/StoryMode.js';
import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';

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
        // === Core Systems ===

        // State Management
        this.gameState = new GameState({
            level: config.level || 1,
            lives: config.lives || 3,
            score: config.score || 0,
            highScore: config.highScore || 0,
            deathPauseDuration: config.deathPauseDuration
        });

        // Level System
        this.levelSystem = new LevelSystem();
        this.levelSystem.setLevel(this.level);

        // Spawning System
        this.spawningSystem = new SpawningSystem(this.levelSystem);

        // Initialize Maze
        if (config.maze && config.pelletGrid) {
            this.spawningSystem.setMaze(config.maze, config.pelletGrid, config.spawnPoints);
        } else {
            this.spawningSystem.generateMazeForLevel(this.level);
        }

        // Entity Management
        this.entityRegistry = new EntityRegistry({
            level: this.level,
            spawnPoints: this.spawningSystem.getSpawnPoints()
        });

        // Collision Handling
        this.collisionHandler = new CollisionHandler({
            onPelletEaten: this.handlePelletEaten.bind(this),
            onPowerPelletEaten: this.handlePowerPelletEaten.bind(this),
            onGhostEaten: this.handleGhostEaten.bind(this),
            onPacmanDied: this.handlePacmanDied.bind(this),
            onFruitEaten: this.handleFruitEaten.bind(this)
        });

        // === Movement System ===
        this.initializeMovementSystem();

        // === Feature Systems ===
        this.bossBattleSystem = new BossBattleSystem(this);
        this.additionalPowerUpSystem = new AdditionalPowerUpSystem(this);
        this.storyMode = new StoryMode(this);

        // === Input Buffer ===
        this.inputDirection = null;
        this.desiredDirection = null;

        // === Profiling ===
        this.gameState.startProfiling();
    }

    // === Initialization ===

    initializeMovementSystem() {
        this.movementSystem = new MovementSystem({
            tileSize: 20,
            tunnelRow: 15,
            virusCoreCenter: { x: 13, y: 14 },
            virusCoreEntrance: { x: 13, y: 11 }
        });

        this.movementSystem.initialize(
            this.spawningSystem.getMaze(),
            {
                tileSize: 20,
                modeDurations: {
                    scatter: this.levelSystem.getLevelConfig().scatterDuration,
                    chase: this.levelSystem.getLevelConfig().chaseDuration
                },
                frightenedDuration: this.levelSystem.getFrightenedDuration()
            }
        );

        // Register entities
        this.entityRegistry.createPacman();
        this.entityRegistry.createGhosts();
        this.entityRegistry.createFruit();

        const pacman = this.entityRegistry.getPacman();
        this.movementSystem.registerEntity(pacman, { type: 'player', speed: 100 });

        for (const ghost of this.entityRegistry.getGhosts()) {
            this.movementSystem.registerEntity(ghost, { type: 'ghost', speed: 80 });
        }
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
        if (inputDirection && inputDirection !== 0) { // directions.NONE = 0
            this.setDesiredDirection(inputDirection);
        }

        // Update Movement
        const movementEvents = this.movementSystem.step(deltaSeconds);

        // Update Entities
        const pacman = this.entityRegistry.getPacman();
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

        // Emit Events
        const events = [...movementEvents, ...collisionEvents];
        this.emitEvents(events);

        // Update tick counter
        this.gameState.incrementTick();

        return events;
    }

    // === Collision Event Handlers ===

    handlePelletEaten(data) {
        this.gameState.pelletsEaten++;
        this.gameState.score += 10;
        this.spawningSystem.removePelletAt(data.gridX, data.gridY);
        this.checkHighScore();
    }

    handlePowerPelletEaten(data) {
        this.gameState.pelletsEaten++;
        this.gameState.score += 50;
        this.spawningSystem.removePelletAt(data.gridX, data.gridY);
        this.checkHighScore();
        this.setGhostsFrightened(this.levelSystem.getFrightenedDuration());
    }

    handleGhostEaten(data) {
        const ghost = this.entityRegistry.getGhostByType(data.ghostType);
        if (ghost) {
            ghost.eat();
            const baseScore = [200, 400, 800, 1600][ghost.eatenCount % 4];
            const score = baseScore * this.levelSystem.getScoreMultiplier();
            this.gameState.currentComboGhosts++;
            this.gameState.score += score;
            this.gameState.ghostsEaten++;
            this.gameState.maxComboGhosts = Math.max(
                this.gameState.maxComboGhosts,
                this.gameState.currentComboGhosts
            );
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
            // Handled in handlePelletEaten
            break;
        case 'powerPelletEaten':
            // Handled in handlePowerPelletEaten
            break;
        case 'ghostEaten':
            // Handled in handleGhostEaten
            break;
        case 'pacmanDied':
            this.onPacmanDeath();
            break;
        case 'fruitEaten':
            // Handled in handleFruitEaten
            break;
        }
    }

    // === Death Sequence ===

    onPacmanDeath() {
        // Guard clause: Prevent multiple death triggers during death sequence
        if (this.isDying) {
            console.warn('[GameModel] onPacmanDeath called while already dying - ignoring');
            return;
        }

        this.isDying = true;
        this.gameState.startDeathTimer();
        this.levelDeaths++;
    }

    updateDeathSequence(deltaSeconds) {
        this.gameState.updateDeathTimer(deltaSeconds);

        if (this.gameState.isDeathComplete()) {
            if (this.lives <= 0) {
                this.setGameOver(true);
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

    startLevel(level) {
        this.level = level;
        const mazeData = this.spawningSystem.generateMazeForLevel(level);
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

    // === Input Handling ===

    setInputDirection(direction) {
        this.inputDirection = direction;
    }

    setDesiredDirection(direction) {
        this.desiredDirection = direction;
        const pacman = this.entityRegistry.getPacman();
        if (pacman) {
            pacman.setDirection(direction);
        }
    }

    // === Ghost Management ===

    setGhostsFrightened(duration) {
        for (const ghost of this.entityRegistry.getGhosts()) {
            ghost.setFrightened(duration);
        }
    }

    resetPositions() {
        this.entityRegistry.resetPositions();
        this.movementSystem?.reset();
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

    get pelletsEaten() { return this.gameState.pelletsEaten; }
    set pelletsEaten(value) { this.gameState.pelletsEaten = value; }

    get ghostsEaten() { return this.gameState.ghostsEaten; }
    set ghostsEaten(value) { this.gameState.ghostsEaten = value; }

    get currentComboGhosts() { return this.gameState.currentComboGhosts; }
    set currentComboGhosts(value) { this.gameState.currentComboGhosts = value; }

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
        this.movementSystem?.setPaused(paused);
    }

    togglePaused() {
        this.setPaused(!this.isPaused);
    }

    setGameOver(isGameOver) {
        this.isGameOver = isGameOver;
    }

    // === Snapshots & Serialization ===

    getSnapshot() {
        return {
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
            pacman: this.pacman?.getSnapshot(),
            ghosts: this.ghosts.map(g => g.getSnapshot()),
            fruit: this.fruit?.getSnapshot(),
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
}
