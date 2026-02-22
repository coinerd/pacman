/**
 * IMovementSystem
 * Interface für das Movement System
 * Definiert den Vertrag zwischen GameModel und Movement System
 */

/**
 * @typedef {Object} MovementConfig
 * @property {number} tileSize - Größe eines Tiles in Pixeln
 * @property {number} tunnelRow - Zeile für Tunnel-Wrapping
 * @property {number} defaultSpeed - Standard-Geschwindigkeit
 * @property {Object} virusCoreCenter - Zentrum des Virus Cores
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
 * @property {string} type - Entity-Typ (player, enemy, etc.)
 */

/**
 * @typedef {Object} MovementState
 * @property {string} entityId
 * @property {Object} position - {x, y}
 * @property {Direction} direction
 * @property {number} moveProgress - 0.0 bis 1.0
 * @property {boolean} isMoving
 * @property {string} status - 'idle' | 'moving' | 'turning'
 */

/**
 * @typedef {Object} MovementEvent
 * @property {string} type - 'movement_started' | 'movement_completed' | 'direction_changed' | 'tunnel_wrap'
 * @property {string} entityId
 * @property {Object} payload - Event-spezifische Daten
 * @property {number} timestamp
 */

/**
 * @typedef {Object} Direction
 * @property {number} x - X-Komponente (-1, 0, 1)
 * @property {number} y - Y-Komponente (-1, 0, 1)
 * @property {number} angle - Winkel in Grad (0, 90, 180, 270)
 * @property {string} name - Name der Richtung
 */

/**
 * Interface das jedes Movement System implementieren muss
 */
export class IMovementSystem {
    /**
     * Initialisiert das Movement System
     * @param {Array<Array<number>>} mazeGrid - 2D-Array des Mazes
     * @param {MovementConfig} config - Konfiguration
     */
    initialize(mazeGrid, config) {
        throw new Error('Not implemented');
    }

    /**
     * Registriert eine Entity für Movement
     * @param {MovementEntity} entity - Die zu registrierende Entity
     * @param {Object} options - Optionale Parameter (aiType, scatterTarget, etc.)
     */
    registerEntity(entity, options = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Entfernt eine Entity
     * @param {string} entityId - ID der Entity
     */
    unregisterEntity(entityId) {
        throw new Error('Not implemented');
    }

    /**
     * Haupt-Update-Methode
     * @param {number} deltaSeconds - Zeit seit letztem Frame
     * @param {Object} context - Kontext mit Entities, Player, etc.
     * @returns {MovementEvent[]} - Generierte Events
     */
    update(deltaSeconds, context = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Setzt die Bewegungsrichtung einer Entity
     * @param {string} entityId - ID der Entity
     * @param {Direction} direction - Neue Richtung
     * @returns {boolean} - True wenn erfolgreich
     */
    setDirection(entityId, direction) {
        throw new Error('Not implemented');
    }

    /**
     * Gibt den aktuellen Movement-State zurück
     * @param {string} entityId - ID der Entity
     * @returns {MovementState|null}
     */
    getMovementState(entityId) {
        throw new Error('Not implemented');
    }

    /**
     * Setzt die Geschwindigkeit einer Entity
     * @param {string} entityId - ID der Entity
     * @param {number} speed - Neue Geschwindigkeit
     */
    setSpeed(entityId, speed) {
        throw new Error('Not implemented');
    }

    /**
     * Setzt einen Speed-Multiplier
     * @param {string} entityId - ID der Entity
     * @param {number} multiplier - Multiplier (z.B. 0.5 für frightened)
     */
    setSpeedMultiplier(entityId, multiplier) {
        throw new Error('Not implemented');
    }

    /**
     * Setzt frightened Zustand
     * @param {string} entityId - ID der Entity
     * @param {number} duration - Dauer in Sekunden
     */
    setFrightened(entityId, duration) {
        throw new Error('Not implemented');
    }

    /**
     * Markiert Entity als eaten
     * @param {string} entityId - ID der Entity
     */
    setEaten(entityId) {
        throw new Error('Not implemented');
    }

    /**
     * Reset einer Entity nach Respawn
     * @param {string} entityId - ID der Entity
     * @param {number} gridX - Neue Grid-X-Position
     * @param {number} gridY - Neue Grid-Y-Position
     */
    resetEntity(entityId, gridX, gridY) {
        throw new Error('Not implemented');
    }

    /**
     * Pausiert alle Bewegungen
     */
    pause() {
        throw new Error('Not implemented');
    }

    /**
     * Resumiert alle Bewegungen
     */
    resume() {
        throw new Error('Not implemented');
    }

    /**
     * Reset des kompletten Systems
     */
    reset() {
        throw new Error('Not implemented');
    }
}
