/**
 * Ghost Entity
 * Represents ghost enemies using Phaser's Arc
 */

import { BaseEntity } from './BaseEntity.js';
import { gameConfig, colors, directions, ghostModes, animationConfig, levelConfig, ghostSpeedMultipliers, getOpposite } from '../config/gameConfig.js';
import { getCenterPixel, getValidDirections, getDistance } from '../utils/MazeLayout.js';
import { performGridMovementStep } from '../utils/TileMovement.js';

export default class Ghost extends BaseEntity {

    /**
     * Creates a new Ghost instance.
     *
     * @param {Phaser.Scene} scene - The scene this ghost belongs to
     * @param {number} x - Initial grid X position
     * @param {number} y - Initial grid Y position
     * @param {string} type - Ghost type: 'blinky' | 'pinky' | 'inky' | 'clyde'
     * @param {number} color - Ghost color (hex integer)
     */
    constructor(scene, x, y, type, color) {
        const radius = gameConfig.tileSize * 0.4;
        super(scene, x, y, radius, color);

        this.type = type;
        this.color = color;
        this.startGridX = x;
        this.startGridY = y;

        const baseLevelSpeed = levelConfig.baseSpeed + (scene.gameState.level - 1) * levelConfig.speedIncreasePerLevel;
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
     * Updates ghost state and movement.
     *
     * Behavior:
     * - If eaten: Updates house timer and handles return to playfield
     * - If not eaten: Updates frightened state and moves ghost
     *
     * @param {number} delta - Time since last frame in milliseconds
     * @param {number[][]} maze - 2D maze array
     * @param {Pacman} pacman - Pacman entity for AI targeting
     */
    update(delta, maze, pacman) {
        if (this.isEaten) {
            this.updateEaten(delta, maze);
        } else {
            this.updateFrightened(delta);
            this.moveGhost(delta, maze, pacman);
        }
        this.updateVisuals();
    }

    /**
     * Moves ghost based on current direction and speed.
     *
     * Behavior:
     * - Uses new center-snapping movement system
     * - Handles tunnel wrapping
     * - Makes AI decisions at intersections
     * - Applies buffered direction changes
     *
     * @param {number} delta - Time since last frame in milliseconds
     * @param {number[][]} maze - 2D maze array
     * @param {Pacman} pacman - Pacman entity for AI targeting
     */
    moveGhost(delta, maze, _pacman) {
        this.isMoving = this.direction !== directions.NONE;

        const oldModifier = this.speedModifier;
        if (this.gridY === gameConfig.tunnelRow) {
            this.speedModifier *= ghostSpeedMultipliers.tunnel;
        }

        performGridMovementStep(this, maze, delta);
        this.speedModifier = oldModifier;
        this.handleTunnelWrap();
    }

    /**
     * Snaps ghost position to center of current grid cell
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
     * Currently empty - decisions are handled by GhostAISystem
     *
     * @param {number[][]} maze - 2D maze array (not used)
     */
    makeDecisionAtIntersection(_maze) {
    }

    /**
     * Updates ghost visual appearance based on state.
     *
     * Behavior:
     * - If frightened: Shows blue color with blinking effect
     * - If eaten: Shows white translucent appearance
     * - Otherwise: Shows ghost's normal color
     */
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

    /**
     * Updates frightened state timer and blinking effect.
     *
     * Behavior:
     * - Decrements frightened timer
     * - Activates blinking when timer < 2 seconds
     * - Returns to normal state when timer expires
     *
     * @param {number} delta - Time since last frame in milliseconds
     */
    updateFrightened(delta) {
        if (this.isFrightened) {
            this.frightenedTimer -= delta;
            this.blinkTimer += delta;
            if (this.frightenedTimer <= 2000) {this.isBlinking = true;}
            else {this.isBlinking = false;}
            if (this.frightenedTimer <= 0) {
                this.frightenedTimer = 0;
                this.isFrightened = false;
                this.isBlinking = false;
                this.speedModifier = 1.0;
            }
        }
    }

    /**
     * Returns the opposite direction of the given direction.
     *
     * @param {Object} direction - Direction object with x and y properties
     * @param {number} direction.x - Horizontal direction (-1, 0, 1)
     * @param {number} direction.y - Vertical direction (-1, 0, 1)
     * @returns {Object} Opposite direction object
     */
    getReverseDirection(direction) {
        if (direction.x === 1) {return directions.LEFT;}
        if (direction.x === -1) {return directions.RIGHT;}
        if (direction.y === 1) {return directions.UP;}
        if (direction.y === -1) {return directions.DOWN;}
        return directions.NONE;
    }

    /**
     * Updates eaten ghost state, returning to ghost house.
     *
     * Behavior:
     * - If in ghost house: Waits for timer then resets
     * - Otherwise: Moves to ghost house entrance (13, 14)
     *
     * @param {number} delta - Time since last frame in milliseconds
     * @param {number[][]} maze - 2D maze array
     */
    updateEaten(delta, maze) {
        if (this.inGhostHouse) {
            this.houseTimer -= delta;
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
            this.houseTimer = 2000;
            this.setDirection(directions.NONE);
            this.speedModifier = oldModifier;
            return;
        }

        this.chooseDirectionToTarget(maze, targetX, targetY);
        performGridMovementStep(this, maze, delta);
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
        if (validDirs.length === 0) {return;}
        let bestDir = validDirs[0];
        let bestDist = Infinity;
        for (const dir of validDirs) {
            const dist = getDistance(this.gridX + dir.x, this.gridY + dir.y, targetX, targetY);
            if (dist < bestDist) { bestDist = dist; bestDir = dir; }
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
     * - Sets ghost to frightened state
     * - Reduces speed by 50%
     * - Reverses current direction
     *
     * @param {number} duration - Duration of frightened state in milliseconds
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
     * Marks ghost as eaten.
     *
     * Sets ghost state to eaten and clears frightened state,
     * causing ghost to return to ghost house.
     */
    eat() { this.isEaten = true; this.isFrightened = false; }

    /**
     * Resets ghost to initial state.
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
     * Set the speed multiplier
     * @param {number} multiplier - Speed multiplier
     */
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
    }
}
