# Phase 6: Scene-Refactoring

## Ziel
Scenes in logische Kategorien gruppieren und gemeinsam genutzte Logik extrahieren

## Status
✅ Scenes auditiert und kategorisiert

## Scene-Übersicht

### Main-Scenes
- src/scenes/MenuScene.js - Hauptmenü
- src/scenes/GameScene.js - Haupt-Spiel-Scene
- src/scenes/PauseScene.js - Pause-Menü
- src/scenes/GameOverScene.js - Game Over
- src/scenes/WinScene.js - Gewonnen
- src/scenes/SettingsScene.js - Einstellungen

### Scene-Systeme
- src/scenes/systems/EffectManager.js - Visual Effects
- src/scenes/systems/UIController.js - UI-Steuerung
- src/scenes/systems/GameFlowController.js - Spiel-Flow
- src/scenes/systems/InputController.js - Input-Verarbeitung
- src/scenes/systems/LevelManager.js - Level-Management
- src/scenes/systems/DeathHandler.js - Todes-Logik

## Vorgeschlagene Neustrukturierung

```
src/scenes/
├── main/                           # Main Scenes
│   ├── MenuScene.js              # (existiert)
│   ├── GameScene.js             # (existiert)
│   ├── PauseScene.js            # (existiert)
│   ├── GameOverScene.js         # (existiert)
│   ├── WinScene.js              # (existiert)
│   ├── SettingsScene.js         # (existiert)
│   └── index.js                # Export main scenes
├── systems/                        # Scene-Systeme (gemeinsam genutzte Logik)
│   ├── EffectManager.js         # (existiert)
│   ├── UIController.js         # (existiert)
│   ├── GameFlowController.js    # (existiert)
│   ├── InputController.js       # (existiert)
│   ├── LevelManager.js          # (existiert)
│   ├── DeathHandler.js         # (existiert)
│   └── index.js                # Export scene systems
└── index.js                        # Export aller scenes
```

## Gemeinsame Scene-Logik

### BaseScene
Abstrakte Klasse für alle Scenes mit gemeinsamer Funktionalität:
- Lifecycle-Management (create, update, destroy)
- Event-Binding
- Sound-Management
- Resize-Handling

### Scene-Manager
Zentrale Verwaltung aller Scenes:
- Scene-Transitions
- Scene-Stack (für Back-Navigation)
- Scene-State-Management

## Vorteile
- Wiederverwendbarkeit von Scene-Logik
- Konsistentes Scene-API
- Einfacheres Testing durch Isolierung
- Bessere Übersicht der Scene-Architektur

## Nächste Schritte
- BaseScene erstellen
- Scene-Manager erstellen
- Scenes von BaseScene erweitern
- Scene-Systeme konsolidieren
