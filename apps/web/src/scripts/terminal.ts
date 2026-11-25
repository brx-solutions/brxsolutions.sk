import { renderScene, revealCount, sceneItemCount, type RenderCtx } from '../terminal/render';
import { loadMode, saveMode, transition, type Action, type Mode } from '../terminal/state';
import { SCENE_IDS, type SceneId, type TerminalData } from '../terminal/types';

const PHONE_MAX_WIDTH = 1100; // keep in sync with styles/terminal.css
const TYPE_CHARS_PER_TICK = 3;
const TYPE_TICK_MS = 28;
const DETAIL_LINE_MS = 170;
const EASING = 'cubic-bezier(.4,0,.2,1)';

interface Section {
  id: SceneId;
  el: HTMLElement;
  items: HTMLElement[];
}

function init(win: HTMLElement): void {
  const data = JSON.parse(win.dataset.terminal ?? '{}') as TerminalData;
  const root = document.documentElement;
  const q = <T extends HTMLElement>(sel: string, from: ParentNode = win) =>
    from.querySelector<T>(sel);

  const body = q('[data-term-body]');
  const fileEl = q('[data-term-file]');
  const countEl = q('[data-term-count]');
  const statEl = q('[data-term-stat]');
  const capTitle = q('[data-term-title]');
  const capSub = q('[data-term-sub]');
  const capDetail = q<HTMLButtonElement>('[data-term-detail]');
  const maxButton = q<HTMLButtonElement>('[data-term-max]');
  const dock = q<HTMLButtonElement>('[data-term-dock]', document);
  const dockLabel = q('[data-term-dock-label]', document);
  const form = q<HTMLFormElement>('[data-contact-form]', document);
  const header = q('header', document);
  if (!body || !fileEl || !countEl || !statEl || !dock || !dockLabel) return;

  const sections: Section[] = SCENE_IDS.flatMap((id) => {
    const el = document.querySelector<HTMLElement>(`[data-scene="${id}"]`);
    if (!el) return [];
    const items = [...el.querySelectorAll<HTMLElement>('[data-scene-item]')];
    // Highlighting only makes sense when the page has one card per line in the window.
    return [{ id, el, items: items.length === sceneItemCount(data, id) ? items : [] }];
  });
  if (!sections.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storage = (() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })();

  let mode: Mode = loadMode(storage);
  let active = 0;
  let typedChars = reduce ? Infinity : 0;
  let openFold: number | null = null;
  let detail: { scene: SceneId; slug: string; t0: number } | null = null;
  let sentForm: RenderCtx['form'] | null = null;
  let lastKey = '';
  let raf = 0;
  let busy = false;

  root.dataset.term = mode;

  const isPhone = () => window.innerWidth < PHONE_MAX_WIDTH;
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const readForm = (): RenderCtx['form'] => {
    const value = (name: string) =>
      form?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        `[name="${name}"]`,
      )?.value ?? '';
    return {
      name: value('name'),
      email: value('email'),
      type: value('type'),
      message: value('message'),
    };
  };

  function locate(): { index: number; progress: number } {
    const anchor = window.innerHeight * (isPhone() && mode === 'open' ? 0.72 : 0.55);
    let index = 0;
    let progress = 0;
    sections.forEach((s, i) => {
      const r = s.el.getBoundingClientRect();
      if (r.top <= anchor) {
        index = i;
        progress = Math.max(0, Math.min(1, (anchor - r.top) / r.height));
      }
    });
    return { index, progress: reduce ? 1 : progress };
  }

  function frame(): void {
    raf = 0;
    const { index, progress } = locate();
    const section = sections[index]!;
    active = index;

    const open = detail?.scene === section.id ? detail : null;
    const ctx: RenderCtx = {
      progress,
      typedChars,
      openFold,
      form: sentForm ?? readForm(),
      sent: sentForm !== null,
      detail: open && {
        slug: open.slug,
        lines: reduce ? Infinity : Math.floor((performance.now() - open.t0) / DETAIL_LINE_MS) + 1,
      },
    };
    const r = renderScene(data, section.id, ctx);

    const key = `${section.id}|${r.file}|${r.html}`;
    if (key !== lastKey) {
      lastKey = key;
      const fold = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>(
        '[data-fold]',
      )?.dataset.fold;
      // render.ts escapes every value; the string holds only class-attributed spans and buttons.
      body!.innerHTML = r.html;
      if (fold !== undefined) body!.querySelector<HTMLElement>(`[data-fold="${fold}"]`)?.focus();
      // A scene keeps its newest line in view. A detail is a document: it starts at the top and
      // the visitor scrolls it.
      if (!open) body!.scrollTop = body!.scrollHeight;
      else if (fileEl!.textContent !== r.file) body!.scrollTop = 0;
      fileEl!.textContent = r.file;
      countEl!.textContent = `${index + 1} / ${SCENE_IDS.length}`;
      statEl!.textContent = r.stat;
    }

    const newest = revealCount(progress, section.items.length) - 1;
    for (const s of sections)
      s.items.forEach((item, i) =>
        item.classList.toggle('term-active', s === section && i === newest),
      );

    dockLabel!.textContent =
      (mode === 'closed' ? `${data.labels.dockClosed} · ` : '') +
      renderScene(data, section.id, { ...ctx, detail: null }).file;
    if (mode === 'max') caption(section);

    // Only a detail being revealed needs further frames without a scroll event.
    if (open && r.revealed < r.total) schedule();
  }

  function activeItem(section: Section): HTMLElement | null {
    return (
      section.el.querySelector<HTMLElement>('[data-scene-item]:has(details[open])') ??
      section.el.querySelector<HTMLElement>('.term-active') ??
      section.el.querySelector<HTMLElement>('[data-scene-item]:has(details)')
    );
  }

  function caption(section: Section): void {
    const heading = section.el.querySelector('h1, h2')?.textContent ?? '';
    capTitle!.textContent = heading.replace(/\s+/g, ' ').trim();
    const item =
      section.el.querySelector('[data-scene-item]:has(details[open]) h3') ??
      section.el.querySelector('.term-active h3');
    capSub!.textContent = item?.textContent?.trim() || data.labels.hint;
    if (!capDetail) return;
    const hasDetails = !!section.el.querySelector('[data-scene-item] details');
    capDetail.hidden = !(hasDetails || section.id === 'contact');
    capDetail.textContent =
      section.id === 'contact'
        ? data.labels.showForm
        : detail?.scene === section.id
          ? data.labels.closeDetail
          : data.labels.detail;
  }

  // ---------- window state ----------

  const animate = (el: HTMLElement, keyframes: Keyframe[], duration: number) =>
    reduce
      ? Promise.resolve()
      : el
          .animate(keyframes, { duration, easing: EASING })
          .finished.then(() => undefined)
          .catch(() => undefined);

  const towardsDock = () => {
    const r = win.getBoundingClientRect();
    const x = window.innerWidth - 60 - r.left - r.width / 2;
    const y = window.innerHeight - 40 - r.top - r.height / 2;
    return `translate(${x}px, ${y}px) scale(.06)`;
  };

  /** Switches the layout and keeps the section the visitor is reading where it was. */
  function apply(next: Mode): void {
    const anchor = sections[active]!.el;
    const before = anchor.getBoundingClientRect().top;
    mode = next;
    root.dataset.term = next;
    saveMode(storage, next);
    const shift = anchor.getBoundingClientRect().top - before;
    if (shift) window.scrollBy({ top: shift, behavior: 'instant' });
    lastKey = '';
    schedule();
  }

  async function act(action: Action): Promise<void> {
    const next = transition(mode, action);
    if (next === mode || busy) return;
    const prev = mode;
    // Only hiding waits for its animation before the layout changes; the other animations run
    // after the switch, so a key press during them (Escape right after maximising) still counts.
    busy = next === 'min' || next === 'closed';
    try {
      if (next === 'min' || next === 'closed') {
        if (prev === 'max') apply('open');
        await animate(
          win,
          next === 'min'
            ? [
                { transform: 'none', opacity: 1 },
                { transform: towardsDock(), opacity: 0.3 },
              ]
            : [
                { transform: 'none', opacity: 1 },
                { transform: 'scale(.92)', opacity: 0 },
              ],
          next === 'min' ? 420 : 180,
        );
        apply(next);
        dock!.focus();
      } else if (prev === 'min' || prev === 'closed') {
        apply(next);
        maxButton?.focus({ preventScroll: true });
        await animate(
          win,
          [
            { transform: towardsDock(), opacity: 0.3 },
            { transform: 'none', opacity: 1 },
          ],
          420,
        );
      } else {
        // open <-> max: animate from the old box to the new one.
        const a = win.getBoundingClientRect();
        apply(next);
        const b = win.getBoundingClientRect();
        maxButton?.focus({ preventScroll: true });
        await animate(
          win,
          [
            {
              transformOrigin: 'top left',
              transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`,
            },
            { transformOrigin: 'top left', transform: 'none' },
          ],
          320,
        );
      }
    } finally {
      busy = false;
    }
  }

  function jump(delta: number): void {
    const target = sections[Math.max(0, Math.min(sections.length - 1, active + delta))]!;
    const r = target.el.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + r.top + r.height * 0.82 - window.innerHeight * 0.55,
      behavior: reduce ? 'instant' : 'smooth',
    });
  }

  q('[data-term-close]')?.addEventListener('click', () => void act('close'));
  q('[data-term-min]')?.addEventListener('click', () => void act('minimize'));
  maxButton?.addEventListener('click', () => void act('toggleMax'));
  dock.addEventListener('click', () => void act('restore'));
  q('[data-term-prev]')?.addEventListener('click', () => jump(-1));
  q('[data-term-next]')?.addEventListener('click', () => jump(1));

  capDetail?.addEventListener('click', () => {
    const section = sections[active]!;
    if (section.id === 'contact') {
      void act('toggleMax').then(() => form?.querySelector<HTMLElement>('input')?.focus());
      return;
    }
    const details = activeItem(section)?.querySelector('details');
    if (details) details.open = !details.open;
  });

  document.addEventListener('keydown', (e) => {
    if (mode !== 'max') return;
    if (e.key === 'Escape') {
      void act('escape');
      return;
    }
    if (e.key !== 'Tab') return;
    // Maximised covers the page, so focus stays inside the window.
    const focusable = [
      ...win.querySelectorAll<HTMLElement>('button:not([hidden]), [tabindex="0"]'),
    ].filter((el) => el.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    const current = document.activeElement;
    if (!win.contains(current)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && current === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && current === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // ---------- inputs that change the scene ----------

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);

  // `toggle` does not bubble, hence capture.
  document.addEventListener(
    'toggle',
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLDetailsElement)) return;
      const slug = el.closest<HTMLElement>('[data-scene-item]')?.dataset.sceneItem;
      const scene = sections.find((s) => s.el.contains(el))?.id;
      if (!slug || !scene) return;
      if (el.open) detail = { scene, slug, t0: performance.now() };
      else if (detail?.slug === slug) detail = null;
      schedule();
    },
    true,
  );

  body.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-fold]');
    if (!row) return;
    const index = Number(row.dataset.fold);
    openFold = openFold === index ? null : index;
    schedule();
  });

  if (form) {
    const edited = () => {
      sentForm = null;
      schedule();
    };
    form.addEventListener('input', edited);
    form.addEventListener('change', edited);
    // Dispatched by contact-form.ts before it resets the fields.
    form.addEventListener('contact:sent', () => {
      sentForm = readForm();
      schedule();
    });
  }

  if (header && 'ResizeObserver' in window) {
    new ResizeObserver(() => {
      root.style.setProperty('--term-header', `${header.offsetHeight}px`);
      schedule();
    }).observe(header);
  }

  if (!reduce) {
    const total = renderScene(data, 'profile', {
      progress: 1,
      typedChars: Infinity,
      openFold: null,
      form: readForm(),
      sent: false,
      detail: null,
    }).total;
    const timer = window.setInterval(() => {
      typedChars += TYPE_CHARS_PER_TICK;
      if (typedChars >= total) {
        typedChars = Infinity;
        window.clearInterval(timer);
      }
      schedule();
    }, TYPE_TICK_MS);
  }

  schedule();
}

const el = document.querySelector<HTMLElement>('[data-term-window]');
if (el) init(el);

export {};
