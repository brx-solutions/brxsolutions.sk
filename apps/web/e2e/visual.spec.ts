import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The window is open on a first visit; these three pin the page without it.
const closed = () => localStorage.setItem('brx-term', 'closed');

for (const path of ['/', '/en/']) {
  test(`${path} matches the visual baseline`, async ({ page }) => {
    await page.addInitScript(closed);
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot({
      fullPage: true,
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });

  test(`${path} has no horizontal overflow`, async ({ page }) => {
    await page.addInitScript(closed);
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.addInitScript(closed);
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).exclude('.cf-turnstile').analyze();
    const serious = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(
      serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });
}

// ---------- with the terminal window open (the default on a first visit) ----------

const SCENES = [
  'profile',
  'stats',
  'services',
  'stack',
  'experience',
  'projects',
  'own',
  'process',
  'strengths',
  'contact',
];
const overflow = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const showScene = (page: import('@playwright/test').Page, scene: string) =>
  page.evaluate((s) => {
    const el = document.querySelector<HTMLElement>(`[data-scene="${s}"]`)!;
    const r = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + r.height * 0.9 - window.innerHeight * 0.55);
  }, scene);

for (const path of ['/', '/en/']) {
  test(`${path} with the window open has no horizontal overflow in any scene`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('data-term', 'open');
    for (const scene of SCENES) {
      await showScene(page, scene);
      expect(await overflow(page), scene).toBe(0);
    }
  });

  test(`${path} with the window open or maximised has no serious accessibility violations`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const serious = async () => {
      const { violations } = await new AxeBuilder({ page }).exclude('.cf-turnstile').analyze();
      return violations
        .filter((v) => v.impact === 'critical' || v.impact === 'serious')
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    };
    expect(await serious()).toEqual([]);
    await showScene(page, 'stack');
    expect(await serious()).toEqual([]);
    await page.locator('[data-term-max]').click();
    await expect(page.locator('html')).toHaveAttribute('data-term', 'max');
    expect(await serious()).toEqual([]);
  });

  test(`${path} with the window open matches the visual baseline`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const shot = { maxDiffPixelRatio: 0.01, animations: 'disabled' } as const;
    const name = path === '/' ? 'sk' : 'en';
    await expect(page).toHaveScreenshot(`open-top-${name}.png`, shot);
    await showScene(page, 'projects');
    await expect(page.locator('[data-term-file]')).toContainText('pytest');
    await expect(page).toHaveScreenshot(`open-projects-${name}.png`, shot);
  });
}

for (const width of [1100, 1280]) {
  test(`window open at ${width}px wide: no overflow and cards no narrower than today`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'desktop layout only');
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    for (const scene of SCENES) {
      await showScene(page, scene);
      expect(await overflow(page), scene).toBe(0);
    }
    const narrowest = await page.evaluate(() =>
      Math.min(
        ...[...document.querySelectorAll('[data-scene-item]')].map(
          (el) => el.getBoundingClientRect().width,
        ),
      ),
    );
    // 224px is what the page already does at a 768px viewport (three service cards).
    expect(narrowest).toBeGreaterThanOrEqual(220);
  });
}
