/**
 * ModelDrivenGameScene
 * Pure MVC implementation where View is a passive observer of Model state.
 *
 * Key differences from GameScene:
 * - View creates Visual wrappers from Model entities (not visual entities)
 * - Model drives all updates via gameModel.step()
 * - View only syncs visual representation to model state
 * - No dual entity system (visual + model)
 */

import Phaser from 'phaser';
import {
    gameConfig,
    directions,
    fruitConfig,
    animationConfig,
    physicsConfig
} from '../config/gameConfig.js';
import { createMazeData } from '../utils/MazeLayout.js';
import { StorageManager } from '../managers/StorageManager.js';
import { UIController } from './systems/UIController.js';
import { LevelManager } from './systems/LevelManager.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { DebugOverlay } from '../systems/DebugOverlay.js';
import { ReplaySystem } from '../systems/ReplaySystem.js';
import { PacmanAI } from '../systems/PacmanAI.js';
import { FixedTimeStepLoop } from '../systems/FixedTimeStepLoop.js';
import { gameEvents, GAME_EVENTS } from '../core/EventBus.js';
import { normalizeDeltaSeconds } from '../utils/Time.js';
import GameModel from '../core/GameModel.js';
import { GameController } from '../controllers/ActionRouter.js'; // Phase 6: Clean Controller
import { InputManager, KeyboardAdapter, AIInputAdapter } from '../input/index.js'; // Phase 5: Input System
import ModelDrivenGameView from '../views/ModelDrivenGameView.js';

export default class ModelDrivenGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ModelDrivenGameScene' });
    }

    init(data) {
        // Create unified GameModel - single source of truth
        this.gameModel = new GameModel({
            score: data.score || 0,
            lives: data.lives ?? 3,
            level: data.level || 1,
            highScore: data.highScore || 0,
            deathPauseDuration: animationConfig.deathPauseDuration
        });

        this.storageManager = new StorageManager();
        this.gameModel.highScore = Math.max(
            this.gameModel.highScore,
            this.storageManager.getHighScore()
        );

        this.levelManager = new LevelManager(this, this.gameModel);
        this.achievementSystem = new AchievementSystem(this);
        this.achievementSystem.init();

        this.replaySystem = new ReplaySystem();
        this.settings = this.storageManager.getSettings();

        // Track if we're in the death sequence
        this.isDeathSequence = false;
    }

    create() {
        // Create maze data
        const levelData = createMazeData();
        this.gameModel.maze = levelData.maze;
        this.gameModel.pelletGrid = levelData.pelletGrid;
        this.gameModel.totalPellets = this.countPellets(levelData.pelletGrid);
        this.gameModel.pelletsRemaining = this.gameModel.totalPellets;

        // Create view - pure observer that creates visuals from model
        this.gameView = new ModelDrivenGameView({
            scene: this,
            gameModel: this.gameModel,
            storageManager: this.storageManager
        });
        this.gameView.applySettings(this.settings);

        // Create all visual elements from model state
        this.gameView.create();

        // Setup UI
        this.uiController = new UIController(this, this.gameModel);
        this.uiController.create();

        // Phase 5 & 6: Setup InputManager and clean GameController
        this.inputManager = new InputManager();
        this.inputManager.registerAdapter('keyboard', new KeyboardAdapter(this.input));

        // Setup AI adapter for demo mode
        this.aiAdapter = new AIInputAdapter();
        this.aiAdapter.setGameModel(this.gameModel);
        this.inputManager.registerAdapter('ai', this.aiAdapter);

        // Set active adapter based on mode
        this.inputManager.setActiveAdapter(this.sys.game.isDemo ? 'ai' : 'keyboard');

        // Phase 6: Setup clean GameController (no scene reference)
        this.gameController = new GameController({
            gameModel: this.gameModel,
            replaySystem: this.replaySystem,
            inputManager: this.inputManager
        });
        this.gameController.activate();

        // Setup debug overlay
        this.debugOverlay = new DebugOverlay(this);
        if (this.settings.showFps) {
            this.debugOverlay.setVisible(true);
        }

        // Setup touch controls
        this.setupTouchControls();

        // Setup fixed timestep loop for game logic
        this.fixedTimeStepLoop = new FixedTimeStepLoop(() => {
            this.fixedUpdate();
        });

        // Setup event listeners
        this.setupEventListeners();

        // Apply level settings
        this.levelManager.applySettings();

        // Show ready message
        this.uiController.showReadyMessage();

        // Emit game started event
        gameEvents.emit(GAME_EVENTS.GAME_STARTED, {
            level: this.gameModel.level
        });
    }

    /**
     * Count pellets in grid
     */
    countPellets(pelletGrid) {
        let count = 0;
        for (const row of pelletGrid) {
            for (const cell of row) {
                if (cell !== 0) {count++;}
            }
        }
        return count;
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
                    const direction = deltaX > 0 ? directions.RIGHT : directions.LEFT;
                    this.gameController.handleInput({
                        type: 'direction',
                        value: direction
                    });
                }
            } else {
                if (Math.abs(deltaY) > threshold) {
                    const direction = deltaY > 0 ? directions.DOWN : directions.UP;
                    this.gameController.handleInput({
                        type: 'direction',
                        value: direction
                    });
                }
            }
        });
    }

    /**
     * Main Phaser update loop
     * Handles input, syncs view to model, updates UI
     */
    update(time, delta) {
        if (this.gameModel.isPaused || this.gameModel.isGameOver) {
            return;
        }

        const deltaInSeconds = normalizeDeltaSeconds(delta);

        // Run fixed timestep updates (NEVER skip - death timer needs to increment)
        this.fixedTimeStepLoop.update(deltaInSeconds);

        // Handle death sequence UI updates separately
        if (this.isDeathSequence) {
            this.gameView.updateDeathAnimation(deltaInSeconds);
            // Still sync view during death
            this.gameView.sync();
            // Update UI
            this.uiController.update();
            this.debugOverlay.update(time, delta);
            return;
        }

        // Update input manager (handles keyboard polling and AI decisions)
        this.inputManager.update(deltaInSeconds * 1000); // Convert to ms

        // Sync view to model state
        this.gameView.sync();

        // Update UI
        this.uiController.update();
        this.debugOverlay.update(time, delta);

        // Update debug info
        if (this.debugOverlay.visible) {
            const stats = this.gameModel.getStats();
            this.debugOverlay.updateDebugInfo({
                'Frame dt': `${deltaInSeconds.toFixed(4)}s`,
                'Fixed dt': `${physicsConfig.FIXED_DT.toFixed(4)}s`,
                'Steps': this.fixedTimeStepLoop.getLastStepCount(),
                'Accumulator': `${this.fixedTimeStepLoop.getAccumulator().toFixed(4)}s`,
                'Model update ms': `${stats.updateTime.toFixed(2)}ms`,
                'Tick count': stats.tickCount,
                'Pellets remaining': this.gameModel.pelletsRemaining,
                'Pacman pos': `${this.gameModel.pacman.x.toFixed(1)}, ${this.gameModel.pacman.y.toFixed(1)}`
            });
        }
    }

    /**
     * Fixed timestep update - runs at 60 Hz
     * All game logic happens here via model.step()
     */
    fixedUpdate() {
        const deltaSeconds = physicsConfig.FIXED_DT;

        // Single source of truth: model.step() runs all game logic
        const events = this.gameModel.step(deltaSeconds);

        // Debug logging for death sequence
        if (this.gameModel.isDying) {
            console.log(`Death: timer=${this.gameModel.deathTimer.toFixed(3)}/${this.gameModel.deathPauseDuration}, isDeathSequence=${this.isDeathSequence}`);
        }

        // Process events for achievements
        for (const event of events) {
            this.achievementSystem.check(this.gameModel);

            // Handle fruit spawn
            if (event.type === 'pellet_eaten' || event.type === 'power_pellet_eaten') {
                this.checkFruitSpawn();
            }

            // Handle death sequence start
            if (event.type === 'pacman_died') {
                this.isDeathSequence = true;
                this.gameView.startDeathAnimation();
            }

            // Handle respawn
            if (event.type === 'respawn') {
                this.isDeathSequence = false;
                this.gameView.endDeathAnimation();
            }
        }

        // Update replay system
        this.replaySystem.update(deltaSeconds);
    }

    /**
     * Check if fruit should spawn
     */
    checkFruitSpawn() {
        if (this.gameModel.shouldSpawnFruit() && !this.gameModel.fruit.active) {
            this.gameModel.fruit.activate(this.gameModel.level);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Achievement notifications
        gameEvents.on(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, (achievement) => {
            this.gameView.showAchievementNotification(achievement);
        });

        gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, () => {
            this.scene.start('WinScene', {
                score: this.gameModel.score,
                level: this.gameModel.level,
                highScore: this.gameModel.highScore
            });
        });

        // Replay recording
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
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        if (this.gameController) {
            this.gameController.destroy();
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
