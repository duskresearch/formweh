import { Hono } from 'hono'
import type { Env } from './index'
import { effectiveApiToken } from './settings'
import { listForms, getForm, listSubmissions, parseData, type FormRow } from './db'

// A small read API for pulling your forms and responses into scripts or another
// app. Off until you set an API token (Settings). Every request sends:
//   Authorization: Bearer <API_TOKEN>
// Responses are JSON. (To create submissions, POST directly to /f/:slug with
// Content-Type: application/json — no token needed, that's the public endpoint.)

export const apiRoutes = new Hono<{ Bindings: Env }>()

apiRoutes.use('*', async (c, next) => {
  const token = await effectiveApiToken(c.env)
  if (!token) return c.json({ error: 'API is disabled. Set an API token in Settings.' }, 503)
  const auth = c.req.header('authorization') || ''
  const sent = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (sent !== token) return c.json({ error: 'Unauthorized' }, 401)
  return next()
})

function formJson(f: FormRow) {
  return { slug: f.slug, name: f.name, kind: f.kind, mode: f.mode, created_at: f.created_at }
}

apiRoutes.get('/', (c) => c.json({ ok: true, name: 'Formweh API', version: 'v1' }))

apiRoutes.get('/forms', async (c) => {
  const forms = await listForms(c.env)
  return c.json({ forms: forms.map(formJson) })
})

apiRoutes.get('/forms/:slug', async (c) => {
  const f = await getForm(c.env, c.req.param('slug'))
  if (!f) return c.json({ error: 'Not found' }, 404)
  return c.json(formJson(f))
})

apiRoutes.get('/forms/:slug/submissions', async (c) => {
  const f = await getForm(c.env, c.req.param('slug'))
  if (!f) return c.json({ error: 'Not found' }, 404)
  const spam = c.req.query('spam') === '1'
  const limit = Math.min(Number(c.req.query('limit') ?? 100) || 100, 500)
  const subs = await listSubmissions(c.env, f.id, { spam, limit })
  return c.json({
    submissions: subs.map((s) => ({
      id: s.id,
      email: s.email,
      data: parseData(s),
      country: s.country,
      referrals: s.referrals,
      spam: !!s.spam,
      created_at: s.created_at,
    })),
  })
})
