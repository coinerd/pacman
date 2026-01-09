import { scoreValues } from '../config/gameConfig.js';

/**
 * Tile-based collision detection for Pac-Man vs Ghosts
 *
 * Uses grid positions (gridX, gridY, prevGridX, prevGridY) instead of pixel-based methods.
 * This eliminates collision bugs like:
 * - Corner misses (entities crossing at same moment)
 * - Tunneling (entities passing through each other)
 * - dt-spike collisions (high delta time causing missed collisions)
 * - Off-by-one errors (grid boundary issues)
 * - Crossing misses (entities moving perpendicular)
 *
 * Key invariants:
 * - Crossing detection: Entities cross paths in same timestep
 *   pacman.prevGridX === ghost.gridX && pacman.prevGridY === ghost.gridY &&
 *   ghost.prevGridX === pacman.gridX && ghost.prevGridY === pacman.gridY
 * - Same-tile detection: Both entities end up in same tile
 * - Grid-based: Uses tile coordinates, not pixel coordinates
 * - Deterministic: Fixed timestep ensures consistent detection
 */

export function checkCrossingCollision(pacman, ghost) {
    if (pacman.prevGridX === undefined || pacman.prevGridY === undefined ||
        ghost.prevGridX === undefined || ghost.prevGridY === undefined) {
        return null;
    }

    const crossed = pacman.prevGridX === ghost.gridX && pacman.prevGridY === ghost.gridY &&
                    ghost.prevGridX === pacman.gridX && ghost.prevGridY === pacman.gridY;

    if (!crossed) {
        return null;
    }

    if (ghost.isEaten) {
        return null;
    }

    if (ghost.isFrightened) {
        return {
            type: 'ghost_eaten',
            ghostIndex: ghost.name
        };
    }

    return {
        type: 'pacman_died',
        ghostIndex: ghost.name
    };
}

export function checkSameTileCollision(pacman, ghost) {
    if (pacman.gridX === undefined || pacman.gridY === undefined ||
        ghost.gridX === undefined || ghost.gridY === undefined) {
        return null;
    }

    const sameTile = pacman.gridX === ghost.gridX && pacman.gridY === ghost.gridY;

    if (!sameTile) {
        return null;
    }

    if (ghost.isEaten) {
        return null;
    }

    if (ghost.isFrightened) {
        return {
            type: 'ghost_eaten',
            ghostIndex: ghost.name
        };
    }

    return {
        type: 'pacman_died',
        ghostIndex: ghost.name
    };
}

export function checkGhostCollision(pacman, ghost) {
    const crossingResult = checkCrossingCollision(pacman, ghost);
    if (crossingResult) {
        return crossingResult;
    }

    const sameTileResult = checkSameTileCollision(pacman, ghost);
    if (sameTileResult) {
        return sameTileResult;
    }

    return null;
}

export function checkAllGhostCollisions(pacman, ghosts) {
    for (const ghost of ghosts) {
        const collision = checkGhostCollision(pacman, ghost);
        if (collision) {
            return collision;
        }
    }
    return null;
}

export function getGhostScore(ghostsEatenCount) {
    const scoreIndex = Math.min(ghostsEatenCount, scoreValues.ghost.length - 1);
    return scoreValues.ghost[scoreIndex] || 200;
}

export function resetGhostEatenCount() {
}
