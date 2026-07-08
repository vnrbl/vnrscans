# Cloudflare Setup (Wrangler CLI)

Wrangler (Cloudflare's official CLI) + next-on-pages adapter have been added to the project.

**Note:** You are currently deployed on Vercel. These tools give you the option to also deploy to Cloudflare Pages / Workers.

## Installed

- `wrangler` — Cloudflare CLI
- `@cloudflare/workers-types` — TypeScript types for Workers

## Available Commands

```bash
# Login to Cloudflare
npm run cf:login

# Local development for Workers
npm run cf:dev

# Deploy the Worker defined in wrangler.toml
npm run cf:deploy

# View live logs
npm run cf:tail

# Manage secrets (e.g. RESEND_API_KEY)
npm run cf:secret RESEND_API_KEY
# or
npx wrangler secret put RESEND_API_KEY

# Build for Cloudflare Pages (recommended)
npm run cf:build

# Preview locally
npm run cf:preview

# Deploy to Cloudflare Pages
npm run cf:pages:deploy
```

## Project Structure

- `wrangler.toml` — Main configuration for Workers
- `src/workers/index.ts` — Example Worker (you can expand this)

## Email Logic Now Lives in the Worker (Task 1 completed)

The new user registration and contact form emails are now handled by the Cloudflare Worker:

Worker endpoints:
- `POST /email/contact` — contact form
- `POST /email/new-user` — new user signup
- `POST /webhook/new-user` — Supabase database webhook target (recommended)

### How it works now

- **Next.js side** (`/api/contact`, `/api/notify-signup`, `/api/webhooks/new-user`) will automatically forward to the Worker **if `WORKER_URL`** is set in your environment.
- Fallback to direct Resend still works when `WORKER_URL` is not set.

### Recommended Production Setup (Supabase → Worker)

1. Deploy the Worker:
   ```bash
   npm run cf:deploy
   ```

2. Set secrets:
   ```bash
   npx wrangler secret put RESEND_API_KEY
   ```

3. (Best) Point Supabase Database Webhook directly to the Worker:
   - Go to Supabase → Database → Webhooks
   - Create webhook on `auth.users` INSERT
   - URL: `https://<your-worker>.workers.dev/webhook/new-user`
   - Add header `x-webhook-secret` (use your `WEBHOOK_SECRET`)

4. Set `WORKER_URL` in Vercel + `.env.local`:
   ```env
   WORKER_URL=https://vnrscans.yourname.workers.dev
   ```

The contact form will also use the Worker automatically.

## Cloudflare Bindings (Task 3 completed)

Bindings have been configured in `wrangler.toml`:

- **KV Namespace** (`RATE_LIMIT`): Used for rate limiting + storing lightweight logs of recent contact submissions.
- **R2 Bucket** (`MEDIA`): For storing and serving assets (images, uploads, etc.).

### How to create the bindings

#### 1. Create KV Namespace

```bash
npx wrangler kv namespace create RATE_LIMIT
# Paste the ID into wrangler.toml under [[kv_namespaces]]
```

Dashboard: Workers & Pages → KV → Create namespace `vnrscans-rate-limit`.

#### 2. Create R2 Bucket

```bash
npx wrangler r2 bucket create vnrscans-media
```

Update wrangler.toml:

```toml
[[r2_buckets]]
binding = "MEDIA"
bucket_name = "vnrscans-media"
```

### Using R2 from the Worker (new)

The Worker now supports:

- `GET /assets/<your-key>` → serves the file from R2 (with caching headers)
- `POST /assets/upload` → upload a file
  ```json
  {
    "key": "avatars/user123.png",
    "data": "<base64-encoded-file>",
    "contentType": "image/png",
    "metadata": { "uploadedBy": "admin" }
  }
  ```
- `GET /assets/list` → list recent objects (useful for debugging)
- `GET /admin/recent-contacts` → list recent contact form submissions stored in KV

**To protect uploads**, set a secret:
```bash
npx wrangler secret put WORKER_UPLOAD_SECRET
```
Then send header `x-worker-secret: <value>` when calling `/assets/upload`.

### Local development with bindings

```bash
cp .dev.vars.example .dev.vars
# add RESEND_API_KEY to .dev.vars
npm run cf:dev
```

Note: For full local KV/R2 emulation, Wrangler will use in-memory or local persistence when bindings are declared.

## Environment Variables

Add to Vercel + `.env.local`:

```env
WORKER_URL=https://vnrscans.yourname.workers.dev
RESEND_API_KEY=...
```

For the Worker itself, use `wrangler secret put` (never put secrets in wrangler.toml).

## Full Commands

```bash
npm run cf:login
npm run cf:dev
npm run cf:deploy
npx wrangler secret put RESEND_API_KEY
npx wrangler kv namespace create RATE_LIMIT
npx wrangler r2 bucket create vnrscans-media
```

Run `npm run cf:login` first to authenticate.
