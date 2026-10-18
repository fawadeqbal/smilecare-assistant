/**
 * Styles live inside the Shadow DOM, so host-page CSS can't leak in and ours can't leak out.
 * Visual language: SmileCare design system 3.0 ("Night & Glow"). --brand comes from the
 * business's settings and drives the actions and the header glow; Night, aqua and the
 * neutrals are fixed.
 */
export const styles = /* css */ `
:host {
  --brand: #3355FF;
  --brand-ink: #ffffff;
  --brand-soft: color-mix(in srgb, var(--brand) 9%, white);
  --brand-line: color-mix(in srgb, var(--brand) 30%, white);
  --brand-muted: color-mix(in srgb, var(--brand) 50%, white);
  --brand-strong: color-mix(in srgb, var(--brand) 82%, black);
  --brand-glow: color-mix(in srgb, var(--brand) 70%, transparent);
  --night: #0A0F24;
  --night-900: #0B1020;
  --night-800: #1B2340;
  --night-700: #262E48;
  --aqua: #2FE0C8;
  --ink: #0B1020;
  --muted: #59627E;
  --line: #E4E7F0;
  --line-strong: #CDD2E1;
  --pearl: #F5F7FB;
  --surface: #ffffff;
  all: initial;
  position: fixed;
  z-index: 2147483000;
  bottom: 20px;
  right: 20px;
  font-family: 'Onest', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: var(--ink);
}
:host([data-position="left"]) { right: auto; left: 20px; }
* { box-sizing: border-box; }
button { font: inherit; cursor: pointer; }
svg { flex: none; }
:focus-visible { outline: 3px solid #9AABFF; outline-offset: 2px; }

/* Launcher and its greeting */
.dock { display: flex; align-items: flex-end; justify-content: flex-end; gap: 12px; }
:host([data-position="left"]) .dock { flex-direction: row-reverse; }
.launcher {
  position: relative;
  width: 64px; height: 64px; border-radius: 50%;
  border: none; background: var(--brand); color: var(--brand-ink);
  display: grid; place-items: center;
  box-shadow: 0 16px 36px -10px color-mix(in srgb, var(--brand) 80%, transparent);
  transition: transform .2s ease, background .2s ease;
}
.launcher:hover { transform: translateY(-1px); background: var(--brand-strong); }
.launcher .face { width: 40px; height: 40px; }
.launcher .x { width: 26px; height: 26px; }
.greeting {
  display: block; text-align: left; border: 0; color: var(--ink);
  background: #fff; border-radius: 20px 20px 6px 20px; padding: 12px 16px; max-width: 230px;
  font-size: 14px; line-height: 1.4;
  box-shadow: 0 4px 8px rgba(11,16,32,0.05), 0 24px 48px -16px rgba(11,16,32,0.35);
  animation: rise .28s ease-out both;
}
:host([data-position="left"]) .greeting { border-radius: 20px 20px 20px 6px; }
.greeting[hidden] { display: none; }

/* Panel */
.panel {
  position: absolute; bottom: 80px; right: 0;
  width: 400px; height: min(700px, calc(100vh - 120px));
  background: var(--surface); border-radius: 28px;
  box-shadow: 0 4px 8px rgba(11,16,32,0.05), 0 32px 64px -16px rgba(11,16,32,0.28);
  display: flex; flex-direction: column; overflow: hidden;
  transform-origin: bottom right;
  animation: open .3s cubic-bezier(.2,.7,.2,1) both;
}
:host([data-position="left"]) .panel { right: auto; left: 0; transform-origin: bottom left; }
.panel[hidden] { display: none; }
@keyframes open { from { opacity: 0; transform: translateY(16px) scale(.97); } to { opacity: 1; transform: none; } }

/* Header: Night with a soft glow in the brand colour */
.header {
  position: relative; overflow: hidden; color: #fff;
  background: radial-gradient(260px circle at 100% 0%, var(--brand-glow), transparent 70%), var(--night);
  padding: 16px 12px 16px 18px; display: flex; align-items: center; gap: 12px;
}
.header .arc { position: absolute; right: -30px; top: -50px; width: 180px; height: 180px; }
.avatar { position: relative; flex: none; width: 44px; height: 44px; }
.avatar .online {
  position: absolute; right: -1px; bottom: -1px; width: 12px; height: 12px; border-radius: 50%;
  background: var(--aqua); border: 2px solid var(--night);
}
.title { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; }
.title strong { font-weight: 700; font-size: 19px; line-height: 1.2; letter-spacing: -0.01em; }
.title span { font-size: 13px; color: #DFE5FF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.icon-btn {
  position: relative; width: 44px; height: 44px; border: 0; border-radius: 50%;
  background: transparent; color: #fff; display: grid; place-items: center;
}
.icon-btn:hover { background: rgba(255,255,255,.12); }
.icon-btn.close { background: rgba(255,255,255,.16); }
.icon-btn.close:hover { background: rgba(255,255,255,.26); }
.icon-btn svg { width: 20px; height: 20px; }

/* Conversation */
.messages {
  flex: 1; min-height: 0; overflow-y: auto; background: var(--pearl);
  padding: 16px 14px 12px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth;
  scrollbar-width: thin; scrollbar-color: var(--line-strong) transparent;
}
.day {
  align-self: center; font-size: 12px; font-weight: 600; color: var(--muted);
  background: #fff; padding: 3px 10px; border-radius: 999px;
}
.row { display: flex; gap: 8px; align-items: flex-end; animation: rise .28s ease-out both; }
.row.user { justify-content: flex-end; }
@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.bubble { max-width: 296px; padding: 11px 14px; overflow-wrap: anywhere; }
.bubble p { margin: 0; }
.bubble p + p, .bubble p + ul, .bubble ul + p { margin-top: 8px; }
.bubble ul { margin: 0; padding-left: 18px; }
.bubble li + li { margin-top: 2px; }
.bubble a { color: var(--brand-strong); font-weight: 600; }
.bot .bubble { background: #fff; border-radius: 18px 18px 18px 6px; box-shadow: 0 1px 2px rgba(11,16,32,0.06); }
.user .bubble { background: var(--night-900); color: #fff; border-radius: 18px 18px 6px 18px; max-width: 270px; padding: 10px 14px; }
.source {
  display: flex; align-items: center; gap: 6px; margin-top: 10px;
  font-size: 12px; color: var(--muted);
}
.source svg { width: 13px; height: 13px; }
.error {
  align-self: center; max-width: 320px; text-align: center;
  background: #FEECEB; color: #B42318; border-radius: 14px; padding: 8px 12px; font-size: 13.5px;
}

.typing { display: inline-flex; gap: 5px; padding: 3px 2px; }
.typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); opacity: .5; animation: blink 1.2s infinite; }
.typing i:nth-child(2) { animation-delay: .15s; } .typing i:nth-child(3) { animation-delay: .3s; }
@keyframes blink { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

/* Appointment card */
.card {
  margin-left: 36px; max-width: 296px; background: #fff; border-radius: 18px; padding: 12px;
  box-shadow: 0 1px 2px rgba(11,16,32,0.06); display: flex; flex-direction: column; gap: 10px;
  animation: rise .28s ease-out both;
}
.card .label { display: flex; align-items: center; gap: 10px; background: #E6F7F0; border-radius: 14px; padding: 10px 12px; font-size: 14px; color: #0A5A40; line-height: 1.4; }
.card .label .tile {
  flex: none; width: 34px; height: 34px; border-radius: 50%; background: #0E9F6E; color: #fff; display: grid; place-items: center;
}
.card .label svg { width: 18px; height: 18px; }
.card dl {
  margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px;
  background: var(--pearl); border-radius: 12px; padding: 10px 12px; font-size: 14px;
}
.card dt { color: var(--muted); } .card dd { margin: 0; font-weight: 600; text-align: right; }
.notice {
  margin-left: 36px; display: flex; align-items: center; gap: 10px; text-align: left;
  font-size: 14px; line-height: 1.4; color: var(--night-700); background: #FFF8EB;
  border-radius: 14px; padding: 12px; max-width: 296px;
  animation: rise .28s ease-out both;
}
.notice .tile { flex: none; width: 34px; height: 34px; border-radius: 50%; background: #FFEFD1; color: #8A4B00; display: grid; place-items: center; }
.notice svg { width: 18px; height: 18px; }

/* Quick replies */
.chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 14px 12px 50px; background: var(--pearl); }
.chips:empty { display: none; }
.chip {
  height: 40px; padding: 0 14px; border-radius: 999px; font-size: 14px; font-weight: 600;
  background: #fff; color: var(--brand-strong); border: 1.5px solid var(--brand-line);
  transition: background-color .15s, border-color .15s;
}
.chip:hover { background: var(--brand-soft); border-color: var(--brand); }

/* Composer */
.composer { border-top: 1px solid var(--line); padding: 12px 14px 10px; background: #fff; display: flex; flex-direction: column; gap: 8px; }
.field {
  display: flex; align-items: flex-end; gap: 8px; background: var(--pearl);
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
  background: var(--brand); color: var(--brand-ink); display: grid; place-items: center; transition: background-color .15s;
}
.send:hover:not(:disabled) { background: var(--brand-strong); }
.send:disabled { background: var(--brand-muted); cursor: default; }
.send svg { width: 18px; height: 18px; }
.footer { text-align: center; font-size: 12px; color: var(--muted); }

@media (max-width: 480px) {
  :host { bottom: 16px; right: 16px; }
  .panel { position: fixed; inset: 0; width: 100vw; height: 100dvh; border-radius: 0; bottom: 0; }
  /* Full-screen on phones: the header's close button takes over, so the launcher would only cover the composer. */
  .launcher[aria-expanded="true"] { display: none; }
  .greeting { display: none; }
}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;
