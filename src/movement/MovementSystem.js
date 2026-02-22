/**
 * MovementSystem
 * Haupt-Fassade für das Movement System
 * Integriert Engine, AI und Collision
 * Implementiert IMovementSystem
 */

import { IMovementSystem } from './interfaces/IMovementSystem.js';
import { MovementEngine } from './core/MovementEngine.js';
import { MovementComponent } from './core/MovementComponent.js';
import { AIController } from './ai/AIController.js';
import { MazeAdapter } from './adapters/MazeAdapter.js';
import { Direction } from './core/Direction.js';

/**
 * Haupt-Fassade für das Movement System
 * Bietet vereinfachte API für das GameModel
 */
export class MovementSystem {
    /**
     * @param {Object} config - Konfiguration
     * @param {number} config.tileSize - Tile-Größe
     * @param {number} config.tunnelRow - Zeile für Tunnel
     * @param {Object} config.virusCoreCenter - Zentrum des Virus Cores
     * @param {Object} config.virusCoreEntrance - Eingang des Virus Cores
     */
    constructor(config = {}) {
        this.config = {
            tileSize: config.tileSize ?? 20,
            tunnelRow: config.tunnelRow ?? 15,
            virusCoreCenter: config.virusCoreCenter ?? { x: 13, y: 14 },
            virusCoreEntrance: config.virusCoreEntrance ?? { x: 13, y: 11 },
            ...config
        };

        // Subsysteme
        this.engine = null;
        this.aiController = null;
        this.mazeAdapter = null;

        // Entity-Mapping: entityId -> { type, originalEntity }
        this.entityRegistry = new Map();

        // Events
        this.eventListeners = [];

        // Status
        this.isInitialized = false;
        this.isPaused = false;

        // Statistiken
        this.stats = {
            totalUpdates: 0,
            totalEvents: 0
        };
    }

    /**
     * Initialisiert das System mit einem Maze
     * @param {Array<Array<number>>} mazeGrid - 2D-Array des Mazes
     * @param {Object} options - Zusätzliche Optionen
     * @returns {MovementSystem} - this für Chaining
     */
    initialize(mazeGrid, options = {}) {
        // Erstelle Maze-Adapter
        this.mazeAdapter = new MazeAdapter(mazeGrid, {
            tileSize: this.config.tileSize,
            tunnelRow: this.config.tunnelRow,
            tileConfig: options.tileConfig
        });

        // Erstelle Movement-Engine
        this.engine = new MovementEngine(this.mazeAdapter, {
            tileSize: this.config.tileSize,
            tunnelRow: this.config.tunnelRow
        });

        // Erstelle AI-Controller
        this.aiController = new AIController(this.mazeAdapter, {
            virusCoreCenter: this.config.virusCoreCenter,
            virusCoreEntrance: this.config.virusCoreEntrance,
            modeDurations: options.modeDurations,
            frightenedDuration: options.frightenedDuration
        });

        this.isInitialized = true;

        return this;
    }

    /**
     * Registriert eine Entity für Movement
     * @param {Object} entity - Die zu registrierende Entity
     * @param {Object} options - Optionen
     * @returns {MovementComponent} - Das erstellte Movement-Component
     */
    registerEntity(entity, options = {}) {
        if (!this.isInitialized) {
            throw new Error('MovementSystem not initialized. Call initialize() first.');
        }

        const entityId = entity.id || `entity_${Date.now()}_${Math.random()}`;

        // Erstelle Movement-Component
        const movementComponent = MovementComponent.fromEntity(entity, {
            entityId
        });

        // Registriere bei Engine
        this.engine.registerEntity(entityId, movementComponent);

        // Registriere bei AI wenn AI-Typ angegeben
        if (options.aiType) {
            this.aiController.registerEntity(entityId, options.aiType, {
                scatterTarget: options.scatterTarget,
                initialMode: options.initialMode || 'SCATTER'
            });
        }

        // Speichere im Registry
        this.entityRegistry.set(entityId, {
            originalEntity: entity,
            type: options.aiType ? 'ai' : 'player',
            aiType: options.aiType
        });

        return movementComponent;
    }

    /**
     * Entfernt eine Entity
     * @param {string} entityId - Entity-ID
     */
    unregisterEntity(entityId) {
        this.engine.unregisterEntity(entityId);
        this.aiController.unregisterEntity(entityId);
        this.entityRegistry.delete(entityId);
    }

    /**
     * Haupt-Update-Methode
     * @param {number} deltaSeconds - Zeit seit letztem Frame
     * @param {Object} context - Kontext mit Entities
     * @returns {Array<Object>} - Generierte Events
     */
    update(deltaSeconds, context = {}) {
        if (!this.isInitialized || this.isPaused) {
            return [];
        }

        this.stats.totalUpdates++;

        // 1. AI-Update (entscheidet Richtungen)
        const aiDecisions = this.aiController.update(deltaSeconds, {
            getEntityState: (id) => this.engine.getMovementState(id),
            player: context.player,
            allEntities: context.allEntities || [],
            mazeAdapter: this.mazeAdapter,
            deltaSeconds
        });

        // 2. Wende AI-Entscheidungen an
        for (const decision of aiDecisions) {
            this.engine.setDirection(decision.entityId, decision.direction);
        }

        // 3. Prüfe auf Umkehr-Requests vom AI-Controller
        for (const entityId of this.engine.getEntityIds()) {
            if (this.aiController.needsReverse(entityId)) {
                const movement = this.engine.getMovementState(entityId);
                if (movement && movement.direction !== Direction.NONE) {
                    const opposite = Direction.getOpposite(movement.direction);
                    this.engine.setDirection(entityId, opposite);
                }
            }
        }

        // 4. Movement-Update (führt Bewegungen aus)
        const movementEvents = this.engine.update(deltaSeconds);

        // 5. Synchronisiere zurück zu Entities
        this.syncToEntities();

        // 6. Update Speed-Multiplier von AI
        this.syncSpeedMultipliers();

        const allEvents = [...movementEvents];
        this.stats.totalEvents += allEvents.length;

        return allEvents;
    }

    /**
     * Setzt die Bewegungsrichtung einer Entity
     * @param {string} entityId - Entity-ID
     * @param {Direction} direction - Neue Richtung
     * @returns {boolean}
     */
    setDirection(entityId, direction) {
        if (!this.isInitialized) {return false;}
        return this.engine.setDirection(entityId, direction);
    }

    /**
     * Gibt den Movement-State einer Entity zurück
     * @param {string} entityId - Entity-ID
     * @returns {MovementComponent|null}
     */
    getMovementState(entityId) {
        if (!this.isInitialized) {return null;}
        return this.engine.getMovementState(entityId);
    }

    /**
     * Setzt die Geschwindigkeit einer Entity
     * @param {string} entityId - Entity-ID
     * @param {number} speed - Neue Geschwindigkeit
     */
    setSpeed(entityId, speed) {
        if (!this.isInitialized) {return;}
        this.engine.setSpeed(entityId, speed);
    }

    /**
     * Setzt einen Speed-Multiplier
     * @param {string} entityId - Entity-ID
     * @param {number} multiplier - Multiplier
     */
    setSpeedMultiplier(entityId, multiplier) {
        if (!this.isInitialized) {return;}
        this.engine.setSpeedMultiplier(entityId, multiplier);
    }

    /**
     * Setzt frightened Zustand für eine Entity
     * @param {string} entityId - Entity-ID
     * @param {number} duration - Dauer in Sekunden
     */
    setFrightened(entityId, duration) {
        if (!this.isInitialized) {return;}

        this.aiController.setFrightened(entityId, duration);

        // Kehre Richtung um
        const movement = this.engine.getMovementState(entityId);
        if (movement && movement.direction !== Direction.NONE) {
            const opposite = Direction.getOpposite(movement.direction);
            this.engine.setDirection(entityId, opposite);
        }

        // Setze Speed-Multiplier
        const aiConfig = this.aiController.getAIConfig(entityId);
        if (aiConfig) {
            this.engine.setSpeedMultiplier(entityId, aiConfig.speedMultiplier);
        }
    }

    /**
     * Markiert Entity als eaten
     * @param {string} entityId - Entity-ID
     */
    setEaten(entityId) {
        if (!this.isInitialized) {return;}

        this.aiController.setEaten(entityId);

        // Setze Speed-Multiplier für Rückweg
        const aiConfig = this.aiController.getAIConfig(entityId);
        if (aiConfig) {
            this.engine.setSpeedMultiplier(entityId, aiConfig.speedMultiplier);
        }
    }

    /**
     * Reset einer Entity nach Respawn
     * @param {string} entityId - Entity-ID
     * @param {number} gridX - Neue Grid-X-Position
     * @param {number} gridY - Neue Grid-Y-Position
     */
    resetEntity(entityId, gridX, gridY) {
        if (!this.isInitialized) {return;}

        this.aiController.resetEntity(entityId);

        const movement = this.engine.getMovementState(entityId);
        if (movement) {
            movement.gridX = gridX;
            movement.gridY = gridY;

            const center = this.mazeAdapter.getTileCenter(gridX, gridY);
            movement.x = center.x;
            movement.y = center.y;

            movement.direction = Direction.NONE;
            movement.nextDirection = Direction.NONE;
            movement.moveProgress = 0;
            movement.isMoving = false;
            movement.speedMultiplier = 1.0;
        }
    }

    /**
     * Synchronisiert Movement-States zurück zu Original-Entities
     */
    syncToEntities() {
        for (const [entityId, registryEntry] of this.entityRegistry) {
            const movement = this.engine.getMovementState(entityId);
            const original = registryEntry.originalEntity;

            if (movement && original) {
                original.gridX = movement.gridX;
                original.gridY = movement.gridY;
                original.x = movement.x;
                original.y = movement.y;
                original.direction = movement.direction;
                original.moveProgress = movement.moveProgress;
                original.isMoving = movement.isMoving;
            }
        }
    }

    /**
     * Synchronisiert Speed-Multiplier vom AI-Controller
     */
    syncSpeedMultipliers() {
        for (const [entityId, registryEntry] of this.entityRegistry) {
            if (registryEntry.type === 'ai') {
                const aiConfig = this.aiController.getAIConfig(entityId);
                if (aiConfig && aiConfig.speedMultiplier !== 1.0) {
                    this.engine.setSpeedMultiplier(entityId, aiConfig.speedMultiplier);
                }
            }
        }
    }

    /**
     * Pausiert alle Bewegungen
     */
    pause() {
        this.isPaused = true;
        this.engine.pauseAll();
        this.aiController.pause();
    }

    /**
     * Resumiert alle Bewegungen
     */
    resume() {
        this.isPaused = false;
        this.engine.resumeAll();
        this.aiController.resume();
    }

    /**
     * Reset des kompletten Systems
     */
    reset() {
        this.engine.reset();
        this.aiController.reset();
    }

    /**
     * Gibt Statistiken zurück
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            engine: this.engine.getStats(),
            ai: this.aiController.getStats(),
            entityCount: this.entityRegistry.size
        };
    }

    /**
     * Gibt den MazeAdapter zurück
     * @returns {MazeAdapter|null}
     */
    getMazeAdapter() {
        return this.mazeAdapter;
    }

    /**
     * Gibt den AIController zurück
     * @returns {AIController|null}
     */
    getAIController() {
        return this.aiController;
    }

    /**
     * Gibt die aktuellen Positionen aller Entities zurück
     * @returns {Array<Object>}
     */
    getAllPositions() {
        const positions = [];
        for (const [entityId, registryEntry] of this.entityRegistry) {
            const movement = this.engine.getMovementState(entityId);
            if (movement) {
                positions.push({
                    entityId,
                    type: registryEntry.type,
                    aiType: registryEntry.aiType,
                    gridX: movement.gridX,
                    gridY: movement.gridY,
                    x: movement.x,
                    y: movement.y,
                    direction: movement.direction,
                    isMoving: movement.isMoving
                });
            }
        }
        return positions;
    }

    /**
     * Prüft ob eine Position begehbar ist
     * @param {number} gridX - Grid-X
     * @param {number} gridY - Grid-Y
     * @returns {boolean}
     */
    isWalkable(gridX, gridY) {
        if (!this.mazeAdapter) {return false;}
        return this.mazeAdapter.isWalkable(gridX, gridY);
    }

    /**
     * Gibt gültige Richtungen zurück
     * @param {number} gridX - Grid-X
     * @param {number} gridY - Grid-Y
     * @returns {Array<Direction>}
     */
    getValidDirections(gridX, gridY) {
        if (!this.mazeAdapter) {return [];}
        return this.mazeAdapter.getValidDirections(gridX, gridY);
    }

    /**
     * Gibt den aktuellen globalen AI-Mode zurück
     * @returns {string}
     */
    getCurrentMode() {
        if (!this.aiController) {return 'SCATTER';}
        return this.aiController.getCurrentMode();
    }

    /**
     * Gibt alle registrierten Entity-IDs zurück
     * @returns {Array<string>}
     */
    getEntityIds() {
        return Array.from(this.entityRegistry.keys());
    }

    /**
     * Debug-Informationen
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            isPaused: this.isPaused,
            entityCount: this.entityRegistry.size,
            engineEntities: this.engine?.getEntityCount() ?? 0,
            aiEntities: this.aiController?.getEntityCount() ?? 0,
            mazeSize: this.mazeAdapter ? {
                width: this.mazeAdapter.getWidth(),
                height: this.mazeAdapter.getHeight()
            } : null,
            currentMode: this.getCurrentMode()
        };
    }
}
