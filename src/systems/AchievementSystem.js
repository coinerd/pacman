import { gameEvents, GAME_EVENTS } from '../core/EventBus.js';

export const ACHIEVEMENTS = {
    first_pellet: {
        id: 'first_pellet',
        name: 'First Bite',
        description: 'Eat your first pellet',
        icon: '🍒',
        condition: (state) => state.pelletsEaten >= 1
    },
    score_hunter: {
        id: 'score_hunter',
        name: 'Score Hunter',
        description: 'Score 10,000 points',
        icon: '🎯',
        condition: (state) => state.score >= 10000
    },
    ghost_buster: {
        id: 'ghost_buster',
        name: 'Ghost Buster',
        description: 'Eat 100 ghosts',
        icon: '👻',
        condition: (state) => state.ghostsEaten >= 100
    },
    perfect_level: {
        id: 'perfect_level',
        name: 'Perfect Level',
        description: 'Complete a level without dying',
        icon: '⭐',
        condition: (state) => state.levelComplete && state.levelDeaths === 0
    },
    power_hunter: {
        id: 'power_hunter',
        name: 'Power Hunter',
        description: 'Eat all 4 ghosts in one power pellet',
        icon: '⚡',
        condition: (state) => state.maxComboGhosts >= 4
    },
    combo_master: {
        id: 'combo_master',
        name: 'Combo Master',
        description: 'Get a 3x ghost combo',
        icon: '🔥',
        condition: (state) => state.maxComboGhosts >= 3
    },
    survivalist: {
        id: 'survivalist',
        name: 'Survivalist',
        description: 'Complete level 5',
        icon: '🏆',
        condition: (state) => state.level >= 5
    },
    fruit_collector: {
        id: 'fruit_collector',
        name: 'Fruit Collector',
        description: 'Collect 10 fruits',
        icon: '🍎',
        condition: (state) => state.fruitsCollected >= 10
    }
};

export class AchievementSystem {
    constructor() {
        this.unlocked = new Set();
        this.progress = new Map();
        this.notificationQueue = [];
        this.showNotificationDuration = 3000;
        this.storage = typeof window !== 'undefined' ? window.localStorage : null;
    }

    init() {
        if (this.storage) {
            const saved = this.storage.getItem('pacman_achievements');
            if (saved) {
                try {
                    const unlockedIds = JSON.parse(saved);
                    unlockedIds.forEach(id => this.unlocked.add(id));
                } catch (e) {
                    console.warn('Error loading achievements:', e);
                }
            }
        }
    }

    check(state) {
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            if (this.unlocked.has(id)) {continue;}

            try {
                const isUnlocked = achievement.condition(state);

                if (isUnlocked && !this.unlocked.has(id)) {
                    this.unlock(id);
                }
            } catch (e) {
                console.warn(`Error checking achievement ${id}:`, e);
            }
        }
    }

    unlock(id) {
        if (this.unlocked.has(id)) {return;}

        this.unlocked.add(id);
        this.save();

        const achievement = ACHIEVEMENTS[id];
        if (achievement) {
            this.queueNotification(achievement);
        }
    }

    queueNotification(achievement) {
        this.notificationQueue.push(achievement);

        if (this.notificationQueue.length === 1) {
            this.showNextNotification();
        }
    }

    showNextNotification() {
        if (this.notificationQueue.length === 0) {return;}

        const achievement = this.notificationQueue.shift();

        gameEvents.emit(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, achievement);

        setTimeout(() => {
            this.showNextNotification();
        }, this.showNotificationDuration);
    }

    save() {
        if (this.storage) {
            try {
                this.storage.setItem('pacman_achievements', JSON.stringify([...this.unlocked]));
            } catch (e) {
                console.warn('Error saving achievements:', e);
            }
        }
    }

    getUnlocked() {
        return [...this.unlocked].map(id => ACHIEVEMENTS[id]).filter(Boolean);
    }

    getProgress() {
        const progress = {};
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            progress[id] = {
                ...achievement,
                isUnlocked: this.unlocked.has(id),
                currentProgress: this.progress.get(id) || 0
            };
        }
        return progress;
    }

    reset() {
        this.unlocked.clear();
        this.progress.clear();
        this.save();
    }
}
