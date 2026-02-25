/**
 * ModelDrivenGameView
 * Pure observer View that renders Model state using snapshots.
 *
 * Phase 1: Snapshot-based rendering
 * - Receives ViewContext instead of direct gameModel reference
 * - Uses updateFromSnapshot(snapshot) for state synchronization
 * - No direct access to gameModel properties
 *
 * Key characteristics:
 * - Creates VisualPlayer/VisualEnemy/VisualFruit from model entities
 * - Does NOT create Player/Enemy/Fruit visual entities
 * - Syncs visual representation to snapshot state each frame
 * - Responds to model events for effects and sounds
 */

import { colors, gameConfig } from '../config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';
import { ViewContext, ViewState, GameSnapshot } from './ViewInterface.js';
import { SceneTransitionHandler } from './SceneTransitionHandler.js';
import { VIEW_EVENTS } from './ViewEvents.js';
import { SoundManager } from '../managers/SoundManager.js';
import { PelletPool } from '../pools/PelletPool.js';
import { PowerPelletPool } from '../pools/PowerPelletPool.js';
import { EffectManager } from '../scenes/systems/EffectManager.js';
import { gridToPixel, pixelToGrid, PELLET_TYPES, TILE_TYPES } from '../utils/MazeLayout.js';
import { GhostRenderer } from '../view/components/GhostRenderer.js';
import { FruitRenderer } from '../view/components/FruitRenderer.js';
import { PlayerRenderer } from '../view/components/PlayerRenderer.js';

export default class ModelDrivenGameView {
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
            console.warn('[DEPRECATED] ModelDrivenGameView constructor with { scene, gameModel, storageManager } is deprecated. Use ViewContext instead.');
            this.scene = contextOrConfig.scene;
            this.gameModel = contextOrConfig.gameModel;
            this.storageManager = contextOrConfig.storageManager;
            this.context = null;
            this.eventBus = gameEvents; // Use global event bus for legacy mode
            this.useSnapshotMode = false;
        }

        // Internal view state (managed by View)
        this.viewState = new ViewState();

        // Scene Transition Handler (Phase 2)
        this.transitionHandler = new SceneTransitionHandler({
            eventBus: this.eventBus
        });

        // Latest snapshot (for snapshot-based rendering)
        this.lastSnapshot = null;
        this.frameCount = 0;

        // Renderers for model entities
        this.playerRenderer = null;
        this.ghostRenderers = new Map(); // ghostType -> GhostRenderer
        this.fruitRenderer = null;

        // Phase 4: Minimal visual tracking (NOT state duplication)
        // Only track visuals for update/destroy - decisions based on snapshot
        this.bossVisual = null; // Single boss visual (no Map)
        this.powerUpVisuals = new Map(); // Minimal tracking for cleanup only

        // Story overlay for narrative display
        this.storyOverlay = null;
        this.storyText = null;
        this.storyDescription = null;

        // Managers
        this.soundManager = new SoundManager(this.scene);
        this.effectManager = new EffectManager(this.scene);

        // Pellet pools
        this.pelletPool = null;
        this.powerPelletPool = null;

        // Phase 4: No pellet state tracking - pools maintain their own gridIndex

        // Event unsubscribers
        this.unsubscribers = [];

        // Death animation state
        this.isDeathAnimating = false;
    }

    /**
	 * Apply settings
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
        this.createBackground();
        this.createMaze();
        this.createPelletPools();
        this.createPellets();
        this.createEntityRenderers();
        this.bindModelEvents();
    }

    /**
	 * Create background
	 */
    createBackground() {
        // Solid background
        this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            colors.background
        );

        // Digital grid pattern
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.lineStyle(1, 0x002200, 0.3);

        for (let x = 0; x <= this.scene.scale.width; x += gameConfig.tileSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.scene.scale.height);
        }

        for (let y = 0; y <= this.scene.scale.height; y += gameConfig.tileSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.scene.scale.width, y);
        }

        graphics.strokePath();
        graphics.generateTexture(
            'backgroundGrid',
            this.scene.scale.width,
            this.scene.scale.height
        );
        graphics.destroy();

        this.scene.add.image(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'backgroundGrid'
        );
    }

    /**
	 * Create maze walls from snapshot or model
	 */
    createMaze(mazeOverride = null) {
        const maze = mazeOverride || (this.lastSnapshot ? this.lastSnapshot.maze : this.gameModel?.maze);
        if (!maze) {
            console.warn('[ModelDrivenGameView] createMaze: No maze data available');
            console.log('[ModelDrivenGameView] this.lastSnapshot:', this.lastSnapshot);
            console.log('[ModelDrivenGameView] this.gameModel:', this.gameModel);
            return;
        }
        console.log('[ModelDrivenGameView] Creating maze with size:', maze.length, 'x', maze[0]?.length);

        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });

        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[y].length; x++) {
                if (maze[y][x] === TILE_TYPES.WALL) {
                    this.drawWallToGraphics(graphics, x, y, maze);
                }
            }
        }

        const mazeWidth = maze[0].length * gameConfig.tileSize;
        const mazeHeight = maze.length * gameConfig.tileSize;
        graphics.generateTexture('mazeWalls', mazeWidth, mazeHeight);
        graphics.destroy();

        this.scene.add.image(mazeWidth / 2, mazeHeight / 2, 'mazeWalls');
    }

    /**
	 * Draw a single wall tile
	 */
    drawWallToGraphics(graphics, x, y) {
        const pixel = gridToPixel(x, y);
        const size = gameConfig.tileSize;
        const half = size / 2;
        const quarter = size / 4;
        const center = { x: pixel.x + half, y: pixel.y + half };

        graphics.fillStyle(colors.wallShadow, 1);
        graphics.fillRect(pixel.x + 1, pixel.y + 1, size, size);

        graphics.fillStyle(colors.wall, 1);
        graphics.fillRect(pixel.x + 1, pixel.y + 1, size - 2, size - 2);

        const hasLeft = this.isWallAt(x - 1, y);
        const hasRight = this.isWallAt(x + 1, y);
        const hasUp = this.isWallAt(x, y - 1);
        const hasDown = this.isWallAt(x, y + 1);

        graphics.lineStyle(3, 0x00ffaa, 0.6);

        if (hasLeft) {
            graphics.moveTo(pixel.x, center.y);
            graphics.lineTo(center.x, center.y);
        }
        if (hasRight) {
            graphics.moveTo(center.x, center.y);
            graphics.lineTo(pixel.x + size, center.y);
        }
        if (hasUp) {
            graphics.moveTo(center.x, pixel.y);
            graphics.lineTo(center.x, center.y);
        }
        if (hasDown) {
            graphics.moveTo(center.x, center.y);
            graphics.lineTo(center.x, pixel.y + size);
        }
        graphics.strokePath();

        graphics.fillStyle(0x00ffaa, 0.8);
        graphics.fillCircle(center.x, center.y, quarter);

        graphics.lineStyle(1, 0x00ff88, 0.3);
        graphics.strokeRect(pixel.x + 2, pixel.y + 2, size - 4, size - 4);

        graphics.fillStyle(0x00ffaa, 0.4);
        graphics.fillRect(pixel.x + 2, pixel.y + 2, quarter, quarter);
        graphics.fillRect(
            pixel.x + size - quarter - 2,
            pixel.y + 2,
            quarter,
            quarter
        );
        graphics.fillRect(
            pixel.x + 2,
            pixel.y + size - quarter - 2,
            quarter,
            quarter
        );
        graphics.fillRect(
            pixel.x + size - quarter - 2,
            pixel.y + size - quarter - 2,
            quarter,
            quarter
        );
    }

    isWallAt(gridX, gridY, mazeOverride = null) {
        const maze = mazeOverride || (this.lastSnapshot ? this.lastSnapshot.maze : this.gameModel?.maze);
        if (
            !maze ||
			gridY < 0 ||
			gridY >= maze.length ||
			gridX < 0 ||
			gridX >= maze[0].length
        ) {
            return false;
        }
        return maze[gridY][gridX] === TILE_TYPES.WALL;
    }

    /**
	 * Create pellet pools
	 */
    createPelletPools() {
        this.pelletPool = new PelletPool(this.scene);
        this.powerPelletPool = new PowerPelletPool(this.scene);
        this.pelletPool.init();
        this.powerPelletPool.init(4);
    }

    /**
	 * Create pellets from snapshot's pellet grid
	 * Phase 4: Render directly from snapshot, no local state tracking
	 */
    createPellets(pelletGridOverride = null) {
        const pelletGrid = pelletGridOverride || (this.lastSnapshot ? this.lastSnapshot.pelletGrid : this.gameModel?.pelletGrid);
        if (!pelletGrid) {
            return;
        }

        for (let y = 0; y < pelletGrid.length; y++) {
            for (let x = 0; x < pelletGrid[y].length; x++) {
                const pelletType = pelletGrid[y][x];

                if (pelletType === PELLET_TYPES.PELLET) {
                    this.pelletPool.get(x, y);
                } else if (pelletType === PELLET_TYPES.POWER_PELLET) {
                    const powerPellet = this.powerPelletPool.get(x, y);
                    // Add pulse animation
                    this.scene.tweens.add({
                        targets: powerPellet,
                        scale: { from: 1, to: 1.5 },
                        alpha: { from: 1, to: 0.7 },
                        duration: 500,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
        }
    }

    /**
	 * Create renderers for model entities
	 * Note: In snapshot mode, renderers are created on first sync() call when snapshot is available
	 */
    createEntityRenderers() {
        // In snapshot mode (ViewContext), skip renderer creation here
        // Renderers will be created on first sync() call when snapshot is available
        if (this.useSnapshotMode) {
            return;
        }

        // Legacy mode: Get entity data from model
        const pacmanData = this.gameModel?.pacman;
        const ghostsData = this.gameModel?.ghosts;
        const fruitData = this.gameModel?.fruit;

        if (!pacmanData || !ghostsData || !fruitData) {
            console.warn('[ModelDrivenGameView] Cannot create entity renderers - missing data');
            return;
        }

        // Create PlayerRenderer from model data
        this.playerRenderer = new PlayerRenderer(this.scene, pacmanData);

        // Create GhostRenderer for each ghost from model data
        for (const ghostData of ghostsData) {
            const ghostRenderer = new GhostRenderer(this.scene, ghostData);
            this.ghostRenderers.set(ghostData.ghostType, ghostRenderer);
        }

        // Create FruitRenderer from model data
        this.fruitRenderer = new FruitRenderer(this.scene, fruitData);
    }

    /**
	 * Bind to model events
	 * Phase 3: Subscribes to VIEW_EVENTS for rendering-specific updates
	 * - VIEW_EVENTS: Rendering-specific (pellet eaten, ghost eaten, effects, etc.)
	 * - GAME_EVENTS: Game-flow specific (level complete, game over, etc.)
	 */
    bindModelEvents() {
        this.unsubscribers.push(
            // === VIEW_EVENTS: Rendering-specific ===

            // Pellet eaten - play sound and remove visual pellet
            gameEvents.on(VIEW_EVENTS.PELLET_EATEN, (data) => {
                if (data.type === 'power_pellet') {
                    this.soundManager.playPowerPellet();
                    const pixel = gridToPixel(data.gridX, data.gridY);
                    this.effectManager.createPowerPelletEffect(pixel.x, pixel.y);
                } else {
                    this.soundManager.playWakaWaka();
                }

                // Phase 4: Release pellet from pool (pools maintain their own gridIndex)
                let pellet;
                if (data.type === 'power_pellet') {
                    pellet = this.powerPelletPool.getByGrid(data.gridX, data.gridY);
                    if (pellet) {
                        this.powerPelletPool.release(pellet);
                    }
                } else {
                    pellet = this.pelletPool.getByGrid(data.gridX, data.gridY);
                    if (pellet) {
                        this.pelletPool.release(pellet);
                    }
                }
            }),

            // Ghost eaten - play sound and create effect
            gameEvents.on(VIEW_EVENTS.GHOST_EATEN, (data) => {
                this.soundManager.playGhostEaten();
                // Use snapshot data instead of direct model access
                const ghost = this.lastSnapshot?.getGhost?.(data.ghostType) ||
                              this.lastSnapshot?.ghosts?.find((g) => g.ghostType === data.ghostType) ||
                              this.gameModel?.ghosts?.find((g) => g.ghostType === data.ghostType);
                if (ghost) {
                    this.effectManager.createGhostEatenEffect(ghost.x, ghost.y);
                }
            }),

            // Pacman death started - play sound
            gameEvents.on(VIEW_EVENTS.PACMAN_DEATH_STARTED, () => {
                this.soundManager.playDeath();
                this.startDeathAnimation();
            }),

            // Fruit eaten - play sound and create effect
            gameEvents.on(VIEW_EVENTS.FRUIT_EATEN, (data) => {
                this.soundManager.playFruitEat();
                // Use snapshot data instead of direct model access
                const fruit = this.lastSnapshot?.fruit || this.gameModel?.fruit;
                const color = fruit?.fruitType?.color || 0xff00ff;
                if (fruit) {
                    this.effectManager.createFruitEatEffect(fruit.x, fruit.y, color);
                }
                if (this.fruitRenderer) {
                    this.fruitRenderer.showScore?.(data.score);
                }
            }),

            // Screen flash effect
            gameEvents.on(VIEW_EVENTS.SCREEN_FLASH, (data) => {
                try {
                    this.effectManager?.createScreenFlash?.(data.color, data.duration);
                } catch (e) {
                    console.warn('[ModelDrivenGameView] Screen flash not available:', e.message);
                }
            }),

            // Screen shake effect
            gameEvents.on(VIEW_EVENTS.SCREEN_SHAKE, (data) => {
                try {
                    this.effectManager?.createScreenShake?.(data.intensity, data.duration);
                } catch (e) {
                    console.warn('[ModelDrivenGameView] Screen shake not available:', e.message);
                }
            }),

            // Entity moved - can be used for smooth interpolation
            gameEvents.on(VIEW_EVENTS.ENTITY_MOVED, (data) => {
                // Optional: Use for smooth movement interpolation
                // Currently handled by snapshot-based rendering
            }),

            // Pacman direction changed
            // Note: Direction is already handled in PlayerRenderer.sync() via rotation
            // This event can be used for additional direction-specific effects if needed
            gameEvents.on(VIEW_EVENTS.PACMAN_DIRECTION_CHANGED, (_data) => {
                // Direction animation is handled automatically in sync()
            }),

            // Ghost mode changed
            gameEvents.on(VIEW_EVENTS.GHOST_MODE_CHANGED, (data) => {
                const ghostRenderer = this.ghostRenderers.get(data.ghostType);
                if (ghostRenderer) {
                    ghostRenderer.updateModeAnimation(data.newMode, data.isFrightened);
                }
            }),

            // === GAME_EVENTS: Game-flow specific ===

            // Level complete - play sound and transition
            gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, () => {
                this.soundManager.playLevelComplete();
                // Use snapshot data instead of direct model access
                const score = this.lastSnapshot?.score ?? this.gameModel?.score ?? 0;
                const level = this.lastSnapshot?.level ?? this.gameModel?.level ?? 1;
                const highScore = this.lastSnapshot?.highScore ?? this.gameModel?.highScore ?? 0;

                // Save high score (use current score, not stored highScore)
                this.storageManager.saveHighScore(score);

                // Phase 2: Use SceneTransitionHandler instead of direct scene.start()
                this.transitionHandler.requestSceneTransition('WinScene', {
                    score,
                    level,
                    highScore
                });
            }),

            // Game over - transition to game over scene
            gameEvents.on(GAME_EVENTS.GAME_OVER, () => {
                // Use snapshot data instead of direct model access
                const score = this.lastSnapshot?.score ?? this.gameModel?.score ?? 0;
                const highScore = this.lastSnapshot?.highScore ?? this.gameModel?.highScore ?? 0;

                // Save high score (use current score, not stored highScore)
                this.storageManager.saveHighScore(score);

                // Phase 2: Use SceneTransitionHandler instead of direct scene.start()
                this.transitionHandler.requestSceneTransition('GameOverScene', {
                    score,
                    highScore
                });
            }),

            // Respawn - end death animation
            gameEvents.on(GAME_EVENTS.RESPAWN, () => {
                this.isDeathAnimating = false;
                this.endDeathAnimation();
            })
        );

        // Phase 7: Bind to controller action events (scene transitions are View concerns)
        this.bindControllerEvents();

        // Phase 5: Bind to Phase 5 system events
        this.bindPhase5Events();
    }

    /**
	 * Bind to controller action events (Phase 7)
	 * Scene transitions are handled by SceneTransitionHandler, triggered by controller events
	 */
    bindControllerEvents() {
        this.unsubscribers.push(
            // Pause requested - launch pause scene
            gameEvents.on(GAME_EVENTS.PAUSE_REQUESTED, () => {
                this.scene.scene.pause();
                this.scene.scene.launch('PauseScene');
            }),

            // Resume requested - resume from pause
            gameEvents.on(GAME_EVENTS.RESUME_REQUESTED, () => {
                this.scene.scene.resume();
                this.scene.scene.stop('PauseScene');
            }),

            // Return to menu requested (Phase 2: Use SceneTransitionHandler)
            gameEvents.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
                this.scene.cleanup();
                this.transitionHandler.requestSceneTransition('MenuScene');
            }),

            // Restart level requested (Phase 2: Use SceneTransitionHandler)
            gameEvents.on(GAME_EVENTS.RESTART_LEVEL_REQUESTED, () => {
                // Note: scene.restart() is handled directly in GameScene
                // This event just notifies the view that a restart is happening
                // GameScene will handle the actual scene.restart() call
            }),

            // Replay toggle requested
            gameEvents.on(GAME_EVENTS.REPLAY_TOGGLE_REQUESTED, (data) => {
                const replaySystem = data?.replaySystem;
                if (replaySystem) {
                    if (replaySystem.isRecording) {
                        replaySystem.stopRecording();
                    } else if (!replaySystem.isReplaying) {
                        replaySystem.startRecording();
                    }
                }
            }),

            // Load replay requested
            gameEvents.on(GAME_EVENTS.LOAD_REPLAY_REQUESTED, (data) => {
                const replaySystem = data?.replaySystem;
                if (replaySystem && !replaySystem.isReplaying) {
                    const recordings = replaySystem.getRecordings();
                    if (recordings.length > 0) {
                        const lastRecording = recordings[recordings.length - 1];
                        replaySystem.loadRecording(lastRecording);
                    }
                }
            })
        );
    }

    /**
	 * Bind to Phase 5 system events
	 * Phase 3: Uses VIEW_EVENTS for rendering-specific updates
	 */
    bindPhase5Events() {
        this.unsubscribers.push(
            // === VIEW_EVENTS: Rendering-specific ===

            // Boss spawned
            gameEvents.on(VIEW_EVENTS.BOSS_SPAWNED, (data) => {
                this.createBossVisual(data.bossType);
                this.showBossWarning(data.bossType);
            }),

            // Boss phase changed
            gameEvents.on(VIEW_EVENTS.BOSS_PHASE_CHANGED, (data) => {
                this.updateBossVisualPhase(data.bossType, data.phase);
            }),

            // Boss damaged
            gameEvents.on(VIEW_EVENTS.BOSS_DAMAGED, (data) => {
                this.flashBossVisual(data.bossType);
            }),

            // Boss defeated
            gameEvents.on(VIEW_EVENTS.BOSS_DEFEATED, (data) => {
                this.removeBossVisual();
                this.effectManager.createExplosionEffect(
                    this.scene.scale.width / 2,
                    this.scene.scale.height / 2,
                    0xff0000
                );
                this.showBossDefeatMessage(data.scoreBonus);
            }),

            // Boss health update
            gameEvents.on(VIEW_EVENTS.BOSS_HEALTH_UPDATE, (data) => {
                // Phase 4: Boss health is synced from snapshot in syncBossVisuals()
                // This event can trigger additional animations
                if (this.bossVisual) {
                    // Animation feedback for damage/heal
                }
            }),

            // Power up spawned
            gameEvents.on(VIEW_EVENTS.POWERUP_SPAWNED, (data) => {
                this.createPowerUpVisual(data.type, data.x, data.y);
            }),

            // Power up collected
            gameEvents.on(VIEW_EVENTS.POWERUP_COLLECTED, (data) => {
                const powerUpKey = `${data.x},${data.y}`;
                const visual = this.powerUpVisuals.get(powerUpKey);
                if (visual) {
                    this.removePowerUpVisual(visual);
                    this.showPowerUpCollectionEffect(data.type, visual);
                }
            }),

            // Power up expired
            gameEvents.on(VIEW_EVENTS.POWERUP_EXPIRED, (data) => {
                this.playerRenderer.removePowerUpEffect(data.type);
            }),

            // Power up activated
            gameEvents.on(VIEW_EVENTS.POWERUP_ACTIVATED, (data) => {
                this.playerRenderer.addPowerUpEffect(data.type);
            }),

            // Story chapter start
            gameEvents.on(VIEW_EVENTS.STORY_CHAPTER_START, (data) => {
                this.showStoryNarrative(data);
            }),

            // Story chapter complete
            gameEvents.on(VIEW_EVENTS.STORY_CHAPTER_COMPLETE, (data) => {
                this.showChapterCompleteMessage(data);
            }),

            // Story narrative show
            gameEvents.on(VIEW_EVENTS.STORY_NARRATIVE_SHOW, (data) => {
                this.showStoryNarrative(data);
            })
        );
    }

    /**
	 * Phase 1 & 4: Update view from snapshot
	 * Main update method for snapshot-based rendering with Dirty-Tracking
	 * @param {GameSnapshot} snapshot - Immutable game state snapshot
	 */
    updateFromSnapshot(snapshot) {
        if (!snapshot) {
            console.warn('[ModelDrivenGameView] updateFromSnapshot: No snapshot provided');
            return;
        }
        console.log('[ModelDrivenGameView] updateFromSnapshot called with tick:', snapshot.tickCount);

        // Phase 4: Dirty-Tracking - Skip if snapshot hasn't changed
        if (this.lastSnapshot && this.snapshotEquals(this.lastSnapshot, snapshot)) {
            return;
        }

        // Store latest snapshot for reference
        this.lastSnapshot = snapshot;
        this.frameCount++;

        // Update maze if changed (first time or level change)
        if (!this.lastMazeSnapshot || !this.mazeEquals(this.lastMazeSnapshot.maze, snapshot.maze)) {
            this.createMaze(snapshot.maze);
            this.lastMazeSnapshot = { maze: snapshot.maze };
            // Reset pellet pools before creating new ones for new level
            this.pelletPool?.releaseAll();
            this.powerPelletPool?.releaseAll();
            this.createPellets(snapshot.pelletGrid);
        }

        // Phase 4: Update pellets (no local state, direct from snapshot)
        this.updatePelletVisuals(snapshot.pelletGrid);

        // Create renderers on first snapshot if they don't exist
        if (!this.playerRenderer && snapshot.pacman && snapshot.ghosts && snapshot.fruit) {
            this.createRenderersFromSnapshot(snapshot);
        }

        // Update entity renderers with current snapshot data
        // Important: Update the renderer's state reference to use the new snapshot
        if (this.playerRenderer && snapshot.pacman) {
            this.playerRenderer.state = snapshot.pacman;
            this.playerRenderer.sync();
        }

        if (snapshot.ghosts) {
            for (const ghost of snapshot.ghosts) {
                const ghostRenderer = this.ghostRenderers.get(ghost.ghostType);
                if (ghostRenderer) {
                    ghostRenderer.state = ghost;
                    ghostRenderer.sync();
                }
            }
        }

        if (this.fruitRenderer && snapshot.fruit) {
            this.fruitRenderer.state = snapshot.fruit;
            this.fruitRenderer.sync();
        }

        // Phase 4: Update boss visuals from snapshot (single visual, no Map)
        this.syncBossVisuals(snapshot.boss);

        // Phase 4: Update power-up visuals from snapshot (minimal tracking)
        if (snapshot.powerUps) {
            this.syncPowerUpVisuals(snapshot.powerUps);
        }

        // Handle game state changes
        if (snapshot.isDying && !this.isDeathAnimating) {
            this.startDeathAnimation();
        } else if (!snapshot.isDying && this.isDeathAnimating) {
            this.endDeathAnimation();
        }
    }

    /**
	 * Compare two mazes for equality
	 */
    mazeEquals(maze1, maze2) {
        if (!maze1 || !maze2) {
            return maze1 === maze2;
        }
        if (maze1.length !== maze2.length) {
            return false;
        }
        for (let i = 0; i < maze1.length; i++) {
            if (maze1[i].length !== maze2[i].length) {
                return false;
            }
            for (let j = 0; j < maze1[i].length; j++) {
                if (maze1[i][j] !== maze2[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
	 * Phase 4: Compare two pellet grids for equality
	 */
    pelletGridEquals(grid1, grid2) {
        if (!grid1 || !grid2) {
            return grid1 === grid2;
        }
        if (grid1.length !== grid2.length) {
            return false;
        }
        for (let i = 0; i < grid1.length; i++) {
            if (grid1[i].length !== grid2[i].length) {
                return false;
            }
            for (let j = 0; j < grid1[i].length; j++) {
                if (grid1[i][j] !== grid2[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
	 * Phase 4: Compare two snapshots for equality (Deep comparison)
	 * Returns true if snapshots are functionally equivalent for rendering
	 */
    snapshotEquals(s1, s2) {
        if (!s1 || !s2) {
            return s1 === s2;
        }

        // Quick tick count check
        if (s1.tickCount !== s2.tickCount) {
            return false;
        }

        // Compare critical rendering data
        if (s1.score !== s2.score ||
            s1.lives !== s2.lives ||
            s1.level !== s2.level ||
            s1.isDying !== s2.isDying) {
            return false;
        }

        // Compare maze (expensive but necessary)
        if (!this.mazeEquals(s1.maze, s2.maze)) {
            return false;
        }

        // Compare pellet grid (expensive but necessary)
        if (!this.pelletGridEquals(s1.pelletGrid, s2.pelletGrid)) {
            return false;
        }

        // Compare entities (pacman position, ghosts, fruit)
        if (s1.pacman && s2.pacman) {
            if (s1.pacman.x !== s2.pacman.x ||
                s1.pacman.y !== s2.pacman.y ||
                s1.pacman.direction !== s2.pacman.direction) {
                return false;
            }
        } else if (s1.pacman !== s2.pacman) {
            return false;
        }

        // Compare boss state
        if (s1.boss && s2.boss) {
            if (s1.boss.type !== s2.boss.type ||
                s1.boss.x !== s2.boss.x ||
                s1.boss.y !== s2.boss.y ||
                s1.boss.health !== s2.boss.health) {
                return false;
            }
        } else if (s1.boss !== s2.boss) {
            return false;
        }

        return true;
    }

    /**
	 * Update pellet visuals based on snapshot
	 * Phase 4: Render directly from snapshot, no local state tracking
	 * Uses pools' gridIndex for efficient lookup
	 */
    updatePelletVisuals(pelletGrid) {
        if (!pelletGrid) {
            return;
        }

        // Phase 4: Remove pellets that are no longer in the grid
        // Iterate through pool's active pellets and check against snapshot
        const pelletsToRemove = [];

        // Check regular pellets
        for (const pellet of [...this.pelletPool.active]) {
            const gridX = Math.floor(pellet.x / gameConfig.tileSize);
            const gridY = Math.floor(pellet.y / gameConfig.tileSize);

            if (gridY < 0 || gridY >= pelletGrid.length ||
                gridX < 0 || gridX >= pelletGrid[0].length ||
                pelletGrid[gridY][gridX] !== PELLET_TYPES.PELLET) {
                pelletsToRemove.push({ pellet, pool: this.pelletPool });
            }
        }

        // Check power pellets
        for (const pellet of [...this.powerPelletPool.active]) {
            const gridX = Math.floor(pellet.x / gameConfig.tileSize);
            const gridY = Math.floor(pellet.y / gameConfig.tileSize);

            if (gridY < 0 || gridY >= pelletGrid.length ||
                gridX < 0 || gridX >= pelletGrid[0].length ||
                pelletGrid[gridY][gridX] !== PELLET_TYPES.POWER_PELLET) {
                pelletsToRemove.push({ pellet, pool: this.powerPelletPool });
            }
        }

        // Remove outdated pellets
        for (const { pellet, pool } of pelletsToRemove) {
            pool.release(pellet);
        }

        // Phase 4: Add new pellets from snapshot
        for (let y = 0; y < pelletGrid.length; y++) {
            for (let x = 0; x < pelletGrid[y].length; x++) {
                const pelletType = pelletGrid[y][x];

                if (pelletType === PELLET_TYPES.PELLET) {
                    // Check if pellet already exists in pool
                    if (!this.pelletPool.getByGrid(x, y)) {
                        this.pelletPool.get(x, y);
                    }
                } else if (pelletType === PELLET_TYPES.POWER_PELLET) {
                    // Check if power pellet already exists in pool
                    if (!this.powerPelletPool.getByGrid(x, y)) {
                        const powerPellet = this.powerPelletPool.get(x, y);
                        // Add pulse animation for new power pellets
                        this.scene.tweens.add({
                            targets: powerPellet,
                            scale: { from: 1, to: 1.5 },
                            alpha: { from: 1, to: 0.7 },
                            duration: 500,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    }
                }
            }
        }
    }

    /**
	 * Sync all renderers to model state
	 * Called each frame in the update loop
	 * In snapshot mode, creates renderers on first call if they don't exist
	 * @deprecated Use updateFromSnapshot(snapshot) instead for Phase 1 & 4
	 */
    sync() {
        // In snapshot mode: Create renderers on first sync if they don't exist
        if (this.useSnapshotMode && this.lastSnapshot && !this.playerRenderer) {
            this.createRenderersFromSnapshot(this.lastSnapshot);
        }

        if (!this.playerRenderer || this.isDeathAnimating) {
            return;
        }

        this.playerRenderer.sync();

        for (const ghostRenderer of this.ghostRenderers.values()) {
            ghostRenderer.sync();
        }

        this.fruitRenderer.sync();

        // Phase 4: Sync boss and power-ups from last snapshot
        if (this.lastSnapshot) {
            this.syncBossVisuals(this.lastSnapshot.boss);
            this.syncPowerUpVisuals(this.lastSnapshot.powerUps);
        }
    }

    /**
	 * Create renderers from snapshot (called on first sync in snapshot mode)
	 * @param {GameSnapshot} snapshot - Game state snapshot
	 */
    createRenderersFromSnapshot(snapshot) {
        if (!snapshot.pacman || !snapshot.ghosts || !snapshot.fruit) {
            console.warn('[ModelDrivenGameView] Cannot create renderers from snapshot - missing data');
            return;
        }

        // Create PlayerRenderer from snapshot data
        this.playerRenderer = new PlayerRenderer(this.scene, snapshot.pacman);

        // Create GhostRenderer for each ghost from snapshot data
        for (const ghostData of snapshot.ghosts) {
            const ghostRenderer = new GhostRenderer(this.scene, ghostData);
            this.ghostRenderers.set(ghostData.ghostType, ghostRenderer);
        }

        // Create FruitRenderer from snapshot data
        this.fruitRenderer = new FruitRenderer(this.scene, snapshot.fruit);
    }

    /**
	 * Sync boss visual from snapshot
	 * Phase 4: Update single boss visual from snapshot (no Map state duplication)
	 */
    syncBossVisuals(bossSnapshot = null) {
        const boss = bossSnapshot || (this.lastSnapshot?.boss);

        if (!boss) {
            // Remove boss visual if boss no longer exists
            if (this.bossVisual) {
                this.removeBossVisual();
            }
            return;
        }

        // Phase 4: Create boss visual if it doesn't exist
        if (!this.bossVisual) {
            this.createBossVisual(boss.type);
        }

        // Update existing boss visual from snapshot
        if (this.bossVisual) {
            this.bossVisual.sprite.x = boss.x;
            this.bossVisual.sprite.y = boss.y;

            const barWidth = gameConfig.tileSize * 2;
            const healthPercent = boss.healthPercent || 1;
            this.bossVisual.healthBar.fill.width = barWidth * healthPercent;
            this.bossVisual.healthBar.fill.x = boss.x - barWidth / 2;

            const healthColor =
                healthPercent > 0.5
                    ? 0x00ff00
                    : healthPercent > 0.25
                        ? 0xffff00
                        : 0xff0000;
            this.bossVisual.healthBar.fill.setFillStyle(healthColor);
        }
    }

    /**
	 * Sync power-up visuals from snapshot
	 * Phase 4: Update power-up visuals based on snapshot (minimal state tracking)
	 */
    syncPowerUpVisuals(powerUpsSnapshot = null) {
        const powerUps = powerUpsSnapshot || (this.lastSnapshot?.powerUps);

        if (!powerUps) {
            return;
        }

        // Phase 4: Handle both object format {spawnedPowerUps, activePowerUps} and array format
        const spawnedPowerUps = Array.isArray(powerUps) ? powerUps : (powerUps.spawnedPowerUps || []);

        if (!spawnedPowerUps.length) {
            // Remove all existing power-up visuals if none are spawned
            for (const [key, visual] of this.powerUpVisuals) {
                this.removePowerUpVisual(visual);
            }
            return;
        }

        // Phase 4: Build set of current power-up keys from snapshot
        // Note: power-ups use x,y (pixel coordinates) not gridX,gridY
        const currentKeys = new Set(spawnedPowerUps.map(pu => `${pu.type}_${pu.x}_${pu.y}`));

        // Phase 4: Remove power-ups that are no longer in the snapshot
        for (const [key, visual] of this.powerUpVisuals) {
            if (!currentKeys.has(key)) {
                this.removePowerUpVisual(visual);
            }
        }

        // Phase 4: Update or create power-ups from snapshot
        for (const powerUp of spawnedPowerUps) {
            const key = `${powerUp.type}_${powerUp.x}_${powerUp.y}`;
            let visual = this.powerUpVisuals.get(key);

            if (visual) {
                // Update existing visual - powerUps have pixel coordinates x,y
                visual.sprite.x = powerUp.x + gameConfig.tileSize * 0.35;
                visual.sprite.y = powerUp.y + gameConfig.tileSize * 0.35;
                visual.text.x = powerUp.x + gameConfig.tileSize * 0.35;
                visual.text.y = powerUp.y + gameConfig.tileSize * 0.35;
            } else {
                // Create new visual from snapshot - convert pixel to grid coordinates
                const gridPos = pixelToGrid(powerUp.x, powerUp.y);
                this.createPowerUpVisual(powerUp.type, gridPos.x, gridPos.y);
            }
        }
    }

    /**
	 * Start death animation
	 */
    startDeathAnimation() {
        this.isDeathAnimating = true;
    }

    /**
	 * Update death animation
	 */
    updateDeathAnimation() {
        if (this.playerRenderer) {
            this.playerRenderer.sync();
        }
    }

    /**
	 * End death animation
	 */
    endDeathAnimation() {
        this.isDeathAnimating = false;
    }

    /**
	 * Show achievement notification
	 */
    showAchievementNotification(achievement) {
        // Simplified - just log for now, can be enhanced later
        console.log(`Achievement unlocked: ${achievement.name}`);
    }

    /**
	 * Resume audio
	 */
    resumeAudio() {
        this.soundManager.resume();
    }

    /**
	 * Create boss visual
	 * Phase 4: Create single boss visual (no Map, minimal state)
	 */
    createBossVisual(bossType) {
        // Phase 4: Use snapshot data instead of direct model access
        const boss = this.lastSnapshot?.boss ||
                     (this.gameModel?.getBossEntity ? this.gameModel.getBossEntity() : null);

        if (!boss || this.bossVisual) {
            return;
        }

        const radius = gameConfig.tileSize * 0.6;

        this.bossVisual = {
            sprite: this.createBossSprite(bossType, boss.x, boss.y, radius),
            healthBar: this.createBossHealthBar(boss, radius),
            phaseIndicator: this.createPhaseIndicator(boss.x, boss.y, radius),
            bossType
        };

        this.updateBossVisualPhase(bossType, boss.phase);
    }

    createBossSprite(bossType, x, y, radius) {
        const { bossConfig } = this.getBossColors(bossType);
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });

        graphics.lineStyle(4, bossConfig.color, 1);

        const sides =
			bossType === 'alpha'
			    ? 4
			    : bossType === 'beta'
			        ? 3
			        : bossType === 'gamma'
			            ? 5
			            : 6;

        for (let i = 0; i <= sides; i++) {
            const angle = ((i * 360) / sides - 90) * (Math.PI / 180);
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);

            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }

        graphics.strokePath();
        graphics.generateTexture(`boss-${bossType}`, radius * 3, radius * 3);
        graphics.destroy();

        return this.scene.add.image(x, y, `boss-${bossType}`).setDepth(105);
    }

    createBossHealthBar(boss, radius) {
        const barWidth = gameConfig.tileSize * 2;
        const barHeight = 8;

        const background = this.scene.add
            .rectangle(boss.x, boss.y - radius - 20, barWidth, barHeight, 0x333333, 1)
            .setDepth(110);

        // Phase 4: Use snapshot data instead of direct model access
        // Get max health from snapshot (new mode) or gameModel (legacy mode)
        const bossSnapshot = this.lastSnapshot?.boss;
        const maxHealth = bossSnapshot?.bossMaxHealth ||
                         this.gameModel?.getBossMaxHealth() ||
                         100; // fallback
        const health = boss.health || bossSnapshot?.bossHealth || 0;

        const fill = this.scene.add
            .rectangle(
                boss.x - barWidth / 2,
                boss.y - radius - 20,
                barWidth * (health / maxHealth),
                barHeight,
                0x00ff00,
                1
            )
            .setDepth(111)
            .setOrigin(0, 0.5);

        return { background, fill };
    }

    createPhaseIndicator(x, y, radius) {
        const text = this.scene.add
            .text(x, y + radius + 15, 'PHASE 1', {
                fontSize: '12px',
                color: '#00ffaa',
                fontStyle: 'bold'
            })
            .setOrigin(0.5)
            .setDepth(111);

        return text;
    }

    getBossColors(bossType) {
        const colors = {
            alpha: { color: 0x9900ff, name: 'Alpha Virus' },
            beta: { color: 0x00ff00, name: 'Beta Virus' },
            gamma: { color: 0xff0000, name: 'Gamma Virus' },
            delta: { color: 0xff8800, name: 'Delta Virus' }
        };
        return { bossConfig: colors[bossType] || colors.alpha };
    }

    /**
	 * Update boss visual phase
	 * Phase 4: Update single boss visual
	 */
    updateBossVisualPhase(bossType, phase) {
        if (!this.bossVisual) {
            return;
        }

        this.bossVisual.phaseIndicator.setText(`PHASE ${phase}`);

        const intensity = phase === 1 ? 1 : 1.5;
        this.bossVisual.sprite.setScale(intensity);

        if (phase > 1) {
            this.scene.tweens.add({
                targets: this.bossVisual.sprite,
                scale: intensity + 0.1,
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        }
    }

    /**
	 * Flash boss visual (damage feedback)
	 * Phase 4: Flash single boss visual
	 */
    flashBossVisual(bossType) {
        if (!this.bossVisual) {
            return;
        }

        this.scene.tweens.add({
            targets: this.bossVisual.sprite,
            alpha: 0.3,
            duration: 50,
            yoyo: true,
            repeat: 3
        });
    }

    /**
	 * Remove boss visual
	 * Phase 4: Remove single boss visual (no Map)
	 */
    removeBossVisual() {
        if (!this.bossVisual) {
            return;
        }

        this.bossVisual.sprite.destroy();
        this.bossVisual.healthBar.background.destroy();
        this.bossVisual.healthBar.fill.destroy();
        this.bossVisual.phaseIndicator.destroy();

        this.bossVisual = null;
    }

    showBossWarning(bossType) {
        const { bossConfig } = this.getBossColors(bossType);

        const warning = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 3
        );

        const bg = this.scene.add
            .rectangle(0, 0, 400, 80, 0x000000)
            .setAlpha(0.9)
            .setStrokeStyle(2, bossConfig.color);

        const text = this.scene.add
            .text(0, 0, `⚠ ${bossConfig.name} APPROACHING ⚠`, {
                fontSize: '20px',
                color: `#${bossConfig.color.toString(16).padStart(6, '0')}`,
                fontStyle: 'bold'
            })
            .setOrigin(0.5);

        warning.add([bg, text]);
        warning.setAlpha(0);

        this.scene.tweens.add({
            targets: warning,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: warning,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => warning.destroy()
                    });
                });
            }
        });
    }

    showBossDefeatMessage(scoreBonus) {
        const message = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 3
        );

        const bg = this.scene.add
            .rectangle(0, 0, 400, 100, 0x000000)
            .setAlpha(0.9)
            .setStrokeStyle(3, 0xffd700);

        const title = this.scene.add
            .text(0, -15, 'BOSS DEFEATED!', {
                fontSize: '24px',
                color: '#FFD700',
                fontStyle: 'bold'
            })
            .setOrigin(0.5);

        const bonus = this.scene.add
            .text(0, 20, `+${scoreBonus} BONUS`, {
                fontSize: '18px',
                color: '#FFFFFF'
            })
            .setOrigin(0.5);

        message.add([bg, title, bonus]);
        message.setAlpha(0);

        this.scene.tweens.add({
            targets: message,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: message,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => message.destroy()
                    });
                });
            }
        });
    }

    createPowerUpVisual(type, gridX, gridY) {
        const key = `${type}_${gridX}_${gridY}`;

        if (this.powerUpVisuals.has(key)) {
            return;
        }

        const pixel = gridToPixel(gridX, gridY);
        const radius = gameConfig.tileSize * 0.35;

        const { powerUpConfig } = this.getPowerUpColors(type);

        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(powerUpConfig.color, 1);

        const shape =
			type === 'SHIELD'
			    ? 'circle'
			    : type === 'SPEED_BOOST'
			        ? 'triangle'
			        : 'square';

        if (shape === 'circle') {
            graphics.fillCircle(radius, radius, radius);
        } else if (shape === 'triangle') {
            graphics.beginPath();
            graphics.moveTo(radius, 0);
            graphics.lineTo(0, radius * 2);
            graphics.lineTo(radius * 2, radius * 2);
            graphics.closePath();
            graphics.fillPath();
        } else {
            graphics.fillRect(0, 0, radius * 2, radius * 2);
        }

        graphics.generateTexture(`powerup-${type}`, radius * 2, radius * 2);
        graphics.destroy();

        const sprite = this.scene.add
            .image(pixel.x + radius, pixel.y + radius, `powerup-${type}`)
            .setDepth(99)
            .setScale(0);

        const text = this.scene.add
            .text(pixel.x + radius, pixel.y + radius, powerUpConfig.icon, {
                fontSize: '20px'
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.powerUpVisuals.set(key, { sprite, text, type, gridX, gridY });

        this.scene.tweens.add({
            targets: sprite,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        this.scene.tweens.add({
            targets: sprite,
            y: pixel.y + radius + 3,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: sprite,
            alpha: 0.6,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    getPowerUpColors(type) {
        const configs = {
            SHIELD: { color: 0x00ced1, icon: '⛨', name: 'Shield' },
            SPEED_BOOST: { color: 0xffd700, icon: '⚡', name: 'Speed Boost' },
            DATA_MAGNET: { color: 0x00ff7f, icon: '⧲', name: 'Data Magnet' }
        };
        return { powerUpConfig: configs[type] || configs.SHIELD };
    }

    /**
	 * Remove power-up visual
	 * Phase 4: Clean up power-up visual and remove from tracking Map
	 */
    removePowerUpVisual(visual) {
        if (!visual) {
            return;
        }
        visual.sprite.destroy();
        visual.text.destroy();
        const key = `${visual.type}_${visual.gridX}_${visual.gridY}`;
        this.powerUpVisuals.delete(key);
    }

    showPowerUpCollectionEffect(type, visual) {
        const { powerUpConfig } = this.getPowerUpColors(type);

        this.scene.tweens.add({
            targets: visual.sprite,
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                visual.text.destroy();
            }
        });

        const effect = this.scene.add
            .text(visual.sprite.x, visual.sprite.y - 20, `+${powerUpConfig.name}!`, {
                fontSize: '16px',
                color: `#${powerUpConfig.color.toString(16).padStart(6, '0')}`,
                fontStyle: 'bold'
            })
            .setOrigin(0.5)
            .setDepth(120);

        this.scene.tweens.add({
            targets: effect,
            y: effect.y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => effect.destroy()
        });
    }

    showStoryNarrative(data) {
        if (this.storyOverlay) {
            this.hideStoryNarrative();
        }

        this.storyOverlay = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 4
        );

        const bg = this.scene.add
            .rectangle(0, 0, 500, 120, 0x001a00)
            .setAlpha(0.95)
            .setStrokeStyle(2, 0x00ffaa);

        const title = this.scene.add
            .text(0, -30, data.chapterName, {
                fontSize: '22px',
                color: '#00ffaa',
                fontStyle: 'bold'
            })
            .setOrigin(0.5);

        this.storyDescription = this.scene.add
            .text(0, 10, data.description, {
                fontSize: '14px',
                color: '#00cc88',
                wordWrap: { width: 460 }
            })
            .setOrigin(0.5);

        const hint = data.isBossBattle
            ? this.scene.add
                .text(0, 40, '⚠ BOSS BATTLE AHEAD', {
                    fontSize: '12px',
                    color: '#ff4444',
                    fontStyle: 'bold'
                })
                .setOrigin(0.5)
            : null;

        const elements = [bg, title, this.storyDescription];
        if (hint) {
            elements.push(hint);
        }

        this.storyOverlay.add(elements);
        this.storyOverlay.setAlpha(0);

        this.scene.tweens.add({
            targets: this.storyOverlay,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.time.delayedCall(3000, () => {
                    this.hideStoryNarrative();
                });
            }
        });
    }

    hideStoryNarrative() {
        if (!this.storyOverlay) {
            return;
        }

        this.scene.tweens.add({
            targets: this.storyOverlay,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.storyOverlay.destroy();
                this.storyOverlay = null;
                this.storyDescription = null;
            }
        });
    }

    showChapterCompleteMessage(data) {
        if (this.storyOverlay) {
            this.hideStoryNarrative();
        }

        this.storyOverlay = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 4
        );

        const bg = this.scene.add
            .rectangle(0, 0, 500, 100, 0x002200)
            .setAlpha(0.95)
            .setStrokeStyle(3, 0xffd700);

        const title = this.scene.add
            .text(0, -20, `${data.chapterName} COMPLETE`, {
                fontSize: '20px',
                color: '#FFD700',
                fontStyle: 'bold'
            })
            .setOrigin(0.5);

        const bonus = this.scene.add
            .text(0, 15, `+${data.bonusPoints} CHAPTER BONUS`, {
                fontSize: '18px',
                color: '#FFFFFF'
            })
            .setOrigin(0.5);

        this.storyOverlay.add([bg, title, bonus]);
        this.storyOverlay.setAlpha(0);

        this.scene.tweens.add({
            targets: this.storyOverlay,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.time.delayedCall(2000, () => {
                    this.hideStoryNarrative();
                });
            }
        });
    }

    /**
	 * Cleanup resources
	 */
    cleanup() {
        // Unsubscribe from events
        this.unsubscribers.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.unsubscribers = [];

        // Destroy renderers
        if (this.playerRenderer) {
            this.playerRenderer.destroy();
            this.playerRenderer = null;
        }

        for (const ghostRenderer of this.ghostRenderers.values()) {
            ghostRenderer.destroy();
        }
        this.ghostRenderers.clear();

        if (this.fruitRenderer) {
            this.fruitRenderer.destroy();
            this.fruitRenderer = null;
        }

        // Phase 4: Cleanup single boss visual
        if (this.bossVisual) {
            this.bossVisual.sprite.destroy();
            this.bossVisual.healthBar.background.destroy();
            this.bossVisual.healthBar.fill.destroy();
            this.bossVisual.phaseIndicator.destroy();
            this.bossVisual = null;
        }

        for (const visual of this.powerUpVisuals.values()) {
            visual.sprite.destroy();
            visual.text.destroy();
        }
        this.powerUpVisuals.clear();

        if (this.storyOverlay) {
            this.storyOverlay.destroy();
            this.storyOverlay = null;
        }

        // Destroy pellet pools
        if (this.pelletPool) {
            this.pelletPool.destroy();
        }
        if (this.powerPelletPool) {
            this.powerPelletPool.destroy();
        }
        // Phase 4: No activePellets Map - pools maintain their own gridIndex

        // Disable sound
        this.soundManager.setEnabled(false);
        this.effectManager.cleanup();
    }
}
