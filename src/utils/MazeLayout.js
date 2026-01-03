import { gameConfig } from '../config/gameConfig.js';

export const TILE_TYPES = {
    WALL: 1,
    PATH: 0,
    PELLET: 0,
    POWER_PELLET: 2,
    EMPTY: 3,
    GHOST_HOUSE: 4,
    GHOST_HOUSE_DOOR: 5
};

export const mazeLayout = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,2,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

export function createMazeData() {
    const maze = [];
    for (let y = 0; y < mazeLayout.length; y++) {
        const row = [];
        for (let x = 0; x < mazeLayout[y].length; x++) {
            row.push(mazeLayout[y][x]);
        }
        maze.push(row);
    }
    return maze;
}

export function getTileType(maze, gridX, gridY) {
    if (gridY < 0 || gridY >= maze.length || gridX < 0 || gridX >= maze[0].length) {
        return TILE_TYPES.WALL;
    }
    return maze[gridY][gridX];
}

export function isWall(maze, gridX, gridY) {
    return getTileType(maze, gridX, gridY) === TILE_TYPES.WALL;
}

export function isPath(maze, gridX, gridY) {
    const tile = getTileType(maze, gridX, gridY);
    return tile === TILE_TYPES.PATH || tile === TILE_TYPES.PELLET || tile === TILE_TYPES.POWER_PELLET;
}

export function isGhostHouse(maze, gridX, gridY) {
    return getTileType(maze, gridX, gridY) === TILE_TYPES.GHOST_HOUSE;
}

export function isGhostHouseDoor(maze, gridX, gridY) {
    return getTileType(maze, gridX, gridY) === TILE_TYPES.GHOST_HOUSE_DOOR;
}

export function gridToPixel(gridX, gridY) {
    return {
        x: gridX * gameConfig.tileSize,
        y: gridY * gameConfig.tileSize
    };
}

export function pixelToGrid(pixelX, pixelY) {
    return {
        x: Math.floor(pixelX / gameConfig.tileSize),
        y: Math.floor(pixelY / gameConfig.tileSize)
    };
}

export function getCenterPixel(gridX, gridY) {
    const pixel = gridToPixel(gridX, gridY);
    return {
        x: pixel.x + gameConfig.tileSize / 2,
        y: pixel.y + gameConfig.tileSize / 2
    };
}

export function getValidDirections(maze, gridX, gridY, allowReverse = true) {
    const validDirs = [];
    const { UP, DOWN, LEFT, RIGHT } = { UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 } };
    
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
            } else if (isPath(maze, newX, newY) || isGhostHouse(maze, newX, newY)) {
                validDirs.push(dir);
            }
        }
    }
    
    return validDirs;
}

export function countPellets(maze) {
    let count = 0;
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === TILE_TYPES.PELLET || maze[y][x] === TILE_TYPES.POWER_PELLET) {
                count++;
            }
        }
    }
    return count;
}

export function setTileType(maze, gridX, gridY, tileType) {
    if (gridY >= 0 && gridY < maze.length && gridX >= 0 && gridX < maze[0].length) {
        maze[gridY][gridX] = tileType;
    }
}

export function getDistance(gridX1, gridY1, gridX2, gridY2) {
    return Math.sqrt(Math.pow(gridX2 - gridX1, 2) + Math.pow(gridY2 - gridY1, 2));
}

export function getManhattanDistance(gridX1, gridY1, gridX2, gridY2) {
    return Math.abs(gridX2 - gridX1) + Math.abs(gridY2 - gridY1);
}
