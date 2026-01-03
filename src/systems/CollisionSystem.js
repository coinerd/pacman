import { gameConfig, scoreValues } from '../config/gameConfig.js';
import { pixelToGrid, getDistance, setTileType, countPellets } from '../utils/MazeLayout.js';
import { TILE_TYPES } from '../utils/MazeLayout.js';

export class CollisionSystem {
    constructor(scene) {
        this.scene = scene;
        this.pacman = null;
        this.ghosts = [];
        this.maze = null;
        this.pelletSprites = [];
        this.powerPelletSprites = [];
        this.pelletPool = null;
        this.powerPelletPool = null;
        this.ghostsEatenCount = 0;
    }
    
    setPacman(pacman) {
        this.pacman = pacman;
    }
    
    setGhosts(ghosts) {
        this.ghosts = ghosts;
    }
    
    setMaze(maze) {
        this.maze = maze;
    }
    
    setPelletSprites(pelletSprites, powerPelletSprites) {
        this.pelletSprites = pelletSprites;
        this.powerPelletSprites = powerPelletSprites;
    }

    setPelletPool(pelletPool) {
        this.pelletPool = pelletPool;
    }

    setPowerPelletPool(powerPelletPool) {
        this.powerPelletPool = powerPelletPool;
    }
    
    checkPelletCollision() {
        const pacmanGrid = pixelToGrid(this.pacman.x, this.pacman.y);
        const tileType = this.maze[pacmanGrid.y][pacmanGrid.x];

        if (tileType === TILE_TYPES.PELLET) {
            this.maze[pacmanGrid.y][pacmanGrid.x] = TILE_TYPES.EMPTY;

            const spriteIndex = this.pelletSprites.findIndex(sprite => {
                const spriteGrid = pixelToGrid(sprite.x, sprite.y);
                return spriteGrid.x === pacmanGrid.x && spriteGrid.y === pacmanGrid.y;
            });

            if (spriteIndex !== -1) {
                const pellet = this.pelletSprites[spriteIndex];
                if (this.pelletPool) {
                    this.pelletPool.release(pellet);
                } else {
                    pellet.destroy();
                }
                this.pelletSprites.splice(spriteIndex, 1);
            }

            return scoreValues.pellet;
        }

        return 0;
    }
    
    checkPowerPelletCollision() {
        const pacmanGrid = pixelToGrid(this.pacman.x, this.pacman.y);
        const tileType = this.maze[pacmanGrid.y][pacmanGrid.x];

        if (tileType === TILE_TYPES.POWER_PELLET) {
            this.maze[pacmanGrid.y][pacmanGrid.x] = TILE_TYPES.EMPTY;

            const spriteIndex = this.powerPelletSprites.findIndex(sprite => {
                const spriteGrid = pixelToGrid(sprite.x, sprite.y);
                return spriteGrid.x === pacmanGrid.x && spriteGrid.y === pacmanGrid.y;
            });

            if (spriteIndex !== -1) {
                const powerPellet = this.powerPelletSprites[spriteIndex];
                if (this.powerPelletPool) {
                    this.powerPelletPool.release(powerPellet);
                } else {
                    powerPellet.destroy();
                }
                this.powerPelletSprites.splice(spriteIndex, 1);
            }

            this.ghostsEatenCount = 0;
            return scoreValues.powerPellet;
        }

        return 0;
    }
    
    checkGhostCollision() {
        for (const ghost of this.ghosts) {
            if (ghost.isEaten) continue;
            
            const dist = getDistance(
                this.pacman.x, this.pacman.y,
                ghost.x, ghost.y
            );
            
            if (dist < gameConfig.tileSize * 0.8) {
                if (ghost.isFrightened) {
                    ghost.eat();
                    this.ghostsEatenCount++;
                    const scoreIndex = Math.min(this.ghostsEatenCount - 1, scoreValues.ghost.length - 1);
                    return {
                        type: 'ghost_eaten',
                        score: scoreValues.ghost[scoreIndex]
                    };
                } else {
                    return {
                        type: 'pacman_died',
                        score: 0
                    };
                }
            }
        }
        
        return null;
    }
    
    checkAllCollisions() {
        const results = {
            pelletScore: 0,
            powerPelletScore: 0,
            ghostCollision: null
        };
        
        results.pelletScore = this.checkPelletCollision();
        results.powerPelletScore = this.checkPowerPelletCollision();
        results.ghostCollision = this.checkGhostCollision();
        
        return results;
    }
    
    checkWinCondition() {
        const pelletsRemaining = countPellets(this.maze);
        return pelletsRemaining === 0;
    }
    
    reset() {
        this.ghostsEatenCount = 0;
    }
}
