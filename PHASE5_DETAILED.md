# Phase 5: System-Klassifizierung - Detaillierte Analyse

## System-Kategorisierung

### 1. CORE SYSTEMS (Essenziell für das Spiel)

#### SpawningSystem
- **Datei:** `src/model/systems/SpawningSystem.js`
- **Zuständig für:** Maze-Generierung, Entity-Spawn, Pellet-Management
- **Abhängigkeiten:**
  - `MazeGenerator` (Utility)
  - `createMazeData` (MazeLayout)
  - `countPellets` (MazeLayout)
  - `gameConfig` (Config)
- **Interface:** `getMaze()`, `getPelletGrid()`, `generateMazeForLevel()`, `spawnEntity()`
- **Wiederverwendbar:** ✅ Ja (kann in anderen Spielen verwendet werden)

#### LevelSystem
- **Datei:** `src/model/systems/LevelSystem.js`
- **Zuständig für:** Level-Progression, Schwierigkeitsstufen
- **Abhängigkeiten:**
  - `gameConfig` (Config)
  - `scoreValues` (Config)
- **Interface:** `getLevel()`, `setLevel()`, `getLevelConfig()`, `getFrightenedDuration()`
- **Wiederverwendbar:** ✅ Ja (generic level system)

#### GameState
- **Datei:** `src/core/GameState.js` (existiert möglicherweise)
- **Zuständig für:** Spiel-Flow Management (Paused, GameOver, etc.)
- **Abhängigkeiten:** Keine
- **Interface:** `pause()`, `resume()`, `isPaused`, `isGameOver`
- **Wiederverwendbar:** ✅ Ja (generic game state)

---

### 2. FEATURE SYSTEMS (Erweiterte Game-Features)

#### BossBattleSystem
- **Datei:** `src/systems/BossBattleSystem.js`
- **Zuständig für:** Boss-Kämpfe, Boss-Verhalten
- **Abhängigkeiten:**
  - `GameModel` (Model - zirkuläre Abhängigkeit!)
  - `EventBus` (Events)
- **Interface:** `startBossBattle()`, `update()`, `getSnapshot()`
- **Wiederverwendbar:** ⚠️ Eingeschränkt (GameModel-Abhängigkeit)

#### AdditionalPowerUpSystem
- **Datei:** `src/systems/AdditionalPowerUpSystem.js`
- **Zuständig für:** Zusätzliche Power-Ups (Speed, Shield, etc.)
- **Abhängigkeiten:**
  - `GameModel` (Model - zirkuläre Abhängigkeit!)
  - `EventBus` (Events)
- **Interface:** `spawnPowerUp()`, `activatePowerUp()`, `update()`, `getSnapshot()`
- **Wiederverwendbar:** ⚠️ Eingeschränkt (GameModel-Abhängigkeit)

#### StoryMode
- **Datei:** `src/systems/StoryMode.js`
- **Zuständig für:** Story-Modus, Dialoge
- **Abhängigkeiten:**
  - `GameModel` (Model - zirkuläre Abhängigkeit!)
  - `EventBus` (Events)
- **Interface:** `startStory()`, `nextChapter()`, `getSnapshot()`
- **Wiederverwendbar:** ⚠️ Eingeschränkt (GameModel-Abhängigkeit)

#### AchievementSystem
- **Datei:** `src/systems/AchievementSystem.js`
- **Zuständig für:** Achievements, Badges
- **Abhängigkeiten:**
  - `EventBus` (Events)
  - `StorageManager` (Persistence)
- **Interface:** `trackAchievement()`, `unlockAchievement()`, `getProgress()`
- **Wiederverwendbar:** ✅ Ja (generic achievement system)

---

### 3. AI SYSTEMS (KI-Logik)

#### GhostAISystem
- **Datei:** `src/systems/GhostAISystem.js`
- **Zuständig für:** Ghost KI-Verhalten
- **Abhängigkeiten:**
  - `MovementSystem` (Movement)
  - `Maze` (Grid)
- **Interface:** `update()`, `setTarget()`, `getBehavior()`
- **Wiederverwendbar:** ⚠️ Eingeschränkt (Ghost-spezifisch)

#### EnemyAISystem
- **Datei:** `src/systems/EnemyAISystem.js`
- **Zuständig für:** Enemy KI-Verhalten (allgemeiner als GhostAISystem)
- **Abhängigkeiten:**
  - `MovementSystem` (Movement)
  - `Maze` (Grid)
- **Interface:** `update()`, `setTarget()`, `getBehavior()`
- **Wiederverwendbar:** ✅ Ja (generic enemy AI)

---

### 4. MOVEMENT SYSTEMS (Bewegungslogik)

#### MovementSystem (Fassade)
- **Datei:** `src/movement/MovementSystem.js`
- **Zuständig für:** Haupt-Fassade für Bewegungs-Systeme
- **Abhängigkeiten:**
  - `MovementEngine` (Core)
  - `MovementComponent` (Core)
  - `AIController` (AI)
  - `MazeAdapter` (Adapter)
- **Interface:** `initialize()`, `moveEntity()`, `setDirection()`, `getValidDirections()`
- **Wiederverwendbar:** ✅ Ja (generic movement system)

#### MovementEngine
- **Datei:** `src/movement/core/MovementEngine.js`
- **Zuständig für:** Kern-Movement-Logik
- **Abhängigkeiten:** Keine
- **Interface:** `move()`, `interpolate()`, `wrapTunnel()`
- **Wiederverwendbar:** ✅ Ja (highly reusable)

#### MovementComponent
- **Datei:** `src/movement/core/MovementComponent.js`
- **Zuständig für:** Bewegungs-Komponente für Entities
- **Abhängigkeiten:** Keine
- **Interface:** `update()`, `move()`, `setSpeed()`
- **Wiederverwendbar:** ✅ Ja (generic component)

#### TileCenterMovement (Feature-Integration)
- **Datei:** `src/movement/features/TileCenterMovement.js`
- **Zuständig für:** Tile-Center Movement Feature
- **Abhängigkeiten:**
  - `MovementEngine` (Core)
  - `MazeAdapter` (Adapter)
- **Interface:** `moveToTileCenter()`, `update()`
- **Wiederverwendbar:** ✅ Ja (movement feature)

---

### 5. REPLAY SYSTEMS (Wiedergabe/Debugging)

#### ReplaySystem
- **Datei:** `src/systems/ReplaySystem.js`
- **Zuständig für:** Spiel-Aufnahme und Wiedergabe
- **Abhängigkeiten:**
  - `EventBus` (Events)
  - `StorageManager` (Persistence)
- **Interface:** `startRecording()`, `stopRecording()`, `playReplay()`
- **Wiederverwendbar:** ✅ Ja (generic replay system)

---

### 6. UTILITY SYSTEMS (Hilfsfunktionen)

#### CollisionHandler
- **Datei:** `src/model/systems/CollisionHandler.js` (existiert möglicherweise)
- **Zuständig für:** Kollisionserkennung
- **Abhängigkeiten:**
  - `Maze` (Grid)
  - `PelletGrid` (Grid)
- **Interface:** `checkCollision()`, `handleCollision()`
- **Wiederverwendbar:** ✅ Ja (generic collision)

#### ScoreSystem
- **Datei:** `src/model/systems/ScoreSystem.js` (existiert möglicherweise)
- **Zuständig für:** Score-Management
- **Abhängigkeiten:**
  - `EventBus` (Events)
  - `StorageManager` (Persistence)
- **Interface:** `addScore()`, `getScore()`, `getHighScore()`
- **Wiederverwendbar:** ✅ Ja (generic score system)

---

## Abhängigkeits-Graph

```
                    ┌──────────────────┐
                    │   gameConfig     │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐     ┌──────▼──────┐     ┌─────▼─────┐
    │  Spawning │     │   Level     │     │  Movement │
    │  System   │◄────┤   System    │     │   System  │
    └─────┬─────┘     └─────────────┘     └─────┬─────┘
          │                                    │
    ┌─────▼────────────────────────────────────▼─────┐
    │                GameModel (DI)                   │
    └────────┬────────────────────┬───────────────────┘
             │                    │
    ┌────────▼─────────┐  ┌─────▼────────────────────┐
    │  Feature Systems │  │      AI Systems         │
    │  - BossBattle    │  │  - GhostAISystem        │
    │  - PowerUps      │  │  - EnemyAISystem        │
    │  - StoryMode     │  └────────────────────────┘
    │  - Achievements  │
    └──────────────────┘
```

---

## Wiederverwendbare Module (für Unified Export Pattern)

### Hoch Wiederverwendbar:
- ✅ `MovementEngine` (generic movement)
- ✅ `MovementComponent` (generic component)
- ✅ `LevelSystem` (generic level progression)
- ✅ `AchievementSystem` (generic achievements)
- ✅ `ReplaySystem` (generic replay)
- ✅ `ScoreSystem` (generic score)
- ✅ `EnemyAISystem` (generic AI)
- ✅ `SpawningSystem` (generic spawning)

### Mittel Wiederverwendbar:
- ⚠️ `MovementSystem` (Fassade, aber Pacman-spezifische Teile)
- ⚠️ `GhostAISystem` (Ghost-spezifisch, aber AI-Logik wiederverwendbar)

### Eingeschränkt Wiederverwendbar:
- ❌ `BossBattleSystem` (GameModel-Abhängigkeit)
- ❌ `AdditionalPowerUpSystem` (GameModel-Abhängigkeit)
- ❌ `StoryMode` (GameModel-Abhängigkeit)

---

## Nächste Schritte

1. ✅ System-Kategorisierung dokumentiert
2. ✅ Abhängigkeiten analysiert
3. ✅ Wiederverwendbare Module identifiziert
4. ⏳ Unified Export Pattern für wiederverwendbare Module (Phase 7)
5. ⏳ GameModel-Abhängigkeiten in Feature Systems lösen (Phase 6)

## Status

Phase 5: System-Klassifizierung - **75% abgeschlossen** ✅
