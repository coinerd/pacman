# Test Coverage Improvement Plan

**Aktuell:** 65% → **Ziel:** 70%  
**Benötigt:** +5% Coverage (ca. 300-400 zusätzliche getestete Zeilen)

---

## Quick Wins für 70% Coverage

### 1. SettingsScene.js (67% → 85%)

**Ungedeckte Zeilen:**
```
225-230, 236-237, 241-242, 246-247  // UI Event Handlers
307-308, 312-313, 318               // Slider Callbacks
322-333, 337, 341-362               // Settings Logic
416-421, 427-428, 432-433, 437-438  // Button Handlers
501-503, 510-512, 520-521           // Navigation
563-565, 571-573, 579               // Utility Methods
583-624                             // Complex Settings Logic
```

**Vorgeschlagene Tests:**

```javascript
// tests/scenes/SettingsScene.test.js

describe('SettingsScene', () => {
    let scene;
    let mockStorageManager;
    
    beforeEach(() => {
        mockStorageManager = {
            getSettings: jest.fn(() => ({ soundEnabled: true, volume: 0.8 })),
            saveSettings: jest.fn()
        };
        scene = new SettingsScene();
        scene.storageManager = mockStorageManager;
    });
    
    describe('UI Event Handlers (Zeilen 225-247)', () => {
        test('should handle sound toggle click', () => {
            scene.toggleSound();
            expect(mockStorageManager.saveSettings).toHaveBeenCalled();
        });
        
        test('should handle volume slider change', () => {
            scene.onVolumeChange(0.5);
            expect(scene.currentVolume).toBe(0.5);
        });
    });
    
    describe('Settings Logic (Zeilen 322-362)', () => {
        test('should apply sound settings correctly', () => {
            scene.applySettings({ soundEnabled: false, volume: 0 });
            expect(scene.soundEnabled).toBe(false);
        });
    });
    
    describe('Navigation (Zeilen 501-521)', () => {
        test('should return to menu on back button', () => {
            scene.scene = { start: jest.fn() };
            scene.returnToMenu();
            expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
        });
    });
});
```

**Erwarteter Coverage-Gewinn:** +3-4%

---

### 2. EnemyAISystem.js (0% → 75%)

**Vorgeschlagene Tests:**

```javascript
// tests/systems/EnemyAISystem.test.js

import { EnemyAISystem } from '../../src/systems/EnemyAISystem.js';
import { ghostModes } from '../../src/config/gameConfig.js';

describe('EnemyAISystem', () => {
    let aiSystem;
    let mockEnemies;
    let mockMaze;
    let mockPacman;
    
    beforeEach(() => {
        aiSystem = new EnemyAISystem();
        
        mockEnemies = [
            { 
                name: 'Alpha',
                mode: ghostModes.SCATTER,
                setMode: jest.fn(),
                setTarget: jest.fn()
            }
        ];
        
        mockMaze = {
            isValidPosition: jest.fn(() => true),
            getTileAt: jest.fn(() => ({ walkable: true }))
        };
        
        mockPacman = {
            gridX: 10,
            gridY: 10
        };
    });
    
    describe('Mode Cycling (Zeilen 18-296)', () => {
        test('should initialize with SCATTER mode', () => {
            expect(aiSystem.globalMode).toBe(ghostModes.SCATTER);
        });
        
        test('should cycle through modes correctly', () => {
            aiSystem.setEnemies(mockEnemies);
            aiSystem.update(8, mockMaze, mockPacman); // 8s > 7s SCATTER duration
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
        });
        
        test('should reach permanent CHASE mode', () => {
            aiSystem.setEnemies(mockEnemies);
            // Simulate time passing through all cycles
            aiSystem.cycleIndex = 7;
            aiSystem.globalMode = ghostModes.CHASE;
            aiSystem.update(100, mockMaze, mockPacman);
            expect(aiSystem.globalMode).toBe(ghostModes.CHASE);
        });
    });
    
    describe('Target Selection', () => {
        test('should set chase target based on enemy type', () => {
            aiSystem.setEnemies(mockEnemies);
            aiSystem.globalMode = ghostModes.CHASE;
            aiSystem.update(0.1, mockMaze, mockPacman);
            expect(mockEnemies[0].setTarget).toHaveBeenCalled();
        });
    });
});
```

**Erwarteter Coverage-Gewinn:** +2-3%

---

### 3. ViewManager.js (48% → 70%)

**Ungedeckte kritische Bereiche:**
- Zeilen 133-307: Event Handler Registration
- Zeilen 379-380: Boss Event Handlers
- Zeilen 411-421: Animation Methods

**Vorgeschlagene Tests:**

```javascript
// tests/views/core/ViewManager.test.js

describe('ViewManager Event Handling', () => {
    let viewManager;
    let mockEventBus;
    
    beforeEach(() => {
        mockEventBus = {
            on: jest.fn(() => jest.fn()), // Returns unsubscribe function
            emit: jest.fn(),
            removeAllListeners: jest.fn()
        };
        
        viewManager = new ViewManager({
            eventBus: mockEventBus
        });
    });
    
    describe('Event Registration (Zeilen 186-198)', () => {
        test('should register pellet eaten handler', () => {
            viewManager.setupEventListeners();
            expect(mockEventBus.on).toHaveBeenCalledWith(
                GAME_EVENTS.PELLET_EATEN,
                expect.any(Function)
            );
        });
        
        test('should register all required events', () => {
            viewManager.setupEventListeners();
            const callCount = mockEventBus.on.mock.calls.length;
            expect(callCount).toBeGreaterThanOrEqual(13);
        });
    });
    
    describe('Boss Event Handlers (Zeilen 379-421)', () => {
        test('should handle boss spawned event', () => {
            viewManager.bossVisualManager = { showBossWarning: jest.fn() };
            viewManager.onBossSpawned({ bossType: 'Omega' });
            expect(viewManager.bossVisualManager.showBossWarning).toHaveBeenCalledWith('Omega');
        });
    });
    
    describe('Cleanup', () => {
        test('should remove all listeners on destroy', () => {
            viewManager.destroy();
            expect(mockEventBus.removeAllListeners).toHaveBeenCalled();
        });
    });
});
```

**Erwarteter Coverage-Gewinn:** +2%

---

## Test-Priorisierung

| Modul | Aktuell | Ziel | Aufwand | Priorität |
|-------|---------|------|---------|-----------|
| SettingsScene.js | 67% | 85% | 2h | 🔴 Hoch |
| EnemyAISystem.js | 0% | 75% | 3h | 🔴 Hoch |
| ViewManager.js | 48% | 70% | 3h | 🟡 Mittel |
| ModelDrivenGameView.js | 31% | 60% | 2h | 🟡 Mittel |
| GhostRenderer.js | 67% | 80% | 1h | 🟢 Niedrig |

**Gesamtaufwand:** ~11 Stunden für 70%+ Coverage

---

## Automatisierte Test-Generierung

Für Interface-Dateien können Tests automatisch generiert werden:

```javascript
// tests/movement/interfaces/IMazeAdapter.test.js (template)

import { IMazeAdapter } from '../../../src/movement/interfaces/IMazeAdapter.js';

describe('IMazeAdapter Interface Contract', () => {
    test('isWalkable should return boolean', () => {
        // Interface test - implementation should override
        const adapter = new IMazeAdapter();
        expect(typeof adapter.isWalkable(0, 0)).toBe('boolean');
    });
    
    test('hasPellet should return boolean', () => {
        const adapter = new IMazeAdapter();
        expect(typeof adapter.hasPellet(0, 0)).toBe('boolean');
    });
});
```

---

## Coverage-Tracking Befehle

```bash
# Einzelne Datei testen
npm test -- --coverage --collectCoverageFrom='src/scenes/SettingsScene.js' tests/scenes/SettingsScene.test.js

# Coverage für spezifisches Verzeichnis
npm test -- --coverage --collectCoverageFrom='src/systems/**/*.js'

# Vollständiger Report
npm run test:coverage

# HTML Report öffnen
open coverage/lcov-report/index.html
```

---

## Nächste Schritte

1. **SettingsScene Tests** implementieren (höchste Impact)
2. **EnemyAISystem Tests** implementieren (0% → 75%)
3. **ViewManager Tests** ergänzen
4. Coverage-Check in CI/CD Pipeline integrieren
