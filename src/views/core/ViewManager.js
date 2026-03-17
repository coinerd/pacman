/**
 * ViewManager
 * Facade for coordinating all renderers and visual managers
 * Replaces monolithic ModelDrivenGameView with modular architecture
 */

import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';
import { ViewContext, ViewState } from '../ViewInterface.js';
import { SceneTransitionHandler } from '../SceneTransitionHandler.js';
import { VIEW_EVENTS } from '../ViewEvents.js';
import { SoundManager } from '../../managers/SoundManager.js';
import { EffectManager } from '../../scenes/systems/EffectManager.js';

// Core coordinators
import { RenderCoordinator } from './RenderCoordinator.js';
import { EffectOrchestrator } from './EffectOrchestrator.js';

// Renderer managers
import { MazeRenderer } from '../renderers/MazeRenderer.js';
import { PelletRenderer } from '../renderers/PelletRenderer.js';
import { EntityRendererManager } from '../renderers/EntityRendererManager.js';
import { BossVisualManager } from '../renderers/BossVisualManager.js';
import { PowerUpVisualManager } from '../renderers/PowerUpVisualManager.js';
import { NarrativeManager } from '../renderers/NarrativeManager.js';

export class ViewManager {
    /**
     * @param {ViewContext|Object} contextOrConfig - ViewContext with dependencies (phase 1) OR legacy config for backward compatibility
     * @deprecated Legacy { scene, gameModel, storageManager } format is deprecated. Use ViewContext instead.
     */
    constructor(contextOrConfig) {
        // Backward compatibility: Support both old and new constructor signature
        if (contextOrConfig instanceof ViewContext) {
            // New signature: ViewContext
            this.context = contextOrConfig;
            this.scene = contextOrConfig.scene;
            this.storageManager = contextOrConfig.storageManager;
            this.eventBus = contextOrConfig.eventBus;
            this.gameModel = null; // No direct model access
            this.useSnapshotMode = true;
        } else {
            // Legacy signature: { scene, gameModel, storageManager }
            this.scene = contextOrConfig.scene;
            this.gameModel = contextOrConfig.gameModel;
            this.storageManager = contextOrConfig.storageManager;
            this.context = null;
            this.eventBus = gameEvents; // Use global event bus for legacy mode
            this.useSnapshotMode = false;
        }

        // Internal view state (managed by View)
        this.viewState = new ViewState();

        // Latest snapshot (for snapshot-based rendering)
        this.lastSnapshot = null;
        this.lastMazeSnapshot = null;
        this.frameCount = 0;

        // Scene Transition Handler
        this.transitionHandler = new SceneTransitionHandler({
            eventBus: this.eventBus
        });

        // Core coordinators
        this.renderCoordinator = new RenderCoordinator(this.scene);
        this.effectOrchestrator = new EffectOrchestrator(this.scene);

        // Renderer managers
        this.mazeRenderer = new MazeRenderer(this.scene);
        this.pelletRenderer = new PelletRenderer(this.scene);
        this.entityRendererManager = new EntityRendererManager(this.scene);
        this.bossVisualManager = new BossVisualManager(this.scene);
        this.powerUpVisualManager = new PowerUpVisualManager(this.scene);
        this.narrativeManager = new NarrativeManager(this.scene);

        // Register renderers with coordinator
        this.registerRenderers();

        // Managers
        this.soundManager = new SoundManager(this.scene);
        this.effectManager = new EffectManager(this.scene);

        // Event unsubscribers
        this.unsubscribers = [];

        // Death animation state
        this.isDeathAnimating = false;
    }

    /**
     * Register all renderers with the render coordinator
     */
    registerRenderers() {
        const phases = this.renderCoordinator.renderPhases;

        // Background phase - createBackground() is called once in create(), not every frame
        this.renderCoordinator.registerRenderer(phases.BACKGROUND, {
            render: () => {
                // Background is created once in create(), no need to recreate every frame
            }
        }, 0);

        // World phase - pellets are updated via events, not by scanning the grid
        this.renderCoordinator.registerRenderer(phases.WORLD, {
            render: () => {
                // Maze is created once in create() and updateFromSnapshot() when it changes
                // Pellets are updated via PELLET_EATEN events, not by scanning the grid every frame
            }
        }, 0);

        // Entities phase
        this.renderCoordinator.registerRenderer(phases.ENTITIES, {
            render: () => {
                if (this.lastSnapshot) {
                    this.entityRendererManager.updateFromSnapshot(this.lastSnapshot);
                    this.bossVisualManager.updateFromSnapshot(this.lastSnapshot.boss);
                    this.powerUpVisualManager.updateFromSnapshot(this.lastSnapshot.powerUps);
                }
            }
        }, 0);

        // Effects phase
        this.renderCoordinator.registerRenderer(phases.EFFECTS, {
            render: (deltaTime) => this.effectOrchestrator.update?.(deltaTime)
        }, 0);
    }

    /**
     * Apply settings
     * @param {Object} settings - Settings to apply
     */
    applySettings(settings) {
        if (!settings) {
            return;
        }

        if (settings.soundEnabled !== undefined) {
            this.soundManager.setEnabled(settings.soundEnabled);
        }
        if (settings.volume !== undefined) {
            this.soundManager.setVolume(settings.volume);
        }
    }

    /**
     * Create all visual elements
     */
    create() {
        this.mazeRenderer.createBackground();
        // Note: Maze will be created in updateFromSnapshot() when first snapshot arrives
        // because in snapshot mode, maze data comes from the model via snapshots
        this.pelletRenderer.createPelletPools();

        if (this.useSnapshotMode) {
            // In snapshot mode, entity renderers created on first updateFromSnapshot()
        } else {
            // Legacy mode: create entity renderers from model
            this.entityRendererManager.createRenderersFromModel(this.gameModel);
        }

        this.bindModelEvents();
        this.bindControllerEvents();
    }

    /**
     * Get maze data (supports both snapshot and legacy mode)
     * @returns {Array<Array<number>>|null}
     */
    getMazeData() {
        return this.lastSnapshot ? this.lastSnapshot.maze : this.gameModel?.maze;
    }

    /**
     * Get pellet grid data (supports both snapshot and legacy mode)
     * @returns {Array<Array<number>>|null}
     */
    getPelletGridData() {
        return this.lastSnapshot ? this.lastSnapshot.pelletGrid : this.gameModel?.pelletGrid;
    }

    /**
     * Bind to model events
     */
    bindModelEvents() {
        this.unsubscribers.push(
            this.eventBus.on(GAME_EVENTS.PELLET_EATEN, (data) => this.onPelletEaten(data)),
            this.eventBus.on(GAME_EVENTS.POWER_PELLET_EATEN, (data) => this.onPelletEaten(data)),
            this.eventBus.on(VIEW_EVENTS.GHOST_EATEN, (data) => this.onGhostEaten(data)),
            this.eventBus.on(VIEW_EVENTS.PACMAN_DEATH_STARTED, () => this.startDeathAnimation()),
            this.eventBus.on(VIEW_EVENTS.FRUIT_EATEN, (data) => this.onFruitEaten(data)),
            this.eventBus.on(VIEW_EVENTS.POWER_UP_COLLECTED, (data) => this.onPowerUpCollected(data)),
            this.eventBus.on(VIEW_EVENTS.BOSS_SPAWNED, (data) => this.bossVisualManager.showBossWarning(data.bossType)),
            this.eventBus.on(VIEW_EVENTS.BOSS_PHASE_CHANGED, (data) => this.bossVisualManager.updateBossVisualPhase(data.bossType, data.phase)),
            this.eventBus.on(VIEW_EVENTS.BOSS_DAMAGED, (data) => this.bossVisualManager.flashBossVisual(data.bossType)),
            this.eventBus.on(VIEW_EVENTS.BOSS_DEFEATED, (data) => this.onBossDefeated(data)),
            this.eventBus.on(VIEW_EVENTS.STORY_CHAPTER_START, (data) => this.narrativeManager.showStoryNarrative(data)),
            this.eventBus.on(VIEW_EVENTS.STORY_CHAPTER_COMPLETE, (data) => this.narrativeManager.showChapterCompleteMessage(data)),
            this.eventBus.on(VIEW_EVENTS.ACHIEVEMENT_UNLOCKED, (data) => this.narrativeManager.showAchievementNotification(data)),
            this.eventBus.on(VIEW_EVENTS.SCREEN_FLASH, (data) => this.effectOrchestrator.createScreenFlash(data.color, data.duration)),
            this.eventBus.on(VIEW_EVENTS.SCREEN_SHAKE, (data) => this.effectOrchestrator.createScreenShake(data.intensity, data.duration))
        );

        // Game flow events
        this.unsubscribers.push(
            this.eventBus.on(GAME_EVENTS.LEVEL_COMPLETE, () => this.onLevelComplete()),
            this.eventBus.on(GAME_EVENTS.GAME_OVER, () => this.onGameOver()),
            this.eventBus.on(GAME_EVENTS.RESPAWN, () => this.endDeathAnimation())
        );
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
            })
        );
    }

    // === Event Handlers ===

    onPelletEaten(data) {
        const type = data?.isPowerPellet ? 'power_pellet' : 'pellet';
        if (data?.isPowerPellet) {
            this.soundManager.playPowerPellet?.();
            this.effectOrchestrator.play('powerPelletEaten',
                data.x || data.gridX * 16 + 8,
                data.y || data.gridY * 16 + 8
            );
        } else {
            this.soundManager.playWakaWaka?.();
        }

        this.pelletRenderer.removePelletAt(data.gridX, data.gridY, type);
    }

    onGhostEaten(data) {
        this.soundManager.playGhostEaten?.();
        this.effectOrchestrator.play('ghostEaten', data.x, data.y);

        const ghost = this.entityRendererManager.getGhostRenderer(data.ghostType);
        if (ghost) {
            const pos = ghost.getPosition?.() || { x: data.x, y: data.y };
            this.effectManager.createGhostEatenEffect?.(pos.x, pos.y);
        }
    }

    onFruitEaten(data) {
        this.soundManager.playFruitEat?.();

        const fruit = this.entityRendererManager.getFruitRenderer();
        if (fruit) {
            fruit.showScore?.(data.score);
            const pos = fruit.getPosition?.() || { x: data.x, y: data.y };
            this.effectOrchestrator.play('fruitEaten', pos.x, pos.y);
        }
    }

    onPowerUpCollected(data) {
        const visual = this.powerUpVisualManager.getPowerUpVisual(data.type, data.gridX, data.gridY);
        if (visual) {
            this.powerUpVisualManager.showPowerUpCollectionEffect(data.type, visual);
            this.effectOrchestrator.play('powerUpCollected', visual.sprite.x, visual.sprite.y);
        }
    }

    onBossDefeated(data) {
        this.effectOrchestrator.play('bossDefeated',
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        );
        this.bossVisualManager.showBossDefeatMessage(data.scoreBonus);
        this.effectManager.createExplosionEffect?.(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            0xff0000
        );
    }

    onLevelComplete() {
        this.soundManager.playLevelComplete?.();

        const score = this.lastSnapshot?.score ?? this.gameModel?.score ?? 0;
        const level = this.lastSnapshot?.level ?? this.gameModel?.level ?? 1;
        const highScore = this.lastSnapshot?.highScore ?? this.gameModel?.highScore ?? 0;

        this.storageManager.saveHighScore(score);
        this.transitionHandler.requestSceneTransition('WinScene', { score, level, highScore });
    }

    onGameOver() {
        const score = this.lastSnapshot?.score ?? this.gameModel?.score ?? 0;
        const highScore = this.lastSnapshot?.highScore ?? this.gameModel?.highScore ?? 0;

        this.storageManager.saveHighScore(score);
        this.transitionHandler.requestSceneTransition('GameOverScene', { score, highScore });
    }

    // === Update Methods ===

    /**
     * Update view from snapshot (Phase 1 & 4)
     * @param {Object} snapshot - Game snapshot
     */
    updateFromSnapshot(snapshot) {
        if (!snapshot) {
            return;
        }

        // Skip if snapshot hasn't changed (dirty tracking)
        if (this.lastSnapshot && this.snapshotEquals(this.lastSnapshot, snapshot)) {
            return;
        }

        // Store snapshot
        this.lastSnapshot = snapshot;
        this.frameCount++;

        // Ensure pellet pools are initialized
        if (!this.pelletRenderer.pelletPool) {
            this.pelletRenderer.createPelletPools();
        }

        // Check if maze changed (or first snapshot) - only if we have maze data
        if (snapshot.maze) {
            const mazeChanged = !this.lastMazeSnapshot || !this.mazeEquals(this.lastMazeSnapshot.maze, snapshot.maze);
            if (mazeChanged) {
                this.mazeRenderer.createMaze(snapshot.maze);
                this.pelletRenderer.clearAllPellets();
                this.pelletRenderer.createPellets(snapshot.pelletGrid);
                this.lastMazeSnapshot = { maze: snapshot.maze };
            }
        }

        // Update pellet visuals
        this.pelletRenderer.updatePelletVisuals(snapshot.pelletGrid);

        // Create entity renderers on first snapshot
        if (!this.entityRendererManager.hasRenderers()) {
            this.entityRendererManager.createRenderersFromSnapshot(snapshot);
        }

        // Update entity renderers
        this.entityRendererManager.updateFromSnapshot(snapshot);

        // Update boss visuals
        this.bossVisualManager.updateFromSnapshot(snapshot.boss);

        // Update power-up visuals
        this.powerUpVisualManager.updateFromSnapshot(snapshot.powerUps);

        // Handle death animation state
        if (snapshot.isDying && !this.isDeathAnimating) {
            this.startDeathAnimation();
        } else if (!snapshot.isDying && this.isDeathAnimating) {
            this.endDeathAnimation();
        }

        // Update render coordinator
        this.renderCoordinator.render(16.67); // ~60fps
    }

    /**
     * Sync view to model (legacy mode, deprecated)
     * @deprecated Use updateFromSnapshot(snapshot) instead
     */
    sync() {
        if (this.useSnapshotMode && this.lastSnapshot) {
            this.updateFromSnapshot(this.lastSnapshot);
        }
    }

    // === Utility Methods ===

    mazeEquals(maze1, maze2) {
        if (!maze1 || !maze2) {
            // If both are null/undefined, they are equal
            // If only one is null/undefined, they are not equal
            return (!maze1 && !maze2);
        }
        // Fast path: same reference means equal
        if (maze1 === maze2) {return true;}
        if (maze1.length !== maze2.length) {return false;}
        if (maze1[0]?.length !== maze2[0]?.length) {return false;}

        // Check first and last row for performance
        // Maze changes only happen on level change
        for (let x = 0; x < maze1[0].length; x++) {
            if (maze1[0][x] !== maze2[0][x]) {return false;}
        }
        const lastRow = maze1.length - 1;
        for (let x = 0; x < maze1[lastRow].length; x++) {
            if (maze1[lastRow][x] !== maze2[lastRow][x]) {return false;}
        }

        return true;
    }

    pelletGridEquals(grid1, grid2) {
        if (!grid1 || !grid2) {return grid1 === grid2;}
        if (grid1.length !== grid2.length) {return false;}
        if (grid1[0]?.length !== grid2[0]?.length) {return false;}

        for (let y = 0; y < grid1.length; y++) {
            for (let x = 0; x < grid1[y].length; x++) {
                if (grid1[y][x] !== grid2[y][x]) {return false;}
            }
        }

        return true;
    }

    snapshotEquals(s1, s2) {
        if (!s1 || !s2) {return s1 === s2;}
        // Quick check: tickCount is unique per frame - if different, snapshots are different
        if (s1.tickCount !== s2.tickCount) {return false;}
        // If tickCount is the same, check other properties that might change
        if (s1.score !== s2.score) {return false;}
        if (s1.lives !== s2.lives) {return false;}
        if (s1.pelletsRemaining !== s2.pelletsRemaining) {return false;}
        // Check if pacman position changed
        if (s1.pacman?.x !== s2.pacman?.x || s1.pacman?.y !== s2.pacman?.y) {
            return false;
        }
        // Check if ghost positions changed
        if (s1.ghosts && s2.ghosts) {
            if (s1.ghosts.length !== s2.ghosts.length) {return false;}
            for (let i = 0; i < s1.ghosts.length; i++) {
                const g1 = s1.ghosts[i];
                const g2 = s2.ghosts[i];
                if (g1.x !== g2.x || g1.y !== g2.y || g1.gridX !== g2.gridX || g1.gridY !== g2.gridY) {
                    return false;
                }
            }
        }
        // Don't compare full maze/pelletGrid - they rarely change and are expensive to compare
        return true;
    }

    // === Death Animation ===

    startDeathAnimation() {
        this.isDeathAnimating = true;
        this.soundManager.playDeath?.();
    }

    updateDeathAnimation() {
        if (this.isDeathAnimating) {
            const playerRenderer = this.entityRendererManager.getPlayerRenderer();
            if (playerRenderer) {
                playerRenderer.sync();
            }
        }
    }

    endDeathAnimation() {
        this.isDeathAnimating = false;
        const playerRenderer = this.entityRendererManager.getPlayerRenderer();
        if (playerRenderer) {
            // Reset player visual state
        }
    }

    // === Audio ===

    resumeAudio() {
        // Initialize AudioContext if not already done (browser autoplay policy requires user interaction)
        if (!this.soundManager.initialized) {
            this.soundManager.initialize();
        }
        this.soundManager.resume?.();
    }

    // === Cleanup ===

    cleanup() {
        // Unsubscribe from events
        this.unsubscribers.forEach((unsubscribe) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.unsubscribers = [];

        // Cleanup coordinators
        this.renderCoordinator.cleanup();
        this.effectOrchestrator.cleanup();

        // Cleanup renderer managers
        this.mazeRenderer.cleanup();
        this.pelletRenderer.cleanup();
        this.entityRendererManager.cleanup();
        this.bossVisualManager.cleanup();
        this.powerUpVisualManager.cleanup();
        this.narrativeManager.cleanup();

        // Cleanup managers
        this.soundManager.cleanup?.();
        this.effectManager.cleanup?.();
    }

    // === Getters for Testing ===

    getMazeRenderer() { return this.mazeRenderer; }
    getPelletRenderer() { return this.pelletRenderer; }
    getEntityRendererManager() { return this.entityRendererManager; }
    getBossVisualManager() { return this.bossVisualManager; }
    getPowerUpVisualManager() { return this.powerUpVisualManager; }
    getNarrativeManager() { return this.narrativeManager; }
    getSoundManager() { return this.soundManager; }
    getEffectManager() { return this.effectManager; }
    getRenderCoordinator() { return this.renderCoordinator; }
    getEffectOrchestrator() { return this.effectOrchestrator; }
    getLastSnapshot() { return this.lastSnapshot; }
    getFrameCount() { return this.frameCount; }
}

export default ViewManager;
