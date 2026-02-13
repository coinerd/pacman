import { directions, gameConfig } from './src/config/gameConfig.js';
import Enemy from './src/entities/Enemy.js';
import Pacman from './src/entities/Pacman.js';
import { TILE_TYPES } from './src/utils/MazeLayout.js';
import { msToSeconds } from './src/utils/Time.js';

const mockScene = {
    gameState: { level: 1 },
    add: { existing: () => {} }
};

const createTestMaze = () => {
    const maze = [];
    for (let y = 0; y < 7; y++) {
        const row = [];
        for (let x = 0; x < 7; x++) {
            if (x === 0 || x === 6 || y === 0 || y === 6) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
};

const mockMaze = createTestMaze();
const mockPlayer = { x: 100, y: 100, gridX: 5, gridY: 5 };

console.log('Testing Pacman:');
const pacman = new Pacman(mockScene, 2, 3);
const pacmanInitialX = pacman.x;
console.log('  tileSize:', gameConfig.tileSize);
console.log('  initialX:', pacmanInitialX);
console.log('  initialY:', pacman.y);
console.log('  gridX:', pacman.gridX);
console.log('  gridY:', pacman.gridY);
console.log('  radius:', pacman.radius);
console.log('  speed:', pacman.speed);

pacman.setDirection(directions.LEFT);
pacman.update(msToSeconds(1000), mockMaze);
console.log('  finalX:', pacman.x);
console.log('  moved:', pacmanInitialX - pacman.x);
console.log('  Expectation: finalX >', gameConfig.tileSize, 'Result:', pacman.x > gameConfig.tileSize ? 'PASS' : 'FAIL');

console.log('\nTesting Enemy:');
const enemy = new Enemy(mockScene, 2, 3, 'blinky', 0xff0000);
const enemyInitialX = enemy.x;
console.log('  initialX:', enemyInitialX);
console.log('  initialY:', enemy.y);
console.log('  gridX:', enemy.gridX);
console.log('  gridY:', enemy.gridY);
console.log('  radius:', enemy.radius);
console.log('  speed:', enemy.speed);

enemy.setDirection(directions.LEFT);
enemy.update(msToSeconds(1000), mockMaze, mockPlayer);
console.log('  finalX:', enemy.x);
console.log('  moved:', enemyInitialX - enemy.x);
console.log('  Expectation: finalX >', gameConfig.tileSize, 'Result:', enemy.x > gameConfig.tileSize ? 'PASS' : 'FAIL');
