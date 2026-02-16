import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('PAT modal is shown on first load and can be dismissed', async ({ page }) => {
  await expect(page.getByTestId('pat-modal')).toBeVisible();
  await page.getByTestId('pat-input').fill('ghp_test');
  await page.getByTestId('save-pat').click();
  await expect(page.getByTestId('pat-modal')).toBeHidden();
});

test('create epic and generate plan tasks', async ({ page }) => {
  await page.getByTestId('pat-input').fill('ghp_test');
  await page.getByTestId('save-pat').click();
  await page.getByTestId('epic-name').fill('Frontend Epic');
  await page.getByTestId('create-epic').click();
  await expect(page.getByTestId('status')).toContainText('scaffolded');
  await page.getByTestId('generate-plan').click();
  await expect(page.getByTestId('status')).toContainText('Generated');
});

test('navigation updates visible editor section', async ({ page }) => {
  await page.getByTestId('pat-input').fill('ghp_test');
  await page.getByTestId('save-pat').click();
  await page.getByRole('button', { name: 'Requirements' }).click();
  await expect(page.getByRole('heading', { name: 'Requirements' })).toBeVisible();
});
