/**
 * ModelDrivenGameView
 * Pure observer View that renders Model state without creating visual entities.
 *
 * Key characteristics:
 * - Creates VisualPlayer/VisualEnemy/VisualFruit from model entities
 * - Does NOT create Player/Enemy/Fruit visual entities
 * - Syncs visual representation to model state each frame
 * - Responds to model events for effects and sounds
 */

import { colors, gameConfig } from '../config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';
import { SoundManager } from '../managers/SoundManager.js';
import { PelletPool } from '../pools/PelletPool.js';
import { PowerPelletPool } from '../pools/PowerPelletPool.js';
import { EffectManager } from '../scenes/systems/EffectManager.js';
import { gridToPixel, PELLET_TYPES, TILE_TYPES } from '../utils/MazeLayout.js';
import { VisualEnemy } from '../view/visuals/VisualEnemy.js';
import { VisualFruit } from '../view/visuals/VisualFruit.js';
import { VisualPlayer } from '../view/visuals/VisualPlayer.js';

export default class ModelDrivenGameView {
    constructor({ scene, gameModel, storageManager }) {
        this.scene = scene;
        this.gameModel = gameModel;
        this.storageManager = storageManager;

        // Visual wrappers for model entities
        this.visualPlayer = null;
        this.visualEnemies = new Map(); // ghostType -> VisualEnemy
        this.visualFruit = null;
        this.bossVisuals = new Map(); // bossType -> VisualBoss
        this.powerUpVisuals = new Map(); // id -> VisualPowerUp

        // Story overlay for narrative display
        this.storyOverlay = null;
        this.storyText = null;
        this.storyDescription = null;

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
	 * Create maze walls from model
	 */
    createMaze() {
        const maze = this.gameModel.maze;
        if (!maze) {
            return;
        }

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

    isWallAt(gridX, gridY) {
        const maze = this.gameModel.maze;
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
	 * Create pellets from model's pellet grid
	 */
    createPellets() {
        const pelletGrid = this.gameModel.pelletGrid;
        if (!pelletGrid) {
            return;
        }

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
        // Create VisualPlayer from model
        this.visualPlayer = new VisualPlayer(this.scene, this.gameModel.pacman);

        // Create VisualEnemy for each model ghost
        for (const ghost of this.gameModel.ghosts) {
            const visualEnemy = new VisualEnemy(this.scene, ghost);
            this.visualEnemies.set(ghost.ghostType, visualEnemy);
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
                const ghost = this.gameModel.ghosts.find(
                    (g) => g.ghostType === data.ghostType
                );
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
                const color = fruit.fruitType?.color || 0xff00ff;
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

        // Phase 5: Bind to Phase 5 system events
        this.bindPhase5Events();
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
	 * Bind to Phase 5 system events
	 */
    bindPhase5Events() {
        this.unsubscribers.push(
            // Boss spawned
            gameEvents.on(GAME_EVENTS.BOSS_SPAWNED, (data) => {
                this.createBossVisual(data.bossType);
                this.showBossWarning(data.bossType);
            }),

            // Boss phase changed
            gameEvents.on(GAME_EVENTS.BOSS_PHASE_CHANGED, (data) => {
                this.updateBossVisualPhase(data.bossType, data.phase);
            }),

            // Boss damaged
            gameEvents.on(GAME_EVENTS.BOSS_DAMAGED, (data) => {
                this.flashBossVisual(data.bossType);
            }),

            // Boss defeated
            gameEvents.on(GAME_EVENTS.BOSS_DEFEATED, (data) => {
                this.removeBossVisual(data.bossType);
                this.effectManager.createExplosionEffect(
                    this.scene.scale.width / 2,
                    this.scene.scale.height / 2,
                    0xff0000
                );
                this.showBossDefeatMessage(data.scoreBonus);
            }),

            // Power up spawned
            gameEvents.on(GAME_EVENTS.POWER_UP_SPAWNED, (data) => {
                this.createPowerUpVisual(data.type, data.x, data.y);
            }),

            // Power up collected
            gameEvents.on(GAME_EVENTS.POWER_UP_COLLECTED, (data) => {
                const powerUpKey = `${data.x},${data.y}`;
                const visual = this.powerUpVisuals.get(powerUpKey);
                if (visual) {
                    this.removePowerUpVisual(visual);
                    this.showPowerUpCollectionEffect(data.type, visual);
                }
            }),

            // Power up expired
            gameEvents.on(GAME_EVENTS.POWER_UP_EXPIRED, (data) => {
                this.visualPlayer.removePowerUpEffect(data.type);
            }),

            // Power up activated
            gameEvents.on(GAME_EVENTS.POWER_UP_ACTIVATED, (data) => {
                this.visualPlayer.addPowerUpEffect(data.type);
            }),

            // Chapter started
            gameEvents.on(GAME_EVENTS.CHAPTER_STARTED, (data) => {
                this.showStoryNarrative(data);
            }),

            // Chapter completed
            gameEvents.on(GAME_EVENTS.CHAPTER_COMPLETED, (data) => {
                this.showChapterCompleteMessage(data);
            })
        );
    }

    /**
	 * Sync all visuals to model state
	 * Called each frame in the update loop
	 */
    sync() {
        if (!this.visualPlayer || this.isDeathAnimating) {
            return;
        }

        this.visualPlayer.sync();

        for (const visualEnemy of this.visualEnemies.values()) {
            visualEnemy.sync();
        }

        this.visualFruit.sync();

        this.syncBossVisuals();
        this.syncPowerUpVisuals();
    }

    syncBossVisuals() {
        for (const [, visual] of this.bossVisuals) {
            const boss = this.gameModel.getBossEntity();
            if (!boss) {
                continue;
            }

            visual.sprite.x = boss.x;
            visual.sprite.y = boss.y;

            const barWidth = gameConfig.tileSize * 2;
            const healthPercent =
				this.gameModel.getBossHealth() / this.gameModel.getBossMaxHealth();
            visual.healthBar.fill.width = barWidth * healthPercent;
            visual.healthBar.fill.x = boss.x - barWidth / 2;

            const healthColor =
				healthPercent > 0.5
				    ? 0x00ff00
				    : healthPercent > 0.25
				        ? 0xffff00
				        : 0xff0000;
            visual.healthBar.fill.setFillStyle(healthColor);
        }
    }

    syncPowerUpVisuals() {
        for (const visual of this.powerUpVisuals.values()) {
            const pixel = gridToPixel(visual.gridX, visual.gridY);
            visual.sprite.x = pixel.x + gameConfig.tileSize * 0.35;
            visual.sprite.y = pixel.y + gameConfig.tileSize * 0.35;
            visual.text.x = pixel.x + gameConfig.tileSize * 0.35;
            visual.text.y = pixel.y + gameConfig.tileSize * 0.35;
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
        if (this.visualPlayer) {
            this.visualPlayer.sync();
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

        const bg = this.scene.add
            .rectangle(0, 0, 300, 80, 0x000000)
            .setAlpha(0.8)
            .setStrokeStyle(2, 0xffd700);

        const icon = this.scene.add
            .text(-130, 0, achievement.icon, {
                fontSize: '32px'
            })
            .setOrigin(0.5);

        const name = this.scene.add
            .text(-20, -15, achievement.name, {
                fontSize: '18px',
                color: '#FFD700',
                fontStyle: 'bold'
            })
            .setOrigin(0, 0.5);

        const desc = this.scene.add
            .text(-20, 15, achievement.description, {
                fontSize: '12px',
                color: '#FFFFFF'
            })
            .setOrigin(0, 0.5);

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
	 * Create boss visual
	 */
    createBossVisual(bossType) {
        const boss = this.gameModel.getBossEntity();
        if (!boss || this.bossVisuals.has(bossType)) {
            return;
        }

        const radius = gameConfig.tileSize * 0.6;

        this.bossVisuals.set(bossType, {
            sprite: this.createBossSprite(bossType, boss.x, boss.y, radius),
            healthBar: this.createBossHealthBar(boss, radius),
            phaseIndicator: this.createPhaseIndicator(boss.x, boss.y, radius),
            boss
        });

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

        const fill = this.scene.add
            .rectangle(
                boss.x - barWidth / 2,
                boss.y - radius - 20,
                barWidth * (boss.health / this.gameModel.getBossMaxHealth()),
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

    updateBossVisualPhase(bossType, phase) {
        const visual = this.bossVisuals.get(bossType);
        if (!visual) {
            return;
        }

        visual.phaseIndicator.setText(`PHASE ${phase}`);

        const intensity = phase === 1 ? 1 : 1.5;
        visual.sprite.setScale(intensity);

        if (phase > 1) {
            this.scene.tweens.add({
                targets: visual.sprite,
                scale: intensity + 0.1,
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        }
    }

    flashBossVisual(bossType) {
        const visual = this.bossVisuals.get(bossType);
        if (!visual) {
            return;
        }

        this.scene.tweens.add({
            targets: visual.sprite,
            alpha: 0.3,
            duration: 50,
            yoyo: true,
            repeat: 3
        });
    }

    removeBossVisual(bossType) {
        const visual = this.bossVisuals.get(bossType);
        if (!visual) {
            return;
        }

        visual.sprite.destroy();
        visual.healthBar.background.destroy();
        visual.healthBar.fill.destroy();
        visual.phaseIndicator.destroy();

        this.bossVisuals.delete(bossType);
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

    removePowerUpVisual(visual) {
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

        // Destroy visual entities
        if (this.visualPlayer) {
            this.visualPlayer.destroy();
            this.visualPlayer = null;
        }

        for (const visualEnemy of this.visualEnemies.values()) {
            visualEnemy.destroy();
        }
        this.visualEnemies.clear();

        if (this.visualFruit) {
            this.visualFruit.destroy();
            this.visualFruit = null;
        }

        for (const visual of this.bossVisuals.values()) {
            visual.sprite.destroy();
            visual.healthBar.background.destroy();
            visual.healthBar.fill.destroy();
            visual.phaseIndicator.destroy();
        }
        this.bossVisuals.clear();

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
        this.activePellets.clear();

        // Disable sound
        this.soundManager.setEnabled(false);
        this.effectManager.cleanup();
    }
}
