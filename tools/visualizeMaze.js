import { pacmanStartPosition, ghostStartPositions, gameConfig } from '../src/config/gameConfig.js';
import { mazeLayout } from '../src/utils/MazeLayout.js';
import { TILE_TYPES } from '../src/utils/MazeLayout.js';

const symbols = {
    [TILE_TYPES.WALL]: '█',
    [TILE_TYPES.PATH]: '·',
    2: '★'
};

function visualizeMaze() {
    console.log('\nMaze Layout with Starting Positions:');
    console.log('━'.repeat(58));

    for (let y = 0; y < mazeLayout.length; y++) {
        let row = '';
        for (let x = 0; x < mazeLayout[y].length; x++) {
            const tile = mazeLayout[y][x];
            let symbol = symbols[tile] || '?';

            if (x === pacmanStartPosition.x && y === pacmanStartPosition.y) {
                symbol = 'P';
            } else if (Object.values(ghostStartPositions).some(p => p.x === x && p.y === y)) {
                symbol = 'G';
            }

            row += symbol;
        }
        console.log(row);
    }

    console.log('━'.repeat(58));
    console.log('\nLegend:');
    console.log('  P = Pacman Starting Position');
    console.log('  G = Ghost Starting Position');
    console.log('  █ = Wall (1)');
    console.log('  · = Path (0)');
    console.log('  ★ = Power Pellet (2)');
    console.log(`\nMaze Dimensions: ${gameConfig.mazeWidth}x${gameConfig.mazeHeight}`);
    console.log(`Pacman: (${pacmanStartPosition.x}, ${pacmanStartPosition.y})`);
    console.log(`Ghosts:`, ghostStartPositions);
}

visualizeMaze();
