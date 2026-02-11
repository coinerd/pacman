/**
 * ModelDrivenGameView
 * Pure observer View that renders Model state without creating visual entities.
 *
 * Key characteristics:
 * - Creates VisualPacman/VisualGhost/VisualFruit from model entities
 * - Does NOT create Pacman/Ghost/Fruit visual entities
 * - Syncs visual representation to model state each frame
 * - Responds to model events for effects and sounds
 */

import {
    gameConfig,
    colors
} from '../config/gameConfig.js';
import { gridToPixel, TILE_TYPES, PELLET_TYPES } from '../utils/MazeLayout.js';
import { SoundManager } from '../managers/SoundManager.js';
import { EffectManager } from '../scenes/systems/EffectManager.js';
import { PelletPool } from '../pools/PelletPool.js';
import { PowerPelletPool } from '../pools/PowerPelletPool.js';
import { gameEvents, GAME_EVENTS } from '../core/EventBus.js';
import { VisualPacman } from '../view/visuals/VisualPacman.js';
import { VisualGhost } from '../view/visuals/VisualGhost.js';
import { VisualFruit } from '../view/visuals/VisualFruit.js';

export default class ModelDrivenGameView {
    constructor({ scene, gameModel, storageManager }) {
        this.scene = scene;
        this.gameModel = gameModel;
        this.storageManager = storageManager;

        // Visual wrappers for model entities
        this.visualPacman = null;
        this.visualGhosts = new Map(); // ghostType -> VisualGhost
        this.visualFruit = null;

        // Managers
        this.soundManager = new SoundManager(scene);
        this.effectManager = new EffectManager(scene);

        // Pellet pools
        this.pelletPool = null;
        this.powerPelletPool = null;

        // Track which pellets are currently visible
        this.activePellets = new Map(); // key: "x,y" -> pellet sprite

        // Event unsubscribers
        this.unsubscribers = [];

        // Death animation state
        this.isDeathAnimating = false;
    }

    /**
     * Apply settings
     */
    applySettings(settings) {
        if (!settings) {return;}

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
        this.createEntityVisuals();
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

        // Optional grid
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.lineStyle(1, 0x111111, 0.3);

        for (let x = 0; x <= this.scene.scale.width; x += gameConfig.tileSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.scene.scale.height);
        }

        for (let y = 0; y <= this.scene.scale.height; y += gameConfig.tileSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.scene.scale.width, y);
        }

        graphics.strokePath();
        graphics.generateTexture('backgroundGrid', this.scene.scale.width, this.scene.scale.height);
        graphics.destroy();

        this.scene.add.image(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'backgroundGrid'
        );
    }

    /**
     * Create maze walls from model
     */
    createMaze() {
        const maze = this.gameModel.maze;
        if (!maze) {return;}

        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });

        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[y].length; x++) {
                if (maze[y][x] === TILE_TYPES.WALL) {
                    this.drawWallToGraphics(graphics, x, y);
                }
            }
        }

        const mazeWidth = maze[0].length * gameConfig.tileSize;
        const mazeHeight = maze.length * gameConfig.tileSize;
        graphics.generateTexture('mazeWalls', mazeWidth, mazeHeight);
        graphics.destroy();

        this.scene.add.image(
            mazeWidth / 2,
            mazeHeight / 2,
            'mazeWalls'
        );
    }

    /**
     * Draw a single wall tile
     */
    drawWallToGraphics(graphics, x, y) {
        const pixel = gridToPixel(x, y);
        const size = gameConfig.tileSize;

        // Shadow
        graphics.fillStyle(colors.wallShadow, 1);
        graphics.fillRect(pixel.x + 2, pixel.y + 2, size, size);

        // Main wall
        graphics.fillStyle(colors.wall, 1);
        graphics.fillRect(pixel.x, pixel.y, size, size);

        // Highlight
        graphics.fillStyle(0x3333FF, 0.3);
        graphics.fillRect(pixel.x + 2, pixel.y + 2, size - 4, size - 4);

        // Border
        graphics.lineStyle(1, 0x4444FF, 0.5);
        graphics.strokeRect(pixel.x, pixel.y, size, size);
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
     * Create pellets from model's pellet grid
     */
    createPellets() {
        const pelletGrid = this.gameModel.pelletGrid;
        if (!pelletGrid) {return;}

        for (let y = 0; y < pelletGrid.length; y++) {
            for (let x = 0; x < pelletGrid[y].length; x++) {
                const pelletType = pelletGrid[y][x];
                const key = `${x},${y}`;

                if (pelletType === PELLET_TYPES.PELLET) {
                    const pellet = this.pelletPool.get(x, y);
                    this.activePellets.set(key, pellet);
                } else if (pelletType === PELLET_TYPES.POWER_PELLET) {
                    const powerPellet = this.powerPelletPool.get(x, y);
                    this.activePellets.set(key, powerPellet);

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
     * Create visual wrappers for model entities
     */
    createEntityVisuals() {
        // Create VisualPacman from model
        this.visualPacman = new VisualPacman(this.scene, this.gameModel.pacman);

        // Create VisualGhost for each model ghost
        for (const ghost of this.gameModel.ghosts) {
            const visualGhost = new VisualGhost(this.scene, ghost);
            this.visualGhosts.set(ghost.ghostType, visualGhost);
        }

        // Create VisualFruit from model
        this.visualFruit = new VisualFruit(this.scene, this.gameModel.fruit);
    }

    /**
     * Bind to model events
     */
    bindModelEvents() {
        this.unsubscribers.push(
            // Pellet eaten - play sound and remove visual pellet
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, (data) => {
                this.soundManager.playWakaWaka();

                // Remove the visual pellet
                const key = `${data.gridX},${data.gridY}`;
                const pellet = this.activePellets.get(key);
                if (pellet) {
                    this.pelletPool.release(pellet);
                    this.activePellets.delete(key);
                }
            }),

            // Power pellet eaten
            gameEvents.on(GAME_EVENTS.POWER_PELLET_EATEN, (data) => {
                this.soundManager.playPowerPellet();
                const pixel = gridToPixel(data.gridX, data.gridY);
                this.effectManager.createPowerPelletEffect(pixel.x, pixel.y);

                // Remove the visual power pellet
                const key = `${data.gridX},${data.gridY}`;
                const pellet = this.activePellets.get(key);
                if (pellet) {
                    this.powerPelletPool.release(pellet);
                    this.activePellets.delete(key);
                }
            }),

            // Ghost eaten
            gameEvents.on(GAME_EVENTS.GHOST_EATEN, (data) => {
                this.soundManager.playGhostEaten();
                const ghost = this.gameModel.ghosts.find(g => g.ghostType === data.ghostType);
                if (ghost) {
                    this.effectManager.createGhostEatenEffect(ghost.x, ghost.y);
                }
            }),

            // Pacman died
            gameEvents.on(GAME_EVENTS.LIVES_LOST, () => {
                this.soundManager.playDeath();
            }),

            // Fruit eaten
            gameEvents.on(GAME_EVENTS.FRUIT_EATEN, (data) => {
                this.soundManager.playFruitEat();
                const fruit = this.gameModel.fruit;
                const color = fruit.fruitType?.color || 0xFF00FF;
                this.effectManager.createFruitEatEffect(fruit.x, fruit.y, color);
                this.visualFruit.showScore(data.score);
            }),

            // Level complete
            gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, () => {
                this.soundManager.playLevelComplete();
                this.storageManager.saveHighScore(this.gameModel.score);
                this.scene.scene.start('WinScene', {
                    score: this.gameModel.score,
                    level: this.gameModel.level,
                    highScore: this.gameModel.highScore
                });
            }),

            // Game over
            gameEvents.on(GAME_EVENTS.GAME_OVER, () => {
                this.storageManager.saveHighScore(this.gameModel.score);
                this.scene.scene.start('GameOverScene', {
                    score: this.gameModel.score,
                    highScore: this.gameModel.highScore
                });
            }),

            // Respawn
            gameEvents.on(GAME_EVENTS.RESPAWN, () => {
                this.isDeathAnimating = false;
            })
        );

        // Phase 7: Bind to controller action events (scene transitions are View concerns)
        this.bindControllerEvents();
    }

    /**
     * Bind to controller action events (Phase 7)
     * Scene transitions are handled by View, triggered by controller events
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

            // Return to menu requested
            gameEvents.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
                this.scene.cleanup();
                this.scene.scene.start('MenuScene');
            }),

            // Restart level requested
            gameEvents.on(GAME_EVENTS.RESTART_LEVEL_REQUESTED, () => {
                this.scene.scene.restart({
                    score: 0,
                    lives: 3,
                    level: 1
                });
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
     * Sync all visuals to model state
     * Called each frame in the update loop
     */
    sync() {
        if (!this.visualPacman || this.isDeathAnimating) {return;}

        // Sync entity visuals
        this.visualPacman.sync();

        for (const visualGhost of this.visualGhosts.values()) {
            visualGhost.sync();
        }

        this.visualFruit.sync();
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
    updateDeathAnimation(deltaSeconds) {
        if (this.visualPacman) {
            this.visualPacman.sync();
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
        const notification = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height - 100
        );

        const bg = this.scene.add.rectangle(0, 0, 300, 80, 0x000000)
            .setAlpha(0.8)
            .setStrokeStyle(2, 0xFFD700);

        const icon = this.scene.add.text(-130, 0, achievement.icon, {
            fontSize: '32px'
        }).setOrigin(0.5);

        const name = this.scene.add.text(-20, -15, achievement.name, {
            fontSize: '18px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        const desc = this.scene.add.text(-20, 15, achievement.description, {
            fontSize: '12px',
            color: '#FFFFFF'
        }).setOrigin(0, 0.5);

        notification.add([bg, icon, name, desc]);
        notification.setAlpha(0);

        this.scene.tweens.add({
            targets: notification,
            alpha: 1,
            y: this.scene.scale.height - 150,
            duration: 500,
            ease: 'Power2'
        });

        this.scene.time.delayedCall(3000, () => {
            this.scene.tweens.add({
                targets: notification,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => notification.destroy()
            });
        });
    }

    /**
     * Resume audio
     */
    resumeAudio() {
        this.soundManager.resume();
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Unsubscribe from events
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];

        // Destroy visual entities
        if (this.visualPacman) {
            this.visualPacman.destroy();
            this.visualPacman = null;
        }

        for (const visualGhost of this.visualGhosts.values()) {
            visualGhost.destroy();
        }
        this.visualGhosts.clear();

        if (this.visualFruit) {
            this.visualFruit.destroy();
            this.visualFruit = null;
        }

        // Destroy pellet pools
        if (this.pelletPool) {
            this.pelletPool.destroy();
        }
        if (this.powerPelletPool) {
            this.powerPelletPool.destroy();
        }
        this.activePellets.clear();

        // Disable sound
        this.soundManager.setEnabled(false);
        this.effectManager.cleanup();
    }
}
