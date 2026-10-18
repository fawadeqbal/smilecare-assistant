import type { ChatMessage, ChatStreamEvent, MessageSource, PublicBookingSummary, WidgetConfig } from '@smilecare/shared';
import { ApiError, WidgetApi } from './api';
import { escapeHtml, renderMessage } from './format';
import { createStore } from './storage';
import { styles } from './styles';

export interface WidgetOptions {
  apiUrl: string;
  widgetKey: string;
  position: 'left' | 'right';
  openOnLoad: boolean;
  /** Load the brand font (Onest) from Google Fonts. Off = system fonts only. */
  brandFonts: boolean;
  /** Show a small greeting bubble next to the launcher until the visitor first opens the chat. */
  greeting: boolean;
}

const stroke = (paths: string, width = 2) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS = {
  close: stroke('<path d="M6 6l12 12M18 6L6 18"/>', 2.2),
  minimise: stroke('<path d="M6 9l6 6 6-6"/>', 2.2),
  file: stroke('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
  check: stroke('<path d="M5 12l5 5 9-10"/>', 2.8),
  send: stroke('<path d="M12 19V5M6 11l6-6 6 6"/>', 2.2),
  restart: stroke('<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5"/>'),
  person: stroke('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
};

/** Sunny's face: a smile and two eyes. `light` = brand face on white. */
const sunny = (size: number, light = false) => {
  const face = light ? 'var(--brand)' : 'var(--brand-ink)';
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="${light ? '#FFFFFF' : 'var(--brand)'}"/><path d="M11 19 Q20 29 29 19" stroke="${face}" stroke-width="3.6" fill="none" stroke-linecap="round"/><circle cx="14" cy="13.5" r="2" fill="${face}"/><circle cx="26" cy="13.5" r="2" fill="${face}"/></svg>`;
};

/** Launcher face: the smile and eyes with the aqua spark, no circle (the button is the circle). */
const LAUNCHER_FACE =
  '<svg class="face" viewBox="0 0 40 40" aria-hidden="true"><path d="M11 19 Q20 29 29 19" stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="14" cy="13.5" r="2" fill="currentColor"/><circle cx="26" cy="13.5" r="2" fill="currentColor"/><path d="M32 4l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" fill="#2FE0C8"/></svg>';
const LAUNCHER_CLOSE = ICONS.close.replace('<svg ', '<svg class="x" ');

const ARC = '<svg class="arc" aria-hidden="true" viewBox="0 0 200 200"><path d="M30 80 Q100 170 170 80" stroke="#1B2340" stroke-width="22" fill="none" stroke-linecap="round"/></svg>';

/** The chat widget UI. All DOM lives in a closed Shadow root on a single host element. */
export class ChatWidget {
  private readonly host: HTMLElement;
  private readonly root: ShadowRoot;
  private readonly api: WidgetApi;
  private readonly store: ReturnType<typeof createStore>;

  private config: WidgetConfig | null = null;
  private sessionId: string | null = null;
  private busy = false;
  private historyLoaded = false;
  private abort: AbortController | null = null;
  private markMounted!: (ok: boolean) => void;
  private readonly mounted = new Promise<boolean>((resolve) => (this.markMounted = resolve));

  private panel!: HTMLElement;
  private launcher!: HTMLButtonElement;
  private greeting: HTMLButtonElement | null = null;
  private list!: HTMLElement;
  private chips!: HTMLElement;
  private input!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;

  constructor(private readonly options: WidgetOptions) {
    this.store = createStore(options.widgetKey);
    this.api = new WidgetApi(options.apiUrl, options.widgetKey, this.store.visitorId());
    this.host = document.createElement('div');
    this.host.setAttribute('data-smilecare-widget', '');
    this.host.dataset.position = options.position;
    this.root = this.host.attachShadow({ mode: 'closed' });
  }

  async mount(): Promise<void> {
    try {
      this.config = await this.api.getConfig();
    } catch (err) {
      console.warn('[SmileCare] Widget disabled: could not load configuration.', err);
      this.markMounted(false);
      return;
    }
    if (this.options.brandFonts) loadBrandFonts();
    this.applyTheme(this.config.brandColor);
    this.render();
    document.body.appendChild(this.host);
    this.markMounted(true);
    if (this.options.openOnLoad) void this.open();
  }

  async open(): Promise<void> {
    if (!this.panel) return;
    this.panel.hidden = false;
    this.dismissGreeting();
    this.launcher.setAttribute('aria-expanded', 'true');
    this.launcher.innerHTML = LAUNCHER_CLOSE;
    this.launcher.setAttribute('aria-label', `Close chat with ${this.config!.botName}`);
    if (!this.historyLoaded) await this.loadHistory();
    setTimeout(() => this.input.focus(), 50);
  }

  close(): void {
    if (!this.panel) return;
    this.panel.hidden = true;
    this.launcher.setAttribute('aria-expanded', 'false');
    this.launcher.innerHTML = LAUNCHER_FACE;
    this.launcher.setAttribute('aria-label', `Chat with ${this.config!.botName}`);
  }

  /** Opens the chat and sends a question on the visitor's behalf (e.g. from a search box on the host page). */
  async ask(question: string): Promise<void> {
    if (!(await this.mounted)) return;
    await this.open();
    await this.submit(question);
  }

  toggle(): void {
    if (this.panel?.hidden) void this.open();
    else this.close();
  }

  // ---------------------------------------------------------------------------

  private render() {
    const c = this.config!;
    const style = document.createElement('style');
    style.textContent = styles;

    this.launcher = el('button', { class: 'launcher', 'aria-label': `Chat with ${c.botName}`, 'aria-expanded': 'false' }) as HTMLButtonElement;
    this.launcher.innerHTML = LAUNCHER_FACE;
    this.launcher.addEventListener('click', () => this.toggle());

    const dock = el('div', { class: 'dock' });
    if (this.options.greeting && !this.store.greeted()) {
      this.greeting = el('button', { class: 'greeting', type: 'button', 'aria-label': `Chat with ${c.botName}: have a question? I can help.` }) as HTMLButtonElement;
      this.greeting.innerHTML = '<strong>Hi there!</strong> Have a question about prices or insurance? I can help.';
      this.greeting.hidden = true;
      this.greeting.addEventListener('click', () => void this.open());
      setTimeout(() => {
        if (this.greeting && this.panel.hidden) this.greeting.hidden = false;
      }, 1500);
      dock.appendChild(this.greeting);
    }
    dock.appendChild(this.launcher);

    this.panel = el('section', { class: 'panel', role: 'dialog', 'aria-label': `Chat with ${c.botName}` });
    this.panel.hidden = true;
    this.panel.innerHTML = `
      <header class="header">
        ${ARC}
        <span class="avatar">${sunny(44, true)}<span class="online" aria-hidden="true"></span></span>
        <div class="title"><strong>${escapeHtml(c.botName)}</strong><span>${escapeHtml(c.businessName)} · replies instantly</span></div>
        <button type="button" class="icon-btn" data-action="restart" aria-label="Start a new conversation" title="New conversation">${ICONS.restart}</button>
        <button type="button" class="icon-btn close" data-action="close" aria-label="Minimise chat">${ICONS.minimise}</button>
      </header>
      <div class="messages" role="log" aria-live="polite"></div>
      <div class="chips"></div>
      <form class="composer">
        <div class="field">
          <textarea rows="1" maxlength="2000" placeholder="Ask about prices, hours, insurance…" aria-label="Type your message"></textarea>
          <button class="send" type="submit" aria-label="Send message" disabled>${ICONS.send}</button>
        </div>
        <div class="footer">AI assistant · may make mistakes</div>
      </form>`;

    this.list = this.panel.querySelector('.messages')!;
    this.chips = this.panel.querySelector('.chips')!;
    this.input = this.panel.querySelector('textarea')!;
    this.sendBtn = this.panel.querySelector('.send')!;

    this.panel.querySelector('[data-action="close"]')!.addEventListener('click', () => this.close());
    this.panel.querySelector('[data-action="restart"]')!.addEventListener('click', () => void this.restart());
    this.panel.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      void this.submit();
    });
    this.input.addEventListener('input', () => {
      this.sendBtn.disabled = this.busy || !this.input.value.trim();
      this.input.style.height = 'auto';
      this.input.style.height = `${Math.min(this.input.scrollHeight, 120)}px`;
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void this.submit();
      }
    });
    this.panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    this.root.append(style, this.panel, dock);
  }

  private dismissGreeting() {
    if (!this.greeting) return;
    this.greeting.remove();
    this.greeting = null;
    this.store.setGreeted();
  }

  private async loadHistory() {
    this.historyLoaded = true;
    this.list.innerHTML = '<span class="day">Today</span>';
    this.addBot(this.config!.welcomeMessage);

    const existing = this.store.sessionId();
    if (existing) {
      try {
        const history = await this.api.getHistory(existing);
        this.sessionId = existing;
        history.messages.forEach((m: ChatMessage) => {
          if (m.role === 'user') this.addUser(m.content);
          else if (m.role === 'assistant') this.addSources(this.addBot(m.content), m.sources);
        });
        if (history.status === 'handed_off') this.addNotice('Our team has been notified and will contact you shortly.');
      } catch {
        this.store.setSessionId(null);
      }
    }
    this.renderChips();
  }

  private renderChips() {
    this.chips.innerHTML = '';
    if (this.list.querySelector('.row.user')) return;
    for (const q of this.config!.suggestedQuestions) {
      const chip = el('button', { class: 'chip', type: 'button' });
      chip.textContent = q;
      chip.addEventListener('click', () => void this.submit(q));
      this.chips.appendChild(chip);
    }
  }

  private async restart() {
    this.abort?.abort();
    this.store.setSessionId(null);
    this.sessionId = null;
    this.historyLoaded = false;
    this.setBusy(false);
    await this.loadHistory();
    this.input.focus();
  }

  private async ensureSession(): Promise<string> {
    if (this.sessionId) return this.sessionId;
    const { sessionId } = await this.api.startSession();
    this.sessionId = sessionId;
    this.store.setSessionId(sessionId);
    return sessionId;
  }

  private async submit(preset?: string) {
    const text = (preset ?? this.input.value).trim();
    if (!text || this.busy) return;

    this.input.value = '';
    this.input.style.height = 'auto';
    this.chips.innerHTML = '';
    this.addUser(text);
    this.setBusy(true);

    const bubble = this.addBot('');
    bubble.innerHTML = '<span class="typing" aria-label="Sunny is typing"><i></i><i></i><i></i></span>';
    let reply = '';
    this.abort = new AbortController();

    try {
      const sessionId = await this.ensureSession();
      await this.api.sendMessage(
        sessionId,
        text,
        (event: ChatStreamEvent) => {
          switch (event.type) {
            case 'delta':
              reply += event.text;
              bubble.innerHTML = renderMessage(reply);
              this.scroll();
              break;
            case 'booking':
              this.addBookingCard(event.booking);
              break;
            case 'handoff':
              this.addNotice(event.message);
              break;
            case 'done':
              if (reply) this.addSources(bubble, event.sources);
              break;
            case 'error':
              throw new Error(event.message);
          }
        },
        this.abort.signal,
      );
      if (!reply) bubble.closest('.row')?.remove();
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      if (!reply) bubble.closest('.row')?.remove();
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
        // Session expired or closed: start fresh on the next message.
        this.store.setSessionId(null);
        this.sessionId = null;
      }
      this.addError(
        err instanceof ApiError && err.status === 429
          ? "You're sending messages quickly. Please wait a moment and try again."
          : (err as Error).message || 'Something went wrong. Please try again.',
      );
    } finally {
      this.abort = null;
      this.setBusy(false);
    }
  }

  private setBusy(busy: boolean) {
    this.busy = busy;
    this.sendBtn.disabled = busy || !this.input.value.trim();
  }

  private addUser(text: string) {
    const row = el('div', { class: 'row user' });
    const bubble = el('div', { class: 'bubble' });
    bubble.textContent = text;
    row.appendChild(bubble);
    this.list.appendChild(row);
    this.scroll();
  }

  /** Adds a Sunny message and returns its bubble element. */
  private addBot(text: string): HTMLElement {
    const row = el('div', { class: 'row bot' });
    row.innerHTML = sunny(28);
    const bubble = el('div', { class: 'bubble' });
    bubble.innerHTML = renderMessage(text);
    row.appendChild(bubble);
    this.list.appendChild(row);
    this.scroll();
    return bubble;
  }

  /** "From: Services and Prices" under an answer, so visitors see it came from the clinic's own documents. */
  private addSources(bubble: HTMLElement, sources: MessageSource[]) {
    const titles = Array.from(new Set(sources.map((s) => s.documentTitle))).slice(0, 2);
    if (!titles.length) return;
    const line = el('span', { class: 'source' });
    line.innerHTML = `${ICONS.file}From: ${titles.map(escapeHtml).join(', ')}`;
    bubble.appendChild(line);
  }

  private addNotice(text: string) {
    const node = el('div', { class: 'notice', role: 'status' });
    node.innerHTML = `<span class="tile">${ICONS.person}</span><span>${escapeHtml(text)}</span>`;
    this.list.appendChild(node);
    this.scroll();
  }

  private addError(text: string) {
    const node = el('div', { class: 'error', role: 'alert' });
    node.textContent = text;
    this.list.appendChild(node);
    this.scroll();
  }

  private addBookingCard(b: PublicBookingSummary) {
    const node = el('div', { class: 'card' });
    const rows: Array<[string, string | null]> = [
      ['Name', b.patientName],
      ['Service', b.service],
      ['When', b.preferredTime],
      ['Reference', b.id.slice(0, 8).toUpperCase()],
    ];
    node.innerHTML = `<div class="label"><span class="tile">${ICONS.check}</span><span><strong>Request sent.</strong> The team will call you to confirm the exact time.</span></div><dl>${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v!)}</dd>`)
      .join('')}</dl>`;
    this.list.appendChild(node);
    this.scroll();
  }

  private scroll() {
    this.list.scrollTop = this.list.scrollHeight;
  }

  private applyTheme(color: string) {
    this.host.style.setProperty('--brand', color);
    this.host.style.setProperty('--brand-ink', readableInk(color));
  }
}

function el(tag: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/** Fonts declared in the host document's <head> are available inside the shadow root. */
function loadBrandFonts() {
  if (document.querySelector('link[data-smilecare-fonts]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap';
  link.setAttribute('data-smilecare-fonts', '');
  document.head.appendChild(link);
}

/** Picks black or white text for the brand color using WCAG relative luminance. */
function readableInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? '#111111' : '#ffffff';
}
