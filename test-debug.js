import { checkAllGhostCollisions } from './src/utils/CollisionDetection.js';

const mockPacman = {
    x: 2 * 20,
    y: 2 * 20,
    gridX: 2,
    gridY: 2,
    prevGridX: 2,
    prevGridY: 2
};

const mockGhosts = [
    {
        x: 3 * 20,
        y: 2 * 20,
        gridX: 3,
        gridY: 2,
        prevGridX: 3,
        prevGridY: 2,
        prevX: 3 * 20,
        prevY: 2 * 20,
        isFrightened: false,
        isEaten: false,
        eat: () => {},
        name: 'blinky'
    }
];

console.log('Before collision:');
console.log('Pacman:', mockPacman);
console.log('Ghost:', mockGhosts[0]);

mockGhosts[0].x = 2 * 20 + 10;
mockGhosts[0].y = 2 * 20 + 10;
mockGhosts[0].prevX = 2 * 20 + 10;
mockGhosts[0].prevY = 2 * 20 + 10;
mockGhosts[0].gridX = 2;
mockGhosts[0].gridY = 2;
mockGhosts[0].prevGridX = 2;
mockGhosts[0].prevGridY = 2;

console.log('After moving ghost:');
console.log('Pacman:', mockPacman);
console.log('Ghost:', mockGhosts[0]);

const result = checkAllGhostCollisions(mockPacman, mockGhosts);
console.log('Collision result:', result);