import { directions } from '../config/gameConfig.js';
import { getValidDirections, getDistance } from '../utils/MazeLayout.js';
import { TILE_TYPES } from '../utils/MazeLayout.js';

export class PacmanAI {
    constructor() {
        this.enabled = false;
        this.lastDecisionGridX = -1;
        this.lastDecisionGridY = -1;
        this.lastDirection = null;
        this.dangerDistanceThreshold = 100;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    update(pacman, maze, ghosts) {
        if (!this.enabled) {
            return;
        }

        const pacmanGridX = pacman.gridX;
        const pacmanGridY = pacman.gridY;

        if (pacmanGridX === this.lastDecisionGridX && pacmanGridY === this.lastDecisionGridY) {
            pacman.setDirection(this.lastDirection);
            return;
        }

        const direction = this.decideDirection(pacman, maze, ghosts);
        if (direction !== directions.NONE) {
            pacman.setDirection(direction);
            this.lastDecisionGridX = pacmanGridX;
            this.lastDecisionGridY = pacmanGridY;
            this.lastDirection = direction;
        }
    }

    decideDirection(pacman, maze, ghosts) {
        const validDirs = getValidDirections(maze, pacman.gridX, pacman.gridY);
        if (validDirs.length === 0) {
            return directions.NONE;
        }

        const currentDir = pacman.direction;
        const ghostDanger = this.calculateGhostDanger(pacman, ghosts);

        let bestDir = validDirs[0];
        let bestScore = -Infinity;

        for (const dir of validDirs) {
            let score = 0;

            if (ghostDanger > 0) {
                const nextGridX = pacman.gridX + dir.x;
                const nextGridY = pacman.gridY + dir.y;
                const ghostRisk = this.evaluateGhostRisk(nextGridX, nextGridY, ghosts);

                if (ghostRisk > 0) {
                    score -= ghostRisk * 10;
                }
            }

            const nextGridX = pacman.gridX + dir.x;
            const nextGridY = pacman.gridY + dir.y;

            if (nextGridY >= 0 && nextGridY < maze.length && nextGridX >= 0 && nextGridX < maze[0].length) {
                const tile = maze[nextGridY][nextGridX];

                if (tile === TILE_TYPES.PELLET || tile === TILE_TYPES.POWER_PELLET) {
                    score += 5;
                }
            }

            const distanceFromCurrent = getDistance(pacman.gridX + currentDir.x, pacman.gridY + currentDir.y, nextGridX, nextGridY);
            if (distanceFromCurrent > 1) {
                score -= 2;
            }

            const reverseDir = this.getReverseDirection(currentDir);
            if (dir === reverseDir) {
                score -= 20;
            }

            const forwardDir = this.getSameDirection(dir, currentDir);
            if (forwardDir) {
                score += 3;
            }

            if (score >= bestScore) {
                bestScore = score;
                bestDir = dir;
            }
        }

        return bestDir;
    }

    calculateGhostDanger(pacman, ghosts) {
        let totalDanger = 0;

        for (const ghost of ghosts) {
            if (ghost.isFrightened || ghost.isEaten) {
                continue;
            }

            const dist = getDistance(pacman.x, pacman.y, ghost.x, ghost.y);
            if (dist < this.dangerDistanceThreshold) {
                const danger = (this.dangerDistanceThreshold - dist) / this.dangerDistanceThreshold;
                totalDanger += danger;
            }
        }

        return totalDanger;
    }

    evaluateGhostRisk(gridX, gridY, ghosts) {
        let maxRisk = 0;

        for (const ghost of ghosts) {
            if (ghost.isFrightened || ghost.isEaten) {
                continue;
            }

            const ghostGridX = ghost.gridX;
            const ghostGridY = ghost.gridY;

            const dist = getDistance(gridX, gridY, ghostGridX, ghostGridY);

            if (dist < 3) {
                const risk = (3 - dist) / 3;
                maxRisk = Math.max(maxRisk, risk);
            }
        }

        return maxRisk;
    }

    getReverseDirection(direction) {
        if (direction === directions.RIGHT) {return directions.LEFT;}
        if (direction === directions.LEFT) {return directions.RIGHT;}
        if (direction === directions.UP) {return directions.DOWN;}
        if (direction === directions.DOWN) {return directions.UP;}
        return directions.NONE;
    }

    getSameDirection(dir1, dir2) {
        return dir1.x === dir2.x && dir1.y === dir2.y;
    }

    reset() {
        this.lastDecisionGridX = -1;
        this.lastDecisionGridY = -1;
    }
}
