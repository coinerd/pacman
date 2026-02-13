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
                text: jest.fn(createTextMock),
                graphics: jest.fn(() => ({
                    fillStyle: jest.fn().mockReturnThis(),
                    fillRoundedRect: jest.fn().mockReturnThis(),
                    lineStyle: jest.fn().mockReturnThis(),
                    strokeRoundedRect: jest.fn().mockReturnThis(),
                    strokePoints: jest.fn().mockReturnThis(),
                    fillCircle: jest.fn().mockReturnThis(),
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
           "color": "#aaaaaa",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "14px",
         },
         "text": "SCORE",
         "type": "text",
         "x": 26,
         "y": 20,
       },
       {
         "style": {
           "color": "#00ffaa",
           "fontFamily": "Courier New, monospace",
           "fontSize": "28px",
           "fontStyle": "bold",
           "fontWeight": "bold",
           "letterSpacing": "3px",
           "shadowBlur": 6,
           "shadowColor": "#00ced1",
           "shadowOffsetX": 0,
           "shadowOffsetY": 0,
         },
         "text": "0",
         "type": "text",
         "x": 101,
         "y": 20,
       },
       {
         "style": {
           "color": "#aaaaaa",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "14px",
         },
         "text": "HIGH SCORE",
         "type": "text",
         "x": 26,
         "y": 70,
       },
       {
         "style": {
           "color": "#00ced1",
           "fontFamily": "Courier New, monospace",
           "fontSize": "28px",
           "fontStyle": "bold",
           "fontWeight": "bold",
           "letterSpacing": "3px",
         },
         "text": "0",
         "type": "text",
         "x": 111,
         "y": 70,
       },
       {
         "style": {
           "color": "#aaaaaa",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "14px",
         },
         "text": "LIVES",
         "type": "text",
         "x": 444,
         "y": 20,
       },
       {
         "style": {
           "color": "#00ced1",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "24px",
           "fontStyle": "bold",
         },
         "text": "3",
         "type": "text",
         "x": 534,
         "y": 20,
       },
       {
         "style": {
           "color": "#aaaaaa",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "14px",
         },
         "text": "LVL",
         "type": "text",
         "x": 230,
         "y": 20,
       },
       {
         "style": {
           "color": "#00ffaa",
           "fontFamily": "Courier New, monospace",
           "fontSize": "28px",
           "fontStyle": "bold",
           "fontWeight": "bold",
           "letterSpacing": "3px",
           "shadowBlur": 6,
           "shadowColor": "#00ced1",
           "shadowOffsetX": 0,
           "shadowOffsetY": 0,
         },
         "text": "1",
         "type": "text",
         "x": 330,
         "y": 20,
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
        mockScene.gameState.level = 5;

        controller.showLevelMessage();

        expect(renderLog).toMatchInlineSnapshot(`
     [
       {
         "style": {
           "color": "#ffffff",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "32px",
           "fontStyle": "bold",
           "fontWeight": "700",
           "letterSpacing": "1px",
           "textTransform": "uppercase",
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
