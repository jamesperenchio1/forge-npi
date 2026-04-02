import { test, expect } from '@playwright/test';

test.describe('Plants list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plants');
    await page.evaluate(() => localStorage.removeItem('greendeck_plants'));
    await page.reload();
  });

  test('shows empty state', async ({ page }) => {
    await expect(page.getByText('No plants yet')).toBeVisible();
  });

  test('has a link to add a new plant', async ({ page }) => {
    const addLink = page.getByRole('link', { name: /add|new|\+/i }).first();
    await expect(addLink).toBeVisible();
  });

  test('navigates to /plants/new', async ({ page }) => {
    await page.getByRole('link', { name: /add|new|\+/i }).first().click();
    await expect(page).toHaveURL(/\/plants\/new/);
  });
});

test.describe('New Plant form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plants/new');
  });

  test('page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /new plant/i })).toBeVisible();
  });

  test('has plant name input', async ({ page }) => {
    // Use first() because there are two inputs matching the pattern (name + scientific name)
    await expect(page.getByPlaceholder(/monstera|common name/i).first()).toBeVisible();
  });

  test('save button disabled without name', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save plant/i })).toBeDisabled();
  });

  test('save button enables after entering name', async ({ page }) => {
    await page.getByPlaceholder(/monstera|common name/i).first().fill('Test Plant');
    await expect(page.getByRole('button', { name: /save plant/i })).toBeEnabled();
  });

  test('can select a different emoji', async ({ page }) => {
    const cactusBtn = page.locator('button').filter({ hasText: '🌵' }).first();
    await cactusBtn.click();
    await expect(cactusBtn).toHaveClass(/border-primary|bg-primary/);
  });

  test('shows AI button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /ai/i })).toBeVisible();
  });

  test('saves plant and redirects to list', async ({ page }) => {
    const name = `E2EPlant_${Date.now()}`;
    await page.getByPlaceholder(/monstera|common name/i).first().fill(name);
    await page.getByRole('button', { name: /save plant/i }).click();
    await expect(page).toHaveURL('/plants');
    await expect(page.getByText(name)).toBeVisible();
  });
});
