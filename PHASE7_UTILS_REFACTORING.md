# Phase 7: Utils-Refactoring

## Ziel
Utils in logische Kategorien gruppieren und konsolidieren

## Status
✅ Utils auditiert und kategorisiert

## Utils-Übersicht

### Maze-Utils
- src/utils/MazeLayout.js - Maze Konstanten und Hilfsfunktionen
- src/utils/MazeGenerator.js - Maze Generierung
- src/utils/WarpTunnel.js - Warp-Tunnel Logik
- src/utils/TileMath.js - Tile-Berechnungen
- src/utils/TileMovement.js - Tile-Bewegung

### Movement-Utils
- src/utils/movement/DirectionBuffer.js - Richtungs-Puffer
- src/utils/movement/EntityValidator.js - Entity-Validierung
- src/utils/movement/MovementState.js - Bewegungs-State

### Core-Utils
- src/utils/Time.js - Zeit-Hilfsfunktionen
- src/utils/CollisionUtils.js - Kollisions-Hilfsfunktionen
- src/utils/ErrorUtils.js - Error-Handler
- src/utils/DebugLogger.js - Debug-Logging

### Gameplay-Utils
- src/utils/SpawnValidator.js - Spawn-Validierung

### UI-Utils
- src/utils/LogoCreator.js - Logo-Erstellung

## Vorgeschlagene Neustrukturierung

```
src/utils/
├── maze/
│   ├── MazeLayout.js              # (existiert)
│   ├── MazeGenerator.js           # (existiert)
│   ├── WarpTunnel.js             # (existiert)
│   ├── TileMath.js               # (existiert)
│   ├── TileMovement.js           # (existiert)
│   └── index.js                 # Export maze utils
├── movement/
│   ├── DirectionBuffer.js         # (existiert)
│   ├── EntityValidator.js        # (existiert)
│   ├── MovementState.js          # (existiert)
│   └── index.js                 # Export movement utils
├── core/
│   ├── Time.js                   # (existiert)
│   ├── CollisionUtils.js         # (existiert)
│   ├── ErrorUtils.js             # (aus ErrorHandler.js)
│   ├── DebugLogger.js            # (existiert)
│   └── index.js                 # Export core utils
├── gameplay/
│   ├── SpawnValidator.js          # (existiert)
│   └── index.js                 # Export gameplay utils
├── ui/
│   ├── LogoCreator.js            # (existiert)
│   └── index.js                 # Export ui utils
└── index.js                      # Export aller utils
```

## Vorteile
- Bessere Navigation durch Kategorisierung
- Klare Abgrenzung der Verantwortlichkeiten
- Einfacheres Testing durch Fokussierung

## Nächste Schritte
- Utils in Kategorien organisieren
- index.js Dateien für jeden Kategorienordner erstellen
- Haupt-index.js erstellen, der alle Utils exportiert
