import { adaptiveDifficultyConfig } from '../../config/gameConfig.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class AdaptiveDifficultySystem {
    constructor(gameScene) {
        this.scene = gameScene;
        this.config = adaptiveDifficultyConfig;

        this.currentScore = 0.5;
        this.pendingProfile = null;
        this.appliedProfile = { ...this.config.defaults };

        this.window = {
            survivalSeconds: 0,
            enemyKills: 0,
            playerDeaths: 0,
            travelledDistanceTiles: 0,
            startedWithPellets: 0,
            sectionTransitions: 0,
            successfulSections: 0
        };

        this.previousPacman = null;
        this.lastSectionIndex = 0;
    }

    resetForRound(snapshot) {
        this.window = {
            ...this.window,
            survivalSeconds: 0,
            enemyKills: 0,
            playerDeaths: 0,
            travelledDistanceTiles: 0,
            startedWithPellets: snapshot?.totalPellets || 0,
            sectionTransitions: 0,
            successfulSections: 0
        };
        this.previousPacman = snapshot?.pacman || null;
        this.lastSectionIndex = this.getSectionIndex(snapshot);
    }

    update(deltaSeconds, snapshot, events = []) {
        if (!snapshot || snapshot.isPaused || snapshot.isGameOver) {
            return;
        }

        this.window.survivalSeconds += deltaSeconds;
        this.trackDistance(snapshot);

        let hasBoundary = false;

        for (const event of events) {
            if (event.type === 'ghostEaten' || event.type === 'ghost_eaten') {
                this.window.enemyKills++;
            }

            if (event.type === 'pacmanDied' || event.type === 'pacman_died') {
                this.window.playerDeaths++;
                this.finalizeWindow('life-lost');
                hasBoundary = true;
            }
        }

        const nextSectionIndex = this.getSectionIndex(snapshot);
        if (nextSectionIndex > this.lastSectionIndex) {
            this.window.sectionTransitions++;
            if (this.window.playerDeaths === 0) {
                this.window.successfulSections++;
            }
            this.finalizeWindow('section-complete');
            this.lastSectionIndex = nextSectionIndex;
            hasBoundary = true;
        }

        if (snapshot.levelComplete) {
            this.finalizeWindow('round-complete');
            hasBoundary = true;
        }

        if (hasBoundary) {
            this.applyPendingProfile();
        }
    }

    trackDistance(snapshot) {
        const pacman = snapshot.pacman;
        if (!pacman) {
            return;
        }

        if (!this.previousPacman) {
            this.previousPacman = pacman;
            return;
        }

        const dx = pacman.gridX - this.previousPacman.gridX;
        const dy = pacman.gridY - this.previousPacman.gridY;
        const stepDistance = Math.sqrt(dx * dx + dy * dy);
        this.window.travelledDistanceTiles += Number.isFinite(stepDistance) ? stepDistance : 0;

        this.previousPacman = pacman;
    }

    getSectionIndex(snapshot) {
        const totalPellets = snapshot?.totalPellets || this.window.startedWithPellets || 1;
        const eaten = Math.max(0, totalPellets - (snapshot?.pelletsRemaining || 0));
        const ratio = eaten / Math.max(1, totalPellets);

        const thresholdIndex = this.config.sectionPelletThresholds.findIndex((threshold) => ratio <= threshold);
        return thresholdIndex === -1 ? this.config.sectionPelletThresholds.length : thresholdIndex;
    }

    finalizeWindow(reason) {
        const telemetry = this.getTelemetrySnapshot();

        const survivalScore = clamp(telemetry.survivalSeconds / 45, 0, 1);
        const combatScore = clamp((telemetry.enemyKills - telemetry.playerDeaths) / 4 + 0.5, 0, 1);
        const movementScore = clamp(telemetry.travelledDistanceTiles / 140, 0, 1);
        const sectionSuccess = clamp(telemetry.sectionSuccessRate, 0, 1);

        const rawScore = (survivalScore * 0.3)
            + (combatScore * 0.3)
            + (movementScore * 0.15)
            + (sectionSuccess * 0.25);

        this.currentScore = (this.config.emaAlpha * rawScore)
            + ((1 - this.config.emaAlpha) * this.currentScore);

        this.pendingProfile = this.buildProfile(this.currentScore);

        this.window.survivalSeconds = 0;
        this.window.enemyKills = 0;
        this.window.playerDeaths = 0;
        this.window.travelledDistanceTiles = 0;

        this.scene?.debugOverlay?.setMeta?.('adaptiveDifficultyReason', reason);
    }

    buildProfile(score) {
        const clamps = this.config.clamps;
        return {
            enemySpeedBand: clamp(0.85 + score * 0.4, clamps.enemySpeedBand.min, clamps.enemySpeedBand.max),
            scatterDuration: clamp(9 - score * 4, clamps.scatterDuration.min, clamps.scatterDuration.max),
            randomness: clamp(0.03 + score * 0.35, clamps.randomness.min, clamps.randomness.max),
            mazeComplexity: clamp(0.85 + score * 0.3, clamps.mazeComplexity.min, clamps.mazeComplexity.max)
        };
    }

    applyPendingProfile() {
        if (!this.pendingProfile) {
            return;
        }

        const profile = this.pendingProfile;
        this.pendingProfile = null;

        const movementSystem = this.scene?.gameModel?.movementSystem;
        const aiController = movementSystem?.getAIController?.();

        const modeDurations = [
            { mode: 'SCATTER', duration: profile.scatterDuration },
            { mode: 'CHASE', duration: 20 },
            { mode: 'SCATTER', duration: profile.scatterDuration },
            { mode: 'CHASE', duration: 20 },
            { mode: 'SCATTER', duration: Math.max(4, profile.scatterDuration - 1) },
            { mode: 'CHASE', duration: 20 },
            { mode: 'SCATTER', duration: Math.max(4, profile.scatterDuration - 1) },
            { mode: 'CHASE', duration: Infinity }
        ];

        aiController?.setModeDurations?.(modeDurations);
        aiController?.setRandomnessFactor?.(profile.randomness);

        const entities = movementSystem?.getAllPositions?.() || [];
        for (const entity of entities) {
            if (entity.type === 'ai') {
                movementSystem.setSpeedMultiplier(entity.entityId, profile.enemySpeedBand);
            }
        }

        this.appliedProfile = profile;
    }

    getActiveProfile() {
        return this.appliedProfile;
    }

    getTelemetrySnapshot() {
        const transitions = Math.max(1, this.window.sectionTransitions);
        return {
            survivalSeconds: this.window.survivalSeconds,
            enemyKills: this.window.enemyKills,
            playerDeaths: this.window.playerDeaths,
            travelledDistanceTiles: this.window.travelledDistanceTiles,
            sectionSuccessRate: this.window.successfulSections / transitions,
            difficultyScore: this.currentScore
        };
    }
}
