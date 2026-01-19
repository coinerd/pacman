import { BaseEntity } from './BaseEntity.js';
import { gameConfig, colors, directions, animationConfig, levelConfig } from '../config/gameConfig.js';
import { performGridMovementStep, isAtTileCenter } from '../utils/TileMovement.js';

export default class Pacman extends BaseEntity {
    constructor(scene, gridX, gridY) {
        const radius = gameConfig.tileSize * 0.4;
        super(scene, gridX, gridY, radius, colors.pacman);

        const baseLevelSpeed = levelConfig.baseSpeed + (scene.gameState.level - 1) * levelConfig.speedIncreasePerLevel;
        this.speed = baseLevelSpeed * levelConfig.pacmanSpeedMultiplier;
        this.baseSpeed = this.speed;

        this.mouthAngle = 0;
        this.mouthDirection = 1;
        this.mouthSpeed = animationConfig.pacmanMouthSpeed;
        this.maxMouthAngle = 30;

        this.isDying = false;
    }

    makeDecisionAtIntersection(maze) {
        if (this.direction === directions.NONE) {
            this.isMoving = false;
            const rotation = this.direction.angle;
            this.setStartAngle(rotation + this.mouthAngle);
            this.setEndAngle(rotation + 360 - this.mouthAngle);
            return;
        }

        this.directionBuffer.applyIfCanMove((dir) => {
            return this.canMoveInDirection(dir, maze);
        });
        this.isMoving = this.direction !== directions.NONE;

        const rotation = this.direction.angle;
        this.setStartAngle(rotation + this.mouthAngle);
        this.setEndAngle(rotation + 360 - this.mouthAngle);
    }

    update(delta, maze) {
        if (this.isDying) {
            this.updateDeathAnimation(delta);
            return;
        }

        this.updateMouthAnimation(delta);

        const isAtCenter = isAtTileCenter(this.x, this.y, this.gridX, this.gridY);

        if (isAtCenter) {
            this.makeDecisionAtIntersection(maze);
        }

        this.prevX = this.x;
        this.prevY = this.y;

        performGridMovementStep(this, maze, delta);

        this.handleTunnelWrap();

        const rotation = this.direction.angle;
        this.setStartAngle(rotation + this.mouthAngle);
        this.setEndAngle(rotation + 360 - this.mouthAngle);
    }

    updateMouthAnimation(delta) {
        const deltaSeconds = delta / 1000;
        this.mouthAngle += this.mouthDirection * this.mouthSpeed * (deltaSeconds / 2);

        if (this.mouthAngle >= this.maxMouthAngle) {
            this.mouthAngle = this.maxMouthAngle;
            this.mouthDirection = -1;
        } else if (this.mouthAngle <= 0) {
            this.mouthAngle = 0;
            this.mouthDirection = 1;
        }
    }

    updateDeathAnimation(delta) {
        const deltaSeconds = delta / 1000;
        this.mouthAngle += animationConfig.pacmanDeathSpeed * (deltaSeconds / 2);
        if (this.mouthAngle > 180) {
            this.mouthAngle = 180;
        }
    }

    die() {
        this.isDying = true;
        this.isMoving = false;
        this.mouthDirection = 1;
        this.mouthAngle = 0;
    }

    resetPosition(gridX, gridY) {
        super.resetPosition(gridX, gridY);
        this.isDying = false;
        this.mouthAngle = 0;
        this.mouthDirection = 1;

        const rotation = this.direction.angle;
        this.setStartAngle(rotation + this.mouthAngle);
        this.setEndAngle(rotation + 360 - this.mouthAngle);
    }

    setDirection(direction) {
        this.directionBuffer.queue(direction);
        this.isMoving = direction !== directions.NONE;
    }

    setSpeedMultiplier(multiplier) {
        this.speed = this.baseSpeed * multiplier;
    }

    getGridPosition() {
        return { x: this.gridX, y: this.gridY };
    }

    getPixelPosition() {
        return { x: this.x, y: this.y };
    }
}
