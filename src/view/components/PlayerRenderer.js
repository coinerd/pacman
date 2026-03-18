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
	 * Draw player as radial starburst pattern (Cardano-style)
	 * 30 circles, 12 rays, no center point
	 * Inner circles large, outer circles small
	 * With pulsating glow effect
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
        const glowColor = 0x00ffff;

        // Calculate pulse values (0 to 1, oscillating)
        const pulseValue = (Math.sin(this.pulsePhase) + 1) / 2; // 0 to 1
        const glowPulse = 0.3 + (pulseValue * 0.4); // 0.3 to 0.7 alpha
        const scalePulse = 1 + (pulseValue * 0.08); // 1.0 to 1.08 scale

        // Draw outer glow rings (pulsating)
        const glowRadius = baseRadius * 1.1 * scalePulse;
        this.graphics.fillStyle(glowColor, glowPulse * 0.15);
        this.graphics.fillCircle(x, y, glowRadius * 1.3);
        this.graphics.fillStyle(glowColor, glowPulse * 0.25);
        this.graphics.fillCircle(x, y, glowRadius * 1.15);
        this.graphics.fillStyle(glowColor, glowPulse * 0.35);
        this.graphics.fillCircle(x, y, glowRadius);

        // 12 rays at 0°, 30°, 60°, 90°, 120°, 150°, 180°, 210°, 240°, 270°, 300°, 330°
        // Primary rays (0°, 60°, 120°, 180°, 240°, 300°) have 3 dots = 18 dots
        // Secondary rays (30°, 90°, 150°, 210°, 270°, 330°) have 2 dots = 12 dots
        // Total = 30 dots

        const rays = [];
        for (let i = 0; i < 12; i++) {
            const angle = i * 30; // 0°, 30°, 60°, ...
            const isPrimary = i % 2 === 0; // 0°, 60°, 120°, ... are primary
            const dotCount = isPrimary ? 3 : 2;

            // Dot distances from center (as multipliers of baseRadius)
            const distances = isPrimary
                ? [0.25, 0.50, 0.80]  // Primary rays: inner, middle, outer
                : [0.35, 0.65];       // Secondary rays: middle positions

            // Dot sizes (as multipliers of baseRadius) - with pulse scale
            const sizes = isPrimary
                ? [0.12, 0.09, 0.06]  // Large → small
                : [0.10, 0.07];

            rays.push({ angle, dotCount, distances, sizes, isPrimary });
        }

        // Draw all dots
        let dotIndex = 0;
        rays.forEach((ray) => {
            const angleRad = (ray.angle - 90) * (Math.PI / 180); // -90 to start from top

            for (let i = 0; i < ray.dotCount; i++) {
                const distance = baseRadius * ray.distances[i] * scalePulse;
                const size = baseRadius * ray.sizes[i] * scalePulse;
                const cx = x + distance * Math.cos(angleRad);
                const cy = y + distance * Math.sin(angleRad);

                // Alternate colors for visual depth
                const color = dotIndex % 2 === 0 ? primaryColor : accentColor;
                // Pulse brightness: base alpha + pulse contribution
                const baseAlpha = 1 - (i * 0.1);
                const pulseAlpha = baseAlpha + (pulseValue * 0.2);

                this.graphics.fillStyle(color, Math.min(pulseAlpha, 1));
                this.graphics.fillCircle(cx, cy, size);

                dotIndex++;
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
