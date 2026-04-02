import { test } from '@playwright/test';

test('debug login page', async ({ page }) => {
  await page.goto('https://greendeck-app.vercel.app/login', { waitUntil: 'networkidle' });
  
  // Get page title and URL
  console.log(`\nPage URL: ${page.url()}`);
  console.log(`Page Title: ${await page.title()}`);
  
  // Get all text content
  const bodyText = await page.textContent('body');
  console.log(`\nPage Content:\n${bodyText?.substring(0, 500)}`);
  
  // Get all input fields
  const inputs = await page.$$('input');
  console.log(`\nFound ${inputs.length} input elements`);
  
  // Get all buttons
  const buttons = await page.$$('button');
  console.log(`Found ${buttons.length} button elements`);
  buttons.forEach((btn, i) => {
    btn.textContent().then(text => console.log(`  Button ${i}: ${text}`));
  });
  
  // Check for errors in console
  const consoleMessages: string[] = [];
  page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  
  // Wait a bit
  await page.waitForTimeout(2000);
  
  console.log(`\nConsole messages:\n${consoleMessages.join('\n')}`);
  
  // Get page HTML
  const html = await page.content();
  console.log(`\nPage HTML (first 1000 chars):\n${html.substring(0, 1000)}`);
});
