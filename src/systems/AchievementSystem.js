import { GAME_EVENTS, gameEvents } from '../core/EventBus.js';

export const ACHIEVEMENTS = {
    first_data_bit: {
        id: 'first_data_bit',
        name: 'First Data Bit',
        description: 'Collect your first data bit',
        icon: '◉',
        condition: (state) => state.pelletsEaten >= 1
    },
    score_hunter: {
        id: 'score_hunter',
        name: 'Score Hunter',
        description: 'Score 10,000 points',
        icon: '⌖',
        condition: (state) => state.score >= 10000
    },
    virus_eliminator: {
        id: 'virus_eliminator',
        name: 'Virus Eliminator',
        description: 'Eliminate 100 viruses',
        icon: '⚠',
        condition: (state) => state.ghostsEaten >= 100
    },
    clean_sweep: {
        id: 'clean_sweep',
        name: 'Clean Sweep',
        description: 'Complete a level without system crash',
        icon: '★',
        condition: (state) => state.levelComplete && state.levelDeaths === 0
    },
    firewall_breaker: {
        id: 'firewall_breaker',
        name: 'Firewall Breaker',
        description: 'Eliminate all 4 viruses in one power packet',
        icon: '⚡',
        condition: (state) => state.maxComboGhosts >= 4
    },
    virus_hunter: {
        id: 'virus_hunter',
        name: 'Virus Hunter',
        description: 'Get a 3x virus combo',
        icon: '⧫',
        condition: (state) => state.maxComboGhosts >= 3
    },
    data_master: {
        id: 'data_master',
        name: 'Data Master',
        description: 'Complete system level 5',
        icon: '◈',
        condition: (state) => state.level >= 5
    },
    fragment_collector: {
        id: 'fragment_collector',
        name: 'Fragment Collector',
        description: 'Collect 10 data fragments',
        icon: '⬢',
        condition: (state) => state.fruitsCollected >= 10
    }
};

export class AchievementSystem {
    constructor(scene) {
        this.scene = scene;
        this.unlocked = new Set();
        this.progress = new Map();
        this.notificationQueue = [];
        this.showNotificationDuration = 3000;
        this.storage = typeof window !== 'undefined' ? window.localStorage : null;
    }

    init() {
        if (this.storage) {
            const saved = this.storage.getItem('adawoman_achievements');
            if (saved) {
                try {
                    const unlockedIds = JSON.parse(saved);
                    unlockedIds.forEach((id) => {
                        this.unlocked.add(id);
                    });
                } catch (e) {
                    console.warn('Error loading achievements:', e);
                }
            }
        }
    }

    check(state) {
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            if (this.unlocked.has(id)) {
                continue;
            }

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
        if (this.unlocked.has(id)) {
            return;
        }

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
        if (this.notificationQueue.length === 0) {
            return;
        }

        const achievement = this.notificationQueue.shift();

        gameEvents.emit(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, achievement);

        if (this.scene && this.scene.time) {
            this.scene.time.delayedCall(this.showNotificationDuration, () => {
                this.showNextNotification();
            });
        }
    }

    save() {
        if (this.storage) {
            try {
                this.storage.setItem(
                    'adawoman_achievements',
                    JSON.stringify([...this.unlocked])
                );
            } catch (e) {
                console.warn('Error saving achievements:', e);
            }
        }
    }

    getUnlocked() {
        return [...this.unlocked].map((id) => ACHIEVEMENTS[id]).filter(Boolean);
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
