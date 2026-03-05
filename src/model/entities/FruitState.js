/**
 * FruitState
 * Pure data representation of Fruit entity.
 * NO Phaser dependencies.
 */

import { ModelEntity } from '../ModelEntity.js';
import { gameConfig, fruitConfig, scoreValues } from '../../config/gameConfig.js';
import { getCenterPixel } from '../../utils/MazeLayout.js';

export class FruitState extends ModelEntity {
    /**
     * @param {number} gridX - Grid X position (default: fruit config position)
     * @param {number} gridY - Grid Y position (default: fruit config position)
     */
    constructor(gridX, gridY) {
        const position = fruitConfig.positions[0];
        const finalGridX = gridX ?? position.x;
        const finalGridY = gridY ?? position.y;

        super(finalGridX, finalGridY, {
            type: 'fruit',
            speed: 0 // Fruit doesn't move
        });

        this.active = false;
        this.timer = 0;
        this.duration = fruitConfig.duration;
        this.fruitTypeIndex = 0;
        this.score = 0;

        // Visual animation state
        this.bobOffset = 0;
        this.bobDirection = 1;
        this.bobSpeed = 2; // pixels per second
        this.bobAmount = 3; // max pixels to bob
    }

    /**
     * Update fruit state
     * @param {number} deltaSeconds - Time since last frame
     * @returns {Array<Object>} - Events generated
     */
    update(deltaSeconds) {
        const events = [];

        if (!this.active) {
            return events;
        }

        // Update timer
        this.timer -= deltaSeconds;

        // Update bobbing animation
        this.updateBobAnimation(deltaSeconds);

        // Check if expired
        if (this.timer <= 0) {
            this.deactivate();
            events.push({
                type: 'fruit_expired',
                entityId: this.id,
                entityType: 'fruit'
            });
        }

        return events;
    }

    /**
     * Update bobbing animation
     * @param {number} deltaSeconds - Time since last frame
     */
    updateBobAnimation(deltaSeconds) {
        this.bobOffset += this.bobDirection * this.bobSpeed * deltaSeconds;

        if (Math.abs(this.bobOffset) >= this.bobAmount) {
            this.bobOffset = this.bobDirection * this.bobAmount;
            this.bobDirection *= -1;
        }
    }

    /**
     * Activate fruit for a level
     * @param {number} level - Current level (determines fruit type)
     */
    activate(level) {
        this.fruitTypeIndex = Math.min(level - 1, fruitConfig.types.length - 1);
        const fruitType = fruitConfig.types[this.fruitTypeIndex];

        // Set position from fruitConfig
        const position = fruitConfig.positions[0] || { x: 13, y: 27 };
        this.gridX = position.x;
        this.gridY = position.y;
        const pixel = getCenterPixel(position.x, position.y);
        this.x = pixel.x;
        this.y = pixel.y;

        this.score = fruitType.score;
        this.active = true;
        this.timer = this.duration;
        this.bobOffset = 0;
        this.bobDirection = 1;

        this.visualState.visible = true;
    }

    /**
     * Deactivate fruit
     */
    deactivate() {
        this.active = false;
        this.timer = 0;
        this.visualState.visible = false;
    }

    /**
     * Check if Pacman can eat this fruit
     * @param {Object} pacmanPosition - Pacman position {x, y}
     * @returns {boolean}
     */
    canBeEaten(pacmanPosition) {
        if (!this.active || !pacmanPosition) {
            return false;
        }

        const dist = Math.sqrt(
            Math.pow(pacmanPosition.x - this.x, 2) +
            Math.pow(pacmanPosition.y - this.y, 2)
        );

        // Can be eaten if within tile size
        return dist < gameConfig.tileSize;
    }

    /**
     * Get eaten (returns score and deactivates)
     * @returns {number} - Score value
     */
    eat() {
        if (!this.active) {
            return 0;
        }

        const points = this.score;
        this.deactivate();
        return points;
    }

    /**
     * Reset fruit to initial state
     */
    reset() {
        this.active = false;
        this.timer = 0;
        this.fruitTypeIndex = 0;
        this.score = 0;
        this.bobOffset = 0;
        this.bobDirection = 1;
        this.visualState.visible = false;
    }

    /**
     * Get fruit type info
     * @returns {Object}
     */
    getFruitType() {
        return fruitConfig.types[this.fruitTypeIndex] || fruitConfig.types[0];
    }

    /**
     * Get visual state for rendering
     * @returns {Object}
     */
    getVisualState() {
        const fruitType = this.getFruitType();

        return {
            ...this.visualState,
            active: this.active,
            fruitType: fruitType.name,
            color: fruitType.color,
            bobOffset: this.bobOffset,
            timeRemaining: this.timer,
            percentRemaining: this.active ? (this.timer / this.duration) : 0
        };
    }

    /**
     * Get state snapshot
     * @returns {Object}
     */
    getSnapshot() {
        return {
            ...super.getSnapshot(),
            active: this.active,
            timer: this.timer,
            score: this.score,
            fruitType: this.getFruitType().name,
            visual: this.getVisualState()
        };
    }
}
