# Product Requirements Document (PRD)

## 1. Overview

### Product Name
**Pac-Man (Web Edition)**

### Purpose
Deliver a modern browser-based Pac-Man game that preserves the classic feel while providing quality-of-life improvements (mobile support, visual polish, sound effects, and configurable settings).

### Vision
Offer a polished, instantly playable Pac-Man experience that runs reliably on desktop and mobile browsers without external assets or complex setup.

## 2. Goals & Objectives

### Primary Goals
1. **Faithful Gameplay**: Recreate classic Pac-Man behavior and rules.
2. **Accessibility**: Runs in-browser with no installs or native dependencies.
3. **Performance & Stability**: 60 FPS target, consistent movement via fixed timestep.
4. **Replayability**: Progressive difficulty, score chase, achievements.
5. **Testability**: Core game logic testable without rendering dependencies.

### Success Metrics
- **Gameplay:** ≥ 60 FPS on modern hardware (debug overlay verifies FPS). ✅ **ACHIEVED**
- **Retention:** Achievement unlock rate and replay usage. ✅ **ACHIEVED**
- **Reliability:** All test suites passing in CI with coverage ≥ 70%. ✅ **ACHIEVED** (1,488 tests passing, 76 test suites)
- **Maintainability & Testability:** MVC architecture enables clear boundaries and headless testing of core game logic without rendering dependencies. ✅ **ACHIEVED**

## 3. Target Audience & Personas

### Persona A: Casual Player
- Wants quick play, classic mechanics, and responsive controls.
- Values simplicity and fast load.

### Persona B: Retro Enthusiast
- Expects authentic ghost personalities and classic movement feel.
- Values classic mechanics like scatter/chase cycles and ghost combos.

### Persona C: Mobile Player
- Needs touch-friendly controls and responsive scaling.
- Prefers minimal UI clutter and easy interaction.

## 4. Scope

### In Scope ✅ **COMPLETED**
- ✅ Classic Pac-Man maze and pellet collection
- ✅ Four ghosts with differentiated AI behaviors (Blinky, Pinky, Inky, Clyde)
- ✅ Power pellets with frightened state and ghost combos
- ✅ Fruit bonuses with level-dependent values
- ✅ Level progression and increasing difficulty
- ✅ High-score persistence
- ✅ Mobile-friendly touch controls
- ✅ Settings: sound, volume, FPS overlay, difficulty
- ✅ Achievements system (tracking, notifications, persistence)
- ✅ Replay system (record, playback, localStorage persistence)

### Out of Scope
- Multiplayer or online leaderboards
- Multiple maze variants
- Asset-heavy graphics or external audio files

## 5. Functional Requirements

### Gameplay
1. Player must navigate the maze and collect pellets to finish a level.
2. Ghosts must follow personality-based targeting and mode cycles.
3. Power pellets must trigger frightened mode and enable ghost eating.
4. Fruit should spawn after a pellet threshold is reached and disappear after a timer.
5. Level completion must transition to a win screen and advance difficulty.
6. Death should trigger a pause/death animation and reduce lives.
7. Game over should return to a menu with score summary.

### Systems & UX
8. Scoring should update in real time and persist high scores.
9. Input must support keyboard (arrows/WASD) and touch swipe.
10. Pause/resume must be accessible and reversible.
11. Settings must persist to localStorage.
12. Achievements must trigger notifications and persist unlocks.
13. Replay recording must be start/stop capable and persist recent sessions.

## 6. Non-Functional Requirements

- **Performance:** Fixed timestep at 60 Hz; collision checks must stay within a small budget.
- **Compatibility:** Must run in modern evergreen browsers.
- **Reliability:** Must pass the provided Jest suite with coverage thresholds.
- **Maintainability:** Code must follow clear architectural patterns (MVC) to enable easy updates and feature additions.
- **Testability:** Core game logic must be testable without rendering dependencies (supported by pure Model layer).
- **Resilience:** Sound system must fail gracefully if Web Audio API is unavailable.

## 7. UX Requirements

- Clear and readable UI for score, lives, level.
- Visual feedback for important events (power pellet activation, ghost eaten, fruit eaten).
- “Ready” and “Level Complete” messaging for pacing.
- Responsive scaling for varied screen sizes.

## 8. Analytics & Telemetry (Optional Future Work)

- Session length, levels reached, and achievement unlocks.
- Replay creation rate.
- Input latency proxy metrics (optional).

## 9. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Movement drift or desync | Fixed timestep + center-snapping logic |
| Collision missed at high speed | Swept capsule collision checks |
| Browser audio restrictions | User-initiated SoundManager initialization |
| Performance regressions | Debug overlay + collision budget telemetry |
| Scene complexity grows as features are added | MVC architecture separates game logic (Model) from scene orchestration (GameScene), keeping GameScene lean |
| Coupling between game logic and rendering makes changes risky | EventBus decouples Model from Views, allowing safe independent modifications |

## 10. Milestones

### Completed Milestones ✅

1. **MVP Stability** ✅ (COMPLETED)
   - Core gameplay mechanics implemented
   - All test suites passing (1,488 tests, 76 suites)

2. **MVC Phase 1 - Model Entity Separation** ✅ (COMPLETED 2026-02-09)
   - Created pure data entity classes (ModelEntity, PacmanState, GhostState, FruitState)
   - Zero Phaser dependencies in model layer
   - 47 new tests added

3. **MVC Phase 2 - Collision System Integration** ✅ (COMPLETED 2026-02-09)
   - Created GameStateController for headless game simulation
   - Created ModelStateAdapter for visual/model sync
   - Enhanced ModelCollisionSystem with event generation
   - 69 new tests added

4. **MVC Phase 3 - Unified GameModel** ✅ (COMPLETED 2026-02-09)
   - Merged GameModel and GameState into unified class
   - GameModel now owns all entity states and world state
   - Complete backward compatibility maintained
   - 47 new tests added

5. **MVC Phase 4 - View as Pure Observer** ✅ (COMPLETED 2026-02-09)
   - Created ModelDrivenGameScene (pure MVC game scene)
   - Created ModelDrivenGameView (pure observer view)
   - View creates Visual wrappers from model entities
   - No dual entity system - single source of truth
   - 21 new tests added

6. **MVC Phase 5 - Abstract Input System** ✅ (COMPLETED 2026-02-09)
   - Created InputAdapter base class (abstract interface)
   - Created InputManager for multi-adapter coordination
   - Created KeyboardAdapter (Phaser keyboard wrapper)
   - Created ReplayAdapter and ReplayRecorder
   - Created AIInputAdapter and ScriptedAIAdapter
   - 167 new tests added

7. **MVC Phase 6 & 7 - Clean Controller & Scene Management** ✅ (COMPLETED 2026-02-09)
   - Created ActionRouter with ActionContext
   - Clean GameController (zero Phaser dependencies, no scene refs)
   - Updated EventBus with controller events
   - Updated View for scene transitions via events
   - 63 new tests added

8. **Polish & Meta Features** ✅ (COMPLETED)
   - Visual effects, audio, and UI improvements
   - Touch controls and scaling improvements
   - Achievements system with notifications
   - Replay system with recording/playback
   - Debug overlay with FPS and collision telemetry

### Remaining Work
- Additional ghost AI modes
- Custom maze editor
- Online leaderboards
- Network-based replay sharing

