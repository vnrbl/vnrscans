/**
 * VNR Scans - Cloudflare Worker
 *
 * Handles:
 *   - New user registration notifications (via Supabase webhook or direct)
 *   - Contact form submissions
 *
 * Deploy: npm run cf:deploy
 * Dev:    npm run cf:dev
 *
 * Secrets you must set:
 *   wrangler secret put RESEND_API_KEY
 *
 * Bindings are defined in wrangler.toml
 */

/// <reference types="@cloudflare/workers-types" />

export interface Env {
  RESEND_API_KEY: string;
  OWNER_EMAIL?: string;
  FROM_EMAIL?: string;
  RATE_LIMIT?: KVNamespace;    // For rate limiting (recommended)
  MEDIA?: R2Bucket;            // For future asset storage
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

interface NewUserPayload {
  email: string;
  userId?: string;
  username?: string;
  created_at?: string;
}

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiryType?: string;
}

// ==================== EMAIL SENDING ====================

async function sendEmail(env: Env, { to, subject, html, from }: SendEmailOptions) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const ownerEmail = env.OWNER_EMAIL || "creator@vnrscans.com";
  const fromEmail = from || env.FROM_EMAIL || "VNR Scans <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await res.json() as any;

    if (!res.ok) {
      console.error("[worker] Resend API error:", data);
      return { success: false, error: data?.message || "Failed to send via Resend" };
    }

    console.log("[worker] Email sent successfully via Resend, id:", data?.id);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("[worker] Email send exception:", err);
    return { success: false, error: err?.message || "Unexpected error" };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendNewUserNotification(env: Env, payload: NewUserPayload) {
  const { email, username, userId, created_at } = payload;
  const owner = env.OWNER_EMAIL || "creator@vnrscans.com";

  const subject = `New user registered: ${username || email}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin:0 0 16px;">🎉 New User Registration</h2>
      <table style="width:100%; border-collapse: collapse; font-size:14px;">
        <tr>
          <td style="padding:8px 0; font-weight:600; width:120px;">Username</td>
          <td style="padding:8px 0;">${escapeHtml(username || "(none)")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-weight:600;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${email}">${escapeHtml(email)}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-weight:600;">User ID</td>
          <td style="padding:8px 0; font-family:monospace; font-size:12px;">${userId || "n/a"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-weight:600;">Registered</td>
          <td style="padding:8px 0;">${created_at ? new Date(created_at).toLocaleString() : "just now"}</td>
        </tr>
      </table>
      <p style="margin-top:24px; font-size:13px; color:#555;">
        Sent from Cloudflare Worker
      </p>
    </div>
  `;

  return sendEmail(env, {
    to: owner,
    subject,
    html,
  });
}

async function sendContactFormEmail(env: Env, payload: ContactPayload) {
  const { name, email, subject: inquirySubject, message, inquiryType } = payload;
  const owner = env.OWNER_EMAIL || "creator@vnrscans.com";
  const category = inquiryType || inquirySubject;
  const fullSubject = `[Contact] ${category}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color:#111;">
      <h2 style="margin:0 0 20px 0;">New Contact Inquiry</h2>
      <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:16px;">
        <tr><td style="padding:6px 0; width:90px; font-weight:600;">From</td><td>${escapeHtml(name)} &lt;<a href="mailto:${email}">${escapeHtml(email)}</a>&gt;</td></tr>
        <tr><td style="padding:6px 0; font-weight:600;">Subject</td><td>${escapeHtml(inquirySubject)}</td></tr>
        ${inquiryType ? `<tr><td style="padding:6px 0; font-weight:600;">Category</td><td>${escapeHtml(inquiryType)}</td></tr>` : ""}
      </table>
      <div style="margin:16px 0 8px; font-weight:600; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Message</div>
      <div style="white-space:pre-wrap; background:#f8f8f8; padding:16px; border-radius:8px; border:1px solid #eee; font-size:14px; line-height:1.5;">
        ${escapeHtml(message)}
      </div>
      <p style="margin-top:24px; font-size:12px; color:#666;">
        Reply directly to <a href="mailto:${email}">${escapeHtml(email)}</a>
      </p>
    </div>
  `;

  return sendEmail(env, {
    to: owner,
    subject: fullSubject,
    html,
  });
}

// ==================== RATE LIMITING (using KV) ====================

async function isRateLimited(kv: KVNamespace | undefined, key: string, limit = 5, windowSec = 3600): Promise<boolean> {
  if (!kv) return false; // No rate limiting if KV not bound

  const now = Math.floor(Date.now() / 1000);
  const windowKey = `rl:${key}:${Math.floor(now / windowSec)}`;

  const current = parseInt((await kv.get(windowKey)) || "0", 10);

  if (current >= limit) {
    return true;
  }

  await kv.put(windowKey, String(current + 1), { expirationTtl: windowSec });
  return false;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown"
  );
}

// ==================== MAIN HANDLER ====================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS for browser calls (if you call Worker directly from frontend)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (pathname === "/" || pathname === "/health") {
      return Response.json({
        ok: true,
        service: "vnrscans-worker",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      });
    }

    // ==================== NEW USER NOTIFICATION ====================
    if (
      (pathname === "/email/new-user" || pathname === "/webhook/new-user") &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json() as any;

        // Support both direct calls and Supabase webhook shape
        let payload: NewUserPayload;

        if (body.record?.email) {
          // Supabase DB webhook format
          payload = {
            email: body.record.email,
            userId: body.record.id,
            username: body.record.raw_user_meta_data?.username,
            created_at: body.record.created_at,
          };
        } else {
          payload = {
            email: body.email,
            userId: body.userId || body.user_id,
            username: body.username,
            created_at: body.created_at,
          };
        }

        if (!payload.email) {
          return Response.json({ error: "Missing email" }, { status: 400 });
        }

        // Rate limit by email (prevent abuse)
        const rateKey = `newuser:${payload.email}`;
        if (env.RATE_LIMIT && await isRateLimited(env.RATE_LIMIT, rateKey, 3, 3600)) {
          console.log("[worker] Rate limited new-user for", payload.email);
          return Response.json({ success: true, rate_limited: true });
        }

        const result = await sendNewUserNotification(env, payload);

        return Response.json(result);
      } catch (err: any) {
        console.error("[worker] new-user error:", err);
        return Response.json({ error: "Bad request" }, { status: 400 });
      }
    }

    // ==================== CONTACT FORM ====================
    if (pathname === "/email/contact" && request.method === "POST") {
      try {
        const payload = await request.json() as ContactPayload;

        if (!payload.name || !payload.email || !payload.message) {
          return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Rate limit by IP + email
        const ip = getClientIp(request);
        const rateKey = `contact:${ip}:${payload.email}`;
        if (env.RATE_LIMIT && await isRateLimited(env.RATE_LIMIT, rateKey, 4, 3600)) {
          return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
        }

        const result = await sendContactFormEmail(env, payload);

        // Store a lightweight log in KV (using RATE_LIMIT binding or separate if wanted)
        if (env.RATE_LIMIT && result.success) {
          const logKey = `contactlog:${Date.now()}:${payload.email.replace(/[^a-z0-9]/gi, "")}`;
          const logValue = JSON.stringify({
            name: payload.name,
            email: payload.email,
            subject: payload.subject,
            ts: new Date().toISOString(),
            ip: getClientIp(request),
          });
          // Store for 30 days
          await env.RATE_LIMIT.put(logKey, logValue, { expirationTtl: 60 * 60 * 24 * 30 });
        }

        return Response.json(result);
      } catch (err) {
        console.error("[worker] contact error:", err);
        return Response.json({ error: "Invalid request" }, { status: 400 });
      }
    }

    // ==================== R2 ASSET STORAGE ====================
    const r2 = env.MEDIA;

    // Upload to R2: POST /assets/upload
    // Body: { key: string, data: base64string, contentType?: string, metadata?: object }
    // Protected by optional X-Worker-Secret (set via secret)
    if (pathname === "/assets/upload" && request.method === "POST" && r2) {
      try {
        // Optional secret protection for uploads (recommend setting WORKER_UPLOAD_SECRET)
        const uploadSecret = (env as any).WORKER_UPLOAD_SECRET;
        if (uploadSecret) {
          const provided = request.headers.get("x-worker-secret");
          if (provided !== uploadSecret) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
        }

        const body = await request.json() as {
          key: string;
          data: string; // base64
          contentType?: string;
          metadata?: Record<string, string>;
        };

        if (!body.key || !body.data) {
          return Response.json({ error: "key and data (base64) required" }, { status: 400 });
        }

        const buffer = Uint8Array.from(atob(body.data), c => c.charCodeAt(0));

        await r2.put(body.key, buffer, {
          httpMetadata: body.contentType ? { contentType: body.contentType } : undefined,
          customMetadata: body.metadata,
        });

        return Response.json({ success: true, key: body.key, url: `/assets/${body.key}` });
      } catch (err: any) {
        console.error("[worker] R2 upload error:", err);
        return Response.json({ error: "Upload failed", details: err?.message }, { status: 500 });
      }
    }

    // List recent objects in R2 (debug / admin)
    if (pathname === "/assets/list" && r2) {
      try {
        const listed = await r2.list({ limit: 20 });
        return Response.json({
          objects: listed.objects.map(o => ({
            key: o.key,
            size: o.size,
            uploaded: o.uploaded,
          })),
        });
      } catch (err: any) {
        return Response.json({ error: "Failed to list assets", details: err?.message }, { status: 500 });
      }
    }

    // Serve file from R2: GET /assets/<key>
    if (pathname.startsWith("/assets/") && request.method === "GET" && r2) {
      const key = pathname.replace(/^\/assets\//, "");
      if (!key) {
        return Response.json({ error: "Missing key" }, { status: 400 });
      }

      try {
        const object = await r2.get(key);
        if (!object) {
          return new Response("Not found", { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new Response(object.body, { headers });
      } catch (e) {
        return Response.json({ error: "Failed to fetch asset" }, { status: 500 });
      }
    }

    // List recent contact submissions (from KV)
    if (pathname === "/admin/recent-contacts" && env.RATE_LIMIT) {
      try {
        const listed = await env.RATE_LIMIT.list({ prefix: "contactlog:", limit: 20 });
        const items = await Promise.all(
          listed.keys.map(async (k) => {
            const val = await env.RATE_LIMIT!.get(k.name);
            return val ? JSON.parse(val) : null;
          })
        );
        return Response.json({ contacts: items.filter(Boolean).sort((a: any, b: any) => b.ts.localeCompare(a.ts)) });
      } catch (e) {
        return Response.json({ error: "Failed to list contacts" }, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
