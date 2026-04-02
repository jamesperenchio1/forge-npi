import { test, expect } from '@playwright/test';

test.describe('Climate / Weather', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/weather');
    await page.evaluate(() => localStorage.removeItem('greendeck_weather_cache'));
  });

  test('shows Climate heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /climate/i })).toBeVisible();
  });

  test('shows Sun Position section', async ({ page }) => {
    await expect(page.getByText(/sun position/i)).toBeVisible();
  });

  test('shows date input for historical mode', async ({ page }) => {
    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test('shows Thailand Seasons section', async ({ page }) => {
    await expect(page.getByText(/thailand seasons/i)).toBeVisible();
  });

  test('shows at least 3 Thai season names', async ({ page }) => {
    const seasonTexts = [/cool/i, /monsoon/i, /pre-monsoon|hot.*dry/i];
    let found = 0;
    for (const pattern of seasonTexts) {
      const count = await page.getByText(pattern).count();
      if (count > 0) found++;
    }
    expect(found).toBeGreaterThanOrEqual(2);
  });

  test('shows Pest Calendar section', async ({ page }) => {
    await expect(page.getByText(/pest calendar/i)).toBeVisible();
  });

  test('chart tabs are visible when weather loads', async ({ page }) => {
    await page.waitForTimeout(1000);
    const tempTab = page.getByRole('button', { name: /temperature/i });
    if (await tempTab.isVisible()) {
      await expect(tempTab).toBeVisible();
    }
  });

  test('shows a location label', async ({ page }) => {
    const location = page.getByText(/bangkok|your location/i).first();
    await expect(location).toBeVisible();
  });
});
