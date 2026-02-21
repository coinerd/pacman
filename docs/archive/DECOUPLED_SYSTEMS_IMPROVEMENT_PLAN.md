# Decoupled Movement & Collision Systems - Improvement Plan

## Executive Summary

After Phase 4 completion, the game shows partial success with decoupled systems:
- ✅ **Pac-Man moves** longer distances than before
- ❌ **Pac-Man gets stuck** at certain maze locations
- ❌ **Ghosts do NOT move** at all

This document outlines a comprehensive plan to fix these issues and achieve fully decoupled, working movement and collision systems for all entities.

---

## Root Cause Analysis

### Issue 1: Pac-Man Gets Stuck

**Root Cause**: Dual movement system conflict

In `GameModel.step()` (lines 223-257):
```javascript
if (this.useDecoupledSystems) {
    // Update Pacman using decoupled system
    const pacmanMoveEvents = this.movementAdapter.updateEntity(
        this.pacman,
        deltaSeconds,
        this.desiredDirection
    );
    events.push(...pacmanMoveEvents);
    
    // ... but PacmanState still has legacy update() method
    // that expects to be called and uses moveEntityOnGrid()
}
```

The problem:
1. `MovementAdapter.updateEntity()` calls `MovementEngine.move()` which uses `GridMovementStrategy`
2. `GridMovementStrategy.move()` handles direction changes via `inputDirection` parameter
3. But `PacmanState.update()` (lines 46-98) has its own logic:
   - Calls `makeDecisionAtIntersection()` which uses `directionBuffer`
   - Calls legacy `moveEntityOnGrid()` which shows deprecation warning
   - This creates conflicting movement calculations

**Specific Stuck Scenario**:
- When Pac-Man reaches a tile center, `GridMovementStrategy.tryTurn()` checks if it can turn
- But `PacmanState.makeDecisionAtIntersection()` also tries to apply buffered direction
- The two systems compete, causing Pac-Man to stop when they disagree on walkability

### Issue 2: Ghosts Don't Move

**Root Cause**: No AI integration with decoupled movement

In `GameModel.step()` (lines 234-237):
```javascript
// Update ghosts
for (const ghost of this.ghosts) {
    const ghostMoveEvents = this.movementAdapter.updateEntity(ghost, deltaSeconds);
    events.push(...ghostMoveEvents);
}
```

The problem:
1. Ghosts don't receive `inputDirection` parameter (it's `null`)
2. `GridMovementStrategy.move()` only attempts turns when `inputDirection` is provided:
   ```javascript
   if (inputDirection && (inputDirection.x !== 0 || inputDirection.y !== 0)) {
       const turnResult = this.tryTurn(entity, mazeQuery, inputDirection);
       ...
   }
   ```
3. Ghosts need AI to choose directions at tile centers, but the decoupled system has no AI integration
4. Ghosts start with `direction = NONE`, so without AI, they never get a direction to move

---

## Architecture Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GameModel.step()                                   │
│  (Single entry point for all game logic)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Pac-Man Update    │    │   Ghosts Update     │    │   Collision Check   │
│                     │    │                     │    │                     │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ Input Processing│ │    │ │   Ghost AI      │ │    │ │ CollisionAdapter│ │
│ │ (from InputMgr) │ │    │ │  (choose dir)   │ │    │ │                 │ │
│ └────────┬────────┘ │    │ └────────┬────────┘ │    │ └─────────────────┘ │
│          ▼          │    │          ▼          │    └─────────────────────┘
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │MovementAdapter  │ │    │ │MovementAdapter  │ │
│ │  (no legacy     │ │    │ │  (no legacy     │ │
│ │   update call)  │ │    │ │   update call)  │ │
│ └─────────────────┘ │    │ └─────────────────┘ │
└─────────────────────┘    └─────────────────────┘
```

Key Principles:
1. **Single Movement Path**: Only `MovementAdapter` moves entities, never legacy `moveEntityOnGrid()`
2. **AI Integration**: Ghost AI runs before movement to set desired direction
3. **No Dual Updates**: Entity `update()` methods should NOT call movement functions when using decoupled systems
4. **Clear Separation**: Model handles logic, adapters handle system coordination

---

## Phase 5: Fix Pac-Man Movement (Week 1)

### Goal
Eliminate dual movement system conflict so Pac-Man moves smoothly without getting stuck.

### Changes Required

#### 5.1: Modify PacmanState for Decoupled Mode

**File**: `src/model/entities/PacmanState.js`

Make `update()` method aware of decoupled mode:

```javascript
/**
 * Update Pacman state
 * @param {number} deltaSeconds - Time since last frame
 * @param {Array<Array<number>>} maze - Maze grid
 * @param {Object} inputDirection - Desired direction from input (optional)
 * @param {boolean} useDecoupledSystems - Whether using decoupled movement
 * @returns {Array<Object>} - Events generated
 */
update(deltaSeconds, maze, inputDirection = null, useDecoupledSystems = false) {
    const events = [];

    if (this.isDying) {
        this.updateDeathAnimation(deltaSeconds);
        return events;
    }

    // Update mouth animation (always needed)
    this.updateMouthAnimation(deltaSeconds);

    if (useDecoupledSystems) {
        // In decoupled mode, MovementAdapter handles all movement
        // PacmanState only handles animations and state
        // Direction changes are applied via directionBuffer by MovementAdapter
        
        // Just update moving state based on current direction
        this.isMoving = this.direction !== directions.NONE;
        
        // Handle tunnel wrapping (if not handled by MovementAdapter)
        if (this.handleTunnelWrap()) {
            events.push({
                type: 'tunnel_wrap',
                entityId: this.id,
                entityType: 'pacman',
                gridX: this.gridX,
                gridY: this.gridY
            });
        }
    } else {
        // Legacy mode - full update with movement
        // ... existing legacy code ...
    }

    return events;
}
```

#### 5.2: Enhance MovementAdapter for Direction Buffer Integration

**File**: `src/model/adapters/MovementAdapter.js`

Add support for Pac-Man's direction buffer:

```javascript
/**
 * Update Pacman movement with direction buffer support
 * @param {PacmanState} pacman - Pacman entity
 * @param {number} deltaSeconds - Time delta
 * @param {Object} inputDirection - Input direction from player
 * @returns {Array<Object>} - Movement events
 */
updatePacman(pacman, deltaSeconds, inputDirection) {
    // Queue input direction in buffer (legacy compatibility)
    if (inputDirection && inputDirection !== directions.NONE) {
        pacman.setDirection(inputDirection);
    }
    
    // Get the buffered direction (next direction to apply at center)
    const bufferedDirection = pacman.nextDirection || pacman.direction;
    
    // Build context with buffered direction
    const context = {
        mazeQuery: this.mazeQuery,
        inputDirection: bufferedDirection,
        entityType: 'pacman'
    };

    // Use movement engine
    const result = this.movementEngine.move(pacman, context, deltaSeconds);
    
    // Apply result
    this.applyMovementResult(pacman, result);
    
    // If direction was applied, clear the buffer
    if (result.newDirection && result.newDirection !== pacman.direction) {
        pacman.directionBuffer.clear(); // Direction was applied
    }

    return result.events.map(event => this.convertMovementEvent(event, pacman));
}
```

#### 5.3: Update GameModel to Use New Adapter Methods

**File**: `src/core/GameModel.js`

Modify `step()` to use specialized adapter methods:

```javascript
// Update Pacman with input handling
const pacmanMoveEvents = this.movementAdapter.updatePacman(
    this.pacman,
    deltaSeconds,
    this.desiredDirection
);
events.push(...pacmanMoveEvents);

// Update Pacman state (animations only in decoupled mode)
const pacmanStateEvents = this.pacman.update(
    deltaSeconds, 
    this.maze, 
    null,  // input already handled
    this.useDecoupledSystems
);
events.push(...pacmanStateEvents);
```

### Testing
- [ ] Pac-Man moves smoothly through entire maze
- [ ] Direction changes work at tile centers
- [ ] No deprecation warnings from GridMovement
- [ ] No "stuck" scenarios at intersections

---

## Phase 6: Integrate Ghost AI with Decoupled Systems (Week 2)

### Goal
Enable ghost movement by integrating Ghost AI with the decoupled movement system.

### Changes Required

#### 6.1: Create GhostAIAdapter

**File**: `src/model/adapters/GhostAIAdapter.js` (NEW)

```javascript
/**
 * GhostAIAdapter
 * Integrates Ghost AI with decoupled movement system.
 * Runs AI decision-making to determine ghost directions.
 */

import { directions, ghostModes, scatterTargets } from '../../config/gameConfig.js';
import { getValidDirections, getDistance, isWalkableTile } from '../../utils/MazeLayout.js';
import { getOpposite } from '../../config/gameConfig.js';

export class GhostAIAdapter {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.modeTimer = 0;
        this.currentMode = ghostModes.SCATTER;
        this.modeDurations = [
            { mode: ghostModes.SCATTER, duration: 7 },   // 7 seconds
            { mode: ghostModes.CHASE, duration: 20 },    // 20 seconds
            { mode: ghostModes.SCATTER, duration: 7 },
            { mode: ghostModes.CHASE, duration: 20 },
            { mode: ghostModes.SCATTER, duration: 5 },
            { mode: ghostModes.CHASE, duration: 20 },
            { mode: ghostModes.SCATTER, duration: 5 },
            { mode: ghostModes.CHASE, duration: Infinity }
        ];
        this.modeIndex = 0;
    }

    /**
     * Update all ghosts' AI
     * @param {number} deltaSeconds - Time delta
     */
    update(deltaSeconds) {
        this.updateModeTimer(deltaSeconds);
        
        for (const ghost of this.gameModel.ghosts) {
            this.updateGhostAI(ghost, deltaSeconds);
        }
    }

    /**
     * Update mode timer and switch modes
     * @param {number} deltaSeconds - Time delta
     */
    updateModeTimer(deltaSeconds) {
        if (this.modeIndex >= this.modeDurations.length) {
            return;
        }

        this.modeTimer += deltaSeconds;
        const currentModeConfig = this.modeDurations[this.modeIndex];

        if (this.modeTimer >= currentModeConfig.duration) {
            this.modeTimer = 0;
            this.modeIndex++;
            this.currentMode = this.modeDurations[this.modeIndex]?.mode || ghostModes.CHASE;
            
            // Reverse all ghosts on mode change
            for (const ghost of this.gameModel.ghosts) {
                if (!ghost.isFrightened && !ghost.isEaten) {
                    this.reverseGhost(ghost);
                }
            }
        }
    }

    /**
     * Update individual ghost AI
     * @param {GhostState} ghost - Ghost to update
     * @param {number} deltaSeconds - Time delta
     */
    updateGhostAI(ghost, deltaSeconds) {
        // Skip AI for eaten ghosts (they have special logic)
        if (ghost.isEaten) {
            return;
        }

        // Update frightened timer
        if (ghost.isFrightened) {
            ghost.updateFrightened(deltaSeconds);
        }

        // Set ghost mode
        if (!ghost.isFrightened && !ghost.isEaten) {
            ghost.mode = this.currentMode;
        }

        // AI only chooses direction at tile center
        const center = this.getTileCenter(ghost.gridX, ghost.gridY);
        const distToCenter = Math.hypot(center.x - ghost.x, center.y - ghost.y);
        
        if (distToCenter > 3) { // epsilon
            return;
        }

        // Choose direction based on AI
        const direction = this.chooseDirection(ghost);
        if (direction) {
            ghost.setDirection(direction);
        }
    }

    /**
     * Choose direction for ghost based on its AI personality
     * @param {GhostState} ghost - Ghost to choose direction for
     * @returns {Object|null} - Chosen direction
     */
    chooseDirection(ghost) {
        const validDirs = getValidDirections(
            this.gameModel.maze, 
            ghost.gridX, 
            ghost.gridY
        );

        if (validDirs.length === 0) {
            return null;
        }

        // Filter out reverse direction (ghosts can't reverse)
        let filteredDirs = validDirs;
        if (ghost.direction !== directions.NONE) {
            const opposite = getOpposite(ghost.direction);
            filteredDirs = validDirs.filter(d => !(d.x === opposite.x && d.y === opposite.y));
        }

        if (filteredDirs.length === 0) {
            filteredDirs = validDirs;
        }

        // Frightened: random direction
        if (ghost.isFrightened) {
            return filteredDirs[Math.floor(Math.random() * filteredDirs.length)];
        }

        // Calculate target
        const target = this.getTargetForGhost(ghost);
        
        // Choose direction that minimizes distance to target
        let bestDir = filteredDirs[0];
        let bestDist = Infinity;

        for (const dir of filteredDirs) {
            const newX = ghost.gridX + dir.x;
            const newY = ghost.gridY + dir.y;
            const dist = getDistance(newX, newY, target.x, target.y);

            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }

        return bestDir;
    }

    /**
     * Get target position for ghost based on its personality
     * @param {GhostState} ghost - Ghost
     * @returns {Object} - Target {x, y}
     */
    getTargetForGhost(ghost) {
        const pacman = this.gameModel.pacman;

        switch (ghost.ghostType) {
        case 'blinky':
            return this.getBlinkyTarget(pacman, ghost);
        case 'pinky':
            return this.getPinkyTarget(pacman, ghost);
        case 'inky':
            return this.getInkyTarget(pacman, ghost);
        case 'clyde':
            return this.getClydeTarget(pacman, ghost);
        default:
            return { x: pacman.gridX, y: pacman.gridY };
        }
    }

    /**
     * Blinky: Direct chase
     */
    getBlinkyTarget(pacman, ghost) {
        if (ghost.mode === ghostModes.SCATTER) {
            return scatterTargets.blinky;
        }
        return { x: pacman.gridX, y: pacman.gridY };
    }

    /**
     * Pinky: 4 tiles ahead of Pacman
     */
    getPinkyTarget(pacman, ghost) {
        if (ghost.mode === ghostModes.SCATTER) {
            return scatterTargets.pinky;
        }
        
        let targetX = pacman.gridX + (pacman.direction.x * 4);
        let targetY = pacman.gridY + (pacman.direction.y * 4);

        // Arcade bug: Up also moves target left
        if (pacman.direction.y === -1) {
            targetX -= 4;
        }

        return { x: targetX, y: targetY };
    }

    /**
     * Inky: Vector from Blinky through 2 tiles ahead of Pacman
     */
    getInkyTarget(pacman, ghost) {
        if (ghost.mode === ghostModes.SCATTER) {
            return scatterTargets.inky;
        }

        const blinky = this.gameModel.getGhostByType('blinky');
        const pivotX = pacman.gridX + (pacman.direction.x * 2);
        const pivotY = pacman.gridY + (pacman.direction.y * 2);

        if (blinky) {
            return {
                x: pivotX + (pivotX - blinky.gridX),
                y: pivotY + (pivotY - blinky.gridY)
            };
        }
        return { x: pivotX, y: pivotY };
    }

    /**
     * Clyde: Chase if far, scatter if close
     */
    getClydeTarget(pacman, ghost) {
        if (ghost.mode === ghostModes.SCATTER) {
            return scatterTargets.clyde;
        }

        const dist = getDistance(ghost.gridX, ghost.gridY, pacman.gridX, pacman.gridY);
        
        if (dist > 8) {
            return { x: pacman.gridX, y: pacman.gridY };
        } else {
            return scatterTargets.clyde;
        }
    }

    /**
     * Reverse ghost direction
     * @param {GhostState} ghost - Ghost to reverse
     */
    reverseGhost(ghost) {
        if (ghost.direction !== directions.NONE) {
            const opposite = getOpposite(ghost.direction);
            ghost.direction = opposite;
        }
    }

    /**
     * Get tile center position
     * @param {number} gridX - Grid X
     * @param {number} gridY - Grid Y
     * @returns {Object} - Center position {x, y}
     */
    getTileCenter(gridX, gridY) {
        const tileSize = 20; // From gameConfig
        return {
            x: gridX * tileSize + tileSize / 2,
            y: gridY * tileSize + tileSize / 2
        };
    }

    /**
     * Reset AI state
     */
    reset() {
        this.modeTimer = 0;
        this.modeIndex = 0;
        this.currentMode = ghostModes.SCATTER;
    }
}
```

#### 6.2: Modify GhostState for Decoupled Mode

**File**: `src/model/entities/GhostState.js`

Simplify `update()` to not handle movement in decoupled mode:

```javascript
/**
 * Update ghost state
 * @param {number} deltaSeconds - Time since last frame
 * @param {Array<Array<number>>} maze - Maze grid
 * @param {Object} pacmanState - Pacman state for AI targeting
 * @param {boolean} useDecoupledSystems - Whether using decoupled movement
 * @returns {Array<Object>} - Events generated
 */
update(deltaSeconds, maze, pacmanState = null, useDecoupledSystems = false) {
    const events = [];

    if (useDecoupledSystems) {
        // In decoupled mode:
        // - GhostAIAdapter handles AI and direction setting
        // - MovementAdapter handles movement
        // - GhostState only handles state updates (timers, flags)
        
        if (this.isEaten) {
            // Eaten state still needs special handling for returning to house
            const eatenEvents = this.updateEatenDecoupled(deltaSeconds);
            events.push(...eatenEvents);
        }
        
        // Update frightened timer
        if (this.isFrightened) {
            this.updateFrightened(deltaSeconds);
        }
        
        this.isMoving = this.direction !== directions.NONE;
    } else {
        // Legacy mode - full update
        // ... existing code ...
    }

    return events;
}
```

#### 6.3: Update MovementAdapter for Ghosts

**File**: `src/model/adapters/MovementAdapter.js`

Add ghost-specific update method:

```javascript
/**
 * Update ghost movement
 * @param {GhostState} ghost - Ghost entity
 * @param {number} deltaSeconds - Time delta
 * @returns {Array<Object>} - Movement events
 */
updateGhost(ghost, deltaSeconds) {
    // Ghost direction is set by GhostAIAdapter before this call
    // We use ghost.direction (or ghost.nextDirection from buffer)
    const direction = ghost.nextDirection || ghost.direction;
    
    const context = {
        mazeQuery: this.mazeQuery,
        inputDirection: direction,
        entityType: 'ghost'
    };

    const result = this.movementEngine.move(ghost, context, deltaSeconds);
    this.applyMovementResult(ghost, result);

    return result.events.map(event => this.convertMovementEvent(event, ghost));
}
```

#### 6.4: Update GameModel to Integrate Ghost AI

**File**: `src/core/GameModel.js`

Add GhostAIAdapter and update step():

```javascript
import { GhostAIAdapter } from './adapters/GhostAIAdapter.js';

constructor(config = {}) {
    // ... existing code ...
    
    if (this.useDecoupledSystems) {
        this.movementAdapter = new MovementAdapter(this);
        this.collisionAdapter = new CollisionAdapter(this);
        this.ghostAIAdapter = new GhostAIAdapter(this); // NEW
        this.collisionSystem = null;
    } else {
        // ... existing code ...
    }
}

step(deltaSeconds, input = null) {
    // ... existing code ...
    
    if (this.useDecoupledSystems) {
        // Update Pacman
        const pacmanMoveEvents = this.movementAdapter.updatePacman(
            this.pacman,
            deltaSeconds,
            this.desiredDirection
        );
        events.push(...pacmanMoveEvents);

        // Update Ghost AI (sets directions)
        this.ghostAIAdapter.update(deltaSeconds);

        // Update ghosts (movement only, AI already done)
        for (const ghost of this.ghosts) {
            const ghostMoveEvents = this.movementAdapter.updateGhost(ghost, deltaSeconds);
            events.push(...ghostMoveEvents);
        }
        
        // ... rest of collision handling ...
    }
    
    // ... rest of method ...
}
```

### Testing
- [ ] Ghosts move in all modes (scatter, chase, frightened, eaten)
- [ ] Each ghost has distinct personality (Blinky direct, Pinky ahead, etc.)
- [ ] Ghosts reverse direction on mode changes
- [ ] Frightened ghosts move randomly
- [ ] Eaten ghosts return to house

---

## Phase 7: Collision System Hardening (Week 3)

### Goal
Ensure collision detection works perfectly with decoupled movement.

### Changes Required

#### 7.1: Update CollisionAdapter for New Entity Positions

**File**: `src/model/adapters/CollisionAdapter.js`

Ensure collision detection uses the correct entity positions from decoupled movement:

```javascript
/**
 * Check all collisions using decoupled collision system
 * @returns {Array<Object>} - Collision events
 */
checkAllCollisions() {
    const events = [];

    // Sync entity positions to collision system
    this.syncEntitiesToCollisionSystem();

    // Check Pacman-Ghost collisions
    for (const ghost of this.gameModel.ghosts) {
        const collision = this.checkEntityCollision(this.gameModel.pacman, ghost);
        if (collision) {
            events.push(collision);
        }
    }

    // Check Pacman-Pellet collisions
    const pelletCollision = this.checkPelletCollision(this.gameModel.pacman);
    if (pelletCollision) {
        events.push(pelletCollision);
    }

    // Check Pacman-Fruit collisions
    if (this.gameModel.fruit.active) {
        const fruitCollision = this.checkFruitCollision(this.gameModel.pacman);
        if (fruitCollision) {
            events.push(fruitCollision);
        }
    }

    return events;
}
```

#### 7.2: Add Swept Collision for High-Speed Scenarios

**File**: `src/collision/CollisionEngine.js`

Ensure swept collision detection handles entities that may "jump" over each other:

```javascript
/**
 * Check collision between two moving entities using swept AABB
 * @param {Object} entityA - First entity
 * @param {Object} entityB - Second entity
 * @returns {CollisionResult|null} - Collision result or null
 */
checkSweptCollision(entityA, entityB) {
    // Use previous positions (set by MovementAdapter before movement)
    const prevX = entityA.prevX !== undefined ? entityA.prevX : entityA.x;
    const prevY = entityA.prevY !== undefined ? entityA.prevY : entityA.y;
    
    // ... swept collision logic using prevX/prevY ...
}
```

### Testing
- [ ] All collision types work (pellet, power pellet, ghost, fruit)
- [ ] No missed collisions at high speeds
- [ ] Tunnel wrapping doesn't cause false collisions
- [ ] Ghost-eaten collisions work correctly

---

## Phase 8: Cleanup and Legacy Removal (Week 4)

### Goal
Remove legacy code paths and deprecate old systems.

### Changes Required

#### 8.1: Deprecate Legacy Entity Update Methods

Add console warnings when legacy `update()` is called with movement:

```javascript
// In PacmanState.update() and GhostState.update()
if (!useDecoupledSystems) {
    console.warn('[DEPRECATED] Legacy entity update with movement is deprecated. ' +
                 'Use MovementAdapter with useDecoupledSystems=true');
    // ... legacy code ...
}
```

#### 8.2: Remove GridMovement.js

After all code paths use decoupled systems:
- Delete `src/utils/movement/GridMovement.js`
- Update imports in any remaining files

#### 8.3: Consolidate Test Suites

- Move tests to use decoupled systems by default
- Keep legacy tests in separate `tests/legacy/` directory
- Ensure 100% test coverage for decoupled systems

### Testing
- [ ] No deprecation warnings in console during normal play
- [ ] All tests pass with decoupled systems
- [ ] Legacy mode still works (backward compatibility)

---

## Implementation Timeline

| Week | Phase | Deliverables | Success Criteria |
|------|-------|--------------|------------------|
| Week 1 | 5 | Pac-Man fix, Direction Buffer integration | Pac-Man moves smoothly, no stuck states |
| Week 2 | 6 | GhostAIAdapter, ghost movement | All 4 ghosts move with correct AI personalities |
| Week 3 | 7 | Collision hardening, swept collision | All collision types work perfectly |
| Week 4 | 8 | Legacy cleanup, test consolidation | Clean codebase, 100% test coverage |

---

## Testing Strategy

### Unit Tests
- `GhostAIAdapter.test.js` - AI decision-making
- `MovementAdapter.pacman.test.js` - Pac-Man movement
- `MovementAdapter.ghost.test.js` - Ghost movement
- `CollisionAdapter.integration.test.js` - Collision detection

### Integration Tests
- `DecoupledSystems.fullgame.test.js` - Complete game simulation
- `GhostAI.personalities.test.js` - Each ghost behavior
- `Collision.edgecases.test.js` - Tunnel, high-speed, corners

### Manual Testing Checklist
- [ ] Play full game from level 1-3
- [ ] Test all 4 ghost personalities
- [ ] Test power pellet (frightened mode)
- [ ] Test death and respawn
- [ ] Test tunnel wrapping
- [ ] Test all maze intersections

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Ghost AI behavior differences | Medium | Medium | Extensive comparison testing with legacy |
| Performance regression | Low | High | Profile before/after, optimize hotspots |
| Collision misses | Medium | High | Swept collision + extensive edge case testing |
| Memory leaks | Low | Medium | Monitor heap during long play sessions |

---

## Conclusion

This improvement plan addresses the root causes of the current issues:

1. **Pac-Man getting stuck** → Eliminate dual movement system, single source of truth
2. **Ghosts not moving** → Integrate Ghost AI with decoupled movement
3. **Collision issues** → Harden collision detection with swept checks

The result will be a fully decoupled, maintainable system where:
- Model owns all game logic
- Movement is handled by MovementEngine
- AI is handled by GhostAIAdapter
- View is a pure observer
- All entities use the same movement pipeline
