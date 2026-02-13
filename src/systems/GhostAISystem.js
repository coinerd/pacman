import {
    directions,
    getOpposite,
    ghostModes,
    scatterTargets
} from '../config/gameConfig.js';
import { getDistance, getValidDirections } from '../utils/MazeLayout.js';

/**
 * Ghost AI System
 * Manages ghost mode cycles, target selection, and direction choice
 */
export class GhostAISystem {
    /**
	 * Creates a new GhostAISystem instance
	 */
    constructor() {
        this.ghosts = [];
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
	 * Sets the ghosts to be managed by this AI system
	 * @param {Ghost[]} ghosts - Array of ghost entities
	 */
    setGhosts(ghosts) {
        this.ghosts = ghosts;
    }

    /**
	 * Updates all ghosts AI based on current game state
	 * @param {number} deltaSeconds - Time elapsed since last update in seconds
	 * @param {MazeLayout} maze - Current maze layout for collision detection
	 * @param {Pacman} pacman - Pacman entity for targeting
	 */
    update(deltaSeconds, maze, pacman) {
        this.updateGlobalMode(deltaSeconds);

        for (const ghost of this.ghosts) {
            // Keep ghost mode in sync with global mode unless frightened or eaten
            if (!ghost.isFrightened && !ghost.isEaten) {
                if (ghost.mode !== this.globalMode) {
                    ghost.mode = this.globalMode;
                    // Ghosts reverse direction when mode changes
                    const opposite = getOpposite(ghost.direction);
                    ghost.setDirection(opposite);
                }
            }
            this.updateGhostTarget(ghost, pacman);
            this.chooseDirection(ghost, maze);
        }
    }

    /**
	 * Updates the global ghost mode based on cycle timers
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
	 * Updates the target position for a ghost based on its type and current mode
	 * @param {Ghost} ghost - The ghost entity to update
	 * @param {Pacman} pacman - Pacman entity for targeting
	 */
    updateGhostTarget(ghost, pacman) {
        if (ghost.isEaten) {
            ghost.targetX = 13; // Ghost house entrance
            ghost.targetY = 14;
            return;
        }

        if (ghost.isFrightened) {
            // Target is effectively random or ignored in chooseDirection
            return;
        }

        switch (ghost.type) {
        case 'alpha':
            this.updateAlphaTarget(ghost, pacman);
            break;
        case 'beta':
            this.updateBetaTarget(ghost, pacman);
            break;
        case 'gamma':
            this.updateGammaTarget(ghost, pacman);
            break;
        case 'delta':
            this.updateDeltaTarget(ghost, pacman);
            break;
        }
    }

    /**
	 * Updates Alpha's target position based on mode
	 * @param {Ghost} ghost - Alpha ghost entity
	 * @param {Pacman} pacman - Pacman entity for targeting
	 */
    updateAlphaTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.alpha.x;
            ghost.targetY = scatterTargets.alpha.y;
        } else {
            ghost.targetX = pacman.gridX;
            ghost.targetY = pacman.gridY;
        }
    }

    /**
	 * Updates Beta's target position (4 tiles ahead of Pacman in chase mode)
	 * @param {Ghost} ghost - Beta ghost entity
	 * @param {Pacman} pacman - Pacman entity for targeting
	 */
    updateBetaTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.beta.x;
            ghost.targetY = scatterTargets.beta.y;
        } else {
            // Beta targets 4 tiles ahead of Pacman
            ghost.targetX = pacman.gridX + pacman.direction.x * 4;
            ghost.targetY = pacman.gridY + pacman.direction.y * 4;

            // Replicate the original arcade bug where "Up" also moves target left
            if (pacman.direction.y === -1) {
                ghost.targetX -= 4;
            }
        }
    }

    /**
	 * Updates Gamma's target position (vector from Alpha through 2 tiles ahead of Pacman)
	 * @param {Ghost} ghost - Gamma ghost entity
	 * @param {Pacman} pacman - Pacman entity for targeting
	 */
    updateGammaTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.gamma.x;
            ghost.targetY = scatterTargets.gamma.y;
        } else {
            const alpha = this.getGhostByType('alpha');
            if (alpha) {
                // Gamma's target is a vector from Alpha through 2 tiles ahead of Pacman
                const pivotX = pacman.gridX + pacman.direction.x * 2;
                const pivotY = pacman.gridY + pacman.direction.y * 2;

                // Also replicate the bug for Gamma's pivot tiling
                if (pacman.direction.y === -1) {
                    // Original bug: Up direction adds a left offset to the pivot
                    // Not strictly necessary for "better" movement but characterful
                }

                ghost.targetX = pivotX + (pivotX - alpha.gridX);
                ghost.targetY = pivotY + (pivotY - alpha.gridY);
            } else {
                ghost.targetX = pacman.gridX;
                ghost.targetY = pacman.gridY;
            }
        }
    }

    /**
	 * Updates Delta's target position (chases Pacman unless too close, then retreats)
	 * @param {Ghost} ghost - Delta ghost entity
	 * @param {Pacman} pacman - Pacman entity for targeting
	 */
    updateDeltaTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.delta.x;
            ghost.targetY = scatterTargets.delta.y;
        } else {
            const dist = getDistance(
                ghost.gridX,
                ghost.gridY,
                pacman.gridX,
                pacman.gridY
            );
            if (dist > 8) {
                ghost.targetX = pacman.gridX;
                ghost.targetY = pacman.gridY;
            } else {
                // Return to soul corner if too close
                ghost.targetX = scatterTargets.delta.x;
                ghost.targetY = scatterTargets.delta.y;
            }
        }
    }

    /**
	 * Chooses next direction for a ghost based on its target and current state
	 * @param {Ghost} ghost - The ghost entity to choose direction for
	 * @param {MazeLayout} maze - Current maze layout for collision detection
	 */
    updatePinkyTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.pinky.x;
            ghost.targetY = scatterTargets.pinky.y;
        } else {
            // Pinky targets 4 tiles ahead of Pacman
            ghost.targetX = pacman.gridX + pacman.direction.x * 4;
            ghost.targetY = pacman.gridY + pacman.direction.y * 4;

            // Replicate the original arcade bug where "Up" also moves target left
            if (pacman.direction.y === -1) {
                ghost.targetX -= 4;
            }
        }
    }

    /**
	 * Updates Inky's target position (vector from Blinky through 2 tiles ahead of Pacman)
	 * @param {Ghost} ghost - Inky ghost entity
	 * @param {Pacman} pacman - Pacman entity for targeting
	 */
    updateInkyTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.inky.x;
            ghost.targetY = scatterTargets.inky.y;
        } else {
            const blinky = this.getGhostByType('blinky');
            if (blinky) {
                // Inky's target is a vector from Blinky through 2 tiles ahead of Pacman
                const pivotX = pacman.gridX + pacman.direction.x * 2;
                const pivotY = pacman.gridY + pacman.direction.y * 2;

                // Also replicate the bug for Inky's pivot tiling
                if (pacman.direction.y === -1) {
                    // Original bug: Up direction adds a left offset to the pivot
                    // Not strictly necessary for "better" movement but characterful
                }

                ghost.targetX = pivotX + (pivotX - blinky.gridX);
                ghost.targetY = pivotY + (pivotY - blinky.gridY);
            } else {
                ghost.targetX = pacman.gridX;
                ghost.targetY = pacman.gridY;
            }
        }
    }

    /**
	 * Updates Clyde's target position (chases Pacman unless too close, then retreats)
	 * @param {Ghost} ghost - Clyde ghost entity
	 * @param {Pacman} pacman - Pacman entity for targeting
	 */
    updateClydeTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.clyde.x;
            ghost.targetY = scatterTargets.clyde.y;
        } else {
            const dist = getDistance(
                ghost.gridX,
                ghost.gridY,
                pacman.gridX,
                pacman.gridY
            );
            if (dist > 8) {
                ghost.targetX = pacman.gridX;
                ghost.targetY = pacman.gridY;
            } else {
                // Return to soul corner if too close
                ghost.targetX = scatterTargets.clyde.x;
                ghost.targetY = scatterTargets.clyde.y;
            }
        }
    }

    /**
	 * Finds a ghost by its type
	 * @param {string} type - The ghost type ('alpha', 'beta', 'gamma', or 'delta')
	 * @returns {Ghost|null} The ghost entity or null if not found
	 */
    getGhostByType(type) {
        return this.ghosts.find((ghost) => ghost.type === type);
    }

    /**
	 * Chooses the next direction for a ghost based on its target and current state
	 * @param {Ghost} ghost - The ghost entity to choose direction for
	 * @param {MazeLayout} maze - Current maze layout for collision detection
	 */
    chooseDirection(ghost, maze) {
        const validDirs = getValidDirections(maze, ghost.gridX, ghost.gridY);

        if (validDirs.length === 0) {
            ghost.setDirection(directions.NONE);
            return;
        }

        if (validDirs.length === 1) {
            ghost.setDirection(validDirs[0]);
            return;
        }

        let filteredDirs = validDirs;
        // Standard AI: Ghosts cannot reverse direction unless forced (mode change)
        if (ghost.direction !== directions.NONE) {
            const reverseDir = this.getReverseDirection(ghost.direction);
            filteredDirs = validDirs.filter(
                (d) => !(d.x === reverseDir.x && d.y === reverseDir.y)
            );
        }

        if (filteredDirs.length === 0) {
            filteredDirs = validDirs;
        }

        if (ghost.isFrightened) {
            // Frightened ghosts choose pseudorandomly at intersections
            const randomIndex = Math.floor(Math.random() * filteredDirs.length);
            ghost.setDirection(filteredDirs[randomIndex]);
        } else {
            // Intersection decision: choose the direction that minimizes distance to target
            let bestDir = filteredDirs[0];
            let bestDist = Infinity;

            for (const dir of filteredDirs) {
                const newX = ghost.gridX + dir.x;
                const newY = ghost.gridY + dir.y;
                const dist = getDistance(newX, newY, ghost.targetX, ghost.targetY);

                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = dir;
                }
            }

            ghost.setDirection(bestDir);
        }
    }

    /**
	 * Returns the reverse of the given direction
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
