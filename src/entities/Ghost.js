/**
 * Ghost Entity
 * Represents ghost enemies using Phaser's Arc
 */

import { BaseEntity } from './BaseEntity.js';
import { gameConfig, colors, directions, ghostModes, animationConfig, levelConfig } from '../config/gameConfig.js';
import { getCenterPixel, getValidDirections, getDistance } from '../utils/MazeLayout.js';

export default class Ghost extends BaseEntity {
    constructor(scene, x, y, type, color) {
        const radius = gameConfig.tileSize * 0.4;
        super(scene, x, y, radius, color);

        this.type = type;
        this.color = color;
        this.startGridX = x;
        this.startGridY = y;

        const baseLevelSpeed = levelConfig.baseSpeed + (scene.gameState.level - 1) * levelConfig.speedIncreasePerLevel;
        this.speed = baseLevelSpeed * levelConfig.ghostSpeedMultiplier;
        this.baseSpeed = this.speed;

        this.mode = ghostModes.SCATTER;
        this.modeTimer = 0;
        this.targetX = 0;
        this.targetY = 0;

        this.isEaten = false;
        this.isFrightened = false;
        this.frightenedTimer = 0;
        this.isBlinking = false;
        this.blinkTimer = 0;

        this.isInHouse = false;
    }

    update(delta, maze, pacman) {
        if (this.isEaten) {
            this.updateEaten(delta, maze);
        } else {
            this.updateFrightened(delta);
            this.moveGhost(delta, maze, pacman);
        }
        this.updateVisuals();
    }

    moveGhost(delta, maze, pacman) {
        this.updateMovement(delta, maze);

        if (this.scene.ghostAISystem) {
            const oldDir = this.direction;
            this.scene.ghostAISystem.chooseDirection(this, maze);

            if (oldDir.x !== this.direction.x || oldDir.y !== this.direction.y) {
                this.snapToCurrentCenter();
            }
        }
    }

    snapToCurrentCenter() {
        const centerPixel = getCenterPixel(this.gridX, this.gridY);
        this.x = centerPixel.x;
        this.y = centerPixel.y;
    }

    update(delta, maze, pacman) {
        if (this.isEaten) {
            this.updateEaten(delta, maze);
        } else {
            this.updateFrightened(delta);
            this.moveGhost(delta, maze, pacman);
        }
        this.updateVisuals();
    }

    moveGhost(delta, maze, pacman) {
        this.updateMovement(delta, maze);

        if (this.scene.ghostAISystem) {
            const oldDir = this.direction;
            this.scene.ghostAISystem.chooseDirection(this, maze);

            if (oldDir.x !== this.direction.x || oldDir.y !== this.direction.y) {
                this.snapToCurrentCenter();
            }
        }
    }

    updateVisuals() {
        if (this.isFrightened) {
            if (this.isBlinking && Math.floor(this.blinkTimer / animationConfig.ghostBlinkSpeed) % 2 === 0) {
                this.setFillStyle(colors.frightenedGhostEnd, 1);
            } else {
                this.setFillStyle(colors.frightenedGhost, 1);
            }
        } else if (this.isEaten) {
            this.setFillStyle(0xFFFFFF, 0.4);
        } else {
            this.setFillStyle(this.color, 1);
        }
    }

    updateFrightened(delta) {
        if (this.isFrightened) {
            this.frightenedTimer -= delta;
            this.blinkTimer += delta;
            if (this.frightenedTimer <= 2000) this.isBlinking = true;
            else this.isBlinking = false;
            if (this.frightenedTimer <= 0) {
                this.isFrightened = false;
                this.isBlinking = false;
                this.speed = this.baseSpeed;
            }
        }
    }

    getReverseDirection(direction) {
        if (direction.x === 1) return directions.LEFT;
        if (direction.x === -1) return directions.RIGHT;
        if (direction.y === 1) return directions.UP;
        if (direction.y === -1) return directions.DOWN;
        return directions.NONE;
    }

    updateEaten(delta, maze) {
        const targetX = 13;
        const targetY = 14;
        const speed = this.speed * 2;
        const moveStep = speed * (delta / 1000);

        const gridPos = { x: Math.floor(this.x / gameConfig.tileSize), y: Math.floor(this.y / gameConfig.tileSize) };
        const centerPixel = getCenterPixel(gridPos.x, gridPos.y);
        const distToCenter = getDistance(this.x, this.y, centerPixel.x, centerPixel.y);

        if (distToCenter < Math.max(moveStep, 1)) {
            this.gridX = gridPos.x;
            this.gridY = gridPos.y;
            if (this.gridX === targetX && this.gridY === targetY) {
                this.isEaten = false;
                return;
            }
            this.chooseDirectionToTarget(maze, targetX, targetY);
        }

        if (this.direction !== directions.NONE) {
            this.x += this.direction.x * moveStep;
            this.y += this.direction.y * moveStep;
            this.handleTunnelWrap();
        }
    }

    chooseDirectionToTarget(maze, targetX, targetY) {
        const validDirs = getValidDirections(maze, this.gridX, this.gridY);
        if (validDirs.length === 0) return;
        let bestDir = validDirs[0];
        let bestDist = Infinity;
        for (const dir of validDirs) {
            const dist = getDistance(this.gridX + dir.x, this.gridY + dir.y, targetX, targetY);
            if (dist < bestDist) { bestDist = dist; bestDir = dir; }
        }
        this.direction = bestDir;
    }

    setFrightened(duration) {
        this.isFrightened = true;
        this.frightenedTimer = duration;
        this.isBlinking = false;
        this.speed = this.baseSpeed * 0.5;
        if (this.direction !== directions.NONE) this.direction = this.getReverseDirection(this.direction);
    }

    eat() { this.isEaten = true; this.isFrightened = false; }

    reset() {
        this.gridX = this.startGridX; this.gridY = this.startGridY;
        this.direction = directions.NONE;
        this.isEaten = false; this.isFrightened = false;
        const pixel = getCenterPixel(this.gridX, this.gridY);
        this.x = pixel.x; this.y = pixel.y;
    }

    /**
     * Set the speed multiplier
     * @param {number} multiplier - Speed multiplier
     */
    setSpeedMultiplier(multiplier) {
        this.speed = this.baseSpeed * multiplier;
    }
}
