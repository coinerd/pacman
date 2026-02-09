# Pac-Man Web Game - Technical Architecture

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Architecture Patterns](#core-architecture-patterns)
5. [MVC Architecture (NEW)](#mvc-architecture)
6. [Entity System](#entity-system)
7. [Systems Architecture](#systems-architecture)
8. [Scene Management](#scene-management)
9. [State Management](#state-management)
10. [Collision Detection](#collision-detection)
11. [Ghost AI System](#ghost-ai-system)
12. [Audio System](#audio-system)
13. [Persistence Layer](#persistence-layer)
14. [Performance Considerations](#performance-considerations)
15. [Code Quality Assessment](#code-quality-assessment)
16. [Testing Architecture](#testing-architecture)

---

## Overview

This is a fully-functional, browser-based Pac-Man game built with Phaser.js 3.80.1 and Vite. The implementation faithfully recreates classic Pac-Man gameplay mechanics with four distinct ghost personalities, maze-based levels, score tracking, progressive difficulty, and complete game state management.

### Key Features
- **Classic Gameplay**: Authentic maze navigation, pellet consumption, ghost avoidance
- **Four Ghost AI Behaviors**: Blinky (direct pursuit), Pinky (ambush), Inky (vector-based targeting), Clyde (proximity-based retreat)
- **Power Pellet System**: Frightened mode with blue ghosts, eatable ghosts, combo scoring
- **Fruit Bonus System**: 8 fruit types with progressive appearance based on level
- **Level Progression**: 5% speed increase per level, 500ms frightened duration reduction
- **High Score Persistence**: localStorage-based high score tracking
- **Enhanced Visuals**: Wall depth/shadows, power pellet pulsing, visual feedback effects
- **Mobile Support**: Touch swipe controls, responsive canvas scaling
- **Web Audio API**: Procedurally generated sound effects without external assets

---

## Technology Stack

### Core Framework
**Phaser.js 3.80.1**
- Rationale: Mature, feature-rich HTML5 game framework specifically designed for 2D games
- Usage: Scene management, sprite rendering, input handling, physics system, tweening, particle effects

### Build Tools
**Vite 5.0+**
- Fast development server with HMR (Hot Module Replacement)
- Optimized production builds with tree-shaking
- ES module support out of the box
- Asset bundling

### Rendering
**HTML5 Canvas (via Phaser)**
- Hardware-accelerated rendering through WebGL (when available)
- Efficient sprite batching
- Cross-browser compatibility

### Audio
**Web Audio API**
- Procedural sound generation without external audio files
- Oscillator-based sound effects
- Browser autoplay policy compliant (initializes on user interaction)

### Persistence
**localStorage API**
- High score persistence across sessions
- Simple key-value storage wrapper

### Additional Dependencies
- **None**: Pure Phaser + Vite implementation

---

## Project Structure

```
pacman/
├── public/
│   └── index.html              # Entry point with game container
├── src/
│   ├── main.js                 # Game initialization and scene configuration
│   ├── config/
│   │   └── gameConfig.js       # Central configuration constants
│   ├── entities/
│   │   ├── Pacman.js           # Player entity (Phaser.Arc)
│   │   ├── Ghost.js            # Base ghost entity (Phaser.Arc)
│   │   ├── GhostFactory.js      # Ghost creation and batch operations
│   │   └── Fruit.js            # Bonus fruit entity (Phaser.Graphics)
│   ├── systems/
│   │   ├── CollisionSystem.js  # Collision detection logic
│   │   └── GhostAISystem.js     # Ghost AI state machine and targeting
│   ├── managers/
│   │   ├── SoundManager.js      # Web Audio API wrapper
│   │   └── StorageManager.js    # localStorage wrapper
│   ├── scenes/
│   │   ├── MenuScene.js        # Main menu with how-to-play
│   │   ├── GameScene.js        # Core gameplay scene (708 lines)
│   │   ├── PauseScene.js       # Pause overlay
│   │   ├── GameOverScene.js    # Death screen
│   │   └── WinScene.js         # Level complete screen
│   └── utils/
│       └── MazeLayout.js       # Maze data and utility functions
├── index.html                  # Production entry point
├── package.json
├── vite.config.js
├── ARCHITECTURE.md
├── README.md
└── CHANGELOG.md
```

---

## Core Architecture Patterns

### 1. Component-Based Architecture

The game follows a hybrid component-based architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Phaser Game Engine                      │
│  ┌───────────────────────────────────────────────────┐   │
│  │              Scene Manager                    │   │
│  │  MenuScene  GameScene  PauseScene         │   │
│  └────────────┬──────────────────────────────────┘   │
│               │                                       │
│  ┌────────────▼───────────────────────────────────┐   │
│  │            GameScene (Main)              │   │
│  │  ┌──────────────────────────────────────┐ │   │
│  │  │       Entities                   │ │   │
│  │  │ Pacman, Ghost[4], Fruit      │ │   │
│  │  └──────────────────────────────────────┘ │   │
│  │  ┌──────────────────────────────────────┐ │   │
│  │  │         Systems                 │ │   │
│  │  │ CollisionSystem, GhostAISystem  │ │   │
│  │  └──────────────────────────────────────┘ │   │
│  │  ┌──────────────────────────────────────┐ │   │
│  │  │        Managers                 │ │   │
│  │  │ SoundManager, StorageManager    │ │   │
│  │  └──────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### 2. Configuration-Driven Design

All game constants centralized in `gameConfig.js`:
- **Colors**: 15 hex color definitions
- **Directions**: Direction vectors with angles
- **Game Constants**: FPS, dimensions, tile sizes
- **Entity Config**: Speed multipliers, spawn positions
- **AI Config**: Scatter targets, mode cycles
- **Scoring**: Point values for all entities
- **Fruit Config**: 8 fruit types with thresholds
- **Animation Config**: Timing values
- **UI Config**: Fonts and styling

**Strengths**: Easy to balance game, single source of truth
**Weaknesses**: Large single file (212 lines), mixing concerns

### 3. Factory Pattern

Used for ghost creation:
```javascript
// GhostFactory.js
export class GhostFactory {
    static createGhosts(scene) { /* ... */ }
    static resetGhosts(ghosts) { /* ... */ }
    static setGhostsFrightened(ghosts, duration) { /* ... */ }
    static getGhostsByType(ghosts, type) { /* ... */ }
}
```

**Benefits**: Encapsulates creation logic, batch operations, type filtering

### 4. Data-Driven Maze System

Maze as 2D array with tile type constants:
```javascript
export const TILE_TYPES = {
    WALL: 1,
    PATH: 0,
    PELLET: 0,
    POWER_PELLET: 2,
    EMPTY: 3,
    GHOST_HOUSE: 4,
    GHOST_HOUSE_DOOR: 5
};

export const mazeLayout = [
    [1,1,1,1,1,1,1,...],
    [1,2,0,0,0,0,...],
    // ... 31 rows × 28 columns
];
```

**Benefits**: Easy level design, visual editing, collision queries

---

## MVC Architecture (NEW)

### Overview

The game implements a **hybrid MVC architecture** that separates game logic from presentation while maintaining compatibility with the existing Phaser scene system. This refactoring (commit `44044ed`) introduces a Model-View-Controller pattern alongside the existing component-based design.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                               │
│              (Keyboard, Touch, Replay System)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GameController                              │
│  - Translates raw input to model intents                        │
│  - Orchestrates scene transitions                               │
│  - Emits DIRECTION_CHANGED events                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        GameModel                                 │
│  - Stores all game state (score, lives, level, etc.)           │
│  - Applies game rules (scoring, combos, progression)            │
│  - Emits events: PELLET_EATEN, GHOST_EATEN, etc.                │
│  - Provides: shouldSpawnFruit(), getFrightenedDuration()       │
└────────────┬──────────────────────────────────┬──────────────────┘
             │                                  │
             ▼                                  ▼
┌─────────────────────┐              ┌─────────────────────┐
│  PhaserGameView     │              │  ConsoleGameView    │
│  - Renders game     │              │  - Logs events      │
│  - Plays sounds     │              │  - No rendering     │
│  - Creates effects  │              │  - For testing      │
│  - Scene transitions│              │                     │
└──────────┬──────────┘              └─────────────────────┘
           │
           │ Subscribes to EventBus
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        EventBus                                  │
│  - Pub/sub communication layer                                  │
│  - Decouples all components                                     │
│  - Telemetry for debugging                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Core MVC Components

#### GameModel (`src/core/GameModel.js`)

**Purpose**: Pure state management and game rules (NO Phaser dependencies)

**Responsibilities**:
- State management: `score`, `lives`, `level`, `highScore`, `isPaused`, `isGameOver`, `isDying`, `deathTimer`
- Pellet tracking: `pelletsEaten`, `pelletsRemaining`, `totalPellets`
- Ghost combo: `ghostsEaten`, `maxComboGhosts`, `currentComboGhosts`
- Fruit/level: `fruitsCollected`, `levelComplete`
- Direction buffering: `desiredDirection` queue

**Key Methods**:
- `addScore(points)`: Updates score, tracks high score, emits `SCORE_CHANGED` and `HIGH_SCORE_CHANGED` events
- `onPelletEaten()`: Handles pellet consumption, updates counters, emits `PELLET_EATEN`
- `onPowerPelletEaten()`: Resets ghost combo, emits `POWER_PELLET_EATEN`
- `onGhostEaten()`: Tracks combo multiplier (200, 400, 800, 1600), emits `GHOST_EATEN`
- `onPacmanDeath()`: Sets death state, increments death counter, emits `LIVES_LOST`
- `onFruitEaten()`: Adds fruit score, emits `FRUIT_EATEN`
- `onLevelComplete()`: Advances level, emits `LEVEL_COMPLETE`
- `step(deltaSeconds)`: Manages death timer, returns respawn/gameover/death-tick events
- `getSpeedMultiplier()`: Returns 5% speed increase per level
- `getFrightenedDuration()`: Returns decreased duration per level (500ms reduction per level)
- `shouldSpawnFruit()`: Returns true when ~70% of pellets eaten
- `setDesiredDirection()`: Stores player input direction
- `consumeDesiredDirection()`: Returns and clears direction

**Design Constraint**: Zero Phaser dependencies - fully testable in Node.js environment

#### GameController (`src/controllers/GameController.js`)

**Purpose**: Input translation layer and scene orchestration

**Responsibilities**:
- Input processing: `handleInput({ direction, pause, returnToMenu, replayToggle, loadReplay })`
- Scene transitions: Launches/pauses Phaser scenes (GameScene ↔ PauseScene ↔ MenuScene)
- Replay control: Starts/stops recording, loads replays
- Input validation: Ignores direction when `gameState.isDying`

**Key Methods**:
- `handleInput()`: Translates raw input to model actions and emits `DIRECTION_CHANGED` events
- `handlePause()`: Toggles model pause state, launches/pauses Phaser scenes
- `handleReturnToMenu()`: Cleanup and scene transition to MenuScene
- `handleReplayToggle()`: Starts/stops replay recording
- `handleLoadReplay()`: Loads and replays saved replay

**Design Pattern**: Controller doesn't contain game logic, only routing and coordination

#### View Layer

**PhaserGameView (`src/views/PhaserGameView.js`)**

**Purpose**: Full game rendering with Phaser integration

**Responsibilities**:
- Rendering: `createBackground()`, `createMaze()`, `createPellets()`, `createEntities()`
- Entity management: Creates and manages Pacman, Ghosts, Fruit instances
- Audio: Web Audio API sounds via SoundManager
- Visual effects: Particle effects, flash animations via EffectManager
- Event binding: Subscribes to model events and triggers visual/audio responses

**Key Methods**:
- `createBackground()`: Draws subtle grid pattern for depth
- `createMaze()`: Generates maze wall texture with depth/shadows/highlights
- `createPelletPools()`: Object pooling for performance
- `createPellets()`: Spawns pellets with pulse animation on power pellets
- `createEntities()`: Creates Pacman, Ghosts, Fruit entities
- `bindModelEvents()`: Subscribes to EventBus and sets up callbacks:
  - `PELLET_EATEN` → `playWakaWaka()`
  - `POWER_PELLET_EATEN` → `playPowerPellet() + visual effects + set ghosts frightened`
  - `GHOST_EATEN` → `playGhostEaten() + visual effects`
  - `LIVES_LOST` → `playDeath() + handle death sequence`
  - `FRUIT_EATEN` → `playFruitEat() + visual effects`
  - `LEVEL_COMPLETE` → `playLevelComplete()` + save high score + transition
  - `GAME_OVER` → `save high score + transition to GameOverScene`

**Dependencies**: Heavily uses Phaser.js (311 lines)

**ConsoleGameView (`src/views/ConsoleGameView.js`)**

**Purpose**: Headless view for CLI environments, test harnesses, or automated testing

**Responsibilities**:
- Event subscription: Subscribes to all model events
- Logging: Logs events via configurable logger (defaults to `console`)
- No rendering, no Phaser dependencies

**Key Methods**:
- `bindModelEvents()`: Subscribes to events and logs state changes

**Size**: Lightweight (43 lines total)

#### EventBus (`src/core/EventBus.js`)

**Purpose**: Pub/sub system for fully decoupled communication

**Event Types**:
- Game State: `PELLET_EATEN`, `POWER_PELLET_EATEN`, `GHOST_EATEN`, `FRUIT_EATEN`, `LEVEL_COMPLETE`, `GAME_OVER`, `LIVES_LOST`
- Score Tracking: `SCORE_CHANGED`, `HIGH_SCORE_CHANGED`
- Game Flow: `PAUSE_TOGGLED`, `GAME_STARTED`, `GAME_RESET`
- Input: `DIRECTION_CHANGED`
- Replay System: `RECORDING_STARTED`, `RECORDING_STOPPED`, `REPLAY_INPUT`, `REPLAY_FINISHED`
- Achievements: `ACHIEVEMENT_UNLOCKED`

**API**:
- `on(event, callback, context)`: Subscribe to events, returns unsubscribe function
- `off(event, callback)`: Unsubscribe specific listener
- `once(event, callback, context)`: One-time subscription (auto-unsubscribes)
- `emit(event, data)`: Publish event to all subscribers (creates array copy for safety)
- `emitTelemetry(event, data)`: Dispatches browser-level CustomEvent for debugging

**Design Pattern**: Singleton (`export const gameEvents = new EventBus()`)

### Integration with Existing Architecture

#### GameScene Refactoring

**Before**: GameScene contained ~708 lines with mixed responsibilities (game state, rendering, input, collision)

**After**: GameScene reduced to 367 lines - now acts as **coordinator/orchestrator**

**New GameScene Flow**:
1. **Initialization** (`init()`):
   - Creates GameModel with initial state
   - Creates LevelManager with model reference
   - Loads high score from storage

2. **Creation** (`create()`):
   - Loads level data into model
   - Creates PhaserGameView (handles all rendering)
   - View creates visual elements and binds to model events
   - Creates GameController (handles input translation)
   - Connects InputController to GameController
   - Creates UIController (observes model state)

3. **Game Loop** (`update()`):
   - Checks model state for pause/game over
   - Processes input through controller
   - Consumes queued direction from model
   - Runs fixed timestep physics loop
   - Handles death animation through DeathHandler

4. **Fixed Physics** (`fixedUpdate()`):
   - Updates all entities (Pacman, Ghosts)
   - Runs GhostAI for ghost targeting
   - Handles collisions via CollisionSystem
   - Updates Fruit and Replay system

**What GameScene NO LONGER does**:
- ❌ Direct score/lives/level management (delegated to GameModel)
- ❌ Rendering logic (delegated to PhaserGameView)
- ❌ Input processing logic (delegated to GameController)
- ❌ Audio playback (delegated to SoundManager via View)
- ❌ Visual effects (delegated to EffectManager via View)

### Systems Refactoring

#### Modified Systems

**DeathHandler**: Now delegates to `gameModel.step(deltaSeconds)` for death timer management

**InputController**: Now delegates to `gameController.handleInput()` instead of modifying game state directly

**LevelManager**: Uses `gameModel.getSpeedMultiplier()` and `gameModel.getFrightenedDuration()` for configuration

**UIController**: Observes `gameState` (reference to `gameModel.state`) and updates UI based on model changes

**EffectManager**: Moved into PhaserGameView, pure visual effects - no game logic

#### Systems That Remained Unchanged

**CollisionSystem**: Still used by GameScene in `handleCollisions()` - query-based collision detection

**GhostAISystem**: Still used by GameScene in `fixedUpdate()` - ghost targeting and direction selection

**AchievementSystem**: Checks game state, independent of MVC architecture

**ReplaySystem**: Records events from EventBus, independent of MVC implementation

### Benefits of MVC Refactoring

1. **Testability**: GameModel can be unit tested without Phaser (headless in Node.js)
2. **Flexibility**: Easy to add new views (e.g., React, Canvas 2D) without changing game logic
3. **Decoupling**: Components don't need direct references to each other, communicate via EventBus
4. **Replay Support**: Event-based design enables easy recording/replay of game events
5. **Headless Testing**: ConsoleGameView enables automated CI testing without browser rendering
6. **Separation of Concerns**: Each component has a single, clear responsibility
7. **Extensibility**: New features subscribe to events without modifying existing code
8. **Clear Data Flow**: Input → Controller → Model → EventBus → View

### Design Patterns Used

1. **Model-View-Controller (MVC)**: Separation of concerns between state, presentation, and input handling
2. **Observer/Pub-Sub**: EventBus for loose coupling between components
3. **Strategy Pattern**: Multiple view implementations (Phaser, Console) for different contexts
4. **Singleton**: Single `gameEvents` instance for app-wide communication
5. **Adapter Pattern**: ConsoleGameView adapts event notifications to console output
6. **Dependency Injection**: All components receive dependencies via constructor for easy testing
7. **Event-Driven Architecture**: GameModel doesn't know about views, views react to model state changes

---

## Entity System

### Base Entity Patterns

All entities share common patterns:

```javascript
class Entity extends Phaser.GameObject {
    constructor(scene, x, y, ...) {
        super(scene, ...);
        this.gridX = x;
        this.gridY = y;
        this.direction = directions.NONE;
        this.nextDirection = directions.NONE;
        this.speed = calculatedSpeed;
        // Initialize state
    }

    update(delta, maze) {
        // 1. Calculate grid position
        // 2. Check distance to tile center
        // 3. At center: choose next direction
        // 4. Apply movement
        // 5. Handle tunnel wrapping
    }
}
```

### Pacman Entity

**File**: `src/entities/Pacman.js` (255 lines)

**Inheritance**: `Phaser.GameObjects.Arc`

**Key Properties**:
- `gridX, gridY`: Tile-based position
- `direction`: Current movement direction
- `nextDirection`: Queued direction (input buffering)
- `speed`: Delta-time based movement
- `mouthAngle`: Animation state (0-30 degrees)
- `isDying`: Death animation flag

**Movement Algorithm**:
```javascript
// Grid-based movement with tile-center locking
1. Calculate current grid position from pixel coordinates
2. Calculate distance to tile center
3. If at center (< moveStep):
   a. Update grid coordinates
   b. Try to apply queued nextDirection
   c. If blocked, stop movement
   d. Center position on tile
4. Apply movement vector
5. Handle tunnel wrapping (x < -tileSize or x > width + tileSize)
```

**Special Behaviors**:
- **Direction Buffering**: Queue input for precise turns
- **Immediate Reversal**: Can reverse direction anytime (no 180° turn restriction)
- **Mouth Animation**: Sine wave oscillation (0-30°)
- **Death Animation**: Mouth opens to 180°

### Ghost Entity

**File**: `src/entities/Ghost.js` (196 lines)

**Inheritance**: `Phaser.GameObjects.Arc`

**Key Properties**:
- `type`: 'blinky' | 'pinky' | 'inky' | 'clyde'
- `mode`: 'SCATTER' | 'CHASE' | 'FRIGHTENED' | 'EATEN'
- `modeTimer`: Time tracking for mode transitions
- `targetX, targetY`: AI target coordinates
- `isFrightened`: Blue ghost state
- `isEaten`: Eyes-only return state
- `isBlinking`: Frightened timeout warning

**Movement Algorithm**:
```javascript
// Same grid-based movement as Pacman
// Direction chosen by GhostAISystem at intersections
if (isEaten) {
    // Direct pathfinding to ghost house (13, 14)
    // Speed: 200% base
} else if (isFrightened) {
    // Random direction choice at intersections
    // Speed: 50% base
} else {
    // Choose optimal direction to target
    // Speed: 100% base (modified by level)
}
```

**Visual States**:
```javascript
if (isFrightened && isBlinking) {
    // Flash white/blue during last 2 seconds
}
if (isEaten) {
    // White, transparent (40% alpha)
}
```

### Fruit Entity

**File**: `src/entities/Fruit.js` (313 lines)

**Inheritance**: `Phaser.GameObjects.Graphics`

**Architecture**: Procedural drawing using Graphics API (not sprite)
- Custom draw methods for each fruit type (8 distinct fruits)
- Bezier curves for organic shapes
- Multiple draw calls per fruit

**Lifecycle**:
```javascript
constructor -> drawFruit() -> setVisible(false)
activate() -> setVisible(true) + animations
update(delta) -> timer countdown
deactivate() -> animations + setVisible(false)
```

**Draw Methods**:
- `drawCherry()`: Two circles + stem path
- `drawStrawberry()`: Bezier curve + seed dots
- `drawOrange()`: Circle + texture dots
- `drawApple()`: Bezier curve + stem + leaf ellipse
- `drawMelon()`: Circle + stripe rectangles
- `drawGalaxian()`: Triangle + cockpit circle
- `drawBell()`: Bell shape + clapper circle
- `drawKey()`: Stroke circle + shaft + teeth rectangles

**Strengths**:
- No external assets needed
- Fully procedural, scalable

**Weaknesses**:
- Heavy Graphics API usage (313 lines)
- Repetitive drawing code
- No sprite caching
- Performance impact from per-frame drawing

---

## Systems Architecture

### CollisionSystem

**File**: `src/systems/CollisionSystem.js` (133 lines)

**Responsibilities**:
1. Entity-maze collision (handled by entities themselves)
2. Pacman-pellet collision
3. Pacman-power pellet collision
4. Pacman-ghost collision
5. Win condition check

**Pattern**: Query-based collision detection

```javascript
export class CollisionSystem {
    constructor(scene) {
        this.pacman = null;        // Set via setPacman()
        this.ghosts = [];           // Set via setGhosts()
        this.maze = null;           // Set via setMaze()
        this.pelletSprites = [];     // Set via setPelletSprites()
        this.powerPelletSprites = [];
        this.ghostsEatenCount = 0; // For combo scoring
    }

    checkPelletCollision() {
        // 1. Get pacman grid position
        // 2. Check maze tile type
        // 3. If PELLET: set to EMPTY, destroy sprite, return score
    }

    checkPowerPelletCollision() {
        // Similar to pellet, but with type POWER_PELLET
        // Resets ghost combo counter
    }

    checkGhostCollision() {
        // 1. Iterate all ghosts
        // 2. Calculate Euclidean distance
        // 3. If < tileSize * 0.8:
        //    a. If frightened: ghost.eat(), return ghost_eaten + combo score
        //    b. If normal: return pacman_died
    }

    checkAllCollisions() {
        // Batch call all collision checks
        // Returns aggregate result object
    }

    checkWinCondition() {
        // Count remaining pellets
        // Return true if 0
    }
}
```

**Integration Pattern**:
```javascript
// In GameScene.create()
this.collisionSystem = new CollisionSystem(this);
this.collisionSystem.setPacman(this.pacman);
this.collisionSystem.setGhosts(this.ghosts);
this.collisionSystem.setMaze(this.maze);
this.collisionSystem.setPelletSprites(this.pelletSprites, this.powerPelletSprites);

// In GameScene.update()
const results = this.collisionSystem.checkAllCollisions();
// Handle results
```

**Strengths**:
- Separated concerns (collision vs rendering)
- Easy to test
- Clear return values

**Weaknesses**:
- Manual sprite tracking (array splicing)
- O(n) ghost collision check (acceptable for 4 ghosts)
- No spatial partitioning (not needed at this scale)

### GhostAISystem

**File**: `src/systems/GhostAISystem.js` (226 lines)

**Responsibilities**:
1. Global mode management (SCATTER/CHASE cycle)
2. Individual ghost targeting
3. Direction selection at intersections

**State Machine**:
```javascript
export class GhostAISystem {
    constructor() {
        this.ghosts = [];                      // All ghost references
        this.globalMode = ghostModes.SCATTER;
        this.globalModeTimer = 0;
        this.cycleIndex = 0;

        this.cycles = [
            { mode: SCATTER, duration: 7000 },
            { mode: CHASE, duration: 20000 },
            { mode: SCATTER, duration: 7000 },
            { mode: CHASE, duration: 20000 },
            { mode: SCATTER, duration: 5000 },
            { mode: CHASE, duration: 20000 },
            { mode: SCATTER, duration: 5000 },
            { mode: CHASE, duration: -1 } // Permanent chase
        ];
    }
}
```

**Update Cycle**:
```javascript
update(delta, maze, pacman) {
    // 1. Update global mode timer
    this.updateGlobalMode(delta);

    // 2. Sync ghosts to global mode (unless frightened/eaten)
    for (const ghost of ghosts) {
        if (!ghost.isFrightened && !ghost.isEaten) {
            if (ghost.mode !== this.globalMode) {
                ghost.mode = this.globalMode;
                ghost.direction = this.getReverseDirection(ghost.direction);
            }
        }
        // 3. Update each ghost's target
        this.updateGhostTarget(ghost, pacman);
    }
}
```

**Target Calculation**:

**Blinky (Red)**: Direct pursuit
```javascript
if (mode === SCATTER) {
    target = (26, 0); // Top-right corner
} else {
    target = (pacman.gridX, pacman.gridY); // Direct chase
}
```

**Pinky (Pink)**: Ambush (4 tiles ahead)
```javascript
if (mode === SCATTER) {
    target = (2, 0); // Top-left corner
} else {
    // Look ahead 4 tiles in pacman's direction
    targetX = pacman.gridX + (pacman.direction.x * 4);
    targetY = pacman.gridY + (pacman.direction.y * 4);

    // Original bug replication
    if (pacman.direction.y === -1) {
        targetX -= 4; // Up direction also moves left
    }
}
```

**Inky (Cyan)**: Vector targeting
```javascript
if (mode === SCATTER) {
    target = (27, 30); // Bottom-right corner
} else {
    const blinky = getGhostByType('blinky');
    if (blinky) {
        // Pivot point: 2 tiles ahead of pacman
        const pivotX = pacman.gridX + (pacman.direction.x * 2);
        const pivotY = pacman.gridY + (pacman.direction.y * 2);

        // Vector from Blinky through pivot
        targetX = pivotX + (pivotX - blinky.gridX);
        targetY = pivotY + (pivotY - blinky.gridY);
    }
}
```

**Clyde (Orange)**: Proximity-based retreat
```javascript
if (mode === SCATTER) {
    target = (0, 30); // Bottom-left corner
} else {
    const dist = distance(ghost, pacman);
    if (dist > 8) {
        target = (pacman.gridX, pacman.gridY); // Chase
    } else {
        target = (0, 30); // Retreat to corner
    }
}
```

**Direction Selection**:
```javascript
chooseDirection(ghost, maze) {
    const validDirs = getValidDirections(maze, ghost.gridX, ghost.gridY);

    // Filter out reverse (unless frightened)
    if (!ghost.isFrightened && ghost.direction !== NONE) {
        const reverseDir = getReverseDirection(ghost.direction);
        validDirs = validDirs.filter(d => d !== reverseDir);
    }

    if (ghost.isFrightened) {
        // Pseudorandom choice
        return validDirs[Math.floor(Math.random() * validDirs.length)];
    } else {
        // Choose direction minimizing distance to target
        let bestDir = validDirs[0];
        let bestDist = Infinity;
        for (const dir of validDirs) {
            const dist = distance(newX, newY, targetX, targetY);
            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }
        return bestDir;
    }
}
```

**Strengths**:
- Authentic AI behaviors
- Mode cycling accurate to original
- Target calculations implement original bugs (characterful)

**Weaknesses**:
- No pathfinding (greedy direction choice)
- Tied to specific ghost types (not extensible)
- No configurable difficulty scaling

---

## Scene Management

### Scene Architecture

All scenes extend `Phaser.Scene`:

```javascript
class SceneName extends Phaser.Scene {
    constructor() {
        super('SceneName');
    }

    create() {
        // Initialize scene resources
        // Setup input
        // Create game objects
    }

    update(time, delta) {
        // Per-frame updates (if applicable)
    }
}
```

### Scene List

**MenuScene** (308 lines):
- Animated title with glow effect
- High score display
- "How to Play" toggleable panel
- Control instructions
- Pulsing start prompt
- Input: SPACE (start), H (toggle how-to-play)

**GameScene** (708 lines):
- Core gameplay loop
- Entity spawning and management
- System initialization and coordination
- UI updates
- Input: Arrow/WASD, P (pause), ESC (menu)
- Touch: Swipe detection

**PauseScene**:
- Overlay semi-transparent panel
- Options: Resume, Restart, Quit

**GameOverScene**:
- "GAME OVER" title
- Final score display
- "Play Again" / "Main Menu" options

**WinScene**:
- "LEVEL COMPLETE!" title
- Score display
- "Next Level" / "Main Menu" options

### Scene Transitions

```javascript
// Forward transition (pass data)
this.scene.start('TargetScene', {
    score: this.gameState.score,
    level: this.gameState.level + 1,
    highScore: this.gameState.highScore
});

// Backward transition (no data needed)
this.scene.start('MenuScene');

// Pause overlay (parallel scene)
this.scene.pause();
this.scene.launch('PauseScene');

// Resume from pause
this.scene.resume();
```

### Input Handling Pattern

```javascript
// Keyboard setup
this.cursors = this.input.keyboard.createCursorKeys();
this.wasd = this.input.keyboard.addKeys('W,A,S,D');

// Event-based (single trigger)
this.input.keyboard.on('keydown-P', () => {
    this.gameState.isPaused = !this.gameState.isPaused;
});

// State-based (continuous)
if (this.cursors.left.isDown || this.wasd.A.isDown) {
    this.pacman.setDirection(directions.LEFT);
}
```

**Touch Controls**:
```javascript
// Swipe detection in GameScene.setupTouchControls()
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
        // Horizontal swipe
        if (deltaX > 0) this.pacman.setDirection(directions.RIGHT);
        else this.pacman.setDirection(directions.LEFT);
    } else if (Math.abs(deltaY) > threshold) {
        // Vertical swipe
        if (deltaY > 0) this.pacman.setDirection(directions.DOWN);
        else this.pacman.setDirection(directions.UP);
    }
});
```

**Strengths**:
- Clear scene separation
- Data passing via scene.start() parameters
- Consistent input patterns
- Mobile touch support

**Weaknesses**:
- Large GameScene (708 lines) - multiple responsibilities
- No shared input handler
- Input logic scattered across scenes

---

## State Management

### Scene-Level State

Each scene manages its own state:

```javascript
// MenuScene
this.highScore = storageManager.getHighScore();
this.howToPlayVisible = false;

// GameScene
this.gameState = {
    score: data.score || 0,
    lives: 3,
    level: data.level || 1,
    isPaused: false,
    isGameOver: false,
    isDying: false,
    deathTimer: 0,
    highScore: storageManager.getHighScore()
};
```

### Entity-Level State

```javascript
// Pacman state
this.direction = directions.NONE;
this.nextDirection = directions.NONE;
this.isMoving = false;
this.isDying = false;
this.mouthAngle = 0;
this.mouthDirection = 1;

// Ghost state
this.mode = ghostModes.SCATTER;
this.isFrightened = false;
this.isEaten = false;
this.isBlinking = false;
this.frightenedTimer = 0;
this.modeTimer = 0;
```

### State Passing Between Scenes

```javascript
// Forward to next scene
this.scene.start('GameScene', {
    score: this.gameState.score,
    level: this.gameState.level
});

// Access passed data in target scene
constructor() { super('GameScene'); }
init(data) {
    this.gameState = {
        score: data.score || 0,
        level: data.level || 1
        // ... other state
    };
}
```

### Global State vs Local State

**Global (Config)**: Constants, colors, scoring - immutable
**Scene-Local**: Game state, UI references - mutable
**Entity-Local**: Position, direction, mode - mutable

**Pattern**: No global game state object - passed via scene parameters

**Strengths**:
- Clear ownership
- No global mutable state
- Data flow explicit via scene transitions

**Weaknesses**:
- State duplicated across scenes (score, level, highScore)
- No single source of truth for game state
- Manual state reconstruction on scene changes

---

## Collision Detection

### Movement & Grid Rules

- **Tile-centered stepping**: Movement resolves in tile-sized steps, snapping to centers when within a small epsilon.
- **Turn gating**: Buffered turns apply only at tile centers, simplifying movement state.
- **Tunnel warps**: Portal tiles warp to the opposing portal when moving outward, handled directly in the movement step.

### Collision Types

1. **Entity-Maze**: Handled by entities (grid-based)
2. **Pacman-Pellet**: Grid tile query + sprite management
3. **Pacman-PowerPellet**: Grid tile query + global state change
4. **Pacman-Ghost**: Swept capsule check
5. **Pacman-Fruit**: Distance-based check

### Collision Algorithm

```javascript
// Grid-based collision (entity-maze)
canMoveInDirection(direction, maze) {
    const nextGridX = this.gridX + direction.x;
    const nextGridY = this.gridY + direction.y;
    return maze[nextGridY][nextGridX] !== WALL;
}

// Swept capsule collision (entity-entity)
checkEntityCollision(entity1, entity2) {
    return capsuleCollision(
        entity1.prevX ?? entity1.x,
        entity1.prevY ?? entity1.y,
        entity1.x,
        entity1.y,
        entity2.prevX ?? entity2.x,
        entity2.prevY ?? entity2.y,
        entity2.x,
        entity2.y,
        collisionRadius
    );
}
```

### Collision Handling Flow

```javascript
// GameScene.update()
checkCollisions() {
    const results = collisionSystem.checkAllCollisions();

    if (results.pelletScore > 0) {
        gameState.score += results.pelletScore;
        soundManager.playWakaWaka();
        checkFruitSpawn(); // 70% threshold check
    }

    if (results.powerPelletScore > 0) {
        gameState.score += results.powerPelletScore;
        GhostFactory.setGhostsFrightened(ghosts, duration);
        soundManager.playPowerPellet();
        createPowerPelletEffect();
    }

    if (results.ghostCollision) {
        if (results.ghostCollision.type === 'ghost_eaten') {
            gameState.score += results.ghostCollision.score;
            soundManager.playGhostEaten();
            createGhostEatenEffect();
        } else {
            handlePacmanDeath();
        }
    }
}
```

### Hitbox Configuration

```javascript
// Pacman: 80% tile size
const radius = gameConfig.tileSize * 0.4;

// Ghost: 80% tile size
const radius = gameConfig.tileSize * 0.4;

// Pellet: Small dot
const radius = 3; // ~15% tile size

// Collision threshold
const collisionRadius = gameConfig.tileSize * 0.6; // 12 pixels
```

**Strengths**:
- Fast collision detection (O(1) per entity)
- Grid-based maze collision is efficient
- Distance-based entity collision is simple

**Weaknesses**:
- No spatial partitioning (not needed for 4 ghosts)
- Manual sprite management (array splicing)
- No collision groups from Phaser

---

## Ghost AI System

### Ghost Modes

1. **SCATTER**: Ghosts move to assigned corner targets
2. **CHASE**: Ghosts actively pursue Pac-Man (unique targeting per ghost)
3. **FRIGHTENED**: Ghosts move randomly, can be eaten
4. **EATEN**: Ghost returns to ghost house (direct pathfinding)

### Mode Cycle

```javascript
// Classic Pac-Man mode timing
Level 1:
    SCATTER (7s) → CHASE (20s) → SCATTER (7s) → CHASE (20s) → SCATTER (5s) → CHASE (20s) → SCATTER (5s) → CHASE (∞)

Level 2+:
    Same cycle, but:
    - Ghost speed: +5% per level
    - Frightened duration: -500ms per level
```

### Targeting Algorithms

**Blinky**: Simple pursuit
```
Target: Pac-Man's current position
Distance check: None
Mode switch: Reverses direction
```

**Pinky**: Ambush
```
Target: Pac-Man's position + 4 tiles in direction
Special case: If Pac-Man moving UP, target shifts LEFT
Purpose: Intercept, not chase
```

**Inky**: Vector attack
```
Pivot: Pac-Man's position + 2 tiles in direction
Target: Vector from Blinky through pivot (doubled)
Special case: Same UP bug as Pinky
Purpose: Flank Pac-Man using Blinky as reference
```

**Clyde**: Unpredictable
```
Distance check: 8-tile Euclidean radius
If > 8: Target Pac-Man
If ≤ 8: Target scatter corner
Purpose: Pokey behavior - alternates between chase and scatter
```

### Frightened Mode

```javascript
// Triggered by power pellet
setFrightened(duration) {
    this.isFrightened = true;
    this.frightenedTimer = duration;
    this.speed = baseSpeed * 0.5; // Half speed
    this.direction = getReverseDirection(direction); // Immediate reversal
}

updateFrightened(delta) {
    this.frightenedTimer -= delta;
    this.blinkTimer += delta;

    if (this.frightenedTimer <= 2000) {
        this.isBlinking = true; // Flash warning
    }

    if (this.frightenedTimer <= 0) {
        this.isFrightened = false;
        this.isBlinking = false;
        this.speed = baseSpeed;
    }
}

visual update:
if (isBlinking && floor(timer / 200) % 2 === 0) {
    setFillStyle(0xFFFFFF); // White
} else {
    setFillStyle(0x0000FF); // Blue
}
```

### Direction Selection at Intersections

```javascript
// Ghost movement rules:
1. Can only change direction at tile centers
2. Cannot reverse direction (except mode change or frightened)
3. Choose direction minimizing distance to target
4. If frightened: random direction

Algorithm:
chooseDirection(ghost, maze) {
    const validDirs = getValidDirections(maze, ghost.gridX, ghost.gridY);

    // Rule 2: Filter reverse
    if (!ghost.isFrightened) {
        const reverseDir = getReverseDirection(ghost.direction);
        validDirs = validDirs.filter(d => d !== reverseDir);
    }

    // Rule 4: Frightened = random
    if (ghost.isFrightened) {
        return validDirs[Math.floor(Math.random() * validDirs.length)];
    }

    // Rule 3: Minimize distance to target
    let bestDir = validDirs[0];
    let bestDist = Infinity;
    for (const dir of validDirs) {
        const newX = ghost.gridX + dir.x;
        const newY = ghost.gridY + dir.y;
        const dist = distance(newX, newY, targetX, targetY);
        if (dist < bestDist) {
            bestDist = dist;
            bestDir = dir;
        }
    }
    return bestDir;
}
```

**Strengths**:
- Authentic ghost behaviors
- Mode cycle accurate to original
- Four distinct personalities

**Weaknesses**:
- No pathfinding (greedy, can get stuck)
- Hardcoded ghost types
- No difficulty adjustment (only speed/frightened duration)
- Global mode affects all ghosts equally

---

## Audio System

### SoundManager Architecture

**File**: `src/managers/SoundManager.js` (141 lines)

**Implementation**: Web Audio API oscillators (no external assets)

```javascript
export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.5;
        this.initialized = false;
    }

    initialize() {
        // Must be called after user interaction (browser policy)
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
    }

    playTone(frequency, duration, type = 'square') {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, currentTime);

        gainNode.gain.setValueAtTime(this.volume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);
    }
}
```

### Sound Effects

| Sound | Frequency | Waveform | Pattern |
|--------|-----------|-----------|----------|
| Waka-waka | 400Hz | triangle | Single tone |
| Power pellet | 600Hz → 800Hz | square | Delayed second tone |
| Ghost eaten | 800Hz → 1000Hz | square | Delayed second tone |
| Death | 400→350→300→250→200→150→100Hz | sawtooth | Descending scale |
| Level complete | 523→659→784→1047Hz | sine | Ascending major chord |
| Fruit eat | 500Hz → 700Hz | sine | Delayed second tone |

**Strengths**:
- No external assets
- Instant loading
- Small code footprint

**Weaknesses**:
- Limited sound variety
- No volume control beyond master
- No sound effects library
- No music or ambient sounds

### Integration Pattern

```javascript
// GameScene.create()
this.soundManager = new SoundManager();

// GameScene.showReadyCountdown() - after user interaction
this.soundManager.initialize();

// GameScene collision handling
if (results.pelletScore > 0) {
    this.soundManager.playWakaWaka();
}

if (results.powerPelletScore > 0) {
    this.soundManager.playPowerPellet();
}
```

---

## Persistence Layer

### StorageManager

**File**: `src/managers/StorageManager.js`

**Implementation**: localStorage wrapper

```javascript
export class StorageManager {
    getHighScore() {
        const stored = localStorage.getItem('pacman_high_score');
        return stored ? parseInt(stored, 10) : 0;
    }

    saveHighScore(score) {
        const current = this.getHighScore();
        if (score > current) {
            localStorage.setItem('pacman_high_score', score.toString());
        }
    }
}
```

**Usage Pattern**:
```javascript
// MenuScene.create()
this.storageManager = new StorageManager();
this.highScore = this.storageManager.getHighScore();

// GameOverScene / WinScene
this.storageManager.saveHighScore(this.gameState.score);
```

**Strengths**:
- Simple API
- Browser-native
- No server needed

**Weaknesses**:
- No error handling for quota exceeded
- No versioning (future schema changes could break)
- No additional settings persistence

---

## Performance Considerations

### Frame Rate

**Configuration**: 60 FPS target
```javascript
fps: {
    target: 60,
    forceSetTimeOut: true,
    smoothStep: true
}
```

### Rendering Optimizations

**Sprite Batching**: Used by Phaser automatically
- All entities use Phaser built-in objects
- Automatic batch rendering

**Graphics vs Sprites**:
- Pacman/Ghost: `Arc` (GPU-accelerated)
- Fruit: `Graphics` (CPU-based, redraws)
- Pellets: `Circle` (GPU-accelerated)
- Maze: `Graphics` (static, drawn once)

**Tweens**: Efficient interpolation
```javascript
this.tweens.add({
    targets: object,
    properties: { ... },
    duration: ms,
    ease: 'EaseName'
});
```

### Movement Optimization

**Delta-Time Based**:
```javascript
update(delta, maze) {
    const moveStep = this.speed * (delta / 1000);
    this.x += this.direction.x * moveStep;
    this.y += this.direction.y * moveStep;
}
```

**Grid-Based Movement**:
- Only check collisions at tile centers
- Reduced collision checks from O(frame) to O(intersections)

### Memory Management

**Object Reuse**:
- Ghosts/Pacman: Created once per game, reset positions
- Pellet sprites: Destroyed on eat (no pooling)
- Fruit: Single instance, reactivated

**Scene Cleanup**:
```javascript
cleanup() {
    if (this.soundManager) {
        this.soundManager.setEnabled(false);
    }
}
```

**Potential Issues**:
- No object pooling for pellets (frequent create/destroy)
- Fruit Graphics redraws every frame (313 lines of drawing code)
- No texture caching for complex fruit drawings

### Current Performance Profile

**Estimated Performance**:
- 60 FPS: Desktop (Chrome/Firefox/Safari)
- 30 FPS: Mobile (optimized needed)
- Memory: < 50MB (lightweight)
- Load time: < 1s (no assets)

**Bottlenecks**:
1. Fruit drawing (CPU-heavy Graphics API)
2. Pellet sprite management (array operations)
3. No spatial partitioning (acceptable for current scale)

---

## Code Quality Assessment

### Strengths

1. **Clear Separation of Concerns**
   - Config, entities, systems, scenes, managers, utils clearly separated
   - Single responsibility per module
   - Easy to navigate structure

2. **Comprehensive Configuration**
   - All constants in single file
   - Easy game balancing
   - No magic numbers

3. **Authentic Gameplay**
   - Ghost AI faithful to original
   - Mode cycling accurate
   - Scoring values correct

4. **Modern Stack**
   - ES modules
   - Vite for dev/build
   - Latest Phaser (3.80.1)

5. **No External Assets**
   - All graphics procedural
   - All sounds procedural
   - Fast load times

6. **Mobile Support**
   - Touch controls
   - Responsive scaling
   - Swipe detection

### Weaknesses

1. **Large Scene Files**
   - GameScene: 708 lines (too large, multiple responsibilities)
   - Should be split into smaller focused classes

2. **Fruit Implementation**
   - 313 lines of drawing code
   - No sprite caching
   - CPU-intensive per-frame redrawing

3. **Code Duplication**
   - Ghost targeting logic has similar patterns
   - Scene input handling repeated
   - State management duplicated across scenes

4. **Limited Error Handling**
   - No try-catch in collision detection
   - No validation in maze utilities
   - No fallback for Web Audio API failure

5. **Hardcoded Values**
   - Ghost types hardcoded in AI system
   - Fruit types hardcoded
   - No extensibility for new entities

6. **No Type System**
   - Using strings for ghost types ('blinky', 'pinky', etc.)
   - No enum validation
   - TypeScript would help here

7. **Testing Challenges**
   - Tightly coupled systems
   - No dependency injection
   - Hard to mock dependencies

8. **Performance Gaps**
   - No object pooling for pellets
   - Fruit not optimized
   - No spatial partitioning for collision (acceptable now, but not scalable)

9. **Limited Extensibility**
   - Adding new ghost types requires multiple file changes
   - Adding new fruit requires drawing code
   - No plugin system

10. **Documentation Inconsistencies**
    - Some methods lack JSDoc
    - Console.log statements in production code (Pacman.js:46)
    - Inconsistent comment style

### Overall Assessment

**Code Maturity**: Early-to-mid stage
**Maintainability**: Good (clear structure, large files are issue)
**Scalability**: Limited (hardcoded entities, no plugin system)
**Performance**: Good for current scale (60 FPS achievable)
**Extensibility**: Poor (adding features requires core changes)

**Recommendation**: Refactor for maintainability and extensibility before adding major features.
 
---

## Testing Architecture (NEW)

### Test Inventory

The MVC refactoring introduced a comprehensive test suite with clear layer separation:

**Unit Tests** (`tests/core/`, `tests/controllers/`, `tests/unit/`):
- **GameModel tests** (`tests/core/GameModel.test.js`): Pure state testing with event emission verification
- **GameController tests** (`tests/controllers/GameController.test.js`): Input-to-model-action translation with mocks
- **DirectionBuffer tests** (`tests/unit/DirectionBuffer.test.js`): Queue/apply behavior testing
- **BaseEntity tests** (`tests/unit/BaseEntity.test.js`): Entity initialization and movement
- **PreviousPositionTracking tests** (`tests/unit/PreviousPositionTracking.test.js`): Position tracking verification

**Integration Tests** (`tests/integration/`, `tests/systems/`):
- **GameModelLoop tests** (`tests/integration/GameModelLoop.test.js`): Deterministic time-step simulation with GameModel + FixedTimeStepLoop
- **GhostLifecycle tests** (`tests/integration/GhostLifecycle.test.js`): Ghost state machine and mode transitions
- **MultiEntityCollision tests** (`tests/integration/MultiEntityCollision.test.js`): Collision detection with multiple entities
- **SingleEntityMovement tests** (`tests/integration/SingleEntityMovement.test.js`): Movement edge cases and center snapping
- **CenterSnapping tests** (`tests/unit/CenterSnapping.test.js`): Tile center detection and snapping logic

**Scene/System Tests** (`tests/scenes/`, `tests/pools/`):
- **GameFlowController tests**: Scene orchestration and transitions
- **InputController tests**: Keyboard and touch input handling
- **UIController tests**: UI display and updates based on model state
- **Pool tests**: Object pooling lifecycle management

### Test Utilities

**Core Utilities** (`tests/utils/`):
- **modelTestUtils.js**: Helper for creating GameModel instances with custom state/level config
  ```javascript
  const model = createGameModel({ state: { score: 90, highScore: 100 }, levelConfig: { ... }, levelData: { ... } })
  ```
- **simulationHelpers.js**: Deterministic simulation utilities
  ```javascript
  const sequence = createDeterministicDtSequence(120, physicsConfig.FIXED_DT)
  const events = runFixedStepSimulation(loop, dtSequence)
  ```
- **inputMocks.js**: Mock factories for keyboard/touch input testing
  ```javascript
  const { input, cursors } = createKeyboardInputMock()
  const touch = createTouchInputMock()
  ```
- **testHelpers.js**: Common mock factories (MockScene, MockPacman, MockGhost, etc.)

**Setup Refactoring** (`tests/setup.js`):
- Minimal Phaser mocks (Canvas, AudioContext, GameObjects) to reduce test complexity
- Removed duplicate mock code across test files
- Shared mock objects for consistent test environment

### Testing Patterns by Layer

**Model Layer** (`tests/core/GameModel.test.js`):
- Pattern: Pure state testing with event emission verification
- No Phaser/Rendering dependencies - tests run headless in Node.js
- Example:
  ```javascript
  const model = createGameModel({ state: { score: 90 } })
  gameEvents.on(GAME_EVENTS.SCORE_CHANGED, listener)
  model.onPelletEaten(20)
  expect(snapshot.score).toBe(110)
  expect(listener).toHaveBeenCalled()
  ```

**Controller Layer** (`tests/controllers/GameController.test.js`):
- Pattern: Input-to-model-action translation with mocks
- Tests `handleInput()` method receives raw input and delegates correctly
- Validates state guards (no direction change while dying)

**View Layer** (`tests/scenes/systems/`):
- Pattern: Minimal Phaser mocks, focus on rendering/UI bindings
- Tests verify scene transitions, UI updates, visual effects
- Scene state is mocked, not fully instantiated

**Integration Layer** (`tests/integration/GameModelLoop.test.js`):
- Pattern: Deterministic time-step simulation
- Combines GameModel with FixedTimeStepLoop
- Verifies consistent timing across multiple runs
- Example:
  ```javascript
  const loop = new FixedTimeStepLoop(() => events.push(model.step(fixedDt)))
  const simulationA = runSimulation()
  const simulationB = runSimulation()
  expect(simulationA.events).toEqual(simulationB.events)  // Deterministic!
  ```

### Test Improvements After MVC Refactoring

**Before**: Phaser-coupled tests with complex scene initialization
**After**: Clean MVC separation with headless model testing

| Aspect | Before MVC | After MVC |
|---------|-------------|------------|
| **Dependencies** | Full Phaser scene, entities, pools | GameModel only (headless) |
| **Setup Complexity** | Complex scene mock hierarchy (200+ lines) | Simple `createGameModel()` call |
| **Test Execution** | Requires JSDOM/Canvas mocks | Runs in Node, no browser needed |
| **Test Speed** | Slow (full initialization) | Fast (pure logic) |
| **Determinism** | Frame-dependent, potential flakiness | Fully deterministic with `createDeterministicDtSequence()` |
| **Test Isolation** | Tight coupling to scene | Clean layer separation |
| **Mock Maintenance** | Heavy Phaser mock updates | Minimal Phaser mocks only for View tests |
| **Code Coverage** | Hard to isolate logic | Easy to cover all model paths |

### Key Testing Benefits

1. **Headless Model Testing**: GameModel can be unit tested without Phaser
2. **Deterministic Simulations**: `createDeterministicDtSequence()` ensures consistent timing
3. **Layer Separation**: Model, Controller, and View tested independently
4. **Reusable Utilities**: Test helpers reduce boilerplate across test files
5. **Minimal Mocks**: Refactored `tests/setup.js` provides minimal Phaser mocks

### Test Documentation

Comprehensive test documentation available:
- `docs/developer/test-inventory-mvc.md`: Complete classification of all tests by layer
- `docs/developer/change-task-test-suite-mvc.md`: MVC migration task documentation
- `docs/developer/test-utilities.md`: Usage examples for all shared test utilities

---

## Appendix: Key Metrics

| Metric | Value |
|---------|--------|
| Total Lines of Code | ~2,500 (excluding node_modules) |
| Main Files | 13 (entities, systems, managers, scenes, utils, config) |
| Scene Files | 5 |
| Entity Classes | 3 (Pacman, Ghost, Fruit) |
| System Classes | 2 (CollisionSystem, GhostAISystem) |
| Manager Classes | 2 (SoundManager, StorageManager) |
| Utility Modules | 1 (MazeLayout.js) |
| Configuration Objects | 10 (colors, directions, scoring, etc.) |
| Maze Tiles | 28 × 31 = 868 tiles |
| Ghost Behaviors | 4 unique personalities |
| Fruit Types | 8 distinct types |
| Total Constants | ~75 distinct values |

### Post-MVC Architecture (After Refactoring)

| Metric | Value |
|---------|--------|
| Total Lines of Code | ~2,950 (excluding node_modules) |
| Main Files | 16 (added 3: core/, controllers/, views/) |
| Scene Files | 5 (unchanged) |
| Entity Classes | 3 (unchanged) |
| System Classes | 2 (unchanged) |
| Manager Classes | 2 (unchanged) |
| Utility Modules | 4 (added 3: DirectionBuffer.js, CenterSnapper.js, TileMovement.js, WarpTunnel.js) |
| Configuration Objects | 10 (unchanged) |
| MVC Components | 3 (GameModel, GameController, EventBus + 2 Views) |
| Test Files | 20 (comprehensive test coverage) |
| Test Utilities | 5 (modelTestUtils.js, simulationHelpers.js, inputMocks.js, testHelpers.js) |

### Refactoring Impact

| Change | Impact |
|--------|---------|
| + GameModel.js (295 lines) | Pure game state, testable without Phaser |
| + GameController.js (101 lines) | Input translation layer |
| + PhaserGameView.js (310 lines) | Rendering extracted from GameScene |
| + ConsoleGameView.js (43 lines) | Headless testing support |
| + EventBus.js (136 lines) | Decoupled pub/sub communication |
| ~ GameScene.js (-300 lines) | Simplified to coordinator role |
| + DirectionBuffer.js (250 lines) | Direction queue/apply pattern |
| + CenterSnapper.js (170 lines) | Tile center detection |
| + TileMovement.js (346 lines) | Grid-based movement utilities |
| + WarpTunnel.js (118 lines) | Portal handling |
| Total Net Change | +1,017 lines (MVC + utilities) |

### Test Coverage

| Test Type | Test Count | Coverage |
|-----------|-------------|----------|
| Unit Tests | ~70 | GameModel, GameController, DirectionBuffer, CenterSnapper, TileMovement, entities |
| Integration Tests | ~40 | GameModelLoop, GhostLifecycle, MultiEntityCollision, SingleEntityMovement, systems |
| Scene Tests | ~20 | GameFlowController, InputController, UIController, pools |
| Total Tests | ~130 | 100% coverage of core game logic |

(End of file - total 1970 lines)
