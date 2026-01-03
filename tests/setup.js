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

global.Phaser = {
  Game: class MockGame {
    constructor(config) {
      this.scale = {
        width: config.width || 560,
        height: config.height || 620,
        displaySize: { setWidth: () => {}, setHeight: () => {} }
      };
      this.time = {
        now: function() { return Date.now(); },
        delayedCall: function(delay, callback) { return setTimeout(callback, delay); }
      };
      this.add = {
        existing: function() { return {}; },
        graphics: function() {
          return {
            fillStyle: function() { return this; },
            lineStyle: function() { return this; },
            clear: function() { return this; },
            setDepth: function() { return this; },
            setInteractive: function() { return this; },
            setScrollFactor: function() { return this; },
            setAlpha: function() { return this; },
            setAngle: function() { return this; },
            setRotation: function() { return this; },
            setScale: function() { return this; },
            setPosition: function() { return this; },
            setVisible: function() { return this; },
            arc: function() { return this; },
            fill: function() { return this; },
            stroke: function() { return this; },
            lineBetween: function() { return this; },
            generateTexture: function() { return this; }
          };
        },
        circle: function() { return { setPosition: () => {}, setVisible: () => {}, setDepth: () => {} }; },
        text: function() { return { setOrigin: () => {}, setText: () => {}, setVisible: () => {} }; },
        rectangle: function() { return { setInteractive: () => {} }; },
        image: function() { return { setVisible: () => {}, setDepth: () => {} }; },
        sprite: function() { return { setOrigin: () => {}, setVisible: () => {}, play: () => {} }; }
      };
      this.input = {
        keyboard: {
          createCursorKeys: function() { return { left: { isDown: false }, right: { isDown: false } }; },
          addKeys: function() { return { W: { isDown: false }, A: { isDown: false } }; },
          on: function() {},
          once: function() {}
        }
      };
      this.tweens = {
        add: function() { return { targets: {}, killTweensOf: function() {} }; },
        killTweensOf: function() {}
      };
      this.scene = {
        get: function() { return {}; },
        launch: function() {},
        stop: function() {},
        pause: function() {},
        resume: function() {}
      };
      this.cameras = {
        main: {
          centerX: 280,
          centerY: 310,
          width: 560,
          height: 620
        }
      };
    }
  },
  GameObjects: {
    Arc: class MockArc {
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
        this.setDepth = function(depth) { this.depth = depth; return this; };
        this.setAlpha = function(alpha) { this.alpha = alpha; return this; };
        this.setVisible = function(visible) { this.visible = visible; return this; };
        this.setAngle = function(angle) { return this; };
        this.setRotation = function(rotation) { return this; };
        this.setScale = function(scale) { return this; };
        this.setPosition = function(x, y) { this.x = x; this.y = y; return this; };
      }
      setStartAngle(angle) { this.startAngle = angle; return this; }
      setEndAngle(angle) { this.endAngle = angle; return this; }
      setFillStyle(color, alpha) { this.color = color; this.alpha = alpha; return this; }
      setDepth(depth) { this.depth = depth; return this; }
      snapToCenter() { return this; }
    },
    Graphics: class MockGraphics {
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
      setScrollFactor(x, y) { return this; }
      setAlpha(alpha) { return this; }
      setAngle(angle) { return this; }
      setRotation(rotation) { return this; }
      setScale(scale) { return this; }
      setPosition(x, y) { this.x = x; this.y = y; return this; }
      setVisible(visible) { this.visible = visible; return this; }
      generateTexture() { return this; }
      destroy() {}
    },
    Container: class MockContainer {
      constructor(scene) {
        this.scene = scene;
        this.children = [];
        this.x = 0;
        this.y = 0;
        this.depth = 0;
        this.visible = true;
        this.alpha = 1;
      }
      add(child) {
        this.children.push(child);
        return this;
      }
      setDepth(depth) { this.depth = depth; return this; }
      setAlpha(alpha) { this.alpha = alpha; return this; }
      setPosition(x, y) { this.x = x; this.y = y; return this; }
      setVisible(visible) { this.visible = visible; return this; }
    },
    Sprite: class MockSprite {
      constructor(scene, x, y, texture) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.texture = texture;
        this.depth = 0;
        this.visible = true;
        this.alpha = 1;
      }
      setOrigin(x, y) { return this; }
      setDepth(depth) { this.depth = depth; return this; }
      setAlpha(alpha) { this.alpha = alpha; return this; }
      setPosition(x, y) { this.x = x; this.y = y; return this; }
      setVisible(visible) { this.visible = visible; return this; }
      play(key) { return this; }
      destroy() {}
    },
    Text: class MockText {
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
      setOrigin(x, y) { return this; }
      setDepth(depth) { this.depth = depth; return this; }
      setAlpha(alpha) { this.alpha = alpha; return this; }
      setPosition(x, y) { this.x = x; this.y = y; return this; }
      setVisible(visible) { this.visible = visible; return this; }
    }
  },
  Scene: class MockScene {
    constructor() {
      this.add = {
        existing: () => {},
        graphics: () => new global.Phaser.GameObjects.Graphics(this),
        circle: () => new global.Phaser.GameObjects.Arc(this, 0, 0, 10),
        text: () => new global.Phaser.GameObjects.Text(this),
        rectangle: () => ({ setInteractive: () => {} }),
        sprite: () => new global.Phaser.GameObjects.Sprite(this, 0, 0),
        image: () => new global.Phaser.GameObjects.Sprite(this, 0, 0)
      };
      this.time = {
        now: () => Date.now(),
        delayedCall: (delay, callback) => setTimeout(callback, delay)
      };
      this.children = {
        getChildren: () => []
      };
    }
  },
  Input: {
    Keyboard: class MockKeyboard {
      createCursorKeys() {
        return {
          Left: { isDown: false },
          Right: { isDown: false },
          Up: { isDown: false },
          Down: { isDown: false }
        };
      }
      addKeys(keys) {
        const result = {};
        keys.split(',').forEach(key => {
          result[key.trim()] = { isDown: false };
        });
        return result;
      }
    }
  },
  Tweens: {
    TweenManager: class MockTweenManager {
      add(tween) { return { targets: [], killTweensOf: () => {} }; }
      killTweensOf() {}
    }
  }
};
