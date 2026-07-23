// The shared visual system: bone/ink with a forest-green accent, Departure Mono
// as the mono accent, full light + dark with a persisted toggle. Every rendered
// page (landing, dashboard, hosted forms) flows through shell() so they read as
// one product across both themes.

export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
export const escapeAttr = escapeHtml

export const BASE_CSS = `
@font-face{font-family:"Departure Mono";src:url("/_f/dm.woff2") format("woff2");font-weight:400;font-display:swap}
:root{
  --paper:#F0EEE7; --surface:#FBFAF6; --sunken:#F0EEE7; --raise:#FFFFFF;
  --ink:#1B1E18; --sec:#59604F; --muted:#8B9082;
  --accent:#1A7F37; --accent-hover:#15692D; --accent-fg:#FFFFFF;
  --accent-soft:color-mix(in srgb, var(--accent) 9%, transparent);
  --border:#E4E1D6; --border-strong:#D2CEC0;
  --warn:#B4832A; --warn-soft:color-mix(in srgb, var(--warn) 13%, transparent);
  --danger:#B4402A;
  --shadow-sm:0 1px 2px rgba(20,22,18,.05);
  --shadow-md:0 4px 16px rgba(20,22,18,.06),0 1px 3px rgba(20,22,18,.05);
  --glow:none;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono:"Departure Mono",ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;
  --ease:cubic-bezier(.32,.72,0,1);
  color-scheme:light;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --paper:#070809; --surface:#0D0F12; --sunken:#050607; --raise:#12151A;
    --ink:#ECEEF0; --sec:#9AA0A6; --muted:#5C636B;
    --accent:#3FCF5E; --accent-hover:#55D971; --accent-fg:#07140B;
    --accent-soft:color-mix(in srgb, var(--accent) 15%, transparent);
    --border:#1E2329; --border-strong:#2A3036;
    --warn:#D9A441; --warn-soft:color-mix(in srgb, var(--warn) 16%, transparent);
    --danger:#E06A52;
    --shadow-sm:0 1px 2px rgba(0,0,0,.5);
    --shadow-md:0 8px 28px rgba(0,0,0,.5);
    --glow:0 0 8px rgba(63,207,94,.45);
    color-scheme:dark;
  }
}
:root[data-theme="dark"]{
  --paper:#070809; --surface:#0D0F12; --sunken:#050607; --raise:#12151A;
  --ink:#ECEEF0; --sec:#9AA0A6; --muted:#5C636B;
  --accent:#3FCF5E; --accent-hover:#55D971; --accent-fg:#07140B;
  --accent-soft:color-mix(in srgb, var(--accent) 15%, transparent);
  --border:#1E2329; --border-strong:#2A3036;
  --warn:#D9A441; --warn-soft:color-mix(in srgb, var(--warn) 16%, transparent);
  --danger:#E06A52;
  --shadow-sm:0 1px 2px rgba(0,0,0,.5);
  --shadow-md:0 8px 28px rgba(0,0,0,.5);
  --glow:0 0 8px rgba(63,207,94,.45);
  color-scheme:dark;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;letter-spacing:-.01em}
a{color:inherit;text-decoration:none}
::selection{background:var(--accent-soft)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* shared atoms */
.mono{font-family:var(--mono)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--sans);font-size:14px;font-weight:600;color:var(--accent-fg);background:var(--accent);border:0;border-radius:9px;padding:10px 17px;cursor:pointer;letter-spacing:-.01em;transition:background .15s}
.btn:hover{background:var(--accent-hover)}
.btn.lg{font-size:15.5px;padding:13px 22px;border-radius:11px}
.btn.sm{font-size:12.5px;padding:7px 12px;border-radius:8px}
.btn.ghost{background:var(--surface);color:var(--sec);border:1px solid var(--border-strong)}
.btn.ghost:hover{background:var(--sunken);color:var(--ink)}
.btn.danger{background:transparent;color:var(--danger);border:1px solid color-mix(in srgb,var(--danger) 35%,transparent)}
.btn:disabled{opacity:.5;cursor:not-allowed}
input,textarea,select{font-family:var(--sans);font-size:14px;color:var(--ink);background:var(--surface);border:1px solid var(--border-strong);border-radius:9px;padding:11px 13px;width:100%;outline:none;transition:border-color .15s}
input:focus,textarea:focus,select:focus{border-color:var(--accent)}
textarea{resize:vertical;min-height:96px;line-height:1.5}
label{display:block;font-size:13px;font-weight:600;margin-bottom:7px}
.lab{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.tgl{font-family:var(--mono);width:32px;height:32px;border:1px solid var(--border-strong);border-radius:8px;background:var(--surface);color:var(--sec);cursor:pointer;display:grid;place-items:center;font-size:14px;transition:color .18s,border-color .18s}
.tgl:hover{color:var(--ink);border-color:var(--accent)}
.badge{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:100px}
.badge.free{color:var(--accent);background:var(--accent-soft)}
.badge.pro{color:var(--warn);background:var(--warn-soft)}
`

export const THEME_SCRIPT = `
(function(){
  var root=document.documentElement,saved=null;
  try{saved=localStorage.getItem('formweh-theme')}catch(e){}
  if(saved)root.setAttribute('data-theme',saved);
  window.__toggleTheme=function(){
    var cur=root.getAttribute('data-theme');
    if(!cur)cur=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    var next=cur==='dark'?'light':'dark';
    root.setAttribute('data-theme',next);
    try{localStorage.setItem('formweh-theme',next)}catch(e){}
  };
})();
`

export function shell(opts: {
  title: string
  body: string
  description?: string
  css?: string
  head?: string
  script?: string
  bodyClass?: string
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(opts.title)}</title>
${opts.description ? `<meta name="description" content="${escapeAttr(opts.description)}"/>` : ''}
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<meta name="theme-color" content="#F0EEE7" media="(prefers-color-scheme: light)"/>
<meta name="theme-color" content="#070809" media="(prefers-color-scheme: dark)"/>
<script>${THEME_SCRIPT}</script>
<style>${BASE_CSS}${opts.css ?? ''}</style>
${opts.head ?? ''}
</head>
<body${opts.bodyClass ? ` class="${opts.bodyClass}"` : ''}>
${opts.body}
${opts.script ? `<script>${opts.script}</script>` : ''}
</body>
</html>`
}

// The leaf-drop wordmark: a small square mark + the name. Used in the app chrome.
export function wordmark(size = 15): string {
  return `<span class="wm" style="display:inline-flex;align-items:center;gap:8px;font-weight:680;letter-spacing:-.02em;font-size:${size}px">
    <span style="width:16px;height:16px;border-radius:5px;background:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);display:grid;place-items:center">
      <span style="width:6px;height:6px;background:var(--accent-fg);border-radius:1.5px"></span></span>Formweh</span>`
}

export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1A7F37"/><rect x="11" y="11" width="10" height="10" rx="2.5" fill="#fff"/></svg>`
