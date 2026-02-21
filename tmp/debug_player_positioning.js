/**
 * Debug Player Positioning
 */

import { gameConfig, playerStartPosition } from '../src/config/gameConfig.js';
import { PlayerState } from '../src/model/entities/PlayerState.js';

console.log('=== Player Start Position Debug ===\n');

// Create player
const player = new PlayerState(playerStartPosition.x, playerStartPosition.y, 1);

console.log('Player State:');
console.log('  Grid position:', player.gridX, player.gridY);
console.log('  Pixel position:', player.x, player.y);
console.log('  Move progress:', player.moveProgress);
console.log('  Target grid:', player.targetGridX, player.targetGridY);
console.log('  Prev grid:', player.prevGridX, player.prevGridY);
console.log('  Direction:', player.direction);
console.log('  Is moving:', player.isMoving);

console.log('\nExpected (Tile Center):');
const expectedX = playerStartPosition.x * gameConfig.tileSize + gameConfig.tileSize / 2;
const expectedY = playerStartPosition.y * gameConfig.tileSize + gameConfig.tileSize / 2;
console.log('  Pixel position:', expectedX, expectedY);

console.log('\nMatch?', player.x === expectedX && player.y === expectedY);

console.log('\n=== VisualPlayer Constructor Debug ===\n');

const radius = gameConfig.tileSize * 0.4;
console.log('Player radius:', radius);
console.log('Tile size:', gameConfig.tileSize);

// Create hexagon points (flat array of x, y values)
const hexagonPoints = [];
for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    hexagonPoints.push(radius * Math.cos(angle));
    hexagonPoints.push(radius * Math.sin(angle));
}

console.log('\nHexagon points (relative to center):');
for (let i = 0; i < hexagonPoints.length; i += 2) {
    console.log(`  Point ${i/2}: x=${hexagonPoints[i].toFixed(2)}, y=${hexagonPoints[i+1].toFixed(2)}`);
}

console.log('\n=== Phaser Polygon Positioning ===\n');

console.log('Phaser.add.polygon(x, y, points, color)');
console.log('  x = player.x =', player.x);
console.log('  y = player.y =', player.y);
console.log('  points = relative to origin');
console.log('  setOrigin(0.5, 0.5) = origin at center of polygon');

console.log('\nExpected visual position:');
console.log('  Polygon center at:', player.x, player.y);
console.log('  Polygon extends from:', player.x - radius, player.y - radius);
console.log('  Polygon extends to:', player.x + radius, player.y + radius);

console.log('\nExpected tile center:');
const tileCenterX = playerStartPosition.x * gameConfig.tileSize + gameConfig.tileSize / 2;
const tileCenterY = playerStartPosition.y * gameConfig.tileSize + gameConfig.tileSize / 2;
console.log('  Tile center at:', tileCenterX, tileCenterY);
console.log('  Tile extends from:', tileCenterX - gameConfig.tileSize/2, tileCenterY - gameConfig.tileSize/2);
console.log('  Tile extends to:', tileCenterX + gameConfig.tileSize/2, tileCenterY + gameConfig.tileSize/2);

console.log('\n=== Eye Positioning ===\n');
console.log('Eye positioned at:');
console.log('  x = player.x =', player.x);
console.log('  y = player.y - radius * 0.3 =', player.y - radius * 0.3);

console.log('\nExpected eye offset (above player center):');
console.log('  Offset should be:', -radius * 0.3, 'pixels');
console.log('  Direction: UP (since rotation starts with -90 degrees)');
