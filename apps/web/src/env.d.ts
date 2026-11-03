interface ImportMetaEnv {
  readonly PUBLIC_UMAMI_SRC?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  readonly PUBLIC_CONTACT_ENDPOINT?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
