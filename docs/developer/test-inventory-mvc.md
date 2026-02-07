# Test-Inventar (MVC-Klassifizierung)

Diese Übersicht listet alle Tests in `tests/`, `e2e/`, `__mocks__/` sowie die `test_*.js`-Dateien im Projektroot. Pro Datei sind Zweck, Abhängigkeiten (Phaser, DOM, Model-APIs) sowie der Ziel‑Layer (Model/Controller/View/E2E) dokumentiert. Tests, die direkt alte Architektur‑Objekte (Phaser‑Scenes, Scene‑Controller/Systems, Phaser‑gebundene Entities/Pools) nutzen, sind als **Refactor/Removal‑Kandidaten** markiert.

**Legende – Abhängigkeiten**
- **Phaser**: Zugriff auf Phaser‑Objekte oder Scene‑Mocks.
- **DOM**: Zugriff auf `window`, `document`, `localStorage` oder Browser‑Events.
- **Model‑APIs**: Nutzung der App‑Klassen/Utilities aus `src/` (Entities, Systems, Utils, Config).

## Projektroot: `test_*.js`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `test_ghost_center.js` | Ad‑hoc Debug‑Script für Tile‑Center‑Berechnungen. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model (Debug‑Script) | **Ja** (direkter Phaser‑Import) |
| `test_ghost_init.js` | Ad‑hoc Debug‑Script für Ghost‑Initialisierung. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model (Debug‑Script) | **Ja** (Entity + Scene‑Stub) |
| `test_trace.js` | Ad‑hoc Debug‑Script für Movement‑Step‑Berechnungen. | Phaser ❌ / DOM ❌ / Model‑APIs ❌ | Model (Debug‑Script) | Nein |
| `test_tunnel.js` | Debug‑Script für Tunnel/Warp‑Verhalten mit Pacman. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model (Debug‑Script) | **Ja** (Entity + Scene‑Stub) |
| `test_tunnel2.js` | Debug‑Script für Tunnel‑Entry‑Logik mit Pacman. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model (Debug‑Script) | **Ja** (Entity + Scene‑Stub) |

## `__mocks__/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `__mocks__/phaser.js` | Phaser‑Mock für Jest‑Tests (GameObjects, Game). | Phaser ✅ / DOM ❌ / Model‑APIs ❌ | View (Test‑Infra) | Nein (Test‑Infra) |

## `tests/` – Setup & Utilities

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `tests/setup.js` | Globaler Test‑Setup (Canvas/Audio/Phaser‑Mocks). | Phaser ✅ / DOM ✅ / Model‑APIs ❌ | View (Test‑Infra) | Nein (Test‑Infra) |
| `tests/utils/testHelpers.js` | Test‑Helpers (Maze, Mock‑Scene/Entities/Systems). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model (Test‑Infra) | **Ja** (Mock‑Scene aus alter Architektur) |
| `tests/utils/ErrorHandler.test.js` | Tests für Error‑Logging und Browser‑Events. | Phaser ❌ / DOM ✅ / Model‑APIs ✅ | View (Utility) | Nein |
| `tests/utils/WarpTunnel.test.js` | Tests für Warp‑Tunnel‑Utilities. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/utils/DebugLogger.test.js` | Tests für Debug‑Logger (console). | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/utils/DirectionBuffer.test.js` | Tests für Direction‑Buffer‑Logik. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/utils/Time.test.js` | Tests für Zeit‑Normalisierung. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/utils/TileMovement.test.js` | Tests für Tile‑Movement‑Utilities. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |

## `tests/core/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `tests/core/EventBus.test.js` | EventBus‑Publish/Subscribe‑Verhalten. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |

## `tests/unit/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `tests/unit/gridHelpers.test.js` | Grid‑Helper‑Funktionen (worldToTile/tileCenter). | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/unit/fixedTimestep.test.js` | Determinismus‑ und Invarianten‑Tests für FixedTimeStepLoop. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/unit/CenterSnapping.test.js` | Center‑Snapping‑Regression/Verhaltenstests. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/unit/PreviousPositionTracking.test.js` | Tracking von prevX/prevY und prevGridX/prevGridY. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Entity + Scene‑Stub) |
| `tests/unit/movement.test.js` | Movement‑Regeln (Walls, Snap‑to‑Center, Turns). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Entity + Scene‑Stub) |

## `tests/entities/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `tests/entities/BaseEntity.test.js` | Basis‑Entity (Grid/Pixel/Movement). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Phaser‑gebundene Entity) |
| `tests/entities/EntityInitialization.test.js` | Initialisierungs‑Tests für BaseEntity/Pacman/Ghost. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Phaser‑gebundene Entities) |
| `tests/entities/Pacman.bugfix.test.js` | Bugfix‑Regressionen für Pacman. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Phaser‑gebundene Entity) |
| `tests/entities/Pacman.gridMovement.test.js` | Grid‑Movement‑Spezifika für Pacman. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Phaser‑gebundene Entity) |
| `tests/entities/Ghost.test.js` | Ghost‑Logik (States, Movement, Frightened/Eaten). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Phaser‑gebundene Entity) |
| `tests/entities/Ghost.bugfix.test.js` | Bugfix‑Regressionen für Ghost. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Phaser‑gebundene Entity) |
| `tests/entities/GhostFactory.test.js` | GhostFactory‑Erstellung und Defaults. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Phaser‑gebundene Entity) |
| `tests/entities/Fruit.test.js` | Fruit‑Entity (Activation/Scoring/Timer). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Phaser‑gebundene Entity) |

## `tests/systems/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `tests/systems/GhostAISystem.test.js` | Ghost‑AI‑Targeting & Mode‑Cycle‑Logik. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/systems/PacmanAI.test.js` | Pacman‑AI‑Entscheidungslogik. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/systems/AchievementSystem.test.js` | Achievement‑State, Progress & Persistence. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/systems/FixedTimeStepLoop.test.js` | Fixed‑Timestep‑Loop‑Logik. | Phaser ❌ / DOM ❌ / Model‑APIs ✅ | Model | Nein |
| `tests/systems/DebugOverlay.test.js` | Debug‑Overlay‑UI (Text/Visibility/FPS). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | View | **Ja** (Scene‑UI/Overlay) |
| `tests/systems/ReplaySystem.test.js` | Replay‑Recording/Playback + localStorage. | Phaser ❌ / DOM ✅ / Model‑APIs ✅ | Controller | Nein (aber DOM‑Abhängigkeit) |
| `tests/systems/CollisionSystem.test.js` | Collision‑Checks (Pellets/Ghosts/Thresholds). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Scene‑Coupling) |
| `tests/systems/CollisionSystem.bugfix.test.js` | Collision‑Bugfix‑Regressionen. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Scene‑Coupling) |

## `tests/pools/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `tests/pools/PelletPool.test.js` | Pellet‑Pool (Sprite‑Reuse, Release). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | View | **Ja** (Sprite‑Pool/Scene) |
| `tests/pools/PowerPelletPool.test.js` | Power‑Pellet‑Pool (Sprite‑Reuse). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | View | **Ja** (Sprite‑Pool/Scene) |

## `tests/integration/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `tests/integration/SingleEntityMovement.test.js` | Pacman/Ghost‑Movement‑Integration. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Entities + Scene‑Stub) |
| `tests/integration/MovementContinuity.test.js` | Movement‑Kontinuität über Frames. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Entities + Scene‑Stub) |
| `tests/integration/MovementEdgeCases.test.js` | Movement‑Edge‑Cases (Reset/Buffering). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Entities + Scene‑Stub) |
| `tests/integration/ConcurrentMovement.test.js` | Mehrere Entities parallel bewegen. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Entities + Scene‑Stub) |
| `tests/integration/TunnelBehavior.test.js` | Tunnel/Warp‑Verhalten mit Entities. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Entities + Scene‑Stub) |
| `tests/integration/MultiEntityCollision.test.js` | Collision‑Integration (mehrere Entities). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Entities + Scene‑Stub) |
| `tests/integration/GhostLifecycle.test.js` | Ghost‑Lifecycle (Frightened/Eaten/Respawn). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Entities + Scene‑Stub) |

## `tests/regression/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `tests/regression/MovementFuzz.test.js` | Fuzz‑Tests für Movement‑Stabilität. | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Model | **Ja** (Entities + Scene‑Stub) |

## `tests/scenes/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `tests/scenes/SettingsScene.test.js` | Settings‑Scene (UI, Storage, Transitions). | Phaser ✅ / DOM ✅ / Model‑APIs ✅ | View | **Ja** (Scene‑Test) |

## `tests/scenes/systems/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `tests/scenes/systems/GameFlowController.test.js` | Game‑Flow (Score/Lives/Win/Lose). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Controller | **Ja** (Scene‑Controller) |
| `tests/scenes/systems/InputController.test.js` | Input‑Handling (Keys/Replay). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | Controller | **Ja** (Scene‑Controller) |
| `tests/scenes/systems/EffectManager.test.js` | Effekt‑Verwaltung (Flashes/FX). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | View | **Ja** (Scene‑FX) |
| `tests/scenes/systems/UIController.test.js` | UI‑Updates (Score/Lives/Text). | Phaser ✅ / DOM ❌ / Model‑APIs ✅ | View | **Ja** (Scene‑UI) |

## `e2e/`

| Datei | Zweck | Abhängigkeiten | Ziel‑Layer | Refactor/Removal‑Kandidat |
| --- | --- | --- | --- | --- |
| `e2e/example.spec.js` | Playwright‑Beispieltest (externe URL). | Phaser ❌ / DOM ✅ / Model‑APIs ❌ | E2E | Nein (Beispieltest, aber nicht App‑spezifisch) |
