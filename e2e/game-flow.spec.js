// @ts-check
import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const gameURL = `${baseURL}/?e2e`;

const attachTelemetry = async (page) => {
  await page.addInitScript(() => {
    window.__telemetryEvents = [];
    window.__gameErrors = [];

    window.addEventListener('pacman:telemetry', (event) => {
      window.__telemetryEvents.push(event.detail);
    });

    window.addEventListener('game-error', (event) => {
      window.__gameErrors.push(event.detail);
    });
  });
};

const waitForTelemetry = async (page, eventName) => {
  await page.waitForFunction((name) => {
    return Array.isArray(window.__telemetryEvents)
      && window.__telemetryEvents.some((entry) => entry?.event === name);
  }, eventName);
};

const ensureNoGameErrors = async (page) => {
  const errors = await page.evaluate(() => window.__gameErrors ?? []);
  expect(errors, 'Expected no game-error telemetry events').toEqual([]);
};

test.beforeEach(async ({ page }) => {
  await attachTelemetry(page);
});

test('Start → Play → Win flow uses telemetry events', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForSelector('canvas');

  await page.keyboard.press('Space');
  await waitForTelemetry(page, 'game:started');

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('pacman:e2e-command', {
      detail: { action: 'win' }
    }));
  });

  await waitForTelemetry(page, 'level:complete');
  await ensureNoGameErrors(page);
});

test('Start → Play → Lose flow uses telemetry events', async ({ page }) => {
  await page.goto(gameURL);
  await page.waitForSelector('canvas');

  await page.keyboard.press('Space');
  await waitForTelemetry(page, 'game:started');

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('pacman:e2e-command', {
      detail: { action: 'lose' }
    }));
  });

  await waitForTelemetry(page, 'game:over');
  await ensureNoGameErrors(page);
});
