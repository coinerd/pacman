# Movement & Collision Simplification Plan

## Current system summary (what exists today)

**Movement** is implemented as a chain of small helpers with overlapping responsibilities:
- `performGridMovementStep` orchestrates snapping, movement, portal handling, and bounds checks.【F:src/utils/TileMovement.js†L1-L60】
- `CenterSnapper` handles snapping to tile centers, buffered turns, grid updates, and partial movement calculations.【F:src/utils/movement/CenterSnapper.js†L1-L156】
- `MovementStepBuilder` recursively walks tiles, resolves wall collisions, and performs position updates.【F:src/utils/movement/MovementStepBuilder.js†L1-L123】
- Bounds/wall checks are duplicated across `WallCollisionHandler` and `PathValidation`.【F:src/utils/movement/WallCollisionHandler.js†L1-L74】【F:src/utils/movement/PathValidation.js†L1-L32】
- Tunnel traversal is handled in a specialized helper that repositions entities when they exit the maze bounds.【F:src/utils/movement/TunnelHandler.js†L1-L117】

**Collision** currently uses a multi-strategy approach:
- Pellet collisions are tile-based using grid conversion and tile checks.【F:src/systems/CollisionSystem.js†L61-L176】
- Ghost collisions are checked by (1) segment crossing, (2) swept AABB, then (3) distance checks, with debug logging around each method.【F:src/systems/CollisionSystem.js†L178-L356】
- Collision math lives in `CollisionUtils` with separate functions for each method.【F:src/utils/CollisionUtils.js†L1-L169】

This provides robustness, but the interwoven responsibilities and multiple approaches create complex edge cases, brittle behavior around snapping/turning, and higher implementation overhead when making changes.

---

## Simplification goals

1. **Single source of truth for movement state**
   - A movement step should be described by a single deterministic update function with a minimal state surface (position, direction, pending turn, speed).
2. **Tile-first logic, pixel-second**
   - Use grid/tile logic as the primary constraint engine; pixel positions are derived from tile centers + offsets.
3. **One collision model per interaction**
   - Prefer one robust ghost collision method instead of three overlapping approaches.
4. **Make step results explicit**
   - Explicitly return `enteredTile`, `exitedTile`, `hitWall`, `didWarp`, etc. to simplify downstream logic (audio, scoring, AI).
5. **Reduce recursion and side-effects**
   - Replace recursive `buildMovementStep` and multi-step snapping with an iterative, step-limited movement algorithm.

---

## Proposed simplified movement architecture

### 1) Introduce a single `moveEntityOnGrid` function
A single function handles **turning**, **movement**, **wall collision**, **snapping**, and **tunnel warp** in one predictable order.

**Inputs**
- `entity` (gridX, gridY, x, y, direction, nextDirection, speed)
- `maze`
- `delta`

**Outputs**
- Updated entity
- `events` array with `{ type: 'tile_enter', tileX, tileY }`, `{ type: 'warp' }`, `{ type: 'hit_wall' }`

**Key idea:**
- Compute how many *tile-steps* the entity can move this frame based on `speed` and `delta`.
- Walk those steps in a small loop (e.g., at most 2–3 tiles per frame), stopping on walls.
- Always keep the entity snapped to tile centers at the end of the frame.

### 2) Replace snapping heuristics with strict tile-center rules
Instead of multiple heuristics in `CenterSnapper`, use deterministic rules:
- If the entity is within a small epsilon of a tile center and the next tile is blocked, stop and snap.
- Turning is only allowed when at a tile center (or within epsilon), removing partial-turn behavior.
- This eliminates ambiguous “almost centered” positions and makes movement resilient to floating point drift.

### 3) Remove duplicate bounds/path utilities
Consolidate in one module:
- A single `isInBounds`, `isWall`, and `canMove` function.
- Eliminate `PathValidation.isInBounds` and `WallCollisionHandler.isInBounds` duplication.

### 4) Simplify tunnel handling
Treat tunnel entrances as normal tiles with a `warpTarget`:
- If an entity moves from a tunnel tile to the “outside” direction, immediately translate it to the destination tile center.
- This becomes just another step in `moveEntityOnGrid` rather than a separate post-step handler.

---

## Proposed simplified collision architecture

### 1) Replace multi-method ghost collision with a single swept circle or capsule test
- Use a **capsule vs. point** or **capsule vs. capsule** test for Pacman/Ghost movement during a frame.
- This unifies “crossed path” and “distance” checks into a single continuous collision test.
- Implementation can reuse the existing `pointToLineSegmentDistance` utility with a consistent radius.

### 2) Align collision radius with tile size once
- Use a defined constant (e.g., `collisionRadius = tileSize * 0.6`) in one place to avoid hidden tuning between functions.

### 3) Remove collision method fallbacks
- If you have prev positions, use the swept method; if not, use the same method with a zero-length segment.
- This removes branching and reduces debug noise.

---

## Implementation plan (phased)

### Phase 1 — Audit & consolidation
- [ ] Create a new `movement/GridMovement.js` module with `moveEntityOnGrid` (non-recursive, event-returning).
- [ ] Replace `performGridMovementStep` with a thin wrapper to call the new function and apply returned events.
- [ ] Consolidate `isWall`, `isInBounds`, and `canMove` into a single movement utility module.
- [ ] Update unit tests or add new ones for: turning at centers, wall stops, tunnel warp, multi-tile movement.

### Phase 2 — Collision refactor
- [ ] Replace `checkCrossedPathCollision`, `checkSweptAABBCollision`, and `checkDistanceCollision` with a single swept capsule function.
- [ ] Create a `collisionRadius` constant in config and use it across the collision system.
- [ ] Remove obsolete collision helpers from `CollisionUtils` to reduce surface area.

### Phase 3 — Cleanup & clarity
- [ ] Delete `CenterSnapper` and `MovementStepBuilder` once their logic is fully replaced.
- [ ] Remove obsolete logging branches and replace with a single “collision event” log (if debug is enabled).
- [ ] Add a short movement/collision design note to `ARCHITECTURE.md` to document the new rules.

---

## Expected benefits

- **Predictable movement**: deterministic tile-centered stepping reduces drift and hard-to-debug edge cases.
- **Less code, fewer states**: single update path for movement and collision.
- **Easier testing**: step function can be unit-tested with fixed inputs/outputs.
- **Fewer regressions**: less conditional branching and fewer overlapping helper functions.

---

## Quick reference: functions to replace

- Movement: `performGridMovementStep`, `CenterSnapper`, `MovementStepBuilder`, `PathValidation` helpers.【F:src/utils/TileMovement.js†L1-L60】【F:src/utils/movement/CenterSnapper.js†L1-L156】【F:src/utils/movement/MovementStepBuilder.js†L1-L123】【F:src/utils/movement/PathValidation.js†L1-L32】
- Collision: multi-method checks in `CollisionSystem` and multiple helper methods in `CollisionUtils`.【F:src/systems/CollisionSystem.js†L178-L356】【F:src/utils/CollisionUtils.js†L1-L169】
