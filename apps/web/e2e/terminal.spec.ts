import { test, expect, type Page } from '@playwright/test';

const html = (page: Page) => page.locator('html');
const win = (page: Page) => page.locator('[data-term-window]');
const file = (page: Page) => page.locator('[data-term-file]');
const body = (page: Page) => page.locator('[data-term-body]');
const dock = (page: Page) => page.locator('[data-term-dock]');

/** Scrolls so the section is the active one and all of its items are revealed. */
const scrollInto = (page: Page, scene: string) =>
  page.evaluate((s) => {
    const el = document.querySelector<HTMLElement>(`[data-scene="${s}"]`)!;
    const r = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + r.height * 0.9 - window.innerHeight * 0.55);
  }, scene);

test('first visit shows the window on profile.ts and hides the static hero card', async ({
  page,
}) => {
  await page.goto('/');
  await expect(html(page)).toHaveAttribute('data-term', 'open');
  await expect(win(page)).toBeVisible();
  await expect(file(page)).toHaveText('profile.ts');
  await expect(body(page)).toContainText('Peter Beraxa');
  await expect(page.locator('[data-hero-code]')).toBeHidden();
  await expect(dock(page)).toBeHidden();
});

test('scrolling to case studies switches the window to pytest', async ({ page }) => {
  await page.goto('/');
  await scrollInto(page, 'projects');
  await expect(file(page)).toContainText('pytest');
  await expect(body(page)).toContainText('cases/test_blick');
  await expect(body(page)).toContainText('Záchrana RAG');
  await expect(page.locator('[data-term-count]')).toHaveText('6 / 10');
});

test('the newest line in the window marks its card on the page', async ({ page }) => {
  await page.goto('/');
  await scrollInto(page, 'projects');
  await expect(page.locator('[data-scene-item="rpd"]')).toHaveClass(/term-active/);
  await expect(page.locator('.term-active')).toHaveCount(1);
});

test('yellow minimises to the dock and the dock restores', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-term-min]').click();
  await expect(html(page)).toHaveAttribute('data-term', 'min');
  await expect(win(page)).toBeHidden();
  await expect(dock(page)).toBeVisible();
  await expect(dock(page)).toContainText('profile.ts');
  await dock(page).click();
  await expect(html(page)).toHaveAttribute('data-term', 'open');
  await expect(win(page)).toBeVisible();
});

test('red closes; the static hero card is back', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-term-close]').click();
  await expect(html(page)).toHaveAttribute('data-term', 'closed');
  await expect(win(page)).toBeHidden();
  await expect(page.locator('[data-hero-code]')).toBeVisible();
  await expect(dock(page)).toContainText('otvoriť');
});

test('state survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-term-min]').click();
  await expect(html(page)).toHaveAttribute('data-term', 'min');
  await page.reload();
  await expect(html(page)).toHaveAttribute('data-term', 'min');
  await expect(dock(page)).toBeVisible();
  await expect(win(page)).toBeHidden();
});

test('green maximises, Escape returns, and maximised is not remembered', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-term-max]').click();
  await expect(html(page)).toHaveAttribute('data-term', 'max');
  const size = page.viewportSize()!;
  await expect
    .poll(async () => {
      const box = (await win(page).boundingBox())!;
      return [Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)];
    })
    .toEqual([0, 0, size.width, size.height]);
  await expect(page.locator('[data-term-cap]')).toBeVisible();
  await page.reload();
  await expect(html(page)).toHaveAttribute('data-term', 'open');
  await page.locator('[data-term-max]').click();
  await page.keyboard.press('Escape');
  await expect(html(page)).toHaveAttribute('data-term', 'open');
  await expect(page.locator('[data-term-cap]')).toBeHidden();
});

test('maximised caption arrows move between sections', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-term-max]').click();
  await page.locator('[data-term-next]').click();
  await expect(page.locator('[data-term-count]')).toHaveText('2 / 10');
  await page.locator('[data-term-next]').click();
  await expect(file(page)).toHaveText('services.ts');
  await expect(page.locator('[data-term-title]')).toHaveText('Čo pre vás viem spraviť');
  await page.locator('[data-term-prev]').click();
  await expect(page.locator('[data-term-count]')).toHaveText('2 / 10');
});

test('opening a case study detail shows its content file', async ({ page }) => {
  await page.goto('/');
  await scrollInto(page, 'projects');
  await page.locator('[data-scene-item="blick"] summary').click();
  await expect(file(page)).toHaveText('cases/blick.md');
  await expect(body(page)).toContainText('Ako som to riešil');
  await expect(body(page)).toContainText('Migrácia dokončená pred odstavením SDK');
  await page.locator('[data-scene-item="blick"] summary').click();
  await expect(file(page)).toContainText('pytest');
});

test('clicking a stack row unfolds it', async ({ page }) => {
  await page.goto('/');
  await scrollInto(page, 'stack');
  await expect(file(page)).toHaveText('stack.ts');
  await body(page).locator('[data-fold="1"]').click();
  await expect(body(page).locator('[data-fold="1"]')).toHaveAttribute('aria-expanded', 'true');
  await expect(body(page)).toContainText('Palantir Foundry');
});

test('typing in the form appears in the request body as text', async ({ page }) => {
  await page.goto('/');
  await scrollInto(page, 'contact');
  await page.fill('input[name=name]', 'Playwright');
  await page.fill('textarea[name=message]', '<b>bold</b> & "quotes"');
  await expect(file(page)).toContainText('POST');
  await expect(body(page)).toContainText('"Playwright"');
  await expect(body(page)).toContainText('<b>bold</b> & "quotes"');
  await expect(body(page).locator('b')).toHaveCount(0);
});

test('a successful submit shows 201 Created', async ({ page }) => {
  await page.goto('/#kontakt');
  await page.fill('input[name=name]', 'Playwright');
  await page.fill('input[name=email]', 'pw@example.com');
  await page.fill('textarea[name=message]', 'Hello from Playwright, this is a test message.');
  await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
    timeout: 15_000,
  });
  await page.click('[data-contact-form] button[type=submit]');
  await expect(page.locator('[data-form-status]')).toContainText('Ďakujem');
  await expect(body(page)).toContainText('201 Created');
});

test('works when localStorage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('denied');
      },
    });
  });
  await page.goto('/');
  await expect(html(page)).toHaveAttribute('data-term', 'open');
  await expect(body(page)).toContainText('Peter Beraxa');
  await page.locator('[data-term-min]').click();
  await expect(dock(page)).toBeVisible();
  await dock(page).click();
  await expect(win(page)).toBeVisible();
});

test('reduced motion shows complete scenes at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/');
  await expect(body(page)).toContainText('remote:');
  await page.evaluate(() => document.querySelector('[data-scene="projects"]')!.scrollIntoView());
  await expect(body(page)).toContainText('cases/test_rpd');
});

test('the english page uses english content in the window', async ({ page }) => {
  await page.goto('/en/');
  await scrollInto(page, 'projects');
  await expect(body(page)).toContainText('RAG rescue');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('there is no window and no dock, and the hero card is shown', async ({ page }) => {
    await page.goto('/');
    await expect(win(page)).toBeHidden();
    await expect(dock(page)).toBeHidden();
    await expect(page.locator('[data-hero-code]')).toBeVisible();
  });
});

test('hiding the window on a phone keeps the reading position', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await scrollInto(page, 'services');
  const heading = page.locator('[data-scene="services"] h2');
  const before = (await heading.boundingBox())!.y;
  await page.locator('[data-term-min]').click();
  await expect(win(page)).toBeHidden();
  const hidden = (await heading.boundingBox())!.y;
  expect(Math.abs(hidden - before)).toBeLessThanOrEqual(4);
  await dock(page).click();
  await expect(win(page)).toBeVisible();
  const shown = (await heading.boundingBox())!.y;
  expect(Math.abs(shown - before)).toBeLessThanOrEqual(4);
});
