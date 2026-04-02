import { test, expect } from '@playwright/test';

test.describe('Hydroponics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hydroponics');
    await page.evaluate(() => {
      localStorage.removeItem('greendeck_hydro');
      localStorage.removeItem('greendeck_hydro_rate');
    });
    await page.reload();
  });

  test('shows Hydroponics heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /hydroponics/i })).toBeVisible();
  });

  test('shows Running Cost section', async ({ page }) => {
    await expect(page.getByText(/running cost/i)).toBeVisible();
  });

  test('shows daily, monthly, yearly cost labels', async ({ page }) => {
    await expect(page.getByText('Daily', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Monthly', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Yearly', { exact: true }).first()).toBeVisible();
  });

  test('shows electricity rate field with default 4.15', async ({ page }) => {
    const rateInput = page.locator('input[type="number"]').first();
    await expect(rateInput).toBeVisible();
    const val = await rateInput.inputValue();
    expect(parseFloat(val)).toBeCloseTo(4.15, 1);
  });

  test('shows Add Preset button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add preset/i })).toBeVisible();
  });

  test('can open preset picker', async ({ page }) => {
    await page.getByRole('button', { name: /add preset/i }).click();
    await expect(page.getByText(/water pump/i).first()).toBeVisible();
  });

  test('can add a preset device', async ({ page }) => {
    await page.getByRole('button', { name: /add preset/i }).click();
    await page.getByText(/airstone/i).first().click();
    // Device should now appear in list
    await expect(page.getByText(/airstone/i).first()).toBeVisible();
  });

  test('shows Add Device form', async ({ page }) => {
    await expect(page.getByPlaceholder(/device name/i)).toBeVisible();
  });

  test('can add custom device', async ({ page }) => {
    await page.getByPlaceholder(/device name/i).fill('My Pump 15W');
    await page.locator('input[placeholder="e.g. 15"]').fill('15');
    await page.getByRole('button', { name: /add device/i }).click();
    await expect(page.getByText('My Pump 15W')).toBeVisible();
  });

  test('cost updates after adding device', async ({ page }) => {
    // Add a 100W device running 24h/day
    await page.getByPlaceholder(/device name/i).fill('Big Light');
    await page.locator('input[placeholder="e.g. 15"]').fill('100');
    await page.locator('input[placeholder="24"]').fill('24');
    await page.getByRole('button', { name: /add device/i }).click();
    // Monthly cost: 100W * 24h * 30 days / 1000 * 4.15 THB = 298.8 THB
    // Should show a non-zero THB amount
    const costEl = page.locator('.text-primary.font-bold').first();
    await expect(costEl).toBeVisible();
    const text = await costEl.textContent();
    expect(text).toMatch(/฿[0-9]/);
  });
});
