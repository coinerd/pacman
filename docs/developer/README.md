# Pac-Man Developer Documentation

Welcome to the developer documentation for the Pac-Man project. This folder is intended to give engineers a complete, system-level understanding of the game, its architecture, and how to work with the codebase.

## Documentation Map

- **Architecture Overview:** `docs/developer/architecture.md`
- **Gameplay & Systems Deep Dive:** `docs/developer/gameplay.md`
- **Comprehensive File Map:** `docs/developer/file-map.md`
- **Testing & Tooling:** `docs/developer/testing.md`
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

- **Phaser scenes** define the UI flow (Menu → Game → Pause/Win/GameOver/Settings).
- **Entities** (Pacman, Ghosts, Fruit) are Phaser display objects with grid-aware movement.
- **Systems** encapsulate logic such as collision detection, AI, achievements, replay, and debug overlay.
- **Utilities** provide grid math, maze layout, movement, warping, and low-level helpers.
- **Managers** handle persistence (localStorage) and audio (Web Audio API).

## High-Level Flow

1. `src/main.js` boots Phaser and registers scenes.
2. `GameScene` creates the maze, entities, UI, pools, and systems.
3. The per-frame loop runs `update()`, which drives a fixed-step loop for deterministic movement.
4. Collisions and scoring are resolved in the fixed update, which updates game state and UI.
5. Scene transitions (pause, win, game over) are handled by Phaser scene lifecycle calls.

## Working Guidelines

- Use **4-space indentation** and single quotes (see ESLint rules).
- Prefer **system-driven logic** rather than adding new ad-hoc logic to `GameScene`.
- Route gameplay-wide events through the `EventBus` to keep systems decoupled.

If you are new to the codebase, start with `architecture.md` and `gameplay.md` before diving into `file-map.md`.
