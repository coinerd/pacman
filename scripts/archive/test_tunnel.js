import Pacman from './src/entities/Pacman.js';
import { directions, gameConfig } from './src/config/gameConfig.js';
import { handlePortalTraversal } from './src/utils/WarpTunnel.js';

const mockScene = {
    gameState: { level: 1 },
    add: { existing: () => {} }
};

console.log('=== Test 1: Direct handleTunnelWrap ===');
const pacman1 = new Pacman(mockScene, 26, gameConfig.tunnelRow);
pacman1.direction = directions.LEFT;
pacman1.isMoving = true;
pacman1.gridY = gameConfig.tunnelRow;
pacman1.x = -10;

console.log('Before wrap:', {
    x: pacman1.x,
    gridY: pacman1.gridY,
    direction: pacman1.direction,
    directionAngle: pacman1.direction.angle
});

pacman1.handleTunnelWrap();

console.log('After wrap:', {
    x: pacman1.x,
    gridY: pacman1.gridY,
    direction: pacman1.direction,
    directionAngle: pacman1.direction.angle
});
console.log('');

console.log('=== Test 2: Check if handlePortalTraversal changes direction ===');
const pacman2 = new Pacman(mockScene, 26, gameConfig.tunnelRow);
pacman2.direction = directions.LEFT;
pacman2.isMoving = true;
pacman2.gridY = gameConfig.tunnelRow;
pacman2.gridX = -1;
pacman2.x = -10;

console.log('Before portal traversal:', {
    x: pacman2.x,
    gridX: pacman2.gridX,
    direction: pacman2.direction,
    directionAngle: pacman2.direction.angle
});

handlePortalTraversal(pacman2, gameConfig.tileSize);

console.log('After portal traversal:', {
    x: pacman2.x,
    gridX: pacman2.gridX,
    direction: pacman2.direction,
    directionAngle: pacman2.direction.angle
});
console.log('');

console.log('=== Test 3: Full update() call ===');
const pacman3 = new Pacman(mockScene, 1, gameConfig.tunnelRow);
pacman3.setDirection(directions.LEFT);
pacman3.isMoving = true;
pacman3.gridY = gameConfig.tunnelRow;
pacman3.x = -10;
pacman3.gridX = -1;

console.log('Before update:', {
    x: pacman3.x,
    gridX: pacman3.gridX,
    direction: pacman3.direction,
    directionAngle: pacman3.direction.angle
});

const maze = Array(31).fill(null).map(() => Array(28).fill(0));

pacman3.update(100, maze);

console.log('After update:', {
    x: pacman3.x,
    gridX: pacman3.gridX,
    direction: pacman3.direction,
    directionAngle: pacman3.direction.angle
});
