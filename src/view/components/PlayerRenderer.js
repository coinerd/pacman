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
	 * Draw player as hexagonal starburst/constellation pattern
	 * 5 layers of 6 circles each, with alternating offsets
	 */
    drawPlayer(x, y, _direction) {
        // Clear previous frame
        this.graphics.clear();

        if (!this.graphics || !this.graphics.scene) {
            console.error('[PlayerRenderer.drawPlayer] Graphics object is invalid!');
            return;
        }

        const baseRadius = gameConfig.tileSize * 0.4;

        // Define 5 layers: [radius multiplier, circle size, angle offset]
        // Each layer is slightly offset to create starburst effect
        const layers = [
            { radiusMult: 0.25, size: 0.18, offset: 0 },      // Layer 1: Innermost - largest
            { radiusMult: 0.40, size: 0.14, offset: 30 },     // Layer 2: Slightly smaller, offset
            { radiusMult: 0.55, size: 0.11, offset: 0 },      // Layer 3: Even smaller
            { radiusMult: 0.70, size: 0.08, offset: 30 },     // Layer 4: Small
            { radiusMult: 0.85, size: 0.05, offset: 0 }       // Layer 5: Outermost - tiny dots
        ];

        // Primary color (cyan) and accent
        const primaryColor = 0x00ced1;
        const accentColor = 0x00ffff;

        // Draw center point
        this.graphics.fillStyle(accentColor, 1);
        this.graphics.fillCircle(x, y, baseRadius * 0.12);

        // Draw each layer
        layers.forEach((layer, layerIndex) => {
            const layerRadius = baseRadius * layer.radiusMult;
            const circleSize = baseRadius * layer.size;

            // Alternate colors for depth
            const color = layerIndex % 2 === 0 ? primaryColor : accentColor;
            const alpha = 1 - (layerIndex * 0.1); // Slight fade for outer layers

            this.graphics.fillStyle(color, alpha);

            // Draw 6 circles in hexagonal arrangement
            for (let i = 0; i < 6; i++) {
                const angle = ((i * 60) + layer.offset - 90) * (Math.PI / 180);
                const cx = x + layerRadius * Math.cos(angle);
                const cy = y + layerRadius * Math.sin(angle);

                this.graphics.fillCircle(cx, cy, circleSize);
            }
        });

        // Add connecting lines for molecule/constellation effect
        this.graphics.lineStyle(1, primaryColor, 0.3);

        // Connect inner layers
        for (let layerIdx = 0; layerIdx < 3; layerIdx++) {
            const layer = layers[layerIdx];
            const layerRadius = baseRadius * layer.radiusMult;

            // Draw hexagon outline for this layer
            this.graphics.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = ((i * 60) + layer.offset - 90) * (Math.PI / 180);
                const cx = x + layerRadius * Math.cos(angle);
                const cy = y + layerRadius * Math.sin(angle);

                if (i === 0) {
                    this.graphics.moveTo(cx, cy);
                } else {
                    this.graphics.lineTo(cx, cy);
                }
            }
            this.graphics.closePath();
            this.graphics.strokePath();
        }
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
