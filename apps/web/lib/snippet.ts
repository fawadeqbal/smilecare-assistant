/** Public base URL of the API, as visitors' browsers reach it. */
export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_PUBLIC_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/** The widget key of the demo clinic, used by its website's own forms and the embed. */
export const DEMO_WIDGET_KEY = process.env.NEXT_PUBLIC_WIDGET_KEY ?? 'pk_demo_smilecare';

/** The one-line embed code a client pastes into their website. */
export function installSnippet(widgetKey: string): string {
  return `<script src="${PUBLIC_API_URL}/widget.js" data-widget-key="${widgetKey}" defer></script>`;
}
