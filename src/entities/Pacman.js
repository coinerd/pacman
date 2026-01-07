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

        this.nextDirection = directions.NONE;

        this.mouthAngle = 0;
        this.mouthDirection = 1;
        this.mouthSpeed = animationConfig.pacmanMouthSpeed;
        this.maxMouthAngle = 30;

        this.isDying = false;
        this.direction = directions.UP;
    }

    makeDecisionAtIntersection(maze) {
        if (this.nextDirection !== directions.NONE && this.canMoveInDirection(this.nextDirection, maze)) {
            this.direction = this.nextDirection;
            this.nextDirection = directions.NONE;
        }

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
        this.nextDirection = directions.NONE;
        this.isDying = false;
        this.mouthAngle = 0;
        this.mouthDirection = 1;

        const rotation = this.direction.angle;
        this.setStartAngle(rotation + this.mouthAngle);
        this.setEndAngle(rotation + 360 - this.mouthAngle);
    }

    setDirection(direction) {
        if (!direction || direction === directions.NONE) {return;}

        if (this.direction !== directions.NONE) {
            if ((direction.x !== 0 && direction.x === -this.direction.x) ||
          (direction.y !== 0 && direction.y === -this.direction.y)) {
                this.direction = direction;
                this.nextDirection = directions.NONE;
                this.isMoving = true;
                return;
            }
        }

        this.nextDirection = direction;
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
