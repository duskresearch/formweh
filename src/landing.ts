import { shell, escapeHtml } from './theme'

const REPO = 'https://github.com/ekpani/formweh'
const DEPLOY = 'https://deploy.workers.cloudflare.com/?url=https://github.com/ekpani/formweh'

const CSS = `
main{max-width:940px;margin:0 auto;padding:0 24px}
.nav{display:flex;align-items:center;justify-content:space-between;padding:22px 0}
.nav .r{display:flex;align-items:center;gap:16px}
.nav a.gh{font-family:var(--mono);font-size:12.5px;color:var(--sec)}
.nav a.gh:hover{color:var(--accent)}
.hero{padding:9vh 0 7vh;max-width:760px}
.eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:16px}
h1{font-size:clamp(32px,6vw,52px);font-weight:700;line-height:1.04;letter-spacing:-.03em;text-wrap:balance;margin-bottom:18px}
.say{font-size:clamp(16px,2.2vw,19px);color:var(--sec);max-width:52ch;margin-bottom:30px}
.say b{color:var(--ink);font-weight:600}
.cta{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.cta img{height:44px;display:block}
.reassure{display:flex;flex-wrap:wrap;gap:9px 20px;margin-top:26px}
.reassure span{font-family:var(--mono);font-size:12px;color:var(--muted);display:inline-flex;align-items:center;gap:7px}
.reassure span::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--accent)}
.uses{display:flex;gap:10px;flex-wrap:wrap;margin-top:40px}
.use{border:1px solid var(--border);background:var(--surface);border-radius:100px;padding:9px 18px;font-size:13.5px;color:var(--sec);display:inline-flex;gap:9px;align-items:center}
.use b{color:var(--ink);font-weight:600}
.block{padding:8vh 0;border-top:1px solid var(--border)}
h2{font-size:clamp(22px,3.4vw,28px);font-weight:660;letter-spacing:-.02em;margin-bottom:8px;text-wrap:balance}
.lede{color:var(--sec);font-size:15.5px;max-width:52ch;margin-bottom:30px}
.feats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.feat{border:1px solid var(--border);background:var(--surface);border-radius:13px;padding:20px;box-shadow:var(--shadow-sm)}
.feat .fi{width:30px;height:30px;border-radius:8px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-family:var(--mono);font-size:14px;margin-bottom:12px}
.feat h3{font-size:15px;font-weight:640;margin-bottom:5px;letter-spacing:-.01em}
.feat p{color:var(--sec);font-size:13.5px;line-height:1.5}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;counter-reset:s}
.step{border:1px solid var(--border);border-radius:13px;padding:20px;background:var(--surface)}
.step .n{font-family:var(--mono);font-size:12px;color:var(--accent);letter-spacing:.1em;margin-bottom:10px}
.step h3{font-size:15px;font-weight:640;margin-bottom:5px}
.step p{color:var(--sec);font-size:13.5px;line-height:1.5}
.qa{border-top:1px solid var(--border);padding:22px 0}
.qa .q{font-weight:640;font-size:16px;margin-bottom:6px}
.qa .a{color:var(--sec);font-size:14.5px;max-width:64ch}
.qa .a a{color:var(--accent)}
.foot{padding:6vh 0;border-top:1px solid var(--border);font-family:var(--mono);font-size:12px;letter-spacing:.03em;color:var(--muted);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px}
.foot a{color:var(--muted)}
.foot a:hover{color:var(--accent)}
@media(max-width:720px){.feats,.steps{grid-template-columns:1fr}}
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

export function landingPage(): string {
  const head = `
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="Formweh"/>
<meta property="og:title" content="Formweh — open-source forms, waitlists, and surveys, made easy to self-host"/>
<meta property="og:description" content="Build a form or bring your own, collect every response in one inbox you own, on your own site. Deploy to your Cloudflare in one click. Free, open source."/>
<meta property="og:url" content="https://formweh.com/"/>
<meta name="twitter:card" content="summary"/>
<link rel="canonical" href="https://formweh.com/"/>
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
  {"@type":"SoftwareApplication","name":"Formweh","applicationCategory":"DeveloperApplication","operatingSystem":"Cloudflare Workers","url":"https://formweh.com/","description":"Open-source forms, waitlists, and surveys, self-hosted on Cloudflare in one click.","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"license":"https://github.com/ekpani/formweh/blob/main/LICENSE","sameAs":["https://github.com/ekpani/formweh"],"author":{"@type":"Organization","name":"Ekpani","url":"https://ekpani.com"}},
  {"@type":"FAQPage","mainEntity":[
    {"@type":"Question","name":"Is Formweh free?","acceptedAnswer":{"@type":"Answer","text":"Yes. It is open source under the MIT license and runs on Cloudflare's free tier, so there is no subscription and no per-response cost."}},
    {"@type":"Question","name":"Where is my data stored?","acceptedAnswer":{"@type":"Answer","text":"In your own Cloudflare account and your own D1 database. Formweh is a tool you run yourself, not a hosted service."}},
    {"@type":"Question","name":"Can I use my own form, or do I have to build one?","acceptedAnswer":{"@type":"Answer","text":"Either. Build a form or survey in the builder, or point your own form's action at your Formweh endpoint and keep your markup."}}
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
<main>
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

  <section class="block">
    <h2>Everything you collect, in one place.</h2>
    <p class="lede">One product stands in for a form backend, a form builder, and a waitlist tool. Same inbox, all yours.</p>
    <div class="feats">
      ${feat('✎', 'Build or bring your own', 'A simple builder hosts a form on your site, or point your own form’s action at your endpoint. Both land in the same inbox.')}
      ${feat('▦', 'Templates', 'Contact, waitlist, survey, RSVP, coming-soon, feedback. Start from one and tweak it in a minute.')}
      ${feat('↗', 'Waitlist referrals', 'Every signup gets a share link and a skip-the-line position. Growth built into the form.')}
      ${feat('✉', 'Notifications', 'Email through your own Cloudflare, free to your verified address, plus Slack, Discord, and webhooks.')}
      ${feat('◈', 'Spam protection', 'Cloudflare Turnstile and a honeypot, built in and free. Junk gets filed aside, never lost.')}
      ${feat('⤓', 'Own your data', 'Every response lives in your D1 database. Export to CSV, or pull it with the HTTP API, any time.')}
    </div>
  </section>

  <section class="block">
    <h2>Live in a couple of minutes.</h2>
    <p class="lede">One click hands the whole setup to Cloudflare. You never touch a command line.</p>
    <div class="steps">
      ${step('01', 'Deploy to Cloudflare', 'Click the button. Cloudflare copies the code to your GitHub, creates your database, and publishes it. Free account is all you need.')}
      ${step('02', 'Put it on your domain', 'Point forms.yourdomain.com at your new Worker in the Cloudflare dashboard. Cloudflare handles DNS and SSL.')}
      ${step('03', 'Create your password', 'Open your dashboard, set a password, and make your first form. Every response lands right there.')}
    </div>
    <div class="cta" style="margin-top:30px">
      <a href="${DEPLOY}"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>
    </div>
  </section>

  <section class="block">
    <h2>Questions.</h2>
    ${qa('Is Formweh free?', 'Yes. Open source under the MIT license, running on Cloudflare’s free tier. No subscription, no per-response cost.')}
    ${qa('Where is my data stored?', 'In your own Cloudflare account and your own database. Formweh is a tool you run yourself, not a hosted service, so no one else can see your responses.')}
    ${qa('Do I need to build a form, or can I bring my own?', 'Either. Build one in the builder, or point your own HTML/React/Webflow form’s action at your Formweh endpoint and keep your markup.')}
    ${qa('How is it different from Formspree, Typeform, or Tally?', 'Those are hosted and, past a point, paid. Formweh is self-hosted and free: you own the domain, the data, and the code, and it does forms, waitlists, and surveys in one.')}
    ${qa('Do notification emails cost anything?', 'Emailing your own verified address is free on any Cloudflare plan. Autoresponders to other people use Cloudflare Email Sending, which needs the $5/mo Workers Paid plan.')}
  </section>

  <div class="foot">
    <span><a href="https://ekpani.com" target="_blank" rel="noopener">an ekpani tool</a></span>
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
<urlset xmlns="http://www.w3.org/2000/sitemap-image/1.1/schema"><url><loc>https://formweh.com/</loc></url></urlset>`
}
