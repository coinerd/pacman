/**
 * GameState
 * Reine Zustandsverwaltung für das Spiel.
 * Verwaltet alle Spielzustände und Flags ohne externe Abhängigkeiten.
 */

import { SessionModule, ScoreModule } from '../systems/index.js';

export class GameState {
    /**
     * @param {Object} config - Konfiguration
     * @param {number} config.level - Start-Level
     * @param {number} config.lives - Start-Leben
     * @param {number} config.score - Start-Score
     * @param {number} config.highScore - High Score
     */
    constructor(config = {}) {
        // Module
        this.sessionModule = new SessionModule({
            level: config.level || 1,
            lives: config.lives || 3
        });
        this.scoreModule = new ScoreModule({
            score: config.score || 0,
            highScore: config.highScore || 0
        });

        // Maze-Zustand
        this.maze = null;
        this.pelletGrid = null;
        this.totalPellets = 0;
        this.pelletsRemaining = 0;

        // Level-Konfiguration
        this.levelConfig = null;

        // Timers
        this.deathTimer = 0;
        this.deathPauseDuration = config.deathPauseDuration ?? 2;

        // Frame/Tick Counter
        this.tickCount = 0;

        // Dying state
        this.isDying = false;

        // Profiling
        this.lastUpdateTime = 0;
        this.updateCount = 0;
    }

    // === Level & Session ===

    get level() {
        return this.sessionModule.level;
    }

    set level(value) {
        this.sessionModule.level = value;
    }

    get lives() {
        return this.sessionModule.lives;
    }

    set lives(value) {
        this.sessionModule.lives = value;
    }

    get levelDeaths() {
        return this.sessionModule.levelDeaths;
    }

    set levelDeaths(value) {
        this.sessionModule.levelDeaths = value;
    }

    // === Score ===

    get score() {
        return this.scoreModule.score;
    }

    set score(value) {
        this.scoreModule.score = value;
    }

    get highScore() {
        return this.scoreModule.highScore;
    }

    set highScore(value) {
        this.scoreModule.highScore = value;
    }

    get ghostsEaten() {
        return this.scoreModule.ghostsEaten;
    }

    set ghostsEaten(value) {
        this.scoreModule.ghostsEaten = value;
    }

    get currentComboGhosts() {
        return this.scoreModule.currentComboGhosts;
    }

    set currentComboGhosts(value) {
        this.scoreModule.currentComboGhosts = value;
    }

    get maxComboGhosts() {
        return this.scoreModule.maxComboGhosts;
    }

    set maxComboGhosts(value) {
        this.scoreModule.maxComboGhosts = value;
    }

    get pelletsEaten() {
        return this.scoreModule.pelletsEaten;
    }

    set pelletsEaten(value) {
        this.scoreModule.pelletsEaten = value;
    }

    // === Flags ===

    get isPaused() {
        return this.sessionModule.isPaused;
    }

    set isPaused(value) {
        this.sessionModule.isPaused = Boolean(value);
    }

    get isGameOver() {
        return this.sessionModule.isGameOver;
    }

    set isGameOver(value) {
        this.sessionModule.isGameOver = Boolean(value);
    }

    get levelComplete() {
        return this.sessionModule.levelComplete;
    }

    set levelComplete(value) {
        this.sessionModule.levelComplete = Boolean(value);
    }

    // === Maze-Zustand ===

    setMaze(maze, pelletGrid) {
        this.maze = maze;
        this.pelletGrid = pelletGrid;
    }

    setPelletCounts(total, remaining) {
        this.totalPellets = total;
        this.pelletsRemaining = remaining;
    }

    // === Level-Konfiguration ===

    setLevelConfig(config) {
        this.levelConfig = config;
    }

    getLevelConfig() {
        return this.levelConfig;
    }

    // === Timer ===

    startDeathTimer() {
        this.deathTimer = 0;
    }

    updateDeathTimer(deltaSeconds) {
        this.deathTimer += deltaSeconds;
    }

    isDeathComplete() {
        return this.deathTimer >= this.deathPauseDuration;
    }

    // === Tick Counter ===

    incrementTick() {
        this.tickCount++;
    }

    getTick() {
        return this.tickCount;
    }

    // === Profiling ===

    startProfiling() {
        this.lastUpdateTime = performance.now();
        this.updateCount = 0;
    }

    updateProfiling() {
        this.updateCount++;
    }

    getProfilingStats() {
        const elapsed = performance.now() - this.lastUpdateTime;
        return {
            updateCount: this.updateCount,
            updateTime: elapsed,
            avgUpdateMs: elapsed / (this.updateCount || 1)
        };
    }

    // === Reset ===

    resetForLevel(level) {
        this.sessionModule.resetForLevel(level);
        this.scoreModule.resetForLevel(level);
        this.level = level;
        this.levelComplete = false;
        this.levelDeaths = 0;
        this.deathTimer = 0;
    }

    reset() {
        this.sessionModule.reset();
        this.scoreModule.reset();
        this.levelComplete = false;
        this.levelDeaths = 0;
        this.deathTimer = 0;
        this.tickCount = 0;
    }
}
