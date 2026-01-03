import { AchievementSystem, ACHIEVEMENTS } from '../../src/systems/AchievementSystem.js';

describe('AchievementSystem', () => {
  let system;
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      getItem: jest.fn().mockReturnValue('[]'),
      setItem: jest.fn()
    };

    system = new AchievementSystem();
    system.storage = mockStorage;
    system.init();
  });

  afterEach(() => {
    system.save = jest.fn();
  });

  describe('initialization', () => {
    test('should initialize with empty unlocked set', () => {
      expect(system.unlocked).toBeInstanceOf(Set);
      expect(system.unlocked.size).toBe(0);
    });

    test('should initialize with empty progress map', () => {
      expect(system.progress).toBeInstanceOf(Map);
      expect(system.progress.size).toBe(0);
    });

    test('should initialize with empty notification queue', () => {
      expect(system.notificationQueue).toEqual([]);
    });
  });

  describe('achievement checking', () => {
    test('should unlock FIRST_PELLET on first pellet', () => {
      const state = { pelletsEaten: 1 };

      system.check(state);

      expect(system.unlocked.has('first_pellet')).toBe(true);
    });

    test('should unlock SCORE_HUNTER on 10000 points', () => {
      const state = { score: 10000 };

      system.check(state);

      expect(system.unlocked.has('score_hunter')).toBe(true);
    });

    test('should unlock GHOST_BUSTER on 100 ghosts', () => {
      const state = { ghostsEaten: 100 };

      system.check(state);

      expect(system.unlocked.has('ghost_buster')).toBe(true);
    });

    test('should unlock PERFECT_LEVEL on level completion without death', () => {
      const state = { levelDeaths: 0, levelComplete: true };

      system.check(state);

      expect(system.unlocked.has('perfect_level')).toBe(true);
    });

    test('should unlock POWER_HUNTER on 4 ghost combo', () => {
      const state = { maxComboGhosts: 4 };

      system.check(state);

      expect(system.unlocked.has('power_hunter')).toBe(true);
    });

    test('should not unlock achievement if already unlocked', () => {
      system.unlocked.add('first_pellet');
      const initialSize = system.unlocked.size;

      system.check({ pelletsEaten: 1 });

      expect(system.unlocked.size).toBe(initialSize);
    });
  });

  describe('notification queuing', () => {
    test('should queue achievements when unlocked', () => {
      const state = { pelletsEaten: 1, score: 10000 };

      system.check(state);

      expect(system.unlocked.size).toBeGreaterThan(0);
    });

    test('should not queue duplicate notifications', () => {
      const state = { pelletsEaten: 1 };

      system.check(state);
      system.check(state);

      expect(system.unlocked.has('first_pellet')).toBe(true);
    });
  });

  describe('persistence', () => {
    test('should load unlocked achievements from storage', () => {
      const savedAchievements = ['first_pellet', 'perfect_level'];
      mockStorage.getItem.mockReturnValue(JSON.stringify(savedAchievements));

      const newSystem = new AchievementSystem();
      newSystem.storage = mockStorage;
      newSystem.init();

      expect(newSystem.unlocked.has('first_pellet')).toBe(true);
      expect(newSystem.unlocked.has('perfect_level')).toBe(true);
    });

    test('should save newly unlocked achievements', () => {
      mockStorage.getItem.mockReturnValue('[]');

      const newSystem = new AchievementSystem();
      newSystem.storage = mockStorage;
      newSystem.init();
      newSystem.check({ pelletsEaten: 1 });

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'pacman_achievements',
        expect.stringContaining('first_pellet')
      );
    });
  });

  describe('achievement constants', () => {
    test('should have ACHIEVEMENTS defined', () => {
      expect(ACHIEVEMENTS).toBeDefined();
      expect(typeof ACHIEVEMENTS).toBe('object');
    });

    test('should have all required achievement IDs', () => {
      const requiredIds = ['first_pellet', 'score_hunter', 'ghost_buster', 'perfect_level', 'power_hunter'];
      requiredIds.forEach(id => {
        expect(ACHIEVEMENTS[id]).toBeDefined();
      });
    });

    test('should have achievement properties', () => {
      const achievement = ACHIEVEMENTS.first_pellet;
      expect(achievement).toHaveProperty('name');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('condition');
      expect(typeof achievement.condition).toBe('function');
    });
  });

  describe('get unlocked achievements', () => {
    test('should return unlocked achievements', () => {
      system.unlocked.add('first_pellet');
      system.unlocked.add('score_hunter');

      const unlocked = system.getUnlocked();

      expect(unlocked).toHaveLength(2);
      expect(unlocked[0].id).toBe('first_pellet');
      expect(unlocked[1].id).toBe('score_hunter');
    });
  });

  describe('get progress', () => {
    test('should return progress for all achievements', () => {
      system.progress.set('first_pellet', 1);

      const progress = system.getProgress();

      expect(progress).toHaveProperty('first_pellet');
      expect(progress.first_pellet).toHaveProperty('isUnlocked');
      expect(progress.first_pellet).toHaveProperty('currentProgress');
    });
  });

  describe('reset', () => {
    test('should clear all unlocked achievements', () => {
      system.unlocked.add('first_pellet');

      system.reset();

      expect(system.unlocked.size).toBe(0);
    });

    test('should clear all progress', () => {
      system.progress.set('first_pellet', 1);

      system.reset();

      expect(system.progress.size).toBe(0);
    });
  });
});
