/** One scene per home page section, in page order. */
export const SCENE_IDS = [
  'profile',
  'stats',
  'services',
  'stack',
  'experience',
  'projects',
  'own',
  'process',
  'strengths',
  'contact',
] as const;

export type SceneId = (typeof SCENE_IDS)[number];

export interface TerminalLabels {
  aside: string;
  close: string;
  minimize: string;
  maximize: string;
  dock: string;
  /** Prefix in the dock button when the window was closed, e.g. 'otvoriť'. */
  dockClosed: string;
  prev: string;
  next: string;
  detail: string;
  closeDetail: string;
  showForm: string;
  /** Caption subtitle when no item is active. */
  hint: string;
  /** Comment in stack.ts telling the visitor rows can be unfolded. */
  foldHint: string;
  problem: string;
  result: string;
  /** Status bar text once a scene is complete. */
  done: Record<SceneId, string>;
}

export interface TerminalData {
  labels: TerminalLabels;
  profile: {
    name: string;
    company: string;
    focus: string[];
    stack: string[];
    since: number;
    remote: boolean;
  };
  stats: string[];
  services: { ident: string; dir: string; title: string }[];
  stack: { name: string; items: string[] }[];
  commits: { hash: string; year: string; message: string }[];
  tests: {
    slug: string;
    metric: string;
    label: string;
    detail: { heading: string; text: string }[];
  }[];
  containers: {
    slug: string;
    status: string;
    tags: string[];
    detail: { title: string; tech: string };
  }[];
  jobs: { id: string; title: string; desc: string }[];
  strengths: string[];
  contact: { path: string };
}
