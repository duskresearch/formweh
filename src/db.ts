import type { Env } from './index'

// ── types ────────────────────────────────────────────────────────────────────

export type FieldType = 'short' | 'long' | 'email' | 'number' | 'choice' | 'checkboxes'

export type Field = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: string[] // for choice / checkboxes
}

export type FormRow = {
  id: number
  slug: string
  name: string
  kind: 'form' | 'waitlist' | 'survey'
  mode: 'hosted' | 'byo'
  fields: string // JSON of Field[]
  intro_title: string | null
  intro_desc: string | null
  success_message: string | null
  redirect_url: string | null
  spam_protection: number
  notify: number
  autoresponder: number
  autoresponder_subject: string | null
  autoresponder_body: string | null
  referral: number
  closed: number
  archived: number
  created_at: string
}

export type SubmissionRow = {
  id: number
  form_id: number
  data: string
  email: string | null
  spam: number
  is_read: number
  country: string | null
  device: string | null
  os: string | null
  referer: string | null
  ref_code: string | null
  referred_by: string | null
  referrals: number
  created_at: string
}

export function parseFields(f: FormRow): Field[] {
  try {
    const a = JSON.parse(f.fields)
    return Array.isArray(a) ? a : []
  } catch {
    return []
  }
}
export function parseData(s: SubmissionRow): Record<string, unknown> {
  try {
    const o = JSON.parse(s.data)
    return o && typeof o === 'object' ? o : {}
  } catch {
    return {}
  }
}

// ── forms ────────────────────────────────────────────────────────────────────

export async function listForms(env: Env): Promise<FormRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM forms WHERE archived = 0 ORDER BY created_at DESC',
  ).all<FormRow>()
  return results ?? []
}

export async function getForm(env: Env, slug: string): Promise<FormRow | null> {
  return (await env.DB.prepare('SELECT * FROM forms WHERE slug = ?').bind(slug).first<FormRow>()) ?? null
}
export async function getFormById(env: Env, id: number): Promise<FormRow | null> {
  return (await env.DB.prepare('SELECT * FROM forms WHERE id = ?').bind(id).first<FormRow>()) ?? null
}

export async function slugTaken(env: Env, slug: string): Promise<boolean> {
  const r = await env.DB.prepare('SELECT 1 FROM forms WHERE slug = ?').bind(slug).first()
  return !!r
}

export async function createForm(
  env: Env,
  f: {
    slug: string
    name: string
    kind?: string
    mode?: string
    fields?: Field[]
    intro_title?: string | null
    intro_desc?: string | null
    success_message?: string | null
    referral?: boolean
  },
): Promise<FormRow> {
  await env.DB.prepare(
    `INSERT INTO forms (slug, name, kind, mode, fields, intro_title, intro_desc, success_message, referral)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      f.slug,
      f.name,
      f.kind ?? 'form',
      f.mode ?? 'hosted',
      JSON.stringify(f.fields ?? []),
      f.intro_title ?? null,
      f.intro_desc ?? null,
      f.success_message ?? null,
      f.referral ? 1 : 0,
    )
    .run()
  return (await getForm(env, f.slug))!
}

// Patch a form with an allow-listed set of columns.
const FORM_COLS = new Set([
  'name', 'kind', 'mode', 'fields', 'intro_title', 'intro_desc', 'success_message',
  'redirect_url', 'spam_protection', 'notify', 'autoresponder', 'autoresponder_subject',
  'autoresponder_body', 'referral', 'closed', 'archived',
])
export async function updateForm(env: Env, id: number, patch: Record<string, unknown>): Promise<void> {
  const cols = Object.keys(patch).filter((k) => FORM_COLS.has(k))
  if (!cols.length) return
  const set = cols.map((c) => `${c} = ?`).join(', ')
  const vals = cols.map((c) => {
    const v = patch[c]
    if (c === 'fields') return JSON.stringify(v ?? [])
    if (typeof v === 'boolean') return v ? 1 : 0
    return v as string | number | null
  })
  await env.DB.prepare(`UPDATE forms SET ${set} WHERE id = ?`).bind(...vals, id).run()
}

export async function deleteForm(env: Env, id: number): Promise<void> {
  await env.DB.prepare('DELETE FROM forms WHERE id = ?').bind(id).run()
}

// ── submissions ──────────────────────────────────────────────────────────────

export type Counts = { total: number; unread: number; spam: number }

export async function formCounts(env: Env, formId: number): Promise<Counts> {
  const r = await env.DB.prepare(
    `SELECT
       SUM(CASE WHEN spam = 0 THEN 1 ELSE 0 END)               AS total,
       SUM(CASE WHEN spam = 0 AND is_read = 0 THEN 1 ELSE 0 END) AS unread,
       SUM(CASE WHEN spam = 1 THEN 1 ELSE 0 END)               AS spam
     FROM submissions WHERE form_id = ?`,
  )
    .bind(formId)
    .first<{ total: number; unread: number; spam: number }>()
  return { total: r?.total ?? 0, unread: r?.unread ?? 0, spam: r?.spam ?? 0 }
}

export async function listSubmissions(
  env: Env,
  formId: number,
  opts: { spam?: boolean; limit?: number; offset?: number } = {},
): Promise<SubmissionRow[]> {
  const spam = opts.spam ? 1 : 0
  const limit = Math.min(opts.limit ?? 100, 500)
  const offset = opts.offset ?? 0
  const { results } = await env.DB.prepare(
    `SELECT * FROM submissions WHERE form_id = ? AND spam = ?
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(formId, spam, limit, offset)
    .all<SubmissionRow>()
  return results ?? []
}

export async function getSubmission(env: Env, id: number): Promise<SubmissionRow | null> {
  return (await env.DB.prepare('SELECT * FROM submissions WHERE id = ?').bind(id).first<SubmissionRow>()) ?? null
}

export async function insertSubmission(
  env: Env,
  s: {
    form_id: number
    data: Record<string, unknown>
    email?: string | null
    spam?: boolean
    country?: string | null
    device?: string | null
    os?: string | null
    referer?: string | null
    ref_code?: string | null
    referred_by?: string | null
  },
): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO submissions (form_id, data, email, spam, country, device, os, referer, ref_code, referred_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      s.form_id,
      JSON.stringify(s.data),
      s.email ?? null,
      s.spam ? 1 : 0,
      s.country ?? null,
      s.device ?? null,
      s.os ?? null,
      s.referer ?? null,
      s.ref_code ?? null,
      s.referred_by ?? null,
    )
    .run()
  return Number(res.meta.last_row_id)
}

export async function markRead(env: Env, id: number, read = true): Promise<void> {
  await env.DB.prepare('UPDATE submissions SET is_read = ? WHERE id = ?').bind(read ? 1 : 0, id).run()
}
export async function markSpam(env: Env, id: number, spam = true): Promise<void> {
  await env.DB.prepare('UPDATE submissions SET spam = ? WHERE id = ?').bind(spam ? 1 : 0, id).run()
}
export async function deleteSubmission(env: Env, id: number): Promise<void> {
  await env.DB.prepare('DELETE FROM submissions WHERE id = ?').bind(id).run()
}

// Waitlist referral: look up a signup by its share code, and its position in line.
export async function subByRefCode(env: Env, code: string): Promise<SubmissionRow | null> {
  return (
    (await env.DB.prepare('SELECT * FROM submissions WHERE ref_code = ? AND spam = 0').bind(code).first<SubmissionRow>()) ??
    null
  )
}
export async function incrementReferrals(env: Env, code: string): Promise<void> {
  await env.DB.prepare('UPDATE submissions SET referrals = referrals + 1 WHERE ref_code = ?').bind(code).run()
}
// Position = 1 + (people ahead), where "ahead" ranks by referrals desc then time asc.
export async function waitlistPosition(env: Env, formId: number, sub: SubmissionRow): Promise<number> {
  const r = await env.DB.prepare(
    `SELECT COUNT(*) AS ahead FROM submissions
     WHERE form_id = ? AND spam = 0 AND (
       referrals > ? OR (referrals = ? AND created_at < ?)
     )`,
  )
    .bind(formId, sub.referrals, sub.referrals, sub.created_at)
    .first<{ ahead: number }>()
  return (r?.ahead ?? 0) + 1
}
export async function waitlistTotal(env: Env, formId: number): Promise<number> {
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM submissions WHERE form_id = ? AND spam = 0').bind(formId).first<{ n: number }>()
  return r?.n ?? 0
}
