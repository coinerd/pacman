/**
 * VisualGhost
 * Phaser visual representation of Ghost model entity.
 * Syncs Phaser sprite to GhostState.
 */

import Phaser from 'phaser';
import { gameConfig, ghostColors } from '../../config/gameConfig.js';

export class VisualGhost {
    /**
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {GhostState} ghostState - Ghost model state
     */
    constructor(scene, ghostState) {
        this.scene = scene;
        this.state = ghostState;

        const radius = gameConfig.tileSize * 0.4;
        const color = ghostColors[ghostState.ghostType.toUpperCase()] || 0xFFFFFF;

        // Create main ghost body (circle top + rectangle bottom)
        this.sprite = new Phaser.GameObjects.Arc(
            scene,
            ghostState.x,
            ghostState.y - radius * 0.3,
            radius,
            180,
            360,
            false,
            color,
            1
        );

        this.sprite.setDepth(100);
        scene.add.existing(this.sprite);

        // Create wavy bottom using graphics
        this.bodyGraphics = scene.add.graphics();
        this.bodyGraphics.setDepth(100);

        // Create eyes
        this.eyeLeft = this.createEye(scene, -radius * 0.3, -radius * 0.2, radius * 0.25);
        this.eyeRight = this.createEye(scene, radius * 0.3, -radius * 0.2, radius * 0.25);

        // Pupils
        this.pupilLeft = this.createPupil(scene, -radius * 0.3, -radius * 0.2, radius * 0.12);
        this.pupilRight = this.createPupil(scene, radius * 0.3, -radius * 0.2, radius * 0.12);
    }

    /**
     * Create an eye
     */
    createEye(scene, offsetX, offsetY, radius) {
        const eye = new Phaser.GameObjects.Arc(
            scene,
            this.state.x + offsetX,
            this.state.y + offsetY,
            radius,
            0,
            360,
            false,
            0xFFFFFF,
            1
        );
        eye.setDepth(101);
        scene.add.existing(eye);
        return eye;
    }

    /**
     * Create a pupil
     */
    createPupil(scene, offsetX, offsetY, radius) {
        const pupil = new Phaser.GameObjects.Arc(
            scene,
            this.state.x + offsetX,
            this.state.y + offsetY,
            radius,
            0,
            360,
            false,
            0x0000FF,
            1
        );
        pupil.setDepth(102);
        scene.add.existing(pupil);
        return pupil;
    }

    /**
     * Sync visual to model state
     */
    sync() {
        const visualState = this.state.getVisualState();
        const radius = gameConfig.tileSize * 0.4;

        // Update main sprite position (offset for wavy bottom)
        this.sprite.x = this.state.x;
        this.sprite.y = this.state.y - radius * 0.3;

        // Update color
        this.sprite.setFillStyle(visualState.color, visualState.opacity);

        // Redraw wavy bottom
        this.drawWavyBottom(radius, visualState.color, visualState.opacity);

        // Update eyes
        this.updateEyes(radius);

        // Handle visibility
        const visible = visualState.visible && this.state.visualState.visible;
        this.sprite.setVisible(visible);
        this.bodyGraphics.setVisible(visible);
        this.eyeLeft.setVisible(visible && !this.state.isFrightened);
        this.eyeRight.setVisible(visible && !this.state.isFrightened);
        this.pupilLeft.setVisible(visible && !this.state.isFrightened);
        this.pupilRight.setVisible(visible && !this.state.isFrightened);
    }

    /**
     * Draw the wavy bottom of the ghost
     */
    drawWavyBottom(radius, color, alpha) {
        this.bodyGraphics.clear();

        if (!this.state.visualState.visible) {
            return;
        }

        this.bodyGraphics.fillStyle(color, alpha);

        const x = this.state.x;
        const y = this.state.y - radius * 0.3;
        const waveHeight = radius * 0.3;
        const waveCount = 3;

        this.bodyGraphics.beginPath();
        this.bodyGraphics.moveTo(x - radius, y);

        // Draw wavy bottom
        for (let i = 0; i <= waveCount; i++) {
            const waveX = x - radius + (radius * 2 * i / waveCount);
            const nextWaveX = x - radius + (radius * 2 * (i + 1) / waveCount);
            const midX = (waveX + nextWaveX) / 2;

            if (i % 2 === 0) {
                this.bodyGraphics.lineTo(midX, y + waveHeight);
            } else {
                this.bodyGraphics.lineTo(midX, y);
            }
        }

        this.bodyGraphics.lineTo(x + radius, y);
        this.bodyGraphics.lineTo(x + radius, y - radius * 0.7);
        this.bodyGraphics.lineTo(x - radius, y - radius * 0.7);
        this.bodyGraphics.closePath();
        this.bodyGraphics.fillPath();
    }

    /**
     * Update eye positions based on direction
     */
    updateEyes(radius) {
        const eyeOffsetX = radius * 0.3;
        const eyeOffsetY = -radius * 0.2;
        const baseX = this.state.x;
        const baseY = this.state.y;

        // Position eyes
        this.eyeLeft.x = baseX - eyeOffsetX;
        this.eyeLeft.y = baseY + eyeOffsetY;
        this.eyeRight.x = baseX + eyeOffsetX;
        this.eyeRight.y = baseY + eyeOffsetY;

        // Calculate pupil offset based on direction
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        const lookDistance = radius * 0.08;

        const angle = this.state.direction.angle;
        if (angle === 0) { // RIGHT
            pupilOffsetX = lookDistance;
        } else if (angle === 180) { // LEFT
            pupilOffsetX = -lookDistance;
        } else if (angle === 270) { // UP
            pupilOffsetY = -lookDistance;
        } else if (angle === 90) { // DOWN
            pupilOffsetY = lookDistance;
        }

        // Position pupils
        this.pupilLeft.x = baseX - eyeOffsetX + pupilOffsetX;
        this.pupilLeft.y = baseY + eyeOffsetY + pupilOffsetY;
        this.pupilRight.x = baseX + eyeOffsetX + pupilOffsetX;
        this.pupilRight.y = baseY + eyeOffsetY + pupilOffsetY;
    }

    /**
     * Destroy visual elements
     */
    destroy() {
        this.sprite.destroy();
        this.bodyGraphics.destroy();
        this.eyeLeft.destroy();
        this.eyeRight.destroy();
        this.pupilLeft.destroy();
        this.pupilRight.destroy();
    }
}
