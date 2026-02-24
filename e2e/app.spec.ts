import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('shows app without PAT modal on first load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('pat-modal')).not.toBeVisible();
    await expect(page.getByText('Select your Epic Repository')).toBeVisible();
  });

  test('shows sign in button when not authenticated', async ({ page }) => {
    await page.goto('/');
    const signInBtn = page.getByTestId('header-sign-in');
    await expect(signInBtn).toBeVisible();
    await expect(signInBtn).toHaveText(/Sign in with GitHub/);
  });
});

test.describe('PAT Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('header-sign-in').click();
  });

  test('opens PAT modal when sign in is clicked', async ({ page }) => {
    const modal = page.getByTestId('pat-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByText('Welcome to CodeAgentFlow')).toBeVisible();
  });

  test('PAT input is present', async ({ page }) => {
    const input = page.getByTestId('pat-input');
    await expect(input).toBeVisible();
  });

  test('submit button is disabled when PAT is empty', async ({ page }) => {
    const btn = page.getByTestId('pat-submit');
    await expect(btn).toBeDisabled();
  });

  test('submit button enables when PAT is typed', async ({ page }) => {
    const input = page.getByTestId('pat-input');
    await input.fill('ghp_test_token');
    const btn = page.getByTestId('pat-submit');
    await expect(btn).toBeEnabled();
  });

  test('shows required scopes information', async ({ page }) => {
    await expect(page.getByText('repo, read:user')).toBeVisible();
  });

  test('shows storage information', async ({ page }) => {
    await expect(page.getByText(/stored locally in your browser only/)).toBeVisible();
  });

  test('has link to create new GitHub token', async ({ page }) => {
    const link = page.getByText('Create a new token on GitHub');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /github\.com\/settings\/tokens/);
  });

  test('can toggle token visibility', async ({ page }) => {
    const input = page.getByTestId('pat-input');
    await expect(input).toHaveAttribute('type', 'password');

    await page.getByLabel('Show token').click();
    await expect(input).toHaveAttribute('type', 'text');

    await page.getByLabel('Hide token').click();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('can close PAT modal', async ({ page }) => {
    await expect(page.getByTestId('pat-modal')).toBeVisible();
    await page.getByTestId('pat-modal-close').click();
    await expect(page.getByTestId('pat-modal')).not.toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('page title is CodeAgentFlow', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('CodeAgentFlow');
  });
});
