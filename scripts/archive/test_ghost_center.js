import Phaser from 'phaser';
const { tileCenter } from './src/utils/TileMath.js';
const { distanceToTileCenter, EPS } from './src/utils/TileMath.js';

const center = tileCenter(5, 5);
console.log('Center:', center);

const ghost = {
    x: center.x,
    y: center.y,
    gridX: 5,
    gridY: 5,
    direction: { x: 1, y: 0 },
    isMoving: true
};

const distToCenter = distanceToTileCenter(ghost.x, ghost.y, 5, 5);
console.log('Initial distToCenter:', distToCenter);
console.log('distToCenter < EPS * 0.5:', distToCenter < EPS * 0.5);
console.log('distToCenter <= EPS:', distToCenter <= EPS);
