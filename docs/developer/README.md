# ADA-Woman Developer Documentation

Welcome to the developer documentation for the ADA-Woman project. This folder is intended to give engineers a complete, system-level understanding of the game, its architecture, and how to work with the codebase.

## Documentation Map

- **Architecture Overview:** `docs/developer/architecture.md`
- **Gameplay & Systems Deep Dive:** `docs/developer/gameplay.md`
- **Gameplay Finetuning Guide:** `docs/developer/gameplay-finetuning.md`
- **Comprehensive File Map:** `docs/developer/file-map.md`
- **Testing & Tooling:** `docs/developer/testing.md`
- **Test Utilities:** `docs/developer/test-utilities.md`
- **Change Task: Test Suite MVC Alignment:** `docs/developer/change-task-test-suite-mvc.md`
- **Product Requirements Document (PRD):** `docs/developer/prd.md`

## Quick Start

```bash
npm install
npm run dev
```

- Local dev server: `http://localhost:3000`
- Build: `npm run build`
- Tests: `npm test`
- Lint: `npm run lint`

## Key Concepts (TL;DR)

- **Tech Theme**: ADA-Woman is a cyberpunk-themed maze game (not classic Pac-Man)
  - ADA-Woman: Hexagonal digital security entity
  - Viruses: Alpha (purple), Beta (green), Gamma (red), Delta (orange)
  - Data bits: System integrity points to collect
  - Power packets: Decryption tools that make viruses vulnerable
  - Digital network: Circuit-style maze with glowing neon lines

- **JavaScript (not TypeScript)**: Pure JavaScript implementation using Phaser.js 3.80.1
- **Phaser scenes** define the UI flow (Menu → Game → Pause/Win/GameOver/Settings).
- **MVC pattern** separates game logic (GameModel), input (GameController), and rendering (ModelDrivenGameView) for testability.
- **Pure data entities**: PlayerState, EnemyState, FruitState contain NO Phaser dependencies (headless testable)
- **Visual renderers**: PlayerRenderer, GhostRenderer, FruitRenderer wrap model entities for Phaser rendering
- **Event-driven**: EventBus decouples all components via pub/sub pattern
- **Entity-Component**: Model entities separate data from visual representation
- **Systems** encapsulate logic such as collision detection, AI, achievements, replay, and debug overlay.
- **Utilities** provide grid math, movement, maze generation, and collision detection.
- **Managers** handle persistence (localStorage) and audio (Web Audio API).
- **Input adapters**: Keyboard, Replay, AI can be swapped via InputManager

## High-Level Flow

1. `src/main.js` boots Phaser and registers scenes.
2. `GameScene` creates the MVC components:
   - `GameModel` - pure game state and logic
   - `GameController` - input translation layer
   - `ModelDrivenGameView` - pure observer view with renderers
3. `InputManager` coordinates multiple input sources (Keyboard, Replay, AI)
4. The per-frame loop runs `update()`, which drives a fixed-step loop for deterministic movement.
5. `GameModel.step()` updates all entity states and generates events.
6. `EventBus` distributes events to:
   - `ModelDrivenGameView` - updates visual renderers
   - `AchievementSystem` - tracks unlocks
   - `ReplaySystem` - records inputs
   - Scene systems - handle game flow
7. Collisions and scoring are resolved in the model step, emitting events.
8. Scene transitions (pause, win, game over) are handled via controller events.

## Working Guidelines

- Use **4-space indentation** and single quotes (see ESLint rules).
- Prefer **system-driven logic** rather than adding new ad-hoc logic to `GameScene`.
- Route gameplay-wide events through the `EventBus` to keep systems decoupled.
- **Pure Model Layer**: Never import Phaser in `src/model/` or `src/core/GameModel.js`
- **Pure View Layer**: ModelDrivenGameView and renderers should NOT modify game state
- **Controller Logic**: GameController should only translate input to model actions, no game logic
- **Testing**: All model and controller code should be testable without Phaser

## Tech Theme Guidelines

When working on ADA-Woman, maintain the cyberpunk/digital aesthetic:

- Use terminology: "viruses" not "ghosts", "data bits" not "pellets", "decrypted" not "frightened"
- Visual style: Circuit walls, glowing neon lines (cyan/green/purple palette)
- Procedural generation: Use MazeGenerator for varied mazes
- Sound design: Web Audio API oscillators for tech-themed sounds
- No external assets: All graphics and audio generated programmatically

## Adding Features

### New entity type:
1. Create state class in `src/model/entities/` (extend ModelEntity)
2. Create renderer class in `src/view/components/`
3. Instantiate in GameModel and add renderer to ModelDrivenGameView

### New enemy/virus AI:
1. Add targeting logic to `EnemyState.updateTarget()`
2. Update virus mode behaviors in `EnemyState.updateAI()`

### New data fragment:
1. Add to `fruitConfig` in `src/config/gameConfig.js`
2. Update `FruitState.getFruitType()`

### New sound:
1. Add method to `src/managers/SoundManager.js` or `TechSoundManager.js`
2. Use Web Audio API oscillators (no external files)

### New scene:
1. Create in `src/scenes/`
2. Register in `src/main.js`
3. Use GameModel via EventBus for state access

### New input source:
1. Implement `InputAdapter` interface in `src/input/adapters/`
2. Register with `InputManager` in GameScene
3. Input is normalized and routed to GameController

### New achievement:
1. Add achievement definition to AchievementSystem
2. Check conditions in appropriate update loop
3. Unlock via EventBus or AchievementSystem.unlock()

## Testing

- **Headless tests**: Model and Controller can be tested in Node.js without Phaser
- **76 test suites** covering all major components
- **1,488+ tests passing** with 100% success rate
- **Integration tests**: Full game flow verification
- **Mock Phaser**: `__mocks__/phaser.js` for view tests

Run tests with:
```bash
npm test                # All tests
npm test -- --coverage  # With coverage
npm test GameModel       # Specific test file
```

## Common Tasks

### Debug movement issues:
- Enable DebugOverlay in settings
- Check collision stats in GameModel.getStats()
- Use TileMovement utilities for grid math
- Verify direction buffer state

### Add new power-up:
1. Define power-up type in gameConfig
2. Add to AdditionalPowerUpSystem
3. Create visual effect in PlayerRenderer
4. Handle collection in GameModel

### Add boss battle:
1. Define boss in bossConfig (gameConfig.js)
2. Use BossBattleSystem.spawnBoss() in LevelManager
3. Handle boss events in ModelDrivenGameView
4. Add boss-specific AI in BossBattleSystem

### Change level progression:
1. Update getSpeedMultiplier() in GameModel
2. Update getFrightenedDuration() in GameModel
3. Adjust level config in LevelManager
4. Update maze generation parameters in MazeGenerator

## Performance

- Target 60 FPS with fixed timestep
- Object pooling for pellets and power pellets
- Efficient rendering via Graphics objects and sprite reuse
- Collision budget telemetry (check DebugOverlay)
- Spatial partitioning via grid-based collision

If you are new to the codebase, start with `architecture.md` and `gameplay.md` before diving into `file-map.md`.
