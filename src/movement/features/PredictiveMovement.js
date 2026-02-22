/**
 * PredictiveMovement
 * Vorhersage von Bewegungen für verbesserte KI-Entscheidungen
 */

import { Direction } from '../core/Direction.js';

/**
 * Bewegungs-Vorhersage
 * Simuliert zukünftige Positionen einer Entity
 */
export class MovementPredictor {
    constructor(mazeAdapter) {
        this.mazeAdapter = mazeAdapter;
    }

    /**
     * Vorhersagt zukünftige Positionen einer Entity
     * @param {Object} entity - Entity mit gridX, gridY, direction, speed
     * @param {number} timeHorizon - Zeit in Sekunden für Vorhersage
     * @param {number} timeStep - Zeitschritt für Simulation
     * @returns {Array<Object>} - Array von vorhergesagten Positionen
     */
    predictPositions(entity, timeHorizon = 2.0, timeStep = 0.1) {
        const positions = [];
        let currentX = entity.gridX;
        let currentY = entity.gridY;
        let currentDirection = entity.direction;

        for (let t = 0; t <= timeHorizon; t += timeStep) {
            // Estimate position at time t
            const tilesPerSecond = entity.speed / this.mazeAdapter.getTileSize();
            const tilesMoved = Math.floor(t * tilesPerSecond);

            let predictedX = currentX + currentDirection.x * tilesMoved;
            let predictedY = currentY + currentDirection.y * tilesMoved;

            // Handle intersections (if we reach a decision point)
            const validDirs = this.mazeAdapter.getValidDirections(
                Math.round(predictedX),
                Math.round(predictedY)
            );

            positions.push({
                time: t,
                gridX: predictedX,
                gridY: predictedY,
                direction: currentDirection,
                isDecisionPoint: validDirs.length > 2
            });
        }

        return positions;
    }

    /**
     * Findet Kollisions-Punkte zwischen zwei Entities
     * @param {Object} entity1 - Erste Entity
     * @param {Object} entity2 - Zweite Entity
     * @param {number} timeHorizon - Vorhersage-Zeitraum
     * @returns {Array<Object>} - Potenzielle Kollisions-Punkte
     */
    findCollisionPoints(entity1, entity2, timeHorizon = 3.0) {
        const collisions = [];
        const pos1 = this.predictPositions(entity1, timeHorizon);
        const pos2 = this.predictPositions(entity2, timeHorizon);

        for (const p1 of pos1) {
            for (const p2 of pos2) {
                if (Math.abs(p1.time - p2.time) < 0.1) {
                    const dist = Math.sqrt(
                        Math.pow(p1.gridX - p2.gridX, 2) +
                        Math.pow(p1.gridY - p2.gridY, 2)
                    );

                    if (dist < 1.5) { // Close proximity
                        collisions.push({
                            time: (p1.time + p2.time) / 2,
                            gridX: (p1.gridX + p2.gridX) / 2,
                            gridY: (p1.gridY + p2.gridY) / 2,
                            distance: dist
                        });
                    }
                }
            }
        }

        return collisions;
    }

    /**
     * Berechnet Interception-Punkt
     * Wo wird Entity 2 Entity 1 abfangen?
     * @param {Object} chaser - Verfolger
     * @param {Object} target - Ziel
     * @returns {Object|null} - Interception-Punkt oder null
     */
    calculateInterception(chaser, target) {
        const chaserPos = this.predictPositions(chaser, 5.0, 0.2);
        const targetPos = this.predictPositions(target, 5.0, 0.2);

        for (const p1 of chaserPos) {
            for (const p2 of targetPos) {
                if (Math.abs(p1.time - p2.time) < 0.2) {
                    const dist = Math.sqrt(
                        Math.pow(p1.gridX - p2.gridX, 2) +
                        Math.pow(p1.gridY - p2.gridY, 2)
                    );

                    if (dist < 0.5) {
                        return {
                            time: p1.time,
                            gridX: Math.round(p1.gridX),
                            gridY: Math.round(p1.gridY)
                        };
                    }
                }
            }
        }

        return null;
    }
}

/**
 * Entscheidungs-Baum für komplexe Bewegungs-Entscheidungen
 */
export class DecisionTree {
    constructor(mazeAdapter, maxDepth = 3) {
        this.mazeAdapter = mazeAdapter;
        this.maxDepth = maxDepth;
    }

    /**
     * Evaluiert beste Bewegung basierend auf mehreren Faktoren
     * @param {Object} entity - Aktuelle Entity
     * @param {Object} context - Kontext mit anderen Entities, Zielen, etc.
     * @returns {Direction} - Beste Richtung
     */
    evaluateBestMove(entity, context) {
        const validDirections = this.mazeAdapter.getValidDirections(
            entity.gridX,
            entity.gridY
        );

        if (validDirections.length === 0) {return Direction.NONE;}
        if (validDirections.length === 1) {return validDirections[0];}

        const scoredMoves = validDirections.map(dir => {
            const score = this.evaluateMove(entity, dir, context, 0);
            return { direction: dir, score };
        });

        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0].direction;
    }

    /**
     * Rekursive Bewertung einer Bewegung
     */
    evaluateMove(entity, direction, context, depth) {
        if (depth >= this.maxDepth) {return 0;}

        const newX = entity.gridX + direction.x;
        const newY = entity.gridY + direction.y;

        let score = 0;

        // Factor 1: Distance to target (if chasing)
        if (context.target) {
            const dist = Math.sqrt(
                Math.pow(newX - context.target.gridX, 2) +
                Math.pow(newY - context.target.gridY, 2)
            );
            score -= dist; // Prefer closer to target
        }

        // Factor 2: Distance from threats (if fleeing)
        if (context.threats) {
            for (const threat of context.threats) {
                const dist = Math.sqrt(
                    Math.pow(newX - threat.gridX, 2) +
                    Math.pow(newY - threat.gridY, 2)
                );
                score += dist * 0.5; // Prefer farther from threats
            }
        }

        // Factor 3: Available options at new position
        const futureOptions = this.mazeAdapter.getValidDirections(newX, newY).length;
        score += futureOptions * 0.1; // Prefer positions with more options

        // Factor 4: Avoid reversing direction (momentum)
        if (entity.direction && direction === Direction.getOpposite(entity.direction)) {
            score -= 2; // Penalty for reversing
        }

        // Recursive evaluation (look ahead)
        if (depth < this.maxDepth - 1) {
            const futureEntity = {
                gridX: newX,
                gridY: newY,
                direction: direction,
                speed: entity.speed
            };

            const futureDirections = this.mazeAdapter.getValidDirections(newX, newY)
                .filter(d => d !== Direction.getOpposite(direction));

            if (futureDirections.length > 0) {
                const futureScores = futureDirections.map(d =>
                    this.evaluateMove(futureEntity, d, context, depth + 1)
                );
                score += Math.max(...futureScores) * 0.7; // Discount future
            }
        }

        return score;
    }
}

/**
 * Zone-basierte Bewegungs-Planung
 */
export class ZoneMovementPlanner {
    constructor(mazeAdapter) {
        this.mazeAdapter = mazeAdapter;
        this.zones = this.calculateZones();
    }

    /**
     * Berechnet Zonen basierend auf Maze-Topologie
     */
    calculateZones() {
        const zones = [];
        const visited = new Set();
        const width = this.mazeAdapter.getWidth();
        const height = this.mazeAdapter.getHeight();

        let zoneId = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (visited.has(`${x},${y}`)) {continue;}
                if (!this.mazeAdapter.isWalkable(x, y)) {continue;}

                // Flood fill to find connected zone
                const zone = this.floodFillZone(x, y, visited, zoneId++);
                if (zone.tiles.length > 0) {
                    zones.push(zone);
                }
            }
        }

        return zones;
    }

    floodFillZone(startX, startY, visited, zoneId) {
        const tiles = [];
        const queue = [{ x: startX, y: startY }];

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) {continue;}
            if (!this.mazeAdapter.isWalkable(x, y)) {continue;}

            visited.add(key);
            tiles.push({ x, y });

            // Add neighbors
            const neighbors = [
                { x: x + 1, y },
                { x: x - 1, y },
                { x, y: y + 1 },
                { x, y: y - 1 }
            ];

            for (const n of neighbors) {
                if (!visited.has(`${n.x},${n.y}`)) {
                    queue.push(n);
                }
            }
        }

        return { id: zoneId, tiles };
    }

    /**
     * Findet Zone für eine Position
     */
    getZoneForPosition(gridX, gridY) {
        for (const zone of this.zones) {
            if (zone.tiles.some(t => t.x === gridX && t.y === gridY)) {
                return zone;
            }
        }
        return null;
    }

    /**
     * Findet Zonen-Übergänge (engpässe)
     */
    findZoneTransitions() {
        const transitions = [];

        // Find positions that connect different zones
        for (const zone of this.zones) {
            for (const tile of zone.tiles) {
                const neighbors = this.mazeAdapter.getValidDirections(tile.x, tile.y);

                for (const dir of neighbors) {
                    const nx = tile.x + dir.x;
                    const ny = tile.y + dir.y;

                    const neighborZone = this.getZoneForPosition(nx, ny);
                    if (neighborZone && neighborZone.id !== zone.id) {
                        transitions.push({
                            from: zone.id,
                            to: neighborZone.id,
                            x: tile.x,
                            y: tile.y,
                            direction: dir
                        });
                    }
                }
            }
        }

        return transitions;
    }
}
