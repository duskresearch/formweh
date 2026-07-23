import type { Context } from 'hono'
import type { Env } from './index'
import { origin } from './index'
import { shell, escapeHtml, escapeAttr } from './theme'
import type { FormRow, Field } from './db'
import { parseFields, insertSubmission, subByRefCode, incrementReferrals, waitlistPosition, waitlistTotal } from './db'
import { turnstileKeys } from './settings'
import { shortCode } from './settings'
import { clientTraits } from './ua'
import { summarize, dispatchNotifications, sendAutoresponder } from './notify'

type Ctx = Context<{ Bindings: Env }>

const FORM_CSS = `
.wrap{max-width:540px;margin:0 auto;padding:6vh 22px 8vh;position:relative}
.top{display:flex;justify-content:flex-end;margin-bottom:2vh}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-md);padding:clamp(24px,4vw,40px)}
.f-title{font-size:clamp(22px,3.4vw,28px);font-weight:680;letter-spacing:-.025em;text-wrap:balance}
.f-desc{color:var(--sec);font-size:15px;margin-top:8px}
form.formweh{margin-top:26px;display:flex;flex-direction:column;gap:18px}
.field .req{color:var(--accent)}
.choices{display:flex;flex-direction:column;gap:9px}
.opt{display:flex;align-items:center;gap:10px;font-weight:400;font-size:14px;cursor:pointer}
.opt input{width:auto;margin:0}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.f-foot{margin-top:24px;font-family:var(--mono);font-size:11px;letter-spacing:.03em;color:var(--muted);text-align:center}
.f-foot a{color:var(--muted);border-bottom:1px solid transparent}
.f-foot a:hover{color:var(--accent)}
.done{text-align:center}
.done .ring{width:52px;height:52px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;margin:0 auto 18px;font-size:24px}
.pos{font-family:var(--mono);font-size:clamp(30px,7vw,44px);font-weight:400;color:var(--accent);text-shadow:var(--glow);letter-spacing:-.02em}
.share{display:flex;gap:8px;margin-top:16px}
.share input{font-family:var(--mono);font-size:12px}
.refnote{background:var(--accent-soft);border-radius:10px;padding:11px 14px;font-size:13px;color:var(--sec);margin-bottom:20px}
.refnote b{color:var(--ink)}
`

function renderField(f: Field): string {
  const id = `f_${escapeAttr(f.key)}`
  const req = f.required ? ' required' : ''
  const star = f.required ? ' <span class="req">*</span>' : ''
  const label = `<label for="${id}">${escapeHtml(f.label)}${star}</label>`
  const ph = f.placeholder ? ` placeholder="${escapeAttr(f.placeholder)}"` : ''
  let control = ''
  if (f.type === 'long') control = `<textarea id="${id}" name="${escapeAttr(f.key)}"${req}${ph}></textarea>`
  else if (f.type === 'email') control = `<input id="${id}" type="email" name="${escapeAttr(f.key)}"${req}${ph}/>`
  else if (f.type === 'number') control = `<input id="${id}" type="number" name="${escapeAttr(f.key)}"${req}${ph}/>`
  else if (f.type === 'choice') {
    control = `<div class="choices">${(f.options ?? []).map((o, i) => `<label class="opt"><input type="radio" name="${escapeAttr(f.key)}" value="${escapeAttr(o)}"${i === 0 && f.required ? ' required' : ''}/>${escapeHtml(o)}</label>`).join('')}</div>`
  } else if (f.type === 'checkboxes') {
    control = `<div class="choices">${(f.options ?? []).map((o) => `<label class="opt"><input type="checkbox" name="${escapeAttr(f.key)}" value="${escapeAttr(o)}"/>${escapeHtml(o)}</label>`).join('')}</div>`
  } else control = `<input id="${id}" type="text" name="${escapeAttr(f.key)}"${req}${ph}/>`
  return `<div class="field">${label}${control}</div>`
}

async function page(c: Ctx, form: FormRow, inner: string, refBanner = ''): Promise<Response> {
  const { site } = await turnstileKeys(c.env)
  const head = site ? `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` : ''
  const body = `<main class="wrap">
    <div class="top"><button class="tgl" type="button" onclick="__toggleTheme()" aria-label="Toggle theme">◐</button></div>
    <div class="card">${refBanner}${inner}</div>
    <p class="f-foot">Powered by <a href="https://formweh.com" target="_blank" rel="noopener">Formweh</a></p>
  </main>`
  return c.html(shell({ title: `${form.intro_title || form.name} · Formweh`, description: form.intro_desc || undefined, css: FORM_CSS, head, body }))
}

// GET /f/:slug — the hosted form (or a minimal note for bring-your-own forms).
export async function renderFormPage(c: Ctx, form: FormRow): Promise<Response> {
  if (form.mode === 'byo') {
    return page(
      c,
      form,
      `<p class="lab" style="color:var(--accent);margin-bottom:10px">Endpoint</p>
       <h1 class="f-title">${escapeHtml(form.name)}</h1>
       <p class="f-desc">This form receives submissions from your own markup. Point your form's <code>action</code> at <code>${escapeHtml(origin(c))}/f/${escapeHtml(form.slug)}</code>.</p>`,
    )
  }
  if (form.closed) {
    return page(c, form, `<h1 class="f-title">${escapeHtml(form.intro_title || form.name)}</h1><p class="f-desc">This form is closed and no longer accepting responses.</p>`)
  }
  const fields = parseFields(form)
  const { site } = await turnstileKeys(c.env)
  const ref = c.req.query('ref') || ''
  let refBanner = ''
  if (form.referral && ref) {
    const inviter = await subByRefCode(c.env, ref)
    if (inviter) refBanner = `<div class="refnote">A friend invited you to <b>${escapeHtml(form.name)}</b>. Join and you both move up the line.</div>`
  }
  const inner = `
    <h1 class="f-title">${escapeHtml(form.intro_title || form.name)}</h1>
    ${form.intro_desc ? `<p class="f-desc">${escapeHtml(form.intro_desc)}</p>` : ''}
    <form class="formweh" method="POST" action="/f/${escapeHtml(form.slug)}">
      ${fields.map(renderField).join('')}
      <input type="text" name="_gotcha" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true"/>
      ${ref ? `<input type="hidden" name="_ref" value="${escapeAttr(ref)}"/>` : ''}
      ${form.spam_protection && site ? `<div class="cf-turnstile" data-sitekey="${escapeAttr(site)}"></div>` : ''}
      <button class="btn lg" type="submit" style="margin-top:4px">${form.kind === 'waitlist' ? 'Join' : 'Submit'}</button>
    </form>`
  return page(c, form, inner, refBanner)
}

// POST /f/:slug — the submission pipeline.
export async function submitForm(c: Ctx, form: FormRow): Promise<Response> {
  if (form.closed || form.archived) return respondError(c, form, 'This form is closed.')
  const ctype = c.req.header('content-type') || ''
  const wantsJson = ctype.includes('application/json') || (c.req.header('accept') || '').includes('application/json')

  let raw: Record<string, unknown> = {}
  if (ctype.includes('application/json')) {
    raw = await c.req.json().catch(() => ({}))
  } else {
    const body = await c.req.parseBody({ all: true })
    for (const [k, v] of Object.entries(body)) raw[k] = Array.isArray(v) ? v.map(String) : v
  }

  // Honeypot: a bot that fills the hidden field is spam. Capture the Turnstile
  // token and control fields, then strip them so they don't land in the data.
  const honey = String(raw['_gotcha'] ?? '').length > 0
  const refCodeIn = String(raw['_ref'] ?? '') || c.req.query('ref') || ''
  const turnstileToken = String(raw['cf-turnstile-response'] ?? '')
  delete raw['_gotcha']
  delete raw['_ref']
  delete raw['cf-turnstile-response']

  // Turnstile: if configured for this form, a missing/invalid token files the
  // response under spam rather than dropping it (a real visitor with JS trouble
  // isn't lost, and bots aren't tipped off).
  let spam = honey
  const { secret } = await turnstileKeys(c.env)
  if (form.spam_protection && secret) {
    const ok = await verifyTurnstile(secret, turnstileToken, c.req.header('cf-connecting-ip'))
    if (!ok) spam = true
  }

  // Pull out an email for notifications / waitlist / autoresponder.
  const fields = parseFields(form)
  const emailKey = fields.find((f) => f.type === 'email')?.key || (Object.keys(raw).find((k) => /email/i.test(k)) ?? '')
  const email = emailKey ? String(raw[emailKey] ?? '').trim() || null : firstEmail(raw)

  const traits = clientTraits(c.req.raw)
  const referer = c.req.header('referer') || null

  // Waitlist: mint this signup's own share code, and credit the inviter.
  let myCode: string | null = null
  let referredBy: string | null = null
  if (form.referral && !spam) {
    myCode = shortCode()
    if (refCodeIn) {
      const inviter = await subByRefCode(c.env, refCodeIn)
      if (inviter && inviter.form_id === form.id) referredBy = refCodeIn
    }
  }

  const id = await insertSubmission(c.env, {
    form_id: form.id,
    data: raw,
    email,
    spam,
    country: traits.country || null,
    device: traits.device || null,
    os: traits.os || null,
    referer,
    ref_code: myCode,
    referred_by: referredBy,
  })
  if (referredBy) c.executionCtx.waitUntil(incrementReferrals(c.env, referredBy))

  // Notifications only for non-spam.
  if (!spam) {
    const summary = summarize(form, raw, email, origin(c))
    c.executionCtx.waitUntil(dispatchNotifications(c.env, form, summary))
    if (email) c.executionCtx.waitUntil(sendAutoresponder(c.env, form, email, new URL(c.req.url).host))
  }

  // Respond. JSON for API/AJAX callers; a redirect or a success page otherwise.
  if (wantsJson) return c.json({ ok: true, id })
  if (form.redirect_url) return c.redirect(form.redirect_url, 303)
  if (form.mode === 'byo') return c.redirect(`/f/${form.slug}/thanks`, 303)
  // Hosted: show the success (and, for waitlists, the position + share).
  return successPage(c, form, { id, email, myCode })
}

async function successPage(c: Ctx, form: FormRow, r: { id: number; email: string | null; myCode: string | null }): Promise<Response> {
  if (form.referral && r.myCode) {
    const sub = await subByRefCode(c.env, r.myCode)
    const pos = sub ? await waitlistPosition(c.env, form.id, sub) : await waitlistTotal(c.env, form.id)
    const total = await waitlistTotal(c.env, form.id)
    const link = `${origin(c)}/f/${form.slug}?ref=${r.myCode}`
    const inner = `<div class="done">
      <div class="ring">✓</div>
      <h1 class="f-title">${escapeHtml(form.success_message || 'You’re on the list.')}</h1>
      <p class="f-desc">You’re <b>#${pos}</b> of ${total} in line.</p>
      <p class="f-desc" style="margin-top:16px">Skip the line: every friend who joins with your link moves you up.</p>
      <div class="share">
        <input id="rl" value="${escapeAttr(link)}" readonly aria-label="Your referral link"/>
        <button class="btn" type="button" onclick="navigator.clipboard.writeText(document.getElementById('rl').value);this.textContent='Copied'">Copy</button>
      </div>
    </div>`
    return page(c, form, inner)
  }
  const inner = `<div class="done">
    <div class="ring">✓</div>
    <h1 class="f-title">${escapeHtml(form.success_message || 'Thanks, we got it.')}</h1>
  </div>`
  return page(c, form, inner)
}

export async function thanksRedirect(c: Ctx, form: FormRow): Promise<Response> {
  const inner = `<div class="done"><div class="ring">✓</div><h1 class="f-title">${escapeHtml(form.success_message || 'Thanks, we got it.')}</h1></div>`
  return page(c, form, inner)
}

function respondError(c: Ctx, form: FormRow, msg: string): Response {
  const wantsJson = (c.req.header('accept') || '').includes('application/json')
  if (wantsJson) return c.json({ ok: false, error: msg }, 400)
  return c.html(shell({ title: 'Closed · Formweh', css: FORM_CSS, body: `<main class="wrap"><div class="card"><h1 class="f-title">${escapeHtml(msg)}</h1></div></main>` }), 400)
}

async function verifyTurnstile(secret: string, token: string, ip?: string): Promise<boolean> {
  if (!token) return false
  try {
    const fd = new FormData()
    fd.append('secret', secret)
    fd.append('response', token)
    if (ip) fd.append('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd })
    const j = (await res.json()) as { success: boolean }
    return !!j.success
  } catch {
    return false
  }
}

function firstEmail(raw: Record<string, unknown>): string | null {
  for (const v of Object.values(raw)) {
    const s = String(v ?? '')
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return s
  }
  return null
}
