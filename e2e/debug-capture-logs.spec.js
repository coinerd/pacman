// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const gameURL = `${baseURL}/?e2e`;

test('Capture console logs from GridMovement', async ({ page }) => {
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[GRID]')) {
      logs.push(text);
    }
  });

  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Press right
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);

  console.log('=== CAPTURED LOGS ===');
  for (const log of logs) {
    console.log(log);
  }
  
  // We should have some logs
  expect(logs.length).toBeGreaterThan(0);
});

test('Trigger movement and capture logs', async ({ page }) => {
  const logs = [];
  page.on('console', msg => {
    logs.push(msg.text());
  });

  await page.goto(gameURL);
  await page.waitForTimeout(1000);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Set Pacman to 271.99 position
  await page.evaluate(() => {
    const game = window.game;
    const gameScene = game.scene.scenes.find(s => s.scene.key === 'ModelDrivenGameScene');
    const pacman = gameScene.gameModel.pacman;
    pacman.x = 271.99;
    pacman.y = 450;
    pacman.direction = { x: 1, y: 0, angle: 0 };
    pacman.isMoving = true;
  });

  // Wait a bit for movement
  await page.waitForTimeout(300);

  console.log('=== ALL LOGS ===');
  const gridLogs = logs.filter(l => l.includes('[GRID]'));
  for (const log of gridLogs) {
    console.log(log);
  }
  
  console.log('Total logs:', logs.length);
  console.log('Grid logs:', gridLogs.length);
});
