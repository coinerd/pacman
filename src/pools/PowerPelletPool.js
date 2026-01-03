import Phaser from 'phaser';
import { gameConfig, colors } from '../config/gameConfig.js';

export class PowerPelletPool {
    constructor(scene) {
        this.scene = scene;
        this.available = [];
        this.active = [];
    }

    init(size = 4) {
        for (let i = 0; i < size; i++) {
            const powerPellet = this.scene.add.circle(0, 0, 6, colors.powerPellet);
            powerPellet.setVisible(false);
            powerPellet.setActive(false);
            this.available.push(powerPellet);
        }
    }

    get() {
        if (this.available.length === 0) {
            return null;
        }

        const pellet = this.available.pop();
        pellet.setVisible(true);
        pellet.setActive(true);
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
