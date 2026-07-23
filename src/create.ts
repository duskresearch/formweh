import type { Context } from 'hono'
import type { Env } from './index'
import { createForm, slugTaken } from './db'
import { getTemplate } from './templates'
import { shortCode } from './settings'

type Ctx = Context<{ Bindings: Env }>

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'form'
  )
}

async function uniqueSlug(env: Env, base: string): Promise<string> {
  let slug = slugify(base)
  if (!(await slugTaken(env, slug))) return slug
  for (let i = 0; i < 5; i++) {
    const s = `${slug}-${shortCode(4)}`
    if (!(await slugTaken(env, s))) return s
  }
  return `${slug}-${shortCode(6)}`
}

// POST /forms — the "make a form" chooser submits here.
export async function createFromChooser(c: Ctx): Promise<Response> {
  const body = await c.req.parseBody()
  const how = String(body.how ?? 'build') // build | byo | template
  const name = String(body.name ?? '').trim() || (how === 'byo' ? 'My form' : 'Untitled form')

  if (how === 'template') {
    const t = getTemplate(String(body.template ?? ''))
    if (t) {
      const slug = await uniqueSlug(c.env, t.name)
      const form = await createForm(c.env, {
        slug,
        name: t.name,
        kind: t.kind,
        mode: 'hosted',
        fields: t.fields,
        intro_title: t.intro_title,
        intro_desc: t.intro_desc,
        success_message: t.success_message,
        referral: t.referral,
      })
      return c.redirect(`/build/${form.slug}`)
    }
  }

  if (how === 'byo') {
    const slug = await uniqueSlug(c.env, name)
    const form = await createForm(c.env, { slug, name, mode: 'byo', fields: [] })
    return c.redirect(`/build/${form.slug}`)
  }

  // build: a fresh hosted form with sensible starter fields.
  const slug = await uniqueSlug(c.env, name)
  const form = await createForm(c.env, {
    slug,
    name,
    mode: 'hosted',
    fields: [
      { key: 'name', label: 'Your name', type: 'short', required: false },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'message', label: 'Message', type: 'long', required: false },
    ],
    intro_title: name,
    success_message: 'Thanks, we got it.',
  })
  return c.redirect(`/build/${form.slug}`)
}
