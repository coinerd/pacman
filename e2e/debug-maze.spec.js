// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Debug maze walkability at Pacman position', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Check maze at Pacman's position
  const mazeInfo = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    const maze = model.maze;
    
    const gridX = pacman.gridX;
    const gridY = pacman.gridY;
    
    // Check all directions
    const directions = [
      { name: 'UP', x: 0, y: -1 },
      { name: 'DOWN', x: 0, y: 1 },
      { name: 'LEFT', x: -1, y: 0 },
      { name: 'RIGHT', x: 1, y: 0 }
    ];
    
    const results = [];
    for (const dir of directions) {
      const nextX = gridX + dir.x;
      const nextY = gridY + dir.y;
      const inBounds = nextY >= 0 && nextY < maze.length && nextX >= 0 && nextX < maze[0].length;
      const walkable = inBounds ? maze[nextY][nextX] === 0 : false;
      results.push({
        dir: dir.name,
        from: `(${gridX}, ${gridY})`,
        to: `(${nextX}, ${nextY})`,
        inBounds,
        mazeValue: inBounds ? maze[nextY][nextX] : 'N/A',
        walkable
      });
    }
    
    return {
      pacmanPos: { x: pacman.x, y: pacman.y, gridX, gridY },
      mazeDims: { height: maze.length, width: maze[0].length },
      directions: results,
      mazeRow22: maze[22],
      mazeRow23: maze[23]
    };
  });

  console.log('=== MAZE INFO ===');
  console.log('Pacman position:', mazeInfo.pacmanPos);
  console.log('Maze dimensions:', mazeInfo.mazeDims);
  console.log('\nWalkability from Pacman position:');
  for (const d of mazeInfo.directions) {
    console.log(`  ${d.dir}: ${d.from} -> ${d.to}, value=${d.mazeValue}, walkable=${d.walkable}`);
  }
  
  console.log('\nMaze row 22 (Pacman\'s row):');
  console.log(mazeInfo.mazeRow22.map((v, i) => `${i}:${v}`).join(', '));
});

test('Debug GridMovement step by step', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Press right and trace one step
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);

  // Manually simulate what GridMovement does
  const trace = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    const maze = model.maze;
    
    const TILE_SIZE = 20;
    const EPS = 2;
    
    function tileCenter(gridX, gridY) {
      return {
        x: gridX * TILE_SIZE + TILE_SIZE / 2,
        y: gridY * TILE_SIZE + TILE_SIZE / 2
      };
    }
    
    function canMove(tileX, tileY, direction) {
      const nextGridX = tileX + direction.x;
      const nextGridY = tileY + direction.y;
      
      if (nextGridY < 0 || nextGridY >= maze.length || nextGridX < 0 || nextGridX >= maze[0].length) {
        return false;
      }
      return maze[nextGridY][nextGridX] === 0;
    }
    
    // Initial state
    const initial = {
      x: pacman.x,
      y: pacman.y,
      gridX: pacman.gridX,
      gridY: pacman.gridY,
      direction: pacman.direction
    };
    
    // Check tile center
    const center = tileCenter(pacman.gridX, pacman.gridY);
    const distToCenter = Math.hypot(center.x - pacman.x, center.y - pacman.y);
    const atCenter = distToCenter <= EPS;
    
    // Check canMove
    const canMoveRight = canMove(pacman.gridX, pacman.gridY, {x: 1, y: 0});
    
    // Check next tile
    const nextX = pacman.gridX + 1;
    const nextY = pacman.gridY;
    const nextTileValue = maze[nextY][nextX];
    
    return {
      initial,
      center,
      distToCenter,
      atCenter,
      canMoveRight,
      nextTile: { x: nextX, y: nextY, value: nextTileValue }
    };
  });

  console.log('=== GRID MOVEMENT TRACE ===');
  console.log('Initial state:', trace.initial);
  console.log('Tile center:', trace.center);
  console.log('Distance to center:', trace.distToCenter);
  console.log('At center:', trace.atCenter);
  console.log('Can move right:', trace.canMoveRight);
  console.log('Next tile:', trace.nextTile);
});
