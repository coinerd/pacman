import { checkGhostCollision } from './src/utils/CollisionDetection.js';

const mockPacman = {
    x: 2 * 16,
    y: 2 * 16,
    gridX: 2,
    gridY: 2,
    prevGridX: 2,
    prevGridY: 2
};

const mockGhost = {
    x: 2 * 16 + 5,
    y: 2 * 16 + 5,
    gridX: 2,
    gridY: 2,
    prevGridX: 2,
    prevGridY: 2,
    prevX: 3 * 16,
    prevY: 2 * 16,
    isFrightened: false,
    isEaten: false,
    name: 'blinky'
};

console.log('Testing collision detection:');
console.log('Pacman:', mockPacman);
console.log('Ghost:', mockGhost);

const result = checkGhostCollision(mockPacman, mockGhost);
console.log('Collision result:', result);