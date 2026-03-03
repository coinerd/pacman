# Phase 5: System-Klassifizierung

## Ziele

1. Alle System-Dateien kategorisieren und dokumentieren
2. Abhängigkeiten zwischen Systemen aufzeigen
3. Wiederverwendbare Module identifizieren
4. Vorbereitung für Unified Export Pattern (Phase 7)

## Kategorien

### 1. Core Systems (Kritisch, keine externen Abhängigkeiten)
- SpawningSystem
- LevelSystem
- GameState (nicht zu verwechseln mit Model)

### 2. Feature Systems (Erweiterte Game-Features)
- BossBattleSystem
- AdditionalPowerUpSystem
- StoryMode
- AchievementSystem

### 3. AI Systems (KI-Logik)
- GhostAISystem
- EnemyAISystem

### 4. Movement Systems (Bewegungslogik)
- MovementSystem
- MovementEngine
- MovementComponent
- TileCenterMovement (Feature-Integration)

### 5. Replay Systems (Wiedergabe/Debugging)
- ReplaySystem

### 6. Utility Systems (Hilfsfunktionen)
- CollisionHandler
- ScoreSystem

## Klassifizierung

| System | Kategorie | Zuständig für | Abhängigkeiten |
|--------|-----------|---------------|----------------|
| SpawningSystem | Core | Maze-Generierung, Entity-Spawn | MazeGenerator, createMazeData |
| LevelSystem | Core | Level-Konfiguration, Schwierigkeitsstufen | gameConfig |
| GameState | Core | Spiel-Flow Management | keine |
| BossBattleSystem | Feature | Boss-Kämpfe | GameModel |
| AdditionalPowerUpSystem | Feature | Zusätzliche Power-Ups | GameModel |
| StoryMode | Feature | Story-Modus | GameModel |
| AchievementSystem | Feature | Achievements | EventBus |
| GhostAISystem | AI | Ghost KI | MovementSystem |
| EnemyAISystem | AI | Enemy KI | MovementSystem |
| MovementSystem | Movement | Bewegungslogik | Maze, Grid |
| MovementEngine | Movement | Bewegungs-Engine | keine |
| MovementComponent | Movement | Bewegungs-Komponente | keine |
| ReplaySystem | Replay | Spiel-Aufnahme/Wiedergabe | EventBus |
| CollisionHandler | Utility | Kollisionserkennung | Maze, Grid |
| ScoreSystem | Utility | Score-Management | EventBus |

## Nächste Schritte

1. ✅ System-Dateien identifizieren
2. ⏳ Klassifizierung dokumentieren
3. ⏳ Abhängigkeits-Graph erstellen
4. ⏳ Wiederverwendbare Module identifizieren
5. ⏳ Vorbereitung für Unified Export Pattern

## Status

Phase 5 gestartet: [2026-03-02 18:05 UTC]
