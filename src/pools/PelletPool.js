import Phaser from 'phaser';
import { gameConfig, colors } from '../config/gameConfig.js';

export class PelletPool {
    constructor(scene) {
        this.scene = scene;
        this.available = [];
        this.active = [];
        this.initialSize = 300;
    }

    init() {
        for (let i = 0; i < this.initialSize; i++) {
            const pellet = this.scene.add.circle(0, 0, 3, colors.pellet);
            pellet.setVisible(false);
            pellet.setActive(false);
            this.available.push(pellet);
        }
    }

    get(gridX, gridY) {
        if (this.available.length === 0) {
            console.warn('Pellet pool exhausted');
            return null;
        }

        const pellet = this.available.pop();
        pellet.setVisible(true);
        pellet.setActive(true);

        const pixel = {
            x: gridX * gameConfig.tileSize + gameConfig.tileSize / 2,
            y: gridY * gameConfig.tileSize + gameConfig.tileSize / 2
        };
        pellet.setPosition(pixel.x, pixel.y);

        this.active.push(pellet);
        return pellet;
    }

    release(pellet) {
        const index = this.active.indexOf(pellet);
        if (index !== -1) {
            this.active.splice(index, 1);
            pellet.setVisible(false);
            pellet.setActive(false);
            this.available.push(pellet);
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
    }
}
