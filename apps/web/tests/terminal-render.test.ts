import { describe, it, expect, beforeAll } from 'vitest';
import { buildTerminalData } from '../src/terminal/data';
import {
  esc,
  revealCount,
  renderScene,
  sceneItemCount,
  type RenderCtx,
} from '../src/terminal/render';
import { SCENE_IDS, type TerminalData } from '../src/terminal/types';

const empty = { name: '', email: '', type: '', message: '' };
const full: RenderCtx = {
  progress: 1,
  typedChars: Infinity,
  openFold: null,
  form: empty,
  sent: false,
  detail: null,
};
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

let data: TerminalData;
beforeAll(async () => {
  data = await buildTerminalData('sk');
});

describe('esc', () => {
  it('neutralises markup characters', () => {
    expect(esc(`<img src=x onerror="a('b')">&`)).toBe(
      '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;',
    );
  });
});

describe('revealCount', () => {
  it('starts at 0, reaches n before the section ends, never exceeds n', () => {
    expect(revealCount(0, 5)).toBe(0);
    expect(revealCount(0.2, 5)).toBe(1);
    expect(revealCount(0.8, 5)).toBe(5);
    expect(revealCount(1, 5)).toBe(5);
    expect(revealCount(-1, 5)).toBe(0);
  });
});

describe('renderScene', () => {
  it('renders every scene in both locales with a file name and no inline style or script', async () => {
    for (const locale of ['sk', 'en'] as const) {
      const d = await buildTerminalData(locale);
      for (const scene of SCENE_IDS) {
        const r = renderScene(d, scene, full);
        expect(r.file.length, scene).toBeGreaterThan(0);
        expect(r.html, scene).not.toMatch(/\sstyle=|<script/i);
        expect(r.revealed, scene).toBe(r.total);
        expect(r.stat, scene).toBe(d.labels.done[scene]);
      }
    }
  });

  it('shows nothing but the prompt at the start of an item scene', () => {
    const r = renderScene(data, 'projects', { ...full, progress: 0 });
    expect(r.revealed).toBe(0);
    expect(r.html).not.toContain('PASSED');
    expect(r.html).toContain('term-cur');
    expect(r.stat).toBe('0 / 4');
  });

  it('projects scene names one passed test per project with the content metric', () => {
    const r = renderScene(data, 'projects', full);
    expect(count(r.html, /PASSED/g)).toBe(4);
    expect(text(r.html)).toContain('cases/test_blick');
    expect(text(r.html)).toContain(data.tests[0]!.metric);
    expect(r.html).not.toContain('term-cur');
  });

  it('project detail shows only content texts, line by line', () => {
    const two = renderScene(data, 'projects', { ...full, detail: { slug: 'blick', lines: 2 } });
    expect(two.file).toBe('cases/blick.md');
    expect(two.revealed).toBe(2);
    expect(two.html).toContain('term-cur');
    const all = renderScene(data, 'projects', {
      ...full,
      detail: { slug: 'blick', lines: Infinity },
    });
    for (const part of data.tests[0]!.detail) {
      expect(text(all.html)).toContain(part.heading);
      expect(text(all.html)).toContain(part.text);
    }
    expect(all.revealed).toBe(all.total);
  });

  it('ignores a detail that belongs to another scene', () => {
    const r = renderScene(data, 'own', { ...full, detail: { slug: 'blick', lines: 3 } });
    expect(r.file).toContain('docker ps');
  });

  it('own detail lists title, status, tech and tags from content', () => {
    const r = renderScene(data, 'own', { ...full, detail: { slug: 'agents', lines: Infinity } });
    expect(r.file).toContain('docker inspect agents');
    const c = data.containers[0]!;
    for (const v of [c.detail.title, c.status, c.detail.tech, c.tags[0]!])
      expect(text(r.html)).toContain(v);
  });

  it('stack scene unfolds only the open group', () => {
    const folded = renderScene(data, 'stack', full);
    expect(count(folded.html, /data-fold="\d"/g)).toBe(data.stack.length);
    expect(text(folded.html)).not.toContain(data.stack[0]!.items[0]!);
    const open = renderScene(data, 'stack', { ...full, openFold: 0 });
    expect(text(open.html)).toContain(data.stack[0]!.items[0]!);
    expect(text(open.html)).not.toContain(data.stack[1]!.items[1]!);
    expect(open.html).toContain('aria-expanded="true"');
  });

  it('process marks done, running and waiting jobs', () => {
    const r = renderScene(data, 'process', { ...full, progress: 0.3 });
    expect(r.revealed).toBe(1);
    expect(count(r.html, /term-job ok/g)).toBe(1);
    expect(count(r.html, /term-job run/g)).toBe(1);
    expect(count(r.html, /term-job wait/g)).toBe(2);
  });

  it('profile typing cuts the text and keeps the cursor', () => {
    const r = renderScene(data, 'profile', { ...full, typedChars: 10 });
    expect(text(r.html)).toBe('const engi');
    expect(r.html).toContain('term-cur');
    expect(renderScene(data, 'profile', full).html).toContain(data.profile.name);
  });

  it('stats scene continues profile.ts with one line per number', () => {
    const r = renderScene(data, 'stats', full);
    expect(r.file).toBe('profile.ts');
    for (const s of data.stats) expect(text(r.html)).toContain(s);
  });
});

describe('contact scene', () => {
  it('shows form input as text, never as markup', () => {
    const r = renderScene(data, 'contact', {
      ...full,
      form: { ...empty, name: '"><b>x', message: '</pre><img src=x onerror=alert(1)>' },
    });
    expect(r.html).not.toContain('<img');
    expect(r.html).not.toContain('<b>');
    expect(r.html).toContain('&lt;/pre&gt;&lt;img');
  });

  it('cuts the message to 120 characters', () => {
    const r = renderScene(data, 'contact', {
      ...full,
      form: { ...empty, message: 'a'.repeat(200) },
    });
    expect(count(r.html, /a{120}/g)).toBe(1);
    expect(r.html).not.toMatch(/a{121}/);
  });

  it('shows 201 only after the form was sent', () => {
    expect(renderScene(data, 'contact', full).html).not.toContain('201');
    const sent = renderScene(data, 'contact', { ...full, sent: true });
    expect(sent.html).toContain('201 Created');
    expect(sent.html).not.toContain('term-cur');
  });
});

describe('sceneItemCount', () => {
  it('matches the content', () => {
    expect(sceneItemCount(data, 'profile')).toBe(0);
    expect(sceneItemCount(data, 'projects')).toBe(4);
    expect(sceneItemCount(data, 'own')).toBe(3);
    expect(sceneItemCount(data, 'services')).toBe(data.services.length);
    expect(sceneItemCount(data, 'contact')).toBe(0);
  });
});
