/**
 * IAIController
 * Interface für AI-Controller
 * Entkoppelt AI-Logik vom Movement System
 */

/**
 * @typedef {Object} AIContext
 * @property {Function} getEntityState - Funktion um Entity-State zu erhalten
 * @property {Object} player - Player-Entity
 * @property {Array<Object>} allEntities - Alle Entities
 * @property {IMazeAdapter} mazeAdapter - Maze-Adapter
 */

/**
 * @typedef {Object} AIDecision
 * @property {string} entityId - ID der Entity
 * @property {Direction} direction - Gewählte Richtung
 * @property {string} mode - Aktueller Modus (SCATTER, CHASE, FRIGHTENED, EATEN)
 */

/**
 * @typedef {Object} AIConfig
 * @property {string} aiType - Typ der AI (alpha, beta, gamma, delta)
 * @property {string} mode - Aktueller Modus
 * @property {boolean} isFrightened - Im frightened Zustand
 * @property {boolean} isEaten - Im eaten Zustand
 * @property {number} frightenedTimer - Verbleibende frightened Zeit
 * @property {Object} scatterTarget - Ziel für Scatter-Modus
 */

/**
 * Interface das jeder AI-Controller implementieren muss
 */
export class IAIController {
    /**
     * Registriert eine Entity für AI
     * @param {string} entityId - ID der Entity
     * @param {string} aiType - Typ der AI (alpha, beta, gamma, delta)
     * @param {Object} options - Optionale Parameter
     */
    registerEntity(_entityId, aiType, options = {}) {
        throw new Error('Not implemented');
    }

    /**
     * Entfernt eine Entity
     * @param {string} entityId - ID der Entity
     */
    unregisterEntity(_entityId) {
        throw new Error('Not implemented');
    }

    /**
     * Haupt-Update-Methode
     * @param {number} deltaSeconds - Zeit seit letztem Frame
     * @param {AIContext} context - AI-Kontext
     * @returns {Array<AIDecision>} - Array von AI-Entscheidungen
     */
    update(_deltaSeconds, _context) {
        throw new Error('Not implemented');
    }

    /**
     * Setzt frightened Zustand
     * @param {string} entityId - ID der Entity
     * @param {number} duration - Dauer in Sekunden
     */
    setFrightened(_entityId, duration) {
        throw new Error('Not implemented');
    }

    /**
     * Markiert Entity als eaten
     * @param {string} entityId - ID der Entity
     */
    setEaten(_entityId) {
        throw new Error('Not implemented');
    }

    /**
     * Reset einer Entity nach Respawn
     * @param {string} entityId - ID der Entity
     */
    resetEntity(_entityId) {
        throw new Error('Not implemented');
    }

    /**
     * Setzt den aktuellen Modus
     * @param {string} entityId - ID der Entity
     * @param {string} mode - Neuer Modus
     */
    setMode(_entityId, mode) {
        throw new Error('Not implemented');
    }

    /**
     * Reset des kompletten AI-Controllers
     */
    reset() {
        throw new Error('Not implemented');
    }
}
