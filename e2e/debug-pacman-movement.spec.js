// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Debug Pacman continuous movement', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Hold down the right arrow key (native event)
  await page.keyboard.down('ArrowRight');
  
  // Track positions over time
  const positions = [];
  
  for (let i = 0; i < 30; i++) {
    const state = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const model = gameScene.gameModel;
      const pacman = model.pacman;
      
      return {
        x: pacman.x,
        y: pacman.y,
        gridX: pacman.gridX,
        gridY: pacman.gridY,
        direction: pacman.direction,
        bufferedDir: pacman.directionBuffer.getBuffered(),
        isMoving: pacman.isMoving,
        desiredDirection: model.desiredDirection,
        inputDirection: model.inputDirection,
        tickCount: model.tickCount
      };
    });
    
    positions.push({ frame: i, ...state });
    await page.waitForTimeout(50); // 50ms = 20Hz sample rate
  }
  
  await page.keyboard.up('ArrowRight');

  console.log('=== PACMAN CONTINUOUS MOVEMENT TRACE ===');
  for (const p of positions) {
    const dirStr = p.direction ? `${p.direction.x},${p.direction.y}` : 'none';
    const bufStr = p.bufferedDir ? `${p.bufferedDir.x},${p.bufferedDir.y}` : 'none';
    const desStr = p.desiredDirection ? `${p.desiredDirection.x},${p.desiredDirection.y}` : 'null';
    console.log(`Frame ${p.frame.toString().padStart(2)}: pos(${p.x.toFixed(1).padStart(6)}, ${p.y.toFixed(1).padStart(6)}) grid(${p.gridX}, ${p.gridY}) dir(${dirStr}) buf(${bufStr}) desired(${desStr}) isMoving=${p.isMoving} ticks=${p.tickCount}`);
  }

  // Verify Pacman moved significantly
  const firstPos = positions[0];
  const lastPos = positions[positions.length - 1];
  const distance = Math.sqrt(
    Math.pow(lastPos.x - firstPos.x, 2) + 
    Math.pow(lastPos.y - firstPos.y, 2)
  );
  
  console.log(`\nTotal distance moved: ${distance.toFixed(1)} pixels`);
  console.log(`Start: (${firstPos.x.toFixed(1)}, ${firstPos.y.toFixed(1)})`);
  console.log(`End: (${lastPos.x.toFixed(1)}, ${lastPos.y.toFixed(1)})`);
  
  expect(distance).toBeGreaterThan(20); // Should move at least 20 pixels
});

test('Debug Pacman direction buffer state', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Check initial state
  let state = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    
    return {
      direction: pacman.direction,
      buffered: pacman.directionBuffer.getBuffered(),
      current: pacman.directionBuffer.getCurrent(),
      isMoving: pacman.isMoving
    };
  });

  console.log('=== INITIAL STATE ===', state);
  expect(state.direction.x).toBe(0);
  expect(state.direction.y).toBe(0);

  // Press right and check immediately
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  
  state = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    
    return {
      direction: pacman.direction,
      buffered: pacman.directionBuffer.getBuffered(),
      current: pacman.directionBuffer.getCurrent(),
      isMoving: pacman.isMoving,
      desired: model.desiredDirection,
      input: model.inputDirection
    };
  });

  console.log('=== AFTER KEY PRESS ===', state);

  // Wait for movement
  await page.waitForTimeout(500);
  
  state = await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const model = gameScene.gameModel;
    const pacman = model.pacman;
    
    return {
      x: pacman.x,
      y: pacman.y,
      direction: pacman.direction,
      buffered: pacman.directionBuffer.getBuffered(),
      current: pacman.directionBuffer.getCurrent(),
      isMoving: pacman.isMoving,
      desired: model.desiredDirection,
      input: model.inputDirection
    };
  });

  console.log('=== AFTER 500ms ===', state);
});

test('Debug GameModel input flow', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Trace input through the system
  const trace = [];
  
  for (let i = 0; i < 10; i++) {
    if (i === 3) {
      await page.keyboard.press('ArrowRight');
    }
    
    const state = await page.evaluate(() => {
      const game = window.game;
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      const model = gameScene.gameModel;
      
      // Check input manager
      const keyboardAdapter = gameScene.inputManager?.adapters?.keyboard;
      
      return {
        // Input manager state
        nativeArrowRight: keyboardAdapter?.nativeKeys?.ArrowRight,
        
        // Model state
        modelInputDir: model.inputDirection,
        modelDesiredDir: model.desiredDirection,
        
        // Pacman state
        pacmanDir: model.pacman?.direction,
        pacmanBuffered: model.pacman?.directionBuffer?.getBuffered(),
        pacmanX: model.pacman?.x,
        pacmanY: model.pacman?.y,
        pacmanIsMoving: model.pacman?.isMoving
      };
    });
    
    trace.push({ frame: i, ...state });
    await page.waitForTimeout(100);
  }

  console.log('=== INPUT FLOW TRACE ===');
  for (const t of trace) {
    console.log(`Frame ${t.frame}:`);
    console.log(`  Native Right: ${t.nativeArrowRight}`);
    console.log(`  Model input: ${t.modelInputDir ? `${t.modelInputDir.x},${t.modelInputDir.y}` : 'null'}`);
    console.log(`  Model desired: ${t.modelDesiredDir ? `${t.modelDesiredDir.x},${t.modelDesiredDir.y}` : 'null'}`);
    console.log(`  Pacman dir: ${t.pacmanDir ? `${t.pacmanDir.x},${t.pacmanDir.y}` : 'null'}`);
    console.log(`  Pacman buf: ${t.pacmanBuffered ? `${t.pacmanBuffered.x},${t.pacmanBuffered.y}` : 'null'}`);
    console.log(`  Pacman pos: (${t.pacmanX?.toFixed(1)}, ${t.pacmanY?.toFixed(1)}) isMoving=${t.pacmanIsMoving}`);
  }
});
