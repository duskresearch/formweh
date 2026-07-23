import type { Context } from 'hono'
import type { Env } from './index'
import { shell, escapeHtml, escapeAttr, wordmark } from './theme'
import { loadSettings, setSetting, setPassword, generateToken, effectiveApiToken } from './settings'

type Ctx = Context<{ Bindings: Env }>

const CSS = `
.s{max-width:680px;margin:0 auto;padding:4vh 24px 10vh}
.s .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.s h1{font-size:24px;font-weight:680;letter-spacing:-.025em;margin:14px 0 24px}
.sect{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;margin-bottom:16px}
.sect h2{font-size:16px;font-weight:660;letter-spacing:-.01em;margin-bottom:5px}
.sect .sd{color:var(--sec);font-size:13.5px;margin-bottom:18px}
.sect .sd a{color:var(--accent)}
.row{display:flex;flex-direction:column;gap:14px}
.inline{display:flex;gap:10px;align-items:flex-end}
.inline .btn{flex:none;margin-bottom:1px}
.flash{padding:11px 14px;border-radius:10px;font-size:13.5px;margin-bottom:16px}
.flash.ok{background:var(--accent-soft);color:var(--accent)}
.flash.warn{background:var(--warn-soft);color:var(--warn)}
.token{font-family:var(--mono);font-size:13px;background:var(--sunken);border:1px solid var(--border);border-radius:9px;padding:11px 13px;word-break:break-all}
.steps{font-size:13px;color:var(--sec);line-height:1.7;padding-left:18px;margin-top:8px}
`

export async function settingsPage(c: Ctx): Promise<Response> {
  const s = await loadSettings(c.env)
  const token = await effectiveApiToken(c.env)
  const q = c.req.query()

  let flash = ''
  if (q.saved) flash = `<div class="flash ok">Saved.</div>`
  else if (q.test === 'ok') flash = `<div class="flash ok">Test email sent. Check your inbox.</div>`
  else if (q.test === 'fail') flash = `<div class="flash warn">Couldn't send. Your address likely isn't verified yet — see the steps below.</div>`
  else if (q.token) flash = `<div class="flash ok">New API token generated. Copy it now, it won't be shown again.</div>`
  else if (q.pw) flash = `<div class="flash ok">Password changed.</div>`

  const val = (k: string) => escapeAttr(s.get(k) ?? '')
  const showVerify = q.verify === '1' || q.test === 'fail'

  const main = `<div class="s">
    <div class="topbar"><a href="/">${wordmark()}</a><button class="tgl" type="button" onclick="__toggleTheme()">◐</button></div>
    <h1>Settings</h1>
    ${flash}

    <form method="POST" action="/settings"><input type="hidden" name="action" value="save"/>
      <div class="sect">
        <h2>Notifications</h2>
        <p class="sd">Where Formweh emails you when a response lands, sent through your own Cloudflare. Free to your own verified address.</p>
        <div class="row">
          <div>
            <label>Notify email</label>
            <div class="inline">
              <input name="notify_email" type="email" value="${val('notify_email')}" placeholder="you@yourdomain.com"/>
            </div>
          </div>
          <div class="inline">
            <button class="btn ghost sm" type="submit" formaction="/settings/test-email">Send test email</button>
            <button class="btn ghost sm" type="submit" formaction="/settings/verify-email">How to verify</button>
          </div>
          ${showVerify ? `<ol class="steps">
            <li>Open Cloudflare → your account → <b>Email</b> → <b>Email Routing</b> → <b>Destination Addresses</b>.</li>
            <li>Add your notify email and click the verification link Cloudflare sends you.</li>
            <li>Come back and hit <b>Send test email</b>. Free on any plan.</li>
          </ol>` : ''}
          <div><label>From address <span class="lab" style="text-transform:none">(advanced)</span></label><input name="from_email" value="${val('from_email')}" placeholder="notifications@yourdomain.com"/></div>
        </div>
      </div>

      <div class="sect">
        <h2>Chat &amp; webhooks</h2>
        <p class="sd">Ping a channel or your own endpoint the moment a response arrives.</p>
        <div class="row">
          <div><label>Slack webhook URL</label><input name="slack_webhook" value="${val('slack_webhook')}" placeholder="https://hooks.slack.com/services/…"/></div>
          <div><label>Discord webhook URL</label><input name="discord_webhook" value="${val('discord_webhook')}" placeholder="https://discord.com/api/webhooks/…"/></div>
          <div><label>Custom webhook URL</label><input name="webhook_url" value="${val('webhook_url')}" placeholder="https://yourapp.com/hooks/formweh"/></div>
        </div>
      </div>

      <div class="sect">
        <h2>Spam protection</h2>
        <p class="sd">Cloudflare <a href="https://developers.cloudflare.com/turnstile/" target="_blank" rel="noopener">Turnstile</a> keys, its free CAPTCHA. A honeypot works without these; add keys for stronger protection, then turn it on per form.</p>
        <div class="row">
          <div><label>Turnstile site key</label><input name="turnstile_site_key" value="${val('turnstile_site_key')}" placeholder="0x4AAA…"/></div>
          <div><label>Turnstile secret key</label><input name="turnstile_secret_key" value="${val('turnstile_secret_key')}" placeholder="0x4AAA…"/></div>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:22px"><button class="btn lg" type="submit">Save settings</button></div>
    </form>

    <div class="sect">
      <h2>HTTP API</h2>
      <p class="sd">A read token for pulling forms and responses into scripts. Send it as <code>Authorization: Bearer …</code>.</p>
      ${token ? `<div class="token">${escapeHtml(q.token ? token : mask(token))}</div>` : `<p style="color:var(--muted);font-size:13.5px">No token yet.</p>`}
      <form method="POST" action="/settings" style="margin-top:12px"><input type="hidden" name="action" value="gen_token"/>
        <button class="btn ghost sm" type="submit" onclick="return confirm('Generate a new token? Any existing one stops working.')">${token ? 'Regenerate token' : 'Generate token'}</button></form>
    </div>

    <div class="sect">
      <h2>Password</h2>
      <p class="sd">Change the password guarding this dashboard.</p>
      <form method="POST" action="/settings" class="row"><input type="hidden" name="action" value="password"/>
        <div><label>New password</label><input name="new_password" type="password" minlength="8" placeholder="At least 8 characters"/></div>
        <div style="display:flex"><button class="btn sm" type="submit">Change password</button></div>
      </form>
    </div>
  </div>`
  return c.html(shell({ title: 'Settings · Formweh', css: CSS, body: main }))
}

export async function saveSettings(c: Ctx): Promise<Response> {
  const b = await c.req.parseBody()
  const action = String(b.action ?? 'save')

  if (action === 'gen_token') {
    const t = generateToken()
    await setSetting(c.env, 'api_token', t)
    return c.redirect('/settings?token=1')
  }
  if (action === 'password') {
    const pw = String(b.new_password ?? '')
    if (pw.length < 8) return c.redirect('/settings?saved=0')
    await setPassword(c.env, pw)
    // Re-issue the session so changing the signing secret doesn't sign us out.
    const { issueSession } = await import('./auth')
    await issueSession(c)
    return c.redirect('/settings?pw=1')
  }

  const keys = ['notify_email', 'from_email', 'slack_webhook', 'discord_webhook', 'webhook_url', 'turnstile_site_key', 'turnstile_secret_key']
  for (const k of keys) await setSetting(c.env, k, String(b[k] ?? '').trim() || null)
  return c.redirect('/settings?saved=1')
}

// Send a test email to the configured notify address (works once it's verified).
export async function sendTestEmail(c: Ctx): Promise<Response> {
  const b = await c.req.parseBody()
  const to = String(b.notify_email ?? '').trim()
  if (to) await setSetting(c.env, 'notify_email', to)
  const s = await loadSettings(c.env)
  const from = s.get('from_email') || `notifications@${new URL(c.req.url).host}`
  if (!to || !c.env.EMAIL) return c.redirect('/settings?test=fail')
  try {
    await c.env.EMAIL.send({
      from,
      to,
      subject: 'Formweh test email',
      text: 'This is a test from your Formweh dashboard. If you got this, notifications are working.',
      html: '<p>This is a test from your Formweh dashboard. If you got this, notifications are working.</p>',
    })
    return c.redirect('/settings?test=ok')
  } catch {
    return c.redirect('/settings?test=fail')
  }
}

export async function verifyEmailAction(c: Ctx): Promise<Response> {
  const b = await c.req.parseBody()
  const to = String(b.notify_email ?? '').trim()
  if (to) await setSetting(c.env, 'notify_email', to)
  return c.redirect('/settings?verify=1')
}

function mask(t: string): string {
  return t.length > 12 ? `${t.slice(0, 8)}${'•'.repeat(12)}${t.slice(-4)}` : t
}
