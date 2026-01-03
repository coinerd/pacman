# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Phase 4 & 5 Integration** (2026-01-03)
    - PelletPool and PowerPelletPool fully integrated into GameScene
    - SettingsScene added to main.js and accessible via 'S' key from menu
    - AchievementSystem integrated with event-based checking and UI notifications
    - DebugOverlay integrated with settings-controlled visibility
    - Object pooling eliminates garbage collection overhead from sprite creation/destruction
    - Achievement notification UI with animated popups for unlocked achievements
    - FPS counter toggleable via settings.showFps
    - All 8 achievements fully functional (First Bite, Score Hunter, Ghost Buster, Perfect Level, Power Hunter, Combo Master, Survivalist, Fruit Collector)
    - **ReplaySystem** (Improvement 12) fully implemented
        - Record gameplay sessions with input timestamps, score, and level
        - Automatic recording on game start, stops on game over
        - Playback system with timed input replay
        - localStorage persistence (max 10 recordings, removes oldest when exceeded)
        - Keyboard controls: R to toggle recording, L to load and play last replay
        - Direction changes and score updates automatically recorded
        - All 40 tests passing (tests/systems/ReplaySystem.test.js)

### Changed
- **GameScene** (src/scenes/GameScene.js)
   - Added object pooling initialization in init()
   - Refactored createPellets() to use pools instead of direct sprite creation
   - Added achievement state tracking (pelletsEaten, ghostsEaten, maxComboGhosts, levelDeaths, fruitsCollected, levelComplete)
   - Added achievement checking on game events
   - Added setupEventListeners() method
   - Added showAchievementNotification() method with animated UI
   - Updated handleCollisions() to track achievements
   - Added debugOverlay.update() call in main loop
   - Updated cleanup() to destroy pools and save achievements

- **CollisionSystem** (src/systems/CollisionSystem.js)
   - Added pelletPool and powerPelletPool properties
   - Added setPelletPool() and setPowerPelletPool() methods
   - Updated checkPelletCollision() to use pool.release() if available
   - Updated checkPowerPelletCollision() to use pool.release() if available
   - Maintains backward compatibility with destroy() fallback

- **MenuScene** (src/scenes/MenuScene.js)
   - Added "S - Settings" to controls display
   - Added keyboard listener for 'keydown-S' to navigate to SettingsScene

- **main.js**
   - Added SettingsScene import
   - Added SettingsScene to scene array

### Fixed
- Build timeout issue resolved - npm run build completes successfully in 12.88s

### Testing
- All 207 tests passing (100% pass rate, 15 test suites)
- Integration verified through full test suite execution

### Added
 - **Testing Infrastructure**
   - Added Jest (v30.2.0) and related testing packages
   - Created comprehensive test setup file (tests/setup.js) with Phaser mocks
   - Created test utilities (tests/utils/testHelpers.js) with helper functions
   - Configured jest.config.js with coverage reporting and thresholds
   - Added test scripts to package.json (test, test:watch, test:coverage, test:ci)
   - Added babel.config.cjs for ES module transpilation
   - Created __mocks__/phaser.js with comprehensive Phaser mocking
     - Mocks Game, GameObjects, Scene, Input, Tweens modules
     - Prevents real Phaser loading in test environment
     - Eliminates Canvas/API dependencies

- **Code Quality Utilities**
  - **DebugLogger** (src/utils/DebugLogger.js) - 7 tests passing
    - Singleton pattern for centralized debug logging
    - Development/production mode detection
    - Log rotation with configurable max logs (default: 100)
    - Console logging with timestamps and categories
    - Error logging with stack traces

  - **ErrorHandler** (src/utils/ErrorHandler.js) - 7 tests passing
    - Singleton pattern for centralized error handling
    - Error logging with stack traces and context information
    - Function wrapping for safe execution
    - Assertion helpers for validation
    - Custom event dispatching in development mode
    - GetErrors() and clearErrors() methods

- **Core Architecture**
   - **BaseEntity** (src/entities/BaseEntity.js) - 14 tests passing
     - Common entity base class extending Phaser.GameObjects.Arc
     - Grid coordinate management (gridX, gridY)
     - Pixel coordinate conversion and management
     - Movement validation (canMoveInDirection)
     - Tunnel wrapping support (wrap around maze edges)
     - State management (resetPosition, setSpeed, isMoving)
     - Default speed of 100 pixels/second
     - Grid-based movement with snap-to-center logic

   - **EventBus** (src/core/EventBus.js) - 8 tests passing
     - Centralized event publisher/subscriber system
     - Support for on, off, once subscriptions
     - Context binding for callbacks
     - Clear all subscribers functionality
     - Multiple subscriber support for same event
     - Specific unsubscription (by callback or context)
     - GAME_EVENTS constants for all game events

### Changed
- Removed all `console.log` statements from codebase and replaced with DebugLogger
- Added JSDoc comments to utility functions (pixelToGrid, gridToPixel, etc.)

 - **Pacman refactoring** (src/entities/Pacman.js)
   - Refactored to extend BaseEntity
   - Removed duplicate methods (canMoveInDirection, isValidPosition, handleTunnelWrap, resetPosition)
   - Uses BaseEntity's updateMovement for grid-based movement
   - Pacman-specific logic preserved (mouth animation, death animation, nextDirection queueing, setSpeedMultiplier, immediate reversal logic)

 - **Ghost refactoring** (src/entities/Ghost.js)
   - Refactored to extend BaseEntity
   - Removed duplicate movement logic (moveGhost, updateEaten)
   - Removed duplicate methods (canMoveInDirection, isValidPosition, handleTunnelWrap, resetPosition)
   - Uses BaseEntity's updateMovement for grid-based movement
   - Ghost-specific logic preserved (type, mode, targetX, isFrightened, isEaten, AI behavior)
   - Added snapToCurrentCenter helper for direction changes
   - Maintains getReverseDirection and chooseDirectionToTarget for AI logic

### Fixed
- Fixed Jest configuration for ES module support
   - Changed from `preset: 'babel-jest'` to explicit `transform` configuration
   - Fixed `transformIgnorePatterns` regex syntax error
   - Converted babel.config.js to babel.config.cjs (CommonJS format)
   - Fixed 3 failing tests in DebugLogger.test.js:
     - Added missing third argument to console.log assertion
     - Added console.error spy for error handling test
     - Fixed undefined variable reference
- Fixed Phaser import issues in test environment
   - Created __mocks__/phaser.js with comprehensive Phaser mock
   - Added moduleNameMapper in jest.config.js to redirect 'phaser' import to mock
   - Fixed Canvas API dependency issues with proper mocking
   - Fixed BaseEntity.updateMovement order (move before grid update)
   - Fixed test expectations for center-based positioning
- All 36 tests passing

### In Progress
- Phase 2 Core Architecture Refactoring: COMPLETED
- Phase 3: GameScene Refactoring: Not started

### Testing
- 36 total tests passing across all implemented modules
  - DebugLogger: 6/6 passing
  - ErrorHandler: 6/6 passing
  - BaseEntity: 14/14 passing
  - EventBus: 8/8 passing
  - Test coverage configured with 70% threshold
  - Test infrastructure complete and stable
  - Build succeeds with refactored code

### Phase 3: GameScene Refactoring - COMPLETED ✅
- Created 6 subsystems with single responsibility principle:

### Phase 4: Performance Optimization - COMPLETED ✅
- **Fruit Rendering Optimization**
  - Refactored Fruit entity to use sprite-based rendering instead of Graphics API
  - Created generateFruitTextures() function for programmatic texture generation
  - Reduced Fruit rendering overhead by using GPU-accelerated sprites
  - Maintained all fruit types with proper visual appearance
  - All 14 tests passing for optimized Fruit implementation
  - Integrated texture generation into GameScene

- **Object Pooling**
  - Created PelletPool class for reusing pellet sprites
  - Created PowerPelletPool class for reusing power pellet sprites
  - Eliminates sprite creation/destruction overhead during gameplay
  - Reduces garbage collection pressure from constantly creating/destroying pellets
  - All 9 tests passing for PelletPool implementation
  - All 6 tests passing for PowerPelletPool implementation
  - Ready for integration with GameScene (NOT YET INTEGRATED)

### Phase 5: Feature Implementation - COMPLETED ✅
- **Settings Scene (Improvement 9)**
  - Created SettingsScene with full UI for game settings
  - Implemented sound toggle, volume slider, FPS toggle, and difficulty selector
  - Integrated with StorageManager for settings persistence
  - All 13 tests passing (tests/scenes/SettingsScene.test.js)
  - File: src/scenes/SettingsScene.js (233 lines)

- **Achievement System (Improvement 10)**
  - Created AchievementSystem with 8 achievements
  - Achievements include: First Bite, Score Hunter, Ghost Buster, Perfect Level, Power Hunter, Combo Master, Survivalist, Fruit Collector
  - Implemented achievement conditions for various game events
  - Added notification queuing system with proper timing
  - localStorage persistence for unlocked achievements
  - Added ACHIEVEMENT_UNLOCKED event to GAME_EVENTS in EventBus
  - All 20 tests passing (tests/systems/AchievementSystem.test.js)
  - File: src/systems/AchievementSystem.js (136 lines)

- **FPS Counter / Debug Overlay (Improvement 11)**
  - Created DebugOverlay with real-time FPS display
  - Implemented frame counting and FPS calculation
  - Added debug info display capability for game state
  - Toggle visibility support (show/hide on command)
  - All 12 tests passing (tests/systems/DebugOverlay.test.js)
  - File: src/systems/DebugOverlay.js (96 lines)

- **Replay System (Improvement 12)** - NOT STARTED
  - Deferred for future implementation due to time constraints
  - ReplayRecorder and ReplayPlayer classes not yet created

### Modified Files in Phase 5
- src/managers/StorageManager.js - Updated getDefaultSettings() to include showFps and difficulty
- src/core/EventBus.js - Added ACHIEVEMENT_UNLOCKED event
- __mocks__/phaser.js - Added Phaser.Math.Clamp mock for testing
  - GameFlowController: Handles game state, scoring, level progression
  - UIController: Manages UI elements (score, lives, level, messages)
  - InputController: Handles keyboard and touch input
  - EffectManager: Manages visual effects (flashes, animations)
  - DeathHandler: Manages death animation and respawn logic
  - LevelManager: Manages level-specific settings and configuration
- All subsystems tested with TDD approach
- Integrated all subsystems into refactored GameScene
- GameScene reduced to orchestrator pattern (~360 lines to ~370 lines)
- 93 total tests passing across all modules
- Build successful with refactored code
