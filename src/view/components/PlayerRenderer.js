/**
 * PlayerRenderer
 * Renders Player entity using Phaser graphics.
 * Pure view component - no game logic.
 */

import { gameConfig } from '../../config/gameConfig.js';

export class PlayerRenderer {
    /**
	 * @param {Phaser.Scene} scene - Phaser scene
	 * @param {PlayerState} playerState - Player model state
	 */
    constructor(scene, playerState) {
        this.scene = scene;
        this.state = playerState;

        // Create graphics object for drawing player
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(100);
        this.graphics.setAlpha(1);
        this.graphics.setVisible(true);

        const radius = gameConfig.tileSize * 0.4;
        const cyanColor = 0x00ced1;

        // Use scene.add.circle() for eye (only if playerState exists)
        if (playerState && playerState.x !== undefined && playerState.y !== undefined) {
            this.eye = scene.add.circle(
                playerState.x,
                playerState.y - radius * 0.3,
                radius * 0.15,
                0x000000
            );
            this.eye.setDepth(101);

            this.currentRadius = radius;
            this.currentColor = cyanColor;
            this.pulsePhase = 0;

            // Initial draw
            this.drawPlayer(playerState.x, playerState.y, playerState.direction);
        } else {
            this.eye = null;
            this.currentRadius = radius;
            this.currentColor = cyanColor;
            this.pulsePhase = 0;
        }
    }

    /**
	 * Draw player hexagon with eye
	 */
    drawPlayer(x, y, direction) {
        const radius = gameConfig.tileSize * 0.4;

        // Clear previous frame
        this.graphics.clear();

        // Debug: verify graphics is still valid
        if (!this.graphics || !this.graphics.scene) {
            console.error('[PlayerRenderer.drawPlayer] Graphics object is invalid!');
            return;
        }

        // Set fill style with explicit alpha
        this.graphics.fillStyle(this.currentColor, 1);
        this.graphics.lineStyle(3, this.currentColor, 1);

        // Calculate hexagon points (centered at x, y)
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            points.push(px, py);
        }

        // Draw path explicitly
        this.graphics.beginPath();
        this.graphics.moveTo(points[0], points[1]);
        for (let i = 1; i < 6; i++) {
            this.graphics.lineTo(points[i * 2], points[i * 2 + 1]);
        }
        this.graphics.closePath();

        // Fill AND stroke for visibility
        this.graphics.fillPath();
        this.graphics.strokePath();
    }


    /**
	 * Update player renderer with new state data
	 * @param {Object} data - Player state data
	 */
    update(data) {
        if (!data) {
            return;
        }



        // Update internal state
        this.state = { ...this.state, ...data };

        // Create eye if not exists and we have valid position
        const radius = gameConfig.tileSize * 0.4;
        if (!this.eye && data.x !== undefined && data.y !== undefined) {
            this.eye = this.scene.add.circle(
                data.x,
                data.y - radius * 0.3,
                radius * 0.15,
                0x000000
            );
            this.eye.setDepth(101);
        }

        // Sync visuals
        this.sync();
    }

    /**
	 * Sync visual to model state
     * Model entity.x/y is already interpolated by TileCenterMovementStrategy
	 */
    sync() {
        if (!this.state || !this.state.x || !this.state.y) {
            return;
        }

        // Update player graphics position

        const radius = gameConfig.tileSize * 0.4;

        // Model.x/y is always correctly interpolated by TileCenterMovementStrategy
        // No need to recalculate interpolation in view

        this.pulsePhase += 0.05;

        // Update eye position if eye exists
        if (this.eye) {
            const eyeOffset = radius * 0.3;
            const angle = this.state.direction?.angle ?? 0;

            if (angle === 0) {
                this.eye.x = this.state.x + eyeOffset;
                this.eye.y = this.state.y - eyeOffset;
            } else if (angle === 180) {
                this.eye.x = this.state.x - eyeOffset;
                this.eye.y = this.state.y - eyeOffset;
            } else if (angle === 270) {
                this.eye.x = this.state.x;
                this.eye.y = this.state.y - eyeOffset * 1.5;
            } else if (angle === 90) {
                this.eye.x = this.state.x;
                this.eye.y = this.state.y - eyeOffset * 0.5;
            } else {
                this.eye.x = this.state.x + eyeOffset;
                this.eye.y = this.state.y - eyeOffset;
            }
        }

        // Draw player hexagon
        this.drawPlayer(this.state.x, this.state.y, this.state.direction);

        // Update visibility
        if (this.state.isDying) {
            const mouthAngle = this.state.mouthAngle ?? 30;
            this.graphics.setAlpha(mouthAngle / 30);
            if (this.eye) {
                this.eye.setVisible(false);
            }
        } else {
            this.graphics.setAlpha(1);
            if (this.eye) {
                this.eye.setVisible(true);
            }
        }

        if (this.state.visualState) {
            this.graphics.setVisible(this.state.visualState.visible);
        }
    }

    /**
	 * Update direction animation
	 */
    updateDirectionAnimation(_newDirection) {
        // Can be used to trigger direction-specific animations
        this.pulsePhase = 0;
    }

    /**
	 * Add power-up effect
	 */
    addPowerUpEffect(type) {
        // Implement power-up visual effects
    }

    /**
	 * Remove power-up effect
	 */
    removePowerUpEffect(type) {
        // Remove power-up visual effects
    }

    /**
	 * Show score for eating
	 */
    showScore(score, x, y) {
        // Show score popup
    }

    /**
	 * Clean up resources
	 */
    destroy() {
        this.graphics.clear();
        this.graphics.destroy();
        if (this.eye) {
            this.eye.destroy();
        }
    }
}
