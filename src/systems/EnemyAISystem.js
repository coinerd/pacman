import {
    directions,
    getOpposite,
    ghostModes,
    scatterTargets
} from '../config/gameConfig.js';
import { getDistance, getValidDirections } from '../utils/MazeLayout.js';

/**
 * Enemy AI System
 * Manages enemy mode cycles, target selection, and direction choice
 */
export class EnemyAISystem {
    /**
	 * Creates a new EnemyAISystem instance
	 */
    constructor() {
        this.enemies = [];
        this.globalModeTimer = 0;
        this.globalMode = ghostModes.SCATTER;
        this.cycleIndex = 0;

        // Scatter/Chase cycle durations (in seconds)
        this.cycles = [
            { mode: ghostModes.SCATTER, duration: 7 },
            { mode: ghostModes.CHASE, duration: 20 },
            { mode: ghostModes.SCATTER, duration: 7 },
            { mode: ghostModes.CHASE, duration: 20 },
            { mode: ghostModes.SCATTER, duration: 5 },
            { mode: ghostModes.CHASE, duration: 20 },
            { mode: ghostModes.SCATTER, duration: 5 },
            { mode: ghostModes.CHASE, duration: -1 } // Permanent chase
        ];
    }

    /**
	 * Sets enemies to be managed by this AI system
	 * @param {Ghost[]} enemies - Array of enemy entities
	 */
    setEnemies(enemies) {
        this.enemies = enemies;
    }

    /**
	 * Updates all enemies AI based on current game state
	 * @param {number} deltaSeconds - Time elapsed since last update in seconds
	 * @param {MazeLayout} maze - Current maze layout for collision detection
	 * @param {Pacman} pacman - Player entity for targeting
	 */
    update(deltaSeconds, maze, pacman) {
        this.updateGlobalMode(deltaSeconds);

        for (const enemy of this.enemies) {
            // Keep enemy mode in sync with global mode unless frightened or eaten
            if (!enemy.isFrightened && !enemy.isEaten) {
                if (enemy.mode !== this.globalMode) {
                    enemy.mode = this.globalMode;
                    // Enemies reverse direction when mode changes
                    const opposite = getOpposite(enemy.direction);
                    enemy.setDirection(opposite);
                }
            }
            this.updateEnemyTarget(enemy, pacman);
            this.chooseDirection(enemy, maze);
        }
    }

    /**
	 * Updates global enemy mode based on cycle timers
	 * @param {number} deltaSeconds - Time elapsed since last update in seconds
	 */
    updateGlobalMode(deltaSeconds) {
        const currentCycle = this.cycles[this.cycleIndex];
        if (currentCycle.duration === -1) {
            return;
        }

        this.globalModeTimer += deltaSeconds;

        if (this.globalModeTimer >= currentCycle.duration) {
            this.cycleIndex++;
            this.globalMode = this.cycles[this.cycleIndex].mode;
            this.globalModeTimer = 0;
        }
    }

    /**
	 * Updates target position for an enemy based on its type and current mode
	 * @param {Enemy} enemy - The enemy entity to update
	 * @param {Player} player - Player entity for targeting
	 */
    updateEnemyTarget(enemy, player) {
        if (enemy.isEaten) {
            enemy.targetX = 13; // Enemy house entrance
            enemy.targetY = 14;
            return;
        }

        if (enemy.isFrightened) {
            // Target is effectively random or ignored in chooseDirection
            return;
        }

        switch (enemy.type) {
        case 'alpha':
            this.updateAlphaTarget(enemy, player);
            break;
        case 'beta':
            this.updateBetaTarget(enemy, player);
            break;
        case 'gamma':
            this.updateGammaTarget(enemy, player);
            break;
        case 'delta':
            this.updateDeltaTarget(enemy, player);
            break;
        }
    }

    /**
	 * Updates Alpha's target position based on mode
	 * @param {Enemy} enemy - Alpha enemy entity
	 * @param {Player} player - Player entity for targeting
	 */
    updateAlphaTarget(enemy, player) {
        if (enemy.mode === ghostModes.SCATTER) {
            enemy.targetX = scatterTargets.alpha.x;
            enemy.targetY = scatterTargets.alpha.y;
        } else {
            enemy.targetX = player.gridX;
            enemy.targetY = player.gridY;
        }
    }

    /**
	 * Updates Beta's target position (4 tiles ahead of Player in chase mode)
	 * @param {Enemy} enemy - Beta enemy entity
	 * @param {Player} player - Player entity for targeting
	 */
    updateBetaTarget(enemy, player) {
        if (enemy.mode === ghostModes.SCATTER) {
            enemy.targetX = scatterTargets.beta.x;
            enemy.targetY = scatterTargets.beta.y;
        } else {
            // Beta targets 4 tiles ahead of Player
            enemy.targetX = player.gridX + player.direction.x * 4;
            enemy.targetY = player.gridY + player.direction.y * 4;

            // Replicate original arcade bug where "Up" also moves target left
            if (player.direction.y === -1) {
                enemy.targetX -= 4;
            }
        }
    }

    /**
	 * Updates Gamma's target position (vector from Alpha through 2 tiles ahead of Player)
	 * @param {Enemy} enemy - Gamma enemy entity
	 * @param {Player} player - Player entity for targeting
	 */
    updateGammaTarget(enemy, player) {
        if (enemy.mode === ghostModes.SCATTER) {
            enemy.targetX = scatterTargets.gamma.x;
            enemy.targetY = scatterTargets.gamma.y;
        } else {
            const alpha = this.getEnemyByType('alpha');
            if (alpha) {
                // Gamma's target is a vector from Alpha through 2 tiles ahead of Player
                const pivotX = player.gridX + player.direction.x * 2;
                const pivotY = player.gridY + player.direction.y * 2;

                // Also replicate bug for Gamma's pivot tiling
                if (player.direction.y === -1) {
                    // Original bug: Up direction adds a left offset to pivot
                    // Not strictly necessary for "better" movement but characterful
                }

                enemy.targetX = pivotX + (pivotX - alpha.gridX);
                enemy.targetY = pivotY + (pivotY - alpha.gridY);
            } else {
                enemy.targetX = player.gridX;
                enemy.targetY = player.gridY;
            }
        }
    }

    /**
	 * Updates Delta's target position (chases Player unless too close, then retreats)
	 * @param {Enemy} enemy - Delta enemy entity
	 * @param {Player} player - Player entity for targeting
	 */
    updateDeltaTarget(enemy, player) {
        if (enemy.mode === ghostModes.SCATTER) {
            enemy.targetX = scatterTargets.delta.x;
            enemy.targetY = scatterTargets.delta.y;
        } else {
            const dist = getDistance(
                enemy.gridX,
                enemy.gridY,
                player.gridX,
                player.gridY
            );
            if (dist > 8) {
                enemy.targetX = player.gridX;
                enemy.targetY = player.gridY;
            } else {
                // Return to soul corner if too close
                enemy.targetX = scatterTargets.delta.x;
                enemy.targetY = scatterTargets.delta.y;
            }
        }
    }

    /**
	 * Finds an enemy by its type
	 * @param {string} type - The enemy type ('alpha', 'beta', 'gamma', or 'delta')
	 * @returns {Enemy|null} The enemy entity or null if not found
	 */
    getEnemyByType(type) {
        return this.enemies.find((enemy) => enemy.type === type);
    }

    /**
	 * Chooses next direction for an enemy based on its target and current state
	 * @param {Ghost} enemy - The enemy entity to choose direction for
	 * @param {MazeLayout} maze - Current maze layout for collision detection
	 */
    chooseDirection(enemy, maze) {
        const validDirs = getValidDirections(maze, enemy.gridX, enemy.gridY);

        if (validDirs.length === 0) {
            enemy.setDirection(directions.NONE);
            return;
        }

        if (validDirs.length === 1) {
            enemy.setDirection(validDirs[0]);
            return;
        }

        let filteredDirs = validDirs;
        // Standard AI: Enemies cannot reverse direction unless forced (mode change)
        if (enemy.direction !== directions.NONE) {
            const reverseDir = this.getReverseDirection(enemy.direction);
            filteredDirs = validDirs.filter(
                (d) => !(d.x === reverseDir.x && d.y === reverseDir.y)
            );
        }

        if (filteredDirs.length === 0) {
            filteredDirs = validDirs;
        }

        if (enemy.isFrightened) {
            // Frightened enemies choose pseudorandomly at intersections
            const randomIndex = Math.floor(Math.random() * filteredDirs.length);
            enemy.setDirection(filteredDirs[randomIndex]);
        } else {
            // Intersection decision: choose direction that minimizes distance to target
            let bestDir = filteredDirs[0];
            let bestDist = Infinity;

            for (const dir of filteredDirs) {
                const newX = enemy.gridX + dir.x;
                const newY = enemy.gridY + dir.y;
                const dist = getDistance(newX, newY, enemy.targetX, enemy.targetY);

                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = dir;
                }
            }

            enemy.setDirection(bestDir);
        }
    }

    /**
	 * Returns reverse of given direction
	 * @param {Object} direction - Direction object with x and y properties
	 * @returns {Object} The opposite direction
	 */
    getReverseDirection(direction) {
        if (direction.x === 1) {
            return directions.LEFT;
        }
        if (direction.x === -1) {
            return directions.RIGHT;
        }
        if (direction.y === 1) {
            return directions.UP;
        }
        if (direction.y === -1) {
            return directions.DOWN;
        }
        return directions.NONE;
    }
}
