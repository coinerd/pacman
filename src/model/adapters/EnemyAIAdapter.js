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
    enemyAIConfig,
    enemyAICaps,
    aiWeights,
    enemyProfiles
} from '../../config/gameConfig.js';
import { getDistance, getValidDirections } from '../../utils/MazeLayout.js';
import { createSeededRandomFn } from '../../utils/SeededRandom.js';

export class EnemyAIAdapter {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.modeTimer = 0;
        this.currentMode = ghostModes.SCATTER;
        this.modeDurations = enemyAIConfig.stateCycle.map((cycle) => ({
            mode: cycle.state,
            duration: this.applyPhaseCaps(cycle.state, cycle.duration)
        }));
        this.modeIndex = 0;
        this.reactionCooldowns = new Map();
        this.randomFn = createSeededRandomFn(gameModel?.config?.enemyDecisionSeed || gameModel?.config?.seed || Date.now());
    }

    applyPhaseCaps(mode, duration) {
        if (duration === Infinity) {
            return duration;
        }

        if (mode === ghostModes.CHASE) {
            return Math.min(duration, enemyAICaps.maxPursuitSeconds);
        }

        if (mode === ghostModes.SCATTER) {
            return Math.max(duration, enemyAICaps.minScatterSeconds);
        }

        return duration;
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

        this.tickReactionCooldown(enemy, deltaSeconds);

        const previousState = enemy.aiState || enemy.mode || ghostModes.SCATTER;
        const nextState = this.resolveAIState(enemy);
        this.applyState(enemy, nextState, previousState);

        const isAtDecisionPoint = enemy.moveProgress === 0;
        if (!isAtDecisionPoint || !this.canReact(enemy)) {
            return;
        }

        const direction = this.chooseDirectionForState(enemy, nextState);
        if (direction) {
            enemy.setDirection(direction);
            this.resetReactionCooldown(enemy);
        }
    }

    getProfile(enemy) {
        return enemyProfiles[enemy.ghostType] || enemyProfiles.default;
    }

    getEnemyKey(enemy) {
        return enemy.id || `${enemy.ghostType}-${enemy.startGridX}-${enemy.startGridY}`;
    }

    tickReactionCooldown(enemy, deltaSeconds) {
        const key = this.getEnemyKey(enemy);
        const cooldown = this.reactionCooldowns.get(key) || 0;
        this.reactionCooldowns.set(key, Math.max(0, cooldown - deltaSeconds));
    }

    canReact(enemy) {
        const key = this.getEnemyKey(enemy);
        return (this.reactionCooldowns.get(key) || 0) <= 0;
    }

    resetReactionCooldown(enemy) {
        const profile = this.getProfile(enemy);
        this.reactionCooldowns.set(this.getEnemyKey(enemy), profile.reactionTime ?? 0);
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
        const player = this.gameModel.pacman;
        return this.chooseWeightedDirection(enemy, {
            targetX: enemy.gridX,
            targetY: enemy.gridY,
            playerX: player?.gridX,
            playerY: player?.gridY
        });
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
            return this.getBetaChaseTarget(player, enemy);
        case 'gamma':
            return this.getGammaChaseTarget(player, enemy);
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
        const player = this.gameModel.pacman;
        return this.chooseWeightedDirection(enemy, {
            targetX,
            targetY,
            playerX: player?.gridX,
            playerY: player?.gridY
        });
    }

    chooseWeightedDirection(enemy, context) {
        const filteredDirs = this.getCandidateDirections(enemy);
        if (filteredDirs.length === 0) {
            return null;
        }

        const profile = this.getProfile(enemy);
        const scoredMoves = filteredDirs.map((dir) =>
            this.evaluateDirection(enemy, dir, context, profile)
        );

        scoredMoves.sort((a, b) => b.score - a.score);
        const selectedMove = scoredMoves[0];

        if (gameConfig.debug) {
            const debugSummary = scoredMoves.map((move) => ({
                direction: this.getDirectionName(move.direction),
                score: Number(move.score.toFixed(3)),
                contributions: Object.fromEntries(
                    Object.entries(move.contributions).map(([key, value]) => [
                        key,
                        Number(value.toFixed(3))
                    ])
                )
            }));
            console.debug(`[EnemyAI] ${enemy.ghostType} selected ${this.getDirectionName(selectedMove.direction)}`, debugSummary);
        }

        return selectedMove.direction;
    }

    evaluateDirection(enemy, dir, context, profile) {
        const nextX = enemy.gridX + dir.x;
        const nextY = enemy.gridY + dir.y;
        const opposite = getOpposite(enemy.direction);
        const targetDist = getDistance(nextX, nextY, context.targetX, context.targetY);
        const playerDist =
            Number.isFinite(context.playerX) && Number.isFinite(context.playerY)
                ? getDistance(nextX, nextY, context.playerX, context.playerY)
                : 0;
        const exits = getValidDirections(this.gameModel.maze, nextX, nextY).length;
        const sameDirectionEnemies = this.gameModel.ghosts.filter(
            (ghost) => ghost !== enemy && ghost.direction && ghost.direction.x === dir.x && ghost.direction.y === dir.y
        ).length;

        const contributions = {
            targetDistance: aiWeights.targetDistance * -targetDist * (profile.aggressiveness ?? 1),
            playerDistance:
                aiWeights.playerDistance * profile.playerDistanceBias * playerDist,
            reverse:
                opposite && dir.x === opposite.x && dir.y === opposite.y
                    ? aiWeights.reversePenalty
                    : 0,
            randomness:
                (this.randomFn() - 0.5) * aiWeights.randomness * (profile.randomness ?? profile.randomnessMultiplier ?? 1),
            bottleneck:
                exits <= 2
                    ? aiWeights.bottleneckPenalty * (1 + profile.bottleneckBias)
                    : aiWeights.corridorBonus * (1 - profile.bottleneckBias),
            antiCluster: aiWeights.antiClusterPenalty * sameDirectionEnemies,
            diversity: aiWeights.diversityFactor * this.getDirectionalDiversity(enemy, dir, profile)
        };

        const score = Object.values(contributions).reduce((sum, value) => sum + value, 0);

        return {
            direction: dir,
            score,
            contributions
        };
    }

    getDirectionalDiversity(enemy, dir, profile) {
        const enemyId = enemy.id || enemy.ghostType || 'default';
        const seed = Array.from(enemyId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const directionalHash = seed + dir.x * 13 + dir.y * 17;
        const normalized = ((directionalHash % 11) - 5) / 5;
        return normalized + profile.diversityOffset;
    }

    getDirectionName(dir) {
        if (dir === directions.UP) {return 'UP';}
        if (dir === directions.DOWN) {return 'DOWN';}
        if (dir === directions.LEFT) {return 'LEFT';}
        if (dir === directions.RIGHT) {return 'RIGHT';}
        return 'NONE';
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

    getBetaChaseTarget(player, enemy) {
        const profile = this.getProfile(enemy);
        const lookAhead = Math.max(1, Math.round(profile.predictionHorizon || enemyAIConfig.betaLookAheadTiles));
        let targetX = player.gridX + player.direction.x * lookAhead;
        const targetY = player.gridY + player.direction.y * lookAhead;

        if (player.direction.y === -1) {
            targetX -= lookAhead;
        }

        return { x: targetX, y: targetY };
    }

    getGammaChaseTarget(player, enemy) {
        const profile = this.getProfile(enemy);
        const lookAhead = Math.max(1, Math.round(profile.predictionHorizon || enemyAIConfig.gammaPivotLookAheadTiles));
        const pivotX = player.gridX + player.direction.x * lookAhead;
        const pivotY = player.gridY + player.direction.y * lookAhead;

        const alpha = this.gameModel.getGhostByType?.('alpha') || this.gameModel.ghosts?.find((ghost) => ghost.ghostType === 'alpha');
        if (!alpha) {
            return { x: pivotX, y: pivotY };
        }

        return {
            x: pivotX + (pivotX - alpha.gridX),
            y: pivotY + (pivotY - alpha.gridY)
        };
    }

    getDeltaChaseTarget(player, enemy) {
        const profile = this.getProfile(enemy);
        const controlRadius = Math.max(3, Math.round(enemyAIConfig.deltaChaseDistanceThreshold * profile.aggressiveness));
        const dist = getDistance(enemy.gridX, enemy.gridY, player.gridX, player.gridY);

        if (dist > controlRadius) {
            const flankX = player.gridX + player.direction.x * (profile.predictionHorizon || 2);
            const flankY = player.gridY + player.direction.y * (profile.predictionHorizon || 2);
            return { x: flankX, y: flankY };
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
        this.reactionCooldowns.clear();
    }

    setRandomSeed(seed) {
        this.randomFn = createSeededRandomFn(seed);
    }
}
