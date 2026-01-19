# MAKE COLLISION GREAT AGAIN

## Problem analysis

**Symptom recap**: Pacman moves a single step per input and then stops; ghosts advance one step, then pause for seconds, then move again.

**What the collision system is doing today**

- Collision checks run inside the fixed-step loop (`GameScene.fixedUpdate`) right after entity updates. If the fixed-step cadence is disrupted, collision processing becomes sporadic as well, and the game appears frozen between steps.【F:src/scenes/GameScene.js†L345-L401】
- Pellets and power pellets are resolved by converting Pacman’s pixel position to a grid tile and mutating the maze tile when consumed. This mutation is also used to compute win conditions on every fixed step via a full `countPellets` scan of the maze grid.【F:src/systems/CollisionSystem.js†L81-L217】【F:src/systems/CollisionSystem.js†L296-L304】
- Ghost collisions use a swept capsule test that relies on `prevX/prevY` as well as current positions for both Pacman and ghosts.【F:src/systems/CollisionSystem.js†L248-L266】

**Why collision could be contributing to “one step, then stall”**

1. **Collision checks are tied to the fixed-step cadence**. If the fixed-step loop is firing only occasionally (e.g., time unit mismatch or long frame times), collisions only resolve when the loop runs. This makes movement and collision symptoms look identical: entities move once, then appear frozen for long gaps between fixed steps.【F:src/scenes/GameScene.js†L320-L358】【F:src/scenes/GameScene.js†L345-L401】
2. **Per-frame full-maze pellet scans are expensive**. `checkWinCondition()` calls `countPellets()` every fixed step, which scans the full maze. If the maze is large or debug logging is enabled, this can dramatically reduce the update frequency and create multi-second stalls that look like movement bugs.【F:src/systems/CollisionSystem.js†L296-L304】
3. **Ghost collision uses `prevX/prevY`, but ghosts do not update these fields during normal movement**. Pacman updates `prevX/prevY` each frame, but ghosts only initialize them at reset. That means the capsule collision path for ghosts can be stale and inconsistent, triggering collision results at odd times and potentially cascading into state changes (death, frightened, etc.) that interrupt normal movement updates.【F:src/entities/Pacman.js†L41-L74】【F:src/entities/Ghost.js†L71-L126】【F:src/systems/CollisionSystem.js†L248-L304】
4. **Heavy debug logging can mask as timing issues**. Collision checks log detailed JSON per frame when debugging is enabled. Excessive logging can drop the fixed-step cadence, causing the same “step then stall” behavior even if logic is correct.【F:src/systems/CollisionSystem.js†L95-L118】【F:src/systems/CollisionSystem.js†L146-L179】【F:src/utils/DebugLogger.js†L1-L60】

## Comprehensive plan to mitigate this and similar issues

### 1) Make collision cadence deterministic and resilient
**Goal:** Ensure collision resolution isn’t tied to frame or logging variability.

- **Create a collision snapshot** each fixed step containing entity positions (current + previous), grid positions, and movement intent. Consume this immutable snapshot for all collision checks to avoid mid-step state mutations.
- **Gate collision checks by entity state** (e.g., skip ghost collision for `isEaten`, skip pellet checks when Pacman is not on a new tile), reducing unnecessary work per step.
- **Add timing guards** to assert fixed-step consistency and to log when the collision loop is being starved (e.g., 10+ frames without a fixed step). This makes cadence regressions immediately visible during QA.

### 2) Fix ghost collision temporal correctness
**Goal:** Ensure swept collisions use accurate motion history.

- **Update `Ghost` to record `prevX/prevY` each frame** before movement (mirroring Pacman), so capsule collision uses the true movement segment for the current step.
- **Define a single “position update contract”**: all entities update `prevX/prevY` immediately before movement logic, and collision reads only the snapshot from the same frame.

### 3) Replace per-frame maze scans with event-based pellet accounting
**Goal:** Remove full-maze scans from the hot path.

- **Track `pelletsRemaining` in the game state** and decrement it only when a pellet is consumed. This removes the O(N) `countPellets` scan every fixed step.
- **Retain an optional sanity check** (e.g., once per level or on demand) to reconcile against the maze for debugging, not on every frame.

### 4) Introduce collision performance budgets and profiling
**Goal:** Make performance regressions measurable and enforceable.

- **Add lightweight profiling** (time spent in collision checks, number of collision checks per step) and expose it in the debug overlay.
- **Set a collision time budget** (e.g., <1ms per fixed step) and log warnings when exceeded.
- **Ensure debug logging is rate-limited** or sampling-based, especially for per-frame collision logs.

### 5) Strengthen regression tests
**Goal:** Prevent collision bugs from reappearing.

- **Unit tests for capsule collision** with both static and moving entities, ensuring consistent results across entity updates.
- **Integration tests** that simulate a sustained fixed-step loop (e.g., 300 steps) and verify that Pacman/ghost movement does not stall and collisions occur at expected intervals.
- **Performance tests** that guard against full-maze scans or other O(N) collision logic on every frame.

### 6) Document collision contracts and invariants
**Goal:** Keep collision logic maintainable as the game evolves.

- **Document collision invariants**: when `prevX/prevY` are updated, what units are used, and which subsystems are allowed to mutate the maze.
- **Define a single source of truth** for pellet state (maze + pellet pool + pelletsRemaining), and document the update path in the collision system.

## Expected outcome

By isolating collision logic from timing variability, eliminating per-frame heavy scans, and enforcing consistent movement history for swept collisions, we prevent collision logic from starving the fixed-step loop or triggering sporadic state changes. This plan makes collision behavior deterministic, performance-bounded, and much less likely to cause the “one step then stall” symptom in the future.
