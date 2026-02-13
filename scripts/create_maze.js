import fs from "fs";

// Create a 25x33 maze with circuit theme
const WIDTH = 25;
const HEIGHT = 33;

// Initialize empty maze
const maze = Array(HEIGHT)
	.fill(null)
	.map(() => Array(WIDTH).fill(0));

// Helper to set a tile
function setTile(x, y, value) {
	if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
		maze[y][x] = value;
	}
}

// Helper to draw horizontal line
function drawHLine(y, startX, endX, value) {
	for (let x = startX; x <= endX; x++) {
		setTile(x, y, value);
	}
}

// Helper to draw vertical line
function drawVLine(x, startY, endY, value) {
	for (let y = startY; y <= endY; y++) {
		setTile(x, y, value);
	}
}

// Helper to draw rectangle
function drawRect(x1, y1, x2, y2, value) {
	drawHLine(y1, x1, x2, value);
	drawHLine(y2, x1, x2, value);
	drawVLine(x1, y1, y2, value);
	drawVLine(x2, y1, y2, value);
}

// Draw border
drawRect(0, 0, WIDTH - 1, HEIGHT - 1, 1);

// Power pellets at corners
setTile(1, 1, 2);
setTile(WIDTH - 2, 1, 2);
setTile(1, HEIGHT - 2, 2);
setTile(WIDTH - 2, HEIGHT - 2, 2);

// Top section circuits (rows 2-4)
drawHLine(2, 1, WIDTH - 2, 0);
drawHLine(3, 1, WIDTH - 2, 0);
drawHLine(4, 1, WIDTH - 2, 0);
// Vertical connectors
drawVLine(1, 2, 4, 1);
drawVLine(WIDTH - 2, 2, 4, 1);
drawVLine(8, 2, 4, 1);
drawVLine(WIDTH - 9, 2, 4, 1);
drawVLine(12, 2, 4, 1);
// Horizontal circuit lines
drawHLine(2, 8, 10, 1);
drawHLine(2, WIDTH - 11, WIDTH - 9, 1);
drawHLine(3, 8, 10, 1);
drawHLine(3, WIDTH - 11, WIDTH - 9, 1);
drawHLine(4, 8, 10, 1);
drawHLine(4, WIDTH - 11, WIDTH - 9, 1);

// Mid-upper section (rows 5-10)
drawHLine(5, 1, WIDTH - 2, 0);
drawHLine(6, 1, WIDTH - 2, 0);
drawHLine(7, 1, WIDTH - 2, 0);
drawHLine(8, 1, WIDTH - 2, 0);
drawHLine(9, 1, WIDTH - 2, 0);
drawHLine(10, 1, WIDTH - 2, 0);
// Circuit patterns
drawVLine(4, 5, 10, 1);
drawVLine(WIDTH - 5, 5, 10, 1);
drawVLine(8, 5, 10, 1);
drawVLine(WIDTH - 9, 5, 10, 1);
drawVLine(12, 5, 10, 1);
drawVLine(WIDTH - 13, 5, 10, 1);
// Horizontal circuit segments
drawHLine(5, 8, 10, 1);
drawHLine(5, WIDTH - 11, WIDTH - 9, 1);
drawHLine(6, 8, 10, 1);
drawHLine(6, WIDTH - 11, WIDTH - 9, 1);
drawHLine(7, 8, 10, 1);
drawHLine(7, WIDTH - 11, WIDTH - 9, 1);
drawHLine(8, 8, 10, 1);
drawHLine(8, WIDTH - 11, WIDTH - 9, 1);
drawHLine(9, 8, 10, 1);
drawHLine(9, WIDTH - 11, WIDTH - 9, 1);
drawHLine(10, 8, 10, 1);
drawHLine(10, WIDTH - 11, WIDTH - 9, 1);

// Virus core section (rows 13-14, columns 11-14)
for (let y = 13; y <= 14; y++) {
	for (let x = 11; x <= 14; x++) {
		setTile(x, y, 4);
	}
}
// Virus core door (row 15)
for (let x = 11; x <= 14; x++) {
	setTile(x, 15, 5);
}
setTile(0, 15, 0);
setTile(WIDTH - 1, 15, 0);
for (let x = 1; x <= WIDTH - 2; x++) {
	if (x < 11 || x > 14) {
		setTile(x, 15, 0);
	}
}

// Mid-lower section (rows 16-21)
drawHLine(16, 1, WIDTH - 2, 0);
drawHLine(17, 1, WIDTH - 2, 0);
drawHLine(18, 1, WIDTH - 2, 0);
drawHLine(19, 1, WIDTH - 2, 0);
drawHLine(20, 1, WIDTH - 2, 0);
drawHLine(21, 1, WIDTH - 2, 0);
// Circuit patterns
drawVLine(4, 16, 21, 1);
drawVLine(WIDTH - 5, 16, 21, 1);
drawVLine(8, 16, 21, 1);
drawVLine(WIDTH - 9, 16, 21, 1);
drawVLine(12, 16, 21, 1);
drawVLine(WIDTH - 13, 16, 21, 1);
// Horizontal circuit segments
drawHLine(16, 8, 10, 1);
drawHLine(16, WIDTH - 11, WIDTH - 9, 1);
drawHLine(17, 8, 10, 1);
drawHLine(17, WIDTH - 11, WIDTH - 9, 1);
drawHLine(18, 8, 10, 1);
drawHLine(18, WIDTH - 11, WIDTH - 9, 1);
drawHLine(19, 8, 10, 1);
drawHLine(19, WIDTH - 11, WIDTH - 9, 1);
drawHLine(20, 8, 10, 1);
drawHLine(20, WIDTH - 11, WIDTH - 9, 1);
drawHLine(21, 8, 10, 1);
drawHLine(21, WIDTH - 11, WIDTH - 9, 1);

// Bottom section circuits (rows 24-31)
drawHLine(24, 1, WIDTH - 2, 0);
drawHLine(25, 1, WIDTH - 2, 0);
drawHLine(26, 1, WIDTH - 2, 0);
// Vertical connectors
drawVLine(1, 24, 31, 1);
drawVLine(WIDTH - 2, 24, 31, 1);
drawVLine(8, 24, 31, 1);
drawVLine(WIDTH - 9, 24, 31, 1);
drawVLine(12, 24, 31, 1);
// Horizontal circuit lines
drawHLine(24, 8, 10, 1);
drawHLine(24, WIDTH - 11, WIDTH - 9, 1);
drawHLine(25, 8, 10, 1);
drawHLine(25, WIDTH - 11, WIDTH - 9, 1);
drawHLine(26, 8, 10, 1);
drawHLine(26, WIDTH - 11, WIDTH - 9, 1);

// Generate JavaScript file content
let output = `import { gameConfig } from '../config/gameConfig.js';

export const TILE_TYPES = {
    WALL: 1,
    PATH: 0,
    VIRUS_CORE: 4,
    VIRUS_CORE_DOOR: 5
};

export const PELLET_TYPES = {
    NONE: 0,
    PELLET: 1,
    POWER_PELLET: 2,
};

const LAYOUT_TILE_TYPES = {
    POWER_PELLET: 2,
};

export const mazeLayout = [
`;

// Add each row
maze.forEach((row, index) => {
	output +=
		"    [" +
		row.join(", ") +
		"]" +
		(index < maze.length - 1 ? "," : "") +
		"\n";
});

output += `];

export function createMazeData() {
    const maze = [];
    const pelletGrid = [];

    for (let y = 0; y < mazeLayout.length; y++) {
        const row = [];
        const pelletRow = [];
        for (let x = 0; x < mazeLayout[y].length; x++) {
            const tile = mazeLayout[y][x];

            if (tile === TILE_TYPES.WALL) {
                row.push(TILE_TYPES.WALL);
                pelletRow.push(PELLET_TYPES.NONE);
                continue;
            }

            if (
                tile === TILE_TYPES.VIRUS_CORE ||
                tile === TILE_TYPES.VIRUS_CORE_DOOR
            ) {
                row.push(tile);
                pelletRow.push(PELLET_TYPES.NONE);
                continue;
            }

            if (tile === LAYOUT_TILE_TYPES.POWER_PELLET) {
                row.push(TILE_TYPES.PATH);
                pelletRow.push(PELLET_TYPES.POWER_PELLET);
                continue;
            }

            row.push(TILE_TYPES.PATH);
            pelletRow.push(PELLET_TYPES.PELLET);
        }
        maze.push(row);
        pelletGrid.push(pelletRow);
    }

    return { maze, pelletGrid };
}

export function getTileType(maze, gridX, gridY) {
    if (
        gridY < 0 ||
        gridY >= maze.length ||
        gridX < 0 ||
        gridX >= maze[0].length
    ) {
        return TILE_TYPES.WALL;
    }
    return maze[gridY][gridX];
}

export function isWall(maze, gridX, gridY) {
    return getTileType(maze, gridX, gridY) === TILE_TYPES.WALL;
}

export function isWalkableTile(maze, gridX, gridY) {
    const tile = getTileType(maze, gridX, gridY);
    return (
        tile === TILE_TYPES.PATH ||
        tile === TILE_TYPES.VIRUS_CORE ||
        tile === TILE_TYPES.VIRUS_CORE_DOOR
    );
}

export function isVirusCore(maze, gridX, gridY) {
    return getTileType(maze, gridX, gridY) === TILE_TYPES.VIRUS_CORE;
}

export function isVirusCoreDoor(maze, gridX, gridY) {
    return getTileType(maze, gridX, gridY) === TILE_TYPES.VIRUS_CORE_DOOR;
}

export function gridToPixel(gridX, gridY) {
    return {
        x: gridX * gameConfig.tileSize,
        y: gridY * gameConfig.tileSize,
    };
}

export function pixelToGrid(pixelX, pixelY) {
    return {
        x: Math.floor(pixelX / gameConfig.tileSize),
        y: Math.floor(pixelY / gameConfig.tileSize),
    };
}

export function getCenterPixel(gridX, gridY) {
    const pixel = gridToPixel(gridX, gridY);
    return {
        x: pixel.x + gameConfig.tileSize / 2,
        y: pixel.y + gameConfig.tileSize / 2,
    };
}

export function getValidDirections(maze, gridX, gridY, allowReverse = true) {
    const validDirs = [];
    const { UP, DOWN, LEFT, RIGHT } = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 },
    };

    const directions = [UP, DOWN, LEFT, RIGHT];

    for (const dir of directions) {
        const newX = gridX + dir.x;
        const newY = gridY + dir.y;

        // Allow tunnel wrapping (movement outside maze boundaries on left/right edges)
        if (newY >= 0 && newY < maze.length) {
            if (newX < 0 || newX >= maze[0].length) {
                // This is a tunnel edge - allow horizontal movement
                if (dir.x !== 0) {
                    validDirs.push(dir);
                }
            } else if (isWalkableTile(maze, newX, newY)) {
                validDirs.push(dir);
            }
        }
    }

    return validDirs;
}

export function countPellets(pelletGrid) {
    let count = 0;
    for (let y = 0; y < pelletGrid.length; y++) {
        for (let x = 0; x < pelletGrid[y].length; x++) {
            if (
                pelletGrid[y][x] === PELLET_TYPES.PELLET ||
                pelletGrid[y][x] === PELLET_TYPES.POWER_PELLET
            ) {
                count++;
            }
        }
    }
    return count;
}

export function getPelletType(pelletGrid, gridX, gridY) {
    if (
        !pelletGrid ||
        gridY < 0 ||
        gridY >= pelletGrid.length ||
        gridX < 0 ||
        gridX >= pelletGrid[0].length
    ) {
        return PELLET_TYPES.NONE;
    }
    return pelletGrid[gridY][gridX];
}

export function isPelletAt(pelletGrid, gridX, gridY) {
    const pelletType = getPelletType(pelletGrid, gridX, gridY);
    return (
        pelletType === PELLET_TYPES.PELLET ||
        pelletType === PELLET_TYPES.POWER_PELLET
    );
}

export function consumePelletAt(pelletGrid, gridX, gridY) {
    const pelletType = getPelletType(pelletGrid, gridX, gridY);
    if (pelletType !== PELLET_TYPES.NONE && pelletGrid?.[gridY]) {
        pelletGrid[gridY][gridX] = PELLET_TYPES.NONE;
    }
    return pelletType;
}

export function setTileType(maze, gridX, gridY, tileType) {
    if (
        gridY >= 0 &&
        gridY < maze.length &&
        gridX >= 0 &&
        gridX < maze[0].length
    ) {
        maze[gridY][gridX] = tileType;
    }
}

export function getDistance(gridX1, gridY1, gridX2, gridY2) {
    return Math.sqrt((gridX2 - gridX1) ** 2 + (gridY2 - gridY1) ** 2);
}

export function getManhattanDistance(gridX1, gridY1, gridX2, gridY2) {
    return Math.abs(gridX2 - gridX1) + Math.abs(gridY2 - gridY1);
}
`;

// Write to file
fs.writeFileSync(
	"/home/user/src/pacman/src/utils/MazeLayout.js",
	output,
	"utf8",
);

console.log("MazeLayout.js created successfully!");
console.log(`Dimensions: ${WIDTH}x${HEIGHT}`);
console.log(`Total tiles: ${WIDTH * HEIGHT}`);

// Verify each row has exactly WIDTH elements
const allCorrect = maze.every((row) => row.length === WIDTH);
console.log(`All rows have ${WIDTH} elements: ${allCorrect ? "✓" : "✗"}`);

if (!allCorrect) {
	maze.forEach((row, i) => {
		if (row.length !== WIDTH) {
			console.log(`Row ${i} has ${row.length} elements (expected ${WIDTH})`);
		}
	});
}
