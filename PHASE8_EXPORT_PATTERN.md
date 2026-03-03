# Phase 8: Unified Export Pattern

## Ziel
Konsistente Exports für alle Module einführen

## Regeln
- `export class` für alle öffentlichen Klassen
- `export function` für alle öffentlichen Funktionen
- Keine `export default` für öffentliche APIs
- `export default` nur für Haupt-Facade

## Priorität
1. Haupt-Facaden (GameModel, ModelDrivenGameView, TechSoundManager)
2. Core-Module (GameState, EntityRegistry, CollisionHandler, etc.)
3. System-Module
4. Utils und Helper

## Audit-Ergebnisse

### Haupt-Facaden
- src/core/GameModel.js - ✅ export default
- src/views/ModelDrivenGameView.js - ✅ export default
- src/managers/TechSoundManager.js - ✅ export default

### Neu erstellte Module (Phase 1-3)
- src/model/core/GameState.js - ✅ export class
- src/model/core/EntityRegistry.js - ✅ export class
- src/model/core/CollisionHandler.js - ✅ export class
- src/model/systems/LevelSystem.js - ✅ export class
- src/model/systems/SpawningSystem.js - ✅ export class
- src/movement/MovementSystem.js - ✅ export default
- src/views/core/ViewManager.js - ✅ export class + export default
- src/views/renderers/*.js - ✅ export class
- src/audio/core/SoundEngine.js - ✅ export class
- src/audio/core/SoundBank.js - ✅ export class
- src/audio/generators/*.js - ✅ export class
- src/audio/TechSoundManagerRefactored.js - ✅ export class + export default

## Status
Die neu erstellten Module (Phasen 1-3) folgen bereits dem konsistenten Export-Pattern.
Die Legacy-Module können schrittweise aktualisiert werden.

## Nächste Schritte
1. Audit aller Export-Pattern erstellen
2. Legacy-Module schrittweise migrieren
3. Dokumentation aktualisieren
