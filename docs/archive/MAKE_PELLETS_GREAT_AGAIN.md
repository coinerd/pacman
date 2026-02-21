# MAKE PELLETS GREAT AGAIN

## Problem analysis

**Symptom recap**
- Pacman only advances a single tile per input and then stops.
- Ghosts advance one tile, pause for several seconds, then move one tile in the opposite direction.
- Both Pacman and ghosts appear blocked by tiles that contain pellets, even though those tiles should be walkable.

**Pellet/movement pipeline today (relevant details)**
- The maze uses a single grid with numeric tile types. `TILE_TYPES.PATH` and `TILE_TYPES.PELLET` are both set to `0`, meaning path tiles and pellet tiles are indistinguishable in the data model.
- Pellet consumption mutates the maze grid directly, replacing the current tile with `TILE_TYPES.EMPTY`.
- Movement and AI routing rely on grid walkability checks (`isPath`, `getValidDirections`), which *do not consider* `TILE_TYPES.EMPTY` to be walkable.

**Why this creates the “can’t move on pellets” symptom**
1. **Pellets are encoded in the same grid as walkable paths, then destroyed in-place.**
   - Because `PATH` and `PELLET` share the same value, *every path tile is treated as a pellet*. When Pacman “eats” one, the maze tile is converted to `EMPTY`.
   - `EMPTY` is *not* considered walkable by `isPath` / `getValidDirections`, so AI routing considers those tiles blocked, causing ghosts to “stall” or ping-pong.

2. **Movement/AI checks are inconsistent about what is walkable.**
   - Some movement logic checks only for walls, while AI routing uses `isPath`, which excludes `EMPTY`. That disagreement means the maze is effectively interpreted differently by different systems, causing erratic stop/start behavior once pellets are eaten.

3. **Pellet state is overloaded into the same grid that represents structural walls.**
   - Pellet state should be an overlay on top of walkable tiles, not a mutation that changes walkability. Using a single grid for both makes it impossible to remove pellets without altering path semantics.

**Root cause summary**
The core issue is **data modeling**: pellets are stored in (and removed from) the *same grid that defines walkable space*, and the “empty” value is not treated as walkable by the AI pathing helpers. This yields tiles that are visually open but logically blocked after pellets are consumed.

---

## Comprehensive plan to mitigate this and similar issues

### 1) Separate “walkability” from “collectable” state
**Goal:** Eliminate ambiguity between path tiles and pellet tiles.

- **Create a dedicated pellet layer** (e.g., a `Set` of pellet coordinates, or a parallel `pelletGrid` with enum values `NONE | PELLET | POWER_PELLET`).
- **Restrict the maze grid to structural state only** (WALL, PATH, GHOST_HOUSE, DOOR).
- **Never mutate structural tiles when pellets are consumed**; only remove from the pellet layer.

**Outcome:** Removing a pellet can no longer make a tile unwalkable.

---

### 2) Define a single walkability contract
**Goal:** Ensure all movement and AI logic uses the exact same walkability rules.

- Introduce `isWalkableTile(maze, x, y)` which *only checks structural tiles* (wall/door/house rules).
- Update **every** movement/AI call site (`isPath`, `getValidDirections`, `canMove`, entity checks) to use the unified function.
- Ensure the pellet layer is *never* consulted in movement decisions.

**Outcome:** Pacman and ghosts can always move through paths regardless of pellet state.

---

### 3) Make pellet rules explicit and testable
**Goal:** Prevent regression by encoding pellet rules as invariant checks.

- Add a pellet-specific utility:
  - `isPelletAt(gridX, gridY)`
  - `consumePelletAt(gridX, gridY)`
- Clearly document the difference between **walkable** (structural) vs **collectable** (pellet layer).
- In debug builds, assert that pellet tiles only exist on walkable structural tiles.

**Outcome:** Pellet logic can’t silently corrupt navigation state.

---

### 4) Create regression tests that lock in correct behavior
**Goal:** Make pellet-related stalls impossible to reintroduce.

- **Unit test**: consuming a pellet does not change `isWalkableTile` result for that tile.
- **Unit test**: `getValidDirections` returns the same directions before/after pellet consumption.
- **Integration test**: hold Pacman’s direction across multiple pellets and verify continuous movement (no pauses).
- **Integration test**: ghost AI pathfinding remains stable as pellets are eaten.

**Outcome:** Future changes cannot break pellet movement without failing tests.

---

### 5) Add diagnostics for pellet/navigation mismatch
**Goal:** Quickly detect mismatches in production builds.

- Emit a debug warning if a tile is marked `EMPTY` but still intended to be walkable.
- Add a debug overlay that shows **walkable grid** and **pellet grid** separately.

**Outcome:** Visualizing pellet vs path layers makes issues immediately obvious.

---

## Expected outcome

By separating pellet state from walkability, unifying navigation rules, and adding tests and diagnostics, Pacman and ghosts will move smoothly across pellet tiles without stalls. Pellets become a *pure collectible layer* that no longer risks corrupting pathfinding or movement logic, making similar regressions far less likely in the future.
