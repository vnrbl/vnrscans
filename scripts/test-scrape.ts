import { extractImagesFromChapterUrl } from '../src/lib/chapter-scraper';
import { config } from 'dotenv';

config();

async function main() {
  const url = 'https://asurascans.com/comics/crimson-reset-fc4c7eba/chapter/49';
  console.log(`Scraping URL: ${url}`);
  try {
    const images = await extractImagesFromChapterUrl(url);
    console.log(`SUCCESS! Scraped ${images.length} images:`);
    images.forEach((img, idx) => console.log(`  ${idx + 1}: ${img}`));
  } catch (err) {
    console.error('ERROR:', err);
  }
}

main();
