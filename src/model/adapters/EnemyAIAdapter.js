/**
 * EnemyAIAdapter
 * Integrates Enemy AI with decoupled movement system.
 * Runs AI decision-making to determine enemy directions.
 */

import {
    directions,
    getOpposite,
    ghostHouse,
    ghostModes,
    scatterTargets
} from '../../config/gameConfig.js';
import { getDistance, getValidDirections } from '../../utils/MazeLayout.js';

export class EnemyAIAdapter {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.modeTimer = 0;
        this.currentMode = ghostModes.SCATTER;
        this.modeDurations = [
            { mode: ghostModes.SCATTER, duration: 7 }, // 7 seconds
            { mode: ghostModes.CHASE, duration: 20 }, // 20 seconds
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
	 * Update all enemies' AI
	 * @param {number} deltaSeconds - Time delta
	 */
    update(deltaSeconds) {
        this.updateModeTimer(deltaSeconds);

        for (const enemy of this.gameModel.ghosts) {
            this.updateEnemyAI(enemy, deltaSeconds);
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
            this.currentMode =
				this.modeDurations[this.modeIndex]?.mode || ghostModes.CHASE;

            // Reverse all enemies on mode change
            for (const enemy of this.gameModel.ghosts) {
                if (!enemy.isFrightened && !enemy.isEaten) {
                    this.reverseEnemy(enemy);
                }
            }
        }
    }

    /**
	 * Update individual enemy AI
	 * @param {GhostState} enemy - Enemy to update
	 * @param {number} deltaSeconds - Time delta
	 */
    updateEnemyAI(enemy, deltaSeconds) {
        // Skip AI for eaten enemies (they have special logic)
        if (enemy.isEaten) {
            this.updateEliminatedEnemy(enemy, deltaSeconds);
            return;
        }

        // Update frightened timer
        if (enemy.isFrightened) {
            enemy.updateFrightened(deltaSeconds);
        }

        // Set enemy mode
        if (!enemy.isFrightened && !enemy.isEaten) {
            enemy.mode = this.currentMode;
        }

        // AI chooses direction at tile center OR when blocked
        // When blocked, enemy is at tile boundary (10px from center of current tile,
        // which is center of tile we're trying to enter)
        const center = this.getTileCenter(enemy.gridX, enemy.gridY);
        const distToCenter = Math.hypot(center.x - enemy.x, center.y - enemy.y);
        const EPSILON = 3;
        const BLOCKED_EPSILON = 12; // Allow direction choice when blocked near boundary

        // Check if we're close enough to center to make a decision
        // OR if we're blocked (not moving but have a direction)
        const isAtDecisionPoint = distToCenter <= EPSILON;
        const isBlocked = !enemy.isMoving && enemy.direction !== directions.NONE;

        if (!isAtDecisionPoint && !isBlocked) {
            return;
        }

        // When blocked at boundary, snap to center of tile we're in
        // This ensures AI makes decision from a valid grid position
        if (isBlocked && distToCenter <= BLOCKED_EPSILON) {
            enemy.x = center.x;
            enemy.y = center.y;
        }

        // Choose direction based on AI
        const direction = this.chooseDirection(enemy);
        if (direction) {
            enemy.setDirection(direction);
        }
    }

    /**
	 * Update eliminated enemy (returning to ghost house)
	 * @param {GhostState} enemy - Eliminated enemy
	 * @param {number} deltaSeconds - Time delta
	 */
    updateEliminatedEnemy(enemy, deltaSeconds) {
        const entranceX = ghostHouse.entrance?.x || 13;
        const entranceY = ghostHouse.entrance?.y || 11;
        const centerX = ghostHouse.center?.x || 13;
        const centerY = ghostHouse.center?.y || 14;

        // Check if in ghost house
        if (enemy.inGhostHouse) {
            enemy.houseTimer -= deltaSeconds;
            if (enemy.houseTimer <= 0) {
                enemy.houseTimer = 0;
                enemy.reset();
            }
            return;
        }

        // Check if reached ghost house center
        if (enemy.gridX === centerX && enemy.gridY === centerY) {
            enemy.inGhostHouse = true;
            enemy.houseTimer = 2; // 2 seconds in house
            enemy.direction = directions.NONE;
            return;
        }

        // Move toward ghost house entrance
        const direction = this.chooseDirectionToTarget(enemy, entranceX, entranceY);
        if (direction) {
            enemy.setDirection(direction);
        }
    }

    /**
	 * Choose direction for enemy based on its AI personality
	 * @param {GhostState} enemy - Enemy to choose direction for
	 * @returns {Object|null} - Chosen direction
	 */
    chooseDirection(enemy) {
        const validDirs = getValidDirections(
            this.gameModel.maze,
            enemy.gridX,
            enemy.gridY
        );

        if (validDirs.length === 0) {
            return null;
        }

        // Filter out reverse direction (enemies can't reverse)
        let filteredDirs = validDirs;
        if (enemy.direction !== directions.NONE) {
            const opposite = getOpposite(enemy.direction);
            filteredDirs = validDirs.filter(
                (d) => !(d.x === opposite.x && d.y === opposite.y)
            );
        }

        if (filteredDirs.length === 0) {
            filteredDirs = validDirs;
        }

        // Frightened: random direction
        if (enemy.isFrightened) {
            return filteredDirs[Math.floor(Math.random() * filteredDirs.length)];
        }

        // Calculate target
        const target = this.getTargetForEnemy(enemy);

        // Choose direction that minimizes distance to target
        let bestDir = filteredDirs[0];
        let bestDist = Infinity;

        for (const dir of filteredDirs) {
            const newX = enemy.gridX + dir.x;
            const newY = enemy.gridY + dir.y;
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
	 * @param {GhostState} enemy - Enemy
	 * @param {number} targetX - Target grid X
	 * @param {number} targetY - Target grid Y
	 * @returns {Object|null} - Chosen direction
	 */
    chooseDirectionToTarget(enemy, targetX, targetY) {
        const validDirs = getValidDirections(
            this.gameModel.maze,
            enemy.gridX,
            enemy.gridY
        );

        if (validDirs.length === 0) {
            return null;
        }

        // Filter out reverse direction
        let filteredDirs = validDirs;
        if (enemy.direction !== directions.NONE) {
            const opposite = getOpposite(enemy.direction);
            filteredDirs = validDirs.filter(
                (d) => !(d.x === opposite.x && d.y === opposite.y)
            );
        }

        if (filteredDirs.length === 0) {
            filteredDirs = validDirs;
        }

        // Choose direction that minimizes distance to target
        let bestDir = filteredDirs[0];
        let bestDist = Infinity;

        for (const dir of filteredDirs) {
            const newX = enemy.gridX + dir.x;
            const newY = enemy.gridY + dir.y;
            const dist = getDistance(newX, newY, targetX, targetY);

            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }

        return bestDir;
    }

    /**
	 * Get target position for enemy based on its personality
	 * @param {EnemyState} enemy - Enemy
	 * @returns {Object} - Target {x, y}
	 */
    getTargetForEnemy(enemy) {
        const player = this.gameModel.pacman;

        switch (enemy.ghostType) {
        case 'alpha':
            return this.getAlphaTarget(player, enemy);
        case 'beta':
            return this.getBetaTarget(player, enemy);
        case 'gamma':
            return this.getGammaTarget(player, enemy);
        case 'delta':
            return this.getDeltaTarget(player, enemy);
        default:
            return { x: player.gridX, y: player.gridY };
        }
    }

    /**
	 * Alpha: Direct chase
	 */
    getAlphaTarget(player, enemy) {
        if (enemy.mode === ghostModes.SCATTER) {
            return scatterTargets.alpha;
        }
        return { x: player.gridX, y: player.gridY };
    }

    /**
	 * Beta: 4 tiles ahead of Player
	 */
    getBetaTarget(player, enemy) {
        if (enemy.mode === ghostModes.SCATTER) {
            return scatterTargets.beta;
        }

        let targetX = player.gridX + player.direction.x * 4;
        const targetY = player.gridY + player.direction.y * 4;

        // Arcade bug: Up also moves target left
        if (player.direction.y === -1) {
            targetX -= 4;
        }

        return { x: targetX, y: targetY };
    }

    /**
	 * Gamma: Vector from Alpha through 2 tiles ahead of Player
	 */
    getGammaTarget(player, enemy) {
        if (enemy.mode === ghostModes.SCATTER) {
            return scatterTargets.gamma;
        }

        const alpha = this.gameModel.getGhostByType('alpha');
        const pivotX = player.gridX + player.direction.x * 2;
        const pivotY = player.gridY + player.direction.y * 2;

        if (alpha) {
            return {
                x: pivotX + (pivotX - alpha.gridX),
                y: pivotY + (pivotY - alpha.gridY)
            };
        }
        return { x: pivotX, y: pivotY };
    }

    /**
	 * Delta: Chase if far, scatter if close
	 */
    getDeltaTarget(player, enemy) {
        if (enemy.mode === ghostModes.SCATTER) {
            return scatterTargets.delta;
        }

        const dist = getDistance(
            enemy.gridX,
            enemy.gridY,
            player.gridX,
            player.gridY
        );

        if (dist > 8) {
            return { x: player.gridX, y: player.gridY };
        } else {
            // Return to scatter corner if too close
            return scatterTargets.delta;
        }
    }

    /**
	 * Reverse enemy direction
	 * @param {GhostState} enemy - Enemy to reverse
	 */
    reverseEnemy(enemy) {
        if (enemy.direction !== directions.NONE) {
            const opposite = getOpposite(enemy.direction);
            enemy.direction = opposite;
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
