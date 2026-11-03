# brxsolutions.sk

Company website of BRX Solutions s.r.o. A bilingual (SK/EN) static site built with Astro,
plus a small contact-form API. Design spec and implementation plans live in `docs/superpowers/`.

## Local development

```bash
nvm use            # Node 24 (see .nvmrc); pnpm via corepack
pnpm install
pnpm --filter web dev
```

## Commands

| Command          | What it does                              |
| ---------------- | ----------------------------------------- |
| `pnpm build`     | builds every workspace                    |
| `pnpm test`      | runs unit tests in every workspace        |
| `pnpm typecheck` | `astro check` / `tsc --noEmit`            |
| `pnpm lint`      | Prettier check                            |

## Launch checklist

1. Fill placeholders: name, availability month, years, IČO/DIČ/seat/register.
2. Create GitHub org `brxsolutions` and the repository; add remote.
3. Resend account, verify `brxsolutions.sk` (DNS records in Cloudflare).
4. Turnstile site key and secret for `brxsolutions.sk`.
5. Cloudflare Tunnel, token into server `.env`; Access policy for `stats.`.
6. Decide on `info@brxsolutions.sk` mailbox or replace the address.
7. Umami website id into site config.
8. GitHub Actions secrets for GHCR and the Access service token.
9. Review the privacy policy draft and the client/employer names in the case studies and
   experience timeline before the site goes public.
