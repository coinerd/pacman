import { StorageManager } from '../../src/managers/StorageManager.js';
import SettingsScene from '../../src/scenes/SettingsScene.js';

describe('SettingsScene', () => {
    let scene;
    let mockGetSettings;
    let renderLog;

    const createRendererMock = () => {
        renderLog = [];
        return {
            graphics: jest.fn(() => {
                return {
                    lineStyle: jest.fn().mockReturnThis(),
                    lineBetween: jest.fn().mockReturnThis(),
                    fillStyle: jest.fn().mockReturnThis(),
                    fillCircle: jest.fn().mockReturnThis(),
                    fillRoundedRect: jest.fn().mockReturnThis(),
                    strokeRoundedRect: jest.fn().mockReturnThis(),
                    moveTo: jest.fn().mockReturnThis(),
                    lineTo: jest.fn().mockReturnThis(),
                    strokePath: jest.fn().mockReturnThis()
                };
            }),
            container: jest.fn((x, y) => {
                return {
                    x,
                    y,
                    add: jest.fn(),
                    setSize: jest.fn(),
                    setInteractive: jest.fn(),
                    on: jest.fn()
                };
            }),
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
                    fillColor,
                    setStrokeStyle: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis()
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
                    on: jest.fn(),
                    setStrokeStyle: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis()
                };
            })
        };
    };

    beforeEach(() => {
        mockGetSettings = jest
            .spyOn(StorageManager.prototype, 'getSettings')
            .mockReturnValue({
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
            },
            on: jest.fn()
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
        const textEntries = renderLog.filter((entry) => entry.type === 'text');
        const shapeEntries = renderLog.filter((entry) => entry.type !== 'text');

        expect(textEntries).toMatchInlineSnapshot(`
     [
       {
         "style": {
           "color": "#ffffff",
           "fontFamily": "Arial Black, Arial, sans-serif",
           "fontSize": "64px",
           "fontStyle": "bold",
           "fontWeight": "900",
           "letterSpacing": "2px",
           "shadow": {
             "blur": 12,
             "color": "#00ffff",
             "offsetX": 0,
             "offsetY": 0,
           },
         },
         "text": "SYSTEM CONFIG",
         "type": "text",
         "x": 280,
         "y": 74.39999999999999,
       },
       {
         "style": {
           "color": "#00ffaa",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "32px",
           "fontStyle": "bold",
           "fontWeight": "700",
           "letterSpacing": "1px",
         },
         "text": "// SETTINGS",
         "type": "text",
         "x": 280,
         "y": 111.6,
       },
       {
         "style": {
           "color": "#ffffff",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "18px",
           "fontStyle": "normal",
           "fontWeight": "400",
         },
         "text": "AUDIO SYSTEM",
         "type": "text",
         "x": -150,
         "y": -100,
       },
       {
         "style": {
           "color": "#ffffff",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "18px",
           "fontStyle": "normal",
           "fontWeight": "400",
         },
         "text": "VOLUME LEVEL",
         "type": "text",
         "x": -150,
         "y": -30,
       },
       {
         "style": {
           "color": "#ffffff",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "18px",
           "fontStyle": "normal",
           "fontWeight": "400",
         },
         "text": "FPS DISPLAY",
         "type": "text",
         "x": -150,
         "y": 40,
       },
       {
         "style": {
           "color": "#ffffff",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "18px",
           "fontStyle": "normal",
           "fontWeight": "400",
         },
         "text": "DIFFICULTY MODE",
         "type": "text",
         "x": -150,
         "y": 110,
       },
       {
         "style": {
           "color": "#aaaaaa",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "14px",
           "fontStyle": "bold",
           "fontWeight": "700",
           "letterSpacing": "1px",
         },
         "text": "EASY",
         "type": "text",
         "x": 0,
         "y": 0,
       },
       {
         "style": {
           "color": "#00ced1",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "14px",
           "fontStyle": "bold",
           "fontWeight": "700",
           "letterSpacing": "1px",
         },
         "text": "NORMAL",
         "type": "text",
         "x": 0,
         "y": 0,
       },
       {
         "style": {
           "color": "#aaaaaa",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "14px",
           "fontStyle": "bold",
           "fontWeight": "700",
           "letterSpacing": "1px",
         },
         "text": "HARD",
         "type": "text",
         "x": 0,
         "y": 0,
       },
       {
         "style": {
           "color": "#ffffff",
           "fontFamily": "Arial, sans-serif",
           "fontSize": "28px",
           "fontStyle": "normal",
           "fontWeight": "600",
           "letterSpacing": "1px",
         },
         "text": "[ESC] RETURN TO MENU",
         "type": "text",
         "x": 0,
         "y": 0,
       },
     ]
    `);
        expect(shapeEntries).toMatchInlineSnapshot(`
     [
       {
         "fillColor": 858893,
         "height": 620,
         "type": "rectangle",
         "width": 560,
         "x": 0,
         "y": 0,
       },
       {
         "fillColor": 662042,
         "height": 32,
         "type": "rectangle",
         "width": 70,
         "x": 0,
         "y": 0,
       },
       {
         "fillColor": 65280,
         "height": 24,
         "type": "rectangle",
         "width": 24,
         "x": 17.5,
         "y": 0,
       },
       {
         "fillColor": 662042,
         "height": 10,
         "type": "rectangle",
         "width": 200,
         "x": 0,
         "y": 0,
       },
       {
         "fillColor": 65450,
         "height": 10,
         "type": "rectangle",
         "width": 100,
         "x": -50,
         "y": 0,
       },
       {
         "fillColor": 65535,
         "radius": 14,
         "type": "circle",
         "x": -50,
         "y": 0,
       },
       {
         "fillColor": 662042,
         "height": 32,
         "type": "rectangle",
         "width": 70,
         "x": 0,
         "y": 0,
       },
       {
         "fillColor": 16729156,
         "height": 24,
         "type": "rectangle",
         "width": 24,
         "x": -17.5,
         "y": 0,
       },
       {
         "fillColor": 662042,
         "height": 36,
         "type": "rectangle",
         "width": 90,
         "x": 0,
         "y": 0,
       },
       {
         "fillColor": 662042,
         "height": 36,
         "type": "rectangle",
         "width": 90,
         "x": 0,
         "y": 0,
       },
       {
         "fillColor": 662042,
         "height": 36,
         "type": "rectangle",
         "width": 90,
         "x": 0,
         "y": 0,
       },
       {
         "fillColor": 662042,
         "height": 50,
         "type": "rectangle",
         "width": 280,
         "x": 0,
         "y": 0,
       },
     ]
    `);
    });
});
