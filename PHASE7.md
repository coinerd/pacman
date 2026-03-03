# Phase 7: Unified Export Pattern

## Ziele

1. Unified Exports für wiederverwendbare Module erstellen
2. Module für externe Bibliothek vorbereiten
3. `@pacman/core`, `@pacman/movement`, `@pacman/utils` Package-Struktur
4. Konsistente Import-Pfade einführen

---

## Wiederverwendbare Module (aus Phase 5)

### HIGH Reusability (8 Systeme):

**@pacman/movement:**
1. `MovementEngine` - Generic Movement Engine
2. `MovementComponent` - Generic Movement Component
3. `MovementSystem` - Movement Fassade

**@pacman/core:**
1. `LevelSystem` - Generic Level Progression
2. `SpawningSystem` - Generic Spawning
3. `AchievementSystem` - Generic Achievements
4. `ReplaySystem` - Generic Replay

**@pacman/utils:**
1. `MazeGenerator` - Maze Generation
2. `MazeLayout` - Maze Layout Utilities
3. `EventBus` - Generic Event Bus

---

## Package-Struktur

```
src/
├── packages/
│   ├── @pacman/movement/
│   │   ├── index.js (Unified Export)
│   │   ├── core/
│   │   │   ├── MovementEngine.js
│   │   │   ├── MovementComponent.js
│   │   │   └── Direction.js
│   │   ├── adapters/
│   │   │   └── MazeAdapter.js
│   │   └── ai/
│   │       └── AIController.js
│   ├── @pacman/core/
│   │   ├── index.js (Unified Export)
│   │   ├── systems/
│   │   │   ├── LevelSystem.js
│   │   │   ├── SpawningSystem.js
│   │   │   ├── AchievementSystem.js
│   │   │   └── ReplaySystem.js
│   │   ├── entities/
│   │   │   ├── PlayerState.js
│   │   │   ├── EnemyState.js
│   │   │   └── EntityRegistry.js
│   │   └── containers/
│   │       ├── ServiceContainer.js
│   │       └── ServiceRegistry.js
│   └── @pacman/utils/
│       ├── index.js (Unified Export)
│       ├── maze/
│       │   ├── MazeGenerator.js
│       │   └── MazeLayout.js
│       ├── events/
│       │   └── EventBus.js
│       └── config/
│           └── gameConfig.js (Shared)
```

---

## Unified Export Pattern

### Beispiel: @pacman/movement/index.js

```javascript
/**
 * @pacman/movement - Unified Exports
 */

// Core
export { MovementEngine } from './core/MovementEngine.js';
export { MovementComponent } from './core/MovementComponent.js';
export { Direction } from './core/Direction.js';

// Adapters
export { MazeAdapter } from './adapters/MazeAdapter.js';

// AI
export { AIController } from './ai/AIController.js';

// Fassade
export { MovementSystem } from './MovementSystem.js';
export { IMovementSystem } from './interfaces/IMovementSystem.js';

// Convenience
export default {
    MovementEngine,
    MovementComponent,
    Direction,
    MazeAdapter,
    AIController,
    MovementSystem,
    IMovementSystem
};
```

---

## Import-Pattern

### Vorher (Scattered Imports):

```javascript
import MovementEngine from '../movement/core/MovementEngine.js';
import MovementComponent from '../movement/core/MovementComponent.js';
import MazeAdapter from '../movement/adapters/MazeAdapter.js';
import AIController from '../movement/ai/AIController.js';
```

### Nachher (Unified Imports):

```javascript
import {
    MovementEngine,
    MovementComponent,
    MazeAdapter,
    AIController
} from '@pacman/movement';
```

---

## Nächste Schritte

1. ✅ Phase 7 Plan erstellt
2. ⏳ Unified Export Files erstellen:
   - `src/packages/@pacman/movement/index.js`
   - `src/packages/@pacman/core/index.js`
   - `src/packages/@pacman/utils/index.js`
3. ⏳ package.json für jeden Sub-Package erstellen
4. ⏳ Importe im Projekt aktualisieren
5. ⏳ Tests anpassen
6. ⏳ Dokumentation erstellen

## Status

Phase 7 gestartet: [2026-03-02 19:05 UTC]
