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
    this.direction = directions.NONE;
    this.speed = 100;
    this.isMoving = false;
    this.radius = radius;
    this.color = color;
  }

  updateMovement(delta, maze) {
    const moveStep = this.speed * (delta / 1000);

    if (this.isMoving && this.direction !== directions.NONE) {
      this.x += this.direction.x * moveStep;
      this.y += this.direction.y * moveStep;
      this.handleTunnelWrap();
    }

    const gridPos = { x: Math.floor(this.x / gameConfig.tileSize), y: Math.floor(this.y / gameConfig.tileSize) };
    const centerPixel = getCenterPixel(gridPos.x, gridPos.y);
    const distToCenter = Math.sqrt(Math.pow(this.x - centerPixel.x, 2) + Math.pow(this.y - centerPixel.y, 2));

    if (distToCenter < Math.max(moveStep, 1)) {
      this.gridX = gridPos.x;
      this.gridY = gridPos.y;
      this.makeDecisionAtIntersection(maze);
    }
  }

  makeDecisionAtIntersection(maze) {
  }

  canMoveInDirection(direction, maze) {
    if (direction === directions.NONE) return false;

    const nextGridX = this.gridX + direction.x;
    const nextGridY = this.gridY + direction.y;

    return this.isValidPosition(nextGridX, nextGridY, maze);
  }

  isValidPosition(gridX, gridY, maze) {
    if (gridY < 0 || gridY >= maze.length) return false;

    if (gridX < 0 || gridX >= maze[0].length) {
      return true;
    }

    return maze[gridY][gridX] !== 1;
  }

  handleTunnelWrap() {
    const mazeWidth = gameConfig.mazeWidth * gameConfig.tileSize;

    if (this.x < -gameConfig.tileSize) {
      this.x = mazeWidth + gameConfig.tileSize;
    } else if (this.x > mazeWidth + gameConfig.tileSize) {
      this.x = -gameConfig.tileSize;
    }
  }

  resetPosition(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.direction = directions.NONE;
    this.isMoving = false;
    const pixel = getCenterPixel(gridX, gridY);
    this.x = pixel.x;
    this.y = pixel.y;
  }

  setSpeed(speed) {
    this.speed = speed;
  }
}
