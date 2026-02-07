# Test Utilities

This project ships a handful of shared helpers for tests. Use them to keep test setup consistent and to avoid duplicating mock setup logic.

## Core Helpers (`tests/utils/`)

### `testHelpers.js`

Common mocks for entities, scenes, and maze data.

```js
import { createMockScene, createMockMaze, createSimpleMaze } from '../../tests/utils/testHelpers.js';

const scene = createMockScene();
const maze = createMockMaze(createSimpleMaze(5, 5));
```

### `modelTestUtils.js`

Helpers for GameModel instantiation.

```js
import { createGameModel } from '../../tests/utils/modelTestUtils.js';

const model = createGameModel({
    state: { lives: 1, deathPauseDuration: 0.5 },
    levelConfig: { frightenedDuration: 6, frightenedDecreasePerLevel: 1 }
});
```

### `simulationHelpers.js`

Utilities for deterministic simulations and fixed-step loops.

```js
import { createDeterministicDtSequence, runFixedStepSimulation } from '../../tests/utils/simulationHelpers.js';
import { FixedTimeStepLoop } from '../../src/systems/FixedTimeStepLoop.js';
import { physicsConfig } from '../../src/config/gameConfig.js';

const loop = new FixedTimeStepLoop(() => {
    // ...your step callback...
});

const sequence = createDeterministicDtSequence(120, physicsConfig.FIXED_DT);
runFixedStepSimulation(loop, sequence);
```

### `inputMocks.js`

Keyboard/touch mocks for controller tests.

```js
import { createKeyboardInputMock, createTouchInputMock } from '../../tests/utils/inputMocks.js';

const { input, cursors, wasd } = createKeyboardInputMock();

cursors.left.isDown = true;
// wire into InputController or scene input mocks

const touch = createTouchInputMock();

touch.input.on('pointerdown', jest.fn());
touch.emit('pointerdown', { x: 10, y: 10 });
```

## Mock Infrastructure

### `tests/setup.js`

Sets up JSDOM-compatible Canvas/WebAudio mocks and a slim Phaser renderer scaffold for tests.

### `__mocks__/phaser.js`

Minimal Phaser mock scoped to renderer essentials (Display, Scene, Graphics and related GameObjects).

## Best Practices

- Prefer these helpers over inline mock objects in tests.
- Keep new utilities in `tests/utils/` and document them here with example usage.
