// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Check GridMovement source in browser', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const logs = [];
    
    try {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      if (!gameScene) {
        return { error: 'ModelDrivenGameScene not found', scenes: game.scene.scenes.map(s => s.scene.key) };
      }
      
      const pacman = gameScene.gameModel.pacman;
      const maze = gameScene.gameModel.maze;
      
      logs.push(`Pacman initial pos: (${pacman.x.toFixed(2)}, ${pacman.y.toFixed(2)})`);
      logs.push(`Pacman direction: (${pacman.direction.x}, ${pacman.direction.y})`);
      logs.push(`Pacman isMoving: ${pacman.isMoving}`);
      
      // Check directionBuffer
      if (pacman.directionBuffer) {
        logs.push(`directionBuffer exists`);
        logs.push(`directionBuffer.applyIfCanMove: ${typeof pacman.directionBuffer.applyIfCanMove}`);
      } else {
        logs.push(`NO directionBuffer!`);
      }
      
      // Set up to intercept the call
      const originalUpdate = pacman.update.bind(pacman);
      let callCount = 0;
      
      pacman.update = function(deltaSeconds, maze, inputDirection) {
        callCount++;
        logs.push(`=== UPDATE CALL ${callCount} ===`);
        logs.push(`Before: pos=(${this.x.toFixed(2)}, ${this.y.toFixed(2)}) dir=(${this.direction.x}, ${this.direction.y})`);
        
        const result = originalUpdate(deltaSeconds, maze, inputDirection);
        
        logs.push(`After: pos=(${this.x.toFixed(2)}, ${this.y.toFixed(2)}) dir=(${this.direction.x}, ${this.direction.y})`);
        return result;
      };
      
      // Set state and call update
      pacman.x = 272;
      pacman.y = 450;
      pacman.gridX = 13;
      pacman.gridY = 22;
      pacman.direction = { x: 1, y: 0, angle: 0 };
      pacman.isMoving = true;
      
      pacman.update(1/60, maze, null);
      
      return { logs, callCount, error: null };
    } catch (e) {
      return { logs, error: e.toString() };
    }
  });

  if (result.error) {
    console.log('ERROR:', result.error);
  }
  if (result.scenes) {
    console.log('Available scenes:', result.scenes);
  }
  
  console.log('=== TRACE ===');
  for (const log of result.logs || []) {
    console.log(log);
  }
  
  expect(result.callCount).toBeGreaterThan(0);
});
