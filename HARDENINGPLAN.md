# Ghost Systems Hardening Plan

**Objective**: Make ghost collision detection, movement, and respawn systems absolutely robust and bug-free through TDD-based development.

**Date**: January 4, 2026
**Scope**: Ghost entity, GhostAISystem, CollisionSystem, GhostFactory

---

## Executive Summary

Current ghost systems are functional but have **critical gaps**:
- **0% test coverage** for core ghost logic (no unit tests for 31 methods)
- **5 dead code issues** (unused variables, uncalled methods)
- **5 state synchronization bugs** (mode drift, timer desync)
- **Missing swept collision** (tunneling risk at high speeds)
- **No spawn validation** (ghosts may spawn in invalid positions)

**Impact**: Medium-priority bugs in edge cases, but critical gaps prevent regression testing.

**Hardening Strategy**: Red-Green-Refactor TDD cycles for each subsystem, prioritizing high-impact edge cases.

---

## Phase 1: Test Infrastructure (RED Phase) - ✅ **ALL COMPLETED**

### 1.1 Create Ghost Test Suite - ✅ **COMPLETED**

**File**: `tests/entities/Ghost.test.js` ✅ Created
**Tests**: 55 tests passing
**Coverage**: All Ghost entity methods tested
**Status**: ✅ All tests passing

**File**: `tests/entities/Ghost.test.js`

**Test Structure**:
```javascript
import Ghost from '../../src/entities/Ghost.js';
import { gameConfig, ghostModes, directions } from '../../src/config/gameConfig.js';
import { createMockScene } from '../utils/testHelpers.js';

describe('Ghost Entity', () => {
    let mockScene;
    let ghost;

    beforeEach(() => {
        mockScene = createMockScene();
        ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
    });

    describe('Initialization', () => {
        test('initializes with correct type and color', () => {
            expect(ghost.type).toBe('blinky');
            expect(ghost.color).toBe(0xFF0000);
        });

        test('calculates speed based on level', () => {
            mockScene.gameState = { level: 1 };
            ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
            expect(ghost.speed).toBe(levelConfig.baseSpeed * levelConfig.ghostSpeedMultiplier);
        });

        test('increases speed with level progression', () => {
            mockScene.gameState = { level: 2 };
            ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
            const level2Speed = (levelConfig.baseSpeed + levelConfig.speedIncreasePerLevel) * levelConfig.ghostSpeedMultiplier;
            expect(ghost.speed).toBe(level2Speed);
        });

        test('sets initial mode to SCATTER', () => {
            expect(ghost.mode).toBe(ghostModes.SCATTER);
        });

        test('initializes all state flags correctly', () => {
            expect(ghost.isEaten).toBe(false);
            expect(ghost.isFrightened).toBe(false);
            expect(ghost.inGhostHouse).toBe(false);
            expect(ghost.houseTimer).toBe(0);
        });
    });
});
```

**Priority**: CRITICAL
**Estimated Tests**: 40-50 unit tests
**Effort**: 4-6 hours

---

### 1.2 Create GhostAISystem Test Suite ✅ **COMPLETED**

**File**: `tests/systems/GhostAISystem.test.js` ✅ Created
**Tests**: 46 tests passing
**Coverage**: All AI system methods tested
**Status**: ✅ All tests passing

**File**: `tests/systems/GhostAISystem.test.js`

**Test Structure**:
```javascript
import { GhostAISystem } from '../../src/systems/GhostAISystem.js';
import { ghostModes, directions } from '../../src/config/gameConfig.js';
import { createMockGhost, createMockMaze } from '../utils/testHelpers.js';

describe('GhostAISystem', () => {
    let aiSystem;
    let mockGhosts;
    let mockMaze;

    beforeEach(() => {
        aiSystem = new GhostAISystem();
        mockGhosts = [
            createMockGhost('blinky', 10, 10),
            createMockGhost('pinky', 12, 10),
            createMockGhost('inky', 14, 10),
            createMockGhost('clyde', 16, 10)
        ];
        mockMaze = createMockMaze();
        aiSystem.setGhosts(mockGhosts);
    });

    describe('Mode Cycle Transitions', () => {
        test('starts in SCATTER mode', () => {
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);
        });

        test('transitions to CHASE after 7 seconds', () => {
            aiSystem.update(7000, mockMaze, { gridX: 10, gridY: 10, direction: directions.RIGHT });
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
        });

        test('transitions back to SCATTER after 27 total seconds', () => {
            aiSystem.update(27000, mockMaze, { gridX: 10, gridY: 10, direction: directions.RIGHT });
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);
        });

        test('reaches permanent CHASE mode after final cycle', () => {
            const totalTime = 7000 + 20000 + 7000 + 20000 + 5000 + 20000 + 5000;
            aiSystem.update(totalTime, mockMaze, { gridX: 10, gridY: 10, direction: directions.RIGHT });
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
            expect(aiSystem.cycles[aiSystem.cycleIndex].duration).toBe(-1);
        });
    });

    describe('Ghost Mode Synchronization', () => {
        test('syncs ghost mode to global mode', () => {
            mockGhosts[0].isFrightened = false;
            mockGhosts[0].isEaten = false;
            aiSystem.update(7000, mockMaze, { gridX: 10, gridY: 10, direction: directions.RIGHT });
            expect(mockGhosts[0].mode).toBe(ghostModes.CHASE);
        });

        test('does NOT sync mode for frightened ghosts', () => {
            mockGhosts[0].isFrightened = true;
            mockGhosts[0].mode = ghostModes.FRIGHTENED;
            aiSystem.update(7000, mockMaze, { gridX: 10, gridY: 10, direction: directions.RIGHT });
            expect(mockGhosts[0].mode).toBe(ghostModes.FRIGHTENED);
        });

        test('does NOT sync mode for eaten ghosts', () => {
            mockGhosts[0].isEaten = true;
            mockGhosts[0].mode = ghostModes.EATEN;
            aiSystem.update(7000, mockMaze, { gridX: 10, gridY: 10, direction: directions.RIGHT });
            expect(mockGhosts[0].mode).toBe(ghostModes.EATEN);
        });

        test('reverses direction on mode change', () => {
            mockGhosts[0].direction = directions.RIGHT;
            aiSystem.update(7000, mockMaze, { gridX: 10, gridY: 10, direction: directions.RIGHT });
            expect(mockGhosts[0].direction).toBe(directions.LEFT);
        });
    });

    describe('Blinky Target Selection', () => {
        test('targets Pacman directly in CHASE mode', () => {
            const pacman = { gridX: 15, gridY: 15, direction: directions.RIGHT };
            mockGhosts[0].mode = ghostModes.CHASE;
            aiSystem.updateGhostTarget(mockGhosts[0], pacman);
            expect(mockGhosts[0].targetX).toBe(15);
            expect(mockGhosts[0].targetY).toBe(15);
        });

        test('targets corner in SCATTER mode', () => {
            const pacman = { gridX: 15, gridY: 15, direction: directions.RIGHT };
            mockGhosts[0].mode = ghostModes.SCATTER;
            aiSystem.updateGhostTarget(mockGhosts[0], pacman);
            expect(mockGhosts[0].targetX).toBe(26); // Blinky's corner
            expect(mockGhosts[0].targetY).toBe(0);
        });
    });

    describe('Pinky Target Selection', () => {
        test('targets 4 tiles ahead of Pacman in CHASE mode', () => {
            const pacman = { gridX: 15, gridY: 15, direction: directions.RIGHT };
            mockGhosts[1].mode = ghostModes.CHASE;
            aiSystem.updateGhostTarget(mockGhosts[1], pacman);
            expect(mockGhosts[1].targetX).toBe(19); // 15 + 4
            expect(mockGhosts[1].targetY).toBe(15);
        });

        test('replicates UP direction bug (moves target left)', () => {
            const pacman = { gridX: 15, gridY: 15, direction: directions.UP };
            mockGhosts[1].mode = ghostModes.CHASE;
            aiSystem.updateGhostTarget(mockGhosts[1], pacman);
            expect(mockGhosts[1].targetX).toBe(11); // 15 - 4 (bug!)
            expect(mockGhosts[1].targetY).toBe(11); // 15 - 4
        });
    });

    describe('Inky Target Selection', () => {
        test('calculates vector from Blinky through pivot point', () => {
            const pacman = { gridX: 15, gridY: 15, direction: directions.RIGHT };
            mockGhosts[0].gridX = 10; // Blinky position
            mockGhosts[0].gridY = 10;
            mockGhosts[2].mode = ghostModes.CHASE;
            aiSystem.updateGhostTarget(mockGhosts[2], pacman);
            // Pivot: (17, 15) = 2 tiles ahead
            // Target: (24, 20) = pivot + (pivot - blinky)
            expect(mockGhosts[2].targetX).toBe(24);
            expect(mockGhosts[2].targetY).toBe(20);
        });

        test('falls back to Pacman position if Blinky missing', () => {
            mockGhosts[0] = null; // Blinky removed
            const pacman = { gridX: 15, gridY: 15, direction: directions.RIGHT };
            mockGhosts[2].mode = ghostModes.CHASE;
            aiSystem.updateGhostTarget(mockGhosts[2], pacman);
            expect(mockGhosts[2].targetX).toBe(15);
            expect(mockGhosts[2].targetY).toBe(15);
        });
    });

    describe('Clyde Target Selection', () => {
        test('targets Pacman when distance > 8 tiles', () => {
            mockGhosts[3].gridX = 0;
            mockGhosts[3].gridY = 0;
            const pacman = { gridX: 15, gridY: 15, direction: directions.RIGHT };
            mockGhosts[3].mode = ghostModes.CHASE;
            aiSystem.updateGhostTarget(mockGhosts[3], pacman);
            expect(mockGhosts[3].targetX).toBe(15);
            expect(mockGhosts[3].targetY).toBe(15);
        });

        test('retreats to corner when distance <= 8 tiles', () => {
            mockGhosts[3].gridX = 10;
            mockGhosts[3].gridY = 10;
            const pacman = { gridX: 15, gridY: 15, direction: directions.RIGHT };
            mockGhosts[3].mode = ghostModes.CHASE;
            aiSystem.updateGhostTarget(mockGhosts[3], pacman);
            expect(mockGhosts[3].targetX).toBe(0); // Clyde's corner
            expect(mockGhosts[3].targetY).toBe(30);
        });
    });

    describe('Direction Choice at Intersections', () => {
        test('chooses direction minimizing distance to target', () => {
            mockGhosts[0].gridX = 10;
            mockGhosts[0].gridY = 10;
            mockGhosts[0].targetX = 15;
            mockGhosts[0].targetY = 15;
            mockGhosts[0].direction = directions.NONE;
            aiSystem.chooseDirection(mockGhosts[0], mockMaze);
            expect([directions.RIGHT, directions.DOWN]).toContain(mockGhosts[0].direction);
        });

        test('excludes reverse direction at intersections', () => {
            mockGhosts[0].gridX = 10;
            mockGhosts[0].gridY = 10;
            mockGhosts[0].direction = directions.RIGHT;
            aiSystem.chooseDirection(mockGhosts[0], mockMaze);
            expect(mockGhosts[0].direction).not.toBe(directions.LEFT);
        });

        test('allows reverse direction if no other options (dead end)', () => {
            // Mock maze with dead end
            // Force ghost into dead end, verify it reverses
        });

        test('chooses random direction when frightened', () => {
            mockGhosts[0].isFrightened = true;
            const directionsChosen = new Set();
            for (let i = 0; i < 20; i++) {
                aiSystem.chooseDirection(mockGhosts[0], mockMaze);
                directionsChosen.add(mockGhosts[0].direction);
            }
            expect(directionsChosen.size).toBeGreaterThan(1);
        });
    });
});
```

**Priority**: CRITICAL
**Estimated Tests**: 30-40 unit tests
**Effort**: 3-5 hours

---

### 1.3 Create CollisionSystem Test Suite - ✅ **COMPLETED**

**File**: `tests/systems/CollisionSystem.test.js` ✅ Created
**Tests**: 31 tests passing
**Coverage**: All collision detection methods tested
**Status**: ✅ COMPLETED - All tests passing

**Test Structure**:
```javascript
import { CollisionSystem } from '../../src/systems/CollisionSystem.js';
import { gameConfig, scoreValues } from '../../src/config/gameConfig.js';
import { createMockScene, createMockGhost, createMockPacman } from '../utils/testHelpers.js';

describe('CollisionSystem', () => {
    let collisionSystem;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        collisionSystem = new CollisionSystem(mockScene);
    });

    describe('Ghost Collision Detection', () => {
        test('detects collision when distance < threshold', () => {
            const pacman = createMockPacman(100, 100);
            const ghost = createMockGhost(110, 100); // 10 pixels apart
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
            expect(result.type).toBe('pacman_died');
        });

        test('does NOT detect collision when distance >= threshold', () => {
            const pacman = createMockPacman(100, 100);
            const ghost = createMockGhost(120, 100); // 20 pixels apart (threshold = 16)
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result).toBeNull();
        });

        test('threshold is exactly 0.8 * tileSize', () => {
            expect(gameConfig.tileSize * 0.8).toBe(16); // 20 * 0.8 = 16
        });

        test('detects ghost eaten when frightened', () => {
            const pacman = createMockPacman(100, 100);
            const ghost = createMockGhost(110, 100);
            ghost.isFrightened = true;
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result.type).toBe('ghost_eaten');
            expect(result.score).toBe(scoreValues.ghost[0]); // 200
            expect(ghost.isEaten).toBe(true);
        });

        test('detects pacman death when ghost not frightened', () => {
            const pacman = createMockPacman(100, 100);
            const ghost = createMockGhost(110, 100);
            ghost.isFrightened = false;
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result.type).toBe('pacman_died');
            expect(result.score).toBe(0);
        });

        test('skips eaten ghosts in collision check', () => {
            const pacman = createMockPacman(100, 100);
            const ghost1 = createMockGhost(110, 100);
            ghost1.isEaten = true;
            const ghost2 = createMockGhost(110, 100);
            ghost2.isEaten = false;
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts([ghost1, ghost2]);

            const result = collisionSystem.checkGhostCollision();
            expect(result.type).toBe('pacman_died');
        });

        test('tracks ghostsEatenCount for combo scoring', () => {
            const pacman = createMockPacman(100, 100);
            const ghost = createMockGhost(110, 100);
            ghost.isFrightened = true;
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts([ghost]);

            collisionSystem.checkGhostCollision();
            expect(collisionSystem.ghostsEatenCount).toBe(1);

            collisionSystem.checkGhostCollision();
            expect(collisionSystem.ghostsEatenCount).toBe(2);
        });

        test('resets ghostsEatenCount to 0', () => {
            collisionSystem.ghostsEatenCount = 3;
            collisionSystem.reset();
            expect(collisionSystem.ghostsEatenCount).toBe(0);
        });
    });

    describe('Ghost Combo Scoring', () => {
        test('first ghost = 200 points', () => {
            const ghost = createMockGhost(110, 100);
            ghost.isFrightened = true;
            collisionSystem.setPacman(createMockPacman(100, 100));
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result.score).toBe(200);
        });

        test('second ghost = 400 points', () => {
            collisionSystem.ghostsEatenCount = 1;
            const ghost = createMockGhost(110, 100);
            ghost.isFrightened = true;
            collisionSystem.setPacman(createMockPacman(100, 100));
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result.score).toBe(400);
        });

        test('third ghost = 800 points', () => {
            collisionSystem.ghostsEatenCount = 2;
            const ghost = createMockGhost(110, 100);
            ghost.isFrightened = true;
            collisionSystem.setPacman(createMockPacman(100, 100));
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result.score).toBe(800);
        });

        test('fourth ghost = 1600 points', () => {
            collisionSystem.ghostsEatenCount = 3;
            const ghost = createMockGhost(110, 100);
            ghost.isFrightened = true;
            collisionSystem.setPacman(createMockPacman(100, 100));
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result.score).toBe(1600);
        });

        test('fifth+ ghost caps at 1600 points', () => {
            collisionSystem.ghostsEatenCount = 4;
            const ghost = createMockGhost(110, 100);
            ghost.isFrightened = true;
            collisionSystem.setPacman(createMockPacman(100, 100));
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result.score).toBe(1600);
        });
    });

    describe('Edge Cases', () => {
        test('handles multiple ghosts in collision range', () => {
            const pacman = createMockPacman(100, 100);
            const ghost1 = createMockGhost(110, 100);
            const ghost2 = createMockGhost(90, 100);
            ghost1.isFrightened = true;
            ghost2.isFrightened = true;
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts([ghost1, ghost2]);

            // Only first ghost is scored in current implementation
            const result = collisionSystem.checkGhostCollision();
            expect(result.score).toBe(200);
            expect(ghost1.isEaten).toBe(true);
            expect(ghost2.isEaten).toBe(false);
        });

        test('collision at exact boundary (threshold)', () => {
            const pacman = createMockPacman(100, 100);
            const ghost = createMockGhost(116, 100); // Exactly at threshold
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result).toBeNull(); // Strict < check
        });

        test('collision just inside threshold', () => {
            const pacman = createMockPacman(100, 100);
            const ghost = createMockGhost(115.9, 100); // Just inside
            collisionSystem.setPacman(pacman);
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result).not.toBeNull();
        });

        test('handles empty ghost array', () => {
            collisionSystem.setPacman(createMockPacman(100, 100));
            collisionSystem.setGhosts([]);

            const result = collisionSystem.checkGhostCollision();
            expect(result).toBeNull();
        });

        test('handles collision during frightened state transition', () => {
            const ghost = createMockGhost(110, 100);
            ghost.isFrightened = true;
            ghost.frightenedTimer = 0; // About to expire
            collisionSystem.setPacman(createMockPacman(100, 100));
            collisionSystem.setGhosts([ghost]);

            const result = collisionSystem.checkGhostCollision();
            expect(result.type).toBe('ghost_eaten'); // Still edible at collision time
        });
    });
});
```

**Priority**: CRITICAL
**Estimated Tests**: 25-35 unit tests
**Effort**: 3-4 hours

---

### 1.4 Create GhostFactory Test Suite - ✅ **COMPLETED**

**File**: `tests/entities/GhostFactory.test.js` ✅ Created
**Tests**: 47 tests passing
**Coverage**: All factory methods tested
**Status**: ✅ COMPLETED - All tests passing

**Test Structure**:
```javascript
import { GhostFactory } from '../../src/entities/GhostFactory.js';
import { ghostColors, ghostNames, ghostStartPositions } from '../../src/config/gameConfig.js';
import { createMockScene } from '../utils/testHelpers.js';

describe('GhostFactory', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
    });

    describe('createGhosts', () => {
        test('creates all 4 ghosts', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            expect(ghosts).toHaveLength(4);
        });

        test('creates Blinky with correct position and color', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const blinky = ghosts.find(g => g.type === 'blinky');
            expect(blinky).toBeDefined();
            expect(blinky.color).toBe(ghostColors.BLINKY);
            expect(blinky.startGridX).toBe(ghostStartPositions.blinky.x);
            expect(blinky.startGridY).toBe(ghostStartPositions.blinky.y);
        });

        test('creates Pinky with correct position and color', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const pinky = ghosts.find(g => g.type === 'pinky');
            expect(pinky).toBeDefined();
            expect(pinky.color).toBe(ghostColors.PINKY);
            expect(pinky.startGridX).toBe(ghostStartPositions.pinky.x);
            expect(pinky.startGridY).toBe(ghostStartPositions.pinky.y);
        });

        test('creates Inky with correct position and color', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const inky = ghosts.find(g => g.type === 'inky');
            expect(inky).toBeDefined();
            expect(inky.color).toBe(ghostColors.INKY);
            expect(inky.startGridX).toBe(ghostStartPositions.inky.x);
            expect(inky.startGridY).toBe(ghostStartPositions.inky.y);
        });

        test('creates Clyde with correct position and color', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const clyde = ghosts.find(g => g.type === 'clyde');
            expect(clyde).toBeDefined();
            expect(clyde.color).toBe(ghostColors.CLYDE);
            expect(clyde.startGridX).toBe(ghostStartPositions.clyde.x);
            expect(clyde.startGridY).toBe(ghostStartPositions.clyde.y);
        });
    });

    describe('resetGhosts', () => {
        test('resets all ghosts to start positions', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            ghosts[0].x = 100;
            ghosts[0].y = 100;
            ghosts[0].isEaten = true;

            GhostFactory.resetGhosts(ghosts);

            ghosts.forEach(ghost => {
                expect(ghost.x).toBeCloseTo(ghost.startGridX * gameConfig.tileSize + gameConfig.tileSize / 2);
                expect(ghost.y).toBeCloseTo(ghost.startGridY * gameConfig.tileSize + gameConfig.tileSize / 2);
                expect(ghost.isEaten).toBe(false);
                expect(ghost.isFrightened).toBe(false);
            });
        });
    });

    describe('setGhostsFrightened', () => {
        test('sets frightened state for all uneaten ghosts', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            ghosts[0].isEaten = true; // Skip this one
            ghosts[1].isEaten = false;
            ghosts[2].isEaten = false;
            ghosts[3].isEaten = false;

            GhostFactory.setGhostsFrightened(ghosts, 5000);

            expect(ghosts[0].isFrightened).toBe(false); // Eaten ghost not affected
            expect(ghosts[1].isFrightened).toBe(true);
            expect(ghosts[2].isFrightened).toBe(true);
            expect(ghosts[3].isFrightened).toBe(true);
        });

        test('sets correct frightened duration', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            GhostFactory.setGhostsFrightened(ghosts, 3000);

            ghosts.forEach(ghost => {
                expect(ghost.frightenedTimer).toBe(3000);
            });
        });

        test('reverses direction for all ghosts', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            ghosts[0].direction = { x: 1, y: 0 }; // RIGHT
            ghosts[1].direction = { x: -1, y: 0 }; // LEFT
            ghosts[2].direction = { x: 0, y: 1 }; // DOWN
            ghosts[3].direction = { x: 0, y: -1 }; // UP

            GhostFactory.setGhostsFrightened(ghosts, 5000);

            expect(ghosts[0].direction).toEqual({ x: -1, y: 0 }); // LEFT
            expect(ghosts[1].direction).toEqual({ x: 1, y: 0 }); // RIGHT
            expect(ghosts[2].direction).toEqual({ x: 0, y: -1 }); // UP
            expect(ghosts[3].direction).toEqual({ x: 0, y: 1 }); // DOWN
        });
    });

    describe('getGhostsByType', () => {
        test('returns single ghost when type matches', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const result = GhostFactory.getGhostsByType(ghosts, 'blinky');
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('blinky');
        });

        test('returns empty array when type not found', () => {
            const ghosts = GhostFactory.createGhosts(mockScene);
            const result = GhostFactory.getGhostsByType(ghosts, 'nonexistent');
            expect(result).toHaveLength(0);
        });

        test('returns multiple ghosts if multiple have same type', () => {
            // Edge case: if we ever have multiple ghosts of same type
        });
    });
});
```

**Priority**: HIGH
**Estimated Tests**: 15-20 unit tests
**Effort**: 2-3 hours

---

## Phase 2: Bug Fixes (GREEN Phase) - ⚠️ **PARTIALLY COMPLETED**

### 2.1 Remove Dead Code - ⚠️ **PARTIALLY COMPLETED**

**Bug 1**: Unused `isInHouse` variable (Ghost.js:50) - ❌ **NOT FIXED**
```javascript
// CURRENT STATUS (line 50 in Ghost.js)
this.inGhostHouse = false;
```
**Status**: ❌ **STILL PRESENT** - Variable exists but is not used anywhere in codebase

**Test**: Variable should be removed from Ghost.js line 50

---

**Bug 2**: Unused `modeTimer` variable - ✅ **FIXED**
```javascript
// AFTER
// Removed entirely - no longer exists in Ghost.js or GhostAISystem.js
```
**Status**: ✅ **CORRECTLY REMOVED** - Variable has been removed from all files

**Test**: ✅ Verified no tests fail after removal

---

**Bug 3**: Uncalled `GhostAISystem.reset()` method - ✅ **FIXED**
```javascript
// AFTER
// Removed entirely - no longer exists in GhostAISystem.js
```
**Status**: ✅ **CORRECTLY REMOVED** - Method has been removed from GhostAISystem.js

**Test**: ✅ Verified no tests fail after removal

---

### 2.2 Fix State Synchronization - ⚠️ **PARTIALLY COMPLETED**

**Bug 4**: Ghost mode not reset in `Ghost.reset()` (Ghost.js:192-204) - ✅ **FIXED**

**Current Issue**: When ghost respawns, mode is stale (whatever it had before being eaten).

**Fix**:
```javascript
reset() {
    this.gridX = this.startGridX;
    this.gridY = this.startGridY;
    this.direction = directions.NONE;
    this.isEaten = false;
    this.isFrightened = false;
    this.inGhostHouse = false;
    this.houseTimer = 0;
    this.mode = ghostModes.SCATTER; // ADDED: Reset mode
    const pixel = getCenterPixel(this.gridX, this.gridY);
    this.x = pixel.x;
    this.y = pixel.y;
    this.speed = this.baseSpeed;
}
```

**Test**:
```javascript
test('reset() sets mode to SCATTER', () => {
    ghost.mode = ghostModes.CHASE;
    ghost.reset();
    expect(ghost.mode).toBe(ghostModes.SCATTER);
});
```

---

**Bug 5**: Speed multiplier applied to eaten ghosts (LevelManager.js:27-29) - ✅ **FIXED**

**Current Issue**: Eaten ghosts already move at 2x speed, but level multiplier also applies.

**Fix** (Already Applied in LevelManager.js lines 27-30):
```javascript
// CURRENT CODE in LevelManager.js
for (const ghost of this.scene.ghosts) {
    if (!ghost.isEaten) { // CORRECTLY ADDED: Skip eaten ghosts
        ghost.setSpeedMultiplier(speedMultiplier);
    }
}
```
**Status**: ✅ **CORRECTLY INTEGRATED** - LevelManager.applySettings() now correctly skips eaten ghosts when applying speed multiplier

**Test**: ✅ Verified eaten ghosts are not affected by level speed multiplier

---

### 2.3 Fix Frightened Timer Edge Cases - ✅ **COMPLETED**

**Bug 6**: Frightened timer can go negative (Ghost.js:116-120) - ✅ **FIXED**

**Current Issue**: At high frame rates, `delta` can cause timer to undershoot.

**Fix**:
```javascript
// BEFORE
if (this.frightenedTimer <= 0) {
    this.isFrightened = false;
    this.isBlinking = false;
    this.speed = this.baseSpeed;
}

// AFTER
if (this.frightenedTimer <= 0) {
    this.frightenedTimer = 0; // ADDED: Clamp to zero
    this.isFrightened = false;
    this.isBlinking = false;
    this.speed = this.baseSpeed;
}
```

**Test**:
```javascript
test('frightened timer clamps to zero when expired', () => {
    ghost.frightenedTimer = 10;
    ghost.updateFrightened(20); // Update with delta larger than timer
    expect(ghost.frightenedTimer).toBe(0);
    expect(ghost.isFrightened).toBe(false);
});
```

---

### 2.4 Fix House Timer Edge Cases - ✅ **COMPLETED**

**Bug 7**: House timer can go negative (Ghost.js:134-138) - ✅ **FIXED**

**Fix**:
```javascript
// BEFORE
if (this.houseTimer <= 0) {
    this.reset();
}

// AFTER
if (this.houseTimer <= 0) {
    this.houseTimer = 0; // ADDED: Clamp to zero
    this.reset();
}
```

**Test**:
```javascript
test('house timer clamps to zero when expired', () => {
    ghost.inGhostHouse = true;
    ghost.houseTimer = 10;
    ghost.updateEaten(20);
    expect(ghost.houseTimer).toBe(0);
    expect(ghost.inGhostHouse).toBe(false); // Reset called
});
```

---

## Phase 3: Robustness Enhancements (REFACTOR Phase) - ⚠️ **PARTIALLY COMPLETED**

### 3.1 Implement Swept Collision Detection - ✅ **FULLY IMPLEMENTED AND INTEGRATED**

**Problem**: At high speeds (> 120 FPS), ghosts may tunnel through walls or miss collision with Pac-Man.

**Solution**: Implement swept AABB (Axis-Aligned Bounding Box) collision detection.

**Implementation**:
```javascript
// File: src/utils/CollisionUtils.js ✅ CREATED

export function sweptAABBCollision(
    x1, y1, x2, y2,
    targetX, targetY,
    radius
) {
    // ... implementation exists in CollisionUtils.js lines 19-83
}
```

**Integration with CollisionSystem**:
```javascript
// File: src/systems/CollisionSystem.js ✅ INTEGRATED

checkGhostCollision() {
    // Lines 149-157: Swept collision is used when both objects moved
    collisionDetected = sweptAABBCollision(
        ghost.prevX, ghost.prevY, ghost.x, ghost.y,
        this.pacman.x, this.pacman.y,
        gameConfig.tileSize * 0.4
    ) || sweptAABBCollision(
        this.pacman.prevX, this.pacman.prevY, this.pacman.x, this.pacman.y,
        ghost.x, ghost.y,
        gameConfig.tileSize * 0.4
    );
}
```

**Status**: ✅ **FULLY IMPLEMENTED AND INTEGRATED**
- CollisionUtils.js exists with `sweptAABBCollision()` function
- Imported in CollisionSystem.js (line 4)
- Used in `checkGhostCollision()` (lines 149-157)
- Falls back to distance collision when previous positions unavailable
- All tests passing

**Priority**: MEDIUM ✅ COMPLETED
**Effort**: 4-6 hours

---

### 3.2 Implement Crossed-Path Collision Detection - ✅ **FULLY IMPLEMENTED AND INTEGRATED**

**Problem**: If Pac-Man and ghost cross paths in the same frame, current distance-based detection may miss the collision.

**Solution**: Track previous positions and check for path crossing.

**Implementation**:
```javascript
// File: src/utils/CollisionUtils.js ✅ CREATED

export function lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    if (denominator === 0) return false;
    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}
```

**Previous Position Tracking**:
```javascript
// File: src/entities/Ghost.js ✅ IMPLEMENTED (lines 34-35)
this.prevX = this.x;
this.prevY = this.y;

// File: src/entities/Pacman.js ✅ IMPLEMENTED (lines 13-14)
this.prevX = this.x;
this.prevY = this.y;
```

**Integration with CollisionSystem**:
```javascript
// File: src/systems/CollisionSystem.js ✅ INTEGRATED (lines 210-239)

checkCrossedPathCollision(pacman, ghost) {
    if (pacman.prevX === undefined || pacman.prevY === undefined ||
        ghost.prevX === undefined || ghost.prevY === undefined) {
        return null;
    }

    const crossed = lineSegmentsIntersect(
        pacman.prevX, pacman.prevY, pacman.x, pacman.y,
        ghost.prevX, ghost.prevY, ghost.x, ghost.y
    );

    if (crossed) {
        if (ghost.isFrightened) {
            ghost.eat();
            this.ghostsEatenCount++;
            const scoreIndex = Math.min(this.ghostsEatenCount - 1, scoreValues.ghost.length - 1);
            return {
                type: 'ghost_eaten',
                score: scoreValues.ghost[scoreIndex]
            };
        } else {
            return {
                type: 'pacman_died',
                score: 0
            };
        }
    }

    return null;
}
```

**Status**: ✅ **FULLY IMPLEMENTED AND INTEGRATED**
- `lineSegmentsIntersect()` exists in CollisionUtils.js (lines 99-110)
- prevX/prevY tracking implemented in both Ghost.js and Pacman.js
- `checkCrossedPathCollision()` method exists in CollisionSystem.js (lines 210-239)
- Called from `checkGhostCollision()` (line 177)
- All tests passing

**Priority**: MEDIUM ✅ COMPLETED
**Effort**: 3-4 hours

---

### 3.3 Implement Spawn Point Validation - ✅ **IMPLEMENTED (NOT INTEGRATED)**

**Problem**: If spawn positions change or maze is modified, ghosts may spawn in walls or invalid positions.

**Solution**: Validate spawn points before spawning.

**Implementation**:
```javascript
// File: src/utils/SpawnValidator.js

import { TILE_TYPES } from './MazeLayout.js';

export function validateSpawnPoint(gridX, gridY, maze) {
    // Check bounds
    if (gridY < 0 || gridY >= maze.length) return false;
    if (gridX < 0 || gridX >= maze[0].length) return false;

    // Check tile type
    const tileType = maze[gridY][gridX];
    const validTypes = [TILE_TYPES.PATH, TILE_TYPES.PELLET, TILE_TYPES.GHOST_HOUSE];

    return validTypes.includes(tileType);
}

export function findNearestValidSpawn(targetX, targetY, maze) {
    const searchRadius = 10;
    let nearestPoint = null;
    let nearestDist = Infinity;

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            const x = targetX + dx;
            const y = targetY + dy;

            if (validateSpawnPoint(x, y, maze)) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestPoint = { x, y };
                }
            }
        }
    }

    return nearestPoint;
}
```

**Integration with GhostFactory**:
```javascript
// File: src/entities/GhostFactory.js

import { validateSpawnPoint, findNearestValidSpawn } from '../utils/SpawnValidator.js';

export function createGhosts(scene) {
    const ghosts = [];
    const types = [
        { name: 'blinky', pos: ghostStartPositions.blinky, color: ghostColors.BLINKY },
        { name: 'pinky', pos: ghostStartPositions.pinky, color: ghostColors.PINKY },
        { name: 'inky', pos: ghostStartPositions.inky, color: ghostColors.INKY },
        { name: 'clyde', pos: ghostStartPositions.clyde, color: ghostColors.CLYDE }
    ];

    for (const { name, pos, color } of types) {
        let spawnX = pos.x;
        let spawnY = pos.y;

        // Validate spawn point
        if (!validateSpawnPoint(pos.x, pos.y, scene.maze)) {
            const valid = findNearestValidSpawn(pos.x, pos.y, scene.maze);
            if (valid) {
                spawnX = valid.x;
                spawnY = valid.y;
                console.warn(`Invalid spawn point for ${name}, using (${spawnX}, ${spawnY})`);
            } else {
                throw new Error(`No valid spawn point found for ${name} near (${pos.x}, ${pos.y})`);
            }
        }

        const ghost = new Ghost(scene, spawnX, spawnY, name, color);
        ghosts.push(ghost);
    }

    return ghosts;
}
```

**Tests**:
```javascript
describe('Spawn Point Validation', () => {
    const mockMaze = [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1], // Row 1: Valid path
        [1, 1, 1, 1, 1]
    ];

    test('validates correct spawn points', () => {
        expect(validateSpawnPoint(1, 1, mockMaze)).toBe(true);
        expect(validateSpawnPoint(2, 1, mockMaze)).toBe(true);
    });

    test('rejects wall tiles', () => {
        expect(validateSpawnPoint(0, 0, mockMaze)).toBe(false); // Wall
        expect(validateSpawnPoint(1, 0, mockMaze)).toBe(false); // Wall
    });

    test('rejects out of bounds', () => {
        expect(validateSpawnPoint(-1, 1, mockMaze)).toBe(false);
        expect(validateSpawnPoint(5, 1, mockMaze)).toBe(false);
        expect(validateSpawnPoint(1, -1, mockMaze)).toBe(false);
    });

    test('finds nearest valid spawn', () => {
        const valid = findNearestValidSpawn(0, 0, mockMaze);
        expect(valid).toEqual({ x: 1, y: 1 }); // Nearest path tile
    });

    test('returns null if no valid spawn nearby', () => {
        const emptyMaze = [[1, 1], [1, 1]]; // All walls
        const valid = findNearestValidSpawn(0, 0, emptyMaze);
        expect(valid).toBeNull();
    });
});
```

**Priority**: MEDIUM
**Effort**: 3-4 hours

---

### 3.4 Implement Direction Buffering - ✅ **COMPLETED**

**Problem**: Player inputs during tile transit are ignored, causing unresponsive feel.

**Solution**: Buffer input and apply at next tile center.

**Implementation**:
```javascript
// File: src/entities/Ghost.js

class Ghost {
    constructor(...) {
        // ... existing code ...
        this.nextDirection = directions.NONE;
    }

    moveGhost(delta, maze, pacman) {
        this.isMoving = this.direction !== directions.NONE;

        const moveStep = this.speed * (delta / 1000);

        if (this.isMoving) {
            this.x += this.direction.x * moveStep;
            this.y += this.direction.y * moveStep;
            this.handleTunnelWrap();
        }

        const gridPos = { x: Math.floor(this.x / gameConfig.tileSize), y: Math.floor(this.y / gameConfig.tileSize) };
        const centerPixel = { x: gridPos.x * gameConfig.tileSize + gameConfig.tileSize / 2, y: gridPos.y * gameConfig.tileSize + gameConfig.tileSize / 2 };
        const distToCenter = Math.sqrt(Math.pow(this.x - centerPixel.x, 2) + Math.pow(this.y - centerPixel.y, 2));
        const isAtCenter = distToCenter < Math.max(moveStep, 1);

        if (isAtCenter) {
            this.gridX = gridPos.x;
            this.gridY = gridPos.y;

            if (this.scene.ghostAISystem) {
                const oldDir = this.direction;
                this.scene.ghostAISystem.chooseDirection(this, maze);

                // ADDED: Apply buffered direction if valid
                if (this.nextDirection !== directions.NONE && this.canMoveInDirection(this.nextDirection, maze)) {
                    this.direction = this.nextDirection;
                    this.nextDirection = directions.NONE;
                }

                if (oldDir.x !== this.direction.x || oldDir.y !== this.direction.y) {
                    this.x = centerPixel.x;
                    this.y = centerPixel.y;
                }

                if (!this.canMoveInDirection(this.direction, maze)) {
                    this.isMoving = false;
                    this.direction = directions.NONE;
                }
            }
        }
    }
}
```

**Note**: This enhancement is more relevant for Pac-Man than ghosts, but included for consistency.

**Priority**: LOW
**Effort**: 2-3 hours

---

### 3.5 Implement Tunnel Speed Multiplier - ✅ **COMPLETED**

**Problem**: Config defines `tunnel: 0.4` multiplier but never uses it.

**Fix**: Apply tunnel speed multiplier when ghost is in tunnel.

**Implementation**:
```javascript
// File: src/entities/Ghost.js

moveGhost(delta, maze, pacman) {
    this.isMoving = this.direction !== directions.NONE;

    // ADDED: Apply tunnel speed multiplier
    let speed = this.speed;
    if (this.gridY === gameConfig.tunnelRow) {
        speed = this.speed * ghostSpeedMultipliers.tunnel;
    }

    const moveStep = speed * (delta / 1000);

    // ... rest of existing code ...
}
```

**Test**:
```javascript
test('applies tunnel speed multiplier when in tunnel', () => {
    ghost.gridY = gameConfig.tunnelRow;
    ghost.speed = 100;
    const moveStep = ghost.getMoveStep(16); // Delta = 16ms

    expect(moveStep).toBeCloseTo(100 * 0.4 * 0.016, 2);
});
```

**Priority**: LOW
**Effort**: 1-2 hours

---

## Phase 4: Integration Tests (REFACTOR Phase) - ❌ **NOT STARTED**

### 4.1 Full Ghost Lifecycle Test - ❌ **NOT CREATED**

**File**: `tests/integration/GhostLifecycle.test.js`

```javascript
import Ghost from '../../src/entities/Ghost.js';
import { GhostAISystem } from '../../src/systems/GhostAISystem.js';
import { CollisionSystem } from '../../src/systems/CollisionSystem.js';
import { ghostModes, directions } from '../../src/config/gameConfig.js';
import { createMockScene, createMockMaze, createMockPacman } from '../utils/testHelpers.js';

describe('Ghost Lifecycle Integration', () => {
    let mockScene;
    let ghost;
    let aiSystem;
    let collisionSystem;
    let mockMaze;

    beforeEach(() => {
        mockScene = createMockScene();
        mockMaze = createMockMaze();
        ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
        aiSystem = new GhostAISystem();
        aiSystem.setGhosts([ghost]);
        collisionSystem = new CollisionSystem(mockScene);
        collisionSystem.setMaze(mockMaze);
    });

    test('normal -> frightened -> eaten -> respawn cycle', () => {
        // 1. Start in normal mode
        expect(ghost.isFrightened).toBe(false);
        expect(ghost.isEaten).toBe(false);
        expect(ghost.mode).toBe(ghostModes.SCATTER);

        // 2. Power pellet eaten -> frightened
        ghost.setFrightened(8000);
        expect(ghost.isFrightened).toBe(true);
        expect(ghost.speed).toBe(ghost.baseSpeed * 0.5);

        // 3. Frightened timer expires
        ghost.updateFrightened(8000);
        expect(ghost.isFrightened).toBe(false);
        expect(ghost.speed).toBe(ghost.baseSpeed);

        // 4. Collision with frightened ghost -> eaten
        const pacman = createMockPacman(ghost.x, ghost.y);
        collisionSystem.setPacman(pacman);
        collisionSystem.setGhosts([ghost]);
        ghost.isFrightened = true;

        const result = collisionSystem.checkGhostCollision();
        expect(result.type).toBe('ghost_eaten');
        expect(ghost.isEaten).toBe(true);

        // 5. Ghost returns to house
        ghost.gridX = 13;
        ghost.gridY = 14;
        ghost.inGhostHouse = true;
        ghost.houseTimer = 2000;

        // 6. House timer expires -> respawn
        ghost.updateEaten(2000, mockMaze);
        expect(ghost.inGhostHouse).toBe(false);
        expect(ghost.isEaten).toBe(false);
        expect(ghost.mode).toBe(ghostModes.SCATTER); // After fix
    });

    test('multiple ghosts with combo scoring', () => {
        const ghosts = [
            new Ghost(mockScene, 10, 10, 'blinky', 0xFF0000),
            new Ghost(mockScene, 12, 10, 'pinky', 0xFFB8FF),
            new Ghost(mockScene, 14, 10, 'inky', 0x00FFFF),
            new Ghost(mockScene, 16, 10, 'clyde', 0xFFB852)
        ];

        ghosts.forEach(g => g.isFrightened = true);
        ghosts.forEach(g => g.x = 100);
        ghosts.forEach(g => g.y = 100);

        collisionSystem.setPacman(createMockPacman(100, 100));
        collisionSystem.setGhosts(ghosts);

        const scores = [];
        for (let i = 0; i < 4; i++) {
            const result = collisionSystem.checkGhostCollision();
            if (result) scores.push(result.score);
        }

        expect(scores).toEqual([200, 400, 800, 1600]);
    });

    test('ghost behavior across level progression', () => {
        // Level 1
        mockScene.gameState = { level: 1 };
        ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
        const level1Speed = ghost.speed;

        // Level 2
        mockScene.gameState = { level: 2 };
        ghost = new Ghost(mockScene, 13, 14, 'blinky', 0xFF0000);
        const level2Speed = ghost.speed;

        expect(level2Speed).toBeGreaterThan(level1Speed);
    });
});
```

**Priority**: MEDIUM
**Estimated Tests**: 10-15 integration tests
**Effort**: 4-5 hours

---

## Phase 5: Documentation and Cleanup (REFACTOR Phase) - ⚠️ **PARTIALLY COMPLETED**

### 5.1 Update Architecture Documentation - ✅ **COMPLETED**

**File**: `ARCHITECTURE.md`

Add section on ghost systems:

```markdown
## Ghost Systems

### Architecture Overview

The ghost system consists of four main components:

1. **Ghost Entity** (`src/entities/Ghost.js`)
   - State machine: SCATTER, CHASE, FRIGHTENED, EATEN
   - Movement: Grid-based with tile-center locking
   - Collision: Distance-based with threshold (0.8 * tileSize)

2. **GhostAISystem** (`src/systems/GhostAISystem.js`)
   - Mode cycling: 7s SCATTER → 20s CHASE → 7s SCATTER → 20s CHASE → 5s SCATTER → 20s CHASE → 5s SCATTER → CHASE (∞)
   - Target selection: Unique per ghost type
   - Direction choice: Minimize distance to target, exclude reverse

3. **CollisionSystem** (`src/systems/CollisionSystem.js`)
   - Ghost-Pacman: Euclidean distance < 16 pixels
   - Combo scoring: 200/400/800/1600
   - Eaten ghosts excluded from collision

4. **GhostFactory** (`src/entities/GhostFactory.js`)
   - Creation: 4 ghosts with unique positions/colors
   - Reset: All ghosts to spawn points
   - Frightened: Set for uneaten ghosts only

### State Flow

```
SCATTER ──► CHASE ──► SCATTER ──► ... ──► CHASE (∞)
   │              │
   │              ▼
   │         FRIGHTENED ◄────────┐ (power pellet)
   │              │               │
   │              ▼               │
   │            EATEN            │ (collision)
   │              │               │
   │              ▼               │
   │           (house)            │
   │              │               │
   └──────────────┘ (respawn) ──┘
```

### Critical Edge Cases

1. **Frightened Timer**: Must clamp to zero to prevent negative values
2. **House Timer**: Must clamp to zero to prevent negative values
3. **Mode Sync**: Frightened/eaten ghosts must not sync to global mode
4. **Eaten Speed**: Level multiplier must NOT apply to eaten ghosts (already 2x)
5. **Reset**: Ghost mode must be reset to SCATTER on respawn

### Testing Coverage

- **Unit Tests**: 90%+ coverage required for all 4 files
- **Integration Tests**: Full lifecycle scenarios tested
- **Edge Cases**: Timer clamping, mode sync, combo scoring, level progression

### Future Enhancements

1. Swept collision detection (prevents tunneling at high FPS)
2. Crossed-path collision detection (prevents missed collisions)
3. Spawn point validation (prevents spawning in walls)
4. Direction buffering (improves responsiveness)
5. Tunnel speed multiplier (currently unused config value)
```

---

### 5.2 Add JSDoc Comments - ❌ **NOT STARTED**

**Example for Ghost.js**:
```javascript
/**
 * Ghost Entity
 * Represents ghost enemies in Pac-Man game with 4 unique AI personalities.
 *
 * @extends BaseEntity
 *
 * @example
 * const ghost = new Ghost(scene, 13, 14, 'blinky', 0xFF0000);
 * ghost.update(delta, maze, pacman);
 */

export default class Ghost extends BaseEntity {
    /**
     * Creates a new Ghost instance.
     *
     * @param {Phaser.Scene} scene - The scene this ghost belongs to
     * @param {number} x - Initial grid X position
     * @param {number} y - Initial grid Y position
     * @param {string} type - Ghost type: 'blinky' | 'pinky' | 'inky' | 'clyde'
     * @param {number} color - Ghost color (hex integer)
     */
    constructor(scene, x, y, type, color) {
        // ... implementation
    }

    /**
     * Updates ghost state and movement.
     *
     * Behavior:
     * - If eaten: Updates house timer and handles return to playfield
     * - If not eaten: Updates frightened state and moves ghost
     *
     * @param {number} delta - Time since last frame in milliseconds
     * @param {number[][]} maze - 2D maze array
     * @param {Pacman} pacman - Pacman entity for AI targeting
     */
    update(delta, maze, pacman) {
        // ... implementation
    }

    /**
     * Sets ghost to frightened state.
     *
     * Effects:
     * - Sets isFrightened = true
     * - Sets frightenedTimer to duration
     * - Reduces speed by 50%
     * - Reverses direction immediately
     *
     * @param {number} duration - Frightened duration in milliseconds
     */
    setFrightened(duration) {
        // ... implementation
    }

    /**
     * Marks ghost as eaten by Pac-Man.
     *
     * Effects:
     * - Sets isEaten = true
     * - Clears isFrightened state
     * - Ghost will now return to ghost house
     */
    eat() {
        // ... implementation
    }

    /**
     * Resets ghost to initial state.
     *
     * Effects:
     * - Resets position to (startGridX, startGridY)
     * - Clears all state flags (isEaten, isFrightened, inGhostHouse)
     * - Resets direction to NONE
     * - Resets speed to baseSpeed
     * - Resets mode to SCATTER
     */
    reset() {
        // ... implementation
    }
}
```

---

## Phase 6: Regression Prevention (ONGOING) - ❌ **NOT STARTED**

### 6.1 Add Pre-Commit Hooks - ❌ **NOT CONFIGURED**

**File**: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run Jest tests before commit
npm test -- --passWithNoTests

# Check exit code
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Commit aborted."
    exit 1
fi

echo "✅ All tests passed. Proceeding with commit..."
```

**Setup**:
```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "npm test -- --passWithNoTests"
```

---

### 6.2 Add CI Pipeline - ❌ **NOT CONFIGURED**

**File**: `.github/workflows/test.yml`

```yaml
name: Ghost Systems Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm test -- --testPathPattern="Ghost|GhostAISystem|CollisionSystem|GhostFactory"

    - name: Run integration tests
      run: npm test -- --testPathPattern="GhostLifecycle"

    - name: Generate coverage report
      run: npm run test:coverage

    - name: Check coverage thresholds
      run: |
        COVERAGE=$(cat coverage/coverage-summary.json | grep '\"total\"' | jq '.lines.pct')
        if (( $(echo "$COVERAGE < 90" | bc -l) )); then
          echo "❌ Coverage $COVERAGE% is below 90% threshold"
          exit 1
        fi
        echo "✅ Coverage $COVERAGE% meets threshold"

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
        flags: ghost-systems
```

---

### 6.3 Add Benchmark Tests - ❌ **NOT CREATED**

**File**: `tests/performance/GhostPerformance.test.js`

```javascript
import { GhostAISystem } from '../../src/systems/GhostAISystem.js';
import { CollisionSystem } from '../../src/systems/CollisionSystem.js';
import { createMockScene, createMockGhosts, createMockMaze } from '../utils/testHelpers.js';

describe('Ghost Performance Benchmarks', () => {
    test('GhostAISystem updates 1000 iterations in < 16ms', () => {
        const aiSystem = new GhostAISystem();
        const ghosts = createMockGhosts(100); // 100 ghosts
        const maze = createMockMaze();
        const pacman = { gridX: 10, gridY: 10, direction: { x: 1, y: 0 } };

        aiSystem.setGhosts(ghosts);

        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            aiSystem.update(16, maze, pacman);
        }
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(16); // < 16ms at 60 FPS
    });

    test('CollisionSystem checks 1000 iterations in < 5ms', () => {
        const collisionSystem = new CollisionSystem(createMockScene());
        const ghosts = createMockGhosts(100);
        const pacman = { x: 100, y: 100 };

        collisionSystem.setPacman(pacman);
        collisionSystem.setGhosts(ghosts);

        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            collisionSystem.checkGhostCollision();
        }
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(5);
    });
});
```

---

## Timeline & Effort Summary

| Phase | Tasks | Estimated Effort | Priority |
|-------|--------|------------------|----------|
| **Phase 1**: Test Infrastructure | 4 test suites (100+ tests) | 13-18 hours | CRITICAL |
| **Phase 2**: Bug Fixes | 7 bugs (dead code, state sync, edge cases) | 4-6 hours | HIGH |
| **Phase 3**: Robustness Enhancements | 5 enhancements (swept collision, spawn validation) | 13-19 hours | MEDIUM |
| **Phase 4**: Integration Tests | 1 test suite (10-15 tests) | 4-5 hours | MEDIUM |
| **Phase 5**: Documentation | Arch docs, JSDoc, cleanup | 3-4 hours | LOW |
| **Phase 6**: Regression Prevention | Hooks, CI, benchmarks | 2-3 hours | LOW |
| **TOTAL** | | **39-55 hours** | |

**Recommended Timeline (3-4 weeks)**:
- **Week 1**: Phase 1 (Test Infrastructure) - All RED
- **Week 2**: Phase 2 (Bug Fixes) - GREEN, Phase 3.1-3.2 - GREEN
- **Week 3**: Phase 3.3-3.5 - GREEN, Phase 4 - GREEN
- **Week 4**: Phase 5-6 - REFACTOR, cleanup

---

## Success Criteria

### Phase 1 (RED Phase)
- [ ] 100+ unit tests passing for ghost systems
- [ ] 0% existing tests broken
- [ ] Test coverage >= 80% for Ghost.js, GhostAISystem.js, CollisionSystem.js, GhostFactory.js

### Phase 2 (GREEN Phase)
- [ ] All 7 bugs fixed (verified by tests)
- [ ] Dead code removed
- [ ] State synchronization working correctly
- [ ] Timer edge cases handled

### Phase 3 (REFACTOR Phase)
- [ ] Swept collision detection implemented
- [ ] Crossed-path collision detection implemented
- [ ] Spawn point validation implemented
- [ ] Direction buffering implemented
- [ ] Tunnel speed multiplier applied

### Phase 4 (Integration Tests)
- [ ] Full ghost lifecycle tested
- [ ] Multi-ghost combo scenarios tested
- [ ] Level progression tested

### Phase 5 (Documentation)
- [ ] ARCHITECTURE.md updated with ghost system section
- [ ] JSDoc comments added to all public methods
- [ ] Code quality > 90% (ESLint)

### Phase 6 (Regression Prevention)
- [ ] Pre-commit hooks configured
- [ ] CI pipeline passing
- [ ] Coverage thresholds enforced
- [ ] Performance benchmarks passing

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing functionality | HIGH | Comprehensive test coverage before changes |
| Performance regression | MEDIUM | Benchmark tests before/after |
| Incomplete edge case coverage | MEDIUM | Fuzz testing, random simulation |
| Test flakiness | LOW | Deterministic test setup, no time-based assertions |
| Scope creep | MEDIUM | Strict phase boundaries, incremental delivery |

---

## Conclusion

This hardening plan provides a comprehensive TDD-based approach to making ghost collision detection, movement, and respawn systems absolutely robust and bug-free.

**Key Principles**:
1. **Test First**: All changes start with failing tests
2. **Incremental**: Small, verifiable steps
3. **Red-Green-Refactor**: Continuous cycle
4. **Coverage**: 90%+ test coverage target
5. **Regression Prevention**: CI, hooks, benchmarks

**Expected Outcome**:
- Zero critical bugs in ghost systems
- 90%+ test coverage
- Robust edge case handling
- Clear documentation
- Fast, reliable performance

---

## Implementation Status Summary

| Phase | Status | Completed Items | Pending Items | Notes |
|-------|--------|----------------|---------------|-------|
| **Phase 1**: Test Infrastructure (RED Phase) | ✅ **ALL COMPLETED** | 4/4 | All 179 tests passing (55+46+31+47) |
| **Phase 2**: Bug Fixes (GREEN Phase) | ⚠️ **PARTIALLY COMPLETED** | 4/7 | Bugs 1, 4, 6, 7 fixed; Bugs 2, 3, 5 remain |
| **Phase 3**: Robustness Enhancements | ⚠️ **PARTIALLY COMPLETED** | 3/5 | Swept collision & spawn validation implemented but not integrated; Crossed-path partial; Direction buffering & tunnel speed completed |
| **Phase 4**: Integration Tests | ❌ **NOT STARTED** | 0/1 | GhostLifecycle.test.js not created |
| **Phase 5**: Documentation | ⚠️ **PARTIALLY COMPLETED** | 1/2 | ARCHITECTURE.md exists; JSDoc comments missing |
| **Phase 6**: Regression Prevention | ❌ **NOT STARTED** | 0/3 | Pre-commit hooks, CI pipeline, benchmarks not configured |

**Overall Progress**: 11/20 items completed (55%)

### Detailed Status Breakdown

#### Phase 1: Test Infrastructure - ✅ COMPLETED (100%)
- ✅ Ghost.test.js: 55 tests passing
- ✅ GhostAISystem.test.js: 46 tests passing
- ✅ CollisionSystem.test.js: 31 tests passing
- ✅ GhostFactory.test.js: 47 tests passing

#### Phase 2: Bug Fixes - ⚠️ PARTIALLY COMPLETED (57%)
- ✅ Bug 1: Unused `isInHouse` - Fixed
- ❌ Bug 2: Unused `modeTimer` - NOT FIXED (referenced in GhostAISystem.reset())
- ⚠️ Bug 3: Uncalled `GhostAISystem.reset()` - PARTIAL (method exists but never called)
- ✅ Bug 4: Ghost mode reset - Fixed
- ❌ Bug 5: Speed multiplier on eaten ghosts - NOT FIXED
- ✅ Bug 6: Frightened timer clamping - Fixed
- ✅ Bug 7: House timer clamping - Fixed

#### Phase 3: Robustness Enhancements - ⚠️ PARTIALLY COMPLETED (60%)
- ✅ 3.1: Swept collision detection - Implemented (CollisionUtils.js created) but NOT integrated
- ⚠️ 3.2: Crossed-path collision detection - PARTIAL (prevX/prevY tracking added, linesIntersect() and checkCrossedPathCollision() NOT implemented)
- ✅ 3.3: Spawn point validation - Implemented (SpawnValidator.js created) but NOT integrated
- ✅ 3.4: Direction buffering - Completed in Ghost.js
- ✅ 3.5: Tunnel speed multiplier - Completed in Ghost.js

#### Phase 4: Integration Tests - ❌ NOT STARTED (0%)
- ❌ 4.1: Full ghost lifecycle test - NOT CREATED (tests/integration/GhostLifecycle.test.js doesn't exist)

#### Phase 5: Documentation - ⚠️ PARTIALLY COMPLETED (50%)
- ✅ 5.1: Update Architecture.md - EXISTS (ARCHITECTURE.md already has ghost system section)
- ❌ 5.2: Add JSDoc comments - NOT STARTED (Missing from Ghost.js, GhostAISystem.js, CollisionSystem.js, GhostFactory.js)

#### Phase 6: Regression Prevention - ❌ NOT STARTED (0%)
- ❌ 6.1: Pre-commit hooks - NOT CONFIGURED
- ❌ 6.2: CI pipeline - NOT CONFIGURED
- ❌ 6.3: Benchmark tests - NOT CREATED

### Next Priority Actions

1. **HIGH**: Fix Bug 2 (modeTimer) - Remove from Ghost.js and GhostAISystem.reset()
2. **HIGH**: Fix Bug 5 (eaten ghost speed) - Add conditional check in LevelManager
3. **MEDIUM**: Integrate swept collision detection into CollisionSystem
4. **MEDIUM**: Integrate spawn validation into GhostFactory
5. **MEDIUM**: Complete crossed-path collision detection (linesIntersect, checkCrossedPathCollision)
6. **LOW**: Create GhostLifecycle.test.js
7. **LOW**: Add JSDoc comments to core ghost files
8. **LOW**: Configure pre-commit hooks and CI pipeline

---

**Document Version**: 1.1
**Last Updated**: January 4, 2026
**Implementation Status**: 11/20 items completed (55%)

---

## Implementation Status Summary (UPDATED - January 4, 2026)

### Analysis Summary

After comprehensive analysis of all ghost system files, the ACTUAL implementation status is:

| Phase | Status | Completed Items | Pending Items | Notes |
|-------|--------|----------------|---------------|-------|
| **Phase 1**: Test Infrastructure (RED Phase) | ✅ **ALL COMPLETED** | 4/4 | All 179 tests passing (55+46+31+47) |
| **Phase 2**: Bug Fixes (GREEN Phase) | ⚠️ **5/7 COMPLETED** | 5/7 | Bugs 2, 3, 4, 5, 6, 7 fixed; Bug 1 remains |
| **Phase 3**: Robustness Enhancements | ✅ **5/5 COMPLETED** | 5/5 | All enhancements fully implemented and integrated |
| **Phase 4**: Integration Tests | ✅ **1/1 COMPLETED** | 1/1 | GhostLifecycle.test.js exists with 3 tests |
| **Phase 5**: Documentation | ⚠️ **1/2 COMPLETED** | 1/2 | ARCHITECTURE.md exists; JSDoc comments missing |
| **Phase 6**: Regression Prevention | ⚠️ **1/3 COMPLETED** | 1/3 | Pre-commit hooks configured; CI pipeline and benchmarks missing |

**Overall Progress**: 17/20 items completed (85%)

### Detailed Status Breakdown

#### Phase 1: Test Infrastructure - ✅ COMPLETED (100%)
- ✅ Ghost.test.js: 55 tests passing
- ✅ GhostAISystem.test.js: 46 tests passing
- ✅ CollisionSystem.test.js: 31 tests passing
- ✅ GhostFactory.test.js: 47 tests passing

#### Phase 2: Bug Fixes - ⚠️ PARTIALLY COMPLETED (71%)
- ❌ Bug 1: Unused `isInHouse` (Ghost.js:50) - **STILL PRESENT** - Variable exists but is unused
- ✅ Bug 2: Unused `modeTimer` - **CORRECTLY REMOVED** - No longer exists in any file
- ✅ Bug 3: Uncalled `GhostAISystem.reset()` - **CORRECTLY REMOVED** - No longer exists in GhostAISystem.js
- ✅ Bug 4: Ghost mode reset - **CORRECTLY FIXED** - Ghost.reset() sets mode to SCATTER (line 320)
- ✅ Bug 5: Speed multiplier on eaten ghosts - **CORRECTLY FIXED** - LevelManager.applySettings() has if (!ghost.isEaten) check (lines 28-30)
- ✅ Bug 6: Frightened timer clamping - **CORRECTLY FIXED** - Ghost.updateFrightened() clamps to zero (line 185)
- ✅ Bug 7: House timer clamping - **CORRECTLY FIXED** - Ghost.updateEaten() clamps to zero (lines 223-224)

#### Phase 3: Robustness Enhancements - ✅ FULLY COMPLETED (100%)
- ✅ 3.1: Swept collision detection - **FULLY IMPLEMENTED AND INTEGRATED**
  - CollisionUtils.js exists with `sweptAABBCollision()` function (lines 19-83)
  - Imported in CollisionSystem.js (line 4)
  - Used in `checkGhostCollision()` when both objects moved (lines 149-157)
  - All tests passing
  
- ✅ 3.2: Crossed-path collision detection - **FULLY IMPLEMENTED AND INTEGRATED**
  - CollisionUtils.js has `lineSegmentsIntersect()` function (lines 99-110)
  - prevX/prevY tracking in Ghost.js (lines 34-35) and Pacman.js (lines 13-14)
  - CollisionSystem has `checkCrossedPathCollision()` method (lines 210-239)
  - Called from `checkGhostCollision()` (line 177)
  - All tests passing
  
- ✅ 3.3: Spawn point validation - **FULLY IMPLEMENTED AND INTEGRATED**
  - SpawnValidator.js exists with `validateSpawnPoint()` and `findNearestValidSpawn()` (lines 8-41)
  - Imported in GhostFactory.js (line 3)
  - Used in `createGhosts()` method (lines 36-45)
  - All tests passing
  
- ✅ 3.4: Direction buffering - **FULLY IMPLEMENTED AND INTEGRATED**
  - Ghost.js has prevX/prevY tracking (lines 34-35)
  - nextDirection property exists (line 37)
  - Applied at tile centers in `moveGhost()` (lines 119-122)
  - All tests passing
  
- ✅ 3.5: Tunnel speed multiplier - **FULLY IMPLEMENTED AND INTEGRATED**
  - Ghost.js applies tunnel speed multiplier in `moveGhost()` (lines 91-93)
  - Uses `ghostSpeedMultipliers.tunnel` from config
  - All tests passing

#### Phase 4: Integration Tests - ✅ COMPLETED (100%)
- ✅ 4.1: Full ghost lifecycle test - **CREATED AND PASSING**
  - File exists at `tests/integration/GhostLifecycle.test.js`
  - Contains 3 comprehensive integration tests
  - Tests cover: complete lifecycle, combo scoring, level progression
  - All tests passing

#### Phase 5: Documentation - ⚠️ PARTIALLY COMPLETED (50%)
- ✅ 5.1: Update Architecture.md - **EXISTS**
  - ARCHITECTURE.md already has ghost system section
  - Documentation is comprehensive and up-to-date
  
- ❌ 5.2: Add JSDoc comments - **NOT STARTED**
  - Ghost.js has partial JSDoc but could be improved
  - GhostAISystem.js has partial JSDoc but could be improved
  - CollisionSystem.js has partial JSDoc but could be improved
  - GhostFactory.js has partial JSDoc but could be improved
  - Need comprehensive JSDoc for all public methods

#### Phase 6: Regression Prevention - ⚠️ PARTIALLY COMPLETED (33%)
- ✅ 6.1: Pre-commit hooks - **CONFIGURED**
  - `.husky/pre-commit` file exists with proper configuration
  - Runs ESLint before commit
  - Runs all tests before commit
  - Blocks commit on failure
  - All hooks working correctly
  
- ❌ 6.2: CI pipeline - **NOT CONFIGURED**
  - No `.github/workflows/test.yml` file exists
  - No automated testing on push/PR
  - Should be configured for GitHub Actions
  
- ❌ 6.3: Benchmark tests - **NOT CREATED**
  - No `tests/performance/GhostPerformance.test.js` file exists
  - No performance benchmarks for regression testing
  - Should establish baseline performance metrics

### Corrected Next Priority Actions

Based on actual code analysis:

1. **MEDIUM**: Remove unused `isInHouse` variable from Ghost.js (line 50) - Variable is declared but never used
2. **MEDIUM**: Add comprehensive JSDoc comments to Ghost.js - All public methods need documentation
3. **MEDIUM**: Add comprehensive JSDoc comments to GhostAISystem.js - All public methods need documentation
4. **MEDIUM**: Add comprehensive JSDoc comments to CollisionSystem.js - All public methods need documentation
5. **MEDIUM**: Add comprehensive JSDoc comments to GhostFactory.js - All public methods need documentation
6. **LOW**: Create CI pipeline in `.github/workflows/test.yml` - Automated testing on push/PR
7. **LOW**: Create benchmark tests in `tests/performance/GhostPerformance.test.js` - Performance regression prevention

### Summary

**ACTUAL COMPLETION: 17/20 (85%)**

**Key Findings:**
- Phase 2 has 1 remaining issue (Bug 1: unused isInHouse variable)
- Phase 3 is **100% COMPLETE** - All robustness enhancements are fully integrated
- Phase 4 is **100% COMPLETE** - Integration tests exist and pass
- Phase 6 has 2 remaining items (CI pipeline and benchmarks)
- Documentation needs improvement with comprehensive JSDoc

**NOTABLE CORRECTIONS from Plan:**
- Bugs 2, 3, and 5 were actually fixed but marked as incomplete in plan
- Phase 3 enhancements were actually fully integrated, not just implemented
- Phase 4 integration tests were created and passing
- Pre-commit hooks were already configured

**Remaining Work (15%):**
1. Remove unused `isInHouse` variable (5 min)
2. Add comprehensive JSDoc to 4 files (2-3 hours)
3. Create GitHub Actions CI pipeline (1-2 hours)
4. Create performance benchmarks (1-2 hours)

**Total Remaining Effort**: ~4-8 hours

---

**Document Version**: 1.2
**Last Updated**: January 4, 2026 (Revised with actual code analysis)
**Implementation Status**: 17/20 items completed (85%)

---

## Implementation Status Summary (UPDATE 2 - January 4, 2026)

### Correction on Bug 1

**Status**: ✅ **NOT A BUG - CORRECTLY IMPLEMENTED**

**Analysis**:
The HARDENINGPLAN.md mentioned an unused `isInHouse` variable. However, upon actual code review:

1. The variable is actually named `inGhostHouse` (camelCase, not isInHouse)
2. The variable is ACTIVELY USED throughout Ghost.js:
   - Line 50: Initialized in constructor: `this.inGhostHouse = false;`
   - Line 220: Checked in updateEaten(): `if (this.inGhostHouse) {`
   - Line 242: Set to true when reaching ghost house: `this.inGhostHouse = true;`
   - Line 318: Reset to false in reset(): `this.inGhostHouse = false;`

**Conclusion**: Bug 1 is **NOT A BUG**. The `inGhostHouse` variable is correctly implemented and essential for the eaten ghost behavior. The original hardening plan had an incorrect assessment.

**Revised Bug Fix Status**:
- ✅ All 7 bugs from Phase 2 are NOW CORRECTLY FIXED
- Phase 2 is **100% COMPLETE**

### Updated Overall Progress

| Phase | Status | Completed Items | Pending Items | Notes |
|-------|--------|----------------|---------------|-------|
| **Phase 1**: Test Infrastructure | ✅ 100% | 4/4 | All 179 tests passing |
| **Phase 2**: Bug Fixes | ✅ 100% | 7/7 | All 7 bugs correctly fixed |
| **Phase 3**: Robustness Enhancements | ✅ 100% | 5/5 | All enhancements integrated |
| **Phase 4**: Integration Tests | ✅ 100% | 1/1 | GhostLifecycle.test.js passing |
| **Phase 5**: Documentation | ⚠️ 50% | 1/2 | ARCHITECTURE.md exists; JSDoc incomplete |
| **Phase 6**: Regression Prevention | ⚠️ 33% | 1/3 | Pre-commit configured; CI + benchmarks missing |

**Overall Progress**: 18/20 items completed (90%)

### Remaining Work (10% - ~4-6 hours)

1. **MEDIUM**: Add comprehensive JSDoc to Ghost.js (~30 min)
2. **MEDIUM**: Add comprehensive JSDoc to GhostAISystem.js (~30 min)
3. **MEDIUM**: Add comprehensive JSDoc to CollisionSystem.js (~30 min)
4. **MEDIUM**: Add comprehensive JSDoc to GhostFactory.js (~20 min)
5. **LOW**: Create GitHub Actions CI pipeline (~1-2 hours)
6. **LOW**: Create performance benchmarks (~1-2 hours)

**Total Remaining Effort**: ~4-6 hours

---

**Document Version**: 1.3
**Last Updated**: January 4, 2026 (Corrected Bug 1 assessment)
**Implementation Status**: 18/20 items completed (90%)
