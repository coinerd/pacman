# Testing & Tooling

This project uses **Jest** with a Phaser mock layer to validate gameplay logic in a Node + JSDOM environment.

## Test Commands

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:ci
```

## Jest Configuration Highlights

- **Environment:** `jsdom`
- **Setup File:** `tests/setup.js`
- **Coverage Threshold:** 70% for branches/functions/lines/statements
- **Transforms:** `babel-jest` with `@babel/preset-env`
- **Phaser Mock:** Mapped via `moduleNameMapper` to `__mocks__/phaser.js`

## Test Structure

Tests are organized by concern:

- `tests/unit/` — Core movement and timing logic.
- `tests/integration/` — Multi-entity and system integration scenarios.
- `tests/entities/` — Pacman/Ghost/Fruit/BaseEntity behaviors.
- `tests/systems/` — Collision, AI, replay, achievements, debug.
- `tests/scenes/` — Scene-level logic (e.g., Settings, UI controllers).

## Tooling

- **ESLint**: style rules are strict (4-space indentation, single quotes, no trailing spaces).
- **Vite**: dev/build tooling with `http://localhost:3000` default.
- **Husky**: Git hook runner (configured in `.husky/`).

## Mocking & Test Utilities

- `tests/setup.js` provides mock Canvas and Web Audio APIs.
- `__mocks__/phaser.js` stubs core Phaser classes for unit tests.
- `tests/utils/testHelpers.js` contains shared helpers for entity creation and maze setup.
