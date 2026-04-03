/**
 * GameModelCollisionHandlers
 * Collision event handlers for GameModelDI
 * Extracted for better maintainability
 */

import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';
import { additionalPowerUpConfig } from '../../config/gameConfig.js';

/**
 * Creates collision handlers bound to a game model context
 * @param {object} context - GameModelDI context with required services
 * @returns {object} Collision handlers
 */
export function createCollisionHandlers(context) {
    return {
        onPelletEaten: (data) => handlePelletEaten(context, data),
        onPowerPelletEaten: (data) => handlePowerPelletEaten(context, data),
        onGhostEaten: (data) => handleGhostEaten(context, data),
        onPacmanDied: (_data) => handlePacmanDied(context),
        onFruitEaten: (data) => handleFruitEaten(context, data)
    };
}

/**
 * Handle pellet eaten event
 */
function handlePelletEaten(context, data) {
    const { scoreModule, gameState, spawningSystem } = context;

    if (!scoreModule || !gameState || !spawningSystem) {
        return;
    }

    scoreModule.pelletsEaten++;
    gameState.score += 10;
    spawningSystem.removePelletAt(data?.gridX, data?.gridY);

    // Try to spawn a power-up on pellet eat
    trySpawnPowerUp(context, data);

    checkHighScore(context);
    checkLevelComplete(context);
}

/**
 * Handle power pellet eaten event
 */
function handlePowerPelletEaten(context, data) {
    const { scoreModule, gameState, spawningSystem, levelSystem } = context;

    if (!scoreModule || !gameState || !spawningSystem || !levelSystem) {
        return;
    }

    scoreModule.pelletsEaten++;
    gameState.score += 50;
    spawningSystem.removePelletAt(data?.gridX, data?.gridY);

    checkHighScore(context);
    checkLevelComplete(context);

    // Frighten ghosts
    const frightenedDuration = levelSystem.getFrightenedDuration();
    setGhostsFrightened(context, frightenedDuration);
}

/**
 * Handle ghost eaten event
 */
function handleGhostEaten(context, data) {
    const { entityRegistry, scoreModule, gameState, levelSystem } = context;

    if (!entityRegistry || !scoreModule || !gameState || !levelSystem) {
        return;
    }

    const ghost = entityRegistry.getGhostByType(data?.ghostType);
    if (ghost) {
        ghost.eat();
        const eatenCount = ghost.eatenCount ?? 0;
        const baseScore = [200, 400, 800, 1600][eatenCount % 4] ?? 200;
        const multiplier = levelSystem.getScoreMultiplier() ?? 1;
        const score = baseScore * multiplier;

        scoreModule.currentComboGhosts++;
        gameState.score += score;
        gameState.ghostsEaten++;
        gameState.maxComboGhosts = Math.max(
            gameState.maxComboGhosts,
            scoreModule.currentComboGhosts
        );
        checkHighScore(context);
    }
}

/**
 * Handle pacman died event
 */
function handlePacmanDied(context) {
    const { gameState } = context;

    gameState.isDying = true;
    gameState.startDeathTimer();
    gameState.levelDeaths++;
}

/**
 * Handle fruit eaten event
 */
function handleFruitEaten(context, data) {
    const { entityRegistry, levelSystem, gameState } = context;

    if (!entityRegistry || !levelSystem || !gameState) {
        return;
    }

    const fruit = entityRegistry.getFruit();
    if (fruit) {
        fruit.eat();
        const score = levelSystem.getFruitScore(data?.fruitType);
        gameState.score += score;
        checkHighScore(context);
    }
}

/**
 * Check and update high score
 */
function checkHighScore(context) {
    const { gameState } = context;

    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
    }
}

/**
 * Check if level is complete
 */
function checkLevelComplete(context) {
    const { spawningSystem, gameState } = context;

    if (!spawningSystem) {
        return;
    }

    const pelletsRemaining = spawningSystem.getPelletsRemaining();

    if (pelletsRemaining === 0 && !gameState.levelComplete) {
        gameState.levelComplete = true;
        gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, {
            level: gameState.level,
            score: gameState.score
        });
    }
}

/**
 * Set all ghosts to frightened mode
 */
function setGhostsFrightened(context, duration) {
    const { entityRegistry } = context;
    const ghosts = entityRegistry?.getGhosts() || [];

    for (const ghost of ghosts) {
        if (ghost) {
            ghost.setFrightened(duration);
        }
    }
}

// Spawn cooldown state (module-level)
let _lastPowerUpSpawnTime = 0;
let _lastPowerUpSpawnPos = null;

/**
 * Try to spawn a power-up when a pellet is eaten
 * Uses spawnChancePerFragment from additionalPowerUpConfig
 * Includes cooldown and minimum distance between spawns
 */
function trySpawnPowerUp(context, data) {
    const { gameState, spawningSystem, entityRegistry } = context;
    if (!gameState || !spawningSystem || !entityRegistry) { return; }

    // Check max power-ups on screen
    const currentPowerUps = gameState.activePowerUps || [];
    if (currentPowerUps.length >= additionalPowerUpConfig.maxOnScreen) {
        return;
    }

    // Cooldown check: minimum 6 seconds between power-up spawns
    const SPAWN_COOLDOWN_MS = 6000;
    const now = Date.now();
    if (now - _lastPowerUpSpawnTime < SPAWN_COOLDOWN_MS) {
        return;
    }

    // Roll for each power-up type
    for (const [typeName, typeConfig] of Object.entries(additionalPowerUpConfig.types)) {
        const roll = Math.random();
        if (roll < typeConfig.spawnChancePerFragment) {
            // Find an empty tile near the eaten pellet, with minimum distance from last spawn
            const MIN_DISTANCE = 8;
            const spawnPos = findEmptyTileWithDistance(
                spawningSystem, data?.gridX, data?.gridY, _lastPowerUpSpawnPos, MIN_DISTANCE
            );
            if (spawnPos) {
                const powerUp = {
                    id: `pu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    type: typeName,
                    gridX: spawnPos.gridX,
                    gridY: spawnPos.gridY,
                    x: spawnPos.x,
                    y: spawnPos.y,
                    color: typeConfig.color,
                    duration: typeConfig.duration,
                    spawnTime: now,
                    despawnTime: additionalPowerUpConfig.despawnTime,
                    collected: false
                };

                if (!gameState.activePowerUps) {
                    gameState.activePowerUps = [];
                }
                gameState.activePowerUps.push(powerUp);

                // Update cooldown state
                _lastPowerUpSpawnTime = now;
                _lastPowerUpSpawnPos = { gridX: spawnPos.gridX, gridY: spawnPos.gridY };

                gameEvents.emit(GAME_EVENTS.POWER_UP_SPAWNED, {
                    powerUpId: powerUp.id,
                    type: typeName,
                    gridX: spawnPos.gridX,
                    gridY: spawnPos.gridY
                });
            }
            break; // Only spawn one power-up per pellet
        }
    }
}

/**
 * Find an empty tile near a position for power-up spawning, with minimum
 * distance from the last spawn position.
 * @param {object} spawningSystem
 * @param {number} centerGridX
 * @param {number} centerGridY
 * @param {{ gridX: number, gridY: number } | null} lastPos - Last spawn position
 * @param {number} minDistance - Minimum grid distance from last spawn
 * @returns {{ gridX: number, gridY: number, x: number, y: number } | null}
 */
function findEmptyTileWithDistance(spawningSystem, centerGridX, centerGridY, lastPos, minDistance) {
    const maze = spawningSystem.getMaze();
    const pelletGrid = spawningSystem.getPelletGrid();
    if (!maze || !pelletGrid) { return null; }

    const searchRadius = additionalPowerUpConfig.spawnRadius;
    const candidates = [];

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            const gx = (centerGridX || 13) + dx;
            const gy = (centerGridY || 13) + dy;

            if (gy < 0 || gy >= maze.length || gx < 0 || gx >= maze[0].length) { continue; }
            // Must be walkable (not wall) and no pellet
            if (maze[gy][gx] === 0 && pelletGrid[gy][gx] === 0) {
                // Check minimum distance from last spawn position
                if (lastPos) {
                    const distFromLast = Math.sqrt(
                        (gx - lastPos.gridX) ** 2 + (gy - lastPos.gridY) ** 2
                    );
                    if (distFromLast < minDistance) { continue; }
                }
                candidates.push({ gridX: gx, gridY: gy });
            }
        }
    }

    // Fallback: if no candidates meet distance requirement, search whole maze
    if (candidates.length === 0 && lastPos) {
        for (let gy = 0; gy < maze.length; gy++) {
            for (let gx = 0; gx < maze[0].length; gx++) {
                if (maze[gy][gx] === 0 && pelletGrid[gy][gx] === 0) {
                    const distFromLast = Math.sqrt(
                        (gx - lastPos.gridX) ** 2 + (gy - lastPos.gridY) ** 2
                    );
                    if (distFromLast >= minDistance) {
                        candidates.push({ gridX: gx, gridY: gy });
                    }
                }
            }
        }
    }

    if (candidates.length === 0) { return null; }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const tileSize = 20; // gameConfig.tileSize
    return {
        gridX: chosen.gridX,
        gridY: chosen.gridY,
        x: chosen.gridX * tileSize + tileSize / 2,
        y: chosen.gridY * tileSize + tileSize / 2
    };
}

/**
 * Apply collision effect based on event type
 */
export function applyCollisionEffect(context, event) {
    switch (event.type) {
    case 'pelletEaten':
    case 'powerPelletEaten':
    case 'ghostEaten':
    case 'fruitEaten':
        // Already handled in callbacks
        break;
    case 'pacmanDied':
        handlePacmanDied(context);
        break;
    case 'powerUpCollected':
        handlePowerUpCollected(context, event);
        break;
    }
}

/**
 * Handle power-up collection
 */
function handlePowerUpCollected(context, event) {
    const { gameState, entityRegistry } = context;
    if (!gameState || !entityRegistry) { return; }

    const powerUp = gameState.activePowerUps?.find(p => p.id === event.powerUpId);
    if (!powerUp || powerUp.collected) { return; }

    powerUp.collected = true;

    const pacman = entityRegistry.getPacman();
    if (!pacman) { return; }

    // Activate the power-up effect on the player
    activatePowerUp(gameState, pacman, powerUp);

    gameEvents.emit(GAME_EVENTS.POWER_UP_ACTIVATED, {
        powerUpId: powerUp.id,
        type: powerUp.type,
        duration: powerUp.duration
    });
}

/**
 * Activate a power-up effect on the player
 */
function activatePowerUp(gameState, pacman, powerUp) {
    const now = Date.now();

    switch (powerUp.type) {
    case 'SHIELD': {
        pacman.isShielded = true;
        pacman.shieldEndTime = now + powerUp.duration * 1000;
        if (!gameState.activeEffects) { gameState.activeEffects = []; }
        gameState.activeEffects.push({
            type: 'SHIELD',
            endTime: pacman.shieldEndTime,
            entityId: pacman.id
        });
        break;
    }
    case 'SPEED_BOOST': {
        pacman.hasSpeedBoost = true;
        pacman.speedBoostEndTime = now + powerUp.duration * 1000;
        pacman.setSpeedMultiplier(2.0); // 2x speed
        if (!gameState.activeEffects) { gameState.activeEffects = []; }
        gameState.activeEffects.push({
            type: 'SPEED_BOOST',
            endTime: pacman.speedBoostEndTime,
            entityId: pacman.id
        });
        break;
    }
    case 'DATA_MAGNET': {
        pacman.hasDataMagnet = true;
        pacman.dataMagnetEndTime = now + powerUp.duration * 1000;
        if (!gameState.activeEffects) { gameState.activeEffects = []; }
        gameState.activeEffects.push({
            type: 'DATA_MAGNET',
            endTime: pacman.dataMagnetEndTime,
            entityId: pacman.id
        });
        break;
    }
    }
}

export default {
    createCollisionHandlers,
    applyCollisionEffect
};
