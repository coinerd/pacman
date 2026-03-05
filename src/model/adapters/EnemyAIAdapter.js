/**
 * EnemyAIAdapter
 * Integrates Enemy AI with decoupled movement system.
 * Runs AI decision-making to determine enemy directions.
 */

import {
    directions,
    getOpposite,
    ghostHouse,
    ghostModes,
    scatterTargets,
    gameConfig,
    enemyAIConfig
} from '../../config/gameConfig.js';
import { getDistance, getValidDirections } from '../../utils/MazeLayout.js';

export class EnemyAIAdapter {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.modeTimer = 0;
        this.currentMode = ghostModes.SCATTER;
        this.modeDurations = enemyAIConfig.stateCycle.map((cycle) => ({
            mode: cycle.state,
            duration: cycle.duration
        }));
        this.modeIndex = 0;
    }

    /**
	 * Update all enemies' AI
	 * @param {number} deltaSeconds - Time delta
	 */
    update(deltaSeconds) {
        this.updateModeTimer(deltaSeconds);

        for (const enemy of this.gameModel.ghosts) {
            this.updateEnemyAI(enemy, deltaSeconds);
        }
    }

    /**
	 * Update mode timer and switch modes
	 * @param {number} deltaSeconds - Time delta
	 */
    updateModeTimer(deltaSeconds) {
        if (this.modeIndex >= this.modeDurations.length) {
            return;
        }

        const currentModeConfig = this.modeDurations[this.modeIndex];
        if (currentModeConfig.duration === Infinity) {
            return;
        }

        this.modeTimer += deltaSeconds;

        if (this.modeTimer >= currentModeConfig.duration) {
            this.modeTimer = 0;
            this.modeIndex++;
            this.currentMode =
                this.modeDurations[this.modeIndex]?.mode || ghostModes.CHASE;

            for (const enemy of this.gameModel.ghosts) {
                if (!enemy.isFrightened && !enemy.isEaten) {
                    this.reverseEnemy(enemy);
                    this.telegraphStateChange(enemy);
                }
            }
        }
    }

    /**
	 * Update individual enemy AI
	 * @param {GhostState} enemy - Enemy to update
	 * @param {number} deltaSeconds - Time delta
	 */
    updateEnemyAI(enemy, deltaSeconds) {
        if (enemy.isEaten) {
            this.updateEliminatedEnemy(enemy, deltaSeconds);
            enemy.aiState = ghostModes.EATEN;
            return;
        }

        if (enemy.isFrightened) {
            enemy.updateFrightened(deltaSeconds);
        }

        const previousState = enemy.aiState || enemy.mode || ghostModes.SCATTER;
        const nextState = this.resolveAIState(enemy);
        this.applyState(enemy, nextState, previousState);

        const isAtDecisionPoint = enemy.moveProgress === 0;
        if (!isAtDecisionPoint) {
            return;
        }

        const direction = this.chooseDirectionForState(enemy, nextState);
        if (direction) {
            enemy.setDirection(direction);
        }
    }

    resolveAIState(enemy) {
        if (enemy.isEaten) {
            return ghostModes.EATEN;
        }

        if (!enemy.isFrightened) {
            return this.currentMode;
        }

        if (enemy.frightenedTimer <= enemyAIConfig.recoverThresholdSeconds) {
            return 'RECOVER';
        }

        return ghostModes.FRIGHTENED;
    }

    applyState(enemy, nextState, previousState) {
        enemy.aiState = nextState;

        if (nextState === ghostModes.FRIGHTENED || nextState === 'RECOVER') {
            enemy.mode = ghostModes.FRIGHTENED;
        } else {
            enemy.mode = nextState;
        }

        if (previousState !== nextState) {
            this.telegraphStateChange(enemy);
        }
    }

    telegraphStateChange(enemy) {
        enemy.modeTransitionTimer = enemyAIConfig.modeSwitchTelegraphSeconds;
    }

    chooseDirectionForState(enemy, state) {
        if (state === ghostModes.FRIGHTENED) {
            return this.chooseRandomDirection(enemy);
        }

        if (state === 'RECOVER') {
            return this.chooseRecoverDirection(enemy);
        }

        const target = this.getTargetForState(enemy, state);
        return this.chooseDirectionToTarget(enemy, target.x, target.y);
    }

    chooseRecoverDirection(enemy) {
        const target = scatterTargets[enemy.ghostType] || scatterTargets.alpha;
        return this.chooseDirectionToTarget(enemy, target.x, target.y);
    }

    chooseRandomDirection(enemy) {
        const filteredDirs = this.getCandidateDirections(enemy);
        if (filteredDirs.length === 0) {
            return null;
        }
        return filteredDirs[Math.floor(Math.random() * filteredDirs.length)];
    }

    getTargetForState(enemy, state) {
        if (state === ghostModes.SCATTER) {
            return this.getScatterTarget(enemy);
        }

        return this.getChaseTarget(enemy);
    }

    getScatterTarget(enemy) {
        return scatterTargets[enemy.ghostType] || scatterTargets.alpha;
    }

    getChaseTarget(enemy) {
        const player = this.gameModel.pacman;

        switch (enemy.ghostType) {
        case 'alpha':
            return this.getAlphaChaseTarget(player);
        case 'beta':
            return this.getBetaChaseTarget(player);
        case 'gamma':
            return this.getGammaChaseTarget(player);
        case 'delta':
            return this.getDeltaChaseTarget(player, enemy);
        default:
            return { x: player.gridX, y: player.gridY };
        }
    }

    /**
	 * Update eliminated enemy (returning to ghost house)
	 * @param {GhostState} enemy - Eliminated enemy
	 * @param {number} deltaSeconds - Time delta
	 */
    updateEliminatedEnemy(enemy, deltaSeconds) {
        const entranceX = ghostHouse.entrance?.x || 13;
        const entranceY = ghostHouse.entrance?.y || 11;
        const centerX = ghostHouse.center?.x || 13;
        const centerY = ghostHouse.center?.y || 14;

        if (enemy.inGhostHouse) {
            enemy.houseTimer -= deltaSeconds;
            if (enemy.houseTimer <= 0) {
                enemy.houseTimer = 0;
                enemy.reset();
            }
            return;
        }

        if (enemy.gridX === centerX && enemy.gridY === centerY) {
            enemy.inGhostHouse = true;
            enemy.houseTimer = enemyAIConfig.eliminatedHouseDurationSeconds;
            enemy.direction = directions.NONE;
            return;
        }

        const direction = this.chooseDirectionToTarget(enemy, entranceX, entranceY);
        if (direction) {
            enemy.setDirection(direction);
        }
    }

    getCandidateDirections(enemy) {
        const validDirs = getValidDirections(
            this.gameModel.maze,
            enemy.gridX,
            enemy.gridY
        );

        if (validDirs.length === 0) {
            return [];
        }

        if (!enemy.direction || enemy.direction === directions.NONE) {
            return validDirs;
        }

        const opposite = getOpposite(enemy.direction);
        if (!opposite || opposite === directions.NONE) {
            return validDirs;
        }

        const filteredDirs = validDirs.filter(
            (d) => !(d.x === opposite.x && d.y === opposite.y)
        );

        return filteredDirs.length > 0 ? filteredDirs : validDirs;
    }

    /**
	 * Choose direction to reach a specific target
	 * @param {GhostState} enemy - Enemy
	 * @param {number} targetX - Target grid X
	 * @param {number} targetY - Target grid Y
	 * @returns {Object|null} - Chosen direction
	 */
    chooseDirectionToTarget(enemy, targetX, targetY) {
        const filteredDirs = this.getCandidateDirections(enemy);
        if (filteredDirs.length === 0) {
            return null;
        }

        let bestDir = filteredDirs[0];
        let bestDist = Infinity;

        for (const dir of filteredDirs) {
            const newX = enemy.gridX + dir.x;
            const newY = enemy.gridY + dir.y;
            const dist = getDistance(newX, newY, targetX, targetY);

            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }

        return bestDir;
    }

    /**
	 * Get target position for enemy based on its personality
	 * @param {EnemyState} enemy - Enemy
	 * @returns {Object} - Target {x, y}
	 */
    getTargetForEnemy(enemy) {
        return this.getTargetForState(enemy, enemy.mode || this.currentMode);
    }

    getAlphaChaseTarget(player) {
        return { x: player.gridX, y: player.gridY };
    }

    getBetaChaseTarget(player) {
        let targetX = player.gridX + player.direction.x * enemyAIConfig.betaLookAheadTiles;
        const targetY = player.gridY + player.direction.y * enemyAIConfig.betaLookAheadTiles;

        if (player.direction.y === -1) {
            targetX -= enemyAIConfig.betaLookAheadTiles;
        }

        return { x: targetX, y: targetY };
    }

    getGammaChaseTarget(player) {
        const alpha = this.gameModel.getGhostByType?.('alpha');
        const pivotX = player.gridX + player.direction.x * enemyAIConfig.gammaPivotLookAheadTiles;
        const pivotY = player.gridY + player.direction.y * enemyAIConfig.gammaPivotLookAheadTiles;

        if (alpha) {
            return {
                x: pivotX + (pivotX - alpha.gridX),
                y: pivotY + (pivotY - alpha.gridY)
            };
        }
        return { x: pivotX, y: pivotY };
    }

    getDeltaChaseTarget(player, enemy) {
        const dist = getDistance(enemy.gridX, enemy.gridY, player.gridX, player.gridY);

        if (dist > enemyAIConfig.deltaChaseDistanceThreshold) {
            return { x: player.gridX, y: player.gridY };
        }

        return scatterTargets.delta;
    }

    /**
	 * Reverse enemy direction
	 * @param {GhostState} enemy - Enemy to reverse
	 */
    reverseEnemy(enemy) {
        if (enemy.direction !== directions.NONE) {
            const opposite = getOpposite(enemy.direction);
            enemy.direction = opposite;
        }
    }

    /**
	 * Get tile center position
	 * @param {number} gridX - Grid X
	 * @param {number} gridY - Grid Y
	 * @returns {Object} - Center position {x, y}
	 */
    getTileCenter(gridX, gridY) {
        const tileSize = gameConfig.tileSize;
        return {
            x: gridX * tileSize + tileSize / 2,
            y: gridY * tileSize + tileSize / 2
        };
    }

    chooseDirection(enemy) {
        return this.chooseDirectionForState(enemy, this.resolveAIState(enemy));
    }

    /**
	 * Reset AI state
	 */
    reset() {
        this.modeTimer = 0;
        this.modeIndex = 0;
        this.currentMode = ghostModes.SCATTER;
    }
}
