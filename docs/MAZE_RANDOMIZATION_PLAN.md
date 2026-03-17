# Maze Randomization Plan

**Erstellungsdatum:** 2026-03-17  
**Status:** Planungsphase  
**Ziel:** Erweiterung des bestehenden Maze-Generators um konfigurierbare Randomisierung

---

## 1. Zusammenfassung

Dieser Plan beschreibt die Erweiterung des bestehenden Maze-Generators um folgende Funktionen:

1. **Randomisierung** - Jedes Spiel ein einzigartiges Maze (seed-basiert reproduzierbar)
2. **Konfigurationsdatei** - Externe, tunable Konfiguration für Game Designer
3. **Regel-basierte Validierung** - Mazes müssen definierte Qualitätskriterien erfüllen
4. **Integration** - Nahtlose Einbindung in die bestehende Architektur

---

## 2. Analyse des aktuellen Maze-Generators

### 2.1 Bestehende Architektur

```
src/utils/
├── MazeGenerator.js          # Hauptkoordinator (Default-Config, Generation-Flow)
├── MazeLayout.js             # Tile-Types, Helper-Funktionen
├── SeededRandom.js           # Deterministischer RNG (bereits vorhanden!)
├── SpawnValidator.js         # Spawn-Point Validierung
└── maze/
    ├── MazeAlgorithms.js     # DFS, Cellular Automata, Extra Paths
    ├── MazeAesthetics.js     # Circuit-Stil, Symmetrie, Warp Tunnel
    ├── MazeUtils.js          # Virus Core, Pellets, Stats, Connectivity
    └── MazeValidation.js     # Umfassende Validierung (bereits sehr gut!)
```

### 2.2 Stärken des aktuellen Systems

- **Seed-basierter RNG bereits implementiert** (`SeededRandom.js`)
- **Umfassende Validierung** in `MazeValidation.js`:
  - Connectivity-Check (Flood Fill)
  - Alternative Paths (Edge-Disjoint)
  - Dead-End Density
  - Corridor Length
  - Spawn Safety Zone
- **Retry-Mechanismus** bereits in `MazeGenerator.generateWithRetries()`
- **Modulare Architektur** - leicht erweiterbar

### 2.3 Identifizierte Lücken

1. **Keine externe Konfigurationsdatei** - Config ist hardcoded in `DEFAULT_CONFIG`
2. **Keine Difficulty-Presets** - Keine vordefinierten Schwierigkeitsstufen
3. **Keine Level-spezifische Konfiguration** - Alle Level nutzen gleiche Parameter
4. **Keine Runtime-Konfiguration** - Config kann nicht zur Laufzeit geändert werden

---

## 3. Architektur-Design

### 3.1 Neue Dateistruktur

```
src/
├── config/
│   └── mazePresets/                    # NEU: Konfigurations-Presets
│       ├── default.json                # Standard-Konfiguration
│       ├── easy.json                   # Leichtes Maze
│       ├── medium.json                 # Mittleres Maze
│       ├── hard.json                   # Schweres Maze
│       ├── expert.json                 # Expert-Maze
│       └── custom.json                 # Benutzerdefiniert (Runtime-editierbar)
│
├── utils/
│   ├── MazeGenerator.js                # ERWEITERT: Nutzt MazeConfigLoader
│   ├── MazeConfigLoader.js             # NEU: Lädt/Merged Konfigurationen
│   ├── maze/
│   │   ├── MazeAlgorithms.js           # BESTEHEND
│   │   ├── MazeAesthetics.js           # BESTEHEND
│   │   ├── MazeUtils.js                # BESTEHEND
│   │   ├── MazeValidation.js           # BESTEHEND
│   │   └── MazeRules.js                # NEU: Regel-Definitionen
│   └── ...
```

### 3.2 Komponenten-Interaktion

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Game Scene                                  │
│   "Generiere Maze für Level 5 mit 'hard' Preset"                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MazeConfigLoader                               │
│   - Lädt Preset (hard.json)                                         │
│   - Merget mit Default-Config                                       │
│   - Wendet Level-Skalierung an                                      │
│   - Gibt finale MazeConfig zurück                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MazeGenerator                                  │
│   - Generiert Maze mit konfigurierten Parametern                    │
│   - Nutzt seeded RNG (reproduzierbar)                               │
│   - Retry bei Validierungsfehler                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MazeValidation                                 │
│   - Prüft gegen konfigurierte Regeln                                │
│   - Gibt Validierungsresultat zurück                                │
│   - Sammelt KPIs für Difficulty-Balancing                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Konfigurationsdatei-Format

### 4.1 JSON-Struktur (Beispiel: `hard.json`)

```json
{
  "$schema": "./mazeConfig.schema.json",
  "meta": {
    "name": "Hard",
    "description": "Challenging maze with complex paths",
    "author": "Game Designer",
    "version": "1.0.0"
  },
  
  "dimensions": {
    "width": 25,
    "height": 33,
    "aspectRatio": "fixed"
  },
  
  "generation": {
    "algorithm": "dfs",
    "pathDensity": 0.6,
    "deadEndFactor": 0.4,
    "cellularAutomataIterations": 1,
    "symmetry": "none",
    "extraPathDensity": 0.15
  },
  
  "rules": {
    "connectivity": {
      "minCoverage": 1.0,
      "requireAllWalkable": true
    },
    "alternativePaths": {
      "minPaths": 2,
      "toTargets": ["powerPellets", "ghostSpawns"]
    },
    "deadEnds": {
      "maxDensity": 0.25,
      "minCount": 5,
      "maxCount": 20
    },
    "corridors": {
      "maxLength": 10,
      "minWidth": 1
    },
    "spawnSafety": {
      "playerRadius": 3,
      "minFreedomSteps": 15,
      "minWalkableInRadius": 6
    },
    "powerPellets": {
      "count": 4,
      "minDistanceFromSpawn": 10,
      "cornerPlacement": true
    }
  },
  
  "aesthetics": {
    "circuitStyle": true,
    "avoidFourWayIntersections": true,
    "tunnelEnabled": true,
    "tunnelRow": 15
  },
  
  "retry": {
    "maxAttempts": 30,
    "fallbackSeedOffset": 1000003,
    "onFailure": "useLastValid"
  },
  
  "difficulty": {
    "level": "hard",
    "estimatedCompletionTime": 90,
    "riskFactor": 0.7
  }
}
```

### 4.2 Schema-Definition (`mazeConfig.schema.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Maze Configuration",
  "type": "object",
  "required": ["meta", "dimensions", "generation", "rules"],
  "properties": {
    "meta": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "author": { "type": "string" },
        "version": { "type": "string" }
      }
    },
    "dimensions": {
      "type": "object",
      "properties": {
        "width": { "type": "integer", "minimum": 15, "maximum": 51 },
        "height": { "type": "integer", "minimum": 15, "maximum": 51 }
      }
    },
    "generation": {
      "type": "object",
      "properties": {
        "algorithm": { 
          "type": "string", 
          "enum": ["dfs", "recursive_backtracker", "ellers", "kruskal", "prims"] 
        },
        "pathDensity": { "type": "number", "minimum": 0.3, "maximum": 1.0 },
        "deadEndFactor": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
        "cellularAutomataIterations": { "type": "integer", "minimum": 0, "maximum": 5 },
        "symmetry": { 
          "type": "string", 
          "enum": ["none", "horizontal", "vertical", "radial"] 
        }
      }
    },
    "rules": {
      "type": "object",
      "properties": {
        "connectivity": { "$ref": "#/definitions/connectivityRule" },
        "alternativePaths": { "$ref": "#/definitions/alternativePathsRule" },
        "deadEnds": { "$ref": "#/definitions/deadEndsRule" },
        "corridors": { "$ref": "#/definitions/corridorsRule" },
        "spawnSafety": { "$ref": "#/definitions/spawnSafetyRule" },
        "powerPellets": { "$ref": "#/definitions/powerPelletsRule" }
      }
    }
  },
  "definitions": {
    "connectivityRule": {
      "type": "object",
      "properties": {
        "minCoverage": { "type": "number", "minimum": 0.8, "maximum": 1.0 },
        "requireAllWalkable": { "type": "boolean" }
      }
    },
    "alternativePathsRule": {
      "type": "object",
      "properties": {
        "minPaths": { "type": "integer", "minimum": 1, "maximum": 4 },
        "toTargets": { 
          "type": "array", 
          "items": { "enum": ["powerPellets", "ghostSpawns", "corners"] }
        }
      }
    },
    "deadEndsRule": {
      "type": "object",
      "properties": {
        "maxDensity": { "type": "number", "minimum": 0.05, "maximum": 0.5 },
        "minCount": { "type": "integer", "minimum": 0 },
        "maxCount": { "type": "integer", "maximum": 50 }
      }
    },
    "corridorsRule": {
      "type": "object",
      "properties": {
        "maxLength": { "type": "integer", "minimum": 3, "maximum": 20 },
        "minWidth": { "type": "integer", "minimum": 1, "maximum": 2 }
      }
    },
    "spawnSafetyRule": {
      "type": "object",
      "properties": {
        "playerRadius": { "type": "integer", "minimum": 1, "maximum": 5 },
        "minFreedomSteps": { "type": "integer", "minimum": 5, "maximum": 30 },
        "minWalkableInRadius": { "type": "integer", "minimum": 3, "maximum": 20 }
      }
    },
    "powerPelletsRule": {
      "type": "object",
      "properties": {
        "count": { "type": "integer", "minimum": 2, "maximum": 8 },
        "minDistanceFromSpawn": { "type": "integer", "minimum": 5 },
        "cornerPlacement": { "type": "boolean" }
      }
    }
  }
}
```

---

## 5. Randomisierungs-Strategie

### 5.1 Seed-Management

```javascript
// MazeSeedManager.js - NEU
class MazeSeedManager {
  /**
   * Generiert einen eindeutigen Seed für jedes Level
   * @param {number} level - Aktuelles Level
   * @param {string} presetName - Name des Presets
   * @param {number|null} overrideSeed - Optionaler manueller Seed
   */
  generateSeed(level, presetName, overrideSeed = null) {
    if (overrideSeed !== null) {
      return overrideSeed;
    }
    
    // Kombiniere Level + Preset + Timestamp für Einzigartigkeit
    const baseSeed = Date.now();
    const levelOffset = level * 10000;
    const presetHash = this.hashString(presetName);
    
    return (baseSeed + levelOffset + presetHash) >>> 0;
  }
  
  /**
   * Für Replay-System: Speichere Seed für späteres Nachspielen
   */
  saveSeedForReplay(seed, level, preset) {
    return { seed, level, preset, timestamp: Date.now() };
  }
  
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
```

### 5.2 Zufälligkeitsmodi

| Modus | Beschreibung | Use Case |
|-------|--------------|----------|
| `full_random` | Jedes Level komplett zufällig | Arcade-Modus |
| `level_sequence` | Vorhersehbare Sequenz (Level 5 = immer gleiches Maze) | Speedrun |
| `daily_challenge` | Seed basierend auf Tagesdatum | Daily Run |
| `seeded` | Manueller Seed für Replays | Debug/Replay |

### 5.3 Algorithmus-Variation

```javascript
// Erweiterte Algorithmen-Unterstützung
const ALGORITHMS = {
  dfs: {
    name: 'Depth-First Search',
    characteristics: ['long_corridors', 'few_dead_ends'],
    difficulty: 'medium'
  },
  recursive_backtracker: {
    name: 'Recursive Backtracker',
    characteristics: ['winding_paths', 'balanced'],
    difficulty: 'medium'
  },
  ellers: {
    name: "Eller's Algorithm",
    characteristics: ['row_based', 'biased_horizontal'],
    difficulty: 'hard'
  },
  kruskal: {
    name: "Kruskal's Algorithm",
    characteristics: ['uniform', 'many_short_paths'],
    difficulty: 'easy'
  },
  prims: {
    name: "Prim's Algorithm",
    characteristics: ['tree_like', 'predictable'],
    difficulty: 'easy'
  },
  hybrid: {
    name: 'Hybrid (DFS + Post-Processing)',
    characteristics: ['customizable', 'complex'],
    difficulty: 'configurable'
  }
};
```

---

## 6. Regel-System (MazeRules.js)

### 6.1 Regel-Definitionen

```javascript
// src/utils/maze/MazeRules.js - NEU

/**
 * Regel-Definitionen für Maze-Qualität
 * Jede Regel hat: id, description, validate(), severity
 */
export const MAZE_RULES = {
  // === CONNECTIVITY REGELN ===
  CONNECTIVITY_FULL: {
    id: 'connectivity_full',
    category: 'connectivity',
    description: 'Alle begehbaren Tiles müssen verbunden sein',
    severity: 'error',
    validate: (maze, width, height, spawnPoints, config) => {
      const result = checkConnectivity(maze, width, height, spawnPoints.player);
      return {
        passed: result.coverage >= config.rules.connectivity.minCoverage,
        value: result.coverage,
        threshold: config.rules.connectivity.minCoverage,
        message: result.coverage < 1.0 
          ? `Connectivity: ${(result.coverage * 100).toFixed(1)}%` 
          : 'Fully connected'
      };
    }
  },

  // === ALTERNATIVE PATHS ===
  ALTERNATIVE_PATHS_MIN: {
    id: 'alternative_paths_min',
    category: 'navigation',
    description: 'Mindestens N alternative Pfade zu wichtigen Zielen',
    severity: 'warning',
    validate: (maze, width, height, spawnPoints, config) => {
      const minPaths = config.rules.alternativePaths.minPaths;
      const results = [];
      
      for (const target of spawnPoints.powerPellets) {
        const pathCount = countEdgeDisjointPaths(
          maze, width, height, 
          spawnPoints.player, target, minPaths + 1
        );
        results.push({ target, pathCount, passed: pathCount >= minPaths + 1 });
      }
      
      const allPassed = results.every(r => r.passed);
      return {
        passed: allPassed,
        value: Math.min(...results.map(r => r.pathCount)),
        threshold: minPaths + 1,
        details: results,
        message: allPassed 
          ? 'Alternative paths OK' 
          : `Insufficient paths to some targets`
      };
    }
  },

  // === DEAD END CONTROL ===
  DEAD_END_DENSITY: {
    id: 'dead_end_density',
    category: 'balance',
    description: 'Sackgassen-Dichte muss im erlaubten Bereich liegen',
    severity: 'warning',
    validate: (maze, width, height, _spawnPoints, config) => {
      const stats = calculateStats(maze, width, height);
      const density = stats.deadEnds / stats.pathTiles;
      const maxDensity = config.rules.deadEnds.maxDensity;
      
      return {
        passed: density <= maxDensity,
        value: density,
        threshold: maxDensity,
        deadEndCount: stats.deadEnds,
        message: `Dead-end density: ${(density * 100).toFixed(1)}% (max: ${(maxDensity * 100).toFixed(1)}%)`
      };
    }
  },

  // === CORRIDOR LENGTH ===
  CORRIDOR_MAX_LENGTH: {
    id: 'corridor_max_length',
    category: 'gameplay',
    description: 'Gerade Korridore dürfen maximale Länge nicht überschreiten',
    severity: 'warning',
    validate: (maze, width, height, _spawnPoints, config) => {
      const maxLen = findMaxStraightCorridorLength(maze, width, height);
      const threshold = config.rules.corridors.maxLength;
      
      return {
        passed: maxLen <= threshold,
        value: maxLen,
        threshold: threshold,
        message: `Max corridor length: ${maxLen} (max allowed: ${threshold})`
      };
    }
  },

  // === SPAWN SAFETY ===
  SPAWN_SAFETY_ZONE: {
    id: 'spawn_safety_zone',
    category: 'fairness',
    description: 'Spawn-Bereich muss ausreichend Bewegungsfreiheit bieten',
    severity: 'error',
    validate: (maze, width, height, spawnPoints, config) => {
      const radius = config.rules.spawnSafety.playerRadius;
      const minSteps = config.rules.spawnSafety.minFreedomSteps;
      
      let walkableInRadius = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = spawnPoints.player.x + dx;
          const y = spawnPoints.player.y + dy;
          if (isWalkableTile(maze, x, y)) walkableInRadius++;
        }
      }
      
      const reachableSteps = countReachableTilesWithinSteps(
        maze, width, height, spawnPoints.player, minSteps
      );
      
      return {
        passed: reachableSteps >= minSteps && walkableInRadius >= config.rules.spawnSafety.minWalkableInRadius,
        values: { walkableInRadius, reachableSteps },
        thresholds: { 
          minWalkable: config.rules.spawnSafety.minWalkableInRadius, 
          minSteps 
        },
        message: `Spawn freedom: ${reachableSteps} tiles in ${minSteps} steps`
      };
    }
  },

  // === POWER PELLET PLACEMENT ===
  POWER_PELLET_DISTRIBUTION: {
    id: 'power_pellet_distribution',
    category: 'balance',
    description: 'Power Pellets müssen gut verteilt sein',
    severity: 'info',
    validate: (maze, width, height, spawnPoints, config) => {
      const minDist = config.rules.powerPellets.minDistanceFromSpawn;
      const results = spawnPoints.powerPellets.map(pp => {
        const dist = getManhattanDistance(
          spawnPoints.player.x, spawnPoints.player.y,
          pp.x, pp.y
        );
        return { position: pp, distance: dist, passed: dist >= minDist };
      });
      
      const allPassed = results.every(r => r.passed);
      return {
        passed: allPassed,
        details: results,
        message: allPassed 
          ? 'Power pellets well distributed' 
          : 'Some power pellets too close to spawn'
      };
    }
  }
};

/**
 * Validiert Maze gegen alle aktiven Regeln
 */
export function validateAgainstRules(maze, width, height, spawnPoints, config) {
  const results = [];
  const errors = [];
  const warnings = [];
  const info = [];
  
  for (const [key, rule] of Object.entries(MAZE_RULES)) {
    const result = rule.validate(maze, width, height, spawnPoints, config);
    results.push({
      rule: key,
      ...result,
      severity: rule.severity
    });
    
    if (!result.passed) {
      if (rule.severity === 'error') errors.push(result);
      else if (rule.severity === 'warning') warnings.push(result);
      else info.push(result);
    }
  }
  
  return {
    isValid: errors.length === 0,
    results,
    errors,
    warnings,
    info,
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length
    }
  };
}
```

### 6.2 Regel-Kategorien und Severity

| Kategorie | Beschreibung | Beispiele |
|-----------|--------------|-----------|
| `connectivity` | Zusammenhängendes Maze | CONNECTIVITY_FULL |
| `navigation` | Navigierbarkeit | ALTERNATIVE_PATHS_MIN |
| `balance` | Spielbalance | DEAD_END_DENSITY, POWER_PELLET_DISTRIBUTION |
| `gameplay` | Gameplay-Qualität | CORRIDOR_MAX_LENGTH |
| `fairness` | Fairness für Spieler | SPAWN_SAFETY_ZONE |

| Severity | Bedeutung | Bei Verletzung |
|----------|-----------|----------------|
| `error` | Maze unspielbar | Retry mit neuem Seed |
| `warning` | Maze suboptimal | Akzeptabel, aber bevorzugt Retry |
| `info` | Information | Logging, keine Auswirkung |

---

## 7. MazeConfigLoader Implementation

### 7.1 API-Design

```javascript
// src/utils/MazeConfigLoader.js - NEU

import defaultConfig from '../config/mazePresets/default.json';
import easyConfig from '../config/mazePresets/easy.json';
import mediumConfig from '../config/mazePresets/medium.json';
import hardConfig from '../config/mazePresets/hard.json';
import expertConfig from '../config/mazePresets/expert.json';

const PRESETS = {
  default: defaultConfig,
  easy: easyConfig,
  medium: mediumConfig,
  hard: hardConfig,
  expert: expertConfig
};

export class MazeConfigLoader {
  constructor() {
    this.customConfig = null;
    this.levelScaling = this.getDefaultLevelScaling();
  }

  /**
   * Lädt Konfiguration für ein Level
   * @param {number} level - Aktuelles Level (1-basiert)
   * @param {string} presetName - Preset-Name oder 'custom'
   * @param {object} overrides - Optionale Parameter-Overrides
   */
  loadConfig(level = 1, presetName = 'default', overrides = {}) {
    // 1. Basis-Preset laden
    const basePreset = PRESETS[presetName] || PRESETS.default;
    
    // 2. Mit Default mergen (für fehlende Felder)
    const merged = this.deepMerge(defaultConfig, basePreset);
    
    // 3. Level-Skalierung anwenden
    const scaled = this.applyLevelScaling(merged, level);
    
    // 4. Overrides anwenden
    const finalConfig = this.deepMerge(scaled, overrides);
    
    return finalConfig;
  }

  /**
   * Level-basierte Skalierung für progressive Difficulty
   */
  applyLevelScaling(config, level) {
    const scaling = this.levelScaling;
    
    // Difficulty steigt mit Level
    const scaleFactor = Math.min(level / 10, 1); // Max bei Level 10
    
    return {
      ...config,
      generation: {
        ...config.generation,
        pathDensity: config.generation.pathDensity * (1 - scaleFactor * scaling.pathDensityReduction),
        deadEndFactor: config.generation.deadEndFactor * (1 + scaleFactor * scaling.deadEndIncrease)
      },
      rules: {
        ...config.rules,
        deadEnds: {
          ...config.rules.deadEnds,
          maxDensity: config.rules.deadEnds.maxDensity * (1 + scaleFactor * 0.2)
        },
        alternativePaths: {
          ...config.rules.alternativePaths,
          minPaths: Math.max(1, config.rules.alternativePaths.minPaths - Math.floor(level / 5))
        }
      }
    };
  }

  getDefaultLevelScaling() {
    return {
      pathDensityReduction: 0.15,  // Weniger Pfade bei höheren Levels
      deadEndIncrease: 0.2,        // Mehr Sackgassen
      corridorLengthIncrease: 0.1  // Längere Korridore
    };
  }

  /**
   * Deep Merge Utility
   */
  deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  /**
   * Speichert Custom-Konfiguration (für Runtime-Editing)
   */
  saveCustomConfig(config) {
    this.customConfig = config;
    // Optional: In localStorage persistieren
    try {
      localStorage.setItem('maze_custom_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Could not save custom config to localStorage');
    }
  }

  /**
   * Lädt Custom-Konfiguration aus localStorage
   */
  loadCustomConfig() {
    try {
      const saved = localStorage.getItem('maze_custom_config');
      if (saved) {
        this.customConfig = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load custom config from localStorage');
    }
    return this.customConfig;
  }

  /**
   * Validiert eine Konfiguration gegen das Schema
   */
  validateConfig(config) {
    // Einfache Validierung (kann mit ajv erweitert werden)
    const required = ['meta', 'dimensions', 'generation', 'rules'];
    const missing = required.filter(key => !config[key]);
    
    return {
      isValid: missing.length === 0,
      missingFields: missing,
      errors: missing.map(f => `Missing required field: ${f}`)
    };
  }

  /**
   * Listet alle verfügbaren Presets auf
   */
  listPresets() {
    return Object.entries(PRESETS).map(([key, config]) => ({
      id: key,
      name: config.meta?.name || key,
      description: config.meta?.description || '',
      difficulty: config.difficulty?.level || 'unknown'
    }));
  }
}

// Singleton-Export
export const mazeConfigLoader = new MazeConfigLoader();
```

---

## 8. Integration in bestehenden Code

### 8.1 MazeGenerator.js Erweiterung

```javascript
// Änderungen in MazeGenerator.js

import { MazeConfigLoader, mazeConfigLoader } from './MazeConfigLoader.js';
import { MazeSeedManager } from './MazeSeedManager.js';
import { validateAgainstRules } from './maze/MazeRules.js';

export default class MazeGenerator {
  /**
   * NEU: Konstruktor akzeptiert Preset-Namen oder Config-Objekt
   */
  constructor(options = {}) {
    // Option 1: Direkte Config
    if (options.config) {
      this.config = options.config;
    }
    // Option 2: Preset + Level
    else {
      const { level = 1, preset = 'default', overrides = {} } = options;
      this.config = mazeConfigLoader.loadConfig(level, preset, overrides);
    }
    
    // Seed-Management
    const seedManager = new MazeSeedManager();
    this.seed = seedManager.generateSeed(
      options.level || 1,
      options.preset || 'default',
      options.seed
    );
    
    // ... restlicher Constructor wie bisher
  }

  /**
   * NEU: Statische Factory-Methode für Preset-basierte Generierung
   */
  static generateWithPreset(level, preset = 'default', overrides = {}) {
    const generator = new MazeGenerator({ level, preset, overrides });
    return generator.generate();
  }

  /**
   * ERWEITERT: Validierung nutzt neues Regel-System
   */
  performValidation() {
    // Alte Validierung (für Kompatibilität)
    const legacyResult = validateMaze(/* ... */);
    
    // Neue regel-basierte Validierung
    const ruleResult = validateAgainstRules(
      this.maze,
      this.width,
      this.height,
      this.spawnPoints,
      this.config
    );
    
    // Kombiniere Ergebnisse
    return {
      isValid: legacyResult.isValid && ruleResult.isValid,
      legacyResult,
      ruleResult,
      message: ruleResult.isValid 
        ? 'Maze is valid' 
        : ruleResult.errors[0]?.message || legacyResult.message
    };
  }
}
```

### 8.2 Integration in Game Scene

```javascript
// Beispiel: Verwendung in GameScene.js

import MazeGenerator from '../utils/MazeGenerator.js';

class GameScene extends Phaser.Scene {
  create() {
    // Option 1: Standard-Generierung
    const { maze, pelletGrid, spawnPoints, stats } = MazeGenerator.generateWithPreset(
      this.currentLevel,
      this.difficultyPreset, // 'easy', 'medium', 'hard', 'expert'
      {
        // Optional: Overrides
        seed: this.replaySeed, // Für Replay
        generation: { symmetry: 'horizontal' }
      }
    );
    
    // Option 2: Full Random (neu pro Spiel)
    const randomMaze = MazeGenerator.generateWithPreset(
      this.currentLevel,
      'hard',
      { seed: Date.now() } // Immer neuer Seed
    );
    
    // Option 3: Daily Challenge
    const dailySeed = this.getDailySeed(); // Basierend auf Datum
    const dailyMaze = MazeGenerator.generateWithPreset(1, 'expert', { seed: dailySeed });
  }
  
  getDailySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  }
}
```

---

## 9. Preset-Definitionen

### 9.1 Easy (`easy.json`)

```json
{
  "meta": {
    "name": "Easy",
    "description": "Forgiving maze with many paths and few dead ends",
    "version": "1.0.0"
  },
  "generation": {
    "algorithm": "dfs",
    "pathDensity": 0.85,
    "deadEndFactor": 0.2,
    "cellularAutomataIterations": 0,
    "symmetry": "horizontal",
    "extraPathDensity": 0.25
  },
  "rules": {
    "connectivity": { "minCoverage": 1.0 },
    "alternativePaths": { "minPaths": 3 },
    "deadEnds": { "maxDensity": 0.1, "minCount": 2, "maxCount": 8 },
    "corridors": { "maxLength": 5 },
    "spawnSafety": { "playerRadius": 4, "minFreedomSteps": 20 },
    "powerPellets": { "count": 4, "minDistanceFromSpawn": 8 }
  },
  "difficulty": { "level": "easy", "riskFactor": 0.3 }
}
```

### 9.2 Medium (`medium.json`)

```json
{
  "meta": {
    "name": "Medium",
    "description": "Balanced maze with moderate complexity",
    "version": "1.0.0"
  },
  "generation": {
    "algorithm": "dfs",
    "pathDensity": 0.7,
    "deadEndFactor": 0.3,
    "cellularAutomataIterations": 0,
    "symmetry": "none",
    "extraPathDensity": 0.15
  },
  "rules": {
    "connectivity": { "minCoverage": 1.0 },
    "alternativePaths": { "minPaths": 2 },
    "deadEnds": { "maxDensity": 0.2, "minCount": 5, "maxCount": 15 },
    "corridors": { "maxLength": 8 },
    "spawnSafety": { "playerRadius": 3, "minFreedomSteps": 15 },
    "powerPellets": { "count": 4, "minDistanceFromSpawn": 10 }
  },
  "difficulty": { "level": "medium", "riskFactor": 0.5 }
}
```

### 9.3 Hard (`hard.json`)

```json
{
  "meta": {
    "name": "Hard",
    "description": "Challenging maze with limited escape routes",
    "version": "1.0.0"
  },
  "generation": {
    "algorithm": "dfs",
    "pathDensity": 0.55,
    "deadEndFactor": 0.45,
    "cellularAutomataIterations": 1,
    "symmetry": "none",
    "extraPathDensity": 0.1
  },
  "rules": {
    "connectivity": { "minCoverage": 1.0 },
    "alternativePaths": { "minPaths": 1 },
    "deadEnds": { "maxDensity": 0.3, "minCount": 8, "maxCount": 25 },
    "corridors": { "maxLength": 12 },
    "spawnSafety": { "playerRadius": 2, "minFreedomSteps": 10 },
    "powerPellets": { "count": 4, "minDistanceFromSpawn": 12 }
  },
  "difficulty": { "level": "hard", "riskFactor": 0.7 }
}
```

### 9.4 Expert (`expert.json`)

```json
{
  "meta": {
    "name": "Expert",
    "description": "Punishing maze for experienced players",
    "version": "1.0.0"
  },
  "generation": {
    "algorithm": "dfs",
    "pathDensity": 0.45,
    "deadEndFactor": 0.6,
    "cellularAutomataIterations": 2,
    "symmetry": "none",
    "extraPathDensity": 0.05
  },
  "rules": {
    "connectivity": { "minCoverage": 1.0 },
    "alternativePaths": { "minPaths": 1 },
    "deadEnds": { "maxDensity": 0.4, "minCount": 10, "maxCount": 35 },
    "corridors": { "maxLength": 15 },
    "spawnSafety": { "playerRadius": 2, "minFreedomSteps": 8 },
    "powerPellets": { "count": 4, "minDistanceFromSpawn": 15 }
  },
  "difficulty": { "level": "expert", "riskFactor": 0.9 }
}
```

---

## 10. Difficulty-Metriken und KPIs

### 10.1 Quantifizierbare Maze-Metriken

| Metrik | Beschreibung | Berechnung | Einfluss auf Difficulty |
|--------|--------------|------------|------------------------|
| `pathDensity` | Verhältnis Pfad/Wand | pathTiles / totalTiles | Höher = leichter |
| `deadEndDensity` | Sackgasen-Anteil | deadEnds / pathTiles | Höher = schwerer |
| `avgPathWidth` | Durchschnittliche Pfadbreite | - | Breiter = leichter |
| `alternativePathCount` | Anzahl alternativer Routen | Edge-disjoint paths | Mehr = leichter |
| `corridorLength` | Längster gerader Korridor | - | Länger = schwerer |
| `spawnFreedom` | Bewegungsfreiheit am Start | Reachable in N steps | Mehr = leichter |
| `chokepointCount` | Anzahl Engstellen | Tiles mit 2 Nachbarn | Mehr = schwerer |

### 10.2 KPI-Sammlung pro Maze

```javascript
// Erweiterte Stats in MazeGenerator
generateKPIs(maze, width, height, spawnPoints) {
  return {
    // Dimensionen
    dimensions: { width, height },
    
    // Basis-Stats
    pathTiles: this.countPathTiles(),
    wallTiles: width * height - this.countPathTiles(),
    
    // Pfad-Qualität
    deadEndCount: this.countDeadEnds(),
    deadEndDensity: deadEndCount / pathTiles,
    junctionCount: this.countJunctions(), // Tiles mit 3+ Nachbarn
    
    // Navigation
    avgPathLength: this.calculateAvgPathLength(),
    maxCorridorLength: findMaxStraightCorridorLength(maze, width, height),
    alternativePathScore: this.calculateAlternativePathScore(),
    
    // Fairness
    spawnFreedomSteps: countReachableTilesWithinSteps(maze, width, height, spawnPoints.player, 15),
    minPowerPelletDistance: this.getMinPowerPelletDistance(),
    
    // Difficulty-Score (0-100)
    difficultyScore: this.calculateDifficultyScore()
  };
}
```

---

## 11. Test-Strategie

### 11.1 Unit Tests

```javascript
// tests/utils/maze/MazeConfigLoader.test.js

describe('MazeConfigLoader', () => {
  test('should load default preset', () => {
    const config = mazeConfigLoader.loadConfig(1, 'default');
    expect(config.meta.name).toBe('Default');
    expect(config.generation.pathDensity).toBeDefined();
  });
  
  test('should merge overrides correctly', () => {
    const config = mazeConfigLoader.loadConfig(1, 'medium', {
      generation: { pathDensity: 0.9 }
    });
    expect(config.generation.pathDensity).toBe(0.9);
    expect(config.generation.algorithm).toBe('dfs'); // Aus medium
  });
  
  test('should apply level scaling', () => {
    const level1 = mazeConfigLoader.loadConfig(1, 'medium');
    const level10 = mazeConfigLoader.loadConfig(10, 'medium');
    
    // Höheres Level sollte weniger Pfade haben
    expect(level10.generation.pathDensity).toBeLessThan(level1.generation.pathDensity);
  });
});

// tests/utils/maze/MazeRules.test.js

describe('MazeRules', () => {
  test('CONNECTIVITY_FULL should validate correctly', () => {
    const result = MAZE_RULES.CONNECTIVITY_FULL.validate(
      validMaze, width, height, spawnPoints, config
    );
    expect(result.passed).toBe(true);
  });
  
  test('should fail on disconnected maze', () => {
    const result = MAZE_RULES.CONNECTIVITY_FULL.validate(
      disconnectedMaze, width, height, spawnPoints, config
    );
    expect(result.passed).toBe(false);
  });
});
```

### 11.2 Integration Tests

```javascript
// tests/integration/MazeGeneration.test.js

describe('Maze Generation Integration', () => {
  test('should generate valid maze for each preset', () => {
    const presets = ['easy', 'medium', 'hard', 'expert'];
    
    for (const preset of presets) {
      const result = MazeGenerator.generateWithPreset(1, preset);
      expect(result.validationResult.isValid).toBe(true);
      expect(result.maze.length).toBeGreaterThan(0);
    }
  });
  
  test('should produce reproducible mazes with same seed', () => {
    const seed = 12345;
    const result1 = MazeGenerator.generateWithPreset(1, 'medium', { seed });
    const result2 = MazeGenerator.generateWithPreset(1, 'medium', { seed });
    
    expect(result1.maze).toEqual(result2.maze);
  });
  
  test('should generate different mazes with different seeds', () => {
    const result1 = MazeGenerator.generateWithPreset(1, 'medium', { seed: 1 });
    const result2 = MazeGenerator.generateWithPreset(1, 'medium', { seed: 2 });
    
    expect(result1.maze).not.toEqual(result2.maze);
  });
});
```

### 11.3 Performance Tests

```javascript
// tests/performance/MazeGeneration.perf.js

describe('Maze Generation Performance', () => {
  test('should generate maze within 100ms', () => {
    const start = performance.now();
    MazeGenerator.generateWithPreset(1, 'hard');
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
  
  test('should validate maze within 50ms', () => {
    const result = MazeGenerator.generateWithPreset(1, 'hard');
    
    const start = performance.now();
    validateAgainstRules(result.maze, 25, 33, result.spawnPoints, config);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(50);
  });
});
```

---

## 12. Implementierungs-Roadmap

### Phase 1: Grundlegende Infrastruktur (2-3 Tage)

| Aufgabe | Priorität | Aufwand |
|---------|-----------|---------|
| `MazeConfigLoader.js` erstellen | Hoch | 4h |
| JSON-Preset-Dateien anlegen | Hoch | 2h |
| `MazeSeedManager.js` erstellen | Mittel | 2h |
| Unit Tests für ConfigLoader | Hoch | 3h |

### Phase 2: Regel-System (2-3 Tage)

| Aufgabe | Priorität | Aufwand |
|---------|-----------|---------|
| `MazeRules.js` mit Basis-Regeln | Hoch | 4h |
| Integration in MazeGenerator | Hoch | 3h |
| Erweiterte Validierung | Mittel | 3h |
| Unit Tests für Rules | Hoch | 3h |

### Phase 3: Integration & Testing (2 Tage)

| Aufgabe | Priorität | Aufwand |
|---------|-----------|---------|
| GameScene Integration | Hoch | 3h |
| Level-Scaling implementieren | Mittel | 2h |
| Integration Tests | Hoch | 3h |
| Performance Tests | Mittel | 2h |

### Phase 4: Polish & Dokumentation (1 Tag)

| Aufgabe | Priorität | Aufwand |
|---------|-----------|---------|
| Difficulty-KPI Dashboard | Niedrig | 3h |
| Developer-Dokumentation | Mittel | 2h |
| README-Update | Mittel | 1h |

**Gesamtschätzung: 7-9 Tage**

---

## 13. Offene Fragen & Entscheidungen

### 13.1 Zu klären

1. **Soll die Konfiguration zur Runtime im UI änderbar sein?**
   - Ja: Settings-Menü mit Maze-Optionen
   - Nein: Nur via JSON-Dateien

2. **Sollen Mazes für Speedruns "gelockt" werden?**
   - Daily Challenge: Ja (gleicher Seed pro Tag)
   - Arcade: Nein (zufällig)

3. **Soll es ein "Maze-Editor" geben?**
   - Phase 5 Feature
   - Visuelle Konfiguration

4. **Wie mit invaliden Custom-Konfigs umgehen?**
   - Fallback auf Default
   - Fehleranzeige im UI

### 13.2 Zukünftige Erweiterungen

- **Multiple Algorithmen** (Kruskal, Prim, Eller's)
- **Maze-Templates** (vordefinierte Strukturen)
- **Procedural Rooms** (größere offene Bereiche)
- **Dynamic Mazes** (ändern sich während des Spiels)
- **Maze-Biomes** (verschiedene visuelle Stile)

---

## 14. Zusammenfassung

Dieser Plan erweitert den bestehenden Maze-Generator um:

1. **Externalisierte Konfiguration** via JSON-Presets
2. **Seed-basierte Randomisierung** (bereits teilweise vorhanden)
3. **Regel-basierte Validierung** mit konfigurierbaren Schwellwerten
4. **Level-spezifische Skalierung** für progressive Difficulty
5. **KPI-Sammlung** für Difficulty-Balancing

Die Architektur nutzt die bestehende modulare Struktur und erweitert sie um:
- `MazeConfigLoader.js` - Konfigurations-Management
- `MazeSeedManager.js` - Seed-Generierung und -Verwaltung
- `MazeRules.js` - Validierungsregeln

Die Implementierung ist in 4 Phasen mit geschätzten 7-9 Tagen Aufwand geplant.
