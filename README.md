# Formweh

**Open-source forms, waitlists, and surveys, made easy to self-host on Cloudflare.**

Build a form or bring your own, collect every response in one inbox you own, on your own site. No servers, no Docker, no database to provision, and no monthly bill. It lives entirely on Cloudflare's free tier.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/duskresearch/formweh)

---

## What you get

- **Build a form, or bring your own.** A simple builder hosts a form or survey on your site, or point your own HTML / React / Webflow form's `action` at your endpoint and keep your markup. Both land in the same inbox.
- **Templates.** Contact, waitlist, survey, RSVP, coming-soon, and feedback. Start from one and tweak it in a minute.
- **Waitlists with a referral loop.** Every signup gets a share link and a "skip the line" position. Friends who join with their link move them up.
- **One inbox.** Every response in a calm, email-client-style dashboard. Mark read, file spam, export.
- **Notifications.** Email through *your own* Cloudflare (free to your verified address), plus Slack, Discord, and custom webhooks.
- **Spam protection.** Cloudflare Turnstile and a honeypot, built in. Junk gets filed aside, never dropped.
- **Own your data.** Every response lives in your D1 database. Export to CSV, or pull it with the HTTP API, any time.
- **One password** guards your dashboard. You create it on first run, no accounts, no user table.
- **Light and dark**, with a toggle. Hosted forms, dashboard, and landing all follow it.
- **Bring nothing.** Cloudflare Workers + D1 (SQLite), no build step, no Redis, no Postgres.

## Deploy it (one click)

1. **Sign in to Cloudflare.** The button takes you there. A free account is all you need.
2. **Let it connect to your GitHub.** Cloudflare copies Formweh into a new repository on *your* account and keeps it in sync.
3. **Click deploy and wait a minute or two.** Cloudflare creates your database, runs the migrations, and publishes the Worker. You never touch a command line. No secrets to set.
4. **Open your dashboard.** Cloudflare shows your new Worker at an address like `https://formweh-abc123.your-name.workers.dev`. Click **Visit**.
5. **Create your password.** The first time you open it, you set the password that guards your dashboard. Then make your first form.

## Put it on your own domain

Your dashboard and forms work on the `workers.dev` address right away, but you'll want them on your own subdomain, like `forms.yourbrand.com`.

- Open your Worker, go to **Settings → Domains & Routes → Add → Custom Domain**, and add `forms.yourbrand.com`. Cloudflare provisions DNS and SSL for you.
- Everything then lives on that one host: your dashboard, your hosted form pages (`forms.yourbrand.com/f/your-slug`), and the endpoints your own forms POST to.

**If your domain isn't on Cloudflare**, you only need the one subdomain there: add `forms.yourbrand.com` to a Cloudflare zone (or route it via Cloudflare for SaaS). Your main site can stay wherever it is.

## Notifications by email

Emailing your own address is free on any Cloudflare plan, and it runs through your own account. To turn it on:

1. In **Settings**, set your **notify email**.
2. Verify it once: Cloudflare → your account → **Email → Email Routing → Destination Addresses**, add your address, and click the verification link.
3. Back in Formweh Settings, hit **Send test email**. Done.

**Autoresponders** (auto-replying to whoever submits, from your own domain) use Cloudflare Email Sending, which needs the Workers Paid plan ($5/mo) and a sending domain onboarded in the Cloudflare dashboard. Everything else stays free.

## Spam protection

A honeypot works out of the box. For stronger protection, add free [Turnstile](https://developers.cloudflare.com/turnstile/) keys in **Settings**, then flip on spam protection per form. Failed challenges are filed as spam rather than dropped, so a real visitor is never lost.

## Bring your own form

Create a "bring your own" form and point your markup at the endpoint:

```html
<form action="https://forms.yourbrand.com/f/contact" method="POST">
  <input name="email" type="email" required />
  <textarea name="message"></textarea>
  <button>Send</button>
</form>
```

It also accepts JSON, so a React app can `fetch()` it and get `{ "ok": true }` back:

```js
await fetch("https://forms.yourbrand.com/f/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, message }),
})
```

## HTTP API

A read API for pulling forms and responses into scripts. **Off** until you generate a token in **Settings**. Send it as a bearer token:

```
Authorization: Bearer <token>
```

| Method | Path | Does |
| --- | --- | --- |
| `GET` | `/api/v1/forms` | List your forms |
| `GET` | `/api/v1/forms/:slug` | Fetch one form |
| `GET` | `/api/v1/forms/:slug/submissions` | List a form's responses |

## Run it locally

```bash
git clone https://github.com/duskresearch/formweh.git
cd formweh
npm install
npm run db:migrate:local          # create the local tables
npm run dev                        # http://localhost:8787
```

## Deploy from the CLI (instead of the button)

```bash
npx wrangler login
npm run db:create                  # creates the remote D1, prints a database_id
# paste that id into wrangler.jsonc under d1_databases
npm run deploy                     # migrates the remote DB and deploys
```

## How it's built

- **[Cloudflare Workers](https://workers.cloudflare.com/)** for the runtime (edge, generous free tier)
- **[Hono](https://hono.dev/)**, a tiny, fast web framework
- **[D1](https://developers.cloudflare.com/d1/)**, Cloudflare's built-in SQLite, holds your forms and responses
- **[Email Service](https://developers.cloudflare.com/email-service/)** and **[Turnstile](https://developers.cloudflare.com/turnstile/)** for notifications and spam
- **No build step.** Server-rendered HTML with hand-written CSS, light and dark

## License

MIT. See [LICENSE](./LICENSE) and do what you like with it.

---

<sub>Forms, waitlists, and surveys, hosted by you. Built by [Dusk Research](https://duskresearch.com).</sub>
