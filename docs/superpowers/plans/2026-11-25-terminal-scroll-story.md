# Terminal Scroll Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a terminal/editor window to the home page that changes its scene with the scroll position, with macOS-style close, minimise and maximise, while the page itself stays as it is.

**Architecture:** Scene data is built at build time from the dictionary, content collections and company config, and shipped as JSON in a `data-terminal` attribute on the window element. Pure TypeScript modules turn scene data plus scroll progress into HTML strings and model the window state; one browser script wires them to scroll, buttons, `<details>` and the contact form. Layout reacts to a `data-term` attribute on `<html>`; the content column is a CSS container so existing grids fold when the window takes space.

**Tech Stack:** Astro 7.4 (static), Tailwind 4.3 container queries, TypeScript, Vitest 5, Playwright 1.64 + axe. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-25-terminal-scroll-story-design.md`

## Global Constraints

- Run everything with Node 24: `export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"` (default shell Node 20 is rejected by Astro). Commands below assume `cd apps/web`.
- Production CSP has no `unsafe-inline`. No inline `<script>` (the only allowed inline type is `application/ld+json`), no `style="…"` attribute anywhere, including HTML strings rendered by the window. `tests/pages.test.ts` and `infra/smoke.sh` enforce this. Computed positions go through the CSSOM (`el.style.setProperty`, Web Animations API).
- No text in components or scripts. Visible strings come from `src/i18n/{sk,en}.ts`, `src/config/company.ts` or `src/content/**`. `sk` and `en` must expose the same key paths (`tests/i18n.test.ts`).
- Only content texts appear in the window. No invented diffs, numbers, uptimes.
- Every value rendered into the window goes through `esc()`. Form input is untrusted.
- Without JavaScript the page is today's page. With `data-term` unset, `closed` or `min`, layout must match today's visual baselines.
- `prefers-reduced-motion: reduce`: no typing, no window animation, scenes complete.
- Desktop/phone split: `1100px`. Window column: `clamp(400px, 40vw, 560px)`, max height `660px`. Phone window height: `40vh`.
- localStorage key: `brx-term`; stored values `open | min | closed`. `max` is never stored. All access in `try/catch`.
- Section anchors and existing texts do not change.
- Commits only when the owner asks; work on branch `feat/terminal-scroll-story`. Conventional Commits, trailer `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.

## Review Focus

1. Form values containing `<`, `&`, `"` or a `</pre><img onerror>` payload must appear as text in the contact scene, never as markup (Task 2).
2. `localStorage` throwing (private mode, blocked site data) must leave the window open and working, not break the page (Tasks 3, 6).
3. A stored value that is not `open | min | closed` (old key, tampering) must fall back to `open` (Task 3).
4. With the window open at 1100–1280 px, no horizontal overflow and no card narrower than its content (Task 5, e2e in Task 8).
5. Hiding or showing the window on a phone mid-page must not move the content the visitor is reading by more than a few pixels (Task 6, e2e in Task 8).

## File Structure

| File | Responsibility |
| --- | --- |
| `src/terminal/types.ts` | `TerminalData` and scene types shared by server and browser |
| `src/terminal/data.ts` | `buildTerminalData(locale)`: content → `TerminalData` (build time) |
| `src/terminal/render.ts` | Pure: data + progress → `{ file, stat, html }` |
| `src/terminal/state.ts` | Pure: window mode transitions, storage parse/serialise |
| `src/components/Terminal.astro` | Window shell, dock button, `data-terminal` JSON |
| `src/scripts/terminal.ts` | Browser wiring: scroll, buttons, details, form, animations |
| `public/terminal-boot.js` | Render-blocking: copies stored mode to `<html data-term>` |
| `src/styles/terminal.css` | Window, dock, layout-shell and syntax-colour rules (imported from `global.css`) |
| `src/i18n/dictionary.ts`, `sk.ts`, `en.ts` | New `terminal` block: labels and status texts |
| Existing section components | `data-scene`, `data-scene-item`, container-query breakpoints |

---

### Task 1: Dictionary block and scene data

**Files:**
- Modify: `src/i18n/dictionary.ts`, `src/i18n/sk.ts`, `src/i18n/en.ts`
- Create: `src/terminal/types.ts`, `src/terminal/data.ts`
- Test: `tests/terminal-data.test.ts`

**Interfaces:**
- Produces:

```ts
// dictionary.ts
terminal: {
  aside: string;            // aria-label of the window
  close: string; minimize: string; maximize: string; restore: string;
  dock: string;             // aria-label of the dock button
  dockClosed: string;       // prefix shown in dock when closed, e.g. 'otvoriť'
  prev: string; next: string; detail: string; closeDetail: string; showForm: string;
  hint: string;             // caption subtitle when no item is active
  foldHint: string;         // comment in stack.ts, e.g. 'klikni na riadok'
  done: Record<SceneId, string>;   // closing line / status per scene
};

// types.ts
export type SceneId = 'profile' | 'stats' | 'services' | 'stack' | 'experience'
  | 'projects' | 'own' | 'process' | 'strengths' | 'contact';
export const SCENE_IDS: readonly SceneId[];   // in page order, length 10
export interface TerminalData {
  labels: Dictionary['terminal'];
  profile: { name: string; company: string; focus: string[]; stack: string[]; since: number; remote: boolean };
  stats: string[];                                   // `${value} ${label}`
  services: { ident: string; path: string; dir: string; title: string }[];
  stack: { name: string; items: string[] }[];
  commits: { hash: string; year: string; message: string }[];
  tests: { slug: string; metric: string; label: string;
           detail: { heading: string; text: string }[] }[];   // problem, solution, result, lesson
  containers: { slug: string; status: string; tags: string[];
                detail: { title: string; tech: string } }[];
  jobs: { id: string; title: string; desc: string }[];
  strengths: string[];
  contact: { path: string; fields: { name: string; email: string; type: string; message: string } };
}
// data.ts
export async function buildTerminalData(locale: Locale): Promise<TerminalData>;
export function hashOf(id: string): string;   // 7 lowercase hex chars, deterministic
```

- Fixed maps in `data.ts`: service icon → `{ ident, dir }`: featured `llmSystems`/`ai`, `api` → `restApi`/`backend`, `data` → `pipeline`/`pipelines`, `legacy` → `legacyAudit`/`legacy`, `web` → `webApp`/`web`. Job ids by index: `brief`, `design`, `build`, `deploy`; further steps `step-N`.
- `commits[i].year` = first four-digit number in `period`; `message` = `feat: ${role} · ${client}`. `tests[i].slug` / `containers[i].slug` = entry id without the locale prefix. Detail headings for tests reuse existing dictionary strings where they exist (`projects.more`, `projects.lesson`); `problem` and `result` headings are added to `terminal` only if no existing string fits — if added, extend the interface above and say so in the ledger.
- `contact.path` = pathname of `PUBLIC_CONTACT_ENDPOINT`, fallback `/api/contact`.

- [ ] **Step 1: Write the failing tests** in `tests/terminal-data.test.ts`

```ts
for (const locale of ['sk', 'en'] as const) {
  it(`${locale}: builds all ten scenes from content`, async () => {
    const d = await buildTerminalData(locale);
    expect(d.profile.name).toBe(company.founder);
    expect(d.stats).toHaveLength(4);
    expect(d.services).toHaveLength(1 + t(locale).services.items.length);
    expect(d.stack.map((g) => g.name)).toEqual(t(locale).stack.groups.map((g) => g.name));
    expect(d.commits).toHaveLength(5);
    expect(d.tests.map((x) => x.slug)).toEqual(['blick', 'proteus', 'football', 'rpd']);
    expect(d.tests[0]!.detail).toHaveLength(4);
    expect(d.containers).toHaveLength(3);
    expect(d.jobs.map((j) => j.id)).toEqual(['brief', 'design', 'build', 'deploy']);
    expect(d.strengths).toHaveLength(t(locale).strengths.items.length);
  });
}
it('commit hashes are stable 7-char hex', () => {
  expect(hashOf('sk/frinx')).toMatch(/^[0-9a-f]{7}$/);
  expect(hashOf('sk/frinx')).toBe(hashOf('sk/frinx'));
  expect(hashOf('sk/frinx')).not.toBe(hashOf('sk/media-ai'));
});
it('commits are oldest first and carry the start year', async () => {
  const d = await buildTerminalData('sk');
  expect(d.commits[0]!.year).toBe('2017');
  expect(d.commits.map((c) => c.year)).toEqual([...d.commits.map((c) => c.year)].sort());
});
it('window data contains no bracket placeholders or markup', async () => {
  const json = JSON.stringify(await buildTerminalData('en'));
  expect(json).not.toMatch(/<[a-z]/i);
});
```

The expected slug order must match the `order` field of the project files; read them and correct the literal if it differs.

- [ ] **Step 2: Run** `pnpm test tests/terminal-data.test.ts` — Expected: FAIL, cannot resolve `../src/terminal/data`.
- [ ] **Step 3: Add the `terminal` block** to `Dictionary`, `sk.ts`, `en.ts` (labels in the locale's language; `done` values short, e.g. `'4 passed, 0 failed'`).
- [ ] **Step 4: Implement `types.ts` and `data.ts`** using `t()`, `localized()` and `company`. Experience is sorted oldest first for the commit list (reverse of the page order if the page shows newest first — check `order`).
- [ ] **Step 5: Run** `pnpm test` — Expected: all files pass, including `tests/i18n.test.ts` key-path parity.

---

### Task 2: Pure renderers

**Files:**
- Create: `src/terminal/render.ts`
- Test: `tests/terminal-render.test.ts`

**Interfaces:**
- Consumes: `TerminalData`, `SceneId`, `SCENE_IDS` from Task 1.
- Produces:

```ts
export function esc(s: string): string;                 // & < > " '
export function revealCount(progress: number, n: number): number; // min(n, floor(progress * 1.3 * (n + 1)))
export interface RenderCtx {
  progress: number;          // 0..1 within the section
  typedChars: number;        // hero typing; Infinity = complete
  openFold: string | null;   // stack group name unfolded
  form: { name: string; email: string; type: string; message: string };
  sent: boolean;
  detail: { slug: string; lines: number } | null;   // lines revealed so far
}
export interface Rendered { file: string; stat: string; html: string; revealed: number; total: number }
export function renderScene(data: TerminalData, scene: SceneId, ctx: RenderCtx): Rendered;
export function sceneItemCount(data: TerminalData, scene: SceneId): number;
```

- Output rules: one `<pre>` per scene (services adds a file-tree `<div class="term-tree">` before it; process renders `<div class="term-ci">` with one `.term-job` per job, classes `ok | run | wait`). Colours are classes only: `tk-k` keyword, `tk-s` string, `tk-n` number, `tk-c` comment, `tk-g` ok, `tk-w` warn, `tk-p` dim, `tk-h` bright. Cursor is `<span class="term-cur"></span>`, present while `revealed < total` and on the contact scene until `sent`.
- Scene content (texts from `data` only):
  - `profile`: `const engineer = { name, company, focus, stack, since, remote };`, cut at `typedChars`.
  - `stats`: the complete profile object plus a `stats: [ … ]` block, one string per revealed stat. File stays `profile.ts`.
  - `services`: `import { ident } from "./dir"; // title` per revealed service; after the last, `export const services = [ … ];`.
  - `stack`: `stack.ts`; one `<button type="button" class="term-fold" data-fold="NAME" aria-expanded>` row per revealed group, unfolded group lists its items.
  - `experience`: prompt `git log --oneline --reverse`, then `hash year message`; newest revealed line bright.
  - `projects`: prompt `pytest cases/ -v`, then `cases/test_slug PASSED` and `metric · label`. With `ctx.detail` for a project slug: file `cases/slug.md`, prompt `cat cases/slug.md`, then heading and text lines, `ctx.detail.lines` of them.
  - `own`: prompt `docker ps`, header row, then `slug status tags`. With `ctx.detail` for an own slug: prompt `docker inspect slug`, JSON-style `Title`, `Status`, `Tech`, `Tags`.
  - `process`: jobs; index `< revealed` is `ok`, `== revealed` is `run`, rest `wait`.
  - `strengths`: `STRENGTHS.md`, `- [x] title` per revealed strength.
  - `contact`: `POST path HTTP/1.1`, `Content-Type: application/json`, JSON body with `name`, `email`, `type`, `message` (message cut to 120 chars); when `sent`, a `201 Created` line.
- `stat` = `data.labels.done[scene]` when complete, otherwise `revealed / total`.

- [ ] **Step 1: Write the failing tests**

```ts
it('esc neutralises markup characters', () => {
  expect(esc(`<img src=x onerror="a('b')">&`)).toBe('&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
});
it('revealCount starts at 0, reaches n before the section ends, never exceeds n', () => {
  expect(revealCount(0, 5)).toBe(0);
  expect(revealCount(0.8, 5)).toBe(5);
  expect(revealCount(1, 5)).toBe(5);
  expect(revealCount(0.2, 5)).toBe(1);
});
it('every scene renders in both locales with a file name and no style attribute', async () => {
  for (const locale of ['sk', 'en'] as const) {
    const data = await buildTerminalData(locale);
    for (const scene of SCENE_IDS) {
      const r = renderScene(data, scene, full);
      expect(r.file.length).toBeGreaterThan(0);
      expect(r.html).not.toMatch(/\sstyle=|<script/i);
      expect(r.revealed).toBe(r.total);
    }
  }
});
it('contact scene shows form input as text', async () => {
  const r = renderScene(data, 'contact', { ...full, form: { ...empty, message: '</pre><img src=x onerror=alert(1)>' } });
  expect(r.html).not.toContain('<img');
  expect(r.html).toContain('&lt;/pre&gt;&lt;img');
});
it('contact message is cut to 120 characters', …);          // 200 × 'a' → exactly 120 in html
it('contact shows 201 only after sent', …);
it('projects scene reveals one test per step and names content metrics', …); // progress 0 → 0 PASSED; full → 4 PASSED, contains data.tests[0].metric
it('project detail shows only content texts, line by line', …); // detail {slug:'blick', lines:2} → revealed 2; lines Infinity → contains escaped data.tests[0].detail[1].text
it('stack scene unfolds only the open group', …);          // openFold = first group → its items present, other groups' items absent
it('process marks done, running and waiting jobs', …);     // progress mid → one .term-job.run
it('profile typing cuts the text and keeps the cursor', …); // typedChars 10 → html text length 10 + cursor
```

`full` = `{ progress: 1, typedChars: Infinity, openFold: null, form: empty, sent: false, detail: null }`.

- [ ] **Step 2: Run** `pnpm test tests/terminal-render.test.ts` — Expected: FAIL, module not found.
- [ ] **Step 3: Implement `render.ts`** to the interface and output rules above.
- [ ] **Step 4: Run** `pnpm test` — Expected: PASS, all files.

---

### Task 3: Window state

**Files:**
- Create: `src/terminal/state.ts`
- Test: `tests/terminal-state.test.ts`

**Interfaces:**
- Produces:

```ts
export type Mode = 'open' | 'min' | 'closed' | 'max';
export type Action = 'close' | 'minimize' | 'toggleMax' | 'restore' | 'escape';
export const STORAGE_KEY = 'brx-term';
export function transition(mode: Mode, action: Action): Mode;
export function parseStored(raw: string | null): Exclude<Mode, 'max'>;  // anything unknown → 'open'
export function toStore(mode: Mode): Exclude<Mode, 'max'>;              // 'max' → 'open'
export function loadMode(storage: Pick<Storage, 'getItem'> | null): Exclude<Mode, 'max'>;  // never throws
export function saveMode(storage: Pick<Storage, 'setItem'> | null, mode: Mode): void;      // never throws
```

- [ ] **Step 1: Write the failing tests**

```ts
it.each([
  ['open', 'close', 'closed'], ['open', 'minimize', 'min'], ['open', 'toggleMax', 'max'],
  ['max', 'toggleMax', 'open'], ['max', 'escape', 'open'], ['max', 'close', 'closed'],
  ['max', 'minimize', 'min'], ['min', 'restore', 'open'], ['closed', 'restore', 'open'],
  ['open', 'escape', 'open'], ['min', 'escape', 'min'],
])('%s + %s → %s', (m, a, expected) => expect(transition(m, a)).toBe(expected));
it('unknown stored values fall back to open', () => {
  for (const raw of [null, '', 'max', 'OPEN', '{"a":1}']) expect(parseStored(raw)).toBe('open');
});
it('max is stored as open', () => expect(toStore('max')).toBe('open'));
it('storage that throws is ignored', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  expect(loadMode(broken)).toBe('open');
  expect(() => saveMode(broken, 'min')).not.toThrow();
  expect(loadMode(null)).toBe('open');
});
```

- [ ] **Step 2: Run** `pnpm test tests/terminal-state.test.ts` — Expected: FAIL, module not found.
- [ ] **Step 3: Implement `state.ts`.**
- [ ] **Step 4: Run** `pnpm test` — Expected: PASS.

---

### Task 4: Window component and scene markers

**Files:**
- Create: `src/components/Terminal.astro`, `src/styles/terminal.css`, `public/terminal-boot.js`
- Modify: `src/components/Home.astro`, `src/layouts/Base.astro`, `src/styles/global.css` (one `@import`), `Hero`, `Stats`, `Services`, `Stack`, `Experience`, `Projects`, `Own`, `Process`, `Strengths`, `Contact` (`.astro`), `src/components/Section.astro` (pass-through `scene` prop)
- Test: `tests/components/terminal.test.ts`, additions to `tests/components/sections.test.ts`, `tests/layout.test.ts`

**Interfaces:**
- Consumes: `buildTerminalData`, `SCENE_IDS`.
- Produces (DOM contract used by Tasks 5–7):
  - `<div data-term-shell>` wraps `<main data-term-content>` and `<Terminal>`; footer stays outside.
  - `<aside data-term-window data-terminal="{json}" aria-label hidden>` with: `[data-term-close]`, `[data-term-min]`, `[data-term-max]` (buttons, labelled), `[data-term-file]`, `[data-term-count]`, `[data-term-body]`, caption bar `[data-term-cap]` holding `[data-term-prev]`, `[data-term-title]`, `[data-term-sub]`, `[data-term-detail]`, `[data-term-next]`, and `[data-term-stat]`.
  - `<button data-term-dock hidden>` with `[data-term-dock-label]`.
  - Each home section root carries `data-scene="<SceneId>"`; each repeated card or row carries `data-scene-item` (project and own cards: `data-scene-item="<slug>"`). The hero's static code card carries `data-hero-code`.
  - `Base.astro` head gets `<script is:inline src="/terminal-boot.js"></script>` only when a new boolean prop `terminal` is true; `Home` pages pass it.
  - `public/terminal-boot.js`: reads `localStorage['brx-term']` in `try/catch`, sets `document.documentElement.dataset.term` to `open | min | closed` (unknown → `open`). Plain script, no modules.
- The window and dock are rendered `hidden`; `terminal.css` shows them from `html[data-term]` state, so no-JS output shows neither.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/components/terminal.test.ts
it('renders a hidden window with labelled controls and scene data', async () => {
  const html = await renderToHtml(Terminal, { locale: 'sk' });
  expect(html).toMatch(/<aside[^>]*data-term-window[^>]*hidden/);
  for (const hook of ['data-term-close', 'data-term-min', 'data-term-max', 'data-term-body', 'data-term-dock'])
    expect(html).toContain(hook);
  expect(count(html, /<button[^>]*aria-label="[^"]+"/g)).toBeGreaterThanOrEqual(4);
  const json = /data-terminal="([^"]*)"/.exec(html)![1]!;
  const data = JSON.parse(decodeHtml(json));
  expect(data.tests).toHaveLength(4);
  expect(html).not.toContain('style=');
});
it('uses the locale for labels', …);   // en label text differs from sk
// tests/components/sections.test.ts
it('home marks ten scenes in page order', async () => {
  const html = await renderToHtml(Home, { locale: 'sk' });
  expect([...html.matchAll(/data-scene="([a-z]+)"/g)].map((m) => m[1])).toEqual([...SCENE_IDS]);
});
it('project and own cards expose their slug for the detail view', …); // data-scene-item="blick" present, 4 + 3 slugs
it('hero keeps the static profile card for visitors without JavaScript', …); // data-hero-code present
// tests/layout.test.ts
it('loads the boot script only when the terminal is enabled', …); // without prop: no terminal-boot.js; with: src="/terminal-boot.js"
```

- [ ] **Step 2: Run** `pnpm test` — Expected: the new tests FAIL (Terminal.astro missing, no `data-scene`).
- [ ] **Step 3: Implement** component, markers, boot script and the CSS for the window itself (bar, dots, body, status, caption, dock, token colours, cursor blink, job spinner; reduced-motion disables both animations). Colours from the theme tokens in `global.css`.
- [ ] **Step 4: Run** `pnpm test` — Expected: PASS. Then `pnpm build && pnpm test tests/pages.test.ts` — Expected: PASS (no inline scripts or styles in `dist`).

---

### Task 5: Layout with the window open

**Files:**
- Modify: `src/styles/terminal.css`, `src/components/Home.astro`, section components listed in Task 4, `src/components/ContactForm.astro`, `e2e/visual.spec.ts`
- Test: `e2e/visual.spec.ts` (existing baselines), `tests/components/sections.test.ts`

**Interfaces:**
- Consumes: DOM contract from Task 4.
- Produces (CSS contract used by Task 6):
  - `html[data-term='open']`, viewport ≥ 1100px: `[data-term-shell]` is a two-column grid `minmax(0,1fr) clamp(400px,40vw,560px)`; window is `position: sticky`, top `calc(var(--term-header, 72px) + 12px)`, height `min(660px, 100vh − header − 24px)`.
  - `html[data-term='open']`, viewport < 1100px: window `position: fixed` under the header, full width, `height: 40vh`; `[data-term-content]` gets `padding-top: 40vh`; file tree hidden.
  - `html[data-term='max']`: window `position: fixed; inset: 0`, above the header; caption bar visible.
  - `html[data-term='min'], html[data-term='closed']`: window hidden, dock visible.
  - `html[data-term='open'] [data-hero-code]`, `html[data-term='max'] [data-hero-code]`: hidden.
  - `.term-active` on a `[data-scene-item]` that has a border: accent border colour, only under `html[data-term='open']`.
  - `<main data-term-content>` has class `@container`. Inside home sections, layout breakpoints change `md:` → `@3xl:` and `lg:` → `@5xl:` (same pixel values: 768 and 1024). `sm:` utilities inside `<main>`, if any, → `@2xl:` only where they affect layout; note each in the ledger. `Header`, `Footer`, `LegalPage`, `StatusPage` keep viewport breakpoints. `Section.astro` is used only by home sections (verify with `rg "import Section"`).

- [ ] **Step 1: Pin the closed state in the existing visual tests.** In `e2e/visual.spec.ts`, before `page.goto` in the three existing tests, add `await page.addInitScript(() => localStorage.setItem('brx-term', 'closed'));`. Add a unit test: `Home` html contains no `md:` or `lg:` utility inside `<main …>…</main>`.
- [ ] **Step 2: Run** `pnpm test` — Expected: the new unit test FAILS (sections still use `md:`). Run `pnpm e2e e2e/visual.spec.ts` — Expected: PASS against the existing darwin baselines except the RAG card headline changed on 2026-11-25; if the only diff is that card, re-record darwin baselines now (`--update-snapshots`) and note it in the ledger, so the next run is a clean reference.
- [ ] **Step 3: Switch breakpoints to container variants and add the layout CSS** above.
- [ ] **Step 4: Run** `pnpm test` — Expected: PASS. Run `pnpm e2e e2e/visual.spec.ts` — Expected: PASS with no baseline update. A diff here means the container switch changed today's layout; fix the classes, do not update the snapshot.

---

### Task 6: Browser controller

**Files:**
- Create: `src/scripts/terminal.ts`
- Modify: `src/components/Terminal.astro` (add `<script src="../scripts/terminal.ts"></script>`), `src/scripts/contact-form.ts` (one line)
- Test: `e2e/terminal.spec.ts`

**Interfaces:**
- Consumes: `renderScene`, `sceneItemCount`, `transition`, `loadMode`, `saveMode`, DOM and CSS contracts.
- Produces: `contact-form.ts` dispatches `form.dispatchEvent(new CustomEvent('contact:sent', { bubbles: true }))` right after the success message is shown and before `form.reset()`.
- Behaviour:
  - Start: mode from `loadMode`, written to `<html data-term>`; window and dock lose `hidden`. Hero typing runs once (3 chars per 28 ms) unless reduced motion.
  - Scroll and resize schedule one `requestAnimationFrame`; no permanent loop. Active section = last `[data-scene]` whose top is above the anchor line (`0.55 × innerHeight`; `0.72` on phone with the window open). Body `innerHTML` is replaced only when the rendered string changes.
  - `.term-active` goes to item `revealed − 1` of the active section.
  - Buttons call `transition`; the result is saved with `saveMode` and written to `<html data-term>`. Minimise animates the window towards the dock (420 ms), close fades (180 ms), maximise uses a FLIP transform (320 ms), all through `element.animate`; skipped under reduced motion.
  - Phone: when the mode changes between `open` and hidden, `scrollBy` compensates for the `40vh` padding change.
  - `--term-header` is kept equal to the header's height with a `ResizeObserver` and `style.setProperty` on `<html>`.
  - A capture-phase `toggle` listener on `document` tracks `<details>` inside `[data-scene-item]`: opening sets the detail to that slug and starts a 170 ms line reveal; closing clears it. The detail view shows only while its section is active.
  - Click on `[data-fold]` in the body toggles the open stack group.
  - `input` on `[data-contact-form]` re-renders the contact scene and clears `sent`; `contact:sent` sets `sent`.
  - Maximised: caption title = active section heading; subtitle = active item heading or `labels.hint`; previous/next scroll to neighbouring sections; detail button toggles the active card's `<details>` (hidden when the section has none); on the contact scene it is labelled `labels.showForm` and leaves maximised. `Escape` leaves maximised. Focus moves to the green button on entering and stays within the window (Tab wraps) until leaving.
  - Dock label = current file name, prefixed with `labels.dockClosed · ` when closed.

- [ ] **Step 1: Write the failing e2e tests** in `e2e/terminal.spec.ts` (both projects unless noted)

```ts
test('first visit shows the window on profile.ts and hides the static hero card', …);
test('scrolling to case studies switches the window to pytest', …);      // locator('#projekty').scrollIntoViewIfNeeded(); file text contains 'pytest'
test('yellow minimises to the dock and the dock restores', …);           // html[data-term] 'min' → click dock → 'open'
test('red closes; the page then matches the no-window layout', …);       // data-term 'closed', [data-hero-code] visible
test('state survives a reload', …);                                      // min → reload → still min, dock visible
test('green maximises, Escape returns', …);                              // window bounding box equals viewport; Escape → 'open'
test('maximised is not remembered', …);                                  // max → reload → 'open'
test('opening a case study detail shows cat cases/blick.md with content text', …);
test('typing in the form appears in the request body as text', …);       // fill message with '<b>x</b>' → body text contains '<b>x</b>', body has no <b> element
test('successful submit shows 201 Created', …);                          // reuse the flow from e2e/contact.spec.ts
test('works when localStorage is blocked', …);                           // addInitScript: Object.defineProperty(window,'localStorage',{get(){throw new Error('denied')}}) → window visible, buttons work
test('reduced motion shows complete scenes without a typing delay', …);  // emulateMedia({ reducedMotion: 'reduce' })
test('hiding the window on a phone keeps the reading position', …);      // mobile only: heading top before/after within 4 px
```

- [ ] **Step 2: Run** `pnpm e2e e2e/terminal.spec.ts` — Expected: FAIL (window stays hidden, no controller).
- [ ] **Step 3: Implement `terminal.ts`** and the one-line change in `contact-form.ts`.
- [ ] **Step 4: Run** `pnpm e2e e2e/terminal.spec.ts` — Expected: PASS on desktop and mobile. Run `pnpm test` — Expected: PASS.

---

### Task 7: Accessibility, overflow and baselines with the window open

**Files:**
- Modify: `e2e/visual.spec.ts`, `e2e/navigation.spec.ts` and `e2e/contact.spec.ts` only if the open window breaks them
- Test: `e2e/visual.spec.ts`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Add tests** to `e2e/visual.spec.ts` for the default (open) state, for `/` and `/en/`:

```ts
test(`${path} with the window open has no horizontal overflow`, …);          // at the top and after scrolling to each [data-scene]
test(`${path} with the window open has no serious accessibility violations`, …); // open and maximised
test(`${path} window open matches the visual baseline`, …);                  // reducedMotion 'reduce', viewport screenshot at top and at #projekty, not fullPage
test('desktop 1100 and 1280 wide: no overflow with the window open', …);      // desktop project only
```

- [ ] **Step 2: Run** `pnpm e2e` — Expected: overflow and axe tests PASS or point at real defects; visual tests FAIL with "snapshot doesn't exist". Fix defects in CSS or markup, not in the tests.
- [ ] **Step 3: Record the new darwin baselines** with `pnpm e2e --update-snapshots` and look at each new PNG (read the files) before accepting it. Linux baselines are produced with the docker command in `README.md` ("Visual baselines"); run it, and if docker is unavailable, say so in the ledger and the final message — CI will fail on the missing linux files until they exist.
- [ ] **Step 4: Run** the full verification: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e` — Expected: all green. `bash ../../infra/smoke.sh` is for the deployed site; do not run it here.
- [ ] **Step 5: Update `README.md`** only if a command or the baseline procedure changed.
