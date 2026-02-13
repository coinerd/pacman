import { bossConfig, virusCore } from '../config/gameConfig.js';
import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';

export default class BossBattleSystem {
    constructor(gameModel) {
        this.gameModel = gameModel;

        this.currentBoss = null;
        this.bossHealth = 0;
        this.bossMaxHealth = 0;
        this.bossPhase = 1;
        this.bossType = null;
        this.isBossActive = false;
        this.phaseTimer = 0;
        this.bossStartTime = 0;
    }

    spawnBoss(bossType, level) {
        if (this.isBossActive) {
            return null;
        }

        const config = bossConfig.bossTypes[bossType];
        if (!config) {
            return null;
        }

        this.bossType = bossType;
        this.bossMaxHealth = config.health;
        this.bossHealth = config.health;
        this.bossPhase = 1;
        this.bossStartTime = Date.now();
        this.isBossActive = true;
        this.phaseTimer = 0;

        const boss = this.createBossEntity(bossType, level);
        this.currentBoss = boss;

        gameEvents.emit(GAME_EVENTS.BOSS_SPAWNED, {
            bossType,
            level,
            position: { x: boss.gridX, y: boss.gridY }
        });

        return boss;
    }

    createBossEntity(bossType, level) {
        const startPos = virusCore.entrance;

        return {
            isBoss: true,
            bossType,
            gridX: startPos.x,
            gridY: startPos.y,
            x: startPos.x * 20,
            y: startPos.y * 20,
            prevX: startPos.x * 20,
            prevY: startPos.y * 20,
            prevGridX: startPos.x,
            prevGridY: startPos.y,
            direction: { x: 0, y: 0, angle: 0 },
            health: this.bossMaxHealth,
            phase: this.bossPhase,
            level,
            isFrightened: false,
            isEaten: false
        };
    }

    update(deltaTime) {
        if (!this.isBossActive || !this.currentBoss) {
            return;
        }

        this.phaseTimer += deltaTime;

        if (this.shouldPhaseChange()) {
            this.nextPhase();
        }

        this.updateBossBehavior(deltaTime);
    }

    shouldPhaseChange() {
        const config = bossConfig.bossTypes[this.bossType];
        if (!config || !config.phaseTransitionHealth) {
            return false;
        }

        const healthPercentage = this.bossHealth / this.bossMaxHealth;
        const phaseIndex = this.bossPhase - 1;

        if (phaseIndex >= config.phaseTransitionHealth.length) {
            return false;
        }

        const threshold = config.phaseTransitionHealth[phaseIndex];
        return healthPercentage <= threshold;
    }

    nextPhase() {
        if (this.bossPhase < 3) {
            this.bossPhase++;

            if (this.currentBoss) {
                this.currentBoss.phase = this.bossPhase;
            }

            gameEvents.emit(GAME_EVENTS.BOSS_PHASE_CHANGED, {
                bossType: this.bossType,
                phase: this.bossPhase,
                health: this.bossHealth,
                maxHealth: this.bossMaxHealth
            });
        }
    }

    damageBoss(amount) {
        if (!this.isBossActive || this.bossHealth <= 0) {
            return false;
        }

        this.bossHealth -= amount;

        if (this.bossHealth < 0) {
            this.bossHealth = 0;
        }

        if (this.currentBoss) {
            this.currentBoss.health = this.bossHealth;
        }

        gameEvents.emit(GAME_EVENTS.BOSS_DAMAGED, {
            bossType: this.bossType,
            currentHealth: this.bossHealth,
            maxHealth: this.bossMaxHealth,
            damageAmount: amount
        });

        if (this.bossHealth <= 0) {
            this.defeatBoss();
            return true;
        }

        if (this.shouldPhaseChange()) {
            this.nextPhase();
        }

        return true;
    }

    defeatBoss() {
        if (!this.isBossActive) {
            return;
        }

        const config = bossConfig.bossTypes[this.bossType];
        const timeTaken = (Date.now() - this.bossStartTime) / 1000;

        this.gameModel.score += config.scoreBonus;

        gameEvents.emit(GAME_EVENTS.BOSS_DEFEATED, {
            bossType: this.bossType,
            scoreBonus: config.scoreBonus,
            timeTaken,
            finalScore: this.gameModel.score
        });

        this.reset();
    }

    reset() {
        this.currentBoss = null;
        this.bossHealth = 0;
        this.bossMaxHealth = 0;
        this.bossPhase = 1;
        this.bossType = null;
        this.isBossActive = false;
        this.phaseTimer = 0;
        this.bossStartTime = 0;
    }

    updateBossBehavior(deltaTime) {
        if (!this.currentBoss) {
            return;
        }

        const boss = this.currentBoss;

        switch (this.bossType) {
        case 'alpha':
            this.updateAlphaBoss(boss, deltaTime);
            break;
        case 'beta':
            this.updateBetaBoss(boss, deltaTime);
            break;
        case 'gamma':
            this.updateGammaBoss(boss, deltaTime);
            break;
        case 'delta':
            this.updateDeltaBoss(boss, deltaTime);
            break;
        }
    }

    updateAlphaBoss(boss, _deltaTime) {
        if (this.bossPhase === 1) {
            boss.speedMultiplier = 1.0;
        } else {
            boss.speedMultiplier = 1.5;
        }
    }

    updateBetaBoss(boss, _deltaTime) {
        if (this.bossPhase === 1) {
            boss.speedMultiplier = 1.0;
        } else if (this.bossPhase === 2) {
            boss.speedMultiplier = 1.2;
        } else {
            boss.speedMultiplier = 1.0;
        }
    }

    updateGammaBoss(boss, _deltaTime) {
        if (this.bossPhase === 1) {
            const variableSpeed = 0.5 + Math.random();
            boss.speedMultiplier = variableSpeed;
        } else {
            boss.speedMultiplier = 1.0;
        }
    }

    updateDeltaBoss(boss, _deltaTime) {
        if (this.bossPhase === 1) {
            boss.speedMultiplier = 0.8;
        } else {
            boss.speedMultiplier = 1.0;
        }
    }

    shouldSpawnBoss(level) {
        return bossConfig.spawnLevels.includes(level);
    }

    getBossTypeForLevel(level) {
        const levelIndex = bossConfig.spawnLevels.indexOf(level);
        if (levelIndex === -1) {
            return null;
        }

        const bossTypes = Object.keys(bossConfig.bossTypes);
        return bossTypes[levelIndex % bossTypes.length];
    }

    getBossHealth() {
        return this.bossHealth;
    }

    getBossMaxHealth() {
        return this.bossMaxHealth;
    }

    getBossPhase() {
        return this.bossPhase;
    }

    getBossType() {
        return this.bossType;
    }

    isBossBattleActive() {
        return this.isBossActive;
    }

    getBossEntity() {
        return this.currentBoss;
    }

    getBossConfig() {
        if (!this.bossType) {
            return null;
        }
        return bossConfig.bossTypes[this.bossType];
    }

    getSnapshot() {
        return {
            isBossActive: this.isBossActive,
            bossType: this.bossType,
            bossHealth: this.bossHealth,
            bossMaxHealth: this.bossMaxHealth,
            bossPhase: this.bossPhase,
            boss: this.currentBoss
        };
    }
}
