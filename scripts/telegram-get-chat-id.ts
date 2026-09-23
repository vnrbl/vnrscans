import { config } from 'dotenv';

config();

const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

if (!botToken) {
  throw new Error('Set TELEGRAM_BOT_TOKEN in .env first.');
}

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat?: { id?: number | string; type?: string };
    text?: string;
  };
};

let offset = 0;
console.log('Waiting for /start. Keep this command running, then open your bot in Telegram and send /start.');

while (true) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/getUpdates?timeout=25&offset=${offset}&allowed_updates=%5B%22message%22%5D`,
    { signal: AbortSignal.timeout(35_000) },
  );

  const result = (await response.json()) as {
    ok?: boolean;
    description?: string;
    result?: TelegramUpdate[];
  };

  if (!response.ok || !result.ok) {
    throw new Error(result.description || `Telegram API request failed (${response.status}).`);
  }

  for (const update of result.result || []) {
    offset = update.update_id + 1;
    const chat = update.message?.chat;
    if (!chat?.id || chat.type !== 'private' || !/^\/start(?:\s|$)/.test(update.message?.text || '')) {
      continue;
    }

    const chatId = String(chat.id);
    const reply = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ Bot connected. Add this to your server .env as TELEGRAM_CHAT_ID=${chatId}, then start the scraper with npm run auto-import:bot.`,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!reply.ok) {
      throw new Error(`Could not send the setup reply (${reply.status}).`);
    }

    console.log(`Telegram Chat ID: ${chatId}`);
    console.log('The bot sent this chat ID to your Telegram account. Add it to .env, then run npm run auto-import:bot.');
    process.exit(0);
  }
}
