import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

export async function renderToHtml(
  Component: AstroComponentFactory,
  props: Record<string, unknown> = {},
  slots?: Record<string, string>,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Component, { props, slots });
}
