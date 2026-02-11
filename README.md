# Pac-Man Game

A modern, fully-featured Pac-Man game built with Phaser.js and Vite. This implementation includes all classic gameplay mechanics enhanced with modern visual effects, sound, mobile support, progressive difficulty, and a clean MVC architecture with decoupled systems.

![Pac-Man](https://img.shields.io/badge/Status-Stable-green) ![Phaser](https://img.shields.io/badge/Phaser-3.90+-blue) ![License](https://img.shields.io/badge/License-MIT-orange) ![Tests](https://img.shields.io/badge/Tests-1488%20passing-brightgreen)

## Features

### Core Gameplay
- **Classic Pac-Man mechanics**: Navigate the maze, eat pellets, avoid ghosts
- **Four unique ghosts**: Blinky, Pinky, Inky, and Clyde with distinct AI behaviors
- **Power pellets**: Turn ghosts blue and eat them for bonus points
- **Fruit bonuses**: Collect fruits for extra points (cherry, strawberry, orange, apple, melon, galaxian, bell, key)
- **Level progression**: Increasing difficulty with faster ghosts and shorter frightened durations
- **High score system**: Persistent high scores saved to localStorage

### Visual Enhancements
- **Enhanced maze rendering**: Walls with depth, shadows, and inner highlights
- **Improved Pac-Man**: Eye with pupil and shine, smooth mouth animation, rotation based on direction
- **Detailed ghosts**: Eyes that follow movement direction, wavy bottom, 3D highlights
- **Power pellet animations**: Pulsing effect with scale and alpha changes
- **Visual feedback**: Flash effects when eating ghosts and fruits
- **Background patterns**: Subtle grid pattern for depth
- **Animated UI**: Pulsing prompts, smooth transitions, glow effects

### Audio
- **Sound effects**: Web Audio API-generated sounds for:
  - Waka-waka when eating pellets
  - Power pellet activation
  - Ghost eaten
  - Death sequence
  - Level complete
  - Fruit collection

### Mobile Support
- **Touch controls**: Swipe gestures for movement
- **Responsive design**: Canvas scales to fit any screen size
- **Mobile hints**: On-screen instructions for mobile users

### User Experience
- **"How to Play" section**: Comprehensive instructions accessible from menu
- **Keyboard shortcuts**: P for pause, ESC to return to menu
- **Enhanced screens**: Improved game over and win screens with animations
- **"Ready!" countdown**: Brief pause before each level starts
- **Death pause**: Momentary pause when Pac-Man dies
- **High score display**: Shows current and all-time best

### Advanced Features
- **Replay System**: Record and replay gameplay sessions
- **Achievement System**: Unlock achievements for various accomplishments
- **Debug Overlay**: Optional FPS and collision telemetry overlay
- **Multiple Input Sources**: Keyboard, replay playback, AI-driven demo mode

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd pacman
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
```

The optimized files will be in the `dist` directory.

## Controls

### Desktop
- **Arrow Keys** or **WASD**: Move Pac-Man
- **P**: Pause/Resume game
- **ESC**: Return to menu
- **SPACE**: Start game / Continue / Return to menu
- **H**: Toggle "How to Play" section (from menu)

### Mobile
- **Swipe gestures**: Move Pac-Man in any direction
- **Tap**: Interact with UI elements

## Game Mechanics

### Scoring

| Item | Points |
|-------|---------|
| Pellet | 10 |
| Power Pellet | 50 |
| Ghost (1st) | 200 |
| Ghost (2nd) | 400 |
| Ghost (3rd) | 800 |
| Ghost (4th) | 1600 |
| Cherry | 100 |
| Strawberry | 300 |
| Orange | 500 |
| Apple | 700 |
| Melon | 1000 |
| Galaxian | 2000 |
| Bell | 3000 |
| Key | 5000 |

**Ghost Combo**: Eating multiple ghosts while frightened increases the score multiplier (200, 400, 800, 1600).

### Ghost Behaviors

- **Blinky (Red)**: Directly chases Pac-Man
- **Pinky (Pink)**: Targets 4 tiles ahead of Pac-Man
- **Inky (Cyan)**: Uses Blinky's position to calculate target
- **Clyde (Orange)**: Chases Pac-Man unless too close, then retreats

### Ghost Modes

1. **Scatter**: Ghosts move to their corner targets
2. **Chase**: Ghosts actively pursue Pac-Man
3. **Frightened**: Ghosts move randomly and can be eaten
4. **Eaten**: Ghost returns to the ghost house

### Level Progression

Each level increases difficulty:
- Ghosts move faster (5% speed increase per level)
- Frightened mode duration decreases (500ms less per level)
- New fruit types appear at higher levels

### Fruit System

Fruits appear when approximately 70% of pellets have been eaten:
- **Level 1**: Cherry (100 points)
- **Level 2**: Strawberry (300 points)
- **Level 3**: Orange (500 points)
- **Level 4**: Apple (700 points)
- **Level 5**: Melon (1000 points)
- **Level 6**: Galaxian (2000 points)
- **Level 7**: Bell (3000 points)
- **Level 8+**: Key (5000 points)

Fruits disappear after 10 seconds if not collected.

## Technical Details

### Architecture

The game follows a modern **MVC (Model-View-Controller)** architecture with decoupled systems:

```
src/
├── core/
│   ├── GameModel.js           # Pure game state (no Phaser deps)
│   └── EventBus.js          # Pub/sub for decoupled communication
├── model/
│   ├── GameStateController.js  # Headless game simulation
│   ├── entities/            # Pure data entities (PacmanState, GhostState, FruitState)
│   ├── systems/             # Model-level systems (ModelCollisionSystem, GhostAIAdapter)
│   └── adapters/            # Model/View bridge (CollisionAdapter, MovementAdapter)
├── controllers/
│   ├── GameController.js      # Input translation (no scene refs)
│   └── ActionRouter.js       # Routes actions with state validation
├── input/
│   ├── InputManager.js       # Multi-adapter coordinator
│   ├── InputAdapter.js      # Base adapter interface
│   └── adapters/
│       ├── KeyboardAdapter.js  # Keyboard input wrapper
│       ├── ReplayAdapter.js    # Replay playback/recording
│       └── AIInputAdapter.js  # AI-driven input
├── views/
│   ├── ModelDrivenGameView.js  # Pure observer view
│   └── visuals/
│       ├── VisualPacman.js   # Visual wrapper for Pacman
│       ├── VisualGhost.js    # Visual wrapper for Ghosts
│       └── VisualFruit.js   # Visual wrapper for Fruit
├── collision/
│   ├── CollisionEngine.js     # Decoupled collision detection
│   ├── shapes/              # Collision shape definitions
│   └── spatial/             # Spatial indexing
├── movement/
│   ├── MovementEngine.js      # Decoupled movement system
│   ├── strategies/           # Movement strategies
│   └── adapters/            # Maze query adapters
├── entities/
│   ├── BaseEntity.js         # Base entity class
│   ├── Pacman.js           # Player character
│   ├── Ghost.js            # Enemy entities
│   └── Fruit.js            # Bonus fruit entities
├── scenes/
│   ├── ModelDrivenGameScene.js  # Main MVC game scene
│   ├── MenuScene.js             # Main menu
│   ├── PauseScene.js            # Pause overlay
│   ├── GameOverScene.js         # Game over screen
│   ├── WinScene.js              # Level complete screen
│   └── SettingsScene.js         # Settings configuration
├── systems/
│   ├── GhostAISystem.js     # Ghost AI logic
│   ├── ReplaySystem.js      # Replay recording/playback
│   └── AchievementSystem.js  # Achievement tracking
├── managers/
│   ├── SoundManager.js      # Web Audio API wrapper
│   └── StorageManager.js    # LocalStorage wrapper
└── utils/
    ├── MazeLayout.js       # Maze data and utilities
    ├── TileMath.js         # Grid/pixel conversions
    └── movement/
        ├── DirectionBuffer.js   # Direction queue/apply pattern
        └── CenterSnapper.js    # Tile center snapping
```

### MVC Architecture Benefits

1. **Testability**: Model and Controller can be tested without Phaser (headless in Node.js)
2. **Separation of Concerns**: Game logic (Model) isolated from rendering (View) and input (Controller)
3. **Decoupling**: EventBus removes direct dependencies between components
4. **Swappable Input Sources**: Keyboard, Replay, AI all use the same interface via InputManager
5. **Pure Observer View**: View only renders model state, never modifies game logic

### Key Technologies

- **Phaser.js 3.90+**: Game engine for rendering and input handling
- **Vite 7.3+**: Build tool and development server
- **Jest 30.2+**: Testing framework with 76 test suites (1,488+ tests)
- **Web Audio API**: Sound generation without external audio files
- **localStorage**: High score, settings, and replay persistence

### Performance Optimizations

- **Frame rate limiting**: Capped at 60 FPS
- **Spatial partitioning**: Grid-based collision detection
- **Object pooling**: Reuse entities where possible
- **Efficient rendering**: Graphics objects reused and updated
- **Memory management**: Proper cleanup on scene transitions

### Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with touch support

## Development

### Project Structure

- **Model**: Pure game state in `src/core/GameModel.js` and `src/model/`
- **View**: Rendering in `src/views/` with Visual wrappers from model entities
- **Controller**: Input translation in `src/controllers/` with ActionRouter
- **Systems**: Reusable logic in `src/systems/` and `src/model/systems/`
- **Managers**: Cross-cutting services (sound, storage) in `src/managers/`
- **Utilities**: Helper functions in `src/utils/` for grid math, movement, collision

### Testing

- **76 test suites** covering all major components
- **1,488+ tests passing** with 100% success rate
- **Headless testing**: Model and Controller tested without Phaser
- **Integration tests**: Full game flow verification

### Adding New Features

1. **New ghost type**: Add ghost state to `src/model/entities/GhostState.js` and update `GhostAIAdapter`
2. **New fruit**: Add to `fruitConfig` in `src/config/gameConfig.js`
3. **New sound**: Add method to `src/managers/SoundManager.js`
4. **New scene**: Create in `src/scenes/` and register in `src/main.js`
5. **New input source**: Implement `InputAdapter` interface and register with `InputManager`

### Code Style

- JSDoc comments on all public methods
- Consistent naming conventions
- Error handling with try-catch
- No console.log statements in production

## Credits

### Original Game
- **Created by**: Toru Iwatani
- **Released by**: Namco (1980)
- **Inspired by**: Pizza with a slice missing

### This Implementation
- **Built with**: Phaser.js
- **Design**: Modern web technologies
- **License**: MIT

## License

MIT License - feel free to use this code for learning and projects.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

### Game won't start
- Ensure you're using a modern browser
- Check that JavaScript is enabled
- Try clearing your browser cache

### No sound
- Sound requires user interaction to initialize
- Try clicking anywhere on the page first
- Check your browser's audio permissions

### Mobile issues
- Ensure you're using a supported mobile browser
- Try refreshing the page
- Check that touch events are enabled

## Future Enhancements

Potential features for future versions:
- [ ] Multiplayer support
- [ ] Custom maze editor
- [ ] Additional ghost AI modes
- [ ] Power-ups beyond power pellets
- [ ] Online leaderboards
- [ ] Additional difficulty settings
- [ ] Network-based replay sharing
- [ ] Custom visual themes

## Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Enjoy the game! 🎮**
