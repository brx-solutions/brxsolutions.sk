# brxsolutions.sk — Site and Contact API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A bilingual static Astro site reproducing the approved mockup, with all copy in content files, plus a small Hono API that delivers contact-form messages by email; both packaged as Docker images.

**Architecture:** pnpm monorepo with `apps/web` (Astro 7, static output, Tailwind v4, content collections per locale) and `apps/contact-api` (Hono on Node 22, dependency-injected Turnstile verifier, rate limiter and mailer). Caddy serves the built site and proxies `/api/*` to the API. Infrastructure (tunnel, Umami, CI deploy) is a separate plan.

**Tech Stack:** Node 22 LTS, pnpm 10, Astro 7.4, Tailwind 4.3 (`@tailwindcss/vite`), `@astrojs/sitemap`, `@fontsource/*`, Zod 4 (`astro/zod` in web, `zod` in api), Hono 4.13 + `@hono/node-server`, Resend SDK 6, Vitest 5, Playwright 1.64, Caddy 2, Docker.

**Spec:** `docs/superpowers/specs/2026-11-03-brxsolutions-web-design.md`

## Global Constraints

- Node `>=22.12.0` (Astro 6+ floor). `.nvmrc` = `22`. Owner has 22.22.3 via nvm.
- Astro 7 rules: collections in `src/content.config.ts`, every collection has a `glob()` loader, `z` from `astro/zod`, `render(entry)` from `astro:content`, `compressHTML` defaults to `'jsx'`.
- No text in components. Every visible string comes from `src/i18n/{sk,en}.ts`, `src/config/company.ts`, or `src/content/**`.
- SK is the default locale at `/`, EN at `/en/`. Section anchors are Slovak in both locales: `#sluzby #stack #skusenosti #projekty #vlastne #kontakt`.
- Accent `#14B8A6`, accent light `#5EEAD4`, page background `#0A0E14`. All other values copied from the mockup's inline styles.
- No runtime request to Google Fonts or any CDN. Only external hosts allowed from the browser: `challenges.cloudflare.com` (Turnstile) and the stats host.
- No cookies set by the site.
- Form recipient `peter.beraxa@gmail.com` and contact email shown on the page are configuration, never literals in components.
- Placeholders stay as `[...]` in content until the owner fills them.
- Never `:latest` for production images. Tags are the git sha.
- Commits: Conventional Commits, trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. A form body with `Content-Type: text/plain` or no content type must get `415`, not a `500` (Task 10).
2. Turnstile siteverify unreachable or timing out must yield `502` with the "email directly" message within 5 s, never a hang (Task 9).
3. Two content files in one locale with the same `order`, or a slug present in `sk/` but not `en/`, must fail the test suite before it fails silently in layout (Task 4).
4. A message of 5000 four-byte characters (20 KB) must pass the 32 KiB body limit; 32 KiB + 1 byte must get `413` (Task 10).
5. Language switch from `/en/#projekty` must land on `/#projekty`, and from `/en/privacy` on `/ochrana-osobnych-udajov` with no hash (Task 7).

---

### Task 1: Monorepo scaffold and Astro build

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.gitignore`, `.editorconfig`, `.prettierrc`, `README.md`
- Create: `apps/web/package.json`, `apps/web/astro.config.ts`, `apps/web/tsconfig.json`, `apps/web/src/pages/index.astro`, `apps/web/src/styles/global.css`, `apps/web/vitest.config.ts`, `apps/web/tests/smoke.test.ts`

**Interfaces:**
- Produces: root scripts `pnpm build`, `pnpm test`, `pnpm typecheck`, `pnpm lint` that run across workspaces with `pnpm -r`.
- Produces: `apps/web` builds to `apps/web/dist/`.

- [ ] **Step 1: Root files**

`pnpm-workspace.yaml` lists `apps/*`. Root `package.json`: `"private": true`, `"packageManager": "pnpm@10"`, `"engines": {"node": ">=22.12.0"}`, scripts `build`, `test`, `typecheck`, `lint`, `format` each as `pnpm -r run <name>`. `.nvmrc` contains `22`. `.gitignore`: `node_modules`, `dist`, `.astro`, `.env`, `test-results`, `playwright-report`. `.prettierrc`: `{"singleQuote": true, "semi": true, "printWidth": 100, "plugins": ["prettier-plugin-astro"]}`.

- [ ] **Step 2: Astro app**

`apps/web/package.json` scripts: `dev: astro dev`, `build: astro build`, `preview: astro preview`, `typecheck: astro check`, `test: vitest run`, `lint: prettier --check .`, `format: prettier --write .`. Dependencies: `astro`, `@astrojs/sitemap`, `@tailwindcss/vite`, `tailwindcss`, `@fontsource/inter`, `@fontsource/space-grotesk`, `@fontsource/jetbrains-mono`. Dev: `@astrojs/check`, `typescript`, `vitest`, `prettier`, `prettier-plugin-astro`.

`astro.config.ts`:
```ts
export default defineConfig({
  site: 'https://brxsolutions.sk',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: { inlineStylesheets: 'never' },
  i18n: { defaultLocale: 'sk', locales: ['sk', 'en'], routing: { prefixDefaultLocale: false } },
  integrations: [sitemap({ i18n: { defaultLocale: 'sk', locales: { sk: 'sk-SK', en: 'en' } } })],
  vite: { plugins: [tailwindcss()] },
});
```
`inlineStylesheets: 'never'` so the CSP can stay without `'unsafe-inline'`. `compressHTML: true` keeps inline-element spacing as in the mockup.

`tsconfig.json` extends `astro/tsconfigs/strict`.

`src/pages/index.astro`: `<html lang="sk">` with a `<title>` from a hardcoded string for now (replaced in Task 3) and an empty body. `src/styles/global.css`: `@import "tailwindcss";` only.

`vitest.config.ts` uses `getViteConfig` from `astro/config`.

- [ ] **Step 3: Write the failing smoke test**

`apps/web/tests/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('build output', () => {
  it('writes index.html with lang=sk', () => {
    expect(existsSync('dist/index.html')).toBe(true);
    expect(readFileSync('dist/index.html', 'utf8')).toContain('<html lang="sk"');
  });
});
```

- [ ] **Step 4: Run it to see it fail**

Run: `cd apps/web && pnpm install && pnpm test`
Expected: FAIL, `dist/index.html` missing.

- [ ] **Step 5: Build and run again**

Run: `cd apps/web && pnpm build && pnpm test && pnpm typecheck`
Expected: build ends with `Complete!`, test PASS, `astro check` 0 errors.

- [ ] **Step 6: README stub and commit**

README: project purpose, `nvm use`, `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`. Launch checklist section copied from spec §15.

```bash
git add -A && git commit -m "chore: scaffold pnpm monorepo with Astro web app"
```

---

### Task 2: Design tokens, fonts and base layout

**Files:**
- Modify: `apps/web/src/styles/global.css`
- Create: `apps/web/src/layouts/Base.astro`, `apps/web/src/config/company.ts`, `apps/web/tests/helpers/render.ts`, `apps/web/tests/layout.test.ts`

**Interfaces:**
- Produces: `company` object:
```ts
export const company = {
  name: 'BRX Solutions s.r.o.',
  founder: 'Peter Beraxa',
  ico: '57688338', dic: '2122888691',
  seat: 'Bytča, Slovensko',
  register: 'Obchodný register Okresného súdu Žilina, oddiel: Sro, vložka č. 91617/L',
  email: 'peter.beraxa@gmail.com',
  domain: 'brxsolutions.sk',
  siteUrl: 'https://brxsolutions.sk',
  since: 2017,
} as const;
```
- Produces: `Base.astro` props `{ locale: Locale; title: string; description: string; alternates: Record<Locale, string> }` where `alternates` maps each locale to that page's absolute-path URL (home: `{ sk: '/', en: '/en/' }`; legal: `{ sk: '/ochrana-osobnych-udajov/', en: '/en/privacy/' }`), computed by the page. Renders `<html lang>`, meta, OG tags, hreflang alternates for both locales, JSON-LD `Organization`, optional Umami script when `PUBLIC_UMAMI_SRC` and `PUBLIC_UMAMI_WEBSITE_ID` are set, and `<slot />`.
- Produces: test helper `renderToHtml(Component, props, slots?)` wrapping `experimental_AstroContainer` from `astro/container`.
- Produces: CSS theme tokens (Tailwind `@theme`):
  `--color-bg #0A0E14`, `--color-surface #0F1620`, `--color-surface-2 #141C27`, `--color-ink #F1F4F8`, `--color-ink-2 #C3CCD8`, `--color-muted #AEB8C6`, `--color-code #D5DBE4`, `--color-accent #14B8A6`, `--color-accent-light #5EEAD4`, `--color-line rgba(255,255,255,0.08)`, `--color-line-2 rgba(255,255,255,0.14)`, `--color-pink #F0ABFC`, `--color-sky #7DD3FC`, `--font-sans Inter`, `--font-display "Space Grotesk"`, `--font-mono "JetBrains Mono"`, `--radius-card 20px`, `--container 1240px`.

- [ ] **Step 1: Write the failing layout test**

`tests/layout.test.ts`: render `Base` with `{ locale: 'en', title: 'T', description: 'D', alternates: { sk: '/', en: '/en/' } }` and assert the HTML contains `<html lang="en"`, `hreflang="sk" href="https://brxsolutions.sk/"`, `hreflang="en" href="https://brxsolutions.sk/en/"`, `"@type":"Organization"`, and does not contain `fonts.googleapis.com`. Second case: with `PUBLIC_UMAMI_SRC` unset the HTML contains no `data-website-id`.

- [ ] **Step 2: Run it to see it fail**

Run: `cd apps/web && pnpm test tests/layout.test.ts`
Expected: FAIL, `Base.astro` not found.

- [ ] **Step 3: Implement tokens, fonts, `company.ts`, `Base.astro`, render helper**

`global.css`: `@import "tailwindcss";` then `@import "@fontsource/inter/400.css"` … weights 400,500,600,700,800; Space Grotesk 500,600,700; JetBrains Mono 400,500; then `@theme { … }` with the tokens above; then base rules from the mockup `<helmet><style>`: `body{margin:0;background:var(--color-bg)}`, `a{color:var(--color-ink);text-decoration:none} a:hover{color:var(--color-accent-light)}`, form controls use `var(--font-sans)`.

- [ ] **Step 4: Run tests**

Run: `cd apps/web && pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): design tokens, self-hosted fonts and base layout"
```

---

### Task 3: i18n dictionary

**Files:**
- Create: `apps/web/src/i18n/dictionary.ts`, `apps/web/src/i18n/sk.ts`, `apps/web/src/i18n/en.ts`, `apps/web/src/i18n/index.ts`, `apps/web/tests/i18n.test.ts`

**Interfaces:**
- Produces:
```ts
export type Locale = 'sk' | 'en';
export const locales: readonly Locale[] = ['sk', 'en'];
export const defaultLocale: Locale = 'sk';
export function t(locale: Locale): Dictionary;
export function localeHome(locale: Locale): string;          // '/' | '/en/'
export function localePath(locale: Locale, path: string): string; // wraps getRelativeLocaleUrl, trailing slash
export const anchors = { services: 'sluzby', stack: 'stack', experience: 'skusenosti', projects: 'projekty', own: 'vlastne', contact: 'kontakt' } as const;
export const legalPath: Record<Locale, string> = { sk: 'ochrana-osobnych-udajov', en: 'privacy' };
export const sentPath: Record<Locale, string> = { sk: 'sprava-odoslana', en: 'message-sent' };
export const failedPath: Record<Locale, string> = { sk: 'sprava-neodoslana', en: 'message-failed' };
```
- Produces `Dictionary` type with these groups (all strings unless noted): `meta {title, description}`, `nav {services, stack, experience, projects, own, contact, cta, langLabel, menuOpen, menuClose}`, `hero {eyebrow, title, sub, cta1, cta2, availability, code: {focus: string[], stack: string[], remote: boolean}}`, `stats: {value, label}[]` (exactly 4), `services {title, sub, featuredBadge, featured: {title, desc, quote, tags: string[]}, items: {icon: IconName, title, desc, tags: string[]}[]}` (3 items), `stack {title, note, fullstack, groups: {name, count, bar: string, items: string[]}[]}`, `experience {title, sub, cta}`, `projects {title, sub, more, less, nda}`, `own {eyebrow, title, sub, more, less}`, `process {eyebrow, title, steps: {no, title, desc}[]}`, `strengths {eyebrow, title, sub, items: {title, desc}[]}`, `contact {title, sub, emailLabel, form: {name, email, type, options: Record<'ai'|'backend'|'audit'|'cv', string>, message, messagePlaceholder, cvPlaceholder, submit, sending, success, error, note, noteLink}}`, `legal {title}`, `sent {title, body, back}`, `failed {title, body, back}`, `footer {built, rights}`.
- `IconName = 'api' | 'data' | 'legacy' | 'bot' | 'invoice' | 'home'`.

- [ ] **Step 1: Write the failing tests**

`tests/i18n.test.ts`:
```ts
it('sk and en expose the same key paths', () => {
  expect(keyPaths(en)).toEqual(keyPaths(sk)); // recursive key list, arrays compared by length
});
it('t() returns the matching dictionary', () => {
  expect(t('sk').nav.services).toBe('Služby');
  expect(t('en').nav.services).toBe('Services');
});
it('localePath builds prefixed urls with trailing slash', () => {
  expect(localePath('sk', 'ochrana-osobnych-udajov')).toBe('/ochrana-osobnych-udajov/');
  expect(localePath('en', 'privacy')).toBe('/en/privacy/');
  expect(localeHome('en')).toBe('/en/');
});
```
`keyPaths` is a small test-local helper.

- [ ] **Step 2: Run to see it fail**

Run: `cd apps/web && pnpm test tests/i18n.test.ts`
Expected: FAIL, modules missing.

- [ ] **Step 3: Implement the dictionary files**

Copy every string from the mockup's `T.sk` / `T.en` objects and the inline arrays `stats`, `featured`, `services`, `stack`, `process`, `strengths` into `sk.ts` / `en.ts`. Keep `\n` line breaks in `hero.title` and `contact.title`. Add the new keys the mockup lacks: `nav.menuOpen/menuClose` ("Menu"/"Zavrieť", "Menu"/"Close"), `contact.form.options.cv` ("Žiadosť o CV" / "CV request"), `contact.form.cvPlaceholder` ("Prosím o zaslanie CV. Kontext: …" / "Please send me your CV. Context: …"), `contact.form.sending/success/error`, `contact.form.noteLink` ("ochrana osobných údajov" / "privacy policy"), `meta`, `legal`, `sent`, `failed`, `footer.rights`. `hero.code` holds `focus: ['backend','GenAI / RAG','data']`, `stack: ['Python','TypeScript','GCP']`, `remote: true`; name, company, since come from `company.ts`. Both files are typed `export const sk: Dictionary = {…}` so `astro check` catches a missing key.

- [ ] **Step 4: Run tests and typecheck**

Run: `cd apps/web && pnpm test && pnpm typecheck`
Expected: PASS, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): typed sk/en dictionary and locale helpers"
```

---

### Task 4: Content collections and content files

**Files:**
- Create: `apps/web/src/content/schemas.ts`, `apps/web/src/content.config.ts`, `apps/web/src/content/queries.ts`
- Create: `apps/web/src/content/experience/{sk,en}/*.md` (5 each), `apps/web/src/content/projects/{sk,en}/*.md` (4 each: `blick`, `proteus`, `football`, `rpd`), `apps/web/src/content/own/{sk,en}/*.md` (3 each: `agents`, `acc`, `ha`), `apps/web/src/content/legal/{sk,en}/privacy.md`
- Create: `apps/web/tests/content.test.ts`

**Interfaces:**
- Produces schemas (Zod, `astro/zod`):
```ts
experienceSchema: { period: string, role: string, client: string, tags: string[], order: number }           // body = description
projectSchema:    { title: string, context: string, year: string, metric: string, metricLabel: string,
                    problem: string, solution: string, result: string, tags: string[], order: number }      // body unused now
ownSchema:        { title: string, status: string, icon: IconName, tech: string, tags: string[], order: number } // body = description
legalSchema:      { title: string, updated: string }                                                        // body = policy
```
- Produces `queries.ts`:
```ts
export async function localized<C extends 'experience' | 'projects' | 'own'>(collection: C, locale: Locale): Promise<CollectionEntry<C>[]>; // id startsWith `${locale}/`, sorted by data.order asc
export async function legal(locale: Locale): Promise<CollectionEntry<'legal'>>;
```
- Entry ids follow Astro's glob loader: `sk/blick`, `en/blick`.

- [ ] **Step 1: Write the failing content tests**

`tests/content.test.ts` reads files from disk with `node:fs` and parses frontmatter with `gray-matter` (dev dependency), validating against the schemas from `src/content/schemas.ts`:
```ts
for (const collection of ['experience', 'projects', 'own', 'legal']) {
  it(`${collection}: every sk slug exists in en and vice versa`, …);   // set equality of file names
  it(`${collection}: frontmatter matches the schema`, …);              // schema.parse(matter(file).data) does not throw
  it(`${collection}: order values are unique per locale`, …);          // skip for legal
}
it('reports placeholders left in content', () => {
  const found = findPlaceholders('src/content', 'src/i18n', 'src/config'); // regex /\[[^\]\n]+\]/ on lines, excluding markdown links
  console.warn(found.map(f => `${f.file}:${f.line}: ${f.text}`).join('\n'));
  expect(Array.isArray(found)).toBe(true); // warn only, never fail
});
```

- [ ] **Step 2: Run to see it fail**

Run: `cd apps/web && pnpm test tests/content.test.ts`
Expected: FAIL, `schemas.ts` missing.

- [ ] **Step 3: Implement schemas, config, queries, content files**

`content.config.ts` registers four collections with `glob({ base: './src/content/<name>', pattern: '**/*.md' })`. Content files: transcribe the mockup's `expBase`, `projBase`, `ownBase` arrays one file per entry per locale; `order` 1..n in mockup order; `desc` becomes the markdown body for experience and own; for projects all fields are frontmatter. `legal/*/privacy.md`: builder-drafted GDPR policy covering controller (company fields), purpose (replying to enquiries), data (name, email, project type, message), legal basis (consent, Art. 6(1)(a)), retention (12 months), processors (Resend, Cloudflare, Umami self-hosted with no personal data), rights, contact; `updated: '2026-11-03'`.

- [ ] **Step 4: Run tests, build, typecheck**

Run: `cd apps/web && pnpm test && pnpm build && pnpm typecheck`
Expected: PASS; build succeeds (Astro validates frontmatter at build too); the placeholder warning lists `Peter Beraxa`, `[mesiac rok]`, `[2025]`, `57688338` and the register placeholder.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): content collections for experience, projects, own projects and legal"
```

---

### Task 5: Header, hero, stats strip, footer, home page shell

**Files:**
- Create: `apps/web/src/components/Icon.astro`, `apps/web/src/components/Header.astro`, `apps/web/src/components/Hero.astro`, `apps/web/src/components/Stats.astro`, `apps/web/src/components/Footer.astro`, `apps/web/src/components/Section.astro`, `apps/web/src/components/Home.astro` (shared page body, not a route), `apps/web/src/pages/en/index.astro`
- Modify: `apps/web/src/pages/index.astro`
- Test: `apps/web/tests/components/header.test.ts`, `apps/web/tests/components/hero.test.ts`, `apps/web/tests/pages.test.ts`

**Interfaces:**
- All section components take `{ locale: Locale }` and read `t(locale)` themselves.
- `Icon.astro` props `{ name: IconName; size?: number }`, paths copied from the mockup `icons` map plus `arrow`, `mail`, `chevron`, `menu`, `close`.
- `Section.astro` props `{ id: string; eyebrow?: string; title: string; sub?: string }` renders the mockup's section header pattern (mono eyebrow, display title, muted sub) and a `<slot />`.
- `Home.astro` props `{ locale }`; `index.astro` and `en/index.astro` render `<Home locale="sk" />` / `<Home locale="en" />` inside `Base`.

- [ ] **Step 1: Write the failing tests**

`header.test.ts`: renders `Header` for `en` and asserts links `href="#sluzby"` … `href="#kontakt"` exist with the EN labels, the SK/EN switch renders `<a href="/" hreflang="sk" data-lang-switch>` and `<a href="/en/" hreflang="en" data-lang-switch aria-current="true">`, the CTA text is `Free consultation`, and a `<button aria-controls="main-nav" aria-expanded="false">` exists for mobile.
`hero.test.ts`: `h1` contains `Back-end and AI` with `white-space: pre-line` class, the code window contains `company: "BRX Solutions s.r.o."` and `since: 2017`, no literal `Peter Beraxa` is hardcoded (it comes from `company.founder`; assert equality with the config value).
`pages.test.ts` (runs on `dist/`, after build): `dist/index.html` and `dist/en/index.html` exist; each contains all six section ids; `dist/en/index.html` contains `lang="en"`; neither contains `fonts.googleapis`.

- [ ] **Step 2: Run to see them fail**

Run: `cd apps/web && pnpm test`
Expected: FAIL, components missing.

- [ ] **Step 3: Implement Header, Hero, Stats, Footer, Section, Icon, Home, routes**

Mobile: below `md`, the nav links move into `<div id="main-nav" hidden>` toggled by the button via a tiny bundled `<script>` (Task 7 adds the hash-preserving switch script; the menu toggle lives here). Footer: logo, `company.name`, `© {year} {company.name} · IČO {company.ico} · {company.seat} · {company.domain}`, link to the legal page via `legalPath[locale]`, and `footer.built`. Stats grid: `repeat(auto-fit, minmax(230px, 1fr))` as in mockup.

- [ ] **Step 4: Build and test**

Run: `cd apps/web && pnpm build && pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): header, hero, stats, footer and bilingual home routes"
```

---

### Task 6: Services, stack, experience, case studies, own projects, process, strengths

**Files:**
- Create: `apps/web/src/components/Services.astro`, `Stack.astro`, `Experience.astro`, `Projects.astro`, `Own.astro`, `Process.astro`, `Strengths.astro`, `Tag.astro`, `Details.astro`
- Modify: `apps/web/src/components/Home.astro`
- Test: `apps/web/tests/components/sections.test.ts`

**Interfaces:**
- `Details.astro` props `{ moreLabel: string; lessLabel: string }`, renders `<details class="…"><summary>…</summary><slot/></details>`; summary shows `moreLabel` with chevron down, CSS `details[open] summary` shows `lessLabel` and chevron up (both labels rendered, toggled with CSS `[open]`).
- `Tag.astro` default slot, the mockup's pill style.
- Section ids via `anchors`.

- [ ] **Step 1: Write the failing tests**

`sections.test.ts` renders each component for `sk`:
- Services: featured card has text `hlavná špecializácia` and `grid-column: span 2` class equivalent; 3 regular cards; tags rendered.
- Stack: 4 groups, each with its `count` text; bar widths `95%`, `88%`, `80%`, `85%` present as inline `style="width: …"` (the only allowed inline style, data-driven).
- Experience: 5 entries in `order`, first has the accent dot class, `expCta` link `href="#kontakt" data-cv-request`.
- Projects: 4 `<details>` with `<summary>` text `Ako som to riešil`, each card shows `metric` and `metricLabel`, NDA note present.
- Own: 3 `<details>`, summary `Technické detaily`, icons rendered via `Icon`.
- Process: 4 steps numbered `1`–`4`. Strengths: 8 items.

- [ ] **Step 2: Run to see it fail**

Run: `cd apps/web && pnpm test tests/components/sections.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the components and add them to `Home.astro` in mockup order**

Experience and Own render markdown bodies with `render(entry)`; Projects use frontmatter only.

- [ ] **Step 4: Build and test**

Run: `cd apps/web && pnpm build && pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): services, stack, experience, case studies, own projects, process, strengths"
```

---

### Task 7: Contact section, legal/sent/failed pages, client scripts

**Files:**
- Create: `apps/web/src/components/Contact.astro`, `apps/web/src/components/ContactForm.astro`, `apps/web/src/scripts/lang-switch.ts`, `apps/web/src/scripts/cv-request.ts`, `apps/web/src/scripts/contact-form.ts`
- Create: `apps/web/src/pages/ochrana-osobnych-udajov.astro`, `apps/web/src/pages/en/privacy.astro`, `apps/web/src/pages/sprava-odoslana.astro`, `apps/web/src/pages/en/message-sent.astro`, `apps/web/src/pages/sprava-neodoslana.astro`, `apps/web/src/pages/en/message-failed.astro`, `apps/web/src/components/LegalPage.astro`, `apps/web/src/components/StatusPage.astro`
- Modify: `apps/web/src/components/Home.astro`, `apps/web/src/components/Header.astro` (import `lang-switch.ts`), `apps/web/.env.example`
- Test: `apps/web/tests/components/contact.test.ts`, `apps/web/tests/pages.test.ts` (extend), `apps/web/e2e/navigation.spec.ts`

**Interfaces:**
- Form markup (names are the API contract, Task 10):
```html
<form method="post" action={endpoint} data-contact-form data-lang={locale}>
  <input name="name" required maxlength="100">
  <input name="email" type="email" required maxlength="254">
  <select name="type">  <!-- values: ai | backend | audit | cv -->
  <textarea name="message" required minlength="10" maxlength="5000">
  <input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="hp">  <!-- honeypot, visually hidden -->
  <input type="hidden" name="lang" value={locale}>
  <div class="cf-turnstile" data-sitekey={PUBLIC_TURNSTILE_SITE_KEY}></div>
  <button type="submit">…</button>
  <p data-form-status role="status" aria-live="polite" hidden></p>
</form>
```
- `endpoint = import.meta.env.PUBLIC_CONTACT_ENDPOINT ?? '/api/contact'`.
- Turnstile loader: `<script is:inline async defer src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>` rendered inside `Contact.astro` only.
- `.env.example`: `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`, `PUBLIC_CONTACT_ENDPOINT=/api/contact`, `PUBLIC_UMAMI_SRC=`, `PUBLIC_UMAMI_WEBSITE_ID=`.
- `lang-switch.ts`: on click of `[data-lang-switch]`, if `location.hash` is non-empty and the target is a home URL, append the hash. No-op elsewhere.
- `cv-request.ts`: on click of `[data-cv-request]`, set `select[name=type]` to `cv`, set textarea placeholder to `contact.form.cvPlaceholder` (read from `data-cv-placeholder` on the form), focus the name field after scroll.
- `contact-form.ts`: intercept submit, POST JSON `{name,email,type,message,lang,website,'cf-turnstile-response'}` with `Accept: application/json`, disable button, show `sending`, then `success` (and reset form, `turnstile.reset()`) or `error` from the dictionary (rendered as `data-*` attributes on the form). Any network failure shows `error`.

- [ ] **Step 1: Write the failing tests**

`contact.test.ts`: renders `Contact` for `sk`: email link `href="mailto:peter.beraxa@gmail.com"` equals `company.email`; form has all names above; select has 4 options with values `ai,backend,audit,cv`; consent note links to `/ochrana-osobnych-udajov/`; `data-sitekey` equals the env value.
`pages.test.ts` additions: the six new routes exist in `dist/` at the paths from `legalPath`, `sentPath`, `failedPath`; privacy pages contain `company.name` and the `updated` date.
`e2e/navigation.spec.ts` (Playwright, `webServer: pnpm preview --port 4321`):
- open `/en/#projekty`, click SK switch, expect URL `/#projekty`.
- open `/en/privacy/`, click SK switch, expect URL `/ochrana-osobnych-udajov/` with no hash.
- open `/`, click `[data-cv-request]`, expect `select[name=type]` value `cv`.
- at 375 px width, nav links hidden until the menu button is clicked.

- [ ] **Step 2: Run to see them fail**

Run: `cd apps/web && pnpm test && pnpm exec playwright test`
Expected: FAIL.

- [ ] **Step 3: Implement components, pages, scripts; add Playwright config**

`playwright.config.ts`: `testDir: 'e2e'`, projects `desktop` (1440×900) and `mobile` (375×812), `webServer` builds then previews. Add scripts `e2e: playwright test` and `test:all: pnpm test && pnpm e2e`.

- [ ] **Step 4: Run everything**

Run: `cd apps/web && pnpm build && pnpm test && pnpm e2e && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): contact form, legal and status pages, language switch and CV prefill scripts"
```

---

### Task 8: Responsive polish and visual regression

**Files:**
- Modify: components as needed
- Create: `apps/web/e2e/visual.spec.ts`, `apps/web/public/og.png`, `apps/web/public/favicon.svg`, `apps/web/public/robots.txt`

**Interfaces:**
- `robots.txt`: `User-agent: *`, `Allow: /`, `Disallow: /api/`, `Sitemap: https://brxsolutions.sk/sitemap-index.xml`.
- `og.png` 1200×630, dark background, logo mark and `BRX Solutions` wordmark, tagline `Back-end a AI, ktoré bežia v produkcii.`; generated once with a script in `apps/web/scripts/og.ts` using `sharp` + inline SVG, committed as a binary.

- [ ] **Step 1: Write the failing visual test**

`visual.spec.ts`: full-page screenshot of `/` and `/en/` at both projects, `expect(page).toHaveScreenshot({ fullPage: true, maxDiffPixelRatio: 0.01 })`. Also an accessibility check per page with `@axe-core/playwright`: `expect(violations.filter(v => ['critical','serious'].includes(v.impact))).toEqual([])`.

- [ ] **Step 2: Run to generate baselines and see a11y results**

Run: `cd apps/web && pnpm e2e --update-snapshots`
Expected: baselines written; any serious axe violations listed.

- [ ] **Step 3: Fix layout at 375 px and any violations**

Every section must fit without horizontal scroll at 375 px; the 3-column services grid becomes 1 column, featured card spans full width; stack groups stack; project cards single column; hero title uses the mockup `clamp()`. Add `prefers-reduced-motion` guard around the hero cursor blink.

- [ ] **Step 4: Run everything, then Lighthouse once**

Run: `cd apps/web && pnpm build && pnpm test && pnpm e2e && pnpm typecheck`
Expected: PASS.
Run: `npx lighthouse http://localhost:4321/ --preset=desktop --only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless"` against `pnpm preview`.
Expected: all four ≥ 95. Record the numbers in the commit message.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): responsive layout, visual baselines, OG image, robots"
```

---

### Task 9: Contact API core: schema, Turnstile verifier, rate limiter, mailer

**Files:**
- Create: `apps/contact-api/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/schema.ts`, `src/turnstile.ts`, `src/rate-limit.ts`, `src/mailer.ts`, `src/config.ts`
- Test: `apps/contact-api/tests/schema.test.ts`, `tests/turnstile.test.ts`, `tests/rate-limit.test.ts`, `tests/mailer.test.ts`

**Interfaces:**
```ts
// schema.ts
export const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  type: z.enum(['ai', 'backend', 'audit', 'cv']),
  message: z.string().trim().min(10).max(5000),
  lang: z.enum(['sk', 'en']),
  website: z.string().max(0).optional().default(''),   // honeypot
  'cf-turnstile-response': z.string().min(1),
});
export type ContactInput = z.infer<typeof contactSchema>;

// turnstile.ts
export type TurnstileVerifier = (token: string, remoteIp: string | undefined) => Promise<boolean>;
export function createTurnstileVerifier(opts: { secret: string; fetchImpl?: typeof fetch; timeoutMs?: number /* 5000 */ }): TurnstileVerifier;
// POST https://challenges.cloudflare.com/turnstile/v0/siteverify, form-encoded secret/response/remoteip; true iff json.success === true; throws TurnstileUnavailable on network error, non-2xx or timeout.

// rate-limit.ts
export interface RateLimiter { hit(key: string): { allowed: boolean; retryAfterSec: number } }
export function createRateLimiter(opts: { limit: number /* 5 */; windowMs: number /* 3_600_000 */; now?: () => number }): RateLimiter;
// sliding window per key, in memory, prunes expired keys on each hit.

// mailer.ts
export interface ContactMail { input: ContactInput; ip: string | undefined; receivedAt: Date }
export type Mailer = (mail: ContactMail) => Promise<void>;  // throws MailFailed
export function createResendMailer(opts: { apiKey: string; from: string; to: string }): Mailer;
export function createConsoleMailer(): Mailer;              // logs the rendered text, for dev and e2e
export function renderMailText(mail: ContactMail): string;  // plain text: labels + values, never HTML
export function subjectFor(mail: ContactMail): string;      // `[brxsolutions.sk] ${type} – ${name}`

// config.ts
export function loadConfig(env: NodeJS.ProcessEnv): Config; // throws listing missing vars
export interface Config { port: number; siteOrigin: string; contactTo: string; contactFrom: string; turnstileSecret: string; resendApiKey?: string; mailTransport: 'resend' | 'console' }
```

- [ ] **Step 1: Write the failing tests**

`schema.test.ts`: valid input parses; name of spaces only fails; message of 9 chars fails; 5000 `😀` characters passes; `website: 'x'` fails; unknown `type` fails; email `a@b` fails.
`turnstile.test.ts`: with a stub `fetchImpl` returning `{success:true}` → `true`; `{success:false}` → `false`; stub that rejects → throws `TurnstileUnavailable`; stub that never resolves with `timeoutMs: 10` → throws `TurnstileUnavailable`; the request body contains `secret=`, `response=`, `remoteip=`.
`rate-limit.test.ts`: 5 hits allowed, 6th denied with `retryAfterSec > 0`; after `now` advances past the window, allowed again; keys are independent.
`mailer.test.ts`: `renderMailText` output contains every field label and value and escapes nothing (plain text); `subjectFor` format; `createResendMailer` with a mocked `Resend` class (`vi.mock('resend')`) calls `emails.send` with `{ from, to: [to], replyTo: input.email, subject, text }` and throws `MailFailed` when the SDK resolves `{ error }`.
`config.test.ts`: missing `TURNSTILE_SECRET_KEY` throws naming it; `MAIL_TRANSPORT=console` does not require `RESEND_API_KEY`; `resend` does.

- [ ] **Step 2: Run to see them fail**

Run: `cd apps/contact-api && pnpm install && pnpm test`
Expected: FAIL, modules missing.

- [ ] **Step 3: Implement the four modules and config**

Dependencies: `hono`, `@hono/node-server`, `zod`, `resend`. Dev: `vitest`, `typescript`, `tsx`, `@types/node`. Scripts: `dev: tsx watch src/server.ts`, `build: tsc -p tsconfig.json`, `start: node dist/server.js`, `test: vitest run`, `typecheck: tsc --noEmit`, `lint: prettier --check .`.

- [ ] **Step 4: Run tests**

Run: `cd apps/contact-api && pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(api): contact schema, turnstile verifier, rate limiter, mailer"
```

---

### Task 10: Contact API route and server

**Files:**
- Create: `apps/contact-api/src/app.ts`, `src/server.ts`, `src/errors.ts`
- Test: `apps/contact-api/tests/app.test.ts`

**Interfaces:**
```ts
export interface AppDeps { verify: TurnstileVerifier; mail: Mailer; limiter: RateLimiter; config: Pick<Config, 'siteOrigin'>; log?: (event: Record<string, unknown>) => void }
export function createApp(deps: AppDeps): Hono;
```
Behaviour of `POST /api/contact`:
- `bodyLimit` 32 KiB (`hono/body-limit`) → `413`.
- Content type `application/json` → parse JSON; `application/x-www-form-urlencoded` or `multipart/form-data` → `parseBody()`; anything else → `415`.
- Origin check: `Origin` header must equal `config.siteOrigin`; if `Origin` absent, `Referer` must start with it; else `403`. CORS: respond with `Access-Control-Allow-Origin: siteOrigin` and handle `OPTIONS` with `204` (needed when `PUBLIC_CONTACT_ENDPOINT` points to another port in e2e).
- Honeypot filled → respond as success (`200`/`303`) without sending mail, log `{event:'honeypot'}`.
- IP = `CF-Connecting-IP` header, else `undefined`; limiter key = ip ?? `'unknown'`. Denied → `429` with `Retry-After`.
- Validation failure → `400 { ok: false, errors: { field: message } }` (JSON) or `303` to failed page (form).
- Turnstile `false` → `400 { ok:false, errors: { turnstile: 'failed' } }`; `TurnstileUnavailable` → `502`.
- `MailFailed` → `502 { ok:false, error:'mail' }`.
- Success → JSON `200 { ok: true }`; form → `303 Location: ${siteOrigin}${lang === 'en' ? '/en/message-sent/' : '/sprava-odoslana/'}`. Failed-page redirect analogously with `/en/message-failed/` and `/sprava-neodoslana/`.
- Response selection: form-encoded request → redirects; JSON request → JSON.
- `GET /healthz` → `200 ok`.
- Logs: one JSON line per request `{event:'contact', status, type, lang, ip}`; never the message body.
`server.ts`: `loadConfig(process.env)`, wire real deps (`console` mailer when `MAIL_TRANSPORT=console`), `serve({ fetch: app.fetch, port })`.

- [ ] **Step 1: Write the failing route tests**

`app.test.ts` builds `createApp` with stub deps (`verify` → `true`, `mail` → spy, limiter real with `now` stub, `siteOrigin: 'https://brxsolutions.sk'`), using `app.request()`:
- JSON success → `200 {ok:true}`, mail spy called once with `input.name`.
- Form success → `303`, `Location` ends with `/sprava-odoslana/`; with `lang=en` → `/en/message-sent/`.
- Missing `Origin` and `Referer` → `403`. Wrong `Origin` → `403`.
- `Content-Type: text/plain` → `415`.
- Body of 32 KiB + 1 → `413`; message of 5000 `😀` → `200`.
- Honeypot filled → `200`, mail spy not called.
- 6th request from the same `CF-Connecting-IP` → `429` with `Retry-After`.
- `verify` → `false` → `400` with `errors.turnstile`.
- `verify` throws `TurnstileUnavailable` → `502`.
- `mail` throws `MailFailed` → `502 {ok:false,error:'mail'}`.
- Form request with invalid email → `303` to `/sprava-neodoslana/`.
- `OPTIONS /api/contact` with the site origin → `204` and `Access-Control-Allow-Origin`.
- `GET /healthz` → `200`.

- [ ] **Step 2: Run to see them fail**

Run: `cd apps/contact-api && pnpm test tests/app.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `app.ts`, `errors.ts`, `server.ts`**

- [ ] **Step 4: Run tests, typecheck, and a manual round trip**

Run: `cd apps/contact-api && pnpm test && pnpm typecheck`
Expected: PASS.
Run: `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA MAIL_TRANSPORT=console SITE_ORIGIN=http://localhost:4321 CONTACT_TO=peter.beraxa@gmail.com CONTACT_FROM=onboarding@resend.dev pnpm dev` then
```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/api/contact -H 'Origin: http://localhost:4321' -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"t@example.com","type":"ai","message":"Hello from curl, ten+","lang":"sk","cf-turnstile-response":"XXXX.DUMMY.TOKEN.XXXX"}'
```
Expected: `200` and the rendered mail text in the server log.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(api): POST /api/contact with origin check, rate limit, turnstile and mail delivery"
```

---

### Task 11: End-to-end form flow

**Files:**
- Create: `apps/web/e2e/contact.spec.ts`
- Modify: `apps/web/playwright.config.ts` (second `webServer` entry starting the API with console mailer and test Turnstile secret; `PUBLIC_CONTACT_ENDPOINT=http://localhost:3000/api/contact` and `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` for the build)

- [ ] **Step 1: Write the failing e2e test**

`contact.spec.ts`:
- fill the form on `/`, wait for the Turnstile test widget to produce a token (`input[name=cf-turnstile-response]` non-empty), submit, expect `[data-form-status]` to show `contact.form.success` for `sk` and the URL to stay `/`.
- with JavaScript disabled (`javaScriptEnabled: false` context), submit the same form and expect navigation to `/sprava-neodoslana/` (Turnstile token absent → validation fails → failed page). This pins the spec's "readable error, not 500".
- on `/en/`, submit with a 5-character message and expect the native validation to block (button click does not navigate, `:invalid` textarea).

- [ ] **Step 2: Run to see it fail**

Run: `cd apps/web && pnpm e2e e2e/contact.spec.ts`
Expected: FAIL (API not started by the config yet).

- [ ] **Step 3: Wire the API web server into Playwright and fix what the test finds**

- [ ] **Step 4: Run the full suite**

Run: `pnpm -r test && cd apps/web && pnpm e2e`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "test(web): end-to-end contact form flow with console mailer"
```

---

### Task 12: Docker images, Caddy, local compose

**Files:**
- Create: `apps/web/Dockerfile`, `apps/contact-api/Dockerfile`, `infra/Caddyfile`, `infra/docker-compose.yml`, `infra/.env.example`, `.dockerignore`

**Interfaces:**
- Web image: stage 1 `node:22-alpine` with pnpm, `pnpm install --frozen-lockfile --filter web...`, `pnpm --filter web build` with `PUBLIC_*` passed as build args; stage 2 `caddy:2-alpine`, copies `dist` to `/srv` and `infra/Caddyfile` to `/etc/caddy/Caddyfile`.
- API image: stage 1 builds `dist/`; stage 2 `node:22-alpine`, `USER node`, `CMD ["node","dist/server.js"]`, `HEALTHCHECK` on `/healthz`.
- Caddyfile (`:80`, TLS terminates at Cloudflare):
```
:80 {
  root * /srv
  encode zstd gzip
  handle /api/* { reverse_proxy contact-api:3000 }
  handle { file_server }
  header {
    Content-Security-Policy "default-src 'self'; script-src 'self' https://challenges.cloudflare.com {$STATS_ORIGIN}; frame-src https://challenges.cloudflare.com; connect-src 'self' {$STATS_ORIGIN}; img-src 'self' data:; font-src 'self'; style-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options nosniff
    Referrer-Policy strict-origin-when-cross-origin
    Permissions-Policy "camera=(), microphone=(), geolocation=()"
  }
  @assets path /_astro/*
  header @assets Cache-Control "public, max-age=31536000, immutable"
  header /*.html Cache-Control "no-cache"
}
```
- `docker-compose.yml` (plan 1 scope): services `web` (image `ghcr.io/brxsolutions/web:${IMAGE_TAG}`, build context `.`), `contact-api` (image `ghcr.io/brxsolutions/contact-api:${IMAGE_TAG}`, `env_file: .env`), both on one network, `web` publishes `8080:80` for local use only. Plan 2 adds `cloudflared`, `umami`, `umami-db` and removes the published port.
- `infra/.env.example`: `IMAGE_TAG=dev`, `STATS_ORIGIN=https://stats.brxsolutions.sk`, `SITE_ORIGIN=https://brxsolutions.sk`, `CONTACT_TO=peter.beraxa@gmail.com`, `CONTACT_FROM=web@brxsolutions.sk`, `TURNSTILE_SECRET_KEY=`, `RESEND_API_KEY=`, `MAIL_TRANSPORT=resend`.

- [ ] **Step 1: Write the failing check**

Shell check in `infra/smoke.sh`: `docker compose up -d --build`, then `curl -fsS localhost:8080/ | grep -q 'lang="sk"'`, `curl -fsS localhost:8080/en/ | grep -q 'lang="en"'`, `curl -fsS -o /dev/null -w '%{http_code}' -X POST localhost:8080/api/contact -H 'Content-Type: text/plain' -d x | grep -q 415`, `curl -fsSI localhost:8080/ | grep -qi 'content-security-policy'`; exits non-zero on any failure.

- [ ] **Step 2: Run to see it fail**

Run: `cd infra && cp .env.example .env && ./smoke.sh`
Expected: FAIL, no Dockerfiles.

- [ ] **Step 3: Write Dockerfiles, Caddyfile, compose**

- [ ] **Step 4: Run the smoke script and check the CSP in a browser**

Run: `cd infra && ./smoke.sh && echo OK`
Expected: `OK`. Open `http://localhost:8080/` in Chrome DevTools: no CSP violations in the console, Turnstile widget renders with the test sitekey.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "build: docker images for web and contact api, caddy with security headers, local compose"
```

---

### Task 13: CI (build and test only) and README

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `README.md`

- [ ] **Step 1: Workflow**

On `push` and `pull_request`: `actions/setup-node` with `.nvmrc`, `pnpm/action-setup`, `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm -r test` (web unit tests run after `pnpm --filter web build`), Playwright `e2e` with browsers cached, Docker build of both images without push. Image push and deploy belong to the infrastructure plan.

- [ ] **Step 2: README**

Sections: what this is, local dev (`nvm use`, `pnpm install`, `cp apps/web/.env.example apps/web/.env`, `pnpm --filter web dev`, `pnpm --filter contact-api dev` with the env from Task 10 Step 4), editing content (where each text lives, how to add a project: copy an `sk/` and `en/` file, bump `order`), running tests, Docker local run, launch checklist from the spec.

- [ ] **Step 3: Verify the workflow file**

Run: `npx --yes action-validator .github/workflows/ci.yml` (or `actionlint` if installed)
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "ci: build, lint and test workflow; document local development and content editing"
```
