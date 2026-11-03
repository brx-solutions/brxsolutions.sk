import { test, expect } from '@playwright/test';

const fill = async (
  page: import('@playwright/test').Page,
  message = 'Hello from Playwright, this is a test message.',
) => {
  await page.fill('input[name=name]', 'Playwright');
  await page.fill('input[name=email]', 'pw@example.com');
  await page.selectOption('select[name=type]', 'backend');
  await page.fill('textarea[name=message]', message);
};

test('submits with JavaScript and shows the inline success message', async ({ page }) => {
  await page.goto('/#kontakt');
  await fill(page);
  await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
    timeout: 15_000,
  });
  await page.click('[data-contact-form] button[type=submit]');
  await expect(page.locator('[data-form-status]')).toContainText('Ďakujem');
  await expect(page).toHaveURL(/\/#kontakt$/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('a plain submit lands on the failed page instead of an error', async ({ page }) => {
    await page.goto('/');
    await fill(page);
    await page.click('[data-contact-form] button[type=submit]');
    await expect(page).toHaveURL(/\/sprava-neodoslana\/$/);
    await expect(page.locator('h1')).toContainText('nepodarilo');
  });
});

test('native validation blocks a too-short message', async ({ page }) => {
  await page.goto('/en/#kontakt');
  await fill(page, 'short');
  await page.click('[data-contact-form] button[type=submit]');
  await expect(page).toHaveURL(/\/en\/#kontakt$/);
  const invalid = await page
    .locator('textarea[name=message]')
    .evaluate((el) => !(el as HTMLTextAreaElement).validity.valid);
  expect(invalid).toBe(true);
});
