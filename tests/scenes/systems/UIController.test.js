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
            return {
                setOrigin: jest.fn().mockReturnThis(),
                setAlpha: jest.fn().mockReturnThis(),
                setText: jest.fn(),
                destroy: jest.fn()
            };
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
                text: jest.fn(createTextMock)
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
      "color": "#FFD700",
      "fontFamily": "Arial",
      "fontSize": "16px",
      "fontStyle": "bold",
    },
    "text": "SCORE: 0",
    "type": "text",
    "x": 10,
    "y": 10,
  },
  {
    "style": {
      "color": "#FFFFFF",
      "fontFamily": "Arial",
      "fontSize": "16px",
    },
    "text": "HIGH SCORE: 0",
    "type": "text",
    "x": 10,
    "y": 35,
  },
  {
    "style": {
      "color": "#FFFFFF",
      "fontFamily": "Arial",
      "fontSize": "16px",
      "fontStyle": "bold",
    },
    "text": "LIVES: 3",
    "type": "text",
    "x": 550,
    "y": 10,
  },
  {
    "style": {
      "color": "#00FF00",
      "fontFamily": "Arial",
      "fontSize": "16px",
      "fontStyle": "bold",
    },
    "text": "LEVEL: 1",
    "type": "text",
    "x": 280,
    "y": 10,
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
      "color": "#FFFFFF",
      "fontFamily": "Arial",
      "fontSize": "48px",
      "fontStyle": "bold",
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
        mockScene.gameState.level = 5;

        controller.showLevelMessage();

        expect(renderLog).toMatchInlineSnapshot(`
[
  {
    "style": {
      "color": "#00FF00",
      "fontFamily": "Arial",
      "fontSize": "32px",
      "fontStyle": "bold",
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
