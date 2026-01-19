# MAKE MOVEMENT GREAT AGAIN

## Problem analysis

**Symptom recap**: Pacman moves a single step per input and then stops; ghosts advance one step, then pause for seconds, then move again.

**Movement pipeline overview**

- `GameScene.update` converts the Phaser-provided `delta` into seconds and feeds it into the `FixedTimeStepLoop` accumulator. The fixed-step loop then calls `fixedUpdate` when the accumulator reaches `physicsConfig.FIXED_DT` (1/60 sec).【F:src/scenes/GameScene.js†L320-L358】【F:src/systems/FixedTimeStepLoop.js†L1-L45】【F:src/config/gameConfig.js†L231-L235】
- `fixedUpdate` runs all game logic and movement with `delta` expressed in **milliseconds** (it multiplies `FIXED_DT` by 1000).【F:src/scenes/GameScene.js†L345-L358】
- Pacman and ghosts call `performGridMovementStep`, which ultimately computes `rawMoveDist` with `delta / 1000`, i.e., it expects **milliseconds** (to derive seconds).【F:src/utils/movement/GridMovement.js†L32-L40】

**Likely root cause**

The symptom pattern (long pauses between single steps) strongly suggests that the fixed-timestep loop is running **far less frequently than expected**. The current architecture mixes seconds and milliseconds at different layers, so it is highly sensitive to any unit mismatch:

- `FixedTimeStepLoop.update` expects **seconds** (its clamping and `FIXED_DT` are in seconds).【F:src/systems/FixedTimeStepLoop.js†L20-L45】【F:src/config/gameConfig.js†L231-L235】
- `GameScene.update` passes `delta / 1000` into the fixed loop, assuming `delta` is in milliseconds (Phaser default).【F:src/scenes/GameScene.js†L320-L340】
- `fixedUpdate` then converts `FIXED_DT` to milliseconds and hands that to movement code, which expects milliseconds.【F:src/scenes/GameScene.js†L345-L358】【F:src/utils/movement/GridMovement.js†L32-L40】

If any layer supplies **seconds when milliseconds are expected** (or vice versa), the accumulator will advance far too slowly and the movement step size will be far too small, producing the exact “one step then wait several seconds” behavior. The architecture has no guardrails to detect such mismatches, so a change in engine timing or a future refactor can easily reintroduce the issue.

## Comprehensive plan to mitigate this and similar issues

### 1) Standardize time units end-to-end
**Goal:** Eliminate unit ambiguity.

- **Adopt a single canonical time unit** (recommend **seconds** across the entire game loop and movement systems).
- **Create a single `Time` utility module** (e.g., `src/utils/Time.js`) that provides conversion helpers (`msToSeconds`, `secondsToMs`) and clearly named types/constants (`TimeUnit.SECONDS`).
- **Update all public APIs to document and enforce the unit**, starting with:
  - `FixedTimeStepLoop.update` (seconds expected).【F:src/systems/FixedTimeStepLoop.js†L20-L45】
  - `fixedUpdate`, `Pacman.update`, `Ghost.update`, and movement functions (`moveEntityOnGrid`).【F:src/scenes/GameScene.js†L345-L358】【F:src/entities/Pacman.js†L41-L63】【F:src/entities/Ghost.js†L71-L94】【F:src/utils/movement/GridMovement.js†L32-L40】
- **Align configuration** (`physicsConfig.FIXED_DT`) and movement calculations to the canonical unit.【F:src/config/gameConfig.js†L231-L235】

### 2) Add runtime validation and diagnostics
**Goal:** Detect unit mismatches immediately in development.

- **Add a lightweight runtime sanity check** in `FixedTimeStepLoop.update` to log (or throw in dev) if `realDt` is outside a plausible range for seconds (e.g., `> 1` or `< 0.001`).【F:src/systems/FixedTimeStepLoop.js†L20-L45】
- **Expose timing and accumulator metrics in the debug overlay** to confirm the fixed-step cadence during manual playtesting.【F:src/systems/DebugOverlay.js†L57-L77】

### 3) Build regression tests for movement cadence
**Goal:** Make timing regressions fail in CI.

- **Unit test `FixedTimeStepLoop`**: Given 60 updates of `1/60`, ensure the callback fires 60 times; given `delta` in milliseconds, ensure the callback fails (or triggers warning) so unit mismatch is caught.【F:src/systems/FixedTimeStepLoop.js†L20-L45】
- **Unit test `moveEntityOnGrid`**: Simulate multiple steps with a consistent delta and verify the entity advances the correct number of tiles based on `speed` and `tileSize`.【F:src/utils/movement/GridMovement.js†L32-L173】
- **Integration test**: Run `GameScene.update` for N frames and confirm Pacman/ghosts move continuously when a direction is held (no multi-second stalls).【F:src/scenes/GameScene.js†L320-L358】【F:src/entities/Pacman.js†L41-L63】【F:src/entities/Ghost.js†L71-L94】

### 4) Enforce clear movement contracts
**Goal:** Keep movement robust as features evolve.

- **Document movement contracts** in code comments (e.g., “All movement deltas are in seconds”).
- **Add lint/TypeScript-like guards** via JSDoc typedefs or lightweight runtime checks to prevent mixing units across APIs.
- **Centralize movement-related math** (speed scaling, delta conversion) so future changes only happen in one place.

### 5) Monitoring and rollout
**Goal:** Validate real-world behavior and prevent regressions.

- **Add a telemetry hook** (only in dev builds) that captures average fixed-step frequency and movement distance per second, making issues visible immediately during QA.
- **Create a movement regression checklist**: verify continuous movement in all directions, in tunnels, and when switching directions at intersections.

## Expected outcome

Implementing the above will eliminate unit ambiguity, add guardrails against timing regressions, and institutionalize movement validation. This should permanently resolve the “one step then pause” issue and prevent similar timing-related bugs from recurring.
