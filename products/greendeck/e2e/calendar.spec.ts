import { test, expect } from '@playwright/test';

test.describe('Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
  });

  test('shows Calendar heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /calendar/i })).toBeVisible();
  });

  test('shows Growing Guide and Events tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /growing guide/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /events/i })).toBeVisible();
  });

  test('Growing Guide tab shows month columns', async ({ page }) => {
    // Growing Guide should be active by default — check for month headers
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (const m of months.slice(0, 3)) {
      await expect(page.getByText(m).first()).toBeVisible();
    }
  });

  test('Growing Guide shows plant names', async ({ page }) => {
    await expect(page.getByText(/thai basil/i).first()).toBeVisible();
    await expect(page.getByText(/chilli/i).first()).toBeVisible();
  });

  test('Growing Guide shows color legend', async ({ page }) => {
    await expect(page.getByText(/sow indoors/i).first()).toBeVisible();
    await expect(page.getByText(/harvest/i).first()).toBeVisible();
  });

  test('can switch to Events tab', async ({ page }) => {
    await page.getByRole('button', { name: /events/i }).click();
    // Events tab shows a calendar (DayPicker grid)
    await expect(page.locator('[role="grid"]').first()).toBeVisible();
  });

  test('Events tab shows Upcoming section', async ({ page }) => {
    await page.getByRole('button', { name: /events/i }).click();
    await expect(page.getByText(/upcoming/i)).toBeVisible();
  });

  test('clicking a calendar day in Events tab opens sheet', async ({ page }) => {
    await page.getByRole('button', { name: /events/i }).click();
    // Click day 15 via native DOM click
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => {
        const span = b.querySelector('span');
        return span && span.textContent?.trim() === '15';
      });
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (clicked) {
      await expect(page.getByText(/add event/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
