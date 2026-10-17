/**
 * Styles live inside the Shadow DOM, so host-page CSS can't leak in and ours can't leak out.
 * Visual language: SmileCare design system 2.0 ("Bright & friendly"). --brand comes from
 * the business's settings; coral and the neutrals are fixed.
 */
export const styles = /* css */ `
:host {
  --brand: #0A66F0;
  --brand-ink: #ffffff;
  --brand-soft: color-mix(in srgb, var(--brand) 9%, white);
  --brand-line: color-mix(in srgb, var(--brand) 30%, white);
  --brand-strong: color-mix(in srgb, var(--brand) 80%, black);
  --coral: #FF8A65;
  --ink: #0B1B2E;
  --ink-700: #3A4B63;
  --muted: #51627A;
  --line: #E2E8F0;
  --cloud: #F5F8FC;
  --surface: #ffffff;
  --display: 'Gabarito', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  all: initial;
  position: fixed;
  z-index: 2147483000;
  bottom: 20px;
  right: 20px;
  font-family: 'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: var(--ink);
}
:host([data-position="left"]) { right: auto; left: 20px; }
* { box-sizing: border-box; }
button { font: inherit; cursor: pointer; }
svg { flex: none; }

/* Launcher */
.launcher {
  position: relative;
  width: 64px; height: 64px; border-radius: 50%;
  border: none; background: var(--brand); color: var(--brand-ink);
  display: grid; place-items: center;
  box-shadow: 0 16px 32px -10px color-mix(in srgb, var(--brand) 70%, transparent);
  transition: transform .2s ease, background .2s ease;
}
.launcher:hover { transform: translateY(-2px); background: var(--brand-strong); }
.launcher svg { width: 28px; height: 28px; }
:focus-visible { outline: 3px solid color-mix(in srgb, var(--brand) 45%, white); outline-offset: 3px; }

/* Panel */
.panel {
  position: absolute; bottom: 80px; right: 0;
  width: 400px; height: min(700px, calc(100vh - 120px));
  background: var(--surface); border-radius: 28px;
  box-shadow: 0 4px 8px rgba(11,27,46,0.05), 0 32px 64px -16px rgba(11,27,46,0.28);
  display: flex; flex-direction: column; overflow: hidden;
  transform-origin: bottom right;
  animation: pop .24s cubic-bezier(.2,.9,.3,1.15);
}
:host([data-position="left"]) .panel { right: auto; left: 0; transform-origin: bottom left; }
.panel[hidden] { display: none; }
@keyframes pop { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: none; } }

/* Header */
.header {
  position: relative; overflow: hidden;
  background: var(--brand); color: var(--brand-ink);
  padding: 18px 16px 18px 20px; display: flex; align-items: center; gap: 12px;
}
.header .arc { position: absolute; right: -30px; top: -50px; width: 180px; height: 180px; opacity: .55; }
.avatar { position: relative; width: 44px; height: 44px; border-radius: 50%; background: #fff; display: grid; place-items: center; }
.avatar .online {
  position: absolute; right: 0; bottom: 0; width: 12px; height: 12px; border-radius: 50%;
  background: #2DD4A0; border: 2px solid var(--brand);
}
.title { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; }
.title strong { font-family: var(--display); font-weight: 700; font-size: 19px; line-height: 1.2; }
.title span { font-size: 13px; opacity: .88; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.icon-btn {
  position: relative; width: 44px; height: 44px; border: 0; border-radius: 50%;
  background: transparent; color: inherit; display: grid; place-items: center;
}
.icon-btn:hover { background: rgba(255,255,255,.16); }
.icon-btn.close { background: rgba(255,255,255,.16); }
.icon-btn.close:hover { background: rgba(255,255,255,.26); }
.icon-btn svg { width: 20px; height: 20px; }

/* Conversation */
.messages {
  flex: 1; min-height: 0; overflow-y: auto; background: var(--cloud);
  padding: 20px 16px 12px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth;
}
.day {
  align-self: center; font-size: 12px; font-weight: 600; color: var(--muted);
  background: #fff; padding: 3px 10px; border-radius: 999px;
}
.row { display: flex; gap: 8px; align-items: flex-end; animation: fade .18s ease; }
.row.user { justify-content: flex-end; }
@keyframes fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.bubble { max-width: 290px; padding: 11px 14px; overflow-wrap: anywhere; }
.bubble p { margin: 0; }
.bubble p + p, .bubble p + ul, .bubble ul + p { margin-top: 8px; }
.bubble ul { margin: 0; padding-left: 18px; }
.bubble li + li { margin-top: 2px; }
.bot .bubble { background: #fff; border-radius: 18px 18px 18px 6px; box-shadow: 0 1px 2px rgba(11,27,46,0.06); }
.user .bubble { background: var(--brand); color: var(--brand-ink); border-radius: 18px 18px 6px 18px; max-width: 260px; }
.source {
  display: flex; align-items: center; gap: 6px; margin-top: 8px;
  font-size: 12px; color: var(--muted);
}
.source svg { width: 14px; height: 14px; }
.error {
  align-self: center; max-width: 320px; text-align: center;
  background: #FEECEB; color: #B42318; border-radius: 14px; padding: 8px 12px; font-size: 13.5px;
}

.typing { display: inline-flex; gap: 4px; padding: 4px 2px; }
.typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); opacity: .5; animation: blink 1.2s infinite; }
.typing i:nth-child(2) { animation-delay: .15s; } .typing i:nth-child(3) { animation-delay: .3s; }
@keyframes blink { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: .9; transform: translateY(-3px); } }

/* Appointment card */
.card {
  margin-left: 36px; max-width: 290px; background: #fff; border-radius: 18px; padding: 14px;
  box-shadow: 0 1px 2px rgba(11,27,46,0.06); display: flex; flex-direction: column; gap: 10px;
}
.card .label { display: flex; align-items: center; gap: 8px; font-family: var(--display); font-weight: 700; font-size: 16px; }
.card .label span {
  width: 32px; height: 32px; border-radius: 10px; background: #FFF3EE; color: #E5603B; display: grid; place-items: center;
}
.card .label svg { width: 18px; height: 18px; }
.card dl {
  margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px;
  background: var(--brand-soft); border-radius: 12px; padding: 10px 12px; font-size: 14px;
}
.card dt { color: var(--muted); } .card dd { margin: 0; font-weight: 600; }
.card .note { font-size: 12px; color: var(--muted); }
.notice {
  align-self: center; display: flex; align-items: center; gap: 8px; text-align: left;
  font-size: 13px; font-weight: 600; color: #9A3412; background: #FFE2D6;
  border-radius: 14px; padding: 8px 12px; max-width: 320px;
}
.notice svg { width: 16px; height: 16px; }

/* Quick replies */
.chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 12px 52px; background: var(--cloud); }
.chips:empty { display: none; }
.chip {
  height: 40px; padding: 0 14px; border-radius: 999px; font-size: 14px; font-weight: 600;
  background: #fff; color: var(--brand-strong); border: 1.5px solid var(--brand-line);
  transition: background .15s;
}
.chip:hover { background: var(--brand-soft); }

/* Composer */
.composer { border-top: 1px solid var(--line); padding: 12px 14px 10px; background: #fff; display: flex; flex-direction: column; gap: 8px; }
.field {
  display: flex; align-items: flex-end; gap: 8px; background: var(--cloud);
  border: 1.5px solid var(--line); border-radius: 24px; padding: 4px 4px 4px 16px;
  transition: border-color .15s, box-shadow .15s;
}
.field:focus-within { border-color: var(--brand); box-shadow: 0 0 0 4px var(--brand-soft); }
.field textarea {
  flex: 1; min-width: 0; resize: none; border: 0; outline: none; background: transparent;
  font: inherit; font-size: 15px; color: var(--ink); padding: 11px 0; max-height: 120px; line-height: 1.45;
}
.field textarea::placeholder { color: var(--muted); }
.send {
  flex: none; width: 44px; height: 44px; border: 0; border-radius: 50%;
  background: var(--brand); color: var(--brand-ink); display: grid; place-items: center; transition: opacity .15s;
}
.send:disabled { opacity: .45; cursor: default; }
.send svg { width: 18px; height: 18px; }
.footer { text-align: center; font-size: 12px; color: var(--muted); }

@media (max-width: 480px) {
  :host { bottom: 16px; right: 16px; }
  .panel { position: fixed; inset: 0; width: 100vw; height: 100dvh; border-radius: 0; bottom: 0; }
  /* Full-screen on phones: the header's close button takes over, so the launcher would only cover the composer. */
  .launcher[aria-expanded="true"] { display: none; }
}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;
