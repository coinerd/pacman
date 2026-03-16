/**
 * AIStrategies
 * Pure Funktionen für AI-Verhalten
 * Keine externen Abhängigkeiten, keine Seiteneffekte
 */

import { Direction } from './Direction.js';

/**
 * Berechnet die euklidische Distanz zwischen zwei Punkten
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - Ziel X
 * @param {number} y2 - Ziel Y
 * @returns {number}
 */
export function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Berechnet die Manhattan-Distanz
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - Ziel X
 * @param {number} y2 - Ziel Y
 * @returns {number}
 */
export function getManhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Kontext für AI-Strategien
 * @typedef {Object} AIContext
 * @property {Object} entity - Die AI-Entity
 * @property {Object} player - Der Spieler
 * @property {string} mode - Aktueller Modus (SCATTER, CHASE)
 * @property {Object} scatterTarget - Ziel für Scatter-Modus
 * @property {Array<Object>} allEntities - Alle Entities (für Gamma)
 */

/**
 * Alpha: Direktes Verfolgen
 * @param {AIContext} context
 * @returns {Object|null} - Target {x, y} oder null für random
 */
export function alphaStrategy(context) {
    const { player, mode, scatterTarget } = context;

    if (mode === 'SCATTER' || !player) {
        return scatterTarget;
    }

    return {
        x: player.gridX,
        y: player.gridY
    };
}

/**
 * Beta: 4 Tiles vor dem Player
 * @param {AIContext} context
 * @returns {Object|null}
 */
export function betaStrategy(context) {
    const { player, mode, scatterTarget } = context;

    if (mode === 'SCATTER' || !player) {
        return scatterTarget;
    }

    // Beta zielt 4 Tiles vor dem Player
    let targetX = player.gridX + player.direction.x * 4;
    let targetY = player.gridY + player.direction.y * 4;

    // Reproduce original arcade bug: Up also moves target left
    if (player.direction.y === -1) {
        targetX -= 4;
    }

    return { x: targetX, y: targetY };
}

/**
 * Gamma: Vektor von Alpha durch 2 Tiles vor Player
 * @param {AIContext} context
 * @returns {Object|null}
 */
export function gammaStrategy(context) {
    const { player, mode, scatterTarget, allEntities } = context;

    if (mode === 'SCATTER' || !player) {
        return scatterTarget;
    }

    // Finde Alpha
    const alpha = allEntities?.find(e => e.aiType === 'alpha');

    // Pivot-Punkt: 2 Tiles vor Player
    const pivotX = player.gridX + player.direction.x * 2;
    const pivotY = player.gridY + player.direction.y * 2;

    if (alpha) {
        // Verdopple den Vektor von Alpha zum Pivot
        return {
            x: pivotX + (pivotX - alpha.gridX),
            y: pivotY + (pivotY - alpha.gridY)
        };
    }

    return { x: pivotX, y: pivotY };
}

/**
 * Delta: Verfolge wenn weit, fliehe wenn nah
 * @param {AIContext} context
 * @returns {Object|null}
 */
export function deltaStrategy(context) {
    const { entity, player, mode, scatterTarget } = context;

    if (mode === 'SCATTER' || !player) {
        return scatterTarget;
    }

    const dist = getDistance(
        entity.gridX,
        entity.gridY,
        player.gridX,
        player.gridY
    );

    // Wenn weit weg (>8 Tiles): verfolge
    if (dist > 8) {
        return {
            x: player.gridX,
            y: player.gridY
        };
    }

    // Wenn nah: fliehe zum Scatter-Ziel
    return scatterTarget;
}

/**
 * Random: Zufällige Zielwahl (für frightened)
 * @returns {null}
 */
export function randomStrategy() {
    return null;
}

/**
 * Zurück zum Virus Core (für eaten Zustand)
 * @param {Object} context
 * @returns {Object}
 */
export function returnToCoreStrategy(context) {
    // Standard-Virus-Core Position
    return context.virusCoreCenter || { x: 13, y: 14 };
}

/**
 * Map von AI-Typen zu Strategien
 */
export const AIStrategies = {
    alpha: alphaStrategy,
    beta: betaStrategy,
    gamma: gammaStrategy,
    delta: deltaStrategy,
    random: randomStrategy,
    returnToCore: returnToCoreStrategy
};

/**
 * Wählt die beste Richtung zu einem Target
 * @param {Object} entity - Entity mit gridX, gridY, direction
 * @param {Object|null} target - Target {x, y} oder null für random
 * @param {Array<Direction>} validDirections - Gültige Richtungen
 * @param {Function} getDistanceFn - Funktion zur Distanzberechnung
 * @returns {Direction|null}
 */
export function chooseDirectionToTarget(
    entity,
    target,
    validDirections,
    getDistanceFn = getDistance
) {
    if (validDirections.length === 0) {
        return null;
    }

    if (validDirections.length === 1) {
        return validDirections[0];
    }

    // Filtere Gegenrichtung (Entities können nicht sofort umkehren)
    let filtered = validDirections;
    if (entity.direction && entity.direction !== Direction.NONE) {
        const opposite = Direction.getOpposite(entity.direction);
        filtered = validDirections.filter(d =>
            !directionsEqual(d, opposite)
        );
    }

    // Falls alle gefiltert waren, verwende alle
    if (filtered.length === 0) {
        filtered = validDirections;
    }

    // Wenn kein Target: zufällige Richtung
    if (!target) {
        return filtered[Math.floor(Math.random() * filtered.length)];
    }

    // Wähle Richtung mit kürzester Distanz zum Target
    let bestDir = filtered[0];
    let bestDist = Infinity;

    for (const dir of filtered) {
        const newX = entity.gridX + dir.x;
        const newY = entity.gridY + dir.y;
        const dist = getDistanceFn(newX, newY, target.x, target.y);

        if (dist < bestDist) {
            bestDist = dist;
            bestDir = dir;
        }
    }

    return bestDir;
}

/**
 * Hilfsfunktion zum Vergleichen von Richtungen
 * @param {Object} dir1
 * @param {Object} dir2
 * @returns {boolean}
 */
function directionsEqual(dir1, dir2) {
    if (!dir1 || !dir2) {return false;}
    return dir1.x === dir2.x && dir1.y === dir2.y;
}

/**
 * Berechnet ein Target basierend auf AI-Typ und Zustand
 * @param {string} aiType - Typ der AI
 * @param {AIContext} context - Kontext
 * @param {string} state - Aktueller Zustand (normal, frightened, eaten)
 * @returns {Object|null}
 */
export function calculateTarget(aiType, context, state = 'normal') {
    // State-basierte Strategieauswahl
    if (state === 'eaten') {
        return returnToCoreStrategy(context);
    }

    if (state === 'frightened') {
        return randomStrategy();
    }

    // Normal: verwende typ-spezifische Strategie
    const strategy = AIStrategies[aiType];
    if (strategy) {
        return strategy(context);
    }

    return null;
}
