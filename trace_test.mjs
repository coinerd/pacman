import Pacman from './src/entities/Pacman.js';
import { directions } from './src/config/gameConfig.js';
import { performGridMovementStep, distanceToTileCenter, EPS } from './src/utils/TileMovement.js';
import { createMockScene, createMockMaze } from './tests/utils/testHelpers.js';

function createSimpleTestMaze() {
    return [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ];
}

const mockScene = createMockScene();
const mockMaze = createMockMaze(createSimpleTestMaze());
const pacman = new Pacman(mockScene, 1, 2);
pacman.direction = directions.RIGHT;
pacman.speed = 800;

console.log('EPS:', EPS);
console.log('EPS * 2:', EPS * 2);
console.log('Initial pos:', pacman.x, pacman.y, 'grid:', pacman.gridX, pacman.gridY);

for (let i = 0; i < 10; i++) {
    const prevGridX = pacman.gridX;
    performGridMovementStep(pacman, mockMaze, 16.67);
    
    if (prevGridX !== pacman.gridX) {
        const dist = distanceToTileCenter(pacman.x, pacman.y, pacman.gridX, pacman.gridY);
        const expected = EPS * 2;
        const pass = dist <= expected;
        console.log(`Frame ${i}: gridX ${prevGridX} -> ${pacman.gridX}, pos: (${pacman.x.toFixed(4)}, ${pacman.y.toFixed(4)}), dist to center: ${dist.toFixed(4)}, expected <= ${expected}, ${pass ? 'PASS' : 'FAIL'}`);
    }
}
