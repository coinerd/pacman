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

        console.log('[PlayerRenderer.constructor] Created graphics with depth:', this.graphics.depth);

        // Use scene.add.circle() for eye
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
    }

    /**
	 * Draw player hexagon with eye
	 */
    drawPlayer(x, y, direction) {
        const radius = gameConfig.tileSize * 0.4;

        // Debug logging
        if (!this._drawLogged) {
            console.log('[PlayerRenderer.drawPlayer] Position:', x, y, 'Radius:', radius, 'Color:', this.currentColor);
            this._drawLogged = true;
        }

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

        // Debug: log all points
        if (!this._pointsLogged) {
            console.log('[PlayerRenderer.drawPlayer] Hexagon points:', points);
            this._pointsLogged = true;
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

        // Debug: verify graphics state
        console.log('[PlayerRenderer.drawPlayer] Graphics visible:', this.graphics.visible,
            'alpha:', this.graphics.alpha,
            'depth:', this.graphics.depth);
    }

    /**
	 * Sync visual to model state
     * Model entity.x/y is already interpolated by TileCenterMovementStrategy
	 */
    sync() {
        const radius = gameConfig.tileSize * 0.4;

        // Model.x/y is always correctly interpolated by TileCenterMovementStrategy
        // No need to recalculate interpolation in view

        // Debug logging
        if (!this._logged) {
            console.log('[PlayerRenderer.sync] Initial position:', this.state.x, this.state.y,
                'direction:', this.state.direction);
            this._logged = true;
        }

        // Debug logging every 30 frames
        this._frameCount = (this._frameCount || 0) + 1;
        if (this._frameCount % 30 === 0) {
            console.log(`[PlayerRenderer.sync] Frame ${this._frameCount}:`,
                `pos (${this.state.x.toFixed(1)}, ${this.state.y.toFixed(1)})`);
        }

        const rotation = (this.state.direction.angle * Math.PI) / 180;

        this.pulsePhase += 0.05;
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.05;

        // Use state position for eye (syncs with interpolated movement)
        const eyeOffset = radius * 0.3;

        const angle = this.state.direction.angle;
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

        // Draw player hexagon
        this.drawPlayer(this.state.x, this.state.y, this.state.direction);

        if (this.state.isDying) {
            const deathScale = 1 + (1 - this.state.mouthAngle / 30) * 0.5;
            this.graphics.setAlpha(this.state.mouthAngle / 30);
            this.eye.setVisible(false);
        } else {
            this.graphics.setAlpha(1);
            this.eye.setVisible(true);
        }

        this.graphics.setVisible(this.state.visualState.visible);
    }

    /**
	 * Update direction animation
	 */
    updateDirectionAnimation(newDirection) {
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
        this.eye.destroy();
    }
}
