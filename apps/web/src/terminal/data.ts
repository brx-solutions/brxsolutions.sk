import { company } from '../config/company';
import { localized, slugOf } from '../content/queries';
import { t, type IconName, type Locale } from '../i18n';
import type { TerminalData } from './types';

const SERVICE_MODULES: Record<IconName | 'featured', { ident: string; dir: string } | undefined> = {
  featured: { ident: 'llmSystems', dir: 'ai' },
  api: { ident: 'restApi', dir: 'backend' },
  data: { ident: 'pipeline', dir: 'pipelines' },
  legacy: { ident: 'legacyAudit', dir: 'legacy' },
  web: { ident: 'webApp', dir: 'web' },
  bot: undefined,
  invoice: undefined,
  home: undefined,
};

const JOB_IDS = ['brief', 'design', 'build', 'deploy'];

/** Seven hex characters derived from the entry id (FNV-1a). Decoration, but stable between builds. */
export function hashOf(id: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

function contactPath(): string {
  const endpoint: string = import.meta.env.PUBLIC_CONTACT_ENDPOINT ?? '/api/contact';
  try {
    return new URL(endpoint, company.siteUrl).pathname;
  } catch {
    return '/api/contact';
  }
}

export async function buildTerminalData(locale: Locale): Promise<TerminalData> {
  const d = t(locale);
  const [experience, projects, own] = await Promise.all([
    localized('experience', locale),
    localized('projects', locale),
    localized('own', locale),
  ]);

  const services = [
    { key: 'featured' as const, title: d.services.featured.title },
    ...d.services.items.map((s) => ({ key: s.icon, title: s.title })),
  ].map(({ key, title }, i) => {
    const mod = SERVICE_MODULES[key] ?? { ident: `service${i + 1}`, dir: `service-${i + 1}` };
    return { ...mod, title };
  });

  return {
    labels: d.terminal,
    profile: {
      name: company.founder,
      company: company.name,
      focus: d.hero.code.focus,
      stack: d.hero.code.stack,
      since: company.since,
      remote: d.hero.code.remote,
    },
    stats: d.stats.map((s) => `${s.value} ${s.label}`),
    services,
    stack: d.stack.groups.map((g) => ({ name: g.name, items: g.items })),
    // The page lists the newest job first; a git log reads oldest first.
    commits: [...experience].reverse().map((e) => ({
      hash: hashOf(e.id),
      year: /\d{4}/.exec(e.data.period)?.[0] ?? '',
      message: `feat: ${e.data.role} · ${e.data.client}`,
    })),
    tests: projects.map((p) => ({
      slug: slugOf(p.id),
      metric: p.data.metric,
      label: p.data.metricLabel,
      detail: [
        { heading: d.terminal.problem, text: p.data.problem },
        { heading: d.projects.more, text: p.data.solution },
        { heading: d.terminal.result, text: p.data.result },
        { heading: d.projects.lesson, text: p.data.lesson },
      ],
    })),
    containers: own.map((o) => ({
      slug: slugOf(o.id),
      status: o.data.status,
      tags: o.data.tags,
      detail: { title: o.data.title, tech: o.data.tech },
    })),
    jobs: d.process.steps.map((s, i) => ({
      id: JOB_IDS[i] ?? `step-${i + 1}`,
      title: s.title,
      desc: s.desc,
    })),
    strengths: d.strengths.items.map((s) => s.title),
    contact: { path: contactPath() },
  };
}
