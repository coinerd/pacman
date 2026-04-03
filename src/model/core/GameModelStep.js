/**
 * GameModelStep
 * Game loop step logic for GameModelDI
 * Extracted for better maintainability
 */

import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';
import { applyCollisionEffect } from './GameModelCollisionHandlers.js';
import { additionalPowerUpConfig, gameConfig, spawnProtectionConfig } from '../../config/gameConfig.js';
import { PELLET_TYPES } from '../../utils/MazeLayout.js';

/**
 * Execute a single game step
 * @param {object} context - GameModelDI context with required services
 * @param {number} deltaSeconds - Time since last step
 * @param {object} input - Input state (direction)
 * @returns {Array} Events generated during step
 */
export function executeStep(context, deltaSeconds, input = null) {
    const { gameState, movementSystem, entityRegistry, spawningSystem, collisionHandler } = context;

    // Pause/GameOver Check
    if (gameState.isPaused || gameState.isGameOver) {
        return [];
    }

    // Death Sequence
    if (gameState.isDying) {
        return updateDeathSequence(context, deltaSeconds);
    }

    // Input Handling
    if (input?.direction) {
        setDesiredDirection(context, input.direction);
    }

    // Update Movement
    const pacman = entityRegistry?.getPacman();
    const ghosts = entityRegistry?.getGhosts() || [];
    const movementEvents = movementSystem?.update(deltaSeconds, {
        player: pacman,
        pacman: pacman,
        ghosts: ghosts
    }) || [];

    // Update Entities
    const maze = spawningSystem?.getMaze();
    if (pacman && maze) {
        pacman.update(deltaSeconds, maze);
    }

    for (const ghost of ghosts) {
        if (ghost && maze) {
            ghost.update(deltaSeconds, maze);
        }
    }

    // Update Fruit
    const fruit = entityRegistry?.getFruit();
    if (fruit) {
        fruit.update(deltaSeconds);
    }

    // Update Power-Up states (despawn, effect expiry, data magnet)
    updatePowerUpStates(context, deltaSeconds);

    // Collision Detection
    const entities = {
        pacman: pacman,
        ghosts: ghosts,
        fruit: fruit
    };

    let collisionEvents = collisionHandler?.checkAllCollisions(entities, {
        pelletGrid: spawningSystem?.getPelletGrid(),
        pelletsRemaining: spawningSystem?.getPelletsRemaining()
    }) || [];

    // Check power-up collisions
    const powerUpEvents = checkPowerUpCollisions(context);
    collisionEvents = [...collisionEvents, ...powerUpEvents];

    // Apply Collision Effects
    for (const event of collisionEvents) {
        applyCollisionEffect(context, event);
    }

    // Sync Movement to Entities
    movementSystem?.syncToEntities();

    // Emit Events
    const events = [...movementEvents, ...collisionEvents];
    emitEvents(events);

    // Update tick counter
    if (gameState) {
        gameState.incrementTick();
    }

    return events;
}

/**
 * Update death sequence
 * @param {object} context - GameModelDI context
 * @param {number} deltaSeconds - Time since last step
 * @returns {Array} Events generated
 */
function updateDeathSequence(context, deltaSeconds) {
    const { gameState } = context;

    gameState.updateDeathTimer(deltaSeconds);

    if (gameState.isDeathComplete()) {
        if (gameState.lives <= 1) {
            // Last life lost - game over
            gameState.isGameOver = true;
            gameEvents.emit(GAME_EVENTS.GAME_OVER, {
                score: gameState.score,
                highScore: gameState.highScore,
                level: gameState.level
            });
        } else {
            gameState.lives--;
            resetPositions(context);
            gameState.isDying = false;
            // Activate spawn protection
            activateSpawnProtection(context);
            gameEvents.emit(GAME_EVENTS.RESPAWN);
            return [{ type: 'respawn' }];
        }
    }

    return [];
}

/**
 * Activate spawn protection for the player after respawn.
 * Makes player invulnerable, starts blink, and pushes nearby ghosts away.
 * @param {object} context - GameModelDI context
 */
function activateSpawnProtection(context) {
    const { entityRegistry, movementSystem, movementEntityIds, spawningSystem } = context;
    const pacman = entityRegistry?.getPacman();
    if (!pacman) { return; }

    // Start spawn protection on the player entity
    if (typeof pacman.startSpawnProtection === 'function') {
        pacman.startSpawnProtection();
    }

    // Push ghosts away from the spawn area
    const spawnPoints = spawningSystem?.getSpawnPoints();
    const playerSpawn = spawnPoints?.player || { x: pacman.gridX, y: pacman.gridY };
    const ghosts = entityRegistry?.getGhosts() || [];

    for (const ghost of ghosts) {
        const dx = ghost.gridX - playerSpawn.x;
        const dy = ghost.gridY - playerSpawn.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < spawnProtectionConfig.ghostRepelRadius && dist > 0) {
            // Push ghost to ghostRepelDistance tiles from spawn
            const scale = spawnProtectionConfig.ghostRepelDistance / dist;
            const newGridX = Math.round(playerSpawn.x + dx * scale);
            const newGridY = Math.round(playerSpawn.y + dy * scale);

            const ghostId = movementEntityIds?.ghosts?.[ghost.ghostType];
            if (ghostId && movementSystem) {
                movementSystem.resetEntity(ghostId, newGridX, newGridY);
            }
            // Also update the ghost entity directly
            if (ghost.resetPosition) {
                ghost.resetPosition(newGridX, newGridY);
            }
        }
    }
}

/**
 * Set desired direction for pacman
 * @param {object} context - GameModelDI context
 * @param {object} direction - Direction to set
 */
function setDesiredDirection(context, direction) {
    const { entityRegistry, movementSystem, movementEntityIds } = context;

    const pacman = entityRegistry?.getPacman();
    if (pacman) {
        pacman.setDesiredDirection(direction);
    }

    // Also update movement system with the new direction
    if (movementSystem && movementEntityIds?.player) {
        movementSystem.setDirection(movementEntityIds.player, direction);
    }
}

/**
 * Reset all entity positions
 * @param {object} context - GameModelDI context
 */
function resetPositions(context) {
    const { entityRegistry, movementSystem, spawningSystem, movementEntityIds } = context;

    // Reset positions in entity registry
    if (entityRegistry) {
        entityRegistry.resetPositions();
    }

    // Also reset positions in movement system to keep them in sync
    if (movementSystem && spawningSystem) {
        const spawnPoints = spawningSystem.getSpawnPoints();
        const spawnPoint = spawnPoints?.player || { x: 13, y: 23 };

        if (movementEntityIds?.player) {
            movementSystem.resetEntity(movementEntityIds.player, spawnPoint.x, spawnPoint.y);
        }

        // Reset ghosts in movement system
        const ghostSpawns = spawnPoints?.ghosts || {};
        const ghosts = entityRegistry?.getGhosts() || [];
        for (const ghost of ghosts) {
            const ghostId = movementEntityIds?.ghosts?.[ghost.ghostType];
            const ghostSpawn = ghostSpawns[ghost.ghostType];
            if (ghostId && ghostSpawn) {
                movementSystem.resetEntity(ghostId, ghostSpawn.x, ghostSpawn.y);
            }
        }
    }
}

/**
 * Emit events to EventBus
 * @param {Array} events - Events to emit
 */
function emitEvents(events) {
    for (const event of events) {
        gameEvents.emit(event.type, event);
    }
}

/**
 * Update power-up states: despawn expired, expire active effects, run data magnet
 * @param {object} context - GameModelDI context
 * @param {number} deltaSeconds - Time since last step
 */
function updatePowerUpStates(context, deltaSeconds) {
    const { gameState, spawningSystem, entityRegistry } = context;
    if (!gameState) { return; }

    const now = Date.now();

    // Despawn uncollected power-ups after their timer expires
    if (gameState.activePowerUps) {
        gameState.activePowerUps = gameState.activePowerUps.filter(pu => {
            if (pu.collected) { return true; }
            const elapsed = (now - pu.spawnTime) / 1000;
            if (elapsed >= pu.despawnTime) {
                gameEvents.emit(GAME_EVENTS.POWER_UP_EXPIRED, {
                    powerUpId: pu.id,
                    type: pu.type
                });
                return false;
            }
            return true;
        });
    }

    // Expire active effects
    const pacman = entityRegistry?.getPacman();
    if (pacman && gameState.activeEffects) {
        gameState.activeEffects = gameState.activeEffects.filter(effect => {
            if (now >= effect.endTime) {
                // Deactivate the effect
                switch (effect.type) {
                case 'SHIELD':
                    pacman.isShielded = false;
                    pacman.shieldEndTime = 0;
                    break;
                case 'SPEED_BOOST':
                    pacman.hasSpeedBoost = false;
                    pacman.speedBoostEndTime = 0;
                    pacman.setSpeedMultiplier(1.0);
                    break;
                case 'DATA_MAGNET':
                    pacman.hasDataMagnet = false;
                    pacman.dataMagnetEndTime = 0;
                    break;
                }
                gameEvents.emit(GAME_EVENTS.POWER_UP_EXPIRED, {
                    type: effect.type,
                    expired: true
                });
                return false;
            }
            return true;
        });
    }

    // Data Magnet: attract pellets within radius toward player
    if (pacman?.hasDataMagnet && spawningSystem && pacman.gridX !== undefined) {
        applyDataMagnet(context, pacman, spawningSystem);
    }
}

/**
 * Apply Data Magnet effect: pull nearby pellets toward the player
 * @param {object} context - GameModelDI context
 * @param {object} pacman - Player entity
 * @param {object} spawningSystem - Spawning system
 */
function applyDataMagnet(context, pacman, spawningSystem) {
    const pelletGrid = spawningSystem.getPelletGrid();
    if (!pelletGrid) { return; }

    const radius = additionalPowerUpConfig.spawnRadius; // 3-tile radius
    const pGridX = pacman.gridX;
    const pGridY = pacman.gridY;

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const gx = pGridX + dx;
            const gy = pGridY + dy;

            if (gy < 0 || gy >= pelletGrid.length || gx < 0 || gx >= pelletGrid[0].length) {
                continue;
            }

            const pelletType = pelletGrid[gy][gx];
            if (pelletType === PELLET_TYPES.NONE) { continue; }

            // Only eat pellets within exact radius
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius) {
                // Eat the pellet via the magnet
                const removed = spawningSystem.removePelletAt(gx, gy);
                if (removed) {
                    const isPowerPellet = pelletType === PELLET_TYPES.POWER_PELLET;
                    const score = isPowerPellet ? 50 : 10;
                    context.gameState.score += score;
                    context.scoreModule.pelletsEaten++;

                    // Emit PELLET_EATEN so PelletRenderer removes the sprite visually
                    const pelletsRemaining = spawningSystem.getPelletsRemaining();
                    gameEvents.emit(GAME_EVENTS.PELLET_EATEN, {
                        gridX: gx,
                        gridY: gy,
                        score: score,
                        pelletsRemaining: pelletsRemaining,
                        isPowerPellet: isPowerPellet
                    });

                    // If power pellet, also emit POWER_PELLET_EATEN and frighten ghosts
                    if (isPowerPellet) {
                        gameEvents.emit(GAME_EVENTS.POWER_PELLET_EATEN, {
                            gridX: gx,
                            gridY: gy,
                            score: score
                        });
                        const frightenedDuration = context.levelSystem?.getFrightenedDuration() || 8;
                        const ghosts = context.entityRegistry?.getGhosts() || [];
                        for (const ghost of ghosts) {
                            if (ghost) {
                                ghost.setFrightened(frightenedDuration);
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Check power-up collisions (player vs spawned power-ups)
 * @param {object} context - GameModelDI context
 * @returns {Array} Collision events
 */
function checkPowerUpCollisions(context) {
    const { gameState, entityRegistry } = context;
    const events = [];

    if (!gameState?.activePowerUps || !entityRegistry) { return events; }

    const pacman = entityRegistry.getPacman();
    if (!pacman) { return events; }

    const tileSize = gameConfig.tileSize;
    const collectRadius = tileSize * 0.8;
    const collectRadiusSq = collectRadius * collectRadius;

    for (const pu of gameState.activePowerUps) {
        if (pu.collected) { continue; }

        const dx = pacman.x - pu.x;
        const dy = pacman.y - pu.y;
        const distSq = dx * dx + dy * dy;

        if (distSq <= collectRadiusSq) {
            events.push({
                type: 'powerUpCollected',
                powerUpId: pu.id,
                powerUpType: pu.type,
                gridX: pu.gridX,
                gridY: pu.gridY
            });
        }
    }

    return events;
}

/**
 * Create game snapshot
 * @param {object} context - GameModelDI context
 * @returns {object} Snapshot object
 */
export function createSnapshot(context) {
    const { gameState, spawningSystem, entityRegistry, levelSystem, bossBattleSystem, additionalPowerUpSystem, storyMode } = context;

    const ghosts = entityRegistry?.getGhosts() || [];
    const ghostsSnapshot = new Array(ghosts.length);
    for (let i = 0; i < ghosts.length; i++) {
        ghostsSnapshot[i] = ghosts[i].getSnapshot();
    }

    // Include active power-ups in snapshot for rendering
    const powerUpsSnapshot = [];
    if (gameState?.activePowerUps) {
        for (const pu of gameState.activePowerUps) {
            if (!pu.collected) {
                powerUpsSnapshot.push({
                    id: pu.id,
                    type: pu.type,
                    gridX: pu.gridX,
                    gridY: pu.gridY,
                    x: pu.x,
                    y: pu.y,
                    color: pu.color,
                    collected: pu.collected
                });
            }
        }
    }

    return {
        tickCount: gameState?.tick,
        level: gameState?.level,
        score: gameState?.score,
        highScore: gameState?.highScore,
        lives: gameState?.lives,
        pelletsEaten: context.scoreModule?.pelletsEaten,
        ghostsEaten: gameState?.ghostsEaten,
        pelletsRemaining: spawningSystem?.getPelletsRemaining(),
        totalPellets: spawningSystem?.getTotalPellets(),
        isPaused: gameState?.isPaused,
        isGameOver: gameState?.isGameOver,
        levelComplete: gameState?.levelComplete,
        isDying: gameState?.isDying,
        maze: spawningSystem?.getMaze(),
        pelletGrid: spawningSystem?.getPelletGrid(),
        pacman: entityRegistry?.getPacman()?.getSnapshot(),
        ghosts: ghostsSnapshot,
        fruit: entityRegistry?.getFruit()?.getSnapshot(),
        boss: bossBattleSystem?.getSnapshot(),
        powerUps: powerUpsSnapshot,
        story: storyMode?.getSnapshot(),
        levelInfo: levelSystem?.getLevelInfo()
    };
}

export default {
    executeStep,
    createSnapshot
};
