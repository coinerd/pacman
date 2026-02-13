/**
 * VisualEnemy
 * Phaser visual representation of Enemy model entity.
 * Syncs Phaser sprite to EnemyState.
 */

import Phaser from 'phaser';
import { enemyColors, gameConfig } from '../../config/gameConfig.js';

export class VisualEnemy {
    /**
	 * @param {Phaser.Scene} scene - Phaser scene
	 * @param {EnemyState} enemyState - Enemy model state
	 */
    constructor(scene, enemyState) {
        this.scene = scene;
        this.state = enemyState;

        const radius = gameConfig.tileSize * 0.4;
        const color = enemyColors[enemyState.ghostType.toUpperCase()] || 0xffffff;

        // Create geometric shape based on enemy type
        const shape = this.createShape(enemyState.ghostType, radius, color);

        this.sprite = new Phaser.GameObjects.Polygon(
            scene,
            enemyState.x,
            enemyState.y,
            shape.points,
            shape.color
        );

        this.sprite.setDepth(100);
        scene.add.existing(this.sprite);

        // Create eyes
        this.eyeLeft = this.createEye(
            scene,
            -radius * 0.3,
            -radius * 0.2,
            radius * 0.25
        );
        this.eyeRight = this.createEye(
            scene,
            radius * 0.3,
            -radius * 0.2,
            radius * 0.25
        );

        // Pupils
        this.pupilLeft = this.createPupil(
            scene,
            -radius * 0.3,
            -radius * 0.2,
            radius * 0.12
        );
        this.pupilRight = this.createPupil(
            scene,
            radius * 0.3,
            -radius * 0.2,
            radius * 0.12
        );

        this.currentRadius = radius;
        this.currentColor = color;
    }

    /**
	 * Create geometric shape based on enemy type
	 */
    createShape(ghostType, radius, color) {
        const points = [];
        const ghostTypeUpper = ghostType.toUpperCase();

        if (ghostTypeUpper === 'ALPHA') {
            // Alpha: DIAMOND (rotated square)
            for (let i = 0; i < 4; i++) {
                const angle = (i * 90 + 45) * (Math.PI / 180);
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
        } else if (ghostTypeUpper === 'BETA') {
            // Beta: TRIANGLE (3 equal sides)
            for (let i = 0; i < 3; i++) {
                const angle = (i * 120 - 90) * (Math.PI / 180);
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
        } else if (ghostTypeUpper === 'GAMMA') {
            // Gamma: STAR (5-pointed)
            const outerRadius = radius;
            const innerRadius = radius * 0.4;
            for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * 36 - 90) * (Math.PI / 180);
                points.push({
                    x: r * Math.cos(angle),
                    y: r * Math.sin(angle)
                });
            }
        } else if (ghostTypeUpper === 'DELTA') {
            // Delta: HEXAGON (6-sided)
            for (let i = 0; i < 6; i++) {
                const angle = (i * 60 - 90) * (Math.PI / 180);
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
        } else {
            // Default: Circle
            for (let i = 0; i < 32; i++) {
                const angle = ((i * 360) / 32) * (Math.PI / 180);
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
        }

        return { points, color };
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
            0xffffff,
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
            0x0000ff,
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

        this.sprite.x = this.state.x;
        this.sprite.y = this.state.y;

        this.sprite.setFillStyle(visualState.color, visualState.opacity);

        this.updateEyes(radius);

        const visible = visualState.visible && this.state.visualState.visible;
        this.sprite.setVisible(visible);
        this.eyeLeft.setVisible(visible && !this.state.isFrightened);
        this.eyeRight.setVisible(visible && !this.state.isFrightened);
        this.pupilLeft.setVisible(visible && !this.state.isFrightened);
        this.pupilRight.setVisible(visible && !this.state.isFrightened);
    }

    /**
	 * Update eye positions based on direction
	 */
    updateEyes(radius) {
        const eyeOffsetX = radius * 0.3;
        const eyeOffsetY = -radius * 0.2;
        const baseX = this.state.x;
        const baseY = this.state.y;

        this.eyeLeft.x = baseX - eyeOffsetX;
        this.eyeLeft.y = baseY + eyeOffsetY;
        this.eyeRight.x = baseX + eyeOffsetX;
        this.eyeRight.y = baseY + eyeOffsetY;

        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        const lookDistance = radius * 0.08;

        const angle = this.state.direction.angle;
        if (angle === 0) {
            pupilOffsetX = lookDistance;
        } else if (angle === 180) {
            pupilOffsetX = -lookDistance;
        } else if (angle === 270) {
            pupilOffsetY = -lookDistance;
        } else if (angle === 90) {
            pupilOffsetY = lookDistance;
        }

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
        this.eyeLeft.destroy();
        this.eyeRight.destroy();
        this.pupilLeft.destroy();
        this.pupilRight.destroy();
    }
}
