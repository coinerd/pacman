/**
 * MockFactory
 * Bessere Mocks für Phaser-Komponenten
 */

/**
 * Erstellt einen vollständigen Mock für Phaser Scene
 */
export function createMockScene() {
    const children = [];
    const childrenMap = new Map();
    let nextId = 1;

    return {
        scale: { width: 800, height: 600 },
        tweens: {
            add: jest.fn((config) => ({
                targets: config.targets,
                alpha: config.alpha,
                duration: config.duration,
                delay: config.delay,
                onComplete: config.onComplete,
                destroy: jest.fn()
            }))
        },
        make: {
            graphics: jest.fn(() => ({
                lineStyle: jest.fn().mockReturnThis(),
                moveTo: jest.fn().mockReturnThis(),
                lineTo: jest.fn().mockReturnThis(),
                fillStyle: jest.fn().mockReturnThis(),
                fillRect: jest.fn().mockReturnThis(),
                strokePath: jest.fn().mockReturnThis(),
                generateTexture: jest.fn(),
                destroy: jest.fn(),
                beginPath: jest.fn().mockReturnThis(),
                closePath: jest.fn().mockReturnThis(),
                clear: jest.fn().mockReturnThis(),
                fillPath: jest.fn().mockReturnThis()
            }))
        },
        add: {
            rectangle: jest.fn((x, y, w, h, color) => {
                const obj = {
                    x, y, width: w, height: h, color,
                    id: nextId++,
                    setOrigin: jest.fn().mockReturnThis(),
                    destroy: jest.fn(),
                    setVisible: jest.fn(),
                    setActive: jest.fn()
                };
                children.push(obj);
                return obj;
            }),
            image: jest.fn((x, y, key) => {
                const obj = {
                    x, y, key,
                    id: nextId++,
                    setOrigin: jest.fn().mockReturnThis(),
                    destroy: jest.fn(),
                    setVisible: jest.fn(),
                    setActive: jest.fn()
                };
                children.push(obj);
                return obj;
            }),
            text: jest.fn((x, y, text, config) => {
                const obj = {
                    x, y, text, config,
                    id: nextId++,
                    setOrigin: jest.fn().mockReturnThis(),
                    setText: jest.fn().mockReturnThis(),
                    destroy: jest.fn(),
                    setVisible: jest.fn()
                };
                children.push(obj);
                return obj;
            }),
            circle: jest.fn((x, y, radius, color) => {
                const obj = {
                    x, y, radius, color,
                    id: nextId++,
                    setOrigin: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    destroy: jest.fn(),
                    setVisible: jest.fn().mockReturnThis(),
                    setActive: jest.fn().mockReturnThis()
                };
                children.push(obj);
                return obj;
            }),
            container: jest.fn((x, y) => {
                const containerChildren = [];
                const obj = {
                    x, y,
                    id: nextId++,
                    children: containerChildren,
                    add: jest.fn((child) => {
                        containerChildren.push(child);
                        return obj;
                    }),
                    clear: jest.fn((destroy) => {
                        if (destroy) {
                            for (const child of containerChildren) {
                                if (child.destroy) {child.destroy();}
                            }
                        }
                        containerChildren.length = 0;
                        return true;
                    }),
                    destroy: jest.fn()
                };
                children.push(obj);
                return obj;
            }),
            graphics: jest.fn(() => {
                const obj = {
                    id: nextId++,
                    lineStyle: jest.fn().mockReturnThis(),
                    fillStyle: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setAlpha: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
                    clear: jest.fn().mockReturnThis(),
                    destroy: jest.fn(),
                    fillCircle: jest.fn(),
                    strokeCircle: jest.fn()
                };
                children.push(obj);
                return obj;
            })
        },
        children: {
            list: children,
            getByName: jest.fn((name) => childrenMap.get(name) || null),
            getChildren: jest.fn(() => children),
            getAll: jest.fn(() => [...children])
        }
    };
}

/**
 * Erstellt einen Mock für EventBus
 */
export function createMockEventBus() {
    const subscribers = new Map();

    return {
        subscribers,
        subscribe: jest.fn((event, callback) => {
            if (!subscribers.has(event)) {
                subscribers.set(event, []);
            }
            subscribers.get(event).push(callback);
            return jest.fn(() => {
                const callbacks = subscribers.get(event);
                const index = callbacks.indexOf(callback);
                if (index >= 0) {
                    callbacks.splice(index, 1);
                }
            });
        }),
        publish: jest.fn((event, data) => {
            const callbacks = subscribers.get(event);
            if (callbacks) {
                for (const callback of callbacks) {
                    callback(data);
                }
            }
        }),
        clear: jest.fn(() => {
            subscribers.clear();
        })
    };
}

/**
 * Erstellt einen Mock für StorageManager
 */
export function createMockStorageManager(settings = {}) {
    return {
        settings: {
            soundEnabled: true,
            volume: 0.5,
            musicEnabled: true,
            ...settings
        },
        getSettings: jest.fn(function() {
            return this.settings;
        }),
        saveSettings: jest.fn(function(newSettings) {
            this.settings = { ...this.settings, ...newSettings };
        }),
        getHighScores: jest.fn(() => []),
        saveHighScore: jest.fn(() => {}),
        clear: jest.fn(() => {
            this.settings = { soundEnabled: true, volume: 0.5 };
        })
    };
}

/**
 * Erstellt einen Mock für PelletRenderer
 */
export function createMockPelletRenderer() {
    return {
        createPelletPools: jest.fn(),
        updatePelletVisuals: jest.fn(),
        eatPellet: jest.fn(),
        eatPowerPellet: jest.fn(),
        reset: jest.fn(),
        destroy: jest.fn()
    };
}

/**
 * Erstellt einen Mock für PlayerRenderer
 */
export function createMockPlayerRenderer() {
    return {
        update: jest.fn(),
        playDeathAnimation: jest.fn((callback) => {
            if (callback) {setTimeout(callback, 100);}
        }),
        setVisible: jest.fn(),
        destroy: jest.fn()
    };
}

/**
 * Erstellt einen Mock für GhostRenderer
 */
export function createMockGhostRenderer() {
    return {
        update: jest.fn(),
        setVisible: jest.fn(),
        setFrightened: jest.fn(),
        setEaten: jest.fn(),
        destroy: jest.fn()
    };
}

/**
 * Erstellt einen Mock für FruitRenderer
 */
export function createMockFruitRenderer() {
    return {
        update: jest.fn(),
        setVisible: jest.fn(),
        destroy: jest.fn()
    };
}

/**
 * Erstellt einen Mock für SoundManager
 */
export function createMockSoundManager() {
    return {
        setEnabled: jest.fn(),
        setVolume: jest.fn(),
        playPellet: jest.fn(),
        playPowerPellet: jest.fn(),
        playGhostEat: jest.fn(),
        playDeath: jest.fn(),
        playLevelClear: jest.fn(),
        playGameOver: jest.fn(),
        playEatFruit: jest.fn(),
        stop: jest.fn(),
        destroy: jest.fn()
    };
}

/**
 * Erstellt einen Mock für EffectManager
 */
export function createMockEffectManager() {
    return {
        showPowerUpEffect: jest.fn(),
        showScoreEffect: jest.fn(),
        showDeathEffect: jest.fn(),
        clear: jest.fn(),
        destroy: jest.fn()
    };
}

/**
 * Erstellt einen Mock für ViewContext
 */
export function createMockViewContext(overrides = {}) {
    return {
        scene: createMockScene(),
        storageManager: createMockStorageManager(),
        eventBus: createMockEventBus(),
        ...overrides
    };
}
