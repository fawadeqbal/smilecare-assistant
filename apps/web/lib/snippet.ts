const PUBLIC_API = (process.env.NEXT_PUBLIC_API_PUBLIC_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/** The one-line embed code a client pastes into their website. */
export function installSnippet(widgetKey: string): string {
  return `<script src="${PUBLIC_API}/widget.js" data-widget-key="${widgetKey}" defer></script>`;
}
