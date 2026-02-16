import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set a fake token so the PAT modal doesn't block us
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('caf:pat', 'ghp_fake_token_for_testing');
      localStorage.setItem('caf:login', 'testuser');
    });
    await page.reload();
  });

  test('renders sidebar with navigation items', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('CodeAgentFlow')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Epics')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('navigates to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('navigates to epics page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Epics').first().click();
    await expect(page.getByRole('heading', { name: /epics/i })).toBeVisible();
  });

  test('navigates to settings page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Settings').first().click();
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('navigates to new epic page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('New Epic').first().click();
    await expect(page.getByRole('heading', { name: /create new epic/i })).toBeVisible();
  });

  test('shows user login in sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('testuser')).toBeVisible();
  });

  test('epic create page has name input', async ({ page }) => {
    // Set epic repo so the form is shown
    await page.evaluate(() => {
      localStorage.setItem('caf:epicRepo', 'testuser/epic-specs');
    });
    await page.goto('/epics/new');
    await expect(page.locator('input#epic-name')).toBeVisible();
  });
});
