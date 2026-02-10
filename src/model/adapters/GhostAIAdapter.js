/**
 * GhostAIAdapter
 * Integrates Ghost AI with decoupled movement system.
 * Runs AI decision-making to determine ghost directions.
 */

import { directions, ghostModes, scatterTargets, ghostHouse } from '../../config/gameConfig.js';
import { getValidDirections, getDistance, isWalkableTile } from '../../utils/MazeLayout.js';
import { getOpposite } from '../../config/gameConfig.js';

export class GhostAIAdapter {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.modeTimer = 0;
        this.currentMode = ghostModes.SCATTER;
        this.modeDurations = [
            { mode: ghostModes.SCATTER, duration: 7 },   // 7 seconds
            { mode: ghostModes.CHASE, duration: 20 },    // 20 seconds
            { mode: ghostModes.SCATTER, duration: 7 },
            { mode: ghostModes.CHASE, duration: 20 },
            { mode: ghostModes.SCATTER, duration: 5 },
            { mode: ghostModes.CHASE, duration: 20 },
            { mode: ghostModes.SCATTER, duration: 5 },
            { mode: ghostModes.CHASE, duration: Infinity }
        ];
        this.modeIndex = 0;
    }

    /**
     * Update all ghosts' AI
     * @param {number} deltaSeconds - Time delta
     */
    update(deltaSeconds) {
        this.updateModeTimer(deltaSeconds);

        for (const ghost of this.gameModel.ghosts) {
            this.updateGhostAI(ghost, deltaSeconds);
        }
    }

    /**
     * Update mode timer and switch modes
     * @param {number} deltaSeconds - Time delta
     */
    updateModeTimer(deltaSeconds) {
        if (this.modeIndex >= this.modeDurations.length) {
            return;
        }

        this.modeTimer += deltaSeconds;
        const currentModeConfig = this.modeDurations[this.modeIndex];

        if (this.modeTimer >= currentModeConfig.duration) {
            this.modeTimer = 0;
            this.modeIndex++;
            this.currentMode = this.modeDurations[this.modeIndex]?.mode || ghostModes.CHASE;

            // Reverse all ghosts on mode change
            for (const ghost of this.gameModel.ghosts) {
                if (!ghost.isFrightened && !ghost.isEaten) {
                    this.reverseGhost(ghost);
                }
            }
        }
    }

    /**
     * Update individual ghost AI
     * @param {GhostState} ghost - Ghost to update
     * @param {number} deltaSeconds - Time delta
     */
    updateGhostAI(ghost, deltaSeconds) {
        // Skip AI for eaten ghosts (they have special logic)
        if (ghost.isEaten) {
            this.updateEatenGhost(ghost, deltaSeconds);
            return;
        }

        // Update frightened timer
        if (ghost.isFrightened) {
            ghost.updateFrightened(deltaSeconds);
        }

        // Set ghost mode
        if (!ghost.isFrightened && !ghost.isEaten) {
            ghost.mode = this.currentMode;
        }

        // AI only chooses direction at tile center
        const center = this.getTileCenter(ghost.gridX, ghost.gridY);
        const distToCenter = Math.hypot(center.x - ghost.x, center.y - ghost.y);

        if (distToCenter > 3) { // epsilon tolerance
            return;
        }

        // Choose direction based on AI
        const direction = this.chooseDirection(ghost);
        if (direction) {
            ghost.setDirection(direction);
        }
    }

    /**
     * Update eaten ghost (returning to ghost house)
     * @param {GhostState} ghost - Eaten ghost
     * @param {number} deltaSeconds - Time delta
     */
    updateEatenGhost(ghost, deltaSeconds) {
        const entranceX = ghostHouse.entrance?.x || 13;
        const entranceY = ghostHouse.entrance?.y || 11;
        const centerX = ghostHouse.center?.x || 13;
        const centerY = ghostHouse.center?.y || 14;

        // Check if in ghost house
        if (ghost.inGhostHouse) {
            ghost.houseTimer -= deltaSeconds;
            if (ghost.houseTimer <= 0) {
                ghost.houseTimer = 0;
                ghost.reset();
            }
            return;
        }

        // Check if reached ghost house center
        if (ghost.gridX === centerX && ghost.gridY === centerY) {
            ghost.inGhostHouse = true;
            ghost.houseTimer = 2; // 2 seconds in house
            ghost.direction = directions.NONE;
            return;
        }

        // Move toward ghost house entrance
        const direction = this.chooseDirectionToTarget(ghost, entranceX, entranceY);
        if (direction) {
            ghost.setDirection(direction);
        }
    }

    /**
     * Choose direction for ghost based on its AI personality
     * @param {GhostState} ghost - Ghost to choose direction for
     * @returns {Object|null} - Chosen direction
     */
    chooseDirection(ghost) {
        const validDirs = getValidDirections(
            this.gameModel.maze,
            ghost.gridX,
            ghost.gridY
        );

        if (validDirs.length === 0) {
            return null;
        }

        // Filter out reverse direction (ghosts can't reverse)
        let filteredDirs = validDirs;
        if (ghost.direction !== directions.NONE) {
            const opposite = getOpposite(ghost.direction);
            filteredDirs = validDirs.filter(d => !(d.x === opposite.x && d.y === opposite.y));
        }

        if (filteredDirs.length === 0) {
            filteredDirs = validDirs;
        }

        // Frightened: random direction
        if (ghost.isFrightened) {
            return filteredDirs[Math.floor(Math.random() * filteredDirs.length)];
        }

        // Calculate target
        const target = this.getTargetForGhost(ghost);

        // Choose direction that minimizes distance to target
        let bestDir = filteredDirs[0];
        let bestDist = Infinity;

        for (const dir of filteredDirs) {
            const newX = ghost.gridX + dir.x;
            const newY = ghost.gridY + dir.y;
            const dist = getDistance(newX, newY, target.x, target.y);

            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }

        return bestDir;
    }

    /**
     * Choose direction to reach a specific target
     * @param {GhostState} ghost - Ghost
     * @param {number} targetX - Target grid X
     * @param {number} targetY - Target grid Y
     * @returns {Object|null} - Chosen direction
     */
    chooseDirectionToTarget(ghost, targetX, targetY) {
        const validDirs = getValidDirections(
            this.gameModel.maze,
            ghost.gridX,
            ghost.gridY
        );

        if (validDirs.length === 0) {
            return null;
        }

        // Filter out reverse direction
        let filteredDirs = validDirs;
        if (ghost.direction !== directions.NONE) {
            const opposite = getOpposite(ghost.direction);
            filteredDirs = validDirs.filter(d => !(d.x === opposite.x && d.y === opposite.y));
        }

        if (filteredDirs.length === 0) {
            filteredDirs = validDirs;
        }

        // Choose direction that minimizes distance to target
        let bestDir = filteredDirs[0];
        let bestDist = Infinity;

        for (const dir of filteredDirs) {
            const newX = ghost.gridX + dir.x;
            const newY = ghost.gridY + dir.y;
            const dist = getDistance(newX, newY, targetX, targetY);

            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }

        return bestDir;
    }

    /**
     * Get target position for ghost based on its personality
     * @param {GhostState} ghost - Ghost
     * @returns {Object} - Target {x, y}
     */
    getTargetForGhost(ghost) {
        const pacman = this.gameModel.pacman;

        switch (ghost.ghostType) {
        case 'blinky':
            return this.getBlinkyTarget(pacman, ghost);
        case 'pinky':
            return this.getPinkyTarget(pacman, ghost);
        case 'inky':
            return this.getInkyTarget(pacman, ghost);
        case 'clyde':
            return this.getClydeTarget(pacman, ghost);
        default:
            return { x: pacman.gridX, y: pacman.gridY };
        }
    }

    /**
     * Blinky: Direct chase
     */
    getBlinkyTarget(pacman, ghost) {
        if (ghost.mode === ghostModes.SCATTER) {
            return scatterTargets.blinky;
        }
        return { x: pacman.gridX, y: pacman.gridY };
    }

    /**
     * Pinky: 4 tiles ahead of Pacman
     */
    getPinkyTarget(pacman, ghost) {
        if (ghost.mode === ghostModes.SCATTER) {
            return scatterTargets.pinky;
        }

        let targetX = pacman.gridX + (pacman.direction.x * 4);
        let targetY = pacman.gridY + (pacman.direction.y * 4);

        // Arcade bug: Up also moves target left
        if (pacman.direction.y === -1) {
            targetX -= 4;
        }

        return { x: targetX, y: targetY };
    }

    /**
     * Inky: Vector from Blinky through 2 tiles ahead of Pacman
     */
    getInkyTarget(pacman, ghost) {
        if (ghost.mode === ghostModes.SCATTER) {
            return scatterTargets.inky;
        }

        const blinky = this.gameModel.getGhostByType('blinky');
        const pivotX = pacman.gridX + (pacman.direction.x * 2);
        const pivotY = pacman.gridY + (pacman.direction.y * 2);

        if (blinky) {
            return {
                x: pivotX + (pivotX - blinky.gridX),
                y: pivotY + (pivotY - blinky.gridY)
            };
        }
        return { x: pivotX, y: pivotY };
    }

    /**
     * Clyde: Chase if far, scatter if close
     */
    getClydeTarget(pacman, ghost) {
        if (ghost.mode === ghostModes.SCATTER) {
            return scatterTargets.clyde;
        }

        const dist = getDistance(ghost.gridX, ghost.gridY, pacman.gridX, pacman.gridY);

        if (dist > 8) {
            return { x: pacman.gridX, y: pacman.gridY };
        } else {
            // Return to scatter corner if too close
            return scatterTargets.clyde;
        }
    }

    /**
     * Reverse ghost direction
     * @param {GhostState} ghost - Ghost to reverse
     */
    reverseGhost(ghost) {
        if (ghost.direction !== directions.NONE) {
            const opposite = getOpposite(ghost.direction);
            ghost.direction = opposite;
        }
    }

    /**
     * Get tile center position
     * @param {number} gridX - Grid X
     * @param {number} gridY - Grid Y
     * @returns {Object} - Center position {x, y}
     */
    getTileCenter(gridX, gridY) {
        const tileSize = 20; // From gameConfig
        return {
            x: gridX * tileSize + tileSize / 2,
            y: gridY * tileSize + tileSize / 2
        };
    }

    /**
     * Reset AI state
     */
    reset() {
        this.modeTimer = 0;
        this.modeIndex = 0;
        this.currentMode = ghostModes.SCATTER;
    }
}
