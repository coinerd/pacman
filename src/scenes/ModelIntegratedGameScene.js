/**
 * ModelIntegratedGameScene
 * GameScene that uses ModelCollisionSystem for collision detection.
 * Maintains existing Phaser entities but syncs to model for collision.
 */

import Phaser from 'phaser';
import {
    animationConfig,
    directions,
    fruitConfig,
    gameConfig,
    pacmanStartPosition,
    physicsConfig
} from '../config/gameConfig.js';
import { GameController } from '../controllers/GameController.js';
import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';
import GameModel from '../core/GameModel.js';
import { StorageManager } from '../managers/StorageManager.js';
// Model integration imports
import { GameState } from '../model/GameState.js';
import { ModelStateAdapter } from '../model/ModelStateAdapter.js';
import { ModelCollisionSystem } from '../model/systems/ModelCollisionSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { DebugOverlay } from '../systems/DebugOverlay.js';
import { EnemyAISystem } from '../systems/EnemyAISystem.js';
import { FixedTimeStepLoop } from '../systems/FixedTimeStepLoop.js';
import { PlayerAI } from '../systems/PlayerAI.js';
import { ReplaySystem } from '../systems/ReplaySystem.js';
import { createMazeData } from '../utils/MazeLayout.js';
import { normalizeDeltaSeconds } from '../utils/Time.js';
import PhaserGameView from '../views/PhaserGameView.js';
import { InputController } from './systems/InputController.js';
import { LevelManager } from './systems/LevelManager.js';
import { UIController } from './systems/UIController.js';

export default class ModelIntegratedGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ModelIntegratedGameScene' });
    }

    init(data) {
        // Create both legacy GameModel and new GameState
        this.gameModel = new GameModel({
            score: data.score || 0,
            lives: 3,
            level: data.level || 1,
            deathPauseDuration: animationConfig.deathPauseDuration
        });
        this.gameState = this.gameModel.state;

        // Create model state for collision system
        this.modelGameState = new GameState({
            level: data.level || 1,
            score: data.score || 0
        });

        // Create model collision system
        this.modelCollisionSystem = new ModelCollisionSystem(this.modelGameState);

        // Create adapter to sync visual entities to model
        this.modelAdapter = new ModelStateAdapter(this.modelGameState);

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

        // Sync pellet grid to model
        this.modelGameState.pelletGrid = levelData.pelletGrid.map((row) => [
            ...row
        ]);
        this.modelGameState.totalPellets = this.gameState.totalPellets;
        this.modelGameState.pelletsRemaining = this.gameState.totalPellets;

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

        // Register entities with model adapter
        this.modelAdapter.registerVisualEntities(entities);

        this.uiController = new UIController(this, this.gameState);
        this.uiController.create();

        this.gameController = new GameController({
            scene: this,
            gameModel: this.gameModel,
            replaySystem: this.replaySystem
        });
        this.inputController = new InputController(this, this.gameController);

        // Keep legacy collision system for pellet pool management
        this.collisionSystem = new CollisionSystem(this);
        this.collisionSystem.setPacman(this.pacman);
        this.collisionSystem.setGhosts(this.ghosts);
        this.collisionSystem.setMaze(this.maze);
        this.collisionSystem.setPelletPool(this.pelletPool);
        this.collisionSystem.setPowerPelletPool(this.powerPelletPool);
        this.collisionSystem.setPelletGrid(this.pelletGrid);
        this.collisionSystem.setPelletCounts(this.gameState.totalPellets);

        this.ghostAISystem = new EnemyAISystem();
        this.ghostAISystem.setEnemies(this.ghosts);

        this.pacmanAI = new PlayerAI();

        this.debugOverlay = new DebugOverlay(this);
        if (this.settings.showFps) {
            this.debugOverlay.setVisible(true);
        }

        this.setupTouchControls();

        this.fixedTimeStepLoop = new FixedTimeStepLoop(() => {
            this.fixedUpdate();
        });

        this.setupEventListeners();
        this.setupModelEventListeners();

        this.levelManager.applySettings();

        this.uiController.showReadyMessage();

        this.resetPositions();

        gameEvents.emit(GAME_EVENTS.GAME_STARTED, {
            level: this.gameState.level
        });
    }

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

    update(time, delta) {
        if (this.gameState.isPaused || this.gameState.isGameOver) {
            return;
        }

        const deltaInSeconds = normalizeDeltaSeconds(delta);

        if (this.deathHandler.update(deltaInSeconds)) {
            return;
        }

        if (this.sys.game.isDemo) {
            this.pacmanAI.update(
                this.pacman,
                this.maze,
                this.pelletGrid,
                this.ghosts
            );
        } else {
            this.inputController.handleInput();
        }

        const desiredDirection = this.gameModel.consumeDesiredDirection();
        if (desiredDirection) {
            this.pacman.setDirection(desiredDirection);
        }

        this.fixedTimeStepLoop.update(deltaInSeconds);

        // Update debug overlay with model collision stats
        if (this.debugOverlay.visible) {
            const collisionStats = this.modelCollisionSystem.getStats();
            const legacyStats = this.collisionSystem.getProfilingInfo();
            this.debugOverlay.updateDebugInfo({
                'Frame dt': `${deltaInSeconds.toFixed(4)}s`,
                'Fixed dt': `${physicsConfig.FIXED_DT.toFixed(4)}s`,
                Steps: this.fixedTimeStepLoop.getLastStepCount(),
                Accumulator: `${this.fixedTimeStepLoop.getAccumulator().toFixed(4)}s`,
                'Model collision radius':
					collisionStats?.collisionRadius?.toFixed(1) || 'n/a',
                'Legacy collision ms': legacyStats
                    ? `${legacyStats.collisionMs.toFixed(2)}ms`
                    : 'n/a',
                'Pellets remaining': this.modelGameState.pelletsRemaining ?? 'n/a',
                'Model pellets': this.modelGameState.pelletsRemaining ?? 'n/a'
            });
        }

        this.uiController.update();
        this.debugOverlay.update(time, delta);
    }

    fixedUpdate() {
        const deltaSeconds = physicsConfig.FIXED_DT;

        // Update entities (visual)
        this.pacman.update(deltaSeconds, this.maze);
        for (const ghost of this.ghosts) {
            ghost.update(deltaSeconds, this.maze, this.pacman);
        }

        // Sync visual entities to model
        this.modelAdapter.syncToModel();

        this.ghostAISystem.update(deltaSeconds, this.maze, this.pacman);

        // Use model collision system for ghost and fruit collisions
        this.handleModelCollisions();

        // Keep legacy pellet collision for sprite pool management
        this.handlePelletCollisions();

        this.updateFruit(deltaSeconds);
        this.replaySystem.update(deltaSeconds);
    }

    /**
	 * Handle collisions using ModelCollisionSystem
	 */
    handleModelCollisions() {
        // Check ghost collisions with model system
        const ghostCollision = this.modelCollisionSystem.checkGhostCollisions();

        if (ghostCollision) {
            // Apply to game model
            if (ghostCollision.type === 'ghost_eaten') {
                this.gameModel.onGhostEaten(ghostCollision.score);
                this.achievementSystem.check(this.gameState);

                // Apply to visual ghost
                const ghost = this.ghosts.find(
                    (g) => g.ghostType === ghostCollision.ghostType
                );
                if (ghost) {
                    ghost.eat();
                }
            } else if (ghostCollision.type === 'pacman_died') {
                this.gameModel.onPacmanDeath();
                this.gameModel.beginDeath();
                this.achievementSystem.check(this.gameState);
            }
        }

        // Check fruit collision with model system
        const fruitCollision = this.modelCollisionSystem.checkFruitCollision();

        if (fruitCollision) {
            this.gameModel.onFruitEaten(fruitCollision.score);
            this.achievementSystem.check(this.gameState);

            // Deactivate visual fruit
            if (this.fruit) {
                this.fruit.deactivate();
            }
        }
    }

    /**
	 * Handle pellet collisions using legacy system (for sprite pool)
	 */
    handlePelletCollisions() {
        const snapshot = this.collisionSystem.createCollisionSnapshot();
        const result = this.collisionSystem.checkPelletTileCollision(snapshot, {
            allowPellet: true,
            allowPowerPellet: true,
            bypassRepeatCheck: false
        });

        if (result.pelletScore > 0 || result.powerPelletScore > 0) {
            // Sync to model pellet grid
            const pacmanGrid = snapshot.pacman.grid;
            const pelletType = this.modelGameState.getPelletAt(
                pacmanGrid.x,
                pacmanGrid.y
            );

            if (pelletType !== 0) {
                // 0 = NONE
                const eatResult = this.modelGameState.eatPelletAt(
                    pacmanGrid.x,
                    pacmanGrid.y
                );

                if (eatResult) {
                    // Update game model score
                    const score = result.pelletScore || result.powerPelletScore;
                    if (result.powerPelletScore > 0) {
                        this.gameModel.onPowerPelletEaten(
                            score,
                            this.modelGameState.pelletsRemaining
                        );

                        // Set ghosts frightened in model
                        const duration = this.gameModel.getFrightenedDuration();
                        this.modelGameState.setGhostsFrightened(duration);

                        // Set visual ghosts frightened
                        for (const ghost of this.ghosts) {
                            if (!ghost.isEaten) {
                                ghost.setFrightened(duration);
                            }
                        }
                    } else {
                        this.gameModel.onPelletEaten(
                            score,
                            this.modelGameState.pelletsRemaining
                        );
                    }

                    this.achievementSystem.check(this.gameState);
                    this.checkFruitSpawn();
                }
            }
        }
    }

    checkFruitSpawn() {
        if (
            this.gameModel.shouldSpawnFruit(fruitConfig.pelletThreshold) &&
			!this.fruit.active
        ) {
            this.fruit.reset(this.gameState.level - 1);
            this.fruit.activate();

            // Sync to model
            this.modelGameState.fruit.activate();
        }
    }

    updateFruit(delta) {
        if (this.fruit.active) {
            this.fruit.update(delta);

            // Sync timer to model
            this.modelGameState.fruit.timer = this.fruit.timer;
        }
    }

    resetPositions() {
        this.pacman.resetPosition(pacmanStartPosition.x, pacmanStartPosition.y);
        for (const ghost of this.ghosts) {
            ghost.reset();
        }

        // Reset model positions
        this.modelGameState.resetPositions();
        this.modelCollisionSystem.reset();
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

    setupModelEventListeners() {
        // Additional listeners specific to model events
        gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, () => {
            // Sync level advancement to model
            this.modelGameState.nextLevel();
            this.modelCollisionSystem.reset();
        });
    }

    resume() {
        this.gameModel.setPaused(false);
        this.modelGameState.setPaused(false);
        this.gameView.resumeAudio();
    }

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
