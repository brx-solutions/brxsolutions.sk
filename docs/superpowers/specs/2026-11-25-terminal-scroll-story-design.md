# Terminal scroll story — design

Date: 2026-11-25
Status: approved by owner 2026-11-25
Owner: Peter Beraxa (BRX Solutions s.r.o.)
Prototype: `~/Downloads/BRX Solutions – scroll story (prototyp).html` (behaviour
reference only; its texts are invented and must not be copied)

## 1. Intent

The home page gets a terminal/editor window that follows the visitor down the
page. Each section of the page has a matching "scene" in the window: the same
content, shown the way a developer would see it (`profile.ts`, imports,
`git log`, `pytest`, `docker ps`, a CI pipeline, an HTTP request). The scene
builds up as the visitor scrolls through the section.

The window is an addition. The page itself keeps its sections, texts, order and
look. With the window closed, the page looks the way it does today.

Why: the site is the owner's sales front and also a demonstration of his work.
The window shows the same facts in the visitor's own working language and makes
the page memorable, without replacing the readable page a non-technical
visitor needs.

## 2. Goals, non-goals, anti-goals

Goals

- A window that changes its scene with the scroll position, in SK and EN.
- Three macOS-style buttons, top left: close (red), minimise (yellow),
  maximise (green). They behave as on a Mac.
- All scene text comes from the existing content: `src/i18n/{sk,en}.ts`,
  the `experience`, `projects` and `own` collections, `config/company.ts`.
  Editing a case study or a job still means editing one content file.
- With the window open, the page next to it still reads well.

Non-goals

- No change to page texts, section order, navigation or the contact API.
- No correction of claims in the content beyond the one change agreed with
  this design: the RAG case study headline is now `Záchrana RAG` / `RAG rescue`
  instead of `3.5 min → 20 s`. The window shows whatever the content says.
- No UI framework. The site stays Astro with small TypeScript scripts.

Anti-goals

- Invented technical detail in the window (fake diffs, fake benchmark numbers,
  fake uptimes). A technical reader will ask about it in an interview.
- A page that is worse without JavaScript, with reduced motion, or on a phone
  than it is today.

## 3. Approaches

1. **Sticky column beside the content (chosen by owner).** On desktop the
   window takes the right part of the viewport and stays in place; the content
   column narrows and its card grids fold to fewer columns. Closing or
   minimising gives the content its full width back. Large window, readable
   code, small layout changes.
2. Floating window over an unchanged full-width page. The page needs no layout
   change, but the window must be small or it covers content, and code in a
   small window is hard to read.
3. Rebuild the sections as narrow lists, as in the prototype. Best fit for the
   window, but it replaces the page design the owner wants to keep.

## 4. Behaviour

### 4.1 Window states

| State | What the visitor sees |
| --- | --- |
| open | Window beside the content (desktop) or pinned under the header (phone). |
| minimised | Window animates into a dock button, bottom right. Dock shows the current file name. Click restores. |
| closed | Window fades out. Same dock button, labelled "open · file name". Click restores. |
| maximised | Window covers the viewport. A caption bar appears with: previous section, section title and active item, "Detail", next section. `Esc` or the green button returns to open. |

- Open, minimised and closed are remembered in `localStorage` (read and write
  wrapped in `try/catch`). Maximised is never remembered.
- First visit: open.
- Scrolling keeps driving the scene in every state; the dock label follows it.
- Without JavaScript the window does not exist and the page is today's page,
  including the static `profile.ts` card in the hero.
- With JavaScript and the window open, the static hero card is hidden, because
  the window shows the same file. With the window minimised or closed, the
  hero card is back.
- `prefers-reduced-motion`: no typing, no window animations, scenes are shown
  complete.

### 4.2 Layout

- Desktop (viewport ≥ 1100 px), window open: two columns. The window column is
  `clamp(400px, 40vw, 560px)` wide, sticky under the header, height
  `100vh − header − margins`, max 660 px. The content column takes the rest.
- The content column becomes a CSS container. Layout breakpoints inside it
  (card grids, section padding) switch from viewport breakpoints to container
  breakpoints of the same pixel value. Result: with the window away, the layout
  is pixel-identical to today; with the window open, grids fold on their own.
  This is the only change to existing section components.
- Section backgrounds and borders span the content column only while the
  window is open.
- Below 1100 px, window open: the window is pinned under the header, full
  width, about 40 % of the viewport height, file tree hidden. Content scrolls
  under it. Hiding or showing the window corrects the scroll position so the
  content does not jump.

### 4.3 Scenes

One scene per page section. `n` items are revealed as the visitor scrolls
through the section; the last line gets a blinking cursor until the scene is
complete. The window title bar shows the file name and `x / 10`; the status bar
shows a short summary.

| # | Section | Window | Source of text |
| --- | --- | --- | --- |
| 1 | Hero | `profile.ts`, typed out on load | `company`, `hero.code` |
| 2 | Stats | `profile.ts` continues with a `stats` block | `stats` |
| 3 | Services | `services.ts`: one `import` per service, file tree lights up | `services.featured`, `services.items` |
| 4 | Stack | `stack.ts`: one foldable row per group; click a row to unfold its items | `stack.groups` |
| 5 | Experience | `git log --oneline --reverse`: one commit per job | `experience` collection: `period`, `role`, `client` |
| 6 | Case studies | `pytest cases/ -v`: one test per project, `PASSED`, metric underneath | `projects`: slug, `metric`, `metricLabel` |
| 7 | Own projects | `docker ps`: one row per project | `own`: slug, `status`, `tags` |
| 8 | How I work | CI pipeline: one job per step, spinner then tick | `process.steps` |
| 9 | Why me | `STRENGTHS.md`: a checklist, one ticked line per strength | `strengths.items` |
| 10 | Contact | `POST /api/contact`: request body mirrors the form as the visitor types | form fields, read in the browser |

Details:

- Commit hashes are decoration: seven hex characters derived from the entry id,
  stable between builds.
- Case study and own-project "Show more" (`<details>`) drive a detail view.
  Opening one switches the window to `cat cases/<slug>.md` (problem, solution,
  result, lesson) or `docker inspect <slug>` (title, status, tech, tags),
  revealed line by line. Closing it returns to the section scene. Only texts
  from the content files appear.
- The page card that matches the newest line in the window gets an accent
  border while the window is open. No dimming of other cards.
- Contact scene: name, e-mail, type and the first 120 characters of the message
  are shown locally and never sent anywhere by the window. Values are
  HTML-escaped before rendering. The honeypot and Turnstile fields are not
  shown. After the existing script reports success, the scene shows
  `201 Created`.
- Maximised caption "Detail" opens the active card's details; on the contact
  scene it leaves maximised mode so the form is reachable.

## 5. How it is built (author's calls)

- `Terminal.astro` renders the window shell, the dock button and one
  `<script type="application/json">` with the scene data for the current
  locale, built at build time from the dictionary and collections.
- Sections get a `data-scene` attribute; cards get `data-scene-item`.
- `src/scripts/terminal/`:
  - `render.ts`: pure functions, scene data + progress → HTML string. All data
    goes through one escape function.
  - `scroll.ts`: finds the active section and progress. Runs on scroll and
    resize through `requestAnimationFrame`, not in a permanent loop.
  - `window.ts`: state machine for open / minimised / closed / maximised,
    animations, persistence, keyboard.
- A small external, render-blocking script in `<head>` sets the stored state
  on `<html>` before first paint, so the layout does not flash.
- Production CSP has no `unsafe-inline`: no inline scripts and no `style=`
  attributes, including in HTML the window renders. Colours and sizes are
  classes; positions that must be computed are set through the CSSOM.
- Accessibility: the three buttons and the dock are real buttons with labels in
  both languages; the window is a labelled `aside`; focus is kept inside while
  maximised; no `aria-live`, because the window repeats content already on the
  page.

## 6. Tests

- Vitest: render functions (reveal counts, escaping of form input, both
  locales produce all ten scenes), state machine transitions, scene data built
  from content.
- Playwright: scrolling changes the file name; each button does its job and
  the dock restores; state survives reload; `Esc` leaves maximised; no
  horizontal overflow and no serious axe violations with the window open, at
  desktop and phone size.
- Visual: with the window closed, the existing baselines must still pass
  before anything is re-recorded. New baselines are added for the open state.

## 7. Left to the builder

- Exact animation timings and easing.
- Wording of the short status-bar summaries and button labels (SK and EN),
  added to the dictionary.
- Syntax-colour classes, reusing the theme tokens.
