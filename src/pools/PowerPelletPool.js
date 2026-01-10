import Phaser from 'phaser';
import { gameConfig, colors } from '../config/gameConfig.js';

export class PowerPelletPool {
    constructor(scene) {
        this.scene = scene;
        this.available = [];
        this.active = [];
        this.gridIndex = new Map();
    }

    init(size = 4) {
        for (let i = 0; i < size; i++) {
            const powerPellet = this.scene.add.circle(0, 0, 6, colors.powerPellet);
            powerPellet.setVisible(false);
            powerPellet.setActive(false);
            this.available.push(powerPellet);
        }
    }

    get(gridX, gridY) {
        if (this.available.length === 0) {
            console.warn('Power pellet pool exhausted');
            return null;
        }

        const pellet = this.available.pop();
        pellet.setVisible(true);
        pellet.setActive(true);
        this.active.push(pellet);

        const pixel = {
            x: gridX * gameConfig.tileSize + gameConfig.tileSize / 2,
            y: gridY * gameConfig.tileSize + gameConfig.tileSize / 2
        };
        pellet.setPosition(pixel.x, pixel.y);

        const key = `${gridX},${gridY}`;
        this.gridIndex.set(key, pellet);

        return pellet;
    }

    getByGrid(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        return this.gridIndex.get(key) || null;
    }

    release(pellet) {
        const index = this.active.indexOf(pellet);
        if (index !== -1) {
            this.active.splice(index, 1);
            pellet.setVisible(false);
            pellet.setActive(false);
            this.available.push(pellet);

            const gridX = Math.floor(pellet.x / gameConfig.tileSize);
            const gridY = Math.floor(pellet.y / gameConfig.tileSize);
            const key = `${gridX},${gridY}`;
            this.gridIndex.delete(key);
        }
    }

    releaseAll() {
        const count = this.active.length;
        for (const pellet of [...this.active]) {
            this.release(pellet);
        }
        return count;
    }

    getActiveCount() {
        return this.active.length;
    }

    destroy() {
        for (const pellet of [...this.available, ...this.active]) {
            pellet.destroy();
        }
        this.available = [];
        this.active = [];
        this.gridIndex.clear();
    }
}
