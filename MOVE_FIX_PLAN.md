# MOVE_FIX_PLAN.md

## Overview
Comprehensive plan to fix "entities not moving bug" through systematic testing and incremental fixes.

## Current State Analysis

### Architecture
- **BaseEntity**: Base class for all moving entities
- **Pacman**: Player-controlled entity with direction buffering
- **Ghost**: AI-controlled entities with multiple modes
- **TileMovement.performGridMovementStep()**: Core movement logic (current)
- **BaseEntity.updateMovement()**: Legacy movement logic (unused)

### Key Issues Identified

#### 1. Duplicate Movement Logic
**Issue**: Two movement implementations exist
- `BaseEntity.updateMovement()` (lines 26-44) - legacy, never called
- `TileMovement.performGridMovementStep()` - actively used

**Impact**: Maintenance burden, potential confusion

**Fix Strategy**: Remove unused legacy code after verifying tests pass

---

#### 2. Complex Center-Snapping Logic
**Issue**: Multiple overlapping conditions for center snapping (TileMovement.js lines 111-121)

```javascript
const shouldSnapToCenter = distToCenter <= EPS
    || (movingTowardCenter && distToCenter <= remainingDist)
    || (movingTowardCenter && distToCenter <= (remainingDist + EPS))
    || (hasBufferedTurn && distToCenter <= turnTolerance)
    || (hasBufferedTurn && distToCenter < gameConfig.tileSize * 0.35 && remainingDist >= gameConfig.tileSize * 0.1)
    || (hasBufferedTurn && wasMoving && distToCenter <= gameConfig.tileSize * 0.5 && remainingDist >= gameConfig.tileSize * 0.1);
```

**Impact**: Ambiguity in snapping behavior, edge cases difficult to reason about

**Fix Strategy**: Simplify to single, clear condition based on test results

---

#### 3. Inconsistent Previous Position Initialization
**Issue**: Different patterns for tracking previous positions

| Entity | prevX/prevY | prevGridX/prevGridY |
|--------|-------------|---------------------|
| BaseEntity | ❌ Not set | ✅ Set in constructor |
| Pacman | ✅ Set in constructor | ✅ Set in constructor |
| Ghost | ✅ Set in constructor | ❌ Inherits from BaseEntity only |

**Impact**: Collision detection may fail if previous positions unavailable

**Fix Strategy**: Standardize initialization across all entities

---

#### 4. Dual Tunnel Handling
**Issue**: Both `handleTunnelWrap()` and `handlePortalTraversal()` are called

```javascript
// In Pacman.update() and Ghost.moveGhost():
this.handleTunnelWrap();
handlePortalTraversal(this, gameConfig.tileSize);
```

**Impact**: Possible double-wrapping or inconsistent behavior

**Fix Strategy**: Verify which is correct and use one consistently

---

## Testing Framework Strategy

### Phase 1: Unit Test Expansion
**Goal**: Ensure robust coverage of movement primitives

#### 1.1 Entity Initialization Tests
- [ ] Test BaseEntity initialization (previous positions)
- [ ] Test Pacman initialization (all properties)
- [ ] Test Ghost initialization (all properties + state flags)
- [ ] Verify prevX/prevY set correctly on initialization
- [ ] Verify prevGridX/prevGridY set correctly on initialization

**Test File**: `tests/entities/EntityInitialization.test.js` (new)

---

#### 1.2 Movement Primitive Tests
- [ ] Test `isAtTileCenter()` with edge cases
  - Exactly at center
  - Within EPS tolerance
  - Just outside EPS tolerance
  - Different tile positions

- [ ] Test `distanceToTileCenter()` accuracy
  - At various positions
  - Boundary conditions
  - Negative positions

- [ ] Test center snapping behavior
  - Single tile movement
  - Multiple tile movement
  - With buffered turns
  - Without buffered turns
  - Near walls

**Test File**: `tests/unit/CenterSnapping.test.js` (new)

---

#### 1.3 Previous Position Tracking Tests
- [ ] Test prevX/prevY updates on movement
- [ ] Test prevGridX/prevGridY updates on tile crossing
- [ ] Verify positions tracked even when entity stops
- [ ] Test with zero speed
- [ ] Test with direction changes

**Test File**: `tests/unit/PreviousPositionTracking.test.js` (new)

---

### Phase 2: Integration Tests
**Goal**: Test movement behavior in realistic scenarios

#### 2.1 Single Entity Movement Tests
- [ ] Test Pacman straight line movement
- [ ] Test Pacman 90-degree turn
- [ ] Test Pacman 180-degree turn (direction buffer)
- [ ] Test Pacman wall collision
- [ ] Test Pacman stop when surrounded by walls
- [ ] Test Ghost straight line movement
- [ ] Test Ghost 90-degree turn at intersection
- [ ] Test Ghost wall collision

**Test File**: `tests/integration/SingleEntityMovement.test.js` (new)

---

#### 2.2 Tunnel/Warp Tests
- [ ] Test tunnel wrapping (left → right)
- [ ] Test tunnel wrapping (right → left)
- [ ] Test entity behavior at tunnel entrance
- [ ] Test multiple consecutive warps
- [ ] Test speed reduction in tunnel (ghosts)
- [ ] Test portal traversal vs tunnel wrap

**Test File**: `tests/integration/TunnelBehavior.test.js` (new)

---

#### 2.3 Edge Case Tests
- [ ] Test entity at tile center with no direction
- [ ] Test entity with zero speed
- [ ] Test entity with very high speed
- [ ] Test entity at map boundaries
- [ ] Test entity after resetPosition()
- [ ] Test entity during state transitions (Ghost mode changes)

**Test File**: `tests/integration/MovementEdgeCases.test.js` (new)

---

### Phase 3: Multi-Entity Tests
**Goal**: Test interactions between multiple entities

#### 3.1 Collision Detection Tests
- [ ] Test Pacman-Ghost collision detection
- [ ] Test crossed path detection
- [ ] Test swept AABB collision
- [ ] Test distance-based collision fallback
- [ ] Test ghost-ghost collision

**Test File**: `tests/integration/MultiEntityCollision.test.js` (new)

---

#### 3.2 Concurrent Movement Tests
- [ ] Test Pacman and Ghost moving simultaneously
- [ ] Test multiple Ghosts at intersections
- [ ] Test entity blocking other entities (if applicable)
- [ ] Test performance with all entities moving

**Test File**: `tests/integration/ConcurrentMovement.test.js` (new)

---

### Phase 4: Regression Tests
**Goal**: Ensure fixes don't break existing functionality

#### 4.1 Existing Test Validation
- [ ] Run all existing tests (27 test files)
- [ ] Document any failures
- [ ] Identify tests that need updates after fixes

#### 4.2 Fuzz Testing
- [ ] Random direction changes
- [ ] Random speed variations
- [ ] Random spawn positions
- [ ] Long-running movement simulations (1000+ frames)

**Test File**: `tests/regression/MovementFuzz.test.js` (new)

---

## Fix Implementation Plan

### Fix 1: Standardize Previous Position Initialization
**Priority**: HIGH
**Files**: `BaseEntity.js`, `Pacman.js`, `Ghost.js`

**Implementation**:
1. Add prevX/prevY initialization to BaseEntity constructor
2. Verify Pacman and Ghost don't duplicate initialization
3. Update tests to verify consistent initialization

**Acceptance Criteria**:
- All entities have prevX/prevY set after construction
- All entities have prevGridX/prevGridY set after construction
- Previous positions are equal to current positions initially
- All existing tests pass

**Verification**:
```bash
npm test -- EntityInitialization
npm test -- PreviousPositionTracking
```

---

### Fix 2: Simplify Center-Snapping Logic
**Priority**: HIGH
**File**: `src/utils/TileMovement.js`

**Implementation**:
1. Run comprehensive center-snapping tests to understand current behavior
2. Identify overlapping conditions
3. Simplify to single condition:
   - Snap if within EPS of center
   - Snap if moving toward center and will cross it this frame
4. Preserve buffered turn behavior
5. Update tests

**Proposed Simplification**:
```javascript
// Simplified logic (to be validated by tests)
const willCrossCenter = movingTowardCenter && distToCenter <= remainingDist;
const needsToSnap = willCrossCenter || (hasBufferedTurn && distToCenter <= EPS);

if (needsToSnap) {
    // Snap to center and handle turn logic
}
```

**Acceptance Criteria**:
- All existing movement tests pass
- New center-snapping tests pass
- Behavior is deterministic and predictable
- No regression in edge cases

**Verification**:
```bash
npm test -- CenterSnapping
npm test -- SingleEntityMovement
```

---

### Fix 3: Unify Tunnel Handling
**Priority**: MEDIUM
**Files**: `BaseEntity.js`, `Pacman.js`, `Ghost.js`, `WarpTunnel.js`

**Implementation**:
1. Analyze behavior of both tunnel methods
2. Determine which method is correct through testing
3. Remove incorrect method
4. Standardize on one approach

**Acceptance Criteria**:
- Only one tunnel method is used
- Tunnel behavior works correctly (left ↔ right)
- Speed reduction applies in tunnel (ghosts)
- All tunnel tests pass

**Verification**:
```bash
npm test -- TunnelBehavior
```

---

### Fix 4: Remove Unused Legacy Code
**Priority**: LOW
**File**: `BaseEntity.js`

**Implementation**:
1. Verify BaseEntity.updateMovement() is never called
2. Search codebase for references
3. Remove method if unused
4. Update tests if needed

**Acceptance Criteria**:
- No references to updateMovement()
 exist
- All tests pass after removal
- Documentation updated

**Verification**:
```bash
grep -r "updateMovement" src/
npm test
```

---

## Test Execution Strategy

### Iterative Testing Approach

1. **Write tests for current behavior**
   - Test what the code actually does, not what it should do
   - Document all observed behaviors
   - Identify unexpected behaviors

2. **Implement fixes**
   - Make small, targeted changes
   - Run tests after each change
   - Document why tests pass/fail

3. **Validate fixes**
   - Ensure all tests pass
   - Add new tests for edge cases discovered
   - Performance test with all entities moving

### Continuous Testing

```bash
# Watch mode during development
npm run test:watch

# Coverage reporting
npm run test:coverage

# Specific test suites
npm test -- EntityInitialization
npm test -- CenterSnapping
npm test -- TunnelBehavior
npm test -- SingleEntityMovement
npm test -- MultiEntityCollision
```

---

## Success Criteria

### Functional Requirements
- [ ] All entities move correctly in all directions
- [ ] Entities stop at walls
- [ ] Entities turn at intersections
- [ ] Buffered turns work as expected
- [ ] Tunnel/warp behavior works correctly
- [ ] Collision detection works with all entities

### Technical Requirements
- [ ] All tests pass (>95% coverage on movement code)
- [ ] No performance regressions (60 FPS maintained)
- [ ] Code complexity reduced (simplified center-snapping)
- [ ] No duplicate code (legacy code removed)

### Test Requirements
- [ ] 15+ new test files created
- [ ] 200+ new test cases added
- [ ] All edge cases covered
- [ ] Regression tests in place

---

## Risk Mitigation

### Potential Risks

1. **Breaking existing functionality**
   - Mitigation: Comprehensive existing tests before changes
   - Fallback: Git revert if major regression

2. **Performance degradation**
   - Mitigation: Benchmark before and after
   - Fallback: Profile and optimize hot paths

3. **Complex interactions discovered**
   - Mitigation: Integration tests for multi-entity scenarios
   - Fallback: Incremental fixes with validation at each step

4. **Edge cases not covered**
   - Mitigation: Fuzz testing and long-running simulations
   - Fallback: Add tests as issues are discovered

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Unit Tests | 2-3 hours | - |
| Phase 2: Integration Tests | 3-4 hours | Phase 1 |
| Phase 3: Multi-Entity Tests | 2-3 hours | Phase 2 |
| Fix 1-2 (High Priority) | 2-3 hours | Phase 1 |
| Phase 4: Regression Tests | 1-2 hours | Fixes 1-2 |
| Fix 3-4 (Medium/Low Priority) | 1-2 hours | Phase 4 |
| **Total** | **13-17 hours** | - |

---

## Next Steps

1. **Immediate**:
   - Create test directory structure
   - Write Phase 1 unit tests (EntityInitialization, CenterSnapping, PreviousPositionTracking)
   - Run tests to establish baseline

2. **Short-term**:
   - Implement Fix 1 (Standardize Previous Position Initialization)
   - Implement Fix 2 (Simplify Center-Snapping)
   - Validate with Phase 2 integration tests

3. **Medium-term**:
   - Implement Phase 3 multi-entity tests
   - Implement Fix 3 (Unify Tunnel Handling)
   - Run Phase 4 regression tests

4. **Long-term**:
   - Remove legacy code (Fix 4)
   - Performance optimization
   - Documentation updates

---

## Appendix: Test Templates

### Entity Initialization Test Template
```javascript
describe('Entity Initialization', () => {
    test('BaseEntity initializes all position tracking', () => {
        const entity = new BaseEntity(...);
        expect(entity.x).toBeDefined();
        expect(entity.y).toBeDefined();
        expect(entity.prevX).toBeDefined();
        expect(entity.prevY).toBeDefined();
        expect(entity.gridX).toBeDefined();
        expect(entity.gridY).toBeDefined();
        expect(entity.prevGridX).toBeDefined();
        expect(entity.prevGridY).toBeDefined();
    });

    test('Previous positions equal current positions initially', () => {
        const entity = new BaseEntity(...);
        expect(entity.prevX).toBe(entity.x);
        expect(entity.prevY).toBe(entity.y);
        expect(entity.prevGridX).toBe(entity.gridX);
        expect(entity.prevGridY).toBe(entity.gridY);
    });
});
```

### Movement Test Template
```javascript
describe('Entity Movement', () => {
    test('Entity moves in direction', () => {
        const entity = createMockEntity();
        const initialX = entity.x;
        const initialY = entity.y;

        entity.direction = directions.RIGHT;
        performGridMovementStep(entity, maze, 100); // 100ms delta

        expect(entity.x).toBeGreaterThan(initialX);
        expect(entity.y).toBe(initialY);
    });

    test('Entity stops at wall', () => {
        const entity = createMockEntity({ gridX: 1, gridY: 1 });
        entity.direction = directions.LEFT; // Wall at (0, 1)

        const prevX = entity.x;
        performGridMovementStep(entity, maze, 1000); // Large delta

        expect(entity.x).toBeLessThan(prevX); // Moved but stopped at wall
    });
});
```

### Fuzz Test Template
```javascript
describe('Movement Fuzz Tests', () => {
    test('Random direction changes maintain consistency', () => {
        const entity = createMockEntity();
        const positions = [];

        for (let i = 0; i < 1000; i++) {
            const dir = getRandomDirection();
            entity.setDirection(dir);
            performGridMovementStep(entity, maze, 16.67); // 60 FPS
            positions.push({ x: entity.x, y: entity.y });
        }

        // Verify no NaN or infinite positions
        positions.forEach(pos => {
            expect(isFinite(pos.x)).toBe(true);
            expect(isFinite(pos.y)).toBe(true);
        });

        // Verify entity stays within bounds (accounting for tunnel)
        positions.forEach(pos => {
            expect(pos.x).toBeGreaterThanOrEqual(-gameConfig.tileSize);
            expect(pos.x).toBeLessThanOrEqual(gameConfig.mazeWidth * gameConfig.tileSize + gameConfig.tileSize);
            expect(pos.y).toBeGreaterThanOrEqual(0);
            expect(pos.y).toBeLessThanOrEqual(gameConfig.mazeHeight * gameConfig.tileSize);
        });
    });
});
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-07
**Status**: Draft - Ready for implementation
