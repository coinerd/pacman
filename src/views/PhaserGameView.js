/**
 * PhaserGameView
 * Phaser-backed view adapter that renders game state and responds to model events.
 */

import {
    animationConfig,
    colors,
    fruitConfig,
    gameConfig,
    pacmanStartPosition
} from '../config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';
import { EnemyFactory } from '../entities/EnemyFactory.js';
import Fruit, { generateFruitTextures } from '../entities/Fruit.js';
import Player from '../entities/Player.js';
import { SoundManager } from '../managers/SoundManager.js';
import { PelletPool } from '../pools/PelletPool.js';
import { PowerPelletPool } from '../pools/PowerPelletPool.js';
import { DeathHandler } from '../scenes/systems/DeathHandler.js';
import { EffectManager } from '../scenes/systems/EffectManager.js';
import { gridToPixel, PELLET_TYPES, TILE_TYPES } from '../utils/MazeLayout.js';

export default class PhaserGameView {
    constructor({ scene, model, storageManager }) {
        this.scene = scene;
        this.model = model;
        this.storageManager = storageManager;
        this.soundManager = new SoundManager(scene);
        this.effectManager = new EffectManager(scene);
        this.deathHandler = new DeathHandler(scene, model);
        this.pelletPool = null;
        this.powerPelletPool = null;
        this.pacman = null;
        this.ghosts = [];
        this.fruit = null;
        this.unsubscribers = [];
    }

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

    createBackground() {
        this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            colors.background
        );

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

    createMaze(levelSnapshot) {
        if (!levelSnapshot?.maze) {
            return;
        }

        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });

        for (let y = 0; y < levelSnapshot.maze.length; y++) {
            for (let x = 0; x < levelSnapshot.maze[y].length; x++) {
                if (levelSnapshot.maze[y][x] === TILE_TYPES.WALL) {
                    this.drawWallToGraphics(graphics, x, y);
                }
            }
        }

        const mazeWidth = levelSnapshot.maze[0].length * gameConfig.tileSize;
        const mazeHeight = levelSnapshot.maze.length * gameConfig.tileSize;
        graphics.generateTexture('mazeWalls', mazeWidth, mazeHeight);
        graphics.destroy();

        this.scene.add.image(mazeWidth / 2, mazeHeight / 2, 'mazeWalls');
    }

    drawWallToGraphics(graphics, x, y) {
        const pixel = gridToPixel(x, y);
        const size = gameConfig.tileSize;

        graphics.fillStyle(colors.wallShadow, 1);
        graphics.fillRect(pixel.x + 2, pixel.y + 2, size, size);

        graphics.fillStyle(colors.wall, 1);
        graphics.fillRect(pixel.x, pixel.y, size, size);

        graphics.fillStyle(0x3333ff, 0.3);
        graphics.fillRect(pixel.x + 2, pixel.y + 2, size - 4, size - 4);

        graphics.lineStyle(1, 0x4444ff, 0.5);
        graphics.strokeRect(pixel.x, pixel.y, size, size);
    }

    createPelletPools() {
        this.pelletPool = new PelletPool(this.scene);
        this.powerPelletPool = new PowerPelletPool(this.scene);
        this.pelletPool.init();
        this.powerPelletPool.init(4);

        return {
            pelletPool: this.pelletPool,
            powerPelletPool: this.powerPelletPool
        };
    }

    createPellets(levelSnapshot) {
        if (!levelSnapshot?.pelletGrid) {
            return;
        }

        for (let y = 0; y < levelSnapshot.pelletGrid.length; y++) {
            for (let x = 0; x < levelSnapshot.pelletGrid[y].length; x++) {
                const pelletType = levelSnapshot.pelletGrid[y][x];

                if (pelletType === PELLET_TYPES.PELLET) {
                    this.pelletPool.get(x, y);
                } else if (pelletType === PELLET_TYPES.POWER_PELLET) {
                    const powerPellet = this.powerPelletPool.get(x, y);
                    if (powerPellet) {
                        this.scene.tweens.add({
                            targets: powerPellet,
                            scale: { from: 1, to: 1.5 },
                            alpha: { from: 1, to: 0.7 },
                            duration: animationConfig.powerPelletPulseSpeed,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    }
                }
            }
        }
    }

    createEntities() {
        this.pacman = new Player(
            this.scene,
            pacmanStartPosition.x,
            pacmanStartPosition.y
        );

        this.ghosts = EnemyFactory.createGhosts(this.scene);
        generateFruitTextures(this.scene);
        this.fruit = new Fruit(
            this.scene,
            fruitConfig.positions[0].x,
            fruitConfig.positions[0].y,
            0
        );

        return {
            pacman: this.pacman,
            ghosts: this.ghosts,
            fruit: this.fruit
        };
    }

    bindModelEvents() {
        this.unsubscribers.push(
            gameEvents.on(GAME_EVENTS.PELLET_EATEN, () => {
                this.soundManager.playWakaWaka();
            }),
            gameEvents.on(GAME_EVENTS.POWER_PELLET_EATEN, (data) => {
                const duration =
					data?.frightenedDuration ?? this.model.getFrightenedDuration();
                for (const ghost of this.ghosts) {
                    if (!ghost.isEaten) {
                        ghost.setFrightened(duration);
                    }
                }
                this.soundManager.playPowerPellet();
                this.effectManager.createPowerPelletEffect();
            }),
            gameEvents.on(GAME_EVENTS.GHOST_EATEN, () => {
                this.soundManager.playGhostEaten();
                this.effectManager.createGhostEatenEffect();
            }),
            gameEvents.on(GAME_EVENTS.LIVES_LOST, () => {
                this.deathHandler.handleDeath();
                this.soundManager.playDeath();
            }),
            gameEvents.on(GAME_EVENTS.FRUIT_EATEN, () => {
                this.soundManager.playFruitEat();
                this.effectManager.createFruitEatEffect();
                if (this.fruit) {
                    this.fruit.deactivate();
                }
            }),
            gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, () => {
                this.soundManager.playLevelComplete();
                this.storageManager.saveHighScore(this.model.state.score);
                this.scene.scene.start('WinScene', {
                    score: this.model.state.score,
                    level: this.model.state.level,
                    highScore: this.model.state.highScore
                });
            }),
            gameEvents.on(GAME_EVENTS.GAME_OVER, () => {
                this.storageManager.saveHighScore(this.model.state.score);
                this.scene.scene.start('GameOverScene', {
                    score: this.model.state.score,
                    highScore: this.model.state.highScore
                });
            })
        );
    }

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

    resumeAudio() {
        this.soundManager.resume();
    }

    cleanup() {
        this.unsubscribers.forEach((unsubscribe) => unsubscribe());
        this.unsubscribers = [];
        this.soundManager.setEnabled(false);
        this.effectManager.cleanup();
        if (this.pelletPool) {
            this.pelletPool.destroy();
        }
        if (this.powerPelletPool) {
            this.powerPelletPool.destroy();
        }
    }
}
