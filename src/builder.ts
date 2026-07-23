import type { Context } from 'hono'
import type { Env } from './index'
import { origin } from './index'
import { shell, escapeHtml, escapeAttr, wordmark } from './theme'
import { getForm, updateForm, parseFields, type FormRow } from './db'

type Ctx = Context<{ Bindings: Env }>

const CSS = `
.b{max-width:720px;margin:0 auto;padding:4vh 24px 10vh}
.b .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
.b .topbar .l{display:flex;align-items:center;gap:14px}
.b .back{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.b h1{font-size:22px;font-weight:680;letter-spacing:-.025em}
.sect{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 22px;margin-bottom:16px}
.sect h2{font-size:13px;font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.stack{display:flex;flex-direction:column;gap:14px}
.fld{border:1px solid var(--border-strong);border-radius:11px;padding:14px;background:var(--sunken);margin-bottom:10px}
.fld .fr{display:grid;grid-template-columns:1fr 150px auto;gap:10px;align-items:center}
.fld .opts{margin-top:10px}
.fld .rm{color:var(--danger);background:transparent;border:1px solid color-mix(in srgb,var(--danger) 30%,transparent);border-radius:8px;width:34px;height:34px;cursor:pointer;font-size:16px}
.fld .reqline{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13px;color:var(--sec)}
.fld .reqline input{width:auto}
.togrow{display:flex;align-items:flex-start;gap:14px;padding:13px 0;border-top:1px solid var(--border)}
.togrow:first-child{border-top:0}
.togrow .t{flex:1}
.togrow .t .n{font-weight:620;font-size:14px;display:flex;gap:9px;align-items:center}
.togrow .t .d{color:var(--sec);font-size:13px;margin-top:3px}
.sw{width:40px;height:23px;border-radius:100px;background:var(--border-strong);position:relative;flex:none;cursor:pointer;border:0;margin-top:2px;transition:background .15s}
.sw[aria-checked="true"]{background:var(--accent)}
.sw::after{content:"";position:absolute;top:2px;left:2px;width:19px;height:19px;border-radius:50%;background:#fff;transition:left .15s}
.sw[aria-checked="true"]::after{left:19px}
.saverow{display:flex;gap:10px;align-items:center;position:sticky;bottom:0;background:var(--paper);padding:16px 0;margin-top:8px}
.snip{background:var(--sunken);border:1px solid var(--border);border-radius:10px;padding:13px 15px;font-family:var(--mono);font-size:12.5px;overflow-x:auto;display:flex;justify-content:space-between;gap:12px;align-items:center}
.codeblk{background:var(--sunken);border:1px solid var(--border);border-radius:10px;padding:13px 15px;font-family:var(--mono);font-size:12px;line-height:1.65;overflow-x:auto;white-space:pre;color:var(--ink);margin-top:14px}
.codelab{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:16px}
@media(max-width:640px){.grid2{grid-template-columns:1fr}.fld .fr{grid-template-columns:1fr}}
`

export async function builderPage(c: Ctx): Promise<Response> {
  const form = await getForm(c.env, c.req.param('slug') ?? '')
  if (!form) return c.notFound()
  const fields = parseFields(form)
  const endpoint = `${origin(c)}/f/${form.slug}`
  const isWaitlist = form.kind === 'waitlist'

  const fieldsSection =
    form.mode === 'hosted'
      ? `<div class="sect">
          <h2>Fields</h2>
          <div id="fields"></div>
          <button class="btn ghost sm" type="button" onclick="addField()">+ Add field</button>
        </div>`
      : `<div class="sect">
          <h2>Your endpoint</h2>
          <p style="color:var(--sec);font-size:13.5px;margin-bottom:12px">Point your own form at this URL and keep your exact design. Every response lands in your inbox. Field names become the columns you see.</p>
          <div class="snip"><span>${escapeHtml(endpoint)}</span>
            <button class="btn sm ghost" type="button" onclick="navigator.clipboard.writeText('${escapeAttr(endpoint)}');this.textContent='Copied'">Copy</button></div>
          <div class="codelab">Plain HTML</div>
          <div class="codeblk">${escapeHtml(`<form action="${endpoint}" method="POST">\n  <input name="email" type="email" required>\n  <textarea name="message"></textarea>\n  <button>Send</button>\n</form>`)}</div>
          <div class="codelab">JavaScript / React (JSON)</div>
          <div class="codeblk">${escapeHtml(`await fetch("${endpoint}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ email, message }),\n})`)}</div>
          <p style="color:var(--sec);font-size:13px;margin-top:14px">Cross-origin <code>fetch()</code> is allowed. For plain HTML forms, set a <b>Redirect after submit</b> below to send visitors to your own thank-you page.</p>
        </div>`

  const metaSection =
    form.mode === 'hosted'
      ? `<div class="sect">
          <h2>Page</h2>
          <div class="stack">
            <div><label>Heading</label><input name="intro_title" value="${escapeAttr(form.intro_title ?? '')}"/></div>
            <div><label>Description</label><textarea name="intro_desc" style="min-height:70px">${escapeHtml(form.intro_desc ?? '')}</textarea></div>
            <div><label>Success message</label><input name="success_message" value="${escapeAttr(form.success_message ?? '')}" placeholder="Thanks, we got it."/></div>
          </div>
        </div>`
      : ''

  const toggle = (name: string, on: boolean) => `<button type="button" class="sw" role="switch" aria-checked="${on}" onclick="this.setAttribute('aria-checked', this.getAttribute('aria-checked')==='true'?'false':'true');document.getElementById('i_${name}').value=this.getAttribute('aria-checked')==='true'?'1':'0'"></button><input type="hidden" id="i_${name}" name="${name}" value="${on ? 1 : 0}"/>`

  const settingsSection = `<div class="sect">
    <h2>This form</h2>
    <div class="togrow"><div class="t"><div class="n">Email me new responses</div><div class="d">Uses your notification email from Settings.</div></div>${toggle('notify', !!form.notify)}</div>
    <div class="togrow"><div class="t"><div class="n">Spam protection <span class="badge free">Turnstile</span></div><div class="d">Cloudflare's CAPTCHA plus a honeypot. Needs Turnstile keys in Settings.</div></div>${toggle('spam_protection', !!form.spam_protection)}</div>
    ${isWaitlist ? `<div class="togrow"><div class="t"><div class="n">Referral loop</div><div class="d">Give each signup a share link and a "skip the line" position.</div></div>${toggle('referral', !!form.referral)}</div>` : ''}
    <div class="togrow"><div class="t"><div class="n">Autoresponder <span class="badge pro">Needs Email Sending</span></div><div class="d">Auto-reply to whoever submits (Workers Paid + a sending domain).</div></div>${toggle('autoresponder', !!form.autoresponder)}</div>
    <div class="stack" style="margin-top:14px">
      <div><label>Autoresponder subject</label><input name="autoresponder_subject" value="${escapeAttr(form.autoresponder_subject ?? '')}" placeholder="Thanks for your response"/></div>
      <div><label>Autoresponder message</label><textarea name="autoresponder_body" placeholder="We received your response and will be in touch.">${escapeHtml(form.autoresponder_body ?? '')}</textarea></div>
      <div><label>Redirect after submit (optional)</label><input name="redirect_url" value="${escapeAttr(form.redirect_url ?? '')}" placeholder="https://yoursite.com/thank-you"/></div>
    </div>
    <div class="togrow"><div class="t"><div class="n">Close this form</div><div class="d">Stop accepting new responses.</div></div>${toggle('closed', !!form.closed)}</div>
  </div>`

  const main = `<form class="b" method="POST" action="/build/${escapeAttr(form.slug)}">
    <div class="topbar">
      <div class="l"><a href="/">${wordmark()}</a></div>
      <div style="display:flex;gap:10px;align-items:center">
        ${form.mode === 'hosted' ? `<a class="btn ghost sm" href="${escapeAttr(endpoint)}" target="_blank" rel="noopener">Preview ↗</a>` : ''}
        <button class="tgl" type="button" onclick="__toggleTheme()">◐</button>
      </div>
    </div>
    <a class="back" href="/inbox/${escapeAttr(form.slug)}">← ${escapeHtml(form.name)}</a>
    <h1 style="margin:8px 0 22px">Edit form</h1>
    <div class="sect"><h2>Name</h2><input name="name" value="${escapeAttr(form.name)}"/></div>
    ${fieldsSection}
    ${metaSection}
    ${settingsSection}
    <input type="hidden" name="fields" id="fieldsJson"/>
    <div class="saverow">
      <button class="btn lg" type="submit">Save changes</button>
      <a class="btn ghost" href="/inbox/${escapeAttr(form.slug)}">Cancel</a>
      <div style="flex:1"></div>
      <button class="btn danger sm" type="submit" formaction="/build/${escapeAttr(form.slug)}?delete=1" onclick="return confirm('Delete this form and all its responses?')">Delete form</button>
    </div>
  </form>`

  const script = `
    var FIELDS = ${JSON.stringify(fields)};
    var TYPES = [['short','Short answer'],['long','Long answer'],['email','Email'],['number','Number'],['choice','Multiple choice'],['checkboxes','Checkboxes']];
    function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
    function fieldHtml(f,i){
      var opts=TYPES.map(function(t){return '<option value="'+t[0]+'"'+(t[0]===f.type?' selected':'')+'>'+t[1]+'</option>'}).join('');
      var hasOpts=(f.type==='choice'||f.type==='checkboxes');
      return '<div class="fld" data-i="'+i+'">'+
        '<div class="fr">'+
          '<input class="f-label" placeholder="Question label" value="'+esc(f.label)+'"/>'+
          '<select class="f-type" onchange="onType(this)">'+opts+'</select>'+
          '<button type="button" class="rm" onclick="this.closest(\\'.fld\\').remove()">×</button>'+
        '</div>'+
        '<div class="opts" '+(hasOpts?'':'style="display:none"')+'><input class="f-opts" placeholder="Options, comma separated" value="'+esc((f.options||[]).join(', '))+'"/></div>'+
        '<label class="reqline"><input type="checkbox" class="f-req" '+(f.required?'checked':'')+'/> Required</label>'+
      '</div>';
    }
    function render(){var c=document.getElementById('fields');if(!c)return;c.innerHTML=FIELDS.map(fieldHtml).join('')}
    function addField(){FIELDS.push({key:'',label:'',type:'short',required:false,options:[]});document.getElementById('fields').insertAdjacentHTML('beforeend',fieldHtml(FIELDS[FIELDS.length-1],FIELDS.length-1))}
    function onType(sel){var opts=sel.closest('.fld').querySelector('.opts');opts.style.display=(sel.value==='choice'||sel.value==='checkboxes')?'block':'none'}
    function slugKey(s,i){return (s||'field').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40)||('field_'+i)}
    function collect(){
      var rows=document.querySelectorAll('#fields .fld');if(!rows.length)return [];
      var used={};var out=[];
      rows.forEach(function(r,i){
        var label=r.querySelector('.f-label').value.trim();
        var type=r.querySelector('.f-type').value;
        var req=r.querySelector('.f-req').checked;
        var opts=r.querySelector('.f-opts').value.split(',').map(function(x){return x.trim()}).filter(Boolean);
        if(!label)return;
        var key=slugKey(label,i);while(used[key])key=key+'_';used[key]=1;
        var f={key:key,label:label,type:type,required:req};if(type==='choice'||type==='checkboxes')f.options=opts;
        out.push(f);
      });
      return out;
    }
    render();
    var bf=document.querySelector('form.b');
    if(bf)bf.addEventListener('submit',function(){document.getElementById('fieldsJson').value=JSON.stringify(collect())});
  `
  return c.html(shell({ title: `Edit ${form.name} · Formweh`, css: CSS, body: `<div class="app-plain">${main}</div>`, script }))
}

export async function saveBuilder(c: Ctx): Promise<Response> {
  const form = await getForm(c.env, c.req.param('slug') ?? '')
  if (!form) return c.notFound()
  if (c.req.query('delete') === '1') {
    const { deleteForm } = await import('./db')
    await deleteForm(c.env, form.id)
    return c.redirect('/')
  }
  const b = await c.req.parseBody()
  const patch: Record<string, unknown> = {
    name: String(b.name ?? form.name).trim() || form.name,
    notify: b.notify === '1',
    spam_protection: b.spam_protection === '1',
    autoresponder: b.autoresponder === '1',
    autoresponder_subject: String(b.autoresponder_subject ?? '') || null,
    autoresponder_body: String(b.autoresponder_body ?? '') || null,
    redirect_url: String(b.redirect_url ?? '').trim() || null,
    closed: b.closed === '1',
  }
  if (form.kind === 'waitlist') patch.referral = b.referral === '1'
  if (form.mode === 'hosted') {
    patch.intro_title = String(b.intro_title ?? '') || null
    patch.intro_desc = String(b.intro_desc ?? '') || null
    patch.success_message = String(b.success_message ?? '') || null
    try {
      const parsed = JSON.parse(String(b.fields ?? '[]'))
      if (Array.isArray(parsed)) patch.fields = parsed
    } catch {
      /* keep existing fields on parse failure */
    }
  }
  await updateForm(c.env, form.id, patch)
  return c.redirect(`/inbox/${form.slug}`)
}
