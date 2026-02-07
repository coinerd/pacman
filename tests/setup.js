// tests/setup.js

// Mock Canvas API before Phaser loads
global.HTMLCanvasElement = class HTMLCanvasElement {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.style = {};
    }
    getContext() {
        return {
            fillStyle: null,
            strokeStyle: null,
            lineWidth: 0,
            fillRect: () => {},
            strokeRect: () => {},
            clearRect: () => {},
            beginPath: () => {},
            closePath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            save: () => {},
            restore: () => {},
            transform: () => {},
            setTransform: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            createLinearGradient: () => ({ addColorStop: () => {} }),
            createRadialGradient: () => ({ addColorStop: () => {} }),
            createPattern: () => ({}),
            getImageData: () => ({ data: new Uint8ClampedArray(0) }),
            putImageData: () => {},
            isPointInPath: () => false
        };
    }
    toDataURL() { return ''; }
    toBlob() {}
};

global.CanvasRenderingContext2D = global.HTMLCanvasElement.prototype.getContext();

global.Image = class Image {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.complete = true;
        this.naturalWidth = 0;
        this.naturalHeight = 0;
    }
    onload = () => {};
    onerror = () => {};
};

global.AudioContext = class AudioContext {
    constructor() {
        this.currentTime = 0;
        this.state = 'running';
    }
    createBuffer() {
        return {
            duration: 0,
            getChannelData: () => new Float32Array(0)
        };
    }
    createOscillator() {
        return {
            frequency: { value: 440 },
            gain: { value: 1 },
            start: () => {},
            stop: () => {},
            connect: () => {},
            disconnect: () => {}
        };
    }
    createGain() {
        return {
            gain: { value: 1 },
            connect: () => {},
            disconnect: () => {}
        };
    }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
};

global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.cancelAnimationFrame = clearTimeout;

class MockArc {
    constructor(scene, x, y, radius, startAngle, endAngle, color, alpha) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.color = color;
        this.alpha = alpha;
        this.depth = 100;
        this.visible = true;
    }
    setDepth(depth) { this.depth = depth; return this; }
    setAlpha(alpha) { this.alpha = alpha; return this; }
    setVisible(visible) { this.visible = visible; return this; }
    setAngle() { return this; }
    setRotation() { return this; }
    setScale() { return this; }
    setPosition(x, y) { this.x = x; this.y = y; return this; }
    setStartAngle(angle) { this.startAngle = angle; return this; }
    setEndAngle(angle) { this.endAngle = angle; return this; }
    setFillStyle(color, alpha) { this.color = color; this.alpha = alpha; return this; }
    snapToCenter() { return this; }
}

class MockGraphics {
    constructor(scene) {
        this.scene = scene;
        this.fillStyleCalls = [];
        this.lineStyleCalls = [];
        this.depth = 0;
        this.visible = true;
        this.x = 0;
        this.y = 0;
    }
    fillStyle(color, alpha) { this.fillStyleCalls.push({ color, alpha }); return this; }
    lineStyle(lineWidth, color, alpha) { this.lineStyleCalls.push({ lineWidth, color, alpha }); return this; }
    clear() { this.fillStyleCalls = []; this.lineStyleCalls = []; return this; }
    setDepth(depth) { this.depth = depth; return this; }
    setInteractive() { return this; }
    setScrollFactor() { return this; }
    setAlpha() { return this; }
    setAngle() { return this; }
    setRotation() { return this; }
    setScale() { return this; }
    setPosition(x, y) { this.x = x; this.y = y; return this; }
    setVisible(visible) { this.visible = visible; return this; }
    generateTexture() { return this; }
    destroy() {}
}

class MockSprite {
    constructor(scene, x, y, texture, frame) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.texture = texture;
        this.frame = { name: frame || 0 };
        this.depth = 0;
        this.visible = true;
        this.alpha = 1;
        this.scale = 1;
        this.active = false;
    }
    setOrigin() { return this; }
    setDepth(depth) { this.depth = depth; return this; }
    setAlpha(alpha) { this.alpha = alpha; return this; }
    setPosition(x, y) { this.x = x; this.y = y; return this; }
    setVisible(visible) { this.visible = visible; return this; }
    setFrame(frame) { this.frame.name = frame; return this; }
    setScale(scale) { this.scale = scale; return this; }
    setActive(active) { this.active = active; return this; }
    play() { return this; }
    destroy() {}
}

class MockText {
    constructor(scene, text, style) {
        this.scene = scene;
        this.text = text;
        this.style = style;
        this.x = 0;
        this.y = 0;
        this.depth = 0;
        this.visible = true;
        this.alpha = 1;
    }
    setText(text) { this.text = text; return this; }
    setOrigin() { return this; }
    setDepth(depth) { this.depth = depth; return this; }
    setAlpha(alpha) { this.alpha = alpha; return this; }
    setPosition(x, y) { this.x = x; this.y = y; return this; }
    setVisible(visible) { this.visible = visible; return this; }
}

global.Phaser = {
    Math: {
        Clamp: (value, min, max) => Math.max(min, Math.min(max, value))
    },
    GameObjects: {
        Arc: MockArc,
        Graphics: MockGraphics,
        Sprite: MockSprite,
        Text: MockText
    },
    Scene: class MockScene {
        constructor() {
            this.add = {
                existing: () => {},
                graphics: () => new MockGraphics(this),
                circle: () => new MockArc(this, 0, 0, 10),
                text: () => new MockText(this),
                rectangle: () => ({ setInteractive: () => {}, setOrigin: () => {}, on: () => {} }),
                sprite: () => new MockSprite(this, 0, 0),
                image: () => new MockSprite(this, 0, 0)
            };
            this.time = {
                now: () => Date.now(),
                delayedCall: (delay, callback) => setTimeout(callback, delay)
            };
            this.children = {
                getChildren: () => []
            };
            this.cameras = { main: { centerX: 0, centerY: 0, width: 0, height: 0 } };
        }
    },
    Display: {
        Color: {
            GetColor: (r, g, b) => (r << 16) | (g << 8) | b
        }
    }
};
