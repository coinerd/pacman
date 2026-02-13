/**
 * Enemy Entity
 * Represents enemy entities using Phaser's Arc
 */

import {
    animationConfig,
    colors,
    directions,
    gameConfig,
    getOpposite,
    ghostModes,
    ghostSpeedMultipliers,
    levelConfig
} from '../config/gameConfig.js';
import {
    getCenterPixel,
    getDistance,
    getValidDirections
} from '../utils/MazeLayout.js';
import { performGridMovementStep } from '../utils/TileMovement.js';
import { BaseEntity } from './BaseEntity.js';

export default class Enemy extends BaseEntity {
    /**
	 * Creates a new Enemy instance.
	 *
	 * @param {Phaser.Scene} scene - The scene this enemy belongs to
	 * @param {number} x - Initial grid X position
	 * @param {number} y - Initial grid Y position
	 * @param {string} type - Enemy type: 'blinky' | 'pinky' | 'inky' | 'clyde'
	 * @param {number} color - Enemy color (hex integer)
	 */
    constructor(scene, x, y, type, color) {
        const radius = gameConfig.tileSize * 0.4;
        super(scene, x, y, radius, color);

        this.type = type;
        this.color = color;
        this.startGridX = x;
        this.startGridY = y;

        const level = scene.gameModel?.getLevel?.() ?? scene.gameState?.level ?? 1;
        const baseLevelSpeed =
			levelConfig.baseSpeed + (level - 1) * levelConfig.speedIncreasePerLevel;
        this.baseSpeed = baseLevelSpeed * levelConfig.ghostSpeedMultiplier;
        this.speedMultiplier = 1.0;
        this.speedModifier = 1.0;

        this.nextDirection = directions.NONE;

        this.mode = ghostModes.SCATTER;
        this.targetX = 0;
        this.targetY = 0;

        this.isEaten = false;
        this.isFrightened = false;
        this.frightenedTimer = 0;
        this.isBlinking = false;
        this.blinkTimer = 0;

        this.houseTimer = 0;
        this.inGhostHouse = false;
    }

    get speed() {
        return this.baseSpeed * this.speedMultiplier * this.speedModifier;
    }

    set speed(value) {
        this.baseSpeed = value;
    }

    /**
	 * Updates enemy state and movement.
	 *
	 * Behavior:
	 * - If eaten: Updates house timer and handles return to playfield
	 * - If not eaten: Updates frightened state and moves enemy
	 *
	 * @param {number} deltaSeconds - Time since last frame in seconds
	 * @param {number[][]} maze - 2D maze array
	 * @param {Pacman} pacman - Pacman entity for AI targeting
	 */
    update(deltaSeconds, maze, pacman) {
        this.prevX = this.x;
        this.prevY = this.y;

        if (this.isEaten) {
            this.updateEaten(deltaSeconds, maze);
        } else {
            this.updateFrightened(deltaSeconds);
            this.moveEnemy(deltaSeconds, maze, pacman);
        }
        this.updateVisuals();
    }

    /**
	 * Moves enemy based on current direction and speed.
	 *
	 * Behavior:
	 * - Uses new center-snapping movement system
	 * - Handles tunnel wrapping
	 * - Makes AI decisions at intersections
	 * - Applies buffered direction changes
	 *
	 * @param {number} deltaSeconds - Time since last frame
	 * @param {number[][]} maze - 2D maze array
	 * @param {Pacman} pacman - Pacman entity for AI targeting
	 */
    moveEnemy(deltaSeconds, maze, _pacman) {
        this.isMoving = this.direction !== directions.NONE;

        const oldModifier = this.speedModifier;
        if (this.gridY === gameConfig.tunnelRow) {
            this.speedModifier *= ghostSpeedMultipliers.tunnel;
        }

        performGridMovementStep(this, maze, deltaSeconds);
        this.speedModifier = oldModifier;
        this.handleTunnelWrap();
    }

    /**
	 * Snaps enemy position to center of current grid cell
	 *
	 * Used to ensure precise positioning after manual movement or state changes
	 */
    snapToCurrentCenter() {
        const centerPixel = getCenterPixel(this.gridX, this.gridY);
        this.x = centerPixel.x;
        this.y = centerPixel.y;
    }

    /**
	 * Placeholder for intersection decision logic
	 *
	 * Currently empty - decisions are handled by EnemyAISystem
	 *
	 * @param {number[][]} maze - 2D maze array (not used)
	 */
    makeDecisionAtIntersection(_maze) {}

    /**
	 * Updates enemy visual appearance based on state.
	 *
	 * Behavior:
	 * - If frightened: Shows blue color with blinking effect
	 * - If eaten: Shows white translucent appearance
	 * - Otherwise: Shows enemy's normal color
	 */
    updateVisuals() {
        if (this.isFrightened) {
            if (
                this.isBlinking &&
				Math.floor(this.blinkTimer / animationConfig.ghostBlinkSpeed) % 2 === 0
            ) {
                this.setFillStyle(colors.decryptedEnemyEnd, 1);
            } else {
                this.setFillStyle(colors.decryptedEnemy, 1);
            }
        } else if (this.isEaten) {
            this.setFillStyle(0xffffff, 0.4);
        } else {
            this.setFillStyle(this.color, 1);
        }
    }

    /**
	 * Updates frightened state timer and blinking effect.
	 *
	 * Behavior:
	 * - Decrements frightened timer
	 * - Activates blinking when timer < 2 seconds
	 * - Returns to normal state when timer expires
	 *
	 * @param {number} deltaSeconds - Time since last frame in seconds
	 */
    updateFrightened(deltaSeconds) {
        if (this.isFrightened) {
            this.frightenedTimer -= deltaSeconds;
            this.blinkTimer += deltaSeconds;
            if (this.frightenedTimer <= 2) {
                this.isBlinking = true;
            } else {
                this.isBlinking = false;
            }
            if (this.frightenedTimer <= 0) {
                this.frightenedTimer = 0;
                this.isFrightened = false;
                this.isBlinking = false;
                this.speedModifier = 1.0;
            }
        }
    }

    /**
	 * Returns opposite direction of the given direction.
	 *
	 * @param {Object} direction - Direction object with x and y properties
	 * @param {number} direction.x - Horizontal direction (-1, 0, 1)
	 * @param {number} direction.y - Vertical direction (-1, 0, 1)
	 * @returns {Object} Opposite direction object
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

    /**
	 * Updates eaten enemy state, returning to virus core.
	 *
	 * Behavior:
	 * - If in virus core: Waits for timer then resets
	 * - Otherwise: Moves to virus core entrance (13, 14)
	 *
	 * @param {number} deltaSeconds - Time since last frame in seconds
	 * @param {number[][]} maze - 2D maze array
	 */
    updateEaten(deltaSeconds, maze) {
        if (this.inGhostHouse) {
            this.houseTimer -= deltaSeconds;
            if (this.houseTimer <= 0) {
                this.houseTimer = 0;
                this.reset();
            }
            return;
        }

        const targetX = 13;
        const targetY = 14;
        const oldModifier = this.speedModifier;
        this.speedModifier *= 2;

        if (this.gridX === targetX && this.gridY === targetY) {
            this.inGhostHouse = true;
            this.houseTimer = 2;
            this.setDirection(directions.NONE);
            this.speedModifier = oldModifier;
            return;
        }

        this.chooseDirectionToTarget(maze, targetX, targetY);
        performGridMovementStep(this, maze, deltaSeconds);
        this.speedModifier = oldModifier;
    }

    /**
	 * Chooses direction to reach target position.
	 *
	 * Evaluates all valid directions and selects the one that minimizes
	 * distance to the target position.
	 *
	 * @param {number[][]} maze - 2D maze array
	 * @param {number} targetX - Target grid X position
	 * @param {number} targetY - Target grid Y position
	 */
    chooseDirectionToTarget(maze, targetX, targetY) {
        const validDirs = getValidDirections(maze, this.gridX, this.gridY);
        if (validDirs.length === 0) {
            return;
        }
        let bestDir = validDirs[0];
        let bestDist = Infinity;
        for (const dir of validDirs) {
            const dist = getDistance(
                this.gridX + dir.x,
                this.gridY + dir.y,
                targetX,
                targetY
            );
            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }
        if (this.direction === directions.NONE) {
            this.directionBuffer.apply(bestDir);
        } else {
            this.setDirection(bestDir);
        }
    }

    /**
	 * Activates frightened state for specified duration.
	 *
	 * Behavior:
	 * - Sets enemy to frightened state
	 * - Reduces speed by 50%
	 * - Reverses current direction
	 *
	 * @param {number} duration - Duration of frightened state in seconds
	 */
    setFrightened(duration) {
        this.isFrightened = true;
        this.frightenedTimer = duration;
        this.isBlinking = false;
        this.speedModifier = 0.5;
        if (this.direction !== directions.NONE) {
            const opposite = getOpposite(this.direction);
            this.setDirection(opposite);
        }
    }

    /**
	 * Marks enemy as eaten.
	 *
	 * Sets enemy state to eaten and clears frightened state,
	 * causing enemy to return to virus core.
	 */
    eat() {
        this.isEaten = true;
        this.isFrightened = false;
    }

    /**
	 * Resets enemy to initial state.
	 *
	 * Resets all properties to their starting values, including
	 * position, direction, and state flags.
	 */
    reset() {
        this.gridX = this.startGridX;
        this.gridY = this.startGridY;
        this.prevGridX = this.startGridX;
        this.prevGridY = this.startGridY;
        this.directionBuffer.reset();
        this.isEaten = false;
        this.isFrightened = false;
        this.inGhostHouse = false;
        this.houseTimer = 0;
        this.mode = ghostModes.SCATTER;
        this.speedMultiplier = 1.0;
        this.speedModifier = 1.0;
        const pixel = getCenterPixel(this.gridX, this.gridY);
        this.x = pixel.x;
        this.y = pixel.y;
        this.prevX = this.x;
        this.prevY = this.y;
    }

    /**
	 * Set speed multiplier
	 * @param {number} multiplier - Speed multiplier
	 */
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
    }
}
