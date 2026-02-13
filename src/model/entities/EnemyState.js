/**
 * EnemyState
 * Pure data representation of Enemy entity.
 * NO Phaser dependencies.
 */

import {
    animationConfig,
    directions,
    enemyColors,
    enemyNames,
    gameConfig,
    getOpposite,
    ghostModes,
    ghostSpeedMultipliers,
    levelConfig,
    scatterTargets
} from '../../config/gameConfig.js';
import {
    getCenterPixel,
    getDistance,
    getValidDirections,
    isWalkableTile
} from '../../utils/MazeLayout.js';
import { moveEntityOnGrid } from '../../utils/movement/GridMovement.js';
import { isAtTileCenter } from '../../utils/TileMath.js';
import { ModelEntity } from '../ModelEntity.js';

export class EnemyState extends ModelEntity {
    /**
	 * @param {number} gridX - Initial grid X position
	 * @param {number} gridY - Initial grid Y position
	 * @param {string} ghostType - Enemy type: 'alpha', 'beta', 'gamma', 'delta'
	 * @param {number} level - Current game level
	 */
    constructor(gridX, gridY, ghostType, level = 1) {
        const baseLevelSpeed =
			levelConfig.baseSpeed + (level - 1) * levelConfig.speedIncreasePerLevel;
        const speed = baseLevelSpeed * levelConfig.ghostSpeedMultiplier;

        super(gridX, gridY, {
            type: 'enemy',
            speed: speed
        });

        this.ghostType = ghostType;

        const ghostTypeMapping = {
            BLINKY: 'ALPHA',
            PINKY: 'BETA',
            INKY: 'GAMMA',
            CLYDE: 'DELTA'
        };

        const mappedType =
			ghostTypeMapping[ghostType.toUpperCase()] || ghostType.toUpperCase();

        this.name = ghostType;
        this.color = enemyColors[mappedType] || 0xffffff;
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

        // Virus core (ghost house)
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
	 * Update enemy state
	 * @param {number} deltaSeconds - Time since last frame
	 * @param {Array<Array<number>>} maze - Maze grid
	 * @param {Object} pacmanState - Player state for AI targeting
	 * @param {boolean} useDecoupledSystems - Whether using decoupled movement
	 * @returns {Array<Object>} - Events generated
	 */
    update(deltaSeconds, maze, pacmanState = null, useDecoupledSystems = false) {
        const events = [];

        if (useDecoupledSystems) {
            // In decoupled mode:
            // - EnemyAIAdapter handles AI and direction setting
            // - MovementAdapter handles movement
            // - EnemyState only handles state updates (timers, flags)

            if (this.isEaten) {
                // Eaten state still needs special handling for returning to virus core
                // This is handled by EnemyAIAdapter.updateEatenEnemy()
                // Just update timers here
                if (this.inGhostHouse) {
                    this.houseTimer -= deltaSeconds;
                    if (this.houseTimer <= 0) {
                        this.reset();
                    }
                }
            }

            // Update frightened timer
            if (this.isFrightened) {
                this.updateFrightened(deltaSeconds);
            }

            this.isMoving = this.direction !== directions.NONE;
        } else {
            // Legacy mode - full update
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
        }

        return events;
    }

    /**
	 * Move enemy
	 * @param {number} deltaSeconds - Time since last frame
	 * @param {Array<Array<number>>} maze - Maze grid
	 * @param {Object} pacmanState - Player state for targeting
	 * @returns {Array<Object>} - Events generated
	 */
    moveGhost(deltaSeconds, maze, pacmanState) {
        const events = [];

        // AI: Choose direction at tile center
        if (isAtTileCenter(this.x, this.y, this.gridX, this.gridY)) {
            this.updateAI(maze, pacmanState);
        }

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
                    entityType: 'enemy',
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
                entityType: 'enemy',
                ghostType: this.ghostType
            });
        }

        return events;
    }

    /**
	 * Update eaten state (returning to virus core)
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

        // Check if reached virus core
        if (this.gridX === targetX && this.gridY === targetY) {
            this.inGhostHouse = true;
            this.houseTimer = 2; // 2 seconds in virus core
            this.direction = directions.NONE;
            this.speedModifier = oldModifier;
            events.push({
                type: 'ghost_entered_house',
                entityId: this.id,
                ghostType: this.ghostType
            });
            return events;
        }

        // Move toward virus core
        this.chooseDirectionToTarget(maze, targetX, targetY);

        const moveResult = moveEntityOnGrid(this, maze, deltaSeconds);
        for (const event of moveResult.events) {
            events.push({
                ...event,
                entityId: this.id,
                entityType: 'enemy',
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
	 * Update AI - choose target and direction
	 * @param {Array<Array<number>>} maze - Maze grid
	 * @param {Object} playerState - Player state for targeting
	 */
    updateAI(maze, playerState) {
        // Update target based on mode and enemy type
        this.updateTarget(playerState);

        // Choose direction toward target
        this.chooseDirectionToTarget(maze, this.targetX, this.targetY);
    }

    /**
	 * Update target based on enemy type and mode
	 * @param {Object} playerState - Player state for targeting
	 */
    updateTarget(playerState) {
        if (this.isEaten) {
            this.targetX = 13; // Virus core entrance
            this.targetY = 14;
            return;
        }

        if (this.isFrightened) {
            // Target is random when frightened - direction chosen randomly in chooseDirectionToTarget
            return;
        }

        switch (this.ghostType) {
        case 'alpha':
            this.updateAlphaTarget(playerState);
            break;
        case 'beta':
            this.updateBetaTarget(playerState);
            break;
        case 'gamma':
            this.updateGammaTarget(playerState);
            break;
        case 'delta':
            this.updateDeltaTarget(playerState);
            break;
        }
    }

    /**
	 * Update Alpha's target
	 * @param {Object} playerState - Player state
	 */
    updateAlphaTarget(playerState) {
        if (this.mode === ghostModes.SCATTER) {
            this.targetX = scatterTargets.alpha.x;
            this.targetY = scatterTargets.alpha.y;
        } else if (playerState) {
            this.targetX = playerState.gridX;
            this.targetY = playerState.gridY;
        }
    }

    /**
	 * Update Beta's target (4 tiles ahead of Player)
	 * @param {Object} playerState - Player state
	 */
    updateBetaTarget(playerState) {
        if (this.mode === ghostModes.SCATTER) {
            this.targetX = scatterTargets.beta.x;
            this.targetY = scatterTargets.beta.y;
        } else if (playerState) {
            // Beta targets 4 tiles ahead of Player
            this.targetX = playerState.gridX + playerState.direction.x * 4;
            this.targetY = playerState.gridY + playerState.direction.y * 4;

            // Replicate original arcade bug: Up also moves target left
            if (playerState.direction.y === -1) {
                this.targetX -= 4;
            }
        }
    }

    /**
	 * Update Gamma's target (vector from Alpha through 2 tiles ahead of Player)
	 * @param {Object} playerState - Player state
	 */
    updateGammaTarget(playerState) {
        if (this.mode === ghostModes.SCATTER) {
            this.targetX = scatterTargets.gamma.x;
            this.targetY = scatterTargets.gamma.y;
        } else if (playerState) {
            // Simplified: target 2 tiles ahead of Player
            this.targetX = playerState.gridX + playerState.direction.x * 2;
            this.targetY = playerState.gridY + playerState.direction.y * 2;
        }
    }

    /**
	 * Update Delta's target (chase unless too close, then scatter)
	 * @param {Object} playerState - Player state
	 */
    updateDeltaTarget(playerState) {
        if (this.mode === ghostModes.SCATTER) {
            this.targetX = scatterTargets.delta.x;
            this.targetY = scatterTargets.delta.y;
        } else if (playerState) {
            const dist = getDistance(
                this.gridX,
                this.gridY,
                playerState.gridX,
                playerState.gridY
            );
            if (dist > 8) {
                this.targetX = playerState.gridX;
                this.targetY = playerState.gridY;
            } else {
                // Return to scatter corner if too close
                this.targetX = scatterTargets.delta.x;
                this.targetY = scatterTargets.delta.y;
            }
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

        // Filter out reverse direction (enemies can't reverse)
        let filteredDirs = validDirs;
        if (this.direction !== directions.NONE) {
            const opposite = getOpposite(this.direction);
            filteredDirs = validDirs.filter(
                (d) => !(d.x === opposite.x && d.y === opposite.y)
            );
        }

        if (filteredDirs.length === 0) {
            filteredDirs = validDirs;
        }

        let chosenDir;

        if (this.isFrightened) {
            // Random direction when frightened
            const randomIndex = Math.floor(Math.random() * filteredDirs.length);
            chosenDir = filteredDirs[randomIndex];
        } else {
            // Choose direction that minimizes distance to target
            let bestDir = filteredDirs[0];
            let bestDist = Infinity;

            for (const dir of filteredDirs) {
                const newX = this.gridX + dir.x;
                const newY = this.gridY + dir.y;
                const dist = getDistance(newX, newY, targetX, targetY);

                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = dir;
                }
            }
            chosenDir = bestDir;
        }

        // Apply direction immediately if not moving, otherwise queue it
        if (this.direction === directions.NONE) {
            this.direction = chosenDir; // Apply immediately
        } else {
            this.setDirection(chosenDir); // Queue for later
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
	 * Mark enemy as eaten
	 */
    eat() {
        this.isEaten = true;
        this.isFrightened = false;
        this.speedModifier = 1.0;
    }

    /**
	 * Reset enemy to initial state
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
            if (
                this.isBlinking &&
				Math.floor(this.blinkTimer / animationConfig.ghostBlinkSpeed) % 2 === 0
            ) {
                color = 0xffffff; // White when blinking
            } else {
                color = 0x0000ff; // Blue when frightened
            }
        } else if (this.isEaten) {
            color = 0xffffff; // White when eaten
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
