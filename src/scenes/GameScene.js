/**
 * GameScene
 * Main game scene using pure MVC architecture.
 * Model drives all updates, View is a passive observer.
 */

import Phaser from 'phaser';
import {
    animationConfig,
    directions,
    physicsConfig
} from '../config/gameConfig.js';
import { themeConfig } from '../config/themeConfig.js';
import { GameController } from '../controllers/GameController.js';
import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';
import GameModelDI from '../model/core/GameModelDI.js';
import {
    AIInputAdapter,
    InputManager,
    KeyboardAdapter
} from '../input/index.js';
import { StorageManager } from '../managers/StorageManager.js';
import { ViewContext } from '../views/ViewInterface.js';
import { PlayerScoreFacade } from '../model/PlayerScoreFacade.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { DebugOverlay } from '../systems/DebugOverlay.js';
import { FixedTimeStepLoop } from '../systems/FixedTimeStepLoop.js';
import { ReplaySystem } from '../systems/ReplaySystem.js';
import { normalizeDeltaSeconds } from '../utils/Time.js';
import GameView from '../views/ModelDrivenGameView.js';
import { LevelManager } from './systems/LevelManager.js';
import { UIController } from './systems/UIController.js';
import { AdaptiveDifficultySystem } from './systems/AdaptiveDifficultySystem.js';
import { registerCoreServices } from '../core/ServiceRegistry.js';
import { clearServices } from '../core/ServiceRegistry.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.eventUnsubscribers = [];
        this.lastSnapshot = null;
        this.pendingEvents = [];
    }

    init(data) {
        // Phase 4: Registriere DI-Services mit vollständigen Daten
        // MAZE RANDOMIZATION: Don't pass maze/pelletGrid/spawnPoints
        // so SpawningSystem.generateMazeForLevel() will be called instead of setMaze()
        registerCoreServices({
            level: data.level || 1,
            lives: data.lives || 3,
            score: data.score || 0,
            highScore: data.highScore || 0,
            deathPauseDuration: animationConfig.deathPauseDuration
            // Removed: maze, pelletGrid, spawnPoints - now generated randomly
        });

        // Phase 4: Verwende GameModelDI mit DI (keine Duplizierung nötig)
        this.gameModel = new GameModelDI({
            score: data.score || 0,
            lives: data.lives ?? 3,
            level: data.level || 1,
            highScore: data.highScore || 0,
            deathPauseDuration: animationConfig.deathPauseDuration
        }, true); // DI aktiviert
        this.gameModel.init();

        this.storageManager = new StorageManager();

        this.playerScoreFacade = new PlayerScoreFacade(this.gameModel);

        this.levelManager = new LevelManager(this, this.gameModel);
        this.adaptiveDifficultySystem = new AdaptiveDifficultySystem(this);
        this.achievementSystem = new AchievementSystem(this);
        this.achievementSystem.init();

        this.replaySystem = new ReplaySystem();
        this.settings = this.storageManager.getSettings();
        this.isDeathSequence = false;
    }

    create() {
        this.cameras.main.setBackgroundColor(themeConfig.colors.background);

        // totalPellets is calculated by SpawningSystem, just sync pelletsRemaining
        this.gameModel.pelletsRemaining = this.gameModel.totalPellets;

        const viewContext = new ViewContext({
            scene: this,
            storageManager: this.storageManager,
            eventBus: gameEvents
        });

        this.gameView = new GameView(viewContext);
        this.gameView.applySettings(this.settings);

        this.gameView.create();

        this.uiController = new UIController(this, this.playerScoreFacade);
        this.uiController.create();

        this.inputManager = new InputManager();
        this.inputManager.registerAdapter('keyboard', new KeyboardAdapter(this.input));

        this.aiAdapter = new AIInputAdapter();
        this.aiAdapter.setGameModel(this.gameModel);
        this.inputManager.registerAdapter('ai', this.aiAdapter);

        this.inputManager.setActiveAdapter(this.sys.game.isDemo ? 'ai' : 'keyboard');

        this.gameController = new GameController({
            gameModel: this.gameModel,
            playerScoreFacade: this.playerScoreFacade,
            replaySystem: this.replaySystem,
            inputManager: this.inputManager
        });
        this.gameController.activate();

        // Phase 2: Bind scene transition events in controller
        this.gameController.bindSceneTransitionEvents();

        // Start game
        this.start();

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

        // Get initial snapshot for view and UI
        const initialSnapshot = this.gameModel.getSnapshot();
        this.adaptiveDifficultySystem.resetForRound(initialSnapshot);
        const initialHudSnapshot = this.playerScoreFacade.toHudSnapshot();
        this.gameView.updateFromSnapshot(initialSnapshot);
        this.uiController.updateFromSnapshot(initialHudSnapshot);

        gameEvents.emit(GAME_EVENTS.GAME_STARTED, {
            level: this.gameModel.level
        });
    }

    /**
     * Start's game (unpause and begin game loop)
     */
    start() {
        this.gameModel.setPaused(false);
        this.gameModel.isPaused = false;
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
        this.pendingEvents = [];
        this.fixedTimeStepLoop.update(deltaInSeconds);

        // Store events for adaptive difficulty system before clearing
        // Events were added by fixedUpdate() calls during fixedTimeStepLoop.update()
        const allEvents = this.pendingEvents;

        // Process all events from fixed updates
        for (const event of allEvents) {
            this.achievementSystem.check(this.gameModel);

            if (event.type === 'pellet_eaten' || event.type === 'power_pellet_eaten' || event.type === 'pelletEaten' || event.type === 'powerPelletEaten') {
                this.checkFruitSpawn();
            }

            if (event.type === 'pacman_died' || event.type === 'pacmanDied') {
                this.isDeathSequence = true;
                this.gameView.startDeathAnimation();
            }

            if (event.type === 'respawn') {
                this.isDeathSequence = false;
                this.gameView.endDeathAnimation();
            }

            if (event.type === 'level_complete' || event.type === 'levelComplete') {
                this.handleLevelComplete();
            }
        }
        this.pendingEvents = [];

        if (this.isDeathSequence) {
            this.gameView.updateDeathAnimation(deltaInSeconds);
            this.gameView.sync();
            this.uiController.update();
            this.debugOverlay.update(time, delta);
            return;
        }

        this.inputManager.update(deltaInSeconds * 1000);

        // OPTIMIZED: Create snapshot only once per frame in update(), not in fixedUpdate
        // This avoids creating multiple snapshots when fixedUpdate runs multiple times
        this.lastSnapshot = this.gameModel.getSnapshot();
        this.gameView.updateFromSnapshot(this.lastSnapshot);

        // Update adaptive difficulty and replay systems (moved from fixedUpdate)
        const deltaSeconds = deltaInSeconds;
        this.adaptiveDifficultySystem.update(deltaSeconds, this.lastSnapshot, allEvents);
        this.replaySystem.update(deltaSeconds);

        // OPTIMIZED: UI updates directly without expensive snapshot creation
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
        // Collect events from this step - we'll process them after all fixed updates in update()
        const events = this.gameModel.step(deltaSeconds);

        // Store events to process after all fixed updates are done
        this.pendingEvents.push(...events);
    }

    checkFruitSpawn() {
        if (this.gameModel.shouldSpawnFruit() && !this.gameModel.fruit.active) {
            this.gameModel.fruit.activate(this.gameModel.level);
        }
    }

    setupEventListeners() {
        // Handle pause/resume requests from controller
        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.PAUSE_REQUESTED, () => {
                this.scene.pause();
                this.scene.launch('PauseScene');
            })
        );

        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.RESUME_REQUESTED, () => {
                this.gameModel.setPaused(false);
                this.gameView.resumeAudio();
            })
        );

        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
                this.cleanup();
                this.scene.start('MenuScene');
            })
        );

        // Phase 2: Handle scene transition events from SceneTransitionHandler
        this.eventUnsubscribers.push(
            gameEvents.on('GAME_WIN', (eventData) => {
                const data = eventData?.data || eventData;
                this.scene.start('WinScene', data);
            })
        );

        this.eventUnsubscribers.push(
            gameEvents.on('GAME_OVER', (eventData) => {
                const data = eventData?.data || eventData;
                this.scene.start('GameOverScene', data);
            })
        );

        this.eventUnsubscribers.push(
            gameEvents.on('RETURN_TO_MENU', (data) => {
                this.cleanup();
                this.scene.start('MenuScene', data);
            })
        );

        // Handle restart level requests
        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.RESTART_LEVEL_REQUESTED, (data) => {
                this.scene.restart(data);
            })
        );

        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, (achievement) => {
                this.gameView.showAchievementNotification(achievement);
            })
        );

        this.eventUnsubscribers.push(
            gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, () => {
                // Phase 2: Level complete event is now handled by View's SceneTransitionHandler
            })
        );

        if (this.replaySystem && !this.replaySystem.isReplaying) {
            this.eventUnsubscribers.push(
                gameEvents.on(GAME_EVENTS.DIRECTION_CHANGED, (data) => {
                    if (this.replaySystem.isRecording) {
                        this.replaySystem.recordInput({ type: 'direction', data });
                    }
                })
            );

            this.eventUnsubscribers.push(
                gameEvents.on(GAME_EVENTS.SCORE_CHANGED, (data) => {
                    if (this.replaySystem.isRecording) {
                        this.replaySystem.recordScore(data.score);
                        this.replaySystem.recordLevel(data.level);
                    }
                })
            );

            this.eventUnsubscribers.push(
                gameEvents.on(GAME_EVENTS.GAME_STARTED, () => {
                    this.replaySystem.startRecording();
                })
            );

            this.eventUnsubscribers.push(
                gameEvents.on(GAME_EVENTS.GAME_OVER, () => {
                    if (this.replaySystem.isRecording) {
                        this.replaySystem.stopRecording();
                    }
                })
            );
        }
    }

    resume() {
        this.gameModel.setPaused(false);
        this.gameView.resumeAudio();
    }

    cleanup() {
        // Phase 2: Unbind scene transition events before destroying controller
        this.gameController?.unbindSceneTransitionEvents();

        // Unsubscribe all event listeners
        this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
        this.eventUnsubscribers = [];

        this.uiController?.cleanup();
        this.inputManager?.destroy();
        this.gameController?.destroy();
        this.gameView?.cleanup();
        this.debugOverlay?.cleanup();
        this.achievementSystem?.save();
        this.replaySystem?.cleanup();

        // Destroy game model to unsubscribe event listeners
        this.gameModel?.destroy();

        // Phase 4: Services freigeben
        clearServices();
    }

    /**
     * Phaser shutdown lifecycle method
     * Ensures proper cleanup when scene is stopped
     */
    shutdown() {
        this.cleanup();
    }
}
