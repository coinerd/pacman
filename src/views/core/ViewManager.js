/**
 * ViewManager
 * Facade for coordinating all renderers and visual managers
 * Replaces monolithic ModelDrivenGameView with modular architecture
 */

import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';
import { ViewContext, ViewState, GameSnapshot } from '../ViewInterface.js';
import { SceneTransitionHandler } from '../SceneTransitionHandler.js';
import { VIEW_EVENTS } from '../ViewEvents.js';
import { SoundManager } from '../../managers/SoundManager.js';
import { EffectManager } from '../../scenes/systems/EffectManager.js';

// Renderer managers
import { MazeRenderer } from './MazeRenderer.js';
import { PelletRenderer } from './PelletRenderer.js';
import { EntityRendererManager } from './EntityRendererManager.js';
import { BossVisualManager } from './BossVisualManager.js';
import { PowerUpVisualManager } from './PowerUpVisualManager.js';
import { NarrativeManager } from './NarrativeManager.js';

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
            console.warn('[DEPRECATED] ViewManager constructor with { scene, gameModel, storageManager } is deprecated. Use ViewContext instead.');
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
        this.frameCount = 0;

        // Scene Transition Handler
        this.transitionHandler = new SceneTransitionHandler({
            eventBus: this.eventBus
        });

        // Renderer managers
        this.mazeRenderer = new MazeRenderer(this.scene);
        this.pelletRenderer = new PelletRenderer(this.scene);
        this.entityRendererManager = new EntityRendererManager(this.scene);
        this.bossVisualManager = new BossVisualManager(this.scene);
        this.powerUpVisualManager = new PowerUpVisualManager(this.scene);
        this.narrativeManager = new NarrativeManager(this.scene);

        // Managers
        this.soundManager = new SoundManager(this.scene);
        this.effectManager = new EffectManager(this.scene);

        // Event unsubscribers
        this.unsubscribers = [];

        // Death animation state
        this.isDeathAnimating = false;
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
        this.mazeRenderer.createMaze(this.getMazeData());
        this.pelletRenderer.createPelletPools();
        this.pelletRenderer.createPellets(this.getPelletGridData());

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
            this.eventBus.on(VIEW_EVENTS.PELLET_EATEN, () => this.onPelletEaten()),
            this.eventBus.on(VIEW_EVENTS.POWER_PELLET_EATEN, () => this.onPowerPelletEaten()),
            this.eventBus.on(VIEW_EVENTS.GHOST_EATEN, (data) => this.onGhostEaten(data)),
            this.eventBus.on(VIEW_EVENTS.PLAYER_DEATH, () => this.startDeathAnimation()),
            this.eventBus.on(VIEW_EVENTS.POWER_UP_COLLECTED, (data) => this.onPowerUpCollected(data)),
            this.eventBus.on(VIEW_EVENTS.BOSS_APPEARED, (data) => this.bossVisualManager.showBossWarning(data.bossType)),
            this.eventBus.on(VIEW_EVENTS.BOSS_PHASE_CHANGED, (data) => this.bossVisualManager.updateBossVisualPhase(data.bossType, data.phase)),
            this.eventBus.on(VIEW_EVENTS.BOSS_DAMAGED, (data) => this.bossVisualManager.flashBossVisual(data.bossType)),
            this.eventBus.on(VIEW_EVENTS.BOSS_DEFEATED, (data) => this.bossVisualManager.showBossDefeatMessage(data.scoreBonus)),
            this.eventBus.on(VIEW_EVENTS.CHAPTER_COMPLETE, (data) => this.narrativeManager.showChapterCompleteMessage(data)),
            this.eventBus.on(VIEW_EVENTS.STORY_NARRATIVE, (data) => this.narrativeManager.showStoryNarrative(data)),
            this.eventBus.on(VIEW_EVENTS.ACHIEVEMENT_UNLOCKED, (data) => this.narrativeManager.showAchievementNotification(data))
        );
    }

    /**
     * Bind to controller events
     */
    bindControllerEvents() {
        // Controller events can be added here as needed
    }

    /**
     * Update view from snapshot (Phase 1 & 4)
     * @param {GameSnapshot} snapshot - Game snapshot
     */
    updateFromSnapshot(snapshot) {
        this.lastSnapshot = snapshot;
        this.frameCount++;

        // Check if maze changed
        if (!this.mazeEquals(this.lastSnapshot.maze, snapshot.maze)) {
            this.mazeRenderer.createMaze(snapshot.maze);
        }

        // Update pellet visuals
        if (!this.pelletGridEquals(this.lastSnapshot.pelletGrid, snapshot.pelletGrid)) {
            this.pelletRenderer.updatePelletVisuals(snapshot.pelletGrid);
        }

        // Create entity renderers on first snapshot if they don't exist
        if (!this.entityRendererManager.hasRenderers()) {
            this.entityRendererManager.createRenderersFromSnapshot(snapshot);
        }

        // Update entity renderers
        this.entityRendererManager.updateFromSnapshot(snapshot);

        // Update boss visuals
        this.bossVisualManager.updateFromSnapshot(snapshot.boss);

        // Update power-up visuals
        this.powerUpVisualManager.updateFromSnapshot(snapshot.powerUps);
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

    /**
     * Compare maze grids
     * @param {Array<Array<number>>} maze1 - First maze
     * @param {Array<Array<number>>} maze2 - Second maze
     * @returns {boolean}
     */
    mazeEquals(maze1, maze2) {
        if (!maze1 || !maze2) return false;
        if (maze1.length !== maze2.length) return false;
        if (maze1[0]?.length !== maze2[0]?.length) return false;

        for (let y = 0; y < maze1.length; y++) {
            for (let x = 0; x < maze1[y].length; x++) {
                if (maze1[y][x] !== maze2[y][x]) return false;
            }
        }

        return true;
    }

    /**
     * Compare pellet grids
     * @param {Array<Array<number>>} grid1 - First grid
     * @param {Array<Array<number>>} grid2 - Second grid
     * @returns {boolean}
     */
    pelletGridEquals(grid1, grid2) {
        if (!grid1 || !grid2) return false;
        if (grid1.length !== grid2.length) return false;
        if (grid1[0]?.length !== grid2[0]?.length) return false;

        for (let y = 0; y < grid1.length; y++) {
            for (let x = 0; x < grid1[y].length; x++) {
                if (grid1[y][x] !== grid2[y][x]) return false;
            }
        }

        return true;
    }

    /**
     * Compare snapshots
     * @param {GameSnapshot} s1 - First snapshot
     * @param {GameSnapshot} s2 - Second snapshot
     * @returns {boolean}
     */
    snapshotEquals(s1, s2) {
        return this.mazeEquals(s1.maze, s2.maze) &&
               this.pelletGridEquals(s1.pelletGrid, s2.pelletGrid);
    }

    // === Event Handlers ===

    onPelletEaten() {
        this.soundManager.playSound('pellet');
    }

    onPowerPelletEaten() {
        this.soundManager.playSound('powerPellet');
    }

    onGhostEaten(data) {
        this.soundManager.playSound('ghostEaten');
        this.effectManager.createGhostEatenEffect(data.x, data.y);
    }

    onPowerUpCollected(data) {
        const visual = this.powerUpVisualManager.getPowerUpVisual(data.type, data.gridX, data.gridY);
        if (visual) {
            this.powerUpVisualManager.showPowerUpCollectionEffect(data.type, visual);
        }
    }

    // === Death Animation ===

    startDeathAnimation() {
        this.isDeathAnimating = true;
        this.soundManager.playSound('death');
        // Death animation logic handled by entity renderer
    }

    updateDeathAnimation() {
        if (this.isDeathAnimating) {
            const playerRenderer = this.entityRendererManager.getPlayerRenderer();
            if (playerRenderer) {
                playerRenderer.updateDeathAnimation();
            }
        }
    }

    endDeathAnimation() {
        this.isDeathAnimating = false;
        const playerRenderer = this.entityRendererManager.getPlayerRenderer();
        if (playerRenderer) {
            playerRenderer.resetAfterDeath();
        }
    }

    // === Audio ===

    resumeAudio() {
        this.soundManager.resume();
    }

    // === Cleanup ===

    cleanup() {
        // Unsubscribe from events
        this.unsubscribers.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.unsubscribers = [];

        // Cleanup renderer managers
        this.mazeRenderer.cleanup();
        this.pelletRenderer.cleanup();
        this.entityRendererManager.cleanup();
        this.bossVisualManager.cleanup();
        this.powerUpVisualManager.cleanup();
        this.narrativeManager.cleanup();

        // Cleanup managers
        this.soundManager.cleanup();
        this.effectManager.cleanup();
    }

    // === Getters for Testing ===

    getMazeRenderer() {
        return this.mazeRenderer;
    }

    getPelletRenderer() {
        return this.pelletRenderer;
    }

    getEntityRendererManager() {
        return this.entityRendererManager;
    }

    getBossVisualManager() {
        return this.bossVisualManager;
    }

    getPowerUpVisualManager() {
        return this.powerUpVisualManager;
    }

    getNarrativeManager() {
        return this.narrativeManager;
    }

    getSoundManager() {
        return this.soundManager;
    }

    getEffectManager() {
        return this.effectManager;
    }

    getLastSnapshot() {
        return this.lastSnapshot;
    }

    getFrameCount() {
        return this.frameCount;
    }
}

// Export ViewManager as both default and named export for compatibility
export { ViewManager };;
