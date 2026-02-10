// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Trace GridMovement with console.log injection', async ({ page }) => {
  const logs = [];
  page.on('console', msg => {
    logs.push(msg.text());
  });

  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Inject logging into GridMovement by modifying the source
  await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    
    // Monkey-patch moveEntityOnGrid temporarily
    // We need to load the module again with logging, so let's just trace pacman.update
    const pacman = gameScene.gameModel.pacman;
    const maze = gameScene.gameModel.maze;
    const originalUpdate = pacman.update.bind(pacman);
    
    pacman.update = function(deltaSeconds, mazeParam, inputDirection) {
      console.log('[PACMAN] update START');
      console.log('  pos:', this.x.toFixed(2), this.y.toFixed(2));
      console.log('  grid:', this.gridX, this.gridY);
      console.log('  direction:', JSON.stringify(this.direction));
      console.log('  inputDir:', JSON.stringify(inputDirection));
      console.log('  buffered:', JSON.stringify(this.directionBuffer.getBuffered()));
      
      const result = originalUpdate(deltaSeconds, mazeParam, inputDirection);
      
      console.log('[PACMAN] update END');
      console.log('  new pos:', this.x.toFixed(2), this.y.toFixed(2));
      console.log('  new direction:', JSON.stringify(this.direction));
      console.log('  isMoving:', this.isMoving);
      
      return result;
    };
  });

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Press right
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);

  console.log('=== LOGS ===');
  for (const log of logs) {
    console.log(log);
  }
});

test('Check makeDecisionAtIntersection return', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Test makeDecisionAtIntersection directly
  const result = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const pacman = gameScene.gameModel.pacman;
    const maze = gameScene.gameModel.maze;
    
    // Set state like after first movement
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    const before = {
      direction: { ...pacman.direction },
      isMoving: pacman.isMoving,
      buffered: pacman.directionBuffer.getBuffered()
    };
    
    // Call makeDecisionAtIntersection
    pacman.makeDecisionAtIntersection(maze);
    
    const after = {
      direction: pacman.direction,
      isMoving: pacman.isMoving,
      buffered: pacman.directionBuffer.getBuffered()
    };
    
    return { before, after };
  });

  console.log('=== MAKE DECISION ===');
  console.log('Before:', result.before);
  console.log('After:', result.after);
  
  // Direction should still be RIGHT and isMoving should be true
  expect(result.after.direction.x).toBe(1);
  expect(result.after.isMoving).toBe(true);
});

test('Full trace with manual stepping', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Step by step trace
  const trace = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    const maze = model.maze;
    
    const steps = [];
    
    // Set initial state
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
    
    for (let i = 0; i < 5; i++) {
      const before = {
        x: pacman.x,
        y: pacman.y,
        dir: { ...pacman.direction },
        isMoving: pacman.isMoving
      };
      
      // Call pacman.update directly
      const events = pacman.update(1/60, maze, null);
      
      steps.push({
        step: i,
        before,
        after: {
          x: pacman.x,
          y: pacman.y,
          dir: pacman.direction,
          isMoving: pacman.isMoving
        },
        delta: {
          x: pacman.x - before.x,
          y: pacman.y - before.y
        },
        events
      });
    }
    
    return steps;
  });

  console.log('=== FULL TRACE ===');
  for (const s of trace) {
    console.log(`Step ${s.step}:`);
    console.log(`  Before: (${s.before.x.toFixed(2)}, ${s.before.y.toFixed(2)}) dir=(${s.before.dir.x},${s.before.dir.y})`);
    console.log(`  After:  (${s.after.x.toFixed(2)}, ${s.after.y.toFixed(2)}) dir=(${s.after.dir.x},${s.after.dir.y})`);
    console.log(`  Delta:  (${s.delta.x.toFixed(2)}, ${s.delta.y.toFixed(2)})`);
    console.log(`  Events: ${s.events.length}`);
  }
  
  // Check that we moved in at least one step
  const totalMove = trace.reduce((sum, s) => sum + Math.abs(s.delta.x), 0);
  console.log(`Total X movement: ${totalMove.toFixed(2)}`);
  
  expect(totalMove).toBeGreaterThan(0);
});
