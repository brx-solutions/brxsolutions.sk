import type { SceneId, TerminalData } from './types';

export interface RenderCtx {
  /** 0..1 position within the active section. */
  progress: number;
  /** Characters of profile.ts typed so far; Infinity when done. */
  typedChars: number;
  /** Index of the unfolded stack group. */
  openFold: number | null;
  form: { name: string; email: string; type: string; message: string };
  sent: boolean;
  /** Open "show more" card and how many lines of it are revealed. */
  detail: { slug: string; lines: number } | null;
}

export interface Rendered {
  file: string;
  stat: string;
  html: string;
  revealed: number;
  total: number;
}

type Token = [cls: string, text: string];

const MESSAGE_LIMIT = 120;
const CUR = '<span class="term-cur"></span>';

/** Every value shown in the window goes through here; form input is untrusted. */
export function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Items revealed at a scroll position. All n are visible a little before the section ends. */
export function revealCount(progress: number, n: number): number {
  return Math.max(0, Math.min(n, Math.floor(progress * 1.3 * (n + 1))));
}

const sp = (cls: string, text: string) => `<span class="tk-${cls}">${esc(text)}</span>`;
const str = (v: string) => sp('s', `"${v}"`);
const prompt = (cmd: string) => sp('g', '➜ ') + sp('k', '~/brx ') + sp('h', cmd);
const pre = (body: string) => `<pre class="term-pre">${body}</pre>`;

function strList(xs: string[]): Token[] {
  return xs.flatMap((x, i): Token[] => [...(i ? [['', ', '] as Token] : []), ['s', `"${x}"`]]);
}

function profileLines(p: TerminalData['profile'], closed: boolean): Token[][] {
  const lines: Token[][] = [
    [
      ['k', 'const'],
      ['', ' engineer = {'],
    ],
    [
      ['', '  name:    '],
      ['s', `"${p.name}"`],
      ['', ','],
    ],
    [
      ['', '  company: '],
      ['s', `"${p.company}"`],
      ['', ','],
    ],
    [['', '  focus:   ['], ...strList(p.focus), ['', '],']],
    [['', '  stack:   ['], ...strList(p.stack), ['', '],']],
    [
      ['', '  since:   '],
      ['n', String(p.since)],
      ['', ','],
    ],
    [
      ['', '  remote:  '],
      ['k', String(p.remote)],
      ['', ','],
    ],
  ];
  if (closed) lines.push([['', '};']]);
  return lines;
}

const lineLength = (lines: Token[][]) =>
  lines.reduce((sum, line) => sum + line.reduce((s, [, t]) => s + t.length, 0), 0) +
  Math.max(0, lines.length - 1);

/** Renders token lines cut after `chars` characters (newlines count as one). */
function typed(lines: Token[][], chars: number): string {
  let out = '';
  let left = chars;
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) {
      if (left <= 0) return out;
      out += '\n';
      left -= 1;
    }
    for (const [cls, text] of lines[i]!) {
      if (left <= 0) return out;
      const part = text.slice(0, left);
      left -= part.length;
      out += cls ? sp(cls, part) : esc(part);
    }
  }
  return out;
}

const tokens = (line: Token[]) =>
  line.map(([cls, text]) => (cls ? sp(cls, text) : esc(text))).join('');

function listScene(
  data: TerminalData,
  scene: SceneId,
  file: string,
  ctx: RenderCtx,
  n: number,
  body: (k: number, done: boolean) => string,
): Rendered {
  const k = revealCount(ctx.progress, n);
  const done = k >= n;
  return {
    file,
    stat: done ? data.labels.done[scene] : `${k} / ${n}`,
    html: body(k, done),
    revealed: k,
    total: n,
  };
}

function linesScene(file: string, stat: string, lines: string[], shown: number): Rendered {
  const k = Math.max(0, Math.min(lines.length, shown));
  return {
    file,
    stat,
    html: pre(lines.slice(0, k).join('\n') + (k < lines.length ? '\n' + CUR : '')),
    revealed: k,
    total: lines.length,
  };
}

const scenes: Record<SceneId, (data: TerminalData, ctx: RenderCtx) => Rendered> = {
  profile(data, ctx) {
    const lines = profileLines(data.profile, true);
    const total = lineLength(lines);
    const revealed = Math.min(total, Math.max(0, ctx.typedChars));
    return {
      file: 'profile.ts',
      stat: data.labels.done.profile,
      html: pre(typed(lines, revealed) + CUR),
      revealed,
      total,
    };
  },

  stats(data, ctx) {
    return listScene(data, 'stats', 'profile.ts', ctx, data.stats.length, (k, done) => {
      const head = profileLines(data.profile, false).map(tokens).join('\n');
      const rows = data.stats.slice(0, k).map((s) => `    ${str(s)},`);
      const tail = done ? ['  ],', '};'] : [CUR];
      return pre([head, '  stats: [', ...rows, ...tail].join('\n'));
    });
  },

  services(data, ctx) {
    return listScene(data, 'services', 'services.ts', ctx, data.services.length, (k, done) => {
      const tree = [
        'src/',
        ...data.services.map((s, i) =>
          i < k ? '  ' + sp('s', s.dir + '/') : '  ' + esc(s.dir + '/'),
        ),
        '  profile.ts',
        '  ' + sp('h', 'services.ts'),
      ].join('\n');
      const imports = data.services
        .slice(0, k)
        .map(
          (s) =>
            `${sp('k', 'import')} { ${esc(s.ident)} } ${sp('k', 'from')} ${str('./' + s.dir)};\n` +
            sp('c', `// ${s.title}`),
        );
      const tail = done
        ? [
            '',
            `${sp('k', 'export const')} services = [`,
            ...data.services.map((s) => `  ${esc(s.ident)},`),
            '];',
          ]
        : [CUR];
      return `<div class="term-tree">${tree}</div>` + pre([...imports, ...tail].join('\n'));
    });
  },

  stack(data, ctx) {
    return listScene(data, 'stack', 'stack.ts', ctx, data.stack.length, (k, done) => {
      const head = `${sp('k', 'export const')} stack = { ${sp('c', `// ${data.labels.foldHint}`)}\n`;
      const rows = data.stack
        .slice(0, k)
        .map((g, i) => {
          const open = ctx.openFold === i;
          const label = open
            ? `  ${sp('g', '▾')} ${sp('h', `"${g.name}"`)}: [`
            : `  ${sp('p', '▸')} ${esc(`"${g.name}"`)}: [ ${sp('p', `… ${g.items.length}`)} ],`;
          const row = `<button type="button" class="term-fold" data-fold="${i}" aria-expanded="${open}">${label}</button>`;
          return open ? row + g.items.map((x) => `      ${str(x)},\n`).join('') + '  ],\n' : row;
        })
        .join('');
      return pre(head + rows + (done ? '};' : CUR));
    });
  },

  experience(data, ctx) {
    return listScene(data, 'experience', 'zsh — git log', ctx, data.commits.length, (k, done) => {
      const rows = data.commits
        .slice(0, k)
        .map(
          (c, i) =>
            `${sp('w', c.hash)} ${sp('p', c.year)} ${i === k - 1 ? sp('h', c.message) : esc(c.message)}`,
        );
      const tail = done ? ['', sp('g', data.labels.done.experience)] : [CUR];
      return pre([prompt('git log --oneline --reverse'), '', ...rows, ...tail].join('\n'));
    });
  },

  projects(data, ctx) {
    const open = ctx.detail && data.tests.find((x) => x.slug === ctx.detail!.slug);
    if (open) {
      const file = `cases/${open.slug}.md`;
      const lines = [
        prompt(`cat ${file}`),
        ...open.detail.flatMap((part) => ['', sp('h', `## ${part.heading}`), esc(part.text)]),
      ];
      return linesScene(file, `${open.metric} · ${open.label}`, lines, ctx.detail!.lines);
    }
    return listScene(data, 'projects', 'zsh — pytest', ctx, data.tests.length, (k, done) => {
      const rows = data.tests
        .slice(0, k)
        .map(
          (x) =>
            `${esc(`cases/test_${x.slug}`)} ${sp('g', 'PASSED')}\n   ${sp('s', `${x.metric} · ${x.label}`)}`,
        );
      const tail = done ? ['', sp('g', `════ ${data.labels.done.projects} ════`)] : [CUR];
      return pre([prompt('pytest cases/ -v'), '', ...rows, ...tail].join('\n'));
    });
  },

  own(data, ctx) {
    const open = ctx.detail && data.containers.find((x) => x.slug === ctx.detail!.slug);
    if (open) {
      const field = (key: string, value: string, last = false) =>
        `  ${str(key)}: ${value}${last ? '' : ','}`;
      const lines = [
        prompt(`docker inspect ${open.slug}`),
        '{',
        field('Title', str(open.detail.title)),
        field('Status', sp('g', `"${open.status}"`)),
        field('Tech', str(open.detail.tech)),
        field('Tags', `[${open.tags.map(str).join(', ')}]`, true),
        '}',
      ];
      return linesScene(`zsh — docker inspect ${open.slug}`, open.status, lines, ctx.detail!.lines);
    }
    return listScene(data, 'own', 'zsh — docker ps', ctx, data.containers.length, (k, done) => {
      const width = Math.max(...data.containers.map((c) => c.slug.length), 4) + 2;
      const rows = data.containers
        .slice(0, k)
        .map(
          (c) =>
            `${sp('h', c.slug.padEnd(width))}${sp('g', c.status)}\n${' '.repeat(width)}${sp('p', c.tags.join(' · '))}`,
        );
      const tail = done ? ['', sp('c', `# ${data.labels.done.own}`)] : [CUR];
      return pre(
        [prompt('docker ps'), '', sp('p', 'NAME'.padEnd(width) + 'STATUS'), ...rows, ...tail].join(
          '\n',
        ),
      );
    });
  },

  process(data, ctx) {
    return listScene(
      data,
      'process',
      '.github/workflows/ci.yml',
      ctx,
      data.jobs.length,
      (k, done) => {
        const jobs = data.jobs
          .map((j, i) => {
            const state = i < k ? 'ok' : i === k ? 'run' : 'wait';
            return (
              `<div class="term-job ${state}"><span class="term-job-ic">${i < k ? '✓' : ''}</span>` +
              `<span><b>${esc(j.id)}</b> ${sp('p', `· ${j.title}`)}</span></div>`
            );
          })
          .join('');
        const foot = done ? `<p class="term-ci-done">✓ ${esc(data.labels.done.process)}</p>` : '';
        return `<div class="term-ci">${jobs}${foot}</div>`;
      },
    );
  },

  strengths(data, ctx) {
    return listScene(data, 'strengths', 'STRENGTHS.md', ctx, data.strengths.length, (k, done) => {
      const rows = data.strengths.slice(0, k).map((s) => `- [${sp('g', 'x')}] ${esc(s)}`);
      return pre([...rows, ...(done ? [] : [CUR])].join('\n'));
    });
  },

  contact(data, ctx) {
    const f = ctx.form;
    const field = (key: string, value: string, last = false) =>
      `  ${str(key)}: ${' '.repeat(7 - key.length)}${str(value)}${last ? '' : ','}`;
    const lines = [
      `${sp('k', 'POST')} ${esc(data.contact.path)} ${sp('p', 'HTTP/1.1')}`,
      sp('p', 'Content-Type: application/json'),
      '',
      '{',
      field('name', f.name),
      field('email', f.email),
      field('type', f.type),
      field('message', f.message.slice(0, MESSAGE_LIMIT), true),
      '}',
    ];
    if (ctx.sent) lines.push('', sp('g', '201 Created'));
    return {
      file: `POST ${data.contact.path}`,
      stat: data.labels.done.contact,
      html: pre(lines.join('\n') + (ctx.sent ? '' : CUR)),
      revealed: 1,
      total: 1,
    };
  },
};

export function renderScene(data: TerminalData, scene: SceneId, ctx: RenderCtx): Rendered {
  return scenes[scene](data, ctx);
}

export function sceneItemCount(data: TerminalData, scene: SceneId): number {
  switch (scene) {
    case 'stats':
      return data.stats.length;
    case 'services':
      return data.services.length;
    case 'stack':
      return data.stack.length;
    case 'experience':
      return data.commits.length;
    case 'projects':
      return data.tests.length;
    case 'own':
      return data.containers.length;
    case 'process':
      return data.jobs.length;
    case 'strengths':
      return data.strengths.length;
    default:
      return 0;
  }
}
