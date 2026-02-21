# Entity Centering Deep Analysis & Fix Plan

## Status: ✅ IMPLEMENTIERT (2026-02-21)

## Problem-Beschreibung
Entities (Player, Enemies) werden nicht mittig zu den Tiles in Laufrichtung positioniert.

---

## Architektur-Analyse

### Datenfluss (Tile-Center Movement System)

```
GameModel.step(deltaTime)
    │
    ├── movementAdapter.updatePacman(pacman, deltaSeconds, direction)
    │       │
    │       ├── TileCenterMovementAdapter.updatePacman()
    │       │       │
    │       │       ├── if (moveProgress === 0):
    │       │       │       strategy.startMovement(entity, direction)
    │       │       │           - Setzt: prevGridX/Y = gridX/Y
    │       │       │           - Setzt: targetGridX/Y = neue Position
    │       │       │           - Setzt: moveProgress = 0.001
    │       │       │
    │       │       └── strategy.updateProgress(entity, deltaSeconds)
    │       │               - Erhöht: moveProgress += tilesPerSecond * deltaTime
    │       │               - Wenn moveProgress >= 1.0:
    │       │                       - Setzt: gridX/Y = targetGridX/Y
    │       │                       - Setzt: x/y = Tile-Center
    │       │                       - Setzt: moveProgress = 0
    │       │               - Sonst (0 < moveProgress < 1):
    │       │                       - Interpoliert: x/y zwischen prevCenter und nextCenter
    │       │
    │       └── Return: movement events
    │
    └── Visual Sync (ModelDrivenGameView.sync())
            │
            ├── VisualPlayer.sync()
            │       │
            │       ├── if (state.moveProgress > 0):
            │       │       - Berechnet prevCenter und nextCenter
            │       │       - LERP: sprite.x/y = prevCenter + (nextCenter - prevCenter) * moveProgress
            │       │
            │       └── else:
            │               - sprite.x/y = state.x/y
            │
            └── VisualEnemy.sync() - Ähnliche Logik
```

---

## Potentielle Problemquellen

### 1. REDUNDANTE INTERPOLATION
**Ort:** `TileCenterMovementStrategy.updateProgress()` + `VisualPlayer.sync()`

**Problem:** BEIDE interpolieren die Position:
- **Model** berechnet `entity.x/y` während der Bewegung
- **View** berechnet `sprite.x/y` erneut basierend auf `moveProgress`

```javascript
// Model (TileCenterMovementStrategy.updateProgress):
entity.x = prevCenterX + (nextCenterX - prevCenterX) * entity.moveProgress;

// View (VisualPlayer.sync):
this.sprite.x = prevCenterX + (nextCenterX - prevCenterX) * this.state.moveProgress;
```

**Analyse:** Dies ist zwar redundant, sollte aber zum gleichen Ergebnis führen.

---

### 2. INITIALISIERUNG BEI SPIELSTART
**Ort:** `ModelEntity.constructor()`

```javascript
// prevGridX/Y und targetGridX/Y werden auf gridX/Y gesetzt
this.prevGridX = gridX;
this.prevGridY = gridY;
this.targetGridX = gridX;
this.targetGridY = gridY;
```

**Problem:** Wenn das Spiel startet und sofort eine Bewegung initiiert wird, könnte es zu Timing-Problemen kommen.

---

### 3. BEWEGUNG BEI moveProgress = 0.001
**Ort:** `TileCenterMovementStrategy.startMovement()`

```javascript
entity.moveProgress = 0.001; // Start moving
```

**Problem:** Der erste Frame hat moveProgress = 0.001, dann wird sofort updateProgress aufgerufen:
- Frame 1: startMovement setzt moveProgress = 0.001
- Frame 1: updateProgress erhöht moveProgress (z.B. auf 0.05)
- Resultat: Erster Frame überspringt Position 0.001 bis 0.05

---

### 4. VISUAL SYNC VERWENDET state.x/y FÜR "AT REST"
**Ort:** `VisualPlayer.sync()`

```javascript
} else {
    // At rest - use exact grid position
    this.sprite.x = this.state.x;
    this.sprite.y = this.state.y;
}
```

**Problem:** Wenn `state.x/y` nicht korrekt aktualisiert wurde (z.B. bei Warp Tunnel), ist das Sprite falsch positioniert.

---

### 5. POLYGON ORIGIN OFFSET
**Ort:** `VisualPlayer.constructor()`

```javascript
this.sprite = scene.add.polygon(0, 0, hexagonPoints, cyanColor);
this.sprite.setOrigin(0.5, 0.5);
this.sprite.setPosition(playerState.x, playerState.y);
```

**Analyse:** Polygon wird bei (0,0) erstellt, Origin auf (0.5, 0.5) gesetzt, dann positioniert. Dies sollte korrekt sein.

**Aber:** Die Hexagon-Punkte sind bereits relativ zum Zentrum berechnet:
```javascript
hexagonPoints.push({
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle)
});
```

Da `setOrigin(0.5, 0.5)` bei einem Polygon die Punkte nicht verschiebt, sondern den Drehpunkt setzt, ist dies korrekt.

---

### 6. DIRECTION-BASIERTE VISUALISIERUNG
**Ort:** `VisualPlayer.sync()` - Eye Position

```javascript
const angle = this.state.direction.angle;
if (angle === 0) {
    this.eye.x = this.sprite.x + eyeOffset;
    this.eye.y = this.sprite.y - eyeOffset;
} else if (angle === 180) {
    // ...
}
```

**Problem:** Die Augen-Positionierung verwendet `this.state.direction.angle`, aber die Rotation des Sprites verwendet ebenfalls diesen Wert. Wenn die Richtung inkonsistent ist, könnten visuelle Artefakte auftreten.

---

### 7. GEGENWIND: Entity x/y WIRD ZWEIMAL AKTUALISIERT
**Ort:** `TileCenterMovementStrategy.updateProgress()` und `ModelEntity.updateMovement()`

**Problem:** Es gibt ZWEI Methoden, die `entity.x/y` aktualisieren:
1. `TileCenterMovementStrategy.updateProgress()` - Wird vom Adapter aufgerufen
2. `ModelEntity.updateMovement()` - Wird NICHT aufgerufen (in decoupled mode)

**Analyse:** In `useDecoupledSystems` mode wird nur die Strategy-Methode verwendet. Das ist korrekt.

---

## Debugging-Checkliste

### A. Position-Tracking hinzufügen

```javascript
// In VisualPlayer.sync()
console.log(`[Frame ${this._debugFrame}] moveProgress=${this.state.moveProgress.toFixed(3)} ` +
            `grid=(${this.state.gridX},${this.state.gridY}) ` +
            `target=(${this.state.targetGridX},${this.state.targetGridY}) ` +
            `prev=(${this.state.prevGridX},${this.state.prevGridY}) ` +
            `modelPos=(${this.state.x.toFixed(1)},${this.state.y.toFixed(1)}) ` +
            `spritePos=(${this.sprite.x.toFixed(1)},${this.sprite.y.toFixed(1)})`);
```

### B. Tile-Center Visualisierung

Temporär Tiles sichtbar machen, um Zentren zu prüfen:
```javascript
// In createMaze() - Debug-Overlays für Tile-Center
for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] !== TILE_TYPES.WALL) {
            const pixel = gridToPixel(x, y);
            this.scene.add.circle(pixel.x, pixel.y, 2, 0xff0000, 0.3);
        }
    }
}
```

### C. Movement-Start Logging

```javascript
// In TileCenterMovementStrategy.startMovement()
console.log(`[START] From grid(${entity.gridX},${entity.gridY}) to grid(${targetGridX},${targetGridY}) ` +
            `prevGrid=(${entity.prevGridX},${entity.prevGridY})`);
```

---

## Hypothesen-basierte Fix-Strategien

### HYPOTHese 1: Entity ist zum Bewegungsstart nicht am Tile-Center

**Symptom:** Wenn eine Bewegung startet, ist das Entity nicht exakt am Center des aktuellen Tiles.

**Test:** Prüfe ob `entity.x === entity.gridX * tileSize + tileSize/2` VOR `startMovement()`.

**Fix:**
```javascript
// In TileCenterMovementStrategy.startMovement()
startMovement(entity, direction) {
    // Ensure entity is at tile center before starting
    const tileSize = gameConfig.tileSize;
    entity.x = entity.gridX * tileSize + tileSize / 2;
    entity.y = entity.gridY * tileSize + tileSize / 2;

    // ... rest of method
}
```

---

### HYPOTHese 2: moveProgress = 0.001 überspringt ersten Frame

**Symptom:** Die erste Interpolation ist zu groß.

**Fix:**
```javascript
// In TileCenterMovementStrategy.startMovement()
entity.moveProgress = 0; // Statt 0.001

// In updateProgress(), ändere Bedingung:
if (entity.moveProgress >= 0) { // Statt > 0
    // ... increment and process
}
```

**Alternative:** Separaten `isMoving` Flag verwenden statt moveProgress > 0.

---

### HYPOTHese 3: Visual Interpolation ist nicht mit Model synchronisiert

**Symptom:** Sprite position weicht von Model position ab.

**Fix:**
```javascript
// In VisualPlayer.sync() - Direkt Model-Position verwenden
if (this.state.moveProgress > 0) {
    // Use model's interpolated position directly
    this.sprite.x = this.state.x;
    this.sprite.y = this.state.y;
} else {
    this.sprite.x = this.state.x;
    this.sprite.y = this.state.y;
}
```

**Begründung:** Da das Model bereits `entity.x/y` während der Bewegung interpoliert (in `TileCenterMovementStrategy.updateProgress()`), muss die View dies nicht erneut tun.

---

### HYPOTHese 4: Timing zwischen Model Update und Visual Sync

**Symptom:** Visual zeigt stale Werte.

**Analyse:** Prüfe ob `gameModel.step()` VOR `gameView.sync()` in der gleichen Frame aufgerufen wird.

**Fix:** Sicherstellen, dass die Update-Reihenfolge korrekt ist:
```javascript
// In Scene.update()
update(time, delta) {
    const deltaSeconds = delta / 1000;
    this.gameModel.step(deltaSeconds);  // 1. Model aktualisieren
    this.gameView.sync();                // 2. Visuals synchronisieren
}
```

---

## Priorisierter Fix-Plan

### Phase 1: Debugging-Infrastruktur [1h]
1. Logging in `VisualPlayer.sync()` hinzufügen
2. Tile-Center Debug-Overlays erstellen
3. Movement-Start/End Logging in Strategy

### Phase 2: Konsolidierung der Interpolation [2h]
**Problem:** Doppelte Interpolation in Model und View

**Lösung:**
- Interpolation NUR im Model (`TileCenterMovementStrategy.updateProgress`)
- View verwendet direkt `entity.x/y`

```javascript
// VisualPlayer.sync() - Vereinfacht
sync() {
    // Immer Model-Position verwenden (bereits interpoliert)
    this.sprite.x = this.state.x;
    this.sprite.y = this.state.y;

    // ... rest of visual updates (rotation, effects, etc.)
}
```

### Phase 3: Bewegungsstart-Konsistenz [1h]
**Problem:** Entity könnte nicht am Tile-Center sein, wenn Bewegung startet

**Lösung:**
```javascript
// TileCenterMovementStrategy.startMovement()
startMovement(entity, direction) {
    if (!entity || entity.moveProgress > 0) {
        return false;
    }

    const tileSize = gameConfig.tileSize;

    // KRITISCH: Stelle sicher, dass Entity am Tile-Center ist
    entity.x = entity.gridX * tileSize + tileSize / 2;
    entity.y = entity.gridY * tileSize + tileSize / 2;

    const targetGridX = entity.gridX + direction.x;
    const targetGridY = entity.gridY + direction.y;

    if (!this.canMoveTo(entity.gridX, entity.gridY, targetGridX, targetGridY)) {
        return false;
    }

    entity.prevGridX = entity.gridX;
    entity.prevGridY = entity.gridY;
    entity.targetGridX = targetGridX;
    entity.targetGridY = targetGridY;
    entity.direction = direction;
    entity.moveProgress = 0; // Start bei 0, nicht 0.001
    entity.isMoving = true;

    return true;
}
```

### Phase 4: Tests [1h]
1. Unit-Test: Entity ist nach resetPosition() am Tile-Center
2. Unit-Test: Entity ist am Tile-Center bei Bewegungsstart
3. Integration-Test: Visuelle Position stimmt mit Model-Position überein
4. Visuelle Prüfung im Browser

---

## Zu untersuchende Dateien

| Datei | Relevanz |
|-------|----------|
| `src/movement/strategies/TileCenterMovementStrategy.js` | Bewegungslogik, Interpolation |
| `src/model/adapters/TileCenterMovementAdapter.js` | Adapter für Movement |
| `src/view/visuals/VisualPlayer.js` | Visuelle Repräsentation |
| `src/view/visuals/VisualEnemy.js` | Visuelle Repräsentation |
| `src/model/ModelEntity.js` | Basis-Entity mit Position |
| `src/core/GameModel.js` | Game Loop, Update-Reihenfolge |
| `src/views/ModelDrivenGameView.js` | Sync zwischen Model und View |
| `src/scenes/GameScene.js` | Scene Update Loop |
| `src/config/gameConfig.js` | tileSize, mazeWidth |

---

## KRITISCHE FUNDE

### FUND 1: Doppelte Interpolation (Redundant aber korrekt)
**Status:** ✅ Kein Problem - beide Berechnungen sind identisch

Sowohl `TileCenterMovementStrategy.updateProgress()` als auch `VisualPlayer.sync()` berechnen die gleiche Interpolation. Das ist redundant, führt aber zum gleichen Ergebnis.

### FUND 2: Fixed Timestep vs. Variable Render Loop
**Status:** ⚠️ POTENTIELLES PROBLEM

**Architektur:**
```
ModelDrivenGameScene.update(delta)
    │
    ├── fixedTimeStepLoop.update(delta)  // Sammelt deltaTime
    │       └── Wenn accumulator >= FIXED_DT:
    │               └── fixedUpdate()
    │                       └── gameModel.step()
    │                               └── movementAdapter.updatePacman()
    │                                       └── TileCenterMovementStrategy.updateProgress()
    │                                               └── Erhöht moveProgress
    │
    └── gameView.sync()  // Wird JEDESN Frame aufgerufen!
            └── VisualPlayer.sync()
                    └── Interpoliert basierend auf state.moveProgress
```

**Problem:** Wenn `fixedUpdate()` NICHT aufgerufen wird (zu wenig deltaTime), bleibt `moveProgress` gleich, aber `sync()` interpoliert mit dem alten Wert. Die visuelle Bewegung ist dann "stotternd".

**Beispiel:**
- Frame 1: deltaTime = 16ms, fixedUpdate() wird 1x aufgerufen, moveProgress = 0.1
- Frame 2: deltaTime = 14ms, fixedUpdate() wird NICHT aufgerufen (accumulator < FIXED_DT), moveProgress = 0.1
- Frame 2: sync() interpoliert mit moveProgress = 0.1 → Entity bewegt sich nicht!

### FUND 3: Zwei verschiedene Scenes mit unterschiedlicher Logik
**Status:** ℹ️ Wichtig für Verständnis

1. **GameScene** (alt): Verwendet `Player.js` mit `performGridMovementStep()`
   - Movement ist direkt im Entity
   - Keine Model-View-Trennung
   - Position wird direkt aktualisiert

2. **ModelDrivenGameScene** (neu): Verwendet `GameModel` mit `TileCenterMovementStrategy`
   - Movement ist im Model
   - View synchronisiert nur
   - **Diese Scene wird vom Menu gestartet!**

### FUND 4: Entity x/y wird während Bewegung aktualisiert
**Status:** ✅ KORREKT

In `TileCenterMovementStrategy.updateProgress()`:
```javascript
} else {
    // Update x/y during movement for accurate collision detection
    const prevCenterX = entity.prevGridX * tileSize + tileSize / 2;
    const prevCenterY = entity.prevGridY * tileSize + tileSize / 2;
    const nextCenterX = entity.targetGridX * tileSize + tileSize / 2;
    const nextCenterY = entity.targetGridY * tileSize + tileSize / 2;

    entity.x = prevCenterX + (nextCenterX - prevCenterX) * entity.moveProgress;
    entity.y = prevCenterY + (nextCenterY - prevCenterY) * entity.moveProgress;
}
```

**Das bedeutet:** `entity.x/y` ist BEREITS interpoliert!

**Folge:** Die View muss NICHT erneut interpolieren, sondern kann direkt `entity.x/y` verwenden.

---

## ENDGÜLTIGER FIX-PLAN

### Fix 1: View verwendet Model-Position direkt (Vereinfachung)
**Datei:** `src/view/visuals/VisualPlayer.js`

**Änderung:**
```javascript
// VORHER:
if (this.state.moveProgress > 0) {
    const tileSize = gameConfig.tileSize;
    const prevCenterX = this.state.prevGridX * tileSize + tileSize / 2;
    const prevCenterY = this.state.prevGridY * tileSize + tileSize / 2;
    const nextCenterX = this.state.targetGridX * tileSize + tileSize / 2;
    const nextCenterY = this.state.targetGridY * tileSize + tileSize / 2;
    this.sprite.x = prevCenterX + (nextCenterX - prevCenterX) * this.state.moveProgress;
    this.sprite.y = prevCenterY + (nextCenterY - prevCenterY) * this.state.moveProgress;
} else {
    this.sprite.x = this.state.x;
    this.sprite.y = this.state.y;
}

// NACHHER:
// Model.x/y is always correctly interpolated - use directly
this.sprite.x = this.state.x;
this.sprite.y = this.state.y;
```

**Begründung:** Da `TileCenterMovementStrategy.updateProgress()` bereits `entity.x/y` interpoliert, ist die doppelte Berechnung in der View überflüssig und fehleranfällig.

### Fix 2: Gleiche Änderung für VisualEnemy
**Datei:** `src/view/visuals/VisualEnemy.js`

Gleiche Vereinfachung wie bei VisualPlayer.

### Fix 3: StartPosition sicherstellen
**Datei:** `src/movement/strategies/TileCenterMovementStrategy.js`

Bei `startMovement()` sicherstellen, dass das Entity am Tile-Center ist:
```javascript
startMovement(entity, direction) {
    if (!entity || entity.moveProgress > 0) {
        return false;
    }

    const tileSize = gameConfig.tileSize;

    // KRITISCH: Stelle sicher, dass Entity am exakten Tile-Center ist
    entity.x = entity.gridX * tileSize + tileSize / 2;
    entity.y = entity.gridY * tileSize + tileSize / 2;

    // ... rest of method
}
```

---

## Implementierungs-Reihenfolge

1. ✅ **Fix 1:** VisualPlayer.js vereinfacht - verwendet entity.x/y direkt
2. ✅ **Fix 2:** VisualEnemy.js vereinfacht - verwendet entity.x/y direkt
3. ✅ **Fix 3:** TileCenterMovementStrategy.startMovement() - erzwingt Tile-Center bei Start
4. ✅ **Tests:** Alle 2135 Tests bestanden (keine Regressionen)

---

## Durchgeführte Änderungen

### 1. VisualPlayer.js (Zeile 60-73)
**VORHER:** 20 Zeilen mit doppelter Interpolation
**NACHHER:** 8 Zeilen - direkt entity.x/y verwenden

```javascript
// Model.x/y is always correctly interpolated by TileCenterMovementStrategy
// No need to recalculate interpolation in the view
this.sprite.x = this.state.x;
this.sprite.y = this.state.y;
```

### 2. VisualEnemy.js (Zeile 157-173)
**VORHER:** 17 Zeilen mit doppelter Interpolation
**NACHHER:** 8 Zeilen - direkt entity.x/y verwenden

```javascript
// Model.x/y is always correctly interpolated by TileCenterMovementStrategy
// No need to recalculate interpolation in the view
this.sprite.x = this.state.x;
this.sprite.y = this.state.y;
```

### 3. TileCenterMovementStrategy.js (Zeile 38-42)
**HINZUGEFÜGT:** Tile-Center erzwingen bei Bewegungsstart

```javascript
// CRITICAL: Ensure entity is at exact tile center before starting movement
entity.x = entity.gridX * tileSize + tileSize / 2;
entity.y = entity.gridY * tileSize + tileSize / 2;
```

---

## Test-Ergebnisse

```
Test Suites: 2 skipped, 85 passed, 85 of 87 total
Tests:       90 skipped, 2135 passed, 2225 total
Time:        10.557 s
```

Keine Regressionen durch die Änderungen.

---

## Nächste Schritte

1. ✅ **Analyse abgeschlossen** - Probleme identifiziert
2. ✅ **Fix implementieren** - View vereinfachen
3. ✅ **Tests ausführen** - Regression testen
4. ⏳ **Visuelle Prüfung** - Im Browser verifizieren (`npm run dev`)
