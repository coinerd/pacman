/**
 * CollisionHandler
 * Zentralisierte Kollisions-Erkennung und -Behandlung.
 * Verwaltet alle Kollisionstypen (Pellets, Ghosts, Fruit).
 */

import { PELLET_TYPES } from '../../utils/MazeLayout.js';
import { gameConfig } from '../../config/gameConfig.js';
import { GAME_EVENTS } from '../../core/EventBus.js';

export class CollisionHandler {
    /**
     * @param {Object} config - Konfiguration
     * @param {Function} config.onPelletEaten - Callback beim Pellet-Essen
     * @param {Function} config.onPowerPelletEaten - Callback beim Power-Pellet-Essen
     * @param {Function} config.onGhostEaten - Callback beim Ghost-Essen
     * @param {Function} config.onPacmanDied - Callback beim Pacman-Sterben
     * @param {Function} config.onFruitEaten - Callback beim Fruit-Essen
     */
    constructor(config = {}) {
        this.callbacks = {
            onPelletEaten: config.onPelletEaten || (() => {}),
            onPowerPelletEaten: config.onPowerPelletEaten || (() => {}),
            onGhostEaten: config.onGhostEaten || (() => {}),
            onPacmanDied: config.onPacmanDied || (() => {}),
            onFruitEaten: config.onFruitEaten || (() => {})
        };

        // Collision Statistics
        this.stats = {
            checksPerformed: 0,
            collisionsDetected: 0
        };

        // Cache für Pellet-Position
        this.lastPelletGrid = { x: null, y: null };

        // Performance optimization: Cache collision radius squared to avoid recalculating
        this.collisionRadius = gameConfig.tileSize * 0.6;
        this.collisionRadiusSquared = this.collisionRadius * this.collisionRadius;
        this.fruitCollisionRadius = gameConfig.tileSize * 0.5;
        this.fruitCollisionRadiusSquared = this.fruitCollisionRadius * this.fruitCollisionRadius;
    }

    // === Haupt-Kollisionstest ===

    /**
     * Prüft alle Kollisionen für ein Update
     * @param {Object} entities - Entities { pacman, ghosts, fruit }
     * @param {Object} gameState - Game State { pelletGrid, pelletsRemaining }
     * @returns {Array} Liste der Kollisions-Events
     */
    checkAllCollisions(entities, gameState) {
        const events = [];
        this.stats.checksPerformed++;

        // Pellet-Kollision
        const pelletEvent = this.checkPelletCollision(entities.pacman, gameState);
        if (pelletEvent) {
            events.push(pelletEvent);
            this.stats.collisionsDetected++;
        }

        // Ghost-Kollision
        const ghostEvent = this.checkGhostCollisions(entities.pacman, entities.ghosts);
        if (ghostEvent) {
            events.push(ghostEvent);
            this.stats.collisionsDetected++;
        }

        // Fruit-Kollision
        const fruitEvent = this.checkFruitCollision(entities.pacman, entities.fruit);
        if (fruitEvent) {
            events.push(fruitEvent);
            this.stats.collisionsDetected++;
        }

        return events;
    }

    // === Pellet-Kollision ===

    checkPelletCollision(pacman, gameState) {
        if (!pacman || !gameState.pelletGrid) {
            return null;
        }

        // Berücksichtige den Offset, da Pellets in der Mitte des Tiles platziert werden
        // Pellet-Position: gridX * tileSize + tileSize/2
        const gridX = Math.floor(pacman.x / gameConfig.tileSize);
        const gridY = Math.floor(pacman.y / gameConfig.tileSize);

        // Cache-Check: gleiche Position wie letztes Frame?
        if (gridX === this.lastPelletGrid.x && gridY === this.lastPelletGrid.y) {
            return null;
        }

        this.lastPelletGrid = { x: gridX, y: gridY };

        // Bounds-Check
        if (
            gridX < 0 || gridX >= gameState.pelletGrid[0].length ||
            gridY < 0 || gridY >= gameState.pelletGrid.length
        ) {
            return null;
        }

        const pelletType = gameState.pelletGrid[gridY][gridX];

        // Kein Pellet?
        if (pelletType === PELLET_TYPES.NONE) {
            return null;
        }



        // Kein Distanz-Check mehr - Pacman frisst Pellet wenn er im gleichen Grid-Tile ist
        // Dies ist das Standard-Verhalten in Pacman

        // Ergebnis-Ermittlung
        let result;
        if (pelletType === PELLET_TYPES.POWER_PELLET) {
            result = this.eatPowerPelletAt(gridX, gridY, gameState);
        } else {
            result = this.eatPelletAt(gridX, gridY, gameState);
        }

        if (!result) {
            return null;
        }

        // Event zurückgeben
        return {
            type: result.isPowerPellet ? GAME_EVENTS.POWER_PELLET_EATEN : GAME_EVENTS.PELLET_EATEN,
            gridX,
            gridY,
            score: result.score,
            isPowerPellet: result.isPowerPellet,
            pelletsRemaining: result.pelletsRemaining,
            levelComplete: result.levelComplete
        };
    }

    eatPelletAt(gridX, gridY, gameState) {
        // WICHTIG: Das Pellet wird vom GameModel/SpawningSystem entfernt!
        // Hier nur den Callback aufrufen

        // Callback aufrufen (unterstützt sowohl this.callbacks als auch direkte Property)
        if (this.onPelletEaten) {
            this.onPelletEaten({ gridX, gridY });
        } else if (this.callbacks?.onPelletEaten) {
            this.callbacks.onPelletEaten({ gridX, gridY });
        }

        // Level-Complete wird vom GameModel geprüft
        return {
            score: 10,
            isPowerPellet: false,
            pelletsRemaining: gameState.pelletsRemaining - 1, // Geschätzter Wert für das Event
            levelComplete: false // Wird vom GameModel korrigiert
        };
    }

    eatPowerPelletAt(gridX, gridY, gameState) {
        // WICHTIG: Das Power-Pellet wird vom GameModel/SpawningSystem entfernt!
        // Hier nur den Callback aufrufen

        // Callback aufrufen (unterstützt sowohl this.callbacks als auch direkte Property)
        if (this.onPowerPelletEaten) {
            this.onPowerPelletEaten({ gridX, gridY });
        } else if (this.callbacks?.onPowerPelletEaten) {
            this.callbacks.onPowerPelletEaten({ gridX, gridY });
        }

        // Level-Complete wird vom GameModel geprüft
        return {
            score: 50,
            isPowerPellet: true,
            pelletsRemaining: gameState.pelletsRemaining - 1, // Geschätzter Wert für das Event
            levelComplete: false // Wird vom GameModel korrigiert
        };
    }

    // === Ghost-Kollision ===

    checkGhostCollisions(pacman, ghosts) {
        if (!pacman || !ghosts || ghosts.length === 0) {
            return null;
        }

        // Performance optimization: Use squared distance to avoid expensive sqrt()
        // Only use sqrt() when we actually have a collision
        const collisionRadiusSquared = this.collisionRadiusSquared;

        for (const ghost of ghosts) {
            if (ghost.isEaten) {
                continue;
            }

            const dx = pacman.x - ghost.x;
            const dy = pacman.y - ghost.y;
            const distanceSquared = dx * dx + dy * dy;

            // Early exit: Check squared distance first (much faster than sqrt)
            if (distanceSquared <= collisionRadiusSquared) {
                return this.handleGhostCollision(ghost);
            }
        }

        return null;
    }

    handleGhostCollision(ghost) {
        if (ghost.isFrightened) {
            // Ghost essen (unterstützt sowohl this.callbacks als auch direkte Property)
            if (this.onGhostEaten) {
                this.onGhostEaten({ ghostType: ghost.ghostType });
            } else if (this.callbacks?.onGhostEaten) {
                this.callbacks.onGhostEaten({ ghostType: ghost.ghostType });
            }
            return {
                type: 'ghostEaten',
                ghostType: ghost.ghostType,
                score: this.getGhostScore(ghost)
            };
        } else {
            // Pacman stirbt (unterstützt sowohl this.callbacks als auch direkte Property)
            if (this.onPacmanDied) {
                this.onPacmanDied({ ghostType: ghost.ghostType });
            } else if (this.callbacks?.onPacmanDied) {
                this.callbacks.onPacmanDied({ ghostType: ghost.ghostType });
            }
            return {
                type: 'pacmanDied',
                ghostType: ghost.ghostType
            };
        }
    }

    getGhostScore(ghost) {
        const baseScores = [200, 400, 800, 1600];
        return baseScores[ghost.eatenCount % 4];
    }

    // === Fruit-Kollision ===

    checkFruitCollision(pacman, fruit) {
        if (!pacman || !fruit || !fruit.active) {
            return null;
        }

        // Performance optimization: Use squared distance to avoid expensive sqrt()
        const dx = pacman.x - fruit.x;
        const dy = pacman.y - fruit.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared <= this.fruitCollisionRadiusSquared) {
            // Callback aufrufen (unterstützt sowohl this.callbacks als auch direkte Property)
            if (this.onFruitEaten) {
                this.onFruitEaten({ fruitType: fruit.fruitType });
            } else if (this.callbacks?.onFruitEaten) {
                this.callbacks.onFruitEaten({ fruitType: fruit.fruitType });
            }
            return {
                type: 'fruitEaten',
                fruitType: fruit.fruitType,
                score: this.getFruitScore(fruit.fruitType)
            };
        }

        return null;
    }

    getFruitScore(fruitType) {
        const scores = {
            cherry: 100,
            strawberry: 300,
            orange: 500,
            apple: 700,
            melon: 1000,
            galaxian: 2000,
            bell: 3000,
            key: 5000
        };
        return scores[fruitType] || 100;
    }

    // === Stats ===

    getStats() {
        return { ...this.stats };
    }

    resetStats() {
        this.stats = {
            checksPerformed: 0,
            collisionsDetected: 0
        };
        this.lastPelletGrid = { x: null, y: null };
    }
}
