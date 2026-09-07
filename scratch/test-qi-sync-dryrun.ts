import { $syncImportSource } from '../src/lib/api/scraper.actions.ts';
import dotenv from 'dotenv';
dotenv.config();

async function testSync() {
  const result = await $syncImportSource({
    data: {
      sourceId: '04272528-f9a9-427d-8751-5e4fb8d31e0b',
      accessToken: 'cron-internal',
      mode: 'latest',
      maxChapters: 10,
    },
  });

  console.log('Sync result:', JSON.stringify(result, null, 2));
}

testSync();
