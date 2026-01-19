/**
 * Game Scene
 * Main gameplay scene refactored to use subsystems
 */

import Phaser from 'phaser';
import {
    gameConfig,
    colors,
    directions,
    pacmanStartPosition,
    fruitConfig,
    animationConfig,
    physicsConfig
} from '../config/gameConfig.js';
import {
    createMazeData,
    gridToPixel,
    getCenterPixel,
    TILE_TYPES,
    PELLET_TYPES,
    countPellets
} from '../utils/MazeLayout.js';
import Pacman from '../entities/Pacman.js';
import { GhostFactory } from '../entities/GhostFactory.js';
import { GhostAISystem } from '../systems/GhostAISystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import Fruit, { generateFruitTextures } from '../entities/Fruit.js';
import { SoundManager } from '../managers/SoundManager.js';
import { StorageManager } from '../managers/StorageManager.js';
import { GameFlowController } from './systems/GameFlowController.js';
import { UIController } from './systems/UIController.js';
import { InputController } from './systems/InputController.js';
import { EffectManager } from './systems/EffectManager.js';
import { DeathHandler } from './systems/DeathHandler.js';
import { LevelManager } from './systems/LevelManager.js';
import { PelletPool } from '../pools/PelletPool.js';
import { PowerPelletPool } from '../pools/PowerPelletPool.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { DebugOverlay } from '../systems/DebugOverlay.js';
import { ReplaySystem } from '../systems/ReplaySystem.js';
import { PacmanAI } from '../systems/PacmanAI.js';
import { FixedTimeStepLoop } from '../systems/FixedTimeStepLoop.js';
import { gameEvents, GAME_EVENTS } from '../core/EventBus.js';
import { normalizeDeltaSeconds } from '../utils/Time.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    /**
     * Initialize scene with data
     * @param {Object} data - Scene data
     */
    init(data) {
        this.gameState = {
            score: data.score || 0,
            lives: 3,
            level: data.level || 1,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            deathTimer: 0,
            highScore: 0,
            pelletsEaten: 0,
            pelletsRemaining: 0,
            totalPellets: 0,
            ghostsEaten: 0,
            maxComboGhosts: 0,
            levelDeaths: 0,
            fruitsCollected: 0,
            levelComplete: false
        };

        this.storageManager = new StorageManager();
        this.gameState.highScore = this.storageManager.getHighScore();
        this.soundManager = new SoundManager(this);

        this.gameFlowController = new GameFlowController(this);
        this.levelManager = new LevelManager(this, this.gameState);

        this.pelletPool = new PelletPool(this);
        this.powerPelletPool = new PowerPelletPool(this);

        this.achievementSystem = new AchievementSystem(this);
        this.achievementSystem.init();

        this.replaySystem = new ReplaySystem();
        this.settings = this.storageManager.getSettings();

        if (this.settings) {
            if (this.settings.soundEnabled !== undefined) {
                this.soundManager.setEnabled(this.settings.soundEnabled);
            }
            if (this.settings.volume !== undefined) {
                this.soundManager.setVolume(this.settings.volume);
            }
        }
    }

    create() {
        const { maze, pelletGrid } = createMazeData();
        this.maze = maze;
        this.pelletGrid = pelletGrid;

        this.createBackground();
        this.createMaze();
        this.createPellets();
        this.createEntities();
        generateFruitTextures(this);
        this.createFruit();

        this.uiController = new UIController(this, this.gameState);
        this.uiController.create();

        this.inputController = new InputController(this, this.pacman);

        this.effectManager = new EffectManager(this);
        this.deathHandler = new DeathHandler(this, this.gameState);

        this.collisionSystem = new CollisionSystem(this);
        this.collisionSystem.setPacman(this.pacman);
        this.collisionSystem.setGhosts(this.ghosts);
        this.collisionSystem.setMaze(this.maze);
        this.collisionSystem.setPelletPool(this.pelletPool);
        this.collisionSystem.setPowerPelletPool(this.powerPelletPool);
        this.collisionSystem.setPelletGrid(this.pelletGrid);
        this.gameState.totalPellets = countPellets(this.pelletGrid);
        this.gameState.pelletsRemaining = this.gameState.totalPellets;
        this.collisionSystem.setPelletCounts(this.gameState.totalPellets);

        this.ghostAISystem = new GhostAISystem();
        this.ghostAISystem.setGhosts(this.ghosts);

        this.pacmanAI = new PacmanAI();

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

        this.resetPositions();
    }

    /**
     * Create background with pattern
     */
    createBackground() {
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            colors.background
        );

        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.lineStyle(1, 0x111111, 0.3);

        for (let x = 0; x <= this.scale.width; x += gameConfig.tileSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.scale.height);
        }

        for (let y = 0; y <= this.scale.height; y += gameConfig.tileSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.scale.width, y);
        }

        graphics.strokePath();
        graphics.generateTexture('backgroundGrid', this.scale.width, this.scale.height);
        graphics.destroy();

        this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            'backgroundGrid'
        );
    }

    /**
     * Create maze with enhanced visuals
     */
    createMaze() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === TILE_TYPES.WALL) {
                    this.drawWallToGraphics(graphics, x, y);
                }
            }
        }

        const mazeWidth = this.maze[0].length * gameConfig.tileSize;
        const mazeHeight = this.maze.length * gameConfig.tileSize;
        graphics.generateTexture('mazeWalls', mazeWidth, mazeHeight);
        graphics.destroy();

        this.mazeImage = this.add.image(
            mazeWidth / 2,
            mazeHeight / 2,
            'mazeWalls'
        );
    }

    drawWallToGraphics(graphics, x, y) {
        const pixel = gridToPixel(x, y);
        const size = gameConfig.tileSize;

        graphics.fillStyle(colors.wallShadow, 1);
        graphics.fillRect(pixel.x + 2, pixel.y + 2, size, size);

        graphics.fillStyle(colors.wall, 1);
        graphics.fillRect(pixel.x, pixel.y, size, size);

        graphics.fillStyle(0x3333FF, 0.3);
        graphics.fillRect(pixel.x + 2, pixel.y + 2, size - 4, size - 4);

        graphics.lineStyle(1, 0x4444FF, 0.5);
        graphics.strokeRect(pixel.x, pixel.y, size, size);
    }

    createPellets() {
        this.pelletPool.init();
        this.powerPelletPool.init(4);

        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                const pelletType = this.pelletGrid[y][x];

                if (pelletType === PELLET_TYPES.PELLET) {
                    this.pelletPool.get(x, y);
                } else if (pelletType === PELLET_TYPES.POWER_PELLET) {
                    const powerPellet = this.powerPelletPool.get(x, y);
                    if (powerPellet) {
                        this.tweens.add({
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

    /**
     * Create game entities
     */
    createEntities() {
        this.pacman = new Pacman(
            this,
            pacmanStartPosition.x,
            pacmanStartPosition.y
        );

        this.ghosts = GhostFactory.createGhosts(this);
    }

    /**
     * Create fruit entity
     */
    createFruit() {
        this.fruit = new Fruit(
            this,
            fruitConfig.positions[0].x,
            fruitConfig.positions[0].y,
            0
        );
    }

    /**
     * Setup touch controls for mobile
     */
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
                    if (deltaX > 0) {
                        this.pacman.setDirection(directions.RIGHT);
                    } else {
                        this.pacman.setDirection(directions.LEFT);
                    }
                }
            } else {
                if (Math.abs(deltaY) > threshold) {
                    if (deltaY > 0) {
                        this.pacman.setDirection(directions.DOWN);
                    } else {
                        this.pacman.setDirection(directions.UP);
                    }
                }
            }
        });
    }

    /**
     * Update scene
     * @param {number} time - Current time
     * @param {number} delta - Time since last update in milliseconds
     */
    update(time, delta) {
        if (this.gameState.isPaused || this.gameState.isGameOver) {
            return;
        }

        const deltaInSeconds = normalizeDeltaSeconds(delta);

        if (this.deathHandler.update(deltaInSeconds)) {
            return;
        }

        if (this.sys.game.isDemo) {
            this.pacmanAI.update(this.pacman, this.maze, this.pelletGrid, this.ghosts);
        } else {
            this.inputController.handleInput();
        }

        this.fixedTimeStepLoop.update(deltaInSeconds);

        if (this.debugOverlay.visible) {
            const collisionStats = this.collisionSystem.getProfilingInfo();
            this.debugOverlay.updateDebugInfo({
                'Frame dt': `${deltaInSeconds.toFixed(4)}s`,
                'Fixed dt': `${physicsConfig.FIXED_DT.toFixed(4)}s`,
                'Steps': this.fixedTimeStepLoop.getLastStepCount(),
                'Accumulator': `${this.fixedTimeStepLoop.getAccumulator().toFixed(4)}s`,
                'Collision ms': collisionStats ? `${collisionStats.collisionMs.toFixed(2)}ms` : 'n/a',
                'Collision pellet ms': collisionStats ? `${collisionStats.pelletMs.toFixed(2)}ms` : 'n/a',
                'Collision ghost ms': collisionStats ? `${collisionStats.ghostMs.toFixed(2)}ms` : 'n/a',
                'Collision checks': collisionStats ? `${collisionStats.checks.ghosts} ghosts` : 'n/a',
                'Pellets remaining': collisionStats?.pelletsRemaining ?? 'n/a'
            });
        }

        this.uiController.update();
        this.debugOverlay.update(time, delta);
    }

    /**
     * Fixed timestep update callback (60 Hz)
     * All physics and game logic updates happen here
     */
    fixedUpdate() {
        const deltaSeconds = physicsConfig.FIXED_DT;
        this.pacman.update(deltaSeconds, this.maze);

        for (const ghost of this.ghosts) {
            ghost.update(deltaSeconds, this.maze, this.pacman);
        }

        this.ghostAISystem.update(deltaSeconds, this.maze, this.pacman);
        this.handleCollisions();
        this.updateFruit(deltaSeconds);
        this.replaySystem.update(deltaSeconds);
    }

    /**
     * Check all collisions
     */
    handleCollisions() {
        const results = this.collisionSystem.checkAllCollisions();

        if (results.pelletScore > 0) {
            this.gameFlowController.handlePelletEaten(results.pelletScore);
            this.gameState.pelletsEaten++;
            this.gameState.pelletsRemaining = this.collisionSystem.getPelletsRemaining();
            this.achievementSystem.check(this.gameState);
            this.checkFruitSpawn();
        }

        if (results.powerPelletScore > 0) {
            const duration = this.levelManager.getFrightenedDuration();
            this.gameFlowController.handlePowerPelletEaten(results.powerPelletScore, duration);
            this.effectManager.createPowerPelletEffect();
            this.gameState.currentComboGhosts = 0;
            this.gameState.pelletsRemaining = this.collisionSystem.getPelletsRemaining();
            this.achievementSystem.check(this.gameState);
        }

        if (results.ghostCollision) {
            if (results.ghostCollision.type === 'ghost_eaten') {
                this.gameFlowController.handleGhostCollision(results.ghostCollision);
                this.effectManager.createGhostEatenEffect();
                this.gameState.ghostsEaten++;
                this.gameState.currentComboGhosts++;
                this.gameState.maxComboGhosts = Math.max(
                    this.gameState.maxComboGhosts,
                    this.gameState.currentComboGhosts
                );
                this.achievementSystem.check(this.gameState);
            } else if (results.ghostCollision.type === 'pacman_died') {
                this.deathHandler.handleDeath();
                this.gameState.levelDeaths++;
                this.gameState.levelComplete = false;
                this.achievementSystem.check(this.gameState);
            }
        }

        if (this.fruit.active) {
            const dist = Math.sqrt(
                Math.pow(this.pacman.x - this.fruit.x, 2) +
                Math.pow(this.pacman.y - this.fruit.y, 2)
            );

            if (dist < gameConfig.tileSize) {
                this.gameFlowController.handleFruitEaten();
                this.effectManager.createFruitEatEffect();
                this.gameState.fruitsCollected++;
                this.achievementSystem.check(this.gameState);
            }
        }

        if (this.collisionSystem.checkWinCondition()) {
            this.gameFlowController.handleWin();
        }
    }

    /**
     * Check if fruit should spawn
     */
    checkFruitSpawn() {
        const totalPellets = this.gameState.totalPellets;
        if (!totalPellets) {
            return;
        }

        const eatenPercentage = ((totalPellets - this.gameState.pelletsRemaining) / totalPellets) * 100;

        if (eatenPercentage >= fruitConfig.pelletThreshold && !this.fruit.active) {
            this.fruit.reset(this.gameState.level - 1);
            this.fruit.activate();
        }
    }

    updateFruit(delta) {
        if (this.fruit.active) {
            this.fruit.update(delta);
        }
    }

    resetPositions() {
        this.pacman.resetPosition(pacmanStartPosition.x, pacmanStartPosition.y);
        for (const ghost of this.ghosts) {
            ghost.reset();
        }
    }

    setupEventListeners() {
        gameEvents.on(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, (achievement) => {
            this.showAchievementNotification(achievement);
        });

        if (this.replaySystem && !this.replaySystem.isReplaying) {
            gameEvents.on(GAME_EVENTS.DIRECTION_CHANGED, (data) => {
                if (this.replaySystem.isRecording) {
                    this.replaySystem.recordInput({
                        type: 'direction',
                        data: data
                    });
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

    showAchievementNotification(achievement) {
        const notification = this.add.container(
            this.scale.width / 2,
            this.scale.height - 100
        );

        const bg = this.add.rectangle(0, 0, 300, 80, 0x000000)
            .setAlpha(0.8)
            .setStrokeStyle(2, 0xFFD700);

        const icon = this.add.text(-130, 0, achievement.icon, {
            fontSize: '32px'
        }).setOrigin(0.5);

        const name = this.add.text(-20, -15, achievement.name, {
            fontSize: '18px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        const desc = this.add.text(-20, 15, achievement.description, {
            fontSize: '12px',
            color: '#FFFFFF'
        }).setOrigin(0, 0.5);

        notification.add([bg, icon, name, desc]);
        notification.setAlpha(0);

        this.tweens.add({
            targets: notification,
            alpha: 1,
            y: this.scale.height - 150,
            duration: 500,
            ease: 'Power2'
        });

        this.time.delayedCall(3000, () => {
            this.tweens.add({
                targets: notification,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => notification.destroy()
            });
        });
    }

    /**
     * Resume from pause
     */
    resume() {
        this.gameState.isPaused = false;
        this.soundManager.resume();
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.soundManager) {
            this.soundManager.setEnabled(false);
        }
        if (this.effectManager) {
            this.effectManager.cleanup();
        }
        if (this.uiController) {
            this.uiController.cleanup();
        }
        if (this.inputController) {
            this.inputController.cleanup();
        }
        if (this.pelletPool) {
            this.pelletPool.destroy();
        }
        if (this.powerPelletPool) {
            this.powerPelletPool.destroy();
        }
        if (this.debugOverlay) {
            this.debugOverlay.cleanup();
        }
        if (this.achievementSystem) {
            this.achievementSystem.save();
        }
        if (this.replaySystem) {
            this.replaySystem.cleanup();
        }
    }
}
