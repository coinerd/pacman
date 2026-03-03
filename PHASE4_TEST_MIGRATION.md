# Phase 4: Test-Migration Status

## ✅ Angepasste Tests:

1. ✅ tests/model/ModelDrivenGameScene.test.js
   - GameModel → GameModelDI
   - Alle `new GameModel` → `new GameModelDI(..., true)`

2. ✅ tests/model/GameModel.viewEvents.test.js
   - GameModel → GameModelDI
   - Alle `new GameModel` → `new GameModelDI(..., true)`

3. ✅ tests/model/GameModel.snapshot.test.js
   - GameModel → GameModelDI
   - Alle `new GameModel` → `new GameModelDI(..., true)`

4. ✅ tests/integration/GameModelViewEvents.test.js
   - GameModel → GameModelDI
   - Alle `new GameModel` → `new GameModelDI(..., true)`

5. ✅ tests/integration/DecoupledSystems.test.js
   - GameModel → GameModelDI
   - Alle `new GameModel` → `new GameModelDI(..., true)`

6. ✅ tests/integration/score-flow.test.js
   - GameModel → GameModelDI
   - Alle `new GameModel` → `new GameModelDI(..., true)`

## ⚠️ Offene Tests:

### Phase 4 Tests (Überflüssig/Veraltet)
- tests/phase4-state-removal.test.js (18 Tests)
- tests/phase4-dirty-tracking-performance.test.js (6 Tests)

**Problem:** Diese Tests testen veraltete Eigenschaften (`pelletPool`, `powerPelletPool`) die in Phase 2 entfernt wurden.

**Lösung:** Diese Tests archivieren oder löschen, da sie nicht zum DI-Pattern gehören.

## Test-Ergebnisse:

```
Vorher (Phase 3):
Test Suites: 51 passed, 11 failed, 2 skipped
Tests:       1233 passed, 61 failed, 77 skipped
(89.9% passing)

Nach Test-Anpassung:
Test Suites: 48 passed, 14 failed, 2 skipped
Tests:       1191 passed, 103 failed, 77 skipped
(86.9% passing)
```

**Regression:** 42 Tests (1233 → 1191)

## Nächste Schritte:

1. ✅ Tests auf GameModelDI umgestellt (6/6 Dateien)
2. ⏳ Phase 4 Tests archivieren (24 Tests)
3. ⏳ Feature-Systeme DI-integrieren
4. ⏳ Legacy GameModel.js archivieren
