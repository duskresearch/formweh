import { shell, escapeHtml } from './theme'

const REPO = 'https://github.com/AspatialCo/formweh'
const DEPLOY = 'https://deploy.workers.cloudflare.com/?url=https://github.com/AspatialCo/formweh'

const CSS = `
.wrap{max-width:960px;margin:0 auto;padding:0 24px}
.nav{max-width:960px;margin:0 auto;padding:22px 24px;display:flex;align-items:center;justify-content:space-between}
.nav .r{display:flex;align-items:center;gap:16px}
.nav a.gh{font-family:var(--mono);font-size:12.5px;color:var(--sec)}
.nav a.gh:hover{color:var(--accent)}
.hero{padding:7vh 0 3vh;max-width:760px}
.eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:16px}
h1{font-size:clamp(32px,6vw,52px);font-weight:700;line-height:1.04;letter-spacing:-.03em;text-wrap:balance;margin-bottom:18px}
.say{font-size:clamp(16px,2.2vw,19px);color:var(--sec);max-width:52ch;margin-bottom:30px}
.say b{color:var(--ink);font-weight:600}
.cta{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.cta img{height:44px;display:block}
.reassure{display:flex;flex-wrap:wrap;gap:9px 20px;margin-top:26px}
.reassure span{font-family:var(--mono);font-size:12px;color:var(--muted);display:inline-flex;align-items:center;gap:7px}
.reassure span::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--accent)}
.uses{display:flex;gap:10px;flex-wrap:wrap;margin-top:34px}
.use{border:1px solid var(--border);background:var(--surface);border-radius:100px;padding:9px 18px;font-size:13.5px;color:var(--sec);display:inline-flex;gap:9px;align-items:center}
.use b{color:var(--ink);font-weight:600}
.block{padding:7vh 0}
.block.line{border-top:1px solid var(--border)}
h2{font-size:clamp(22px,3.4vw,29px);font-weight:680;letter-spacing:-.02em;margin-bottom:8px;text-wrap:balance}
.lede{color:var(--sec);font-size:15.5px;max-width:54ch;margin-bottom:30px}

/* ── product visuals (mock UI, theme-aware) ── */
.frame{border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:var(--shadow-md);background:var(--surface)}
.fbar{display:flex;align-items:center;gap:7px;padding:11px 15px;background:var(--sunken);border-bottom:1px solid var(--border)}
.fbar i{width:10px;height:10px;border-radius:50%;background:var(--border-strong)}
.fbar .u{font-family:var(--mono);font-size:12px;color:var(--muted);margin-left:7px}
.shot{max-width:880px;margin:12px auto 0}
.cap{text-align:center;font-family:var(--mono);font-size:11.5px;letter-spacing:.04em;color:var(--muted);margin-top:16px}

.ibx{display:grid;grid-template-columns:198px 1fr;min-height:320px}
.ibx-s{background:var(--sunken);border-right:1px solid var(--border);padding:15px 11px;font-size:13px}
.ibx-s .wm{padding:2px 8px 12px;font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px}
.ibx-s .wm .mk{width:15px;height:15px;border-radius:5px;background:var(--accent);display:grid;place-items:center}
.ibx-s .wm .mk::after{content:"";width:6px;height:6px;background:var(--accent-fg);border-radius:1.5px}
.ibx-s .g{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:12px 8px 7px}
.ibx-s .it{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:7px;color:var(--sec)}
.ibx-s .it.on{background:var(--raise);color:var(--ink);font-weight:600;box-shadow:var(--shadow-sm)}
.ibx-s .it .c{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--muted)}
.ibx-s .it.on .c{color:var(--accent)}
.ibx-m{min-width:0}
.ibx-h{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid var(--border)}
.ibx-h b{font-size:15px;font-weight:660}
.ibx-h .mc{font-family:var(--mono);font-size:11px;color:var(--muted)}
.ibx-h .ex{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--sec);border:1px solid var(--border-strong);border-radius:7px;padding:5px 10px}
.ibx-r{display:grid;grid-template-columns:8px 1fr auto;gap:12px;align-items:center;padding:12px 20px;border-bottom:1px solid var(--border)}
.ibx-r .d{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:var(--glow)}
.ibx-r.rd .d{background:transparent}
.ibx-r .nm{font-weight:620;font-size:13px}
.ibx-r .pv{color:var(--muted);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.ibx-r .t{font-family:var(--mono);font-size:10.5px;color:var(--muted);white-space:nowrap}

.split{display:grid;grid-template-columns:1fr 1fr;gap:clamp(26px,4vw,50px);align-items:center}
.txt h2{margin-bottom:10px}
.pt{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--sec);margin-top:11px}
.pt::before{content:"✓";color:var(--accent);font-weight:700;flex:none}

.vform{padding:22px}
.vform .ft{font-weight:660;font-size:16px;margin-bottom:3px}
.vform .fd{color:var(--sec);font-size:12.5px;margin-bottom:16px}
.vform label{font-size:11.5px;font-weight:600;margin-bottom:6px;display:block}
.vform .fi{height:34px;border:1px solid var(--border-strong);border-radius:8px;background:var(--sunken);margin-bottom:13px}
.vform .fi.ta{height:56px}
.vform .fb{height:38px;border-radius:8px;background:var(--accent);color:var(--accent-fg);display:grid;place-items:center;font-size:13px;font-weight:600}
.code{background:#101208;padding:17px 19px;font-family:var(--mono);font-size:12.5px;line-height:1.75;color:#C7CBBE;overflow-x:auto;white-space:pre}
.code .t{color:#7FB48C}.code .a{color:#E0B36B}.code .s{color:#9CC7D6}.code .m{color:#6E7568}.code .g{color:#3FCF5E}

.wl{padding:32px 30px;text-align:center}
.wl .ring{width:46px;height:46px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;margin:0 auto 14px;font-size:20px}
.wl .wt{font-weight:660;font-size:16px}
.wl .pos{font-family:var(--mono);font-size:42px;color:var(--accent);text-shadow:var(--glow);letter-spacing:-.02em;margin-top:14px;line-height:1}
.wl .pd{color:var(--sec);font-size:13.5px;margin-top:8px}
.wl .share{display:flex;gap:8px;margin-top:20px}
.wl .share .lk{flex:1;font-family:var(--mono);font-size:12px;color:var(--muted);background:var(--sunken);border:1px solid var(--border);border-radius:8px;padding:10px 12px;text-align:left;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.wl .share .cp{background:var(--accent);color:var(--accent-fg);border-radius:8px;padding:0 16px;display:grid;place-items:center;font-size:12px;font-weight:600}

.feats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.feat{border:1px solid var(--border);background:var(--surface);border-radius:13px;padding:20px;box-shadow:var(--shadow-sm)}
.feat .fi{width:30px;height:30px;border-radius:8px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-family:var(--mono);font-size:14px;margin-bottom:12px}
.feat h3{font-size:15px;font-weight:640;margin-bottom:5px;letter-spacing:-.01em}
.feat p{color:var(--sec);font-size:13.5px;line-height:1.5}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.step{border:1px solid var(--border);border-radius:13px;padding:20px;background:var(--surface)}
.step .n{font-family:var(--mono);font-size:12px;color:var(--accent);letter-spacing:.1em;margin-bottom:10px}
.step h3{font-size:15px;font-weight:640;margin-bottom:5px}
.step p{color:var(--sec);font-size:13.5px;line-height:1.5}
.qa{border-top:1px solid var(--border);padding:22px 0}
.qa .q{font-weight:640;font-size:16px;margin-bottom:6px}
.qa .a{color:var(--sec);font-size:14.5px;max-width:64ch}
.qa .a a{color:var(--accent)}
.foot{padding:6vh 0;border-top:1px solid var(--border);font-family:var(--mono);font-size:12px;letter-spacing:.03em;color:var(--muted);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}
.foot a{color:var(--muted)}.foot a:hover{color:var(--accent)}
@media(max-width:760px){.feats,.steps{grid-template-columns:1fr}.split{grid-template-columns:1fr}.split .frame{order:-1}.ibx{grid-template-columns:1fr}.ibx-s{display:none}}
`

function feat(icon: string, h: string, p: string): string {
  return `<div class="feat"><div class="fi">${icon}</div><h3>${escapeHtml(h)}</h3><p>${escapeHtml(p)}</p></div>`
}
function step(n: string, h: string, p: string): string {
  return `<div class="step"><div class="n">${n}</div><h3>${escapeHtml(h)}</h3><p>${escapeHtml(p)}</p></div>`
}
function qa(q: string, a: string): string {
  return `<div class="qa"><div class="q">${escapeHtml(q)}</div><div class="a">${a}</div></div>`
}

// ── product-visual mocks (rendered UI, so it matches the real thing in both themes) ──
const INBOX = `<div class="frame"><div class="fbar"><i></i><i></i><i></i><span class="u">forms.yoursite.com</span></div>
  <div class="ibx">
    <div class="ibx-s">
      <div class="wm"><span class="mk"></span>Formweh</div>
      <div class="g">Forms</div>
      <div class="it on">Contact <span class="c">12</span></div>
      <div class="it">Waitlist <span class="c">48</span></div>
      <div class="it">Survey <span class="c">31</span></div>
      <div class="g">Filed</div>
      <div class="it">Spam <span class="c">27</span></div>
    </div>
    <div class="ibx-m">
      <div class="ibx-h"><b>Contact</b><span class="mc">12 responses · 3 new</span><span class="ex">Export CSV</span></div>
      <div class="ibx-r"><span class="d"></span><div><div class="nm">Priya Menon</div><div class="pv">Loved the launch, any plans for a team tier?</div></div><span class="t">2m ago</span></div>
      <div class="ibx-r"><span class="d"></span><div><div class="nm">devs@northwind.io</div><div class="pv">Can we self-host this behind our VPN?</div></div><span class="t">18m ago</span></div>
      <div class="ibx-r rd"><span class="d"></span><div><div class="nm">Ana Sofia</div><div class="pv">Just saying thanks, this saved me a Formspree bill.</div></div><span class="t">1h ago</span></div>
      <div class="ibx-r rd"><span class="d"></span><div><div class="nm">hello@studiolark.com</div><div class="pv">Interested in a partnership, who's the right contact?</div></div><span class="t">5h ago</span></div>
    </div>
  </div></div>`

const FORM_CARD = `<div class="frame"><div class="fbar"><i></i><i></i><i></i><span class="u">forms.yoursite.com/f/contact</span></div>
  <div class="vform">
    <div class="ft">Get in touch</div>
    <div class="fd">Send us a message and we'll get back to you.</div>
    <label>Your name</label><div class="fi"></div>
    <label>Email</label><div class="fi"></div>
    <label>Message</label><div class="fi ta"></div>
    <div class="fb">Send</div>
  </div></div>`

const CODE_SNIPPET = `<div class="frame"><div class="fbar"><i></i><i></i><i></i><span class="u">your-site.com · index.html</span></div>
  <div class="code"><span class="m">&lt;!-- your form, your design, unchanged --&gt;</span>
<span class="t">&lt;form</span> <span class="a">action</span>=<span class="s">"…/f/contact"</span> <span class="a">method</span>=<span class="s">"POST"</span><span class="t">&gt;</span>
  <span class="t">&lt;input</span> <span class="a">name</span>=<span class="s">"email"</span> <span class="a">type</span>=<span class="s">"email"</span> <span class="t">/&gt;</span>
  <span class="t">&lt;textarea</span> <span class="a">name</span>=<span class="s">"message"</span><span class="t">&gt;&lt;/textarea&gt;</span>
  <span class="t">&lt;button&gt;</span>Send<span class="t">&lt;/button&gt;</span>
<span class="t">&lt;/form&gt;</span>

<span class="m">// or from JS, cross-origin, no CORS setup</span>
<span class="g">await</span> fetch(url, { <span class="a">method</span>: <span class="s">"POST"</span>, <span class="a">body</span> })</div></div>`

const WAITLIST = `<div class="frame" style="max-width:440px;margin:0 auto"><div class="fbar"><i></i><i></i><i></i><span class="u">forms.yoursite.com/f/waitlist</span></div>
  <div class="wl">
    <div class="ring">✓</div>
    <div class="wt">You're on the list.</div>
    <div class="pos">#47</div>
    <div class="pd">of 1,204 in line</div>
    <div class="share"><span class="lk">yoursite.com/f/waitlist?ref=k3f9x2</span><span class="cp">Copy</span></div>
    <div class="pd" style="margin-top:14px">Every friend who joins moves you up.</div>
  </div></div>`

export function landingPage(): string {
  const head = `
<meta name="keywords" content="open source form builder, self-hosted forms, form backend, Formspree alternative, Typeform alternative, Tally alternative, waitlist software, referral waitlist, survey tool, contact form, Cloudflare Workers, own your data"/>
<meta name="author" content="Aspatial"/>
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"/>
<link rel="canonical" href="https://formweh.com/"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="Formweh"/>
<meta property="og:locale" content="en_US"/>
<meta property="og:title" content="Formweh — open-source forms, waitlists & surveys, made easy to self-host"/>
<meta property="og:description" content="Build a form or bring your own, collect every response in one inbox you own, on your own site. Deploy to your Cloudflare in one click. Free and open source."/>
<meta property="og:url" content="https://formweh.com/"/>
<meta property="og:image" content="https://formweh.com/og.png"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="Formweh — open source forms, waitlists and surveys, made easy to self-host."/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="Formweh — forms, waitlists & surveys, hosted by you"/>
<meta name="twitter:description" content="Open-source forms, waitlists, and surveys, self-hosted on your Cloudflare in one click. Own your data, no monthly bill."/>
<meta name="twitter:image" content="https://formweh.com/og.png"/>
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
  {"@type":"Organization","@id":"https://aspatial.co/#organization","name":"Aspatial","url":"https://aspatial.co","logo":"https://aspatial.co/aspatial-mark.svg"},
  {"@type":"WebSite","@id":"https://formweh.com/#website","url":"https://formweh.com/","name":"Formweh","description":"Open-source forms, waitlists, and surveys, made easy to self-host on Cloudflare.","inLanguage":"en","publisher":{"@id":"https://aspatial.co/#organization"}},
  {"@type":"SoftwareApplication","@id":"https://formweh.com/#app","name":"Formweh","applicationCategory":"DeveloperApplication","operatingSystem":"Cloudflare Workers","url":"https://formweh.com/","description":"Open-source forms, waitlists, and surveys, self-hosted on your own Cloudflare in one click. Build a form or bring your own, collect every response in an inbox you own, with notifications, spam protection, and CSV export.","image":"https://formweh.com/og.png","softwareVersion":"0.1","datePublished":"2026-07-23","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"license":"https://github.com/AspatialCo/formweh/blob/main/LICENSE","featureList":["Form builder for hosted forms and surveys","Bring-your-own form endpoints with CORS","Waitlist with a skip-the-line referral loop","Submissions inbox with CSV export and HTTP API","Email, Slack, Discord, and webhook notifications","Cloudflare Turnstile spam protection","Light and dark themes","One-click deploy to Cloudflare, free tier"],"sameAs":["https://github.com/AspatialCo/formweh"],"author":{"@id":"https://aspatial.co/#organization"},"publisher":{"@id":"https://aspatial.co/#organization"}},
  {"@type":"HowTo","name":"Self-host Formweh on Cloudflare","description":"Deploy your own forms, waitlists, and surveys to Cloudflare in a couple of minutes.","totalTime":"PT3M","step":[
    {"@type":"HowToStep","position":1,"name":"Deploy to Cloudflare","text":"Click Deploy to Cloudflare. It copies the code to your GitHub, creates your database, and publishes the Worker. A free Cloudflare account is all you need."},
    {"@type":"HowToStep","position":2,"name":"Put it on your domain","text":"Add forms.yourdomain.com as a custom domain on the Worker in the Cloudflare dashboard. Cloudflare provisions DNS and SSL."},
    {"@type":"HowToStep","position":3,"name":"Create your password","text":"Open your dashboard, set a password, and make your first form. Every response lands right there."}
  ]},
  {"@type":"FAQPage","mainEntity":[
    {"@type":"Question","name":"Is Formweh free?","acceptedAnswer":{"@type":"Answer","text":"Yes. It is open source under the MIT license and runs on Cloudflare's free tier, so there is no subscription and no per-response cost."}},
    {"@type":"Question","name":"Where is my form data stored?","acceptedAnswer":{"@type":"Answer","text":"In your own Cloudflare account and your own D1 database. Formweh is a tool you run yourself, not a hosted service, so no one else can see your responses."}},
    {"@type":"Question","name":"Can I use my own form design, or do I have to build one?","acceptedAnswer":{"@type":"Answer","text":"Either. Build a form or survey in the builder, or point your own HTML, React, or Webflow form's action at your Formweh endpoint and keep your exact design. Cross-origin submissions are supported via CORS."}},
    {"@type":"Question","name":"How is Formweh different from Formspree, Typeform, or Tally?","acceptedAnswer":{"@type":"Answer","text":"Those are hosted and, past a point, paid. Formweh is self-hosted and free: you own the domain, the data, and the code, and it handles forms, waitlists, and surveys in one tool."}},
    {"@type":"Question","name":"Do notification emails cost anything?","acceptedAnswer":{"@type":"Answer","text":"Emailing your own verified address is free on any Cloudflare plan. Autoresponders to other people use Cloudflare Email Sending, which needs the Workers Paid plan at five dollars a month."}}
  ]}
]}
</script>`

  const body = `
<nav class="nav">
  <a href="/">${wm()}</a>
  <div class="r">
    <a class="gh" href="${REPO}" target="_blank" rel="noopener">★ GitHub</a>
    <button class="tgl" type="button" onclick="__toggleTheme()" aria-label="Toggle theme">◐</button>
  </div>
</nav>
<main class="wrap">
  <section class="hero">
    <div class="eyebrow">Open source · self-hosted</div>
    <h1>Open source forms, waitlists, and surveys, made easy to self-host.</h1>
    <p class="say">Build one here or drop your own into any page. Everything you collect lands in <b>one inbox you own</b>, on your own site. No servers to run, no monthly bill.</p>
    <div class="cta">
      <a href="${DEPLOY}"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>
      <a class="btn ghost" href="${REPO}" target="_blank" rel="noopener">★ Star on GitHub</a>
    </div>
    <div class="reassure"><span>Open source</span><span>Self-hosted in minutes</span><span>No monthly bill</span><span>Yours to keep</span></div>
    <div class="uses">
      <span class="use"><b>Forms</b> contact, feedback, RSVP</span>
      <span class="use"><b>Waitlists</b> with referral loops</span>
      <span class="use"><b>Surveys</b> ratings and choices</span>
    </div>
  </section>

  <div class="shot">${INBOX}<div class="cap">Every response, in one inbox you own. On your domain, not ours.</div></div>

  <section class="block line">
    <div class="split">
      <div class="txt">
        <h2>A form your visitors will actually finish.</h2>
        <p class="lede">Build a clean form or survey in minutes and we host it on your site, in light or dark. Start from a template so there's nothing to design from scratch.</p>
        <div class="pt">Forms, surveys, waitlists, and RSVPs</div>
        <div class="pt">Six templates, ready to tweak</div>
        <div class="pt">Looks like your site, not a third party's</div>
      </div>
      ${FORM_CARD}
    </div>
  </section>

  <section class="block line">
    <div class="split">
      ${CODE_SNIPPET}
      <div class="txt">
        <h2>Or keep the form you already built.</h2>
        <p class="lede">Have a form you love? Point it at your endpoint and change nothing else. Your markup, your styles, your framework, untouched.</p>
        <div class="pt">Keep your exact HTML, React, or Webflow form</div>
        <div class="pt">Works cross-origin, no CORS to wrestle with</div>
        <div class="pt">Lands in the very same inbox</div>
      </div>
    </div>
  </section>

  <section class="block line">
    <div style="text-align:center;max-width:56ch;margin:0 auto 30px">
      <h2>Waitlists that grow themselves.</h2>
      <p class="lede" style="margin:0 auto">Every signup gets a share link and a place in line. Friends who join move them up, so your waitlist markets itself.</p>
    </div>
    ${WAITLIST}
  </section>

  <section class="block line">
    <h2>One tool, three you'd otherwise pay for.</h2>
    <p class="lede">A form backend, a form builder, and a waitlist tool in one. All free, all yours.</p>
    <div class="feats">
      ${feat('✉', 'Notifications where you are', 'Email through your own Cloudflare, free to your verified address, plus Slack, Discord, and webhooks.')}
      ${feat('◈', 'Spam handled for you', 'Cloudflare Turnstile and a honeypot, built in and free. Junk gets filed aside, never lost.')}
      ${feat('⤓', 'Your data, always exportable', 'Every response lives in your own database. Download CSV or pull it with the HTTP API, any time.')}
      ${feat('▦', 'Templates to start from', 'Contact, waitlist, survey, RSVP, coming-soon, feedback. Pick one and make it yours.')}
      ${feat('◐', 'Light and dark, done', 'Landing, dashboard, and every hosted form follow the theme. Nothing to configure.')}
      ${feat('⟠', 'No lock-in, ever', 'Open source under MIT. It is your code on your Cloudflare. Leave whenever, take everything.')}
    </div>
  </section>

  <section class="block line">
    <h2>Live in a couple of minutes.</h2>
    <p class="lede">One click hands the whole setup to Cloudflare. You never touch a command line.</p>
    <div class="steps">
      ${step('01', 'Deploy to Cloudflare', 'Click the button. Cloudflare copies the code to your GitHub, creates your database, and publishes it. A free account is all you need.')}
      ${step('02', 'Put it on your domain', 'Point forms.yourdomain.com at your new Worker in the Cloudflare dashboard. Cloudflare handles DNS and SSL.')}
      ${step('03', 'Create your password', 'Open your dashboard, set a password, and make your first form. Every response lands right there.')}
    </div>
    <div class="cta" style="margin-top:30px">
      <a href="${DEPLOY}"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>
      <a class="btn ghost" href="${REPO}" target="_blank" rel="noopener">★ Star on GitHub</a>
    </div>
  </section>

  <section class="block line">
    <h2>Questions.</h2>
    ${qa('Is Formweh free?', 'Yes. Open source under the MIT license, running on Cloudflare’s free tier. No subscription, no per-response cost.')}
    ${qa('Where is my data stored?', 'In your own Cloudflare account and your own database. Formweh is a tool you run yourself, not a hosted service, so no one else can see your responses.')}
    ${qa('Do I need to build a form, or can I bring my own?', 'Either. Build one in the builder, or point your own HTML/React/Webflow form’s action at your Formweh endpoint and keep your design.')}
    ${qa('How is it different from Formspree, Typeform, or Tally?', 'Those are hosted and, past a point, paid. Formweh is self-hosted and free: you own the domain, the data, and the code, and it does forms, waitlists, and surveys in one.')}
    ${qa('Do notification emails cost anything?', 'Emailing your own verified address is free on any Cloudflare plan. Autoresponders to other people use Cloudflare Email Sending, which needs the $5/mo Workers Paid plan.')}
  </section>

  <div class="foot">
    <span><a href="https://aspatial.co" target="_blank" rel="noopener">an aspatial tool</a></span>
    <span>Open source · MIT · Not affiliated with Cloudflare</span>
  </div>
</main>`

  return shell({ title: 'Formweh — open-source forms, waitlists & surveys, self-hosted', description: 'Build a form or bring your own, collect every response in one inbox you own, on your own site. Deploy to your Cloudflare in one click. Free and open source.', css: CSS, head, body })
}

function wm(): string {
  return `<span style="display:inline-flex;align-items:center;gap:8px;font-weight:700;letter-spacing:-.02em;font-size:16px">
    <span style="width:17px;height:17px;border-radius:5px;background:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);display:grid;place-items:center">
    <span style="width:6px;height:6px;background:var(--accent-fg);border-radius:1.5px"></span></span>Formweh</span>`
}

export const ROBOTS_TXT = `User-agent: *
Allow: /
Sitemap: https://formweh.com/sitemap.xml
`

export function sitemapXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://formweh.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>`
}

// An AI-readable summary (llms.txt convention) so answer engines can describe
// Formweh accurately. Part of the AEO layer alongside the JSON-LD and FAQ.
export const LLMS_TXT = `# Formweh

> Open-source forms, waitlists, and surveys, made easy to self-host on Cloudflare.

Formweh is a free, open-source tool for collecting form responses that you run on your own Cloudflare account. It is a self-hosted alternative to hosted form services such as Formspree, Typeform, Tally, and GetWaitlist: you deploy it in one click and own the domain, the data, and the code. There is no subscription and no per-response cost.

## What it does
- Build a form or survey in a simple builder, hosted on your own site.
- Or bring your own form: point any HTML, React, or Webflow form's action at your Formweh endpoint and keep your exact design (cross-origin submissions are supported via CORS).
- Waitlists with a skip-the-line referral loop: every signup gets a share link and a position.
- Templates: contact form, waitlist, survey, RSVP, coming-soon, feedback.
- One inbox for every response, with a spam folder, CSV export, and a read HTTP API.
- Notifications by email (through your own Cloudflare Email Service, free to your verified address), plus Slack, Discord, and custom webhooks.
- Spam protection via Cloudflare Turnstile and a honeypot; junk is filed aside, never dropped.
- Light and dark themes across the landing, dashboard, and hosted forms.

## How to use it
1. Deploy to Cloudflare in one click. It copies the code to your GitHub, creates your database, and publishes the Worker on Cloudflare's free tier.
2. Add forms.yourdomain.com as a custom domain on the Worker; Cloudflare provisions DNS and SSL.
3. Create an admin password on first run, then build or connect your first form.

## Pricing
Free and open source under the MIT license. Runs on Cloudflare's free tier. Emailing your own verified address is free on any plan; autoresponders to other people use Cloudflare Email Sending, which needs the Workers Paid plan (5 USD per month).

## Links
- Site: https://formweh.com
- Source code: https://github.com/AspatialCo/formweh
- Built by Aspatial: https://aspatial.co
`
