import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock localStorage with PAT
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('codeagentflow_github_pat', 'mock_token_for_testing');
    });
  });

  test('should display header with app name', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /CodeAgentFlow/i })).toBeVisible();
  });

  test('should have link to epic list from header', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: /CodeAgentFlow/i });
    await expect(link).toHaveAttribute('href', '/');
  });
});
