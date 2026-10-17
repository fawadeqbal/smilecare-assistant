/** Styles live inside the Shadow DOM, so host-page CSS can't leak in and ours can't leak out. */
export const styles = /* css */ `
:host {
  --brand: #0E7C66;
  --brand-ink: #ffffff;
  --ink: #17201d;
  --muted: #5f6b67;
  --line: #e4e9e7;
  --surface: #ffffff;
  --surface-2: #f4f7f6;
  --radius: 18px;
  all: initial;
  position: fixed;
  z-index: 2147483000;
  bottom: 20px;
  right: 20px;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 15px;
  line-height: 1.45;
  color: var(--ink);
}
:host([data-position="left"]) { right: auto; left: 20px; }
* { box-sizing: border-box; }
button { font: inherit; cursor: pointer; }

.launcher {
  width: 60px; height: 60px; border-radius: 50%;
  border: none; background: var(--brand); color: var(--brand-ink);
  display: grid; place-items: center;
  box-shadow: 0 10px 30px -8px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.12);
  transition: transform .2s ease, box-shadow .2s ease;
}
.launcher:hover { transform: translateY(-2px) scale(1.03); }
.launcher:focus-visible, .icon-btn:focus-visible, .chip:focus-visible, .send:focus-visible { outline: 3px solid color-mix(in srgb, var(--brand) 45%, white); outline-offset: 2px; }
.launcher svg { width: 28px; height: 28px; }
.launcher .badge {
  position: absolute; top: 2px; right: 2px; width: 14px; height: 14px; border-radius: 50%;
  background: #f97316; border: 2px solid #fff;
}

.panel {
  position: absolute; bottom: 76px; right: 0;
  width: 380px; height: min(640px, calc(100vh - 110px));
  background: var(--surface); border-radius: var(--radius);
  box-shadow: 0 24px 60px -12px rgba(15, 30, 25, .35), 0 0 0 1px rgba(0,0,0,.04);
  display: flex; flex-direction: column; overflow: hidden;
  transform-origin: bottom right;
  animation: pop .22s cubic-bezier(.2,.9,.3,1.2);
}
:host([data-position="left"]) .panel { right: auto; left: 0; transform-origin: bottom left; }
.panel[hidden] { display: none; }
@keyframes pop { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: none; } }

.header {
  background: var(--brand); color: var(--brand-ink);
  padding: 16px 14px 16px 18px; display: flex; align-items: center; gap: 12px;
}
.avatar {
  width: 40px; height: 40px; border-radius: 50%; flex: none;
  background: rgba(255,255,255,.18); display: grid; place-items: center; font-weight: 700; font-size: 17px;
}
.title { flex: 1; min-width: 0; }
.title strong { display: block; font-size: 16px; }
.title span { font-size: 12.5px; opacity: .85; display: flex; align-items: center; gap: 6px; }
.title span::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #7CF3B8; }
.icon-btn {
  width: 34px; height: 34px; border-radius: 10px; border: none; background: transparent; color: inherit;
  display: grid; place-items: center; opacity: .9;
}
.icon-btn:hover { background: rgba(255,255,255,.16); opacity: 1; }
.icon-btn svg { width: 18px; height: 18px; }

.messages {
  flex: 1; overflow-y: auto; padding: 18px 16px 8px; background: var(--surface-2);
  display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth;
}
.msg { max-width: 85%; padding: 10px 14px; border-radius: 16px; word-wrap: break-word; animation: fade .18s ease; }
@keyframes fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.msg p { margin: 0; }
.msg p + p, .msg p + ul, .msg ul + p { margin-top: 8px; }
.msg ul { margin: 0; padding-left: 18px; }
.msg li + li { margin-top: 2px; }
.msg.bot { align-self: flex-start; background: var(--surface); border: 1px solid var(--line); border-bottom-left-radius: 6px; }
.msg.user { align-self: flex-end; background: var(--brand); color: var(--brand-ink); border-bottom-right-radius: 6px; }
.msg.error { align-self: center; background: #fff1f0; color: #9f1d1d; border: 1px solid #fbd0cc; font-size: 13.5px; }

.typing { display: inline-flex; gap: 4px; padding: 4px 2px; }
.typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); opacity: .5; animation: blink 1.2s infinite; }
.typing i:nth-child(2) { animation-delay: .15s; } .typing i:nth-child(3) { animation-delay: .3s; }
@keyframes blink { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: .9; transform: translateY(-3px); } }

.card {
  align-self: flex-start; max-width: 85%; background: var(--surface); border: 1px solid var(--line);
  border-left: 4px solid var(--brand); border-radius: 12px; padding: 12px 14px; font-size: 14px;
}
.card .label { font-size: 11.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--brand); font-weight: 700; }
.card dl { margin: 6px 0 0; display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; }
.card dt { color: var(--muted); } .card dd { margin: 0; font-weight: 500; }
.notice {
  align-self: center; font-size: 13px; color: var(--muted); background: var(--surface); border: 1px dashed var(--line);
  border-radius: 999px; padding: 6px 12px; text-align: center;
}

.chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 16px 10px; background: var(--surface-2); }
.chip {
  border: 1px solid color-mix(in srgb, var(--brand) 35%, white); color: var(--brand); background: var(--surface);
  border-radius: 999px; padding: 6px 12px; font-size: 13.5px; transition: background .15s;
}
.chip:hover { background: color-mix(in srgb, var(--brand) 8%, white); }

.composer { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--line); background: var(--surface); align-items: flex-end; }
.composer textarea {
  flex: 1; resize: none; border: 1px solid var(--line); border-radius: 14px; padding: 10px 12px;
  font: inherit; color: inherit; max-height: 120px; min-height: 42px; outline: none; background: var(--surface);
}
.composer textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent); }
.send {
  width: 42px; height: 42px; border-radius: 12px; border: none; background: var(--brand); color: var(--brand-ink);
  display: grid; place-items: center; flex: none; transition: opacity .15s;
}
.send:disabled { opacity: .4; cursor: default; }
.send svg { width: 18px; height: 18px; }
.footer { text-align: center; font-size: 11px; color: var(--muted); padding: 0 0 8px; background: var(--surface); }

@media (max-width: 480px) {
  :host { bottom: 16px; right: 16px; }
  .panel { position: fixed; inset: 0; width: 100vw; height: 100dvh; border-radius: 0; bottom: 0; }
}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;
