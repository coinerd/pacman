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
- `__mocks__/phaser.js` stubs Phaser renderer essentials (Display/Scene/Graphics) for unit tests.
- `tests/utils/testHelpers.js` contains shared helpers for entity creation and maze setup.
- `tests/utils/modelTestUtils.js`, `tests/utils/simulationHelpers.js`, and `tests/utils/inputMocks.js` cover model instantiation, deterministic simulation, and controller input mocks.
- See `docs/developer/test-utilities.md` for examples.

## MVC Testing Patterns

The MVC architecture enables layered testing strategies from pure logic to full integration.

### Model Tests

Pure state testing, headless in Node (no Phaser required). Example: `tests/core/GameModel.test.js`

```javascript
// Test pure game state without rendering
describe('GameModel', () => {
  it('tracks score correctly', () => {
    const model = new GameModel();
    model.addScore(10);
    expect(model.state.score).toBe(10);
  });

  it('calculates ghost combo multiplier', () => {
    const model = new GameModel();
    model.onGhostEaten();  // First ghost: 200
    model.onGhostEaten();  // Second ghost: 400
    expect(model.state.ghostsEaten).toBe(2);
    expect(model.state.ghostComboMultiplier).toBe(2);
  });
});
```

### Controller Tests

Input-to-model translation with mocks. Example: `tests/controllers/GameController.test.js`

```javascript
// Test controller logic with mocked scene and model
describe('GameController', () => {
  it('translates keyboard input to direction events', () => {
    const mockScene = { scene: { pause: jest.fn() } };
    const mockEventBus = { emit: jest.fn() };
    const controller = new GameController(mockScene, mockEventBus);

    controller.handleInput({ code: 'ArrowUp' });

    expect(mockEventBus.emit).toHaveBeenCalledWith('DIRECTION_CHANGED', {
      direction: 'UP',
      timestamp: expect.any(Number)
    });
  });

  it('orchestrates pause scene transition', () => {
    const controller = new GameController(mockScene, mockEventBus);
    controller.handleInput({ code: 'KeyP' });
    expect(mockScene.scene.pause).toHaveBeenCalled();
  });
});
```

### View Tests

Minimal Phaser mocks, rendering-only scope. Example: View binding tests verify event subscriptions and rendering calls without asserting game logic.

```javascript
describe('PhaserGameView', () => {
  it('subscribes to model events for rendering', () => {
    const mockEventBus = { on: jest.fn() };
    const view = new PhaserGameView(mockEventBus, mockScene);
    expect(mockEventBus.on).toHaveBeenCalledWith('SCORE_CHANGED', expect.any(Function));
    expect(mockEventBus.on).toHaveBeenCalledWith('PELLET_EATEN', expect.any(Function));
  });

  it('updates score display on SCORE_CHANGED', () => {
    const view = new PhaserGameView(mockEventBus, mockScene);
    mockScene.children.getByName.mockReturnValue({ setText: jest.fn() });
    const scoreText = mockScene.children.getByName('scoreText');
    view.handleScoreChanged({ score: 1000 });
    expect(scoreText.setText).toHaveBeenCalledWith('1000');
  });
});
```

### Integration Tests

Deterministic simulation. Example: `tests/integration/GameModelLoop.test.js`

```javascript
describe('GameModel + FixedTimeStepLoop', () => {
  it('advances model state deterministically', () => {
    const model = new GameModel();
    const loop = new FixedTimeStepLoop((dt) => model.step(dt));
    loop.start();

    // Simulate 60 frames
    for (let i = 0; i < 60; i++) {
      loop.update(1/60);
    }

    expect(model.state.winTimer).toBeGreaterThan(0);
  });
});
```

### Test Utilities

- **modelTestUtils.js**: GameModel instantiation helpers for tests (e.g., `createTestModel()`, `resetModel()`)
- **simulationHelpers.js**: Deterministic simulation helpers (e.g., `advanceTime(model, ms)`, `simulateFrames(loop, count)`)
- **inputMocks.js**: Keyboard/touch controller input mocks (e.g., `mockKeyDown('ArrowUp')`, `mockTouchSwipe(UP)`)

