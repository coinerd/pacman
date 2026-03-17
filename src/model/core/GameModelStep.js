/**
 * GameModelStep
 * Game loop step logic for GameModelDI
 * Extracted for better maintainability
 */

import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';
import { applyCollisionEffect } from './GameModelCollisionHandlers.js';

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

    // Collision Detection
    const entities = {
        pacman: pacman,
        ghosts: ghosts,
        fruit: fruit
    };

    const collisionEvents = collisionHandler?.checkAllCollisions(entities, {
        pelletGrid: spawningSystem?.getPelletGrid(),
        pelletsRemaining: spawningSystem?.getPelletsRemaining()
    }) || [];

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
            gameEvents.emit(GAME_EVENTS.RESPAWN);
            return [{ type: 'respawn' }];
        }
    }

    return [];
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
        powerUps: additionalPowerUpSystem?.getSnapshot()?.spawnedPowerUps || [],
        story: storyMode?.getSnapshot(),
        levelInfo: levelSystem?.getLevelInfo()
    };
}

export default {
    executeStep,
    createSnapshot
};
