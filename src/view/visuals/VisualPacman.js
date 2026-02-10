/**
 * VisualPacman
 * Phaser visual representation of Pacman model entity.
 * Syncs Phaser sprite to PacmanState.
 */

import Phaser from 'phaser';
import { gameConfig, colors } from '../../config/gameConfig.js';

export class VisualPacman {
    /**
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {PacmanState} pacmanState - Pacman model state
     */
    constructor(scene, pacmanState) {
        this.scene = scene;
        this.state = pacmanState;

        const radius = gameConfig.tileSize * 0.4;

        // Create Phaser Arc (pie slice for mouth)
        this.sprite = new Phaser.GameObjects.Arc(
            scene,
            pacmanState.x,
            pacmanState.y,
            radius,
            0,
            360,
            false,
            colors.pacman,
            1
        );

        this.sprite.setDepth(100);
        scene.add.existing(this.sprite);

        // Add eye for direction indication
        this.eye = new Phaser.GameObjects.Arc(
            scene,
            pacmanState.x,
            pacmanState.y - radius * 0.3,
            radius * 0.15,
            0,
            360,
            false,
            0x000000,
            1
        );
        this.eye.setDepth(101);
        scene.add.existing(this.eye);
    }

    /**
     * Sync visual to model state
     */
    sync() {
        // Update position
        this.sprite.x = this.state.x;
        this.sprite.y = this.state.y;

        // Update rotation based on direction
        const rotation = this.state.direction.angle;

        // Update mouth animation
        const mouthAngle = this.state.mouthAngle;

        // Update arc angles to show mouth
        this.sprite.setStartAngle(rotation + mouthAngle);
        this.sprite.setEndAngle(rotation + 360 - mouthAngle);

        // Update eye position based on direction
        const radius = gameConfig.tileSize * 0.4;
        const eyeOffset = radius * 0.3;

        // Use angle to determine direction
        const angle = this.state.direction.angle;
        if (angle === 0) { // RIGHT
            this.eye.x = this.state.x + eyeOffset;
            this.eye.y = this.state.y - eyeOffset;
        } else if (angle === 180) { // LEFT
            this.eye.x = this.state.x - eyeOffset;
            this.eye.y = this.state.y - eyeOffset;
        } else if (angle === 270) { // UP
            this.eye.x = this.state.x;
            this.eye.y = this.state.y - eyeOffset * 1.5;
        } else if (angle === 90) { // DOWN
            this.eye.x = this.state.x;
            this.eye.y = this.state.y - eyeOffset * 0.5;
        } else {
            // Default to right-facing
            this.eye.x = this.state.x + eyeOffset;
            this.eye.y = this.state.y - eyeOffset;
        }

        // Handle death animation
        if (this.state.isDying) {
            // During death, mouth opens fully
            const deathAngle = this.state.mouthAngle;
            this.sprite.setStartAngle(rotation + deathAngle);
            this.sprite.setEndAngle(rotation + 360 - deathAngle);
            this.eye.setVisible(false);
        } else {
            this.eye.setVisible(true);
        }

        // Handle visibility
        this.sprite.setVisible(this.state.visualState.visible);
        this.eye.setVisible(this.state.visualState.visible && !this.state.isDying);
        this.sprite.setAlpha(this.state.visualState.opacity);
    }

    /**
     * Destroy visual elements
     */
    destroy() {
        this.sprite.destroy();
        this.eye.destroy();
    }
}
