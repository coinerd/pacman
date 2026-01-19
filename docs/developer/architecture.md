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

## 4. Entities

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
