import { extractImagesFromChapterUrl } from '../src/lib/chapter-scraper';
import { config } from 'dotenv';

config();

async function testScrape(url: string) {
  console.log(`--- Testing ${url} ---`);
  try {
    const images = await extractImagesFromChapterUrl(url);
    console.log(`  Success! Extracted ${images.length} images.`);
    if (images.length > 0) {
      console.log(`  First image: ${images[0]}`);
    }
  } catch (err) {
    console.error(`  Failed:`, err);
  }
}

async function main() {
  await testScrape('https://qiscans.org/series/4190634673-eleceed/chapter-1');
  await testScrape('https://elftoon.com/i-am-the-fated-villain-chapter-243/');
}

main();
