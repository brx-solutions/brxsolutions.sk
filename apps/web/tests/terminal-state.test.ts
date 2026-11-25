import { describe, it, expect } from 'vitest';
import {
  transition,
  parseStored,
  toStore,
  loadMode,
  saveMode,
  STORAGE_KEY,
  type Mode,
  type Action,
} from '../src/terminal/state';

describe('terminal window state', () => {
  it.each<[Mode, Action, Mode]>([
    ['open', 'close', 'closed'],
    ['open', 'minimize', 'min'],
    ['open', 'toggleMax', 'max'],
    ['max', 'toggleMax', 'open'],
    ['max', 'escape', 'open'],
    ['max', 'close', 'closed'],
    ['max', 'minimize', 'min'],
    ['min', 'restore', 'open'],
    ['closed', 'restore', 'open'],
    ['open', 'escape', 'open'],
    ['min', 'escape', 'min'],
    ['open', 'restore', 'open'],
  ])('%s + %s → %s', (mode, action, expected) => {
    expect(transition(mode, action)).toBe(expected);
  });

  it('unknown stored values fall back to open', () => {
    for (const raw of [null, '', 'max', 'OPEN', '{"a":1}']) expect(parseStored(raw)).toBe('open');
    expect(parseStored('min')).toBe('min');
    expect(parseStored('closed')).toBe('closed');
  });

  it('max is stored as open', () => {
    expect(toStore('max')).toBe('open');
    expect(toStore('min')).toBe('min');
  });

  it('saves under one key and reads it back', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    };
    saveMode(storage, 'closed');
    expect(map.get(STORAGE_KEY)).toBe('closed');
    expect(loadMode(storage)).toBe('closed');
    saveMode(storage, 'max');
    expect(loadMode(storage)).toBe('open');
  });

  it('storage that throws is ignored', () => {
    const broken = {
      getItem(): string {
        throw new Error('denied');
      },
      setItem(): void {
        throw new Error('denied');
      },
    };
    expect(loadMode(broken)).toBe('open');
    expect(() => saveMode(broken, 'min')).not.toThrow();
    expect(loadMode(null)).toBe('open');
    expect(() => saveMode(null, 'min')).not.toThrow();
  });
});
