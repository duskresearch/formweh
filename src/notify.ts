import type { Env } from './index'
import type { FormRow } from './db'
import { loadSettings } from './settings'

// When a response lands, fan out notifications. Everything here is best-effort and
// must never break the submission: we swallow errors so a misconfigured webhook or
// unverified email can't cost the user a lead. Call via ctx.waitUntil so it runs
// after the visitor already got their "thanks".

type Summary = { fields: Array<[string, string]>; email: string | null; formName: string; inboxUrl: string }

export function summarize(form: FormRow, data: Record<string, unknown>, email: string | null, origin: string): Summary {
  const fields: Array<[string, string]> = Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v ?? '')])
  return { fields, email, formName: form.name, inboxUrl: `${origin}/inbox/${form.slug}` }
}

export async function dispatchNotifications(env: Env, form: FormRow, summary: Summary): Promise<void> {
  const s = await loadSettings(env)
  const jobs: Promise<unknown>[] = []

  // Email me on new submission (Cloudflare Email Service).
  const to = s.get('notify_email')
  if (form.notify && to && env.EMAIL) {
    const host = new URL(summary.inboxUrl).host
    const from = s.get('from_email') || `notifications@${host}`
    const rows = summary.fields.map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#8a8f82;font-size:13px;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font-size:14px">${esc(v)}</td></tr>`).join('')
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px">
      <p style="font-size:13px;color:#1A7F37;letter-spacing:.04em;text-transform:uppercase;margin:0 0 6px">New response · ${esc(summary.formName)}</p>
      <table style="border-collapse:collapse;margin:10px 0 18px">${rows}</table>
      <a href="${esc(summary.inboxUrl)}" style="color:#1A7F37">Open it in your dashboard →</a>
    </div>`
    const text = `New response on ${summary.formName}\n\n` + summary.fields.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${summary.inboxUrl}`
    jobs.push(
      Promise.resolve(env.EMAIL.send({ from, to, subject: `New response · ${summary.formName}`, html, text })).catch((e) =>
        console.error('email notify failed', String(e)),
      ),
    )
  }

  // Chat webhooks.
  const line = `*New response* on *${summary.formName}*\n` + summary.fields.map(([k, v]) => `• ${k}: ${v}`).join('\n') + `\n${summary.inboxUrl}`
  const slack = s.get('slack_webhook')
  if (slack) jobs.push(post(slack, { text: line }))
  const discord = s.get('discord_webhook')
  if (discord) jobs.push(post(discord, { content: line.slice(0, 1900) }))
  const generic = s.get('webhook_url')
  if (generic) jobs.push(post(generic, { form: summary.formName, fields: Object.fromEntries(summary.fields), inbox: summary.inboxUrl }))

  await Promise.allSettled(jobs)
}

// Autoresponder to the person who submitted. Needs the Workers Paid plan and an
// onboarded sending domain; best-effort, and only fires when the form has an email.
export async function sendAutoresponder(env: Env, form: FormRow, toEmail: string, host: string): Promise<void> {
  if (!form.autoresponder || !toEmail || !env.EMAIL) return
  const s = await loadSettings(env)
  const from = s.get('from_email') || `hello@${host}`
  const subject = form.autoresponder_subject || `Thanks for your response`
  const body = form.autoresponder_body || `Thanks, we received your response and will be in touch.`
  try {
    await env.EMAIL.send({ from, to: toEmail, subject, html: `<div style="font-family:sans-serif">${esc(body).replace(/\n/g, '<br>')}</div>`, text: body })
  } catch (e) {
    console.error('autoresponder failed', String(e))
  }
}

async function post(url: string, payload: unknown): Promise<void> {
  try {
    await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  } catch (e) {
    console.error('webhook failed', String(e))
  }
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
