import { bossConfig, enemyColors } from '../config/gameConfig.js';
import BossEntity from './BossEntity.js';

export default class BossEntityFactory {
    static create(scene, bossType, _level = 1) {
        const config = bossConfig.bossTypes[bossType];
        if (!config) {
            console.error(`Unknown boss type: ${bossType}`);
            return null;
        }

        const color = enemyColors[bossType.toUpperCase()];
        const startPos = { x: 12, y: 15 };

        const boss = new BossEntity(scene, startPos.x, startPos.y, bossType, color);

        boss.health = config.health;
        boss.maxHealth = config.health;
        boss.currentPhase = 1;

        return boss;
    }

    static getAvailableBossTypes() {
        return Object.keys(bossConfig.bossTypes);
    }

    static getBossConfig(bossType) {
        return bossConfig.bossTypes[bossType];
    }

    static getBossColor(bossType) {
        return enemyColors[bossType.toUpperCase()];
    }
}
