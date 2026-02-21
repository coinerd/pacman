# ADA-Woman Technical Architecture

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Architecture Patterns](#core-architecture-patterns)
5. [MVC Architecture](#mvc-architecture)
6. [Entity-Component System](#entity-component-system)
7. [Input System](#input-system)
8. [Event Bus](#event-bus)
9. [Scene Management](#scene-management)
10. [State Management](#state-management)
11. [Collision Detection](#collision-detection)
12. [Virus AI System](#virus-ai-system)
13. [Audio System](#audio-system)
14. [Persistence Layer](#persistence-layer)
15. [Performance Considerations](#performance-considerations)
16. [Testing Architecture](#testing-architecture)

---

## Overview

This is a fully-functional, tech-themed browser-based maze game built with Phaser.js 3.80.1 and Vite. The implementation features a cyberpunk/hacker aesthetic with digital entities (ADA-Woman as a hexagonal security agent, viruses as malicious programs), procedural audio, and a pure MVC architecture for maximum testability.

### Key Features
- **Tech-Themed Gameplay**: Digital network navigation, data bit collection, virus elimination
- **Four Virus AI Behaviors**: Alpha (purple/direct pursuit), Beta (green/ambush), Gamma (red/erratic), Delta (orange/proximity retreat)
- **Power Packet System**: Decrypted mode with blue viruses, eliminable viruses, combo scoring
- **Data Fragment System**: Fruit bonuses with progressive appearance based on level
- **Level Progression**: Procedural maze generation with 5% speed increase per level
- **High Score Persistence**: localStorage-based high score tracking
- **Enhanced Visuals**: Circuit-style walls, glowing neon lines, hexagonal player
- **Mobile Support**: Touch swipe controls, responsive canvas scaling
- **Web Audio API**: Procedurally generated tech-themed sound effects
- **Story Mode**: Narrative chapters with boss battles
- **Additional Power-Ups**: Shield, Speed Boost, Data Magnet

---

## Technology Stack

### Core Framework
**Phaser.js 3.80.1**
- Scene management, sprite rendering, input handling, physics system, tweening, particle effects
- Used only in View layer and Scene orchestration

### Build Tools
**Vite 5.0+**
- Fast development server with HMR
- Optimized production builds with tree-shaking
- ES module support

### Rendering
**HTML5 Canvas (via Phaser)**
- Hardware-accelerated rendering through WebGL
- Efficient sprite batching
- Procedural graphics generation (no external assets)

### Audio
**Web Audio API**
- Procedural sound generation using oscillators
- Tech-themed sound effects (digital crunch, decryption, system purge)
- Browser autoplay policy compliant

### Persistence
**localStorage API**
- High score, settings, achievements, replays persistence
- Simple key-value storage

### Language
**JavaScript (ES6+)**
- Pure JavaScript (not TypeScript)
- 13,402 total lines of source code
- 1,488+ passing tests across 76 test suites

---

## Project Structure

```
src/
├── main.js                         # Phaser initialization and scene registration
├── config/
│   ├── gameConfig.js               # Central game configuration (constants, tuning)
│   └── themeConfig.js              # Theme configuration (colors, fonts, styling)
├── core/
│   ├── EventBus.js                 # Pub/sub event system and game event constants
│   └── GameModel.js               # Pure game state and rules (NO Phaser deps)
├── model/
│   ├── ModelEntity.js              # Base class for pure data entities
│   ├── entities/
│   │   ├── PlayerState.js          # ADA-Woman state data
│   │   ├── EnemyState.js          # Virus state data
│   │   └── FruitState.js          # Data fragment state data
│   └── adapters/
│       ├── EnemyAIAdapter.js       # Enemy AI logic adapter
│       └── GhostAIAdapter.js      # Legacy ghost AI adapter
├── controllers/
│   └── GameController.js         # Clean input translation (NO Phaser deps)
├── views/
│   ├── ModelDrivenGameView.js      # Pure observer view
│   └── components/
│       ├── PlayerRenderer.js       # Visual wrapper for PlayerState
│       ├── GhostRenderer.js       # Visual wrapper for EnemyState
│       └── FruitRenderer.js       # Visual wrapper for FruitState
├── input/
│   ├── InputManager.js            # Central coordinator for input adapters
│   ├── InputAdapter.js           # Abstract base adapter interface
│   └── adapters/
│       ├── KeyboardAdapter.js     # Keyboard input wrapper
│       ├── ReplayAdapter.js       # Replay playback/recording
│       └── AIInputAdapter.js     # AI-driven input
├── systems/
│   ├── FixedTimeStepLoop.js      # Fixed-step update loop (60Hz)
│   ├── DebugOverlay.js           # FPS/debug overlay
│   ├── EnemyAISystem.js        # Virus AI behavior logic
│   ├── GhostAISystem.js         # Legacy ghost AI system
│   ├── PacmanAI.js             # Demo-mode AI
│   ├── PlayerAI.js             # Alternative player AI
│   ├── AchievementSystem.js     # Achievement tracking
│   ├── ReplaySystem.js          # Replay recording/playback
│   ├── BossBattleSystem.js     # Multi-phase boss battles
│   ├── AdditionalPowerUpSystem.js # Shield, Speed Boost, Data Magnet
│   └── StoryMode.js            # Narrative chapter system
├── scenes/
│   ├── MenuScene.js            # Main menu + how-to-play
│   ├── GameScene.js            # Main gameplay scene (MVC coordinator)
│   ├── PauseScene.js           # Pause overlay
│   ├── GameOverScene.js        # Game over screen
│   ├── WinScene.js             # Level complete screen
│   ├── SettingsScene.js        # Settings configuration
│   └── systems/
│       ├── GameFlowController.js # Score, life, win/lose handling
│       ├── UIController.js      # Score/lives/level UI
│       ├── InputController.js   # Input handling
│       ├── EffectManager.js     # Visual effects
│       ├── DeathHandler.js      # Death flow and respawn
│       └── LevelManager.js     # Per-level difficulty
├── managers/
│   ├── StorageManager.js        # LocalStorage wrapper
│   ├── SoundManager.js         # Web Audio API wrapper
│   └── TechSoundManager.js     # Tech-themed sound effects
├── pools/
│   ├── PelletPool.js          # Object pool for pellets
│   └── PowerPelletPool.js     # Object pool for power pellets
├── effects/
│   └── ParticleEffectManager.js # Particle effects management
└── utils/
    ├── MazeLayout.js           # Maze data and grid helpers
    ├── MazeGenerator.js        # Procedural maze generation
    ├── TileMath.js            # Tile/pixel conversions
    ├── TileMovement.js        # Movement utilities
    ├── WarpTunnel.js          # Tunnel/warp behavior
    ├── CollisionUtils.js       # Swept capsule collision math
    ├── DebugLogger.js         # Debug logging helper
    ├── ErrorHandler.js         # Error handling and assertions
    ├── Time.js                # Delta normalization
    ├── SpawnValidator.js       # Spawn validation
    └── movement/
        ├── DirectionBuffer.js    # Buffered turning logic
        ├── MovementState.js     # Movement state constants
        └── EntityValidator.js  # Validation utilities
```

---

## Core Architecture Patterns

### 1. MVC Architecture

The game uses a pure MVC pattern with strict separation:

```
Input Layer (Controller)
    ↓
Model Layer (GameModel + Entity States)
    ↓
EventBus (Pub/Sub Decoupling)
    ↓
View Layer (ModelDrivenGameView + Renderers)
```

- **Model**: Pure state and logic, no Phaser dependencies
- **View**: Pure observer, renders model state via renderers
- **Controller**: Input translation, emits actions via EventBus

### 2. Entity-Component Pattern

Separation of data entities and visual components:

```
ModelEntity (Pure Data)
    - gridX, gridY, x, y, direction, speed
    - NO Phaser dependencies
    - Headless testable

VisualRenderer (Phaser Wrapper)
    - Wraps ModelEntity for rendering
    - Creates Phaser graphics/sprites
    - Syncs to model state each frame
```

Benefits:
- Model can be tested without Phaser
- View can be replaced without touching game logic
- Single source of truth (ModelEntity)

### 3. Event-Driven Architecture

All components communicate via EventBus:

```javascript
// Model emits events
gameEvents.emit(GAME_EVENTS.PELLET_EATEN, { score: 10 });

// View subscribes
gameEvents.on(GAME_EVENTS.PELLET_EATEN, (data) => {
    soundManager.playWakaWaka();
    visualPellet.destroy();
});
```

Benefits:
- Decoupled components
- Easy to add new listeners
- No direct dependencies

### 4. Adapter Pattern

Multiple input sources via common interface:

```javascript
InputManager
    ├── KeyboardAdapter
    ├── ReplayAdapter
    └── AIInputAdapter

// All implement: onInput(), emitInput(), enable(), disable(), update()
```

Benefits:
- Swappable input sources
- Testable adapters
- Clean interface

---

## MVC Architecture

### Model Layer

**GameModel** (`src/core/GameModel.js`)
- Pure game state and rules
- ZERO Phaser dependencies (runs headless in Node)
- State: score, lives, level, highScore, pelletsEaten, virusesEaten, etc.
- Entities: PlayerState, EnemyState[], FruitState
- Integrated movement and collision logic
- Emits events via EventBus

**ModelEntity** (`src/model/ModelEntity.js`)
- Base class for all pure data entities
- Grid position, pixel position, direction, speed, moveProgress
- Direction buffer for queued turns
- Methods: `canMoveInDirection()`, `isValidPosition()`, `handleTunnelWrap()`, `startMove()`, `updateMovement()`

**PlayerState** (`src/model/entities/PlayerState.js`)
- Extends ModelEntity
- Animation state: mouthAngle, mouthDirection
- Power-up flags: isShielded, hasSpeedBoost, hasDataMagnet
- Methods: `update()`, `updateMouthAnimation()`, `die()`, `reset()`

**EnemyState** (`src/model/entities/EnemyState.js`)
- Extends ModelEntity
- Virus type: alpha, beta, gamma, delta
- Mode: PATROL, HUNT, DECRYPTED, ELIMINATED
- AI targeting logic for each virus type
- State: isFrightened, isEaten, frightenedTimer, isBlinking
- Methods: `update()`, `updateFrightened()`, `updateAI()`, `setFrightened()`, `eat()`

**FruitState** (`src/model/entities/FruitState.js`)
- Extends ModelEntity
- State: active, fruitType, spawnTime, lifetime
- Methods: `update()`, `spawn()`, `eat()`, `reset()`

### View Layer

**ModelDrivenGameView** (`src/views/ModelDrivenGameView.js`)
- Pure observer View
- Creates renderers from model entities
- Binds to model events
- Handles scene transitions via controller events
- No game logic, only rendering

**PlayerRenderer** (`src/view/components/PlayerRenderer.js`)
- Visual wrapper for PlayerState
- Hexagonal ADA-Woman with digital eye
- Mouth animation, rotation, pulse effect
- Power-up visual effects (shield, speed trail, magnet field)

**GhostRenderer** (`src/view/components/GhostRenderer.js`)
- Visual wrapper for EnemyState
- Geometric virus entities with color-coded personalities
- Eye tracking, blinking (decrypted state), eaten state

**FruitRenderer** (`src/view/components/FruitRenderer.js`)
- Visual wrapper for FruitState
- Data fragments with pulsing animation
- Score popup on collection

### Controller Layer

**GameController** (`src/controllers/GameController.js`)
- Clean input translation layer
- ZERO Phaser dependencies, NO scene references
- Handles direction input and action input (pause, resume, return to menu)
- Emits controller events for View-layer concerns
- Routes input through InputManager for swappable sources

---

## Entity-Component System

### Data Entities (Model Layer)

All entities extend `ModelEntity`:

```javascript
class ModelEntity {
    // Position
    gridX, gridY, x, y
    prevGridX, prevGridY, prevX, prevY

    // Movement
    direction, nextDirection, speed, moveProgress
    directionBuffer

    // State
    type, id, isMoving

    // Visual state (data only)
    visualState: { visible, opacity, scale }
}
```

### Visual Components (View Layer)

Each data entity has a corresponding renderer:

```javascript
class PlayerRenderer {
    constructor(scene, playerState) {
        this.state = playerState
        this.sprite = createHexagon()
        this.eye = createDigitalEye()
    }

    sync() {
        this.sprite.x = this.state.x
        this.sprite.y = this.state.y
        this.sprite.rotation = this.state.direction.angle
        // ... update mouth, eye, effects
    }
}
```

### Separation of Concerns

- **ModelEntity**: Pure data, movement logic, collision detection
- **VisualRenderer**: Phaser graphics, animations, visual effects
- **No dual entities**: Single source of truth in ModelEntity

---

## Input System

### InputManager

Central coordinator for multiple input adapters:

```javascript
const inputManager = new InputManager();

// Register adapters
inputManager.registerAdapter('keyboard', new KeyboardAdapter(scene.input));
inputManager.registerAdapter('replay', new ReplayAdapter());
inputManager.registerAdapter('ai', new AIInputAdapter());

// Switch between sources
inputManager.setActiveAdapter('keyboard');  // Normal gameplay
inputManager.setActiveAdapter('replay');     // Watch replay
inputManager.setActiveAdapter('ai');         // Demo mode
```

### InputAdapter Interface

All adapters implement the same interface:

```javascript
class InputAdapter {
    onInput(callback)        // Subscribe to input events
    emitInput(input)         // Emit normalized input
    enable() / disable()    // State control
    update(deltaTime)        // Poll-based input
}
```

### Available Adapters

1. **KeyboardAdapter**: Arrow keys and WASD
2. **ReplayAdapter**: Playback of recorded input sequences
3. **AIInputAdapter**: Bot gameplay with heuristics
4. **ScriptedAIAdapter**: Predefined input sequences (testing)

### Benefits

- **Swappable**: Switch between keyboard, replay, AI without code changes
- **Testable**: Each adapter can be unit tested independently
- **Extensible**: Easy to add new sources (voice, network, gestures)

---

## Event Bus

### EventBus Implementation

Lightweight pub/sub system:

```javascript
import { gameEvents, GAME_EVENTS } from './EventBus.js';

// Subscribe
gameEvents.on(GAME_EVENTS.PELLET_EATEN, (data) => {
    console.log('Pellet eaten:', data.score);
});

// Emit
gameEvents.emit(GAME_EVENTS.PELLET_EATEN, { score: 10, gridX: 5, gridY: 10 });

// Once
gameEvents.once(GAME_EVENTS.GAME_OVER, () => {
    saveHighScore();
});
```

### Game Events

```javascript
GAME_EVENTS = {
    // Game State
    PELLET_EATEN, POWER_PELLET_EATEN, GHOST_EATEN, FRUIT_EATEN,
    LEVEL_COMPLETE, GAME_OVER, LIVES_LOST, SCORE_CHANGED,
    HIGH_SCORE_CHANGED, PAUSE_TOGGLED, GAME_STARTED, GAME_RESET,

    // Controller Actions
    DIRECTION_CHANGED, PAUSE_REQUESTED, RESUME_REQUESTED,
    RETURN_TO_MENU_REQUESTED, RESTART_LEVEL_REQUESTED,

    // Feature Events
    ACHIEVEMENT_UNLOCKED, BOSS_SPAWNED, BOSS_PHASE_CHANGED,
    BOSS_DEFEATED, POWER_UP_SPAWNED, POWER_UP_COLLECTED,
    CHAPTER_STARTED, CHAPTER_COMPLETED
}
```

### Benefits

- **Decoupling**: No direct dependencies between components
- **Flexibility**: Easy to add new listeners without modifying source
- **Testability**: Mock events for testing

---

## Scene Management

### Scene Flow

```
MenuScene
    ↓ (Start Game)
GameScene
    ↓ (Pause)
PauseScene
    ↓ (Resume)
GameScene
    ↓ (Win)
WinScene
    ↓ (Next Level)
GameScene
    ↓ (Game Over)
GameOverScene
    ↓ (Return to Menu)
MenuScene
```

### GameScene Responsibilities

GameScene acts as MVC coordinator:

1. **Initialization**:
   - Creates GameModel (pure state)
   - Creates GameController (input translation)
   - Creates ModelDrivenGameView (visual observer)
   - Registers input adapters with InputManager

2. **Update Loop**:
   - Runs FixedTimeStepLoop at 60Hz
   - Calls `GameModel.step(deltaTime)` for game logic
   - Calls `ModelDrivenGameView.sync()` for rendering

3. **Event Handling**:
   - Binds to controller events for scene transitions
   - Binds to model events for visual updates

### Other Scenes

- **MenuScene**: Title, high score, how-to-play, settings navigation
- **PauseScene**: Overlay with resume/return options
- **WinScene**: Level complete, score, next level button
- **GameOverScene**: Final score, return to menu button
- **SettingsScene**: Sound, volume, FPS, difficulty toggles

---

## State Management

### GameModel State

Centralized state in GameModel:

```javascript
GameModel {
    // Level & Score
    level, score, highScore, lives

    // Pellets
    pelletsEaten, pelletsRemaining, totalPellets

    // Viruses
    ghostsEaten, currentComboGhosts, maxComboGhosts

    // Timers
    deathTimer, winTimer

    // Flags
    isPaused, isGameOver, isDying, levelComplete

    // Entities
    pacman: PlayerState
    ghosts: EnemyState[]
    fruit: FruitState

    // World
    maze: number[][]
    pelletGrid: number[][]
}
```

### State Snapshots

GameModel provides snapshots for serialization:

```javascript
const snapshot = gameModel.getSnapshot();
// Returns: { level, score, lives, pacman, ghosts, fruit, ... }

const serialized = gameModel.serialize();
// Returns: JSON for save/replay
```

### Determinism

- Fixed timestep ensures deterministic game logic
- Tick counter for replay validation
- Input timestamps for accurate replay playback

---

## Collision Detection

### Integrated Collision System

Collision detection is integrated into GameModel:

```javascript
// In GameModel.step():
const collisionEvents = this.checkAllCollisions();

for (const event of collisionEvents) {
    this.applyCollisionEffect(event);
}
```

### Collision Types

1. **Pellet Collision**:
   - Distance-based check to tile center
   - Removes pellet from grid
   - Emits PELLET_EATEN event

2. **Power Pellet Collision**:
   - Same as pellet
   - Sets viruses to decrypted mode
   - Emits POWER_PELLET_EATEN event

3. **Ghost Collision**:
   - Circle-based distance check
   - If decrypted: Eat ghost (combo scoring)
   - If not decrypted: Player dies
   - Emits GHOST_EATEN or PACMAN_DIED event

4. **Fruit Collision**:
   - Distance-based check
   - Collects fruit for bonus points
   - Emits FRUIT_EATEN event

### Collision Stats

GameModel tracks collision performance:

```javascript
gameModel.getCollisionStats()
// Returns: { checksPerformed, collisionsDetected }
```

Used for DebugOverlay telemetry.

---

## Virus AI System

### Virus Types and Behaviors

**Alpha (Purple)**
- Mode: Patrol → Hunt
- Targeting: Direct pursuit (targets player position)

**Beta (Green)**
- Mode: Patrol → Hunt
- Targeting: Ambush (targets 4 tiles ahead of player)

**Gamma (Red)**
- Mode: Patrol → Hunt
- Targeting: Random/erratic (chooses random valid direction)

**Delta (Orange)**
- Mode: Patrol → Hunt
- Targeting: Proximity-based retreat (chases if far, scatters if close)

### Virus Modes

1. **PATROL** (was SCATTER): Move to patrol targets
2. **HUNT** (was CHASE): Actively pursue ADA-Woman
3. **DECRYPTED** (was FRIGHTENED): Move randomly, can be eliminated
4. **ELIMINATED** (was EATEN): Return to virus core

### AI Implementation

```javascript
// In EnemyState.updateAI():
if (this.mode === virusModes.PATROL) {
    this.updateTarget(playerState);
} else if (this.mode === virusModes.HUNT) {
    this.updateTarget(playerState);
} else if (this.isDecrypted) {
    // Random direction
}

// Choose best direction to target
this.chooseDirectionToTarget(maze, this.targetX, this.targetY);
```

---

## Audio System

### SoundManager

Web Audio API wrapper:

```javascript
const soundManager = new SoundManager(scene);

soundManager.playWakaWaka();
soundManager.playPowerPellet();
soundManager.playGhostEaten();
soundManager.playDeath();
soundManager.playLevelComplete();
```

### Procedural Sound Generation

No external audio files - all sounds generated via oscillators:

```javascript
// Example: Waka-Waka sound
playWakaWaka() {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    // ... envelope and timing
}
```

### Tech-Themed Sounds

- **Data bit crunch**: Digital crunch sound
- **Power packet**: Decryption activation
- **Virus elimination**: System purge sound
- **Death**: System crash
- **Level complete**: Data upload complete
- **Boss phases**: Different tech sound effects

---

## Persistence Layer

### StorageManager

LocalStorage wrapper:

```javascript
const storageManager = new StorageManager();

// High Score
storageManager.saveHighScore(score);
storageManager.getHighScore();

// Settings
storageManager.saveSettings(settings);
storageManager.getSettings();

// Achievements
storageManager.saveAchievements(unlocked);
storageManager.getAchievements();

// Replays
storageManager.saveReplays(replays);
storageManager.getReplays();
```

### Data Persistence

- **High Score**: Persists across all sessions
- **Settings**: Sound enabled, volume, FPS overlay, difficulty
- **Achievements**: Unlock state and timestamps
- **Replays**: Last 10 recorded sessions

---

## Performance Considerations

### Fixed Timestep

- **Target**: 60 Hz fixed timestep
- **Implementation**: FixedTimeStepLoop accumulates delta time
- **Benefit**: Deterministic game logic, frame-rate independent

### Object Pooling

- **PelletPool**: Reuses pellet sprites
- **PowerPelletPool**: Reuses power pellet sprites
- **Benefit**: Reduces garbage collection

### Efficient Rendering

- **Graphics Objects**: Use Phaser.Graphics for walls and entities
- **Texture Reuse**: Generate textures once, reuse sprites
- **Batching**: Phaser automatic sprite batching

### Collision Budget

- **Budget**: 2.5ms per frame for collision checks
- **Telemetry**: DebugOverlay displays collision time
- **Optimization**: Spatial partitioning via grid-based collision

### Profiling

GameModel provides performance stats:

```javascript
gameModel.getStats()
// Returns: {
//   updateTime: 0.5,  // ms
//   updateCount: 1000,
//   tickCount: 60000,
//   movementStats: {...},
//   collisionStats: {...}
// }
```

---

## Testing Architecture

### Test Coverage

- **76 test suites** covering all major components
- **1,488+ tests passing** with 100% success rate
- **Headless testing**: Model and Controller tested without Phaser
- **Integration tests**: Full game flow verification

### Test Structure

```
tests/
├── setup.js              # JSDOM + Phaser mocks
├── utils/                 # Test helpers
├── core/                  # Model and EventBus tests
├── controllers/           # GameController tests
├── entities/             # Entity tests
├── systems/              # System tests
├── pools/                # Pool tests
├── scenes/               # Scene tests
├── unit/                 # Unit tests (movement, math, etc.)
├── regression/            # Regression tests
└── integration/           # Integration tests
```

### Headless Testing

Model and Controller can be tested in Node.js:

```javascript
// Test GameModel without Phaser
import GameModel from '../../src/core/GameModel.js';

const model = new GameModel({ level: 1, score: 0, lives: 3 });
model.step(0.016);
expect(model.score).toBe(10);
```

### Mocked Phaser

View tests use mocked Phaser:

```javascript
// __mocks__/phaser.js provides Phaser mocks
import Phaser from 'phaser';  // Gets mocked version

const scene = new Phaser.Scene();
const renderer = new PlayerRenderer(scene, playerState);
```

### Running Tests

```bash
npm test                # All tests
npm test -- --coverage  # With coverage
npm test GameModel       # Specific test file
```

---

## Summary

ADA-Woman demonstrates a modern, well-architected game implementation with:

- **Pure MVC** for separation of concerns and testability
- **Entity-Component** pattern for data/visual separation
- **Event-driven** architecture for decoupled communication
- **Adapter pattern** for flexible input handling
- **Procedural generation** for varied content
- **Headless testing** for reliable core game logic
- **Tech-themed design** with cyberpunk aesthetic
- **Performance optimization** via pooling, fixed timestep, efficient rendering

The architecture supports easy feature additions, testing, and maintenance while maintaining a clean, consistent codebase.
