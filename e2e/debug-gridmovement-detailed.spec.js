// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Debug GridMovement with injected tracing', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Inject a tracing version of moveEntityOnGrid
  await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    
    // Store original
    const originalModule = window.GridMovement;
    
    // We can't easily replace the module, but let's trace through the model
    const originalPacmanUpdate = gameScene.gameModel.pacman.update.bind(gameScene.gameModel.pacman);
    gameScene.gameModel.pacman.update = function(deltaSeconds, maze, inputDirection) {
      console.log('[PACMAN UPDATE] input:', inputDirection, 'current dir:', this.direction, 'pos:', this.x.toFixed(2), this.y.toFixed(2));
      const result = originalPacmanUpdate(deltaSeconds, maze, inputDirection);
      console.log('[PACMAN UPDATE DONE] new pos:', this.x.toFixed(2), this.y.toFixed(2), 'dir:', this.direction);
      return result;
    };
  });

  // Press right
  await page.keyboard.press('ArrowRight');
  
  // Trace
  const traces = [];
  for (let i = 0; i < 10; i++) {
    const state = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const pacman = gameScene.gameModel.pacman;
      
      return {
        x: pacman.x,
        y: pacman.y,
        direction: pacman.direction,
        isMoving: pacman.isMoving
      };
    });
    
    traces.push({ frame: i, ...state });
    await page.waitForTimeout(100);
  }

  console.log('=== PACMAN TRACE WITH INJECTION ===');
  for (const t of traces) {
    const dirStr = t.direction ? `${t.direction.x},${t.direction.y}` : 'none';
    console.log(`Frame ${t.frame}: pos(${t.x.toFixed(2)}, ${t.y.toFixed(2)}) dir=(${dirStr}) isMoving=${t.isMoving}`);
  }
});

test('Simulate GridMovement step by step manually', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Manually simulate what GridMovement should do
  const simulation = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    
    const TILE_SIZE = 20;
    const EPS = 2;
    
    function tileCenter(gridX, gridY) {
      return {
        x: gridX * TILE_SIZE + TILE_SIZE / 2,
        y: gridY * TILE_SIZE + TILE_SIZE / 2
      };
    }
    
    function canMove(tileX, tileY, direction) {
      if (!direction || (direction.x === 0 && direction.y === 0)) return false;
      const nextX = tileX + direction.x;
      const nextY = tileY + direction.y;
      if (nextY < 0 || nextY >= model.maze.length || nextX < 0 || nextX >= model.maze[0].length) {
        return false;
      }
      return model.maze[nextY][nextX] === 0;
    }
    
    // Set initial state like after first movement
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    const trace = [];
    
    // Simulate 5 update cycles
    for (let i = 0; i < 5; i++) {
      const before = {
        x: pacman.x,
        y: pacman.y,
        gridX: pacman.gridX,
        gridY: pacman.gridY,
        direction: { ...pacman.direction }
      };
      
      // Calculate center and distance
      const center = tileCenter(pacman.gridX, pacman.gridY);
      const distToCenter = Math.hypot(center.x - pacman.x, center.y - pacman.y);
      const atCenter = distToCenter <= EPS;
      
      trace.push({
        step: i,
        before,
        center,
        distToCenter,
        atCenter,
        canMoveRight: canMove(pacman.gridX, pacman.gridY, pacman.direction)
      });
      
      // Simulate what should happen in GridMovement
      const deltaSeconds = 1/60;
      const moveDist = pacman.speed * deltaSeconds;
      
      if (atCenter) {
        // At center - check if can continue in current direction
        if (canMove(pacman.gridX, pacman.gridY, pacman.direction)) {
          // Move in current direction
          pacman.x += pacman.direction.x * moveDist;
          pacman.y += pacman.direction.y * moveDist;
        }
      } else {
        // Not at center - move toward center or continue
        pacman.x += pacman.direction.x * moveDist;
        pacman.y += pacman.direction.y * moveDist;
      }
    }
    
    return trace;
  });

  console.log('=== MANUAL SIMULATION ===');
  for (const s of simulation) {
    console.log(`Step ${s.step}:`);
    console.log(`  Before: (${s.before.x.toFixed(2)}, ${s.before.y.toFixed(2)})`);
    console.log(`  Center: (${s.center.x}, ${s.center.y})`);
    console.log(`  Dist to center: ${s.distToCenter.toFixed(2)}, atCenter: ${s.atCenter}`);
    console.log(`  Can move right: ${s.canMoveRight}`);
  }
});

test('Check actual GridMovement behavior vs expected', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Set specific state and observe movement
  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    
    // Set state like after first movement
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    const before = { x: pacman.x, y: pacman.y };
    
    // Call pacman.update directly
    const events = pacman.update(1/60, model.maze, null);
    
    return {
      before,
      after: { x: pacman.x, y: pacman.y },
      delta: { x: pacman.x - before.x, y: pacman.y - before.y },
      direction: pacman.direction,
      isMoving: pacman.isMoving,
      events
    };
  });

  console.log('=== ACTUAL BEHAVIOR ===', result);
  
  // Should have moved
  expect(Math.abs(result.delta.x)).toBeGreaterThan(0.5);
});
