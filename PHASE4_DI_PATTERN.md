# Phase 4: Dependency-Injection-Pattern

## Ziel
Einheitliches DI-Pattern für lose Kopplung

## Status
✅ ServiceContainer erstellt (3.057 bytes)

## Beispiel-Verwendung

### Registrierung
```javascript
import { globalContainer } from '../core/ServiceContainer.js';
import { EventBus } from '../core/EventBus.js';
import { SoundManager } from '../managers/SoundManager.js';

// Singleton-Services
globalContainer.register('eventBus', (c) => new EventBus(), true);
globalContainer.register('soundManager', (c) => new SoundManager(c.get('eventBus')), true);

// Transient-Services (neue Instanz bei jedem get())
globalContainer.register('playerInput', (c) => new PlayerInputController(c.get('inputManager')), false);
```

### Nutzung
```javascript
// Services automatisch durch DI erhalten
const eventBus = globalContainer.get('eventBus');
const soundManager = globalContainer.get('soundManager');

// Singleton-Service wird nur einmal erstellt
const eventBus1 = globalContainer.get('eventBus');
const eventBus2 = globalContainer.get('eventBus');
console.log(eventBus1 === eventBus2); // true

// Transient-Service wird bei jedem get() neu erstellt
const input1 = globalContainer.get('playerInput');
const input2 = globalContainer.get('playerInput');
console.log(input1 === input2); // false
```

## Vorteile
- Lose Kopplung
- Einfacher zu testen (Mock-Service einfacher)
- Einfacher zu konfigurieren
- Bessere Kontrolle über Service-Lifecycles

## Nächste Schritte
- GameModel an DI anpassen
- ModelDrivenGameView an DI anpassen
- Tests mit DI umschreiben
