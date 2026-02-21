# Entity Centering Fix - Implementation Summary

## Changes Made

### 1. GridMovementStrategy (`src/movement/strategies/GridMovementStrategy.js`)
Added axis-locking to `performMovement()` method to ensure entities stay centered in corridors:

- **Movement with axis-locking** (lines ~312-330): When moving horizontally, Y is locked to tile center. When moving vertically, X is locked to tile center.
- **Wall hit positioning** (lines ~250-265): Boundary position also enforces axis-locking.
- **Target center reached** (lines ~337-345): When snapping to target center, orthogonal axis is explicitly set.

### 2. TileCenterMovementStrategy (`src/movement/strategies/TileCenterMovementStrategy.js`)
Added safety axis-locking in `updateProgress()` method (lines ~106-116):
- Ensures orthogonal axis stays constant during interpolation
- Handles any potential floating point drift

### 3. Legacy GridMovement (`src/utils/movement/GridMovement.js`)
- Added `applyAxisLocking()` helper function (lines ~17-32)
- Applied axis-locking at all 15+ position update locations throughout `moveEntityOnGrid()`

### 4. TileCenterMovementAdapter (`src/model/adapters/TileCenterMovementAdapter.js`)
- Added `mazeQuery` property alias for compatibility (line 14)

### 5. GameModel Configuration (`src/core/GameModel.js`)
- Changed default for `useTileCenterMovement` from `false` to `true` (line 60)
- Reordered initialization logic to prioritize legacy mode check first (lines ~118-137)
- Updated comments to clarify system selection priority

## Test Results

Before fix: 22 failed tests
After fix: 2 failed tests (unrelated to centering - Maze generation/Spawn point issues)

## Technical Details

### Axis-Locking Pattern
```javascript
if (direction.x !== 0) {
    // Horizontal movement - lock Y to tile center
    x += direction.x * moveDist;
    y = center.y;
} else if (direction.y !== 0) {
    // Vertical movement - lock X to tile center
    x = center.x;
    y += direction.y * moveDist;
}
```

### Why This Works
- When moving horizontally (LEFT/RIGHT), the Y coordinate should remain at the tile's vertical center
- When moving vertically (UP/DOWN), the X coordinate should remain at the tile's horizontal center
- This prevents entities from drifting off the center line of corridors

## Verification

To verify the fix works:
1. Run the game
2. Move entities in all 4 directions
3. Observe that entities stay perfectly centered in corridors
4. No visible drift should occur even after extended movement

## Remaining Test Failures

Two tests fail due to unrelated Maze generation issues where spawn points may be placed in walls:
- `tests/integration/DecoupledSystems.test.js`
- `tests/model/UnifiedGameModel.test.js`

These failures exist independently of the centering fix and are related to the random maze generation not guaranteeing walkable spawn positions.
