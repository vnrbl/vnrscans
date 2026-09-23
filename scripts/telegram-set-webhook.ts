import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;
const workerUrl = process.env.WORKER_URL || process.env.CLOUDFLARE_WORKER_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !workerUrl || !secret) {
  console.error("Set TELEGRAM_BOT_TOKEN, WORKER_URL, and TELEGRAM_WEBHOOK_SECRET before registering the webhook.");
  process.exit(1);
}

if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  console.error("TELEGRAM_WEBHOOK_SECRET must use only letters, numbers, underscores, and hyphens (1–256 characters).");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `${workerUrl.replace(/\/$/, "")}/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message"],
  }),
});

const result = await response.json() as { ok?: boolean; description?: string };
if (!response.ok || !result.ok) {
  console.error("Telegram could not register the webhook:", result.description || `HTTP ${response.status}`);
  process.exit(1);
}

console.log("Telegram webhook registered. Send /start to your bot to begin chatting.");
