import { Hono } from 'hono'
import type { Context } from 'hono'
import { gate, handleLogin, handleLogout, isAuthed } from './auth'
import { hasPassword, createPassword, effectiveApiToken, getSetting, setSetting, timingSafeEqual } from './settings'
import { DEPARTURE_MONO_WOFF2_B64 } from './font'
import { FAVICON_SVG, shell } from './theme'
import { landingPage, ROBOTS_TXT, sitemapXml, LLMS_TXT } from './landing'
import { AGENT_MD } from './agent-md'
import { DOCS_MD, docsPage } from './docs'
import { OG_PNG_B64, hasOgImage } from './og'
import { homePage, inboxPage, submissionPage, submissionAction, newFormPage, loginOrSetupPage } from './views'
import { builderPage, saveBuilder } from './builder'
import { settingsPage, saveSettings, verifyEmailAction, sendTestEmail } from './settings-view'
import { renderFormPage, submitForm, thanksRedirect } from './render'
import { createFromChooser } from './create'
import { submissionsCsv } from './csv'
import { getForm } from './db'
import { apiRoutes } from './api'

// Everything this Worker can reach. DB is the D1 database. EMAIL is the
// Cloudflare Email Service send binding (optional at runtime). The rest are
// optional env fallbacks for config you'd normally set in the dashboard.
export type Env = {
  DB: D1Database
  EMAIL?: { send: (msg: unknown) => Promise<unknown> }
  SITE_PASSWORD?: string
  API_TOKEN?: string
  TURNSTILE_SITE_KEY?: string
  TURNSTILE_SECRET_KEY?: string
  FORCE_LANDING?: string // staging only: render the marketing landing on any host
}

type Ctx = Context<{ Bindings: Env }>

export function host(c: Ctx): string {
  return (c.req.header('host') || '').toLowerCase().split(':')[0]
}
// The base URL of this instance (scheme + host) — used to build form and share links.
export function origin(c: Ctx): string {
  const u = new URL(c.req.url)
  return `${u.protocol}//${u.host}`
}

const app = new Hono<{ Bindings: Env }>()

// Shared static assets, on any host.
app.get('/_f/dm.woff2', (c) => {
  const bin = atob(DEPARTURE_MONO_WOFF2_B64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return c.body(bytes, 200, { 'content-type': 'font/woff2', 'cache-control': 'public, max-age=31536000, immutable' })
})
app.get('/favicon.svg', (c) => c.body(FAVICON_SVG, 200, { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' }))

// ── host routing ─────────────────────────────────────────────────────────────
// formweh.com (+ www) is OUR marketing landing, and only that. Every other host
// (a user's forms.theirdomain.com, a *.workers.dev URL, or localhost) is a live
// Formweh instance: the dashboard, the hosted form pages, and the endpoints.
app.use('*', async (c, next) => {
  const h = host(c)
  if (h === 'www.formweh.com') {
    const u = new URL(c.req.url)
    u.hostname = 'formweh.com'
    return c.redirect(u.toString(), 301)
  }
  if (h === 'formweh.com' || c.env.FORCE_LANDING === '1') {
    const p = c.req.path
    if (p === '/robots.txt') return c.body(ROBOTS_TXT, 200, { 'content-type': 'text/plain; charset=utf-8' })
    if (p === '/sitemap.xml') return c.body(sitemapXml(), 200, { 'content-type': 'application/xml; charset=utf-8' })
    if (p === '/llms.txt') return c.body(LLMS_TXT, 200, { 'content-type': 'text/plain; charset=utf-8' })
    if (p === '/agent.md') return c.body(AGENT_MD, 200, { 'content-type': 'text/markdown; charset=utf-8' })
    if (p === '/llms-full.txt') return c.body(LLMS_TXT + '\n\n---\n\n' + DOCS_MD + '\n\n---\n\n' + AGENT_MD, 200, { 'content-type': 'text/plain; charset=utf-8' })
    if (p === '/docs') return c.html(docsPage())
    if (p === '/og.png') {
      if (!hasOgImage()) return c.notFound()
      const bin = atob(OG_PNG_B64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return c.body(bytes, 200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' })
    }
    if (p === '/_f/dm.woff2' || p === '/favicon.svg') return next()
    return c.html(landingPage())
  }
  return next()
})

// CORS for the public form endpoints, so a custom-designed form on any origin can
// POST via fetch() and read the JSON result. Plain HTML form posts don't need it;
// JS-driven forms on a different domain do. No cookies are involved, so `*` is safe.
app.use('/f/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      'access-control-max-age': '86400',
    })
  }
  await next()
  c.header('access-control-allow-origin', '*')
})

// ── public form endpoints (no auth) ────────────────────────────────────────────
// The hosted form page, and the submission endpoint that both hosted and
// bring-your-own forms POST to.
app.get('/f/:slug', async (c) => {
  const form = await getForm(c.env, c.req.param('slug'))
  if (!form || form.archived) return c.notFound()
  return renderFormPage(c, form)
})
app.post('/f/:slug', async (c) => {
  const form = await getForm(c.env, c.req.param('slug'))
  if (!form || form.archived) return c.notFound()
  return submitForm(c, form)
})
app.get('/f/:slug/thanks', async (c) => {
  const form = await getForm(c.env, c.req.param('slug'))
  if (!form) return c.notFound()
  return thanksRedirect(c, form)
})

// ── auth (public) ──────────────────────────────────────────────────────────────
app.get('/login', async (c) => {
  if (await isAuthed(c)) return c.redirect('/')
  return c.html(loginOrSetupPage(await hasPassword(c.env), c.req.query('error'), c.req.query('key') ?? ''))
})
// Best-effort brute-force brake, per isolate: five bad passwords from one
// address buys a minute of lockout. Real rate limiting belongs in front (WAF);
// this makes unattended guessing expensive even on a bare deploy.
const loginFails = new Map<string, { n: number; until: number }>()
app.post('/login', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || 'local'
  const f = loginFails.get(ip)
  if (f && f.until > Date.now()) return c.redirect('/login?error=wrong')
  const res = await handleLogin(c)
  if ((res.headers.get('location') || '').includes('error=wrong')) {
    const n = (f?.n ?? 0) + 1
    loginFails.set(ip, { n, until: n >= 5 ? Date.now() + 60_000 : 0 })
    if (loginFails.size > 10_000) loginFails.clear()
  } else {
    loginFails.delete(ip)
  }
  return res
})
app.post('/logout', handleLogout)
// First-run: create the admin password, then log in.
app.post('/setup', async (c) => {
  if (await hasPassword(c.env)) return c.redirect('/login')
  const body = await c.req.parseBody()
  const pw = String(body.password ?? '')
  const key = String(body.key ?? '')
  const back = key ? `&key=${encodeURIComponent(key)}` : ''
  // If the installer stored a one-time claim token, the request must carry it;
  // it burns on success. Without one, classic first-visit setup applies.
  const storedToken = await getSetting(c.env, 'setup_token').catch(() => null)
  if (storedToken && !timingSafeEqual(key, storedToken)) return c.redirect('/login?error=badkey')
  if (pw.length < 8) return c.redirect(`/login?error=short${back}`)
  let created = false
  try {
    created = await createPassword(c.env, pw) // conflict-safe: exactly one concurrent setup wins
  } catch (e) {
    if (String((e as Error)?.message ?? e).includes('no such table')) {
      return c.text('Database not initialised. Run the migrations (npx wrangler d1 migrations apply DB --remote), then reload.', 500)
    }
    throw e
  }
  if (!created) return c.redirect('/login')
  if (storedToken) await setSetting(c.env, 'setup_token', null) // burn the claim token
  const { issueSession } = await import('./auth')
  await issueSession(c)
  return c.redirect('/?welcome=1')
})

// ── dashboard (gated) ──────────────────────────────────────────────────────────
const admin = ['/', '/inbox/*', '/sub/*', '/new', '/forms', '/build/*', '/settings', '/settings/*', '/export/*']
for (const p of admin) app.use(p, gate)

app.get('/', (c) => homePage(c))
app.get('/new', (c) => newFormPage(c))
app.post('/forms', (c) => createFromChooser(c))
app.get('/inbox/:slug', (c) => inboxPage(c))
app.get('/sub/:id', (c) => submissionPage(c))
app.post('/sub/:id/:action', (c) => submissionAction(c))
app.get('/build/:slug', (c) => builderPage(c))
app.post('/build/:slug', (c) => saveBuilder(c))
app.get('/export/:slug', (c) => submissionsCsv(c))
app.get('/settings', (c) => settingsPage(c))
app.post('/settings', (c) => saveSettings(c))
app.post('/settings/verify-email', (c) => verifyEmailAction(c))
app.post('/settings/test-email', (c) => sendTestEmail(c))

// ── HTTP API (bearer token) ────────────────────────────────────────────────────
app.route('/api/v1', apiRoutes)

app.notFound((c) =>
  c.html(
    shell({
      title: 'Not found · Formweh',
      body: `<main style="max-width:520px;margin:14vh auto;padding:0 24px;text-align:center">
      <p class="lab" style="color:var(--accent);margin-bottom:14px">404</p>
      <h1 style="font-size:26px;font-weight:680;letter-spacing:-.02em;margin-bottom:10px">Nothing here</h1>
      <p style="color:var(--sec)">That page or form doesn't exist. <a href="/" style="color:var(--accent)">Go to your dashboard</a>.</p>
    </main>`,
    }),
    404,
  ),
)

export default app
