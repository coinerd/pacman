/**
 * ModelDrivenGameViewDI
 * DI-adaptierte Version der ModelDrivenGameView
 *
 * Phase 4: Dependency Injection Pattern
 * - Services aus Container injizieren
 * - Kein direkter GameModel-Zugriff (Snapshot-Pfad)
 * - ViewContext für lose Kopplung
 */

import { colors, gameConfig } from '../config/gameConfig.js';
import { GAME_EVENTS } from '../core/EventBus.js';
import { ViewState } from './ViewInterface.js';
import { SceneTransitionHandler } from './SceneTransitionHandler.js';
import { SoundManager } from '../managers/SoundManager.js';
import { EffectManager } from '../scenes/systems/EffectManager.js';
import { TILE_TYPES } from '../utils/MazeLayout.js';
import { GhostRenderer } from '../view/components/GhostRenderer.js';
import { FruitRenderer } from '../view/components/FruitRenderer.js';
import { PlayerRenderer } from '../view/components/PlayerRenderer.js';

// Phase 2: New renderer modules
import { PelletRenderer } from './renderers/PelletRenderer.js';

export default class ModelDrivenGameViewDI {
    /**
     * @param {ViewContext} context - ViewContext mit allen Abhängigkeiten
     */
    constructor(context) {
        // DI: ViewContext mit Services
        this.context = context;
        this.scene = context.scene;
        this.storageManager = context.storageManager;
        this.eventBus = context.eventBus;
        this.gameModel = null; // KEIN direkter GameModel-Zugriff!

        // DI: Services aus Container
        this.useDI = true;
        this.gameState = null; // Wird aus Container geholt wenn benötigt

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

        // View-Renderer werden direkt erstellt (kein DI - View-spezifisch)
        this.soundManager = new SoundManager(this.scene);
        this.effectManager = new EffectManager(this.scene);
        this.pelletRenderer = new PelletRenderer(this.scene);
        this.pelletRenderer.createPelletPools();

        // Phase 4: No pellet state tracking - PelletRenderer handles this

        // Event unsubscribers
        this.unsubscribers = [];

        // Death animation state
        this.isDeathAnimating = false;
    }

    /**
     * DI-Status abrufen
     */
    getDIStats() {
        return {
            usingDI: this.useDI,
            hasGameState: !!this.gameState,
            hasSoundManager: !!this.soundManager,
            hasEffectManager: !!this.effectManager,
            hasPelletRenderer: !!this.pelletRenderer
        };
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
        this.createPellets();
        // createEntityRenderers wird später aufgerufen, wenn Snapshot verfügbar ist
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
	 * Create maze walls from snapshot
	 */
    createMaze(mazeOverride = null) {
        const maze = mazeOverride || (this.lastSnapshot ? this.lastSnapshot.maze : null);
        if (!maze) {
            return;
        }

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

        // Add maze image to scene
        const mazeImage = this.scene.add.image(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'mazeWalls'
        );
        mazeImage.setOrigin(0.5);
    }

    /**
	 * Draw a single wall tile to graphics
	 */
    drawWallToGraphics(graphics, x, y, maze) {
        const size = gameConfig.tileSize;
        const px = x * size;
        const py = y * size;

        // Check neighbors for connected walls
        const hasTop = y > 0 && maze[y - 1][x] === TILE_TYPES.WALL;
        const hasBottom = y < maze.length - 1 && maze[y + 1][x] === TILE_TYPES.WALL;
        const hasLeft = x > 0 && maze[y][x - 1] === TILE_TYPES.WALL;
        const hasRight = x < maze[y].length - 1 && maze[y][x + 1] === TILE_TYPES.WALL;

        const isCorner = !hasTop && !hasBottom && !hasLeft && !hasRight;

        graphics.fillStyle(colors.wall, 1);

        if (isCorner) {
            // Isolated corner block
            graphics.fillRect(px, py, size, size);
        } else {
            // Connected walls - use line segments
            const wallThickness = 4;

            if (hasTop || hasBottom) {
                graphics.fillRect(px + (size - wallThickness) / 2, py, wallThickness, size);
            }
            if (hasLeft || hasRight) {
                graphics.fillRect(px, py + (size - wallThickness) / 2, size, wallThickness);
            }

            // Fill center for intersections
            if ((hasTop && hasBottom) || (hasLeft && hasRight)) {
                graphics.fillRect(px + (size - wallThickness) / 2, py + (size - wallThickness) / 2, wallThickness, wallThickness);
            }
        }
    }

    /**
	 * Create pellets from snapshot
	 */
    createPellets(pelletOverride = null) {
        const pelletGrid = pelletOverride || (this.lastSnapshot ? this.lastSnapshot.pelletGrid : null);
        if (!pelletGrid) {
            return;
        }

        this.pelletRenderer.updatePelletVisuals(pelletGrid);
    }

    /**
	 * Create entity renderers
	 */
    createEntityRenderers() {
        // Player renderer (with null state - will be set via update)
        this.playerRenderer = new PlayerRenderer(this.scene, null);

        // Ghost renderers
        const ghostTypes = ['red', 'pink', 'cyan', 'orange'];
        for (const ghostType of ghostTypes) {
            this.ghostRenderers.set(ghostType, new GhostRenderer(this.scene, ghostType));
        }

        // Fruit renderer
        this.fruitRenderer = new FruitRenderer(this.scene);
    }

    /**
	 * Bind model events
	 */
    bindModelEvents() {
        // Subscribe to game events
        const unsubscribe = this.eventBus.subscribe(GAME_EVENTS.GAME_EVENT, (event) => {
            this.handleGameEvent(event);
        });
        this.unsubscribers.push(unsubscribe);
    }

    /**
	 * Handle game events
	 */
    handleGameEvent(event) {
        if (!event) {return;}

        switch (event.type) {
        case GAME_EVENTS.PELLET_EATEN:
            this.pelletRenderer.eatPellet(event.data.x, event.data.y);
            this.soundManager.playPellet();
            break;

        case GAME_EVENTS.POWER_PELLET_EATEN:
            this.pelletRenderer.eatPellet(event.data.x, event.data.y);
            this.soundManager.playPowerPellet();
            this.effectManager.showPowerUpEffect();
            break;

        case GAME_EVENTS.GHOST_EATEN:
            this.soundManager.playGhostEat();
            this.effectManager.showScoreEffect(event.data.x, event.data.y, event.data.points);
            break;

        case GAME_EVENTS.PACMAN_DIED:
            this.soundManager.playDeath();
            this.startDeathAnimation();
            break;

        case GAME_EVENTS.LEVEL_CLEARED:
            this.soundManager.playLevelClear();
            this.showLevelCompleteOverlay();
            break;

        case GAME_EVENTS.GAME_OVER:
            this.soundManager.playGameOver();
            this.showGameOverOverlay();
            break;
        }
    }

    /**
	 * Update from snapshot (Pure Observer Pattern)
	 */
    updateFromSnapshot(snapshot) {
        if (!snapshot) {
            return;
        }

        this.lastSnapshot = snapshot;
        this.frameCount++;

        // Lazy-initialize entity renderers on first snapshot
        if (!this.playerRenderer && snapshot.pacman) {
            this.createEntityRenderers();
        }

        // Update pellets based on snapshot
        if (snapshot.pelletGrid && this.pelletRenderer) {
            this.pelletRenderer.updatePelletVisuals(snapshot.pelletGrid);
        }

        // Update player - use interpolated pixel position from MovementSystem
        if (snapshot.pacman && this.playerRenderer && snapshot.pacman.x && snapshot.pacman.y) {
            this.playerRenderer.update({
                x: snapshot.pacman.x,
                y: snapshot.pacman.y,
                direction: snapshot.pacman.direction,
                isMoving: snapshot.pacman.isMoving
            });
        }

        // Update ghosts - use interpolated pixel position from MovementSystem
        if (snapshot.ghosts) {
            for (const ghost of snapshot.ghosts) {
                const renderer = this.ghostRenderers.get(ghost.type);
                if (renderer && ghost.x && ghost.y) {
                    renderer.update({
                        x: ghost.x,
                        y: ghost.y,
                        direction: ghost.direction,
                        isFrightened: ghost.isFrightened,
                        isEaten: ghost.isEaten,
                        inHouse: ghost.inHouse
                    });
                }
            }
        }

        // Update fruit - use interpolated pixel position
        if (snapshot.fruit && this.fruitRenderer && snapshot.fruit.x && snapshot.fruit.y) {
            this.fruitRenderer.update({
                x: snapshot.fruit.x,
                y: snapshot.fruit.y,
                type: snapshot.fruit.type,
                visible: snapshot.fruit.visible
            });
        }

        // Update UI elements
        this.updateUI(snapshot);
    }

    /**
	 * Update UI elements
	 */
    updateUI(snapshot) {
        if (this.viewState.score !== snapshot.score) {
            this.viewState.score = snapshot.score;
            this.updateScoreDisplay();
        }

        if (this.viewState.highScore !== snapshot.highScore) {
            this.viewState.highScore = snapshot.highScore;
            this.updateHighScoreDisplay();
        }

        if (this.viewState.level !== snapshot.level) {
            this.viewState.level = snapshot.level;
            this.updateLevelDisplay();
        }

        if (this.viewState.lives !== snapshot.lives) {
            this.viewState.lives = snapshot.lives;
            this.updateLivesDisplay();
        }
    }

    /**
	 * Update score display
	 */
    updateScoreDisplay() {
        // Implementation depends on UI structure
        const scoreText = this.scene.children.getByName('scoreText');
        if (scoreText) {
            scoreText.setText(`SCORE: ${this.viewState.score}`);
        }
    }

    /**
	 * Update high score display
	 */
    updateHighScoreDisplay() {
        const highScoreText = this.scene.children.getByName('highScoreText');
        if (highScoreText) {
            highScoreText.setText(`HIGH SCORE: ${this.viewState.highScore}`);
        }
    }

    /**
	 * Update level display
	 */
    updateLevelDisplay() {
        const levelText = this.scene.children.getByName('levelText');
        if (levelText) {
            levelText.setText(`LEVEL ${this.viewState.level}`);
        }
    }

    /**
	 * Update lives display
	 */
    updateLivesDisplay() {
        const livesContainer = this.scene.children.getByName('livesContainer');
        if (livesContainer) {
            // Remove old lives
            livesContainer.clear(true);

            // Add new lives
            for (let i = 0; i < this.viewState.lives; i++) {
                const life = this.scene.add.circle(
                    20 + i * 25,
                    20,
                    8,
                    colors.pacman
                );
                life.setOrigin(0.5);
                livesContainer.add(life);
            }
        }
    }

    /**
	 * Start death animation
	 */
    startDeathAnimation() {
        this.isDeathAnimating = true;
        // Animation logic handled by PlayerRenderer
        if (this.playerRenderer) {
            this.playerRenderer.playDeathAnimation(() => {
                this.isDeathAnimating = false;
            });
        }
    }

    /**
	 * Show level complete overlay
	 */
    showLevelCompleteOverlay() {
        // Implementation depends on UI structure
        const overlay = this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            0x000000,
            0.7
        );

        const text = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'LEVEL COMPLETE!',
            {
                fontSize: '48px',
                color: '#fff',
                fontFamily: 'Arial'
            }
        );
        text.setOrigin(0.5);

        // Fade out after 2 seconds
        this.scene.tweens.add({
            targets: [overlay, text],
            alpha: 0,
            duration: 1000,
            delay: 2000,
            onComplete: () => {
                overlay.destroy();
                text.destroy();
            }
        });
    }

    /**
	 * Show game over overlay
	 */
    showGameOverOverlay() {
        this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            0x000000,
            0.8
        );

        const text = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'GAME OVER',
            {
                fontSize: '64px',
                color: '#ff0000',
                fontFamily: 'Arial'
            }
        );
        text.setOrigin(0.5);

        const scoreText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2 + 60,
            `Final Score: ${this.viewState.score}`,
            {
                fontSize: '32px',
                color: '#fff',
                fontFamily: 'Arial'
            }
        );
        scoreText.setOrigin(0.5);
    }

    /**
	 * Clean up resources
	 */
    destroy() {
        // Unsubscribe from events
        for (const unsubscribe of this.unsubscribers) {
            unsubscribe();
        }

        // Clean up renderers
        if (this.playerRenderer) {
            this.playerRenderer.destroy();
        }

        for (const renderer of this.ghostRenderers.values()) {
            renderer.destroy();
        }

        if (this.fruitRenderer) {
            this.fruitRenderer.destroy();
        }

        if (this.pelletRenderer) {
            this.pelletRenderer.destroy();
        }

        // Clean up managers
        if (this.soundManager) {
            this.soundManager.destroy();
        }

        if (this.effectManager) {
            this.effectManager.destroy();
        }
    }
}
