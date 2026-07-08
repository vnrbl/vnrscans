var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/workers/index.ts
async function sendEmail(env, { to, subject, html, from }) {
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[worker] Resend error:", data);
      return { success: false, error: data?.message || "Failed to send via Resend" };
    }
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[worker] Email send exception:", err);
    return { success: false, error: err?.message || "Unexpected error" };
  }
}
__name(sendEmail, "sendEmail");
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
__name(escapeHtml, "escapeHtml");
async function sendNewUserNotification(env, payload) {
  const { email, username, userId, created_at } = payload;
  const owner = env.OWNER_EMAIL || "creator@vnrscans.com";
  const subject = `New user registered: ${username || email}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin:0 0 16px;">\u{1F389} New User Registration</h2>
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
    html
  });
}
__name(sendNewUserNotification, "sendNewUserNotification");
async function sendContactFormEmail(env, payload) {
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
    html
  });
}
__name(sendContactFormEmail, "sendContactFormEmail");
async function isRateLimited(kv, key, limit = 5, windowSec = 3600) {
  if (!kv) return false;
  const now = Math.floor(Date.now() / 1e3);
  const windowKey = `rl:${key}:${Math.floor(now / windowSec)}`;
  const current = parseInt(await kv.get(windowKey) || "0", 10);
  if (current >= limit) {
    return true;
  }
  await kv.put(windowKey, String(current + 1), { expirationTtl: windowSec });
  return false;
}
__name(isRateLimited, "isRateLimited");
function getClientIp(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
}
__name(getClientIp, "getClientIp");
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (pathname === "/" || pathname === "/health") {
      return Response.json({
        ok: true,
        service: "vnrscans-worker",
        version: "1.0.0",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if ((pathname === "/email/new-user" || pathname === "/webhook/new-user") && request.method === "POST") {
      try {
        const body = await request.json();
        let payload;
        if (body.record?.email) {
          payload = {
            email: body.record.email,
            userId: body.record.id,
            username: body.record.raw_user_meta_data?.username,
            created_at: body.record.created_at
          };
        } else {
          payload = {
            email: body.email,
            userId: body.userId || body.user_id,
            username: body.username,
            created_at: body.created_at
          };
        }
        if (!payload.email) {
          return Response.json({ error: "Missing email" }, { status: 400 });
        }
        const rateKey = `newuser:${payload.email}`;
        if (env.RATE_LIMIT && await isRateLimited(env.RATE_LIMIT, rateKey, 3, 3600)) {
          console.log("[worker] Rate limited new-user for", payload.email);
          return Response.json({ success: true, rate_limited: true });
        }
        const result = await sendNewUserNotification(env, payload);
        return Response.json(result);
      } catch (err) {
        console.error("[worker] new-user error:", err);
        return Response.json({ error: "Bad request" }, { status: 400 });
      }
    }
    if (pathname === "/email/contact" && request.method === "POST") {
      try {
        const payload = await request.json();
        if (!payload.name || !payload.email || !payload.message) {
          return Response.json({ error: "Missing required fields" }, { status: 400 });
        }
        const ip = getClientIp(request);
        const rateKey = `contact:${ip}:${payload.email}`;
        if (env.RATE_LIMIT && await isRateLimited(env.RATE_LIMIT, rateKey, 4, 3600)) {
          return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
        }
        const result = await sendContactFormEmail(env, payload);
        return Response.json(result);
      } catch (err) {
        console.error("[worker] contact error:", err);
        return Response.json({ error: "Invalid request" }, { status: 400 });
      }
    }
    if (pathname.startsWith("/assets/") && env.MEDIA) {
      return Response.json({ message: "R2 binding available. Implement asset routes here." });
    }
    return new Response("Not Found", { status: 404 });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
