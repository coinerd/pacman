# MVC Architecture Analysis and Improvement Plan

## Implementation Status

### ✅ Phase 1 COMPLETE - Model Entity Separation (2026-02-09)

**Summary**: Successfully created pure data entity classes that can run without Phaser.

**Deliverables**:
- `ModelEntity` - Base class with position, movement, and state (NO Phaser deps)
- `PacmanState` - Pure data Pacman with mouth animation state
- `GhostState` - Pure data Ghost with AI modes and frightened state
- `FruitState` - Pure data Fruit with bobbing animation
- `GameState` - Aggregates all entities and world data
- `ModelCollisionSystem` - Pure collision detection using model positions
- `VisualPacman`, `VisualGhost`, `VisualFruit` - Phaser visual wrappers
- **135 unit tests** for all model classes

**Files Created**:
- `src/model/ModelEntity.js` (159 lines)
- `src/model/GameState.js` (366 lines)
- `src/model/entities/PacmanState.js` (206 lines)
- `src/model/entities/GhostState.js` (358 lines)
- `src/model/entities/FruitState.js` (236 lines)
- `src/model/systems/ModelCollisionSystem.js` (247 lines)
- `src/view/visuals/VisualPacman.js` (125 lines)
- `src/view/visuals/VisualGhost.js` (238 lines)
- `src/view/visuals/VisualFruit.js` (330 lines)
- Tests: `tests/model/*.test.js` (4 files, 135 tests)

**Key Achievement**: Game can now theoretically run in headless mode using only `GameState` and `ModelCollisionSystem`.

---

## Executive Summary

The Pac-Man codebase has a **partial MVC implementation** that successfully separates game state (GameModel) from rendering (PhaserGameView/ConsoleGameView). However, several **critical violations** prevent the game from being truly headless and maintainable. The most significant issue is that **entities extend Phaser.GameObjects**, making them impossible to use without the View.

---

## Current Architecture Assessment

### ✅ What's Working Well

| Component | Assessment |
|-----------|------------|
| **GameModel** | Clean, no Phaser dependencies. Handles score, lives, level state properly. Emits events for state changes. |
| **EventBus** | Proper pub/sub decoupling. Views subscribe to model events. |
| **GameController** | Good input translation to model actions. Could be cleaner but functional. |
| **ConsoleGameView** | Proper headless view implementation. Only logs events. |

### ❌ Critical MVC Violations

#### 1. **Entities Extend Phaser.GameObjects (SEVERE)**

**Problem**: All entities (Pacman, Ghost, Fruit, BaseEntity) extend Phaser visual objects.

```javascript
// BaseEntity.js - CRITICAL VIOLATION
export class BaseEntity extends Phaser.GameObjects.Arc {
    constructor(scene, gridX, gridY, radius, color) {
        super(scene, pixel.x, pixel.y, radius, 0, 360, false, color, 1);
        // ...
    }
}
```

**Impact**:
- Cannot run game logic without Phaser/View
- Entities contain visual state (color, radius, fillStyle)
- Entities cannot exist in headless mode
- Unit testing requires complex Phaser mocks

**MVC Principle Violated**: Model (entity state) should not depend on View (rendering).

---

#### 2. **Entities Handle Their Own Rendering (SEVERE)**

**Problem**: Ghost entity contains visual update logic.

```javascript
// Ghost.js - VIEW LOGIC IN ENTITY
updateVisuals() {
    if (this.isFrightened) {
        if (this.isBlinking && Math.floor(this.blinkTimer / animationConfig.ghostBlinkSpeed) % 2 === 0) {
            this.setFillStyle(colors.frightenedGhostEnd, 1);  // Phaser method!
        } else {
            this.setFillStyle(colors.frightenedGhost, 1);
        }
    }
    // ...
}
```

**Impact**:
- Model entities are polluted with view concerns
- Visual state changes are mixed with game logic
- Cannot test ghost logic without testing visuals

---

#### 3. **View Creates Entities (HIGH)**

**Problem**: PhaserGameView instantiates game entities.

```javascript
// PhaserGameView.js
createEntities() {
    this.pacman = new Pacman(this.scene, ...);  // Creates visual entity
    this.ghosts = GhostFactory.createGhosts(this.scene);
    this.fruit = new Fruit(this.scene, ...);
}
```

**Impact**:
- View is responsible for Model object creation
- Cannot create game simulation without View
- Circular dependency: View needs Model, Model (indirectly) needs View-created entities

---

#### 4. **Collision System Depends on Visual Entities (HIGH)**

**Problem**: CollisionSystem reads positions from visual entities.

```javascript
// CollisionSystem.js
createCollisionSnapshot() {
    const pacmanSnapshot = {
        x: this.pacman.x,        // Reading from Phaser object
        y: this.pacman.y,
        prevX: this.pacman.prevX,
        // ...
    };
}
```

**Impact**:
- Collision detection cannot run without visual entities
- Physics is coupled to rendering
- Headless simulation impossible

---

#### 5. **GameController Handles Scene Transitions (MEDIUM)**

**Problem**: Controller has direct scene references.

```javascript
// GameController.js
handleReturnToMenu() {
    this.scene.cleanup();
    this.scene.scene.start('MenuScene');  // View concern!
}

handlePause() {
    this.scene.scene.pause();             // View concern!
    this.scene.scene.launch('PauseScene');
}
```

**Impact**:
- Controller knows about scene management (View concern)
- Scene transitions should be event-driven

---

#### 6. **Input Controller Depends on Phaser (MEDIUM)**

**Problem**: InputController uses Phaser's input system directly.

```javascript
// InputController.js
setupInput() {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasd = this.scene.input.keyboard.addKeys('W,A,S,D');
}
```

**Impact**:
- Cannot swap input sources (AI, replay, network) easily
- Input is tied to Phaser scenes
- Testing requires Phaser mocks

---

#### 7. **Maze State Split Between Model and Visuals (MEDIUM)**

**Problem**: Pellet state exists in both pelletGrid (data) and pelletPool (visual sprites).

```javascript
// GameScene.js
this.pelletGrid = liveLevelData.pelletGrid;  // Model-like
this.pelletPool = pelletPool;                 // Visual pool

// Collision must update both
checkPelletTileCollision() {
    consumePelletAt(this.pelletGrid, x, y);  // Update data
    this.pelletPool.release(pellet);          // Update visual
}
```

**Impact**:
- Dual state management (data + visual)
- Risk of desynchronization
- More complex than necessary

---

## Proposed Clean Architecture

### Target Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INPUT                                      │
│         (Keyboard, Touch, AI, Replay, Network)                              │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INPUT ADAPTER (Abstract)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Keyboard   │  │    Touch     │  │  ReplayInput │  │    AI Input  │    │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │  │   Adapter    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GAME CONTROLLER                                      │
│                    (Input Translation Only)                                  │
│  - Validates input against model state                                       │
│  - Calls model methods (setDesiredDirection, togglePaused)                   │
│  - Emits high-level intents (no scene references)                            │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GAME MODEL                                         │
│                    (Pure Game State & Rules)                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Entity States (Pure Data)                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
│  │  │  Pacman  │ │  Ghosts  │ │  Fruit   │ │  Pellet  │               │    │
│  │  │  State   │ │  States  │ │  State   │ │   Grid   │               │    │
│  │  │ {x,y,...}│ │[{x,y...}]│ │{x,y,...} │ │[[0,1,2]] │               │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Game State: score, lives, level, isPaused, isGameOver, etc.                │
│  Game Rules: collision detection, win conditions, scoring                    │
│                                                                              │
│  Emits: STATE_CHANGED, ENTITY_MOVED, COLLISION_DETECTED, etc.               │
└──────────────┬──────────────────────────────────────────────┬────────────────┘
               │                                              │
               ▼                                              ▼
┌──────────────────────────┐                    ┌──────────────────────────┐
│      PHASER GAME VIEW    │                    │    CONSOLE GAME VIEW     │
│  (Renders Visuals Only)  │                    │  (Logs State Changes)    │
│                          │                    │                          │
│  - Visual entities sync  │                    │ - Subscribes to events   │
│    to model state        │                    │ - Logs for debugging     │
│  - Animations, effects   │                    │                          │
│  - Sound playback        │                    │                          │
│  - Scene transitions     │                    │                          │
└──────────────────────────┘                    └──────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Separate Entity State from Visuals (CRITICAL)

**Goal**: Create pure data entities that can exist without Phaser.

#### 1.1 Create `ModelEntity` Base Class (Pure Data)

```javascript
// src/model/ModelEntity.js
export class ModelEntity {
    constructor(gridX, gridY, config) {
        this.id = generateId();
        this.gridX = gridX;
        this.gridY = gridY;
        this.x = gridToPixel(gridX);
        this.y = gridToPixel(gridY);
        this.prevX = this.x;
        this.prevY = this.y;
        this.direction = directions.NONE;
        this.speed = config.speed;
        this.isMoving = false;
        // NO Phaser references, NO visual properties
    }
    
    update(deltaSeconds, maze) {
        // Pure logic only - no rendering
        // Returns state changes for event emission
    }
}
```

#### 1.2 Create `PacmanState`, `GhostState`, `FruitState` Classes

```javascript
// src/model/entities/PacmanState.js
export class PacmanState extends ModelEntity {
    constructor(gridX, gridY, level) {
        super(gridX, gridY, { speed: calculateSpeed(level) });
        this.mouthAngle = 0;  // Animation state (data, not visual)
        this.isDying = false;
    }
    
    update(deltaSeconds, maze, inputDirection) {
        // Handle movement logic
        // Return { moved: true, position: {x, y}, events: [...] }
    }
}
```

#### 1.3 Create `GameState` Aggregator

```javascript
// src/model/GameState.js
export class GameState {
    constructor(level, maze, pelletGrid) {
        this.pacman = new PacmanState(13, 23, level);
        this.ghosts = GhostFactory.createGhostStates(level);
        this.fruit = new FruitState();
        this.maze = maze;
        this.pelletGrid = pelletGrid;
        this.score = 0;
        this.lives = 3;
        // ... all game state
    }
    
    update(deltaSeconds, inputDirection) {
        // Update all entities
        // Run collision detection
        // Return events for this tick
    }
}
```

#### 1.4 Create `VisualEntity` Wrappers

```javascript
// src/view/VisualPacman.js
export class VisualPacman {
    constructor(scene, pacmanState) {
        this.state = pacmanState;  // Reference to model
        this.sprite = new Phaser.GameObjects.Arc(scene, ...);
    }
    
    sync() {
        // Sync visual to model state
        this.sprite.x = this.state.x;
        this.sprite.y = this.state.y;
        this.sprite.setStartAngle(this.state.direction.angle + this.state.mouthAngle);
    }
}
```

---

### Phase 2: Move Collision Detection to Model

**Goal**: Collision detection should use ModelEntity positions, not visual sprites.

```javascript
// src/model/systems/CollisionSystem.js
export class ModelCollisionSystem {
    checkCollisions(gameState) {
        const { pacman, ghosts, pelletGrid } = gameState;
        
        // Use pure data positions
        const pelletResult = this.checkPelletCollision(pacman, pelletGrid);
        const ghostResult = this.checkGhostCollisions(pacman, ghosts);
        
        return { pelletResult, ghostResult };
    }
}
```

---

### ✅ Phase 3 COMPLETE - GameModel Owns All State (2026-02-09)

**Goal**: GameModel becomes the single source of truth.

**Deliverables**:
- Unified GameModel class that owns all entity states (PacmanState, GhostState, FruitState)
- GameModel runs complete game loop via `step(deltaSeconds)`
- ModelCollisionSystem integrated into GameModel
- Full backward compatibility maintained (all existing tests pass)
- `gameModel.state.xxx` pattern preserved via getter
- Legacy methods preserved: `onPelletEaten()`, `onGhostEaten()`, etc.

**Files Modified**:
- `src/core/GameModel.js` - Merged GameState functionality
- `src/model/GameStateController.js` - Thin wrapper around unified model
- `src/model/systems/ModelCollisionSystem.js` - Fixed ghost combo tracking

**Test Results**: 1237 tests passing ✅

```javascript
// src/core/GameModel.js
export default class GameModel {
    constructor(config) {
        this.state = new GameState(config.level, config.maze, config.pelletGrid);
        this.collisionSystem = new ModelCollisionSystem();
        this.rules = new GameRules();
    }
    
    step(deltaSeconds, input) {
        // 1. Update entities
        this.state.update(deltaSeconds, input.direction);
        
        // 2. Check collisions (using model state)
        const collisions = this.collisionSystem.checkCollisions(this.state);
        
        // 3. Apply game rules
        const events = this.rules.apply(collisions, this.state);
        
        // 4. Emit state changes
        events.forEach(event => this.emitEvent(event));
        
        return this.state.getSnapshot();
    }
}
```

---

### ✅ Phase 4 COMPLETE - Refactor View to be Pure Observer (2026-02-09)

**Goal**: View only renders, never creates or modifies game state.

**Deliverables**:
- `ModelDrivenGameScene` - GameScene using pure observer pattern
- `ModelDrivenGameView` - View that creates Visual wrappers from model entities
- `ModelDrivenGameScene.test.js` - 21 integration tests
- **All 1258 tests passing** (14 skipped)

**Key Changes**:
1. View creates `VisualPacman`, `VisualGhost`, `VisualFruit` from model entities (NOT visual entities)
2. Model runs complete game loop via `gameModel.step()`
3. View syncs visual representation to model state each frame
4. No dual entity system - pure Model-View separation

**Files Created**:
- `src/scenes/ModelDrivenGameScene.js` (350 lines)
- `src/views/ModelDrivenGameView.js` (420 lines)
- `tests/model/ModelDrivenGameScene.test.js` (21 tests)

**Architecture**:
```javascript
// ModelDrivenGameScene.js - Pure Observer Pattern
export default class ModelDrivenGameScene extends Phaser.Scene {
    create() {
        // Model owns all state
        this.gameModel = new GameModel({...});
        
        // View creates visual wrappers from model
        this.gameView = new ModelDrivenGameView({
            scene: this,
            gameModel: this.gameModel
        });
        this.gameView.create(); // Creates VisualPacman, VisualGhost, etc.
    }
    
    fixedUpdate() {
        // Single source of truth: model runs all game logic
        const events = this.gameModel.step(deltaSeconds);
        
        // Process events
        for (const event of events) {
            this.achievementSystem.check(this.gameModel);
        }
    }
    
    update() {
        // Sync view to model state (pure observer)
        this.gameView.sync();
    }
}

// ModelDrivenGameView.js - Pure Observer View
export default class ModelDrivenGameView {
    create() {
        // Create visual wrappers from model entities
        this.visualPacman = new VisualPacman(this.scene, this.gameModel.pacman);
        
        for (const ghost of this.gameModel.ghosts) {
            this.visualGhosts.set(ghost.ghostType, new VisualGhost(this.scene, ghost));
        }
        
        this.visualFruit = new VisualFruit(this.scene, this.gameModel.fruit);
    }
    
    sync() {
        // Sync all visuals to model state
        this.visualPacman.sync();
        for (const visualGhost of this.visualGhosts.values()) {
            visualGhost.sync();
        }
        this.visualFruit.sync();
    }
}
```

**Benefits**:
- ✅ True MVC separation - Model owns all state
- ✅ View is pure observer - no state modifications
- ✅ Easier testing - Model can be tested without Phaser
- ✅ Visual entities are just Phaser sprites that sync to model
- ✅ No dual entity system (visual + model)

---

### ✅ Phase 5 COMPLETE - Abstract Input System (2026-02-09)

**Goal**: Support multiple input sources without Phaser dependency.

**Deliverables**:
- `InputAdapter` - Abstract base class for all input sources
- `KeyboardAdapter` - Phaser keyboard input wrapper
- `ReplayAdapter` - Replay recorded inputs for demos/testing
- `ReplayRecorder` - Record inputs for replay
- `AIInputAdapter` - AI-controlled input for bot gameplay
- `ScriptedAIAdapter` - Scripted sequence of inputs
- `InputManager` - Central coordinator for multiple input sources
- **167 unit tests** for all input classes

**Test Results**: All 1425 tests passing ✅ (61 test suites, 14 skipped)

**Files Created**:
- `src/input/InputAdapter.js` (155 lines)
- `src/input/InputManager.js` (262 lines)
- `src/input/adapters/KeyboardAdapter.js` (192 lines)
- `src/input/adapters/ReplayAdapter.js` (295 lines)
- `src/input/adapters/AIInputAdapter.js` (274 lines)
- `src/input/index.js` (28 lines)
- Tests: `tests/input/*.test.js` (5 files, 167 tests)

**Architecture**:
```javascript
// InputAdapter base class - all adapters extend this
export class InputAdapter {
    constructor() {
        this.listeners = [];
        this.isEnabled = true;
    }
    
    onInput(callback) {
        this.listeners.push(callback);
        return () => { /* unsubscribe */ };
    }
    
    emitInput(input) {
        if (!this.isEnabled) return;
        this.listeners.forEach(cb => cb({
            ...input,
            timestamp: performance.now(),
            source: this.name
        }));
    }
}

// KeyboardAdapter - wraps Phaser keyboard
export class KeyboardAdapter extends InputAdapter {
    constructor(phaserInput, options = {}) {
        super();
        this.setupKeys(phaserInput);
    }
    
    update(deltaTime) {
        const direction = this.getDirectionFromKeys();
        if (direction) {
            this.emitInput({ type: INPUT_TYPES.DIRECTION, value: direction });
        }
    }
}

// ReplayAdapter - plays back recorded inputs
export class ReplayAdapter extends InputAdapter {
    constructor(replayData, options = {}) {
        super();
        this.replayData = replayData;
        this.options = { loop: false, speed: 1.0, ...options };
    }
    
    update(deltaTime) {
        // Emit inputs at correct times based on replay data
        while (this.currentIndex < this.replayData.length &&
               this.replayData[this.currentIndex].time <= this.elapsedTime) {
            this.emitInput(this.replayData[this.currentIndex].input);
            this.currentIndex++;
        }
    }
}

// AIInputAdapter - bot-controlled gameplay
export class AIInputAdapter extends InputAdapter {
    setGameModel(gameModel) {
        this.gameModel = gameModel;
        this.ai.enable();
    }
    
    update(deltaTime) {
        const direction = this.ai.getDirection(
            this.gameModel.pacman,
            this.gameModel.maze,
            this.gameModel.pelletGrid,
            this.gameModel.ghosts
        );
        if (direction) {
            this.emitInput({ type: INPUT_TYPES.DIRECTION, value: direction });
        }
    }
}

// InputManager - coordinates multiple adapters
export class InputManager {
    registerAdapter(name, adapter) {
        this.adapters.set(name, adapter);
        adapter.onInput(input => this.handleAdapterInput(name, input));
    }
    
    setActiveAdapter(name) {
        // Activate one adapter, deactivate others
        this.adapters.forEach((adapter, key) => {
            key === name ? adapter.enable() : adapter.disable();
        });
    }
    
    update(deltaTime) {
        this.activeAdapters.forEach(name => {
            this.adapters.get(name).update(deltaTime);
        });
    }
}
```

**Usage Example**:
```javascript
// Setup input system
const inputManager = new InputManager();
inputManager.registerAdapter('keyboard', new KeyboardAdapter(scene.input));
inputManager.registerAdapter('replay', new ReplayAdapter(replayData));
inputManager.registerAdapter('ai', new AIInputAdapter());

// Use keyboard by default
inputManager.setActiveAdapter('keyboard');

// Switch to AI for demo mode
inputManager.setActiveAdapter('ai');

// Process input each frame
inputManager.update(deltaTime);

// Receive normalized input events
inputManager.onInput((input) => {
    // input = { type: 'direction', value: {x, y, angle}, timestamp, adapter: 'keyboard' }
    gameController.handleInput(input);
});
```

**Benefits**:
- ✅ Input source is swappable without changing game logic
- ✅ Easy to add new input sources (voice, network, etc.)
- ✅ Replay system for debugging and demos
- ✅ AI can play using same interface as human
- ✅ Input can be recorded and analyzed
- ✅ No Phaser dependency in input abstraction

---

### ✅ Phase 6 & 7 COMPLETE - Clean Controller & Scene Management via Events (2026-02-09)

**Goals**: 
- Phase 6: Controller only translates input to model calls (no scene references)
- Phase 7: Scene transitions are handled by View, triggered by events

**Deliverables**:
- `ActionRouter` - Routes input actions to handlers with game state validation
- `ActionContext` - Context object for action handlers with validation methods
- `GameController` (clean) - No scene references, uses InputManager
- `EventBus` updated with controller events:
  - PAUSE_REQUESTED, RESUME_REQUESTED
  - RETURN_TO_MENU_REQUESTED
  - RESTART_LEVEL_REQUESTED
  - REPLAY_TOGGLE_REQUESTED, LOAD_REPLAY_REQUESTED
- `ModelDrivenGameView` updated to handle controller events for scene transitions
- **49 new tests** for ActionRouter and GameController

**Test Results**: All 1,488 tests passing ✅ (63 test suites, 14 skipped)

**Files Created**:
- `src/controllers/ActionRouter.js` (372 lines)
- `tests/controllers/ActionRouter.test.js` (435 lines)
- `tests/views/ModelDrivenGameView.events.test.js` (284 lines)

**Files Modified**:
- `src/core/EventBus.js` - Added controller action events
- `src/views/ModelDrivenGameView.js` - Added `bindControllerEvents()` for scene transitions
- `src/scenes/ModelDrivenGameScene.js` - Uses new clean GameController and InputManager

**Architecture**:
```javascript
// ActionRouter - routes input to appropriate handlers
export class ActionRouter {
    registerDefaultHandlers() {
        // Direction input -> model.setDesiredDirection()
        this.registerHandler(INPUT_TYPES.DIRECTION, (input, context) => {
            if (context.canAcceptInput()) {
                this.gameModel.setDesiredDirection(input.value);
                gameEvents.emit(GAME_EVENTS.DIRECTION_CHANGED, { direction: input.value });
            }
        });
        
        // Pause action -> emit PAUSE_REQUESTED (View handles scene pause)
        this.registerHandler(INPUT_ACTIONS.PAUSE, (input, context) => {
            if (context.canPause()) {
                this.gameModel.togglePaused();
                gameEvents.emit(GAME_EVENTS.PAUSE_REQUESTED);
            }
        });
        
        // Menu action -> emit RETURN_TO_MENU_REQUESTED (View handles scene transition)
        this.registerHandler(INPUT_ACTIONS.RETURN_TO_MENU, (input, context) => {
            gameEvents.emit(GAME_EVENTS.RETURN_TO_MENU_REQUESTED);
        });
    }
}

// GameController (Phase 6 - Clean)
export class GameController {
    constructor({ gameModel, replaySystem, inputManager }) {
        this.gameModel = gameModel;
        this.actionRouter = new ActionRouter(gameModel, replaySystem);
        
        // Subscribe to input events from InputManager
        if (inputManager) {
            this.setInputManager(inputManager);
        }
    }
    
    handleInput(input) {
        // Route to appropriate handler
        this.actionRouter.route(input);
    }
}

// ModelDrivenGameView (Phase 7 - View handles scene transitions)
export class ModelDrivenGameView {
    bindControllerEvents() {
        // Scene transitions are View concerns, triggered by controller events
        gameEvents.on(GAME_EVENTS.PAUSE_REQUESTED, () => {
            this.scene.scene.pause();
            this.scene.scene.launch('PauseScene');
        });
        
        gameEvents.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
            this.scene.cleanup();
            this.scene.scene.start('MenuScene');
        });
        
        gameEvents.on(GAME_EVENTS.RESTART_LEVEL_REQUESTED, () => {
            this.scene.scene.restart({ score: 0, lives: 3, level: 1 });
        });
    }
}
```

**Usage**:
```javascript
// In ModelDrivenGameScene
const inputManager = new InputManager();
inputManager.registerAdapter('keyboard', new KeyboardAdapter(this.input));

const gameController = new GameController({
    gameModel: this.gameModel,
    replaySystem: this.replaySystem,
    inputManager: inputManager
});
gameController.activate();

// Input flows: KeyboardAdapter -> InputManager -> GameController -> ActionRouter -> Model/Events
// Scene transitions: Controller emits event -> View receives event -> View handles scene change
```

**Benefits**:
- ✅ Controller has zero Phaser dependencies (no scene references)
- ✅ Scene transitions are View concerns (proper MVC separation)
- ✅ Input routing is decoupled from scene management
- ✅ Easy to test - no Phaser mocks needed for controller tests
- ✅ Consistent event-driven architecture throughout

---

## File Structure After Refactoring

```
src/
├── core/
│   ├── GameModel.js           # Owns GameState, orchestrates update
│   ├── GameState.js           # Aggregates all entity states
│   └── EventBus.js            # Unchanged
├── model/
│   ├── ModelEntity.js         # Base class for pure data entities
│   ├── entities/
│   │   ├── PacmanState.js     # Pacman state only
│   │   ├── GhostState.js      # Ghost state only
│   │   └── FruitState.js      # Fruit state only
│   └── systems/
│       ├── CollisionSystem.js # Pure collision using state positions
│       ├── GhostAISystem.js   # AI logic using state
│       └── GameRules.js       # Score, win conditions, etc.
├── view/
│   ├── PhaserGameView.js      # Creates VisualEntities, renders
│   ├── ConsoleGameView.js     # Logs state changes
│   └── visuals/
│       ├── VisualPacman.js    # Phaser sprite wrapper
│       ├── VisualGhost.js     # Phaser sprite wrapper
│       ├── VisualFruit.js     # Phaser graphics wrapper
│       └── VisualMaze.js      # Maze rendering
├── controller/
│   └── GameController.js      # Input translation only
├── input/
│   ├── InputAdapter.js        # Abstract input base
│   ├── KeyboardAdapter.js     # Phaser keyboard
│   ├── TouchAdapter.js        # Phaser touch
│   └── ReplayAdapter.js       # Replay input
└── config/
    └── gameConfig.js          # Unchanged
```

---

## Testing Strategy

### Headless Game Simulation

With clean MVC, we can now test the game without Phaser:

```javascript
// tests/headless/gameSimulation.test.js
test('complete game simulation without Phaser', () => {
    const model = new GameModel({
        level: 1,
        maze: createTestMaze(),
        pelletGrid: createTestPellets()
    });
    
    // Simulate 1000 frames
    for (let i = 0; i < 1000; i++) {
        const input = aiGetInput(model.state);  // AI plays
        model.step(1/60, input);
    }
    
    // Assert game state
    expect(model.state.score).toBeGreaterThan(0);
    expect(model.state.pelletsRemaining).toBeLessThan(100);
});
```

### Deterministic Replay Testing

```javascript
test('deterministic replay', () => {
    const inputs = loadReplay('level1_completion.replay');
    
    // Run twice
    const run1 = simulate(inputs);
    const run2 = simulate(inputs);
    
    expect(run1.finalState).toEqual(run2.finalState);
});
```

---

## Migration Strategy

### Phase 1: Create Parallel Model ✅ COMPLETE
- ✅ Create ModelEntity classes alongside existing entities
- ✅ Implement GameState aggregator
- ✅ Write tests for pure model (135 tests passing)
- **Delivered**: 2026-02-09

### ✅ Phase 2 COMPLETE - Collision System Integration (2026-02-09)

**Summary**: Integrated model-based collision detection alongside existing visual-based system.

**Deliverables**:
- `GameStateController` - Manages game simulation using model entities (headless-capable)
- `ModelStateAdapter` - Syncs between Phaser entities and model entities
- `ModelIntegratedGameScene` - GameScene using model collision system
- **69 new unit tests** for adapter, controller, and integration
- **All 1,204 tests passing** (204 model tests total)

**Key Features**:
- ModelCollisionSystem uses pure entity state (no Phaser dependencies)
- Dual system support: visual entities synced to model for collision
- Event emission bridges model events to view layer
- Full game loop functional with model-based collision

**Files Created**:
- `src/model/GameStateController.js` (181 lines)
- `src/model/ModelStateAdapter.js` (218 lines)
- `src/scenes/ModelIntegratedGameScene.js` (420 lines)
- Tests: `tests/model/*.test.js` (3 new files, 69 tests)

**Ready for Phase 3**: View refactoring to use VisualEntity wrappers

---

### Phase 3: Refactor View (1 week)
- Create VisualEntity wrappers
- Change PhaserGameView to observe model
- Remove entity creation from View

### Phase 3: Refactor View (1 week)
- Create VisualEntity wrappers
- Change PhaserGameView to observe model
- Remove entity creation from View

### Phase 4: Clean Controller & Input (1 week)
- Abstract input system
- Remove scene references from controller
- Event-driven scene transitions

### Phase 5: Remove Legacy Code (1 week)
- Delete old entity classes
- Remove visual logic from model
- Final cleanup

---

## Benefits of Clean MVC

| Benefit | Description |
|---------|-------------|
| **True Headless Mode** | Game can run without any rendering for AI training, automated testing |
| **Deterministic Replay** | Same inputs always produce same outputs |
| **Easy Testing** | No Phaser mocks needed for game logic tests |
| **Multiple Views** | Can have 3D view, VR view, or network view without changing game logic |
| **Server-Client** | Model can run on server, View on client for multiplayer |
| **AI Training** | Fast headless simulation for ML training |
| **Bug Isolation** | Clear separation makes bugs easier to locate |

---

## Conclusion

The current implementation has a good foundation with GameModel and EventBus, but **entities extending Phaser.GameObjects is the critical blocker** for true MVC separation. The proposed refactoring creates a clean separation where:

1. **Model** owns all game state and rules (pure JavaScript)
2. **View** only renders and observes (Phaser-dependent)
3. **Controller** only translates input (no scene references)

This enables headless operation, deterministic testing, and multiple view implementations while maintaining the existing gameplay behavior.
