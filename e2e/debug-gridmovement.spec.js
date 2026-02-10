// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Debug GridMovement directly', async ({ page }) => {
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('GridMovement') || text.includes('MOVED') || text.includes('ENTRY') || text.includes('AT CENTER')) {
      logs.push(text);
    }
  });

  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const pacman = gameScene.gameModel.pacman;
    const maze = gameScene.gameModel.maze;
    
    // Clear any previous logs by reloading
    const trace = [];
    
    // Set state
    pacman.x = 272;
    pacman.y = 450;
    pacman.gridX = 13;
    pacman.gridY = 22;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    trace.push({ step: 'before', x: pacman.x, y: pacman.y, dir: { ...pacman.direction } });
    
    // Call update
    pacman.update(1/60, maze, null);
    
    trace.push({ step: 'after', x: pacman.x, y: pacman.y, dir: { ...pacman.direction } });
    
    return trace;
  });

  console.log('=== POSITION TRACE ===');
  for (const t of result) {
    console.log(`${t.step}: (${t.x.toFixed(2)}, ${t.y.toFixed(2)}) dir=(${t.dir.x}, ${t.dir.y})`);
  }
  
  console.log('\n=== GRID MOVEMENT LOGS ===');
  for (const log of logs) {
    console.log(log);
  }
  
  // The position should have moved right, not left
  const deltaX = result[1].x - result[0].x;
  console.log(`\nDelta X: ${deltaX.toFixed(4)}`);
  
  // We expect positive movement (to the right)
  expect(deltaX).toBeGreaterThan(0);
});
