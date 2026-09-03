// One markdown source, two outputs: the rendered /docs page for humans and the
// raw text inside /llms-full.txt for machines. Edit DOCS_MD; both follow.

export const DOCS_MD = "# Formweh Documentation\n\nOpen-source forms, waitlists, and surveys you run on your own Cloudflare account.\nBuild a form or bring your own; every response lands in one inbox you own, on your\nown site. Cloudflare's free tier, one Worker, one D1 database, no build step.\n\n## Set it up\n\nThe fastest path is your coding agent. Tell Claude Code, Cursor, or any agent:\n\n> Read https://formweh.com/agent.md and set up Formweh on my own Cloudflare account. It has every step and check; ask me only for what it says to ask.\n\nIt hands you a one-time link at the end; you choose your password in your own browser. Or deploy it yourself:\n\n### One-click deploy\n\n1. Click Deploy to Cloudflare on the [landing page](https://formweh.com) or the [repo](https://github.com/duskresearch/formweh). A free Cloudflare account is all you need.\n2. Cloudflare copies Formweh into a new repository on your own GitHub and keeps it in sync.\n3. Cloudflare creates your database, runs the migrations, and publishes the Worker. You never touch a command line.\n4. Open the Worker's `*.workers.dev` URL and choose your dashboard password on the setup screen.\n5. Make your first form, or start from a template.\n\n### From the command line\n\n```\ngit clone https://github.com/duskresearch/formweh.git\ncd formweh && npm install\nnpx wrangler login\nnpm run db:create\nnpm run deploy\n```\n\nPaste the printed database_id into wrangler.jsonc under d1_databases, and remove the project's own routes block, before deploying. Then open the Worker URL and set your password.\n\n## Your own domain\n\nYour dashboard and forms work on the `workers.dev` address right away. To put them on your own subdomain, like `forms.yourbrand.com`:\n\n- Open your Worker, go to Settings, Domains and Routes, Add, Custom Domain, and add `forms.yourbrand.com`. Cloudflare provisions DNS and SSL.\n- Everything then lives on that one host: your dashboard, your hosted form pages (`forms.yourbrand.com/f/your-slug`), and the endpoints your own forms POST to.\n\nIf your domain is not on Cloudflare, you only need that one subdomain there. Your main site can stay wherever it is.\n\n## Features\n\n- Build a form or survey in the builder, hosted on your own site, or bring your own markup and keep it.\n- Templates: contact, waitlist, survey, RSVP, coming-soon, feedback.\n- Waitlists with a referral loop: every signup gets a share link and a place in line; friends who join move them up.\n- One inbox for every response, with read, spam, and export.\n- Notifications by email through your own Cloudflare, plus Slack, Discord, and webhooks.\n- Spam protection: Cloudflare Turnstile and a honeypot, filed aside rather than dropped.\n- Own your data: every response lives in your own D1 database. Export CSV or pull the HTTP API.\n- One password guards the dashboard. No accounts, no user table.\n- Light and dark, with a toggle across the landing, dashboard, and hosted forms.\n\n## Bring your own form\n\nCreate a \"bring your own\" form and point your markup at the endpoint:\n\n```\n<form action=\"https://forms.yourbrand.com/f/contact\" method=\"POST\">\n  <input name=\"email\" type=\"email\" required />\n  <textarea name=\"message\"></textarea>\n  <button>Send</button>\n</form>\n```\n\nIt also accepts JSON, so a React app can `fetch()` it and get `{ \"ok\": true }` back:\n\n```\nawait fetch(\"https://forms.yourbrand.com/f/contact\", {\n  method: \"POST\",\n  headers: { \"Content-Type\": \"application/json\" },\n  body: JSON.stringify({ email, message }),\n})\n```\n\n## Notifications\n\nEmailing your own verified address is free on any Cloudflare plan. To turn it on:\n\n1. In Settings, set your notify email.\n2. Verify it once in Cloudflare: your account, Email, Email Routing, Destination Addresses, add your address, click the link.\n3. Back in Formweh Settings, hit Send test email.\n\nAutoresponders (auto-replying to whoever submits, from your own domain) use Cloudflare Email Sending, which needs the Workers Paid plan ($5/mo) and a sending domain onboarded in Cloudflare. Everything else stays free.\n\n## Spam protection\n\nA honeypot works out of the box. For stronger protection, add free [Turnstile](https://developers.cloudflare.com/turnstile/) keys in Settings, then turn on spam protection per form. Failed challenges are filed as spam rather than dropped, so a real visitor is never lost. Hosted forms need both Turnstile keys to show the widget; bring-your-own forms are only checked when they actually send a token.\n\n## HTTP API\n\nA read API for pulling forms and responses into scripts. Off until you generate a token in Settings. Send it as a bearer token.\n\n| Method | Path | Does |\n| --- | --- | --- |\n| `GET` | `/api/v1/forms` | List your forms |\n| `GET` | `/api/v1/forms/:slug` | Fetch one form |\n| `GET` | `/api/v1/forms/:slug/submissions` | List a form's responses |\n\n## Run it locally\n\n```\ngit clone https://github.com/duskresearch/formweh.git\ncd formweh && npm install\nnpm run db:migrate:local\nnpm run dev\n```\n\nOpen http://localhost:8787.\n\n## Troubleshooting\n\n- A \"choose a password\" screen keeps appearing: nobody has set the password yet. Set it there. Claim the instance right after deploying so nobody else can.\n- Real submissions landing in the spam folder: Turnstile keys are set but the form never shows the widget. Hosted forms need both keys.\n- \"Database not initialised\": run `npx wrangler d1 migrations apply formweh-db --remote`.\n- \"Exceeded D1's free tier daily limit\": another D1 database on the same account spent the shared daily allowance. It resets at midnight UTC.\n\n## How it is built\n\nCloudflare Workers for the runtime, [Hono](https://hono.dev) for routing, [D1](https://developers.cloudflare.com/d1/) (SQLite) for storage, and Cloudflare Email Service and Turnstile for notifications and spam. No build step: server-rendered HTML with hand-written CSS, light and dark.\n\n## More\n\n- The agent runbook: [formweh.com/agent.md](https://formweh.com/agent.md)\n- Source (MIT): [github.com/duskresearch/formweh](https://github.com/duskresearch/formweh)\n- The lab: [Dusk Research](https://duskresearch.com)\n"

const DOCS_CSS = ":root{--bg:#070809;--surface:#111316;--ink:#EDEEEA;--sec:#9aa093;--muted:#6a7062;--accent:#1A7F37;--border:#26262b;--mono:'Departure Mono',ui-monospace,SFMono-Regular,Menlo,monospace}\n*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}\n@font-face{font-family:'Departure Mono';src:url('/_f/dm.woff2') format('woff2');font-weight:400;font-display:swap}\na{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}\n.top{border-bottom:1px solid var(--border);padding:18px 24px;display:flex;align-items:center;gap:14px;position:sticky;top:0;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(8px);z-index:5}\n.top .wm{font-family:var(--mono);font-size:15px;color:var(--ink)}.top .bc{color:var(--muted);font-size:14px}\n.wrap{max-width:1080px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:220px minmax(0,1fr);gap:48px}\nnav.toc{position:sticky;top:80px;align-self:start;padding-top:40px;display:flex;flex-direction:column;gap:9px;font-family:var(--mono);font-size:12px;letter-spacing:.02em}\nnav.toc a{color:var(--sec)}nav.toc a:hover{color:var(--ink);text-decoration:none}\nmain{padding:40px 0 120px;min-width:0}\nh1{font-size:30px;line-height:1.15;letter-spacing:-.02em;margin:0 0 8px}\nh2{font-size:21px;letter-spacing:-.01em;margin:44px 0 12px;padding-top:8px}\nh3{font-size:16px;margin:26px 0 8px;color:var(--ink)}\np{margin:12px 0;color:var(--sec)}li{margin:5px 0;color:var(--sec)}ul,ol{padding-left:22px}ol li{margin:6px 0}\nstrong{color:var(--ink);font-weight:640}\ncode{font-family:var(--mono);font-size:13px;background:var(--surface);border:1px solid var(--border);border-radius:5px;padding:1px 5px;color:var(--ink)}\npre{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;overflow-x:auto;margin:16px 0}\npre code{background:none;border:0;padding:0;font-size:13px;line-height:1.6;color:var(--ink)}\nblockquote{border-left:2px solid var(--accent);margin:16px 0;padding:4px 0 4px 16px;color:var(--ink)}\n.tw{overflow-x:auto;margin:16px 0}table{border-collapse:collapse;width:100%;font-size:14px}\nth,td{text-align:left;padding:9px 14px;border-bottom:1px solid var(--border);vertical-align:top}th{color:var(--muted);font-family:var(--mono);font-size:12px;font-weight:400;text-transform:uppercase;letter-spacing:.05em}\ntd{color:var(--sec)}\n.foot{border-top:1px solid var(--border);margin-top:60px;padding-top:20px;font-family:var(--mono);font-size:12px;color:var(--muted)}\n@media(max-width:760px){.wrap{grid-template-columns:1fr;gap:0}nav.toc{display:none}}"

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function inlineMd(s) {
  s = esc(s)
  s = s.replace(/`([^`]+)`/g, (_m, c) => '<code>' + c + '</code>')
  s = s.replace(/\*\*([^*]+)\*\*/g, (_m, c) => '<strong>' + c + '</strong>')
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, u) => '<a href="' + u + '">' + t + '</a>')
  return s
}
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
export function renderDocs(md) {
  const lines = md.split('\n')
  const out = []
  const toc = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const code = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(esc(lines[i])); i++ }
      i++
      out.push('<pre><code>' + code.join('\n') + '</code></pre>')
      continue
    }
    if (line.startsWith('### ')) { const t = line.slice(4); out.push('<h3 id="' + slugify(t) + '">' + inlineMd(t) + '</h3>'); i++; continue }
    if (line.startsWith('## ')) { const t = line.slice(3); toc.push({ id: slugify(t), title: t }); out.push('<h2 id="' + slugify(t) + '">' + inlineMd(t) + '</h2>'); i++; continue }
    if (line.startsWith('# ')) { const t = line.slice(2); out.push('<h1>' + inlineMd(t) + '</h1>'); i++; continue }
    if (line.startsWith('> ')) { out.push('<blockquote>' + inlineMd(line.slice(2)) + '</blockquote>'); i++; continue }
    if (line.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++ }
      const cells = (r) => r.split('|').slice(1, -1).map((c) => c.trim())
      const header = cells(rows[0])
      const body = rows.slice(2).map(cells)
      out.push('<div class="tw"><table><thead><tr>' + header.map((h) => '<th>' + inlineMd(h) + '</th>').join('') + '</tr></thead><tbody>' +
        body.map((r) => '<tr>' + r.map((c) => '<td>' + inlineMd(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>')
      continue
    }
    if (/^\d+\.\s/.test(line)) {
      const buf = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { buf.push('<li>' + inlineMd(lines[i].replace(/^\d+\.\s/, '')) + '</li>'); i++ }
      out.push('<ol>' + buf.join('') + '</ol>')
      continue
    }
    if (line.startsWith('- ')) {
      const buf = []
      while (i < lines.length && lines[i].startsWith('- ')) { buf.push('<li>' + inlineMd(lines[i].slice(2)) + '</li>'); i++ }
      out.push('<ul>' + buf.join('') + '</ul>')
      continue
    }
    if (line.trim() === '') { i++; continue }
    const para = []
    while (i < lines.length && lines[i].trim() !== '' &&
           !/^([#>|]|- |\`\`\`)/.test(lines[i])) { para.push(lines[i]); i++ }
    out.push('<p>' + inlineMd(para.join(' ')) + '</p>')
  }
  return { html: out.join('\n'), toc }
}


export function docsPage() {
  const { html, toc } = renderDocs(DOCS_MD)
  const nav = toc.map((s) => '<a href="#' + s.id + '">' + esc(s.title) + '</a>').join('')
  return '<!doctype html><html lang="en" data-theme="dark"><head>' +
    '<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>' +
    '<title>Documentation \u00b7 Formweh</title>' +
    '<meta name="description" content="How to deploy, configure, and use Formweh, self-hosted forms, waitlists and surveys."/>' +
    '<link rel="canonical" href="https://formweh.com/docs"/>' +
    '<meta name="robots" content="index,follow"/>' +
    '<meta property="og:type" content="article"/>' +
    '<meta property="og:site_name" content="Formweh"/>' +
    '<meta property="og:title" content="Formweh Documentation"/>' +
    '<meta property="og:description" content="How to deploy, configure, and use Formweh, self-hosted forms, waitlists and surveys."/>' +
    '<meta property="og:url" content="https://formweh.com/docs"/>' +
    '<meta property="og:image" content="https://formweh.com/og.png"/>' +
    '<meta name="twitter:card" content="summary_large_image"/>' +
    '<meta name="twitter:title" content="Formweh Documentation"/>' +
    '<meta name="twitter:description" content="How to deploy, configure, and use Formweh, self-hosted forms, waitlists and surveys."/>' +
    '<meta name="twitter:image" content="https://formweh.com/og.png"/>' +
    '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"TechArticle","@id":"https://formweh.com/docs#article","headline":"Formweh Documentation","description":"How to deploy, configure, and use Formweh, self-hosted forms, waitlists and surveys.","inLanguage":"en","url":"https://formweh.com/docs","author":{"@type":"Organization","name":"Dusk Research","url":"https://duskresearch.com"},"publisher":{"@type":"Organization","name":"Dusk Research","url":"https://duskresearch.com"},"about":{"@type":"SoftwareApplication","name":"Formweh","applicationCategory":"DeveloperApplication","url":"https://formweh.com/"}},{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://formweh.com/"},{"@type":"ListItem","position":2,"name":"Documentation","item":"https://formweh.com/docs"}]}]}</script>' +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>' +
    '<style>' + DOCS_CSS + '</style></head><body>' +
    '<header class="top"><a class="wm" href="/">Formweh</a><span class="bc">/ docs</span></header>' +
    '<div class="wrap"><nav class="toc">' + nav + '</nav><main>' + html +
    '<div class="foot">\u00a9 2026 <a href="https://duskresearch.com">Dusk Research</a> \u00b7 <a href="/agent.md">agent.md</a> \u00b7 <a href="/llms.txt">llms.txt</a></div>' +
    '</main></div></body></html>'
}
