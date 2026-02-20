# ADA Movement System Fix Plan

## Problem Summary
Entities (Player and Enemies) are not correctly centered on tile paths. The current movement system allows entities to drift away from tile centers, causing visual misalignment between the entity position and the actual walkable path.

Root cause: The movement system uses continuous pixel-based movement with imperfect snapping logic. Grid positions (`gridX`, `gridY`) and pixel positions (`x`, `y`) can become desynchronized.

## Solution: Simplified Tile-Based Movement

### Core Principle
**Entities always move from one tile center to another tile center.** There is no "in-between" state in the logic - the visual representation interpolates smoothly, but the logical position is always exactly at a tile center.

### Design

#### 1. Entity State Changes
```javascript
// Current (problematic):
entity.x = 270.5  // Can be anywhere
entity.y = 543.2
entity.gridX = 13
entity.gridY = 27  // May not match x/y

// New (always consistent):
entity.gridX = 13
entity.gridY = 27
entity.x = gridX * tileSize + tileSize/2  // ALWAYS 270
entity.y = gridY * tileSize + tileSize/2  // ALWAYS 550
entity.moveProgress = 0.0  // 0.0 to 1.0 for visual interpolation
entity.prevGridX = 12  // For interpolation direction
entity.prevGridY = 27
```

#### 2. Movement Logic
Instead of moving pixels, we move by tiles:

```javascript
// Pseudocode for new movement
function move(entity, direction, deltaTime) {
    // If we're not currently moving to a new tile
    if (entity.moveProgress === 0) {
        // Check if we can move in direction
        const nextGridX = entity.gridX + direction.x;
        const nextGridY = entity.gridY + direction.y;

        if (canMove(nextGridX, nextGridY)) {
            // Start moving to next tile
            entity.prevGridX = entity.gridX;
            entity.prevGridY = entity.gridY;
            entity.targetGridX = nextGridX;
            entity.targetGridY = nextGridY;
            entity.moveProgress = 0.001; // Start movement
            entity.direction = direction;
        }
    }

    // Progress current movement
    if (entity.moveProgress > 0) {
        const tilesPerSecond = entity.speed / tileSize;
        entity.moveProgress += tilesPerSecond * deltaTime;

        if (entity.moveProgress >= 1.0) {
            // Arrived at new tile
            entity.gridX = entity.targetGridX;
            entity.gridY = entity.targetGridY;
            entity.x = entity.gridX * tileSize + tileSize/2;
            entity.y = entity.gridY * tileSize + tileSize/2;
            entity.moveProgress = 0;
        }
    }
}
```

#### 3. Visual Interpolation
The view layer interpolates between prevGridX/Y and gridX/Y:

```javascript
// In VisualPlayer.sync()
function sync() {
    const tileSize = 20;

    if (entity.moveProgress > 0) {
        // Interpolate between tiles
        const prevCenterX = entity.prevGridX * tileSize + tileSize/2;
        const prevCenterY = entity.prevGridY * tileSize + tileSize/2;
        const nextCenterX = entity.targetGridX * tileSize + tileSize/2;
        const nextCenterY = entity.targetGridY * tileSize + tileSize/2;

        this.sprite.x = prevCenterX + (nextCenterX - prevCenterX) * entity.moveProgress;
        this.sprite.y = prevCenterY + (nextCenterY - prevCenterY) * entity.moveProgress;
    } else {
        // At rest - use current grid position
        this.sprite.x = entity.gridX * tileSize + tileSize/2;
        this.sprite.y = entity.gridY * tileSize + tileSize/2;
    }
}
```

### Implementation Steps

#### Phase 1: New Entity State Structure
- [ ] Add `moveProgress`, `prevGridX`, `prevGridY`, `targetGridX`, `targetGridY` to ModelEntity
- [ ] Ensure `x` and `y` are always derived from `gridX` and `gridY`
- [ ] Remove direct `x`/`y` manipulation from movement code

#### Phase 2: New Movement Strategy
- [ ] Create `TileCenterMovementStrategy.js` (new file)
- [ ] Implement tile-to-tile movement with progress tracking
- [ ] Handle direction changes only at moveProgress === 0
- [ ] Handle blocked movement (can't move in desired direction)

#### Phase 3: Update MovementAdapter
- [ ] Use new `TileCenterMovementStrategy` instead of `GridMovementStrategy`
- [ ] Ensure `updatePacman()` and `updateGhost()` work with new system

#### Phase 4: Update Visuals
- [ ] Update `VisualPlayer.sync()` to use interpolation
- [ ] Update `VisualEnemy.sync()` to use interpolation
- [ ] Remove origin fixes (no longer needed with correct positioning)

#### Phase 5: Update AI
- [ ] Ensure `EnemyAIAdapter` works with new movement (only changes direction at moveProgress === 0)
- [ ] Test all four enemy types

#### Phase 6: Cleanup
- [ ] Remove debug logging from ModelDrivenGameView
- [ ] Remove old `GridMovementStrategy.js` or keep as fallback
- [ ] Run all tests

### Key Benefits
1. **Always centered**: Entities are logically always at tile centers
2. **Smooth visuals**: Interpolation provides fluid animation
3. **Simpler logic**: No complex "moving toward/away from center" calculations
4. **Easier debugging**: Grid position is always correct
5. **Deterministic**: Same input always produces same result

### Risk Mitigation
- Keep old `GridMovementStrategy.js` as fallback
- Test with existing test suite before removing old code
- Implement in phases to isolate issues

### Estimated Complexity
- **Phase 1-2**: Core movement logic (~150 lines)
- **Phase 3-4**: Integration (~50 lines changes)
- **Phase 5-6**: AI and cleanup (~30 lines changes)

Total: ~230 lines of new/changed code
