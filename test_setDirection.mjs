import Pacman from './src/entities/Pacman.js';
import { directions, gameConfig } from './src/config/gameConfig.js';
import { isAtTileCenter } from './src/utils/TileMovement.js';

const mockScene = {
  gameState: { level: 1 },
  add: { graphics: () => ({ setDepth: () => ({}) }) },
  tweens: { add: () => {} }
};

const pacman = new Pacman(mockScene, 5, 5);

console.log('Initial state:');
console.log('  gridX:', pacman.gridX, 'gridY:', pacman.gridY);
console.log('  direction:', JSON.stringify(pacman.direction));
console.log('  isMoving:', pacman.isMoving);
console.log('  speed:', pacman.speed);

pacman.gridX = 5;
pacman.gridY = 5;
pacman.direction = directions.RIGHT;

const tileCenterX = pacman.gridX * gameConfig.tileSize + gameConfig.tileSize / 2;
const tileCenterY = pacman.gridY * gameConfig.tileSize + gameConfig.tileSize / 2;

console.log('\nAfter setting gridX=5, gridY=5, direction=RIGHT:');
console.log('  tileCenter:', tileCenterX, tileCenterY);
console.log('  direction:', JSON.stringify(pacman.direction));
console.log('  isMoving:', pacman.isMoving);

pacman.x = tileCenterX - 8;
pacman.y = tileCenterY;

console.log('\nAfter setting x=' + pacman.x + ', y=' + pacman.y + ' (8 pixels left of center):');
console.log('  direction:', JSON.stringify(pacman.direction));
console.log('  isMoving:', pacman.isMoving);
console.log('  isAtCenter:', isAtTileCenter(pacman.x, pacman.y, pacman.gridX, pacman.gridY));

pacman.setDirection(directions.UP);

console.log('\nAfter setDirection(UP):');
console.log('  direction:', JSON.stringify(pacman.direction));
console.log('  nextDirection:', JSON.stringify(pacman.nextDirection));
console.log('  isMoving:', pacman.isMoving);

pacman.setDirection(directions.DOWN);

console.log('\nAfter setDirection(DOWN):');
console.log('  direction:', JSON.stringify(pacman.direction));
console.log('  nextDirection:', JSON.stringify(pacman.nextDirection));
console.log('  isMoving:', pacman.isMoving);

console.log('\nExpected:');
console.log('  direction: RIGHT (x:1, y:0)');
console.log('  nextDirection: DOWN (x:0, y:1)');
console.log('  isMoving: ???');