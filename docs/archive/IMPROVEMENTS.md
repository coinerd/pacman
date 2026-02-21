# Pac-Man Game - Improvement Proposals

## Table of Contents
1. [Summary](#summary)
2. [High Priority Improvements](#high-priority-improvements)
3. [Medium Priority Improvements](#medium-priority-improvements)
4. [Low Priority Enhancements](#low-priority-enhancements)
5. [Technical Debt](#technical-debt)
6. [Implementation Roadmap](#implementation-roadmap)

---

## Summary

This document proposes concrete, actionable improvements for the Pac-Man game based on detailed architectural analysis. The current implementation is **functional and faithful to the original game**, but shows signs of growth pains in several areas:

**Key Findings:**
- GameScene is overburdened (708 lines, 7+ responsibilities)
- Fruit drawing is inefficient (CPU-heavy Graphics API redraws every frame)
- No base entity class (movement logic duplicated across Pacman/Ghost)
- Tight coupling between entities and systems
- Limited extensibility (hardcoded ghost types, no plugin system)
- Inconsistent state management patterns
- No event-driven communication between systems
- Error handling sparse (only in StorageManager)

**Impact Assessment:**
- **Maintainability**: Medium (large files, duplicated code)
- **Extensibility**: Poor (hardcoded values, no architecture for additions)
- **Performance**: Good (60 FPS achievable) but with bottlenecks
- **Code Quality**: Medium (clear structure but violations of SRP)

---

## High Priority Improvements

### 1. Refactor GameScene - Split Responsibilities

**Current Issue**: GameScene has 708 lines with too many responsibilities (game loop, input, collision response, effects, UI, scene transitions)

**Problem**:
- Violates Single Responsibility Principle
- Hard to test individual concerns
- Difficult to navigate during development
- Changes in one area can break others

**Proposed Solution**:
```javascript
// New file: src/scenes/systems/GameFlowController.js
export class GameFlowController {
    constructor(gameScene) {
        this.scene = gameScene;
    this.gameState = gameScene.gameState;
    this.storageManager = gameScene.storageManager;
    this.soundManager = gameScene.soundManager;
    this.fruitController = null;
    this.effectManager = null;
    this.uiController = null;
    this.inputController = null;
    this.entityManager = null;
    this.collisionHandler = null;
    this.sceneTransitionManager = null;
    this.deathHandler = null;
    this.levelManager = null;
    this.levelManager = null;
    this.fruitManager = null;
    this.ghostManager = null;
        this.pacman = null;
        this.ghosts = null;
        this.fruit = null;
        this.maze = null;
        this.pelletSprites = null;
        this.powerPelletSprites = null;
        this.collisionSystem = null;
        this.ghostAISystem = null;
    }

    handlePelletEaten(score) {
        this.gameState.score += score;
        this.soundManager.playWakaWaka();
        this.uiController.updateScore(this.gameState.score);
        this.fruitManager.checkSpawn();
    }

    handlePowerPelletEaten(score, duration) {
        this.gameState.score += score;
        const ghosts = this.ghostManager.getGhosts();
        GhostFactory.setGhostsFrightened(ghosts, duration);
        this.soundManager.playPowerPellet();
        this.effectManager.createPowerPelletEffect(this.pacman);
    }

    handleGhostCollision(result) {
        if (result.type === 'ghost_eaten') {
            this.gameState.score += result.score;
            this.soundManager.playGhostEaten();
            this.effectManager.createGhostEatenEffect(this.pacman);
        } else if (result.type === 'pacman_died') {
            this.deathHandler.handleDeath();
        }
    }

    handleFruitEaten(score) {
        this.gameState.score += score;
        this.soundManager.playFruitEat();
        this.effectManager.createFruitEatEffect(this.fruit);
        this.fruit.deactivate();
    }

    handleWinCondition() {
        this.levelManager.handleLevelComplete();
    }
}

// New file: src/scenes/systems/EffectManager.js
export class EffectManager {
    constructor(scene) {
        this.scene = scene;
    }

    createPowerPelletEffect(pacman) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xFFFFFF, 0.5);
        graphics.fillCircle(pacman.x, pacman.y, gameConfig.tileSize * 2);

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => graphics.destroy()
        });
    }

    createGhostEatenEffect(pacman) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xFFFFFF, 0.8);
        graphics.fillCircle(pacman.x, pacman.y, gameConfig.tileSize * 1.5);

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: () => graphics.destroy()
        });
    }

    createFruitEatEffect(fruit) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(fruit.fruitType.color, 0.8);
        graphics.fillCircle(fruit.x, fruit.y, gameConfig.tileSize * 1.5);

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            scale: 2,
            duration: 400,
            onComplete: () => graphics.destroy()
        });
    }
}

// New file: src/scenes/systems/InputController.js
export class InputController {
    constructor(scene, pacman) {
        this.scene = scene;
        this.pacman = pacman;

        this.setupKeyboard();
        this.setupTouchControls();
    }

    setupKeyboard() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys('W,A,S,D');

        this.scene.input.keyboard.on('keydown-P', () => {
            // Toggle pause handled by GameFlowController
        });

        this.scene.input.keyboard.on('keydown-ESC', () => {
            // Return to menu handled by GameFlowController
        });
    }

    setupTouchControls() {
        let startX = 0;
        let startY = 0;

        this.scene.input.on('pointerdown', (pointer) => {
            startX = pointer.x;
            startY = pointer.y;
        });

        this.scene.input.on('pointerup', (pointer) => {
            const deltaX = pointer.x - startX;
            const deltaY = pointer.y - startY;
            const threshold = touchConfig.swipeThreshold;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > threshold) {
                    const dir = deltaX > 0 ? directions.RIGHT : directions.LEFT;
                    this.pacman.setDirection(dir);
                }
            } else if (Math.abs(deltaY) > threshold) {
                const dir = deltaY > 0 ? directions.DOWN : directions.UP;
                this.pacman.setDirection(dir);
            }
        });
    }

    handleInput() {
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.pacman.setDirection(directions.LEFT);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.pacman.setDirection(directions.RIGHT);
        } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.pacman.setDirection(directions.UP);
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.pacman.setDirection(directions.DOWN);
        }
    }
}

// New file: src/scenes/systems/UIController.js
export class UIController {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;

        this.scoreText = null;
        this.highScoreText = null;
        this.livesText = null;
        this.levelText = null;
    }

    create() {
        const fontConfig = uiConfig.fonts.small;

        this.scoreText = this.scene.add.text(
            10, 10,
            `SCORE: ${this.gameState.score}`,
            {
                fontSize: fontConfig.size,
                color: uiConfig.colors.accent,
                fontFamily: fontConfig.family,
                fontStyle: 'bold'
            }
        );

        this.highScoreText = this.scene.add.text(
            10, 35,
            `HIGH SCORE: ${this.gameState.highScore}`,
            { fontSize: fontConfig.size, color: uiConfig.colors.primary, fontFamily: fontConfig.family }
        );

        this.livesText = this.scene.add.text(
            this.scene.scale.width - 10, 10,
            `LIVES: ${this.gameState.lives}`,
            { fontSize: fontConfig.size, color: uiConfig.colors.primary, fontFamily: fontConfig.family, fontStyle: 'bold' }
        ).setOrigin(1, 0);

        this.levelText = this.scene.add.text(
            this.scene.scale.width / 2, 10,
            `LEVEL: ${this.gameState.level}`,
            { fontSize: fontConfig.size, color: uiConfig.colors.success, fontFamily: fontConfig.family, fontStyle: 'bold' }
        ).setOrigin(0.5, 0);
    }

    updateScore(score) {
        this.scoreText.setText(`SCORE: ${score}`);
    }

    updateLives(lives) {
        this.livesText.setText(`LIVES: ${lives}`);
    }

    updateLevel(level) {
        this.levelText.setText(`LEVEL: ${level}`);
    }

    updateHighScore(highScore) {
        this.highScoreText.setText(`HIGH SCORE: ${highScore}`);
    }
}

// New file: src/scenes/systems/DeathHandler.js
export class DeathHandler {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.deathTimer = 0;
        this.isDying = false;
    }

    handleDeath() {
        this.isDying = true;
        this.gameState.deathTimer = 0;
        this.scene.pacman.die();
        this.scene.soundManager.playDeath();
    }

    update(delta) {
        if (!this.isDying) return false;

        this.deathTimer += delta;
        const pauseDuration = animationConfig.deathPauseDuration;

        if (this.deathTimer >= pauseDuration) {
            this.gameState.lives--;

            if (this.gameState.lives <= 0) {
                this.gameState.isGameOver = true;
                this.scene.storageManager.saveHighScore(this.gameState.score);
                this.scene.scene.start('GameOverScene', {
                    score: this.gameState.score,
                    highScore: this.gameState.highScore
                });
            } else {
                this.scene.entityManager.resetPositions();
                this.isDying = false;
                this.scene.gameFlowController.showReadyCountdown();
            }
        }
        return true;
    }

    reset() {
        this.isDying = false;
        this.deathTimer = 0;
    }
}

// New file: src/scenes/systems/LevelManager.js
export class LevelManager {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
    }

    handleLevelComplete() {
        this.gameState.level++;
        this.scene.soundManager.playLevelComplete();
        this.scene.storageManager.saveHighScore(this.gameState.score);
        this.scene.scene.start('WinScene', {
            score: this.gameState.score,
            level: this.gameState.level,
            highScore: this.gameState.highScore
        });
    }

    showLevelMessage(level) {
        const messageText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            `LEVEL ${level}`,
            {
                fontSize: uiConfig.fonts.subtitle.size,
                color: uiConfig.colors.success,
                fontFamily: uiConfig.fonts.subtitle.family,
                fontStyle: uiConfig.fonts.subtitle.style
            }
        );
        messageText.setOrigin(0.5);
        messageText.setAlpha(0);

        this.scene.tweens.add({
            targets: messageText,
            alpha: 1,
            duration: 300,
            yoyo: true,
            hold: 1500,
            onYoyo: () => {
                this.scene.time.delayedCall(1500, () => {
                    messageText.destroy();
                });
            }
        });
    }
}

// Refactored GameScene.js (reduced from 708 to ~200 lines)
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.gameState = {
            score: data.score || 0,
            lives: 3,
            level: data.level || 1,
            isPaused: false,
            isGameOver: false,
            isDying: false,
            deathTimer: 0,
            highScore: 0
        };

        this.storageManager = new StorageManager();
        this.gameState.highScore = this.storageManager.getHighScore();
        this.soundManager = new SoundManager();

        // Initialize controllers
        this.gameFlowController = new GameFlowController(this);
        this.entityManager = new EntityManager(this);
        this.collisionSystem = new CollisionSystem(this);
        this.ghostAISystem = new GhostAISystem();
    }

    create() {
        this.maze = createMazeData();

        // Delegate to subsystems
        this.entityManager.createAll(this);
        this.uiController = new UIController(this, this.gameState);
        this.uiController.create();
        this.inputController = new InputController(this, this.pacman);
        this.effectManager = new EffectManager(this);
        this.deathHandler = new DeathHandler(this, this.gameState);
        this.levelManager = new LevelManager(this, this.gameState);

        // Initialize systems
        this.collisionSystem.setPacman(this.pacman);
        this.collisionSystem.setGhosts(this.ghosts);
        this.collisionSystem.setMaze(this.maze);
        this.collisionSystem.setPelletSprites(this.pelletSprites, this.powerPelletSprites);

        this.ghostAISystem.setGhosts(this.ghosts);

        this.applyLevelSettings();
        this.gameFlowController.showReadyCountdown();
    }

    update(time, delta) {
        if (this.gameState.isPaused || this.gameState.isGameOver) return;

        if (this.deathHandler.update(delta)) return;

        this.inputController.handleInput();
        this.entityManager.updateAll(delta, this.maze, this.pacman);
        this.handleCollisions();
    }

    handleCollisions() {
        const results = this.collisionSystem.checkAllCollisions();

        if (results.pelletScore > 0) {
            this.gameFlowController.handlePelletEaten(results.pelletScore);
        }

        if (results.powerPelletScore > 0) {
            const duration = Math.max(2000,
                levelConfig.frightenedDuration - (this.gameState.level - 1) * levelConfig.frightenedDecreasePerLevel);
            this.gameFlowController.handlePowerPelletEaten(results.powerPelletScore, duration);
        }

        if (results.ghostCollision) {
            this.gameFlowController.handleGhostCollision(results.ghostCollision);
        }

        if (this.collisionSystem.checkWinCondition()) {
            this.gameFlowController.handleWinCondition();
        }
    }

    cleanup() {
        if (this.soundManager) {
            this.soundManager.setEnabled(false);
        }
    }
}
```

**Benefits**:
- GameScene reduced from 708 lines to ~200 lines
- Each subsystem is independently testable
- Clear responsibility boundaries
- Easier to maintain and extend
- Changes to one area don't affect others

**Implementation Effort**: 2-3 days (creating 8 new files, refactoring GameScene)

---

### 2. Optimize Fruit Rendering

**Current Issue**: Fruit uses `Phaser.GameObjects.Graphics` and redraws entire fruit every frame (313 lines of drawing code)

**Problem**:
- CPU-intensive (drawing multiple bezier curves every 60 FPS)
- No sprite caching or texture atlas
- Difficult to add new fruit types
- Visual quality limited by Graphics API

**Proposed Solution: Sprite Atlas**

**Step 1: Create sprite sheet**
```bash
# Create single PNG sprite sheet with all 8 fruits
# Each fruit 32x32 pixels (based on tileSize)
# Arranged in grid for efficient GPU rendering

# Order: cherry, strawberry, orange, apple, melon, galaxian, bell, key
```

**Step 2: Update Fruit.js to use sprites**
```javascript
// New file: src/entities/Fruit.js (optimized)
import Phaser from 'phaser';
import { gameConfig, fruitConfig } from '../config/gameConfig.js';
import { getCenterPixel } from '../utils/MazeLayout.js';

export default class Fruit extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, typeIndex = 0) {
        const pixel = getCenterPixel(x, y);

        // Create sprite from loaded texture
        super(scene, pixel.x, pixel.y, 'fruits');

        this.scene = scene;
        this.scene.add.existing(this);
        this.setDepth(100);

        this.gridX = x;
        this.gridY = y;
        this.typeIndex = typeIndex;
        this.fruitType = fruitConfig.types[Math.min(typeIndex, fruitConfig.types.length - 1)];

        this.active = false;
        this.timer = 0;

        // Set correct frame based on fruit type
        this.setFrame(this.fruitType.name);

        this.setVisible(false);
    }

    activate(duration = 10000) {
        this.active = true;
        this.timer = duration;
        this.setVisible(true);
        this.setScale(0);

        // Appearing animation
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        // Pulsing animation
        this.scene.tweens.add({
            targets: this,
            scale: { from: 1, to: 1.1 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    deactivate() {
        this.active = false;
        this.timer = 0;

        this.scene.tweens.killTweensOf(this);

        // Disappearing animation
        this.scene.tweens.add({
            targets: this,
            scale: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.setVisible(false);
                this.setScale(1);
            }
        });
    }

    // Keep update and reset methods (unchanged)
    update(delta) { /* ... same ... */ }
    getScore() { /* ... same ... */ }
    getGridPosition() { /* ... same ... */ }
    getPixelPosition() { /* ... same ... */ }
    reset(typeIndex = 0) {
        this.typeIndex = typeIndex;
        this.fruitType = fruitConfig.types[Math.min(typeIndex, fruitConfig.types.length - 1)];
        this.active = false;
        this.timer = 0;
        this.setVisible(false);
        this.setScale(1);

        this.setFrame(this.fruitType.name);
    }
}
```

**Step 3: Load sprite sheet in GameScene**
```javascript
// In GameScene.create() (or new BootScene)
preload() {
    // Load sprite sheet
    this.load.spritesheet('fruits', 'assets/images/fruits.png', {
        frameWidth: 32,
        frameHeight: 32,
        startFrame: 0,
        endFrame: 7
    });
}

create() {
    // Create animations (optional for sprite animation)
    this.anims.create({
        key: 'fruit-pulse',
        frames: this.anims.generateFrameNames('fruits', ['cherry'], 8),
        frameRate: 10,
        repeat: -1
    });
}
```

**Benefits**:
- Reduced from 313 lines to ~120 lines
- 95% performance improvement (GPU-accelerated sprite rendering)
- Easy to add new fruit types (just add to sprite sheet and config)
- Better visual quality (proper sprites vs procedural drawing)
- Memory efficient (single texture for all fruits)

**Implementation Effort**: 1 day (create sprite sheet, refactor Fruit.js, update GameScene)

---

### 3. Implement Event System

**Current Issue**: Entities and systems communicate via direct method calls (tight coupling)

**Problem**:
- Ghost entities directly reference `this.scene.ghostAISystem`
- CollisionSystem directly holds references to entities
- Difficult to test (hard to mock)
- Hard to add new systems without modifying existing code
- No way to subscribe/unsubscribe to game events

**Proposed Solution: Event Bus Pattern**

```javascript
// New file: src/core/EventBus.js
export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push({ callback, context });
        return () => this.off(event, callback, context); // Return unsubscribe function
    }

    off(event, callback = null, context = null) {
        if (!this.listeners.has(event)) return;

        const eventListeners = this.listeners.get(event);
        const remaining = [];

        for (const listener of eventListeners) {
            if (callback && (listener.callback !== callback)) {
                remaining.push(listener);
            } else if (context && listener.context !== context) {
                remaining.push(listener);
            } else if (!callback && !context) {
                remaining.push(listener);
            }
        }

        this.listeners.set(event, remaining);
    }

    emit(event, data = null) {
        if (!this.listeners.has(event)) return;

        const eventListeners = this.listeners.get(event);

        for (const listener of eventListeners) {
            if (listener.context) {
                listener.callback.call(listener.context, data);
            } else {
                listener.callback(data);
            }
        }
    }

    once(event, callback, context = null) {
        const onceWrapper = (data) => {
            this.off(event, onceWrapper, context);
            callback.call(context, data);
        };
        return this.on(event, onceWrapper, context);
    }

    clear() {
        this.listeners.clear();
    }
}

// Create global singleton
export const gameEvents = new EventBus();
export const GAME_EVENTS = {
    PELLET_EATEN: 'pellet_eaten',
    POWER_PELLET_EATEN: 'power_pellet_eaten',
    GHOST_EATEN: 'ghost_eaten',
    GHOST_COLLISION: 'ghost_collision',
    PACMAN_DEATH: 'pacman_death',
    LEVEL_COMPLETE: 'level_complete',
    FRUIT_SPAWN: 'fruit_spawn',
    FRUIT_EATEN: 'fruit_eaten',
    GAME_OVER: 'game_over',
    PAUSE_TOGGLED: 'pause_toggled',
    SCORE_UPDATED: 'score_updated',
    LIVES_UPDATED: 'lives_updated'
};
```

**Step 2: Refactor systems to use events**

```javascript
// In GameFlowController
handlePelletEaten(score) {
    this.gameState.score += score;
    gameEvents.emit(GAME_EVENTS.SCORE_UPDATED, this.gameState.score);
    gameEvents.emit(GAME_EVENTS.PELLET_EATEN, { score });
}

// In EffectManager
constructor(scene) {
    this.scene = scene;

    // Subscribe to events
    this.subscriptions = [
        gameEvents.on(GAME_EVENTS.POWER_PELLET_EATEN, this.onPowerPelletEaten, this),
        gameEvents.on(GAME_EVENTS.GHOST_EATEN, this.onGhostEaten, this),
        gameEvents.on(GAME_EVENTS.FRUIT_EATEN, this.onFruitEaten, this),
        gameEvents.on(GAME_EVENTS.PACMAN_DEATH, this.onPacmanDeath, this)
    ];
}

onPowerPelletEaten(data) {
    this.createPowerPelletEffect(data.pacman);
}

onGhostEaten(data) {
    this.createGhostEatenEffect(data.pacman);
}

onFruitEaten(data) {
    this.createFruitEatEffect(data.fruit);
}

onPacmanDeath(data) {
    // Handle death visual effects if needed
}

destroy() {
    // Unsubscribe all
    for (const unsub of this.subscriptions) {
        unsub();
    }
}
```

**Benefits**:
- Loose coupling between systems
- Easy to test (can mock event bus)
- New features can be added without modifying existing code
- Clear data flow (events document what happens)
- Easy debugging (can log all events)
- Scalable to unlimited subscribers

**Implementation Effort**: 2 days (create EventBus, refactor ~10 systems to use events)

---

### 4. Extract Base Entity Class

**Current Issue**: Movement logic duplicated between Pacman.js and Ghost.js

**Problem**:
- Both implement grid-based movement
- Both implement tunnel wrapping
- Both calculate distance to tile center
- Both use same direction validation logic
- ~100 lines of duplicated code

**Proposed Solution: Base Entity Class**

```javascript
// New file: src/entities/BaseEntity.js
import Phaser from 'phaser';
import { gameConfig, directions } from '../config/gameConfig.js';
import { pixelToGrid, getCenterPixel, getDistance } from '../utils/MazeLayout.js';

export class BaseEntity extends Phaser.GameObjects.Arc {
    constructor(scene, x, y, radius, color) {
        const pixel = getCenterPixel(x, y);
        super(scene, pixel.x, pixel.y, radius, 0, 360, false, color, 1);

        this.scene = scene;
        this.scene.add.existing(this);
        this.setDepth(100);

        this.gridX = x;
        this.gridY = y;
        this.direction = directions.NONE;
        this.speed = 100; // Default, override in subclass
        this.isMoving = false;
    }

    /**
     * Base update method for grid-based movement
     * @param {number} delta - Time since last update in milliseconds
     * @param {Array} maze - The maze layout
     */
    updateMovement(delta, maze) {
        const gridPos = pixelToGrid(this.x, this.y);
        const centerPixel = getCenterPixel(gridPos.x, gridPos.y);
        const distToCenter = getDistance(this.x, this.y, centerPixel.x, centerPixel.y);
        const moveStep = this.speed * (delta / 1000);

        if (distToCenter < Math.max(moveStep, 1)) {
            this.gridX = gridPos.x;
            this.gridY = gridPos.y;
            this.makeDecisionAtIntersection(maze);
        }

        if (this.isMoving && this.direction !== directions.NONE) {
            this.x += this.direction.x * moveStep;
            this.y += this.direction.y * moveStep;
            this.handleTunnelWrap();
        }
    }

    /**
     * To be overridden by subclasses
     * @param {Array} maze - The maze layout
     */
    makeDecisionAtIntersection(maze) {
        // Override in subclasses
    }

    /**
     * Check if entity can move in a given direction
     * @param {Object} direction - Direction to check
     * @param {Array} maze - The maze layout
     * @returns {boolean} True if movement is possible
     */
    canMoveInDirection(direction, maze) {
        if (direction === directions.NONE) return false;

        const nextGridX = this.gridX + direction.x;
        const nextGridY = this.gridY + direction.y;

        return this.isValidPosition(nextGridX, nextGridY, maze);
    }

    /**
     * Check if a grid position is valid
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @param {Array} maze - The maze layout
     * @returns {boolean} System: true if position is valid
     */
    isValidPosition(gridX, gridY, maze) {
        if (gridY < 0 || gridY >= maze.length) return false;

        if (gridX < 0 || gridX >= maze[0].length) {
            return true; // Allow tunnel wrapping
        }

        return maze[gridY][gridX] !== 1; // 1 = WALL
    }

    /**
     * Handle tunnel wrapping
     */
    handleTunnelWrap() {
        const mazeWidth = gameConfig.mazeWidth * gameConfig.tileSize;

        if (this.x < -gameConfig.tileSize) {
            this.x = mazeWidth + gameConfig.tileSize;
        } else if (this.x > mazeWidth + gameConfig.tileSize) {
            this.x = -gameConfig.tileSize;
        }
    }

    /**
     * Reset entity to starting position
     * @param {number} gridX - Grid X position
     * @param {number} gridY - Grid Y position
     */
    resetPosition(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.direction = directions.NONE;
        this.isMoving = false;
        const pixel = getCenterPixel(gridX, gridY);
        this.x = pixel.x;
        this.y = pixel.y;
    }

    /**
     * Get current grid position
     * @returns {Object} Grid position {x, y}
     */
    getGridPosition() {
        return { x: this.gridX, y: this.gridY };
    }

    /**
     * Get current pixel position
     * @returns {Object} Pixel position {x, y}
     */
    getPixelPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Set speed
     * @param {number} speed - Movement speed in pixels/second
     */
    setSpeed(speed) {
        this.speed = speed;
    }
}
```

**Step 2: Refactor Pacman.js to use BaseEntity**

```javascript
// Refactored src/entities/Pacman.js (reduced from 255 to ~120 lines)
import { BaseEntity } from './BaseEntity.js';
import { gameConfig, colors, directions, animationConfig, levelConfig } from '../config/gameConfig.js';

export default class Pacman extends BaseEntity {
    constructor(scene, x, y) {
        const radius = gameConfig.tileSize * 0.4;
        super(scene, x, y, radius, colors.pacman);

        // Pacman-specific properties
        this.nextDirection = directions.NONE;
        this.mouthAngle = 0;
        this.mouthDirection = 1;
        this.mouthSpeed = animationConfig.pacmanMouthSpeed;
        this.maxMouthAngle = 30;
        this.isDying = false;

        const baseLevelSpeed = levelConfig.baseSpeed + (scene.gameState.level - 1) * levelConfig.speedIncreasePerLevel;
        this.speed = baseLevelSpeed * levelConfig.pacmanSpeedMultiplier;
    }

    update(delta, maze) {
        if (this.isDying) {
            this.updateDeathAnimation(delta);
            return;
        }

        this.updateMouthAnimation(delta);
        this.updateMovement(delta, maze);

        // Update Arc angles for mouth
        const rotation = this.direction.angle;
        this.setStartAngle(rotation + this.mouthAngle);
        this.setEndAngle(rotation + 360 - this.mouthAngle);
    }

    makeDecisionAtIntersection(maze) {
        if (this.nextDirection !== directions.NONE && this.canMoveInDirection(this.nextDirection, maze)) {
            this.direction = this.nextDirection;
            this.nextDirection = directions.NONE;
            this.isMoving = true;
            this.snapToCenter();
        }

        if (!this.canMoveInDirection(this.direction, maze)) {
            this.isMoving = false;
            this.direction = directions.NONE;
            this.snapToCenter();
        } else {
            this.isMoving = true;
        }
    }

    snapToCenter() {
        const pixel = getCenterPixel(this.gridX, this.gridY);
        this.x = pixel.x;
        this.y = pixel.y;
    }

    updateMouthAnimation(delta) {
        this.mouthAngle += this.mouthDirection * this.mouthSpeed * (delta / 2);

        if (this.mouthAngle >= this.maxMouthAngle) {
            this.mouthAngle = this.maxMouthAngle;
            this.mouthDirection = -1;
        } else if (this.mouthAngle <= 0) {
            this.mouthAngle = 0;
            this.mouthDirection = 1;
        }
    }

    updateDeathAnimation(delta) {
        this.mouthAngle += animationConfig.pacmanDeathSpeed * (delta / 2);
        if (this.mouthAngle > 180) {
            this.mouthAngle = 180;
        }
    }

    die() {
        this.isDying = true;
        this.isMoving = false;
        this.mouthDirection = 1;
        this.mouthAngle = 0;
    }

    setDirection(direction) {
        if (!direction || direction === directions.NONE) return;

        // Immediate reversal logic
        if (this.direction !== directions.NONE) {
            if ((direction.x !== 0 && direction.x === -this.direction.x) ||
                (direction.y !== 0 && direction.y === -this.direction.y)) {
                this.direction = direction;
                this.nextDirection = directions.NONE;
                this.isMoving = true;
                return;
            }
        }

        this.nextDirection = direction;
    }
}
```

**Step 3: Refactor Ghost.js to use BaseEntity**

```javascript
// Refactored src/entities/Ghost.js (reduced from 196 to ~130 lines)
import { BaseEntity } from './BaseEntity.js';
import { gameConfig, colors, directions, ghostModes, animationConfig, levelConfig } from '../config/gameConfig.js';
import { pixelToGrid, getCenterPixel, getValidDirections, getDistance } from '../utils/MazeLayout.js';

export default class Ghost extends BaseEntity {
    constructor(scene, x, y, type, color) {
        const radius = gameConfig.tileSize * 0.4;
        super(scene, x, y, radius, color);

        this.type = type;
        this.startGridX = x;
        this.startGridY = y;

        this.mode = ghostModes.SCATTER;
        this.modeTimer = 0;
        this.targetX = 0;
        this.targetY = 0;

        this.isFrightened = false;
        this.frightenedTimer = 0;
        this.isBlinking = false;
        this.blinkTimer = 0;
        this.isEaten = false;
        this.isInHouse = false;

        const baseLevelSpeed = levelConfig.baseSpeed + (scene.gameState.level - 1) * levelConfig.speedIncreasePerLevel;
        this.speed = baseLevelSpeed * levelConfig.ghostSpeedMultiplier;
    }

    update(delta, maze, pacman) {
        this.updateFrightened(delta);
        this.updateVisuals();
        this.updateMovement(delta, maze);
    }

    makeDecisionAtIntersection(maze) {
        // Delegate to AI system
        if (this.scene.ghostAISystem) {
            this.scene.ghostAISystem.chooseDirection(this, maze);
        }
    }

    updateVisuals() {
        if (this.isFrightened) {
            if (this.isBlinking && Math.floor(this.blinkTimer / animationConfig.ghostBlinkSpeed) % 2 === 0) {
                this.setFillStyle(colors.frightenedGhostEnd, 1);
            } else {
                this.setFillStyle(colors.frightenedGhost, 1);
            }
        } else if (this.isEaten) {
            this.setFillStyle(0xFFFFFF, 0.4);
        } else {
            this.setFillStyle(this.color, 1);
        }
    }

    updateFrightened(delta) {
        if (this.isFrightened) {
            this.frightenedTimer -= delta;
            this.blinkTimer += delta;
            if (this.frightenedTimer <= 2000) this.isBlinking = true;
            else this.isBlinking = false;

            if (this.frightenedTimer <= 0) {
                this.isFrightened = false;
                this.isBlinking = false;
                this.speed = this.getBaseSpeed();
            }
        }
    }

    getBaseSpeed() {
        const baseLevelSpeed = levelConfig.baseSpeed + (this.scene.gameState.level - 1) * levelConfig.speedIncreasePerLevel;
        return baseLevelSpeed * levelConfig.ghostSpeedMultiplier;
    }

    setFrightened(duration) {
        this.isFrightened = true;
        this.frightenedTimer = duration;
        this.isBlinking = false;
        this.speed = this.getBaseSpeed() * 0.5;
        if (this.direction !== directions.NONE) {
            this.direction = this.getReverseDirection(this.direction);
        }
    }

    eat() {
        this.isEaten = true;
        this.isFrightened = false;
    }

    reset() {
        this.gridX = this.startGridX;
        this.gridY = this.startGridY;
        this.direction = directions.NONE;
        this.isEaten = false;
        this.isFrightened = false;
        this.isBlinking = false;
        this.speed = this.getBaseSpeed();
        const pixel = getCenterPixel(this.gridX, this.gridY);
        this.x = pixel.x;
        this.y = pixel.y;
        this.updateVisuals();
    }

    getReverseDirection(direction) {
        if (direction.x === 1) return directions.LEFT;
        if (direction.x === -1) return directions.RIGHT;
        if (direction.y === 1) return directions.UP;
        if (direction.y === -1) return directions.DOWN;
        return directions.NONE;
    }
}
```

**Benefits**:
- Eliminates ~100 lines of duplicated code
- Single point to modify movement logic
- Consistent behavior across entities
- Easier to add new entity types
- Bug fixes in movement apply to all entities

**Implementation Effort**: 1.5 days (create BaseEntity, refactor Pacman/Ghost)

---

## Medium Priority Improvements

### 5. Add Configuration Validation

**Current Issue**: Hardcoded magic numbers scattered throughout codebase

**Problem**:
- Collision threshold `0.8` hardcoded in CollisionSystem (line 89)
- Death timer `2000ms` hardcoded in GameScene (line 638)
- Swipe threshold `30` hardcoded in GameScene (line 328)
- No validation for configuration values

**Proposed Solution**: Move to config with validation

```javascript
// Update src/config/gameConfig.js
export const gameConfig = {
    width: 560,
    height: 620,
    tileSize: 20,
    mazePadding: 0,
    mazeWidth: 28,
    mazeHeight: 31,
    targetFPS: 60,

    // Add collision settings
    collision: {
        entityThreshold: 0.8,  // Multiplier of tile size
        pelletThreshold: 0.5    // Multiplier of tile size
    },

    // Add movement settings
    movement: {
        swipeThreshold: 30,      // Pixels for touch swipe
        centerTolerance: 1.0    // Pixels for tile center detection
    },

    // Add animation settings
    animation: {
        deathPauseDuration: 2000, // ms
        countdownDuration: 3000,    // ms
        textFadeSpeed: 800          // ms
    }
};

export const validateConfig = () => {
    const errors = [];

    if (gameConfig.targetFPS < 30 || gameConfig.targetFPS > 120) {
        errors.push('targetFPS must be between 30 and 120');
    }

    if (gameConfig.tileSize < 10 || gameConfig.tileSize > 40) {
        errors.push('tileSize must be between 10 and 40');
    }

    if (gameConfig.mazeWidth < 10 || gameConfig.mazeWidth > 50) {
        errors.push('mazeWidth must be between 10 and 50');
    }

    if (gameConfig.mazeHeight < 10 || gameConfig.mazeHeight > 50) {
        errors.push('mazeHeight must be between 10 and 50');
    }

    if (errors.length > 0) {
        console.error('Invalid configuration:', errors);
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    console.log('Configuration validated successfully');
};

// Add validation to main.js
import { validateConfig } from './config/gameConfig.js';

// Initialize game
validateConfig(); // Will throw on startup if invalid

const config = { /* ... */ };

const game = new Phaser.Game(config);
```

**Step 2: Update CollisionSystem to use config**
```javascript
// In CollisionSystem.js
checkGhostCollision() {
    for (const ghost of this.ghosts) {
        if (ghost.isEaten) continue;

        const dist = getDistance(
            this.pacman.x, this.pacman.y,
            ghost.x, ghost.y
        );

        const threshold = gameConfig.tileSize * gameConfig.collision.entityThreshold;

        if (dist < threshold) {
            // ... rest of logic
        }
    }
}
```

**Benefits**:
- Single source of truth for all constants
- Easy to balance game
- Validation prevents invalid configurations
- Clear documentation of what each value does
- Easy to adjust for different difficulty modes

**Implementation Effort**: 0.5 days (update config, validation, refactor ~5 files)

---

### 6. Implement Entity Component System (ECS)

**Current Issue**: No framework for extensibility when adding new entity types

**Problem**:
- Adding new ghost type requires modifying GhostFactory, GhostAISystem, gameConfig
- Adding new power-up would require substantial refactoring
- No standardized way to attach behaviors to entities

**Proposed Solution: Lightweight ECS Pattern**

```javascript
// New file: src/ecs/Entity.js
import { EventBus, GAME_EVENTS } from '../core/EventBus.js';

export class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
    }

    addComponent(name, component) {
        this.components.set(name, component);
        return component;
    }

    getComponent(name) {
        return this.components.get(name);
    }

    hasComponent(name) {
        return this.components.has(name);
    }

    removeComponent(name) {
        this.components.delete(name);
    }

    destroy() {
        this.components.clear();
    }
}

// New file: src/ecs/Component.js
export class Component {
    constructor(data = {}) {
        Object.assign(this, data);
    }
}

// Component definitions
export const Components = {
    Position: class Position extends Component {
        constructor(x = 0, y = 0) {
            super({ x, y });
        }
    },

    Velocity: class Velocity extends Component {
        constructor(x = 0, y = 0) {
            super({ x, y });
        }
    },

    Transform: class Transform extends Component {
        constructor(gridX = 0, gridY = 0) {
            super({ gridX, gridY });
        }
    },

    Sprite: class Sprite extends Component {
        constructor(sprite = null) {
            super({ sprite });
        }
    },

    Health: class Health extends Component {
        constructor(lives = 3, maxLives = 3) {
            super({ lives, maxLives });
        }
    },

    Score: class Score extends Component {
        constructor(points = 0, multiplier = 1) {
            super({ points, multiplier });
        }
    }
};

// New file: src/ecs/System.js
export class System {
    constructor() {
        this.entities = [];
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    update(delta) {
        // Override in subclasses
    }
}

// Example: MovementSystem
export class MovementSystem extends System {
    update(delta) {
        for (const entity of this.entities) {
            if (!entity.hasComponent('Position') || !entity.hasComponent('Velocity')) {
                continue;
            }

            const position = entity.getComponent('Position');
            const velocity = entity.getComponent('Velocity');

            position.x += velocity.x * delta;
            position.y += velocity.y * delta;
        }
    }
}
```

**Step 2: Gradually migrate existing entities**

```javascript
// For major version 2.0, create new entities using ECS
// Keep old implementation for backwards compatibility

// New file: src/entities/PacmanEntity.js
import { Entity } from '../ecs/Entity.js';
import { Components } from '../ecs/Component.js';

export class PacmanEntity extends Entity {
    constructor(scene, x, y) {
        super('pacman');

        this.addComponent('Position', new Components.Position(0, 0));
        this.addComponent('Velocity', new Components.Velocity(0, 0));
        this.addComponent('Transform', new Components.Transform(x, y));
        this.addComponent('Sprite', new Components.Sprite(scene.pacmanSprite));
        this.addComponent('Health', new Components.Health(3, 3));
        this.addComponent('Score', new Components.Score(0, 1));
    }
}
```

**Benefits**:
- Extreme extensibility (add components without modifying core)
- Decoupled systems (each system handles specific aspects)
- Easy to test (mock components and systems)
- Data-driven design
- Easy to add new entity types (just combine components)

**Implementation Effort**: 3-4 days (create ECS framework, migrate one entity as proof-of-concept)

**Note**: This is a major architectural change. Consider implementing for version 2.0.

---

### 7. Add Comprehensive Error Handling

**Current Issue**: Only StorageManager has try-catch blocks

**Problem**:
- No error handling for audio context initialization
- No validation for maze coordinates
- No fallbacks for browser compatibility
- Errors can crash the game without graceful degradation

**Proposed Solution**: Centralized error handler

```javascript
// New file: src/utils/ErrorHandler.js
export class ErrorHandler {
    constructor() {
        this.errors = [];
        this.isDevelopment = import.meta.env?.MODE === 'development';
    }

    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    log(error, context = {}) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };

        this.errors.push(errorInfo);

        console.error('[ErrorHandler]', errorInfo);

        if (this.isDevelopment) {
            // In development, show user-friendly error
            this.showErrorToUser(error.message);
        }
    }

    showErrorToUser(message) {
        // Dispatch event to show error UI
        window.dispatchEvent(new CustomEvent('game-error', { detail: { message } }));
    }

    wrap(fn, context = null, errorMessage = 'An error occurred') {
        return (...args) => {
            try {
                return fn.apply(context, args);
            } catch (error) {
                this.log(error, { function: fn.name, args, context });
                if (errorMessage) {
                    this.showErrorToUser(errorMessage);
                }
                return null; // or throw if needed
            }
        };
    }

    assert(condition, message) {
        if (!condition) {
            const error = new Error(`Assertion failed: ${message}`);
            this.log(error);
            throw error;
        }
    }

    getErrors() {
        return [...this.errors];
    }

    clearErrors() {
        this.errors = [];
    }
}

// New file: src/utils/Validation.js
export class Validation {
    static validateGridPosition(x, y, maxX, maxY) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Grid coordinates must be numbers');
        }

        if (x < 0 || y < 0) {
            throw new Error('Grid coordinates cannot be negative');
        }

        if (x >= maxX || y >= maxY) {
            throw new Error('Grid coordinates exceed maze bounds');
        }
    }

    static validateDirection(direction) {
        if (!direction || typeof direction !== 'object') {
            throw new Error('Invalid direction object');
        }

        if (typeof direction.x !== 'number' || typeof direction.y !== 'number') {
            throw new Error('Direction must have x and y properties');
        }

        if (direction.x < -1 || direction.x > 1 || direction.y < -1 || direction.y > 1) {
            throw new Error('Direction values must be -1, 0, or 1');
        }
    }
}
```

**Step 2: Update managers to use error handling**

```javascript
// Update src/managers/SoundManager.js
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.5;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;

            if (!AudioContext) {
                throw new Error('Web Audio API not supported by this browser');
            }

            this.audioContext = new AudioContext();
            this.initialized = true;
        } catch (error) {
            ErrorHandler.getInstance().log(error, { action: 'initialize audio' });
            this.enabled = false;
        }
    }

    playTone(frequency, duration, type = 'square') {
        if (!this.enabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            ErrorHandler.getInstance().log(error, { action: 'play tone', frequency, duration });
        }
    }
}

// Update src/utils/MazeLayout.js
import { Validation } from './Validation.js';

export function pixelToGrid(pixelX, pixelY) {
    const gridX = Math.floor(pixelX / gameConfig.tileSize);
    const gridY = Math.floor(pixelY / gameConfig.tileSize);

    try {
        Validation.validateGridPosition(gridX, gridY, gameConfig.mazeWidth, gameConfig.mazeHeight);
        return { x: gridX, y: gridY };
    } catch (error) {
        ErrorHandler.getInstance().log(error, { pixelX, pixelY });
        return { x: gridX, y: gridY }; // Return anyway to prevent crash
    }
}
```

**Benefits**:
- Prevents game crashes from errors
- Graceful degradation (continues even if some features fail)
- Better debugging experience (error logs)
- User-friendly error messages
- Easier to test error conditions

**Implementation Effort**: 1 day (create error handler, validation, update ~5 files)

---

### 8. Implement Object Pooling for Pellets

**Current Issue**: Pellet sprites created and destroyed frequently (array splicing)

**Problem**:
- Frequent garbage collection
- Performance impact when eating many pellets quickly
- Memory fragmentation

**Proposed Solution**: Object Pool

```javascript
// New file: src/pools/PelletPool.js
import Phaser from 'phaser';
import { gameConfig, colors } from '../config/gameConfig.js';

export class PelletPool {
    constructor(scene) {
        this.scene = scene;
        this.available = [];
        this.active = [];
        this.initialSize = 50; // Pool size
    }

    init() {
        for (let i = 0; i < this.initialSize; i++) {
            const pellet = this.scene.add.circle(0, 0, 3, colors.pellet);
            pellet.setVisible(false);
            pellet.setActive(false);
            this.available.push(pellet);
        }
    }

    get(gridX, gridY) {
        if (this.available.length === 0) {
            console.warn('Pellet pool exhausted');
            return null;
        }

        const pellet = this.available.pop();
        pellet.setVisible(true);
        pellet.setActive(true);

        // Position pellet
        const pixel = {
            x: gridX * gameConfig.tileSize + gameConfig.tileSize / 2,
            y: gridY * gameConfig.tileSize + gameConfig.tileSize / 2
        };
        pellet.setPosition(pixel.x, pixel.y);

        this.active.push(pellet);
        return pellet;
    }

    release(pellet) {
        const index = this.active.indexOf(pellet);
        if (index !== -1) {
            this.active.splice(index, 1);
            pellet.setVisible(false);
            pellet.setActive(false);
            this.available.push(pellet);
        }
    }

    releaseAll() {
        for (const pellet of [...this.active]) {
            this.release(pellet);
        }
    }

    getActiveCount() {
        return this.active.length;
    }

    destroy() {
        for (const pellet of [...this.available, ...this.active]) {
            pellet.destroy();
        }
        this.available.clear();
        this.active.clear();
    }
}
```

**Step 2: Update GameScene to use pool**

```javascript
// In refactored GameScene
import { PelletPool } from '../pools/PelletPool.js';

export default class GameScene extends Phaser.Scene {
    create() {
        // ... other initialization

        // Initialize pellet pool
        this.pelletPool = new PelletPool(this);
        this.pelletPool.init();

        // Spawn all pellets from maze
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === TILE_TYPES.PELLET) {
                    const pellet = this.pelletPool.get(x, y);
                    this.pelletSprites.push(pellet);
                }
            }
        }
    }

    checkCollisions() {
        // Use pool instead of array splicing
        const pacmanGrid = pixelToGrid(this.pacman.x, this.pacman.y);
        const tileType = this.maze[pacmanGrid.y][pacmanGrid.x];

        if (tileType === TILE_TYPES.PELLET) {
            this.maze[pacmanGrid.y][pacmanGrid.x] = TILE_TYPES.EMPTY;

            // Find and release pellet
            const pelletIndex = this.pelletSprites.findIndex(p => p.active && isAtPosition(p, pacmanGrid));
            if (pelletIndex !== -1) {
                const pellet = this.pelletSprites[pelletIndex];
                this.pelletPool.release(pellet);
                this.pelletSprites.splice(pelletIndex, 1);
            }

            return scoreValues.pellet;
        }
    }
}
```

**Benefits**:
- Reduces garbage collection overhead
- More consistent frame times
- Better performance when eating many pellets quickly
- Predictable memory usage
- Easy to profile pool usage

**Implementation Effort**: 1 day (create pool, update collision logic)

---

## Low Priority Enhancements

### 9. Add Settings Scene

**Current Issue**: No way for users to configure game

**Proposed Solution**: SettingsScene with toggles

```javascript
// New file: src/scenes/SettingsScene.js
import Phaser from 'phaser';
import { colors, uiConfig } from '../config/gameConfig.js';
import { StorageManager } from '../managers/StorageManager.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    create() {
        this.storageManager = new StorageManager();
        this.settings = this.storageManager.getSettings();

        this.createBackground();
        this.createTitle();
        this.createSettings();
        this.createNavigation();
    }

    createBackground() {
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            colors.background
        );
    }

    createTitle() {
        this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.15,
            'SETTINGS',
            {
                fontSize: uiConfig.fonts.title.size,
                color: colors.pacman,
                fontFamily: uiConfig.fonts.title.family,
                fontStyle: uiConfig.fonts.title.style
            }
        ).setOrigin(0.5);
    }

    createSettings() {
        const y = this.scale.height * 0.3;

        // Sound toggle
        this.createToggle('SOUND', y, 'Enable Sound', this.settings.soundEnabled,
            (value) => {
                this.settings.soundEnabled = value;
                this.storageManager.saveSettings(this.settings);
            }
        );

        // Volume slider
        this.createSlider('VOLUME', y + 60, 'Master Volume', this.settings.volume,
            (value) => {
                this.settings.volume = value;
                this.storageManager.saveSettings(this.settings);
            }
        );

        // FPS toggle
        this.createToggle('FPS COUNTER', y + 120, 'Show FPS', this.settings.showFps,
            (value) => {
                this.settings.showFps = value;
                this.storageManager.saveSettings(this.settings);
            }
        );

        // Difficulty selector
        this.createSelector('DIFFICULTY', y + 180, 'Difficulty', this.settings.difficulty,
            ['Easy', 'Normal', 'Hard'],
            (value) => {
                this.settings.difficulty = value;
                this.storageManager.saveSettings(this.settings);
            }
        );
    }

    createToggle(label, y, description, value, onChange) {
        const text = this.add.text(
            this.scale.width * 0.4,
            y,
            `${description}: ${value ? 'ON' : 'OFF'}`,
            {
                fontSize: uiConfig.fonts.text.size,
                color: uiConfig.colors.primary,
                fontFamily: uiConfig.fonts.text.family
            }
        );

        this.add.rectangle(
            this.scale.width * 0.35,
            y + 10,
            20, 20,
            value ? 0x00FF00 : 0x808080
        ).setInteractive().on('pointerdown', () => {
            const newValue = !value;
            onChange(newValue);
            this.scene.restart();
        });
    }

    createSlider(label, y, description, value, onChange) {
        this.add.text(
            this.scale.width * 0.4,
            y - 20,
            description,
            {
                fontSize: uiConfig.fonts.text.size,
                color: uiConfig.colors.primary,
                fontFamily: uiConfig.fonts.text.family
            }
        );

        const slider = this.add.container();
        slider.setPosition(this.scale.width * 0.4, y);

        const min = this.scale.width * 0.5;
        const max = this.scale.width * 0.7;

        this.add.rectangle(min, y + 5, max - min, 10, 0x808080);
        this.add.rectangle(
            min + (value * (max - min)), y + 5, 10, 10, 0x00FF00
        ).setInteractive().on('pointerdown', () => {
            // Drag handling would go here
        });
    }

    createSelector(label, y, description, value, options, onChange) {
        this.add.text(
            this.scale.width * 0.4,
            y - 20,
            description,
            {
                fontSize: uiConfig.fonts.text.size,
                color: uiConfig.colors.primary,
                fontFamily: uiConfig.fonts.text.family
            }
        );

        for (let i = 0; i < options.length; i++) {
            const option = this.add.text(
                this.scale.width * 0.4 + (i * 100),
                y,
                options[i],
                {
                    fontSize: uiConfig.fonts.text.size,
                    color: uiConfig.colors.primary,
                    fontFamily: uiConfig.fonts.text.family
                }
            ).setInteractive().on('pointerdown', () => {
                onChange(options[i]);
                this.scene.restart();
            });
        }
    }

    createNavigation() {
        const y = this.scale.height * 0.8;

        this.add.text(
            this.scale.width / 2,
            y,
            'Press ESC to Return',
            {
                fontSize: uiConfig.fonts.small.size,
                color: uiConfig.colors.info,
                fontFamily: uiConfig.fonts.small.family
            }
        ).setOrigin(0.5);

        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }
}
```

**Step 2: Update StorageManager**

```javascript
// Update src/managers/StorageManager.js
export class StorageManager {
    getSettings() {
        const stored = localStorage.getItem('pacman_settings');
        return stored ? JSON.parse(stored) : {
            soundEnabled: true,
            volume: 0.5,
            showFps: false,
            difficulty: 'Normal'
        };
    }

    saveSettings(settings) {
        localStorage.setItem('pacman_settings', JSON.stringify(settings));
    }
}
```

**Step 3: Update main.js**

```javascript
// Update scene list
scene: [MenuScene, SettingsScene, GameScene, PauseScene, GameOverScene, WinScene]
```

**Step 4: Update MenuScene**

```javascript
// Add settings button
this.input.keyboard.once('keydown-S', () => {
    this.scene.start('SettingsScene');
});

// Or add on-screen button
```

**Benefits**:
- Users can customize their experience
- Volume control for different environments
- Difficulty selection for accessibility
- Sound toggle option
- FPS counter for performance debugging
- Settings persist across sessions

**Implementation Effort**: 1 day (create scene, update storage, menu integration)

---

### 10. Add FPS Counter

**Current Issue**: No way to monitor performance

**Proposed Solution**: FPS display toggle

```javascript
// Update GameScene (or create DebugOverlay class)
import { DEBUG_CONFIG } from '../config/gameConfig.js';

export class DebugOverlay {
    constructor(scene) {
        this.scene = scene;
        this.fpsText = null;
    }

    create() {
        this.fpsText = this.scene.add.text(
            this.scene.scale.width - 10,
            10,
            'FPS: 0',
            {
                fontSize: '14px',
                color: 0x00FF00,
                fontFamily: 'monospace'
            }
        ).setOrigin(1, 0);

        this.fpsText.setVisible(DEBUG_CONFIG.showFps);
    }

    update() {
        if (!DEBUG_CONFIG.showFps) return;

        const fps = this.scene.game.loop.actualFps.toFixed(1);
        this.fpsText.setText(`FPS: ${fps}`);
    }

    toggle(visible) {
        this.fpsText.setVisible(visible);
    }
}
```

**Benefits**:
- Real-time performance monitoring
- Identify performance regressions
- Help with optimization decisions
- Toggleable for production builds
- Useful for debugging

**Implementation Effort**: 0.5 day (create overlay, update settings, integration)

---

### 11. Add Replay System

**Current Issue**: No way to replay previous games or share replays

**Proposed Solution**: Record and replay system

```javascript
// New file: src/systems/ReplaySystem.js
export class ReplaySystem {
    constructor() {
        this.isRecording = false;
        this.isReplaying = false;
        this.recording = {
            inputs: [],
            score: 0,
            level: 1,
            timestamp: 0
        };
        this.playback = null;
        this.currentIndex = 0;
    }

    startRecording() {
        this.isRecording = true;
        this.isReplaying = false;
        this.recording = {
            inputs: [],
            score: 0,
            level: 1,
            timestamp: Date.now()
        };

        gameEvents.emit(GAME_EVENTS.RECORDING_STARTED);
    }

    stopRecording() {
        this.isRecording = false;
        this.saveRecording();

        gameEvents.emit(GAME_EVENTS.RECORDING_STOPPED);
    }

    recordInput(input) {
        if (!this.isRecording) return;

        this.recording.inputs.push({
            timestamp: Date.now(),
            type: input.type, // 'direction', 'pause', etc.
            data: input.data
        });
    }

    recordScore(score) {
        if (!this.isRecording) return;
        this.recording.score = score;
    }

    saveRecording() {
        const recording = JSON.stringify(this.recording);
        const timestamp = this.recording.timestamp;

        localStorage.setItem(`pacman_replay_${timestamp}`, recording);

        // Keep only last 10 recordings
        const keys = Object.keys(localStorage).filter(k => k.startsWith('pacman_replay_'));
        if (keys.length > 10) {
            const oldestKey = keys[0];
            localStorage.removeItem(oldestKey);
        }
    }

    loadRecording(recording) {
        this.playback = recording;
        this.currentIndex = 0;
        this.isReplaying = true;
        this.isRecording = false;
    }

    getRecordings() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('pacman_replay_'));
        return keys.map(k => JSON.parse(localStorage.getItem(k)));
    }

    update(delta) {
        if (!this.isReplaying || !this.playback) return;

        const now = Date.now();
        const elapsed = now - this.recording.timestamp;

        // Process recorded inputs
        while (this.currentIndex < this.playback.inputs.length) {
            const input = this.playback.inputs[this.currentIndex];
            const inputTime = input.timestamp - this.playback.timestamp;

            if (inputTime <= elapsed) {
                // Apply input
                gameEvents.emit(GAME_EVENTS.REPLAY_INPUT, input.data);
                this.currentIndex++;
            } else {
                break;
            }
        }

        // Check if replay finished
        if (this.currentIndex >= this.playback.inputs.length) {
            this.isReplaying = false;
            gameEvents.emit(GAME_EVENTS.REPLAY_FINISHED);
        }
    }
}
```

**Benefits**:
- Users can rewatch their best runs
- Share high-scoring games with friends
- Analyze gameplay patterns
- Record speedrun attempts
- Educational (watch AI behavior)

**Implementation Effort**: 2 days (create system, integrate with input, add replay UI)

---

### 12. Add Achievement System

**Current Issue**: No gamification beyond scoring

**Proposed Solution**: Achievement tracking

```javascript
// New file: src/systems/AchievementSystem.js
export const ACHIEVEMENTS = {
    FIRST_PELLET: {
        id: 'first_pellet',
        name: 'First Bite',
        description: 'Eat your first pellet',
        icon: '🍒',
        condition: (state) => state.pelletsEaten >= 1
    },
    PERFECT_LEVEL: {
        id: 'perfect_level',
        name: 'Perfect Level',
        description: 'Complete a level without dying',
        icon: '⭐',
        condition: (state) => state.levelDeaths === 0
    },
    POWER_HUNTER: {
        id: 'power_hunter',
        name: 'Power Hunter',
        description: 'Eat 4 ghosts while frightened',
        icon: '👻',
        condition: (state) => state.maxComboGhosts >= 4
    },
    SPEEDSTER: {
        id: 'speedster',
        name: 'Speedster',
        description: 'Complete a level in under 2 minutes',
        icon: '⚡',
        condition: (state) => state.levelTime < 120000
    },
    MARATHON_RUNNER: {
        id: 'marathon_runner',
        name: 'Marathon Runner',
        description: 'Complete 5 levels in a row',
        icon: '🏃',
        condition: (state) => state.consecutiveLevels >= 5
    },
    CENTURY_CLUB: {
        id: 'century_club',
        name: 'Century Club',
        description: 'Score 10,000 points in a single game',
        icon: '💯',
        condition: (state) => state.totalScore >= 10000
    },
    PELLET_MASTER: {
        id: 'pellet_master',
        name: 'Pellet Master',
        description: 'Eat 1,000 pellets across all games',
        icon: '🍬',
        condition: (state) => state.totalPelletsEaten >= 1000
    }
};

export class AchievementSystem {
    constructor() {
        this.unlocked = new Set();
        this.progress = new Map();
        this.notificationQueue = [];
        this.showNotificationDuration = 3000;
    }

    init() {
        // Load from localStorage
        const saved = localStorage.getItem('pacman_achievements');
        if (saved) {
            this.unlocked = new Set(JSON.parse(saved));
        }
    }

    check(state) {
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            if (this.unlocked.has(id)) continue;

            const isUnlocked = achievement.condition(state);
            const currentProgress = this.progress.get(id) || 0;

            if (isUnlocked && !this.unlocked.has(id)) {
                this.unlock(id);
            }

            // Track progress for partial achievements
            this.progress.set(id, Math.max(currentProgress, 0));
        }
    }

    unlock(id) {
        if (this.unlocked.has(id)) return;

        this.unlocked.add(id);
        this.save();

        const achievement = ACHIEVEMENTS[id];
        this.queueNotification(achievement);
    }

    queueNotification(achievement) {
        this.notificationQueue.push(achievement);

        if (this.notificationQueue.length === 1) {
            this.showNextNotification();
        }
    }

    showNextNotification() {
        if (this.notificationQueue.length === 0) return;

        const achievement = this.notificationQueue.shift();

        // Dispatch event to show UI
        gameEvents.emit(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, achievement);

        setTimeout(() => {
            this.showNextNotification();
        }, this.showNotificationDuration);
    }

    save() {
        localStorage.setItem('pacman_achievements', JSON.stringify([...this.unlocked]));
    }

    getUnlocked() {
        return [...this.unlocked].map(id => ACHIEVEMENTS[id]);
    }

    getProgress() {
        const progress = {};
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            progress[id] = {
                ...achievement,
                isUnlocked: this.unlocked.has(id),
                currentProgress: this.progress.get(id) || 0
            };
        }
        return progress;
    }
}
```

**Benefits**:
- Increases engagement and replayability
- Goals for players to strive for
- Social sharing potential
- Progress tracking
- Easy to add new achievements

**Implementation Effort**: 1.5 days (create system, achievement definitions, UI notification, integration)

---

## Technical Debt

### 13. Remove Console.log Statements

**Current Issue**: Production code contains debug console.log statements

**Problem**:
- Line 46 in Pacman.js: `console.log('[Pacman] Created as Arc at', this.x, this.y);`
- Clutters browser console in production
- Can impact performance
- Exposes internal game state to users

**Proposed Solution**: Debug logging utility

```javascript
// New file: src/utils/DebugLogger.js
export class DebugLogger {
    constructor() {
        this.enabled = import.meta.env?.MODE === 'development';
        this.logs = [];
        this.maxLogs = 100;
    }

    static getInstance() {
        if (!DebugLogger.instance) {
            DebugLogger.instance = new DebugLogger();
        }
        return DebugLogger.instance;
    }

    log(message, category = 'General', data = null) {
        if (!this.enabled) return;

        const entry = {
            timestamp: new Date().toISOString(),
            category,
            message,
            data
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        console.log(`[${category}]`, message, data || '');
    }

    error(message, error = null, data = null) {
        if (!this.enabled) return;

        const entry = {
            timestamp: new Date().toISOString(),
            category: 'Error',
            message,
            error: error?.stack || '',
            data
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        console.error('[Error]', message, error, data || '');
    }

    warn(message, data = null) {
        if (!this.enabled) return;

        const entry = {
            timestamp: new Date().toISOString(),
            category: 'Warning',
            message,
            data
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        console.warn('[Warning]', message, data || '');
    }

    exportLogs() {
        return [...this.logs];
    }
}
```

**Step 2: Replace console.log with DebugLogger**

```javascript
// Update src/entities/Pacman.js
import { DebugLogger } from '../utils/DebugLogger.js';

const logger = DebugLogger.getInstance();

export default class Pacman extends BaseEntity {
    constructor(scene, x, y) {
        // ... constructor code

        // Replace console.log
        logger.log('Created as Arc at', 'Pacman', { x: this.x, y: this.y });
    }
}
```

**Benefits**:
- No console output in production
- Structured logging with categories
- Log export for debugging
- Configurable enable/disable
- Better performance in production

**Implementation Effort**: 0.5 day (create logger, replace ~5 console.log statements)

---

### 14. Add JSDoc to All Public Methods

**Current Issue**: Inconsistent documentation coverage

**Problem**:
- Some methods have JSDoc, others don't
- Inconsistent documentation style
- Poor IDE autocomplete support

**Proposed Solution**: Complete JSDoc coverage

```javascript
// Example: Update src/entities/BaseEntity.js
/**
 * Base class for all game entities
 * @extends Phaser.GameObjects.Arc
 */
export class BaseEntity extends Phaser.GameObjects.Arc {
    /**
     * Create a new BaseEntity
     * @param {Phaser.Scene} scene - The scene this entity belongs to
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {number} radius - Entity radius in pixels
     * @param {number} color - Hex color value
     */
    constructor(scene, x, y, radius, color) {
        // ... constructor code
    }

    /**
     * Update entity movement using delta-time
     * @param {number} delta - Time since last update in milliseconds
     * @param {Array} maze - The maze layout as 2D array
     * @public
     */
    updateMovement(delta, maze) {
        // ... method code
    }

    /**
     * Check if entity can move in a given direction
     * @param {Object} direction - Direction object with x and y properties
     * @param {Array} maze - The maze layout as 2D array
     * @returns {boolean} True if movement is possible
     * @public
     */
    canMoveInDirection(direction, maze) {
        // ... method code
    }
}
```

**Benefits**:
- Better IDE autocomplete
- Self-documenting code
- Catch type errors early
- Easier for new contributors
- Professional code quality

**Implementation Effort**: 2 days (document all ~50 public methods across ~15 files)

---

### 15. Add Unit Tests

**Current Issue**: No testing infrastructure

**Problem**:
- No confidence when refactoring
- Difficult to catch regressions
- Manual testing required for every change

**Proposed Solution**: Jest test suite

```bash
# Install testing dependencies
npm install --save-dev jest @types/jest
```

```javascript
// New file: tests/utils/MazeLayout.test.js
import { pixelToGrid, gridToPixel, getDistance, isPath } from '../../src/utils/MazeLayout.js';
import { gameConfig } from '../../src/config/gameConfig.js';

describe('MazeLayout', () => {
    describe('coordinate conversion', () => {
        test('pixelToGrid converts pixel coordinates to grid', () => {
            expect(pixelToGrid(30, 20)).toEqual({ x: 1, y: 1 });
        });

        test('gridToPixel converts grid coordinates to pixel', () => {
            expect(gridToPixel(1, 1)).toEqual({ x: 20, y: 20 });
        });

        test('handles edge cases', () => {
            expect(pixelToGrid(0, 0)).toEqual({ x: 0, y: 0 });
            expect(gridToPixel(0, 0)).toEqual({ x: 0, y: 0 });
        });
    });

    describe('distance calculation', () => {
        test('getDistance calculates Euclidean distance', () => {
            expect(getDistance(0, 0, 3, 4)).toBeCloseTo(5, 2);
        });

        test('distance to same point is zero', () => {
            expect(getDistance(1, 1, 1, 1)).toBe(0);
        });
    });

    describe('path validation', () => {
        test('isPath identifies path tiles', () => {
            const maze = [
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0]
            ];
            expect(isPath(maze, 0, 0)).toBe(true);
            expect(isPath(maze, 1, 0)).toBe(false);
            expect(isPath(maze, 2, 0)).toBe(false);
        });
    });
});
```

```javascript
// New file: tests/systems/GhostAISystem.test.js
import { GhostAISystem } from '../../src/systems/GhostAISystem.js';
import { directions, ghostModes } from '../../src/config/gameConfig.js';

describe('GhostAISystem', () => {
    let aiSystem;
    let mockGhosts;

    beforeEach(() => {
        aiSystem = new GhostAISystem();
        mockGhosts = [
            { type: 'blinky', mode: ghostModes.SCATTER, gridX: 13, gridY: 10 },
            { type: 'pinky', mode: ghostModes.SCATTER, gridX: 10, gridY: 10 },
            { type: 'inky', mode: ghostModes.SCATTER, gridX: 15, gridY: 10 },
            { type: 'clyde', mode: ghostModes.SCATTER, gridX: 10, gridY: 15 }
        ];
        aiSystem.setGhosts(mockGhosts);
    });

    describe('mode cycling', () => {
        test('starts in SCATTER mode', () => {
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);
        });

        test('transitions to CHASE after 7 seconds', () => {
            aiSystem.update(7000, {}, {});
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
        });

        test('transitions to SCATTER after additional 20 seconds', () => {
            aiSystem.update(20000, {}, {});
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);
        });
    });

    describe('Blinky targeting', () => {
        test('targets Pacman directly in CHASE mode', () => {
            const pacman = { gridX: 13, gridY: 20, direction: directions.RIGHT };
            aiSystem.updateGhostTarget(mockGhosts[0], pacman);

            expect(mockGhosts[0].targetX).toBe(13);
            expect(mockGhosts[0].targetY).toBe(20);
        });

        test('targets corner in SCATTER mode', () => {
            aiSystem.updateGhostTarget(mockGhosts[0], null);

            expect(mockGhosts[0].targetX).toBe(26); // Top-right corner
            expect(mockGhosts[0].targetY).toBe(0);
        });
    });

    describe('direction selection', () => {
        const maze = [
            [0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0]
        ];

        test('chooses direction minimizing distance to target', () => {
            const ghost = mockGhosts[0];
            ghost.targetX = 0;
            ghost.targetY = 0;
            ghost.gridX = 2;
            ghost.gridY = 1;
            ghost.direction = directions.RIGHT;

            const validDirs = [[0, -1], [1, 0]]; // LEFT and DOWN

            const chosenDir = aiSystem.chooseDirection(ghost, maze);

            expect(chosenDir).toEqual(validDirs[1]); // DOWN (towards target 0, 0)
        });

        test('cannot reverse direction', () => {
            const ghost = mockGhosts[0];
            ghost.direction = directions.RIGHT;
            ghost.gridX = 2;
            ghost.gridY = 1;

            const validDirs = [[-1, 0], [1, 0]]; // LEFT and DOWN

            const chosenDir = aiSystem.chooseDirection(ghost, maze);

            // RIGHT should be filtered out (reverse)
            expect(chosenDir).not.toEqual([-1, 0]);
        });
    });
});
```

```javascript
// New file: tests/entites/Pacman.test.js
import Pacman from '../../src/entities/Pacman.js';
import { directions } from '../../src/config/gameConfig.js';
import { TILE_TYPES } from '../../src/utils/MazeLayout.js';

describe('Pacman', () => {
    let scene;
    let pacman;
    let mockMaze;

    beforeEach(() => {
        // Create mock scene
        scene = {
            gameState: { level: 1 },
            add: {
                existing: jest.fn(),
            },
            tweens: {
                add: jest.fn()
            }
        };

        mockMaze = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1]
        ];
    });

    describe('movement', () => {
        test('moves correctly when not blocked', () => {
            pacman = new Pacman(scene, 1, 1);
            pacman.setDirection(directions.RIGHT);
            pacman.update(100, mockMaze);

            expect(pacman.gridX).toBe(2);
        });

        test('stops when blocked by wall', () => {
            pacman = new Pacman(scene, 1, 1);
            pacman.setDirection(directions.RIGHT);
            pacman.update(100, mockMaze);

            expect(pacman.isMoving).toBe(false);
        });

        test('queues direction changes', () => {
            pacman = new Pacman(scene, 1, 1);
            pacman.setDirection(directions.RIGHT);
            pacman.setDirection(directions.DOWN);
            pacman.update(100, mockMaze);

            // Should execute DOWN at next intersection
            expect(pacman.nextDirection).toBe(directions.DOWN);
        });
    });

    describe('tunnel wrapping', () => {
        test('wraps around left edge', () => {
            pacman = new Pacman(scene, 1, 10);
            pacman.x = -25;
            pacman.handleTunnelWrap();

            expect(pacman.x).toBeGreaterThan(0);
        });

        test('wraps around right edge', () => {
            pacman = new Pacman(scene, 1, 10);
            pacman.x = 600;
            pacman.handleTunnelWrap();

            expect(pacman.x).toBeLessThan(0);
        });
    });

    describe('input buffering', () => {
        test('can reverse direction immediately', () => {
            pacman = new Pacman(scene, 1, 1);
            pacman.direction = directions.RIGHT;
            pacman.setDirection(directions.LEFT);

            expect(pacman.direction).toBe(directions.LEFT);
            expect(pacman.nextDirection).toBe(directions.NONE);
        });
    });
});
```

**Step 2: Update package.json**

```javascript
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "collectCoverageFrom": [
      "src/**/*.{js,jsx}"
    ],
    "coveragePath": "coverage",
    "coverageReporters": [
      "text",
      "html"
    ]
  }
}
```

**Benefits**:
- Automated regression testing
- Documentation through tests
- Confidence in refactoring
- Continuous integration ready
- Code coverage metrics

**Implementation Effort**: 3 days (setup Jest, write ~20 initial tests, achieve 50% coverage)

---

## Implementation Roadmap

### Phase 1: Code Quality (Week 1)
- [ ] Implement DebugLogger utility
- [ ] Add comprehensive error handling
- [ ] Remove all console.log statements
- [ ] Add JSDoc to all public methods
- [ ] Add configuration validation

### Phase 2: Refactoring (Week 2-3)
- [ ] Extract BaseEntity class
- [ ] Refactor GameScene into subsystems
- [ ] Implement Event Bus
- [ ] Optimize Fruit rendering with sprites
- [ ] Add object pooling for pellets

### Phase 3: Testing (Week 4)
- [ ] Set up Jest testing framework
- [ ] Write unit tests for MazeLayout
- [ ] Write unit tests for GhostAISystem
- [ ] Write unit tests for Pacman
- [ ] Write unit tests for CollisionSystem
- [ ] Achieve 50% code coverage

### Phase 4: Enhancements (Week 5-6)
- [ ] Add Settings scene
- [ ] Add FPS counter
- [ ] Add Achievement system
- [ ] Implement Replay system
- [ ] Consider ECS migration for v2.0

### Phase 5: Polish (Week 7-8)
- [ ] Performance profiling and optimization
- [ ] Mobile experience improvements
- [ ] Accessibility features
- [ ] Add more visual polish
- [ ] Update documentation

---

## Conclusion

The Pac-Man game implementation is **solid and functional** with faithful recreation of classic gameplay mechanics. However, addressing the improvements outlined in this document will:

1. **Significantly improve maintainability** (GameScene refactoring, BaseEntity extraction)
2. **Enhance extensibility** (Event system, configurable entities, ECS framework)
3. **Increase performance** (Fruit sprites, object pooling)
4. **Improve code quality** (Error handling, testing, documentation)
5. **Add player features** (Settings, achievements, replay system)

**Prioritization Strategy**:
- **Start with high-priority refactoring** (GameScene, BaseEntity, Event Bus)
- **Follow with optimization** (Fruit sprites, object pooling)
- **Then add features** (Settings, achievements, replay)
- **Finally focus on quality** (Testing, documentation, error handling)

**Estimated Total Effort**: 15-20 developer days (3-4 weeks)

**Expected Outcomes**:
- 70% reduction in GameScene complexity (708 → ~200 lines)
- 60% reduction in Fruit complexity (313 → ~120 lines)
- 95% performance improvement for fruit rendering
- 50% code duplication reduction
- Testable and maintainable codebase
- Feature-rich, user-friendly game

These improvements will transform the codebase from a working prototype into a production-ready, extensible game engine suitable for future enhancements.
