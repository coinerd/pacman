# Movement System Entkopplungsplan

## Executive Summary

Dieser Plan beschreibt die vollständige Entkopplung des Movement Systems vom Rest der Anwendung. Das Ziel ist ein **unabhängiges, testbares und wiederverwendbares Movement System**, das über klare Interfaces mit dem GameModel kommuniziert.

---

## 1. Aktuelle Situation (AS-IS)

### 1.1 Übersicht der Movement-Komponenten

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CURRENT ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   GameModel                                                                 │
│   ├─ updatePacmanMovement()      ◄──── Direkte Movement-Logik               │
│   ├─ updateGhostMovement()                                                  │
│   ├─ startMovement()                                                        │
│   ├─ updateMovementProgress()                                               │
│   ├─ isWalkable()                                                           │
│   └─ movementStats                                                          │
│                                                                             │
│   ModelEntity                                                               │
│   ├─ updateMovement()            ◄──── Bewegungs-Update (eigene Methode)    │
│   ├─ canMoveInDirection()                                                   │
│   ├─ isValidPosition()                                                      │
│   ├─ startMove()                                                            │
│   ├─ directionBuffer (DirectionBuffer)                                      │
│   ├─ moveProgress                                                           │
│   ├─ speed, direction                                                       │
│   └─ gridX/gridY, x/y Position                                              │
│                                                                             │
│   EnemyAIAdapter                                                            │
│   ├─ update()                    ◄──── Direkter Zugriff auf gameModel       │
│   ├─ chooseDirection()                                                      │
│   └─ this.gameModel (Referenz)                                              │
│                                                                             │
│   Utils: TileMath, MazeLayout, EntityValidator                              │
│   └─ Importieren gameConfig                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Identifizierte Kopplungen

| Komponente | Kopplung zu | Kopplungsgrad | Problem |
|------------|-------------|---------------|---------|
| `GameModel` | `PlayerState`, `EnemyState` | Stark | Direkte Entity-Manipulation |
| `GameModel` | `gameConfig.tileSize` | Mittel | Konfigurationsabhängigkeit |
| `GameModel` | `this.maze` | Stark | Direkter Maze-Zugriff |
| `GameModel` | `EnemyAIAdapter` | Stark | AI-Adapter hat gameModel-Referenz |
| `ModelEntity` | `gameConfig` | Mittel | Tunnel-Row Konstante |
| `ModelEntity` | `MazeLayout` | Mittel | `getCenterPixel`, `isWalkableTile` |
| `EnemyAIAdapter` | `gameModel` | Stark | Vollständige Model-Abhängigkeit |
| `EnemyAIAdapter` | `MazeLayout` | Mittel | `getValidDirections`, `getDistance` |
| `TileMath` | `gameConfig` | Schwach | tileSize Referenz |
| `MazeLayout` | `gameConfig` | Schwach | tileSize Referenz |

### 1.3 Probleme mit der aktuellen Architektur

1. **Hohe Komplexität in GameModel**: 400+ Zeilen Movement-Code vermischt mit Spiel-Logik
2. **Schlechte Testbarkeit**: Movement-Logik kann nicht isoliert getestet werden
3. **Verletzung von SRP**: GameModel verwaltet State, Movement, Collision und Game Flow
4. **Enge Kopplung**: Änderungen am Movement-System erfordern Änderungen im GameModel
5. **Keine Wiederverwendbarkeit**: Movement-Logik ist spezifisch für dieses Spiel

---

## 2. Zielarchitektur (TO-BE)

### 2.1 Entkopplungs-Prinzipien

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TARGET ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐ │
│  │   GameModel         │    │   MovementSystem    │    │   MazeAdapter   │ │
│  │   (Orchestrator)    │◄──►│   (Pure Logic)      │◄──►│   (Data Source) │ │
│  │                     │    │                     │    │                 │ │
│  │  - Spiel-State      │    │  - Bewegungs-Physik │    │  - Maze-Daten   │ │
│  │  - Score/Leben      │    │  - Kollisions-Check │    │  - Walkable     │ │
│  │  - Level-Logik      │    │  - Richtungs-Logik  │    │  - Tunnel-Logik │ │
│  │  - Event-Emitter    │    │  - Progress-Update  │    │                 │ │
│  │                     │    │                     │    │                 │ │
│  │  Entities:          │    │  Components:        │    │                 │ │
│  │  - PlayerState      │    │  - MovementEngine   │    │                 │ │
│  │  - EnemyState       │    │  - AIController     │    │                 │ │
│  │  - FruitState       │    │  - CollisionSystem  │    │                 │ │
│  │                     │    │                     │    │                 │ │
│  └─────────────────────┘    └─────────────────────┘    └─────────────────┘ │
│           │                           │                                    │
│           │    ┌──────────────────────┘                                    │
│           │    │                                                            │
│           ▼    ▼                                                            │
│  ┌─────────────────────┐                                                   │
│  │   EventBus          │                                                   │
│  │   (Decoupling)      │                                                   │ │
│  └─────────────────────┘                                                   │ │
│                                                                             │
│  KEY PRINCIPLES:                                                            │
│  1. Dependency Inversion: GameModel definiert Interface,                   │
│     MovementSystem implementiert es                                        │
│  2. Event-Driven: Async-Kommunikation über Events                          │
│  3. Pure Functions: Movement-Logik ohne Seiteneffekte                      │
│  4. Interface Segregation: Kleine, fokussierte Interfaces                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer-Struktur

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│         (ModelDrivenGameView, Renderer, Input)                   │
├─────────────────────────────────────────────────────────────────┤
│                     APPLICATION LAYER                            │
│              (GameModel, GameController)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MOVEMENT SYSTEM (Domain)                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │   Engine    │  │     AI      │  │    Collision    │  │   │
│  │  │  (Physics)  │  │ (Targeting) │  │    (Checks)     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     INFRASTRUCTURE LAYER                         │
│       (MazeLayout, Config, EventBus, Storage)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Detaillierter Implementierungsplan

### Phase 1: Interface-Definition (Woche 1)

#### 3.1.1 Neue Datei: `src/movement/interfaces/IMovementSystem.js`

```javascript
/**
 * Interface für das Movement System
 * Definiert den Vertrag zwischen GameModel und Movement System
 */

/**
 * @interface IMovementSystem
 * 
 * Methoden:
 * - initialize(config: MovementConfig): void
 * - registerEntity(entity: MovementEntity): void
 * - unregisterEntity(entityId: string): void
 * - update(deltaSeconds: number): MovementEvent[]
 * - setDirection(entityId: string, direction: Direction): boolean
 * - getEntityState(entityId: string): MovementState
 * - setMaze(maze: MazeGrid): void
 * - setSpeed(entityId: string, speed: number): void
 */

/**
 * @typedef {Object} MovementConfig
 * @property {number} tileSize - Größe eines Tiles in Pixeln
 * @property {number} tunnelRow - Zeile für Tunnel-Wrapping
 * @property {number} defaultSpeed - Standard-Geschwindigkeit
 */

/**
 * @typedef {Object} MovementEntity
 * @property {string} id - Eindeutige Entity-ID
 * @property {number} gridX - Aktuelle Grid-X-Position
 * @property {number} gridY - Aktuelle Grid-Y-Position
 * @property {number} x - Aktuelle Pixel-X-Position
 * @property {number} y - Aktuelle Pixel-Y-Position
 * @property {Direction} direction - Aktuelle Richtung
 * @property {number} speed - Geschwindigkeit in Pixeln/Sekunde
 * @property {EntityType} type - Entity-Typ (PLAYER, ENEMY, etc.)
 */

/**
 * @typedef {Object} MovementState
 * @property {string} entityId
 * @property {Position} position
 * @property {Direction} direction
 * @property {number} moveProgress - 0.0 bis 1.0
 * @property {boolean} isMoving
 * @property {MovementStatus} status
 */

/**
 * @typedef {Object} MovementEvent
 * @property {string} type - 'movement_started' | 'movement_completed' | 'direction_changed' | 'tunnel_wrap'
 * @property {string} entityId
 * @property {Object} payload - Event-spezifische Daten
 */
```

#### 3.1.2 Neue Datei: `src/movement/interfaces/IMazeAdapter.js`

```javascript
/**
 * Interface für Maze-Abstraktion
 * Entkoppelt Movement System von konkreter Maze-Implementierung
 */

/**
 * @interface IMazeAdapter
 * 
 * Methoden:
 * - isWalkable(gridX: number, gridY: number): boolean
 * - getValidDirections(gridX: number, gridY: number): Direction[]
 * - getTileCenter(gridX: number, gridY: number): Position
 * - isTunnel(gridX: number, gridY: number): boolean
 * - getWidth(): number
 * - getHeight(): number
 * - getTileSize(): number
 */
```

#### 3.1.3 Neue Datei: `src/movement/interfaces/IAIController.js`

```javascript
/**
 * Interface für AI-Controller
 * Entkoppelt AI-Logik vom Movement System
 */

/**
 * @interface IAIController
 * 
 * Methoden:
 * - update(deltaSeconds: number, context: AIContext): AIDecision[]
 * - registerEntity(entityId: string, aiType: string): void
 * - unregisterEntity(entityId: string): void
 * - setTarget(entityId: string, target: Position): void
 * - setMode(entityId: string, mode: string): void
 */

/**
 * @typedef {Object} AIContext
 * @property {Map<string, MovementState>} entityStates
 * @property {IMazeAdapter} mazeAdapter
 * @property {Object} playerState
 */

/**
 * @typedef {Object} AIDecision
 * @property {string} entityId
 * @property {Direction} direction
 * @property {string} mode
 */
```

### Phase 2: Core Movement System Implementierung (Woche 1-2)

#### 3.2.1 Neue Datei: `src/movement/core/Direction.js`

```javascript
/**
 * Unabhängige Direction-Definition
 * Keine Abhängigkeit zu gameConfig
 */

export const Direction = {
    UP: Object.freeze({ x: 0, y: -1, angle: 270, name: 'UP' }),
    DOWN: Object.freeze({ x: 0, y: 1, angle: 90, name: 'DOWN' }),
    LEFT: Object.freeze({ x: -1, y: 0, angle: 180, name: 'LEFT' }),
    RIGHT: Object.freeze({ x: 1, y: 0, angle: 0, name: 'RIGHT' }),
    NONE: Object.freeze({ x: 0, y: 0, angle: 0, name: 'NONE' }),
    
    // Utility-Funktionen
    isOpposite(dir1, dir2) {
        return dir1 && dir2 && dir1.x === -dir2.x && dir1.y === -dir2.y;
    },
    
    getOpposite(dir) {
        if (!dir || dir === this.NONE) return this.NONE;
        return this.ALL.find(d => d.x === -dir.x && d.y === -dir.y) || this.NONE;
    },
    
    ALL: [this.UP, this.DOWN, this.LEFT, this.RIGHT]
};
```

#### 3.2.2 Neue Datei: `src/movement/core/MovementComponent.js`

```javascript
/**
 * Pure data component für Movement
 * Keine Methoden, nur Daten
 */

export class MovementComponent {
    constructor(config = {}) {
        // Position
        this.gridX = config.gridX ?? 0;
        this.gridY = config.gridY ?? 0;
        this.x = config.x ?? 0;
        this.y = config.y ?? 0;
        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;
        this.prevX = this.x;
        this.prevY = this.y;
        
        // Movement
        this.targetGridX = this.gridX;
        this.targetGridY = this.gridY;
        this.moveProgress = 0;
        this.speed = config.speed ?? 100;
        this.direction = config.direction ?? Direction.NONE;
        this.nextDirection = Direction.NONE;
        this.isMoving = false;
        
        // State
        this.isPaused = false;
        this.speedMultiplier = 1.0;
    }
    
    /**
     * Erstellt ein MovementComponent aus einer Entity
     * @param {Object} entity - Entity mit gridX, gridY, x, y, speed, direction
     */
    static fromEntity(entity) {
        return new MovementComponent({
            gridX: entity.gridX,
            gridY: entity.gridY,
            x: entity.x,
            y: entity.y,
            speed: entity.speed,
            direction: entity.direction
        });
    }
}
```

#### 3.2.3 Neue Datei: `src/movement/core/MovementEngine.js`

```javascript
/**
 * Pure Movement-Engine
 * Verwaltet alle Movement-Logik ohne externe Abhängigkeiten
 */

export class MovementEngine {
    constructor(mazeAdapter, config = {}) {
        this.mazeAdapter = mazeAdapter;
        this.config = {
            tileSize: config.tileSize ?? 20,
            tunnelRow: config.tunnelRow ?? 15,
            ...config
        };
        
        // Map: entityId -> MovementComponent
        this.movements = new Map();
        
        // Event-Queue
        this.events = [];
    }
    
    /**
     * Registriert eine Entity für Movement
     */
    registerEntity(entityId, movementComponent) {
        this.movements.set(entityId, movementComponent);
    }
    
    /**
     * Entfernt eine Entity
     */
    unregisterEntity(entityId) {
        this.movements.delete(entityId);
    }
    
    /**
     * Setzt Richtung für eine Entity
     */
    setDirection(entityId, direction) {
        const movement = this.movements.get(entityId);
        if (!movement) return false;
        
        // Sofort anwenden wenn Gegenrichtung
        if (Direction.isOpposite(direction, movement.direction)) {
            movement.direction = direction;
            movement.nextDirection = Direction.NONE;
            return true;
        }
        
        // Sonst puffern
        movement.nextDirection = direction;
        return true;
    }
    
    /**
     * Haupt-Update-Loop
     * @returns {MovementEvent[]} - Generierte Events
     */
    update(deltaSeconds) {
        this.events = [];
        
        for (const [entityId, movement] of this.movements) {
            if (movement.isPaused) continue;
            
            this.updateEntityMovement(entityId, movement, deltaSeconds);
        }
        
        return [...this.events];
    }
    
    /**
     * Updated Movement für eine Entity
     */
    updateEntityMovement(entityId, movement, deltaSeconds) {
        // Wenn nicht am Bewegen, versuche gestrichelte Richtung anzuwenden
        if (movement.moveProgress === 0) {
            this.tryApplyBufferedDirection(movement);
            this.tryStartMovement(entityId, movement);
        } else {
            // Update laufendes Movement
            this.updateMovementProgress(entityId, movement, deltaSeconds);
        }
    }
    
    /**
     * Versucht gepufferte Richtung anzuwenden
     */
    tryApplyBufferedDirection(movement) {
        if (movement.nextDirection === Direction.NONE) return;
        
        const targetX = movement.gridX + movement.nextDirection.x;
        const targetY = movement.gridY + movement.nextDirection.y;
        
        if (this.mazeAdapter.isWalkable(targetX, targetY)) {
            movement.direction = movement.nextDirection;
            movement.nextDirection = Direction.NONE;
        }
    }
    
    /**
     * Startet Movement in aktueller Richtung
     */
    tryStartMovement(entityId, movement) {
        if (movement.direction === Direction.NONE) return false;
        
        const targetX = movement.gridX + movement.direction.x;
        const targetY = movement.gridY + movement.direction.y;
        
        if (!this.mazeAdapter.isWalkable(targetX, targetY)) {
            return false;
        }
        
        // Starte Movement
        movement.prevGridX = movement.gridX;
        movement.prevGridY = movement.gridY;
        movement.targetGridX = targetX;
        movement.targetGridY = targetY;
        movement.moveProgress = 0.001;
        movement.isMoving = true;
        
        // Center-Position erzwingen
        const center = this.mazeAdapter.getTileCenter(movement.gridX, movement.gridY);
        movement.x = center.x;
        movement.y = center.y;
        
        this.events.push({
            type: 'movement_started',
            entityId,
            direction: movement.direction,
            fromGrid: { x: movement.gridX, y: movement.gridY },
            toGrid: { x: targetX, y: targetY }
        });
        
        return true;
    }
    
    /**
     * Updated Movement-Progress
     */
    updateMovementProgress(entityId, movement, deltaTime) {
        if (movement.moveProgress <= 0) return false;
        
        const tileSize = this.config.tileSize;
        const effectiveSpeed = movement.speed * movement.speedMultiplier;
        const tilesPerSecond = effectiveSpeed / tileSize;
        
        movement.moveProgress += tilesPerSecond * deltaTime;
        
        if (movement.moveProgress >= 1.0) {
            // Movement abgeschlossen
            return this.completeMovement(entityId, movement);
        }
        
        // Interpoliere Position
        this.interpolatePosition(movement);
        
        return false;
    }
    
    /**
     * Schließt Movement ab
     */
    completeMovement(entityId, movement) {
        movement.gridX = movement.targetGridX;
        movement.gridY = movement.targetGridY;
        
        const center = this.mazeAdapter.getTileCenter(movement.gridX, movement.gridY);
        movement.x = center.x;
        movement.y = center.y;
        
        movement.moveProgress = 0;
        movement.isMoving = false;
        
        // Prüfe Tunnel-Wrapping
        const tunnelEvent = this.checkTunnelWrap(entityId, movement);
        
        this.events.push({
            type: 'movement_completed',
            entityId,
            gridX: movement.gridX,
            gridY: movement.gridY
        });
        
        if (tunnelEvent) {
            this.events.push(tunnelEvent);
        }
        
        return true;
    }
    
    /**
     * Interpoliert Position basierend auf Progress
     */
    interpolatePosition(movement) {
        const prevCenter = this.mazeAdapter.getTileCenter(movement.prevGridX, movement.prevGridY);
        const targetCenter = this.mazeAdapter.getTileCenter(movement.targetGridX, movement.targetGridY);
        
        const t = movement.moveProgress;
        movement.x = prevCenter.x + (targetCenter.x - prevCenter.x) * t;
        movement.y = prevCenter.y + (targetCenter.y - prevCenter.y) * t;
        
        // Orthogonale Achse exakt zentrieren
        if (movement.direction.x !== 0) {
            movement.y = prevCenter.y;
        } else if (movement.direction.y !== 0) {
            movement.x = prevCenter.x;
        }
    }
    
    /**
     * Prüft und führt Tunnel-Wrapping durch
     */
    checkTunnelWrap(entityId, movement) {
        if (movement.gridY !== this.config.tunnelRow) return null;
        
        const mazeWidth = this.mazeAdapter.getWidth();
        
        if (movement.x < 0) {
            movement.x = (mazeWidth - 1) * this.config.tileSize;
            movement.gridX = mazeWidth - 1;
            return {
                type: 'tunnel_wrap',
                entityId,
                side: 'left'
            };
        }
        
        if (movement.x >= mazeWidth * this.config.tileSize) {
            movement.x = 0;
            movement.gridX = 0;
            return {
                type: 'tunnel_wrap',
                entityId,
                side: 'right'
            };
        }
        
        return null;
    }
    
    /**
     * Gibt Movement-State zurück
     */
    getMovementState(entityId) {
        return this.movements.get(entityId);
    }
    
    /**
     * Setzt Geschwindigkeit
     */
    setSpeed(entityId, speed) {
        const movement = this.movements.get(entityId);
        if (movement) {
            movement.speed = speed;
        }
    }
    
    /**
     * Setzt Speed-Multiplier
     */
    setSpeedMultiplier(entityId, multiplier) {
        const movement = this.movements.get(entityId);
        if (movement) {
            movement.speedMultiplier = multiplier;
        }
    }
    
    /**
     * Pausiert/Resumiert Entity
     */
    setPaused(entityId, paused) {
        const movement = this.movements.get(entityId);
        if (movement) {
            movement.isPaused = paused;
        }
    }
}
```

#### 3.2.4 Neue Datei: `src/movement/core/AIStrategy.js`

```javascript
/**
 * AI Strategies für verschiedene Enemy-Typen
 * Pure Funktionen ohne Seiteneffekte
 */

export const AIStrategies = {
    /**
     * Alpha: Direktes Verfolgen
     */
    alpha(context) {
        const { entity, player, mode, scatterTarget } = context;
        
        if (mode === 'SCATTER') {
            return scatterTarget;
        }
        
        return {
            x: player.gridX,
            y: player.gridY
        };
    },
    
    /**
     * Beta: 4 Tiles vor dem Player
     */
    beta(context) {
        const { entity, player, mode, scatterTarget } = context;
        
        if (mode === 'SCATTER') {
            return scatterTarget;
        }
        
        let targetX = player.gridX + player.direction.x * 4;
        let targetY = player.gridY + player.direction.y * 4;
        
        // Arcade-Bug: Up bewegt auch nach links
        if (player.direction.y === -1) {
            targetX -= 4;
        }
        
        return { x: targetX, y: targetY };
    },
    
    /**
     * Gamma: Vektor von Alpha durch 2 Tiles vor Player
     */
    gamma(context) {
        const { entity, player, mode, scatterTarget, allEntities } = context;
        
        if (mode === 'SCATTER') {
            return scatterTarget;
        }
        
        const alpha = allEntities.find(e => e.aiType === 'alpha');
        const pivotX = player.gridX + player.direction.x * 2;
        const pivotY = player.gridY + player.direction.y * 2;
        
        if (alpha) {
            return {
                x: pivotX + (pivotX - alpha.gridX),
                y: pivotY + (pivotY - alpha.gridY)
            };
        }
        
        return { x: pivotX, y: pivotY };
    },
    
    /**
     * Delta: Verfolge wenn weit, fliehe wenn nah
     */
    delta(context) {
        const { entity, player, mode, scatterTarget } = context;
        
        if (mode === 'SCATTER') {
            return scatterTarget;
        }
        
        const dist = Math.sqrt(
            Math.pow(entity.gridX - player.gridX, 2) +
            Math.pow(entity.gridY - player.gridY, 2)
        );
        
        if (dist > 8) {
            return { x: player.gridX, y: player.gridY };
        } else {
            return scatterTarget;
        }
    },
    
    /**
     * Random: Zufällige Richtung (für frightened)
     */
    random(context) {
        return null; // Signalisiert: wähle zufällig
    }
};

/**
 * Wählt beste Richtung zum Target
 */
export function chooseDirectionToTarget(entity, target, validDirections, mazeAdapter) {
    if (validDirections.length === 0) return null;
    if (validDirections.length === 1) return validDirections[0];
    
    // Filtere Gegenrichtung
    let filtered = validDirections;
    if (entity.direction && entity.direction !== Direction.NONE) {
        const opposite = Direction.getOpposite(entity.direction);
        filtered = validDirections.filter(d => d !== opposite);
    }
    
    if (filtered.length === 0) {
        filtered = validDirections;
    }
    
    // Wenn kein Target oder random-Modus: zufällig
    if (!target) {
        return filtered[Math.floor(Math.random() * filtered.length)];
    }
    
    // Wähle Richtung mit kürzester Distanz zum Target
    let bestDir = filtered[0];
    let bestDist = Infinity;
    
    for (const dir of filtered) {
        const newX = entity.gridX + dir.x;
        const newY = entity.gridY + dir.y;
        const dist = Math.sqrt(
            Math.pow(newX - target.x, 2) +
            Math.pow(newY - target.y, 2)
        );
        
        if (dist < bestDist) {
            bestDist = dist;
            bestDir = dir;
        }
    }
    
    return bestDir;
}
```

### Phase 3: MazeAdapter Implementierung (Woche 2)

#### 3.3.1 Neue Datei: `src/movement/adapters/MazeAdapter.js`

```javascript
/**
 * Adapter für Maze-Daten
 * Entkoppelt Movement System von konkretem Maze-Format
 */

import { IMazeAdapter } from '../interfaces/IMazeAdapter.js';

export class MazeAdapter {
    constructor(mazeGrid, config = {}) {
        this.maze = mazeGrid;
        this.config = {
            tileSize: config.tileSize ?? 20,
            walkableValue: config.walkableValue ?? 0,
            wallValue: config.wallValue ?? 1,
            ...config
        };
    }
    
    /**
     * Prüft ob Tile begehbar ist
     */
    isWalkable(gridX, gridY) {
        // Erlaube Tunnel (außerhalb der Grenzen in X-Richtung)
        if (gridY >= 0 && gridY < this.maze.length) {
            if (gridX < 0 || gridX >= this.maze[0].length) {
                return true; // Tunnel
            }
        }
        
        if (gridY < 0 || gridY >= this.maze.length ||
            gridX < 0 || gridX >= this.maze[0].length) {
            return false;
        }
        
        const tile = this.maze[gridY][gridX];
        return tile === this.config.walkableValue ||
               tile === 4 || // VIRUS_CORE
               tile === 5;   // VIRUS_CORE_DOOR
    }
    
    /**
     * Gibt alle gültigen Richtungen zurück
     */
    getValidDirections(gridX, gridY) {
        const valid = [];
        const directions = [
            { x: 0, y: -1 }, // UP
            { x: 0, y: 1 },  // DOWN
            { x: -1, y: 0 }, // LEFT
            { x: 1, y: 0 }   // RIGHT
        ];
        
        for (const dir of directions) {
            const newX = gridX + dir.x;
            const newY = gridY + dir.y;
            
            // Spezialfall: Tunnel in horizontaler Richtung
            if (newY >= 0 && newY < this.maze.length) {
                if (newX < 0 || newX >= this.maze[0].length) {
                    if (dir.x !== 0) {
                        valid.push(dir);
                    }
                    continue;
                }
            }
            
            if (this.isWalkable(newX, newY)) {
                valid.push(dir);
            }
        }
        
        return valid;
    }
    
    /**
     * Gibt Pixel-Koordinate des Tile-Zentrums zurück
     */
    getTileCenter(gridX, gridY) {
        const ts = this.config.tileSize;
        return {
            x: gridX * ts + ts / 2,
            y: gridY * ts + ts / 2
        };
    }
    
    /**
     * Prüft ob Position ein Tunnel ist
     */
    isTunnel(gridX, gridY) {
        return gridY >= 0 && gridY < this.maze.length &&
               (gridX < 0 || gridX >= this.maze[0].length);
    }
    
    getWidth() {
        return this.maze[0]?.length ?? 0;
    }
    
    getHeight() {
        return this.maze.length;
    }
    
    getTileSize() {
        return this.config.tileSize;
    }
}
```

### Phase 4: AI Controller Implementierung (Woche 3)

#### 3.4.1 Neue Datei: `src/movement/ai/AIController.js`

```javascript
/**
 * Zentraler AI Controller
 * Verwaltet AI-Logik für alle Entities
 */

import { AIStrategies, chooseDirectionToTarget } from '../core/AIStrategy.js';
import { Direction } from '../core/Direction.js';

export class AIController {
    constructor(mazeAdapter, config = {}) {
        this.mazeAdapter = mazeAdapter;
        this.config = config;
        
        // Map: entityId -> AIConfig
        this.aiConfigs = new Map();
        
        // Mode-Timing
        this.modeDurations = config.modeDurations || [
            { mode: 'SCATTER', duration: 7 },
            { mode: 'CHASE', duration: 20 },
            { mode: 'SCATTER', duration: 7 },
            { mode: 'CHASE', duration: 20 },
            { mode: 'SCATTER', duration: 5 },
            { mode: 'CHASE', duration: 20 },
            { mode: 'SCATTER', duration: 5 },
            { mode: 'CHASE', duration: Infinity }
        ];
        
        this.modeIndex = 0;
        this.modeTimer = 0;
        this.currentMode = 'SCATTER';
    }
    
    /**
     * Registriert eine Entity für AI
     */
    registerEntity(entityId, aiType, options = {}) {
        this.aiConfigs.set(entityId, {
            aiType,
            mode: options.initialMode || 'SCATTER',
            isFrightened: false,
            isEaten: false,
            frightenedTimer: 0,
            scatterTarget: options.scatterTarget || { x: 0, y: 0 },
            ...options
        });
    }
    
    /**
     * Entfernt eine Entity
     */
    unregisterEntity(entityId) {
        this.aiConfigs.delete(entityId);
    }
    
    /**
     * Haupt-Update
     */
    update(deltaSeconds, context) {
        this.updateModeTimer(deltaSeconds);
        
        const decisions = [];
        
        for (const [entityId, aiConfig] of this.aiConfigs) {
            const entity = context.getEntityState(entityId);
            if (!entity) continue;
            
            // Nur am Tile-Center entscheiden
            if (entity.moveProgress !== 0) continue;
            
            const decision = this.makeDecision(entityId, entity, aiConfig, context);
            if (decision) {
                decisions.push(decision);
            }
        }
        
        return decisions;
    }
    
    /**
     * Macht eine AI-Entscheidung
     */
    makeDecision(entityId, entity, aiConfig, context) {
        // Update frightened timer
        if (aiConfig.isFrightened) {
            aiConfig.frightenedTimer -= deltaSeconds;
            if (aiConfig.frightenedTimer <= 0) {
                aiConfig.isFrightened = false;
            }
        }
        
        // Bestimme Target
        let target = null;
        
        if (aiConfig.isEaten) {
            // Zurück zum Virus Core
            target = this.config.virusCoreCenter || { x: 13, y: 14 };
        } else if (aiConfig.isFrightened) {
            // Zufällige Bewegung
            target = null;
        } else {
            // Nutze AI-Strategie
            const strategy = AIStrategies[aiConfig.aiType];
            if (strategy) {
                target = strategy({
                    entity,
                    player: context.player,
                    mode: this.currentMode,
                    scatterTarget: aiConfig.scatterTarget,
                    allEntities: context.allEntities
                });
            }
        }
        
        // Wähle Richtung
        const validDirections = this.mazeAdapter.getValidDirections(entity.gridX, entity.gridY);
        const direction = chooseDirectionToTarget(entity, target, validDirections, this.mazeAdapter);
        
        if (direction) {
            return {
                entityId,
                direction,
                mode: aiConfig.isFrightened ? 'FRIGHTENED' : this.currentMode
            };
        }
        
        return null;
    }
    
    /**
     * Updated Mode-Timer
     */
    updateModeTimer(deltaSeconds) {
        if (this.modeIndex >= this.modeDurations.length) return;
        
        this.modeTimer += deltaSeconds;
        const currentConfig = this.modeDurations[this.modeIndex];
        
        if (this.modeTimer >= currentConfig.duration) {
            this.modeTimer = 0;
            this.modeIndex++;
            this.currentMode = this.modeDurations[this.modeIndex]?.mode || 'CHASE';
            
            // Kehre alle Entities um (außer frightened/eaten)
            this.reverseAllEntities();
        }
    }
    
    /**
     * Setzt frightened Zustand
     */
    setFrightened(entityId, duration) {
        const config = this.aiConfigs.get(entityId);
        if (config && !config.isEaten) {
            config.isFrightened = true;
            config.frightenedTimer = duration;
        }
    }
    
    /**
     * Setzt eaten Zustand
     */
    setEaten(entityId) {
        const config = this.aiConfigs.get(entityId);
        if (config) {
            config.isEaten = true;
            config.isFrightened = false;
        }
    }
    
    /**
     * Reset nach Respawn
     */
    resetEntity(entityId) {
        const config = this.aiConfigs.get(entityId);
        if (config) {
            config.isEaten = false;
            config.isFrightened = false;
            config.frightenedTimer = 0;
        }
    }
    
    /**
     * Kehrt alle aktiven Entities um
     */
    reverseAllEntities() {
        // Wird vom MovementEngine verarbeitet
    }
    
    /**
     * Reset kompletten AI-Zustand
     */
    reset() {
        this.modeIndex = 0;
        this.modeTimer = 0;
        this.currentMode = 'SCATTER';
        
        for (const config of this.aiConfigs.values()) {
            config.isFrightened = false;
            config.isEaten = false;
            config.frightenedTimer = 0;
        }
    }
}
```

### Phase 5: Integration mit GameModel (Woche 3-4)

#### 3.5.1 Neue Datei: `src/movement/MovementSystem.js`

```javascript
/**
 * Haupt-Fassade für das Movement System
 * Integriert Engine, AI und Collision
 */

import { MovementEngine } from './core/MovementEngine.js';
import { AIController } from './ai/AIController.js';
import { MazeAdapter } from './adapters/MazeAdapter.js';
import { MovementComponent } from './core/MovementComponent.js';

export class MovementSystem {
    constructor(config = {}) {
        this.config = {
            tileSize: 20,
            tunnelRow: 15,
            ...config
        };
        
        this.engine = null;
        this.aiController = null;
        this.mazeAdapter = null;
        
        // Entity-Registrierung: originalEntityId -> movementEntityId
        this.entityMapping = new Map();
        
        // Event-Callbacks
        this.eventListeners = [];
    }
    
    /**
     * Initialisiert das System mit einem Maze
     */
    initialize(mazeGrid, options = {}) {
        this.mazeAdapter = new MazeAdapter(mazeGrid, {
            tileSize: this.config.tileSize
        });
        
        this.engine = new MovementEngine(this.mazeAdapter, {
            tileSize: this.config.tileSize,
            tunnelRow: this.config.tunnelRow
        });
        
        this.aiController = new AIController(this.mazeAdapter, {
            virusCoreCenter: options.virusCoreCenter,
            modeDurations: options.modeDurations
        });
        
        return this;
    }
    
    /**
     * Registriert eine Entity aus dem GameModel
     */
    registerEntity(entity, options = {}) {
        const movementComponent = MovementComponent.fromEntity(entity);
        this.engine.registerEntity(entity.id, movementComponent);
        
        if (options.aiType) {
            this.aiController.registerEntity(entity.id, options.aiType, {
                scatterTarget: options.scatterTarget,
                initialMode: options.initialMode
            });
        }
        
        return movementComponent;
    }
    
    /**
     * Entfernt eine Entity
     */
    unregisterEntity(entityId) {
        this.engine.unregisterEntity(entityId);
        this.aiController.unregisterEntity(entityId);
    }
    
    /**
     * Haupt-Update-Methode
     */
    update(deltaSeconds, context = {}) {
        // 1. AI-Update (entscheidet Richtungen)
        const aiDecisions = this.aiController.update(deltaSeconds, {
            getEntityState: (id) => this.engine.getMovementState(id),
            player: context.player,
            allEntities: context.allEntities || []
        });
        
        // 2. Wende AI-Entscheidungen an
        for (const decision of aiDecisions) {
            this.engine.setDirection(decision.entityId, decision.direction);
        }
        
        // 3. Movement-Update (führt Bewegungen aus)
        const movementEvents = this.engine.update(deltaSeconds);
        
        // 4. Synchronisiere zurück zu Entities
        this.syncToEntities(context.entities || []);
        
        return movementEvents;
    }
    
    /**
     * Setzt Richtung für eine Entity (z.B. vom Player-Input)
     */
    setDirection(entityId, direction) {
        return this.engine.setDirection(entityId, direction);
    }
    
    /**
     * Setzt Geschwindigkeit
     */
    setSpeed(entityId, speed) {
        this.engine.setSpeed(entityId, speed);
    }
    
    /**
     * Setzt Speed-Multiplier
     */
    setSpeedMultiplier(entityId, multiplier) {
        this.engine.setSpeedMultiplier(entityId, multiplier);
    }
    
    /**
     * Setzt frightened Zustand
     */
    setFrightened(entityId, duration) {
        this.aiController.setFrightened(entityId, duration);
        
        // Umkehr der Richtung
        const movement = this.engine.getMovementState(entityId);
        if (movement && movement.direction !== Direction.NONE) {
            const opposite = Direction.getOpposite(movement.direction);
            this.engine.setDirection(entityId, opposite);
        }
    }
    
    /**
     * Markiert Entity als eaten
     */
    setEaten(entityId) {
        this.aiController.setEaten(entityId);
    }
    
    /**
     * Reset nach Respawn
     */
    resetEntity(entityId, gridX, gridY) {
        this.aiController.resetEntity(entityId);
        
        const movement = this.engine.getMovementState(entityId);
        if (movement) {
            movement.gridX = gridX;
            movement.gridY = gridY;
            movement.x = this.mazeAdapter.getTileCenter(gridX, gridY).x;
            movement.y = this.mazeAdapter.getTileCenter(gridX, gridY).y;
            movement.direction = Direction.NONE;
            movement.nextDirection = Direction.NONE;
            movement.moveProgress = 0;
            movement.isMoving = false;
        }
    }
    
    /**
     * Synchronisiert Movement-States zurück zu original Entities
     */
    syncToEntities(entities) {
        for (const entity of entities) {
            const movement = this.engine.getMovementState(entity.id);
            if (movement) {
                entity.gridX = movement.gridX;
                entity.gridY = movement.gridY;
                entity.x = movement.x;
                entity.y = movement.y;
                entity.direction = movement.direction;
                entity.moveProgress = movement.moveProgress;
                entity.isMoving = movement.isMoving;
            }
        }
    }
    
    /**
     * Gibt Movement-State zurück
     */
    getMovementState(entityId) {
        return this.engine.getMovementState(entityId);
    }
    
    /**
     * Reset komplettes System
     */
    reset() {
        this.aiController.reset();
        // Reset aller Movement-Komponenten
        for (const [entityId, movement] of this.engine.movements) {
            movement.moveProgress = 0;
            movement.isMoving = false;
            movement.direction = Direction.NONE;
            movement.nextDirection = Direction.NONE;
        }
    }
    
    /**
     * Pausiert alle Bewegungen
     */
    pause() {
        for (const [entityId] of this.engine.movements) {
            this.engine.setPaused(entityId, true);
        }
    }
    
    /**
     * Resumiert alle Bewegungen
     */
    resume() {
        for (const [entityId] of this.engine.movements) {
            this.engine.setPaused(entityId, false);
        }
    }
}
```

#### 3.5.2 GameModel Refactoring

```javascript
// In src/core/GameModel.js

import { MovementSystem } from '../movement/MovementSystem.js';

export default class GameModel {
    constructor(config = {}) {
        // ... bestehende Initialisierung ...
        
        // Initialisiere Movement System
        this.movementSystem = new MovementSystem({
            tileSize: gameConfig.tileSize,
            tunnelRow: gameConfig.tunnelRow
        });
        
        this.initializeMovementSystem();
    }
    
    initializeMovementSystem() {
        this.movementSystem.initialize(this.maze, {
            virusCoreCenter: virusCore.center,
            modeDurations: [/* ... */]
        });
        
        // Registriere Player
        this.movementSystem.registerEntity(this.pacman);
        
        // Registriere Ghosts mit AI
        for (const ghost of this.ghosts) {
            this.movementSystem.registerEntity(ghost, {
                aiType: ghost.ghostType,
                scatterTarget: scatterTargets[ghost.ghostType],
                initialMode: 'SCATTER'
            });
        }
    }
    
    step(deltaSeconds, input = null) {
        // ... vorherige Checks ...
        
        // Input verarbeiten
        if (input?.direction || this.inputDirection) {
            const dir = input?.direction || this.inputDirection;
            this.movementSystem.setDirection(this.pacman.id, dir);
        }
        
        // Movement System Update
        const movementEvents = this.movementSystem.update(deltaSeconds, {
            entities: [this.pacman, ...this.ghosts],
            player: this.pacman,
            allEntities: this.ghosts
        });
        
        events.push(...movementEvents);
        
        // Update Entity-States (Animationen, Timer)
        this.pacman.update(deltaSeconds);
        for (const ghost of this.ghosts) {
            ghost.update(deltaSeconds, this.pacman);
        }
        
        // ... Rest der Logik ...
    }
    
    // Wenn Player stirbt
    onPacmanDeath() {
        this.movementSystem.pause();
        // ...
    }
    
    // Nach Respawn
    resetPositions() {
        this.movementSystem.reset();
        this.pacman.reset(playerStartPosition.x, playerStartPosition.y);
        for (const ghost of this.ghosts) {
            this.movementSystem.resetEntity(ghost.id, ghost.startGridX, ghost.startGridY);
            ghost.reset();
        }
    }
    
    // Power Pellet gegessen
    setGhostsFrightened(duration) {
        for (const ghost of this.ghosts) {
            this.movementSystem.setFrightened(ghost.id, duration);
            ghost.setFrightened(duration); // Für Timer/Visuals
        }
    }
    
    // Ghost gegessen
    eatGhost(ghost) {
        this.movementSystem.setEaten(ghost.id);
        ghost.eat();
        // ...
    }
}
```

---

## 4. Migrationsstrategie

### 4.1 Schrittweise Migration

```
Phase 1: Interface-Definition (1 Woche)
├── 1.1 IMovementSystem Interface erstellen
├── 1.2 IMazeAdapter Interface erstellen
└── 1.3 IAIController Interface erstellen

Phase 2: Core Implementation (1-2 Wochen)
├── 2.1 Direction Klasse unabhängig machen
├── 2.2 MovementComponent erstellen
├── 2.3 MovementEngine implementieren
└── 2.4 Unit-Tests für Core

Phase 3: Adapter Layer (1 Woche)
├── 3.1 MazeAdapter implementieren
├── 3.2 Bestehende MazeLayout-Integration
└── 3.3 Tests mit Adapter

Phase 4: AI Controller (1 Woche)
├── 4.1 AIStrategies auslagern
├── 4.2 AIController implementieren
├── 4.3 Integrationstests

Phase 5: Integration (1-2 Wochen)
├── 5.1 MovementSystem Fassade erstellen
├── 5.2 GameModel refactoren
├── 5.3 Alten Code als Deprecated markieren
└── 5.4 Integrationstests

Phase 6: Cleanup (1 Woche)
├── 6.1 Alten Movement-Code entfernen
├── 6.2 Dokumentation aktualisieren
└── 6.3 Performance-Tests
```

### 4.2 Backward Compatibility

```javascript
// Während der Migration: Bridge-Pattern
class MovementSystemBridge {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.newSystem = new MovementSystem();
        this.useNewSystem = false; // Feature-Flag
    }
    
    update(deltaSeconds) {
        if (this.useNewSystem) {
            return this.newSystem.update(deltaSeconds);
        } else {
            // Fallback zu altem Code
            return this.gameModel.legacyMovementUpdate(deltaSeconds);
        }
    }
}
```

---

## 5. Teststrategie

### 5.1 Unit-Tests

```javascript
// tests/movement/MovementEngine.test.js

describe('MovementEngine', () => {
    let engine;
    let mazeAdapter;
    
    beforeEach(() => {
        mazeAdapter = new MazeAdapter([
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ]);
        engine = new MovementEngine(mazeAdapter, { tileSize: 20 });
    });
    
    test('should start movement in valid direction', () => {
        const movement = new MovementComponent({
            gridX: 1, gridY: 1, direction: Direction.RIGHT
        });
        engine.registerEntity('test', movement);
        
        const events = engine.update(0);
        
        expect(movement.isMoving).toBe(true);
        expect(events).toContainEqual(expect.objectContaining({
            type: 'movement_started'
        }));
    });
    
    test('should not move into wall', () => {
        const movement = new MovementComponent({
            gridX: 1, gridY: 1, direction: Direction.UP
        });
        engine.registerEntity('test', movement);
        
        engine.update(0);
        
        expect(movement.isMoving).toBe(false);
    });
    
    test('should complete movement after duration', () => {
        const movement = new MovementComponent({
            gridX: 1, gridY: 1, direction: Direction.RIGHT, speed: 20
        });
        engine.registerEntity('test', movement);
        
        engine.update(0); // Start
        engine.update(1); // Complete (20px/s, 20px tile)
        
        expect(movement.gridX).toBe(2);
        expect(movement.isMoving).toBe(false);
    });
});
```

### 5.2 Integration-Tests

```javascript
// tests/movement/MovementSystem.integration.test.js

describe('MovementSystem Integration', () => {
    test('should integrate with GameModel', () => {
        const gameModel = new GameModel();
        const movementSystem = new MovementSystem();
        
        // Setup
        movementSystem.initialize(gameModel.maze);
        movementSystem.registerEntity(gameModel.pacman);
        
        // Act
        movementSystem.setDirection(gameModel.pacman.id, Direction.RIGHT);
        const events = movementSystem.update(1);
        
        // Assert
        expect(gameModel.pacman.gridX).toBeGreaterThan(13);
    });
});
```

---

## 6. Vorteile der neuen Architektur

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| **Kopplung** | GameModel enthält 400+ Zeilen Movement-Code | GameModel orchestriert nur noch |
| **Testbarkeit** | Movement nur über GameModel testbar | Movement-Engine isoliert testbar |
| **SRP** | GameModel hat 4+ Verantwortlichkeiten | Jede Klasse hat 1 klare Aufgabe |
| **Wiederverwendbarkeit** | Movement-Code spiel-spezifisch | Movement-System generisch nutzbar |
| **Änderbarkeit** | Änderungen betreffen mehrere Klassen | Änderungen lokalisiert im Movement-System |
| **Dokumentation** | Verstreute Logik | Klare Interfaces und Fassaden |

---

## 7. Risiken und Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Regressionen | Mittel | Hoch | Umfassende Tests, Feature-Flags |
| Performance-Verlust | Niedrig | Mittel | Benchmarking vor/nach |
| Komplexitätszunahme | Mittel | Mittel | Klare Dokumentation, Beispiele |
| Zeitüberschreitung | Mittel | Hoch | Agile Iterationen, MVP-Ansatz |

---

## 8. Zusammenfassung

Dieser Plan beschreibt die vollständige Entkopplung des Movement Systems durch:

1. **Interface-Definition**: Klare Verträge zwischen Systemen
2. **Core-Implementierung**: Unabhängige Movement-Engine
3. **Adapter-Pattern**: Entkopplung von Maze-Daten
4. **Strategy-Pattern**: Flexible AI-Implementierungen
5. **Fassade-Pattern**: Einfache Integration mit GameModel

Die neue Architektur ermöglicht:
- Isolierte Unit-Tests für Movement-Logik
- Wiederverwendung des Movement Systems in anderen Projekten
- Einfachere Wartung und Erweiterung
- Klare Trennung der Verantwortlichkeiten

**Geschätzter Zeitaufwand**: 4-6 Wochen
**Priorität**: Hoch (verbessert Testbarkeit und Wartbarkeit signifikant)
