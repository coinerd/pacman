import Pacman from './src/entities/Pacman.js';
import { directions, gameConfig } from './src/config/gameConfig.js';
import { TILE_TYPES } from './src/utils/MazeLayout.js';

const mockScene = {
    gameState: { level: 1 },
    add: { existing: () => {} }
};

function createTunnelTestMaze() {
    const maze = [];
    for (let y = 0; y < 31; y++) {
        const row = [];
        for (let x = 0; x < 28; x++) {
            if (y === 0 || y === 30) {
                row.push(TILE_TYPES.WALL);
            } else if (y === gameConfig.tunnelRow && (x === 0 || x === 27)) {
                row.push(TILE_TYPES.PATH);
            } else if (y === gameConfig.tunnelRow && x >= 1 && x <= 26) {
                row.push(TILE_TYPES.PATH);
            } else if (x === 0 || x === 27) {
                row.push(TILE_TYPES.WALL);
            } else {
                row.push(TILE_TYPES.PATH);
            }
        }
        maze.push(row);
    }
    return maze;
}

const mockMaze = createTunnelTestMaze();
const TUNNEL_ROW = gameConfig.tunnelRow;

console.log('=== Test: Pacman enters right tunnel entrance ===');
const pacman = new Pacman(mockScene, 26, TUNNEL_ROW);
pacman.setDirection(directions.RIGHT);
pacman.isMoving = true;

console.log('Before update:', {
    x: pacman.x,
    gridX: pacman.gridX,
    gridY: pacman.gridY,
    direction: pacman.direction,
    prevX: pacman.prevX
});

pacman.update(100, mockMaze);

console.log('After update:', {
    x: pacman.x,
    gridX: pacman.gridX,
    gridY: pacman.gridY,
    direction: pacman.direction,
    prevX: pacman.prevX
});

console.log('x > prevX?', pacman.x > pacman.prevX);
console.log('');
