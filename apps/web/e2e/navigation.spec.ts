import { test, expect } from '@playwright/test';

test('language switch keeps the section hash on the home page', async ({ page }) => {
  await page.goto('/en/#projekty');
  await page.locator('[data-lang-switch][hreflang="sk"]').click();
  await expect(page).toHaveURL(/\/#projekty$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
});

test('language switch on the privacy page goes to the other locale privacy page', async ({
  page,
}) => {
  await page.goto('/en/privacy/');
  await page.locator('[data-lang-switch][hreflang="sk"]').click();
  await expect(page).toHaveURL(/\/ochrana-osobnych-udajov\/$/);
});

test('CV request pre-selects the CV project type', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-cv-request]').click();
  await expect(page.locator('select[name=type]')).toHaveValue('cv');
  await expect(page.locator('textarea[name=message]')).toHaveAttribute('placeholder', /CV/);
});

test('mobile menu hides links until opened', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const link = page.locator('#main-nav a[href="#sluzby"]');
  await expect(link).toBeHidden();
  await page.locator('[data-menu-toggle]').click();
  await expect(link).toBeVisible();
});
