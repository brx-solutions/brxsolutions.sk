export type Mode = 'open' | 'min' | 'closed' | 'max';
export type StoredMode = Exclude<Mode, 'max'>;
export type Action = 'close' | 'minimize' | 'toggleMax' | 'restore' | 'escape';

export const STORAGE_KEY = 'brx-term';

export function transition(mode: Mode, action: Action): Mode {
  const shown = mode === 'open' || mode === 'max';
  switch (action) {
    case 'close':
      return shown ? 'closed' : mode;
    case 'minimize':
      return shown ? 'min' : mode;
    case 'toggleMax':
      return mode === 'max' ? 'open' : mode === 'open' ? 'max' : mode;
    case 'restore':
      return shown ? mode : 'open';
    case 'escape':
      return mode === 'max' ? 'open' : mode;
  }
}

/** Anything that is not a known stored value means a first visit: the window is open. */
export function parseStored(raw: string | null): StoredMode {
  return raw === 'min' || raw === 'closed' ? raw : 'open';
}

/** Maximised is never remembered; a reload returns to the normal window. */
export function toStore(mode: Mode): StoredMode {
  return mode === 'max' ? 'open' : mode;
}

/** Storage can be missing or throw (private mode, blocked site data); the window still works. */
export function loadMode(storage: Pick<Storage, 'getItem'> | null): StoredMode {
  try {
    return parseStored(storage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return 'open';
  }
}

export function saveMode(storage: Pick<Storage, 'setItem'> | null, mode: Mode): void {
  try {
    storage?.setItem(STORAGE_KEY, toStore(mode));
  } catch {
    // Not remembered; nothing else depends on it.
  }
}
