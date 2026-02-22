# Phase 2 Quick Reference: Scene-Transition Handler

## How to Use Scene-Transition Handler

### In Your View

Instead of calling `this.scene.scene.start()` directly:

```javascript
// ❌ OLD WAY (don't use anymore)
this.scene.scene.start('WinScene', { score: 100, level: 1 });

// ✅ NEW WAY (use SceneTransitionHandler)
this.transitionHandler.requestSceneTransition('WinScene', {
    score: 100,
    level: 1
});
```

### Setup in View Constructor

```javascript
import { SceneTransitionHandler } from './SceneTransitionHandler.js';

export class YourView {
    constructor(context) {
        this.scene = context.scene;
        this.eventBus = context.eventBus;

        // Create the transition handler
        this.transitionHandler = new SceneTransitionHandler({
            eventBus: this.eventBus
        });
    }
}
```

### Available Scenes

| Scene Key | Event Name | Usage |
|-----------|------------|-------|
| `'WinScene'` | `'GAME_WIN'` | Player wins level/game |
| `'GameOverScene'` | `'GAME_OVER'` | Player loses all lives |
| `'MenuScene'` | `'RETURN_TO_MENU'` | Return to main menu |
| `'PauseScene'` | `'PAUSE_GAME'` | Pause the game |
| `'SettingsScene'` | `'OPEN_SETTINGS'` | Open settings |
| Custom | `'NAVIGATE_TO_{NAME}'` | Any custom scene |

### Helper Methods

```javascript
// Pause the game
this.transitionHandler.requestPause();

// Resume the game
this.transitionHandler.requestResume();

// Restart the level
this.transitionHandler.requestRestart();

// Return to menu
this.transitionHandler.requestReturnToMenu();
```

## In Your Controller

### Setup

```javascript
export class YourController {
    constructor({ gameModel }) {
        this.gameModel = gameModel;
    }

    bindSceneTransitionEvents() {
        // This is already implemented in GameController
        // Just call it when initializing
    }
}
```

### In Your Scene

```javascript
export class GameScene extends Phaser.Scene {
    create() {
        // Create controller
        this.gameController = new GameController({
            gameModel: this.gameModel
        });

        // Bind transition events
        this.gameController.bindSceneTransitionEvents();

        // Listen for scene transitions
        gameEvents.on('GAME_WIN', (data) => {
            this.scene.start('WinScene', data);
        });

        gameEvents.on('GAME_OVER', (data) => {
            this.scene.start('GameOverScene', data);
        });
    }

    cleanup() {
        // Unbind events before destroying
        this.gameController.unbindSceneTransitionEvents();
    }
}
```

## Event Flow

```
View
  ↓ requestSceneTransition('WinScene', data)
SceneTransitionHandler
  ↓ emits 'GAME_WIN' event
GameController
  ↓ emits 'SCENE_TRANSITION:WinScene' event
GameScene
  ↓ scene.start('WinScene', data)
WinScene (launched)
```

## Common Patterns

### Pattern 1: Transition on Level Complete

```javascript
// In View
gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, () => {
    const score = this.lastSnapshot.score;
    const level = this.lastSnapshot.level;
    const highScore = this.lastSnapshot.highScore;

    this.storageManager.saveHighScore(highScore);
    this.transitionHandler.requestSceneTransition('WinScene', {
        score,
        level,
        highScore
    });
});
```

### Pattern 2: Transition on Game Over

```javascript
// In View
gameEvents.on(GAME_EVENTS.GAME_OVER, () => {
    const score = this.lastSnapshot.score;
    const highScore = this.lastSnapshot.highScore;

    this.storageManager.saveHighScore(highScore);
    this.transitionHandler.requestSceneTransition('GameOverScene', {
        score,
        highScore
    });
});
```

### Pattern 3: Return to Menu on User Request

```javascript
// In View
gameEvents.on(GAME_EVENTS.RETURN_TO_MENU_REQUESTED, () => {
    this.scene.cleanup();
    this.transitionHandler.requestSceneTransition('MenuScene', {
        from: 'GameScene'
    });
});
```

### Pattern 4: Pause Game

```javascript
// In View
gameEvents.on(GAME_EVENTS.PAUSE_REQUESTED, () => {
    // Scene pause logic (still handled by Scene)
    this.scene.scene.pause();
    this.scene.scene.launch('PauseScene');
});

// Or via handler
this.transitionHandler.requestPause();
```

## Testing

### Unit Test Example

```javascript
import { SceneTransitionHandler } from '../src/views/SceneTransitionHandler.js';

test('should emit GAME_WIN event for WinScene', (done) => {
    const handler = new SceneTransitionHandler({ eventBus: gameEvents });

    gameEvents.on('GAME_WIN', (data) => {
        expect(data.sceneKey).toBe('WinScene');
        expect(data.data).toEqual({ score: 100 });
        done();
    });

    handler.requestSceneTransition('WinScene', { score: 100 });
});
```

### Integration Test Example

```javascript
test('should complete flow: View → Handler → Controller → Scene', (done) => {
    const handler = new SceneTransitionHandler({ eventBus: gameEvents });
    const controller = new GameController({ gameModel });
    controller.bindSceneTransitionEvents();

    gameEvents.on('SCENE_TRANSITION:WinScene', (data) => {
        expect(data).toEqual({ score: 100, level: 1 });
        done();
    });

    handler.requestSceneTransition('WinScene', { score: 100, level: 1 });
});
```

## Troubleshooting

### Transition Not Working

1. **Check event bus:** Ensure `eventBus` is passed to SceneTransitionHandler
2. **Check controller binding:** Ensure `bindSceneTransitionEvents()` is called
3. **Check scene listeners:** Ensure Scene listens for the transition event
4. **Check event names:** Verify event names match mapping

### Multiple Transitions Firing

1. **Check event cleanup:** Ensure `unbindSceneTransitionEvents()` is called on destroy
2. **Check duplicate listeners:** Search for multiple `on()` calls for same event
3. **Check event propagation:** Use `event.stopPropagation()` if needed

### Data Not Passed

1. **Check data parameter:** Ensure data is passed to `requestSceneTransition()`
2. **Check event payload:** Verify event data structure includes `{ sceneKey, data, timestamp }`
3. **Check scene init:** Ensure Scene `init()` method accepts data parameter

## Migration Checklist

- [ ] Import SceneTransitionHandler in View
- [ ] Create SceneTransitionHandler instance in View constructor
- [ ] Replace all `scene.start()` calls with `transitionHandler.requestSceneTransition()`
- [ ] Call `bindSceneTransitionEvents()` in Scene create()
- [ ] Add scene transition event listeners in Scene
- [ ] Call `unbindSceneTransitionEvents()` in Scene cleanup()
- [ ] Write tests for new transitions
- [ ] Update documentation

## Best Practices

1. **Always use SceneTransitionHandler** - Never call `scene.start()` directly from View
2. **Pass complete data** - Include all needed data in transition request
3. **Cleanup properly** - Always unbind events when destroying
4. **Test thoroughly** - Write unit and integration tests
5. **Document custom scenes** - Add new scene keys to documentation
6. **Handle errors** - Add try-catch blocks for transition logic

## Related Files

- `src/views/SceneTransitionHandler.js` - Handler implementation
- `src/controllers/GameController.js` - Controller event handling
- `src/views/ModelDrivenGameView.js` - View usage example
- `src/scenes/GameScene.js` - Scene usage example
- `tests/SceneTransitionHandler.test.js` - Unit tests
- `tests/GameController.test.js` - Controller tests
- `tests/SceneTransitionIntegration.test.js` - Integration tests

## Further Reading

- [Phase 2 Implementation Summary](./PHASE2_IMPLEMENTATION_SUMMARY.md)
- [View Decoupling Plan](./VIEW_DECOUPLING_PLAN.md)
- [EventBus Documentation](../src/core/EventBus.js)
- [ViewInterface Documentation](../src/views/ViewInterface.js)
