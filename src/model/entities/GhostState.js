/**
 * GhostState
 * Pure data representation of Ghost entity.
 * NO Phaser dependencies.
 */

import { ModelEntity } from '../ModelEntity.js';
import {
    gameConfig,
    directions,
    ghostModes,
    levelConfig,
    ghostSpeedMultipliers,
    ghostColors,
    ghostNames,
    animationConfig
} from '../../config/gameConfig.js';
import { moveEntityOnGrid } from '../../utils/movement/GridMovement.js';
import { getCenterPixel, getValidDirections, getDistance, isWalkableTile } from '../../utils/MazeLayout.js';
import { getOpposite } from '../../config/gameConfig.js';

export class GhostState extends ModelEntity {
    /**
     * @param {number} gridX - Initial grid X position
     * @param {number} gridY - Initial grid Y position
     * @param {string} ghostType - Ghost type: 'blinky', 'pinky', 'inky', 'clyde'
     * @param {number} level - Current game level
     */
    constructor(gridX, gridY, ghostType, level = 1) {
        const baseLevelSpeed = levelConfig.baseSpeed + (level - 1) * levelConfig.speedIncreasePerLevel;
        const speed = baseLevelSpeed * levelConfig.ghostSpeedMultiplier;

        super(gridX, gridY, {
            type: 'ghost',
            speed: speed
        });

        this.ghostType = ghostType;
        this.name = ghostNames[ghostType.toUpperCase()] || ghostType;

        // Ghost-specific properties
        this.color = ghostColors[ghostType.toUpperCase()] || 0xFFFFFF;
        this.startGridX = gridX;
        this.startGridY = gridY;

        // Speed modifiers
        this.baseSpeed = speed;
        this.speedMultiplier = 1.0;
        this.speedModifier = 1.0;

        // AI state
        this.mode = ghostModes.SCATTER;
        this.targetX = 0;
        this.targetY = 0;

        // State flags
        this.isEaten = false;
        this.isFrightened = false;
        this.frightenedTimer = 0;
        this.isBlinking = false;
        this.blinkTimer = 0;

        // Ghost house
        this.inGhostHouse = false;
        this.houseTimer = 0;
    }

    /**
     * Get current speed (including all modifiers)
     */
    get speed() {
        return this.baseSpeed * this.speedMultiplier * this.speedModifier;
    }

    set speed(value) {
        this.baseSpeed = value;
    }

    /**
     * Update ghost state
     * @param {number} deltaSeconds - Time since last frame
     * @param {Array<Array<number>>} maze - Maze grid
     * @param {Object} pacmanState - Pacman state for AI targeting
     * @returns {Array<Object>} - Events generated
     */
    update(deltaSeconds, maze, pacmanState = null) {
        const events = [];

        // Update previous position
        this.updatePreviousPosition();

        if (this.isEaten) {
            const eatenEvents = this.updateEaten(deltaSeconds, maze);
            events.push(...eatenEvents);
        } else {
            this.updateFrightened(deltaSeconds);
            const moveEvents = this.moveGhost(deltaSeconds, maze, pacmanState);
            events.push(...moveEvents);
        }

        return events;
    }

    /**
     * Move ghost
     * @param {number} deltaSeconds - Time since last frame
     * @param {Array<Array<number>>} maze - Maze grid
     * @param {Object} pacmanState - Pacman state for targeting
     * @returns {Array<Object>} - Events generated
     */
    moveGhost(deltaSeconds, maze, pacmanState) {
        const events = [];

        this.isMoving = this.direction !== directions.NONE;

        // Apply tunnel speed modifier
        const oldModifier = this.speedModifier;
        if (this.gridY === gameConfig.tunnelRow) {
            this.speedModifier *= ghostSpeedMultipliers.tunnel;
        }

        // Perform movement
        if (this.direction !== directions.NONE) {
            const moveResult = moveEntityOnGrid(this, maze, deltaSeconds);

            for (const event of moveResult.events) {
                events.push({
                    ...event,
                    entityId: this.id,
                    entityType: 'ghost',
                    ghostType: this.ghostType
                });
            }
        }

        // Restore speed modifier
        this.speedModifier = oldModifier;

        // Handle tunnel wrapping
        if (this.handleTunnelWrap()) {
            events.push({
                type: 'tunnel_wrap',
                entityId: this.id,
                entityType: 'ghost',
                ghostType: this.ghostType
            });
        }

        return events;
    }

    /**
     * Update eaten state (returning to ghost house)
     * @param {number} deltaSeconds - Time since last frame
     * @param {Array<Array<number>>} maze - Maze grid
     * @returns {Array<Object>} - Events generated
     */
    updateEaten(deltaSeconds, maze) {
        const events = [];

        if (this.inGhostHouse) {
            this.houseTimer -= deltaSeconds;
            if (this.houseTimer <= 0) {
                this.houseTimer = 0;
                this.reset();
                events.push({
                    type: 'ghost_revived',
                    entityId: this.id,
                    ghostType: this.ghostType
                });
            }
            return events;
        }

        const targetX = gameConfig.ghostHouse?.entrance?.x || 13;
        const targetY = gameConfig.ghostHouse?.center?.y || 14;

        // Speed up when eaten
        const oldModifier = this.speedModifier;
        this.speedModifier *= ghostSpeedMultipliers.eaten;

        // Check if reached ghost house
        if (this.gridX === targetX && this.gridY === targetY) {
            this.inGhostHouse = true;
            this.houseTimer = 2; // 2 seconds in house
            this.direction = directions.NONE;
            this.speedModifier = oldModifier;
            events.push({
                type: 'ghost_entered_house',
                entityId: this.id,
                ghostType: this.ghostType
            });
            return events;
        }

        // Move toward ghost house
        this.chooseDirectionToTarget(maze, targetX, targetY);

        const moveResult = moveEntityOnGrid(this, maze, deltaSeconds);
        for (const event of moveResult.events) {
            events.push({
                ...event,
                entityId: this.id,
                entityType: 'ghost',
                ghostType: this.ghostType
            });
        }

        this.speedModifier = oldModifier;
        return events;
    }

    /**
     * Update frightened state
     * @param {number} deltaSeconds - Time since last frame
     */
    updateFrightened(deltaSeconds) {
        if (!this.isFrightened) {
            return;
        }

        this.frightenedTimer -= deltaSeconds;
        this.blinkTimer += deltaSeconds;

        // Start blinking in last 2 seconds
        if (this.frightenedTimer <= 2) {
            this.isBlinking = true;
        } else {
            this.isBlinking = false;
        }

        // End frightened state
        if (this.frightenedTimer <= 0) {
            this.frightenedTimer = 0;
            this.isFrightened = false;
            this.isBlinking = false;
            this.speedModifier = 1.0;
        }
    }

    /**
     * Choose direction to reach target
     * @param {Array<Array<number>>} maze - Maze grid
     * @param {number} targetX - Target grid X
     * @param {number} targetY - Target grid Y
     */
    chooseDirectionToTarget(maze, targetX, targetY) {
        const validDirs = getValidDirections(maze, this.gridX, this.gridY);

        if (validDirs.length === 0) {
            return;
        }

        let bestDir = validDirs[0];
        let bestDist = Infinity;

        for (const dir of validDirs) {
            const newX = this.gridX + dir.x;
            const newY = this.gridY + dir.y;
            const dist = getDistance(newX, newY, targetX, targetY);

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
     * Set frightened state
     * @param {number} duration - Duration in seconds
     */
    setFrightened(duration) {
        this.isFrightened = true;
        this.frightenedTimer = duration;
        this.isBlinking = false;
        this.speedModifier = ghostSpeedMultipliers.frightened;

        // Reverse direction
        if (this.direction !== directions.NONE) {
            const opposite = getOpposite(this.direction);
            this.direction = opposite;
        }
    }

    /**
     * Mark ghost as eaten
     */
    eat() {
        this.isEaten = true;
        this.isFrightened = false;
        this.speedModifier = 1.0;
    }

    /**
     * Reset ghost to initial state
     */
    reset() {
        this.gridX = this.startGridX;
        this.gridY = this.startGridY;
        this.prevGridX = this.startGridX;
        this.prevGridY = this.startGridY;
        this.directionBuffer.reset();
        this.direction = directions.NONE;
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
     * Set speed multiplier for level progression
     * @param {number} multiplier - Speed multiplier
     */
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
    }

    /**
     * Get visual state for rendering
     * @returns {Object}
     */
    getVisualState() {
        let color = this.color;

        if (this.isFrightened) {
            if (this.isBlinking && Math.floor(this.blinkTimer / animationConfig.ghostBlinkSpeed) % 2 === 0) {
                color = 0xFFFFFF; // White when blinking
            } else {
                color = 0x0000FF; // Blue when frightened
            }
        } else if (this.isEaten) {
            color = 0xFFFFFF; // White when eaten
        }

        return {
            ...this.visualState,
            color: color,
            opacity: this.isEaten ? 0.4 : 1.0,
            isFrightened: this.isFrightened,
            isEaten: this.isEaten,
            isBlinking: this.isBlinking
        };
    }

    /**
     * Get state snapshot
     * @returns {Object}
     */
    getSnapshot() {
        return {
            ...super.getSnapshot(),
            ghostType: this.ghostType,
            mode: this.mode,
            isFrightened: this.isFrightened,
            isEaten: this.isEaten,
            visual: this.getVisualState()
        };
    }
}
