import { describe, it, expect } from 'vitest';
import { buildTerminalData, hashOf } from '../src/terminal/data';
import { company } from '../src/config/company';
import { t } from '../src/i18n';

describe('terminal scene data', () => {
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
      expect(d.containers.map((x) => x.slug)).toEqual(['agents', 'acc', 'ha']);
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
    const years = d.commits.map((c) => c.year);
    expect(years[0]).toBe('2017');
    expect(years).toEqual([...years].sort());
    expect(d.commits[0]!.message).toContain('Manual QA Tester');
  });

  it('project detail carries the content texts under dictionary headings', async () => {
    const d = await buildTerminalData('sk');
    expect(d.tests[0]!.metric).toBe('Záchrana RAG');
    expect(d.tests[0]!.detail.map((x) => x.heading)).toEqual([
      t('sk').terminal.problem,
      t('sk').projects.more,
      t('sk').terminal.result,
      t('sk').projects.lesson,
    ]);
    expect(d.tests[0]!.detail[0]!.text).toContain('2,5-ročný Python RAG systém');
  });

  it('window data contains no markup', async () => {
    const json = JSON.stringify(await buildTerminalData('en'));
    expect(json).not.toMatch(/<[a-z]/i);
  });
});
