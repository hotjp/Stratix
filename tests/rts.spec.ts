import { test, expect } from '@playwright/test';

test.describe('Stratix RTS Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.status.ready', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('should render game canvas', async ({ page }) => {
    const canvas = page.locator('.game-area canvas');
    await expect(canvas).toBeVisible();
  });

  test('should display agents on the map', async ({ page }) => {
    const agentCards = page.locator('.agent-card');
    const count = await agentCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should select agent on click', async ({ page }) => {
    const firstAgent = page.locator('.agent-card').first();
    await firstAgent.click();
    await expect(firstAgent).toHaveClass(/selected/);
    
    await expect(page.locator('.selected-info .agent-item')).toBeVisible();
  });

  test('should show agent skills when selected', async ({ page }) => {
    await page.locator('.agent-card').first().click();
    
    await page.click('.sidebar-tabs button:has-text("指令")');
    await expect(page.locator('.selected-agent-info')).toBeVisible();
  });

  test('should allow creating new agent', async ({ page }) => {
    const initialCount = await page.locator('.agent-card').count();
    
    await page.click('.panel-header .el-button');
    await page.click('.el-dropdown-item:has-text("文案英雄")');
    
    await page.waitForTimeout(500);
    const newCount = await page.locator('.agent-card').count();
    expect(newCount).toBe(initialCount + 1);
  });

  test('should delete agent', async ({ page }) => {
    const initialCount = await page.locator('.agent-card').count();
    
    if (initialCount > 0) {
      const lastAgent = page.locator('.agent-card').last();
      await lastAgent.hover();
      await lastAgent.locator('.delete-btn').click();
      
      await page.waitForTimeout(300);
      const newCount = await page.locator('.agent-card').count();
      expect(newCount).toBe(initialCount - 1);
    }
  });
});
