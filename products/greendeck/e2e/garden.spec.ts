import { test, expect } from '@playwright/test';

test.describe('Garden', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/garden');
    await page.evaluate(() => {
      localStorage.removeItem('greendeck_garden');
      localStorage.removeItem('greendeck_zones');
    });
    await page.reload();
  });

  test('shows garden heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /garden/i })).toBeVisible();
  });

  test('shows Add Zone button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add zone/i })).toBeVisible();
  });

  test('can create a zone', async ({ page }) => {
    await page.getByRole('button', { name: /add zone/i }).click();
    const input = page.getByPlaceholder(/zone name|balcony|indoors/i);
    await expect(input).toBeVisible();
    await input.fill('Front Porch');
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByText('Front Porch').first()).toBeVisible();
  });

  test('shows All Pots section when no zones', async ({ page }) => {
    // With no zones, the garden shows an "All Pots" section
    await expect(page.getByText(/all pots/i)).toBeVisible();
  });

  test('can add a container', async ({ page }) => {
    // Find any "+ Pot" button
    const addPotBtn = page.getByRole('button', { name: /\+ pot|\+ container/i }).first();
    await expect(addPotBtn).toBeVisible();
    await addPotBtn.click();
    const nameInput = page.getByPlaceholder(/pot name|balcony shelf|channel/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Test Pot');
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByText('Test Pot').first()).toBeVisible();
  });

  test('can create zone then add pot inside it', async ({ page }) => {
    // Create zone
    await page.getByRole('button', { name: /add zone/i }).click();
    await page.getByPlaceholder(/zone name|balcony|indoors/i).fill('Greenhouse');
    await page.getByRole('button', { name: /^add$/i }).click();

    // Add pot to that zone
    const addPotBtn = page.getByRole('button', { name: /\+ pot/i }).first();
    await addPotBtn.click();
    const nameInput = page.getByPlaceholder(/pot name|balcony shelf|channel/i);
    await nameInput.fill('Shelf A');
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByText('Shelf A').first()).toBeVisible();
  });
});
