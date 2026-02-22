/**
 * MovementEngine
 * Pure Movement-Engine ohne externe Abhängigkeiten
 * Verwaltet alle Movement-Logik für registrierte Entities
 */

import { Direction, directionsEqual } from './Direction.js';
import { MovementComponent } from './MovementComponent.js';

/**
 * Zentrale Movement-Engine
 * Verantwortlich für:
 * - Bewegungs-Updates
 * - Kollisions-Checks mit Maze
 * - Tunnel-Wrapping
 * - Event-Generierung
 */
export class MovementEngine {
    /**
     * @param {IMazeAdapter} mazeAdapter - Adapter für Maze-Zugriff
     * @param {Object} config - Konfiguration
     * @param {number} config.tileSize - Tile-Größe in Pixeln
     * @param {number} config.tunnelRow - Zeile für Tunnel-Wrapping
     */
    constructor(mazeAdapter, config = {}) {
        this.mazeAdapter = mazeAdapter;
        this.config = {
            tileSize: config.tileSize ?? 20,
            tunnelRow: config.tunnelRow ?? 15,
            maxDeltaTime: config.maxDeltaTime ?? 0.1, // Sicherheitslimit
            ...config
        };

        // Map: entityId -> MovementComponent
        this.movements = new Map();

        // Event-Queue für diesen Frame
        this.frameEvents = [];

        // Statistiken
        this.stats = {
            movesStarted: 0,
            movesCompleted: 0,
            tunnelWraps: 0,
            blockedAttempts: 0
        };
    }

    /**
     * Registriert eine Entity für Movement
     * @param {string} entityId - Eindeutige Entity-ID
     * @param {MovementComponent} movementComponent - Movement-Component
     */
    registerEntity(entityId, movementComponent) {
        this.movements.set(entityId, movementComponent);
    }

    /**
     * Entfernt eine Entity
     * @param {string} entityId - Entity-ID
     */
    unregisterEntity(entityId) {
        this.movements.delete(entityId);
    }

    /**
     * Prüft ob eine Entity registriert ist
     * @param {string} entityId - Entity-ID
     * @returns {boolean}
     */
    hasEntity(entityId) {
        return this.movements.has(entityId);
    }

    /**
     * Setzt die Bewegungsrichtung einer Entity
     * @param {string} entityId - Entity-ID
     * @param {Direction} direction - Neue Richtung
     * @returns {boolean} - True wenn akzeptiert
     */
    setDirection(entityId, direction) {
        const movement = this.movements.get(entityId);
        if (!movement || movement.isPaused) {
            return false;
        }

        // Sofort anwenden wenn Gegenrichtung oder keine aktuelle Richtung
        if (movement.direction === Direction.NONE ||
            Direction.isOpposite(direction, movement.direction)) {
            movement.direction = direction;
            movement.nextDirection = Direction.NONE;

            this.frameEvents.push({
                type: 'direction_changed',
                entityId,
                direction: direction,
                immediate: true,
                timestamp: Date.now()
            });

            return true;
        }

        // Sonst puffern für später
        movement.nextDirection = direction;
        return true;
    }

    /**
     * Setzt die Geschwindigkeit einer Entity
     * @param {string} entityId - Entity-ID
     * @param {number} speed - Neue Geschwindigkeit
     */
    setSpeed(entityId, speed) {
        const movement = this.movements.get(entityId);
        if (movement) {
            movement.speed = speed;
        }
    }

    /**
     * Setzt einen Speed-Multiplier
     * @param {string} entityId - Entity-ID
     * @param {number} multiplier - Multiplier (z.B. 0.5 für frightened)
     */
    setSpeedMultiplier(entityId, multiplier) {
        const movement = this.movements.get(entityId);
        if (movement) {
            movement.speedMultiplier = multiplier;
        }
    }

    /**
     * Pausiert/Resumiert eine Entity
     * @param {string} entityId - Entity-ID
     * @param {boolean} paused - True zum Pausieren
     */
    setPaused(entityId, paused) {
        const movement = this.movements.get(entityId);
        if (movement) {
            movement.isPaused = paused;
        }
    }

    /**
     * Haupt-Update-Methode
     * @param {number} deltaSeconds - Zeit seit letztem Frame
     * @returns {Array<Object>} - Generierte Events
     */
    update(deltaSeconds) {
        // Safety-Clamp für DeltaTime
        const dt = Math.min(deltaSeconds, this.config.maxDeltaTime);

        this.frameEvents = [];

        for (const [entityId, movement] of this.movements) {
            if (movement.isPaused) {continue;}

            this.updateEntity(entityId, movement, dt);
        }

        return [...this.frameEvents];
    }

    /**
     * Updated eine einzelne Entity
     * @param {string} entityId - Entity-ID
     * @param {MovementComponent} movement - Movement-Component
     * @param {number} dt - Delta-Zeit
     */
    updateEntity(entityId, movement, dt) {
        // Wenn nicht am Bewegen, versuche gepufferte Richtung anzuwenden
        if (movement.moveProgress === 0) {
            this.tryApplyBufferedDirection(movement);
            this.tryStartMovement(entityId, movement);
        } else {
            // Update laufendes Movement
            this.updateMovementProgress(entityId, movement, dt);
        }
    }

    /**
     * Versucht gepufferte Richtung anzuwenden
     * @param {MovementComponent} movement - Movement-Component
     */
    tryApplyBufferedDirection(movement) {
        if (movement.nextDirection === Direction.NONE) {return;}

        const targetX = movement.gridX + movement.nextDirection.x;
        const targetY = movement.gridY + movement.nextDirection.y;

        // Prüfe ob Bewegung in diese Richtung möglich
        if (this.mazeAdapter.isWalkable(targetX, targetY)) {
            const oldDirection = movement.direction;
            movement.direction = movement.nextDirection;
            movement.nextDirection = Direction.NONE;

            // Event nur wenn Richtung sich tatsächlich ändert
            if (!directionsEqual(oldDirection, movement.direction)) {
                this.frameEvents.push({
                    type: 'direction_changed',
                    entityId: movement.entityId,
                    oldDirection,
                    newDirection: movement.direction,
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Versucht Movement zu starten
     * @param {string} entityId - Entity-ID
     * @param {MovementComponent} movement - Movement-Component
     * @returns {boolean} - True wenn Movement gestartet
     */
    tryStartMovement(entityId, movement) {
        if (movement.direction === Direction.NONE) {return false;}

        const targetX = movement.gridX + movement.direction.x;
        const targetY = movement.gridY + movement.direction.y;

        // Prüfe ob Ziel begehbar
        if (!this.mazeAdapter.isWalkable(targetX, targetY)) {
            this.stats.blockedAttempts++;
            return false;
        }

        // Starte Movement
        movement.updatePreviousPositions();
        movement.targetGridX = targetX;
        movement.targetGridY = targetY;
        movement.moveProgress = 0.001; // Start-Marker
        movement.isMoving = true;

        // Erzwinge exakte Position am Tile-Center
        const center = this.mazeAdapter.getTileCenter(movement.gridX, movement.gridY);
        movement.x = center.x;
        movement.y = center.y;

        this.stats.movesStarted++;

        this.frameEvents.push({
            type: 'movement_started',
            entityId,
            direction: movement.direction,
            fromGrid: { x: movement.gridX, y: movement.gridY },
            toGrid: { x: targetX, y: targetY },
            timestamp: Date.now()
        });

        return true;
    }

    /**
     * Updated Movement-Progress
     * @param {string} entityId - Entity-ID
     * @param {MovementComponent} movement - Movement-Component
     * @param {number} dt - Delta-Zeit
     */
    updateMovementProgress(entityId, movement, dt) {
        if (movement.moveProgress <= 0) {return;}

        const tileSize = this.config.tileSize;
        const effectiveSpeed = movement.speed * movement.speedMultiplier;
        const tilesPerSecond = effectiveSpeed / tileSize;

        // Update Progress
        movement.moveProgress += tilesPerSecond * dt;

        if (movement.moveProgress >= 1.0) {
            // Movement abgeschlossen
            this.completeMovement(entityId, movement);
        } else {
            // Interpoliere Position
            this.interpolatePosition(movement);
        }
    }

    /**
     * Schließt Movement ab
     * @param {string} entityId - Entity-ID
     * @param {MovementComponent} movement - Movement-Component
     */
    completeMovement(entityId, movement) {
        // Update Grid-Position
        movement.gridX = movement.targetGridX;
        movement.gridY = movement.targetGridY;

        // Setze exakte Position am Ziel-Center
        const center = this.mazeAdapter.getTileCenter(movement.gridX, movement.gridY);
        movement.x = center.x;
        movement.y = center.y;

        // Reset Movement-State
        movement.moveProgress = 0;
        movement.isMoving = false;

        this.stats.movesCompleted++;

        // Prüfe Tunnel-Wrapping
        const tunnelEvent = this.checkTunnelWrap(entityId, movement);

        this.frameEvents.push({
            type: 'movement_completed',
            entityId,
            gridX: movement.gridX,
            gridY: movement.gridY,
            timestamp: Date.now()
        });

        if (tunnelEvent) {
            this.frameEvents.push(tunnelEvent);
        }
    }

    /**
     * Interpoliert Position basierend auf Progress
     * @param {MovementComponent} movement - Movement-Component
     */
    interpolatePosition(movement) {
        const prevCenter = this.mazeAdapter.getTileCenter(movement.prevGridX, movement.prevGridY);
        const targetCenter = this.mazeAdapter.getTileCenter(movement.targetGridX, movement.targetGridY);

        const t = movement.moveProgress;
        movement.x = prevCenter.x + (targetCenter.x - prevCenter.x) * t;
        movement.y = prevCenter.y + (targetCenter.y - prevCenter.y) * t;

        // Wichtig: Orthogonale Achse exakt zentrieren während der Bewegung
        // Dies verhindert das "Driften" in Gängen
        if (movement.direction.x !== 0) {
            // Horizontale Bewegung: Y bleibt fix
            movement.y = prevCenter.y;
        } else if (movement.direction.y !== 0) {
            // Vertikale Bewegung: X bleibt fix
            movement.x = prevCenter.x;
        }
    }

    /**
     * Prüft und führt Tunnel-Wrapping durch
     * @param {string} entityId - Entity-ID
     * @param {MovementComponent} movement - Movement-Component
     * @returns {Object|null} - Tunnel-Event wenn Wrapping stattfand
     */
    checkTunnelWrap(entityId, movement) {
        // Nur auf Tunnel-Zeile
        if (movement.gridY !== this.config.tunnelRow) {return null;}

        const mazeWidth = this.mazeAdapter.getWidth();
        const mazeWidthPixels = mazeWidth * this.config.tileSize;

        // Links raus -> Rechts rein
        if (movement.x < 0) {
            movement.x = mazeWidthPixels - this.config.tileSize / 2;
            movement.gridX = mazeWidth - 1;
            movement.prevGridX = movement.gridX;
            this.stats.tunnelWraps++;

            return {
                type: 'tunnel_wrap',
                entityId,
                side: 'left',
                newPosition: { x: movement.x, y: movement.y },
                timestamp: Date.now()
            };
        }

        // Rechts raus -> Links rein
        if (movement.x >= mazeWidthPixels) {
            movement.x = this.config.tileSize / 2;
            movement.gridX = 0;
            movement.prevGridX = movement.gridX;
            this.stats.tunnelWraps++;

            return {
                type: 'tunnel_wrap',
                entityId,
                side: 'right',
                newPosition: { x: movement.x, y: movement.y },
                timestamp: Date.now()
            };
        }

        return null;
    }

    /**
     * Gibt Movement-State zurück
     * @param {string} entityId - Entity-ID
     * @returns {MovementComponent|null}
     */
    getMovementState(entityId) {
        return this.movements.get(entityId) ?? null;
    }

    /**
     * Gibt alle registrierten Entity-IDs zurück
     * @returns {Array<string>}
     */
    getEntityIds() {
        return Array.from(this.movements.keys());
    }

    /**
     * Reset des kompletten Engines
     */
    reset() {
        for (const movement of this.movements.values()) {
            movement.moveProgress = 0;
            movement.isMoving = false;
            movement.direction = Direction.NONE;
            movement.nextDirection = Direction.NONE;
            movement.speedMultiplier = 1.0;
        }

        this.stats = {
            movesStarted: 0,
            movesCompleted: 0,
            tunnelWraps: 0,
            blockedAttempts: 0
        };
    }

    /**
     * Pausiert alle Entities
     */
    pauseAll() {
        for (const movement of this.movements.values()) {
            movement.isPaused = true;
        }
    }

    /**
     * Resumiert alle Entities
     */
    resumeAll() {
        for (const movement of this.movements.values()) {
            movement.isPaused = false;
        }
    }

    /**
     * Gibt Statistiken zurück
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Gibt die Anzahl registrierter Entities zurück
     * @returns {number}
     */
    getEntityCount() {
        return this.movements.size;
    }
}
