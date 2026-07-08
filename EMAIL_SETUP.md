# Email Notifications Setup (New Users + Contact Form)

This project now sends emails for:

- **New user registrations** → sent to `OWNER_EMAIL`
- **Contact form submissions** → sent to `OWNER_EMAIL`

## 1. Install & Configure Resend

1. Go to https://resend.com and create a free account.
2. Create an API key (under API Keys).
3. Add the following to your environment variables (both local `.env.local` **and** your hosting platform like Vercel):

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
OWNER_EMAIL=creator@vnrscans.com
FROM_EMAIL="VNR Scans <onboarding@resend.dev>"
WEBHOOK_SECRET=your-long-random-secret-here
```

> **Important for production:** Verify your domain at Resend (DNS records). While testing you can send from `onboarding@resend.dev`.

Create `.env.local` locally (never commit it):

```bash
cp .env.example .env.local
```

## 2. Contact Form

The contact page (`/contact`) now calls `/api/contact`.

It will email you the full inquiry.

## 3. New User Registration Notifications

Two methods are implemented:

### A. Client-side (quick & simple)

After a user completes signup in `/auth`, the app immediately calls `/api/notify-signup`.

This works out of the box once env vars are set.

### B. Reliable Production Method: Supabase Database Webhook (recommended)

This guarantees you get notified even if the user never confirms email or client call fails.

#### Steps:

1. Go to your Supabase project dashboard → **Database** → **Webhooks**
2. Click **Create a new hook**
3. Configure:
   - **Name**: `Notify owner on new user`
   - **Table**: `auth.users`
   - **Events**: `INSERT`
   - **Type**: `HTTP Request`
   - **URL**: `https://your-site.com/api/webhooks/new-user`  (use your production URL; for local testing use ngrok or skip)
   - **Method**: `POST`
   - **Headers**:
     - Add header: `x-webhook-secret` → value = the same value as your `WEBHOOK_SECRET` env var
4. Save.

Supabase will now POST the new `auth.users` record to your endpoint whenever anyone registers.

You can also point the webhook at the `public.profiles` table `INSERT` if you prefer (it contains username).

## 4. Environment Variables Reference

| Variable             | Required | Description                                      |
|----------------------|----------|--------------------------------------------------|
| `RESEND_API_KEY`     | Yes      | Your Resend API key                              |
| `OWNER_EMAIL`        | Yes      | Where to deliver new user + contact emails       |
| `FROM_EMAIL`         | No       | Sender address shown in emails                   |
| `WEBHOOK_SECRET`     | No*      | Protects the `/api/webhooks/new-user` endpoint   |
| `NEXT_PUBLIC_SITE_URL` | No    | Used for links inside emails                     |

## 5. Testing

- Fill the contact form → you should receive an email.
- Create a new test account via `/auth` → you should receive a "New user registered" email.

If emails don't arrive:
- Check server logs for `[email]` messages.
- Verify `RESEND_API_KEY` is loaded (restart dev server after adding env).
- In Resend dashboard check Activity logs.

## 6. Alternative providers

You can swap Resend easily. Edit `src/lib/email.ts`:
- Replace the `Resend` client with Nodemailer, SendGrid, Postmark, etc.
- Keep the exported `sendNewUserNotification` and `sendContactFormEmail` functions.

That's it!
