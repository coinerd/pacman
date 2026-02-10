// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Add logging to actual GridMovement module', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Inject logging by modifying the module source at runtime
  await page.evaluate(() => {
    // We need to intercept the module loading - but since it's already loaded,
    // let's replace the specific function on the model
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    
    // Store original reference
    const originalUpdate = gameScene.gameModel.pacman.update.bind(gameScene.gameModel.pacman);
    
    // Replace with logged version
    gameScene.gameModel.pacman.update = function(deltaSeconds, maze, inputDirection) {
      console.log('[PACMAN UPDATE] START x=' + this.x.toFixed(2) + 
                  ' dir=(' + this.direction.x + ',' + this.direction.y + ')' +
                  ' grid=(' + this.gridX + ',' + this.gridY + ')' +
                  ' isMoving=' + this.isMoving);
      
      // Check isAtTileCenter
      const TILE_SIZE = 20;
      const CENTER_EPSILON = 3;
      const centerX = this.gridX * TILE_SIZE + TILE_SIZE / 2;
      const centerY = this.gridY * TILE_SIZE + TILE_SIZE / 2;
      const dx = Math.abs(this.x - centerX);
      const dy = Math.abs(this.y - centerY);
      const isAtCenter = dx <= CENTER_EPSILON && dy <= CENTER_EPSILON;
      
      console.log('[PACMAN UPDATE] isAtCenter=' + isAtCenter + 
                  ' center=(' + centerX + ',' + centerY + ')' +
                  ' d=(' + dx.toFixed(2) + ',' + dy.toFixed(2) + ')');
      
      const result = originalUpdate(deltaSeconds, maze, inputDirection);
      
      console.log('[PACMAN UPDATE] END x=' + this.x.toFixed(2) + 
                  ' dir=(' + this.direction.x + ',' + this.direction.y + ')' +
                  ' isMoving=' + this.isMoving);
      
      return result;
    };
  });

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Press right
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);

  // Capture logs
  const logs = await page.evaluate(() => {
    return 'Check browser console for logs';
  });

  console.log(logs);
  
  // Get final position
  const finalPos = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const pacman = gameScene.gameModel.pacman;
    return { x: pacman.x, y: pacman.y, direction: pacman.direction };
  });

  console.log('Final position:', finalPos);
});

test('Trace from exact position 271.99', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    const maze = model.maze;
    
    // Set to exactly 271.99
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.gridX = 13;
    pacman.gridY = 22;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    const trace = [];
    
    for (let i = 0; i < 3; i++) {
      const before = {
        x: pacman.x,
        y: pacman.y,
        gridX: pacman.gridX,
        gridY: pacman.gridY,
        direction: { ...pacman.direction }
      };
      
      // Manually trace what happens in update
      const TILE_SIZE = 20;
      const CENTER_EPSILON = 3;
      const centerX = pacman.gridX * TILE_SIZE + TILE_SIZE / 2;
      const centerY = pacman.gridY * TILE_SIZE + TILE_SIZE / 2;
      const dx = Math.abs(pacman.x - centerX);
      const dy = Math.abs(pacman.y - centerY);
      const isAtCenter = dx <= CENTER_EPSILON && dy <= CENTER_EPSILON;
      
      // Call update
      pacman.update(1/60, maze, null);
      
      trace.push({
        step: i,
        before,
        after: {
          x: pacman.x,
          y: pacman.y,
          gridX: pacman.gridX,
          gridY: pacman.gridY,
          direction: pacman.direction
        },
        diagnostics: {
          centerX,
          centerY,
          dx,
          dy,
          isAtCenter
        }
      });
    }
    
    return trace;
  });

  console.log('=== TRACE FROM 271.99 ===');
  for (const t of result) {
    console.log(`\nStep ${t.step}:`);
    console.log('  Before:', t.before);
    console.log('  Diagnostics:', t.diagnostics);
    console.log('  After:', t.after);
    console.log('  Delta:', {
      x: t.after.x - t.before.x,
      y: t.after.y - t.before.y
    });
  }
});
