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

        // Use scene.add.circle() for eye (direction indicator)
        if (playerState && playerState.x !== undefined && playerState.y !== undefined) {
            // Eye starts in facing direction
            const eyeRadius = radius * 0.55;
            this.eye = scene.add.circle(
                playerState.x + eyeRadius,
                playerState.y,
                radius * 0.06,
                0xffffff
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
	 * Draw player as hexagonal pattern: 30 circles in 7 rows (3-4-5-6-5-4-3)
	 * No center point, strictly six-symmetric
	 * Inner circles large, outer circles small
	 */
    drawPlayer(x, y, _direction) {
        // Clear previous frame
        this.graphics.clear();

        if (!this.graphics || !this.graphics.scene) {
            console.error('[PlayerRenderer.drawPlayer] Graphics object is invalid!');
            return;
        }

        const baseRadius = gameConfig.tileSize * 0.4;
        const primaryColor = 0x00ced1;
        const accentColor = 0x00ffff;

        // 7 rows pattern: 3-4-5-6-5-4-3 = 30 circles total
        // Each row has circles arranged in a hexagonal ring
        // Inner rows: larger circles, outer rows: smaller circles
        const rows = [
            { count: 3, radiusMult: 0.18, size: 0.16, offset: 0 },   // Row 1: 3 circles (innermost, largest)
            { count: 4, radiusMult: 0.30, size: 0.14, offset: 22.5 }, // Row 2: 4 circles
            { count: 5, radiusMult: 0.42, size: 0.12, offset: 0 },   // Row 3: 5 circles
            { count: 6, radiusMult: 0.54, size: 0.10, offset: 0 },   // Row 4: 6 circles (middle row)
            { count: 5, radiusMult: 0.66, size: 0.08, offset: 0 },   // Row 5: 5 circles
            { count: 4, radiusMult: 0.78, size: 0.06, offset: 22.5 }, // Row 6: 4 circles
            { count: 3, radiusMult: 0.90, size: 0.04, offset: 0 }    // Row 7: 3 circles (outermost, smallest)
        ];

        // Draw each row
        rows.forEach((row, rowIndex) => {
            const rowRadius = baseRadius * row.radiusMult;
            const circleSize = baseRadius * row.size;

            // Alternate colors for visual depth
            const color = rowIndex % 2 === 0 ? primaryColor : accentColor;
            const alpha = 1 - (rowIndex * 0.05); // Slight fade for outer rows

            this.graphics.fillStyle(color, alpha);

            // Draw circles in this row, evenly distributed
            for (let i = 0; i < row.count; i++) {
                const angle = ((360 / row.count) * i + row.offset - 90) * (Math.PI / 180);
                const cx = x + rowRadius * Math.cos(angle);
                const cy = y + rowRadius * Math.sin(angle);

                this.graphics.fillCircle(cx, cy, circleSize);
            }
        });
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
            const eyeRadius = radius * 0.55;
            this.eye = this.scene.add.circle(
                data.x + eyeRadius,
                data.y,
                radius * 0.06,
                0xffffff
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

        // Update eye position if eye exists (subtle direction indicator)
        if (this.eye) {
            // Position eye in the direction the player is facing
            const eyeRadius = radius * 0.55; // Just beyond layer 3
            const angle = (this.state.direction?.angle ?? 0) * (Math.PI / 180);

            // Game angle: 0=right, 90=down, 180=left, 270=up
            // Canvas: same orientation, just convert to radians
            this.eye.x = this.state.x + eyeRadius * Math.cos(angle);
            this.eye.y = this.state.y + eyeRadius * Math.sin(angle);
            this.eye.radius = radius * 0.06; // Smaller, subtle eye
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
    addPowerUpEffect(_type) {
        // Implement power-up visual effects
    }

    /**
	 * Remove power-up effect
	 */
    removePowerUpEffect(_type) {
        // Remove power-up visual effects
    }

    /**
	 * Show score for eating
	 */
    showScore(_score, _x, _y) {
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
