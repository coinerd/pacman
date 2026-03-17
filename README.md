# ADA-Woman

A modern, fully-featured tech-themed maze game built with Phaser.js and Vite. This implementation includes maze-chase gameplay mechanics enhanced with modern visual effects, sound, mobile support, progressive difficulty, and a clean MVC architecture with decoupled systems.

![ADA-Woman](https://img.shields.io/badge/Status-Stable-green) ![Phaser](https://img.shields.io/badge/Phaser-3.80-blue) ![License](https://img.shields.io/badge/License-MIT-orange) ![Tests](https://img.shields.io/badge/Tests-1488%20passing-brightgreen)

## Features

### Core Gameplay
- **Tech-themed maze mechanics**: Navigate the digital network, collect data bits, avoid viruses
- **Four unique viruses**: Alpha, Beta, Gamma, and Delta with distinct AI behaviors
- **Power packets**: Decrypt viruses temporarily, allowing you to eliminate them for bonus points
- **Data fragments**: Collect data for extra points
- **Level progression**: Increasing difficulty with faster viruses and shorter decrypted durations
- **High score system**: Persistent high scores saved to localStorage
- **Story mode**: Narrative chapters with boss battles
- **Additional power-ups**: Shield, Speed Boost, Data Magnet

### Visual Enhancements
- **Enhanced maze rendering**: Circuit-style walls with glow and digital aesthetics
- **Detailed ADA-Woman**: Hexagonal design with digital eye, smooth rotation and pulse animations
- **Detailed viruses**: Geometric shapes with eyes that track movement direction
- **Power packet animations**: Glowing pulsing effects with scale and alpha changes
- **Visual feedback**: Flash effects when eliminating viruses and collecting data
- **Background patterns**: Digital grid pattern for depth
- **Animated UI**: Pulsing prompts, smooth transitions, glow effects

### Audio
- **Sound effects**: Web Audio API-generated tech-themed sounds for:
  - Digital data crunch when collecting data bits
  - Power packet activation
  - Virus elimination
  - System crash sequence
  - Data upload complete
  - Data fragment collection
  - Boss battle sounds

### Mobile Support
- **Touch controls**: Swipe gestures for movement
- **Responsive design**: Canvas scales to fit any screen size
- **Mobile hints**: On-screen instructions for mobile users

### User Experience
- **"How to Play" section**: Comprehensive instructions accessible from menu
- **Keyboard shortcuts**: P for pause, ESC to return to menu
- **Enhanced screens**: Improved game over and win screens with animations
- **"Ready!" countdown**: Brief pause before each level starts
- **Death pause**: Momentary pause when ADA-Woman dies
- **High score display**: Shows current and all-time best

### Maze Randomization System

The game features a sophisticated maze randomization system with multiple difficulty presets:

- **5 Difficulty Presets**: default, easy, medium, hard, expert
- **Seed-based Generation**: Reproducible mazes for replays and daily challenges
- **Level Scaling**: Progressive difficulty increase with each level
- **Rule-based Validation**: All generated mazes meet quality criteria

#### Presets

| Preset | Path Density | Dead Ends | Difficulty |
|--------|--------------|-----------|------------|
| Easy | 85% | Low | Beginner-friendly |
| Medium | 70% | Moderate | Balanced |
| Hard | 55% | High | Challenging |
| Expert | 45% | Very High | For masters |

#### Seed Modes

- **full_random**: Every level gets a unique random seed (arcade mode)
- **level_sequence**: Predictable sequence for speedruns
- **daily_challenge**: Same seed for all players on a given day
- **seeded**: Manual seed for replays and debugging

#### API Usage

```javascript
import GameModel from './src/model/core/GameModel.js';

// Start with a specific preset
const gameModel = new GameModel({
    mazePreset: 'hard',
    seedMode: 'level_sequence'
});

// Get seed info for replay
const seedInfo = gameModel.getMazeSeedInfo();

// Create replay record
const record = gameModel.createMazeReplayRecord();
```

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
- **Arrow Keys** or **WASD**: Move ADA-Woman
- **P**: Pause/Resume game
- **ESC**: Return to menu
- **SPACE**: Start game / Continue / Return to menu
- **H**: Toggle "How to Play" section (from menu)

### Mobile
- **Swipe gestures**: Move ADA-Woman in any direction
- **Tap**: Interact with UI elements

## Game Mechanics

### Scoring

| Item | Points |
|-------|---------|
| Data Bit | 10 |
| Power Packet | 50 |
| Virus (1st) | 200 |
| Virus (2nd) | 400 |
| Virus (3rd) | 800 |
| Virus (4th) | 1600 |
| Data Fragment | Various |

**Virus Combo**: Eliminating multiple viruses while decrypted increases the score multiplier (200, 400, 800, 1600).

### Virus Behaviors

- **Alpha (Purple)**: Directly chases ADA-Woman
- **Beta (Green)**: Predicts movement, cuts off paths
- **Gamma (Red)**: Moves erratically/randomly
- **Delta (Orange)**: Follows ADA-Woman slowly but relentlessly

### Virus Modes

1. **Patrol**: Viruses move to their patrol targets
2. **Hunt**: Viruses actively pursue ADA-Woman
3. **Decrypted**: Viruses move randomly and can be eliminated
4. **Eliminated**: Virus returns to the virus core

### Level Progression

Each level increases difficulty:
- Viruses move faster (5% speed increase per level)
- Decrypted mode duration decreases (500ms less per level)
- New data fragment types appear at higher levels
- Boss battles at specific levels

### Data Fragment System

Data fragments appear when approximately 70% of data bits have been collected:
- Fragments disappear after 10 seconds if not collected
- Each level introduces new fragment types with increasing point values

### Boss Battles

Multi-phase boss encounters at specific levels:
- Alpha Virus Boss: Direct pursuit with phase-based speed increases
- Beta Virus Boss: Ambush tactics with variable speed
- Gamma Virus Boss: Erratic movement with speed phases
- Delta Virus Boss: Proximity behavior with speed phases

### Additional Power-Ups

- **Shield**: Temporary invincibility (visual cyan shield)
- **Speed Boost**: Increased movement speed with trail effect
- **Data Magnet**: Attracts nearby data bits (expanding field effect)

## Technical Details

### Architecture

The game follows a modern **MVC (Model-View-Controller)** architecture with decoupled systems:

```
src/
├── core/
│   ├── GameModel.js           # Pure game state (no Phaser deps)
│   └── EventBus.js          # Pub/sub for decoupled communication
├── model/
│   ├── ModelEntity.js          # Base class for pure data entities
│   ├── entities/              # Pure data entities (PlayerState, EnemyState, FruitState)
│   └── adapters/             # AI adapters (EnemyAIAdapter, GhostAIAdapter)
├── controllers/
│   └── GameController.js     # Input translation (no scene refs)
├── views/
│   ├── ModelDrivenGameView.js  # Pure observer view
│   └── components/           # Visual wrappers (PlayerRenderer, GhostRenderer, FruitRenderer)
├── input/
│   ├── InputManager.js        # Multi-adapter coordinator
│   ├── InputAdapter.js       # Base adapter interface
│   └── adapters/            # Keyboard, Replay, AI adapters
├── systems/
│   ├── EnemyAISystem.js      # Virus AI logic
│   ├── AchievementSystem.js   # Achievement tracking
│   ├── ReplaySystem.js        # Replay recording/playback
│   ├── BossBattleSystem.js   # Multi-phase boss battles
│   ├── AdditionalPowerUpSystem.js # Shield, Speed Boost, Data Magnet
│   ├── StoryMode.js          # Narrative chapters
│   └── FixedTimeStepLoop.js  # Fixed-step update loop
├── scenes/
│   ├── GameScene.js          # Main gameplay scene (MVC coordinator)
│   ├── MenuScene.js          # Main menu
│   ├── PauseScene.js         # Pause overlay
│   ├── GameOverScene.js      # Game over screen
│   ├── WinScene.js           # Level complete screen
│   ├── SettingsScene.js      # Settings configuration
│   └── systems/             # Scene subsystems (UI, GameFlow, Death, Level)
├── managers/
│   ├── SoundManager.js       # Web Audio API wrapper
│   └── StorageManager.js     # LocalStorage wrapper
├── pools/
│   ├── PelletPool.js        # Object pool for pellets
│   └── PowerPelletPool.js   # Object pool for power pellets
└── utils/
    ├── MazeLayout.js         # Maze data and utilities
    ├── MazeGenerator.js      # Procedural maze generation
    ├── TileMath.js           # Grid/pixel conversions
    ├── TileMovement.js       # Movement utilities
    ├── WarpTunnel.js         # Tunnel/warp behavior
    ├── CollisionUtils.js      # Collision math
    └── movement/            # Movement utilities (DirectionBuffer, etc.)
```

### MVC Architecture Benefits

1. **Testability**: Model and Controller can be tested without Phaser (headless in Node.js)
2. **Separation of Concerns**: Game logic (Model) isolated from rendering (View) and input (Controller)
3. **Decoupling**: EventBus removes direct dependencies between components
4. **Swappable Input Sources**: Keyboard, Replay, AI all use the same interface via InputManager
5. **Pure Observer View**: View only renders model state, never modifies game logic
6. **Easy Theming**: Visual layer can be completely replaced without touching game logic

### Key Technologies

- **Phaser.js 3.80.1**: Game engine for rendering and input handling
- **Vite 5.0+**: Build tool and development server
- **Jest**: Testing framework with 76 test suites (1,488+ tests)
- **Web Audio API**: Sound generation without external audio files
- **localStorage**: High score, settings, and replay persistence

### Performance Optimizations

- **Frame rate limiting**: Capped at 60 FPS
- **Fixed timestep**: 60Hz deterministic game logic
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
- **Controller**: Input translation in `src/controllers/` with GameController
- **Systems**: Reusable logic in `src/systems/`
- **Managers**: Cross-cutting services (sound, storage) in `src/managers/`
- **Utilities**: Helper functions in `src/utils/` for grid math, movement, collision

### Testing

- **76 test suites** covering all major components
- **1,488+ tests passing** with 100% success rate
- **Headless testing**: Model and Controller tested without Phaser
- **Integration tests**: Full game flow verification

### Adding New Features

1. **New enemy type**: Add enemy state to `src/model/entities/EnemyState.js` and update `EnemyAIAdapter`
2. **New data fragment**: Add to `fruitConfig` in `src/config/gameConfig.js`
3. **New sound**: Add method to `src/managers/SoundManager.js` or `TechSoundManager.js`
4. **New scene**: Create in `src/scenes/` and register in `src/main.js`
5. **New input source**: Implement `InputAdapter` interface and register with `InputManager`

### Code Style

- JSDoc comments on all public methods
- Consistent naming conventions
- Error handling with try-catch
- No console.log statements in production

## Credits

### This Game
- **Game**: ADA-Woman
- **Built with**: Phaser.js
- **Design**: Modern web technologies
- **License**: MIT

## License

MIT License - feel free to use this code for learning and projects.

## Contributing

Contributions are welcome! Please:
1. Fork repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please ensure all changes align with the tech-themed aesthetic of ADA-Woman.

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
- [ ] Additional virus AI modes
- [ ] Additional boss battle types
- [ ] Online leaderboards
- [ ] Additional difficulty settings
- [ ] Network-based replay sharing
- [ ] Custom visual themes

## Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Enjoy ADA-Woman! 🎮**
