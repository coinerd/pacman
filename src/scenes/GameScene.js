/**
 * GameScene
 * Main game scene using pure MVC architecture.
 * Model drives all updates, View is a passive observer.
 */

import Phaser from 'phaser';
import {
    animationConfig,
    directions,
    gameConfig,
    physicsConfig
} from '../config/gameConfig.js';
import { themeConfig } from '../config/themeConfig.js';
import { GameController } from '../controllers/GameController.js';
import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';
import GameModel from '../core/GameModel.js';
import {
    AIInputAdapter,
    InputManager,
    KeyboardAdapter
} from '../input/index.js';
import { StorageManager } from '../managers/StorageManager.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { DebugOverlay } from '../systems/DebugOverlay.js';
import { FixedTimeStepLoop } from '../systems/FixedTimeStepLoop.js';
import { ReplaySystem } from '../systems/ReplaySystem.js';
import { createMazeData } from '../utils/MazeLayout.js';
import { normalizeDeltaSeconds } from '../utils/Time.js';
import GameView from '../views/ModelDrivenGameView.js';
import { LevelManager } from './systems/LevelManager.js';
import { UIController } from './systems/UIController.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        const levelData = createMazeData();

        this.gameModel = new GameModel({
            score: data.score || 0,
            lives: data.lives ?? 3,
            level: data.level || 1,
            highScore: data.highScore || 0,
            deathPauseDuration: animationConfig.deathPauseDuration,
            maze: levelData.maze,
            pelletGrid: levelData.pelletGrid
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
        this.isDeathSequence = false;
    }

    create() {
        this.cameras.main.setBackgroundColor(themeConfig.colors.background);

        this.gameModel.totalPellets = this.countPellets(this.gameModel.pelletGrid);
        this.gameModel.pelletsRemaining = this.gameModel.totalPellets;

        this.gameView = new GameView({
            scene: this,
            gameModel: this.gameModel,
            storageManager: this.storageManager
        });
        this.gameView.applySettings(this.settings);
        this.gameView.create();

        this.uiController = new UIController(this, this.gameModel);
        this.uiController.create();

        this.inputManager = new InputManager();
        this.inputManager.registerAdapter('keyboard', new KeyboardAdapter(this.input));

        this.aiAdapter = new AIInputAdapter();
        this.aiAdapter.setGameModel(this.gameModel);
        this.inputManager.registerAdapter('ai', this.aiAdapter);

        this.inputManager.setActiveAdapter(this.sys.game.isDemo ? 'ai' : 'keyboard');

        this.gameController = new GameController({
            gameModel: this.gameModel,
            replaySystem: this.replaySystem,
            inputManager: this.inputManager
        });
        this.gameController.activate();

        // Phase 2: Bind scene transition events in controller
        this.gameController.bindSceneTransitionEvents();

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

        gameEvents.emit(GAME_EVENTS.GAME_STARTED, {
            level: this.gameModel.level
        });
    }

    countPellets(pelletGrid) {
        let count = 0;
        for (const row of pelletGrid) {
            for (const cell of row) {
                if (cell !== 0) {
                    count++;
                }
            }
        }
        return count;
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
                    const direction = deltaX > 0 ? directions.RIGHT : directions.LEFT;
                    this.gameController.handleInput({ type: 'direction', value: direction });
                }
            } else {
                if (Math.abs(deltaY) > threshold) {
                    const direction = deltaY > 0 ? directions.DOWN : directions.UP;
                    this.gameController.handleInput({ type: 'direction', value: direction });
                }
            }
        });
    }

    update(time, delta) {
        if (this.gameModel.isPaused || this.gameModel.isGameOver) {
            return;
        }

        const deltaInSeconds = normalizeDeltaSeconds(delta);
        this.fixedTimeStepLoop.update(deltaInSeconds);

        if (this.isDeathSequence) {
            this.gameView.updateDeathAnimation(deltaInSeconds);
            this.gameView.sync();
            this.uiController.update();
            this.debugOverlay.update(time, delta);
            return;
        }

        this.inputManager.update(deltaInSeconds * 1000);
        this.gameView.sync();
        this.uiController.update();
        this.debugOverlay.update(time, delta);

        if (this.debugOverlay.visible) {
            const stats = this.gameModel.getStats();
            this.debugOverlay.updateDebugInfo({
                'Frame dt': `${deltaInSeconds.toFixed(4)}s`,
                'Fixed dt': `${physicsConfig.FIXED_DT.toFixed(4)}s`,
                Steps: this.fixedTimeStepLoop.getLastStepCount(),
                Accumulator: `${this.fixedTimeStepLoop.getAccumulator().toFixed(4)}s`,
                'Model update ms': `${stats.updateTime.toFixed(2)}ms`,
                'Tick count': stats.tickCount,
                'Pellets remaining': this.gameModel.pelletsRemaining,
                'Pacman pos': `${this.gameModel.pacman.x.toFixed(1)}, ${this.gameModel.pacman.y.toFixed(1)}`
            });
        }
    }

    fixedUpdate() {
        const deltaSeconds = physicsConfig.FIXED_DT;
        const events = this.gameModel.step(deltaSeconds);

        for (const event of events) {
            this.achievementSystem.check(this.gameModel);

            if (event.type === 'pellet_eaten' || event.type === 'power_pellet_eaten') {
                this.checkFruitSpawn();
            }

            if (event.type === 'pacman_died') {
                this.isDeathSequence = true;
                this.gameView.startDeathAnimation();
            }

            if (event.type === 'respawn') {
                this.isDeathSequence = false;
                this.gameView.endDeathAnimation();
            }
        }

        this.replaySystem.update(deltaSeconds);
    }

    checkFruitSpawn() {
        if (this.gameModel.shouldSpawnFruit() && !this.gameModel.fruit.active) {
            this.gameModel.fruit.activate(this.gameModel.level);
        }
    }

    setupEventListeners() {
        // Handle pause/resume requests from controller
        gameEvents.on(GAME_EVENTS.PAUSE_REQUESTED, () => {
            this.scene.pause();
            this.scene.launch('PauseScene');
        });

        gameEvents.on(GAME_EVENTS.RESUME_REQUESTED, () => {
            this.gameModel.setPaused(false);
            this.gameView.resumeAudio();
        });

        gameEvents.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
            this.cleanup();
            this.scene.start('MenuScene');
        });

        // Phase 2: Handle scene transition events from SceneTransitionHandler
        gameEvents.on('GAME_WIN', (data) => {
            this.scene.start('WinScene', data);
        });

        gameEvents.on('GAME_OVER', (data) => {
            this.scene.start('GameOverScene', data);
        });

        gameEvents.on('RETURN_TO_MENU', (data) => {
            this.cleanup();
            this.scene.start('MenuScene', data);
        });

        // Handle restart level requests
        gameEvents.on(GAME_EVENTS.RESTART_LEVEL_REQUESTED, (data) => {
            this.scene.restart(data);
        });

        gameEvents.on(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, (achievement) => {
            this.gameView.showAchievementNotification(achievement);
        });

        gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, () => {
            // Phase 2: Level complete event is now handled by View's SceneTransitionHandler
            // The View will emit 'GAME_WIN' event which is handled above
            // Kept for backward compatibility during migration
        });

        if (this.replaySystem && !this.replaySystem.isReplaying) {
            gameEvents.on(GAME_EVENTS.DIRECTION_CHANGED, (data) => {
                if (this.replaySystem.isRecording) {
                    this.replaySystem.recordInput({ type: 'direction', data });
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

    resume() {
        this.gameModel.setPaused(false);
        this.gameView.resumeAudio();
    }

    cleanup() {
        // Phase 2: Unbind scene transition events before destroying controller
        this.gameController?.unbindSceneTransitionEvents();

        this.uiController?.cleanup();
        this.inputManager?.destroy();
        this.gameController?.destroy();
        this.gameView?.cleanup();
        this.debugOverlay?.cleanup();
        this.achievementSystem?.save();
        this.replaySystem?.cleanup();
    }
}
