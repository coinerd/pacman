# Phase 6: Scene-Refactoring - Lösen zirkulärer Abhängigkeiten

## Problem-Analyse

### Zirkuläre Abhängigkeiten:

| System | GameModel-Verwendungen | Schwierigkeit |
|--------|----------------------|--------------|
| BossBattleSystem | 1x `this.gameModel.score` | 🟢 Einfach |
| StoryMode | 2x Score, 1x Level | 🟢 Einfach |
| AdditionalPowerUpSystem | Pacman, PelletGrid, Ghosts, Score, etc. | 🔴 Komplex |

## Lösung: EventBus-basierte Kommunikation

### Strategie:

1. **Feature Systems senden nur noch Events** (kein direkter GameModel-Zugriff)
2. **GameModel abonniert Events** und aktualisiert internen State
3. **Kein zirkulärer Import mehr**

---

## Phase 6.1: BossBattleSystem (🟢 Einfach)

### Aktuelle Verwendung:
```javascript
this.gameModel.score += config.scoreBonus;
```

### Lösung:

**BossBattleSystem.js:**
```javascript
// Entferne direkten GameModel-Zugriff
defeatBoss() {
    // ...

    // Vorher: this.gameModel.score += config.scoreBonus;
    // Neu: Nur Event emitten
    gameEvents.emit(GAME_EVENTS.BOSS_DEFEATED, {
        bossType: this.bossType,
        scoreBonus: config.scoreBonus,  // ← Bonus hinzufügen
        timeTaken,
        finalScore: this.gameModel.score  // ← Final Score (optional)
    });

    this.reset();
}
```

**GameModelDI.js:**
```javascript
// Im Konstruktor Event-Listener hinzufügen
this.eventBus.subscribe(GAME_EVENTS.BOSS_DEFEATED, (data) => {
    this.score += data.scoreBonus;
    this.updateHighScore();
});
```

---

## Phase 6.2: StoryMode (🟢 Einfach)

### Aktuelle Verwendung:
```javascript
this.gameModel.score += bonusPoints;  // 2x
this.gameModel.level  // 1x
```

### Lösung:

**StoryMode.js:**
```javascript
// Constructor: Kein GameModel mehr nötig!
constructor() {
    // this.gameModel = gameModel;  // ← Entfernen
    // ...

// completeChapter()
completeChapter() {
    if (!this.currentChapter) {
        return null;
    }

    const chapterName = this.currentChapter.name;
    const bonusPoints = storyConfig.chapterCompleteBonus;

    this.completedChapters.add(chapterName);

    // Vorher: this.gameModel.score += bonusPoints;
    // Neu: Nur Event emitten (ohne GameModel-Zugriff!)
    gameEvents.emit(GAME_EVENTS.CHAPTER_COMPLETED, {
        chapterName: this.currentChapter.name,
        bonusPoints,
        level: this.currentChapter.level  // ← Level aus currentChapter
    });

    const result = {
        chapterName: this.currentChapter.name,
        bonusPoints,
        level: this.currentChapter.level
    };

    this.currentChapter = null;
    this.isStoryActive = false;

    return result;
}
```

**GameModelDI.js:**
```javascript
// Event-Listener hinzufügen
this.eventBus.subscribe(GAME_EVENTS.CHAPTER_COMPLETED, (data) => {
    this.score += data.bonusPoints;
    this.updateHighScore();
});
```

---

## Phase 6.3: AdditionalPowerUpSystem (🔴 Komplex)

### Aktuelle Verwendungen:
```javascript
this.gameModel.pacman          // 7x
this.gameModel.pelletGrid       // 1x
this.gameModel.eatPelletAt(x, y) // 1x
this.gameModel.score           // 1x
this.gameModel.pelletsRemaining // 1x
this.gameModel.ghosts          // 1x
this.gameModel.isBossBattleActive() // 1x
```

### Lösung: DI mit Entity-Registry

**AdditionalPowerUpSystem.js:**
```javascript
// Constructor: DI für Entity-Registry und EventBus
constructor(entityRegistry, eventBus) {
    // this.gameModel = gameModel;  // ← Entfernen
    this.entityRegistry = entityRegistry;
    this.eventBus = eventBus;
    this.activePowerUps = new Map();
    this.powerUpTimers = new Map();
    this.spawnedPowerUps = [];
}

// collectPowerUp()
collectPowerUp(powerUp) {
    const index = this.spawnedPowerUps.indexOf(powerUp);
    if (index === -1) {
        return null;
    }

    this.spawnedPowerUps.splice(index, 1);

    const result = this.activatePowerUp(powerUp.type, powerUp.config.duration);

    // Vorher: player: this.gameModel.pacman
    // Neu: Entity-Registry verwenden
    const pacman = this.entityRegistry.getEntity('pacman');
    gameEvents.emit(GAME_EVENTS.POWER_UP_COLLECTED, {
        type: powerUp.type,
        player: pacman
    });

    return result;
}

// applyPowerUpEffect()
applyPowerUpEffect(type) {
    const pacman = this.entityRegistry.getEntity('pacman');
    if (!pacman) {
        return;
    }

    switch (type) {
    case POWER_UP_TYPES.SHIELD:
        pacman.isShielded = true;
        break;
    // ...
    }
}

// removePowerUpEffect()
removePowerUpEffect(type) {
    const pacman = this.entityRegistry.getEntity('pacman');
    if (!pacman) {
        return;
    }

    switch (type) {
    case POWER_UP_TYPES.SHIELD:
        pacman.isShielded = false;
        break;
    // ...
    }
}

// applyDataMagnetEffect()
applyDataMagnetEffect() {
    const pacman = this.entityRegistry.getEntity('pacman');
    if (!pacman) {
        return;
    }

    const magnetRadius = powerUpConfig.spawnRadius;

    // Vorher: this.gameModel.pelletGrid
    // Neu: PelletGrid aus entityRegistry holen
    const pelletGrid = this.entityRegistry.getEntity('pelletGrid');
    if (!pelletGrid) {
        return;
    }

    for (let y = 0; y < pelletGrid.length; y++) {
        for (let x = 0; x < pelletGrid[y].length; x++) {
            if (pelletGrid[y][x] === 0) {
                continue;
            }

            const distance = Math.sqrt(
                (x - pacman.gridX) ** 2 + (y - pacman.gridY) ** 2
            );

            if (distance <= magnetRadius) {
                // Vorher: this.gameModel.eatPelletAt(x, y)
                // Neu: Event emitten
                gameEvents.emit(GAME_EVENTS.PELLET_MAGNET_EAT, {
                    x, y
                });
            }
        }
    }
}

// shouldSpawnPowerUp()
shouldSpawnPowerUp(_pelletsCollected) {
    // Vorher: this.gameModel.isBossBattleActive()
    // Neu: Event oder Status aus entityRegistry
    const gameState = this.entityRegistry.getEntity('gameState');
    if (gameState?.isBossBattleActive) {
        return false;
    }

    if (this.spawnedPowerUps.length >= powerUpConfig.maxOnScreen) {
        return false;
    }

    const types = Object.keys(powerUpConfig.types);

    for (const type of types) {
        const config = powerUpConfig.types[type];
        if (Math.random() < config.spawnChance * 0.01) {
            return type;
        }
    }

    return null;
}

// isPositionOccupied()
isPositionOccupied(x, y) {
    for (const powerUp of this.spawnedPowerUps) {
        if (powerUp.x === x && powerUp.y === y) {
            return true;
        }
    }

    // Vorher: this.gameModel.pacman
    const pacman = this.entityRegistry.getEntity('pacman');
    if (
        pacman?.gridX === x &&
        pacman?.gridY === y
    ) {
        return true;
    }

    // Vorher: this.gameModel.ghosts
    const ghosts = this.entityRegistry.getEntities('ghost');
    for (const ghost of ghosts) {
        if (ghost.gridX === x && ghost.gridY === y) {
            return true;
        }
    }

    return false;
}
```

**GameModelDI.js:**
```javascript
// Event-Listener für Pellet-Magnet
this.eventBus.subscribe(GAME_EVENTS.PELLET_MAGNET_EAT, (data) => {
    const result = this.eatPelletAt(data.x, data.y);
    if (result) {
        this.score += 10;
        gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {
            score: 10,
            pelletsRemaining: this.pelletsRemaining,
            gridX: data.x,
            gridY: data.y
        });
    }
});
```

---

## ServiceRegistry Anpassung

```javascript
// Vorher: Feature Systems erhalten GameModel
registerFeatureSystems(gameModel) {
    // BossBattleSystem
    container.registerSingleton('BossBattleSystem', () => {
        return new BossBattleSystem(gameModel);
    });

    // StoryMode
    container.registerSingleton('StoryMode', () => {
        return new StoryMode(gameModel);
    });

    // AdditionalPowerUpSystem
    container.registerSingleton('AdditionalPowerUpSystem', () => {
        return new AdditionalPowerUpSystem(gameModel);
    });
}

// Neu: Feature Systems erhalten DI (EntityRegistry, EventBus)
registerFeatureSystems(container) {
    // BossBattleSystem (keine Abhängigkeiten mehr!)
    container.registerSingleton('BossBattleSystem', () => {
        return new BossBattleSystem();
    });

    // StoryMode (keine Abhängigkeiten mehr!)
    container.registerSingleton('StoryMode', () => {
        return new StoryMode();
    });

    // AdditionalPowerUpSystem (mit DI)
    container.registerSingleton('AdditionalPowerUpSystem', () => {
        const entityRegistry = container.get('entityRegistry');
        const eventBus = container.get('eventBus');
        return new AdditionalPowerUpSystem(entityRegistry, eventBus);
    });
}
```

---

## Test-Anpassungen

```javascript
// Vorher: GameModel im Test
const gameModel = new GameModelDI(config, true);
const bossSystem = new BossBattleSystem(gameModel);

// Neu: Kein GameModel mehr nötig!
const bossSystem = new BossBattleSystem();
```

---

## Nächste Schritte

1. ✅ Problem-Analyse abgeschlossen
2. ⏳ BossBattleSystem refactoren (🟢)
3. ⏳ StoryMode refactoren (🟢)
4. ⏳ AdditionalPowerUpSystem refactoren (🔴)
5. ⏳ ServiceRegistry anpassen
6. ⏳ Tests anpassen
7. ⏳ Tests laufen lassen

## Status

Phase 6 gestartet: [2026-03-02 18:15 UTC]
