# VNR Scans — Claude Agent Context (CLAUDE.md)

> This file is automatically read by Claude Code. It describes the full project structure,
> architecture, environment, and conventions so you can assist without needing repo access.

---

## 1. Project Overview

**VNR Scans** is a manga/manhwa scanlation website built with:

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, React 19) |
| Styling | Tailwind CSS v4 + Radix UI + shadcn/ui components |
| Database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Edge / API | Cloudflare Workers (email, rate-limiting, R2 assets) |
| Deployment | Vercel (primary) + Cloudflare Workers (sidecar) |
| Package manager | Bun (preferred) and npm both work |
| Language | TypeScript throughout |

---

## 2. Directory Structure

```
vnrscans/
├── src/
│   ├── app/                   # Next.js App Router pages & layouts
│   ├── components/            # Reusable React components (shadcn-based)
│   ├── lib/
│   │   ├── api/               # Server actions (scraper, comix-import, site-import)
│   │   ├── supabase/          # Supabase client helpers (browser + server + admin)
│   │   └── utils/             # Misc utilities
│   └── workers/
│       └── index.ts           # Cloudflare Worker entry point (see §5)
├── supabase/
│   └── migrations/            # SQL migration files (applied via Supabase CLI)
├── scripts/                   # Node/TSX scripts (scraping, importing)
├── public/                    # Static assets
├── wrangler.toml              # Cloudflare Worker config (see §5)
├── next.config.ts             # Next.js config
├── package.json               # Scripts + deps
└── .env / .env.example        # Environment variables (see §4)
```

---

## 3. Key npm Scripts

```bash
# Development
npm run dev              # Next.js dev server (localhost:3000)

# Building
npm run build            # next build + copies Chromium assets

# Cloudflare Worker
npm run cf:dev           # wrangler dev (local Worker)
npm run cf:deploy        # Deploy Worker to Cloudflare (requires Node on PATH)
npm run cf:tail          # Live Worker logs
npm run cf:secret        # Set a Worker secret: npm run cf:secret RESEND_API_KEY

# Supabase migrations
npx supabase db push     # Push migrations to remote Supabase
npx supabase migration new <name>  # Create new migration

# Scraping / importing
npm run scrape           # Puppeteer scrape of series
npm run auto-import      # Auto-import from sources
```

> NOTE: `'"node"' is not recognized` error means Node.js is not in PATH.
> Fix: run commands from a terminal where `node --version` works, or use `bun` where possible.

---

## 4. Environment Variables

Copy `.env.example` to `.env` (local) and set in Vercel dashboard for production.

### Next.js / Vercel env vars

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon/public key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role (server-only) |
| RESEND_API_KEY | Resend.com API key for emails |
| WORKER_URL | Deployed Cloudflare Worker URL |
| WEBHOOK_SECRET | Shared secret for Supabase->Worker webhooks |

### Cloudflare Worker secrets (set via `wrangler secret put`)

| Secret | Purpose |
|--------|---------|
| RESEND_API_KEY | Resend API key used inside the Worker |
| WORKER_UPLOAD_SECRET | Optional: protects /assets/upload endpoint |
| WEBHOOK_SECRET | Validates incoming Supabase webhooks |

---

## 5. Cloudflare Worker (src/workers/index.ts)

**Entry point**: src/workers/index.ts
**Config**: wrangler.toml
**Worker name**: vnrscans

### wrangler.toml summary

```toml
name = "vnrscans"
main = "src/workers/index.ts"
compatibility_date = "2025-07-01"

[vars]
OWNER_EMAIL = "creator@vnrscans.com"
FROM_EMAIL = "VNR Scans <onboarding@resend.dev>"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "e1d69198b5f849d09099a51be1f7f443"   # vnrscans-rate-limit

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "vnrscans-media"
```

### Env interface

```typescript
export interface Env {
  RESEND_API_KEY: string;
  OWNER_EMAIL?: string;
  FROM_EMAIL?: string;
  RATE_LIMIT?: KVNamespace;
  MEDIA?: R2Bucket;
  WORKER_UPLOAD_SECRET?: string;
  WEBHOOK_SECRET?: string;
}
```

### Worker API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / or /health | Health check |
| POST | /email/new-user | New-user notification email |
| POST | /webhook/new-user | Supabase DB webhook (auth.users INSERT) |
| POST | /email/contact | Contact form email |
| GET | /assets/<key> | Serve file from R2 |
| POST | /assets/upload | Upload file to R2 (base64 body) |
| GET | /assets/list | List R2 objects (debug) |
| GET | /admin/recent-contacts | List contact submissions (KV) |

### Supabase -> Worker webhook

In Supabase Dashboard -> Database -> Webhooks:
- Table: auth.users, event: INSERT
- URL: https://vnrscans.<account>.workers.dev/webhook/new-user
- Header: x-webhook-secret: <WEBHOOK_SECRET value>

---

## 6. Supabase

- Auth: Supabase Auth (email/password + OAuth)
- Migrations: supabase/migrations/ — apply with `npx supabase db push`
- RLS is enabled; check policies when adding tables

### Supabase client helpers

```
src/lib/supabase/
  client.ts    # Browser client
  server.ts    # Server component client (cookies)
  admin.ts     # Service role client (server-only, bypasses RLS)
```

---

## 7. Email Flow

Two paths for sending email via Resend:

1. **Direct (Next.js)**: /api/contact, /api/notify-signup -> Resend SDK
   Used when WORKER_URL is NOT set.

2. **Via Worker (recommended for production)**:
   Next.js routes forward to WORKER_URL/email/* when WORKER_URL is set.
   Worker calls Resend REST API directly.

---

## 8. Deployment

### Vercel (primary)

- Auto-deploys from main branch
- Env vars set in Vercel dashboard
- Config: vercel.json

### Cloudflare Worker (sidecar)

```bash
npm run cf:login        # Authenticate (one-time)
npm run cf:deploy       # Deploy (requires Node on PATH)
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put WEBHOOK_SECRET
```

### CI/CD

- GitLab CI: .gitlab-ci.yml
- GitHub mirror: https://github.com/vnrbl/vnrscans (private)
- Both remotes configured on `origin` push URL

---

## 9. Common Gotchas

1. `'"node"' is not recognized` — Node.js not on PATH. Use a terminal with Node or bun.
2. Supabase RLS — Always check policies if queries return empty unexpectedly.
3. SUPABASE_SERVICE_ROLE_KEY — Server-only. Never expose to browser.
4. Worker local dev — Use .dev.vars for local secrets (gitignored by default).
5. Puppeteer — postinstall installs Chromium. Set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true if needed.
6. R2 is private — Files served through Worker (/assets/<key>), not a public R2 URL.

---

## 10. Cloudflare Observability / Tracing

- Live logs: `npm run cf:tail` (wrangler tail)
- Dashboard: Workers & Pages -> vnrscans -> Logs / Analytics
- For OpenTelemetry: add `@microlabs/otel-cf-workers` and instrument src/workers/index.ts
- account_id in wrangler.toml is commented out — set it for full dashboard access

---

*Last updated: 2026-09-16 by Antigravity*
