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
| `README.md` | User-facing overview and feature list. |
| `package.json` | Node scripts and dependency manifest. |
| `package-lock.json` | NPM lockfile. |
| `vite.config.js` | Vite dev/build configuration. |
| `babel.config.cjs` | Babel configuration for Jest. |
| `eslint.config.js` | ESLint configuration and style rules. |
| `jest.config.js` | Jest configuration and coverage thresholds. |
| `index.html` | App entry HTML for Vite. |

## Legacy Analysis Documents (May Be Outdated)

| Path | Purpose |
| --- | --- |
| `100_PRD_COMPLIANCE.md` | PRD compliance analysis. |
| `ADA_MOVEMENT_FIX.md` | Movement fix notes. |
| `ADA-Woman_REBRAND.md` | Rebrand documentation. |
| `CLAUDE.md` | AI assistant context. |
| `COLOR_CONSISTENCY_REPORT.md` | Color consistency analysis. |
| `DECOUPLED_SYSTEMS_IMPROVEMENT_PLAN.md` | System decoupling plan. |
| `ENTITY_CENTERING_DEEP_ANALYSIS.md` | Entity centering analysis. |
| `ENTITY_CENTERING_FIX_PLAN.md` | Entity centering fix plan. |
| `ENTITY_CENTERING_FIX_SUMMARY.md` | Entity centering fix summary. |
| `FIX_SUGGESTIONS.md` | Bug fix suggestions. |
| `HARDENINGPLAN.md` | Code hardening plan. |
| `IMPROVEMENTS.md` | Improvements log and ideas. |
| `IMPROVEMENT_PLAN.md` | Improvement roadmap. |
| `MAKE_COLLISION_GREAT_AGAIN.md` | Collision system improvement notes. |
| `MAKE_MOVEMENT_GREAT_AGAIN.md` | Movement system improvement notes. |
| `MAKE_PELLETS_GREAT_AGAIN.md` | Pellet system improvement notes. |
| `MOVE_FIX_PLAN.md` | Movement fix plan. |
| `MOVEMENT_IMPROVEMENT.md` | Movement improvements specification. |
| `MOVEMENT_SYSTEM_CLEANUP.md` | Movement system cleanup plan. |
| `MVC_ANALYSIS_AND_PLAN.md` | MVC architecture analysis. |
| `MVEMENT_COLLISION_DECOUPLE_PLAN.md` | Movement/collision decoupling plan. |
| `KISS_SIMPLIFICATION_PLAN.md` | Keep It Simple Simplification plan. |
| `TEST_REPORT_STEP_8.md` | Test report for step 8. |

## Test Scripts (Ad-hoc)

| Path | Purpose |
| --- | --- |
| `test-collision.js` | Script-based collision testing/analysis. |
| `test-debug.js` | Debug script. |
| `test_ghost_center.js` | Ghost centering test script. |
| `test_ghost_init.js` | Ghost initialization test script. |
| `test_setDirection.mjs` | Direction buffering test script. |
| `test_trace.js` | Movement/trace diagnostics script. |
| `test_tunnel.js` | Tunnel behavior test script. |
| `test_tunnel2.js` | Additional tunnel test script. |
| `test_movement_debug.js` | Movement debug script. |
| `trace_test.mjs` | Trace-based diagnostics script. |

## Documentation (`docs/`)

### Developer Docs (`docs/developer/`)

| Path | Purpose |
| --- | --- |
| `architecture.md` | Architecture overview and system design. |
| `gameplay.md` | Gameplay mechanics and systems deep dive. |
| `file-map.md` | This file - comprehensive file catalog. |
| `prd.md` | Product Requirements Document. |
| `README.md` | Developer documentation index. |
| `testing.md` | Testing strategy and guidelines. |
| `test-utilities.md` | Test utility documentation. |
| `change-task-test-suite-mvc.md` | Test suite MVC alignment notes. |
| `test-inventory-mvc.md` | MVC test inventory. |

### Implementation Summaries (`docs/`)

| Path | Purpose |
| --- | --- |
| `PHASE1_IMPLEMENTATION_SUMMARY.md` | Phase 1 implementation notes. |
| `PHASE2_IMPLEMENTATION_SUMMARY.md` | Phase 2 implementation notes. |
| `PHASE3_IMPLEMENTATION_SUMMARY.md` | Phase 3 implementation notes. |

## Source (`src/`)

### Entry + Core

| Path | Purpose |
| --- | --- |
| `src/main.js` | Phaser initialization, scene registration, demo flag. |
| `src/config/gameConfig.js` | Central game configuration (constants, tuning, UI config). |
| `src/config/themeConfig.js` | Theme configuration (colors, fonts, styling). |
| `src/core/EventBus.js` | Pub/sub event bus and game event constants. |
| `src/core/GameModel.js` | Pure game state and rules (score, lives, level, timers). Zero Phaser dependencies. |

### Scenes

| Path | Purpose |
| --- | --- |
| `src/scenes/MenuScene.js` | Main menu + how-to-play overlay + navigation. |
| `src/scenes/GameScene.js` | Main gameplay scene, MVC coordinator. |
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

### Model Layer

| Path | Purpose |
| --- | --- |
| `src/model/index.js` | Model exports. |
| `src/model/ModelEntity.js` | Base class for pure data entities (no Phaser deps). |
| `src/model/entities/PlayerState.js` | Pure data representation of ADA-Woman entity. |
| `src/model/entities/EnemyState.js` | Pure data representation of virus entity. |
| `src/model/entities/FruitState.js` | Pure data representation of data fragment. |
| `src/model/entities/index.js` | Entity exports. |

### Model Adapters

| Path | Purpose |
| --- | --- |
| `src/model/adapters/index.js` | Adapter exports. |
| `src/model/adapters/EnemyAIAdapter.js` | Enemy AI logic adapter for model. |
| `src/model/adapters/GhostAIAdapter.js` | Ghost AI logic adapter (legacy). |

### Controllers

| Path | Purpose |
| --- | --- |
| `src/controllers/GameController.js` | Clean input translation layer, zero Phaser deps. |

### Views

| Path | Purpose |
| --- | --- |
| `src/views/ModelDrivenGameView.js` | Pure observer view, creates renderers from model. |
| `src/views/components/PlayerRenderer.js` | Visual wrapper for PlayerState. |
| `src/views/components/GhostRenderer.js` | Visual wrapper for EnemyState. |
| `src/views/components/FruitRenderer.js` | Visual wrapper for FruitState. |
| `src/views/components/index.js` | Renderer exports. |

### Input System

| Path | Purpose |
| --- | --- |
| `src/input/InputManager.js` | Central coordinator for multiple input adapters. |
| `src/input/InputAdapter.js` | Abstract base adapter interface. |
| `src/input/index.js` | Input exports. |
| `src/input/adapters/KeyboardAdapter.js` | Keyboard input wrapper (arrows, WASD). |
| `src/input/adapters/ReplayAdapter.js` | Replay playback/recording. |
| `src/input/adapters/AIInputAdapter.js` | AI-driven input for bot gameplay. |

### Systems

| Path | Purpose |
| --- | --- |
| `src/systems/FixedTimeStepLoop.js` | Fixed-step update loop (60Hz). |
| `src/systems/DebugOverlay.js` | FPS/debug overlay rendering. |
| `src/systems/EnemyAISystem.js` | Virus AI behavior logic and targeting. |
| `src/systems/GhostAISystem.js` | Legacy ghost AI system. |
| `src/systems/PacmanAI.js` | Demo-mode ADA-Woman AI. |
| `src/systems/PlayerAI.js` | Alternative player AI implementation. |
| `src/systems/AchievementSystem.js` | Achievement tracking + notifications. |
| `src/systems/ReplaySystem.js` | Replay recording and playback. |
| `src/systems/BossBattleSystem.js` | Multi-phase boss battle encounters. |
| `src/systems/AdditionalPowerUpSystem.js` | Additional power-ups (Shield, Speed Boost, Data Magnet). |
| `src/systems/StoryMode.js` | Narrative chapter system. |

### Managers

| Path | Purpose |
| --- | --- |
| `src/managers/StorageManager.js` | LocalStorage wrapper for scores/settings. |
| `src/managers/SoundManager.js` | Web Audio API sound effects. |
| `src/managers/TechSoundManager.js` | Tech-themed sound effects. |

### Pools

| Path | Purpose |
| --- | --- |
| `src/pools/PelletPool.js` | Object pool for pellets. |
| `src/pools/PowerPelletPool.js` | Object pool for power pellets. |

### Effects

| Path | Purpose |
| --- | --- |
| `src/effects/ParticleEffectManager.js` | Particle effects management. |

### Utilities

| Path | Purpose |
| --- | --- |
| `src/utils/MazeLayout.js` | Maze data + grid helpers. |
| `src/utils/MazeGenerator.js` | Procedural maze generation. |
| `src/utils/TileMath.js` | Tile/pixel conversion utilities. |
| `src/utils/TileMovement.js` | Movement wrapper and tile math exports. |
| `src/utils/WarpTunnel.js` | Tunnel/warp behavior helpers. |
| `src/utils/CollisionUtils.js` | Swept capsule collision math. |
| `src/utils/DebugLogger.js` | Debug logging helper. |
| `src/utils/ErrorHandler.js` | Error handling and assertions. |
| `src/utils/Time.js` | Delta normalization helpers. |
| `src/utils/SpawnValidator.js` | Spawn validation helpers. |

### Movement Utilities

| Path | Purpose |
| --- | --- |
| `src/utils/movement/DirectionBuffer.js` | Buffered turning logic. |
| `src/utils/movement/MovementState.js` | Movement state constants. |
| `src/utils/movement/EntityValidator.js` | Validation utilities for movement tests. |

## Tests (`tests/`)

### Core Setup

| Path | Purpose |
| --- | --- |
| `tests/setup.js` | JSDOM + Phaser mocks for unit tests. |
| `tests/utils/testHelpers.js` | Shared test helpers. |
| `tests/utils/modelTestUtils.js` | GameModel instantiation helpers for tests. |
| `tests/utils/simulationHelpers.js` | Deterministic simulation helpers for tests. |
| `tests/utils/inputMocks.js` | Keyboard/touch controller input mocks. |

### Core & Utilities

| Path | Purpose |
| --- | --- |
| `tests/core/EventBus.test.js` | Event bus behavior. |
| `tests/core/GameModel.test.js` | Model state and rules testing. |
| `tests/controllers/GameController.test.js` | Controller input handling and scene orchestration. |
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
| `tests/integration/GameModelLoop.test.js` | GameModel + FixedTimeStepLoop integration. |

## Mocks

| Path | Purpose |
| --- | --- |
| `__mocks__/phaser.js` | Phaser mocks for Jest tests. |

## Build Artifacts (Generated)

| Path | Purpose |
| --- | --- |
| `dist/` | Built production files (generated by `npm run build`). |
| `test-results/` | Jest test results (generated). |
| `playwright-report/` | Playwright E2E test reports (generated). |
