# Pac-Man Game

A modern, fully-featured Pac-Man game built with Phaser.js and Vite. This implementation includes all classic gameplay mechanics enhanced with modern visual effects, sound, mobile support, and progressive difficulty.

![Pac-Man](https://img.shields.io/badge/Status-Stable-green) ![Phaser](https://img.shields.io/badge/Phaser-3.60+-blue) ![License](https://img.shields.io/badge/License-MIT-orange)

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

The game follows a component-based architecture:

```
src/
├── config/
│   └── gameConfig.js       # All game constants and settings
├── entities/
│   ├── Pacman.js           # Player character
│   ├── Ghost.js            # Enemy entities
│   ├── GhostFactory.js      # Ghost creation and management
│   └── Fruit.js            # Bonus fruit entities
├── managers/
│   ├── SoundManager.js      # Audio system
│   └── StorageManager.js    # LocalStorage wrapper
├── scenes/
│   ├── MenuScene.js        # Main menu
│   ├── GameScene.js        # Main gameplay
│   ├── PauseScene.js       # Pause overlay
│   ├── GameOverScene.js    # Game over screen
│   └── WinScene.js        # Level complete screen
├── systems/
│   ├── CollisionSystem.js    # Collision detection
│   └── GhostAISystem.js   # Ghost AI logic
└── utils/
    └── MazeLayout.js       # Maze data and utilities
```

### Key Technologies

- **Phaser.js 3.60+**: Game engine for rendering and input handling
- **Vite**: Build tool and development server
- **Web Audio API**: Sound generation without external audio files
- **localStorage**: High score persistence

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

- **Config**: All game constants in `src/config/gameConfig.js`
- **Entities**: Game objects with update loops and rendering
- **Scenes**: Phaser scenes managing game states
- **Systems**: Reusable game logic (collision, AI)
- **Managers**: Cross-scene utilities (sound, storage)

### Adding New Features

1. **New ghost type**: Add to `GhostFactory.js` and `GhostAISystem.js`
2. **New fruit**: Add to `fruitConfig` in `gameConfig.js`
3. **New sound**: Add method to `SoundManager.js`
4. **New scene**: Create in `src/scenes/` and add to `main.js`

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
- [ ] Leaderboards (online)
- [ ] Achievements system
- [ ] Additional difficulty settings
- [ ] Replay system

## Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Enjoy the game! 🎮**
