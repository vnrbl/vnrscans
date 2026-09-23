# Always-on chapter scraper bot

The bot polls enabled entries in `series_import_sources`, imports newly found chapters through the existing scraper, and sends Telegram alerts when chapters are imported or a scan fails. It runs as a separate Node.js process because the scraper uses Puppeteer; the web app's serverless requests are not a persistent worker.

## Connect Telegram

1. In Telegram, message [@BotFather](https://t.me/BotFather), run `/newbot`, and copy the bot token.
2. Add `TELEGRAM_BOT_TOKEN` to the repo's `.env` file. If you shared the original token in chat, revoke it with BotFather and put the replacement token in `.env` first.
3. In a repo terminal, run this and leave it waiting:

   ```powershell
   npm run telegram:get-chat-id
   ```

4. Open your bot in Telegram, send `/start`, and it will reply with your private chat ID. Copy that value into the server's `.env` as `TELEGRAM_CHAT_ID`.
5. Add the remaining values to the server's `.env`. Keep the bot token and Supabase service key private.

   ```dotenv
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-server-only-key
   TELEGRAM_BOT_TOKEN=your-bot-token
   TELEGRAM_CHAT_ID=your-chat-id
   AUTO_IMPORT_INTERVAL_MINUTES=10
   ```

   Use the service role/secret key only on the server. The default interval is 30 minutes; source rows are checked when due based on their release estimate and configured interval.
6. Start it once in the repo to verify the Telegram `🤖 ... is online` message arrives:

   ```powershell
   npm run auto-import:bot
   ```

   Stop the foreground run with `Ctrl+C` after that check.

## Keep it running on a Linux host

Run the worker on an always-on Linux VPS or server with Node.js and Chrome dependencies available. Keep `.env` on that host and install project dependencies there. Create `/etc/systemd/system/vnrscans-auto-scraper.service`, replacing the working directory with the checkout path:

```ini
[Unit]
Description=VNR Scans automatic chapter scraper
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/path/to/vnrscans-main
EnvironmentFile=/path/to/vnrscans-main/.env
ExecStart=/usr/bin/npm run auto-import:bot
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
```

Enable it and inspect logs:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now vnrscans-auto-scraper
sudo systemctl status vnrscans-auto-scraper
sudo journalctl -u vnrscans-auto-scraper -f
```

The bot sends an online message at process startup, success alerts after new chapters are imported, and failure alerts when a source scan or scan cycle errors. No success alert is sent when a scan finds no new chapters.
