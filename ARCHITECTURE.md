# Pac-Man Web Game - Technical Architecture

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Architecture Patterns](#core-architecture-patterns)
5. [Entity System](#entity-system)
6. [Systems Architecture](#systems-architecture)
7. [Scene Management](#scene-management)
8. [State Management](#state-management)
9. [Collision Detection](#collision-detection)
10. [Ghost AI System](#ghost-ai-system)
11. [Audio System](#audio-system)
12. [Persistence Layer](#persistence-layer)
13. [Performance Considerations](#performance-considerations)
14. [Code Quality Assessment](#code-quality-assessment)

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

### Collision Types

1. **Entity-Maze**: Handled by entities (grid-based)
2. **Pacman-Pellet**: Grid tile query + sprite management
3. **Pacman-PowerPellet**: Grid tile query + global state change
4. **Pacman-Ghost**: Distance-based check
5. **Pacman-Fruit**: Distance-based check

### Collision Algorithm

```javascript
// Grid-based collision (entity-maze)
canMoveInDirection(direction, maze) {
    const nextGridX = this.gridX + direction.x;
    const nextGridY = this.gridY + direction.y;
    return maze[nextGridY][nextGridX] !== WALL;
}

// Distance-based collision (entity-entity)
checkEntityCollision(entity1, entity2) {
    const dist = Math.sqrt(
        Math.pow(entity1.x - entity2.x, 2) +
        Math.pow(entity1.y - entity2.y, 2)
    );
    return dist < threshold; // Usually tileSize * 0.8
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
const collisionThreshold = gameConfig.tileSize * 0.8; // 16 pixels
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
