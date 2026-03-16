import { UIController } from '../../src/scenes/systems/UIController.js';

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
                setShadow: jest.fn().mockReturnThis(),
                setColor: jest.fn().mockReturnThis(),
                setScale: jest.fn().mockReturnThis(),
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
                container: jest.fn(() => ({
                    add: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                rectangle: jest.fn(() => ({
                    setStrokeStyle: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    setOrigin: jest.fn().mockReturnThis(),
                    setFillStyle: jest.fn().mockReturnThis(),
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
                    setDepth: jest.fn().mockReturnThis(),
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
      "color": "#00aaaa",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "11px",
      "fontStyle": "bold",
    },
    "text": "SCORE",
    "type": "text",
    "x": 0,
    "y": 0,
  },
  {
    "style": {
      "color": "#00ffaa",
      "fontFamily": "Courier New, monospace",
      "fontSize": "22px",
      "fontStyle": "bold",
    },
    "text": "000000",
    "type": "text",
    "x": 0,
    "y": 14,
  },
  {
    "style": {
      "color": "#ffdd00",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "14px",
    },
    "text": "♔",
    "type": "text",
    "x": 0,
    "y": -2,
  },
  {
    "style": {
      "color": "#ffaa00",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "11px",
      "fontStyle": "bold",
    },
    "text": "HIGH",
    "type": "text",
    "x": 16,
    "y": 0,
  },
  {
    "style": {
      "color": "#ffdd00",
      "fontFamily": "Courier New, monospace",
      "fontSize": "22px",
      "fontStyle": "bold",
    },
    "text": "000000",
    "type": "text",
    "x": 0,
    "y": 14,
  },
  {
    "style": {
      "color": "#ff4444",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "18px",
    },
    "text": "♥",
    "type": "text",
    "x": -16,
    "y": 8,
  },
  {
    "style": {
      "color": "#ff4444",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "18px",
    },
    "text": "♥",
    "type": "text",
    "x": 0,
    "y": 8,
  },
  {
    "style": {
      "color": "#ff4444",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "18px",
    },
    "text": "♥",
    "type": "text",
    "x": 16,
    "y": 8,
  },
  {
    "style": {
      "color": "#00ddff",
      "fontFamily": "Courier New, monospace",
      "fontSize": "18px",
      "fontStyle": "bold",
    },
    "text": "1",
    "type": "text",
    "x": 0,
    "y": 12,
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
         "x": 310,
         "y": 310,
       },
     ]
    `);
    });
});
