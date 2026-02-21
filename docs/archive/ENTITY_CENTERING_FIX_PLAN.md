# Entity Centering Problem Analysis and Fix Plan

## Executive Summary

Entities (Player, Enemies) are not consistently centered within tiles along their direction of movement. This causes visual misalignment where entities drift away from the center line of corridors during movement.

---

## 1. Root Cause Analysis

### 1.1 Multiple Competing Movement Systems

The codebase contains **4 different movement systems** that can interfere with each other:

1. **TileCenterMovementStrategy** (`src/movement/strategies/TileCenterMovementStrategy.js`)
   - Designed for tile-center to tile-center movement
   - Interpolates between centers using `moveProgress`
   - Has proper centering logic but may not be the active system

2. **GridMovementStrategy** (`src/movement/strategies/GridMovementStrategy.js`)
   - Used by MovementAdapter when `useDecoupledSystems=true`
   - Performs movement calculations but lacks axis-locking for centering
   - Lines 199-359: No orthogonal axis correction during movement

3. **Legacy GridMovement** (`src/utils/movement/GridMovement.js`)
   - Deprecated but still functional
   - Uses complex multi-step movement logic
   - May not enforce centering on orthogonal axis

4. **ModelEntity.updateMovement()** (`src/model/ModelEntity.js` lines 196-219)
   - Base class method for movement
   - Called by various systems
   - Lacks directional centering logic

### 1.2 Configuration Chaos

**GameModel.js** (lines 51-135) uses feature flags that determine which system is active:

```javascript
// Line 57 - Default is TRUE (decoupled systems)
this.useDecoupledSystems = config.useDecoupledSystems ?? true;

// Line 60 - Default is FALSE (tile center movement)
this.useTileCenterMovement = config.useTileCenterMovement ?? false;
```

**Problem**: When `useDecoupledSystems=true` but `useTileCenterMovement=false`, the system uses `MovementAdapter` with `GridMovementStrategy`, which lacks proper directional centering.

**ModelIntegratedGameScene.js** (line 50) explicitly sets:
```javascript
useTileCenterMovement: true  // But this scene may not be the one in use!
```

### 1.3 The Core Technical Issue

When an entity moves in a direction (e.g., RIGHT), the position should be:
- **X**: Moving from current tile center to next tile center
- **Y**: Locked to the tile's Y-center (should not drift)

**Current behavior in GridMovementStrategy.performMovement()** (lines 199-359):
- Calculates movement along the direction axis
- Updates X and Y based on direction
- **Missing**: No correction to ensure orthogonal axis stays at tile center

Example of the bug:
```javascript
// Entity moving RIGHT
entity.x += direction.x * moveDist;  // Correct: moves right
entity.y += direction.y * moveDist;  // direction.y is 0, so no change
// But if entity.y was slightly off-center, it stays off-center!
```

### 1.4 Visual Sync Issues

**VisualPlayer.sync()** and **VisualEnemy.sync()** directly use `this.state.x` and `this.state.y` without any centering correction. If the model position is off-center, the visual will be off-center.

---

## 2. Specific Problem Locations

### 2.1 GridMovementStrategy (Primary Issue)

**File**: `src/movement/strategies/GridMovementStrategy.js`

**Lines 199-359 (performMovement)**:
- No enforcement of orthogonal axis centering
- Entity can drift off the center line of a corridor

**Lines 313-316**:
```javascript
x += direction.x * moveDist;
y += direction.y * moveDist;
// No correction applied!
```

### 2.2 GridMovement (Legacy)

**File**: `src/utils/movement/GridMovement.js`

**Lines 60-364 (moveEntityOnGrid)**:
- Complex multi-step logic
- Snap to center happens only at specific conditions (lines 124-126, 287-289)
- Entity can drift between center snaps

### 2.3 MovementAdapter

**File**: `src/model/adapters/MovementAdapter.js`

**Lines 49-97 (updatePacman)** and **105-138 (updateGhost)**:
- Uses GridMovementStrategy by default
- No additional centering correction applied

### 2.4 ModelEntity

**File**: `src/model/ModelEntity.js`

**Lines 196-219 (updateMovement)**:
- Base movement logic
- Updates position based on progress
- No directional centering

---

## 3. Impact Assessment

### 3.1 Visual Impact
- Entities appear to "float" or drift within corridors
- Collision detection may be inaccurate due to position offset
- Game looks unpolished and unprofessional

### 3.2 Gameplay Impact
- Collision detection with walls may trigger incorrectly
- Pellet collection may fail if entity is too far off-center
- Ghost AI pathfinding may be affected by inaccurate positions

### 3.3 Systems Affected
- All scenes using GameModel with default settings
- ModelIntegratedGameScene (when configured correctly, this works)
- Any code path using MovementAdapter with GridMovementStrategy

---

## 4. Fix Strategy

### 4.1 Recommended Approach: Implement Axis-Locked Movement

The fix should ensure that when moving horizontally, Y stays at tile center, and when moving vertically, X stays at tile center.

### 4.2 Fix Implementation Plan

#### Phase 1: Fix GridMovementStrategy (Critical)

**File**: `src/movement/strategies/GridMovementStrategy.js`

Add axis-locking to `performMovement()` method (around lines 313-316):

```javascript
// Before (current code)
x += direction.x * moveDist;
y += direction.y * moveDist;

// After (with centering)
if (direction.x !== 0) {
    // Moving horizontally - lock Y to tile center
    x += direction.x * moveDist;
    y = center.y; // Lock to current tile's Y center
} else if (direction.y !== 0) {
    // Moving vertically - lock X to tile center
    x = center.x; // Lock to current tile's X center
    y += direction.y * moveDist;
}
```

Also apply same fix when reaching target center (around lines 320-323):
```javascript
if (distToTargetCenter <= this.eps) {
    x = targetCenter.x;
    y = targetCenter.y;
    // Ensure orthogonal axis is exactly at center
    if (direction.x !== 0) {
        y = targetCenter.y; // Ensure Y is at center
    } else {
        x = targetCenter.x; // Ensure X is at center
    }
}
```

#### Phase 2: Fix TileCenterMovementStrategy (If Used)

**File**: `src/movement/strategies/TileCenterMovementStrategy.js`

Lines 100-107 (updateProgress):
```javascript
// Add axis-locking to interpolation
const prevCenterX = entity.prevGridX * tileSize + tileSize / 2;
const prevCenterY = entity.prevGridY * tileSize + tileSize / 2;
const nextCenterX = entity.targetGridX * tileSize + tileSize / 2;
const nextCenterY = entity.targetGridY * tileSize + tileSize / 2;

entity.x = prevCenterX + (nextCenterX - prevCenterX) * entity.moveProgress;
entity.y = prevCenterY + (nextCenterY - prevCenterY) * entity.moveProgress;

// Add: Ensure orthogonal axis stays centered during movement
if (entity.direction.x !== 0) {
    // Horizontal movement - Y should be constant
    entity.y = prevCenterY; // or nextCenterY, they're the same
} else if (entity.direction.y !== 0) {
    // Vertical movement - X should be constant
    entity.x = prevCenterX; // or nextCenterX, they're the same
}
```

#### Phase 3: Fix Legacy GridMovement (If Still Used)

**File**: `src/utils/movement/GridMovement.js`

Add centering enforcement after position updates throughout the function, particularly:
- After line 126 (when at center)
- After line 167 (warp movement)
- After line 186 (normal movement)
- After line 205 (short movement)
- After line 225 (continue straight)
- After line 262 (boundary hit)
- After line 273 (normal movement)
- After line 289 (reached center)
- After line 311 (short movement before center)
- After line 328 (after warp)
- After line 346 (after tile enter)
- After lines 359-360 (final snap)

Example fix pattern:
```javascript
// After any position update, enforce centering
if (entity.direction.x !== 0) {
    entity.y = center.y; // Lock Y
} else if (entity.direction.y !== 0) {
    entity.x = center.x; // Lock X
}
```

#### Phase 4: Add Safety Check in Visual Sync

**Files**: 
- `src/view/visuals/VisualPlayer.js` (lines 64-118)
- `src/view/visuals/VisualEnemy.js` (lines 161-180)

Add a defensive centering correction (optional, for extra safety):

```javascript
// In sync() method, after getting position
const tileSize = gameConfig.tileSize;
const gridX = Math.floor(this.state.x / tileSize);
const gridY = Math.floor(this.state.y / tileSize);
const centerX = gridX * tileSize + tileSize / 2;
const centerY = gridY * tileSize + tileSize / 2;

// Apply slight correction if significantly off-center
if (this.state.moveProgress === 0) {
    // Entity is not moving, should be exactly at center
    this.sprite.x = centerX;
    this.sprite.y = centerY;
} else {
    // Entity is moving, use model position (which should be corrected by movement system)
    this.sprite.x = this.state.x;
    this.sprite.y = this.state.y;
}
```

#### Phase 5: Configuration Cleanup

**File**: `src/core/GameModel.js`

1. **Lines 57-60**: Consider enabling `useTileCenterMovement` by default:
```javascript
// Change from:
this.useTileCenterMovement = config.useTileCenterMovement ?? false;
// To:
this.useTileCenterMovement = config.useTileCenterMovement ?? true;
```

2. **Lines 117-135**: Ensure consistent adapter initialization:
```javascript
if (this.useTileCenterMovement) {
    this.movementAdapter = new TileCenterMovementAdapter(this.maze);
    // ...
} else if (this.useDecoupledSystems) {
    this.movementAdapter = new MovementAdapter(this);
    // ...
}
```

3. **Document the configuration options** in comments to clarify which system is used when.

---

## 5. Testing Plan

### 5.1 Unit Tests

Create tests to verify:
1. Horizontal movement keeps Y at tile center
2. Vertical movement keeps X at tile center
3. Entity stays centered throughout entire movement
4. No drift accumulation over multiple tiles

### 5.2 Visual Tests

1. Enable debug grid overlay to verify alignment
2. Move entity long distances and check alignment
3. Test all 4 directions
4. Test direction changes at intersections

### 5.3 Integration Tests

1. Test with actual game scenes
2. Verify collision detection still works
3. Verify pellet collection works
4. Test tunnel/warp behavior

---

## 6. Migration Path

### Step 1: Immediate Fix (GridMovementStrategy)
- Implement axis-locking in GridMovementStrategy
- This fixes the issue for the default configuration

### Step 2: Verify TileCenterMovementStrategy
- If TileCenterMovement is enabled, ensure it also has proper centering
- This may already work correctly due to its design

### Step 3: Deprecate Legacy Systems
- Mark GridMovement.js as deprecated with clear warnings
- Eventually remove once all code paths use the new systems

### Step 4: Configuration Simplification
- Remove the dual flag system (useDecoupledSystems + useTileCenterMovement)
- Use a single movementStrategy configuration

---

## 7. Files to Modify

| File | Lines | Change Type |
|------|-------|-------------|
| `src/movement/strategies/GridMovementStrategy.js` | 199-359 | Add axis-locking |
| `src/movement/strategies/TileCenterMovementStrategy.js` | 100-107 | Verify/Add centering |
| `src/utils/movement/GridMovement.js` | Multiple | Add centering (if still used) |
| `src/core/GameModel.js` | 57-60, 117-135 | Configuration cleanup |
| `src/view/visuals/VisualPlayer.js` | 64-118 | Add safety check (optional) |
| `src/view/visuals/VisualEnemy.js` | 161-180 | Add safety check (optional) |

---

## 8. Success Criteria

1. **Visual**: Entities stay perfectly centered in corridors during movement
2. **Technical**: No drift accumulation over 100+ tile movements
3. **Gameplay**: Collision detection remains accurate
4. **Performance**: No measurable performance impact
5. **Compatibility**: All existing tests pass

---

## 9. Additional Considerations

### 9.1 Tunnel/Warp Behavior
Special attention needed for tunnel wrapping to ensure entities are centered when warping.

### 9.2 Direction Changes
When changing direction at intersections, ensure the entity is properly centered before allowing the turn.

### 9.3 Death/Respawn
Ensure entities are centered when respawning after death.

### 9.4 Frame Rate Independence
All centering calculations must remain frame-rate independent.

---

*Plan created: 2026-02-21*
*Next step: Implement Phase 1 fixes*
