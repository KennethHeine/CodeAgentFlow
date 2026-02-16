import { test, expect } from '@playwright/test';

test.describe('PAT Modal', () => {
  test('shows PAT modal on first load', async ({ page }) => {
    await page.goto('/');
    const modal = page.getByTestId('pat-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByText('Welcome to CodeAgentFlow')).toBeVisible();
  });

  test('PAT input is present', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('pat-input');
    await expect(input).toBeVisible();
  });

  test('submit button is disabled when PAT is empty', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByTestId('pat-submit');
    await expect(btn).toBeDisabled();
  });

  test('submit button enables when PAT is typed', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('pat-input');
    await input.fill('ghp_test_token');
    const btn = page.getByTestId('pat-submit');
    await expect(btn).toBeEnabled();
  });

  test('shows required scopes information', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('repo, read:user')).toBeVisible();
  });

  test('shows storage information', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/stored locally in your browser only/)).toBeVisible();
  });

  test('has link to create new GitHub token', async ({ page }) => {
    await page.goto('/');
    const link = page.getByText('Create a new token on GitHub');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /github\.com\/settings\/tokens/);
  });

  test('can toggle token visibility', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('pat-input');
    await expect(input).toHaveAttribute('type', 'password');

    await page.getByLabel('Show token').click();
    await expect(input).toHaveAttribute('type', 'text');

    await page.getByLabel('Hide token').click();
    await expect(input).toHaveAttribute('type', 'password');
  });
});

test.describe('Navigation', () => {
  test('page title is CodeAgentFlow', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('CodeAgentFlow');
  });
});
