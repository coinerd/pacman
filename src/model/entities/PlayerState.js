/**
 * PlayerState
 * Pure data representation of Player entity.
 * NO Phaser dependencies.
 */

import {
    animationConfig,
    directions,
    gameConfig,
    levelConfig
} from '../../config/gameConfig.js';
import { moveEntityOnGrid } from '../../utils/movement/GridMovement.js';
import { isAtTileCenter } from '../../utils/TileMath.js';
import { ModelEntity } from '../ModelEntity.js';

export class PlayerState extends ModelEntity {
    /**
	 * @param {number} gridX - Initial grid X position
	 * @param {number} gridY - Initial grid Y position
	 * @param {number} level - Current game level (affects speed)
	 */
    constructor(gridX, gridY, level = 1) {
        const baseLevelSpeed =
			levelConfig.baseSpeed + (level - 1) * levelConfig.speedIncreasePerLevel;
        const speed = baseLevelSpeed * levelConfig.playerSpeedMultiplier;

        super(gridX, gridY, {
            type: 'player',
            speed: speed
        });

        this.baseSpeed = speed;

        // Animation state (data only)
        this.mouthAngle = 0;
        this.mouthDirection = 1; // 1 = opening, -1 = closing
        this.maxMouthAngle = 30;

        this.baseSpeed = speed;

        this.mouthAngle = 0;
        this.mouthDirection = 1;
        this.maxMouthAngle = 30;

        this.isDying = false;
        this.deathAnimationProgress = 0;

        this.isShielded = false;
        this.hasSpeedBoost = false;
        this.hasDataMagnet = false;
    }

    /**
	 * Update Player state
	 * @param {number} deltaSeconds - Time since last frame
	 * @param {Array<Array<number>>} maze - Maze grid
	 * @param {Object} inputDirection - Desired direction from input (optional)
	 * @param {boolean} useDecoupledSystems - Whether using decoupled movement
	 * @returns {Array<Object>} - Events generated
	 */
    update(
        deltaSeconds,
        maze,
        inputDirection = null,
        useDecoupledSystems = false
    ) {
        const events = [];

        if (this.isDying) {
            this.updateDeathAnimation(deltaSeconds);
            return events;
        }

        // Update mouth animation (always needed)
        this.updateMouthAnimation(deltaSeconds);

        if (useDecoupledSystems) {
            // In decoupled mode, MovementAdapter handles all movement
            // PlayerState only handles animations and state
            // Direction changes are applied via directionBuffer by MovementAdapter

            // Apply input direction to buffer if provided
            if (inputDirection && inputDirection !== directions.NONE) {
                this.setDirection(inputDirection);
            }

            // Update moving state based on current direction
            this.isMoving = this.direction !== directions.NONE;

            // Handle tunnel wrapping (if not handled by MovementAdapter)
            if (this.handleTunnelWrap()) {
                events.push({
                    type: 'tunnel_wrap',
                    entityId: this.id,
                    entityType: 'player',
                    gridX: this.gridX,
                    gridY: this.gridY
                });
            }
        } else {
            // Legacy mode - full update with movement
            // Apply input direction if provided
            if (inputDirection && inputDirection !== directions.NONE) {
                this.setDirection(inputDirection);
            }

            // Update previous position before movement
            this.updatePreviousPosition();

            // Check if at tile center for direction changes
            const isAtCenter = isAtTileCenter(this.x, this.y, this.gridX, this.gridY);

            if (isAtCenter) {
                this.makeDecisionAtIntersection(maze);
            }

            // Perform movement using legacy system
            if (this.direction !== directions.NONE) {
                const moveResult = moveEntityOnGrid(this, maze, deltaSeconds);

                // Process movement events
                for (const event of moveResult.events) {
                    events.push({
                        ...event,
                        entityId: this.id,
                        entityType: 'player'
                    });
                }
            }

            // Handle tunnel wrapping
            if (this.handleTunnelWrap()) {
                events.push({
                    type: 'tunnel_wrap',
                    entityId: this.id,
                    entityType: 'player',
                    gridX: this.gridX,
                    gridY: this.gridY
                });
            }
        }

        return events;
    }

    /**
	 * Make decision at tile intersection
	 * @param {Array<Array<number>>} maze - Maze grid
	 */
    makeDecisionAtIntersection(maze) {
        // Try to apply buffered direction
        const applied = this.directionBuffer.applyIfCanMove((dir) => {
            return this.canMoveInDirection(dir, maze);
        });

        if (applied) {
            this.isMoving = true;
        } else if (this.direction !== directions.NONE) {
            // Check if current direction is still valid
            const canContinue = this.canMoveInDirection(this.direction, maze);
            if (!canContinue) {
                this.direction = directions.NONE;
                this.isMoving = false;
            } else {
                // Can continue in current direction - keep moving!
                this.isMoving = true;
            }
        }
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
	 * Reset Player to starting state
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
