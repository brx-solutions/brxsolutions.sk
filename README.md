# brxsolutions.sk

Company website of BRX Solutions s.r.o. A bilingual (SK/EN) static site built with Astro,
plus a small Hono API that delivers contact-form messages by e-mail. Both ship as Docker
images behind Caddy. Design spec and implementation plans live in `docs/superpowers/`.

```
apps/web          Astro 7 site (static output, Tailwind 4, content collections)
apps/contact-api  Hono on Node: POST /api/contact (Turnstile, rate limit, Resend)
infra/            Caddyfile, docker-compose.yml, smoke.sh, .env.example
```

## Local development

```bash
nvm use                                  # Node 24 (.nvmrc); pnpm comes via corepack
pnpm install
cp apps/web/.env.example apps/web/.env   # test Turnstile key, no analytics
pnpm --filter web dev                    # http://localhost:4321
```

Run the API next to it when you want the form to work locally:

```bash
cd apps/contact-api
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA MAIL_TRANSPORT=console \
SITE_ORIGIN=http://localhost:4321 CONTACT_TO=you@example.com CONTACT_FROM=onboarding@resend.dev \
PORT=3777 pnpm dev
```

and point the site at it with `PUBLIC_CONTACT_ENDPOINT=http://localhost:3777/api/contact` in
`apps/web/.env`. The console transport prints each message to stdout instead of sending it.

## Commands

| Command                      | What it does                                                  |
| ---------------------------- | ------------------------------------------------------------- |
| `pnpm build`                 | builds every workspace                                        |
| `pnpm test`                  | unit tests in every workspace (web tests need a prior build)  |
| `pnpm --filter web e2e`      | Playwright: navigation, contact flow, visual and axe checks   |
| `pnpm typecheck`             | `astro check` and `tsc --noEmit`                              |
| `pnpm lint` / `pnpm format`  | Prettier                                                      |
| `infra/smoke.sh`             | builds the Docker stack and checks it through Caddy           |

Visual baselines live in `apps/web/e2e/visual.spec.ts-snapshots/`, one set per platform
(`-darwin` for local runs, `-linux` for CI). After an intentional design change refresh both:

```bash
pnpm --filter web e2e --update-snapshots                       # darwin
docker run --rm -v "$PWD":/src:ro -v "$PWD/apps/web/e2e/visual.spec.ts-snapshots":/snap node:24 \
  bash -c 'cp -r /src /w && cd /w && rm -rf node_modules apps/*/node_modules apps/web/dist apps/web/.astro \
  && corepack enable && pnpm install --frozen-lockfile && cp apps/web/.env.example apps/web/.env \
  && cd apps/web && pnpm exec playwright install --with-deps chromium \
  && pnpm e2e --update-snapshots; cp e2e/visual.spec.ts-snapshots/*-linux.png /snap/'   # linux
```

and commit the PNGs.

## Editing content

No CMS. Every visible string lives in one of three places; components contain no copy.

| What                                                   | Where                                             |
| ------------------------------------------------------ | ------------------------------------------------- |
| Navigation, headings, buttons, form labels, footer     | `apps/web/src/i18n/sk.ts` and `en.ts`             |
| Stats strip, services, stack groups, process, strengths | same files (small fixed lists)                    |
| Company data: name, IČO, seat, e-mail, phone, socials  | `apps/web/src/config/company.ts`                  |
| Experience timeline                                    | `apps/web/src/content/experience/{sk,en}/*.md`    |
| Case studies                                           | `apps/web/src/content/projects/{sk,en}/*.md`      |
| Own projects                                           | `apps/web/src/content/own/{sk,en}/*.md`           |
| Privacy policy                                         | `apps/web/src/content/legal/{sk,en}/privacy.md`   |

To add a case study: copy an existing file in `projects/sk/`, give it a new file name, fill
the frontmatter, set `order` to the next number, then create the same file name in
`projects/en/`. The test suite fails if a slug exists in one language only, if two entries
share an `order`, or if the frontmatter does not match the schema in
`apps/web/src/content/schemas.ts`. Placeholders written as `[...]` are listed as a warning by
`pnpm --filter web test` until you replace them.

## Docker

```bash
cd infra
cp .env.example .env        # local defaults: console mail, Turnstile test secret
./smoke.sh                  # builds both images, starts the stack on :8080, checks it
docker compose -f docker-compose.yml -f compose.local.yml down
```

Production images are tagged with the git sha (`ghcr.io/brx-solutions/web:<sha>`,
`ghcr.io/brx-solutions/contact-api:<sha>`), never `latest`. Tunnel, analytics and the
deploy job are described in the infrastructure plan.

## Launch checklist

1. Fill placeholders: name, availability month, years, IČO/DIČ/seat/register, phone, social links.
2. Create GitHub org `brxsolutions` and the repository; add remote.
3. Resend account, verify `brxsolutions.sk` (DNS records in Cloudflare).
4. Turnstile site key and secret for `brxsolutions.sk`.
5. Cloudflare Tunnel, token into server `.env`; Access policy for `stats.`.
6. Decide on `info@brxsolutions.sk` mailbox or keep the current address in `company.ts`.
7. Umami website id into site config.
8. GitHub Actions secrets for GHCR and the Access service token.
9. Review the privacy policy draft and the client/employer names in the case studies and
   experience timeline before the site goes public.
10. Server `.env`: real `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `MAIL_TRANSPORT=resend`.
