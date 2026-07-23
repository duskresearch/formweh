import type { Context } from 'hono'
import type { Env } from './index'
import { origin } from './index'
import { shell, escapeHtml, escapeAttr, wordmark } from './theme'
import { TEMPLATES } from './templates'
import {
  listForms, getForm, formCounts, listSubmissions, getSubmission, getFormById,
  parseData, parseFields, markRead, markSpam, deleteSubmission,
  type FormRow, type SubmissionRow,
} from './db'

type Ctx = Context<{ Bindings: Env }>

const APP_CSS = `
.app{display:grid;grid-template-columns:230px 1fr;min-height:100dvh}
.side{background:var(--sunken);border-right:1px solid var(--border);padding:18px 14px;display:flex;flex-direction:column;gap:3px;position:sticky;top:0;height:100dvh;overflow-y:auto}
.side .brand{display:flex;align-items:center;justify-content:space-between;padding:4px 8px 16px}
.side .grp{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:14px 8px 7px}
.si{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;font-size:14px;color:var(--sec);cursor:pointer}
.si:hover{background:var(--border);color:var(--ink)}
.si .ct{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--muted)}
.si.on{background:var(--raise);color:var(--ink);font-weight:600;box-shadow:var(--shadow-sm)}
.si.on .ct{color:var(--accent)}
.si .dot{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:var(--glow);flex:none}
.side .foot{margin-top:auto;padding-top:14px;display:flex;gap:8px;align-items:center}
.main{min-width:0;display:flex;flex-direction:column}
.mtop{display:flex;align-items:center;gap:14px;padding:20px 26px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.mtop h1{font-size:19px;font-weight:660;letter-spacing:-.02em}
.mtop .sub{font-family:var(--mono);font-size:11.5px;color:var(--muted)}
.mtop .sp{flex:1}
.mtop .acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.tabbar{display:flex;gap:2px;padding:0 26px;border-bottom:1px solid var(--border)}
.tabbar a{font-family:var(--mono);font-size:12px;color:var(--muted);padding:11px 12px;border-bottom:2px solid transparent;margin-bottom:-1px}
.tabbar a.on{color:var(--accent);border-bottom-color:var(--accent);font-weight:600}
.content{padding:8px 0}
.row{display:grid;grid-template-columns:9px 1fr auto;align-items:center;gap:14px;padding:14px 26px;border-bottom:1px solid var(--border);cursor:pointer}
.row:hover{background:var(--surface)}
.row .un{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:var(--glow)}
.row.read .un{background:transparent}
.row .who .nm{font-weight:620;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row .who .pv{color:var(--muted);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.row .rt{font-family:var(--mono);font-size:11px;color:var(--muted);white-space:nowrap;text-align:right}
.row .rt .rr{color:var(--accent)}
.empty{max-width:460px;margin:12vh auto;text-align:center;padding:0 24px}
.empty h2{font-size:24px;font-weight:680;letter-spacing:-.02em;margin-bottom:10px}
.empty p{color:var(--sec);margin-bottom:22px}
.notice{padding:11px 26px;background:var(--accent-soft);color:var(--sec);font-size:13px;display:flex;gap:8px;align-items:center;border-bottom:1px solid var(--border)}
.snip{margin:18px 26px;background:var(--sunken);border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-family:var(--mono);font-size:12.5px;color:var(--ink);overflow-x:auto;display:flex;justify-content:space-between;gap:12px;align-items:center}
.dwrap{display:grid;grid-template-columns:1fr 240px;gap:0;min-height:calc(100dvh - 130px)}
.dmain{padding:24px 26px}
.kv{display:flex;flex-direction:column;margin:6px 0 20px}
.kv .r{display:grid;grid-template-columns:150px 1fr;gap:14px;padding:13px 0;border-top:1px solid var(--border);font-size:14px}
.kv .r:last-child{border-bottom:1px solid var(--border)}
.kv .k{font-family:var(--mono);font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);padding-top:2px}
.kv .v{color:var(--ink);white-space:pre-wrap;line-height:1.55}
.drail{background:var(--sunken);border-left:1px solid var(--border);padding:22px 20px;display:flex;flex-direction:column;gap:16px}
.drail .g .lab{margin-bottom:6px}
.drail .g .val{font-size:13.5px;font-weight:600;display:flex;align-items:center;gap:7px}
.back{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);display:inline-block;margin-bottom:16px}
.dact{display:flex;gap:8px;flex-wrap:wrap;margin-top:22px}
/* chooser */
.new{max-width:760px;margin:0 auto;padding:6vh 24px 8vh}
.new h1{font-size:clamp(24px,3.4vw,30px);font-weight:680;letter-spacing:-.025em;margin-bottom:6px;text-wrap:balance}
.new .lede{color:var(--sec);margin-bottom:28px}
.choose{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.choice{border:1px solid var(--border-strong);border-radius:12px;background:var(--surface);padding:20px 18px;cursor:pointer;text-align:left;transition:border-color .15s,box-shadow .15s}
.choice:hover{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.choice .ci{width:32px;height:32px;border-radius:9px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-family:var(--mono);font-size:14px;margin-bottom:12px}
.choice .cn{font-weight:660;font-size:15px;margin-bottom:5px}
.choice .cs{color:var(--sec);font-size:13px;line-height:1.45}
.tpls{margin-top:30px}
.tplgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}
.tplc{display:flex;align-items:flex-start;gap:12px;border:1px solid var(--border);border-radius:11px;background:var(--surface);padding:15px 16px;cursor:pointer;text-align:left;transition:border-color .15s}
.tplc:hover{border-color:var(--accent)}
.tplc .tk{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);background:var(--accent-soft);border-radius:6px;padding:4px 7px;flex:none}
.tplc .tn{font-weight:620;font-size:14px}
.tplc .ts{color:var(--muted);font-size:12.5px;margin-top:2px}
@media(max-width:760px){
  .app{grid-template-columns:1fr}
  .side{position:static;height:auto;flex-direction:row;flex-wrap:wrap}
  .side .brand,.side .grp,.side .foot{width:100%}
  .dwrap{grid-template-columns:1fr}
  .drail{border-left:0;border-top:1px solid var(--border)}
  .choose,.tplgrid{grid-template-columns:1fr}
}
`

// ── app chrome ────────────────────────────────────────────────────────────────
async function appShell(c: Ctx, opts: { title: string; main: string; active?: string; nav?: 'forms' | 'spam' | 'settings' }): Promise<Response> {
  const forms = await listForms(c.env)
  const counts = await Promise.all(forms.map((f) => formCounts(c.env, f.id)))
  const items = forms
    .map((f, i) => {
      const on = opts.active === f.slug ? ' on' : ''
      const unread = counts[i].unread
      return `<a class="si${on}" href="/inbox/${escapeAttr(f.slug)}">
        ${unread ? '<span class="dot"></span>' : '<span style="width:8px;flex:none"></span>'}
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(f.name)}</span>
        <span class="ct">${counts[i].total}</span></a>`
    })
    .join('')
  const side = `<aside class="side">
    <div class="brand"><a href="/">${wordmark()}</a>
      <button class="tgl" type="button" onclick="__toggleTheme()" aria-label="Toggle theme">◐</button></div>
    <a class="btn sm" href="/new" style="justify-content:center">+ New form</a>
    <div class="grp">Forms</div>
    ${items || '<div style="padding:8px 10px;color:var(--muted);font-size:13px">No forms yet</div>'}
    <div class="grp">Manage</div>
    <a class="si${opts.nav === 'settings' ? ' on' : ''}" href="/settings"><span style="width:8px;flex:none"></span>Settings</a>
    <div class="foot"><form method="POST" action="/logout"><button class="btn ghost sm" type="submit">Sign out</button></form></div>
  </aside>`
  return c.html(shell({ title: opts.title, css: APP_CSS, body: `<div class="app">${side}<div class="main">${opts.main}</div></div>` }))
}

// ── home ──────────────────────────────────────────────────────────────────────
export async function homePage(c: Ctx): Promise<Response> {
  const forms = await listForms(c.env)
  if (forms.length) return c.redirect(`/inbox/${forms[0].slug}`)
  const main = `<div class="empty">
    <p class="lab" style="color:var(--accent);margin-bottom:14px">${c.req.query('welcome') ? 'You’re all set' : 'Your dashboard'}</p>
    <h2>Make your first form</h2>
    <p>Build one here, bring your own, or start from a template. Every response lands right here, and it’s all yours.</p>
    <a class="btn lg" href="/new">Make a form</a>
  </div>`
  return appShell(c, { title: 'Formweh', main })
}

// ── inbox ─────────────────────────────────────────────────────────────────────
export async function inboxPage(c: Ctx): Promise<Response> {
  const form = await getForm(c.env, c.req.param('slug') ?? '')
  if (!form) return c.notFound()
  const showSpam = c.req.query('spam') === '1'
  const counts = await formCounts(c.env, form.id)
  const subs = await listSubmissions(c.env, form.id, { spam: showSpam })
  const formUrl = `${origin(c)}/f/${form.slug}`

  const byoSnippet =
    form.mode === 'byo'
      ? `<div class="snip"><span>Point your form's action at &nbsp;<b>${escapeHtml(formUrl)}</b></span>
         <button class="btn sm ghost" type="button" onclick="navigator.clipboard.writeText('${escapeAttr(formUrl)}');this.textContent='Copied'">Copy</button></div>`
      : ''

  const rows =
    subs
      .map((s) => {
        const d = parseData(s)
        const primary = s.email || String(Object.values(d)[0] ?? 'Response')
        const preview = Object.entries(d)
          .map(([k, v]) => `${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' · ')
        const rr = form.referral && s.referrals ? `<span class="rr">${s.referrals} ref</span> · ` : ''
        return `<a class="row ${s.is_read ? 'read' : ''}" href="/sub/${s.id}">
          <span class="un"></span>
          <div class="who"><div class="nm">${escapeHtml(primary)}</div><div class="pv">${escapeHtml(preview)}</div></div>
          <div class="rt">${rr}${escapeHtml(ago(s.created_at))}</div></a>`
      })
      .join('') ||
    `<div class="empty" style="margin:8vh auto"><h2>${showSpam ? 'No spam' : 'No responses yet'}</h2><p>${showSpam ? 'Nothing filed as spam.' : 'Share your form and responses will appear here.'}</p>${!showSpam ? `<a class="btn ghost" href="${escapeAttr(formUrl)}" target="_blank" rel="noopener">Open the form ↗</a>` : ''}</div>`

  const main = `
    <div class="mtop">
      <div><h1>${escapeHtml(form.name)}</h1><div class="sub">${counts.total} response${counts.total === 1 ? '' : 's'}${counts.unread ? ` · ${counts.unread} new` : ''}</div></div>
      <div class="sp"></div>
      <div class="acts">
        ${form.mode === 'hosted' ? `<a class="btn ghost sm" href="${escapeAttr(formUrl)}" target="_blank" rel="noopener">Open form ↗</a>` : ''}
        <a class="btn ghost sm" href="/build/${escapeAttr(form.slug)}">Edit</a>
        <a class="btn ghost sm" href="/export/${escapeAttr(form.slug)}">Export CSV</a>
      </div>
    </div>
    <div class="tabbar">
      <a class="${!showSpam ? 'on' : ''}" href="/inbox/${escapeAttr(form.slug)}">Responses ${counts.total ? `(${counts.total})` : ''}</a>
      <a class="${showSpam ? 'on' : ''}" href="/inbox/${escapeAttr(form.slug)}?spam=1">Spam ${counts.spam ? `(${counts.spam})` : ''}</a>
    </div>
    ${byoSnippet}
    <div class="content">${rows}</div>`
  return appShell(c, { title: `${form.name} · Formweh`, main, active: form.slug })
}

// ── submission detail ───────────────────────────────────────────────────────────
export async function submissionPage(c: Ctx): Promise<Response> {
  const id = Number(c.req.param('id'))
  const s = await getSubmission(c.env, id)
  if (!s) return c.notFound()
  const form = await getFormById(c.env, s.form_id)
  if (!form) return c.notFound()
  if (!s.is_read) c.executionCtx.waitUntil(markRead(c.env, id))
  const d = parseData(s)
  const kv = Object.entries(d)
    .map(([k, v]) => `<div class="r"><div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(Array.isArray(v) ? v.join(', ') : String(v ?? ''))}</div></div>`)
    .join('')
  const primary = s.email || String(Object.values(d)[0] ?? 'Response')
  const main = `
    <div class="dwrap">
      <div class="dmain">
        <a class="back" href="/inbox/${escapeAttr(form.slug)}">← ${escapeHtml(form.name)}</a>
        <h1 style="font-size:20px;font-weight:660;letter-spacing:-.02em">${escapeHtml(primary)}</h1>
        <div class="mono" style="font-size:12px;color:var(--muted);margin-top:5px">${escapeHtml(fullDate(s.created_at))}</div>
        <div class="kv">${kv || '<div class="r"><div class="v">(empty)</div></div>'}</div>
        <div class="dact">
          ${s.email ? `<a class="btn sm" href="mailto:${escapeAttr(s.email)}">Reply by email</a>` : ''}
          <form method="POST" action="/sub/${s.id}/${s.spam ? 'unspam' : 'spam'}"><button class="btn ghost sm" type="submit">${s.spam ? 'Not spam' : 'Mark spam'}</button></form>
          <a class="btn ghost sm" href="/export/${escapeAttr(form.slug)}">Export</a>
          <form method="POST" action="/sub/${s.id}/delete" onsubmit="return confirm('Delete this response?')"><button class="btn danger sm" type="submit">Delete</button></form>
        </div>
      </div>
      <aside class="drail">
        ${s.country ? `<div class="g"><div class="lab">Country</div><div class="val">${escapeHtml(s.country)}</div></div>` : ''}
        ${s.device || s.os ? `<div class="g"><div class="lab">Device</div><div class="val">${escapeHtml([s.device, s.os].filter(Boolean).join(' · '))}</div></div>` : ''}
        <div class="g"><div class="lab">Spam</div><div class="val" style="color:${s.spam ? 'var(--warn)' : 'var(--accent)'}">${s.spam ? 'Filed as spam' : 'Looks human'}</div></div>
        ${form.referral ? `<div class="g"><div class="lab">Referrals</div><div class="val">${s.referrals} joined via them</div></div>` : ''}
        ${s.referer ? `<div class="g"><div class="lab">From</div><div class="val" style="font-weight:400;font-size:12px;word-break:break-all">${escapeHtml(s.referer)}</div></div>` : ''}
      </aside>
    </div>`
  return appShell(c, { title: `Response · Formweh`, main, active: form.slug })
}

export async function submissionAction(c: Ctx): Promise<Response> {
  const id = Number(c.req.param('id'))
  const action = c.req.param('action')
  const s = await getSubmission(c.env, id)
  if (!s) return c.notFound()
  const form = await getFormById(c.env, s.form_id)
  if (action === 'spam') await markSpam(c.env, id, true)
  else if (action === 'unspam') await markSpam(c.env, id, false)
  else if (action === 'read') await markRead(c.env, id, true)
  else if (action === 'delete') {
    await deleteSubmission(c.env, id)
    return c.redirect(`/inbox/${form?.slug ?? ''}`)
  }
  return c.redirect(action === 'unspam' ? `/inbox/${form?.slug}?spam=1` : `/inbox/${form?.slug}`)
}

// ── new form chooser ────────────────────────────────────────────────────────────
export async function newFormPage(c: Ctx): Promise<Response> {
  const tpls = TEMPLATES.map(
    (t) => `<button class="tplc" type="submit" name="template" value="${escapeAttr(t.id)}" form="tf">
      <span class="tk">${t.kind}</span>
      <span><div class="tn">${escapeHtml(t.name)}</div><div class="ts">${escapeHtml(t.blurb)}</div></span></button>`,
  ).join('')
  const main = `<div class="new">
    <h1>Make a form</h1>
    <p class="lede">Build one here, bring your own, or start from a template. It all lands in one inbox.</p>
    <div class="choose">
      <form method="POST" action="/forms"><input type="hidden" name="how" value="build"/>
        <button class="choice" type="submit" style="width:100%">
          <div class="ci">✎</div><div class="cn">Build one</div><div class="cs">Design a form or survey in the builder. Hosted on your site.</div></button></form>
      <form method="POST" action="/forms"><input type="hidden" name="how" value="byo"/>
        <button class="choice" type="submit" style="width:100%">
          <div class="ci">&lt;/&gt;</div><div class="cn">Bring your own</div><div class="cs">Already have a form? Point it here and keep your markup.</div></button></form>
      <div class="choice" onclick="document.getElementById('tpls').scrollIntoView({behavior:'smooth'})">
        <div class="ci">▦</div><div class="cn">From a template</div><div class="cs">Start from a ready-made one below and tweak it.</div></div>
    </div>
    <div class="tpls" id="tpls">
      <div class="lab" style="color:var(--muted)">Templates</div>
      <form id="tf" method="POST" action="/forms"><input type="hidden" name="how" value="template"/></form>
      <div class="tplgrid">${tpls}</div>
    </div>
  </div>`
  return appShell(c, { title: 'New form · Formweh', main })
}

// ── login / first-run setup ─────────────────────────────────────────────────────
export function loginOrSetupPage(hasPw: boolean, error?: string): string {
  const css = `
    .auth{max-width:380px;margin:14vh auto;padding:0 24px}
    .auth .brand{display:flex;justify-content:center;margin-bottom:26px}
    .auth .card{background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-md);padding:30px}
    .auth h1{font-size:20px;font-weight:660;letter-spacing:-.02em;text-align:center;margin-bottom:6px}
    .auth p.s{color:var(--sec);font-size:13.5px;text-align:center;margin-bottom:22px}
    .auth .err{color:var(--danger);font-size:13px;text-align:center;margin-bottom:14px}
    .auth form{display:flex;flex-direction:column;gap:14px}
    .top{display:flex;justify-content:flex-end;padding:16px 18px}`
  const err =
    error === 'wrong' ? 'That password is not right.' : error === 'short' ? 'Use at least 8 characters.' : error === 'unset' ? 'Set a password first.' : ''
  const body = hasPw
    ? `<div class="top"><button class="tgl" type="button" onclick="__toggleTheme()">◐</button></div>
       <main class="auth"><div class="brand">${wordmark(18)}</div><div class="card">
        <h1>Sign in</h1><p class="s">to your Formweh dashboard</p>
        ${err ? `<div class="err">${escapeHtml(err)}</div>` : ''}
        <form method="POST" action="/login">
          <div><label for="pw">Password</label><input id="pw" type="password" name="password" autofocus required/></div>
          <button class="btn lg" type="submit">Sign in</button></form></div></main>`
    : `<div class="top"><button class="tgl" type="button" onclick="__toggleTheme()">◐</button></div>
       <main class="auth"><div class="brand">${wordmark(18)}</div><div class="card">
        <h1>Welcome to Formweh</h1><p class="s">Create a password to protect your dashboard. This is the only thing guarding it, so make it a good one.</p>
        ${err ? `<div class="err">${escapeHtml(err)}</div>` : ''}
        <form method="POST" action="/setup">
          <div><label for="pw">Choose a password</label><input id="pw" type="password" name="password" minlength="8" autofocus required placeholder="At least 8 characters"/></div>
          <button class="btn lg" type="submit">Create dashboard</button></form></div></main>`
  return shell({ title: hasPw ? 'Sign in · Formweh' : 'Set up · Formweh', css, body })
}

// ── time helpers ──────────────────────────────────────────────────────────────
function ago(iso: string): string {
  const then = Date.parse(iso.replace(' ', 'T') + 'Z')
  const s = Math.max(0, (Date.now() - then) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 172800) return 'yesterday'
  return `${Math.floor(s / 86400)}d ago`
}
function fullDate(iso: string): string {
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}
