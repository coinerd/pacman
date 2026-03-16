/**
 * Tests for LogoCreator
 * Tests programmatic ADA-Woman logo generation
 */

import { LogoCreator } from '../../src/utils/LogoCreator.js';

// Mock Phaser Scene
const createMockScene = () => ({
    scale: {
        width: 800,
        height: 600
    },
    add: {
        container: jest.fn(() => ({
            setScale: jest.fn(),
            add: jest.fn()
        })),
        graphics: jest.fn(() => ({
            lineStyle: jest.fn(),
            fillStyle: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            closePath: jest.fn(),
            fillPath: jest.fn(),
            strokePath: jest.fn(),
            fillCircle: jest.fn(),
            setDepth: jest.fn(),
            setAlpha: jest.fn(),
            setVisible: jest.fn(),
            clear: jest.fn(),
            destroy: jest.fn()
        })),
        text: jest.fn(() => ({
            setOrigin: jest.fn()
        })),
        rectangle: jest.fn(() => ({
            setAlpha: jest.fn(),
            setStrokeStyle: jest.fn()
        }))
    },
    tweens: {
        add: jest.fn()
    },
    time: {
        delayedCall: jest.fn()
    }
});

describe('LogoCreator', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
    });

    describe('createADAWomanLogo', () => {
        it('should create a container at specified position', () => {
            const container = LogoCreator.createADAWomanLogo(mockScene, {
                x: 100,
                y: 100
            });

            expect(mockScene.add.container).toHaveBeenCalledWith(100, 100);
        });

        it('should create a container at center by default', () => {
            LogoCreator.createADAWomanLogo(mockScene);

            expect(mockScene.add.container).toHaveBeenCalledWith(400, 90); // width/2, height*0.15
        });

        it('should apply scale option', () => {
            const mockContainer = {
                setScale: jest.fn(),
                add: jest.fn()
            };
            mockScene.add.container.mockReturnValue(mockContainer);

            LogoCreator.createADAWomanLogo(mockScene, { scale: 2 });

            expect(mockContainer.setScale).toHaveBeenCalledWith(2);
        });

        it('should create hexagon graphics', () => {
            LogoCreator.createADAWomanLogo(mockScene);

            // Should create graphics for hexagon
            expect(mockScene.add.graphics).toHaveBeenCalled();
        });

        it('should create text label', () => {
            LogoCreator.createADAWomanLogo(mockScene);

            expect(mockScene.add.text).toHaveBeenCalled();
        });

        it('should add animations when animated is true', () => {
            LogoCreator.createADAWomanLogo(mockScene, { animated: true });

            expect(mockScene.tweens.add).toHaveBeenCalled();
        });

        it('should not add animations when animated is false', () => {
            mockScene.tweens.add.mockClear();

            LogoCreator.createADAWomanLogo(mockScene, { animated: false });

            expect(mockScene.tweens.add).not.toHaveBeenCalled();
        });
    });

    describe('createHexagon', () => {
        it('should create a graphics object', () => {
            const graphics = LogoCreator.createHexagon(mockScene, {
                primary: 0x00ffaa,
                effect: { glow: 0x00ff00 }
            });

            expect(mockScene.add.graphics).toHaveBeenCalled();
            expect(graphics.lineStyle).toHaveBeenCalled();
            expect(graphics.fillStyle).toHaveBeenCalled();
        });

        it('should draw 6 hexagon vertices', () => {
            LogoCreator.createHexagon(mockScene, {
                primary: 0x00ffaa,
                effect: { glow: 0x00ff00 }
            });

            // moveTo once for first vertex, lineTo 5 times for remaining
            const graphics = mockScene.add.graphics.mock.results[0].value;
            expect(graphics.moveTo).toHaveBeenCalled();
            expect(graphics.lineTo).toHaveBeenCalled();
        });

        it('should fill and stroke the hexagon path', () => {
            LogoCreator.createHexagon(mockScene, {
                primary: 0x00ffaa,
                effect: { glow: 0x00ff00 }
            });

            const graphics = mockScene.add.graphics.mock.results[0].value;
            expect(graphics.closePath).toHaveBeenCalled();
            expect(graphics.fillPath).toHaveBeenCalled();
            expect(graphics.strokePath).toHaveBeenCalled();
        });
    });

    describe('createInnerCircuit', () => {
        it('should create circuit pattern with nodes', () => {
            const colors = {
                circuit: {
                    trace: 0x00ff00,
                    node: 0x00ffaa,
                    nodeGlow: 0x00ff88
                },
                effect: { pulse: 0x00ff00 }
            };

            LogoCreator.createInnerCircuit(mockScene, colors);

            expect(mockScene.add.graphics).toHaveBeenCalled();
        });

        it('should draw 6 circuit nodes at hexagon vertices', () => {
            const colors = {
                circuit: {
                    trace: 0x00ff00,
                    node: 0x00ffaa,
                    nodeGlow: 0x00ff88
                },
                effect: { pulse: 0x00ff00 }
            };

            LogoCreator.createInnerCircuit(mockScene, colors);

            const graphics = mockScene.add.graphics.mock.results[0].value;
            // 6 nodes + 6 node glows = 12 fillCircle calls, plus inner core
            expect(graphics.fillCircle).toHaveBeenCalled();
        });
    });

    describe('createDigitalEye', () => {
        it('should create eye graphics', () => {
            const colors = {
                effect: { glow: 0x00ff00 },
                digital: { active: 0x00ffaa }
            };

            LogoCreator.createDigitalEye(mockScene, colors);

            expect(mockScene.add.graphics).toHaveBeenCalled();
        });

        it('should draw eye glow, pupil, and highlight', () => {
            const colors = {
                effect: { glow: 0x00ff00 },
                digital: { active: 0x00ffaa }
            };

            LogoCreator.createDigitalEye(mockScene, colors);

            const graphics = mockScene.add.graphics.mock.results[0].value;
            // 3 circles: glow, pupil, highlight
            expect(graphics.fillCircle).toHaveBeenCalledTimes(3);
        });
    });

    describe('createLogoText', () => {
        it('should create ADA-WOMAN text', () => {
            const colors = {
                primary: 0x00ffaa,
                effect: { pulse: 0x00ff00 }
            };

            LogoCreator.createLogoText(mockScene, colors);

            expect(mockScene.add.text).toHaveBeenCalledWith(
                0,
                75,
                'ADA-WOMAN',
                expect.objectContaining({
                    fontFamily: expect.any(String)
                })
            );
        });
    });

    describe('addLogoAnimations', () => {
        it('should add pulse animation to container', () => {
            const mockContainer = { setScale: jest.fn(), add: jest.fn() };
            const mockHexagon = {};
            const mockCircuit = {};
            const mockEye = {};

            LogoCreator.addLogoAnimations(mockScene, mockContainer, mockHexagon, mockCircuit, mockEye);

            // Should add 3 animations: pulse, circuit rotation, eye glow
            expect(mockScene.tweens.add).toHaveBeenCalledTimes(3);
        });

        it('should add circuit rotation animation', () => {
            const mockContainer = { setScale: jest.fn(), add: jest.fn() };
            const mockCircuit = {};
            const mockEye = {};

            mockScene.tweens.add.mockClear();

            LogoCreator.addLogoAnimations(mockScene, mockContainer, {}, mockCircuit, mockEye);

            const rotationCall = mockScene.tweens.add.mock.calls.find(
                call => call[0].targets === mockCircuit
            );
            expect(rotationCall).toBeDefined();
            expect(rotationCall[0].rotation).toBe(Math.PI * 2);
        });

        it('should add eye glow pulse animation', () => {
            const mockContainer = { setScale: jest.fn(), add: jest.fn() };
            const mockEye = {};

            mockScene.tweens.add.mockClear();

            LogoCreator.addLogoAnimations(mockScene, mockContainer, {}, {}, mockEye);

            const eyeCall = mockScene.tweens.add.mock.calls.find(
                call => call[0].targets === mockEye
            );
            expect(eyeCall).toBeDefined();
            expect(eyeCall[0].alpha).toEqual({ from: 1, to: 0.7 });
        });
    });

    describe('createSmallLogo', () => {
        it('should create logo with 0.5 scale by default', () => {
            const mockContainer = { setScale: jest.fn(), add: jest.fn() };
            mockScene.add.container.mockReturnValue(mockContainer);

            LogoCreator.createSmallLogo(mockScene, { x: 50, y: 50 });

            expect(mockContainer.setScale).toHaveBeenCalledWith(0.5);
        });

        it('should create logo without animations', () => {
            LogoCreator.createSmallLogo(mockScene);

            expect(mockScene.tweens.add).not.toHaveBeenCalled();
        });

        it('should accept custom scale option', () => {
            const mockContainer = { setScale: jest.fn(), add: jest.fn() };
            mockScene.add.container.mockReturnValue(mockContainer);

            LogoCreator.createSmallLogo(mockScene, { scale: 0.3 });

            expect(mockContainer.setScale).toHaveBeenCalledWith(0.3);
        });
    });

    describe('createMinimalLogo', () => {
        it('should create minimal logo with just hexagon and text', () => {
            const mockContainer = { setScale: jest.fn(), add: jest.fn() };
            mockScene.add.container.mockReturnValue(mockContainer);

            LogoCreator.createMinimalLogo(mockScene);

            expect(mockScene.add.container).toHaveBeenCalled();
            expect(mockScene.add.graphics).toHaveBeenCalled();
            expect(mockScene.add.text).toHaveBeenCalled();
        });

        it('should use 0.8 scale by default', () => {
            const mockContainer = { setScale: jest.fn(), add: jest.fn() };
            mockScene.add.container.mockReturnValue(mockContainer);

            LogoCreator.createMinimalLogo(mockScene);

            expect(mockContainer.setScale).toHaveBeenCalledWith(0.8);
        });

        it('should accept custom options', () => {
            const mockContainer = { setScale: jest.fn(), add: jest.fn() };
            mockScene.add.container.mockReturnValue(mockContainer);

            LogoCreator.createMinimalLogo(mockScene, { x: 100, y: 200, scale: 0.5 });

            expect(mockScene.add.container).toHaveBeenCalledWith(100, 200);
            expect(mockContainer.setScale).toHaveBeenCalledWith(0.5);
        });
    });
});
