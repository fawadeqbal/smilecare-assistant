import { ChatWidget } from './widget';

/**
 * Entry point. Install on any site with:
 *
 *   <script src="https://api.example.com/widget.js" data-widget-key="pk_..." defer></script>
 *
 * Optional attributes:
 *   data-api-url   API origin (defaults to the origin the script was loaded from)
 *   data-position  "right" (default) or "left"
 *   data-open      "true" to open the chat on page load
 *   data-fonts     "system" to skip loading the brand font (Onest) from Google Fonts
 *   data-greeting  "off" to hide the greeting bubble shown next to the launcher
 *
 * Programmatic control: window.SmileCareWidget.open() / .close() / .toggle() / .ask(question)
 * A `smilecare:ready` event fires on window once the API is available.
 */
declare global {
  interface Window {
    SmileCareWidget?: Pick<ChatWidget, 'open' | 'close' | 'toggle' | 'ask'>;
  }
}

function init() {
  const script =
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>('script[data-widget-key]');
  const widgetKey = script?.dataset.widgetKey;
  if (!script || !widgetKey) {
    console.warn('[SmileCare] Missing data-widget-key on the widget script tag.');
    return;
  }
  if (window.SmileCareWidget) return; // already loaded

  const apiUrl = (script.dataset.apiUrl || new URL(script.src, location.href).origin).replace(/\/$/, '');
  const widget = new ChatWidget({
    apiUrl,
    widgetKey,
    position: script.dataset.position === 'left' ? 'left' : 'right',
    openOnLoad: script.dataset.open === 'true',
    brandFonts: script.dataset.fonts !== 'system',
    greeting: script.dataset.greeting !== 'off',
  });
  window.SmileCareWidget = {
    open: () => widget.open(),
    close: () => widget.close(),
    toggle: () => widget.toggle(),
    ask: (question: string) => widget.ask(question),
  };
  window.dispatchEvent(new CustomEvent('smilecare:ready'));

  const start = () => void widget.mount();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}

init();
