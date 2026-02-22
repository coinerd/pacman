/**
 * Pathfinding
 * Erweiterte Pfadfindung für das Movement System
 * BFS und A* Algorithmen für komplexe Navigation
 */

import { Direction } from '../core/Direction.js';

/**
 * Node für Pathfinding
 */
class PathNode {
    constructor(x, y, parent = null) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.g = 0; // Cost from start
        this.h = 0; // Heuristic cost to goal
        this.f = 0; // Total cost
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}

/**
 * BFS Pathfinding
 * Findet kürzesten Weg (unweighted)
 * @param {number} startX - Start X
 * @param {number} startY - Start Y
 * @param {number} goalX - Goal X
 * @param {number} goalY - Goal Y
 * @param {IMazeAdapter} mazeAdapter - Maze adapter
 * @returns {Array<Direction>|null} - Array of directions or null if no path
 */
export function findPathBFS(startX, startY, goalX, goalY, mazeAdapter) {
    if (startX === goalX && startY === goalY) {
        return [];
    }

    const queue = [new PathNode(startX, startY)];
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    const directions = [
        { dir: Direction.UP, dx: 0, dy: -1 },
        { dir: Direction.DOWN, dx: 0, dy: 1 },
        { dir: Direction.LEFT, dx: -1, dy: 0 },
        { dir: Direction.RIGHT, dx: 1, dy: 0 }
    ];

    while (queue.length > 0) {
        const current = queue.shift();

        for (const { dir, dx, dy } of directions) {
            const newX = current.x + dx;
            const newY = current.y + dy;
            const key = `${newX},${newY}`;

            if (visited.has(key)) {continue;}
            if (!mazeAdapter.isWalkable(newX, newY)) {continue;}

            const neighbor = new PathNode(newX, newY, current);
            neighbor.dir = dir;

            if (newX === goalX && newY === goalY) {
                // Reconstruct path
                return reconstructPath(neighbor);
            }

            visited.add(key);
            queue.push(neighbor);
        }
    }

    return null; // No path found
}

/**
 * A* Pathfinding
 * Findet optimalen Weg mit Heuristik
 * @param {number} startX - Start X
 * @param {number} startY - Start Y
 * @param {number} goalX - Goal X
 * @param {number} goalY - Goal Y
 * @param {IMazeAdapter} mazeAdapter - Maze adapter
 * @returns {Array<Direction>|null} - Array of directions or null if no path
 */
export function findPathAStar(startX, startY, goalX, goalY, mazeAdapter) {
    if (startX === goalX && startY === goalY) {
        return [];
    }

    const startNode = new PathNode(startX, startY);
    startNode.h = manhattanDistance(startX, startY, goalX, goalY);
    startNode.f = startNode.h;

    const openSet = [startNode];
    const closedSet = new Set();

    const directions = [
        { dir: Direction.UP, dx: 0, dy: -1 },
        { dir: Direction.DOWN, dx: 0, dy: 1 },
        { dir: Direction.LEFT, dx: -1, dy: 0 },
        { dir: Direction.RIGHT, dx: 1, dy: 0 }
    ];

    while (openSet.length > 0) {
        // Find node with lowest f score
        let currentIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[currentIndex].f) {
                currentIndex = i;
            }
        }

        const current = openSet[currentIndex];

        if (current.x === goalX && current.y === goalY) {
            return reconstructPath(current);
        }

        openSet.splice(currentIndex, 1);
        closedSet.add(`${current.x},${current.y}`);

        for (const { dir, dx, dy } of directions) {
            const newX = current.x + dx;
            const newY = current.y + dy;
            const key = `${newX},${newY}`;

            if (closedSet.has(key)) {continue;}
            if (!mazeAdapter.isWalkable(newX, newY)) {continue;}

            const neighbor = new PathNode(newX, newY, current);
            neighbor.g = current.g + 1;
            neighbor.h = manhattanDistance(newX, newY, goalX, goalY);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.dir = dir;

            // Check if neighbor is already in openSet with lower g
            const existingIndex = openSet.findIndex(n => n.equals(neighbor));
            if (existingIndex !== -1 && openSet[existingIndex].g <= neighbor.g) {
                continue;
            }

            if (existingIndex === -1) {
                openSet.push(neighbor);
            }
        }
    }

    return null; // No path found
}

/**
 * Rekonstruiert Pfad aus Nodes
 * @param {PathNode} endNode - End node
 * @returns {Array<Direction>} - Array of directions
 */
function reconstructPath(endNode) {
    const path = [];
    let current = endNode;

    while (current.parent) {
        path.unshift(current.dir);
        current = current.parent;
    }

    return path;
}

/**
 * Manhattan Distance Heuristik
 */
function manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Prüft ob ein direkter Pfad existiert (ohne Umwege)
 */
export function hasDirectPath(startX, startY, goalX, goalY, mazeAdapter) {
    // Same row - check horizontal path
    if (startY === goalY) {
        const minX = Math.min(startX, goalX);
        const maxX = Math.max(startX, goalX);
        for (let x = minX; x <= maxX; x++) {
            if (!mazeAdapter.isWalkable(x, startY)) {return false;}
        }
        return true;
    }

    // Same column - check vertical path
    if (startX === goalX) {
        const minY = Math.min(startY, goalY);
        const maxY = Math.max(startY, goalY);
        for (let y = minY; y <= maxY; y++) {
            if (!mazeAdapter.isWalkable(startX, y)) {return false;}
        }
        return true;
    }

    return false;
}

/**
 * Findet alternative Wege (für Flucht-Verhalten)
 */
export function findEscapeRoutes(fromX, fromY, dangerX, dangerY, mazeAdapter, count = 3) {
    const validDirections = mazeAdapter.getValidDirections(fromX, fromY);
    const routes = [];

    for (const dir of validDirections) {
        const newX = fromX + dir.x;
        const newY = fromY + dir.y;

        // Calculate distance from danger
        const distToDanger = manhattanDistance(newX, newY, dangerX, dangerY);
        const currentDist = manhattanDistance(fromX, fromY, dangerX, dangerY);

        // Prefer directions that increase distance
        const score = distToDanger - currentDist;

        routes.push({
            direction: dir,
            newX,
            newY,
            score,
            distance: distToDanger
        });
    }

    // Sort by score (prefer increasing distance)
    routes.sort((a, b) => b.score - a.score);

    return routes.slice(0, count);
}

/**
 * Pathfinding mit Zeitlimit
 */
export function findPathWithTimeout(startX, startY, goalX, goalY, mazeAdapter, maxMs = 10) {
    const startTime = performance.now();

    // Use simpler BFS for timeout-based pathfinding
    const result = findPathBFS(startX, startY, goalX, goalY, mazeAdapter);

    const elapsed = performance.now() - startTime;
    if (elapsed > maxMs) {
        console.warn(`Pathfinding timeout: ${elapsed.toFixed(2)}ms`);
    }

    return result;
}
