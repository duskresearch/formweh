import type { Context } from 'hono'
import type { Env } from './index'
import { getForm, listSubmissions, parseData, parseFields } from './db'

type Ctx = Context<{ Bindings: Env }>

// GET /export/:slug.csv — every non-spam response as a CSV download. Columns are
// the form's field keys (in order) plus the useful metadata, with any ad-hoc keys
// from bring-your-own forms appended.
export async function submissionsCsv(c: Ctx): Promise<Response> {
  const slug = c.req.param('slug') ?? ''
  const form = await getForm(c.env, slug)
  if (!form) return c.notFound()
  const subs = await listSubmissions(c.env, form.id, { limit: 5000 })

  const known = parseFields(form).map((f) => f.key)
  const extra = new Set<string>()
  const parsed = subs.map((s) => parseData(s))
  for (const d of parsed) for (const k of Object.keys(d)) if (!known.includes(k)) extra.add(k)
  const cols = [...known, ...extra]

  const header = ['submitted_at', 'email', ...cols, 'country', 'device', 'referrals']
  const lines = [header.map(csvCell).join(',')]
  subs.forEach((s, i) => {
    const d = parsed[i]
    const row = [
      s.created_at,
      s.email ?? '',
      ...cols.map((k) => {
        const v = d[k]
        return Array.isArray(v) ? v.join('; ') : v ?? ''
      }),
      s.country ?? '',
      [s.device, s.os].filter(Boolean).join(' '),
      String(s.referrals ?? 0),
    ]
    lines.push(row.map(csvCell).join(','))
  })

  return c.body(lines.join('\n'), 200, {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': `attachment; filename="${slug}-responses.csv"`,
  })
}

function csvCell(v: unknown): string {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
