import Phaser from 'phaser';
import { bossConfig } from '../config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';
import Enemy from './Enemy.js';

export default class BossEntity extends Enemy {
    constructor(scene, x, y, bossType, color) {
        super(scene, x, y, bossType.toUpperCase(), color);

        this.bossType = bossType;
        this.bossConfig = bossConfig.bossTypes[bossType];
        this.maxHealth = this.bossConfig.health;
        this.health = this.maxHealth;
        this.currentPhase = 1;

        this.phaseIndicator = null;
        this.healthBar = null;
        this.healthBarBg = null;
        this.glowBorder = null;
        this.damageFlashTimer = 0;
        this.rotationAngle = 0;

        this.extraEyes = [];
        this.bossPolygon = null;

        this.isGlitching = false;
        this.glitchTimer = 0;
        this.pulseTimer = 0;
        this.isPulsing = false;

        this.setupEventListeners();
        this.createBossVisuals();
    }

    static getSizeMultiplier(bossType) {
        switch (bossType) {
        case 'alpha':
            return 1.5;
        case 'beta':
            return 1.3;
        case 'gamma':
            return 1.4;
        case 'delta':
            return 1.6;
        default:
            return 1.0;
        }
    }

    setupEventListeners() {
        this.phaseChangedListener = gameEvents.on(
            GAME_EVENTS.BOSS_PHASE_CHANGED,
            (data) => {
                if (data.bossType === this.bossType) {
                    this.updatePhase(data.phase);
                }
            },
            this
        );

        this.damagedListener = gameEvents.on(
            GAME_EVENTS.BOSS_DAMAGED,
            (data) => {
                if (data.bossType === this.bossType) {
                    this.onDamage();
                }
            },
            this
        );
    }

    createBossVisuals() {
        this.createHealthBar();
        this.createPhaseIndicator();
        this.createBossShape();
        this.createBossSpecificVisuals();
    }

    createHealthBar() {
        const barWidth = 60;
        const barHeight = 6;
        const yOffset = -this.radius - 15;

        this.healthBarBg = new Phaser.GameObjects.Rectangle(
            this.scene,
            this.x,
            this.y + yOffset,
            barWidth,
            barHeight,
            0x000000
        );
        this.healthBarBg.setStrokeStyle(1, 0xffffff);
        this.healthBarBg.setDepth(150);
        this.scene.add.existing(this.healthBarBg);

        this.healthBar = new Phaser.GameObjects.Rectangle(
            this.scene,
            this.x - barWidth / 2,
            this.y + yOffset,
            barWidth,
            barHeight,
            0x00ff00
        );
        this.healthBar.setOrigin(0, 0.5);
        this.healthBar.setDepth(151);
        this.scene.add.existing(this.healthBar);
    }

    createPhaseIndicator() {
        const yOffset = -this.radius - 25;

        this.phaseIndicator = new Phaser.GameObjects.Text(
            this.scene,
            this.x,
            this.y + yOffset,
            'P1',
            {
                fontSize: '12px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        this.phaseIndicator.setOrigin(0.5);
        this.phaseIndicator.setDepth(152);
        this.scene.add.existing(this.phaseIndicator);

        this.updatePhaseIndicator();
    }

    createBossShape() {
        if (this.arc) {
            this.arc.destroy();
        }

        const points = this.getBossShapePoints();
        this.bossPolygon = new Phaser.GameObjects.Polygon(
            this.scene,
            this.x,
            this.y,
            points,
            this.color
        );
        this.bossPolygon.setDepth(100);
        this.scene.add.existing(this.bossPolygon);
    }

    getBossShapePoints() {
        const points = [];
        const radius = this.radius;
        let i;
        let outerRadius;
        let innerRadius;
        let r;
        let angle;

        switch (this.bossType) {
        case 'alpha':
            for (i = 0; i < 4; i++) {
                angle = (i * 90 + 45) * (Math.PI / 180);
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
            break;

        case 'beta':
            for (i = 0; i < 3; i++) {
                angle = (i * 120 - 90) * (Math.PI / 180);
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
            break;

        case 'gamma':
            outerRadius = radius;
            innerRadius = radius * 0.4;
            for (i = 0; i < 10; i++) {
                r = i % 2 === 0 ? outerRadius : innerRadius;
                angle = (i * 36 - 90) * (Math.PI / 180);
                points.push({
                    x: r * Math.cos(angle),
                    y: r * Math.sin(angle)
                });
            }
            break;

        case 'delta':
            for (i = 0; i < 6; i++) {
                angle = (i * 60 - 90) * (Math.PI / 180);
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
            break;

        default:
            for (i = 0; i < 32; i++) {
                angle = ((i * 360) / 32) * (Math.PI / 180);
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
        }

        return points;
    }

    createBossSpecificVisuals() {
        switch (this.bossType) {
        case 'alpha':
            this.updateAlphaVisuals();
            break;
        case 'beta':
            this.updateBetaVisuals();
            break;
        case 'gamma':
            this.updateGammaVisuals();
            break;
        case 'delta':
            this.createDeltaVisuals();
            break;
        }
    }

    updateAlphaVisuals() {
        if (this.currentPhase >= 2 && !this.glowBorder) {
            this.glowBorder = new Phaser.GameObjects.Graphics(this.scene);
            this.glowBorder.setDepth(99);
            this.scene.add.existing(this.glowBorder);
        }

        if (this.currentPhase === 1 && this.glowBorder) {
            this.glowBorder.destroy();
            this.glowBorder = null;
        }
    }

    updateBetaVisuals() {}

    updateGammaVisuals() {
        if (this.currentPhase >= 2) {
            this.isGlitching = true;
        } else {
            this.isGlitching = false;
        }
    }

    createDeltaVisuals() {
        const eyeRadius = this.radius * 0.2;
        const eyeOffsetX = this.radius * 0.25;
        const eyeOffsetY = -this.radius * 0.1;

        const eyeLeft = new Phaser.GameObjects.Arc(
            this.scene,
            this.x - eyeOffsetX,
            this.y + eyeOffsetY,
            eyeRadius,
            0,
            360,
            false,
            0xffffff,
            1
        );
        eyeLeft.setDepth(101);
        this.scene.add.existing(eyeLeft);
        this.extraEyes.push(eyeLeft);

        const eyeRight = new Phaser.GameObjects.Arc(
            this.scene,
            this.x + eyeOffsetX,
            this.y + eyeOffsetY,
            eyeRadius,
            0,
            360,
            false,
            0xffffff,
            1
        );
        eyeRight.setDepth(101);
        this.scene.add.existing(eyeRight);
        this.extraEyes.push(eyeRight);

        const pupilRadius = eyeRadius * 0.4;

        const pupilLeft = new Phaser.GameObjects.Arc(
            this.scene,
            this.x - eyeOffsetX,
            this.y + eyeOffsetY,
            pupilRadius,
            0,
            360,
            false,
            0x0000ff,
            1
        );
        pupilLeft.setDepth(102);
        this.scene.add.existing(pupilLeft);
        this.extraEyes.push(pupilLeft);

        const pupilRight = new Phaser.GameObjects.Arc(
            this.scene,
            this.x + eyeOffsetX,
            this.y + eyeOffsetY,
            pupilRadius,
            0,
            360,
            false,
            0x0000ff,
            1
        );
        pupilRight.setDepth(102);
        this.scene.add.existing(pupilRight);
        this.extraEyes.push(pupilRight);

        this.updateDeltaVisuals();
    }

    updateDeltaVisuals() {
        if (this.currentPhase >= 2) {
            this.isPulsing = true;
        } else {
            this.isPulsing = false;
        }
    }

    takeDamage(amount) {
        if (this.health <= 0) {
            return;
        }

        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }

        this.updateHealthBar();
    }

    onDamage() {
        this.damageFlashTimer = 0.1;
    }

    updatePhase(phase) {
        this.currentPhase = phase;
        this.updatePhaseIndicator();
        this.updateBossVisualsForPhase();
    }

    updatePhaseIndicator() {
        if (this.phaseIndicator) {
            this.phaseIndicator.setText(`P${this.currentPhase}`);
        }
    }

    updateHealthBar() {
        if (!this.healthBar) {
            return;
        }

        const barWidth = 60;
        const healthPercentage = this.health / this.maxHealth;
        this.healthBar.width = barWidth * healthPercentage;

        let barColor;
        if (healthPercentage > 0.5) {
            barColor = 0x00ff00;
        } else if (healthPercentage > 0.25) {
            barColor = 0xffff00;
        } else {
            barColor = 0xff0000;
        }

        this.healthBar.setFillStyle(barColor, 1);
    }

    updateBossVisualsForPhase() {
        switch (this.bossType) {
        case 'alpha':
            this.updateAlphaVisuals();
            break;
        case 'beta':
            this.updateBetaVisuals();
            break;
        case 'gamma':
            this.updateGammaVisuals();
            break;
        case 'delta':
            this.updateDeltaVisuals();
            break;
        }
    }

    updateVisuals() {
        if (this.bossPolygon) {
            this.bossPolygon.x = this.x;
            this.bossPolygon.y = this.y;

            if (this.damageFlashTimer > 0) {
                this.bossPolygon.setFillStyle(0xffffff, 1);
            } else {
                const color = this.getBossColor();
                this.bossPolygon.setFillStyle(color, 1);
            }

            if (this.bossType === 'beta' && this.currentPhase >= 2) {
                this.bossPolygon.rotation = this.rotationAngle;
            }
        }

        if (this.healthBar && this.healthBarBg) {
            const yOffset = -this.radius - 15;
            this.healthBarBg.x = this.x;
            this.healthBarBg.y = this.y + yOffset;
            this.healthBar.x = this.x - 30;
            this.healthBar.y = this.y + yOffset;
        }

        if (this.phaseIndicator) {
            const yOffset = -this.radius - 25;
            this.phaseIndicator.x = this.x;
            this.phaseIndicator.y = this.y + yOffset;
        }

        if (this.bossType === 'delta' && this.extraEyes.length > 0) {
            const eyeOffsetX = this.radius * 0.25;
            const eyeOffsetY = -this.radius * 0.1;
            const lookDistance = this.radius * 0.08;

            let pupilOffsetX = 0;
            let pupilOffsetY = 0;

            const angle = this.direction.angle;
            if (angle === 0) {
                pupilOffsetX = lookDistance;
            } else if (angle === 180) {
                pupilOffsetX = -lookDistance;
            } else if (angle === 270) {
                pupilOffsetY = -lookDistance;
            } else if (angle === 90) {
                pupilOffsetY = lookDistance;
            }

            this.extraEyes[0].x = this.x - eyeOffsetX;
            this.extraEyes[0].y = this.y + eyeOffsetY;
            this.extraEyes[2].x = this.x - eyeOffsetX + pupilOffsetX;
            this.extraEyes[2].y = this.y + eyeOffsetY + pupilOffsetY;

            this.extraEyes[1].x = this.x + eyeOffsetX;
            this.extraEyes[1].y = this.y + eyeOffsetY;
            this.extraEyes[3].x = this.x + eyeOffsetX + pupilOffsetX;
            this.extraEyes[3].y = this.y + eyeOffsetY + pupilOffsetY;

            if (this.isPulsing) {
                const pulseScale = 1 + Math.sin(this.pulseTimer * 5) * 0.1;
                this.extraEyes.forEach((eye) => {
                    eye.setScale(pulseScale);
                });
            }
        }

        if (
            this.bossType === 'alpha' &&
			this.currentPhase >= 2 &&
			this.glowBorder
        ) {
            this.glowBorder.clear();
            this.glowBorder.lineStyle(2, 0x9b59b6, 0.8);
            this.glowBorder.strokeCircle(this.x, this.y, this.radius + 5);
        }

        super.updateVisuals();
    }

    update(deltaSeconds, maze, pacman) {
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaSeconds;
        }

        this.rotationAngle += deltaSeconds * 2;
        this.pulseTimer += deltaSeconds;

        this.applyBossPhaseBehavior(deltaSeconds);

        if (this.isGlitching) {
            this.glitchTimer += deltaSeconds;
            if (this.glitchTimer > 0.1) {
                this.glitchTimer = 0;
                if (this.bossPolygon && Math.random() > 0.7) {
                    const jitter = 3;
                    this.bossPolygon.x += (Math.random() - 0.5) * jitter;
                    this.bossPolygon.y += (Math.random() - 0.5) * jitter;
                }
            }
        }

        super.update(deltaSeconds, maze, pacman);

        if (this.bossPolygon) {
            this.bossPolygon.x = this.x;
            this.bossPolygon.y = this.y;
        }
    }

    applyBossPhaseBehavior(_deltaSeconds) {
        switch (this.bossType) {
        case 'alpha':
            if (this.currentPhase === 2) {
                this.speedMultiplier = 1.5;
            } else {
                this.speedMultiplier = 1.0;
            }
            break;

        case 'beta':
            if (this.currentPhase === 2) {
                this.speedMultiplier = 1.2;
            } else if (this.currentPhase === 3) {
                this.speedMultiplier = 1.0;
            } else {
                this.speedMultiplier = 1.0;
            }
            break;

        case 'gamma':
            break;

        case 'delta':
            if (this.currentPhase === 1) {
                this.speedMultiplier = 0.8;
            } else {
                this.speedMultiplier = 1.0;
            }
            break;
        }
    }

    getBossColor() {
        return this.color;
    }

    getBossShape() {
        return this.bossType;
    }

    destroy() {
        if (this.phaseChangedListener) {
            this.phaseChangedListener();
        }
        if (this.damagedListener) {
            this.damagedListener();
        }

        if (this.bossPolygon) {
            this.bossPolygon.destroy();
        }
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
        }
        if (this.phaseIndicator) {
            this.phaseIndicator.destroy();
        }
        if (this.glowBorder) {
            this.glowBorder.destroy();
        }

        this.extraEyes.forEach((eye) => {
            eye.destroy();
        });
        this.extraEyes = [];

        super.destroy();
    }
}
