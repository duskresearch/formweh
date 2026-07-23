import type { Env } from './index'

// A tiny key/value store in D1 backing everything the Settings page writes:
// the admin password, the notification email, Turnstile keys, webhooks, API token.
// A stored value overrides the matching env var, so both the deploy-button flow
// (no secrets) and env-var setups work.

export async function getSetting(env: Env, key: string): Promise<string | null> {
  try {
    const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>()
    return row?.value ?? null
  } catch (e) {
    // Only tolerate "table not migrated yet"; let real D1 errors surface so auth
    // paths fail CLOSED, not open.
    if (String((e as Error)?.message ?? e).includes('no such table')) return null
    throw e
  }
}

export async function loadSettings(env: Env): Promise<Map<string, string>> {
  try {
    const { results } = await env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>()
    return new Map((results ?? []).map((r) => [r.key, r.value]))
  } catch (e) {
    if (String((e as Error)?.message ?? e).includes('no such table')) return new Map()
    throw e
  }
}

export async function setSetting(env: Env, key: string, value: string | null): Promise<void> {
  if (value == null || value === '') {
    await env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(key).run()
    return
  }
  await env.DB.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  )
    .bind(key, value)
    .run()
}

// ── effective config helpers ────────────────────────────────────────────────
export async function effectiveApiToken(env: Env): Promise<string | null> {
  return (await getSetting(env, 'api_token')) ?? env.API_TOKEN ?? null
}
export async function turnstileKeys(env: Env): Promise<{ site: string | null; secret: string | null }> {
  const s = await loadSettings(env)
  return {
    site: s.get('turnstile_site_key') ?? env.TURNSTILE_SITE_KEY ?? null,
    secret: s.get('turnstile_secret_key') ?? env.TURNSTILE_SECRET_KEY ?? null,
  }
}

// ── password ─────────────────────────────────────────────────────────────────
// Created during first-run onboarding and stored hashed in D1. Until then, the
// optional SITE_PASSWORD env var is a fallback (handy for local dev). The session
// cookie is signed with authSecret(), so changing the password logs everyone out.

export async function hasPassword(env: Env): Promise<boolean> {
  if (env.SITE_PASSWORD) return true
  return (await getSetting(env, 'password_hash')) != null
}
export async function authSecret(env: Env): Promise<string | null> {
  return (await getSetting(env, 'password_hash')) ?? env.SITE_PASSWORD ?? null
}
export async function verifyLogin(env: Env, pw: string): Promise<boolean> {
  const hash = await getSetting(env, 'password_hash')
  if (hash) return verifyPassword(pw, hash)
  return !!env.SITE_PASSWORD && timingSafeEqual(pw, env.SITE_PASSWORD)
}
export async function setPassword(env: Env, pw: string): Promise<void> {
  await setSetting(env, 'password_hash', await hashPassword(pw))
}

// PBKDF2 (SHA-256, 100k iterations) via Web Crypto — no dependencies.
async function hashPassword(pw: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const bits = await pbkdf2(pw, salt)
  return `${hex(salt)}:${hex(new Uint8Array(bits))}`
}
async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  const bits = await pbkdf2(pw, unhex(saltHex))
  return timingSafeEqual(hex(new Uint8Array(bits)), hashHex)
}
async function pbkdf2(pw: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256)
}
function hex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}
function unhex(s: string): Uint8Array {
  const a = new Uint8Array(s.length / 2)
  for (let i = 0; i < a.length; i++) a[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16)
  return a
}
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

// A fresh random API token (shown once when generated).
export function generateToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(24))
  return 'formweh_' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

// A short, URL-safe code for waitlist referral links.
export function shortCode(len = 7): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'
  const b = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(b, (x) => alphabet[x % alphabet.length]).join('')
}
