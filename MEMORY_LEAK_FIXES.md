# Memory Leak Fixes

**Gefundene potentielle Lecks:** 2  
**Geschätzter Aufwand:** 30 Minuten

---

## Leak 1: TechSoundManager.js - setInterval ohne Cleanup

### Problem

**Datei:** `src/managers/TechSoundManager.js:162`

```javascript
// Zeile 162
this.enemyModeAudio = setInterval(() => {
    if (this.soundBuilder) {
        this.soundBuilder.buildSound({
            type: 'sweep',
            params: config
        }, config.volume);
    }
}, 2000);
```

**Problem:** `clearInterval` wird nur in `stopEnemyModeAudio()` aufgerufen, nicht in einer `destroy()` Methode.

### Fix

**Datei:** `src/managers/TechSoundManager.js`

```javascript
// Hinzufügen am Ende der Klasse (nach Zeile 434)

/**
 * Clean up all audio resources
 * IMPORTANT: Must be called when scene is destroyed
 */
destroy() {
    // Clear enemy mode interval
    this.stopEnemyModeAudio();
    
    // Clear circuit hum if exists
    if (this.circuitHumAudio) {
        clearInterval(this.circuitHumAudio);
        this.circuitHumAudio = null;
    }
    
    // Destroy sound engine
    if (this.soundEngine) {
        this.soundEngine.destroy();
        this.soundEngine = null;
    }
    
    // Clear references
    this.soundBuilder = null;
    this.soundBank = null;
    this.scene = null;
    this.initialized = false;
}
```

**Zusätzlich in SoundEngine.js hinzufügen:**

```javascript
// src/audio/core/SoundEngine.js

/**
 * Destroy the audio context and clean up
 */
destroy() {
    if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
    }
    this.gainNode = null;
    this.initialized = false;
}
```

---

## Leak 2: InputManager.js - setTimeout ohne Cleanup

### Problem

**Datei:** `src/input/InputManager.js:249-258`

```javascript
// Zeile 249-258
async tempSwitch(tempAdapter, duration) {
    const previousAdapters = this.getActiveAdapters();
    this.setActiveAdapter(tempAdapter);

    return new Promise(resolve => {
        setTimeout(() => {
            this.setActiveAdapter(previousAdapters);
            resolve();
        }, duration);
    });
}
```

**Problem:** Wenn `destroy()` während des Timeouts aufgerufen wird, läuft der Callback trotzdem weiter.

### Fix

**Datei:** `src/input/InputManager.js`

```javascript
// Am Anfang der Klasse (Konstruktor)
constructor() {
    this.adapters = new Map();
    this.activeAdapters = new Set();
    this.globalListeners = [];
    this.inputHistory = [];
    this.isPaused = false;
    this.pendingTimeouts = new Set(); // NEU
}

// tempSwitch Methode anpassen
async tempSwitch(tempAdapter, duration) {
    const previousAdapters = this.getActiveAdapters();
    this.setActiveAdapter(tempAdapter);

    return new Promise(resolve => {
        const timeoutId = setTimeout(() => {
            this.pendingTimeouts.delete(timeoutId); // NEU
            this.setActiveAdapter(previousAdapters);
            resolve();
        }, duration);
        
        this.pendingTimeouts.add(timeoutId); // NEU
    });
}

// destroy Methode erweitern
destroy() {
    // Clear all pending timeouts
    this.pendingTimeouts.forEach(id => clearTimeout(id));
    this.pendingTimeouts.clear();
    
    // Destroy all adapters
    this.adapters.forEach(adapter => adapter.destroy());
    this.adapters.clear();
    this.activeAdapters.clear();
    this.globalListeners = [];
    this.inputHistory = [];
}
```

---

## Leak 3: GameController.js - Event Listener ohne Cleanup

### Problem

**Datei:** `src/controllers/GameController.js:66-101`

```javascript
// Event-Listener werden registriert, aber nicht bei destroy() entfernt
gameEvents.on('GAME_WIN', (data) => { ... });
gameEvents.on('GAME_OVER', (data) => { ... });
// ... weitere 5 Listener
```

### Fix

**Datei:** `src/controllers/GameController.js`

```javascript
// Am Anfang der Klasse
constructor(config) {
    // ... existing code ...
    this.eventUnsubscribers = []; // NEU
}

// In initEvents() Methode
initEvents() {
    // Store unsubsribers
    this.eventUnsubscribers.push(
        gameEvents.on('GAME_WIN', (data) => this.handleGameWin(data)),
        gameEvents.on('GAME_OVER', (data) => this.handleGameOver(data)),
        gameEvents.on('RETURN_TO_MENU', (data) => this.returnToMenu(data)),
        gameEvents.on('PAUSE_GAME', (data) => this.togglePause(data)),
        gameEvents.on('OPEN_SETTINGS', (data) => this.openSettings(data)),
        gameEvents.on('NAVIGATE_TO_SCENE', (data) => this.navigateToScene(data))
    );
}

// destroy Methode hinzufügen
destroy() {
    // Unsubscribe from all events
    this.eventUnsubscribers.forEach(unsub => unsub());
    this.eventUnsubscribers = [];
    
    // Clear input manager
    if (this.inputManager) {
        this.inputManager.destroy();
        this.inputManager = null;
    }
    
    // Clear model reference
    this.model = null;
}
```

---

## Implementation Checklist

- [ ] `TechSoundManager.destroy()` hinzufügen
- [ ] `SoundEngine.destroy()` hinzufügen
- [ ] `InputManager.pendingTimeouts` Tracking hinzufügen
- [ ] `InputManager.destroy()` erweitern
- [ ] `GameController.eventUnsubscribers` hinzufügen
- [ ] `GameController.destroy()` hinzufügen
- [ ] Tests für Memory-Leak-Fixes schreiben

---

## Test für Memory Leaks

```javascript
// tests/memory/MemoryLeak.test.js

describe('Memory Leak Prevention', () => {
    describe('TechSoundManager', () => {
        test('should clear interval on destroy', () => {
            const manager = new TechSoundManager(mockScene);
            manager.initialize();
            manager.startEnemyModeAudio('encrypted');
            
            expect(manager.enemyModeAudio).not.toBeNull();
            
            manager.destroy();
            
            expect(manager.enemyModeAudio).toBeNull();
            expect(manager.soundEngine).toBeNull();
        });
    });
    
    describe('InputManager', () => {
        test('should clear pending timeouts on destroy', async () => {
            const manager = new InputManager();
            const adapter = new MockAdapter();
            manager.registerAdapter('mock', adapter);
            
            // Start temp switch with long duration
            const promise = manager.tempSwitch('other', 10000);
            
            // Destroy before timeout completes
            manager.destroy();
            
            // Timeout should be cleared
            expect(manager.pendingTimeouts.size).toBe(0);
        });
    });
    
    describe('GameController', () => {
        test('should unsubscribe from all events on destroy', () => {
            const controller = new GameController(config);
            controller.initEvents();
            
            const initialListenerCount = gameEvents.listenerCount('GAME_WIN');
            
            controller.destroy();
            
            expect(gameEvents.listenerCount('GAME_WIN')).toBe(initialListenerCount - 1);
        });
    });
});
```

---

## Verifikation

Nach dem Fix:

1. **Chrome DevTools Memory Profile:**
   - Vorher/Nachher Heap Snapshots erstellen
   - Keine wachsende Anzahl von Event Listeners
   - Keine angehaltenen Intervals/Timeouts

2. **Automatisierter Test:**
   ```bash
   npm test -- tests/memory/MemoryLeak.test.js
   ```

3. **Manual Smoke Test:**
   - Spiel 5 Minuten spielen
   - Scene mehrfach wechseln
   - Memory-Verbrauch sollte stabil bleiben
