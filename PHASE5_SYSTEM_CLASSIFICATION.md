# Phase 5: System-Klassifizierung

## Ziel
Klare Abgrenzung zwischen Core- und Feature-Systemen

## Status
✅ Systeme identifiziert und klassifiziert

## Core-Systeme (immer aktiv)

### Model-Systeme
- src/model/systems/ScoreModule.js - Score-Berechnung
- src/model/systems/SessionModule.js - Session-Management
- src/model/systems/PlayerModule.js - Player-State
- src/model/systems/LevelSystem.js - Level-Progression
- src/model/systems/SpawningSystem.js - Entity-Spawning

### Core-Systeme
- src/movement/MovementSystem.js - Bewegungslogik
- src/systems/FixedTimeStepLoop.js - Game Loop Timing
- src/scenes/systems/EffectManager.js - Visual Effects

## Feature-Systeme (optional / erweiterbar)

### AI-Systeme
- src/systems/GhostAISystem.js - Ghost AI
- src/systems/EnemyAISystem.js - Enemy AI
- src/systems/PlayerAI.js - Player AI (Debug/Replay)
- src/systems/PacmanAI.js - Pacman AI

### Feature-Systeme
- src/systems/BossBattleSystem.js - Boss-Kämpfe
- src/systems/StoryMode.js - Story-Modus
- src/systems/AdditionalPowerUpSystem.js - Power-Ups
- src/systems/AchievementSystem.js - Achievements
- src/systems/ReplaySystem.js - Replays

### Debug-Systeme
- src/systems/DebugOverlay.js - Debug UI

## Vorgeschlagene Neustrukturierung

```
src/systems/
├── core/                           # Core-Systeme (immer aktiv)
│   ├── GameStateSystem.js          # Zustandsverwaltung
│   ├── CollisionSystem.js          # Kollisionserkennung
│   ├── MovementSystem.js           # Bewegungslogik (existiert)
│   ├── ScoreSystem.js             # Score-Berechnung (aus ScoreModule)
│   ├── LevelSystem.js             # Level-Progression (existiert)
│   ├── SpawningSystem.js          # Entity-Spawning (existiert)
│   ├── EffectSystem.js            # Effekt-Management (aus EffectManager)
│   └── TimeStepSystem.js         # Game Loop Timing (aus FixedTimeStepLoop)
├── features/                       # Feature-Systeme (optional)
│   ├── AISystem.js                 # AI-Logik (konsolidiert)
│   ├── AchievementSystem.js       # Achievements (existiert)
│   ├── BossBattleSystem.js        # Boss-Kämpfe (existiert)
│   ├── StoryMode.js              # Story-Modus (existiert)
│   ├── PowerUpSystem.js          # Power-Ups (aus AdditionalPowerUpSystem)
│   └── ReplaySystem.js           # Replays (existiert)
└── index.js                        # Export aller Systeme
```

## Nächste Schritte
- Core-Systeme konsolidieren
- Feature-Systeme in features/ verschieben
- Konsistente API für alle Systeme
- System-Registry erstellen
