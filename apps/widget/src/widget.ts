import type { ChatMessage, ChatStreamEvent, PublicBookingSummary, WidgetConfig } from '@smilecare/shared';
import { ApiError, WidgetApi } from './api';
import { escapeHtml, renderMessage } from './format';
import { createStore } from './storage';
import { styles } from './styles';

export interface WidgetOptions {
  apiUrl: string;
  widgetKey: string;
  position: 'left' | 'right';
  openOnLoad: boolean;
}

const ICONS = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
};

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
    this.applyTheme(this.config.brandColor);
    this.render();
    document.body.appendChild(this.host);
    this.markMounted(true);
    if (this.options.openOnLoad) void this.open();
  }

  async open(): Promise<void> {
    if (!this.panel) return;
    this.panel.hidden = false;
    this.launcher.setAttribute('aria-expanded', 'true');
    this.launcher.innerHTML = ICONS.close;
    this.launcher.setAttribute('aria-label', 'Close chat');
    if (!this.historyLoaded) await this.loadHistory();
    setTimeout(() => this.input.focus(), 50);
  }

  close(): void {
    if (!this.panel) return;
    this.panel.hidden = true;
    this.launcher.setAttribute('aria-expanded', 'false');
    this.launcher.innerHTML = ICONS.chat;
    this.launcher.setAttribute('aria-label', 'Open chat');
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

    this.launcher = el('button', { class: 'launcher', 'aria-label': 'Open chat', 'aria-expanded': 'false' }) as HTMLButtonElement;
    this.launcher.innerHTML = ICONS.chat;
    this.launcher.addEventListener('click', () => this.toggle());

    this.panel = el('section', { class: 'panel', role: 'dialog', 'aria-label': `Chat with ${c.botName}` });
    this.panel.hidden = true;
    this.panel.innerHTML = `
      <header class="header">
        <div class="avatar" aria-hidden="true">${escapeHtml(c.botName.charAt(0).toUpperCase())}</div>
        <div class="title"><strong>${escapeHtml(c.botName)}</strong><span>${escapeHtml(c.businessName)} · Online</span></div>
        <button class="icon-btn" data-action="restart" aria-label="Start a new conversation" title="New conversation">${ICONS.restart}</button>
        <button class="icon-btn" data-action="close" aria-label="Close chat">${ICONS.close}</button>
      </header>
      <div class="messages" role="log" aria-live="polite"></div>
      <div class="chips"></div>
      <form class="composer">
        <textarea rows="1" maxlength="2000" placeholder="Type your message…" aria-label="Message"></textarea>
        <button class="send" type="submit" aria-label="Send message" disabled>${ICONS.send}</button>
      </form>
      <div class="footer">AI assistant · may make mistakes</div>`;

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

    this.root.append(style, this.panel, this.launcher);
  }

  private async loadHistory() {
    this.historyLoaded = true;
    this.list.innerHTML = '';
    this.addBot(this.config!.welcomeMessage);

    const existing = this.store.sessionId();
    if (existing) {
      try {
        const history = await this.api.getHistory(existing);
        this.sessionId = existing;
        history.messages.forEach((m: ChatMessage) => (m.role === 'user' ? this.addUser(m.content) : m.role === 'assistant' && this.addBot(m.content)));
        if (history.status === 'handed_off') this.addNotice('Our team has been notified and will contact you shortly.');
      } catch {
        this.store.setSessionId(null);
      }
    }
    this.renderChips();
  }

  private renderChips() {
    const hasUserMessages = !!this.list.querySelector('.msg.user');
    this.chips.innerHTML = '';
    if (hasUserMessages) return;
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
    bubble.innerHTML = '<span class="typing" aria-label="Assistant is typing"><i></i><i></i><i></i></span>';
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
            case 'error':
              throw new Error(event.message);
          }
        },
        this.abort.signal,
      );
      if (!reply) bubble.remove();
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      if (!reply) bubble.remove();
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
    const node = el('div', { class: 'msg user' });
    node.textContent = text;
    this.list.appendChild(node);
    this.scroll();
  }

  private addBot(text: string): HTMLElement {
    const node = el('div', { class: 'msg bot' });
    node.innerHTML = renderMessage(text);
    this.list.appendChild(node);
    this.scroll();
    return node;
  }

  private addNotice(text: string) {
    const node = el('div', { class: 'notice' });
    node.textContent = text;
    this.list.appendChild(node);
    this.scroll();
  }

  private addError(text: string) {
    const node = el('div', { class: 'msg error', role: 'alert' });
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
    node.innerHTML = `<div class="label">Appointment requested</div><dl>${rows
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
    const ink = readableInk(color);
    this.host.style.setProperty('--brand', color);
    this.host.style.setProperty('--brand-ink', ink);
  }
}

function el(tag: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
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
