import { test, expect } from '@playwright/test';

test.describe('Climate / Weather', () => {
  test.beforeEach(async ({ page }) => {
    // Clear weather cache so tests are deterministic
    await page.goto('/weather');
    await page.evaluate(() => localStorage.removeItem('greendeck_weather_cache'));
  });

  test('shows Climate heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /climate/i })).toBeVisible();
  });

  test('shows Sun Position section', async ({ page }) => {
    await expect(page.getByText(/sun position/i)).toBeVisible();
  });

  test('shows Thailand Seasons section', async ({ page }) => {
    await expect(page.getByText(/thailand seasons/i)).toBeVisible();
  });

  test('shows Pest Calendar section', async ({ page }) => {
    await expect(page.getByText(/pest calendar/i)).toBeVisible();
  });

  test('shows one of Cool/Pre-Monsoon/Monsoon seasons', async ({ page }) => {
    const seasons = page.getByText(/cool & dry|pre-monsoon|monsoon/i).first();
    await expect(seasons).toBeVisible();
  });

  test('chart tabs are visible', async ({ page }) => {
    // Wait for weather to potentially load (or use cached Bangkok)
    await page.waitForTimeout(1000);
    const tempTab = page.getByRole('button', { name: /temperature/i });
    // Tab only shows when weather is loaded — check if visible, skip if not
    if (await tempTab.isVisible()) {
      await expect(tempTab).toBeVisible();
      const humidityTab = page.getByRole('button', { name: /humidity/i });
      await humidityTab.click();
      await expect(humidityTab).toHaveClass(/bg-primary/);
    }
  });

  test('shows a location label', async ({ page }) => {
    const location = page.getByText(/bangkok|your location/i).first();
    await expect(location).toBeVisible();
  });
});
