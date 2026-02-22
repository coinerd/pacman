/**
 * Direction
 * Unabhängige Direction-Definition
 * Keine Abhängigkeit zu gameConfig oder anderen externen Modulen
 */

// Zuerst die einzelnen Konstanten definieren
const UP = Object.freeze({ x: 0, y: -1, angle: 270, name: 'UP' });
const DOWN = Object.freeze({ x: 0, y: 1, angle: 90, name: 'DOWN' });
const LEFT = Object.freeze({ x: -1, y: 0, angle: 180, name: 'LEFT' });
const RIGHT = Object.freeze({ x: 1, y: 0, angle: 0, name: 'RIGHT' });
const NONE = Object.freeze({ x: 0, y: 0, angle: 0, name: 'NONE' });

const ALL = Object.freeze([UP, DOWN, LEFT, RIGHT]);

/**
 * Unveränderliche Direction-Konstanten
 */
export const Direction = Object.freeze({
    UP,
    DOWN,
    LEFT,
    RIGHT,
    NONE,

    /**
     * Alle Richtungen als Array
     */
    ALL,

    /**
     * Prüft ob zwei Richtungen entgegengesetzt sind
     * @param {Object} dir1 - Erste Richtung
     * @param {Object} dir2 - Zweite Richtung
     * @returns {boolean}
     */
    isOpposite(dir1, dir2) {
        if (!dir1 || !dir2) {return false;}
        return dir1.x === -dir2.x && dir1.y === -dir2.y;
    },

    /**
     * Gibt die entgegengesetzte Richtung zurück
     * @param {Object} dir - Richtung
     * @returns {Object} - Entgegengesetzte Richtung
     */
    getOpposite(dir) {
        if (!dir || dir === NONE) {return NONE;}
        return ALL.find(d => d.x === -dir.x && d.y === -dir.y) || NONE;
    },

    /**
     * Konvertiert einen Winkel in eine Richtung
     * @param {number} angle - Winkel in Grad (0, 90, 180, 270)
     * @returns {Object}
     */
    fromAngle(angle) {
        switch (angle) {
        case 0: return RIGHT;
        case 90: return DOWN;
        case 180: return LEFT;
        case 270: return UP;
        default: return NONE;
        }
    },

    /**
     * Konvertiert einen Namen in eine Richtung
     * @param {string} name - Name der Richtung
     * @returns {Object}
     */
    fromName(name) {
        switch (name?.toUpperCase()) {
        case 'UP': return UP;
        case 'DOWN': return DOWN;
        case 'LEFT': return LEFT;
        case 'RIGHT': return RIGHT;
        default: return NONE;
        }
    },

    /**
     * Konvertiert Delta-Koordinaten in eine Richtung
     * @param {number} x - X-Delta (-1, 0, 1)
     * @param {number} y - Y-Delta (-1, 0, 1)
     * @returns {Object}
     */
    fromDelta(x, y) {
        if (x === 0 && y === -1) {return UP;}
        if (x === 0 && y === 1) {return DOWN;}
        if (x === -1 && y === 0) {return LEFT;}
        if (x === 1 && y === 0) {return RIGHT;}
        return NONE;
    },

    /**
     * Validiert eine Richtung
     * @param {Object} dir - Zu validierende Richtung
     * @returns {boolean}
     */
    isValid(dir) {
        if (!dir) {return false;}
        return ALL.some(d =>
            d.x === dir.x && d.y === dir.y && d.angle === dir.angle
        ) || dir === NONE;
    }
});

/**
 * Hilfsfunktion zum Vergleichen von Richtungen
 * @param {Object} dir1 - Erste Richtung
 * @param {Object} dir2 - Zweite Richtung
 * @returns {boolean}
 */
export function directionsEqual(dir1, dir2) {
    if (!dir1 || !dir2) {return false;}
    return dir1.x === dir2.x && dir1.y === dir2.y;
}

/**
 * Hilfsfunktion zum Serialisieren einer Richtung
 * @param {Object} dir - Richtung
 * @returns {string}
 */
export function directionToString(dir) {
    if (!dir) {return 'NONE';}
    return dir.name || 'NONE';
}
