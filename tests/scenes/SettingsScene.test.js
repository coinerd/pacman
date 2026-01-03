import SettingsScene from '../../src/scenes/SettingsScene.js';
import { createMockScene } from '../utils/testHelpers.js';
import { StorageManager } from '../../src/managers/StorageManager.js';

describe('SettingsScene', () => {
  let scene;
  let mockGetSettings;
  let mockSaveSettings;

  beforeEach(() => {
    global.Phaser = {
      Math: {
        Clamp: (val, min, max) => Math.max(min, Math.min(max, val))
      }
    };

    mockGetSettings = jest.spyOn(StorageManager.prototype, 'getSettings').mockReturnValue({
      soundEnabled: true,
      volume: 0.5,
      showFps: false,
      difficulty: 'Normal'
    });
    mockSaveSettings = jest.spyOn(StorageManager.prototype, 'saveSettings');

    scene = new SettingsScene();
    scene.scale = { width: 560, height: 620 };
    scene.add = {
      rectangle: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn(),
        fillColor: 0
      })),
      text: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn()
      })),
      circle: jest.fn(() => ({
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn()
      }))
    };
    scene.input = {
      keyboard: {
        on: jest.fn()
      }
    };
    scene.scene = {
      start: jest.fn()
    };

    scene.init();
    scene.create();
  });

  afterEach(() => {
    mockGetSettings.mockRestore();
    mockSaveSettings.mockRestore();
  });

  describe('initialization', () => {
    test('should load default settings when none saved', () => {
      expect(scene.settings).toEqual({
        soundEnabled: true,
        volume: 0.5,
        showFps: false,
        difficulty: 'Normal'
      });
    });

    test('should load saved settings from localStorage', () => {
      const savedSettings = {
        soundEnabled: false,
        volume: 0.8,
        showFps: true,
        difficulty: 'Hard'
      };
      mockGetSettings.mockReturnValue(savedSettings);

      const scene2 = new SettingsScene();
      scene2.scale = { width: 560, height: 620 };
      scene2.add = scene.add;
      scene2.input = scene.input;
      scene2.scene = scene.scene;
      scene2.init();
      scene2.create();

      expect(scene2.settings.soundEnabled).toBe(false);
      expect(scene2.settings.volume).toBe(0.8);
      expect(scene2.settings.showFps).toBe(true);
      expect(scene2.settings.difficulty).toBe('Hard');
    });
  });

  describe('toggle functionality', () => {
    test('should toggle boolean settings', () => {
      const initialValue = scene.settings.soundEnabled;
      scene.toggleSetting('soundEnabled');

      expect(scene.settings.soundEnabled).toBe(!initialValue);
    });

    test('should save settings after toggle', () => {
      scene.toggleSetting('soundEnabled');

      expect(mockSaveSettings).toHaveBeenCalled();
    });
  });

  describe('slider functionality', () => {
    test('should update volume setting', () => {
      scene.updateVolume(0.75);

      expect(scene.settings.volume).toBe(0.75);
    });

    test('should save settings after volume update', () => {
      scene.updateVolume(0.75);

      expect(mockSaveSettings).toHaveBeenCalled();
    });

    test('should clamp volume between 0 and 1', () => {
      scene.updateVolume(1.5);
      expect(scene.settings.volume).toBe(1);

      scene.updateVolume(-0.5);
      expect(scene.settings.volume).toBe(0);
    });
  });

  describe('difficulty setting', () => {
    test('should change difficulty', () => {
      scene.setDifficulty('Hard');

      expect(scene.settings.difficulty).toBe('Hard');
    });

    test('should save settings after difficulty change', () => {
      scene.setDifficulty('Easy');

      expect(mockSaveSettings).toHaveBeenCalled();
    });

    test('should accept valid difficulty levels', () => {
      const difficulties = ['Easy', 'Normal', 'Hard'];
      difficulties.forEach(diff => {
        scene.setDifficulty(diff);
        expect(scene.settings.difficulty).toBe(diff);
      });
    });
  });

  describe('scene transitions', () => {
    test('should return to menu scene', () => {
      scene.returnToMenu();

      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
    });
  });

  describe('settings object', () => {
    test('should get current settings', () => {
      const settings = scene.getSettings();

      expect(settings).toHaveProperty('soundEnabled');
      expect(settings).toHaveProperty('volume');
      expect(settings).toHaveProperty('showFps');
      expect(settings).toHaveProperty('difficulty');
    });

    test('should reset settings to defaults', () => {
      scene.settings.soundEnabled = false;
      scene.settings.volume = 0.9;
      scene.resetSettings();

      expect(scene.settings.soundEnabled).toBe(true);
      expect(scene.settings.volume).toBe(0.5);
    });
  });
});
