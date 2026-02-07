/**
 * Game Scene
 * Main gameplay scene refactored to use subsystems
 */

import Phaser from 'phaser';
import {
    gameConfig,
    directions,
    pacmanStartPosition,
    fruitConfig,
    animationConfig,
    physicsConfig
} from '../config/gameConfig.js';
import { createMazeData } from '../utils/MazeLayout.js';
import { GhostAISystem } from '../systems/GhostAISystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { StorageManager } from '../managers/StorageManager.js';
import { UIController } from './systems/UIController.js';
import { InputController } from './systems/InputController.js';
import { LevelManager } from './systems/LevelManager.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { DebugOverlay } from '../systems/DebugOverlay.js';
import { ReplaySystem } from '../systems/ReplaySystem.js';
import { PacmanAI } from '../systems/PacmanAI.js';
import { FixedTimeStepLoop } from '../systems/FixedTimeStepLoop.js';
import { gameEvents, GAME_EVENTS } from '../core/EventBus.js';
import { normalizeDeltaSeconds } from '../utils/Time.js';
import GameModel from '../core/GameModel.js';
import { GameController } from '../controllers/GameController.js';
import PhaserGameView from '../views/PhaserGameView.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    /**
     * Initialize scene with data
     * @param {Object} data - Scene data
     */
    init(data) {
        this.gameModel = new GameModel({
            score: data.score || 0,
            lives: 3,
            level: data.level || 1,
            deathPauseDuration: animationConfig.deathPauseDuration
        });
        this.gameState = this.gameModel.state;

        this.storageManager = new StorageManager();
        this.gameModel.setHighScore(this.storageManager.getHighScore());
        this.levelManager = new LevelManager(this, this.gameModel);

        this.achievementSystem = new AchievementSystem(this);
        this.achievementSystem.init();

        this.replaySystem = new ReplaySystem();
        this.settings = this.storageManager.getSettings();

    }

    create() {
        const levelData = createMazeData();
        this.gameModel.setLevelData(levelData);
        const levelSnapshot = this.gameModel.getLevelSnapshot();
        const liveLevelData = this.gameModel.getLevelData();
        this.maze = liveLevelData.maze;
        this.pelletGrid = liveLevelData.pelletGrid;

        this.gameView = new PhaserGameView({
            scene: this,
            model: this.gameModel,
            storageManager: this.storageManager
        });
        this.gameView.applySettings(this.settings);

        this.gameView.createBackground();
        this.gameView.createMaze(levelSnapshot);
        const { pelletPool, powerPelletPool } = this.gameView.createPelletPools();
        this.pelletPool = pelletPool;
        this.powerPelletPool = powerPelletPool;
        this.gameView.createPellets(levelSnapshot);

        const entities = this.gameView.createEntities();
        this.pacman = entities.pacman;
        this.ghosts = entities.ghosts;
        this.fruit = entities.fruit;
        this.deathHandler = this.gameView.deathHandler;
        this.gameView.bindModelEvents();

        this.uiController = new UIController(this, this.gameState);
        this.uiController.create();

        this.gameController = new GameController({
            scene: this,
            gameModel: this.gameModel,
            replaySystem: this.replaySystem
        });
        this.inputController = new InputController(this, this.gameController);

        this.collisionSystem = new CollisionSystem(this);
        this.collisionSystem.setPacman(this.pacman);
        this.collisionSystem.setGhosts(this.ghosts);
        this.collisionSystem.setMaze(this.maze);
        this.collisionSystem.setPelletPool(this.pelletPool);
        this.collisionSystem.setPowerPelletPool(this.powerPelletPool);
        this.collisionSystem.setPelletGrid(this.pelletGrid);
        this.collisionSystem.setPelletCounts(this.gameState.totalPellets);

        this.ghostAISystem = new GhostAISystem();
        this.ghostAISystem.setGhosts(this.ghosts);

        this.pacmanAI = new PacmanAI();

        this.debugOverlay = new DebugOverlay(this);
        if (this.settings.showFps) {
            this.debugOverlay.setVisible(true);
        }

        this.setupTouchControls();

        this.fixedTimeStepLoop = new FixedTimeStepLoop(() => {
            this.fixedUpdate();
        });

        this.setupEventListeners();

        this.levelManager.applySettings();

        this.uiController.showReadyMessage();

        this.resetPositions();
    }

    /**
     * Setup touch controls for mobile
     */
    setupTouchControls() {
        let startX = 0;
        let startY = 0;

        this.input.on('pointerdown', (pointer) => {
            startX = pointer.x;
            startY = pointer.y;
        });

        this.input.on('pointerup', (pointer) => {
            const deltaX = pointer.x - startX;
            const deltaY = pointer.y - startY;
            const threshold = 30;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > threshold) {
                    if (deltaX > 0) {
                        this.gameController.handleInput({ direction: directions.RIGHT });
                    } else {
                        this.gameController.handleInput({ direction: directions.LEFT });
                    }
                }
            } else {
                if (Math.abs(deltaY) > threshold) {
                    if (deltaY > 0) {
                        this.gameController.handleInput({ direction: directions.DOWN });
                    } else {
                        this.gameController.handleInput({ direction: directions.UP });
                    }
                }
            }
        });
    }

    /**
     * Update scene
     * @param {number} time - Current time
     * @param {number} delta - Time since last update in milliseconds
     */
    update(time, delta) {
        if (this.gameState.isPaused || this.gameState.isGameOver) {
            return;
        }

        const deltaInSeconds = normalizeDeltaSeconds(delta);

        if (this.deathHandler.update(deltaInSeconds)) {
            return;
        }

        if (this.sys.game.isDemo) {
            this.pacmanAI.update(this.pacman, this.maze, this.pelletGrid, this.ghosts);
        } else {
            this.inputController.handleInput();
        }

        const desiredDirection = this.gameModel.consumeDesiredDirection();
        if (desiredDirection) {
            this.pacman.setDirection(desiredDirection);
        }

        this.fixedTimeStepLoop.update(deltaInSeconds);

        if (this.debugOverlay.visible) {
            const collisionStats = this.collisionSystem.getProfilingInfo();
            this.debugOverlay.updateDebugInfo({
                'Frame dt': `${deltaInSeconds.toFixed(4)}s`,
                'Fixed dt': `${physicsConfig.FIXED_DT.toFixed(4)}s`,
                'Steps': this.fixedTimeStepLoop.getLastStepCount(),
                'Accumulator': `${this.fixedTimeStepLoop.getAccumulator().toFixed(4)}s`,
                'Collision ms': collisionStats ? `${collisionStats.collisionMs.toFixed(2)}ms` : 'n/a',
                'Collision pellet ms': collisionStats ? `${collisionStats.pelletMs.toFixed(2)}ms` : 'n/a',
                'Collision ghost ms': collisionStats ? `${collisionStats.ghostMs.toFixed(2)}ms` : 'n/a',
                'Collision checks': collisionStats ? `${collisionStats.checks.ghosts} ghosts` : 'n/a',
                'Pellets remaining': collisionStats?.pelletsRemaining ?? 'n/a'
            });
        }

        this.uiController.update();
        this.debugOverlay.update(time, delta);
    }

    /**
     * Fixed timestep update callback (60 Hz)
     * All physics and game logic updates happen here
     */
    fixedUpdate() {
        const deltaSeconds = physicsConfig.FIXED_DT;
        this.pacman.update(deltaSeconds, this.maze);

        for (const ghost of this.ghosts) {
            ghost.update(deltaSeconds, this.maze, this.pacman);
        }

        this.ghostAISystem.update(deltaSeconds, this.maze, this.pacman);
        this.handleCollisions();
        this.updateFruit(deltaSeconds);
        this.replaySystem.update(deltaSeconds);
    }

    /**
     * Check all collisions
     */
    handleCollisions() {
        const results = this.collisionSystem.checkAllCollisions();

        if (results.pelletScore > 0 || results.powerPelletScore > 0) {
            this.gameModel.applyPelletCollision(results);
            this.achievementSystem.check(this.gameState);
            this.checkFruitSpawn();
        }

        if (results.ghostCollision) {
            if (results.ghostCollision.type === 'ghost_eaten') {
                this.gameModel.applyGhostCollision(results.ghostCollision);
                this.achievementSystem.check(this.gameState);
            } else if (results.ghostCollision.type === 'pacman_died') {
                this.gameModel.applyGhostCollision(results.ghostCollision);
                this.achievementSystem.check(this.gameState);
            }
        }

        if (this.fruit.active) {
            const dist = Math.sqrt(
                Math.pow(this.pacman.x - this.fruit.x, 2) +
                Math.pow(this.pacman.y - this.fruit.y, 2)
            );

            if (dist < gameConfig.tileSize) {
                this.gameModel.onFruitEaten(this.fruit.getScore());
                this.achievementSystem.check(this.gameState);
            }
        }
    }

    /**
     * Check if fruit should spawn
     */
    checkFruitSpawn() {
        if (this.gameModel.shouldSpawnFruit(fruitConfig.pelletThreshold) && !this.fruit.active) {
            this.fruit.reset(this.gameState.level - 1);
            this.fruit.activate();
        }
    }

    updateFruit(delta) {
        if (this.fruit.active) {
            this.fruit.update(delta);
        }
    }

    resetPositions() {
        this.pacman.resetPosition(pacmanStartPosition.x, pacmanStartPosition.y);
        for (const ghost of this.ghosts) {
            ghost.reset();
        }
    }

    setupEventListeners() {
        gameEvents.on(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, (achievement) => {
            this.gameView.showAchievementNotification(achievement);
        });

        if (this.replaySystem && !this.replaySystem.isReplaying) {
            gameEvents.on(GAME_EVENTS.DIRECTION_CHANGED, (data) => {
                if (this.replaySystem.isRecording) {
                    this.replaySystem.recordInput({
                        type: 'direction',
                        data: data
                    });
                }
            });

            gameEvents.on(GAME_EVENTS.SCORE_CHANGED, (data) => {
                if (this.replaySystem.isRecording) {
                    this.replaySystem.recordScore(data.score);
                    this.replaySystem.recordLevel(data.level);
                }
            });

            gameEvents.on(GAME_EVENTS.GAME_STARTED, () => {
                this.replaySystem.startRecording();
            });

            gameEvents.on(GAME_EVENTS.GAME_OVER, () => {
                if (this.replaySystem.isRecording) {
                    this.replaySystem.stopRecording();
                }
            });
        }
    }

    /**
     * Resume from pause
     */
    resume() {
        this.gameModel.setPaused(false);
        this.gameView.resumeAudio();
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.uiController) {
            this.uiController.cleanup();
        }
        if (this.inputController) {
            this.inputController.cleanup();
        }
        if (this.gameView) {
            this.gameView.cleanup();
        }
        if (this.debugOverlay) {
            this.debugOverlay.cleanup();
        }
        if (this.achievementSystem) {
            this.achievementSystem.save();
        }
        if (this.replaySystem) {
            this.replaySystem.cleanup();
        }
    }
}
