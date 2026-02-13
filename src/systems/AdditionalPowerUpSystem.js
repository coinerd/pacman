import { powerUpConfig } from '../config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';

export const POWER_UP_TYPES = {
    SHIELD: 'SHIELD',
    SPEED_BOOST: 'SPEED_BOOST',
    DATA_MAGNET: 'DATA_MAGNET'
};

export default class AdditionalPowerUpSystem {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.activePowerUps = new Map();
        this.powerUpTimers = new Map();
        this.spawnedPowerUps = [];
    }

    spawnPowerUp(type, x, y) {
        if (this.spawnedPowerUps.length >= powerUpConfig.maxOnScreen) {
            return null;
        }

        if (!powerUpConfig.types[type]) {
            return null;
        }

        const powerUp = {
            type,
            x,
            y,
            createdAt: 0,
            config: powerUpConfig.types[type]
        };

        this.spawnedPowerUps.push(powerUp);

        gameEvents.emit(GAME_EVENTS.POWER_UP_SPAWNED, {
            type,
            x,
            y
        });

        return powerUp;
    }

    collectPowerUp(powerUp) {
        const index = this.spawnedPowerUps.indexOf(powerUp);
        if (index === -1) {
            return null;
        }

        this.spawnedPowerUps.splice(index, 1);

        const result = this.activatePowerUp(powerUp.type, powerUp.config.duration);

        gameEvents.emit(GAME_EVENTS.POWER_UP_COLLECTED, {
            type: powerUp.type,
            player: this.gameModel.pacman
        });

        return result;
    }

    activatePowerUp(type, duration) {
        if (!powerUpConfig.types[type]) {
            return null;
        }

        if (this.activePowerUps.has(type)) {
            this.deactivatePowerUp(type);
        }

        const actualDuration = duration ?? powerUpConfig.types[type].duration;
        const startTime = performance.now();

        this.activePowerUps.set(type, {
            type,
            startTime,
            elapsed: 0,
            duration: actualDuration * 1000
        });

        this.applyPowerUpEffect(type);

        this.powerUpTimers.set(type, startTime);

        gameEvents.emit(GAME_EVENTS.POWER_UP_ACTIVATED, {
            type,
            duration: actualDuration
        });

        return { type, duration: actualDuration };
    }

    deactivatePowerUp(type) {
        if (!this.activePowerUps.has(type)) {
            return;
        }

        const powerUp = this.activePowerUps.get(type);
        this.activePowerUps.delete(type);
        this.powerUpTimers.delete(type);

        this.removePowerUpEffect(type);

        const durationUsed = Math.min(
            powerUp.elapsed / 1000,
            powerUp.duration / 1000
        );

        gameEvents.emit(GAME_EVENTS.POWER_UP_EXPIRED, {
            type,
            durationUsed
        });
    }

    applyPowerUpEffect(type) {
        const pacman = this.gameModel.pacman;
        if (!pacman) {
            return;
        }

        switch (type) {
        case POWER_UP_TYPES.SHIELD:
            pacman.isShielded = true;
            break;

        case POWER_UP_TYPES.SPEED_BOOST:
            pacman.hasSpeedBoost = true;
            pacman.speed = pacman.baseSpeed * 2;
            break;

        case POWER_UP_TYPES.DATA_MAGNET:
            pacman.hasDataMagnet = true;
            break;
        }
    }

    removePowerUpEffect(type) {
        const pacman = this.gameModel.pacman;
        if (!pacman) {
            return;
        }

        switch (type) {
        case POWER_UP_TYPES.SHIELD:
            pacman.isShielded = false;
            break;

        case POWER_UP_TYPES.SPEED_BOOST:
            pacman.hasSpeedBoost = false;
            pacman.speed = pacman.baseSpeed;
            break;

        case POWER_UP_TYPES.DATA_MAGNET:
            pacman.hasDataMagnet = false;
            break;
        }
    }

    update(deltaTime) {
        const deltaTimeMs = deltaTime * 1000;

        for (const type of this.activePowerUps.keys()) {
            const powerUp = this.activePowerUps.get(type);
            if (!powerUp) {
                continue;
            }

            powerUp.elapsed += deltaTimeMs;

            if (powerUp.elapsed >= powerUp.duration) {
                this.deactivatePowerUp(type);
            }
        }

        if (this.gameModel.pacman?.hasDataMagnet) {
            this.applyDataMagnetEffect();
        }
    }

    applyDataMagnetEffect() {
        const pacman = this.gameModel.pacman;
        if (!pacman) {
            return;
        }

        const magnetRadius = powerUpConfig.spawnRadius;
        const pelletGrid = this.gameModel.pelletGrid;

        for (let y = 0; y < pelletGrid.length; y++) {
            for (let x = 0; x < pelletGrid[y].length; x++) {
                if (pelletGrid[y][x] === 0) {
                    continue;
                }

                const distance = Math.sqrt(
                    (x - pacman.gridX) ** 2 + (y - pacman.gridY) ** 2
                );

                if (distance <= magnetRadius) {
                    const result = this.gameModel.eatPelletAt(x, y);
                    if (result) {
                        this.gameModel.score += 10;
                        gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {
                            score: 10,
                            pelletsRemaining: this.gameModel.pelletsRemaining,
                            gridX: x,
                            gridY: y
                        });
                    }
                }
            }
        }
    }

    hasActivePowerUp(type) {
        return this.activePowerUps.has(type);
    }

    getRemainingTime(type) {
        if (!this.activePowerUps.has(type)) {
            return 0;
        }

        const powerUp = this.activePowerUps.get(type);
        const remaining = Math.max(0, powerUp.duration - powerUp.elapsed);

        return remaining / 1000;
    }

    getActivePowerUps() {
        return Array.from(this.activePowerUps.values());
    }

    getSpawnedPowerUps() {
        return [...this.spawnedPowerUps];
    }

    shouldSpawnPowerUp(_pelletsCollected) {
        if (this.gameModel.isBossBattleActive()) {
            return false;
        }

        if (this.spawnedPowerUps.length >= powerUpConfig.maxOnScreen) {
            return false;
        }

        const types = Object.keys(powerUpConfig.types);

        for (const type of types) {
            const config = powerUpConfig.types[type];
            if (Math.random() < config.spawnChance * 0.01) {
                return type;
            }
        }

        return null;
    }

    findValidSpawnPosition(maze) {
        const maxAttempts = 50;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.floor(Math.random() * maze[0].length);
            const y = Math.floor(Math.random() * maze.length);

            if (maze[y][x] === 0 && !this.isPositionOccupied(x, y)) {
                return { x, y };
            }
        }

        return null;
    }

    isPositionOccupied(x, y) {
        for (const powerUp of this.spawnedPowerUps) {
            if (powerUp.x === x && powerUp.y === y) {
                return true;
            }
        }

        if (
            this.gameModel.pacman.gridX === x &&
			this.gameModel.pacman.gridY === y
        ) {
            return true;
        }

        for (const ghost of this.gameModel.ghosts) {
            if (ghost.gridX === x && ghost.gridY === y) {
                return true;
            }
        }

        return false;
    }

    reset() {
        for (const type of this.activePowerUps.keys()) {
            this.deactivatePowerUp(type);
        }

        this.activePowerUps.clear();
        this.powerUpTimers.clear();
        this.spawnedPowerUps = [];
    }

    getSnapshot() {
        return {
            activePowerUps: this.getActivePowerUps().map((p) => ({
                type: p.type,
                remainingTime: this.getRemainingTime(p.type)
            })),
            spawnedPowerUps: this.getSpawnedPowerUps().map((p) => ({
                type: p.type,
                x: p.x,
                y: p.y
            }))
        };
    }
}
