export type IconName = 'api' | 'data' | 'legacy' | 'bot' | 'invoice' | 'home';
export type ProjectType = 'ai' | 'backend' | 'audit' | 'cv';

export interface Dictionary {
  meta: { title: string; description: string };
  nav: {
    services: string;
    stack: string;
    experience: string;
    projects: string;
    own: string;
    contact: string;
    cta: string;
    langLabel: string;
    menuOpen: string;
    menuClose: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    sub: string;
    cta1: string;
    cta2: string;
    availability: string;
    code: { focus: string[]; stack: string[]; remote: boolean };
  };
  stats: { value: string; label: string }[];
  services: {
    title: string;
    sub: string;
    featuredBadge: string;
    featured: { title: string; desc: string; quote: string; tags: string[] };
    items: { icon: IconName; title: string; desc: string; tags: string[] }[];
  };
  stack: {
    title: string;
    note: string;
    fullstack: string;
    groups: { name: string; count: string; bar: string; items: string[] }[];
  };
  experience: { title: string; sub: string; cta: string };
  projects: { title: string; sub: string; more: string; less: string; nda: string };
  own: { eyebrow: string; title: string; sub: string; more: string; less: string };
  process: { eyebrow: string; title: string; steps: { no: string; title: string; desc: string }[] };
  strengths: { eyebrow: string; title: string; sub: string; items: { title: string; desc: string }[] };
  contact: {
    title: string;
    sub: string;
    emailLabel: string;
    form: {
      name: string;
      email: string;
      type: string;
      options: Record<ProjectType, string>;
      message: string;
      messagePlaceholder: string;
      cvPlaceholder: string;
      submit: string;
      sending: string;
      success: string;
      error: string;
      note: string;
      noteLink: string;
    };
  };
  legal: { title: string };
  sent: { title: string; body: string; back: string };
  failed: { title: string; body: string; back: string };
  footer: { built: string; rights: string };
}
