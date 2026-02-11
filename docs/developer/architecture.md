# Architecture Overview

This document explains how the Pac-Man game is structured, how the subsystems communicate, and where critical responsibilities live.

## 1. System Layers

```
┌────────────────────────────────────────────────────────────┐
│                         Phaser Engine                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Scenes (Menu/Game/Pause/Win/GameOver/Settings)       │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                          │
│                  ▼                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               GameScene (core runtime)               │  │
│  │  Entities  Systems  Pools  Managers  UI Controllers  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Layers
- **Scenes**: High-level flow and UI. Each scene builds its own UI and handles scene-specific input.
- **Entities**: Grid-aware actors (Pacman, Ghosts, Fruit) derived from Phaser display objects.
- **Systems**: Pure logic components (AI, collisions, achievements, replay, debug).
- **Managers**: Shared services like audio (Web Audio API) and persistence (localStorage).
- **Pools**: Pellet and power pellet pooling to minimize garbage collection.

## 2. Core Runtime Flow

1. `src/main.js` initializes Phaser, sets scale/physics config, and registers all scenes.
2. `GameScene` boots and constructs the maze, entities, pools, UI, and systems.
3. `GameScene.update()` converts Phaser’s delta into seconds and advances the **FixedTimeStepLoop**.
4. `FixedTimeStepLoop` calls `GameScene.fixedUpdate()` at 60Hz.
5. `fixedUpdate()` updates entity movement, AI, collisions, fruit logic, and replay playback.

Key points:
- **Fixed timestep** avoids frame-rate coupling for movement and collisions.
- **GameScene.update()** only orchestrates logic and debug overlays; the heavy work happens in `fixedUpdate()`.

## 3. Scene Responsibilities

- **MenuScene**: Title UI, high-score display, how-to-play overlay, and navigation to Game/Settings.
- **GameScene**: Full game runtime (maze, entities, loops, collisions, UI, audio, achievements).
- **PauseScene**: Overlay with resume/return controls.
- **WinScene**: Level complete UI and continuation to next level.
- **GameOverScene**: End-of-run summary and return to menu.
- **SettingsScene**: Persistent configuration for sound, volume, FPS overlay, and difficulty.

## 3.1. MVC Architecture (NEW)

The game now uses a hybrid architecture combining Phaser scenes with an MVC pattern for better separation of concerns, testability, and decoupling.

```
┌─────────────────────────────────────────────────────────────┐
│                      Input Layer                           │
│  Keyboard/Touch → GameController → DIRECTION_CHANGED event   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Model Layer                           │
│  GameModel (pure state):                                   │
│  - score, lives, level, pelletsEaten                      │
│  - ghostsEaten, frightenedGhosts, ghostComboMultiplier     │
│  - deathTimer, winTimer                                   │
│  Emits: PELLET_EATEN, GHOST_EATEN, LEVEL_COMPLETE, etc.   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   EventBus (decoupler)                     │
│  Pub/sub system connects all components without direct deps   │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌──────────────────────┐      ┌──────────────────────────┐
│   View Layer        │      │   GameScene              │
│   (Rendering)       │      │   (Coordinator)          │
│   PhaserGameView    │◄─────┤   - Creates MVC components│
│   ConsoleGameView   │      │   - Integrates with       │
│                    │      │     existing entities      │
└─────────────────────┘      └──────────────────────────┘
```

### MVC Components

**GameModel** (`src/core/GameModel.js`)
- Pure game state and rules (295+ lines)
- ZERO Phaser dependencies (runs headless in Node)
- State: score, lives, level, highScore, pelletsEaten, ghostsEaten, frightenedGhosts, ghostComboMultiplier, deathTimer, winTimer
- Methods: `addScore()`, `onPelletEaten()`, `onGhostEaten()`, `step(dt)`, `getSpeedMultiplier()`, `getFrightenedDuration()`, `reset()`
- Emits events via EventBus: `PELLET_EATEN`, `GHOST_EATEN`, `LEVEL_COMPLETE`, `GAME_OVER`, `WIN`, `SCORE_CHANGED`, `LIVES_CHANGED`

**ActionRouter** (`src/controllers/ActionRouter.js`)
- Routes input actions to handlers with state validation (Phase 6 & 7)
- `ActionContext` provides `canAcceptInput()`, `canPause()`, `canResume()` utilities
- NO Phaser dependencies, NO scene references
- Supports pluggable handler system for custom actions
- Emits controller events for View-layer concerns

**GameController** (`src/controllers/GameController.js`)
- Clean input translation layer (101+ lines)
- ZERO Phaser dependencies, NO scene references (Phase 6 & 7)
- Uses ActionRouter for action routing
- Delegates scene transitions to View via events
- Routes input through InputManager for swappable sources

**PhaserGameView** (`src/views/PhaserGameView.js`)
- Full rendering logic extracted from GameScene (310 lines)
- All visual/audio updates bind to model events
- Separated concerns: no game logic, only rendering

**ConsoleGameView** (`src/views/ConsoleGameView.js`)
- Headless testing view (43 lines)
- Logs events to console for debugging
- No rendering, no Phaser dependencies

### Integration with GameScene

**ModelDrivenGameScene** acts as coordinator:
- Creates `gameModel`, clean `gameController` (no scene refs), and views during initialization
- `InputManager` subscribes to input adapters (Keyboard, Replay, AI)
- Clean `GameController` routes all input through `ActionRouter`
- `DeathHandler` uses `gameModel.step()` for death timer
- `LevelManager` uses `gameModel.getSpeedMultiplier()` and `gameModel.getFrightenedDuration()`
- `ModelDrivenGameView` observes model state and handles scene transitions via events
- Views subscribe to EventBus events for rendering updates

**Scene Transitions (Phase 7)**:
- Controller emits request events: `PAUSE_REQUESTED`, `RESUME_REQUESTED`, `RETURN_TO_MENU_REQUESTED`
- View binds to controller events and handles scene transitions (proper MVC separation)
- No scene references in Controller - transitions are View-layer concerns

### Benefits

- **Separation of Concerns**: Game logic (Model) isolated from rendering (View) and input (Controller)
- **Testability**: Model and Controller can be tested without Phaser (pure JavaScript, headless in Node)
- **Decoupling**: EventBus removes direct dependencies between components
- **Flexibility**: Easy to add new views (e.g., React UI, console logger) without changing model logic
- **Maintainability**: Clear boundaries make code easier to understand and modify

## 4. Input System (Phase 5)

The game uses an abstract input system that supports multiple input sources via the Adapter pattern:

### Components

**InputManager** (`src/input/InputManager.js`)
- Central coordinator for multiple input adapters
- `registerAdapter(name, adapter)` - Register input sources
- `setActiveAdapter(name)` - Switch between sources (keyboard, replay, AI)
- Input history tracking for debugging
- Support for multiple simultaneous adapters

**InputAdapter Base Class** (`src/input/InputAdapter.js`)
- Abstract interface defining common adapter API
- `onInput(callback)` - Subscribe with unsubscribe support
- `emitInput(input)` - Emit normalized input events
- `enable()/disable()` - State control
- `update(deltaTime)` - Poll-based input for continuous sources

**Adapters**:
- `KeyboardAdapter` - Phaser keyboard wrapper (arrows, WASD)
- `ReplayAdapter` - Playback of recorded input sequences
- `ReplayRecorder` - Records input events with timestamps
- `AIInputAdapter` - AI-controlled input for bot gameplay
- `ScriptedAIAdapter` - Predefined input sequences

### Benefits

- **Swappable Input Sources**: Switch between keyboard, replay, AI without changing game logic
- **Testability**: Input adapters can be unit tested without Phaser
- **Record/Replay**: Debug issues by recording and replaying exact input sequences
- **Extensibility**: Easy to add new sources (voice, network, gestures)

## 5. Entities

### Pacman
- Extends `BaseEntity`, using grid movement and a buffered input system.
- Handles mouth animation and death animation.
- Uses a base speed derived from level config.

### Ghost
- Extends `BaseEntity` with state for mode (scatter/chase/frightened/eaten).
- Movement decisions are delegated to `GhostAISystem`.
- Handles speed modifiers (frightened, tunnel, eaten).

### Fruit
- Sprite-based fruit with procedurally generated textures.
- Supports activation timers, pulsing animation, and per-level type changes.

## 5. Systems

### CollisionSystem
- Tile-based pellet/power pellet detection and ghost collisions.
- Uses **swept capsule collision** to handle fast movement safely.
- Maintains performance telemetry (budget, EMA) for debug overlay.

### GhostAISystem
- Implements classic scatter/chase cycles and ghost personality targeting.
- Updates ghost targets and direction changes at intersections.

### AchievementSystem
- Tracks achievement conditions and emits notifications via the `EventBus`.
- Stores unlock state in localStorage.

### ReplaySystem
- Records input/score/level with timestamps.
- Persists replays in localStorage (keeps last 10 recordings).
- Replays by emitting synthetic input events via the `EventBus`.

### FixedTimeStepLoop
- Handles fixed-step updates and warns on timing anomalies.

### PacmanAI
- Optional demo-mode AI based on pellet proximity and ghost danger heuristic.

### DebugOverlay
- Optional FPS and collision telemetry overlay for debugging.

## 6. Movement & Grid System

- **GridMovement**: Core movement logic that snaps entities to tile centers and processes buffered turns.
- **DirectionBuffer**: Allows immediate reversal and queued turns.
- **TileMath**: Grid/pixel conversions, tile center math, movement tolerances.
- **WarpTunnel**: Manages the tunnel row portals and grid wrapping.

## 7. Event Bus & State

- `src/core/EventBus.js` is a lightweight pub/sub system with named game events.
- Used to decouple UI notifications, replay, achievements, and input recording.

## 8. Persistence

- `StorageManager` reads/writes high scores, settings, and achievements.
- `ReplaySystem` uses localStorage to store and manage replays.

## 9. Build & Tooling

- **Vite** is used for dev server and production builds.
- **Jest** is used for tests, with a Phaser mock and jsdom environment.
- **ESLint** enforces style rules (4 spaces, single quotes, no unused vars).

For implementation details, see `gameplay.md` and `file-map.md`.
