# ESLint Fix Plan

**Aktuell:** 190 Warnings, 0 Errors  
**Ziel:** <50 Warnings  
**Geschätzter Aufwand:** 2 Stunden

---

## Warning-Kategorien

### 1. Unused Parameters in Interface Methods (~110 Warnings)

**Betroffene Dateien:**
- `src/movement/interfaces/*.js` (3 Dateien)
- `src/core/ServiceRegistry.js`
- `src/core/FeatureSystems.js`

**Problem:**
Interface-Methoden definieren Parameter, die in der Standard-Implementierung nicht verwendet werden.

**Lösung:**
Parameter mit `_` prefixen, um ESLint zu signalisieren, dass sie absichtlich nicht verwendet werden.

**Beispiel:**

```javascript
// VORHER (Warning)
isWalkable(gridX, gridY) {
    return false;
}

// NACHHER (Keine Warning)
isWalkable(_gridX, _gridY) {
    return false;
}
```

**Automatischer Fix:**

```bash
# Für ServiceRegistry.js
sed -i "s/(container)/(_container)/g" src/core/ServiceRegistry.js

# Für Interface-Dateien
for file in src/movement/interfaces/*.js; do
    # Parameter in Methoden-Definitionen mit _ prefixen
    sed -i -E "s/\(([a-zA-Z]+)\s*\)\s*\{/(_\1) {/g" "$file"
done
```

---

### 2. Unused Variables in Tests (~50 Warnings)

**Betroffene Dateien:**
- `tests/model/GameModelDI.test.js`
- `tests/utils/testHelpers.js`
- `tests/systems/*.test.js`

**Problem:**
In Tests werden oft Variablen destrukturiert, aber nicht alle verwendet.

**Lösung:**
Entweder `_` prefixen oder entfernen.

**Beispiel:**

```javascript
// VORHER (Warning)
const { maze, config, entities } = setupTestGame();

// NACHHER (Keine Warning) - Option 1: Entfernen
const { maze } = setupTestGame();

// NACHHER (Keine Warning) - Option 2: Prefix
const { maze, config: _config, entities: _entities } = setupTestGame();
```

---

### 3. Unused Imports in Source Files (~30 Warnings)

**Betroffene Dateien:**
- `src/model/core/GameModelDI.js`
- `src/movement/core/MovementEngine.js`

**Problem:**
Importierte Module werden nicht verwendet.

**Lösung:**
Entfernen oder verwenden.

**Beispiel GameModelDI.js:**

```javascript
// VORHER (Zeile 12-15)
import { registerFeatureSystems } from '../../core/ServiceRegistry.js';
import { Direction } from '../../movement/core/Direction.js';

// NACHHER - Entfernen, wenn wirklich nicht verwendet
// import { registerFeatureSystems } from '../../core/ServiceRegistry.js';
// import { Direction } from '../../movement/core/Direction.js';
```

**Hinweis:** Vor dem Entfernen prüfen, ob die Imports für Legacy-Modus benötigt werden!

---

## Automatisierte Fix-Strategie

### Schritt 1: Safe Auto-Fix

```bash
# Führe ESLint mit --fix aus (sichere Fixes nur)
npm run lint:fix
```

### Schritt 2: Interface-Parameter manuell fixen

```bash
# Script erstellen
cat > fix-interface-params.sh << 'EOF'
#!/bin/bash
# Fix unused parameters in interface files

for file in src/movement/interfaces/*.js src/core/ServiceRegistry.js src/core/FeatureSystems.js; do
    echo "Fixing $file..."
    
    # Container parameter
    sed -i 's/(container)/(_container)/g' "$file"
    sed -i 's/(container, /(_container, /g' "$file"
    
    # Grid coordinates
    sed -i 's/(gridX, gridY)/(_gridX, _gridY)/g' "$file"
    
    # Entity IDs
    sed -i 's/(entityId/(_entityId/g' "$file"
    
    # Other common params
    sed -i 's/(deltaTime)/(_deltaTime)/g' "$file"
    sed -i 's/(deltaSeconds/(_deltaSeconds/g' "$file"
    sed -i 's/(context)/(_context)/g' "$file"
    sed -i 's/(options)/(_options)/g' "$file"
    sed -i 's/(mazeGrid/(_mazeGrid/g' "$file"
    sed -i 's/(config)/(_config)/g' "$file"
done

echo "Done! Run 'npm run lint' to verify."
EOF

chmod +x fix-interface-params.sh
./fix-interface-params.sh
```

### Schritt 3: Test-Warnungen fixen

```bash
# Script für Test-Dateien
cat > fix-test-warnings.sh << 'EOF'
#!/bin/bash
# Fix unused variables in test files

# testHelpers.js
sed -i "s/'level'/'_level'/g" tests/utils/modelTestUtils.js
sed -i "s/'x'/'_x'/g" tests/utils/testHelpers.js
sed -i "s/'y'/'_y'/g" tests/utils/testHelpers.js

# GameModelDI.test.js
sed -i "s/(container)/(_container)/g" tests/model/GameModelDI.test.js

echo "Done!"
EOF

chmod +x fix-test-warnings.sh
./fix-test-warnings.sh
```

### Schritt 4: Unused Imports entfernen

```bash
# Manuelles Review erforderlich!
# Liste alle unused imports
npm run lint 2>&1 | grep "is defined but never used" | grep "import\|require"
```

---

## Manuelle Fixes (Review erforderlich)

### GameModelDI.js

```javascript
// Zeile 12: registerFeatureSystems - prüfen ob für Legacy-Modus benötigt
// Zeile 15: Direction - prüfen ob verwendet

// Falls nicht benötigt:
// Option A: Entfernen
// Option B: Mit // eslint-disable-next-line no-unused-vars kommentieren
```

### MovementEngine.js

```javascript
// Zeile 8: MovementComponent
// Falls nicht verwendet: entfernen
```

---

## ESLint-Konfiguration anpassen

Optional: ESLint-Regel für Interfaces lockern

```javascript
// eslint.config.js - Regel hinzufügen
{
    rules: {
        // Erlaubt unused parameters die mit _ beginnen
        'no-unused-vars': ['warn', { 
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_'
        }]
    }
}
```

---

## Verifikation

```bash
# Nach allen Fixes
npm run lint

# Erwartetes Ergebnis: <50 Warnings, 0 Errors
```

---

## Warning-Reduktion Timeline

| Schritt | Warnings vor Fix | Warnings nach Fix | Reduktion |
|---------|------------------|-------------------|-----------|
| Ausgangszustand | 190 | - | - |
| npm run lint:fix | 190 | 185 | -5 |
| Interface-Params fixen | 185 | 75 | -110 |
| Test-Warnings fixen | 75 | 25 | -50 |
| Unused Imports entfernen | 25 | 5 | -20 |
| **Endzustand** | **5** | - | **-185** |

---

## Nach dem Fix

1. **Alle Tests ausführen:**
   ```bash
   npm test
   ```

2. **Commit:**
   ```bash
   git add -A
   git commit -m "fix: reduce ESLint warnings from 190 to <50

   - Prefix unused interface parameters with _
   - Remove unused imports
   - Clean up test file warnings"
   ```

3. **CI/CD Check:**
   - Pipeline sollte grün sein
   - Keine neuen Warnings einführen
