import SettingsScene from '../../src/scenes/SettingsScene.js';
import { StorageManager } from '../../src/managers/StorageManager.js';

describe('SettingsScene', () => {
    let scene;
    let mockGetSettings;
    let renderLog;

    const createRendererMock = () => {
        renderLog = [];
        return {
            rectangle: jest.fn((x, y, width, height, fillColor) => {
                renderLog.push({
                    type: 'rectangle',
                    x,
                    y,
                    width,
                    height,
                    fillColor
                });
                return {
                    setOrigin: jest.fn().mockReturnThis(),
                    setInteractive: jest.fn().mockReturnThis(),
                    on: jest.fn(),
                    fillColor
                };
            }),
            text: jest.fn((x, y, text, style) => {
                renderLog.push({
                    type: 'text',
                    x,
                    y,
                    text,
                    style
                });
                return {
                    setOrigin: jest.fn().mockReturnThis(),
                    setInteractive: jest.fn().mockReturnThis(),
                    on: jest.fn()
                };
            }),
            circle: jest.fn((x, y, radius, fillColor) => {
                renderLog.push({
                    type: 'circle',
                    x,
                    y,
                    radius,
                    fillColor
                });
                return {
                    setInteractive: jest.fn().mockReturnThis(),
                    on: jest.fn()
                };
            })
        };
    };

    beforeEach(() => {
        mockGetSettings = jest.spyOn(StorageManager.prototype, 'getSettings').mockReturnValue({
            soundEnabled: true,
            volume: 0.5,
            showFps: false,
            difficulty: 'Normal'
        });

        scene = new SettingsScene();
        scene.scale = { width: 560, height: 620 };
        scene.add = createRendererMock();
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
    });

    test('renders the settings scene layout', () => {
        const textEntries = renderLog.filter(entry => entry.type === 'text');
        const shapeEntries = renderLog.filter(entry => entry.type !== 'text');

        expect(textEntries).toMatchInlineSnapshot(`
[
  {
    "style": {
      "color": 16777215,
      "fontFamily": undefined,
      "fontSize": "48px",
      "fontStyle": "bold",
    },
    "text": "SETTINGS",
    "type": "text",
    "x": 280,
    "y": 93,
  },
  {
    "style": {
      "color": 16777215,
      "fontFamily": undefined,
      "fontSize": "24px",
    },
    "text": "Sound Enabled",
    "type": "text",
    "x": 180,
    "y": 186,
  },
  {
    "style": {
      "color": 16777215,
      "fontFamily": undefined,
      "fontSize": "24px",
    },
    "text": "Volume",
    "type": "text",
    "x": 180,
    "y": 266,
  },
  {
    "style": {
      "color": 16777215,
      "fontFamily": undefined,
      "fontSize": "24px",
    },
    "text": "Show FPS",
    "type": "text",
    "x": 180,
    "y": 346,
  },
  {
    "style": {
      "color": 16777215,
      "fontFamily": undefined,
      "fontSize": "24px",
    },
    "text": "Difficulty",
    "type": "text",
    "x": 180,
    "y": 426,
  },
  {
    "style": {
      "color": 16777215,
      "fontFamily": undefined,
      "fontSize": "20px",
    },
    "text": "Easy",
    "type": "text",
    "x": 310,
    "y": 426,
  },
  {
    "style": {
      "color": 16776960,
      "fontFamily": undefined,
      "fontSize": "20px",
    },
    "text": "Normal",
    "type": "text",
    "x": 390,
    "y": 426,
  },
  {
    "style": {
      "color": 16777215,
      "fontFamily": undefined,
      "fontSize": "20px",
    },
    "text": "Hard",
    "type": "text",
    "x": 470,
    "y": 426,
  },
  {
    "style": {
      "color": 16777215,
      "fontFamily": undefined,
      "fontSize": "24px",
    },
    "text": "[ESC] Back to Menu",
    "type": "text",
    "x": 280,
    "y": 527,
  },
]
`);
        expect(shapeEntries).toMatchInlineSnapshot(`
[
  {
    "fillColor": 0,
    "height": 620,
    "type": "rectangle",
    "width": 560,
    "x": 0,
    "y": 0,
  },
  {
    "fillColor": 16776960,
    "height": 30,
    "type": "rectangle",
    "width": 60,
    "x": 380,
    "y": 186,
  },
  {
    "fillColor": 3355443,
    "height": 10,
    "type": "rectangle",
    "width": 200,
    "x": 380,
    "y": 266,
  },
  {
    "fillColor": 16776960,
    "radius": 15,
    "type": "circle",
    "x": 380,
    "y": 266,
  },
  {
    "fillColor": 3355443,
    "height": 30,
    "type": "rectangle",
    "width": 60,
    "x": 380,
    "y": 346,
  },
]
`);
    });
});
