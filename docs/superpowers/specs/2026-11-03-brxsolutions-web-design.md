# brxsolutions.sk — company website design

Date: 2026-11-03
Status: draft, awaiting owner approval
Owner: Peter Beraxa (BRX Solutions s.r.o.)

## 1. Intent

A one-page company website for BRX Solutions s.r.o., a one-person back-end and
AI engineering company. The page is the owner's sales front: it presents
services, experience, case studies, own projects, and a contact form. It must
exist in Slovak and English.

The owner is a developer. He will edit the site himself, a few times a year:
update the CV timeline, add a case study or an own project, change a number in
the stats strip. Those edits must not require touching component code.

The site also serves as a demonstration: the footer states that the owner
designed, built, and runs the site himself, end to end, on his own
infrastructure, with the help of AI agents. The build quality is part of the
message.

## 2. Goals, non-goals, anti-goals

Goals

- Faithful implementation of the approved mockup
  (`Desktop – 1440` export, `Main.dc.html`), including every design value in
  its inline styles, on desktop and on phones.
- Two languages, SK and EN, with full parity enforced at build time.
- All copy and list content lives in content files, not in components.
- A working contact form that delivers email to the owner, protected against
  spam.
- Cookieless, self-hosted analytics (Umami).
- Legally complete for a Slovak s.r.o.: company identification in the footer,
  a privacy policy page, a consent note on the form.
- Self-hosted on the owner's Proxmox server, published through a Cloudflare
  Tunnel. No inbound ports on the home network.
- Lighthouse 95+ on performance, accessibility, best practices, SEO on the
  production URL.

Non-goals (now)

- No CMS, no admin UI, no database for site content.
- No blog.
- No separate pages per project. The design must allow adding them later
  (see §9).
- No light theme. Dark only, as in the mockup.
- No cookie banner. Nothing on the site sets a non-essential cookie.

Anti-goals (it is a failure even if it works)

- A text change that requires editing an `.astro` or `.ts` component.
- A JavaScript-heavy page. Content must render without JS; only the contact
  form and small enhancements need it.
- Any third-party tracking or third-party font/CDN request from the visitor's
  browser other than Cloudflare Turnstile on the contact form.
- Exposing the home IP address or opening a port on the home router.

## 3. Constraints

- Domain `brxsolutions.sk`, DNS already on Cloudflare.
- Mailbox `*@brxsolutions.sk` does not exist yet. Form submissions go to
  `peter.beraxa@gmail.com` for now. The recipient is configuration, not code.
- Hosting: owner's Proxmox host, runs 24/7, Docker available. Behind a
  residential connection, no static IP, no inbound ports.
- Repository: GitHub organisation `brxsolutions` (owner creates it). Repo will
  be public.
- Owner's stack preferences: TypeScript, Astro (agreed), Tailwind (in his
  listed stack), Vitest, Playwright, Docker, Cloudflare Zero Trust.
- Local tooling observed: Node 20.19, Docker 28, git 2.50. Builder may require
  Node 22 (LTS); document it in the README and `.nvmrc`.
- Mockup placeholders remain placeholders in content files until the owner
  fills them: `[Meno Priezvisko]`, `[mesiac rok]`, `[2025]`, `IČO [00000000]`.

## 4. Architecture (decided)

```
visitor ──HTTPS──> Cloudflare edge ──tunnel──> cloudflared (Docker, on Proxmox)
                                                 │
                                                 ├─ brxsolutions.sk        → caddy (static dist + /api/* proxy)
                                                 │                              └─ /api/* → contact-api (Node, Hono)
                                                 └─ stats.brxsolutions.sk → umami (+ postgres), behind Cloudflare Access
```

- `apps/web`: Astro 5, static output. TypeScript strict. Tailwind v4 with the
  mockup's colours, fonts, radii, and spacing as design tokens (CSS variables).
  Fonts self-hosted via `@fontsource` (Inter, Space Grotesk, JetBrains Mono).
  No Google Fonts request at runtime.
- `apps/contact-api`: Hono on Node 22. One route `POST /api/contact`. Validates
  with Zod, verifies Cloudflare Turnstile, rate-limits, sends mail through
  Resend. Nothing else.
- `infra/`: `docker-compose.yml` (caddy, contact-api, umami, umami-db,
  cloudflared), `Caddyfile`, `deploy.sh`, `.env.example`.
- Monorepo with pnpm workspaces. One lockfile. Root scripts: `pnpm test`,
  `pnpm build`, `pnpm lint`.

Why not Cloudflare Pages: hosting on own hardware is an explicit marketing
point in the footer. Fallback remains trivial: `apps/web` builds to plain
static files, so the site can move to Pages in minutes if the home server is
down for long.

## 5. Content model (decided)

Two kinds of content, by how often they change and whether they are a list.

### 5.1 UI dictionary — `apps/web/src/i18n/{sk,en}.ts`

Flat typed object: navigation labels, section titles and subtitles, button
labels, form labels and options, footer sentences. One `Dictionary` type;
both files must satisfy it, so a missing key fails `tsc`. Also includes the
small fixed arrays that are design, not data: `stats` (4 items), `process`
(4 steps), `strengths` (8 items), `stack` groups, `services` and the
`featured` service. These are lists, but their count is baked into the
layout, so they stay with the dictionary.

### 5.2 Content collections — `apps/web/src/content/`

Astro content collections with Zod schemas, one markdown file per entry per
locale. Adding an entry means adding a file. Layout order comes from an
`order` field, not file name.

```
src/content/
  experience/{sk,en}/<slug>.md   period, role, client, tags, order; body = desc
  projects/{sk,en}/<slug>.md     context, year, metric, metricLabel, title,
                                 problem, solution, result, tags, order
  own/{sk,en}/<slug>.md          title, status (e.g. "222 testov · v produkcii"),
                                 icon (enum: bot|invoice|home|…), tech, tags, order;
                                 body = desc
```

Locale parity rule: every slug in `sk/` must exist in `en/` and vice versa.
Enforced by a Vitest test that fails the build.

Placeholder rule: a test warns (does not fail) on any `[...]` placeholder
left in content, listing file and line, so the owner sees what is unfilled.

### 5.3 Legal content — `apps/web/src/content/legal/{sk,en}/privacy.md`

Privacy policy as markdown, rendered on its own page. Company identification
(name, IČO, DIČ, IČ DPH, registered seat, commercial register entry) lives in
`apps/web/src/config/company.ts` and is rendered in the footer and the privacy
page. Placeholder values until the owner fills them.

## 6. Routing and i18n (decided)

- Astro built-in i18n. Default locale `sk` without prefix, `en` prefixed.
  - `/`               Slovak home
  - `/en/`            English home
  - `/ochrana-osobnych-udajov`  Slovak privacy policy
  - `/en/privacy`     English privacy policy
- `<html lang>` set per page; `hreflang` alternates on every page; sitemap via
  `@astrojs/sitemap`; `robots.txt` allows all except `/api/`.
- Language switch (SK / EN pill in the nav) links to the same page in the other
  locale. A tiny inline script preserves the `#section` hash across the switch.
  No locale cookie, no Accept-Language redirect. URL is the only truth.
- Section anchors stay Slovak in both locales (`#sluzby`, `#skusenosti`,
  `#projekty`, `#vlastne`, `#kontakt`) so links shared between locales keep
  working. Builder's call to change this; if changed, both locales must still
  resolve the same anchors.
- Open Graph: one static OG image (1200×630, dark, logo + tagline), per-locale
  `title` and `description`. JSON-LD `Organization` with the company data.

## 7. Page behaviour (decided)

- Sections, in order, as in the mockup: nav, hero, stats strip, services,
  stack, experience, case studies, own projects, process, strengths ("Prečo so
  mnou"), contact, footer.
- Expandable detail on case studies ("Ako som to riešil") and own projects
  ("Technické detaily"): native `<details>/<summary>`, styled to match the
  mockup's open/closed states and chevrons. No JS.
- Nav: sticky, blurred, as in mockup. On narrow screens collapses to a menu
  button; builder designs the mobile layout, must work at 375px wide. The
  mockup is desktop-only (1440); its `flex-wrap` and `clamp()` hints are the
  starting point.
- "Vyžiadať si CV" / "Request CV" button: scrolls to the contact form and
  pre-selects a 4th project-type option "Žiadosť o CV" / "CV request" (added
  to the dictionary). Form message placeholder changes accordingly. Needs JS;
  without JS it simply scrolls to the form.
- Accent colour fixed to the mockup default `#14B8A6` (light variant
  `#5EEAD4`). The mockup's colour options are dropped.
- Email link `info@brxsolutions.sk` in the contact section: keep in the
  dictionary, but the owner must create the mailbox before launch, or the
  builder swaps it to the configured recipient. Flagged in README launch
  checklist.

## 8. Contact form and API (decided)

Form fields: name, email, project type (select: 3 options from mockup + CV
request), message, hidden honeypot field, Turnstile widget. Consent sentence
under the button links to the privacy page.

Client side

- Progressive: without JS the form posts to `/api/contact` and the API answers
  with a `303` redirect to `/?sent=1#kontakt` (or `/en/…`), where the page
  shows a success note. With JS the form submits with `fetch`, disables the
  button, shows inline success or error, and never leaves the page. Turnstile
  requires JS, so the no-JS path will fail Turnstile verification; the API
  must return a readable error page in that case, not a 500.
- Validation mirrored on the client with native attributes (`required`,
  `type=email`, `maxlength`).

API (`apps/contact-api`)

- `POST /api/contact`, accepts `application/x-www-form-urlencoded` and
  `application/json`. Body limit 32 KiB.
- Zod schema: `name` 1–100 chars, `email` valid, `type` enum, `message`
  10–5000 chars, `lang` enum `sk|en`, `turnstileToken` string, honeypot must
  be empty.
- Verify Turnstile token server side with the secret.
- Rate limit: 5 requests per IP per hour, in memory. Client IP from
  `CF-Connecting-IP` only; the API must only be reachable through caddy, and
  caddy is only reachable through the tunnel.
- Origin check: reject requests whose `Origin`/`Referer` is not the site's own
  origin.
- Send through Resend: from `web@brxsolutions.sk` (domain verified in Resend
  via Cloudflare DNS records), to `CONTACT_TO`, `reply-to` = sender's email.
  Plain-text email; all user input is treated as text, never as HTML.
- Responses: `200 {ok:true}` / `303` on success; `400` with field errors;
  `429` on rate limit; `502` if Resend fails (logged, message tells the user
  to email directly).
- Structured JSON logs to stdout. No request body in logs.
- Configuration via environment: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`,
  `CONTACT_TO`, `CONTACT_FROM`, `SITE_ORIGIN`, `PORT`.

## 9. Future: project pages

Not built now, but the content model must not need restructuring to add
them. `own/` and `projects/` entries already carry a `slug`; a later
`src/pages/[...lang]/projekty/[slug].astro` can render the markdown body as
the long form. For that reason the `desc` of an own project goes in the
markdown body, and the short `tech` text stays in frontmatter.

## 10. Analytics (decided)

Umami self-hosted in the same compose stack at `stats.brxsolutions.sk`,
Postgres as its database, the dashboard protected by Cloudflare Access (owner's
email only). The site includes the Umami script tag with the website id from
config. Umami in default mode sets no cookies and stores no personal data, so
no banner. The privacy policy mentions the analytics and what it stores.

## 11. Infrastructure and deployment (decided)

- One LXC or VM on Proxmox with Docker. Compose stack from `infra/`.
- `cloudflared` runs as a container with a tunnel token from the
  environment. Tunnel routes: `brxsolutions.sk` and `www` to caddy;
  `stats.brxsolutions.sk` to umami. `www` redirects to apex at Cloudflare or
  in caddy.
- Caddy serves `apps/web/dist` from a volume baked into the web image,
  proxies `/api/*` to `contact-api:3000`, sets security headers: CSP
  (allowing Turnstile and the stats host), HSTS, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`. Cache headers: hashed assets
  immutable, HTML no-cache.
- Images: `ghcr.io/brxsolutions/web:<git-sha>` (caddy + dist) and
  `ghcr.io/brxsolutions/contact-api:<git-sha>`. Never `:latest` in production.
- GitHub Actions on push to `main`: lint, typecheck, unit tests, build,
  Playwright smoke against the built site, build and push images. Deploy step
  connects over SSH through Cloudflare Access (service token, `cloudflared
  access ssh`) and runs `infra/deploy.sh <sha>`, which writes the tag into the
  server's `.env` and runs `docker compose up -d`. Rollback = run
  `deploy.sh` with the previous sha.
- Milestone split: the site must be deployable by hand first
  (`docker compose pull && deploy.sh <sha>` run by the owner). The automated
  deploy job is the last milestone and must not block launch.
- Secrets live only on the server `.env` and in GitHub Actions secrets. The
  repo carries `.env.example`.
- Backups: Umami's Postgres volume dumped nightly by a cron on the host to a
  location the owner names. Site content needs no backup; it is in git.

## 12. Quality bar

- Tests first (owner's rule): API routes, content parity and schema tests,
  dictionary completeness, form behaviour (Playwright, Turnstile and Resend
  stubbed), one Playwright screenshot test per locale at 1440 and 375 px.
- `pnpm lint` (ESLint + Prettier), `pnpm typecheck`, `pnpm test` green in CI.
- Accessibility: semantic landmarks, keyboard-reachable accordions and menu,
  visible focus, contrast as in mockup, `prefers-reduced-motion` respected.
- Performance: no client JS on the page except the language-hash script, the
  CV prefill, the form handler, Turnstile, and the Umami script.

## 13. Left to the builder

- Exact Tailwind token naming and how mockup inline styles map to utilities
  vs. component classes.
- Mobile layout for every section, hamburger menu behaviour.
- Icon handling (inline SVG paths from the mockup).
- Repository layout details, lint config, commit conventions.
- Choice of rate-limit and Turnstile libraries vs. hand-rolled.
- How the stats strip values are typed (string, since they contain `×`, `→`).
- Whether `www` redirect lives in Cloudflare rules or caddy.

## 14. Launch checklist (for the owner, kept in README)

1. Fill placeholders: name, availability month, years, IČO/DIČ/seat/register.
2. Create GitHub org `brxsolutions` and the repository; add remote.
3. Resend account, verify `brxsolutions.sk` (DNS records in Cloudflare).
4. Turnstile site key and secret for `brxsolutions.sk`.
5. Cloudflare Tunnel, token into server `.env`; Access policy for `stats.`.
6. Decide on `info@brxsolutions.sk` mailbox or replace the address.
7. Umami website id into site config.
8. GitHub Actions secrets for GHCR and the Access service token.
