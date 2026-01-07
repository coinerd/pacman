import Phaser from 'phaser';
import { gameConfig, directions } from '../config/gameConfig.js';
import { getCenterPixel } from '../utils/MazeLayout.js';

export class BaseEntity extends Phaser.GameObjects.Arc {
    constructor(scene, gridX, gridY, radius, color) {
        const pixel = getCenterPixel(gridX, gridY);

        super(scene, pixel.x, pixel.y, radius, 0, 360, false, color, 1);

        this.scene = scene;
        this.scene.add.existing(this);
        this.setDepth(100);

        this.gridX = gridX;
        this.gridY = gridY;
        this.prevGridX = gridX;
        this.prevGridY = gridY;
        this.prevX = this.x;
        this.prevY = this.y;
        this.direction = directions.NONE;
        this.speed = 100;
        this.isMoving = false;
        this.radius = radius;
        this.color = color;
    }

    makeDecisionAtIntersection(maze) {
    }

    canMoveInDirection(direction, maze) {
        if (direction === directions.NONE) {return false;}

        const nextGridX = this.gridX + direction.x;
        const nextGridY = this.gridY + direction.y;

        return this.isValidPosition(nextGridX, nextGridY, maze);
    }

    isValidPosition(gridX, gridY, maze) {
        if (gridY < 0 || gridY >= maze.length) {return false;}

        if (gridX < 0 || gridX >= maze[0].length) {
            return true;
        }

        return maze[gridY][gridX] !== 1;
    }

    handleTunnelWrap() {
        const mazeWidth = gameConfig.mazeWidth * gameConfig.tileSize;

        if (this.gridY !== gameConfig.tunnelRow) {
            return;
        }

        if (this.x < 0) {
            this.x = mazeWidth;
        } else if (this.x > mazeWidth) {
            this.x = 0;
        }
    }

    resetPosition(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.prevGridX = gridX;
        this.prevGridY = gridY;
        this.direction = directions.NONE;
        this.isMoving = false;
        const pixel = getCenterPixel(gridX, gridY);
        this.x = pixel.x;
        this.y = pixel.y;
        this.prevX = this.x;
        this.prevY = this.y;
    }

    setSpeed(speed) {
        this.speed = speed;
    }
}
