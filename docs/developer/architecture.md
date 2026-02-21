# Architecture Overview

This document explains how the ADA-Woman game is structured, how the subsystems communicate, and where critical responsibilities live.

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
- **GameScene**: Main game runtime acting as MVC coordinator.
- **Entities**: Grid-aware actors (ADA-Woman, Viruses, Data Fragments) derived from pure data entities.
- **Systems**: Pure logic components (AI, collisions, achievements, replay, debug).
- **Managers**: Shared services like audio (Web Audio API) and persistence (localStorage).
- **Pools**: Pellet and power pellet pooling to minimize garbage collection.

## 2. Core Runtime Flow

1. `src/main.js` initializes Phaser, sets scale/physics config, and registers all scenes.
2. `GameScene` boots and constructs the maze, entities, pools, UI, and MVC components.
3. `GameScene.update()` converts Phaser's delta into seconds and advances the **FixedTimeStepLoop**.
4. `FixedTimeStepLoop` calls `GameScene.fixedUpdate()` at 60Hz.
5. `fixedUpdate()` updates entity movement, AI, collisions, fruit logic, and replay playback.

Key points:
- **Fixed timestep** avoids frame-rate coupling for movement and collisions.
- **GameScene.update()** only orchestrates logic and debug overlays; the heavy work happens in `fixedUpdate()`.

## 3. MVC Architecture

The game uses a **pure MVC architecture** with clear separation of concerns:

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
│  - virusesEaten, frightenedViruses, virusComboMultiplier    │
│  - deathTimer, winTimer                                   │
│  - PlayerState, EnemyState[], FruitState                   │
│  Emits: PELLET_EATEN, VIRUS_EATEN, LEVEL_COMPLETE, etc.   │
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
│   ModelDrivenGameView│◄─────┤   - Creates MVC components│
│   PlayerRenderer     │      │   - Integrates with       │
│   GhostRenderer      │      │     existing entities      │
│   FruitRenderer      │      │                          │
└─────────────────────┘      └──────────────────────────┘
```

### Model Layer

**GameModel** (`src/core/GameModel.js`)
- Pure game state and rules (13402 lines total codebase)
- ZERO Phaser dependencies (runs headless in Node)
- State: score, lives, level, highScore, pelletsEaten, virusesEaten, frightenedViruses, virusComboMultiplier, deathTimer, winTimer
- Entities: PlayerState, EnemyState[], FruitState
- Methods: `step(dt)`, `setInputDirection()`, `eatPelletAt()`, `eatGhost()`, `nextLevel()`, `resetPositions()`, `getSnapshot()`, `serialize()`
- Emits events via EventBus: `PELLET_EATEN`, `GHOST_EATEN`, `LEVEL_COMPLETE`, `GAME_OVER`, `WIN`, `SCORE_CHANGED`, `LIVES_CHANGED`
- Integrated movement and collision logic (previously separate adapters)

**ModelEntity** (`src/model/ModelEntity.js`)
- Base class for all pure data entities
- Properties: gridX, gridY, x, y, direction, speed, moveProgress, visualState
- Methods: `canMoveInDirection()`, `isValidPosition()`, `handleTunnelWrap()`, `startMove()`, `updateMovement()`, `resetPosition()`, `getSnapshot()`
- Direction buffer management for queued turns

**PlayerState** (`src/model/entities/PlayerState.js`)
- Extends ModelEntity
- State: mouthAngle, mouthDirection, maxMouthAngle, isDying, deathAnimationProgress
- Power-up flags: isShielded, hasSpeedBoost, hasDataMagnet
- Methods: `update()`, `updateMouthAnimation()`, `updateDeathAnimation()`, `die()`, `reset()`, `getVisualState()`

**EnemyState** (`src/model/entities/EnemyState.js`)
- Extends ModelEntity
- State: ghostType (alpha/beta/gamma/delta), mode (PATROL/HUNT/DECRYPTED/ELIMINATED), targetX, targetY, isEaten, isFrightened, frightenedTimer, isBlinking
- Methods: `update()`, `updateFrightened()`, `updateAI()`, `updateTarget()`, `chooseDirectionToTarget()`, `setFrightened()`, `eat()`, `reset()`, `getVisualState()`
- AI targeting logic for each virus type

**FruitState** (`src/model/entities/FruitState.js`)
- Extends ModelEntity
- State: active, fruitType, spawnTime, lifetime
- Methods: `update()`, `spawn()`, `eat()`, `reset()`, `getFruitType()`, `getSnapshot()`

### View Layer

**ModelDrivenGameView** (`src/views/ModelDrivenGameView.js`)
- Pure observer View that renders Model state without creating visual entities
- Creates Visual renderers from model entities
- Binds to model events for effects and sounds
- Scene transitions handled via controller events (proper MVC separation)
- Methods: `create()`, `sync()`, `startDeathAnimation()`, `updateDeathAnimation()`, `endDeathAnimation()`, `cleanup()`

**PlayerRenderer** (`src/view/components/PlayerRenderer.js`)
- Visual wrapper for PlayerState
- Renders hexagonal ADA-Woman with digital eye
- Handles mouth animation, rotation, pulse effect
- Power-up visual effects (shield, speed trail, magnet field)
- Methods: `sync()`, `addPowerUpEffect()`, `removePowerUpEffect()`, `destroy()`

**GhostRenderer** (`src/view/components/GhostRenderer.js`)
- Visual wrapper for EnemyState
- Renders geometric virus entities with color-coded personalities
- Handles eye tracking, blinking (frightened state), eaten state
- Methods: `sync()`, `destroy()`

**FruitRenderer** (`src/view/components/FruitRenderer.js`)
- Visual wrapper for FruitState
- Renders data fragments with pulsing animation
- Score popup on collection
- Methods: `sync()`, `showScore()`, `destroy()`

### Controller Layer

**GameController** (`src/controllers/GameController.js`)
- Clean input translation layer
- ZERO Phaser dependencies, NO scene references
- Uses InputManager for swappable input sources
- Handles action inputs (pause, resume, return to menu, restart, replay toggle)
- Emits controller events for View-layer concerns
- Methods: `handleInput()`, `handleAction()`, `activate()`, `deactivate()`, `destroy()`

### Input System

**InputManager** (`src/input/InputManager.js`)
- Central coordinator for multiple input adapters
- `registerAdapter(name, adapter)` - Register input sources
- `setActiveAdapter(name)` - Switch between sources (keyboard, replay, AI)
- Input history tracking for debugging
- Support for multiple simultaneous adapters
- Methods: `onInput()`, `update()`, `pause()`, `resume()`, `destroy()`

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

## 4. Systems Architecture

### Core Systems

**FixedTimeStepLoop** (`src/systems/FixedTimeStepLoop.js`)
- Handles fixed-step updates at 60Hz
- Accumulates delta time and processes fixed time steps
- Warns on timing anomalies
- Methods: `update(delta)`, `getStats()`, `reset()`

**DebugOverlay** (`src/systems/DebugOverlay.js`)
- Optional FPS and collision telemetry overlay
- Displays frame rate, collision budget, entity counts
- Methods: `setVisible()`, `update()`, `destroy()`

### AI Systems

**EnemyAISystem** (`src/systems/EnemyAISystem.js`)
- Implements classic Patrol/Hunt cycles for viruses
- Virus personality-based targeting
- Updates virus targets and direction changes at intersections

**GhostAISystem** (`src/systems/GhostAISystem.js`)
- Legacy ghost AI system (backward compatibility)
- Maintains original ghost targeting logic

**PacmanAI** (`src/systems/PacmanAI.js`)
- Demo-mode AI for ADA-Woman
- Heuristic-based movement (pellet proximity, virus danger)

**PlayerAI** (`src/systems/PlayerAI.js`)
- Alternative player AI implementation
- Pathfinding-based movement

### Feature Systems

**AchievementSystem** (`src/systems/AchievementSystem.js`)
- Tracks achievement conditions and emits notifications
- Stores unlock state in localStorage
- Methods: `init()`, `check()`, `unlock()`, `getUnlocked()`, `save()`, `load()`

**ReplaySystem** (`src/systems/ReplaySystem.js`)
- Records input/score/level with timestamps
- Persists replays in localStorage (keeps last 10 recordings)
- Replays by emitting synthetic input events
- Methods: `startRecording()`, `stopRecording()`, `loadRecording()`, `startReplay()`, `stopReplay()`, `getRecordings()`

**BossBattleSystem** (`src/systems/BossBattleSystem.js`)
- Multi-phase boss battle encounters
- Spawns bosses at specific levels
- Handles boss health, phases, and defeat
- Methods: `spawnBoss()`, `update()`, `damageBoss()`, `defeatBoss()`, `shouldSpawnBoss()`, `getBossEntity()`, `getSnapshot()`

**AdditionalPowerUpSystem** (`src/systems/AdditionalPowerUpSystem.js`)
- Manages additional power-ups (Shield, Speed Boost, Data Magnet)
- Spawns power-ups during gameplay
- Handles power-up collection and expiration
- Methods: `update()`, `spawnPowerUp()`, `collectPowerUp()`, `getActivePowerUps()`, `getSnapshot()`

**StoryMode** (`src/systems/StoryMode.js`)
- Narrative chapter system
- Displays story text at level transitions
- Tracks chapter completion and bonus points
- Methods: `startLevel()`, `completeChapter()`, `getChapter()`, `getSnapshot()`

## 5. Scene Management

### Scene Responsibilities

- **MenuScene**: Main menu + how-to-play overlay + navigation to Game/Settings.
- **GameScene**: Full game runtime (maze, entities, loops, collisions, UI, audio, achievements).
- **PauseScene**: Overlay with resume/return controls.
- **WinScene**: Level complete UI and continuation to next level.
- **GameOverScene**: End-of-run summary and return to menu.
- **SettingsScene**: Persistent configuration for sound, volume, FPS overlay, and difficulty.

### Scene Subsystems

**GameFlowController** (`src/scenes/systems/GameFlowController.js`)
- Handles score, life, and win/lose logic
- Manages game state transitions
- Emits game flow events

**UIController** (`src/scenes/systems/UIController.js`)
- Manages score/lives/level UI
- Handles message display (ready, level complete, etc.)
- Updates UI based on game state

**InputController** (`src/scenes/systems/InputController.js`)
- Legacy input handling (mostly replaced by GameController)
- Keyboard input and replay controls

**EffectManager** (`src/scenes/systems/EffectManager.js`)
- Visual effect helpers (flashes, particles)
- Creates power pellet, ghost eaten, fruit eat effects

**DeathHandler** (`src/scenes/systems/DeathHandler.js`)
- Death flow and respawn logic
- Manages death animation timing

**LevelManager** (`src/scenes/systems/LevelManager.js`)
- Per-level difficulty adjustments
- Applies level configuration
- Handles level transitions

## 6. Utilities

**MazeLayout** (`src/utils/MazeLayout.js`)
- Maze data and grid helpers
- Pellet type definitions (NONE, PELLET, POWER_PELLET)
- Tile type definitions (WALKABLE, WALL)
- Functions: `createMazeData()`, `countPellets()`, `getCenterPixel()`, `isWalkableTile()`, `getValidDirections()`, `getDistance()`

**TileMath** (`src/utils/TileMath.js`)
- Tile/pixel conversion utilities
- Center-snapping math
- Movement tolerance calculations

**TileMovement** (`src/utils/TileMovement.js`)
- Movement wrapper and tile math exports
- Exports: `TileMovementStrategy`, `DirectionBuffer`, `CenterSnapper`

**DirectionBuffer** (`src/utils/movement/DirectionBuffer.js`)
- Buffered turning logic
- Allows immediate reversal and queued turns
- Methods: `apply()`, `queue()`, `getCurrent()`, `getBuffered()`, `reset()`

**MovementState** (`src/utils/movement/MovementState.js`)
- Movement state constants
- Direction definitions (UP, DOWN, LEFT, RIGHT, NONE)

**EntityValidator** (`src/utils/movement/EntityValidator.js`)
- Validation utilities for movement tests
- Checks valid positions, directions, movements

**WarpTunnel** (`src/utils/WarpTunnel.js`)
- Tunnel/warp behavior helpers
- Manages horizontal wrapping at tunnel row

**CollisionUtils** (`src/utils/CollisionUtils.js`)
- Swept capsule collision math
- Distance-based collision detection
- Collision budget calculations

**MazeGenerator** (`src/utils/MazeGenerator.js`)
- Procedural maze generation
- Supports configurable parameters (width, height, path density, symmetry, seed)
- Methods: `generate()`

**DebugLogger** (`src/utils/DebugLogger.js`)
- Debug logging helper
- Conditional logging based on debug mode

**ErrorHandler** (`src/utils/ErrorHandler.js`)
- Error handling and assertions
- Centralized error reporting

**Time** (`src/utils/Time.js`)
- Delta normalization helpers
- Fixed time step utilities

**SpawnValidator** (`src/utils/SpawnValidator.js`)
- Spawn validation helpers
- Checks valid spawn positions

## 7. Event Bus & State

**EventBus** (`src/core/EventBus.js`)
- Lightweight pub/sub system with named game events
- Decouples components from direct dependencies
- Methods: `on()`, `off()`, `once()`, `emit()`, `clear()`, `listenerCount()`, `eventNames()`
- Events: `PELLET_EATEN`, `POWER_PELLET_EATEN`, `GHOST_EATEN`, `FRUIT_EATEN`, `LEVEL_COMPLETE`, `GAME_OVER`, `LIVES_LOST`, `SCORE_CHANGED`, `HIGH_SCORE_CHANGED`, `PAUSE_TOGGLED`, `DIRECTION_CHANGED`, `RESPAWN`, `ACHIEVEMENT_UNLOCKED`, `BOSS_SPAWNED`, `BOSS_DEFEATED`, `POWER_UP_SPAWNED`, `CHAPTER_STARTED`, etc.

## 8. Persistence

**StorageManager** (`src/managers/StorageManager.js`)
- localStorage wrapper for scores/settings
- Methods: `saveHighScore()`, `getHighScore()`, `saveSettings()`, `getSettings()`, `saveAchievements()`, `getAchievements()`, `saveReplays()`, `getReplays()`

**ReplaySystem** uses localStorage to store and manage replays.

## 9. Managers

**SoundManager** (`src/managers/SoundManager.js`)
- Web Audio API wrapper
- Procedural sound generation (no external audio files)
- Methods: `playWakaWaka()`, `playPowerPellet()`, `playGhostEaten()`, `playDeath()`, `playFruitEat()`, `playLevelComplete()`, `setEnabled()`, `setVolume()`, `setEnabled()`

**TechSoundManager** (`src/managers/TechSoundManager.js`)
- Tech-themed sound effects
- Additional procedural sounds for boss battles and power-ups

## 10. Pools

**PelletPool** (`src/pools/PelletPool.js`)
- Object pool for pellets
- Reduces garbage collection
- Methods: `init()`, `get()`, `release()`, `destroy()`

**PowerPelletPool** (`src/pools/PowerPelletPool.js`)
- Object pool for power pellets
- Methods: `init()`, `get()`, `release()`, `destroy()`

## 11. Integration with GameScene

**ModelDrivenGameScene** acts as coordinator:
- Creates `gameModel`, clean `gameController` (no scene refs), and `gameView` during initialization
- `InputManager` subscribes to input adapters (Keyboard, Replay, AI)
- Clean `GameController` routes all input through `InputManager`
- `DeathHandler` uses `gameModel.step()` for death timer
- `LevelManager` uses `gameModel.getSpeedMultiplier()` and `gameModel.getFrightenedDuration()`
- `ModelDrivenGameView` observes model state and handles scene transitions via events
- Views subscribe to EventBus events for rendering updates

**Scene Transitions**:
- Controller emits request events: `PAUSE_REQUESTED`, `RESUME_REQUESTED`, `RETURN_TO_MENU_REQUESTED`
- View binds to controller events and handles scene transitions (proper MVC separation)
- No scene references in Controller - transitions are View-layer concerns

## 12. Tech Theme Elements

### Visual Design
- Circuit-style walls with glowing neon lines (green/cyan color palette)
- Hexagonal ADA-Woman with digital eye that tracks movement direction
- Geometric virus entities with color-coded personalities:
  - Alpha (Purple): Direct pursuit
  - Beta (Green): Ambush/prediction
  - Gamma (Red): Random/erratic movement
  - Delta (Orange): Proximity-based behavior
- Digital grid background pattern
- Procedural textures (no external assets)

### Audio Design
- Web Audio API oscillator-based sounds
- Tech-themed sound effects:
  - Digital data crunch when collecting data bits
  - Power packet activation (decryption sound)
  - Virus elimination (system purge sound)
  - Death sequence (system crash)
  - Level complete (data upload)
- No external audio files

### Narrative Context
- ADA-Woman: Digital security entity
- Viruses: Malicious programs
- Data bits: System integrity points
- Power packets: Decryption tools
- Virus core: Spawn/chamber area
- Boss battles: Major security threats

## 13. Benefits of Current Architecture

- **Separation of Concerns**: Game logic (Model) isolated from rendering (View) and input (Controller)
- **Testability**: Model and Controller can be tested without Phaser (pure JavaScript, headless in Node)
- **Decoupling**: EventBus removes direct dependencies between components
- **Flexibility**: Easy to add new views (e.g., React UI, console logger) without changing model logic
- **Maintainability**: Clear boundaries make code easier to understand and modify
- **Swappable Input**: Keyboard, Replay, AI all use the same interface via InputManager
- **Procedural Generation**: MazeGenerator creates varied mazes without external assets
- **Performance**: Object pooling, fixed timestep, efficient rendering
