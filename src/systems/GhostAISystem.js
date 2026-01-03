import { ghostModes, directions, scatterTargets } from '../config/gameConfig.js';
import { getDistance, getValidDirections } from '../utils/MazeLayout.js';

export class GhostAISystem {
    constructor() {
        this.ghosts = [];
        this.globalModeTimer = 0;
        this.globalMode = ghostModes.SCATTER;
        this.cycleIndex = 0;

        // Classic Pac-Man Scatter/Chase cycle durations (in ms)
        this.cycles = [
            { mode: ghostModes.SCATTER, duration: 7000 },
            { mode: ghostModes.CHASE, duration: 20000 },
            { mode: ghostModes.SCATTER, duration: 7000 },
            { mode: ghostModes.CHASE, duration: 20000 },
            { mode: ghostModes.SCATTER, duration: 5000 },
            { mode: ghostModes.CHASE, duration: 20000 },
            { mode: ghostModes.SCATTER, duration: 5000 },
            { mode: ghostModes.CHASE, duration: -1 } // Permanent chase
        ];
    }

    setGhosts(ghosts) {
        this.ghosts = ghosts;
    }

    update(delta, maze, pacman) {
        this.updateGlobalMode(delta);

        for (const ghost of this.ghosts) {
            // Keep ghost mode in sync with global mode unless frightened or eaten
            if (!ghost.isFrightened && !ghost.isEaten) {
                if (ghost.mode !== this.globalMode) {
                    ghost.mode = this.globalMode;
                    // Ghosts reverse direction when the mode changes
                    ghost.direction = this.getReverseDirection(ghost.direction);
                }
            }
            this.updateGhostTarget(ghost, pacman);
        }
    }

    updateGlobalMode(delta) {
        const currentCycle = this.cycles[this.cycleIndex];
        if (currentCycle.duration === -1) return;

        this.globalModeTimer += delta;

        if (this.globalModeTimer >= currentCycle.duration) {
            this.cycleIndex++;
            this.globalMode = this.cycles[this.cycleIndex].mode;
            this.globalModeTimer = 0;
        }
    }

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
            case 'blinky':
                this.updateBlinkyTarget(ghost, pacman);
                break;
            case 'pinky':
                this.updatePinkyTarget(ghost, pacman);
                break;
            case 'inky':
                this.updateInkyTarget(ghost, pacman);
                break;
            case 'clyde':
                this.updateClydeTarget(ghost, pacman);
                break;
        }
    }

    updateBlinkyTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.blinky.x;
            ghost.targetY = scatterTargets.blinky.y;
        } else {
            ghost.targetX = pacman.gridX;
            ghost.targetY = pacman.gridY;
        }
    }

    updatePinkyTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.pinky.x;
            ghost.targetY = scatterTargets.pinky.y;
        } else {
            // Pinky targets 4 tiles ahead of Pacman
            ghost.targetX = pacman.gridX + (pacman.direction.x * 4);
            ghost.targetY = pacman.gridY + (pacman.direction.y * 4);

            // Replicate the original arcade bug where "Up" also moves target left
            if (pacman.direction.y === -1) {
                ghost.targetX -= 4;
            }
        }
    }

    updateInkyTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.inky.x;
            ghost.targetY = scatterTargets.inky.y;
        } else {
            const blinky = this.getGhostByType('blinky');
            if (blinky) {
                // Inky's target is a vector from Blinky through 2 tiles ahead of Pacman
                const pivotX = pacman.gridX + (pacman.direction.x * 2);
                const pivotY = pacman.gridY + (pacman.direction.y * 2);

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

    updateClydeTarget(ghost, pacman) {
        if (ghost.mode === ghostModes.SCATTER) {
            ghost.targetX = scatterTargets.clyde.x;
            ghost.targetY = scatterTargets.clyde.y;
        } else {
            const dist = getDistance(ghost.gridX, ghost.gridY, pacman.gridX, pacman.gridY);
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

    getGhostByType(type) {
        return this.ghosts.find(ghost => ghost.type === type);
    }

    chooseDirection(ghost, maze) {
        const validDirs = getValidDirections(maze, ghost.gridX, ghost.gridY);

        if (validDirs.length === 0) {
            ghost.direction = directions.NONE;
            return;
        }

        if (validDirs.length === 1) {
            ghost.direction = validDirs[0];
            return;
        }

        let filteredDirs = validDirs;
        // Standard AI: Ghosts cannot reverse direction unless forced (mode change)
        if (ghost.direction !== directions.NONE) {
            const reverseDir = this.getReverseDirection(ghost.direction);
            filteredDirs = validDirs.filter(d =>
                !(d.x === reverseDir.x && d.y === reverseDir.y)
            );
        }

        if (filteredDirs.length === 0) {
            filteredDirs = validDirs;
        }

        if (ghost.isFrightened) {
            // Frightened ghosts choose pseudorandomly at intersections
            const randomIndex = Math.floor(Math.random() * filteredDirs.length);
            ghost.direction = filteredDirs[randomIndex];
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

            ghost.direction = bestDir;
        }
    }

    getReverseDirection(direction) {
        if (direction.x === 1) return directions.LEFT;
        if (direction.x === -1) return directions.RIGHT;
        if (direction.y === 1) return directions.UP;
        if (direction.y === -1) return directions.DOWN;
        return directions.NONE;
    }

    reset() {
        this.globalModeTimer = 0;
        this.globalMode = ghostModes.SCATTER;
        this.cycleIndex = 0;
        for (const ghost of this.ghosts) {
            ghost.mode = ghostModes.SCATTER;
            ghost.modeTimer = 0;
        }
    }
}
