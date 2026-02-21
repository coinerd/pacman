/**
 * PacmanState
 * Pure data representation of Pacman entity.
 * NO Phaser dependencies.
 *
 * Phase 4: Simplified - movement is handled by TileCenterMovementAdapter
 * PacmanState only handles animations and state.
 */

import {
    animationConfig,
    directions,
    levelConfig
} from '../../config/gameConfig.js';
import { ModelEntity } from '../ModelEntity.js';

export class PacmanState extends ModelEntity {
    /**
     * @param {number} gridX - Initial grid X position
     * @param {number} gridY - Initial grid Y position
     * @param {number} level - Current game level (affects speed)
     */
    constructor(gridX, gridY, level = 1) {
        const baseLevelSpeed =
            levelConfig.baseSpeed + (level - 1) * levelConfig.speedIncreasePerLevel;
        const speed = baseLevelSpeed * levelConfig.pacmanSpeedMultiplier;

        super(gridX, gridY, {
            type: 'pacman',
            speed: speed
        });

        this.baseSpeed = speed;

        // Animation state (data only)
        this.mouthAngle = 0;
        this.mouthDirection = 1; // 1 = opening, -1 = closing
        this.maxMouthAngle = 30;

        // Game state
        this.isDying = false;
        this.deathAnimationProgress = 0;
    }

    /**
     * Update Pacman state
     * @param {number} deltaSeconds - Time since last frame
     * @param {Array<Array<number>>} maze - Maze grid
     * @param {Object} inputDirection - Desired direction from input (optional)
     * @returns {Array<Object>} - Events generated
     */
    update(deltaSeconds, maze, inputDirection = null) {
        const events = [];

        if (this.isDying) {
            this.updateDeathAnimation(deltaSeconds);
            return events;
        }

        // Update mouth animation (always needed)
        this.updateMouthAnimation(deltaSeconds);

        // In TileCenterMovement mode, TileCenterMovementAdapter handles all movement
        // PacmanState only handles animations and state
        // Direction changes are applied via directionBuffer by TileCenterMovementAdapter

        // Apply input direction to buffer if provided
        if (inputDirection && inputDirection !== directions.NONE) {
            this.setDirection(inputDirection);
        }

        // Update moving state based on current direction
        this.isMoving = this.direction !== directions.NONE;

        // Handle tunnel wrapping (if not handled by TileCenterMovementAdapter)
        if (this.handleTunnelWrap()) {
            events.push({
                type: 'tunnel_wrap',
                entityId: this.id,
                entityType: 'pacman',
                gridX: this.gridX,
                gridY: this.gridY
            });
        }

        return events;
    }

    /**
     * Update mouth animation
     * @param {number} deltaSeconds - Time since last frame
     */
    updateMouthAnimation(deltaSeconds) {
        const speed = animationConfig.pacmanMouthSpeed;
        this.mouthAngle += this.mouthDirection * speed * deltaSeconds;

        if (this.mouthAngle >= this.maxMouthAngle) {
            this.mouthAngle = this.maxMouthAngle;
            this.mouthDirection = -1;
        } else if (this.mouthAngle <= 0) {
            this.mouthAngle = 0;
            this.mouthDirection = 1;
        }
    }

    /**
     * Update death animation
     * @param {number} deltaSeconds - Time since last frame
     */
    updateDeathAnimation(deltaSeconds) {
        const speed = animationConfig.pacmanDeathSpeed;
        this.mouthAngle += speed * deltaSeconds;
        this.deathAnimationProgress += deltaSeconds;

        if (this.mouthAngle > 180) {
            this.mouthAngle = 180;
        }
    }

    /**
     * Start death sequence
     */
    die() {
        this.isDying = true;
        this.isMoving = false;
        this.mouthDirection = 1;
        this.mouthAngle = 0;
        this.deathAnimationProgress = 0;
    }

    /**
     * Reset Pacman to starting state
     * @param {number} gridX - Reset X position
     * @param {number} gridY - Reset Y position
     */
    reset(gridX, gridY) {
        this.isDying = false;
        this.mouthAngle = 0;
        this.mouthDirection = 1;
        this.deathAnimationProgress = 0;
        this.resetPosition(gridX, gridY);
    }

    /**
     * Set speed multiplier (for power pellets, etc.)
     * @param {number} multiplier - Speed multiplier
     */
    setSpeedMultiplier(multiplier) {
        this.speed = this.baseSpeed * multiplier;
    }

    /**
     * Get visual state for rendering
     * @returns {Object}
     */
    getVisualState() {
        return {
            ...this.visualState,
            mouthAngle: this.mouthAngle,
            rotation: this.direction.angle,
            isDying: this.isDying
        };
    }

    /**
     * Get state snapshot
     * @returns {Object}
     */
    getSnapshot() {
        return {
            ...super.getSnapshot(),
            mouthAngle: this.mouthAngle,
            isDying: this.isDying,
            visual: this.getVisualState()
        };
    }
}
