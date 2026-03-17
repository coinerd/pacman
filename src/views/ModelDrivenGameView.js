/**
 * ModelDrivenGameView
 * Facade for the modular view system
 *
 * Phase 2: Refactored to use ViewManager
 * - Delegates all rendering to specialized renderer modules
 * - Maintains backward compatibility with existing API
 * - Snapshot-based rendering with ViewContext support
 *
 * @deprecated Use ViewManager directly for new code
 */

import { ViewManager } from './core/ViewManager.js';
import { GAME_EVENTS } from '../core/EventBus.js';
import { VIEW_EVENTS } from './ViewEvents.js';

export default class ModelDrivenGameView {
    /**
     * @param {ViewContext|Object} contextOrConfig - ViewContext or legacy config
     */
    constructor(contextOrConfig) {
        // Create the actual view manager that handles all rendering
        this.viewManager = new ViewManager(contextOrConfig);

        // Expose scene for backward compatibility
        this.scene = this.viewManager.scene;
        this.gameModel = this.viewManager.gameModel;
        this.storageManager = this.viewManager.storageManager;
        this.eventBus = this.viewManager.eventBus;
        this.useSnapshotMode = this.viewManager.useSnapshotMode;

        // Legacy properties for backward compatibility
        this.lastSnapshot = null;
        this.frameCount = 0;
        this.viewState = this.viewManager.viewState;
        this.isDeathAnimating = false;

        // Event unsubscribers (for backward compatibility with tests)
        this.unsubscribers = [];

        // Expose pellet renderer for backward compatibility with tests
        this.pelletRenderer = this.viewManager.pelletRenderer;

        // Legacy visual tracking (for tests)
        this.bossVisual = null;
        this.powerUpVisuals = new Map();
        this.storyOverlay = null;
        this.storyText = null;
        this.storyDescription = null;

        // Managers (for backward compatibility)
        this.soundManager = this.viewManager.soundManager;
        this.effectManager = this.viewManager.effectManager;
        this.transitionHandler = this.viewManager.transitionHandler;
    }

    // === Lifecycle Methods ===

    /**
     * Apply settings
     * @param {Object} settings - Settings to apply
     */
    applySettings(settings) {
        this.viewManager.applySettings(settings);
    }

    /**
     * Create all visual elements
     */
    create() {
        this.viewManager.create();

        // Sync legacy properties
        this.lastSnapshot = this.viewManager.lastSnapshot;
    }

    /**
     * Create background - delegates to MazeRenderer
     */
    createBackground() {
        this.viewManager.mazeRenderer.createBackground();
    }

    /**
     * Create maze walls - delegates to MazeRenderer
     */
    createMaze(mazeOverride = null) {
        const maze = mazeOverride || this.getMazeData();
        this.viewManager.mazeRenderer.createMaze(maze);
    }

    /**
     * Draw a single wall tile (for backward compatibility)
     */
    drawWallToGraphics(graphics, x, y, maze) {
        this.viewManager.mazeRenderer.drawWallToGraphics(graphics, x, y, maze);
    }

    /**
     * Create pellets - delegates to PelletRenderer
     */
    createPellets(pelletGridOverride = null) {
        const pelletGrid = pelletGridOverride || this.getPelletGridData();
        this.viewManager.pelletRenderer.createPellets(pelletGrid);
    }

    /**
     * Create entity renderers - delegates to EntityRendererManager
     */
    createEntityRenderers() {
        if (this.useSnapshotMode) {
            // In snapshot mode, renderers created on first updateFromSnapshot()
            return;
        }
        this.viewManager.entityRendererManager.createRenderersFromModel(this.gameModel);
    }

    // === Update Methods ===

    /**
     * Update view from snapshot - delegates to ViewManager
     * @param {Object} snapshot - Game snapshot
     */
    updateFromSnapshot(snapshot) {
        this.viewManager.updateFromSnapshot(snapshot);

        // Sync legacy properties
        this.lastSnapshot = this.viewManager.lastSnapshot;
        this.frameCount = this.viewManager.frameCount;
        this.isDeathAnimating = this.viewManager.isDeathAnimating;
        this.lastMazeSnapshot = this.viewManager.lastMazeSnapshot;

        // Sync boss and power-up visuals for tests
        this.bossVisual = this.viewManager.bossVisualManager.bossVisual;
    }

    /**
     * Sync view to model - delegates to ViewManager
     * @deprecated Use updateFromSnapshot(snapshot) instead
     */
    sync() {
        this.viewManager.sync();

        // Sync legacy properties
        this.lastSnapshot = this.viewManager.lastSnapshot;
        this.frameCount = this.viewManager.frameCount;
    }

    // === Event Binding (for backward compatibility) ===

    /**
     * Bind to model events
     */
    bindModelEvents() {
        // View events
        this.unsubscribers.push(
            this.eventBus.on(VIEW_EVENTS.PELLET_EATEN, (data) => {
                if (data.type === 'power_pellet') {
                    this.soundManager.playPowerPellet?.();
                } else {
                    this.soundManager.playWakaWaka?.();
                }
                this.pelletRenderer.removePelletAt(data.gridX, data.gridY, data.type);
            }),
            this.eventBus.on(VIEW_EVENTS.GHOST_EATEN, (data) => {
                this.soundManager.playGhostEaten?.();
                const ghost = this.lastSnapshot?.ghosts?.find(g => g.ghostType === data.ghostType);
                if (ghost) {
                    this.effectManager.createGhostEatenEffect?.(ghost.x, ghost.y);
                }
            }),
            this.eventBus.on(VIEW_EVENTS.PACMAN_DEATH_STARTED, () => {
                this.soundManager.playDeath?.();
                this.startDeathAnimation();
            }),
            this.eventBus.on(VIEW_EVENTS.FRUIT_EATEN, () => {
                this.soundManager.playFruitEat?.();
                const fruit = this.lastSnapshot?.fruit;
                if (fruit) {
                    this.effectManager.createFruitEatEffect?.(fruit.x, fruit.y, fruit.color);
                }
            }),
            this.eventBus.on(VIEW_EVENTS.SCREEN_FLASH, (data) => {
                this.effectManager.createScreenFlash?.(data.color, data.duration);
            }),
            this.eventBus.on(VIEW_EVENTS.SCREEN_SHAKE, (data) => {
                this.effectManager.createScreenShake?.(data.intensity, data.duration);
            }),
            this.eventBus.on(VIEW_EVENTS.GHOST_MODE_CHANGED, (data) => {
                // Handled by entity renderer
            }),
            this.eventBus.on(VIEW_EVENTS.BOSS_SPAWNED, (data) => {
                this.createBossVisual(data.bossType);
                this.showBossWarning(data.bossType);
            }),
            this.eventBus.on(VIEW_EVENTS.BOSS_PHASE_CHANGED, (data) => {
                this.updateBossVisualPhase(data.bossType, data.phase);
            }),
            this.eventBus.on(VIEW_EVENTS.BOSS_DAMAGED, (data) => {
                this.flashBossVisual(data.bossType);
            }),
            this.eventBus.on(VIEW_EVENTS.BOSS_DEFEATED, (data) => {
                this.removeBossVisual();
                this.effectManager.createExplosionEffect?.(
                    this.scene.scale.width / 2,
                    this.scene.scale.height / 2,
                    0xff0000
                );
                this.showBossDefeatMessage(data.scoreBonus);
            }),
            this.eventBus.on(VIEW_EVENTS.POWERUP_SPAWNED, (data) => {
                this.createPowerUpVisual(data.type, data.gridX, data.gridY);
            }),
            this.eventBus.on(VIEW_EVENTS.POWERUP_COLLECTED, (data) => {
                const powerUpKey = `${data.x},${data.y}`;
                const visual = this.powerUpVisuals.get(powerUpKey);
                if (visual) {
                    this.removePowerUpVisual(visual);
                    this.showPowerUpCollectionEffect(data.type, visual);
                }
            }),
            this.eventBus.on(VIEW_EVENTS.STORY_CHAPTER_START, (data) => {
                this.showStoryNarrative(data);
            }),
            this.eventBus.on(VIEW_EVENTS.STORY_CHAPTER_COMPLETE, (data) => {
                this.showChapterCompleteMessage(data);
            }),
            this.eventBus.on(VIEW_EVENTS.STORY_NARRATIVE_SHOW, (data) => {
                this.showStoryNarrative(data);
            })
        );

        // Game events
        this.unsubscribers.push(
            this.eventBus.on(GAME_EVENTS.LEVEL_COMPLETE, () => {
                this.soundManager.playLevelComplete?.();
                const score = this.lastSnapshot?.score ?? this.gameModel?.score ?? 0;
                const level = this.lastSnapshot?.level ?? this.gameModel?.level ?? 1;
                const highScore = this.lastSnapshot?.highScore ?? this.gameModel?.highScore ?? 0;
                this.storageManager.saveHighScore(score);
                this.transitionHandler.requestSceneTransition('WinScene', { score, level, highScore });
            }),
            this.eventBus.on(GAME_EVENTS.GAME_OVER, () => {
                const score = this.lastSnapshot?.score ?? this.gameModel?.score ?? 0;
                const highScore = this.lastSnapshot?.highScore ?? this.gameModel?.highScore ?? 0;
                this.storageManager.saveHighScore(score);
                this.transitionHandler.requestSceneTransition('GameOverScene', { score, highScore });
            }),
            this.eventBus.on(GAME_EVENTS.RESPAWN, () => {
                this.isDeathAnimating = false;
                this.endDeathAnimation();
            })
        );

        // Also bind controller events
        this.bindControllerEvents();
        this.bindPhase5Events();
    }

    /**
     * Bind to controller events
     */
    bindControllerEvents() {
        this.unsubscribers.push(
            this.eventBus.on(GAME_EVENTS.PAUSE_REQUESTED, () => {
                this.scene.scene.pause();
                this.scene.scene.launch('PauseScene');
            }),
            this.eventBus.on(GAME_EVENTS.RESUME_REQUESTED, () => {
                this.scene.scene.resume();
                this.scene.scene.stop('PauseScene');
            }),
            this.eventBus.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
                this.scene.cleanup?.();
                this.transitionHandler.requestSceneTransition('MenuScene');
            }),
            this.eventBus.on(GAME_EVENTS.RESTART_LEVEL_REQUESTED, () => {
                // Handled by GameScene
            }),
            this.eventBus.on(GAME_EVENTS.REPLAY_TOGGLE_REQUESTED, (data) => {
                const replaySystem = data?.replaySystem;
                if (replaySystem) {
                    if (replaySystem.isRecording) {
                        replaySystem.stopRecording();
                    } else if (!replaySystem.isReplaying) {
                        replaySystem.startRecording();
                    }
                }
            }),
            this.eventBus.on(GAME_EVENTS.LOAD_REPLAY_REQUESTED, (data) => {
                const replaySystem = data?.replaySystem;
                if (replaySystem && !replaySystem.isReplaying) {
                    const recordings = replaySystem.getRecordings();
                    if (recordings.length > 0) {
                        replaySystem.loadRecording(recordings[recordings.length - 1]);
                    }
                }
            })
        );
    }

    /**
     * Bind to Phase 5 system events
     */
    bindPhase5Events() {
        // Already bound in bindModelEvents for consolidated handling
    }

    // === Utility Methods ===

    /**
     * Get maze data
     * @returns {Array<Array<number>>|null}
     */
    getMazeData() {
        return this.viewManager.getMazeData();
    }

    /**
     * Get pellet grid data
     * @returns {Array<Array<number>>|null}
     */
    getPelletGridData() {
        return this.viewManager.getPelletGridData();
    }

    /**
     * Check if position is a wall
     */
    isWallAt(gridX, gridY, mazeOverride = null) {
        const maze = mazeOverride || this.getMazeData();
        return this.viewManager.mazeRenderer.isWallAt(gridX, gridY, maze);
    }

    /**
     * Get pellet pool for backward compatibility
     */
    getPelletPool() {
        return this.viewManager.pelletRenderer?.pelletPool;
    }

    /**
     * Get power pellet pool for backward compatibility
     */
    getPowerPelletPool() {
        return this.viewManager.pelletRenderer?.powerPelletPool;
    }

    // === Comparison Methods ===

    mazeEquals(maze1, maze2) {
        return this.viewManager.mazeEquals(maze1, maze2);
    }

    pelletGridEquals(grid1, grid2) {
        return this.viewManager.pelletGridEquals(grid1, grid2);
    }

    snapshotEquals(s1, s2) {
        // Quick checks
        if (s1?.tickCount !== s2?.tickCount) {return false;}
        if (s1?.score !== s2?.score) {return false;}
        if (s1?.lives !== s2?.lives) {return false;}

        return this.mazeEquals(s1?.maze, s2?.maze) &&
               this.pelletGridEquals(s1?.pelletGrid, s2?.pelletGrid);
    }

    // === Entity Management ===

    createRenderersFromSnapshot(snapshot) {
        this.viewManager.entityRendererManager.createRenderersFromSnapshot(snapshot);
    }

    syncBossVisuals(bossSnapshot = null) {
        const boss = bossSnapshot || this.lastSnapshot?.boss;
        this.viewManager.bossVisualManager.updateFromSnapshot(boss);
        this.bossVisual = this.viewManager.bossVisualManager.bossVisual;
    }

    syncPowerUpVisuals(powerUpsSnapshot = null) {
        const powerUps = powerUpsSnapshot || this.lastSnapshot?.powerUps;
        this.viewManager.powerUpVisualManager.updateFromSnapshot(powerUps);
    }

    // === Visual Effects ===

    startDeathAnimation() {
        this.viewManager.startDeathAnimation();
        this.isDeathAnimating = true;
    }

    updateDeathAnimation() {
        this.viewManager.updateDeathAnimation();
    }

    endDeathAnimation() {
        this.viewManager.endDeathAnimation();
        this.isDeathAnimating = false;
    }

    showAchievementNotification(achievement) {
        this.viewManager.narrativeManager.showAchievementNotification(achievement);
    }

    createBossVisual(bossType, bossData) {
        this.viewManager.bossVisualManager.createBossVisual(bossType, bossData);
        this.bossVisual = this.viewManager.bossVisualManager.bossVisual;
    }

    removeBossVisual() {
        this.viewManager.bossVisualManager.removeBossVisual();
        this.bossVisual = null;
    }

    showBossWarning(bossType) {
        this.viewManager.bossVisualManager.showBossWarning(bossType);
    }

    showBossDefeatMessage(scoreBonus) {
        this.viewManager.bossVisualManager.showBossDefeatMessage(scoreBonus);
    }

    updateBossVisualPhase(bossType, phase) {
        this.viewManager.bossVisualManager.updateBossVisualPhase(bossType, phase);
    }

    flashBossVisual(bossType) {
        this.viewManager.bossVisualManager.flashBossVisual(bossType);
    }

    createPowerUpVisual(type, gridX, gridY) {
        this.viewManager.powerUpVisualManager.createPowerUpVisual(type, gridX, gridY);
    }

    removePowerUpVisual(visual) {
        this.viewManager.powerUpVisualManager.removePowerUpVisual(visual);
    }

    showPowerUpCollectionEffect(type, visual) {
        this.viewManager.powerUpVisualManager.showPowerUpCollectionEffect(type, visual);
    }

    showStoryNarrative(data) {
        this.viewManager.narrativeManager.showStoryNarrative(data);
    }

    showChapterCompleteMessage(data) {
        this.viewManager.narrativeManager.showChapterCompleteMessage(data);
    }

    hideStoryNarrative() {
        this.viewManager.narrativeManager.hideStoryNarrative();
    }

    // === Cleanup ===

    cleanup() {
        // Unsubscribe all events
        this.unsubscribers.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.unsubscribers = [];

        this.viewManager.cleanup();
    }

    // === Getters for Testing (Backward Compatibility) ===

    get playerRenderer() {
        return this.viewManager.entityRendererManager.getPlayerRenderer();
    }

    get ghostRenderers() {
        // Convert array to Map for backward compatibility
        const map = new Map();
        const renderers = this.viewManager.entityRendererManager.getAllGhostRenderers();
        renderers.forEach(renderer => {
            if (renderer.state?.ghostType) {
                map.set(renderer.state.ghostType, renderer);
            }
        });
        return map;
    }

    get fruitRenderer() {
        return this.viewManager.entityRendererManager.getFruitRenderer();
    }
}
