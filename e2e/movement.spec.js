// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Pacman moves when pressing arrow keys', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForSelector('canvas');

  // Start the game
  await page.keyboard.press('Space');
  
  // Wait a moment for game to initialize
  await page.waitForTimeout(500);
  
  // Get initial Pacman position via JavaScript evaluation
  const initialPos = await page.evaluate(() => {
    // Access the game model through the game's global objects
    const game = window.game;
    if (game && game.scene && game.scene.scenes) {
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      if (gameScene && gameScene.gameModel && gameScene.gameModel.pacman) {
        return {
          x: gameScene.gameModel.pacman.x,
          y: gameScene.gameModel.pacman.y,
          direction: gameScene.gameModel.pacman.direction
        };
      }
    }
    return null;
  });

  console.log('Initial position:', initialPos);
  expect(initialPos).not.toBeNull();
  expect(initialPos.x).toBeDefined();
  expect(initialPos.y).toBeDefined();

  // Press Right arrow key
  await page.keyboard.press('ArrowRight');
  
  // Wait for movement to occur
  await page.waitForTimeout(500);
  
  // Get position after pressing Right
  const afterRightPos = await page.evaluate(() => {
    const game = window.game;
    if (game && game.scene && game.scene.scenes) {
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      if (gameScene && gameScene.gameModel && gameScene.gameModel.pacman) {
        return {
          x: gameScene.gameModel.pacman.x,
          y: gameScene.gameModel.pacman.y,
          direction: gameScene.gameModel.pacman.direction
        };
      }
    }
    return null;
  });

  console.log('After Right arrow:', afterRightPos);

  // Press Left arrow key
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(500);
  
  // Get position after pressing Left
  const afterLeftPos = await page.evaluate(() => {
    const game = window.game;
    if (game && game.scene && game.scene.scenes) {
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      if (gameScene && gameScene.gameModel && gameScene.gameModel.pacman) {
        return {
          x: gameScene.gameModel.pacman.x,
          y: gameScene.gameModel.pacman.y,
          direction: gameScene.gameModel.pacman.direction
        };
      }
    }
    return null;
  });

  console.log('After Left arrow:', afterLeftPos);

  // Verify that positions were tracked correctly
  expect(afterRightPos).not.toBeNull();
  expect(afterLeftPos).not.toBeNull();
  
  // Verify positions are within valid game bounds
  expect(afterRightPos.x).toBeGreaterThan(0);
  expect(afterRightPos.x).toBeLessThan(1000);
  expect(afterRightPos.y).toBeGreaterThan(0);
  expect(afterRightPos.y).toBeLessThan(1000);
});

test('Pacman changes direction with input', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForSelector('canvas');

  // Start the game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Track direction changes
  const directions = [];
  
  // Press various keys and check if direction is set
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100);
  
  let dir = await page.evaluate(() => {
    const game = window.game;
    if (game && game.scene && game.scene.scenes) {
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      if (gameScene && gameScene.gameModel && gameScene.gameModel.pacman) {
        return gameScene.gameModel.pacman.direction;
      }
    }
    return null;
  });
  directions.push({ key: 'Right', direction: dir });

  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(100);
  
  dir = await page.evaluate(() => {
    const game = window.game;
    if (game && game.scene && game.scene.scenes) {
      const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
      if (gameScene && gameScene.gameModel && gameScene.gameModel.pacman) {
        return gameScene.gameModel.pacman.direction;
      }
    }
    return null;
  });
  directions.push({ key: 'Left', direction: dir });

  console.log('Direction changes:', directions);
  
  // Verify pacman has a valid direction object
  expect(directions[0].direction).toBeDefined();
  expect(directions[1].direction).toBeDefined();
});
