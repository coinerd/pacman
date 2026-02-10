// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Debug actual GridMovement with inline logging', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Inject logging into GridMovement
  await page.evaluate(() => {
    // Override moveEntityOnGrid to add logging
    const originalModule = window.GridMovement;
    console.log('Original module:', originalModule);
  });

  // Press right and collect multiple samples
  await page.keyboard.press('ArrowRight');
  
  const traces = [];
  for (let i = 0; i < 20; i++) {
    const state = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const model = gameScene.gameModel;
      const pacman = model.pacman;
      const TILE_SIZE = 20;
      
      // Calculate tile center
      const centerX = pacman.gridX * TILE_SIZE + TILE_SIZE / 2;
      const centerY = pacman.gridY * TILE_SIZE + TILE_SIZE / 2;
      
      // Calculate distance to center
      const distToCenter = Math.hypot(centerX - pacman.x, centerY - pacman.y);
      
      // Check canMove for current direction
      const maze = model.maze;
      const canMove = (() => {
        if (!pacman.direction || (pacman.direction.x === 0 && pacman.direction.y === 0)) {
          return false;
        }
        const nextX = pacman.gridX + pacman.direction.x;
        const nextY = pacman.gridY + pacman.direction.y;
        if (nextY < 0 || nextY >= maze.length || nextX < 0 || nextX >= maze[0].length) {
          return false;
        }
        return maze[nextY][nextX] === 0;
      })();
      
      return {
        x: pacman.x,
        y: pacman.y,
        gridX: pacman.gridX,
        gridY: pacman.gridY,
        centerX,
        centerY,
        distToCenter,
        direction: pacman.direction,
        isMoving: pacman.isMoving,
        canMove,
        speed: pacman.speed,
        buffered: pacman.directionBuffer.getBuffered(),
        tickCount: model.tickCount
      };
    });
    
    traces.push({ frame: i, ...state });
    await page.waitForTimeout(50);
  }

  console.log('=== DETAILED MOVEMENT TRACE ===');
  console.log('Format: frame | pos(x,y) | grid(x,y) | distToCenter | direction | canMove | isMoving | speed | buffered');
  for (const t of traces) {
    const dirStr = t.direction ? `${t.direction.x},${t.direction.y}` : 'none';
    const bufStr = t.buffered ? `${t.buffered.x},${t.buffered.y}` : 'none';
    console.log(
      `${t.frame.toString().padStart(2)} | ` +
      `pos(${t.x.toFixed(2).padStart(6)},${t.y.toFixed(2).padStart(6)}) | ` +
      `grid(${t.gridX.toString().padStart(2)},${t.gridY.toString().padStart(2)}) | ` +
      `dist=${t.distToCenter.toFixed(2).padStart(5)} | ` +
      `dir(${dirStr.padStart(3)}) | ` +
      `can=${t.canMove.toString().padStart(5)} | ` +
      `move=${t.isMoving.toString().padStart(5)} | ` +
      `speed=${t.speed.toString().padStart(3)} | ` +
      `buf(${bufStr}) | ` +
      `ticks=${t.tickCount}`
    );
  }

  // Check for movement
  const firstX = traces[0].x;
  const lastX = traces[traces.length - 1].x;
  const totalMove = Math.abs(lastX - firstX);
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`First X: ${firstX.toFixed(2)}`);
  console.log(`Last X: ${lastX.toFixed(2)}`);
  console.log(`Total movement: ${totalMove.toFixed(2)} pixels`);
  
  expect(totalMove).toBeGreaterThan(5);
});

test('Compare with ghost movement', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Trace both Pacman and Blinky
  const traces = [];
  
  for (let i = 0; i < 15; i++) {
    const state = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const model = gameScene.gameModel;
      const pacman = model.pacman;
      const blinky = model.ghosts.find(g => g.ghostType === 'blinky');
      
      return {
        pacman: {
          x: pacman.x,
          y: pacman.y,
          direction: pacman.direction,
          isMoving: pacman.isMoving,
          speed: pacman.speed
        },
        blinky: {
          x: blinky.x,
          y: blinky.y,
          direction: blinky.direction,
          isMoving: blinky.isMoving,
          speed: blinky.speed
        }
      };
    });
    
    traces.push({ frame: i, ...state });
    await page.waitForTimeout(100);
  }

  console.log('=== PACMAN vs BLINKY MOVEMENT ===');
  console.log('Frame | Pacman(x) | Pacman(dir) | Blinky(x) | Blinky(dir)');
  for (const t of traces) {
    const pDir = t.pacman.direction ? `${t.pacman.direction.x},${t.pacman.direction.y}` : 'none';
    const bDir = t.blinky.direction ? `${t.blinky.direction.x},${t.blinky.direction.y}` : 'none';
    console.log(
      `${t.frame.toString().padStart(5)} | ` +
      `${t.pacman.x.toFixed(2).padStart(9)} | ` +
      `${pDir.padStart(9)} | ` +
      `${t.blinky.x.toFixed(2).padStart(9)} | ` +
      `${bDir.padStart(9)}`
    );
  }

  // Calculate movement
  const pacmanMove = Math.abs(traces[traces.length - 1].pacman.x - traces[0].pacman.x);
  const blinkyMove = Math.abs(traces[traces.length - 1].blinky.x - traces[0].blinky.x);
  
  console.log(`\nPacman moved: ${pacmanMove.toFixed(2)} pixels`);
  console.log(`Blinky moved: ${blinkyMove.toFixed(2)} pixels`);
});
