/**
 * MazeRenderer
 * Handles maze wall rendering and background visualization
 */

import { colors, gameConfig } from '../../config/gameConfig.js';
import { gridToPixel, TILE_TYPES } from '../../utils/MazeLayout.js';

export class MazeRenderer {
    constructor(scene) {
        this.scene = scene;
        this.mazeTexture = null;
        this.backgroundTexture = null;
        this.mazeImage = null;
    }

    /**
     * Create the background with grid pattern
     */
    createBackground() {
        // Solid background
        this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            colors.background
        );

        // Digital grid pattern
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.lineStyle(1, 0x002200, 0.3);

        for (let x = 0; x <= this.scene.scale.width; x += gameConfig.tileSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.scene.scale.height);
        }

        for (let y = 0; y <= this.scene.scale.height; y += gameConfig.tileSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.scene.scale.width, y);
        }

        graphics.strokePath();

        this.backgroundTexture = graphics.generateTexture(
            'backgroundGrid',
            this.scene.scale.width,
            this.scene.scale.height
        );
        graphics.destroy();

        this.scene.add.image(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            'backgroundGrid'
        );
    }

    /**
     * Create maze walls from maze data
     * @param {Array<Array<number>>} maze - 2D maze array
     */
    createMaze(maze) {
        if (!maze) {
            return;
        }

        // Maze created silently

        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });

        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[y].length; x++) {
                if (maze[y][x] === TILE_TYPES.WALL) {
                    this.drawWallToGraphics(graphics, x, y, maze);
                }
            }
        }

        const mazeWidth = maze[0].length * gameConfig.tileSize;
        const mazeHeight = maze.length * gameConfig.tileSize;

        // Remove old texture if exists to prevent memory leak
        if (this.scene.textures.exists('mazeWalls')) {
            this.scene.textures.remove('mazeWalls');
        }

        this.mazeTexture = graphics.generateTexture('mazeWalls', mazeWidth, mazeHeight);
        graphics.destroy();

        // Remove old maze image if exists
        if (this.mazeImage) {
            this.mazeImage.destroy();
        }

        this.mazeImage = this.scene.add.image(mazeWidth / 2, mazeHeight / 2, 'mazeWalls');
        this.mazeImage.setDepth(1); // Ensure walls are above background
    }

    /**
     * Draw a single wall tile to graphics context
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics context
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {Array<Array<number>>} maze - Full maze data for neighbor checks
     */
    drawWallToGraphics(graphics, x, y, maze) {
        const pixel = gridToPixel(x, y);
        const size = gameConfig.tileSize;
        const half = size / 2;
        const quarter = size / 4;
        const center = { x: pixel.x + half, y: pixel.y + half };

        // Shadow
        graphics.fillStyle(colors.wallShadow, 1);
        graphics.fillRect(pixel.x + 1, pixel.y + 1, size, size);

        // Main wall
        graphics.fillStyle(colors.wall, 1);
        graphics.fillRect(pixel.x + 1, pixel.y + 1, size - 2, size - 2);

        // Check neighbors for connections
        const hasLeft = this.isWallAt(x - 1, y, maze);
        const hasRight = this.isWallAt(x + 1, y, maze);
        const hasUp = this.isWallAt(x, y - 1, maze);
        const hasDown = this.isWallAt(x, y + 1, maze);

        // Draw connection lines
        graphics.lineStyle(3, 0x00ffaa, 0.6);

        if (hasLeft) {
            graphics.moveTo(pixel.x, center.y);
            graphics.lineTo(center.x, center.y);
        }
        if (hasRight) {
            graphics.moveTo(center.x, center.y);
            graphics.lineTo(pixel.x + size, center.y);
        }
        if (hasUp) {
            graphics.moveTo(center.x, pixel.y);
            graphics.lineTo(center.x, center.y);
        }
        if (hasDown) {
            graphics.moveTo(center.x, center.y);
            graphics.lineTo(center.x, pixel.y + size);
        }
        graphics.strokePath();

        // Center dot
        graphics.fillStyle(0x00ffaa, 0.8);
        graphics.fillCircle(center.x, center.y, quarter);

        // Inner border
        graphics.lineStyle(1, 0x00ff88, 0.3);
        graphics.strokeRect(pixel.x + 2, pixel.y + 2, size - 4, size - 4);

        // Corner accents
        graphics.fillStyle(0x00ffaa, 0.4);
        this.drawCornerAccents(graphics, pixel, size);
    }

    /**
     * Draw decorative corner accents on a wall tile
     * @param {Phaser.GameObjects.Graphics} graphics - Graphics context
     * @param {Object} pixel - Pixel position {x, y}
     * @param {number} size - Tile size
     */
    drawCornerAccents(graphics, pixel, size) {
        const accentSize = 4;

        // Top-left corner
        graphics.fillRect(pixel.x + 3, pixel.y + 3, accentSize, accentSize);

        // Top-right corner
        graphics.fillRect(pixel.x + size - 7, pixel.y + 3, accentSize, accentSize);

        // Bottom-left corner
        graphics.fillRect(pixel.x + 3, pixel.y + size - 7, accentSize, accentSize);

        // Bottom-right corner
        graphics.fillRect(pixel.x + size - 7, pixel.y + size - 7, accentSize, accentSize);
    }

    /**
     * Check if there is a wall at the given grid position
     * @param {number} x - Grid X position
     * @param {number} y - Grid Y position
     * @param {Array<Array<number>>} maze - Maze data
     * @returns {boolean}
     */
    isWallAt(x, y, maze) {
        if (!maze || y < 0 || y >= maze.length || x < 0 || x >= maze[0].length) {
            return false;
        }
        return maze[y][x] === TILE_TYPES.WALL;
    }

    /**
     * Clean up renderer resources
     */
    cleanup() {
        if (this.mazeImage) {
            this.mazeImage.destroy();
            this.mazeImage = null;
        }

        if (this.backgroundTexture) {
            const texture = this.scene.textures.get('backgroundGrid');
            if (texture) {
                texture.destroy();
            }
            this.backgroundTexture = null;
        }

        if (this.mazeTexture) {
            const texture = this.scene.textures.get('mazeWalls');
            if (texture) {
                texture.destroy();
            }
            this.mazeTexture = null;
        }
    }
}
