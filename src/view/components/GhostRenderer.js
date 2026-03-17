/**
 * GhostRenderer
 * Renders Ghost entity using Phaser graphics.
 * Pure view component - no game logic.
 */

import { enemyColors, gameConfig } from '../../config/gameConfig.js';

export class GhostRenderer {
    /**
	 * @param {Phaser.Scene} scene - Phaser scene
	 * @param {EnemyState|string} enemyState - Enemy model state or ghost type string
	 */
    constructor(scene, enemyState) {
        this.scene = scene;

        // Handle both full enemyState and simple ghostType string
        if (typeof enemyState === 'string') {
            this.state = {
                ghostType: enemyState,
                x: 0,
                y: 0,
                direction: 0,
                isFrightened: false,
                isEaten: false,
                inHouse: true
            };
        } else {
            this.state = enemyState;
        }

        // Create graphics object for drawing ghost
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(100);

        const radius = gameConfig.tileSize * 0.4;
        const color = enemyColors[this.state.ghostType.toUpperCase()] || 0xffffff;

        // Create eyes using scene.add.circle() (only if state has coordinates)
        if (this.state.x !== undefined && this.state.y !== undefined) {
            this.eyeLeft = this.createEye(
                scene,
                this.state.x - radius * 0.3,
                this.state.y - radius * 0.2,
                radius * 0.25
            );
            this.eyeRight = this.createEye(
                scene,
                this.state.x + radius * 0.3,
                this.state.y - radius * 0.2,
                radius * 0.25
            );

            // Pupils
            this.pupilLeft = this.createPupil(
                scene,
                this.state.x - radius * 0.3,
                this.state.y - radius * 0.2,
                radius * 0.12
            );
            this.pupilRight = this.createPupil(
                scene,
                this.state.x + radius * 0.3,
                this.state.y - radius * 0.2,
                radius * 0.12
            );
        } else {
            this.eyeLeft = null;
            this.eyeRight = null;
            this.pupilLeft = null;
            this.pupilRight = null;
        }

        this.currentRadius = radius;
        this.currentColor = color;

        // Initial draw (only if coordinates are available)
        if (this.state.x !== undefined && this.state.y !== undefined) {
            this.drawGhost(this.state.x, this.state.y);
        }
    }

    /**
	 * Create an eye
	 */
    createEye(scene, x, y, radius) {
        const eye = scene.add.circle(x, y, radius, 0xffffff);
        eye.setDepth(101);
        return eye;
    }

    /**
	 * Create a pupil
	 */
    createPupil(scene, x, y, radius) {
        const pupil = scene.add.circle(x, y, radius, 0x0000ff);
        pupil.setDepth(102);
        return pupil;
    }

    /**
	 * Draw ghost shape
	 */
    drawGhost(x, y) {
        const radius = gameConfig.tileSize * 0.4;

        // Clear previous frame
        this.graphics.clear();

        // Get color based on state
        let color = this.currentColor;

        const isFrightened = this.state.isFrightened ?? false;
        const isEaten = this.state.isEaten ?? false;

        if (isFrightened) {
            const isBlinking = this.state.isBlinking ?? false;
            if (isBlinking && Math.floor((this.state.blinkTimer || 0) / 0.2) % 2 === 0) {
                color = 0xffffff; // White when blinking
            } else {
                color = 0x0000ff; // Blue when frightened
            }
        } else if (isEaten) {
            color = 0xffffff; // White when eaten
        }

        const isModeSwitching = (this.state.modeTransitionTimer || 0) > 0;
        if (isModeSwitching && !isFrightened && !isEaten) {
            color = 0xffffff;
        }

        const opacity = isEaten ? 0.4 : (isModeSwitching ? 0.85 : 1.0);

        // Draw shape
        this.graphics.fillStyle(color, opacity);

        const points = this.getGhostShapePoints(this.state.ghostType, radius, x, y);

        this.graphics.beginPath();
        this.graphics.moveTo(points[0], points[1]);
        for (let i = 1; i < points.length / 2; i++) {
            this.graphics.lineTo(points[i * 2], points[i * 2 + 1]);
        }
        this.graphics.closePath();
        this.graphics.fillPath();
    }

    /**
	 * Get ghost shape points
	 */
    getGhostShapePoints(ghostType, radius, centerX, centerY) {
        const ghostTypeUpper = ghostType.toUpperCase();
        const points = [];

        if (ghostTypeUpper === 'ALPHA') {
            // Alpha: DIAMOND (rotated square)
            for (let i = 0; i < 4; i++) {
                const angle = (i * 90 + 45) * (Math.PI / 180);
                points.push(
                    centerX + radius * Math.cos(angle),
                    centerY + radius * Math.sin(angle)
                );
            }
        } else if (ghostTypeUpper === 'BETA') {
            // Beta: TRIANGLE (3 equal sides)
            for (let i = 0; i < 3; i++) {
                const angle = (i * 120 - 90) * (Math.PI / 180);
                points.push(
                    centerX + radius * Math.cos(angle),
                    centerY + radius * Math.sin(angle)
                );
            }
        } else if (ghostTypeUpper === 'GAMMA') {
            // Gamma: STAR (5-pointed)
            const outerRadius = radius;
            const innerRadius = radius * 0.4;
            for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * 36 - 90) * (Math.PI / 180);
                points.push(
                    centerX + r * Math.cos(angle),
                    centerY + r * Math.sin(angle)
                );
            }
        } else if (ghostTypeUpper === 'DELTA') {
            // Delta: HEXAGON (6-sided)
            for (let i = 0; i < 6; i++) {
                const angle = (i * 60 - 90) * (Math.PI / 180);
                points.push(
                    centerX + radius * Math.cos(angle),
                    centerY + radius * Math.sin(angle)
                );
            }
        } else {
            // Default: Circle
            for (let i = 0; i < 32; i++) {
                const angle = ((i * 360) / 32) * (Math.PI / 180);
                points.push(
                    centerX + radius * Math.cos(angle),
                    centerY + radius * Math.sin(angle)
                );
            }
        }

        return points;
    }

    /**
	 * Update ghost renderer with new state data
	 * @param {Object} data - Ghost state data
	 */
    update(data) {
        if (!data) {
            return;
        }

        // Update internal state
        this.state = { ...this.state, ...data };

        // Create eyes if not exists and we have valid position
        const radius = gameConfig.tileSize * 0.4;
        if (!this.eyeLeft && data.x !== undefined && data.y !== undefined) {
            this.eyeLeft = this.createEye(
                this.scene,
                data.x - radius * 0.3,
                data.y - radius * 0.2,
                radius * 0.25
            );
            this.eyeRight = this.createEye(
                this.scene,
                data.x + radius * 0.3,
                data.y - radius * 0.2,
                radius * 0.25
            );
            this.pupilLeft = this.createPupil(
                this.scene,
                data.x - radius * 0.3,
                data.y - radius * 0.2,
                radius * 0.12
            );
            this.pupilRight = this.createPupil(
                this.scene,
                data.x + radius * 0.3,
                data.y - radius * 0.2,
                radius * 0.12
            );
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

        // Handle both EnemyState instances and snapshot objects
        const visualState = this.state.visual || (typeof this.state.getVisualState === 'function' ? this.state.getVisualState() : { color: this.state.color, opacity: 1, visible: true });
        const radius = gameConfig.tileSize * 0.4;

        // Model.x/y is always correctly interpolated by TileCenterMovementStrategy
        // No need to recalculate interpolation in view
        const x = this.state.x;
        const y = this.state.y;

        // Update graphics
        this.drawGhost(x, y);

        // Update eyes if they exist
        const isFrightened = this.state.isFrightened ?? false;
        const isEaten = this.state.isEaten ?? false;

        if (this.eyeLeft) {
            this.eyeLeft.x = x - radius * 0.3;
            this.eyeLeft.y = y - radius * 0.2;
        }
        if (this.eyeRight) {
            this.eyeRight.x = x + radius * 0.3;
            this.eyeRight.y = y - radius * 0.2;
        }
        if (this.pupilLeft) {
            this.pupilLeft.x = x - radius * 0.3;
            this.pupilLeft.y = y - radius * 0.2;
        }
        if (this.pupilRight) {
            this.pupilRight.x = x + radius * 0.3;
            this.pupilRight.y = y - radius * 0.2;
        }

        const visible = visualState.visible ?? true;

        this.graphics.setVisible(visible);
        if (this.eyeLeft) {
            this.eyeLeft.setVisible(visible && !isFrightened && !isEaten);
        }
        if (this.eyeRight) {
            this.eyeRight.setVisible(visible && !isFrightened && !isEaten);
        }
        if (this.pupilLeft) {
            this.pupilLeft.setVisible(visible && !isFrightened && !isEaten);
        }
        if (this.pupilRight) {
            this.pupilRight.setVisible(visible && !isFrightened && !isEaten);
        }
    }

    /**
	 * Update mode animation
	 */
    updateModeAnimation(_newMode, _isFrightened) {
        // Can be used to trigger mode-specific animations
    }

    /**
	 * Clean up resources
	 */
    destroy() {
        this.graphics.clear();
        this.graphics.destroy();
        if (this.eyeLeft) {this.eyeLeft.destroy();}
        if (this.eyeRight) {this.eyeRight.destroy();}
        if (this.pupilLeft) {this.pupilLeft.destroy();}
        if (this.pupilRight) {this.pupilRight.destroy();}
    }
}
