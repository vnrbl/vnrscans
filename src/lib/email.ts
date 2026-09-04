import { Resend } from "resend";
import { formatAppDate } from "./date";

/**
 * Direct Resend client (used by Next.js API routes as fallback).
 *
 * When WORKER_URL is set, the API routes forward to the Cloudflare Worker instead.
 * See CLOUDFLARE.md and src/workers/index.ts for the preferred email implementation.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const OWNER_EMAIL = process.env.OWNER_EMAIL || process.env.CONTACT_EMAIL || "creator@vnrscans.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "VNR Scans <onboarding@resend.dev>";

let resend: Resend | null = null;

function getResend() {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not set. Emails will not be sent.");
    return null;
  }
  if (!resend) {
    resend = new Resend(RESEND_API_KEY);
  }
  return resend;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, text, from }: SendEmailOptions) {
  const client = getResend();
  if (!client) {
    console.log("[email] (dry-run) Would send:", { to, subject });
    return { success: false, error: "Email service not configured (RESEND_API_KEY missing)" };
  }

  try {
    const result = await client.emails.send({
      from: from || FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || stripHtml(html),
    });

    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { success: false, error: result.error.message || "Failed to send email" };
    }

    return { success: true, id: result.data?.id };
  } catch (err: any) {
    console.error("[email] Unexpected send error:", err);
    return { success: false, error: err?.message || "Unexpected email error" };
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
}

// --- Specific email helpers ---

export async function sendNewUserNotification(params: {
  email: string;
  username?: string | null;
  userId: string;
  createdAt?: string;
}) {
  const { email, username, userId, createdAt } = params;

  const subject = `New user registered: ${username || email}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin:0 0 16px;">🎉 New User Registration</h2>
      <table style="width:100%; border-collapse: collapse; font-size:14px;">
        <tr>
          <td style="padding:8px 0; font-weight:600; width:120px;">Username</td>
          <td style="padding:8px 0;">${escapeHtml(username || "(none provided)")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-weight:600;">Email</td>
          <td style="padding:8px 0;"><a href="mailto:${email}">${escapeHtml(email)}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-weight:600;">User ID</td>
          <td style="padding:8px 0; font-family:monospace; font-size:12px;">${userId}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-weight:600;">Registered</td>
          <td style="padding:8px 0;">${createdAt ? formatAppDate(createdAt) : "just now"}</td>
        </tr>
      </table>

      <p style="margin-top:24px; font-size:13px; color:#555;">
        View in <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://vnrscans.com"}/admin/users">Admin Users</a> (if you are logged in as admin).
      </p>
    </div>
  `;

  return sendEmail({
    to: OWNER_EMAIL,
    subject,
    html,
  });
}

export async function sendContactFormEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiryType?: string;
}) {
  const { name, email, subject: inquirySubject, message, inquiryType } = params;

  // Use inquiryType (e.g. "Support") as primary, fall back to subject
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

  return sendEmail({
    to: OWNER_EMAIL,
    subject: fullSubject,
    html,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
