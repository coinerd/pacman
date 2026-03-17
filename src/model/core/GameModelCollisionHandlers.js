/**
 * GameModelCollisionHandlers
 * Collision event handlers for GameModelDI
 * Extracted for better maintainability
 */

import { GAME_EVENTS, gameEvents } from '../../core/EventBus.js';

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
    }
}

export default {
    createCollisionHandlers,
    applyCollisionEffect
};
