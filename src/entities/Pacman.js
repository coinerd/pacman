import { BaseEntity } from './BaseEntity.js';
import { gameConfig, colors, directions, animationConfig, levelConfig } from '../config/gameConfig.js';
import { handlePortalTraversal } from '../utils/WarpTunnel.js';
import { performGridMovementStep, isAtTileCenter } from '../utils/TileMovement.js';

export default class Pacman extends BaseEntity {
    constructor(scene, gridX, gridY) {
        const radius = gameConfig.tileSize * 0.4;
        super(scene, gridX, gridY, radius, colors.pacman);

        const baseLevelSpeed = levelConfig.baseSpeed + (scene.gameState.level - 1) * levelConfig.speedIncreasePerLevel;
        this.speed = baseLevelSpeed * levelConfig.pacmanSpeedMultiplier;
        this.baseSpeed = this.speed;

        this.prevX = this.x;
        this.prevY = this.y;
        this.prevGridX = gridX;
        this.prevGridY = gridY;

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

        if (!this.canMoveInDirection(this.direction, maze)) {
            this.isMoving = false;
            this.direction = directions.NONE;
        } else {
            this.isMoving = true;
        }

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

        const currentGridX = Math.floor(this.x / gameConfig.tileSize);
        const currentGridY = Math.floor(this.y / gameConfig.tileSize);
        const isAtCenter = isAtTileCenter(this.x, this.y, currentGridX, currentGridY);

        if (isAtCenter) {
            this.gridX = currentGridX;
            this.gridY = currentGridY;
            this.makeDecisionAtIntersection(maze);
        }

        this.prevX = this.x;
        this.prevY = this.y;

        performGridMovementStep(this, maze, delta);

        this.handleTunnelWrap();
        handlePortalTraversal(this, gameConfig.tileSize);

        const rotation = this.direction.angle;
        this.setStartAngle(rotation + this.mouthAngle);
        this.setEndAngle(rotation + 360 - this.mouthAngle);
    }

    updateMouthAnimation(delta) {
        this.mouthAngle += this.mouthDirection * this.mouthSpeed * (delta / 2);

        if (this.mouthAngle >= this.maxMouthAngle) {
            this.mouthAngle = this.maxMouthAngle;
            this.mouthDirection = -1;
        } else if (this.mouthAngle <= 0) {
            this.mouthAngle = 0;
            this.mouthDirection = 1;
        }
    }

    updateDeathAnimation(delta) {
        this.mouthAngle += animationConfig.pacmanDeathSpeed * (delta / 2);
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
        this.prevGridX = gridX;
        this.prevGridY = gridY;
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
