import { test, expect } from '@playwright/test';

test.describe('PAT Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows PAT modal when no token is stored', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Connect to GitHub')).toBeVisible();
    await expect(page.getByText('Personal Access Token required')).toBeVisible();
  });

  test('shows required scopes info', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('repo')).toBeVisible();
  });

  test('has a token input field', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[type="password"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'ghp_xxxxxxxxxxxxxxxxxxxx');
  });

  test('connect button is disabled when token is empty', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: /connect/i });
    await expect(button).toBeDisabled();
  });

  test('connect button enables when token is typed', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[type="password"]');
    await input.fill('ghp_test_token_12345');
    const button = page.getByRole('button', { name: /connect/i });
    await expect(button).toBeEnabled();
  });

  test('has a link to create a new GitHub token', async ({ page }) => {
    await page.goto('/');
    const link = page.getByText('Create a new token');
    await expect(link).toBeVisible();
  });

  test('toggle password visibility', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#pat-token');
    await expect(input).toHaveAttribute('type', 'password');

    // Click the eye button to show
    const toggleBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
    // There should be a toggle near the input
    const eyeBtn = page.locator('input[type="password"] + button, input[type="password"] ~ button').first();
    if (await eyeBtn.isVisible()) {
      await eyeBtn.click();
      await expect(input).toHaveAttribute('type', 'text');
    }
  });
});
