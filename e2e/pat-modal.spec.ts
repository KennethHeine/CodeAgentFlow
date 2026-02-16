import { test, expect } from '@playwright/test';

test.describe('PAT Modal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show PAT modal on first load', async ({ page }) => {
    await page.goto('/');

    // Check that PAT modal is visible
    await expect(page.getByRole('heading', { name: /GitHub Personal Access Token Required/i })).toBeVisible();
    await expect(page.getByText(/Required Scopes:/i)).toBeVisible();
  });

  test('should display error on invalid token', async ({ page }) => {
    await page.goto('/');

    // Enter invalid token
    await page.fill('input[type="password"]', 'invalid_token');
    await page.click('button[type="submit"]');

    // Check for error message
    await expect(page.getByText(/Invalid token or insufficient permissions/i)).toBeVisible();
  });

  test('should have link to create token', async ({ page }) => {
    await page.goto('/');

    // Check for GitHub settings link
    const link = page.getByRole('link', { name: /GitHub Settings/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /github.com\/settings\/tokens/);
  });

  test('should display required scopes information', async ({ page }) => {
    await page.goto('/');

    // Check for scope information
    await expect(page.getByText(/repo/i)).toBeVisible();
    await expect(page.getByText(/workflow/i)).toBeVisible();
  });

  test('should explain token storage', async ({ page }) => {
    await page.goto('/');

    // Check for storage explanation
    await expect(page.getByText(/stored locally in your browser/i)).toBeVisible();
  });
});
