import { DebugOverlay } from '../../src/systems/DebugOverlay.js';

describe('DebugOverlay', () => {
  let overlay;
  let mockScene;

  beforeEach(() => {
    mockScene = {
      add: {
        text: jest.fn(() => ({
          setOrigin: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis()
        }))
      },
      scale: { width: 560, height: 620 }
    };

    overlay = new DebugOverlay(mockScene);
  });

  describe('initialization', () => {
    test('should create overlay with scene', () => {
      expect(overlay.scene).toBe(mockScene);
    });

    test('should be initially hidden', () => {
      expect(overlay.visible).toBe(false);
    });
  });

  describe('visibility', () => {
    test('should show overlay when enabled', () => {
      overlay.setVisible(true);

      expect(overlay.visible).toBe(true);
    });

    test('should hide overlay when disabled', () => {
      overlay.setVisible(true);
      overlay.setVisible(false);

      expect(overlay.visible).toBe(false);
    });
  });

  describe('FPS counter', () => {
    test('should update FPS display', () => {
      overlay.updateFPS(60);

      expect(overlay.fpsText.setText).toHaveBeenCalledWith(expect.stringContaining('60'));
    });

    test('should format FPS correctly', () => {
      overlay.updateFPS(59.5);

      expect(overlay.fpsText.setText).toHaveBeenCalled();
    });
  });

  describe('debug info', () => {
    test('should update debug information', () => {
      const debugInfo = {
        score: 1000,
        level: 2,
        lives: 3
      };

      overlay.updateDebugInfo(debugInfo);

      expect(overlay.debugText.setText).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    test('should not update when hidden', () => {
      overlay.update(16.67);

      expect(overlay.fpsText.setText).not.toHaveBeenCalled();
    });

    test('should increment frame count when visible', () => {
      overlay.setVisible(true);
      overlay.update(16.67);

      expect(overlay.frameCount).toBeGreaterThan(0);
    });
  });

  describe('positioning', () => {
    test('should position overlay in top-left corner', () => {
      expect(overlay.fpsText.setOrigin).toHaveBeenCalledWith(0, 0);
    });

    test('should set depth above other elements', () => {
      expect(overlay.fpsText.setDepth).toHaveBeenCalledWith(1000);
    });
  });

  describe('cleanup', () => {
    test('should hide overlay on cleanup', () => {
      overlay.setVisible(true);
      overlay.cleanup();

      expect(overlay.visible).toBe(false);
    });
  });
});
