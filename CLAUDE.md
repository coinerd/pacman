# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
npm run dev          # Start Vite dev server (http://localhost:3000)
npm run build        # Production build to dist/
npm run preview      # Preview production build

npm test             # Run all Jest tests
npm run test:watch   # Watch mode for Jest
npm run test:coverage # Run tests with coverage report
npm run test:ci      # CI mode (coverage, maxWorkers=2)

npm run lint         # ESLint on src/ and tests/
npm run lint:fix     # Auto-fix ESLint issues
```

## Architecture Overview

This is a browser-based maze game (ADA-Woman) built with Phaser.js and Vite, following an **MVC architecture with decoupled systems**.

### Core MVC Flow

```
Input Layer (Keyboard/Touch/Replay/AI)
         ↓
    GameController → DIRECTION_CHANGED event
         ↓
    GameModel (pure state, no Phaser deps)
         ↓
    EventBus (pub/sub decoupler)
         ↓
    View Layer (PhaserGameView or ConsoleGameView)
```

### Key Directories

- **`src/core/`** - GameModel.js (pure state), EventBus.js (pub/sub)
- **`src/model/`** - GameStateController (headless simulation), entities (PlayerState, EnemyState, FruitState), systems, adapters
- **`src/controllers/`** - GameController (input translation), ActionRouter (routes actions)
- **`src/views/`** - PhaserGameView, ConsoleGameView (headless testing)
- **`src/input/`** - InputManager with adapters (Keyboard, Replay, AI)
- **`src/collision/`** - CollisionEngine (swept capsule collision), shapes, spatial indexing
- **`src/movement/`** - MovementEngine, strategies, maze query adapters
- **`src/entities/`** - Phaser-wrapped entities (Player, Enemy, Fruit)
- **`src/scenes/`** - Phaser scenes (Menu, Game, Pause, Win, GameOver, Settings)
- **`src/config/`** - gameConfig.js (central constants)

### Architecture Principles

1. **Model is pure** - No Phaser dependencies in GameModel or GameStateController; can run headless in Node.js
2. **EventBus decoupling** - Components communicate via EventBus, not direct references
3. **Swappable input** - KeyboardAdapter, ReplayAdapter, AIInputAdapter implement the same InputAdapter interface
4. **Testability** - Core game logic testable without Phaser via ConsoleGameView and headless model

### Entity System

- **Player (ADA-Woman)**: Hexagonal design, collects data bits
- **Enemies (Viruses)**: Alpha (chaser), Beta (predictor), Gamma (random), Delta (follower)
- **Fruit (Data Fragments)**: 8 types with progressive appearance

### Adding New Features

- **New enemy type**: Add to `src/model/entities/EnemyState.js` and update `EnemyAIAdapter`
- **New data fragment**: Add to `fruitConfig` in `src/config/gameConfig.js`
- **New input source**: Implement `InputAdapter` interface, register with `InputManager`
- **New scene**: Create in `src/scenes/`, register in `src/main.js`

## Code Conventions

- JSDoc comments on public methods
- 4-space indent (ESLint), tabs (Biome)
- Single quotes (ESLint), double quotes (Biome)
- Entity files use PascalCase (Player.js, Enemy.js)
- Test files mirror source structure under `tests/`

## Testing

- 76+ test suites, 1488+ tests
- Headless model testing (no Phaser required)
- Integration tests for movement, collisions, ghost lifecycle
- Test utilities in `tests/utils/testHelpers.js`

## Linting

Two linters are configured:
- **ESLint 9.x** (`eslint.config.js`) - 4-space indent, single quotes
- **Biome 2.x** (`biome.json`) - tabs, double quotes

Run `npm run lint` before committing.

## Project-Specific Rules (from .kilo/)

When working on tasks, maintain:
- `todos.md` as the master plan with checkboxes
- `CHANGELOG.md` under `[Unreleased]` for user-affecting changes
