import { test, expect } from '@playwright/test';

test.describe('Stratix Application', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text());
      }
    });
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('should load the application', async ({ page }) => {
    const html = await page.content();
    console.log('HTML length:', html.length);
    const appDiv = await page.$('#app');
    console.log('App div exists:', !!appDiv);
    const appContent = await appDiv?.innerHTML() || '';
    console.log('App content length:', appContent.length);
    console.log('App content preview:', appContent.slice(0, 500));
    
    await expect(page.locator('.main-layout')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.logo-text')).toContainText('Stratix 星策系统');
  });

  test('should show system ready status', async ({ page }) => {
    await expect(page.locator('.status.ready')).toBeVisible({ timeout: 10000 });
  });

  test('should display agent panel by default', async ({ page }) => {
    await expect(page.locator('.sidebar-tabs button.active')).toContainText('英雄');
    await expect(page.locator('.agent-panel')).toBeVisible();
  });

  test('should have default demo agents', async ({ page }) => {
    await page.waitForSelector('.status.ready', { timeout: 10000 });
    await page.waitForTimeout(500);
    const agentCards = page.locator('.agent-card');
    await expect(agentCards).toHaveCount(3, { timeout: 5000 });
  });

  test('should switch tabs', async ({ page }) => {
    await page.click('.sidebar-tabs button:has-text("指令")');
    await expect(page.locator('.sidebar-tabs button.active')).toContainText('指令');
    
    await page.click('.sidebar-tabs button:has-text("日志")');
    await expect(page.locator('.sidebar-tabs button.active')).toContainText('日志');
  });

  test('should display RTS game canvas', async ({ page }) => {
    await page.waitForSelector('.status.ready', { timeout: 10000 });
    await expect(page.locator('canvas')).toBeVisible();
  });
});
