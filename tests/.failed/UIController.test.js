import { UIController } from '../../../src/scenes/systems/UIController.js';

describe('UIController', () => {
    let controller;
    let mockScene;
    let renderLog;

    beforeEach(() => {
        renderLog = [];
        const createTextMock = (x, y, text, style) => {
            renderLog.push({
                type: 'text',
                x,
                y,
                text,
                style
            });
            const textObj = {
                x, y, text, style,
                setOrigin: jest.fn().mockReturnThis(),
                setAlpha: jest.fn().mockReturnThis(),
                setDepth: jest.fn().mockReturnThis(),
                setScrollFactor: jest.fn().mockReturnThis(),
                setVisible: jest.fn().mockReturnThis(),
                setText: jest.fn(function(newText) { this.text = newText; return this; }),
                destroy: jest.fn(),
                visible: true
            };
            return textObj;
        };

        mockScene = {
            gameState: {
                score: 0,
                highScore: 0,
                lives: 3,
                level: 1
            },
            scale: {
                width: 560,
                height: 620
            },
            add: {
                text: jest.fn(createTextMock),
                rectangle: jest.fn(() => ({
                    setStrokeStyle: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                graphics: jest.fn(() => ({
                    fillStyle: jest.fn().mockReturnThis(),
                    fillRoundedRect: jest.fn().mockReturnThis(),
                    lineStyle: jest.fn().mockReturnThis(),
                    strokeRoundedRect: jest.fn().mockReturnThis(),
                    strokePoints: jest.fn().mockReturnThis(),
                    fillCircle: jest.fn().mockReturnThis(),
                    beginPath: jest.fn().mockReturnThis(),
                    moveTo: jest.fn().mockReturnThis(),
                    lineTo: jest.fn().mockReturnThis(),
                    strokePath: jest.fn().mockReturnThis(),
                    fillRect: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                }))
            },
            tweens: {
                add: jest.fn()
            },
            time: {
                delayedCall: jest.fn()
            }
        };
        controller = new UIController(mockScene, mockScene.gameState);
    });

    test('renders the score, high score, lives, and level text', () => {
        controller.create();

        expect(renderLog).toMatchInlineSnapshot(`
[
  {
    "style": {
      "color": "#00ffaa",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "14px",
      "fontStyle": "normal",
      "fontWeight": "400",
      "letterSpacing": undefined,
    },
    "text": "SCORE",
    "type": "text",
    "x": 63.5,
    "y": 32.5,
  },
  {
    "style": {
      "backgroundColor": "#000000",
      "color": "#00ced1",
      "fontFamily": "Courier New, monospace",
      "fontSize": "28px",
      "fontStyle": "bold",
      "fontWeight": "bold",
      "letterSpacing": "3px",
      "padding": {
        "x": 2,
        "y": 2,
      },
    },
    "text": "0",
    "type": "text",
    "x": 161,
    "y": 32.5,
  },
  {
    "style": {
      "color": "#00ffaa",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "14px",
      "fontStyle": "normal",
      "fontWeight": "400",
      "letterSpacing": undefined,
    },
    "text": "HIGH SCORE",
    "type": "text",
    "x": 76,
    "y": 87.5,
  },
  {
    "style": {
      "color": "#ffffff",
      "fontFamily": "Courier New, monospace",
      "fontSize": "28px",
      "fontStyle": "bold",
      "fontWeight": "bold",
      "letterSpacing": "3px",
    },
    "text": "0",
    "type": "text",
    "x": 186,
    "y": 87.5,
  },
  {
    "style": {
      "color": "#00ffaa",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "14px",
      "fontStyle": "normal",
      "fontWeight": "400",
      "letterSpacing": undefined,
    },
    "text": "LIVES",
    "type": "text",
    "x": 63.5,
    "y": 142.5,
  },
  {
    "style": {
      "color": "#ffffff",
      "fontFamily": "Courier New, monospace",
      "fontSize": "28px",
      "fontStyle": "bold",
      "fontWeight": "bold",
      "letterSpacing": "3px",
    },
    "text": "3",
    "type": "text",
    "x": 141,
    "y": 142.5,
  },
  {
    "style": {
      "color": "#00ffaa",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "14px",
      "fontStyle": "normal",
      "fontWeight": "400",
      "letterSpacing": undefined,
    },
    "text": "LEVEL",
    "type": "text",
    "x": 63.5,
    "y": 197.5,
  },
  {
    "style": {
      "color": "#ffffff",
      "fontFamily": "Courier New, monospace",
      "fontSize": "28px",
      "fontStyle": "bold",
      "fontWeight": "bold",
      "letterSpacing": "3px",
    },
    "text": "1",
    "type": "text",
    "x": 141,
    "y": 197.5,
  },
]
`);
    });

    test('renders the ready message text', () => {
        controller.showReadyMessage();

        expect(renderLog).toMatchInlineSnapshot(`
     [
       {
         "style": {
           "color": "#ffffff",
           "fontFamily": "Arial Black, Arial, sans-serif",
           "fontSize": "64px",
           "fontStyle": "bold",
           "fontWeight": "900",
           "letterSpacing": "2px",
           "shadowBlur": 12,
           "shadowColor": "#00ffff",
           "shadowOffsetX": 0,
           "shadowOffsetY": 0,
         },
         "text": "READY!",
         "type": "text",
         "x": 280,
         "y": 310,
       },
     ]
    `);
    });

    test('renders the level message text', () => {
        controller.showLevelMessage(5);

        expect(renderLog).toMatchInlineSnapshot(`
     [
       {
         "style": {
           "color": "#00ffaa",
           "fontFamily": "Arial Black, Arial, sans-serif",
           "fontSize": "64px",
           "fontStyle": "bold",
           "fontWeight": "900",
           "letterSpacing": "2px",
           "shadowBlur": 12,
           "shadowColor": "#00ffff",
           "shadowOffsetX": 0,
           "shadowOffsetY": 0,
         },
         "text": "LEVEL 5",
         "type": "text",
         "x": 280,
         "y": 310,
       },
     ]
    `);
    });
});
