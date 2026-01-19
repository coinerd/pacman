# Comprehensive File Map

This document catalogs every project file (excluding vendored dependencies under `node_modules/`) and describes its role.

> Note: `node_modules/` is intentionally excluded because it is third-party vendor code.

## Root Directory

| Path | Purpose |
| --- | --- |
| `.gitignore` | Git ignore rules. |
| `.kilocodemodes` | Tooling configuration for Kilo Code environments. |
| `.kilo/` | Kilo Code rules and discipline docs. |
| `.opencode/PROJECT_STATE.md` | Project status notes. |
| `.opencode/CAPSULES.md` | Project capsule notes. |
| `.husky/` | Husky Git hooks configuration. |
| `ARCHITECTURE.md` | High-level architecture overview of the game. |
| `CHANGELOG.md` | Release history and change log. |
| `HARDENINGPLAN.md` | Plans for hardening/refactoring. |
| `IMPROVEMENTS.md` | Improvements log and ideas. |
| `IMPROVEMENT_PLAN.md` | Improvement roadmap. |
| `MAKE_COLLISION_GREAT_AGAIN.md` | Collision system improvement notes. |
| `MAKE_MOVEMENT_GREAT_AGAIN.md` | Movement system improvement notes. |
| `MOVEMENT_IMPROVEMENT.md` | Movement improvements specification. |
| `MOVE_FIX_PLAN.md` | Movement fix plan. |
| `README.md` | User-facing overview and feature list. |
| `babel.config.cjs` | Babel configuration for Jest. |
| `eslint.config.js` | ESLint configuration and style rules. |
| `index.html` | App entry HTML for Vite. |
| `jest.config.js` | Jest configuration and coverage thresholds. |
| `package.json` | Node scripts and dependency manifest. |
| `package-lock.json` | NPM lockfile. |
| `vite.config.js` | Vite dev/build configuration. |
| `vite.config.js.timestamp-*.mjs` | Vite temp artifact (generated). |
| `test-collision.js` | Script-based collision testing/analysis. |
| `test-debug.js` | Debug script. |
| `test_ghost_center.js` | Ghost centering test script. |
| `test_ghost_init.js` | Ghost initialization test script. |
| `test_setDirection.mjs` | Direction buffering test script. |
| `test_trace.js` | Movement/trace diagnostics script. |
| `test_tunnel.js` | Tunnel behavior test script. |
| `test_tunnel2.js` | Additional tunnel test script. |
| `trace_test.mjs` | Trace-based diagnostics script. |

## Mocks

| Path | Purpose |
| --- | --- |
| `__mocks__/phaser.js` | Phaser mocks for Jest tests. |

## Source (`src/`)

### Entry + Core

| Path | Purpose |
| --- | --- |
| `src/main.js` | Phaser initialization, scene registration, demo flag. |
| `src/config/gameConfig.js` | Central game configuration (constants, tuning, UI config). |
| `src/core/EventBus.js` | Pub/sub event bus and game event constants. |

### Scenes

| Path | Purpose |
| --- | --- |
| `src/scenes/MenuScene.js` | Main menu + how-to-play overlay + navigation. |
| `src/scenes/GameScene.js` | Main gameplay runtime, systems orchestration. |
| `src/scenes/PauseScene.js` | Pause overlay and resume/menu actions. |
| `src/scenes/GameOverScene.js` | Game over UI and return flow. |
| `src/scenes/WinScene.js` | Level complete UI and continuation. |
| `src/scenes/SettingsScene.js` | Settings UI (sound, volume, FPS, difficulty). |

### Scene Subsystems

| Path | Purpose |
| --- | --- |
| `src/scenes/systems/GameFlowController.js` | Score, life, and win/lose handling. |
| `src/scenes/systems/UIController.js` | Score/lives/level UI and messages. |
| `src/scenes/systems/InputController.js` | Keyboard input and replay controls. |
| `src/scenes/systems/EffectManager.js` | Visual effect helpers (flashes). |
| `src/scenes/systems/DeathHandler.js` | Death flow and respawn logic. |
| `src/scenes/systems/LevelManager.js` | Per-level difficulty adjustments. |

### Entities

| Path | Purpose |
| --- | --- |
| `src/entities/BaseEntity.js` | Grid-aware base class for moving actors. |
| `src/entities/Pacman.js` | Player entity with animation and movement. |
| `src/entities/Ghost.js` | Ghost entity with state and movement. |
| `src/entities/GhostFactory.js` | Ghost creation and spawn validation. |
| `src/entities/Fruit.js` | Fruit entity and texture generation. |

### Systems

| Path | Purpose |
| --- | --- |
| `src/systems/CollisionSystem.js` | Pellet/ghost collision handling + profiling. |
| `src/systems/GhostAISystem.js` | Ghost behavior logic and targeting. |
| `src/systems/AchievementSystem.js` | Achievement tracking + notifications. |
| `src/systems/ReplaySystem.js` | Replay recording and playback. |
| `src/systems/PacmanAI.js` | Demo-mode Pacman AI. |
| `src/systems/FixedTimeStepLoop.js` | Fixed-step update loop. |
| `src/systems/DebugOverlay.js` | FPS/debug overlay rendering. |

### Managers

| Path | Purpose |
| --- | --- |
| `src/managers/StorageManager.js` | localStorage wrapper for scores/settings. |
| `src/managers/SoundManager.js` | Web Audio API sound effects. |

### Pools

| Path | Purpose |
| --- | --- |
| `src/pools/PelletPool.js` | Object pool for pellets. |
| `src/pools/PowerPelletPool.js` | Object pool for power pellets. |

### Utilities

| Path | Purpose |
| --- | --- |
| `src/utils/MazeLayout.js` | Maze data + grid helpers. |
| `src/utils/TileMovement.js` | Movement wrapper and tile math exports. |
| `src/utils/TileMath.js` | Tile/pixel conversion utilities. |
| `src/utils/WarpTunnel.js` | Tunnel/warp behavior helpers. |
| `src/utils/CollisionUtils.js` | Swept capsule collision math. |
| `src/utils/DebugLogger.js` | Debug logging helper. |
| `src/utils/ErrorHandler.js` | Error handling and assertions. |
| `src/utils/Time.js` | Delta normalization helpers. |
| `src/utils/SpawnValidator.js` | Spawn validation helpers. |
| `src/utils/movement/GridMovement.js` | Core grid movement algorithm. |
| `src/utils/movement/DirectionBuffer.js` | Buffered turning logic. |
| `src/utils/movement/MovementState.js` | Movement state constants. |
| `src/utils/movement/EntityValidator.js` | Validation utilities for movement tests. |

## Tests (`tests/`)

### Core Setup

| Path | Purpose |
| --- | --- |
| `tests/setup.js` | JSDOM + Phaser mocks for unit tests. |
| `tests/utils/testHelpers.js` | Shared test helpers. |

### Core & Utilities

| Path | Purpose |
| --- | --- |
| `tests/core/EventBus.test.js` | Event bus behavior. |
| `tests/utils/DebugLogger.test.js` | Debug logger tests. |
| `tests/utils/ErrorHandler.test.js` | Error handler tests. |
| `tests/utils/Time.test.js` | Delta normalization tests. |
| `tests/utils/WarpTunnel.test.js` | Portal and warp logic tests. |
| `tests/utils/DirectionBuffer.test.js` | Direction buffer behavior. |
| `tests/utils/TileMovement.test.js` | Tile movement correctness. |

### Movement & Physics

| Path | Purpose |
| --- | --- |
| `tests/unit/movement.test.js` | Grid movement unit tests. |
| `tests/unit/fixedTimestep.test.js` | Fixed timestep behavior. |
| `tests/unit/gridHelpers.test.js` | Tile math/grid helpers. |
| `tests/unit/CenterSnapping.test.js` | Center snapping behavior. |
| `tests/unit/PreviousPositionTracking.test.js` | Position history tracking tests. |
| `tests/regression/MovementFuzz.test.js` | Fuzz regression for movement. |

### Entities

| Path | Purpose |
| --- | --- |
| `tests/entities/BaseEntity.test.js` | Base entity behavior. |
| `tests/entities/Pacman.gridMovement.test.js` | Pacman movement behavior. |
| `tests/entities/Pacman.bugfix.test.js` | Pacman regression tests. |
| `tests/entities/Ghost.test.js` | Ghost behavior tests. |
| `tests/entities/Ghost.bugfix.test.js` | Ghost regression tests. |
| `tests/entities/GhostFactory.test.js` | Ghost factory tests. |
| `tests/entities/Fruit.test.js` | Fruit behavior tests. |
| `tests/entities/EntityInitialization.test.js` | Entity spawn/init tests. |

### Systems

| Path | Purpose |
| --- | --- |
| `tests/systems/CollisionSystem.test.js` | Collision system tests. |
| `tests/systems/CollisionSystem.bugfix.test.js` | Collision regression tests. |
| `tests/systems/GhostAISystem.test.js` | Ghost AI behavior tests. |
| `tests/systems/PacmanAI.test.js` | Pacman AI logic tests. |
| `tests/systems/FixedTimeStepLoop.test.js` | Fixed loop correctness tests. |
| `tests/systems/AchievementSystem.test.js` | Achievement logic tests. |
| `tests/systems/ReplaySystem.test.js` | Replay recording/playback tests. |
| `tests/systems/DebugOverlay.test.js` | Debug overlay tests. |

### Pools

| Path | Purpose |
| --- | --- |
| `tests/pools/PelletPool.test.js` | Pellet pool tests. |
| `tests/pools/PowerPelletPool.test.js` | Power pellet pool tests. |

### Scene Systems

| Path | Purpose |
| --- | --- |
| `tests/scenes/systems/GameFlowController.test.js` | Game flow/score logic. |
| `tests/scenes/systems/UIController.test.js` | UI updates. |
| `tests/scenes/systems/InputController.test.js` | Input handling tests. |
| `tests/scenes/systems/EffectManager.test.js` | Effect manager tests. |

### Scenes & Integration

| Path | Purpose |
| --- | --- |
| `tests/scenes/SettingsScene.test.js` | Settings UI + persistence. |
| `tests/integration/SingleEntityMovement.test.js` | Single entity movement integration. |
| `tests/integration/ConcurrentMovement.test.js` | Multi-entity movement integration. |
| `tests/integration/MovementContinuity.test.js` | Movement continuity across tiles. |
| `tests/integration/MovementEdgeCases.test.js` | Edge-case movement scenarios. |
| `tests/integration/MultiEntityCollision.test.js` | Collision interactions across entities. |
| `tests/integration/TunnelBehavior.test.js` | Tunnel warp integration tests. |
| `tests/integration/GhostLifecycle.test.js` | Ghost state transitions integration. |

